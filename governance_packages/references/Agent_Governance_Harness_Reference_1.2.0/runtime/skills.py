"""Skill-Aware Execution & Reuse — Discovery, Compatibility, Progressive Loading and Verification.

Standard library only. Governed under AGHR-038 and policies/CONTEXT_AND_MODELS.md.
Skills are non-mandatory, instruction-only wrappers under project authority.
"""
from __future__ import annotations
import json
import re
from pathlib import Path
from typing import Any

from runtime.common import ROOT, GovernanceError, load, sha

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
    
    reg = registry or _load_registry(root)
    skills = reg.get("skills", [])
    
    # Gather search tokens from task
    desc = str(task.get("description", "")).lower()
    intent = task.get("intent", [])
    if isinstance(intent, str):
        intent = [intent]
    intent_tokens = [str(x).lower().strip() for x in intent if str(x).strip()]
    domain = str(task.get("domain", "")).lower()
    
    all_tokens = set(re.findall(r"[a-z0-9_\-]+", desc)) | set(intent_tokens)
    if domain:
        all_tokens.add(domain)
        
    candidates = []
    for s in skills:
        sid = s.get("id", "")
        triggers = [t.lower() for t in s.get("triggers", [])]
        
        # Calculate matching score
        score = 0
        matched_triggers = []
        for trigger in triggers:
            if trigger in all_tokens or trigger in desc:
                score += 2
                matched_triggers.append(trigger)
            else:
                # Sub-token overlap
                trigger_parts = trigger.split("_")
                overlap = sum(1 for part in trigger_parts if part in all_tokens)
                if overlap == len(trigger_parts):
                    score += 1.5
                    matched_triggers.append(trigger)
                elif overlap > 0:
                    score += 0.5
                    
        # Check ID match
        if sid.replace("-", "_") in all_tokens or sid in desc:
            score += 3
            
        if score > 0:
            candidates.append({
                "id": sid,
                "score": score,
                "path": s.get("path", ""),
                "matched_triggers": matched_triggers,
                "version": s.get("version", "1.1.0"),
                "permissions": s.get("permissions", ["READ_ONLY"]),
                "required_tools": s.get("required_tools", [])
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
    reg = registry or _load_registry(base)
    
    skill = next((s for s in reg.get("skills", []) if s.get("id") == skill_id), None)
    if not skill:
        return {
            "eligible": False,
            "status": "NOT_FOUND",
            "reasons": [f"Skill '{skill_id}' is not registered in canonical registry."]
        }
        
    # Check physical file existence and hash integrity
    skill_path = base / skill.get("path", "")
    if not skill_path.is_file():
        return {
            "eligible": False,
            "status": "FILE_MISSING",
            "reasons": [f"Skill file missing at: {skill.get('path')}"]
        }
    if sha(skill_path) != skill.get("sha256"):
        return {
            "eligible": False,
            "status": "HASH_MISMATCH",
            "reasons": [f"Skill payload digest mismatch for: {skill_id}"]
        }
        
    # 1. Dependency Check (tools available in environment)
    available_tools = set(context.get("available_tools", []))
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
    granted_perms = set(context.get("grant", {}).get("permissions", []))
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
        "reasons": []
    }


def select_minimal_effective_set(
    task: dict[str, Any],
    candidate_skill_ids: list[str],
    context: dict[str, Any] | None = None,
    registry: dict[str, Any] | None = None,
    root: Path | None = None
) -> dict[str, Any]:
    """Select the minimal effective set of skills to achieve task goals without context bloat."""
    ctx = context or {}
    reg = registry or _load_registry(root)
    skills_map = {s["id"]: s for s in reg.get("skills", [])}
    
    if not candidate_skill_ids:
        return {
            "status": "DIRECT_EXECUTION_RECOMMENDED",
            "selected_skills": [],
            "rationale": "No suitable skill discovered. Proceeding with standard direct execution."
        }
        
    # Check if task is trivial or does not add value
    if task.get("complexity") == "TRIVIAL" or task.get("force_plain_execution"):
        return {
            "status": "DIRECT_EXECUTION_RECOMMENDED",
            "selected_skills": [],
            "rationale": "Task complexity is trivial; specialized skill adds no net value."
        }
        
    # Check mutual conflicts between candidates
    for i, s1_id in enumerate(candidate_skill_ids):
        s1 = skills_map.get(s1_id, {})
        c1 = set(s1.get("conflicts_with", []))
        for s2_id in candidate_skill_ids[i+1:]:
            s2 = skills_map.get(s2_id, {})
            c2 = set(s2.get("conflicts_with", []))
            if s2_id in c1 or s1_id in c2:
                return {
                    "status": "SKILL_CONFLICT",
                    "selected_skills": [],
                    "conflict_pair": [s1_id, s2_id],
                    "rationale": f"Candidate skills '{s1_id}' and '{s2_id}' are mutually incompatible."
                }
                
    # Filter candidates by eligibility
    eligible = []
    for sid in candidate_skill_ids:
        check = check_skill_prerequisites(sid, ctx, reg, root)
        if check.get("eligible"):
            eligible.append(sid)
            
    if not eligible:
        return {
            "status": "DIRECT_EXECUTION_RECOMMENDED",
            "selected_skills": [],
            "rationale": "No candidate skill met all prerequisites and authorization checks. Graceful fallback."
        }
        
    # Minimal Effective Set: Keep at most 1 primary skill unless explicit composite workflow
    max_skills = task.get("max_skills", 1)
    selected = eligible[:max_skills]
    
    return {
        "status": "SELECTED",
        "selected_skills": selected,
        "rationale": f"Selected minimal effective skill set: {selected}"
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
    reg = registry or _load_registry(base)
    
    skill = next((s for s in reg.get("skills", []) if s.get("id") == skill_id), None)
    if not skill:
        raise GovernanceError(f"Skill '{skill_id}' not found in registry.")
        
    skill_path = base / skill.get("path", "")
    if not skill_path.is_file():
        raise GovernanceError(f"Skill file missing: {skill_path}")
        
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


def verify_skill_result(
    skill_id: str,
    execution_result: dict[str, Any],
    task_criteria: list[dict[str, Any]] | None = None,
    registry: dict[str, Any] | None = None,
    root: Path | None = None
) -> dict[str, Any]:
    """Verify that the skill outcome satisfied acceptance criteria and did not violate boundaries."""
    findings = []
    
    # 1. Check Execution Status
    status = execution_result.get("status", "UNKNOWN")
    if status in ("ERROR", "FAIL", "FAILED"):
        findings.append(f"Skill execution reported failure status: {status}")
        return {
            "verified": False,
            "verdict": "FAIL",
            "findings": findings
        }
        
    # 2. Check Expected Output Criteria
    reg = registry or _load_registry(root)
    skill = next((s for s in reg.get("skills", []) if s.get("id") == skill_id), {})
    expected_outputs = skill.get("output_criteria", [])
    
    delivered_outputs = set(execution_result.get("outputs", {}).keys())
    missing_outputs = [out for out in expected_outputs if out not in delivered_outputs]
    if missing_outputs:
        findings.append(f"Missing expected skill deliverables: {', '.join(missing_outputs)}")
        
    # 3. Check Boundary Violations
    side_effects = execution_result.get("side_effects", [])
    unauthorized_effects = [e for e in side_effects if e.get("authorized") is False]
    if unauthorized_effects:
        findings.append(f"Unauthorized side effects detected: {len(unauthorized_effects)} violations")
        
    verdict = "PASS" if not findings else "FAIL"
    return {
        "verified": len(findings) == 0,
        "verdict": verdict,
        "findings": findings
    }


def execute_skill_lifecycle(
    task: dict[str, Any],
    context: dict[str, Any],
    root: Path | None = None
) -> dict[str, Any]:
    """Execute end-to-end skill-aware lifecycle for a task."""
    base = root or ROOT
    reg = _load_registry(base)
    
    # Stage 1: Discovery
    candidates = discover_skills(task, reg, base)
    candidate_ids = [c["id"] for c in candidates]
    
    # Stage 2 & 3: Minimal Effective Set Selection & Prerequisite Verification
    selection = select_minimal_effective_set(task, candidate_ids, context, reg, base)
    
    if selection["status"] != "SELECTED":
        return {
            "lifecycle_status": selection["status"],
            "selected_skills": [],
            "instruction_slices": [],
            "rationale": selection["rationale"],
            "verified": True
        }
        
    # Stage 4: Progressive On-Demand Loading
    slices = []
    for sid in selection["selected_skills"]:
        slices.append(load_skill_details(sid, base, reg))
        
    return {
        "lifecycle_status": "SKILL_ACTIVATED",
        "selected_skills": selection["selected_skills"],
        "instruction_slices": slices,
        "rationale": selection["rationale"],
        "token_cost_est": sum(s["token_est"] for s in slices),
        "verified": True
    }
