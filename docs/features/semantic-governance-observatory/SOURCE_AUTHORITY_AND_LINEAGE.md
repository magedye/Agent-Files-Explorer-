# AGHR-QLE-GOV-OBS-001: Source Authority, Provenance & Lineage Report

## 1. Source Package Custody
The Semantic Governance Observatory ingests and compiles data from the authoritative source packages located under `D:\APP\OPA`:

1. **`QLE_423_Skill_v1.2.0_Applied_Complete.zip`**:
   - Location: `D:\APP\OPA\QLE_423_Skill_v1.2.0_Applied_Complete.zip`
   - Role: Primary source of compiled item indices, candidate-to-source mappings, priority review queues, and run summaries.
   - Internal Datasets Ingested:
     - `OWNER_REVIEW_QUEUE.json`: 11 Priority Decision Groups (`V4-D01` to `V4-D08`, `G1-D09` to `G1-D11`).
     - `ENGINEERING_RUN_SUMMARY.json`: Compilation statistics and test counts.
     - `QLE_423_V12_ITEM_INDEX.json`: Complete 423 items registry.
     - `source_to_candidates.json`: Relational linkage graph (606 edges).

2. **`QLE-SGO-002_Studio_Integrated_v2.0.0`**:
   - Role: Priority advisory recommendations and context notes.
   - Ingested: `PRIORITY_11_RECOMMENDATIONS_NOT_APPROVED.json`.

3. **`QLE_Unified_Owner_Review_AR_v0_2.xlsx`**:
   - SHA-256 Digest: `A98A24CC009A308918368F19C178A2AAB647E1E188F6E50918BA921ACE61D348`
   - Role: Reference review workbook for owner decision queues and Arabic rule formulations.

---

## 2. Ingested Lineage Breakdown (423 Items)

| Item Origin | Count | Authoritative Status | Normative Force in SGO | Description |
| :--- | :---: | :--- | :--- | :--- |
| **`SOURCE_255`** | 255 | Authoritative Baseline | MUST / SHOULD (Active Reference) | Original foundational requirements from technical specifications. |
| **`V4`** | 110 | Review Candidate | PROVISIONAL (Review Only) | Consolidated or re-engineered candidate proposals awaiting owner decision. |
| **`V2`** | 58 | Historical Lineage | INFORMATIVE (Legacy Reference) | Legacy baseline rules retained for backwards compatibility and audit trail. |
| **TOTAL** | **423** | **Compiled Set** | **Zero Normative Adoption** | **All candidates require sovereign owner authorization before adoption.** |

---

## 3. Relational Topology & Graph Lineage (606 Edges)

The relational graph between items was extracted without heuristics or term-matching guesses:
- **`EXACT_TEXT_DUPLICATE` (38 edges)**: Literal verbatim text match between candidate and source.
  * *Important Invariant*: Verbatim textual overlap does NOT establish semantic equivalence or normative equivalence without owner qualification.
- **`CANDIDATE_SEMANTIC_EQUIVALENT` (124 edges)**: Proposed semantic equivalence between candidate formulations and sources.
- **`SUBSUMES` (82 edges)**: Broad candidate item containing one or more atomic source obligations.
- **`TOPICALLY_RELATED` (362 edges)**: Shared thematic, lexical, or domain concern without direct obligation equivalence.

---

## 4. Owner Authority Boundaries

1. **Unpromoted Candidate Status**: None of the 110 V4 candidates are promoted to active rules in the AGHR engine or LISAN production runtime.
2. **Advisory Recommendations**: Recommendations provided in `PRIORITY_11_RECOMMENDATIONS_NOT_APPROVED.json` are explicitly marked as advisory engineering suggestions. They are **not pre-selected** in the UI and carry no sovereign legal or normative force until approved by the sovereign owner.
3. **No Fabricated Authorizations**: The system preserves an immutable separation between operator draft proposals and owner authorizations.
