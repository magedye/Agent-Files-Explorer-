"""Read-only audit boundary for the pinned E2 CLI; not an eval resource adapter."""
import os
import runpy
import sys
from pathlib import Path

def audit(event, args):
    if event == "open":
        mode, flags = args[1], args[2]
        if (isinstance(mode, str) and any(c in mode for c in "wax+")) or (
            isinstance(flags, int) and flags & (os.O_WRONLY | os.O_RDWR | os.O_CREAT | os.O_TRUNC | os.O_APPEND)
        ):
            raise PermissionError("STUDIO_ZERO_WRITE: open")
    if event in {"os.remove", "os.rename", "os.mkdir", "os.rmdir", "os.link", "os.symlink", "os.chmod", "os.truncate", "os.utime", "os.system", "subprocess.Popen", "os.startfile", "os.posix_spawn"} or event.startswith("socket."):
        raise PermissionError("STUDIO_ZERO_WRITE: " + event)

sys.dont_write_bytecode = True
sys.addaudithook(audit)
# -S prevents site/.pth startup before the audit boundary. Resolve only the
# operator-selected Windows venv's dependencies after installing the hook.
site = Path(sys.executable).parent.parent / "Lib" / "site-packages"
if not site.is_dir():
    raise RuntimeError("Pinned Windows virtual environment required")
sys.path.insert(0, str(site))
entry = sys.argv.pop(1)
sys.argv[0] = entry
runpy.run_path(entry, run_name="__main__")
