"""A narrow trusted-caller file executor, NOT a sandbox or identity provider.

Only the actor's proposed operation/path/content enter execute(). The trusted
operator supplies the context callback, root, audit sink and approval key.
An attacker able to mutate these objects/process/filesystem bypasses this demo;
real deployments must protect the control plane at a separate host boundary.
"""
from __future__ import annotations
import datetime as dt
import hashlib
import hmac
import os
import secrets
import tempfile
import threading
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Callable, Any
from runtime.common import GovernanceError, canonical, digest, instant, safe_path, sha, now

@dataclass(frozen=True)
class Context:
    actor: str
    task: str
    environment: str
    policy_version: str
    candidate_sha256: str
    revoked: bool = False
    cancelled: bool = False

class FileExecutor:
    """Mediates read/create/replace in one private workspace, one process.

    In-memory nonces/revisions do not provide distributed replay protection.
    No shell, network, delete, deployment or arbitrary code operation exists.
    """
    def __init__(self, root: Path, context: Callable[[], Context], *,
                 read_prefixes: tuple[str,...] = ("work/", "input/"),
                 write_prefixes: tuple[str,...] = ("work/",),
                 audit: Callable[[dict], None] | None = None,
                 max_steps: int = 50, max_seconds: float = 600,
                 max_bytes: int = 16384,
                 clock: Callable[[], dt.datetime] | None = None,
                 monotonic: Callable[[], float] = time.monotonic):
        if not root.is_dir() or root.is_symlink():raise GovernanceError("Existing private regular workspace required")
        if type(max_steps) is not int or max_steps<1 or max_seconds<=0 or type(max_bytes) is not int or max_bytes<1:raise GovernanceError("Invalid executor budgets")
        self.root=root.resolve(); self.context=context
        for prefix in (*read_prefixes,*write_prefixes):
            if not prefix.endswith("/"):raise GovernanceError("Explicit directory prefixes must end with slash")
            safe_path(self.root,prefix.rstrip("/"))
            if any(b.startswith(".") for b in prefix.split("/") if b):raise GovernanceError("Protected/hidden prefixes cannot be granted")
        self.read_prefixes=read_prefixes;self.write_prefixes=write_prefixes
        self._audit=audit if audit is not None else self._record_event
        self.events: list[dict]=[];self._key=secrets.token_bytes(32);self._used:set[str]=set()
        self._lock=threading.RLock();self.steps=0;self.max_steps=max_steps;self.max_seconds=max_seconds;self.max_bytes=max_bytes
        self._clock=clock or (lambda:dt.datetime.now(dt.timezone.utc));self._monotonic=monotonic;self._start=monotonic()

    def _record_event(self, row: dict) -> None:
        self.events.append(row)

    def _valid_context(self) -> Context:
        ctx=self.context()
        if not isinstance(ctx,Context):raise GovernanceError("Trusted context unavailable")
        if any(not isinstance(x,str) or not x for x in (ctx.actor,ctx.task,ctx.environment,ctx.policy_version)):raise GovernanceError("Incomplete trusted context")
        if len(ctx.candidate_sha256)!=64 or any(c not in "0123456789abcdef" for c in ctx.candidate_sha256):raise GovernanceError("Invalid trusted candidate identity")
        if ctx.revoked or ctx.cancelled:raise GovernanceError("Grant revoked or run cancelled")
        return ctx

    def _action(self, action: dict) -> tuple[Path,str]:
        if not isinstance(action,dict):raise GovernanceError("Action must be an object")
        op=action.get("operation")
        fields={"read_file":{"operation","path"},"create_file":{"operation","path","content"},"replace_file":{"operation","path","content","expected_sha256"}}
        if op not in fields:raise GovernanceError("Unknown operation denied")
        if set(action)!=fields[op]:raise GovernanceError("Missing or untrusted extra action field")
        path=safe_path(self.root,action["path"])
        if any(p.startswith(".") for p in action["path"].split("/")):raise GovernanceError("Hidden/control-plane paths denied")
        prefixes=self.read_prefixes if op=="read_file" else self.write_prefixes
        if not any(action["path"].startswith(p) for p in prefixes):raise GovernanceError("Resource outside granted prefixes")
        if not path.parent.is_dir():raise GovernanceError("Parent directory must already exist")
        if path.exists() and not path.is_file():raise GovernanceError("Target must be regular file")
        if op=="create_file" and path.exists():raise GovernanceError("Create refuses to overwrite")
        if op!="create_file" and not path.is_file():raise GovernanceError("Target file missing")
        if "content" in action:
            if not isinstance(action["content"],str):raise GovernanceError("Content must be text")
            if len(action["content"].encode())>self.max_bytes:raise GovernanceError("Payload budget exceeded")
        if op=="replace_file":
            if not isinstance(action["expected_sha256"],str) or sha(path)!=action["expected_sha256"]:raise GovernanceError("Target changed or expected digest invalid")
        return path,op

    def _binding(self, action: dict, ctx: Context) -> dict:
        return {"action_sha256":digest(action),"root":str(self.root),"context":asdict(ctx)}

    def issue_approval(self, action: dict, *, ttl_seconds: int=60) -> dict:
        """Trusted operator-only helper. NEVER expose this method as a model tool."""
        with self._lock:
            if type(ttl_seconds) is not int or not 1<=ttl_seconds<=300:raise GovernanceError("Approval TTL outside local reference bounds")
            _,op=self._action(action);ctx=self._valid_context()
            if op!="replace_file":raise GovernanceError("Only replacement uses scoped approval in this reference")
            clock=self._clock()
            if clock.tzinfo is None:raise GovernanceError("Trusted clock must be timezone-aware")
            body={"binding":self._binding(action,ctx),"nonce":secrets.token_hex(16),"issued_at":clock.isoformat(),"expires_at":(clock+dt.timedelta(seconds=ttl_seconds)).isoformat()}
            return {"body":body,"signature":hmac.new(self._key,canonical(body),hashlib.sha256).hexdigest()}

    def _approval(self, token: dict|None, action: dict, ctx: Context) -> str:
        if not isinstance(token,dict) or set(token)!={"body","signature"}:raise GovernanceError("Authenticated scoped approval required")
        body=token["body"]
        if not isinstance(body,dict) or set(body)!={"binding","nonce","issued_at","expires_at"}:raise GovernanceError("Invalid approval body")
        expected=hmac.new(self._key,canonical(body),hashlib.sha256).hexdigest()
        if not isinstance(token["signature"],str) or not hmac.compare_digest(expected,token["signature"]):raise GovernanceError("Invalid approval signature")
        if body["binding"]!=self._binding(action,ctx):raise GovernanceError("Approval binding mismatch")
        nonce=body["nonce"]
        if not isinstance(nonce,str) or nonce in self._used:raise GovernanceError("Approval already consumed or malformed")
        clock=self._clock();start,end=instant(body["issued_at"]),instant(body["expires_at"])
        if clock.tzinfo is None or not start<=clock<end or (end-start).total_seconds()>300:raise GovernanceError("Approval expired or clock invalid")
        return nonce

    def _emit(self, status: str, op_id: str, ctx: Context, action: dict, **extra: Any) -> None:
        # Never log payload, approval material, credentials or hidden reasoning.
        self._audit({"operation_id":op_id,"timestamp":now(),"status":status,"actor":ctx.actor,"task":ctx.task,"environment":ctx.environment,"policy_version":ctx.policy_version,"candidate_sha256":ctx.candidate_sha256,"operation":action["operation"],"path":action["path"],"action_sha256":digest(action),**extra})

    def execute(self, action: dict, approval: dict|None=None) -> dict:
        with self._lock:
            op_id=secrets.token_hex(12)
            try:
                self.steps+=1
                if self.steps>self.max_steps or self._monotonic()-self._start>=self.max_seconds:raise GovernanceError("Execution budget exhausted")
                ctx=self._valid_context();path,op=self._action(action)
                nonce=None
                if op=="replace_file":
                    if approval is None:return {"decision":"REVIEW","result":"NOT_EXECUTED","operation_id":op_id,"reason":"Replacement requires bound operator approval"}
                    nonce=self._approval(approval,action,ctx)
                if self._valid_context()!=ctx:raise GovernanceError("Trusted context changed before effect")
                # Re-resolve after authorization. Host races still require OS protection.
                path,_=self._action(action)
                if nonce:self._used.add(nonce)
                self._emit("INTENT",op_id,ctx,action)
            except (GovernanceError,OSError,TypeError,ValueError) as exc:
                return {"decision":"DENY","result":"NOT_EXECUTED","operation_id":op_id,"reason":str(exc)}
            except Exception:
                return {"decision":"DENY","result":"NOT_EXECUTED","operation_id":op_id,"reason":"Intent audit or trusted context unavailable"}
            mutated=False;started=False;tmp=None
            try:
                # Final action-time check after audit/wait boundary.
                if self._valid_context()!=ctx:raise GovernanceError("Context changed after intent audit")
                if approval is not None and op=="replace_file" and self._clock()>=instant(approval["body"]["expires_at"]):raise GovernanceError("Approval expired during audit/wait")
                path,_=self._action(action)
                if op=="read_file":
                    if path.stat().st_size>self.max_bytes:raise GovernanceError("Read output budget exceeded")
                    with path.open("rb") as stream:raw=stream.read(self.max_bytes+1)
                    if len(raw)>self.max_bytes:raise GovernanceError("Read output budget exceeded")
                    content=raw.decode("utf-8")
                elif op=="create_file":
                    raw=action["content"].encode(); flags=os.O_WRONLY|os.O_CREAT|os.O_EXCL|getattr(os,"O_NOFOLLOW",0)
                    fd=os.open(path,flags,0o600);started=True
                    with os.fdopen(fd,"wb") as stream:stream.write(raw);stream.flush();os.fsync(stream.fileno())
                    mutated=True;content=None
                else:
                    raw=action["content"].encode()
                    fd,tmp=tempfile.mkstemp(prefix=".aghr-write-",dir=path.parent)
                    with os.fdopen(fd,"wb") as stream:stream.write(raw);stream.flush();os.fsync(stream.fileno())
                    # Preserve mode of the explicitly approved target.
                    os.chmod(tmp,path.stat().st_mode & 0o777)
                    if self._valid_context()!=ctx or sha(path)!=action["expected_sha256"]:raise GovernanceError("State changed before atomic replace")
                    started=True;os.replace(tmp,path);tmp=None;mutated=True;content=None
                result={"decision":"ALLOW","result":"EXECUTED","operation_id":op_id,"sha256":hashlib.sha256(raw).hexdigest(),"bytes":len(raw)}
                if content is not None:result["content"]=content
                try:self._emit("RESULT",op_id,ctx,action,result="EXECUTED",bytes=len(raw),artifact_sha256=result["sha256"])
                except Exception:
                    return {"decision":"ALLOW","result":"INDETERMINATE","operation_id":op_id,"effect_completed":True,"reason":"Result audit failed; reconcile actual effect before retry"}
                return result
            except Exception as exc:
                outcome="INDETERMINATE" if started or mutated else "NOT_EXECUTED"
                try:self._emit("ERROR",op_id,ctx,action,result=outcome,error_type=type(exc).__name__)
                except Exception:pass
                return {"decision":"DENY" if outcome=="NOT_EXECUTED" else "ALLOW","result":outcome,"operation_id":op_id,"reason":str(exc)}
            finally:
                if tmp is not None and os.path.exists(tmp):os.unlink(tmp)
