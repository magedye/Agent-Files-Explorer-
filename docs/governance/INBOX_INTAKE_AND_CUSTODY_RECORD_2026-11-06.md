# INBOX Custody and Intake Disposition Record

**Date:** 2026-11-06  
**Repository:** `D:\APP\Agent-Files-Explorer`  
**Governing Directives:** `AFE-GOV-BASELINE-001`, `AGHR-AAPES-INTEGRATION-001`, `INBOX_PROCEDURE.md`  
**Status:** `AUDITED_AND_VERIFIED`

---

## 1. Pinned INBOX Custody Baseline (24 Root Files)

The 24 root files in `governance_packages/INBOX/` remain byte-identical, untruncated, and unmoved, as continuously verified by `tests/inbox_custody.test.mjs` against `docs/evidence/inbox/2026-10-25-custody.json`.

| # | Filename | Size (Bytes) | SHA-256 (Prefix) | Custody Status |
|---|---|---|---|---|
| 1 | `# قائمة المهارات الموصى بها لمشروع MARSA.md` | 5,429 | `30a6c2f7` | INTACT |
| 2 | `1.MD` | 8,819 | `63702a46` | INTACT |
| 3 | `2.MD` | 8,728 | `9154f8ce` | INTACT |
| 4 | `agent-roadmap.md` | 13,322 | `bda92497` | INTACT |
| 5 | `agent-roadmap.pdf` | 114,888 | `66c5d7df` | INTACT |
| 6 | `Antigravity SKILLs.md` | 6,368 | `0021e1d0` | INTACT |
| 7 | `codex skills.md` | 7,105 | `04bf0c0f` | INTACT |
| 8 | `con-learnung-prompt.md` | 4,204 | `bb76ae42` | INTACT |
| 9 | `for-learning.md` | 3,365 | `62534578` | INTACT |
| 10 | `guide.md` | 11,469 | `b68019e0` | INTACT |
| 11 | `IMPOERTANT.md` | 2,752 | `1f36a836` | INTACT |
| 12 | `learning_proposal.md` | 14,030 | `23193e7f` | INTACT |
| 13 | `MARSAD — الدستور التنفيذي المقترح لإدا.md` | 10,753 | `5f02f90a` | INTACT |
| 14 | `MARSAD_Agent_Language_and_Decision_Guide_2026-10-19.md` | 10,650 | `b8568600` | INTACT |
| 15 | `MARSAD_Agent_Language_and_Decision_Guide_2026-10-19.pdf` | 113,382 | `cb6478d1` | INTACT |
| 16 | `MARSAD_Owner_Control_Codex_Execution_Project_Instructions_v3.md` | 11,105 | `49fc8e19` | INTACT |
| 17 | `MARSAD_Project_Instructions_8000char.md` | 7,377 | `28e9d300` | INTACT |
| 18 | `new-lesson-from-marsad.md` | 6,973 | `1b1381aa` | INTACT |
| 19 | `SQLCHAT — Owner Control & Codex Execut.md` | 8,913 | `9ebf66bb` | INTACT |
| 20 | `SQLChat_Owner_Control_Codex_Execution_Project_Instructions.md` | 9,800 | `f28e2850` | INTACT |
| 21 | `اهم واساس المهارت.md` | 7,922 | `b5368a5c` | INTACT |
| 22 | `توصيتي هي اعتماد مبدأ «الاستخدام الذكي للمهارات.md` | 6,930 | `b4904fe5` | INTACT |
| 23 | `مقترح SKILLS_AUTHORIZED.md` | 4,964 | `a9ea3d01` | INTACT |
| 24 | `مهم جدا التعامل مع الفروع.md` | 7,511 | `2d6df3fe` | INTACT |

---

## 2. INBOX/NEW Intake Items and Dispositions

| Item Name | Type | Size / Items | SHA-256 (where applicable) | Disposition | Downstream Artifact / Target |
|---|---|---|---|---|---|
| `Agent_Governance_RCCA_Kit_EN_v1.3.0.zip` | Archive | 151,000 bytes | `613bd920bb156314bd74d0e5034a6d74659d93dafc588611222bae7e4ea92766` | `PROCESSED_AND_REGISTERED` | `governance_packages/references/Agent_Governance_RCCA_Kit_EN_v1.3.0.zip` |
| `Agent_Governance_RCCA_Kit_EN_v1.3.0` | Package Directory | 102 files | 100% verified against `SHA256SUMS.txt` | `PROCESSED_AND_REGISTERED` | `governance_packages/references/Agent_Governance_RCCA_Kit_EN_v1.3.0/` & `AGHR_Studio_1.3.0_Baseline_v1_RELEASE.json` |
| `AAPES_Policy_Engineering_PLUGIN_SKILL_v2.1.zip` | Archive | 65,348 bytes | `81bb6cfaad82df995cb2ff40ba8148b813f8c2b74eb3dfef86b8602b668fa70f` | `PROCESSED_CANDIDATE` | `governance_packages/candidates/AAPES_v2.1_Candidate/` (Status: `REVIEW_REQUIRED / BLOCKED_FOR_MERGE`) |
| `Model Spec.md` | Document | 139,122 bytes | `e3579b4d5ebba4839cf77ba88ef779fa27ea6e36b0fa8ffb09a691506bf407aa` | `INTAKE_REFERENCE_RETAINED` | Retained under `governance_packages/INBOX/NEW/Model Spec.md` for historical model-spec reference |
| `Enterprise_Agent_Governance_Rule_Engineer_Skill_v1.0.0.zip` | Archive | 52,180 bytes | Recorded | `PENDING_REVIEW` | Queued for separate skill evaluation |
| `Master_Catalog_Template_AR_v1.0.docx` | Document | 34,812 bytes | Recorded | `PENDING_REVIEW` | Queued for enterprise catalog workstream |
| `الدليل المؤسسي لبناء كتالوجات المنتجات والمشاريع البرمجية وتحليلها وتقييمها.docx` | Document | 41,200 bytes | Recorded | `PENDING_REVIEW` | Queued for enterprise catalog workstream |
| `Software_Technical_Glossary_OK.xlsx` | Spreadsheet | 18,944 bytes | Recorded | `INTAKE_REFERENCE_RETAINED` | Reference glossary for Arabic technical terminology |
| `Unified_Instruction_Policy_Evaluation_Matrix.xlsx` | Spreadsheet | 22,410 bytes | Recorded | `INTAKE_REFERENCE_RETAINED` | Matrix referenced in legacy evaluation suites |
| `FAST-TRACK.txt` | Text | 1,420 bytes | Recorded | `INTAKE_REFERENCE_RETAINED` | Intake guidance note |
| `READY-TOOLS.md` | Markdown | 2,850 bytes | Recorded | `INTAKE_REFERENCE_RETAINED` | Intake guidance note |

---

## 3. Custody & Processing Integrity Constraints

1. **Zero Deletion:** No historical intake document, candidate archive, or decision record has been deleted.
2. **Path Isolation:** Files in `governance_packages/INBOX/NEW/` remain isolated from `governance_packages/INBOX/` root, keeping `tests/inbox_custody.test.mjs` strictly green (24 files).
3. **Reference Immutability:** Packages registered in `governance_packages/references/` are read-only and version-pinned with cryptographic checksum companions.
