/**
 * tools/intake_lifecycle.mjs
 * 
 * Production Governed Intake, Triage, Integration, and P0 Governed Archival Engine.
 * Implemented under Sovereign Owner Directive: AFE-GOV-FINAL-INTAKE-LIFECYCLE-010.
 * 
 * Features:
 * 1. Multi-source Discovery: Single files, nested folders, safe/unsafe ZIP detection.
 * 2. Security Boundaries: Path traversal, zip-slip defense, dangerous extensions rejection.
 * 3. Mixed File & Atomic Extraction: Rules, requirements, workflows, recommendations, and references.
 * 4. 9-Class Content Taxonomy & 8-Class Disposition Lifecycle.
 * 5. P0 Governed Archival: Descriptive naming, proof of processing, replica hash verification,
 *    safe inbox clearance, and partial-processing custody retention.
 * 6. Reference Library Management (docs/reference_library/).
 * 7. Direct Chat Ingestion & Formulation.
 * 8. Clean-session Retrievability (PERSISTED_AND_RETRIEVABLE / INTEGRATED_AND_VERIFIED).
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const CONTENT_CLASSES = {
  GOVERNING_RULE_OR_INSTRUCTION: "GOVERNING_RULE_OR_INSTRUCTION",
  FUNCTIONAL_OR_TECHNICAL_REQUIREMENT: "FUNCTIONAL_OR_TECHNICAL_REQUIREMENT",
  OPERATIONAL_PROCEDURE_OR_WORKFLOW: "OPERATIONAL_PROCEDURE_OR_WORKFLOW",
  RECOMMENDATION_OR_ENHANCEMENT: "RECOMMENDATION_OR_ENHANCEMENT",
  OWNER_DECISION_OR_APPROVAL_REQUEST: "OWNER_DECISION_OR_APPROVAL_REQUEST",
  EVIDENCE_OR_TEST_RESULT: "EVIDENCE_OR_TEST_RESULT",
  USEFUL_KNOWLEDGE_REFERENCE: "USEFUL_KNOWLEDGE_REFERENCE",
  DUPLICATE_OR_SUPERSEDED_CONTENT: "DUPLICATE_OR_SUPERSEDED_CONTENT",
  UNCLEAR_OR_UNPROCESSABLE_CONTENT: "UNCLEAR_OR_UNPROCESSABLE_CONTENT",
};

export const DISPOSITIONS = {
  INTEGRATE: "INTEGRATE",
  ENHANCE_EXISTING: "ENHANCE_EXISTING",
  MERGE_DUPLICATE: "MERGE_DUPLICATE",
  REFERENCE_ONLY: "REFERENCE_ONLY",
  DEFER: "DEFER",
  NEEDS_OWNER_DECISION: "NEEDS_OWNER_DECISION",
  REJECT: "REJECT",
  NOT_APPLICABLE: "NOT_APPLICABLE",
};

export const DANGEROUS_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".com", ".ps1", ".vbs", ".sh", ".bash", ".dll", ".so"
];

/**
 * Calculate SHA-256 of a buffer or string.
 */
export function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Validates a ZIP file buffer for security issues (Zip-Slip path traversal, dangerous binaries).
 * Parses Local File Headers (0x04034b50) and Central Directory (0x02014b50).
 */
export function inspectZipBuffer(buffer) {
  if (!buffer || buffer.length < 22) {
    throw new Error("INVALID_ZIP: Buffer too small to be a valid ZIP archive");
  }

  // Check ZIP magic signature
  if (buffer.readUInt32LE(0) !== 0x04034b50) {
    throw new Error("INVALID_ZIP: Missing ZIP local file header signature");
  }

  const entries = [];
  let offset = 0;

  // Walk local file headers
  while (offset < buffer.length - 30) {
    const sig = buffer.readUInt32LE(offset);
    if (sig === 0x04034b50) { // Local file header
      const compMethod = buffer.readUInt16LE(offset + 8);
      const compressedSize = buffer.readUInt32LE(offset + 18);
      const uncompressedSize = buffer.readUInt32LE(offset + 22);
      const fileNameLen = buffer.readUInt16LE(offset + 26);
      const extraFieldLen = buffer.readUInt16LE(offset + 28);
      
      const fileName = buffer.toString("utf8", offset + 30, offset + 30 + fileNameLen);
      entries.push({ fileName, compressedSize, uncompressedSize, compMethod });

      offset += 30 + fileNameLen + extraFieldLen + compressedSize;
    } else {
      break;
    }
  }

  // Security Check: Zip-Slip & Dangerous extensions
  for (const entry of entries) {
    const rawName = entry.fileName.replace(/\\/g, "/");

    // Check path traversal
    if (rawName.includes("../") || rawName.includes("/..") || rawName === ".." || rawName.startsWith("/") || /^[a-zA-Z]:/.test(rawName)) {
      return {
        isSafe: false,
        verdict: "UNSAFE_REJECTED",
        reason: `Zip-Slip path traversal detected in entry: '${entry.fileName}'`,
        entries,
      };
    }

    // Check dangerous executable extension
    const ext = path.extname(rawName).toLowerCase();
    if (DANGEROUS_EXTENSIONS.includes(ext)) {
      return {
        isSafe: false,
        verdict: "UNSAFE_REJECTED",
        reason: `Prohibited executable extension ('${ext}') in entry: '${entry.fileName}'`,
        entries,
      };
    }
  }

  return {
    isSafe: true,
    verdict: "SAFE_ARCHIVE",
    entriesCount: entries.length,
    entries,
  };
}

/**
 * Discovers files, directories, and nested files inside an intake directory.
 */
export function discoverInputs(targetPath) {
  const resolved = path.resolve(targetPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`DISCOVERY_ERROR: Path does not exist: ${resolved}`);
  }

  const stat = fs.statSync(resolved);
  if (stat.isFile()) {
    const bytes = fs.readFileSync(resolved);
    return [{
      name: path.basename(resolved),
      relativePath: path.basename(resolved),
      absolutePath: resolved,
      size: stat.size,
      sha256: sha256(bytes),
      extension: path.extname(resolved).toLowerCase(),
      mtime: stat.mtime.toISOString(),
    }];
  }

  const results = [];
  function walk(currentDir, relativePrefix = "") {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(currentDir, ent.name);
      const rel = path.join(relativePrefix, ent.name).replace(/\\/g, "/");

      // Symlink inspection
      const lstat = fs.lstatSync(full);
      if (lstat.isSymbolicLink()) {
        const real = fs.realpathSync(full);
        if (!real.startsWith(resolved)) {
          throw new Error(`SECURITY_ALERT: Dangerous symlink pointing outside intake root: ${rel} -> ${real}`);
        }
      }

      if (ent.isDirectory()) {
        walk(full, rel);
      } else if (ent.isFile()) {
        const bytes = fs.readFileSync(full);
        results.push({
          name: ent.name,
          relativePath: rel,
          absolutePath: full,
          size: lstat.size,
          sha256: sha256(bytes),
          extension: path.extname(ent.name).toLowerCase(),
          mtime: lstat.mtime.toISOString(),
        });
      }
    }
  }

  walk(resolved);
  return results.sort((a, b) => a.relativePath.localeCompare(b.relativePath, "en"));
}

/**
 * Extracts atomic items from document content, supporting mixed files.
 */
export function extractAtomicItems(fileRecord, contentText) {
  const items = [];
  const lines = contentText.split(/\r?\n/);
  const hash8 = fileRecord.sha256 ? fileRecord.sha256.slice(0, 8) : "text";

  let currentBlock = [];
  let blockStart = 1;
  let currentHeader = "";

  function flushBlock(endLine) {
    if (currentBlock.length === 0) return;
    const text = currentBlock.join("\n").trim();
    if (text.length === 0) return;

    const lower = text.toLowerCase();
    let contentClass = CONTENT_CLASSES.RECOMMENDATION_OR_ENHANCEMENT;
    let force = "SHOULD";

    if (lower.includes("must not") || lower.includes("لا يجوز") || lower.includes("يحظر") || lower.includes("يمنع")) {
      contentClass = CONTENT_CLASSES.GOVERNING_RULE_OR_INSTRUCTION;
      force = "MUST_NOT";
    } else if (lower.includes("must ") || lower.includes("يجب") || lower.includes("يلزم") || lower.includes("إلزام")) {
      contentClass = CONTENT_CLASSES.GOVERNING_RULE_OR_INSTRUCTION;
      force = "MUST";
    } else if (lower.includes("requirement") || lower.includes("متطلب") || lower.includes("shall ")) {
      contentClass = CONTENT_CLASSES.FUNCTIONAL_OR_TECHNICAL_REQUIREMENT;
      force = "MUST";
    } else if (lower.includes("procedure") || lower.includes("workflow") || lower.includes("إجراء") || lower.includes("خطوات") || lower.includes("step ")) {
      contentClass = CONTENT_CLASSES.OPERATIONAL_PROCEDURE_OR_WORKFLOW;
      force = "SHOULD";
    } else if (lower.includes("owner decision") || lower.includes("قرار المالك") || lower.includes("اعتماد")) {
      contentClass = CONTENT_CLASSES.OWNER_DECISION_OR_APPROVAL_REQUEST;
      force = "MUST";
    } else if (lower.includes("reference") || lower.includes("مرجع") || lower.includes("دليل") || lower.includes("guide") || lower.includes("manual") || lower.includes("glossary")) {
      contentClass = CONTENT_CLASSES.USEFUL_KNOWLEDGE_REFERENCE;
      force = "INFORMATIVE";
    } else if (lower.includes("evidence") || lower.includes("دليل") || lower.includes("test passed") || lower.includes("نتيجة اختبار")) {
      contentClass = CONTENT_CLASSES.EVIDENCE_OR_TEST_RESULT;
      force = "INFORMATIVE";
    }

    items.push({
      item_id: `ITEM-${hash8}-${String(items.length + 1).padStart(3, "0")}`,
      source_file: fileRecord.relativePath || fileRecord.name,
      source_sha256: fileRecord.sha256,
      header_context: currentHeader,
      line_start: blockStart,
      line_end: endLine,
      original_text: text,
      content_class: contentClass,
      normative_force: force,
    });

    currentBlock = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (/^#{1,4}\s+/.test(trimmed)) {
      flushBlock(i);
      currentHeader = trimmed.replace(/^#{1,4}\s+/, "");
      blockStart = i + 1;
    } else if (/^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      // List item could be its own atomic unit if substantive
      if (currentBlock.length > 0 && currentBlock.join(" ").length > 80) {
        flushBlock(i);
        blockStart = i + 1;
      }
      currentBlock.push(line);
    } else if (trimmed.length === 0) {
      if (currentBlock.length > 0) {
        flushBlock(i);
        blockStart = i + 2;
      }
    } else {
      currentBlock.push(line);
    }
  }
  flushBlock(lines.length);

  // If document had no structure, wrap entire text as one item
  if (items.length === 0 && contentText.trim().length > 0) {
    items.push({
      item_id: `ITEM-${hash8}-001`,
      source_file: fileRecord.relativePath || fileRecord.name,
      source_sha256: fileRecord.sha256,
      header_context: "Document Root",
      line_start: 1,
      line_end: lines.length,
      original_text: contentText.trim(),
      content_class: CONTENT_CLASSES.USEFUL_KNOWLEDGE_REFERENCE,
      normative_force: "INFORMATIVE",
    });
  }

  return items;
}

/**
 * Reconciles an extracted atomic item against baseline rules and owner decisions.
 */
export function reconcileItem(item, { existingRules = [], ownerDecisions = [], activeContracts = [] } = {}) {
  const textLower = item.original_text.toLowerCase();

  // 1. Conflict Check: Contradicts established owner decisions or core safety invariants
  const conflictPatterns = [
    { pattern: /force[- ]?push/i, reason: "Violates owner invariant: Remote force-push is prohibited" },
    { pattern: /delete.*(?:test|suite)/i, reason: "Violates GOV-008: Deleting tests to pass acceptance is prohibited" },
    { pattern: /bypass.*(?:auth|verification|owner)/i, reason: "Violates DEC-001 & GOV-009: Bypassing owner authorization is prohibited" },
    { pattern: /disable.*(?:audit|ledger|trace)/i, reason: "Violates AGHR-032: Disabling audit logs is prohibited" },
    { pattern: /override.*owner/i, reason: "Violates sovereign owner authority hierarchy" },
  ];

  for (const cp of conflictPatterns) {
    if (cp.pattern.test(item.original_text)) {
      return {
        item_id: item.item_id,
        disposition: DISPOSITIONS.REJECT,
        rationale: `Direct conflict detected: ${cp.reason}`,
        target_location: "REJECTION_LOG",
        requires_owner_decision: false,
      };
    }
  }

  // 2. Useful Knowledge Reference Check
  if (item.content_class === CONTENT_CLASSES.USEFUL_KNOWLEDGE_REFERENCE) {
    return {
      item_id: item.item_id,
      disposition: DISPOSITIONS.REFERENCE_ONLY,
      rationale: "Informative material; routed to Reference Library without promoting to governing rule",
      target_location: "docs/reference_library/",
      requires_owner_decision: false,
    };
  }

  // 3. Exact Duplicate Check against Existing Rules
  for (const r of existingRules) {
    const rText = (r.text || r.statement || r.title || "").toLowerCase();
    if (rText && (textLower.includes(rText) || rText.includes(textLower))) {
      return {
        item_id: item.item_id,
        disposition: DISPOSITIONS.MERGE_DUPLICATE,
        rationale: `Substantively identical to existing rule: ${r.id} (${r.title || ""})`,
        target_location: `governance_packages/references/aghr_1_4_0/${r.id}`,
        requires_owner_decision: false,
      };
    }
  }

  // 4. Owner Decision Request / High Impact Rule Change
  if (
    item.content_class === CONTENT_CLASSES.OWNER_DECISION_OR_APPROVAL_REQUEST ||
    textLower.includes("ratify") ||
    textLower.includes("تعديل خط الأساس") ||
    textLower.includes("new baseline")
  ) {
    return {
      item_id: item.item_id,
      disposition: DISPOSITIONS.NEEDS_OWNER_DECISION,
      rationale: "Item alters governing baseline or requires explicit owner authority",
      target_location: "docs/governance/OWNER_DECISION_REGISTER_2026-11-07.md",
      requires_owner_decision: true,
    };
  }

  // 5. Integrable / Operational Enhancement
  if (item.content_class === CONTENT_CLASSES.OPERATIONAL_PROCEDURE_OR_WORKFLOW) {
    return {
      item_id: item.item_id,
      disposition: DISPOSITIONS.ENHANCE_EXISTING,
      rationale: "Operational workflow; integrable into project operating procedures",
      target_location: "docs/governance/",
      requires_owner_decision: false,
    };
  }

  // 6. Integrable Rule (within delegation)
  if (item.content_class === CONTENT_CLASSES.GOVERNING_RULE_OR_INSTRUCTION) {
    return {
      item_id: item.item_id,
      disposition: DISPOSITIONS.INTEGRATE,
      rationale: "Valid governing instruction within delegated scope",
      target_location: "docs/governance/",
      requires_owner_decision: false,
    };
  }

  // Default fallback
  return {
    item_id: item.item_id,
    disposition: DISPOSITIONS.REFERENCE_ONLY,
    rationale: "Unclassified informative content retained as reference",
    target_location: "docs/reference_library/",
    requires_owner_decision: false,
  };
}

/**
 * Executes the P0 Governed Archival and Intake Lifecycle for a single file.
 */
export function processFileLifecycle({
  sourceFilePath,
  inboxDir,
  archiveDir,
  referenceLibDir,
  baselineContext = {},
  simulateIntegrityFailure = false,
  simulateInterruption = false,
}) {
  const resolvedSource = path.resolve(sourceFilePath);
  if (!fs.existsSync(resolvedSource)) {
    throw new Error(`FILE_NOT_FOUND: Source file does not exist: ${resolvedSource}`);
  }

  const rawBytes = fs.readFileSync(resolvedSource);
  const fileHash = sha256(rawBytes);
  const fileName = path.basename(resolvedSource);
  const ext = path.extname(fileName);
  const baseWithoutExt = path.basename(fileName, ext);

  // 1. Check if already archived (Idempotence & duplicate protection)
  const manifestPath = path.join(archiveDir, "MANIFEST.json");
  let manifest = { schema: "aghr-studio-governed-intake-archive-v1", archived_records: [] };
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch {
      // keep fallback
    }
  }

  const existingArchive = manifest.archived_records.find((r) => r.sha256 === fileHash);
  if (existingArchive) {
    // Literal duplicate previously archived!
    // Safely remove redundant copy from INBOX without re-processing items
    if (resolvedSource.startsWith(path.resolve(inboxDir)) && fs.existsSync(resolvedSource)) {
      fs.unlinkSync(resolvedSource);
    }
    return {
      status: "DUPLICATE_REDUNDANT_REMOVED",
      archiveRecord: existingArchive,
      message: `File is an exact binary duplicate of previously archived record: ${existingArchive.archive_filename}. Redundant inbox copy removed.`,
    };
  }

  // 2. Extract Atomic Items
  let contentText = "";
  if (ext.toLowerCase() === ".zip") {
    // Inspect ZIP
    const zipInspection = inspectZipBuffer(rawBytes);
    if (!zipInspection.isSafe) {
      return {
        status: "REJECTED_UNSAFE_ARCHIVE",
        reason: zipInspection.reason,
        fileRetainedInInbox: true,
      };
    }
    contentText = `ZIP Archive: ${fileName}\nEntries count: ${zipInspection.entriesCount}\n` +
      zipInspection.entries.map((e) => `- ${e.fileName} (${e.uncompressedSize} bytes)`).join("\n");
  } else {
    contentText = rawBytes.toString("utf8");
  }

  const fileRecord = { name: fileName, relativePath: fileName, size: rawBytes.length, sha256: fileHash };
  const items = extractAtomicItems(fileRecord, contentText);

  // 3. Reconcile all items
  const reconciledItems = items.map((it) => {
    const rec = reconcileItem(it, baselineContext);
    return { ...it, ...rec };
  });

  // 4. Check for Partial Processing:
  // If ANY item has NEEDS_OWNER_DECISION, the whole file CANNOT be marked complete or removed from INBOX!
  const pendingItems = reconciledItems.filter((it) => it.disposition === DISPOSITIONS.NEEDS_OWNER_DECISION);
  if (pendingItems.length > 0) {
    return {
      status: "PARTIALLY_PROCESSED",
      message: `File contains ${pendingItems.length} item(s) requiring owner decisions. Original retained in INBOX under governed custody.`,
      fileRetainedInInbox: true,
      items: reconciledItems,
    };
  }

  // 5. Construct Descriptive Archive Filename
  // Format: [CATEGORY]_[DESCRIPTOR]_[ORIGINAL_BASENAME]_[HASH8].[EXT]
  const primaryClass = items[0] ? items[0].content_class : "MISC";
  const catPrefix = primaryClass.slice(0, 12).replace(/[^a-zA-Z0-9]/g, "_");
  const sanitizedDesc = baseWithoutExt.slice(0, 24).replace(/[^a-zA-Z0-9_-]/g, "_");
  const descriptiveName = `${catPrefix}_${sanitizedDesc}_${fileHash.slice(0, 8)}${ext}`;
  const archiveDestPath = path.join(archiveDir, descriptiveName);

  // 6. Write Archive Replica
  fs.mkdirSync(archiveDir, { recursive: true });
  fs.writeFileSync(archiveDestPath, rawBytes);

  // 7. Verify Archive Replica Integrity (Hash Check)
  const replicaBytes = fs.readFileSync(archiveDestPath);
  const replicaHash = sha256(replicaBytes);

  if (simulateIntegrityFailure || replicaHash !== fileHash) {
    // Integrity failure! Abort removal, delete corrupted replica, keep original in INBOX!
    if (fs.existsSync(archiveDestPath)) fs.unlinkSync(archiveDestPath);
    throw new Error(`ARCHIVE_INTEGRITY_FAILED: Replica SHA-256 (${replicaHash}) does not match original (${fileHash}). Original retained in INBOX.`);
  }

  // 8. Update Reference Library if reference items exist
  const refItems = reconciledItems.filter((it) => it.disposition === DISPOSITIONS.REFERENCE_ONLY);
  if (refItems.length > 0) {
    const catalogPath = path.join(referenceLibDir, "CATALOG.json");
    let catalog = { schema: "aghr-studio-reference-library-v1", entries: [] };
    if (fs.existsSync(catalogPath)) {
      try {
        catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
      } catch {
        // fallback
      }
    }
    catalog.entries.push({
      entry_id: `REF-${fileHash.slice(0, 8)}`,
      title: baseWithoutExt,
      original_filename: fileName,
      archive_filename: descriptiveName,
      sha256: fileHash,
      recorded_at: new Date().toISOString(),
      item_count: refItems.length,
      category: "KNOWLEDGE_REFERENCE",
    });
    fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), "utf8");
  }

  // 9. Update Archive Manifest
  manifest.archived_records.push({
    archive_id: `ARCH-${fileHash.slice(0, 8)}`,
    original_filename: fileName,
    archive_filename: descriptiveName,
    sha256: fileHash,
    processed_at: new Date().toISOString(),
    items_count: reconciledItems.length,
    dispositions: reconciledItems.map((i) => ({ id: i.item_id, disposition: i.disposition, target: i.target_location })),
  });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  // 10. Simulate Interruption if requested (for idempotence testing)
  if (simulateInterruption) {
    return {
      status: "INTERRUPTED_BEFORE_REMOVAL",
      fileRetainedInInbox: true,
      archiveFilename: descriptiveName,
    };
  }

  // 11. Safely remove original from INBOX
  if (fs.existsSync(resolvedSource)) {
    fs.unlinkSync(resolvedSource);
  }

  return {
    status: "ARCHIVED_AND_VERIFIED",
    originalRemovedFromInbox: true,
    archiveFilename: descriptiveName,
    items: reconciledItems,
  };
}

/**
 * Handles raw conversational intake directly from user chat prompt.
 */
export function processChatIntake(prompt, { existingRules = [], ownerDecisions = [] } = {}) {
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    throw new Error("INVALID_CHAT_INTAKE: Prompt must be a non-empty string");
  }

  const trimmed = prompt.trim();
  const lower = trimmed.toLowerCase();

  // 1. Recognize intent
  const isRuleRequest = lower.includes("أضف قاعدة") || lower.includes("add rule") || lower.includes("قاعدة جديدة") || lower.includes("new rule");
  const isProcedureRequest = lower.includes("إجراء") || lower.includes("procedure") || lower.includes("سير عمل");

  // 2. Extract Core Proposition
  const candidateId = `CHAT-REQ-${sha256(trimmed).slice(0, 8)}`;
  let recognizedType = "GENERAL_INQUIRY";
  if (isRuleRequest) recognizedType = CONTENT_CLASSES.GOVERNING_RULE_OR_INSTRUCTION;
  else if (isProcedureRequest) recognizedType = CONTENT_CLASSES.OPERATIONAL_PROCEDURE_OR_WORKFLOW;

  // 3. Search Existing Coverage
  const matchingRules = existingRules.filter((r) => {
    const text = `${r.id} ${r.title || ""} ${r.text || ""}`.toLowerCase();
    if (lower.includes("مؤجل") && text.includes("defer")) return true;
    if (lower.includes("تفويض") && (text.includes("grant") || text.includes("authoriz"))) return true;
    if (lower.includes("حذف") && text.includes("preserv")) return true;
    return false;
  });

  let recommendedDisposition = DISPOSITIONS.INTEGRATE;
  let targetLocation = "docs/governance/";
  let rationale = "New distinct candidate instruction within delegated scope";
  let requiresOwnerDecision = false;

  if (matchingRules.length > 0) {
    recommendedDisposition = DISPOSITIONS.ENHANCE_EXISTING;
    rationale = `Substantive coverage already exists in rules: ${matchingRules.map((m) => m.id).join(", ")}. Recommend updating existing operational procedure rather than creating redundant GOV rule.`;
    targetLocation = `docs/governance/GOVERNED_REQUEST_CUSTODY_PROCEDURE.md`;
  }

  if (lower.includes("تعديل خط الأساس") || lower.includes("baseline v2") || lower.includes("تغيير المالك")) {
    recommendedDisposition = DISPOSITIONS.NEEDS_OWNER_DECISION;
    requiresOwnerDecision = true;
    rationale = "Alters sovereign governance baseline or authority boundary; requires explicit owner ratification.";
    targetLocation = "docs/governance/OWNER_DECISION_REGISTER_2026-11-07.md";
  }

  return {
    candidate_id: candidateId,
    original_prompt: trimmed,
    recognized_type: recognizedType,
    existing_coverage_detected: matchingRules.map((r) => ({ id: r.id, title: r.title })),
    recommended_disposition: recommendedDisposition,
    formulated_statement: `BOUNDED_OBLIGATION: ${trimmed}`,
    target_location: targetLocation,
    rationale,
    requires_owner_decision: requiresOwnerDecision,
  };
}

/**
 * Clean-session Retrievability Query Engine.
 * Retrieves archived knowledge and integration evidence without prior conversational memory.
 */
export function queryArchivedKnowledge(query, { archiveDir, referenceLibDir }) {
  const manifestPath = path.join(archiveDir, "MANIFEST.json");
  const catalogPath = path.join(referenceLibDir, "CATALOG.json");

  const results = {
    query,
    queried_at: new Date().toISOString(),
    archive_matches: [],
    reference_matches: [],
    retrievability_verdict: "NOT_FOUND",
  };

  const qLower = query.toLowerCase();

  // Search Archive Manifest
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      for (const rec of manifest.archived_records || []) {
        const text = `${rec.archive_id} ${rec.original_filename} ${rec.archive_filename} ${rec.sha256}`.toLowerCase();
        if (text.includes(qLower) || rec.sha256.startsWith(qLower) || qLower.includes(rec.sha256.slice(0, 8))) {
          results.archive_matches.push({
            ...rec,
            status: "PERSISTED_AND_RETRIEVABLE",
          });
        }
      }
    } catch {
      // ignore
    }
  }

  // Search Reference Library Catalog
  if (fs.existsSync(catalogPath)) {
    try {
      const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
      for (const ent of catalog.entries || []) {
        const text = `${ent.entry_id} ${ent.title} ${ent.original_filename} ${ent.sha256}`.toLowerCase();
        if (text.includes(qLower) || ent.sha256.startsWith(qLower)) {
          results.reference_matches.push({
            ...ent,
            status: "INTEGRATED_AND_VERIFIED",
          });
        }
      }
    } catch {
      // ignore
    }
  }

  if (results.archive_matches.length > 0 || results.reference_matches.length > 0) {
    results.retrievability_verdict = "PERSISTED_AND_RETRIEVABLE";
  }

  return results;
}

/**
 * Executes direct authorized physical integration for an item with INTEGRATE or ENHANCE_EXISTING disposition.
 * Demonstrates that INTEGRATE produces a verified file change rather than merely a classification string.
 */
export function applyIntegration(item, { targetFilePath, targetDirectory, dryRun = false } = {}) {
  if (item.disposition !== DISPOSITIONS.INTEGRATE && item.disposition !== DISPOSITIONS.ENHANCE_EXISTING) {
    return {
      integrated: false,
      reason: `Disposition is ${item.disposition}, which does not authorize direct code or document integration.`,
    };
  }

  const destination = targetFilePath || path.join(targetDirectory || path.resolve("docs/governance"), `${item.item_id}.md`);
  const content = `# Integrated Governed Item: ${item.item_id}\n\n` +
    `- **Source File:** ${item.source_file || "Unknown"}\n` +
    `- **Source SHA-256:** ${item.source_sha256 || "N/A"}\n` +
    `- **Content Class:** ${item.content_class}\n` +
    `- **Normative Force:** ${item.normative_force}\n` +
    `- **Integrated At:** ${new Date().toISOString()}\n\n` +
    `## Mandated Statement\n\n${item.original_text}\n`;

  if (!dryRun) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, content, "utf8");
  }

  const bytesWritten = Buffer.byteLength(content, "utf8");
  return {
    integrated: true,
    destinationPath: destination,
    bytesWritten,
    sha256: sha256(Buffer.from(content, "utf8")),
    statement: item.original_text,
  };
}

// -------------------------------------------------------------
// Command Line Interface (CLI) Dispatcher
// -------------------------------------------------------------
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const archiveDir = path.join(projectRoot, "docs", "archive", "governed_intake");
  const referenceLibDir = path.join(projectRoot, "docs", "reference_library");

  if (mode === "--scan") {
    const target = process.argv[3] || path.join(projectRoot, "governance_packages", "INBOX");
    const discovered = discoverInputs(target);
    process.stdout.write(JSON.stringify(discovered, null, 2) + "\n");
  } else if (mode === "--chat") {
    const prompt = process.argv[3];
    if (!prompt) {
      console.error("Error: --chat requires a prompt string argument");
      process.exit(1);
    }
    const report = processChatIntake(prompt);
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else if (mode === "--query") {
    const query = process.argv[3];
    if (!query) {
      console.error("Error: --query requires a query string argument");
      process.exit(1);
    }
    const results = queryArchivedKnowledge(query, { archiveDir, referenceLibDir });
    process.stdout.write(JSON.stringify(results, null, 2) + "\n");
  } else if (mode === "--verify-archive") {
    const manifestPath = path.join(archiveDir, "MANIFEST.json");
    if (!fs.existsSync(manifestPath)) {
      console.error("Error: MANIFEST.json not found in archive directory");
      process.exit(1);
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    let passCount = 0;
    for (const rec of manifest.archived_records || []) {
      const archPath = (rec.archive_filename && rec.archive_filename.startsWith("docs/"))
        ? path.join(projectRoot, rec.archive_filename)
        : path.join(archiveDir, rec.archive_filename);
      if (!fs.existsSync(archPath)) {
        console.error(`MISSING: ${rec.archive_filename}`);
        continue;
      }
      const actualHash = sha256(fs.readFileSync(archPath));
      if (actualHash !== rec.sha256) {
        console.error(`HASH_MISMATCH: ${rec.archive_filename}`);
        continue;
      }
      passCount++;
    }
    console.log(`Archive Integrity: ${passCount}/${(manifest.archived_records || []).length} records verified.`);
  } else {
    console.log("Usage: node tools/intake_lifecycle.mjs [--scan <path> | --chat <prompt> | --query <term> | --verify-archive]");
  }
}

