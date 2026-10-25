# SEC-001 — T06 validation candidate

Status: **T06 CLOSED_FOR_OWNER_AUTHORIZED_MOCK_PROFILE_ONLY**. Native governing validation remains BLOCKED; this is not an adopted policy or promoted reference. [Current mock proof](../../../docs/evidence/studio-t06-mock-2026-10-23/README.md); [prior native evidence](../../../docs/evidence/studio-t06-2026-10-23/README.md).

The `complete/` package maps all 17 top-level fields of AGHR rc.3 §3.2 to schema-supported JSON. SEC-001 retains `CONSTRAINT / MUST_NOT / critical`, enterprise authority, universal paths without exclusions, and a required blocking gate. Canonical owner/approver labels and enforcement commands are declarations carried from the template, not authenticated approvals or proof that a scanner/CI gate ran.

| Package | Single intentional difference | Observed strict outcome |
| --- | --- | --- |
| `complete/` | Complete canonical template | Structure PASS; BLOCKED, exit 3: unverified authority and E3 enforcement evidence unavailable |
| `missing-authority-level/` | Remove `/authority/level` | INVALID, exit 1 |
| `missing-scope/` | Remove `/scope` | INVALID, exit 1 |
| `missing-eval-fixtures/` | Remove `/verification/evalFixtures` | INVALID, exit 1 |

Each directory is a separate package with its own manifest and unchanged test inputs. Negative packages are retained for verification; none is eligible for adoption. No supplied code, verification command, eval fixture, generation command or CI gate was executed. Only the pinned read/strict CLI and existing Python audit boundary were used.

Reference 1.2.0 and the accepted 46-file core engine remain byte-for-byte unchanged. The owner later explicitly authorized a mock/local-signature proof. `mock-authorized/` contains the actual YAML source and signed MOCK_ONLY data; an isolated test adapter invokes unchanged E2 APIs with simulated caller authority and the unavailable E3 dependency stubbed for this exact fixture. It returns VALID/0 with mandatory mock labels. The original CLI still returns BLOCKED/3 on the same input. This closes only the newly authorized mock template scope, not real enforcement or enterprise authentication. See the current receipt for invocation, limits, regressions and signatures.
