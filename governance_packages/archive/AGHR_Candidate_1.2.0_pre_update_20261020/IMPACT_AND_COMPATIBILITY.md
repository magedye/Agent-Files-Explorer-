# Impact and Compatibility Analysis — AGHR Candidate 1.2.0

> **Authority:** Pre-release technical evaluation of Candidate 1.2.0 against Baseline 1.1.0 and 1.0.0.  
> **Verdict:** Strictly Backward-Compatible / Purely Additive & Non-Destructive Refinement.

---

## 1. Summary of Changes in Candidate 1.2.0

Candidate 1.2.0 introduces enhancements along five primary axes:
1. **Context Routing & Progressive Disclosure:** Introduction of the Task-Based Entry Matrix in `AGENTS.md` and formal 5-layer classification in `CONTENTS.md`, quarantining historical/audit archives as `ON_DEMAND_AUDIT`.
2. **Context Budget Enforcement:** Addition of stdlib heuristic token and byte checks in `tools/check_package.py` and secret scanning without external npm or heavy dependencies.
3. **Durable State Authority:** Clarification of `.aghr/state.json` as the sole canonical source of truth in `policies/STATE_AND_RECOVERY.md`, designating `CURRENT.md` and `HANDOFF.md` as derived point-in-time snapshots.
4. **Governed Project Inbox (`_INBOX/`):** Implementation of safe drop staging in `runtime/inbox.py`, `procedures/PROJECT_INBOX.md`, `templates/INBOX_DISPOSITION.md`, and integration into `runtime/cli.py init` and `cli.py inbox`.
5. **Cross-Platform Portability:** Replacement of raw Windows string separators with POSIX `.as_posix()` and enforcement of UTF-8 encoding across reading tools and tests.

---

## 2. Backward Compatibility Assessment

| Dimension | Baseline 1.1.0 Invariant | Candidate 1.2.0 State | Compatibility Verdict |
|---|---|---|---|
| **Normative Contracts** | 4 contracts (`GOVERNANCE`, `RUNTIME`, `ENFORCEMENT`, `EVIDENCE`) | Exact contracts preserved unmodified | `COMPATIBLE` |
| **Rule Registry** | 47 rules (40 original IDs preserved) | 47 rules, identical rule statements and sources | `COMPATIBLE` |
| **Primary Sources** | 56 primary sources in `sources/REGISTER.json` | 56 primary sources preserved | `COMPATIBLE` |
| **Assurance Profiles** | `LITE`, `STANDARD`, `CONTROLLED` | Unchanged definitions and schemas | `COMPATIBLE` |
| **Provider/Host Adapters** | 6 provider, 6 host adapters | Preserved; qualification status `NOT_RUN` | `COMPATIBLE` |
| **State & Request Schemas** | JSON Schema draft 2020-12 in `schemas/` | Fully conforming; inbox intake uses `REQUEST.schema.json` | `COMPATIBLE` |
| **Historical Payload** | `compatibility/` (73 files), `design/frozen/` | 100% digest-identical to 1.1.0 baseline | `COMPATIBLE` |
| **Local Test Suite** | 233 automated unit tests | 246 automated tests (233 original + 13 inbox tests) | `COMPATIBLE` (100% PASS) |

---

## 3. Adopter Migration Path

### For Existing AGHR 1.1.0 Projects:
Existing projects adopted under 1.1.0 do **NOT** require a destructive re-initialization. Adopters can upgrade seamlessly:
1. **Enable Governed Inbox:** Create directory `_INBOX/` at project root:
   ```sh
   mkdir _INBOX
   ```
2. **Copy Reference Updates:** Update `.aghr/reference/` from the 1.2.0 package:
   - `procedures/PROJECT_INBOX.md`
   - `runtime/inbox.py`
   - `templates/INBOX_DISPOSITION.md`
   - Updated `AGENTS.md` and `START_HERE.md`
3. **Preserve Project Records:** Existing `.aghr/project.json` and `.aghr/state.json` remain completely valid without schema migration.

### For New Projects:
Run standard initialization:
```sh
python runtime/cli.py init --project ../new-project --name "New Project" --owner "Project Owner"
```
This automatically establishes `_INBOX/` alongside `.aghr/` with safe drop guidance.

---

## 4. Note on AGHR Minimal 1.1.0 Compatibility

- **Status in Baseline:** `AGHR_Minimal_1.1.0.zip` is a lightweight edition focused strictly on the 40 core rules and minimal profiles, excluding the optional skill catalog, standards cards, and Arabic academic guide.
- **Candidate Compatibility:** The improvements in Candidate 1.2.0 (specifically the progressive disclosure router matrix, POSIX path normalization, single source of truth for state, and the `_INBOX/` drop staging capability) are conceptually and architecturally compatible with the Minimal edition.
- **Scope Restriction:** In strict adherence to prime preservation directives, `AGHR_Minimal_1.1.0.zip` has **not** been modified silently. A corresponding `AGHR_Minimal_1.2.0` package can be independently derived using the same proven delta when authorized by the project owner.
