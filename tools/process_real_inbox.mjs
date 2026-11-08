/**
 * tools/process_real_inbox.mjs
 * 
 * Operational intake processing, triage, integration, archival, and INBOX clearance runner.
 * Executed under Sovereign Owner Directive: AFE-GOV-INTAKE-OPERATIONAL-CLOSURE-011.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import {
  inspectZipBuffer,
  sha256,
  CONTENT_CLASSES,
  DISPOSITIONS,
} from "./intake_lifecycle.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inboxRoot = path.join(projectRoot, "governance_packages", "INBOX");
const inboxNew = path.join(inboxRoot, "NEW");
const archiveDir = path.join(projectRoot, "docs", "archive", "governed_intake");
const referenceLibDir = path.join(projectRoot, "docs", "reference_library");
const manifestPath = path.join(archiveDir, "MANIFEST.json");
const catalogPath = path.join(referenceLibDir, "CATALOG.json");
const historicalReceiptPath = path.join(projectRoot, "docs", "evidence", "inbox", "2026-10-25-custody.json");

export function runRealInboxProcessing({ dryRun = false } = {}) {
  const log = [];
  function record(msg) {
    log.push(msg);
    console.log(msg);
  }

  record("=== Starting AFE-GOV-INTAKE-OPERATIONAL-CLOSURE-011 Real Processing ===");

  // 1. Verify Historical Custody Invariant
  record("\n1. Verifying Historical INBOX Custody (24 files in root)...");
  if (!fs.existsSync(historicalReceiptPath)) {
    throw new Error(`CRITICAL: Historical custody receipt not found: ${historicalReceiptPath}`);
  }
  const histReceipt = JSON.parse(fs.readFileSync(historicalReceiptPath, "utf8"));
  const rootEntries = fs.readdirSync(inboxRoot, { withFileTypes: true });
  const rootFiles = rootEntries.filter((e) => e.isFile());

  if (rootFiles.length !== histReceipt.files.length) {
    throw new Error(`CUSTODY_ERROR: INBOX root file count (${rootFiles.length}) != receipt count (${histReceipt.files.length})`);
  }

  for (const rf of rootFiles) {
    const full = path.join(inboxRoot, rf.name);
    const buf = fs.readFileSync(full);
    const hash = sha256(buf);
    const match = histReceipt.files.find((f) => f.name === rf.name);
    if (!match || match.sha256 !== hash) {
      throw new Error(`CUSTODY_MISMATCH on historical file: ${rf.name}`);
    }
  }
  record(`✔ All ${rootFiles.length} historical baseline root files verified intact (PROTECTED_HISTORICAL).`);

  // 2. Discover Items in INBOX/NEW
  record("\n2. Discovering items in governance_packages/INBOX/NEW/...");
  if (!fs.existsSync(inboxNew)) {
    record("INBOX/NEW does not exist or has already been cleared.");
    return { log, success: true, processedCount: 0 };
  }

  const newEntries = fs.readdirSync(inboxNew, { withFileTypes: true });
  record(`Found ${newEntries.length} items in INBOX/NEW.`);

  // Load existing manifests
  let manifest = { schema: "aghr-studio-governed-intake-archive-v1", updated_at: new Date().toISOString(), archived_records: [] };
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch {
      // fallback
    }
  }

  let catalog = { schema: "aghr-studio-reference-library-v1", updated_at: new Date().toISOString(), entries: [] };
  if (fs.existsSync(catalogPath)) {
    try {
      catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
    } catch {
      // fallback
    }
  }

  const results = {
    archivesProcessed: [],
    referencesCataloged: [],
    rejectedArchived: [],
    unpackedDirsPurged: [],
  };

  // 3. Process Archives
  const archiveMapping = [
    {
      originalName: "Agent_Governance_RCCA_Kit_EN_v1.4.0.zip",
      descriptiveName: "BASELINE_PACKAGE_Agent_Governance_RCCA_Kit_EN_v1.4.0_cbe3039c.zip",
      category: "GOVERNING_RULE_OR_INSTRUCTION",
      disposition: "BASELINE_V1_ADOPTED_REFERENCE",
      authorityReference: "AGHR_Studio_1.4.0_Baseline_v1_RELEASE.json / DEC-004",
      targetLocation: "governance_packages/references/Agent_Governance_RCCA_Kit_EN_v1.4.0",
    },
    {
      originalName: "Agent_Governance_RCCA_Kit_EN_v1.3.0.zip",
      descriptiveName: "HISTORICAL_PACKAGE_Agent_Governance_RCCA_Kit_EN_v1.3.0_613bd920.zip",
      category: "DUPLICATE_OR_SUPERSEDED_CONTENT",
      disposition: "HISTORICAL_PACKAGE_REFERENCE",
      authorityReference: "DEC-004 / Baseline Historical Archive",
      targetLocation: "governance_packages/references/Agent_Governance_RCCA_Kit_EN_v1.3.0",
    },
    {
      originalName: "Agent_Governance_RCCA_Kit_EN_v1.3.1.zip",
      descriptiveName: "SUPERSEDED_PACKAGE_Agent_Governance_RCCA_Kit_EN_v1.3.1_83fd410a.zip",
      category: "DUPLICATE_OR_SUPERSEDED_CONTENT",
      disposition: "SUPERSEDED_PACKAGE",
      authorityReference: "Superseded by Baseline v1.4.0",
      targetLocation: "docs/archive/governed_intake/",
    },
    {
      originalName: "AAPES_Policy_Engineering_PLUGIN_SKILL_v2.1.zip",
      descriptiveName: "CANDIDATE_FRAMEWORK_AAPES_Policy_Engineering_PLUGIN_SKILL_v2.1_da902a9c.zip",
      category: "RECOMMENDATION_OR_ENHANCEMENT",
      disposition: "REFER_AS_DIAGNOSTIC_ORACLE",
      authorityReference: "Owner Decision DEC-005",
      targetLocation: "governance_packages/candidates/AAPES_v2.1_Candidate/",
    },
    {
      originalName: "Enterprise_Agent_Governance_Rule_Engineer_Skill_v1.0.0.zip",
      descriptiveName: "OPTIONAL_TOOL_Enterprise_Agent_Governance_Rule_Engineer_679813c9.zip",
      category: "OPERATIONAL_PROCEDURE_OR_WORKFLOW",
      disposition: "OPTIONAL_TOOL_PACKET_2A",
      authorityReference: "Owner Decision DEC-006",
      targetLocation: "tools/enterprise-agent-governance-rule-engineer/",
    },
  ];

  for (const item of archiveMapping) {
    const srcPath = path.join(inboxNew, item.originalName);
    if (!fs.existsSync(srcPath)) {
      record(`Notice: Archive ${item.originalName} not in INBOX/NEW (already processed).`);
      continue;
    }

    const rawBytes = fs.readFileSync(srcPath);
    const fileHash = sha256(rawBytes);

    // Validate ZIP safety
    const zipCheck = inspectZipBuffer(rawBytes);
    if (!zipCheck.isSafe) {
      throw new Error(`SECURITY_REJECTION: Archive ${item.originalName} failed safety check: ${zipCheck.reason}`);
    }

    const destPath = path.join(archiveDir, item.descriptiveName);
    record(`Archiving: ${item.originalName} -> ${item.descriptiveName}`);
    if (!dryRun) {
      fs.mkdirSync(archiveDir, { recursive: true });
      fs.writeFileSync(destPath, rawBytes);

      // Verify replica integrity
      const replicaBytes = fs.readFileSync(destPath);
      const replicaHash = sha256(replicaBytes);
      if (replicaHash !== fileHash) {
        throw new Error(`CRITICAL_HASH_MISMATCH: Replica ${destPath} SHA does not match original!`);
      }

      // Record in manifest
      if (!manifest.archived_records.some((r) => r.sha256 === fileHash)) {
        manifest.archived_records.push({
          archive_id: `ARCH-${fileHash.slice(0, 8)}`,
          original_filename: item.originalName,
          archive_filename: item.descriptiveName,
          sha256: fileHash,
          size_bytes: rawBytes.length,
          category: item.category,
          disposition: item.disposition,
          target_location: item.targetLocation,
          authority_reference: item.authorityReference,
          processed_at: new Date().toISOString(),
          replica_verified: true,
        });
      }

      // Remove redundant active copy safely
      fs.unlinkSync(srcPath);
    }
    results.archivesProcessed.push({ name: item.originalName, hash: fileHash, descriptiveName: item.descriptiveName });
  }

  // 4. Process Rejected FAST-TRACK.txt
  const fastTrackSrc = path.join(inboxNew, "FAST-TRACK.txt");
  if (fs.existsSync(fastTrackSrc)) {
    const rawBytes = fs.readFileSync(fastTrackSrc);
    const fileHash = sha256(rawBytes);
    const descName = "REJECTED_PROPOSAL_FAST_TRACK_7ab8ce61.txt";
    const destPath = path.join(archiveDir, descName);

    record(`Archiving rejected input: FAST-TRACK.txt -> ${descName} (DEC-003)`);
    if (!dryRun) {
      fs.writeFileSync(destPath, rawBytes);
      const replicaHash = sha256(fs.readFileSync(destPath));
      if (replicaHash !== fileHash) {
        throw new Error(`HASH_MISMATCH on FAST-TRACK replica`);
      }

      if (!manifest.archived_records.some((r) => r.sha256 === fileHash)) {
        manifest.archived_records.push({
          archive_id: `ARCH-${fileHash.slice(0, 8)}`,
          original_filename: "FAST-TRACK.txt",
          archive_filename: descName,
          sha256: fileHash,
          size_bytes: rawBytes.length,
          category: "UNCLEAR_OR_UNPROCESSABLE_CONTENT",
          disposition: "REJECT",
          target_location: "REJECTION_LOG / docs/governance/OWNER_DECISION_REGISTER_2026-11-07.md",
          authority_reference: "Owner Decision DEC-003 (Ratified Rejection)",
          processed_at: new Date().toISOString(),
          replica_verified: true,
        });
      }

      fs.unlinkSync(fastTrackSrc);
    }
    results.rejectedArchived.push({ name: "FAST-TRACK.txt", hash: fileHash, descName });
  }

  // 5. Process Redundant Unpacked Directory
  const unpackedDir = path.join(inboxNew, "Agent_Governance_RCCA_Kit_EN_v1.3.0");
  if (fs.existsSync(unpackedDir) && fs.statSync(unpackedDir).isDirectory()) {
    record(`Purging redundant unpacked directory: ${path.basename(unpackedDir)} (ZIP replica verified in archive)`);
    if (!dryRun) {
      fs.rmSync(unpackedDir, { recursive: true, force: true });
    }
    results.unpackedDirsPurged.push("Agent_Governance_RCCA_Kit_EN_v1.3.0");
  }

  // 6. Process Reference Assets
  const referenceMapping = [
    {
      originalName: "Software_Technical_Glossary_OK.xlsx",
      targetName: "Software_Technical_Glossary_OK.xlsx",
      title: "Software Technical Glossary (OK Edition)",
      category: "KNOWLEDGE_GLOSSARY",
      description: "Comprehensive software engineering and governance terminology glossary spreadsheet.",
    },
    {
      originalName: "Unified_Instruction_Policy_Evaluation_Matrix.xlsx",
      targetName: "Unified_Instruction_Policy_Evaluation_Matrix.xlsx",
      title: "Unified Instruction Policy Evaluation Matrix",
      category: "EVALUATION_MATRIX",
      description: "Evaluation criteria and scoring matrix spreadsheet for agent instructions and policies.",
    },
    {
      originalName: "Master_Catalog_Template_AR_v1.0.docx",
      targetName: "Master_Catalog_Template_AR_v1.0.docx",
      title: "Master Software Catalog Template (Arabic v1.0)",
      category: "DOCUMENT_TEMPLATE",
      description: "Standard document template for product and software component catalogs in Arabic.",
    },
    {
      originalName: "الدليل المؤسسي لبناء كتالوجات المنتجات والمشاريع البرمجية وتحليلها وتقييمها.docx",
      targetName: "الدليل المؤسسي لبناء كتالوجات المنتجات والمشاريع البرمجية وتحليلها وتقييمها.docx",
      title: "Institutional Guide for Product Catalogs and Evaluation (Arabic)",
      category: "INSTITUTIONAL_GUIDE",
      description: "Institutional methodology and guidance for constructing, analyzing, and evaluating software catalogs.",
    },
    {
      originalName: "Model Spec.md",
      targetName: "Model_Spec_OpenAI_Public_Reference.md",
      title: "OpenAI Model Spec (Public Reference Document)",
      category: "INDUSTRY_SPECIFICATION",
      description: "External industry specification defining objectives, rules, and default behaviors for frontier AI models.",
    },
    {
      originalName: "Prompt - Agent Execution Governance — Component.md",
      targetName: "Agent_Execution_Governance_Component_Reference.md",
      title: "Agent Execution Governance Component Reference & Operational Template",
      category: "GOVERNANCE_TEMPLATE",
      description: "Reference guide and worked template for agent configurations, tools, runtime controls, and evidence capture.",
    },
    {
      originalName: "CHAT-ASSESMENT.md",
      targetName: "CHAT_AI_SESSION_AUDIT_v2.5_Spec.md",
      title: "CHAT-AI Session Audit Specification v2.5",
      category: "AUDIT_SPECIFICATION",
      description: "Framework and prompts for assessing multi-vendor AI responses, causal factors, and verification evidence.",
    },
    {
      originalName: "READY-TOOLS.md",
      targetName: "Owner_Dashboard_Governance_Framework_Review.md",
      title: "Owner Dashboard Governance Framework & Rule Management Review",
      category: "FRAMEWORK_REVIEW",
      description: "Owner dashboard perspective on transitioning from item creation to strategic lifecycle governance.",
    },
  ];

  for (const ref of referenceMapping) {
    const srcPath = path.join(inboxNew, ref.originalName);
    if (!fs.existsSync(srcPath)) {
      record(`Notice: Reference file ${ref.originalName} not in INBOX/NEW (already cataloged).`);
      continue;
    }

    const rawBytes = fs.readFileSync(srcPath);
    const fileHash = sha256(rawBytes);
    const destPath = path.join(referenceLibDir, ref.targetName);

    record(`Cataloging Reference: ${ref.originalName} -> docs/reference_library/${ref.targetName}`);
    if (!dryRun) {
      fs.mkdirSync(referenceLibDir, { recursive: true });
      fs.writeFileSync(destPath, rawBytes);

      // Verify replica integrity
      const replicaHash = sha256(fs.readFileSync(destPath));
      if (replicaHash !== fileHash) {
        throw new Error(`CRITICAL_HASH_MISMATCH: Reference replica ${destPath} SHA does not match original!`);
      }

      // Add to reference library catalog
      if (!catalog.entries.some((e) => e.sha256 === fileHash)) {
        catalog.entries.push({
          entry_id: `REF-${fileHash.slice(0, 8)}`,
          title: ref.title,
          original_filename: ref.originalName,
          library_filename: ref.targetName,
          sha256: fileHash,
          size_bytes: rawBytes.length,
          category: ref.category,
          description: ref.description,
          authority_level: "INFORMATIVE / NON-GOVERNING",
          cataloged_at: new Date().toISOString(),
        });
      }

      // Add to archive manifest
      if (!manifest.archived_records.some((r) => r.sha256 === fileHash)) {
        manifest.archived_records.push({
          archive_id: `ARCH-${fileHash.slice(0, 8)}`,
          original_filename: ref.originalName,
          archive_filename: `docs/reference_library/${ref.targetName}`,
          sha256: fileHash,
          size_bytes: rawBytes.length,
          category: "USEFUL_KNOWLEDGE_REFERENCE",
          disposition: "REFERENCE_ONLY",
          target_location: `docs/reference_library/${ref.targetName}`,
          authority_reference: "Informative Reference Asset",
          processed_at: new Date().toISOString(),
          replica_verified: true,
        });
      }

      fs.unlinkSync(srcPath);
    }
    results.referencesCataloged.push({ name: ref.originalName, hash: fileHash, targetName: ref.targetName });
  }

  // 7. Save updated Manifest and Catalog
  if (!dryRun) {
    manifest.updated_at = new Date().toISOString();
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

    catalog.updated_at = new Date().toISOString();
    fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), "utf8");
  }

  // 8. Verify Post-Processing State of INBOX/NEW
  const remaining = fs.existsSync(inboxNew) ? fs.readdirSync(inboxNew) : [];
  record(`\n3. Post-Processing Active INBOX State:`);
  record(`Remaining items in INBOX/NEW: ${remaining.length}`);
  if (remaining.length > 0) {
    record(`Warning: Unprocessed files remain in INBOX/NEW: ${remaining.join(", ")}`);
  } else {
    record(`✔ INBOX/NEW is completely clean. All active incoming assets processed, replicated, and cataloged.`);
  }

  record("\n=== Processing Complete ===");
  return {
    log,
    success: true,
    results,
    remainingCount: remaining.length,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const isDryRun = process.argv.includes("--dry-run");
  runRealInboxProcessing({ dryRun: isDryRun });
}
