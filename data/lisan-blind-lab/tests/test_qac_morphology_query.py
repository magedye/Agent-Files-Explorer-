from __future__ import annotations

from pathlib import Path
import importlib.util
import sys

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/qac_morphology_query.py"
DATA = ROOT / "assets/quran/qac/quranic-corpus-morphology-0.4.txt"

spec = importlib.util.spec_from_file_location("qac_query", SCRIPT)
assert spec and spec.loader
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)


def test_resource_identity_and_counts() -> None:
    result = module.verify(DATA)
    assert result["hash_valid"] is True
    assert result["records"] == 128219
    assert result["distinct_roots"] == 1642
    assert result["distinct_lemmas"] == 4832


def test_ktb_is_structural_candidate_set() -> None:
    class Args:
        root = "ktb"
        lemma = None
        tag = None
        location = None
        limit = 0

    matches = module.select(module.iter_records(DATA), Args())
    assert len(matches) == 319
    assert all(record.root == "ktb" for record in matches)
    assert matches[0].location == "(2:2:2:2)"


def test_location_prefix() -> None:
    records = [record for record in module.iter_records(DATA) if module.location_matches(record, "1:1")]
    assert records
    assert {(r.surah, r.ayah) for r in records} == {(1, 1)}
