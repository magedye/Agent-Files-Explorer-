#!/usr/bin/env python3
"""Query the bundled Quranic Arabic Corpus morphology 0.4 resource.

The tool returns structural candidates only. It does not infer Quranic meaning.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path
import argparse
import hashlib
import json
import sys
from typing import Iterator

EXPECTED_SHA256 = "a1d12923815341face765083805d2148ed2d9f5cc3f7d6665219d887675d8c46"
DEFAULT_DATA = Path(__file__).resolve().parents[1] / "assets/quran/qac/quranic-corpus-morphology-0.4.txt"


@dataclass(frozen=True)
class Record:
    location: str
    surah: int
    ayah: int
    word: int
    segment: int
    form: str
    tag: str
    features_raw: str
    root: str | None
    lemma: str | None
    features: tuple[str, ...]


def file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def parse_location(value: str) -> tuple[int, int, int, int]:
    raw = value.strip().strip("()")
    parts = raw.split(":")
    if len(parts) != 4:
        raise ValueError(f"invalid QAC location: {value!r}")
    return tuple(int(part) for part in parts)  # type: ignore[return-value]


def parse_record(line: str) -> Record:
    location, form, tag, features_raw = line.rstrip("\r\n").split("\t")
    surah, ayah, word, segment = parse_location(location)
    features = tuple(features_raw.split("|"))
    root = next((item[5:] for item in features if item.startswith("ROOT:")), None)
    lemma = next((item[4:] for item in features if item.startswith("LEM:")), None)
    return Record(location, surah, ayah, word, segment, form, tag, features_raw, root, lemma, features)


def iter_records(path: Path) -> Iterator[Record]:
    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        for raw in stream:
            if not raw.strip() or raw.startswith("#") or raw.startswith("LOCATION\t"):
                continue
            yield parse_record(raw)


def location_matches(record: Record, query: str | None) -> bool:
    if not query:
        return True
    parts = tuple(int(part) for part in query.strip().strip("()").split(":"))
    actual = (record.surah, record.ayah, record.word, record.segment)
    return actual[: len(parts)] == parts


def select(records: Iterator[Record], args: argparse.Namespace) -> list[Record]:
    result: list[Record] = []
    for record in records:
        if args.root and record.root != args.root:
            continue
        if args.lemma and record.lemma != args.lemma:
            continue
        if args.tag and record.tag != args.tag:
            continue
        if not location_matches(record, args.location):
            continue
        result.append(record)
        if args.limit and len(result) >= args.limit:
            break
    return result


def as_json(record: Record) -> dict[str, object]:
    data = asdict(record)
    data["features"] = list(record.features)
    data["source"] = {
        "resource_id": "quranic-arabic-corpus-morphology",
        "version": "0.4",
        "content_sha256": EXPECTED_SHA256,
        "authority": "structural-candidate-only",
    }
    return data


def verify(path: Path) -> dict[str, object]:
    digest = file_sha256(path)
    count = 0
    roots: set[str] = set()
    lemmas: set[str] = set()
    for record in iter_records(path):
        count += 1
        if record.root:
            roots.add(record.root)
        if record.lemma:
            lemmas.add(record.lemma)
    return {
        "path": str(path),
        "sha256": digest,
        "expected_sha256": EXPECTED_SHA256,
        "hash_valid": digest == EXPECTED_SHA256,
        "records": count,
        "distinct_roots": len(roots),
        "distinct_lemmas": len(lemmas),
        "role": "prelock-structural-candidate-only",
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--verify", action="store_true")
    parser.add_argument("--root")
    parser.add_argument("--lemma")
    parser.add_argument("--tag")
    parser.add_argument("--location", help="prefix: surah[:ayah[:word[:segment]]]")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--format", choices=("jsonl", "tsv"), default="jsonl")
    parser.add_argument("--summary", action="store_true")
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    if not args.data.is_file():
        parser.error(f"data file not found: {args.data}")
    if args.limit < 0:
        parser.error("--limit must be non-negative")

    if args.verify:
        result = verify(args.data)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if result["hash_valid"] else 2

    if not any((args.root, args.lemma, args.tag, args.location)):
        parser.error("provide --verify or at least one query filter")

    matches = select(iter_records(args.data), args)
    if args.summary:
        words = {(r.surah, r.ayah, r.word) for r in matches}
        print(json.dumps({
            "records": len(matches),
            "canonical_word_addresses": len(words),
            "roots": sorted({r.root for r in matches if r.root}),
            "lemmas": sorted({r.lemma for r in matches if r.lemma}),
            "source_sha256": EXPECTED_SHA256,
            "authority": "structural-candidate-only",
        }, ensure_ascii=False, indent=2))
        return 0

    if args.format == "jsonl":
        for record in matches:
            print(json.dumps(as_json(record), ensure_ascii=False))
    else:
        print("LOCATION\tFORM\tTAG\tROOT\tLEMMA\tFEATURES")
        for r in matches:
            print("\t".join((r.location, r.form, r.tag, r.root or "", r.lemma or "", r.features_raw)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
