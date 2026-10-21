# AGHR 1.1.0 Context Optimization & Retrieval Guide

> **Audience**: AI Coding Agents & Workspace Engineers  
> **Package**: Agent Governance and Harness Reference 1.1.0 (Full Package)  
> **Key Message**: This package is an authoritative reference library, NOT a monolithic prompt.

---

## 1. Context Consumption Analysis

| Subfolder | File Count | Raw Size | Est. Tokens | Consumption Policy |
| :--- | :--- | :--- | :--- | :--- |
| **`compatibility/`** | 15 files | 1,288 KB | **~355,000** | ⛔ **DO NOT LOAD**. Historical migration archive only. |
| **`verification/`** | 47 files | 230 KB | **~62,000** | ⛔ **DO NOT LOAD**. Test logs and certification evidence. |
| **`registry/`** | 2 files | 58 KB | **~16,000** | 🔍 **QUERY ON-DEMAND**. Contains RULES.json (47 rules). |
| **`sources/`** | 6 files | 86 KB | **~22,000** | 🔍 **QUERY ON-DEMAND**. Registered foundation sources. |
| **`contracts/`** | 4 files | 12 KB | **~3,300** | ✅ **LOAD IF RELEVANT**. Core behavioral contracts. |
| **`profiles/`** | 5 files | 4.7 KB | **~1,300** | ✅ **LOAD IF RELEVANT**. LITE, STANDARD, CONTROLLED specs. |

---

## 2. Recommended Agent Access Patterns

1. **For General Coding in the Workspace**:
   - Do NOT open any file in this package. Consult `docs/status/CURRENT.md` in the project root instead.

2. **When Verifying or Adopting a Rule**:
   - Query `registry/RULES.json` by searching for specific IDs (e.g., `AGHR-001`, `AGHR-020`).
   - Do not dump the entire JSON into conversation memory.

3. **When Checking Contractual Obligations**:
   - Read the relevant contract file directly:
     - `contracts/GOVERNANCE.md` (Authority and hierarchy)
     - `contracts/RUNTIME.md` (Execution and isolation)
     - `contracts/ENFORCEMENT.md` (Verification policies)
     - `contracts/EVIDENCE.md` (Audit trails)

4. **When In Doubt**:
   - Use `governance_packages/AGHR_Minimal_1.1.0/CORE.md` instead of navigating the full 1.1.0 package. It provides the identical normative force in less than 2,200 tokens.
