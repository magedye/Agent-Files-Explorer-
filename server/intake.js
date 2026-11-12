import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PROJECT_ROOT } from "./security.js";
import { governanceService } from "./governance.js";

const INTAKE_STORAGE_DIR = path.join(PROJECT_ROOT, ".governance", "intake");

function ensureStorageDir() {
  if (!fs.existsSync(INTAKE_STORAGE_DIR)) {
    fs.mkdirSync(INTAKE_STORAGE_DIR, { recursive: true });
  }
}

/**
 * Split compound text into atomic statements (Arabic and English aware).
 */
export function decomposeIntoAtomicStatements(rawText) {
  if (!rawText || typeof rawText !== "string") return [];

  // Clean lines and handle bullet points, numbered lists, newlines, and punctuation
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const statements = [];

  for (const line of lines) {
    // Strip bullet markers e.g. "- ", "* ", "1. ", "(1)"
    const strippedLine = line.replace(/^([*•\-–—]|\d+[\.\)]|\([0-9]+\))\s*/, "").trim();
    if (!strippedLine) continue;

    // Split compound sentences by strong sentence terminators and conjunctions
    const parts = strippedLine
      .split(/(?<=[.!?؛؟])\s+|(?<=\s)(?:بالإضافة إلى ذلك|علاوة على ذلك|كذلك يجب|ويجب أيضاً|Furthermore,|Moreover,)(?=\s)/i)
      .map((p) => p.trim())
      .filter((p) => p.length > 3);

    for (const part of parts) {
      statements.push(part);
    }
  }

  return statements.length > 0 ? statements : [rawText.trim()];
}

// Normative-force polarity and rank, shared by the classifier and the
// reconciliation engine. Polarity distinguishes POSITIVE obligations from
// NEGATIVE prohibitions/discouragements; NEUTRAL marks the absence of a
// positive obligation (NOT_REQUIRED) or non-normative text (INFO).
const FORCE_POLARITY = {
  MUST: "POSITIVE",
  MUST_NOT: "NEGATIVE",
  SHOULD: "POSITIVE",
  SHOULD_NOT: "NEGATIVE",
  MAY: "POSITIVE",
  NOT_REQUIRED: "NEUTRAL",
  INFO: "NEUTRAL",
  REVIEW_REQUIRED: "UNKNOWN",
};

const FORCE_RANK = {
  MUST: 3,
  MUST_NOT: 3,
  SHOULD: 2,
  SHOULD_NOT: 2,
  MAY: 1,
  NOT_REQUIRED: 0,
};

function polarityOf(force) {
  return FORCE_POLARITY[force] || "UNKNOWN";
}

/**
 * Heuristic classifier according to Skill Steward SACP 2-layer model.
 */
export function classifyStatement(statement) {
  const lower = statement.toLowerCase();

  // 1. Domain Concern
  let domain = "REQ"; // Default Requirement
  if (/معنى|دلال|جذر|مفرد|اشتقاق|semantic|meaning|lexicon/i.test(statement)) {
    domain = "SEM";
  } else if (/دليل|شاهد|برهان|توثيق|بينة|evidence|proof|citation/i.test(statement)) {
    domain = "EVD";
  } else if (/اعتراض|نقد|خلاف|شبهة|إشكال|objection|counterexample/i.test(statement)) {
    domain = "OBJ";
  } else if (/تصحيح|تعديل|صواب|خطأ|correction|fix|amendment/i.test(statement)) {
    domain = "COR";
  } else if (/منهج|ضابط|قاعدة|أصل|مبدأ|methodology|principle|rule/i.test(statement)) {
    domain = "MTH";
  } else if (/سؤال|استفهام|مسألة مفتوحة|بحاجة لتحقيق|open question|unresolved/i.test(statement)) {
    domain = "OPEN";
  } else if (/اختبار|فحص|تراجع|تحقق|test|eval|check|regression/i.test(statement)) {
    domain = "TEST";
  }

  // 2. Normative Force — negation-aware, ordered from most binding to least.
  //    Negation patterns are checked BEFORE positive keywords so that "لا يجب",
  //    "shall not", "should not" and "not required" resolve to the negative form
  //    instead of the positive one. Ambiguous or unrecognized statements default
  //    to REVIEW_REQUIRED (previously "PROPOSED", which conflated a review status
  //    with a normative force).
  let force = "REVIEW_REQUIRED";

  // AMBIGUOUS — mixed or ambiguous normative signals route to review rather
  // than a definitive force. "لا يجب" is ambiguous between a prohibition
  // ("must not") and an absence of obligation ("need not"); "should not be
  // required" mixes a negative recommendation with an obligation keyword.
  if (
    /لا\s*يجب|should\s+not\s+be\s+(required|necessary|mandatory|obligatory)/i.test(lower)
  ) {
    force = "REVIEW_REQUIRED";
  }
  // MUST_NOT — binding prohibition (unambiguous negations)
  else if (
    /لا\s*(يجوز|يمكن)|(يجب|يلزم)\s*(عدم|ألا)|يمنع|يحظر|ممنوع|محرّم|محرم/i.test(lower) ||
    /must\s+not|mustn'?t|shall\s+not|prohibit(ed)?|forbidden|never/i.test(lower)
  ) {
    force = "MUST_NOT";
  }
  // SHOULD_NOT — discouraged
  else if (
    /لا\s*(ينبغي|يستحسن|يفضل|يُفضل)|(ينبغي|يستحسن)\s+عدم/i.test(lower) ||
    /should\s+not|shouldn'?t|not\s+recommended|recommended\s+against/i.test(lower)
  ) {
    force = "SHOULD_NOT";
  }
  // NOT_REQUIRED — explicitly not a requirement
  else if (
    /غير\s+(مطلوب|ضروري|إلزامي)|ليس\s+(مطلوب|ضرور)|لا\s*(يشترط|يتطلب|يلزم)/i.test(lower) ||
    /not\s+required|no\s+longer\s+required|not\s+(necessary|obligatory|mandatory)|unnecessary/i.test(lower)
  ) {
    force = "NOT_REQUIRED";
  }
  // MAY — permission / optional
  else if (
    /يجوز|يمكن|مسموح|اختياري/i.test(lower) ||
    /\bmay\b|permitted|allowed|optional|optionally|at\s+your\s+discretion/i.test(lower)
  ) {
    force = "MAY";
  }
  // MUST — binding obligation
  else if (
    /يجب|يلزم|مفروض|إلزامي|ضروري|فرض/i.test(lower) ||
    /must|shall|required|mandatory|obligatory/i.test(lower)
  ) {
    force = "MUST";
  }
  // SHOULD — recommendation
  else if (
    /ينبغي|يستحسن|يُفضل|يوصى/i.test(lower) ||
    /should|recommend(ed)?/i.test(lower)
  ) {
    force = "SHOULD";
  }
  // INFO — non-normative informational observation (retained for compatibility)
  else if (
    /ملاحظة|بيان|إشارة|توضيح|note|info|observation/i.test(lower)
  ) {
    force = "INFO";
  }

  // 3. Enforcement Locus
  let locus = "OPERATING_PROCEDURE";
  if (/أداة|سكربت|أتمتة|فاحص|كود|tool|script|schema|automated|ci/i.test(lower)) {
    locus = "VALIDATION_TOOL";
  } else if (/تعليمات|برومبت|وكيل|نموذج|prompt|agent|model|instruction/i.test(lower)) {
    locus = "MODEL_INSTRUCTION";
  } else if (/تهيئة|مضيف|صلاحية|بيئة|host|adapter|config|environment/i.test(lower)) {
    locus = "HOST_CONFIG";
  }

  // 4. Intent
  let intent = "ADD_RULE";
  if (domain === "OBJ" || domain === "COR") {
    intent = "STRENGTHEN_RULE";
  } else if (domain === "TEST") {
    intent = "ADD_TEST";
  } else if (force === "INFO") {
    intent = "OBSERVATION";
  } else if (force === "REVIEW_REQUIRED") {
    intent = "REVIEW_REQUIRED";
  }

  // Polarity (derived from force) and conditional/exception detection complete
  // the semantic contract shared with reconcileWithRules.
  const polarity = polarityOf(force);
  const conditional = /unless|except|provided that|on condition|باستثناء|إلا|شريطة|بشرط|على شرط|عندما/i.test(statement);

  return { domain, force, polarity, conditional, locus, intent, scope: "PROJECT" };
}

const CONCEPT_MAPPINGS = [
  { terms: ["مطور", "المطور", "developer", "official developer"], ruleIds: ["AGHR-001"] },
  { terms: ["سلطة", "صلاحية", "authority", "chain of command"], ruleIds: ["AGHR-002", "AGHR-004"] },
  { terms: ["دليل", "أدلة", "شاهد", "شواهد", "evidence", "reality"], ruleIds: ["AGHR-003"] },
  { terms: ["ترقية", "اعتماد تلقائي", "promotion"], ruleIds: ["AGHR-004"] },
  { terms: ["حفظ", "تعديل غير مصرح", "preservation", "unsolicited"], ruleIds: ["AGHR-005"] },
  { terms: ["اختبار", "فحص", "test", "verification"], ruleIds: ["AGHR-006"] },
  { terms: ["أمان", "حماية", "security", "containment"], ruleIds: ["AGHR-007"] },
];

/**
 * Classify the semantic opposition between an existing rule's force and a
 * proposed statement's force. Uses typed polarity + rank, never raw text.
 *
 *  - CONTRADICTION: opposite polarity, rule at binding-or-recommended rank.
 *  - WEAKENING: positive obligation downgraded or removed (NOT_REQUIRED).
 *  - null: consistent (no opposition), including MUST_NOT↔NOT_REQUIRED and
 *    MUST_NOT↔SHOULD_NOT, which are NOT conflated with a prohibition.
 */
function classifyOpposition(ruleForce, proposalForce) {
  const rp = polarityOf(ruleForce);
  const pp = polarityOf(proposalForce);
  const opposite = (rp === "POSITIVE" && pp === "NEGATIVE") || (rp === "NEGATIVE" && pp === "POSITIVE");
  if (opposite && (FORCE_RANK[ruleForce] ?? 0) >= 2) {
    return "CONTRADICTION";
  }
  if (rp === "POSITIVE" && pp === "POSITIVE" && (FORCE_RANK[proposalForce] ?? 0) < (FORCE_RANK[ruleForce] ?? 0)) {
    return "WEAKENING";
  }
  if (rp === "POSITIVE" && proposalForce === "NOT_REQUIRED") {
    return "WEAKENING";
  }
  return null;
}

/**
 * Reconcile atomic statement with existing AGHR rules.
 */
export function reconcileWithRules(statement, classification) {
  const allRules = governanceService.getRules();
  const lower = statement.toLowerCase();

  const relatedRules = new Set();
  let conflictDetected = false;
  let conflictType = null;
  let requiresReview = false;
  let duplicateDetected = false;

  // 1. Concept dictionary matches
  for (const cm of CONCEPT_MAPPINGS) {
    if (cm.terms.some((t) => lower.includes(t))) {
      for (const rid of cm.ruleIds) relatedRules.add(rid);
    }
  }

  // 2. English text overlap matches
  for (const rule of allRules) {
    const ruleTitle = rule.title.toLowerCase();
    const ruleText = rule.text.toLowerCase();

    const keywords = ruleTitle.split(/\s+/).filter((w) => w.length > 4);
    if (keywords.some((k) => lower.includes(k)) || lower.includes(rule.id.toLowerCase())) {
      relatedRules.add(rule.id);
    }
  }

  for (const rid of relatedRules) {
    const rule = allRules.find((r) => r.id === rid);
    if (!rule) continue;

    // Classify opposition using typed force (polarity + rank), never raw text.
    const opposition = classifyOpposition(rule.force, classification.force);
    if (opposition === "CONTRADICTION") {
      conflictDetected = true;
      conflictType = "CONTRADICTION";
    } else if (opposition === "WEAKENING" && conflictType !== "CONTRADICTION") {
      conflictType = "WEAKENING";
      requiresReview = true;
    }

    if (rule.text.toLowerCase().includes(lower.slice(0, 30)) || lower.includes(rule.title.toLowerCase())) {
      duplicateDetected = true;
    }
  }

  const relatedArray = Array.from(relatedRules);
  const isConditional = classification.conditional === true;

  let proposedAction = "ADD";
  let rationale = "New distinct requirement proposed.";

  // A conditional contradiction is never a final REJECT: it is routed to owner
  // review. An unconditional contradiction remains a proposed (not final) REJECT.
  if (conflictDetected && !isConditional) {
    proposedAction = "REJECT";
    rationale = `Contradicts existing governing rule(s): ${relatedArray.join(", ")}. Requires explicit authority exception.`;
  } else if (conflictDetected && isConditional) {
    proposedAction = "REVIEW_REQUIRED";
    rationale = `Conditional contradiction with existing rule(s): ${relatedArray.join(", ")}. The condition must be evaluated by the owner before any disposition.`;
    requiresReview = true;
  } else if (requiresReview) {
    proposedAction = "WEAKENING_REVIEW";
    rationale = `Weakens or removes an existing governing rule: ${relatedArray.join(", ")}. Downgrading a rule requires owner review.`;
  } else if (classification.force === "REVIEW_REQUIRED" && relatedArray.length > 0) {
    proposedAction = "REVIEW_REQUIRED";
    rationale = `Ambiguous normative signal with related rule(s): ${relatedArray.join(", ")}. Polarity/strength match alone is not sufficient evidence of a definitive conflict; owner review required.`;
    requiresReview = true;
  } else if (duplicateDetected) {
    proposedAction = "MERGE";
    rationale = `Subsumed by or overlaps with existing rule(s): ${relatedArray.join(", ")}. Recommend merging rather than duplicating.`;
  } else if (relatedArray.length > 0) {
    proposedAction = "STRENGTHEN";
    rationale = `Complements or refines existing rule(s): ${relatedArray.join(", ")}.`;
  }

  return {
    relatedRuleIds: relatedArray,
    conflictDetected,
    conflictType,
    requiresReview,
    duplicateDetected,
    proposedAction,
    rationale,
  };
}

/**
 * Intake and Change Management Service.
 */
class IntakeService {
  submitIntake({ rawText, author = "USER", source = "UI_INTAKE", metadata = {}, sourceId = null, domain = null, targetPackageId = null }) {
    if (!rawText || !rawText.trim()) {
      throw new Error("Intake text cannot be empty");
    }

    const trimmed = rawText.trim();
    const digest = crypto.createHash("sha256").update(trimmed).digest("hex");
    const intakeId = `INTAKE-${Date.now().toString(36).toUpperCase()}-${digest.slice(0, 6)}`;
    const packetId = `CP-${Date.now().toString(36).toUpperCase()}`;

    // 1. Atomic decomposition
    const atomicStatements = decomposeIntoAtomicStatements(trimmed);

    // 2. Classify and Reconcile each item
    const changeItems = atomicStatements.map((stmt, idx) => {
      const classification = classifyStatement(stmt);
      const reconciliation = reconcileWithRules(stmt, classification);

      return {
        itemId: `${packetId}-ITEM-${String(idx + 1).padStart(2, "0")}`,
        sourceOffset: idx,
        statement: stmt,
        domainConcern: classification.domain,
        normativeForce: classification.force,
        polarity: classification.polarity,
        conditional: classification.conditional,
        enforcementLocus: classification.locus,
        intent: classification.intent,
        scope: classification.scope,
        relatedRules: reconciliation.relatedRuleIds,
        conflict: reconciliation.conflictDetected,
        conflictType: reconciliation.conflictType,
        requiresReview: reconciliation.requiresReview,
        duplicate: reconciliation.duplicateDetected,
        proposedAction: reconciliation.proposedAction,
        rationale: reconciliation.rationale,
        status: "PROPOSED", // Always starts as PROPOSED; no self-approval
      };
    });

    const packet = {
      packetId,
      intakeId,
      createdAt: new Date().toISOString(),
      author,
      source,
      sourceId,
      domain,
      targetPackageId,
      rawDigestSha256: digest,
      rawText: trimmed,
      metadata,
      status: "PROPOSED_READY_FOR_REVIEW",
      authorityRequired: "PROJECT_OWNER_OR_HOST_AUTHORITY",
      changeItems,
    };

    // Save to disk
    ensureStorageDir();
    const filePath = path.join(INTAKE_STORAGE_DIR, `${packetId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(packet, null, 2), "utf8");

    return packet;
  }

  listPackets() {
    if (!fs.existsSync(INTAKE_STORAGE_DIR)) return [];
    const files = fs.readdirSync(INTAKE_STORAGE_DIR).filter((f) => f.endsWith(".json"));
    const packets = [];
    for (const f of files) {
      try {
        const content = fs.readFileSync(path.join(INTAKE_STORAGE_DIR, f), "utf8");
        packets.push(JSON.parse(content));
      } catch {}
    }
    packets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return packets;
  }

  getPacket(packetId) {
    if (!fs.existsSync(INTAKE_STORAGE_DIR)) return null;
    // Reject identifiers that could escape the intake dir (path separators,
    // traversal, or absolute paths). Packet IDs are generated as CP-<token>.
    if (typeof packetId !== "string" || !/^[A-Za-z0-9_-]+$/.test(packetId)) return null;
    const filePath = path.join(INTAKE_STORAGE_DIR, `${packetId}.json`);
    if (!fs.existsSync(filePath)) return null;
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
      return null;
    }
  }
}

export const intakeService = new IntakeService();
