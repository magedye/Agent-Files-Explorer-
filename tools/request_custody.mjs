/**
 * tools/request_custody.mjs
 * 
 * Operational Custody and Lifecycle Transition Engine for Deferred Requests.
 * Implemented under Sovereign Owner Directive: AFE-GOV-REQUEST-CUSTODY-009.
 * 
 * Enforces:
 * - Single-source-of-truth standard card validation (9 core fields)
 * - Strict decoupling of Reopen Trigger / Review Date from Execution Authorization
 * - Rejection of self-grants (READY_FOR_REVIEW cannot transition to AUTHORIZED without explicit owner grant)
 * - Fail-closed handling of expired grants, state conflicts, reference drift, and cancelled requests
 * - Continuous valid grant execution per GOV-004 without micro-step re-authorization
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const VALID_STATUSES = [
  "DEFERRED",
  "READY_FOR_REVIEW",
  "AUTHORIZED",
  "DONE",
  "CANCELLED",
  "OBSOLETE",
];

export const VALID_REVIEW_POLICIES = [
  "EVENT_TRIGGER_ONLY",
  "TIME_BASED",
  "EVENT_AND_TIME",
];

/**
 * Validates a structured deferred request card object.
 * @param {Object} card 
 * @returns {boolean}
 */
export function validateDeferredCard(card) {
  if (!card || typeof card !== "object") {
    throw new Error("INVALID_CARD: Card must be a non-null object");
  }

  // 1. Request ID
  if (!card.request_id || typeof card.request_id !== "string" || !/^REQ-[A-Z0-9_.-]+$/i.test(card.request_id.trim())) {
    throw new Error(`INVALID_CARD: Missing or invalid request_id (${card.request_id}). Expected format: REQ-<ID>`);
  }

  // 2. Status
  if (!card.status || !VALID_STATUSES.includes(card.status.toUpperCase())) {
    throw new Error(`INVALID_CARD: Missing or invalid status (${card.status}). Allowed: ${VALID_STATUSES.join(", ")}`);
  }

  // 3. Purpose
  if (!card.purpose || typeof card.purpose !== "string" || card.purpose.trim().length === 0) {
    throw new Error("INVALID_CARD: Missing required purpose");
  }

  // 4. Governing References
  if (!card.governing_references || (Array.isArray(card.governing_references) && card.governing_references.length === 0)) {
    throw new Error("INVALID_CARD: Missing required governing_references");
  }

  // 5. Evidence
  if (!card.evidence || (Array.isArray(card.evidence) && card.evidence.length === 0)) {
    throw new Error("INVALID_CARD: Missing required evidence");
  }

  // 6. Reopen Trigger
  if (!card.reopen_trigger || typeof card.reopen_trigger !== "string" || card.reopen_trigger.trim().length === 0) {
    throw new Error("INVALID_CARD: Missing required reopen_trigger");
  }

  // 7. Review Policy & Review Owner
  if (!card.review_policy || !VALID_REVIEW_POLICIES.includes(card.review_policy)) {
    throw new Error(`INVALID_CARD: Missing or invalid review_policy (${card.review_policy}). Allowed: ${VALID_REVIEW_POLICIES.join(", ")}`);
  }
  if (!card.review_owner || typeof card.review_owner !== "string" || card.review_owner.trim().length === 0) {
    throw new Error("INVALID_CARD: Missing required review_owner");
  }

  // Next Review Due is mandatory if policy is TIME_BASED or EVENT_AND_TIME
  if (card.review_policy === "TIME_BASED" || card.review_policy === "EVENT_AND_TIME") {
    if (!card.next_review_due || !/^\d{4}-\d{2}-\d{2}(?:.*)?$/.test(card.next_review_due)) {
      throw new Error(`INVALID_CARD: next_review_due starting with YYYY-MM-DD is required for review_policy=${card.review_policy}`);
    }
  }

  // 8. Authorization Scope
  if (!card.authorization_scope || typeof card.authorization_scope !== "string" || card.authorization_scope.trim().length === 0) {
    throw new Error("INVALID_CARD: Missing required authorization_scope");
  }

  // 9. Next Permitted Action
  if (!card.next_permitted_action || typeof card.next_permitted_action !== "string" || card.next_permitted_action.trim().length === 0) {
    throw new Error("INVALID_CARD: Missing required next_permitted_action");
  }

  return true;
}

/**
 * Formats a valid card into canonical GitHub Flavored Markdown table.
 * @param {Object} card 
 * @returns {string}
 */
export function formatMarkdownCard(card) {
  validateDeferredCard(card);
  const govRefs = Array.isArray(card.governing_references) ? card.governing_references.join(", ") : card.governing_references;
  const ev = Array.isArray(card.evidence) ? card.evidence.join("; ") : card.evidence;
  const reviewDue = card.next_review_due || "N/A (EVENT_TRIGGER_ONLY)";

  return [
    `### ${card.request_id}: ${card.purpose}`,
    "",
    "| Field | Value |",
    "| :--- | :--- |",
    `| **Request ID** | \`${card.request_id}\` |`,
    `| **Status** | \`${card.status.toUpperCase()}\` |`,
    `| **Purpose** | ${card.purpose} |`,
    `| **Governing References** | ${govRefs} |`,
    `| **Evidence** | ${ev} |`,
    `| **Reopen Trigger** | ${card.reopen_trigger} |`,
    `| **Review Policy** | \`${card.review_policy}\` |`,
    `| **Review Owner** | ${card.review_owner} |`,
    `| **Next Review Due** | \`${reviewDue}\` |`,
    `| **Authorization Scope** | \`${card.authorization_scope}\` |`,
    `| **Next Permitted Action** | ${card.next_permitted_action} |`,
    "",
  ].join("\n");
}

/**
 * Evaluates state transitions and execution attempts against governance invariants.
 * 
 * @param {Object} options
 * @param {Object} options.card - Current deferred request card
 * @param {string} options.event - One of: 'REVIEW_DUE_CHECK', 'TRIGGER_MET', 'AUTHORIZE', 'EXECUTE', 'CANCEL', 'COMPLETE'
 * @param {Object} [options.ownerGrant] - Optional grant object { id, authority, scope, expiresAt, status }
 * @param {Object} [options.externalState] - Optional state from another register to check conflicts
 * @param {Object} [options.workspaceReferences] - Current hashes of governing references
 * @param {string} [options.currentDate] - ISO date YYYY-MM-DD for deterministic simulation
 * @param {string} [options.cancellationReason] - Required if event === 'CANCEL'
 * @param {string} [options.actionAttempted] - Name of action when event === 'EXECUTE'
 * @returns {Object} Updated card object
 */
export function evaluateTransition({
  card,
  event,
  ownerGrant = null,
  externalState = null,
  workspaceReferences = null,
  currentDate = new Date().toISOString().slice(0, 10),
  cancellationReason = null,
  actionAttempted = null,
}) {
  validateDeferredCard(card);
  const currentStatus = card.status.toUpperCase();

  // Negative Check 4: Conflicting sources of state
  if (externalState) {
    const extStatus = (externalState.status || "").toUpperCase();
    if (extStatus && extStatus !== currentStatus) {
      throw new Error(`BLOCKED_STATE_CONFLICT: Divergent status detected between primary card (${currentStatus}) and authoritative register (${extStatus})`);
    }
  }

  // Negative Check 5: Governing reference or scope drift
  if (workspaceReferences && card.reference_hash) {
    const activeHash = workspaceReferences[card.request_id] || workspaceReferences.default;
    if (activeHash && activeHash !== card.reference_hash) {
      throw new Error(`BLOCKED_REFERENCE_DRIFT: Governing reference hash changed from ${card.reference_hash} to ${activeHash}. Card invalidated pending reconciliation.`);
    }
  }

  // Handle Cancellation
  if (event === "CANCEL") {
    if (!cancellationReason || cancellationReason.trim().length === 0) {
      throw new Error("INVALID_TRANSITION: Cancellation requires an explicit cancellationReason");
    }
    return {
      ...card,
      status: "CANCELLED",
      cancellation_reason: cancellationReason.trim(),
      updated_at: currentDate,
    };
  }

  // Negative Check 3: Resuming or executing a cancelled/obsolete request
  if (currentStatus === "CANCELLED" || currentStatus === "OBSOLETE") {
    throw new Error(`BLOCKED_CANCELLED_REQUEST: Cannot evaluate, transition, or execute a request with status=${currentStatus}`);
  }

  // Event 1: Review Date Arrival
  if (event === "REVIEW_DUE_CHECK") {
    if (card.review_policy === "EVENT_TRIGGER_ONLY") {
      return card; // No time-based review
    }
    const dueDateMatch = (card.next_review_due || "").match(/^\d{4}-\d{2}-\d{2}/);
    const dueDate = dueDateMatch ? dueDateMatch[0] : null;
    if (dueDate && currentDate >= dueDate) {
      // Reaching review date moves status to READY_FOR_REVIEW, NEVER to AUTHORIZED!
      return {
        ...card,
        status: "READY_FOR_REVIEW",
        review_state: "DUE_FOR_OWNER_EVALUATION",
        updated_at: currentDate,
      };
    }
    return card;
  }

  // Event 2: Reopen Trigger Condition Met
  if (event === "TRIGGER_MET") {
    // Condition met moves status to READY_FOR_REVIEW, NEVER to AUTHORIZED!
    return {
      ...card,
      status: "READY_FOR_REVIEW",
      trigger_state: "CONDITION_SATISFIED",
      updated_at: currentDate,
    };
  }

  // Event 3: Owner Authorization Granting
  if (event === "AUTHORIZE") {
    // Negative Check 6: Transitioning READY_FOR_REVIEW / DEFERRED to AUTHORIZED without valid owner grant
    if (!ownerGrant) {
      throw new Error("BLOCKED_UNAUTHORIZED_TRANSITION: Cannot transition to AUTHORIZED without an explicit owner grant");
    }
    if (ownerGrant.status && ownerGrant.status.toUpperCase() !== "APPROVED" && ownerGrant.status.toUpperCase() !== "OWNER_APPROVED") {
      throw new Error(`BLOCKED_UNAUTHORIZED_TRANSITION: Grant status (${ownerGrant.status}) is not OWNER_APPROVED`);
    }
    if (ownerGrant.expiresAt && currentDate > ownerGrant.expiresAt) {
      throw new Error(`BLOCKED_EXPIRED_GRANT: Owner grant expired on ${ownerGrant.expiresAt} (current date: ${currentDate})`);
    }
    if (!ownerGrant.scope || ownerGrant.scope.trim().length === 0) {
      throw new Error("BLOCKED_UNAUTHORIZED_TRANSITION: Owner grant must specify an explicit scope");
    }

    return {
      ...card,
      status: "AUTHORIZED",
      authorization_scope: ownerGrant.scope,
      active_grant_id: ownerGrant.id || "OWNER-GRANT-DIRECT",
      updated_at: currentDate,
    };
  }

  // Event 4: Execution Attempt
  if (event === "EXECUTE") {
    // Defense-in-depth: If scope is NONE_DEFERRED or NONE, block immediately
    if (card.authorization_scope === "NONE_DEFERRED" || card.authorization_scope === "NONE") {
      throw new Error(`BLOCKED_NO_EXECUTION_GRANT: Cannot execute task when authorization_scope is '${card.authorization_scope}'. Zero execution is permitted.`);
    }

    // Negative Check 1: In READY_FOR_REVIEW or DEFERRED without authorization
    if (currentStatus === "READY_FOR_REVIEW" || currentStatus === "DEFERRED") {
      throw new Error(`BLOCKED_NO_EXECUTION_GRANT: Cannot execute task in status=${currentStatus}. Reaching review date or meeting trigger does not confer execution authority.`);
    }

    if (currentStatus !== "AUTHORIZED") {
      throw new Error(`BLOCKED_EXECUTION: Cannot execute task with status=${currentStatus}`);
    }

    // Must have a valid grant
    if (!ownerGrant) {
      throw new Error("BLOCKED_NO_EXECUTION_GRANT: Execution requires an active owner grant object");
    }

    // Negative Check 2: Expired grant
    if (ownerGrant.expiresAt && currentDate > ownerGrant.expiresAt) {
      throw new Error(`BLOCKED_EXPIRED_GRANT: Owner grant expired on ${ownerGrant.expiresAt} (current date: ${currentDate})`);
    }

    // Check scope containment
    const targetAction = actionAttempted || card.next_permitted_action;
    const isProhibitedRemote = /push|publish|deploy|remote/i.test(targetAction);
    const grantPermitsRemote = /publish|deploy|remote_push/i.test(ownerGrant.scope);

    if (isProhibitedRemote && !grantPermitsRemote) {
      throw new Error(`BLOCKED_UNAUTHORIZED_PUBLICATION: Action '${targetAction}' requires explicit publication grant. Active grant scope: '${ownerGrant.scope}'`);
    }

    // Execution allowed within grant (GOV-004)
    return {
      ...card,
      last_executed_action: targetAction,
      updated_at: currentDate,
    };
  }

  // Event 5: Completion
  if (event === "COMPLETE") {
    if (currentStatus !== "AUTHORIZED") {
      throw new Error(`BLOCKED_COMPLETION: Cannot mark task DONE when status is ${currentStatus}`);
    }
    return {
      ...card,
      status: "DONE",
      updated_at: currentDate,
    };
  }

  throw new Error(`UNKNOWN_EVENT: Event '${event}' is not recognized`);
}
