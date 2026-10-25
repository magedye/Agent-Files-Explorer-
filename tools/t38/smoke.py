"""Fresh pipx installation, genuine packaged startup, HTTP/auth and token rotation.

Only generated Draft state is writable. Secrets are kept in process memory;
server stdout containing a token is never copied into evidence.
"""
import hashlib
import json
import os
from pathlib import Path
import queue
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs/evidence/studio-t38-2026-10-25"
HOME = ROOT / "temp/t38-pipx-smoke-v5"
ENV = {k: v for k, v in os.environ.items() if k.upper() in {"SYSTEMROOT", "WINDIR", "SYSTEMDRIVE", "PATH", "USERPROFILE", "TEMP", "TMP", "COMSPEC", "LOCALAPPDATA", "APPDATA"}}
ENV.update(PIPX_HOME=str(HOME), PIPX_BIN_DIR=str(HOME / "bin"), PIPX_MAN_DIR=str(HOME / "man"), PIPX_SHARED_LIBS=str(HOME / "shared"), PIP_CACHE_DIR=str(ROOT / "temp/t38-pip-cache"), PIPX_DEFAULT_PYTHON=str(ROOT / "temp/aghr-e1a-20261022-01/venv/Scripts/python.exe"), PIPX_DEFAULT_BACKEND="pip", PIP_CONFIG_FILE=os.devnull, PIP_INDEX_URL="https://pypi.org/simple")
ENV["PIPX_DISABLE_SHARED_LIBS_AUTO_UPGRADE"] = "1"
# Standard pipx shares its installer across otherwise fresh application venvs.
# Reuse only the cache created by this test, never the owner's global pipx.
ENV["PIPX_SHARED_LIBS"] = str(ROOT / "temp/t38-pipx-smoke-v2/shared")
PYTHON = ROOT / "temp/t38-build-tool/Scripts/python.exe"
RECEIPT = {"profile": "FRESH_WINDOWS_PIPX_ENVIRONMENT_NOT_A_CLEAN_OS_VM", "status": "IN_PROGRESS", "steps": [], "credentials": "NEVER_PERSISTED", "linux": "OUT_OF_SCOPE_BY_OWNER", "macos": "OUT_OF_SCOPE_BY_OWNER", "public_release": "NOT_AUTHORIZED", "offline_bootstrap": "Supported pipx PIPX_DISABLE_SHARED_LIBS_AUTO_UPGRADE=1; use CPython bundled pip. No application safety gate disabled."}
RECEIPT["installer_cache"] = "Tool-owned pip25.0.1 initialized in attempt2; fresh application venv, no owner-global pipx use"
RECEIPT["installer_timeout_seconds"] = 600


def save():
    (OUT / "SMOKE.json").write_text(json.dumps(RECEIPT, indent=2) + "\n", encoding="utf-8")


def command(name, args, timeout=180):
    child = subprocess.Popen(args, cwd=ROOT, env=ENV, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="replace", creationflags=subprocess.CREATE_NEW_PROCESS_GROUP)
    try:
        stdout, stderr = child.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        subprocess.run(["taskkill", "/PID", str(child.pid), "/T", "/F"], capture_output=True, timeout=15)
        stdout, stderr = child.communicate(timeout=15)
        (OUT / (name + ".stdout.txt")).write_text(stdout, encoding="utf-8")
        (OUT / (name + ".stderr.txt")).write_text(stderr, encoding="utf-8")
        raise RuntimeError(name + "_TIMEOUT_TREE_TERMINATED")
    (OUT / (name + ".stdout.txt")).write_text(stdout, encoding="utf-8")
    (OUT / (name + ".stderr.txt")).write_text(stderr, encoding="utf-8")
    RECEIPT["steps"].append({"operation": name, "exit_code": child.returncode})
    save()
    if child.returncode:
        raise RuntimeError(name + "_FAILED")
    return stdout


def request(origin, path, token=None, method="GET", body=None):
    headers = {"X-Studio-Token": token} if token else {}
    raw = json.dumps(body).encode() if body is not None else None
    if raw:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(origin + path, data=raw, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as response:
        return response.code, response.read()


def start(executable, storage):
    child = subprocess.Popen([str(executable), "--port=0", "--storage-root=" + str(storage)], cwd=ROOT / "temp", env=ENV, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="replace", creationflags=subprocess.CREATE_NEW_PROCESS_GROUP)
    lines = queue.Queue()
    threading.Thread(target=lambda: [lines.put(line) for line in child.stdout], daemon=True).start()
    diagnostics = []
    def drain_errors():
        for line in child.stderr:
            if sum(map(len, diagnostics)) < 65536:
                # The server prints credentials only to stdout. Still exclude
                # any token-labelled diagnostic instead of assuming that forever.
                diagnostics.append("[REDACTED TOKEN LINE]\n" if "token" in line.lower() else line)
    threading.Thread(target=drain_errors, daemon=True).start()
    origin = token = None
    try:
        deadline = time.monotonic() + 120
        while time.monotonic() < deadline and (not origin or not token):
            if child.poll() is not None:
                raise RuntimeError("PACKAGED_STARTUP_EXIT_" + str(child.returncode))
            try:
                line = lines.get(timeout=0.25).strip()
            except queue.Empty:
                continue
            if line.startswith("AGHR Governance Studio: "):
                origin = line.split(": ", 1)[1]
            if line.startswith("X-Studio-Token (ephemeral; do not save): "):
                token = line.split(": ", 1)[1]
        if not origin or not token:
            raise RuntimeError("PACKAGED_STARTUP_TIMEOUT")
        return child, origin, token
    except Exception:
        stop(child)
        (OUT / ("STARTUP-" + str(child.pid) + ".stderr.txt")).write_text("".join(diagnostics), encoding="utf-8")
        raise


def stop(child):
    if child.poll() is not None:
        return
    try:
        child.stdin.write("quit\n")
        child.stdin.flush()
        child.wait(timeout=30)
    except (OSError, subprocess.TimeoutExpired):
        # Exact helper PID allocated above, never an owner's process/group.
        subprocess.run(["taskkill", "/PID", str(child.pid), "/T", "/F"], capture_output=True, timeout=15)
        child.wait(timeout=15)


def main():
    save()
    if HOME.exists():
        raise RuntimeError("PIPX_HOME_EXISTS_USE_NEW_VERSION_NO_OVERWRITE")
    wheel = OUT / "wheels/aghr_studio-0.1.0.dev20261025+win.3-py3-none-any.whl"
    RECEIPT["wheel_sha256"] = hashlib.sha256(wheel.read_bytes()).hexdigest()
    command("PIPX_INSTALL", [str(PYTHON), "-I", "-m", "pipx", "install", "--python=" + ENV["PIPX_DEFAULT_PYTHON"], "--pip-args=--no-index --find-links=" + str(ROOT / "temp/t38-wheelhouse") + " --only-binary=:all:", str(wheel)], timeout=600)
    executable = HOME / "bin/aghr-studio.exe"
    command("VERSION", [str(executable), "--version"])
    command("DOCTOR", [str(executable), "--doctor"])
    payload = HOME / "venvs/aghr-studio/Lib/site-packages/aghr_studio/payload"
    manifest = json.loads((payload / "DISTRIBUTION.lock.json").read_text(encoding="utf-8"))
    snapshot = lambda: {p: hashlib.sha256((payload / p).read_bytes()).hexdigest() for p in [*manifest["files"], "DISTRIBUTION.lock.json"]}
    before = snapshot()
    storage = HOME / "isolated-drafts"
    child, origin, token = start(executable, storage)
    try:
        assert origin.startswith("http://127.0.0.1:")
        assert request(origin, "/api/v1/workspaces")[0] == 403
        status, raw = request(origin, "/api/v1/workspaces", token)
        assert status == 200 and {v["id"] for v in json.loads(raw)["data"]} == {"rc3-local", "pilot-app-l2", "pilot-app-l3"}
        assert request(origin, "/api/v1/workspaces/rc3-local/cps", token, "POST", {})[0] == 403
        assert request(origin, "/")[0] == 200
        RECEIPT["steps"].append({"operation": "PACKAGED_HTTP_AUTH", "status": "PASS", "workspaces": 3, "read_status": 200, "unauthenticated_status": 403, "ungranted_write_status": 403, "localhost_only": True})
    finally:
        stop(child)
    second, origin, next_token = start(executable, storage)
    try:
        assert token != next_token
        assert request(origin, "/api/v1/workspaces", token)[0] == 403
        assert request(origin, "/api/v1/workspaces", next_token)[0] == 200
        RECEIPT["steps"].append({"operation": "SESSION_ROTATION", "status": "PASS", "old_token_status": 403})
    finally:
        stop(second)
    after = snapshot()
    assert before == after
    RECEIPT["payload_sentinel"] = {"files": len(before), "differences": [], "before": before, "after": after}
    RECEIPT["status"] = "PASS_FOR_FRESH_WINDOWS_PIPX_PROFILE_ONLY"
    save()
    print(json.dumps({"status": RECEIPT["status"], "files": len(before)}))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        RECEIPT["status"] = "FAIL"
        RECEIPT["error"] = str(error)
        save()
        print(str(error), file=sys.stderr)
        sys.exit(1)
