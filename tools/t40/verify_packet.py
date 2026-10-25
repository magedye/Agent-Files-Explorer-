"""Verify every T40 packet member without extraction. Integrity is not identity."""
import hashlib
import json
import sys
import zipfile
from pathlib import PurePosixPath

with zipfile.ZipFile(sys.argv[1]) as packet:
    names = packet.namelist()
    if len(set(names)) != len(names) or packet.testzip() is not None:
        raise SystemExit('FAIL: duplicate member or CRC mismatch')
    for name in names:
        path = PurePosixPath(name)
        if path.is_absolute() or '..' in path.parts or '\\' in name or ':' in name:
            raise SystemExit('FAIL: unsafe archive member')
    manifest = json.loads(packet.read('MANIFEST.sha256.json'))
    if set(names) != set(manifest) | {'MANIFEST.sha256.json', 'SHA256SUMS.txt'}:
        raise SystemExit('FAIL: member set differs from manifest')
    for name, expected in manifest.items():
        raw = packet.read(name)
        if {'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw)} != expected:
            raise SystemExit('FAIL: content mismatch: ' + name)
    sums = ''.join(f"{v['sha256']}  {n}\n" for n, v in manifest.items()).encode('utf-8')
    if packet.read('SHA256SUMS.txt') != sums:
        raise SystemExit('FAIL: SHA256SUMS differs from manifest')
    print(f'PASS: {len(names)} members; exact bytes, lengths, paths and checksums. Publisher signature NOT_VERIFIED.')
