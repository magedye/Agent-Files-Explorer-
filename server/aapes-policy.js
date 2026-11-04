import crypto from "node:crypto";

// BCP 14 Normative keywords (RFC 2119 / RFC 8174)
const BCP14_KEYWORDS = [
  "MUST NOT", "SHALL NOT", "NOT RECOMMENDED",
  "MUST", "REQUIRED", "SHALL", "SHOULD NOT",
  "SHOULD", "RECOMMENDED", "MAY", "OPTIONAL"
];

// Ambiguous adjectives that require operational definitions
const AMBIGUOUS_ADJECTIVES = [
  "appropriate", "appropriately", "reasonable", "reasonably",
  "safe", "safely", "fast", "adequate", "adequately",
  "timely", "proper", "properly", "sufficient", "sufficiently",
  "as needed", "acceptable", "normal", "good", "efficient"
];

// Triggers keywords
const TRIGGER_PATTERNS = [
  /\b(?:when|whenever|upon|on receiving|on request|if|before|after|in the event of)\b/i
];

// Scope keywords
const SCOPE_PATTERNS = [
  /\b(?:agent|model|subagent|tool|user|system|caller|pep|pdp|pipeline|plugin)\b/i
];

// Failure-state keywords
const FAILURE_STATE_PATTERNS = [
  /\b(?:deny|block|reject|fail closed|abort|quarantine|return 403|raise error|error)\b/i
];

// Prompt injection & trust boundary risk keywords
const TRUST_BOUNDARY_PATTERNS = [
  { pattern: /\b(?:untrusted|third-party|external data|user input|retrieved document)\b/i, label: "External untrusted data boundary" },
  { pattern: /\b(?:self-approv|mint.*approval|bypass|override system|ignore previous)\b/i, label: "Privilege escalation or self-approval attempt" },
  { pattern: /\b(?:prompt injection|jailbreak|hidden prompt)\b/i, label: "Prompt injection surface" }
];

/**
 * Generate a simple unified diff between original and proposed text.
 */
function createUnifiedDiff(original, proposed, identifier = "rule") {
  const origLines = original.split("\n");
  const propLines = proposed.split("\n");
  const diffLines = [
    `--- a/${identifier}.txt`,
    `+++ b/${identifier}.txt`,
    `@@ -1,${origLines.length} +1,${propLines.length} @@`
  ];
  origLines.forEach(l => diffLines.push(`-${l}`));
  propLines.forEach(l => diffLines.push(`+${l}`));
  return diffLines.join("\n");
}

/**
 * Analyze a single policy text for atomicity, BCP 14 compliance, completeness, and trust risks.
 */
export function reviewPolicyText(text, ruleId = "AAPES-RULE-DRAFT") {
  if (!text || typeof text !== "string") {
    throw new Error("Policy text must be a non-empty string");
  }

  const findings = [];
  const trimmed = text.trim();

  // 1. BCP 14 Normative Analysis
  const detectedKeywords = [];
  for (const kw of BCP14_KEYWORDS) {
    const regex = new RegExp(`\\b${kw}\\b`, "i");
    if (regex.test(trimmed)) {
      detectedKeywords.push(kw);
    }
  }

  if (detectedKeywords.length === 0) {
    findings.push({
      type: "fact",
      category: "bcp14",
      message: "No standard BCP 14 normative keyword (MUST, SHOULD, MAY, MUST NOT) detected.",
      snippet: trimmed.slice(0, 100)
    });
    findings.push({
      type: "recommendation",
      category: "bcp14",
      message: "Use an explicit BCP 14 keyword (e.g. MUST for mandatory obligations, MUST NOT for prohibitions).",
      snippet: ""
    });
  } else {
    findings.push({
      type: "fact",
      category: "bcp14",
      message: `Detected BCP 14 keyword(s): ${detectedKeywords.join(", ")}.`,
      snippet: detectedKeywords[0]
    });
  }

  // 2. Ambiguous Terms Analysis
  const detectedAmbiguities = [];
  for (const amb of AMBIGUOUS_ADJECTIVES) {
    const regex = new RegExp(`\\b${amb}\\b`, "i");
    if (regex.test(trimmed)) {
      detectedAmbiguities.push(amb);
    }
  }

  if (detectedAmbiguities.length > 0) {
    findings.push({
      type: "fact",
      category: "ambiguity",
      message: `Rule contains ambiguous adjective(s): [${detectedAmbiguities.join(", ")}] without explicit operational threshold.`,
      snippet: detectedAmbiguities.join(", ")
    });
    findings.push({
      type: "recommendation",
      category: "ambiguity",
      message: "Replace ambiguous terms with measurable criteria (e.g., replace 'fast' with '< 2000ms', replace 'appropriate' with explicit role check).",
      snippet: ""
    });
  }

  // 3. Atomicity Checks (Compound statements)
  const compoundMarkers = [
    /\b(?:and also|furthermore|additionally|in addition to this|as well as having to)\b/i,
    /(?:;\s*and\b)/i,
    /\b(?:must\b(?!.*otherwise).+\bmust\b)/i
  ];

  let isCompound = false;
  for (const marker of compoundMarkers) {
    if (marker.test(trimmed)) {
      isCompound = true;
      break;
    }
  }

  if (isCompound) {
    findings.push({
      type: "inference",
      category: "atomicity",
      message: "Rule appears to contain multiple conjoined obligations and violates atomic single-obligation design.",
      snippet: trimmed.slice(0, 120)
    });
    findings.push({
      type: "recommendation",
      category: "atomicity",
      message: "Split compound rule into independent, atomic rules with separate observable verification criteria.",
      snippet: ""
    });
  }

  // 4. Completeness Checks
  const hasTrigger = TRIGGER_PATTERNS.some(p => p.test(trimmed));
  const hasScope = SCOPE_PATTERNS.some(p => p.test(trimmed));
  const hasFailureState = FAILURE_STATE_PATTERNS.some(p => p.test(trimmed));

  if (!hasTrigger) {
    findings.push({
      type: "assumption",
      category: "completeness",
      message: "Trigger event or precondition is not explicitly stated.",
      snippet: ""
    });
  }
  if (!hasScope) {
    findings.push({
      type: "assumption",
      category: "completeness",
      message: "Target actor, component, or resource scope is not explicitly named.",
      snippet: ""
    });
  }
  if (!hasFailureState && detectedKeywords.some(k => k.includes("MUST"))) {
    findings.push({
      type: "inference",
      category: "completeness",
      message: "Missing explicit failure state (e.g., 'fail closed', 'deny and log event').",
      snippet: ""
    });
    findings.push({
      type: "recommendation",
      category: "completeness",
      message: "Explicitly state the fallback/fail-closed behavior when validation fails.",
      snippet: ""
    });
  }

  // 5. Trust Boundary and Security Risks
  for (const tb of TRUST_BOUNDARY_PATTERNS) {
    if (tb.pattern.test(trimmed)) {
      findings.push({
        type: "fact",
        category: "security",
        message: `Security boundary concern identified: ${tb.label}.`,
        snippet: tb.pattern.exec(trimmed)?.[0] || ""
      });
    }
  }

  // 6. Propose Governed Optimization Formulation
  let action = "KEEP";
  let proposedText = trimmed;
  let reason = "Rule satisfies atomicity and normative structure.";

  if (isCompound) {
    action = "SPLIT";
    reason = "Decompose compound rule into atomic obligations.";
    // Simple decomposition proposal
    const clauses = trimmed.split(/\band also\b|\bfurthermore\b|\b;\s*and\b/i);
    if (clauses.length > 1) {
      proposedText = clauses
        .map((c, idx) => `Sub-rule ${ruleId}.${idx + 1}: ${c.trim()}`)
        .join("\n\n");
    }
  } else if (detectedAmbiguities.length > 0 || !hasFailureState || detectedKeywords.length === 0) {
    action = "REWRITE";
    reason = "Clarify ambiguous adjectives, reinforce BCP 14 normative keyword, and specify fail-closed outcome.";
    let rewritten = trimmed;
    if (detectedKeywords.length === 0) {
      rewritten = `The agent MUST ${rewritten.charAt(0).toLowerCase() + rewritten.slice(1)}`;
    }
    if (!hasFailureState) {
      rewritten = `${rewritten.replace(/\.?$/, "")}; otherwise the operation MUST fail closed and return DENY.`;
    }
    for (const amb of detectedAmbiguities) {
      rewritten = rewritten.replace(new RegExp(`\\b${amb}\\b`, "gi"), `[OPERATIONAL_CRITERIA_REQUIRED /* ${amb} */]`);
    }
    proposedText = rewritten;
  }

  const diff = createUnifiedDiff(trimmed, proposedText, ruleId);

  const proposal = {
    action,
    ruleId,
    original_text: trimmed,
    proposed_text: proposedText,
    diff,
    reason,
    affected_references: [ruleId],
    test_requirements: [
      `Positive case: test valid condition triggers expected behavior for ${ruleId}`,
      `Negative case: test invalid condition triggers fail-closed/DENY for ${ruleId}`,
      `Boundary/injection case: test unauthorized bypass attempt on ${ruleId}`
    ],
    approval_status: "PENDING_OWNER_REVIEW"
  };

  return {
    ruleId,
    timestamp: new Date().toISOString(),
    source_hash: crypto.createHash("sha256").update(trimmed).digest("hex"),
    detected_bcp14: detectedKeywords,
    ambiguities: detectedAmbiguities,
    completeness: {
      has_trigger: hasTrigger,
      has_scope: hasScope,
      has_failure_state: hasFailureState
    },
    findings,
    proposal
  };
}
