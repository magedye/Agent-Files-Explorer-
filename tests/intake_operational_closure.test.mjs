/**
 * tests/intake_operational_closure.test.mjs
 * 
 * Comprehensive Operational Qualification & Acceptance Test Suite.
 * Implemented under Sovereign Owner Directive: AFE-GOV-INTAKE-OPERATIONAL-CLOSURE-011.
 * 
 * Demonstrates:
 * 1. Physical INTEGRATE effect (verified file mutation rather than mere classification label).
 * 2. Deduplication and MERGE_DUPLICATE without redundant rule proliferation.
 * 3. Mixed file atomic extraction and separate routing (rules -> governance, references -> library).
 * 4. Partial processing and custody hold on items requiring owner decision.
 * 5. Re-sending archived file (Idempotent redundant clearance).
 * 6. Resuming interrupted archival without duplicate creation.
 * 7. Clean-session retrievability from cold storage (PERSISTED_AND_RETRIEVABLE).
 * 8. Direct chat prompt reconciliation and structured formulation.
 * 9. Real repository state verification (24 protected historical, 0 active unarchived, 14 verified archives, 8 library entries).
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import {
  CONTENT_CLASSES,
  DISPOSITIONS,
  discoverInputs,
  extractAtomicItems,
  reconcileItem,
  processFileLifecycle,
  processChatIntake,
  queryArchivedKnowledge,
  applyIntegration,
  sha256,
} from "../tools/intake_lifecycle.mjs";

function setupSandbox() {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "afe-op-closure-"));
  const inboxDir = path.join(tmpRoot, "INBOX");
  const archiveDir = path.join(tmpRoot, "docs", "archive", "governed_intake");
  const referenceLibDir = path.join(tmpRoot, "docs", "reference_library");
  const governanceDir = path.join(tmpRoot, "docs", "governance");

  fs.mkdirSync(inboxDir, { recursive: true });
  fs.mkdirSync(archiveDir, { recursive: true });
  fs.mkdirSync(referenceLibDir, { recursive: true });
  fs.mkdirSync(governanceDir, { recursive: true });

  const baselineContext = {
    existingRules: [
      { id: "GOV-004", title: "Continue within the grant", text: "Continue eligible work under the existing valid task grant" },
      { id: "GOV-008", title: "Do not weaken acceptance to pass", text: "Do not weaken, skip or relabel an acceptance test merely to obtain a passing result" },
      { id: "GOV-015", title: "Separate local Git from publication", text: "Treat local commits, remote push, merge and deployment as separately scoped actions" },
      { id: "GOV-022", title: "Role separation", text: "Separate implementation, verification, review, and release acceptance" },
    ],
    ownerDecisions: [
      { id: "DEC-001", status: "OWNER_APPROVED", text: "Separate implementation, verification, review, acceptance" },
      { id: "DEC-003", status: "OWNER_APPROVED", text: "Reject FAST-TRACK proposal" },
    ],
  };

  return { tmpRoot, inboxDir, archiveDir, referenceLibDir, governanceDir, baselineContext };
}

test("OpQual 1: Live Ingestion with INTEGRATE produces verified physical file change", () => {
  const sb = setupSandbox();
  const filename = "NEW_RULE_RECORD_HASH.md";
  const fileContent = "## Instruction\nThe agent must record cryptographic hashes for all generated release artifacts before staging.";
  const filePath = path.join(sb.inboxDir, filename);
  fs.writeFileSync(filePath, fileContent, "utf8");

  // Run lifecycle
  const res = processFileLifecycle({
    sourceFilePath: filePath,
    inboxDir: sb.inboxDir,
    archiveDir: sb.archiveDir,
    referenceLibDir: sb.referenceLibDir,
    baselineContext: sb.baselineContext,
  });

  assert.equal(res.status, "ARCHIVED_AND_VERIFIED");
  assert.equal(res.originalRemovedFromInbox, true);
  assert.equal(fs.existsSync(filePath), false, "Original must be unlinked from INBOX");

  // Find the integrable item
  const ruleItem = res.items.find((i) => i.disposition === DISPOSITIONS.INTEGRATE);
  assert.ok(ruleItem, "Item must be classified as INTEGRATE");

  // Execute physical integration
  const integrationRes = applyIntegration(ruleItem, { targetDirectory: sb.governanceDir });
  assert.equal(integrationRes.integrated, true);
  assert.ok(fs.existsSync(integrationRes.destinationPath), "Target governance artifact must physically exist on disk");

  const writtenText = fs.readFileSync(integrationRes.destinationPath, "utf8");
  assert.ok(writtenText.includes("The agent must record cryptographic hashes"), "Physical file must contain the mandated text");
  assert.ok(writtenText.includes(ruleItem.item_id), "Physical file must bind item ID");
  assert.equal(integrationRes.bytesWritten, Buffer.byteLength(writtenText, "utf8"));
  assert.equal(integrationRes.sha256, sha256(Buffer.from(writtenText, "utf8")));

  // Verify archive replica
  const replicaPath = path.join(sb.archiveDir, res.archiveFilename);
  assert.ok(fs.existsSync(replicaPath), "Archive replica must physically exist");
  assert.equal(sha256(fs.readFileSync(replicaPath)), sha256(Buffer.from(fileContent, "utf8")));

  // Clean sandbox
  fs.rmSync(sb.tmpRoot, { recursive: true, force: true });
});

test("OpQual 2: Duplicate instruction reconciles as MERGE_DUPLICATE without creating redundant rule", () => {
  const sb = setupSandbox();
  const filename = "DUPLICATE_ACCEPTANCE_RULE.md";
  const fileContent = "## Rule Notice\nDo not weaken, skip or relabel an acceptance test merely to obtain a passing result.";
  const filePath = path.join(sb.inboxDir, filename);
  fs.writeFileSync(filePath, fileContent, "utf8");

  const res = processFileLifecycle({
    sourceFilePath: filePath,
    inboxDir: sb.inboxDir,
    archiveDir: sb.archiveDir,
    referenceLibDir: sb.referenceLibDir,
    baselineContext: sb.baselineContext,
  });

  assert.equal(res.status, "ARCHIVED_AND_VERIFIED");
  const dupItem = res.items[0];
  assert.equal(dupItem.disposition, DISPOSITIONS.MERGE_DUPLICATE);
  assert.ok(dupItem.rationale.includes("GOV-008"), "Must point to existing rule GOV-008");

  // Attempt integration on duplicate must refuse physical mutation
  const integrationRes = applyIntegration(dupItem, { targetDirectory: sb.governanceDir });
  assert.equal(integrationRes.integrated, false);
  assert.ok(integrationRes.reason.includes("MERGE_DUPLICATE"));

  // Check no file was written in governanceDir
  const targetFiles = fs.readdirSync(sb.governanceDir);
  assert.equal(targetFiles.length, 0, "No redundant rule artifact should be created for duplicate");

  fs.rmSync(sb.tmpRoot, { recursive: true, force: true });
});

test("OpQual 3: Mixed file separates rules to integration and references to reference library", () => {
  const sb = setupSandbox();
  const filename = "MIXED_DOC_INSTRUCTION_AND_GLOSSARY.md";
  const fileContent = 
    "# Project Instructions & Glossary\n\n" +
    "## Governed Operational Step\n" +
    "The agent must preserve audit trail records across all sessions without deletion.\n\n" +
    "## Terminology Reference\n" +
    "Glossary term: AGHR denotes Agent Governance Harness Reference.\n";
  const filePath = path.join(sb.inboxDir, filename);
  fs.writeFileSync(filePath, fileContent, "utf8");

  const res = processFileLifecycle({
    sourceFilePath: filePath,
    inboxDir: sb.inboxDir,
    archiveDir: sb.archiveDir,
    referenceLibDir: sb.referenceLibDir,
    baselineContext: sb.baselineContext,
  });

  assert.equal(res.status, "ARCHIVED_AND_VERIFIED");
  assert.equal(res.items.length, 2, "Must extract 2 atomic items from mixed file");

  const ruleItem = res.items.find((i) => i.content_class === CONTENT_CLASSES.GOVERNING_RULE_OR_INSTRUCTION);
  const refItem = res.items.find((i) => i.content_class === CONTENT_CLASSES.USEFUL_KNOWLEDGE_REFERENCE);

  assert.ok(ruleItem, "Must identify rule item");
  assert.ok(refItem, "Must identify reference item");
  assert.equal(ruleItem.disposition, DISPOSITIONS.INTEGRATE);
  assert.equal(refItem.disposition, DISPOSITIONS.REFERENCE_ONLY);

  // Reference catalog must be updated
  const catalog = JSON.parse(fs.readFileSync(path.join(sb.referenceLibDir, "CATALOG.json"), "utf8"));
  assert.equal(catalog.entries.length, 1);
  assert.equal(catalog.entries[0].original_filename, filename);

  // Rule item can be physically integrated
  const intRes = applyIntegration(ruleItem, { targetDirectory: sb.governanceDir });
  assert.equal(intRes.integrated, true);
  assert.ok(fs.existsSync(intRes.destinationPath));

  fs.rmSync(sb.tmpRoot, { recursive: true, force: true });
});

test("OpQual 4: Item requiring owner decision enforces custody hold (original retained in INBOX)", () => {
  const sb = setupSandbox();
  const filename = "UNAUTHORIZED_BASELINE_MUTATION.md";
  const fileContent = "## Request\nRatify and establish new baseline v2 for all enterprise projects immediately.";
  const filePath = path.join(sb.inboxDir, filename);
  fs.writeFileSync(filePath, fileContent, "utf8");

  const res = processFileLifecycle({
    sourceFilePath: filePath,
    inboxDir: sb.inboxDir,
    archiveDir: sb.archiveDir,
    referenceLibDir: sb.referenceLibDir,
    baselineContext: sb.baselineContext,
  });

  assert.equal(res.status, "PARTIALLY_PROCESSED");
  assert.equal(res.fileRetainedInInbox, true);
  assert.ok(fs.existsSync(filePath), "File MUST remain in INBOX when requiring owner decision");

  const pending = res.items.find((i) => i.disposition === DISPOSITIONS.NEEDS_OWNER_DECISION);
  assert.ok(pending, "Item must require owner decision");
  assert.equal(pending.requires_owner_decision, true);

  fs.rmSync(sb.tmpRoot, { recursive: true, force: true });
});

test("OpQual 5: Re-sending previously archived file clears INBOX redundantly without duplicate records", () => {
  const sb = setupSandbox();
  const filename = "IDEMPOTENT_TEST_FILE.md";
  const fileContent = "## Procedure\nVerify hash sums before staging any deployment package.";
  const filePath = path.join(sb.inboxDir, filename);
  fs.writeFileSync(filePath, fileContent, "utf8");

  // First run
  const res1 = processFileLifecycle({
    sourceFilePath: filePath,
    inboxDir: sb.inboxDir,
    archiveDir: sb.archiveDir,
    referenceLibDir: sb.referenceLibDir,
    baselineContext: sb.baselineContext,
  });
  assert.equal(res1.status, "ARCHIVED_AND_VERIFIED");

  // Re-send the exact same file into INBOX
  fs.writeFileSync(filePath, fileContent, "utf8");
  assert.ok(fs.existsSync(filePath));

  // Second run
  const res2 = processFileLifecycle({
    sourceFilePath: filePath,
    inboxDir: sb.inboxDir,
    archiveDir: sb.archiveDir,
    referenceLibDir: sb.referenceLibDir,
    baselineContext: sb.baselineContext,
  });

  assert.equal(res2.status, "DUPLICATE_REDUNDANT_REMOVED");
  assert.equal(fs.existsSync(filePath), false, "Redundant file must be safely unlinked from INBOX");

  const manifest = JSON.parse(fs.readFileSync(path.join(sb.archiveDir, "MANIFEST.json"), "utf8"));
  assert.equal(manifest.archived_records.length, 1, "Manifest must not contain duplicate records for same SHA");

  fs.rmSync(sb.tmpRoot, { recursive: true, force: true });
});

test("OpQual 6: Resuming interrupted archival completes inbox clearance idempotently", () => {
  const sb = setupSandbox();
  const filename = "INTERRUPTED_ARCHIVE_FILE.md";
  const fileContent = "## Instruction\nLog all tool calls to a local transcript.";
  const filePath = path.join(sb.inboxDir, filename);
  fs.writeFileSync(filePath, fileContent, "utf8");

  // Run with simulation of interruption
  const res1 = processFileLifecycle({
    sourceFilePath: filePath,
    inboxDir: sb.inboxDir,
    archiveDir: sb.archiveDir,
    referenceLibDir: sb.referenceLibDir,
    baselineContext: sb.baselineContext,
    simulateInterruption: true,
  });

  assert.equal(res1.status, "INTERRUPTED_BEFORE_REMOVAL");
  assert.ok(fs.existsSync(filePath), "File remains in INBOX after interruption");

  // Resume operation (call normal processFileLifecycle)
  const res2 = processFileLifecycle({
    sourceFilePath: filePath,
    inboxDir: sb.inboxDir,
    archiveDir: sb.archiveDir,
    referenceLibDir: sb.referenceLibDir,
    baselineContext: sb.baselineContext,
  });

  assert.equal(res2.status, "DUPLICATE_REDUNDANT_REMOVED");
  assert.equal(fs.existsSync(filePath), false, "Resumed process must safely clean up INBOX copy");

  const manifest = JSON.parse(fs.readFileSync(path.join(sb.archiveDir, "MANIFEST.json"), "utf8"));
  assert.equal(manifest.archived_records.length, 1);

  fs.rmSync(sb.tmpRoot, { recursive: true, force: true });
});

test("OpQual 7: Clean-session cold retrievability returns PERSISTED_AND_RETRIEVABLE with full metadata", () => {
  const sb = setupSandbox();
  const filename = "COLD_RETRIEVAL_TEST.md";
  const fileContent = "## Cold Storage Spec\nArchitecture reference for distributed ledger nodes.";
  const filePath = path.join(sb.inboxDir, filename);
  fs.writeFileSync(filePath, fileContent, "utf8");

  processFileLifecycle({
    sourceFilePath: filePath,
    inboxDir: sb.inboxDir,
    archiveDir: sb.archiveDir,
    referenceLibDir: sb.referenceLibDir,
    baselineContext: sb.baselineContext,
  });

  // Query from isolated cold session
  const queryResult = queryArchivedKnowledge("COLD_RETRIEVAL_TEST", {
    archiveDir: sb.archiveDir,
    referenceLibDir: sb.referenceLibDir,
  });

  assert.equal(queryResult.retrievability_verdict, "PERSISTED_AND_RETRIEVABLE");
  assert.equal(queryResult.archive_matches.length, 1);
  assert.equal(queryResult.archive_matches[0].original_filename, filename);
  assert.equal(queryResult.archive_matches[0].status, "PERSISTED_AND_RETRIEVABLE");

  fs.rmSync(sb.tmpRoot, { recursive: true, force: true });
});

test("OpQual 8: Direct chat intake reconciles intent, checks existing coverage, and formulates report", () => {
  const baselineContext = {
    existingRules: [
      { id: "GOV-004", title: "Continue within the grant", text: "defer or continue eligible work" },
      { id: "GOV-020", title: "Escalate material side effects", text: "obtain authorization before effects" },
    ],
  };

  const chatPrompt = "أريد إضافة قاعدة جديدة لحفظ عهدة الطلبات المؤجلة وإدارتها";
  const report = processChatIntake(chatPrompt, baselineContext);

  assert.ok(report.candidate_id.startsWith("CHAT-REQ-"));
  assert.equal(report.recommended_disposition, DISPOSITIONS.ENHANCE_EXISTING);
  assert.ok(report.existing_coverage_detected.length > 0, "Must detect coverage in GOV-004");
  assert.equal(report.target_location, "docs/governance/GOVERNED_REQUEST_CUSTODY_PROCEDURE.md");
  assert.equal(report.requires_owner_decision, false);
});

test("OpQual 9: Real repository state conforms to operational closure invariants", () => {
  const projectRoot = path.resolve(".");
  const inboxRoot = path.join(projectRoot, "governance_packages", "INBOX");
  const inboxNew = path.join(inboxRoot, "NEW");
  const archiveDir = path.join(projectRoot, "docs", "archive", "governed_intake");
  const referenceLibDir = path.join(projectRoot, "docs", "reference_library");
  const manifestPath = path.join(archiveDir, "MANIFEST.json");
  const catalogPath = path.join(referenceLibDir, "CATALOG.json");
  const custodyReceiptPath = path.join(projectRoot, "docs", "evidence", "inbox", "2026-10-25-custody.json");

  // Invariant 1: 24 Historical root files intact and match custody receipt
  const custody = JSON.parse(fs.readFileSync(custodyReceiptPath, "utf8"));
  const rootFiles = fs.readdirSync(inboxRoot, { withFileTypes: true }).filter((e) => e.isFile());
  assert.equal(rootFiles.length, 24, "INBOX must contain exactly 24 historical baseline files");
  assert.equal(rootFiles.length, custody.files.length);

  for (const rf of rootFiles) {
    const buf = fs.readFileSync(path.join(inboxRoot, rf.name));
    const h = sha256(buf);
    const m = custody.files.find((f) => f.name === rf.name);
    assert.ok(m, `Historical file ${rf.name} must exist in receipt`);
    assert.equal(h, m.sha256, `Hash of ${rf.name} must match custody receipt`);
  }

  // Invariant 2: Active INBOX/NEW has 0 unarchived/unprocessed files
  if (fs.existsSync(inboxNew)) {
    const activeEntries = fs.readdirSync(inboxNew).filter((e) => e !== ".gitkeep");
    assert.equal(activeEntries.length, 0, "INBOX/NEW must have 0 unarchived files remaining");
  }

  // Invariant 3: Manifest has 14 verified records
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.archived_records.length, 14, "Archive manifest must contain exactly 14 records");

  for (const rec of manifest.archived_records) {
    const fPath = rec.archive_filename.startsWith("docs/")
      ? path.join(projectRoot, rec.archive_filename)
      : path.join(archiveDir, rec.archive_filename);
    assert.ok(fs.existsSync(fPath), `Archived artifact ${fPath} must physically exist`);
    const actHash = sha256(fs.readFileSync(fPath));
    assert.equal(actHash, rec.sha256, `SHA-256 of ${rec.archive_filename} must match record`);
  }

  // Invariant 4: Reference Library catalog has 8 entries
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  assert.equal(catalog.entries.length, 8, "Reference catalog must contain exactly 8 entries");

  for (const ent of catalog.entries) {
    const refPath = path.join(referenceLibDir, ent.library_filename);
    assert.ok(fs.existsSync(refPath), `Reference asset ${refPath} must physically exist`);
    const actHash = sha256(fs.readFileSync(refPath));
    assert.equal(actHash, ent.sha256, `SHA-256 of ${ent.library_filename} must match catalog`);
  }
});
