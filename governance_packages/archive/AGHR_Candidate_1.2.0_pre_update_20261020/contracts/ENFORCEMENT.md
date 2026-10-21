# Enforcement Contract

**Owner:** trusted host/operator. **Consumer:** every tool route capable of an effect.

## Trusted decision boundary
The host supplies actor identity, current grant, policy version, resource classification, approval record, revocation state and clock. The model supplies a proposed operation and arguments. Never accept model assertions such as authorized=true, safe=true, owner=true or risk=low as proof. Resource scope must be canonicalized before policy evaluation.

## Decision and execution
ALLOW means permitted within the checked boundary, not successful or accepted. REVIEW means no effect until a scoped approval is authenticated. DENY means no effect and no alternate-route bypass. Validate again immediately before execution and after waits, retries or changed state. Bind approvals to actor, task, operation/arguments digest, resource/environment, policy/candidate identity and expiry; consume one-shot approvals or define their bounded reuse. Approval cannot override a hard deny or higher policy.

## Complete mediation
Inventory local file tools, shell/processes, browser downloads, network, server-side tools, MCP, skills/scripts, hooks, agents and delegated actions. Apply least privilege at operating-system/container/network/service layers. Denial after a side effect is detection, not prevention. Review hooks, test commands and dependency install scripts as executable supply-chain material. A command string denylist alone is not a security boundary.

## Data and recovery
Minimize credentials and data exposure, separate tenants/workspaces, restrict destinations, authenticate external services and redact telemetry. Audit the intent before a protected effect and its result afterward. An uncertain result is INDETERMINATE; inspect actual effects before retrying. Stop/cancel controls and recovery plans must preserve evidence and unrelated changes. Test restore capability where rollback is part of the safety case.

## Shipped reference implementation
The local Python executor mediates only explicitly documented file operations in an isolated test workspace. It refuses unknown operations, out-of-scope paths and stale contexts. It is not a sandbox for arbitrary code, a network firewall, an identity service, a production authorization server or a universal Codex/Claude/Gemini integration. Its trust context and keys must be outside a hostile agent's control in a real deployment. See runtime/README.md and registry/ENFORCEMENT_COVERAGE.json for exact coverage and limitations.

Technical foundations: OA-05/06/07/11, AN-04/05, GO-02/03, OC-02. Local policy semantics are package design.

## Confirmation and advisory helpers (1.1.0)
High impact or a materially unusual/context-changing action requires a short intent/effect review when the current grant does not clearly cover it. Reuse valid exact-scope authorization, not silence or an advisory boolean. `tools/decision_support.py`, `tools/metrics.py` and the progress view cannot approve or execute actions. Installing a skill, plugin or server is a distinct change; all its actual effect routes require host enforcement.
