"""Local candidate launcher. No publisher, grant issuer or reference updater."""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import sys

sys.dont_write_bytecode = True
VERSION = "0.1.0.dev20261025+win.3"


def verify_payload(root):
    manifest = json.loads((root / "DISTRIBUTION.lock.json").read_text(encoding="utf-8"))
    for name, record in manifest["files"].items():
        parts = PurePosixPath(name).parts
        if not parts or PurePosixPath(name).is_absolute() or any(p in ("..", ".") or "\\" in p or ":" in p for p in parts):
            raise RuntimeError("DISTRIBUTION_PATH_INVALID")
        current = root
        for part in parts:
            current = current / part
            if current.is_symlink() or current.is_junction():
                raise RuntimeError("DISTRIBUTION_REPARSE_POINT")
        if current.stat().st_size != record["bytes"] or hashlib.sha256(current.read_bytes()).hexdigest() != record["sha256"]:
            raise RuntimeError("DISTRIBUTION_SOURCE_DRIFT: " + name)
    return manifest


def main():
    parser = argparse.ArgumentParser(description="AGHR Studio internal Draft candidate (localhost; Windows profile only)", allow_abbrev=False)
    parser.add_argument("--version", action="version", version=VERSION)
    parser.add_argument("--doctor", action="store_true", help="Verify bundled bytes and frozen engines without starting or writing Draft state")
    parser.add_argument("--node", help="Absolute path to Node.js >=24.11,<25 (or resolve node from PATH)")
    parser.add_argument("--port", type=int, default=5183)
    parser.add_argument("--storage-root", type=Path, help="Fresh or existing operator-owned Draft storage outside installed payload")
    args = parser.parse_args()
    try:
        if sys.platform != "win32":
            raise RuntimeError("RESOURCE_ADAPTER_UNAVAILABLE: frozen T15/read launcher currently support Windows only; Linux/macOS NOT_RUN")
        if sys.version_info[:2] != (3, 12):
            raise RuntimeError("PYTHON_PROFILE_UNSUPPORTED: require CPython3.12")
        if not 0 <= args.port <= 65535:
            raise RuntimeError("INVALID_PORT")
        root = Path(__file__).resolve().parent / "payload"
        verify_payload(root)
        node = args.node or shutil.which("node")
        if not node or not Path(node).is_absolute():
            raise RuntimeError("NODE_REQUIRED: install Node.js24.11+; no automatic download")
        version = subprocess.run([node, "--version"], check=True, capture_output=True, text=True, timeout=10).stdout.strip()
        parts = tuple(int(v) for v in version.lstrip("v").split("."))
        if not ((24, 11, 0) <= parts < (25, 0, 0)):
            raise RuntimeError("NODE_PROFILE_UNSUPPORTED: require >=24.11,<25")
        if args.doctor:
            return subprocess.call([node, str(root / "tools/t38/installed-doctor.mjs")], cwd=root)
        base = Path(os.environ.get("LOCALAPPDATA", str(Path.home() / "AppData/Local"))) / "AGHRStudio" / "Drafts"
        storage = (args.storage_root or base).absolute()
        # Verify every existing path component before creating it; never permit
        # a junction/symlink to redirect writes into installation or a source.
        for current in (storage, *storage.parents):
            if current.exists() and (current.is_symlink() or current.is_junction()):
                raise RuntimeError("STORAGE_REPARSE_POINT")
        storage = storage.resolve()
        if storage == root or root in storage.parents:
            raise RuntimeError("STORAGE_INSIDE_READ_ONLY_PAYLOAD")
        storage.mkdir(parents=True, exist_ok=True)
        print("INTERNAL DRAFT CANDIDATE — GPG NOT_CONFIGURED; unsigned warning; no public/release acceptance.", file=sys.stderr)
        # The child owns short-lived sessions; restarting rotates its token.
        # Credentials are printed by the operator-facing Node CLI only.
        return subprocess.call([node, str(root / "server/studio/serve-studio.mjs"), "--python=" + sys.executable, "--port=" + str(args.port), "--storage-root=" + str(storage)], cwd=root)
    except (OSError, ValueError, RuntimeError, subprocess.SubprocessError) as error:
        print(str(error), file=sys.stderr)
        return 2


def entry():
    sys.exit(main())
