#!/usr/bin/env python3
"""Check the portable Agent Skill package structure (not model effectiveness)."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LINK = re.compile(r"\]\(([^)]+)\)")
NAME = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def basic_frontmatter(raw: str) -> tuple[dict, str]:
    if not raw.startswith("---\n"):
        raise ValueError("SKILL.md must start with YAML frontmatter")
    pieces = raw.split("\n---\n", 1)
    if len(pieces) != 2:
        raise ValueError("SKILL.md has no closing frontmatter separator")
    head, body = pieces
    try:
        import yaml
        data = yaml.safe_load(head[4:])
    except ImportError:
        # Standard-library fallback for required scalars; full YAML checks need PyYAML.
        data = dict(re.findall(r"(?m)^(name|description):\s*(.+)$", head))
    if not isinstance(data, dict):
        raise ValueError("YAML frontmatter must be a mapping")
    return data, body


def validate(root: Path = ROOT) -> list[str]:
    errors = []
    path = root / "SKILL.md"
    try:
        raw = path.read_text(encoding="utf-8")
        meta, body = basic_frontmatter(raw)
        skill_name = meta.get("name")
        desc = meta.get("description")
        if not isinstance(skill_name, str) or not NAME.fullmatch(skill_name):
            errors.append("invalid skill name")
        elif root.name != skill_name:
            errors.append(f"folder {root.name!r} must match frontmatter name {skill_name!r}")
        if not isinstance(desc, str) or not 1 <= len(desc) <= 1024:
            errors.append("description must be 1-1024 characters")
        if len(body.strip()) < 400:
            errors.append("SKILL.md body appears incomplete")
        if len(body.splitlines()) > 500:
            errors.append("SKILL.md exceeds recommended 500 lines")
        for dest in LINK.findall(body):
            if dest.startswith(("https://", "http://", "mailto:", "#")):
                continue
            rel = dest.split("#", 1)[0].split("?", 1)[0]
            if not rel:
                continue
            target = (root / rel).resolve()
            if root.resolve() not in target.parents and target != root.resolve():
                errors.append(f"unsafe relative link: {dest}")
            elif not target.exists():
                errors.append(f"broken relative link: {dest}")
    except (OSError, UnicodeError, ValueError) as exc:
        errors.append(f"SKILL.md error: {exc}")

    for needed in ("README_AR.md", "agents/openai.yaml", "assets/full-rule.yaml", "scripts/lint_rule.py"):
        if not (root / needed).is_file():
            errors.append(f"missing expected file: {needed}")
    for p in root.rglob("*"):
        if p.is_symlink():
            errors.append(f"symbolic link not allowed in this portable package: {p.relative_to(root)}")
        if p.is_file() and p.suffix.lower() in {".md", ".yaml", ".csv", ".py"}:
            try:
                p.read_text(encoding="utf-8")
            except UnicodeError:
                errors.append(f"not UTF-8: {p.relative_to(root)}")
    try:
        import yaml
        config = yaml.safe_load((root / "agents/openai.yaml").read_text(encoding="utf-8"))
        if not isinstance(config, dict) or "interface" not in config:
            errors.append("agents/openai.yaml needs interface mapping")
        template = yaml.safe_load((root / "assets/full-rule.yaml").read_text(encoding="utf-8"))
        if not isinstance(template, dict) or template.get("lifecycle_status") != "DRAFT":
            errors.append("full rule template must be a DRAFT mapping")
        approval = template.get("approval", {})
        if not isinstance(approval, dict) or any(value is not False for key, value in approval.items() if key in {"specification_approved", "independently_verified", "authorized_for_activation", "active"}):
            errors.append("template must not claim prior approval/verification/activation")
    except ImportError:
        pass  # Main frontmatter/links still checked without extra packages.
    except (OSError, UnicodeError, ValueError) as exc:
        errors.append(f"optional YAML validation: {exc}")
    return errors


def main() -> int:
    errors = validate()
    if errors:
        print("INVALID SKILL PACKAGE")
        for err in errors:
            print(" -", err)
        return 1
    print("PACKAGE STRUCTURE PASS (does NOT certify semantic or runtime compliance)")
    print("Skill:", ROOT.name)
    print("Files:", len([p for p in ROOT.rglob('*') if p.is_file()]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
