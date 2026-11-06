# Rule / Instruction Review Report — TEMPLATE

**Review status:** DRAFT / ADVISORY_ONLY  
**Requested action:** REVIEW / AUTHOR / EVALUATE / COMPARE / BATCH  
**Scope:** ....  
**Source and version:** .... / `UNKNOWN`  
**Target agent/model/environment:** .... / `UNKNOWN`  
**Files changed:** NONE unless explicitly authorized.

## 1. Original / baseline (verbatim)

> ...

## 2. Intent and authority

- Purpose: ...
- Actor/action/object: ...
- Authority evidence: ... / `NOT_VERIFIED`
- Domain and environment scope: ...
- Risk tier (provisional): ... and justification

## 3. Findings

| ID | Priority | Exact original phrase | Problem | Evidence vs inference | Impact / verification gap | Repair |
|---|---|---|---|---|---|---|
| F-01 | P1 | ... | ... | ... | ... | ... |

## 4. Revised candidates

**A. Minimal meaning-preserving**
> ...

**B. Engineered (owner decision required for substantive changes)**
> ...

| Changed element | Type | Old meaning | Proposed new meaning | Owner decision? |
|---|---|---|---|---|
| ... | EDITORIAL / NORMATIVE_CHANGE / CONTROL_ADDITION | ... | ... | YES/NO |

## 5. Enforcement vs verification

| Rule | Control | Evidence source | Oracle | Critical failure path |
|---|---|---|---|---|
| ... | PROMPT / VALIDATOR / PDP+PEP / HUMAN | ... | ... | ... |

## 6. Proposed tests (do not mark passed unless executed)

| Test ID | Category | Setup / input | Expected result | Test method | Observed evidence | Status |
|---|---|---|---|---|---|---|
| TC-01 | POSITIVE | ... | ... | ... | NOT_AVAILABLE | NOT_RUN |
| TC-02 | NEGATIVE | ... | ... | ... | NOT_AVAILABLE | NOT_RUN |

## 7. Recommendation and independent decisions

- Recommendation: `KEEP | EDIT_NON_SUBSTANTIVE | PROPOSE_SUBSTANTIVE_CHANGE | SPLIT | BLOCKED_CONFLICT | ...`
- Owner decisions needed: ...
- Unresolved risks / UNKNOWN inputs: ...
- Assurance: NOT_RUN / scope of independent verified evidence
- Activation authorized: **NO**, unless explicitly evidenced from authority.
