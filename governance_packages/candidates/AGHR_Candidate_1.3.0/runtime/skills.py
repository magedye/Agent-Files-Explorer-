"""Skill-Aware Execution & Reuse — Discovery, Compatibility, Progressive Loading and Verification.

Standard library only. Governed under AGHR-038 and policies/CONTEXT_AND_MODELS.md.
Skills are non-mandatory, instruction-only wrappers under project authority.
"""
from __future__ import annotations
from pathlib import Path
from typing import Any

from runtime.common import ROOT, GovernanceError, load, safe_path, sha
from runtime.skill_evidence import verify_skill_result
from runtime.skill_catalog import build_catalog, normalized, selection_profile, string_list

SKILLS_REGISTER_REL = "optional_skills/REGISTER.json"
MAX_SKILL_INSTRUCTION_BYTES = 50_000


def _load_registry(root: Path | None = None) -> dict[str, Any]:
    base = root or ROOT
    reg_path = base / SKILLS_REGISTER_REL
    if not reg_path.is_file():
        raise GovernanceError(f"Skills registry not found: {reg_path}")
    return load(reg_path)


def discover_skills(
    task: dict[str, Any],
    registry: dict[str, Any] | None = None,
    root: Path | None = None
) -> list[dict[str, Any]]:
    """Discover candidate skills appropriate for the given task.
    
    Returns a list of matching skill descriptors sorted by relevance.
    If task indicates plain execution or no skill matches, returns empty list.
    """
    if task.get("force_plain_execution", False):
        return []
    
    reg = registry if registry is not None else _load_registry(root)
    skills = reg.get("skills", [])
    
    # Gather search tokens from task
    desc = str(task.get("description", ""))
    intent = task.get("intent", [])
    if isinstance(intent, str):
        intent = [intent]
    string_list(intent, "task.intent")
    text = " " + normalized(" ".join([desc, *intent, str(task.get("domain", ""))])) + " "
    needs = set(string_list(task.get("required_capabilities", []), "required_capabilities"))
    phase = task.get("phase")
        
    candidates = []
    for s in skills:
        sid = s.get("id", "")
        if phase and s.get("phases") and phase not in s["phases"]:
            continue
        triggers = s.get("triggers", [])
        
        # Calculate matching score
        score = 0
        matched_triggers = []
        for trigger in triggers:
            trigger_text = normalized(trigger)
            if trigger_text and f" {trigger_text} " in text:
                score += 2
                matched_triggers.append(trigger)
                    
        # Check ID match
        if f" {normalized(sid)} " in text:
            score += 3
        score += 3 * len(needs & set(s.get("capabilities", [sid])))
            
        if score > 0:
            candidates.append({
                "id": sid,
                "score": score,
                "path": s.get("path", ""),
                "matched_triggers": matched_triggers,
                "version": s.get("version", "1.1.0"),
                "permissions": s.get("permissions", ["READ_ONLY"]),
                "required_tools": s.get("required_tools", []),
                "capabilities": s.get("capabilities", [sid]),
                "source_kind": s.get("source_kind", "PACKAGE"),
                "loader": s.get("loader", "PACKAGE"),
                "host_qualification": s.get("host_qualification", "NOT_RUN")
            })
            
    # Sort descending by score
    candidates.sort(key=lambda x: x["score"], reverse=True)
    return candidates


def check_skill_prerequisites(
    skill_id: str,
    context: dict[str, Any],
    registry: dict[str, Any] | None = None,
    root: Path | None = None
) -> dict[str, Any]:
    """Check compatibility, dependencies, conflicts and permissions for a candidate skill."""
    base = root or ROOT
    reg = registry if registry is not None else _load_registry(base)
    
    skill = next((s for s in reg.get("skills", []) if s.get("id") == skill_id), None)
    if not skill:
        return {
            "eligible": False,
            "status": "NOT_FOUND",
            "reasons": [f"Skill '{skill_id}' is not registered in canonical registry."]
        }
        
    profile = selection_profile(context)
    reason = None
    if skill_id in profile.get("excluded_skills", []) or ("allowed_skills" in profile and skill_id not in profile["allowed_skills"]):
        reason = "PROJECT_SELECTION_EXCLUDED"
    elif skill.get("loader") == "HOST" and (skill.get("presence") != "PRESENT" or skill.get("session_availability") != "AVAILABLE"):
        reason = "NOT_AVAILABLE_IN_SESSION"
    elif profile.get("require_qualified_skills") and skill.get("host_qualification") != "TESTED":
        reason = "HOST_QUALIFICATION_REQUIRED"
    if reason:
        return {"eligible": False, "status": reason, "reasons": [reason]}
    if skill.get("loader", "PACKAGE") == "PACKAGE":
        try:
            skill_path = safe_path(base, skill.get("path", ""), must_exist=True)
            if not skill_path.is_file():
                raise GovernanceError("Skill file is not a regular file")
            if sha(skill_path) != skill.get("sha256"):
                return {"eligible": False, "status": "HASH_MISMATCH", "reasons": [f"Skill payload digest mismatch for: {skill_id}"]}
        except (GovernanceError, OSError) as exc:
            return {"eligible": False, "status": "FILE_MISSING_OR_UNSAFE", "reasons": [str(exc)]}
        
    # 1. Dependency Check (tools available in environment)
    available_tools = set(string_list(context.get("available_tools", []), "available_tools"))
    required_tools = set(skill.get("required_tools", []))
    missing_tools = sorted(required_tools - available_tools)
    if missing_tools:
        return {
            "eligible": False,
            "status": "MISSING_DEPENDENCIES",
            "missing_dependencies": missing_tools,
            "reasons": [f"Missing required host tools: {', '.join(missing_tools)}"]
        }
        
    # 2. Authorization Ceiling Check (permissions cannot exceed task grant)
    grant = context.get("grant", {})
    if not isinstance(grant, dict):
        raise GovernanceError("grant must be an object; records do not authenticate it")
    granted_perms = set(string_list(grant.get("permissions", []), "grant.permissions"))
    # If no explicit grant permissions provided, assume empty/strict
    required_perms = set(skill.get("permissions", ["READ_ONLY"]))
    
    # Hierarchy: READ_ONLY is subset of all, WORKSPACE_WRITE requires write grant, EXECUTE_TEST requires test grant
    escalated = []
    for req in required_perms:
        if req != "READ_ONLY" and req not in granted_perms:
            escalated.append(req)
            
    if escalated:
        return {
            "eligible": False,
            "status": "AUTHORIZATION_CEILING_EXCEEDED",
            "escalated_permissions": escalated,
            "reasons": [f"Skill requires permissions exceeding active task grant: {', '.join(escalated)}"]
        }
        
    # 3. Conflict Check (incompatibilities with active or co-selected skills)
    active_skills = set(context.get("active_skills", []))
    conflicts_with = set(skill.get("conflicts_with", []))
    conflicts_with.update(s["id"] for s in reg.get("skills", []) if skill_id in s.get("conflicts_with", []))
    conflicting = sorted(conflicts_with & active_skills)
    if conflicting:
        return {
            "eligible": False,
            "status": "SKILL_CONFLICT",
            "conflicting_skills": conflicting,
            "reasons": [f"Skill conflicts with active skills: {', '.join(conflicting)}"]
        }
        
    return {
        "eligible": True,
        "status": "ELIGIBLE",
        "reasons": [],
        "eligibility_scope": "INSTRUCTION_PREPARATION_ONLY",
        "host_qualification": skill.get("host_qualification", "NOT_RUN")
    }


def select_minimal_effective_set(
    task: dict[str, Any],
    candidate_skill_ids: list[str],
    context: dict[str, Any] | None = None,
    registry: dict[str, Any] | None = None,
    root: Path | None = None
) -> dict[str, Any]:
    """Choose a sufficient set for this phase, preserving exclusions and blocks.

    Greedy coverage is bounded task routing, not a globally optimal planner.
    Alternatives that add no required capability are not loaded together.
    """
    ctx = context or {}
    reg = registry if registry is not None else _load_registry(root)
    skills_map = {s["id"]: s for s in reg.get("skills", [])}
    profile = selection_profile(ctx)
    required_ids = string_list(task.get("required_skills", []), "required_skills")
    needs = set(string_list(task.get("required_capabilities", []), "required_capabilities"))
    if (task.get("complexity") == "TRIVIAL" or task.get("force_plain_execution")) and not required_ids and not needs:
        return {
            "status": "NO_SKILL_NEEDED",
            "selected_skills": [],
            "rationale": "No specialized workflow requested for this phase. Direct work still requires its own authorization."
        }
    ids = list(dict.fromkeys([*required_ids, *candidate_skill_ids]))
    if not ids:
        if needs:
            return {"status": "BLOCKED", "selected_skills": [], "unmet_capabilities": sorted(needs),
                    "rationale": "Required capabilities have no discovered skill. No execution grant is inferred."}
        return {
            "status": "NO_MATCHING_SKILLS",
            "selected_skills": [],
            "rationale": "No matching skill was discovered. This is not execution authorization."
        }
    eligible = []
    blocked = {}
    for sid in ids:
        phases = skills_map.get(sid, {}).get("phases", [])
        if phases and task.get("phase") and task["phase"] not in phases:
            blocked[sid] = {"eligible": False, "status": "PHASE_MISMATCH", "reasons": ["Skill does not apply to this phase"]}
            continue
        check = check_skill_prerequisites(sid, ctx, reg, root)
        if check.get("eligible"):
            eligible.append(sid)
        else:
            blocked[sid] = check
    def refusal(reason, **details):
        return {
            "status": "BLOCKED",
            "selected_skills": [],
            "blocked_skills": blocked,
            "rationale": reason,
            **details,
        }
    if not eligible or any(sid in blocked for sid in required_ids):
        return refusal("Candidate skills failed prerequisites; no direct-execution grant is inferred.")
    preferred = profile.get("preferred_by_phase", {}).get(task.get("phase", "execution"), [])
    eligible.sort(key=lambda sid: preferred.index(sid) if sid in preferred else len(preferred))
    selected = []
    remaining = set(needs)
    for sid in [*required_ids, *[s for s in eligible if s not in required_ids]]:
        capabilities = set(skills_map[sid].get("capabilities", [sid]))
        if sid not in required_ids and selected and (not needs or not (remaining & capabilities)):
            continue
        if sid not in required_ids and needs and not (remaining & capabilities):
            continue
        conflicts = [other for other in selected if other in skills_map[sid].get("conflicts_with", [])
                     or sid in skills_map[other].get("conflicts_with", [])]
        if conflicts:
            blocked[sid] = {"eligible": False, "status": "SKILL_CONFLICT", "conflicting_skills": conflicts}
            if sid in required_ids:
                return refusal("Required skills are mutually incompatible.", conflict_pair=[sid, conflicts[0]])
            continue
        selected.append(sid)
        remaining -= capabilities
    if remaining:
        return refusal("No eligible compatible set covers all capabilities for this phase.", unmet_capabilities=sorted(remaining))
    # Remove a now-redundant earlier choice when a later skill covers its needs.
    if needs:
        for sid in list(selected):
            if sid in required_ids:
                continue
            others = [other for other in selected if other != sid]
            coverage = set().union(*(set(skills_map[other].get("capabilities", [other])) for other in others))
            if needs.issubset(coverage):
                selected.remove(sid)
    limit = task.get("max_skills")
    if limit is not None:
        if type(limit) is not int or limit < 1:
            raise GovernanceError("max_skills must be a positive integer when explicitly supplied")
        if len(selected) > limit:
            return refusal("Explicit phase limit cannot cover the required capabilities.")
    if not selected:
        return refusal("No skill provides the required capabilities for this phase.")
    return {
        "status": "SELECTED",
        "selected_skills": selected,
        "blocked_skills": blocked,
        "phase": task.get("phase", "execution"),
        "rationale": f"Selected sufficient, nonredundant skill set for this phase: {selected}"
    }


def load_skill_details(
    skill_id: str,
    root: Path | None = None,
    registry: dict[str, Any] | None = None
) -> dict[str, Any]:
    """Progressive on-demand loader for a single selected skill.
    
    Loads SKILL.md ONLY when invoked, parsing frontmatter and sections.
    Enforces maximum token/byte budget to prevent context exhaustion.
    """
    base = root or ROOT
    reg = registry if registry is not None else _load_registry(base)
    
    skill = next((s for s in reg.get("skills", []) if s.get("id") == skill_id), None)
    if not skill:
        raise GovernanceError(f"Skill '{skill_id}' not found in registry.")
    if skill.get("loader") == "HOST":
        return {"id": skill_id, "status": "HOST_LOAD_REQUIRED", "loaded_on_demand": False,
                "locator": skill.get("path", skill.get("locator", "UNKNOWN")),
                "host_qualification": skill.get("host_qualification", "UNKNOWN"),
                "authority": "Host must load through its own supported mechanism; metadata is not activation."}
        
    skill_path = safe_path(base, skill.get("path", ""), must_exist=True)
    if not skill_path.is_file():
        raise GovernanceError(f"Skill file missing: {skill_path}")
    if sha(skill_path) != skill.get("sha256"):
        raise GovernanceError(f"Skill payload digest mismatch: {skill_id}")
        
    raw = skill_path.read_text(encoding="utf-8")
    if len(raw.encode("utf-8")) > MAX_SKILL_INSTRUCTION_BYTES:
        raise GovernanceError(f"Skill content exceeds safe byte limit: {len(raw)} bytes")
        
    # Parse frontmatter
    fm = {}
    content = raw
    if raw.startswith("---"):
        parts = raw.split("---", 2)
        if len(parts) >= 3:
            fm_text = parts[1]
            content = parts[2].strip()
            for line in fm_text.splitlines():
                if ":" in line:
                    k, v = line.split(":", 1)
                    fm[k.strip()] = v.strip().strip('"').strip("'")
                    
    # Parse section headings
    sections = {}
    curr_heading = "INTRO"
    curr_lines = []
    for line in content.splitlines():
        if line.startswith("#"):
            if curr_lines:
                sections[curr_heading] = "\n".join(curr_lines).strip()
                curr_lines = []
            curr_heading = line.lstrip("#").strip()
        else:
            curr_lines.append(line)
    if curr_lines:
        sections[curr_heading] = "\n".join(curr_lines).strip()
        
    return {
        "id": skill_id,
        "frontmatter": fm,
        "sections": sections,
        "token_est": len(raw) // 4,
        "byte_count": len(raw.encode("utf-8")),
        "loaded_on_demand": True,
        "authority": reg.get("authority", "Canonical rules wrapper; no autonomous permission.")
    }


def execute_skill_lifecycle(
    task: dict[str, Any],
    context: dict[str, Any],
    root: Path | None = None
) -> dict[str, Any]:
    """Prepare selected instruction data. This function never executes a skill."""
    base = root or ROOT
    reg = build_catalog(_load_registry(base), context.get("host_inventory"))
    
    # Stage 1: Discovery
    candidates = discover_skills(task, reg, base)
    candidate_ids = [c["id"] for c in candidates]
    
    # Stage 2 & 3: Minimal Effective Set Selection & Prerequisite Verification
    selection = select_minimal_effective_set(task, candidate_ids, context, reg, base)
    
    if selection["status"] != "SELECTED":
        return {
            **selection,
            "lifecycle_status": selection["status"],
            "selected_skills": [],
            "instruction_slices": [],
            "rationale": selection["rationale"],
            "blocked_skills": selection.get("blocked_skills", {}),
            "execution_state": "NOT_RUN",
            "verification_state": "NOT_RUN",
            "host_activation": "NOT_OBSERVABLE",
            "verified": False
        }
        
    # Package instruction preparation; native host loading stays with the host.
    slices = []
    handoffs = []
    for sid in selection["selected_skills"]:
        try:
            details = load_skill_details(sid, base, reg)
        except (GovernanceError, OSError) as exc:
            return {"lifecycle_status": "BLOCKED", "selected_skills": selection["selected_skills"],
                    "instruction_slices": [], "rationale": str(exc), "verified": False,
                    "execution_state": "NOT_RUN", "verification_state": "NOT_RUN", "host_activation": "NOT_OBSERVABLE"}
        if details.get("status") == "HOST_LOAD_REQUIRED":
            handoffs.append(details)
        else:
            slices.append(details)
    token_est = sum(s["token_est"] for s in slices)
    budget = selection_profile(context).get("instruction_budget_tokens")
    if budget is not None and token_est > budget:
        return {"lifecycle_status": "BLOCKED", "selected_skills": selection["selected_skills"],
                "instruction_slices": [], "rationale": "CONTEXT_BUDGET_EXCEEDED (character-count estimate)",
                "verified": False, "execution_state": "NOT_RUN", "verification_state": "NOT_RUN",
                "host_activation": "NOT_OBSERVABLE"}
        
    return {
        "lifecycle_status": "HOST_HANDOFF" if handoffs and not slices else ("PREPARED" if handoffs else "LOADED"),
        "selected_skills": selection["selected_skills"],
        "instruction_slices": slices,
        "host_handoffs": handoffs,
        "inventory_scope": reg["inventory_scope"],
        "phase": task.get("phase", "execution"),
        "rationale": selection["rationale"],
        "token_cost_est": token_est,
        "execution_state": "NOT_RUN",
        "verification_state": "NOT_RUN",
        "host_activation": "NOT_OBSERVABLE",
        "verified": False
    }
