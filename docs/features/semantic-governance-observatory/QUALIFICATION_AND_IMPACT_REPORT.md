# AGHR-QLE-GOV-OBS-001: Qualification & Static Impact Report

## 1. Test Invariant & Honest Reporting
In strict accordance with the AGHR honesty rules and the execution directive:
- **2,240 Designed Test Cases**: Mapped across the 423 items.
- **Current Execution Status**: `DESIGNED_NOT_RUN`.
- **Zero Fabricated Tests**: SGO explicitly records 0 executed tests, 0 passing test cases, and 0 failing test cases for candidate policies.
- **Reason**: Live qualification requires executing the underlying LISAN Engine against test suites, which has not been initiated in this phase. Claiming passing statuses without actual execution is strictly prohibited by AGHR governance.

---

## 2. Static Impact Simulator Architecture
The SGO provides a deterministic **Static Impact Simulator** (`server/studio/sgo/sgo-analyzer.mjs`) that maps reachability and systemic influence without guessing or simulating false test breakages.

### 2.1 Reachability Dimensions Analyzed
When evaluating an item (e.g. `QL4-A01`):
1. **Direct Relational Edges**: Identifies all duplicate, subsumed, or topically related candidates and sources (e.g. `LISAN-GOV-001`, `LISAN-GOV-002`).
2. **AAPES Domain Clustering**: Traces items sharing identical AAPES governance domains (e.g. `SEC`, `VAL`, `DAT`).
3. **Contract Dependencies**: Evaluates touchpoints with AGHR rc.3 schemas and database structures.
4. **Associated Designed Tests**: Discloses all designed test cases associated with the target and reachable items, explicitly marking them `DESIGNED_NOT_RUN`.

### 2.2 Rejection of Fabricated Failure
Unlike naive simulators that report "3 tests failed" to justify changes, the SGO Static Impact Simulator:
- Confines its report to reachability, structural overlap, and potential policy conflicts.
- Never reports a test failure without a verified execution receipt from the job runner.
