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

  // 2. Normative Force
  let force = "MUST";
  if (/لا يجوز|يمنع|يحظر|ممنوع|must not|never|prohibit|forbidden/i.test(lower)) {
    force = "MUST_NOT";
  } else if (/ينبغي|يستحسن|يفضل|يوصى|should|recommend|prefer/i.test(lower)) {
    force = "SHOULD";
  } else if (/ملاحظة|بيان|إشارة|note|info|observation/i.test(lower)) {
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
  }

  return { domain, force, locus, intent, scope: "PROJECT" };
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
 * Reconcile atomic statement with existing AGHR rules.
 */
export function reconcileWithRules(statement, classification) {
  const allRules = governanceService.getRules();
  const lower = statement.toLowerCase();

  const relatedRules = new Set();
  let conflictDetected = false;
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

    // Check conflict: opposing force or explicitly prohibiting a MUST rule
    if (
      (rule.force === "MUST" && (classification.force === "MUST_NOT" || /لا يجوز|يمنع|يحظر/i.test(statement))) ||
      (rule.force === "MUST_NOT" && classification.force === "MUST")
    ) {
      conflictDetected = true;
    }

    if (rule.text.toLowerCase().includes(lower.slice(0, 30)) || lower.includes(rule.title.toLowerCase())) {
      duplicateDetected = true;
    }
  }

  const relatedArray = Array.from(relatedRules);
  let proposedAction = "ADD";
  let rationale = "New distinct requirement proposed.";

  if (conflictDetected) {
    proposedAction = "REJECT";
    rationale = `Conflicts with existing governing rule(s): ${relatedArray.join(", ")}. Requires explicit authority exception.`;
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
    duplicateDetected,
    proposedAction,
    rationale,
  };
}

/**
 * Intake and Change Management Service.
 */
class IntakeService {
  constructor() {
    ensureStorageDir();
  }

  submitIntake({ rawText, author = "USER", source = "UI_INTAKE", metadata = {} }) {
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
        enforcementLocus: classification.locus,
        intent: classification.intent,
        scope: classification.scope,
        relatedRules: reconciliation.relatedRuleIds,
        conflict: reconciliation.conflictDetected,
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
      rawDigestSha256: digest,
      rawText: trimmed,
      metadata,
      status: "PROPOSED_READY_FOR_REVIEW",
      authorityRequired: "PROJECT_OWNER_OR_HOST_AUTHORITY",
      changeItems,
    };

    // Save to disk
    const filePath = path.join(INTAKE_STORAGE_DIR, `${packetId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(packet, null, 2), "utf8");

    return packet;
  }

  listPackets() {
    ensureStorageDir();
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
    ensureStorageDir();
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
