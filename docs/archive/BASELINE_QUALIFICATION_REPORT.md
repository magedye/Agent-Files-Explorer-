# AGHR Governance Studio — Baseline Qualification Report (M0)

**Date**: 2026-10-11  
**Author**: Staff Software Engineer & Technical Lead  
**Scope**: Milestone 0 — Repository and Reference Qualification  
**Status**: QUALIFIED

---

## 1. Repository Environment & Version Control

- **Git Root**: `D:\APP\Skill-manager`
- **Current Branch**: `main`
- **Head Commit**: `57ca812` ("add")
- **Project Directory**: `D:\APP\Skill-manager\Agent-Files-Explorer`
- **Git State**: Project files reside in untracked tree under `D:\APP\Skill-manager`.
- **Operating System**: Windows 11 (`Windows-11-10.0.26200-SP0`)
- **Node.js**: `C:\Program Files\nodejs\node.exe` (v20+)
- **Python Runtime**: `C:\Users\Majed\AppData\Local\Programs\Python\Python312\python.exe` (Python 3.12.10)

---

## 2. Existing Application Inventory & Verification

- **Frontend Framework**: React 19.2.0 + Vite 7.3.6
- **Existing Dependencies**:
  - `react`, `react-dom` (19.2.0)
  - `react-markdown` (10.1.0)
  - `remark-gfm` (4.0.1)
  - `vis-network` (9.1.9)
- **Baseline Build Verification**:
  - Command: `npm run build`
  - Result: **SUCCESS** (Exit code 0, bundled 288 modules in 7.60s)
- **Existing Capabilities**:
  - `FileTree.jsx`: File system explorer with icon badges and selection.
  - `FileView.jsx`: Markdown and plain text renderer with image support.
  - `GraphView.jsx`: Interactive graph powered by `vis-network`.
  - `FlowView.jsx`: Dependency flow renderer.
  - `parse.js`: Regex-based Markdown and Python relation extractor (link, ref, import, open).

---

## 3. Authoritative Governance Package (AGHR 1.0.0) Qualification

- **Physical Path**: `D:\APP\Skill-manager\Agent-Files-Explorer\Agent_Governance_Harness_Reference_1.0.0\Agent_Governance_Harness_Reference_1.0.0`
- **Package Status**:
  - `package`: "Agent Governance and Harness Reference"
  - `version`: "1.0.0"
  - `reference_state`: "FINAL_REFERENCE"
  - `default_provider`: "OPENAI"
  - `default_profile`: "STANDARD"
- **Inventory Metrics**:
  - **Rules**: 40 authoritative rules (`AGHR-001` through `AGHR-040`) in `registry/RULES.json`
  - **Sources**: 30 verified authoritative sources in `sources/REGISTER.json`
  - **Adapters**: 12 adapters (6 providers, 6 hosts) in `adapters/REGISTER.json`
  - **Profiles**: 3 profiles (`LITE`, `STANDARD`, `CONTROLLED`)
  - **Payload Digest Verification**:
    - Evaluated 134 files against `MANIFEST.json`.
    - **134 of 134 payload digests match exactly (100% integrity)**.
- **Python Tooling & Test Execution**:
  - Discovered 127 unit tests in `tests/`.
  - Initial run: 126 PASS, 1 FAIL (`test_actual_demo_grades` due to Windows backslash path comparison in `evaluations/grade.py`).
  - Windows portability requirement identified: Path comparisons must use POSIX normalization (`as_posix()`).

---

## 4. Supplementary Architecture Source (Skill Steward SACP Spec)

- **Document**: `Skill_Steward_SACP_Executive_Implementation_Spec_v1.0_AR.md`
- **Status in Workspace**: Specification only (no existing code implementation).
- **Core Reusable Design Concepts**:
  - Atomic Sentence Decomposition for compound intake requests.
  - Two-layer classification:
    - Domain Concern (`SEM`, `EVD`, `OBJ`, `COR`, `MTH`, `OPEN`, `REQ`, `TEST`)
    - Governance Classification (`Intent`, `Concern`, `ArtifactType`, `Scope`, `Maturity`, `EnforcementLocus`)
  - ChangePacket with individually traceable ChangeItems (`ADD`, `STRENGTHEN`, `MERGE`, `REPLACE`, `LINK`, `REJECT`, `DEFER`, `REQUEST_INFORMATION`).
  - Separation of Proposal from Staging and Authorized Apply.

---

## 5. Security Vulnerability Assessment (P0)

1. **Arbitrary File Read (Path Traversal)**:
   - `vite.config.mjs` exposed `/api/tree`, `/api/file`, `/api/raw` endpoints accepting unsanitized client-supplied `dir` and `path`.
   - Uses `path.resolve(dir)` and `path.resolve(file)` with no root boundary restriction.
2. **Arbitrary Filesystem Exposure via Custom Roots**:
   - `EXTRA_ROOTS` hardcoded an external path `D:\APP\tafseer\ready-v5`.
   - UI input permitted arbitrary directory addition.
3. **Information Disclosure in Errors**:
   - Server errors returned raw system exception messages and file paths.
4. **Remediation Plan for Milestone 1**:
   - Define strict, approved root identifiers (`aghr_reference`, `data_roots`, `approved_projects`).
   - Implement canonical path verification and containment checks preventing symlink escape and traversal.
   - Block protected files (`.git`, `.env`, credentials, private keys, system files).
   - Enforce request budgets and content size limits.
   - Isolate backend logic into a dedicated, testable module.

---

## 6. Capability Classification Matrix

| Component | Status | Disposition | Action |
|---|---|---|---|
| Explorer UI (Tree/View/Graph/Flow) | Implemented | REUSE & EXTEND | Preserve UI, add Governance badges and relation types |
| Vite Backend Middleware | Vulnerable | REFACTOR & SECURE | Replace with secure bounded local API service (M1) |
| AGHR Reference Explorer | Missing | IMPLEMENT | Version-aware rule/source/contract browser (M2) |
| Intake & Change Management | Missing | IMPLEMENT | Capture, decompose, classify, ChangePacket generation (M3) |
| Project Adoption Manager | Missing | IMPLEMENT | Project discovery, reconciliation, adoption generation (M4) |
| Compliance & Evaluation Center | Missing | IMPLEMENT | Test runner, evidence viewer, audit records (M5) |
| Governed Staging & Apply | Missing | IMPLEMENT | Isolated staging, diff, precondition check, authorized apply (M6) |
| Integration & Hardening | Missing | IMPLEMENT | Regression tests, Windows compatibility, packaging checks (M7) |

---

## 7. Acceptance Criteria for Phase 0

- [x] Actual Git root, branch, commit, and file tree documented.
- [x] Existing dependencies and baseline build verified.
- [x] AGHR reference package inspected and 134 payload digests verified.
- [x] Skill Steward specification reviewed and scoped.
- [x] Security vulnerabilities analyzed and mapped.
- [x] Capability classification completed.
- [x] Baseline report published.
