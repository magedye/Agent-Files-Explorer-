# Migration disposition

| Existing capability | v1.3 disposition | Boundary |
|---|---|---|
| 05 governance/Git inventory | Preserved unchanged | Read existing help and authorization before use |
| 06 write-set diagnostics | Preserved unchanged; new metadata scope classifier added | Neither is a non-bypassable runtime boundary |
| 07 derived views | Preserved unchanged | Hashes do not create authority |
| 08 source coverage G1/G2 | Reused verbatim by the wrapper | Meaning/coverage still need review |
| 08 legacy G5 | Preserved for explicit legacy use; replaced in v1.3 profile | No simultaneous rival acceptance policies |
| 09 event ledger | Preserved optional tool | Writing requires scope; not tamper-proof |
| 10 completion metrics | Preserved optional diagnostic | Input labels are not authenticated independent judgments |
| 11 gated-write demo | Preserved fixture-only demonstration | No production PEP/PDP is claimed |
| Original Arabic documents | Retained in unchanged original archive | English v1.3 docs provide the new candidate profile |
| Full AGHR Reference 1.2.0 archive | Not wholesale merged | Existing approved project authority is not superseded |

Legacy JSON is not accepted as a v1.3 wrapper implicitly. Build a v1.3 draft, preserve existing IDs and source bytes,
link actual artifact references and record the current subject. A passing metadata check is not an acceptance migration.
