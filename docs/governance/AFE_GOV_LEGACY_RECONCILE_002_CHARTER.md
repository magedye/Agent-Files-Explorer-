# AFE-GOV-LEGACY-RECONCILE-002 — Workstream Charter & Traceable Backlog

**Workstream ID:** `AFE-GOV-LEGACY-RECONCILE-002`  
**Parent Directive:** `AFE-GOV-BASELINE-001`  
**Status:** `READY_FOR_OWNER_SCHEDULING / NOT_ACTIVE`  
**Target Baseline:** `Baseline v1` (`Agent_Governance_RCCA_Kit_EN_v1.3.0`)  
**Comparator Packages:**  
- `aghr_rc3`: Official Local Reference (`AGHR_rc3_Core_Candidate`, v1.0.0-rc.3)  
- `aghr_1_2_0`: Legacy Full Reference with Governed Learning (`Agent_Governance_Harness_Reference_1.2.0`)  
- `aghr_1_1_0`: Archived Full Reference (v1.1.0)  
- `aghr_1_0_0`: Authoritative Initial Historical Baseline (v1.0.0)  
- `aapes_v2_1`: Unpromoted Candidate Framework (12 domains, 48 requirements)  
- `governance_packages/INBOX`: Historical Arabic/English governance and skill instructions (24 items)

---

## 1. Objectives & Ground Rules

1. **Immutable Baseline:** `Agent_Governance_RCCA_Kit_EN_v1.3.0` registered in `governance_packages/references/` is strictly immutable. No legacy rule or instruction will be silently merged or patched into v1.3.0.
2. **Candidate Revision Deliverable:** Any reconciliation changes will be packaged as a discrete, traceable Candidate Revision (e.g., Change Packet or Candidate Baseline v2) with before/after cryptographic diffs.
3. **Authority vs. Impact Separation:** Project-level instructions (no matter how critical their impact or how many `MUST` labels they carry) cannot override native provider or host security boundaries (Model Spec, Antigravity CLI sandbox, Codex permissions).
4. **No Premature Activation:** External agent runtimes, real-owner credentials, or automatic rule enforcement will remain inactive until explicit, sovereign owner directive.

---

## 2. Cross-Package Comparative Mapping

| Domain / Dimension | Baseline v1 (`v1.3.0`) | AGHR rc.3 (`v1.0.0-rc.3`) | AGHR 1.2.0 | AAPES v2.1 Candidate |
|---|---|---|---|---|
| **Architecture Model** | Solo developer + 1 primary Codex agent | Pinned Core observations (closed studio release) | Multi-role simulated governance staff (developer/reviewer/owner) | 12 policy engineering domains (R0-R3) |
| **Rules Population** | 24 core rules (`GOV-001`..`GOV-024`) | 1 observation rule (`OBS-REFERENCE-STATE-001`) | 47 rules (`AGHR-001`..`AGHR-047`) | 48 requirements (ISO 29148 / BCP 14) |
| **Normative Language** | BCP 14 (RFC 2119 / RFC 8174) in English | Immutable Core observations | BCP 14 + Arabic operational guidance | BCP 14 + ISO/IEC/IEEE 29148:2018 |
| **Diagnostics & Tools** | Offline `agdl` (Python standard library, no deps) | Pinned internal Studio runtime (Port 5183) | Legacy CLI3 subprocess runner with SQLite | Evaluator API + OPA Policy Review Oracle |
| **Data Contracts** | `action`, `delegation`, `rules`, `trace` JSON schemas | Frozen JSONL serialization contracts | 12-table relational schema | 100% weighted evaluation matrix |
| **Owner Boundary** | Bounded autonomy; single owner review | Owner signoff required for reference changes | Gated review checkpoints | Oracle write authorization reference |

---

## 3. Traceable Reconciliation Backlog

### Category A: Harmonized / Unchanged Principles (Preserve as Common Invariants)
- **REC-01 (Authority Protection):** `GOV-001` / `GOV-003` harmonizes with rc.3 invariant that host role cannot be escalated by prompt headers.
- **REC-02 (Data Isolation & Injection Defense):** `GOV-002` harmonizes with existing `T02` / `AC-33` untrusted input sanitization.
- **REC-03 (Preservation & Non-Destructive Operation):** `GOV-005` / `GOV-006` matches core AGHR prime directive in `AGENTS.md`.
- **REC-04 (Evidence Honesty & Anti-Fabrication):** `GOV-007` / `GOV-008` matches AC-08, AC-10, ADV-03 (`NOT_RUN` must not be represented as verified).

### Category B: Scoped / Streamlined Adaptations (Proposed for Baseline v1 Integration)
- **REC-05 (Single Developer Profile):** v1.3.0 simplifies 1.2.0's 3-role staff simulation into a realistic solo developer + primary Codex agent workflow (`SOLO_DEVELOPER_ONE_PRIMARY_AGENT`).
- **REC-06 (Diagnostic Agility):** `agdl` provides fast, zero-dependency offline diagnostics (`doctor`, `rules-lint`, `validate`) replacing heavy subprocess execution for routine checks.
- **REC-07 (Host Adapter Modularity):** Distinct adapters for Codex, Antigravity, and OpenCode prevent vendor lock-in and clarify host-specific permission syntax.

### Category C: Superseded / Deprecated Elements (Documented as Historical)
- **REC-08 (Simulated Multi-Person Staff):** 1.2.0 simulated roles (`reviewer`, `compliance_auditor`) run by the same local agent are retired as ungrounded complexity.
- **REC-09 (Legacy CLI3 Subprocess Launcher):** Replaced by pure Node.js studio test harnesses and Python standard library `agdl`.

### Category D: Overlapping / Candidate Reconciliation (Owner Decision Required)
- **REC-10 (AAPES 48 Requirements Integration):** Evaluate whether AAPES v2.1 48 requirements should be mapped into a domain-specific extension schema under Baseline v1 or kept as an external candidate.
- **REC-11 (MARSAD Arabic Constitutional Principles):** Evaluate intake items (e.g., `MARSAD — الدستور التنفيذي المقترح`, `SQLChat`) to extract unique domain principles into localized Arabic adapter profiles.
- **REC-12 (Enterprise Rule-Engineer Skill):** Evaluate `Enterprise_Agent_Governance_Rule_Engineer_Skill_v1.0.0.zip` for alignment with Baseline v1 `agdl` rules linter.

---

## 4. Next Steps for Execution

1. **Await Separate Owner Authorization:** No work under `AFE-GOV-LEGACY-RECONCILE-002` will proceed until an explicit owner directive is issued.
2. **Non-Interference Guarantee:** Reconciliation activities will occur in an isolated branch (e.g., `feat/afe-gov-legacy-reconcile-002`) and will not perturb `Baseline v1` or `feat/aghr-qle-gov-obs-006-integrity`.
