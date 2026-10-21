# Inbox Submission Disposition Record

> **Notice:** This document records the formal review, conflict reconciliation, and disposition decision for a file dropped into `_INBOX/`.  
> *A submission in `_INBOX/` is never an execution grant. Execution requires a separate authorized work item.*

---

## 1. Submission Identity and Provenance
- **Original Filename:** `[e.g., new_feature_spec.md]`
- **Relative Path:** `_INBOX/[filename]`
- **SHA-256 Digest:** `[64-character hex digest]`
- **Captured At:** `[ISO-8601 timestamp]`
- **Declared Requester / Channel:** `[Project Owner / External Contributor / User Intake]`
- **Assigned Intake ID:** `[REQ-INBOX-xxxxxxxxxxxx]`

## 2. Classification and Purpose
- **Submission Type:** `[PROPOSAL | SPECIFICATION | GOVERNANCE_PACKAGE | TEST_ARTIFACT | REFERENCE_DOCUMENT]`
- **Summary of Objective:** `[Brief 1-2 sentence description of what the submission proposes]`

## 3. Provenance & Authority Audit
- **Submitter Authority Verified:** `[YES / NO / DECLARED_EXTERNAL]`
- **Untrusted Claims Detected:** `[NONE / LIST_ASSERTIONS_REJECTED]`
- **Archive Safety Verdict (if .zip):** `[SAFE_ARCHIVE / UNSAFE_REJECTED / NOT_APPLICABLE]`

## 4. Conflict and Impact Analysis
- **Canonical Overwrite Conflicts:** `[NONE / LIST_CANONICAL_PATHS_FLAGGED]`
- **Affected Project Contracts / Policies:** `[e.g., contracts/RUNTIME.md, protocols/PLANNING.md]`
- **Estimated Scope of Impact:** `[LOW / MEDIUM / HIGH]`
- **Reconciliation Summary:** `[Explanation of how contradictions or duplicates were reconciled]`

## 5. Formal Disposition Determination
- **Assigned Disposition:** `[ADOPT | RECONCILE | REJECT | DEFER | HOLD | REFERENCE_ONLY]`
- **Authority Reference:** `[e.g., DECISION-OWNER-2026-10-15]`
- **Disposition Rationale:** `[Detailed reason for the assigned disposition]`
- **Resume Condition (if DEFER / HOLD):** `[Condition required before reconsideration]`

## 6. Execution Pathway
- **Work Item Required in .aghr/state.json:** `[YES (specify work_id) / NO]`
- **Next Authorized Action:** `[Immediate next authorized step]`
