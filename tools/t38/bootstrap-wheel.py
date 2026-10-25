"""Capture pipx's offline installer dependency from its official PyPI digest."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import urllib.request

root = Path(__file__).resolve().parents[2]
with urllib.request.urlopen("https://pypi.org/pypi/pip/json", timeout=30) as response:
    meta = json.load(response)
version = meta["info"]["version"]
wheel = next(u for u in meta["urls"] if u["filename"] == "pip-" + version + "-py3-none-any.whl")
if not wheel["url"].startswith("https://files.pythonhosted.org/"):
    raise RuntimeError("UNTRUSTED_BOOTSTRAP_SOURCE")
record = {"role": "PIPX_INSTALLER_BOOTSTRAP_ONLY_NOT_ENGINE_DEPENDENCY", "version": version, "url": wheel["url"], "sha256": wheel["digests"]["sha256"]}
(root / "docs/evidence/studio-t38-2026-10-25/BOOTSTRAP_EXPECTED.json").write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
# The host's pip mirror may be required for binary transport. Publisher bytes
# are still authenticated against the digest obtained from official PyPI.
# Never print mirror configuration, credentials or raw installer diagnostics.
result = subprocess.run([sys.executable, "-I", "-m", "pip", "download", "--disable-pip-version-check", "--no-deps", "--only-binary=:all:", "--timeout=15", "--retries=0", "--dest=" + str(root / "temp/t38-wheelhouse"), "pip==" + version], capture_output=True, timeout=90)
if result.returncode:
    raise RuntimeError("PIP_BOOTSTRAP_TRANSPORT_FAILED_EXIT_" + str(result.returncode))
data = (root / "temp/t38-wheelhouse" / wheel["filename"]).read_bytes()
actual = hashlib.sha256(data).hexdigest()
if len(data) > 8 * 1024 * 1024 or actual != wheel["digests"]["sha256"]:
    raise RuntimeError("BOOTSTRAP_DIGEST_MISMATCH")
(root / "temp/t38-wheelhouse" / wheel["filename"]).write_bytes(data)
record.update(bytes=len(data), transport="configured pip mirror; official PyPI digest verified")
(root / "docs/evidence/studio-t38-2026-10-25/BOOTSTRAP_WHEEL.lock.json").write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
print(json.dumps(record))
