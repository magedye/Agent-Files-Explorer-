"""Thin metadata boundary for host discovery and optional project preferences.

No filesystem crawl, installation, host configuration change or skill execution.
Imported states are observations supplied by a caller, never authenticated grants.
"""
from __future__ import annotations

import copy
import re
import unicodedata

from runtime.common import GovernanceError


def normalized(text: str) -> str:
    text = unicodedata.normalize("NFKC", text).casefold().replace("ـ", "")
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = text.translate(str.maketrans("أإآٱ", "اااا"))
    return " ".join(re.findall(r"[^\W_]+", text, re.UNICODE))


def string_list(value, field: str) -> list[str]:
    if not isinstance(value, list) or any(not isinstance(v, str) or not v.strip() for v in value):
        raise GovernanceError(f"{field} must be a list of nonempty strings")
    if len(value) != len(set(value)):
        raise GovernanceError(f"{field} contains duplicate identities")
    return value


def build_catalog(registry: dict, host_inventory: dict | None = None) -> dict:
    """Merge explicitly supplied host metadata without merging same-name skills."""
    result = copy.deepcopy(registry)
    skills = result.get("skills")
    if not isinstance(skills, list):
        raise GovernanceError("Skill registry must contain a skills list")
    seen = set()
    for skill in skills:
        if not isinstance(skill, dict) or not isinstance(skill.get("id"), str) or not skill["id"] or skill["id"] in seen:
            raise GovernanceError("Catalog skill IDs must be nonempty and unique")
        seen.add(skill["id"])
        skill.setdefault("source_kind", "PACKAGE")
        skill.setdefault("loader", "PACKAGE")
        skill.setdefault("presence", "PRESENT")
        skill.setdefault("session_availability", "NOT_OBSERVED")
    result["inventory_scope"] = "PACKAGE_ONLY"
    if host_inventory is None:
        return result
    if not isinstance(host_inventory, dict) or not isinstance(host_inventory.get("skills"), list):
        raise GovernanceError("Host inventory must contain explicit skills metadata")
    host = host_inventory.get("host", {})
    if not isinstance(host, dict) or any(not isinstance(host.get(k), str) or not host[k].strip()
                                         for k in ("id", "version", "observation_ref")):
        raise GovernanceError("Host identity, version (or UNKNOWN) and observation_ref are required")
    for supplied in host_inventory["skills"]:
        if not isinstance(supplied, dict):
            raise GovernanceError("Host skill descriptor must be an object")
        skill = copy.deepcopy(supplied)
        sid = skill.get("id")
        if not isinstance(sid, str) or ":" not in sid or sid in seen:
            raise GovernanceError("Host skill needs a unique qualified ID; duplicate names are not merged")
        if skill.get("source_kind") not in ("SYSTEM", "USER", "PROJECT", "PLUGIN", "CATALOG"):
            raise GovernanceError(f"Invalid host source_kind: {sid}")
        for key in ("name", "version"):
            if not isinstance(skill.get(key), str) or not skill[key].strip():
                raise GovernanceError(f"Explicit {key} (or UNKNOWN) required: {sid}")
        locator = skill.get("path", skill.get("locator"))
        if not isinstance(locator, str) or not locator.strip():
            raise GovernanceError(f"Explicit locator (or UNKNOWN) required: {sid}")
        for key, allowed in (("presence", {"PRESENT", "ABSENT", "UNKNOWN"}),
                             ("session_availability", {"AVAILABLE", "NOT_AVAILABLE", "UNKNOWN", "NOT_OBSERVABLE"}),
                             ("host_qualification", {"TESTED", "NOT_RUN", "NOT_OBSERVABLE", "UNKNOWN"})):
            if skill.get(key) not in allowed:
                raise GovernanceError(f"Explicit {key} observation required: {sid}")
        if skill["source_kind"] == "CATALOG" and (skill["presence"] == "PRESENT" or skill["session_availability"] == "AVAILABLE"):
            raise GovernanceError(f"External catalog availability is not installation or session discovery: {sid}")
        for key in ("triggers", "required_tools", "permissions", "output_criteria", "capabilities"):
            string_list(skill.get(key), f"{sid}.{key}")
        if not skill["permissions"] or not skill["output_criteria"]:
            raise GovernanceError(f"Permissions and expected outputs must be assessed: {sid}")
        if skill["host_qualification"] == "TESTED":
            q = skill.get("qualification", {})
            if not isinstance(q, dict) or any(not isinstance(q.get(k), str) or not q[k].strip()
                                              for k in ("host_id", "host_version", "skill_version", "scope", "evidence_ref")):
                raise GovernanceError(f"TESTED requires scoped qualification metadata: {sid}")
            if q["host_id"] != host["id"] or q["host_version"] != host["version"] or q["skill_version"] != skill.get("version"):
                raise GovernanceError(f"Qualification identity/version differs from host observation: {sid}")
        skill.update(loader="HOST", host=copy.deepcopy(host))
        skill.setdefault("conflicts_with", [])
        string_list(skill["conflicts_with"], f"{sid}.conflicts_with")
        skills.append(skill)
        seen.add(sid)
    result.update(inventory_scope="PACKAGE_AND_SUPPLIED_HOST_METADATA", host=host,
                  inventory_completeness=host_inventory.get("completeness", "UNKNOWN"))
    return result


def selection_profile(context: dict) -> dict:
    """Read a small selection section; it is not a second project constitution."""
    profile = context.get("project_selection", {})
    if not isinstance(profile, dict):
        raise GovernanceError("project_selection must be an object")
    for key in ("allowed_skills", "excluded_skills"):
        if key in profile:
            string_list(profile[key], key)
    preferred = profile.get("preferred_by_phase", {})
    if not isinstance(preferred, dict):
        raise GovernanceError("preferred_by_phase must be a phase-to-ID-list object")
    for phase, ids in preferred.items():
        if not isinstance(phase, str) or not phase:
            raise GovernanceError("Phase identity must be a nonempty string")
        string_list(ids, f"preferred_by_phase.{phase}")
    if not isinstance(profile.get("require_qualified_skills", False), bool):
        raise GovernanceError("require_qualified_skills must be boolean")
    budget = profile.get("instruction_budget_tokens")
    if budget is not None and (type(budget) is not int or budget < 1):
        raise GovernanceError("instruction_budget_tokens must be a positive integer")
    return profile
