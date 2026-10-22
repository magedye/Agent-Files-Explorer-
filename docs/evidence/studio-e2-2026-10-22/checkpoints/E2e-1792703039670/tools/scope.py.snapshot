"""Portable, bounded scope matching. Language is rendering metadata only."""

from dataclasses import dataclass
from datetime import date, datetime, timezone
from fnmatch import fnmatchcase
from functools import lru_cache
import re


@dataclass(frozen=True)
class ScopeContext:
    path: str | None = None
    agent: str | None = None
    host_version: str | None = None
    environment: str | None = None
    stage: str | None = None
    task_type: str | None = None
    skill_id: str | None = None
    language: str = "en"
    as_of: str | None = None

    def __post_init__(self):
        if self.path is not None:
            path_parts(self.path)
        if self.language not in ("ar", "en"):
            raise ValueError("Unsupported rendering language.")
        if self.as_of is not None:
            if not isinstance(self.as_of, str) or not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", self.as_of):
                raise ValueError("Context date requires YYYY-MM-DD.")
            date.fromisoformat(self.as_of)
        for value in (self.agent, self.host_version, self.environment, self.stage, self.task_type, self.skill_id):
            if value is not None and (not isinstance(value, str) or not value.strip() or len(value) > 256):
                raise ValueError("Invalid bounded context value.")

    @property
    def day(self):
        return date.fromisoformat(self.as_of) if self.as_of else datetime.now(timezone.utc).date()

    @property
    def targeted(self):
        return any(v is not None for v in (self.path, self.agent, self.environment, self.stage, self.task_type, self.skill_id))


def path_parts(value, *, pattern=False):
    if not isinstance(value, str) or not value or len(value) > (512 if pattern else 4096):
        raise ValueError("Invalid path length.")
    parts = value.split("/")
    if len(parts) > 64 or any(part in ("", ".", "..") or part.rstrip(" .") != part for part in parts):
        raise ValueError("Only normalized root-relative POSIX paths are supported.")
    if any(c in value for c in ("\\", ":", "\x00", "\r", "\n")):
        raise ValueError("Absolute or ambiguous paths are forbidden.")
    if pattern:
        if any("**" in part and part != "**" for part in parts):
            raise ValueError("Recursive ** must occupy a complete segment.")
        if any(part.count("[") != part.count("]") for part in parts):
            raise ValueError("Unbalanced glob character class.")
    elif any(c in value for c in "*?[]"):
        raise ValueError("A selected path must be literal.")
    return tuple(parts)


def matches(pattern, path):
    """** spans zero or more segments; * ? [classes] stay in one segment.

    Pure lexical matching; root/link/nested-package access remains in loader.py.
    """
    glob, target = path_parts(pattern, pattern=True), path_parts(path)
    @lru_cache(maxsize=None)
    def visit(i, j):
        if i == len(glob):
            return j == len(target)
        if glob[i] == "**":
            return visit(i + 1, j) or (j < len(target) and visit(i, j + 1))
        return j < len(target) and fnmatchcase(target[j], glob[i]) and visit(i + 1, j + 1)
    return visit(0, 0)


def applies(value, context):
    scope = value["scope"]
    missing = []
    paths = scope.get("paths", [])
    exclusions = scope.get("exclude", [])
    for pattern in (*paths, *exclusions):
        path_parts(pattern, pattern=True)
    if context.path is not None:
        if any(matches(p, context.path) for p in exclusions):
            return {"status": "DOES_NOT_APPLY", "reason": "EXCLUDED_PATH"}
        if paths and not any(matches(p, context.path) for p in paths):
            return {"status": "DOES_NOT_APPLY", "reason": "PATH_MISMATCH"}
    elif paths or exclusions:
        missing.append("path")
    for field, selected in (("appliesToAgents", context.agent), ("environments", context.environment),
                            ("stages", context.stage), ("taskTypes", context.task_type), ("skillIds", context.skill_id)):
        restricted = scope.get(field, [])
        if not restricted:
            continue
        if selected is None:
            missing.append(field)
        elif selected not in restricted:
            return {"status": "UNKNOWN_ID" if field == "skillIds" and value["kind"] == "CAPABILITY" else "DOES_NOT_APPLY", "reason": field}
    return {"status": "CONTEXT_REQUIRED", "missing": missing} if missing else {"status": "APPLIES"}


def render(value, language, translations=None):
    """Translations are caller-provided presentation, never adopted instructions."""
    translated = (translations or {}).get(language)
    known_original = language in value["scope"].get("language", [])
    return {"rule": translated if translated is not None else value["rule"],
            "translation_unavailable": translated is None and not known_original,
            "requested_language": language, "original_rule": value["rule"]}


def _subset(narrow, broad):
    if narrow == broad or broad in ("**", "**/*"):
        return True
    if not any(c in narrow for c in "*?["):
        return matches(broad, narrow)
    parts = path_parts(broad, pattern=True)
    if parts[-1] == "**" and not any(c in "/".join(parts[:-1]) for c in "*?["):
        prefix = parts[:-1]
        child = path_parts(narrow, pattern=True)
        return len(child) >= len(prefix) and child[:len(prefix)] == prefix
    return None


def compare_specificity(left, right):
    """Prove subset relations; unsupported language inclusion stays incomparable.

    Never rank by string length, wildcard counts, or a guessed numeric score.
    """
    a, b = tuple(left or ("**/*",)), tuple(right or ("**/*",))
    for pattern in (*a, *b):
        path_parts(pattern, pattern=True)
    if set(a) == set(b):
        return "EQUAL"
    a_in_b = all(any(_subset(x, y) is True for y in b) for x in a)
    b_in_a = all(any(_subset(y, x) is True for x in a) for y in b)
    if a_in_b and b_in_a:
        return "EQUAL"
    if a_in_b:
        return "LEFT"
    if b_in_a:
        return "RIGHT"
    return "INCOMPARABLE"
