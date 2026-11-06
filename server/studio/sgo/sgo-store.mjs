import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { validateDataAgainstSchema } from './sgo-schema-validator.mjs';

const COMPILED_DATA_PATH = path.resolve('server/studio/sgo/data/sgo-compiled.json');

function writeFileSyncAtomic(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tempPath = path.join(dir, `.${path.basename(filePath)}.${crypto.randomUUID()}.tmp`);
  try {
    fs.writeFileSync(tempPath, data, 'utf8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch {}
    throw err;
  }
}

export class SgoStore {
  constructor(options = {}) {
    this.options = options;
    this.storageRoot = options.storageRoot || path.resolve('.governance/sgo');
    fs.mkdirSync(this.storageRoot, { recursive: true });
    
    // Load compiled static dataset
    const rawData = fs.readFileSync(COMPILED_DATA_PATH, 'utf8');
    this.data = JSON.parse(rawData);
    
    // In-memory runtime state for drafts, protected decisions, and audit ledger
    this.draftDecisions = new Map();
    this.ownerDecisions = new Map();
    this.auditLedger = [];
    this.genesisHash = '0'.repeat(64);
    this.lastHash = this.genesisHash;
    this.integrityIncident = null;
    
    // Enrolled owner identity (null by default; requires explicit sovereign enrollment)
    this.enrolledOwner = options.enrolledOwner || null;

    // File paths for durable persistence and independent checkpoints (AGHR-QLE-GOV-OBS-004)
    this.draftsFilePath = path.join(this.storageRoot, 'sgo_drafts.json');
    this.ownerDecisionsFilePath = path.join(this.storageRoot, 'sgo_owner_decisions.json');
    this.auditLedgerFilePath = path.join(this.storageRoot, 'sgo_audit_ledger.json');
    this.checkpointFilePath = path.join(this.storageRoot, 'sgo_checkpoint.json');

    // External checkpoint trust boundary paths (AGHR-QLE-GOV-OBS-005)
    const extDir = options.storageRoot 
      ? path.join(path.dirname(this.storageRoot), `${path.basename(this.storageRoot)}_checkpoints`)
      : path.resolve('.governance/checkpoints');
    this.externalCheckpointFilePath = options.externalCheckpointPath || 
      path.join(extDir, 'sgo_external_checkpoint.json');
    this.checkpointHistoryPath = options.checkpointHistoryPath || 
      path.join(extDir, 'sgo_checkpoint_history.jsonl');

    this._initializeAndVerifyStorage();
  }

  _initializeAndVerifyStorage() {
    const draftsExist = fs.existsSync(this.draftsFilePath);
    const decisionsExist = fs.existsSync(this.ownerDecisionsFilePath);
    const ledgerExist = fs.existsSync(this.auditLedgerFilePath);
    const checkpointExist = fs.existsSync(this.checkpointFilePath);
    const extCheckpointExist = fs.existsSync(this.externalCheckpointFilePath);

    const isInitialFreshStore = !ledgerExist && !checkpointExist && !decisionsExist && !extCheckpointExist;

    if (isInitialFreshStore) {
      // 1. Genuine clean bootstrap: seed genesis anchor
      this._appendGenesisEvent();
      return;
    }

    // 2. Check for missing files after prior initialization
    if (checkpointExist && !ledgerExist) {
      this.integrityIncident = {
        code: 'LEDGER_MISSING_AFTER_INITIALIZATION',
        reason: 'Audit ledger file is missing while integrity checkpoint exists. Truncation or deletion incident.'
      };
      return;
    }

    if (ledgerExist && !checkpointExist) {
      this.integrityIncident = {
        code: 'CHECKPOINT_MISSING_AFTER_INITIALIZATION',
        reason: 'Integrity checkpoint file is missing while audit ledger exists. Tampering or deletion incident.'
      };
      return;
    }

    if (decisionsExist && !ledgerExist) {
      this.integrityIncident = {
        code: 'LEDGER_MISSING_AFTER_INITIALIZATION',
        reason: 'Audit ledger file is missing while owner decisions exist.'
      };
      return;
    }

    // 3. Parse files with strict incident detection (never swallow parse errors to empty state)
    if (draftsExist) {
      try {
        const savedDrafts = JSON.parse(fs.readFileSync(this.draftsFilePath, 'utf8'));
        if (Array.isArray(savedDrafts)) {
          for (const d of savedDrafts) this.draftDecisions.set(d.target_id, d);
        } else {
          this.integrityIncident = {
            code: 'INTEGRITY_INCIDENT_CORRUPT_DRAFTS',
            reason: 'Drafts file does not contain a JSON array.'
          };
          return;
        }
      } catch (err) {
        this.integrityIncident = {
          code: 'INTEGRITY_INCIDENT_CORRUPT_DRAFTS',
          reason: `Corrupted drafts JSON: ${err.message}`
        };
        return;
      }
    }

    if (decisionsExist) {
      try {
        const savedDecisions = JSON.parse(fs.readFileSync(this.ownerDecisionsFilePath, 'utf8'));
        if (Array.isArray(savedDecisions)) {
          for (const d of savedDecisions) this.ownerDecisions.set(d.target_id, d);
        } else {
          this.integrityIncident = {
            code: 'INTEGRITY_INCIDENT_CORRUPT_DECISIONS',
            reason: 'Owner decisions file does not contain a JSON array.'
          };
          return;
        }
      } catch (err) {
        this.integrityIncident = {
          code: 'INTEGRITY_INCIDENT_CORRUPT_DECISIONS',
          reason: `Corrupted owner decisions JSON: ${err.message}`
        };
        return;
      }
    }

    if (ledgerExist) {
      try {
        const savedLedger = JSON.parse(fs.readFileSync(this.auditLedgerFilePath, 'utf8'));
        if (Array.isArray(savedLedger) && savedLedger.length > 0) {
          this.auditLedger = savedLedger;
          this.lastHash = savedLedger[savedLedger.length - 1].currentHash;
        } else if (Array.isArray(savedLedger) && savedLedger.length === 0) {
          this.integrityIncident = {
            code: 'INTEGRITY_INCIDENT_EMPTY_LEDGER',
            reason: 'Audit ledger file is empty but store was initialized.'
          };
          return;
        } else {
          this.integrityIncident = {
            code: 'INTEGRITY_INCIDENT_CORRUPT_LEDGER',
            reason: 'Audit ledger file does not contain a JSON array.'
          };
          return;
        }
      } catch (err) {
        this.integrityIncident = {
          code: 'INTEGRITY_INCIDENT_CORRUPT_LEDGER',
          reason: `Corrupted audit ledger JSON: ${err.message}`
        };
        return;
      }
    }

    let checkpointData = null;
    if (checkpointExist) {
      try {
        checkpointData = JSON.parse(fs.readFileSync(this.checkpointFilePath, 'utf8'));
      } catch (err) {
        this.integrityIncident = {
          code: 'INTEGRITY_INCIDENT_CORRUPT_CHECKPOINT',
          reason: `Corrupted checkpoint JSON: ${err.message}`
        };
        return;
      }
    }

    let extCheckpointData = null;
    if (extCheckpointExist) {
      try {
        extCheckpointData = JSON.parse(fs.readFileSync(this.externalCheckpointFilePath, 'utf8'));
      } catch (err) {
        this.integrityIncident = {
          code: 'INTEGRITY_INCIDENT_CORRUPT_EXTERNAL_CHECKPOINT',
          reason: `Corrupted external checkpoint JSON: ${err.message}`
        };
        return;
      }
    }

    // 4. Pre-Sync Verification: Verify chain and compare against retained checkpoints
    // Never overwrite an existing anchor simply because loaded ledger differs!
    const chainVerification = this._verifyLoadedLedgerChain();
    if (!chainVerification.valid) {
      this.integrityIncident = {
        code: 'INTEGRITY_INCIDENT_CHAIN_BROKEN',
        reason: chainVerification.reason
      };
      return;
    }

    if (checkpointData) {
      if (checkpointData.ledger_tip_hash !== this.lastHash || checkpointData.events_count !== this.auditLedger.length) {
        this.integrityIncident = {
          code: 'VALID_PREFIX_TRUNCATION_DETECTED',
          reason: `Valid-prefix ledger truncation detected: checkpoint expects ${checkpointData.events_count} events (tip: ${checkpointData.ledger_tip_hash}), but ledger has ${this.auditLedger.length} events (tip: ${this.lastHash})`
        };
        return;
      }
    }

    if (extCheckpointData) {
      if (extCheckpointData.ledger_tip_hash !== this.lastHash || extCheckpointData.events_count !== this.auditLedger.length) {
        this.integrityIncident = {
          code: 'EXTERNAL_CHECKPOINT_MISMATCH',
          reason: `External checkpoint mismatch: expected tip ${extCheckpointData.ledger_tip_hash} (${extCheckpointData.events_count} events), found ${this.lastHash} (${this.auditLedger.length} events)`
        };
        return;
      }
    }

    // 5. Verify consistency between owner decisions and audit ledger
    for (const [targetId, dec] of this.ownerDecisions.entries()) {
      const match = this.auditLedger.find(e => 
        (e.action === 'NORMATIVE_OWNER_DECISION' || e.action === 'SYNTHETIC_OWNER_DECISION') &&
        (e.target === targetId || e.details?.target_id === targetId) &&
        (e.details?.decision_id === dec.decision_id)
      );
      if (!match) {
        this.integrityIncident = {
          code: 'INCONSISTENT_PROTECTED_RECORDS',
          reason: `Owner decision ${dec.decision_id} for target '${targetId}' exists without corresponding audit ledger event.`
        };
        return;
      }
    }

    // Fully verified. Do NOT overwrite or regenerate checkpoint anchors!
  }

  _verifyLoadedLedgerChain() {
    let prev = this.genesisHash;
    for (let i = 0; i < this.auditLedger.length; i++) {
      const event = this.auditLedger[i];
      if (event.prevHash !== prev) {
        return {
          valid: false,
          reason: `Broken hash chain at index ${i}: expected prevHash ${prev}, found ${event.prevHash}`
        };
      }
      const payloadToHash = JSON.stringify({
        eventId: event.eventId,
        prevHash: event.prevHash,
        timestamp: event.timestamp,
        action: event.action,
        principal: event.principal,
        target: event.target,
        details: event.details
      });
      const computed = crypto.createHash('sha256').update(payloadToHash).digest('hex');
      if (computed !== event.currentHash) {
        return {
          valid: false,
          reason: `Hash mismatch at index ${i}: recomputed ${computed}, recorded ${event.currentHash}`
        };
      }
      prev = event.currentHash;
    }
    if (this.auditLedger.length > 0 && prev !== this.lastHash) {
      return {
        valid: false,
        reason: `Ledger tip mismatch: computed tip ${prev} does not match recorded tip ${this.lastHash}`
      };
    }
    return { valid: true };
  }

  _appendGenesisEvent() {
    const eventId = `EVT-${crypto.randomUUID()}`;
    const timestamp = new Date().toISOString();
    const prevHash = this.genesisHash;
    const action = 'SYSTEM_INITIALIZATION';
    const principal = 'system';
    const target = 'SGO_DATASET_V1.0.0';
    const details = {
      total_items: this.data.metadata.total_items,
      source_255: this.data.metadata.source_255_count,
      v4_candidates: this.data.metadata.v4_count,
      v2_historical: this.data.metadata.v2_count,
      priority_groups: this.data.metadata.priority_groups_count,
      total_designed_tests: this.data.metadata.total_designed_tests,
      genesis: true
    };

    const payloadToHash = JSON.stringify({
      eventId,
      prevHash,
      timestamp,
      action,
      principal,
      target,
      details
    });
    const currentHash = crypto.createHash('sha256').update(payloadToHash).digest('hex');

    const fullEvent = {
      eventId,
      prevHash,
      currentHash,
      timestamp,
      action,
      principal,
      target,
      details
    };

    this.auditLedger = [fullEvent];
    this.lastHash = currentHash;

    writeFileSyncAtomic(this.auditLedgerFilePath, JSON.stringify(this.auditLedger, null, 2));

    const checkpoint = {
      checkpoint_id: `CHK-${crypto.randomUUID()}`,
      recorded_at: timestamp,
      ledger_tip_hash: currentHash,
      events_count: 1,
      decisions_count: 0,
      checkpoint_digest: crypto.createHash('sha256').update(`${currentHash}:1:0`).digest('hex')
    };
    writeFileSyncAtomic(this.checkpointFilePath, JSON.stringify(checkpoint, null, 2));

    const externalCheckpoint = {
      ...checkpoint,
      trust_boundary: 'EXTERNAL_ISOLATED_CHECKPOINT'
    };
    writeFileSyncAtomic(this.externalCheckpointFilePath, JSON.stringify(externalCheckpoint, null, 2));

    const historyDir = path.dirname(this.checkpointHistoryPath);
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true });
    }
    fs.appendFileSync(this.checkpointHistoryPath, JSON.stringify(externalCheckpoint) + '\n', 'utf8');
  }

  getOverview() {
    return {
      version: this.data.version,
      contract_version: this.data.contract_version,
      metadata: {
        ...this.data.metadata,
        draft_decisions_count: this.draftDecisions.size,
        owner_decisions_recorded: this.ownerDecisions.size,
        audit_events_count: this.auditLedger.length,
        ledger_tip_hash: this.lastHash,
        owner_enrolled: !!this.enrolledOwner,
        integrity_incident: this.integrityIncident ? this.integrityIncident.code : null,
        integrity_status: this.integrityIncident ? 'INCIDENT_ACTIVE' : 'HEALTHY'
      }
    };
  }

  getItems(filters = {}) {
    let items = (filters.population === 'expanded_451' || filters.include_additions === 'true' || filters.origin === 'QLE_ADD')
      ? (this.data.items_451 || this.data.items)
      : this.data.items;
    
    if (filters.origin) {
      const orig = filters.origin.toUpperCase();
      items = items.filter(i => i.origin === orig);
    }
    
    if (filters.force) {
      items = items.filter(i => i.source_declared_force === filters.force);
    }
    
    if (filters.q) {
      const q = filters.q.toLowerCase().trim();
      items = items.filter(i => 
        i.id.toLowerCase().includes(q) ||
        (i.title_ar && i.title_ar.includes(q)) ||
        (i.title_en && i.title_en.toLowerCase().includes(q)) ||
        (i.original_statement_ar && i.original_statement_ar.includes(q)) ||
        (i.baseline_ref && i.baseline_ref.toLowerCase().includes(q))
      );
    }
    
    const limit = Number(filters.limit) || 100;
    const offset = Number(filters.offset) || 0;
    
    return {
      total: items.length,
      limit,
      offset,
      population: (filters.population === 'expanded_451' || filters.include_additions === 'true') ? 'expanded_451' : 'baseline_423',
      items: items.slice(offset, offset + limit).map(i => ({
        ...i,
        draft_decision: this.draftDecisions.get(i.id) || null,
        owner_decision: this.ownerDecisions.get(i.id) || null
      }))
    };
  }

  getItem(id) {
    const item = this.data.items.find(i => i.id === id);
    if (!item) return null;
    
    const itemRelations = this.data.relations.filter(r => r.source === id || r.target === id);
    const itemTests = this.data.test_cases.filter(t => t.item_id === id);
    const draftDecision = this.draftDecisions.get(id) || null;
    const ownerDecision = this.ownerDecisions.get(id) || null;
    
    return {
      ...item,
      relations: itemRelations,
      test_cases: itemTests,
      draft_decision: draftDecision,
      owner_decision: ownerDecision
    };
  }

  getPriorityDecisions() {
    return this.data.priority_groups.map(group => ({
      ...group,
      draft_decision: this.draftDecisions.get(group.id) || null,
      owner_decision: this.ownerDecisions.get(group.id) || null
    }));
  }

  getPriorityDecision(id) {
    const group = this.data.priority_groups.find(g => g.id === id);
    if (!group) return null;
    
    const affectedItems = this.data.items.filter(i => group.rows.includes(i.id));
    return {
      ...group,
      affected_items: affectedItems,
      draft_decision: this.draftDecisions.get(id) || null,
      owner_decision: this.ownerDecisions.get(id) || null
    };
  }

  getRelations(filters = {}) {
    const isWorkbook = filters.catalog === 'workbook_294' || filters.source_catalog === 'workbook';
    let relations = isWorkbook ? (this.data.workbook_relations_294 || []) : this.data.relations;
    
    if (filters.type) {
      relations = relations.filter(r => (r.type === filters.type || r.relation_type === filters.type));
    }
    if (filters.basis) {
      relations = relations.filter(r => r.basis === filters.basis);
    }
    if (filters.item_id) {
      relations = relations.filter(r => r.source === filters.item_id || r.target === filters.item_id);
    }
    return {
      catalog: isWorkbook ? 'workbook_294' : 'graph_606',
      total: relations.length,
      relations: relations.slice(0, Number(filters.limit) || 500)
    };
  }

  getTestCases(itemId, filters = {}) {
    const isWorkbook = filters.catalog === 'workbook_882' || filters.source_catalog === 'workbook';
    const tests = isWorkbook ? (this.data.workbook_tests_882 || []) : this.data.test_cases;
    if (itemId) {
      return tests.filter(t => (t.item_id === itemId || t.target_unit === itemId));
    }
    return tests;
  }

  getGraphData(filters = {}) {
    let relations = this.data.relations;
    if (filters.type) {
      relations = relations.filter(r => r.type === filters.type);
    }
    if (filters.cluster) {
      relations = relations.filter(r => r.cluster === filters.cluster);
    }
    
    return {
      nodes: this.data.items.map(item => ({
        id: item.id,
        label: `[${item.id}] ${item.title_ar}`,
        origin: item.origin,
        force: item.source_declared_force,
        cluster: item.family
      })),
      edges: relations.map(r => ({
        from: r.source,
        to: r.target,
        type: r.type,
        label: r.type,
        provenance: r.provenance || 'SOURCE_EVIDENCE'
      }))
    };
  }

  saveDraftDecision(payload, principal = 'operator') {
    if (this.integrityIncident) {
      const err = new Error(`Draft decision recording blocked by active integrity incident: ${this.integrityIncident.reason} (${this.integrityIncident.code})`);
      err.status = 500;
      err.code = this.integrityIncident.code || 'INTEGRITY_INCIDENT_FAIL_CLOSED';
      throw err;
    }

    const actor = typeof principal === 'string' ? principal : (principal?.actor || 'operator');
    const { target_id, selected_option, rationale, custom_wording } = payload;
    if (!target_id || !selected_option) {
      const err = new Error('target_id and selected_option are required.');
      err.status = 400;
      err.code = 'INVALID_PAYLOAD';
      throw err;
    }
    
    const draft = {
      target_id,
      selected_option,
      rationale: rationale || '',
      custom_wording: custom_wording || null,
      saved_at: new Date().toISOString(),
      saved_by: actor,
      is_draft: true,
      authorizes_engine_activation: false,
      status: 'DRAFT_NON_NORMATIVE',
      normative_approval_granted: false
    };
    
    const prevDrafts = new Map(this.draftDecisions);
    const newDrafts = new Map(this.draftDecisions);
    newDrafts.set(target_id, draft);

    // Durably persist drafts across server restarts with transactional rollback
    try {
      writeFileSyncAtomic(this.draftsFilePath, JSON.stringify([...newDrafts.values()], null, 2));
      this.draftDecisions = newDrafts;
    } catch (writeErr) {
      this.draftDecisions = prevDrafts;
      const err = new Error(`Failed to persist draft decision: ${writeErr.message}`);
      err.status = 500;
      err.code = 'PERSISTENCE_FAILED';
      throw err;
    }

    this._appendAuditEvent({
      action: 'DRAFT_DECISION_RECORDED',
      principal: draft.saved_by,
      target: target_id,
      details: draft
    });
    
    return draft;
  }

  /**
   * AC-07 & AGHR-QLE-GOV-OBS-004:
   * Replace positional 230+25 representation mapping with actual identifier-,
   * source-, and version-based reconciliation.
   */
  getRepresentationMapping() {
    const s255 = this.data.items.filter(i => i.origin === 'SOURCE_255');
    const primary = [];
    const auxiliary = [];
    const discrepancies = [];
    const seenIds = new Set();

    // Canonical sequence verification: items 1..255
    for (const item of s255) {
      if (!item.id || typeof item.id !== 'string') {
        discrepancies.push({ id: item.id || 'UNKNOWN', error: 'MISSING_IDENTIFIER', item });
        continue;
      }

      if (seenIds.has(item.id)) {
        discrepancies.push({ id: item.id, error: 'DUPLICATE_IDENTIFIER', item });
        continue;
      }
      seenIds.add(item.id);

      const idMatch = item.id.match(/^LISAN-GOV-(\d+)$/);
      if (!idMatch) {
        discrepancies.push({ id: item.id, error: 'INVALID_IDENTIFIER_FORMAT', expected: 'LISAN-GOV-###' });
        continue;
      }

      const numId = parseInt(idMatch[1], 10);
      if (numId < 1 || numId > 255) {
        discrepancies.push({ id: item.id, error: 'NUMERIC_ID_OUT_OF_BOUNDS', value: numId });
        continue;
      }

      // Reconcile candidate_id, baseline_ref, and version
      const expectedBaseline = item.id;
      const expectedCandidate = `QLE-GIC-${item.id}-V11`;
      if (item.baseline_ref && item.baseline_ref !== expectedBaseline) {
        discrepancies.push({ id: item.id, error: 'BASELINE_REF_MISMATCH', actual: item.baseline_ref, expected: expectedBaseline });
      }
      if (item.candidate_id && item.candidate_id !== expectedCandidate) {
        discrepancies.push({ id: item.id, error: 'CANDIDATE_ID_MISMATCH', actual: item.candidate_id, expected: expectedCandidate });
      }

      // Semantic role classification: 1..230 are primary rules, 231..255 are auxiliary governance controls
      if (numId <= 230) {
        primary.push({
          original_id: item.id,
          numeric_id: numId,
          representation_type: 'STUDIO_PRIMARY',
          candidate_id: item.candidate_id,
          baseline_ref: item.baseline_ref,
          source_version: 'V11',
          source_sha256: item.source_sha256 || '9aa911136b46e391398430f3670da7111a9d6df435ebaa54c287d2145ad002b2',
          title_ar: item.title_ar,
          origin: item.origin,
          reconciliation_basis: 'CANONICAL_IDENTIFIER_AND_VERSION_LINEAGE',
          status: 'MATCHED'
        });
      } else {
        auxiliary.push({
          original_id: item.id,
          numeric_id: numId,
          representation_type: 'STUDIO_AUXILIARY',
          candidate_id: item.candidate_id,
          baseline_ref: item.baseline_ref,
          source_version: 'V11',
          source_sha256: item.source_sha256 || '9aa911136b46e391398430f3670da7111a9d6df435ebaa54c287d2145ad002b2',
          title_ar: item.title_ar,
          origin: item.origin,
          reconciliation_basis: 'CANONICAL_IDENTIFIER_AND_VERSION_LINEAGE',
          status: 'MATCHED'
        });
      }
    }

    // Check for sequence completeness 1..255
    for (let i = 1; i <= 255; i++) {
      const expectedId = `LISAN-GOV-${String(i).padStart(3, '0')}`;
      if (!seenIds.has(expectedId)) {
        discrepancies.push({ id: expectedId, error: 'MISSING_SEQUENCE_ITEM' });
      }
    }

    return {
      reconciliation_method: 'IDENTIFIER_SOURCE_AND_VERSION_LINEAGE',
      total_original_source: 255,
      studio_primary_representations_count: primary.length,
      studio_auxiliary_representations_count: auxiliary.length,
      total_mapped_count: primary.length + auxiliary.length,
      discrepancies_count: discrepancies.length,
      discrepancy_report: discrepancies,
      mappings: [...primary, ...auxiliary]
    };
  }

  /**
   * Protected Owner Decision Recording (AGHR-QLE-GOV-OBS-006 Hardened)
   * Enforces logical transaction atomicity: decisions, audit events, and checkpoints
   * commit atomically across in-memory and durable storage, or roll back cleanly without reporting success.
   */
  recordProtectedOwnerDecision(payload, principal, options = {}) {
    // 0. Active integrity incident blocks all protected writes immediately
    if (this.integrityIncident) {
      const err = new Error(`Protected write blocked by active integrity incident: ${this.integrityIncident.reason} (${this.integrityIncident.code})`);
      err.status = 500;
      err.code = this.integrityIncident.code || 'INTEGRITY_INCIDENT_FAIL_CLOSED';
      throw err;
    }

    const { target_id, selected_option, rationale, scope, source_sha256 } = payload || {};
    if (!target_id || !selected_option) {
      const err = new Error('target_id and selected_option are required.');
      err.status = 400;
      err.code = 'INVALID_PAYLOAD';
      throw err;
    }
    
    // Check stale source SHA256 (AC-18)
    const expectedSha = this.data.metadata.source_sha256 || '9aa911136b46e391398430f3670da7111a9d6df435ebaa54c287d2145ad002b2';
    if (source_sha256 && source_sha256 !== expectedSha) {
      try {
        this._appendAuditEvent({
          action: 'PROTECTED_WRITE_DENIED_STALE_SHA',
          principal: principal?.actor || 'unknown',
          target: target_id,
          details: { reason: 'STALE_SOURCE_SHA', provided_sha: source_sha256, expected_sha: expectedSha }
        });
      } catch {}
      const err = new Error(`Source SHA mismatch: provided '${source_sha256}' does not match expected source '${expectedSha}'. Protected decision blocked.`);
      err.status = 409;
      err.code = 'STALE_SOURCE_SHA';
      throw err;
    }

    // Check grant scope if provided (AC-36)
    if (options.scope && options.scope !== 'sgo:owner' && options.scope !== 'owner') {
      const err = new Error(`Invalid grant scope '${options.scope}'. Expected 'sgo:owner'.`);
      err.status = 403;
      err.code = 'INVALID_GRANT_SCOPE';
      throw err;
    }

    // Synthetic authorization is strictly restricted to server-controlled test fixtures.
    // Client-supplied parameters (payload.synthetic or body attributes) are NEVER honored.
    const isSyntheticTest = options.allowSyntheticFixture === true && (
      principal?.actor === 'synthetic-owner-test' || options.syntheticPrincipal === true
    );
    
    // Check real owner authorization
    const isEnrolledOwner = this.enrolledOwner && (
      principal?.actor === this.enrolledOwner.actor &&
      (principal?.role === 'governance-owner' || principal?.role === 'owner')
    );
    
    if (!isEnrolledOwner && !isSyntheticTest) {
      try {
        this._appendAuditEvent({
          action: 'PROTECTED_WRITE_DENIED',
          principal: principal?.actor || 'unknown',
          target: target_id,
          details: {
            reason: 'BLOCKED_UNPROVISIONED_OWNER_AUTH',
            attempted_option: selected_option,
            attempted_client_bypass: Boolean(payload?.synthetic)
          }
        });
      } catch {}
      
      const err = new Error('Protected owner decisions require authenticated sovereign owner enrollment.');
      err.status = 403;
      err.code = 'BLOCKED_UNPROVISIONED_OWNER_AUTH';
      throw err;
    }
    
    const decisionRecord = {
      decision_id: `DEC-${crypto.randomUUID()}`,
      target_id,
      selected_option,
      scope: scope || 'EXPLICIT_SPECIFIED_ROWS_ONLY',
      rationale: rationale || 'No rationale provided.',
      source_sha256: source_sha256 || expectedSha,
      authorized_actor: principal?.actor || 'unknown',
      recorded_at: new Date().toISOString(),
      is_synthetic: isSyntheticTest,
      // Critical invariant: Decisions in this observatory DO NOT authorize Engine activation or G0 execution
      authorizes_engine_activation: false,
      authorizes_project_g0: false,
      status: isSyntheticTest ? 'SYNTHETIC_TEST_APPROVAL' : 'RECORDED_OWNER_DECISION'
    };

    // Prepare audit event
    const eventId = `EVT-${crypto.randomUUID()}`;
    const timestamp = decisionRecord.recorded_at;
    const prevHash = this.lastHash;
    const action = isSyntheticTest ? 'SYNTHETIC_OWNER_DECISION' : 'NORMATIVE_OWNER_DECISION';

    const payloadToHash = JSON.stringify({
      eventId,
      prevHash,
      timestamp,
      action,
      principal: decisionRecord.authorized_actor,
      target: target_id,
      details: decisionRecord
    });
    const currentHash = crypto.createHash('sha256').update(payloadToHash).digest('hex');

    const auditEvent = {
      eventId,
      prevHash,
      currentHash,
      timestamp,
      action,
      principal: decisionRecord.authorized_actor,
      target: target_id,
      details: decisionRecord
    };

    // Logical Transaction: Snapshot in-memory state for rollback
    const prevOwnerDecisions = new Map(this.ownerDecisions);
    const prevAuditLedger = [...this.auditLedger];
    const prevLastHash = this.lastHash;

    // Snapshot existing on-disk content for disk rollback
    let prevDecisionsJson = null;
    let prevLedgerJson = null;
    let prevCheckpointJson = null;
    let prevExtCheckpointJson = null;
    try {
      if (fs.existsSync(this.ownerDecisionsFilePath)) prevDecisionsJson = fs.readFileSync(this.ownerDecisionsFilePath, 'utf8');
      if (fs.existsSync(this.auditLedgerFilePath)) prevLedgerJson = fs.readFileSync(this.auditLedgerFilePath, 'utf8');
      if (fs.existsSync(this.checkpointFilePath)) prevCheckpointJson = fs.readFileSync(this.checkpointFilePath, 'utf8');
      if (fs.existsSync(this.externalCheckpointFilePath)) prevExtCheckpointJson = fs.readFileSync(this.externalCheckpointFilePath, 'utf8');
    } catch {}

    const newOwnerDecisions = new Map(this.ownerDecisions);
    newOwnerDecisions.set(target_id, decisionRecord);

    const newAuditLedger = [...this.auditLedger, auditEvent];
    const newTipHash = currentHash;

    const checkpoint = {
      checkpoint_id: `CHK-${crypto.randomUUID()}`,
      recorded_at: timestamp,
      ledger_tip_hash: newTipHash,
      events_count: newAuditLedger.length,
      decisions_count: newOwnerDecisions.size,
      checkpoint_digest: crypto.createHash('sha256').update(`${newTipHash}:${newAuditLedger.length}:${newOwnerDecisions.size}`).digest('hex')
    };

    const externalCheckpoint = {
      ...checkpoint,
      trust_boundary: 'EXTERNAL_ISOLATED_CHECKPOINT'
    };

    // Execute atomic multi-file persistence
    try {
      // 1. Write owner decisions file
      writeFileSyncAtomic(this.ownerDecisionsFilePath, JSON.stringify([...newOwnerDecisions.values()], null, 2));

      // 2. Write audit ledger file
      writeFileSyncAtomic(this.auditLedgerFilePath, JSON.stringify(newAuditLedger, null, 2));

      // 3. Write local checkpoint
      writeFileSyncAtomic(this.checkpointFilePath, JSON.stringify(checkpoint, null, 2));

      // 4. Write external checkpoint
      writeFileSyncAtomic(this.externalCheckpointFilePath, JSON.stringify(externalCheckpoint, null, 2));

      // 5. Append to checkpoint history log
      const historyDir = path.dirname(this.checkpointHistoryPath);
      if (!fs.existsSync(historyDir)) {
        fs.mkdirSync(historyDir, { recursive: true });
      }
      fs.appendFileSync(this.checkpointHistoryPath, JSON.stringify(externalCheckpoint) + '\n', 'utf8');

      // Commit in-memory state ONLY AFTER all writes succeed
      this.ownerDecisions = newOwnerDecisions;
      this.auditLedger = newAuditLedger;
      this.lastHash = newTipHash;

      return decisionRecord;
    } catch (writeErr) {
      // Roll back in-memory state immediately
      this.ownerDecisions = prevOwnerDecisions;
      this.auditLedger = prevAuditLedger;
      this.lastHash = prevLastHash;

      // Attempt disk rollback to previous clean state
      try {
        if (prevDecisionsJson !== null) writeFileSyncAtomic(this.ownerDecisionsFilePath, prevDecisionsJson);
        if (prevLedgerJson !== null) writeFileSyncAtomic(this.auditLedgerFilePath, prevLedgerJson);
        if (prevCheckpointJson !== null) writeFileSyncAtomic(this.checkpointFilePath, prevCheckpointJson);
        if (prevExtCheckpointJson !== null) writeFileSyncAtomic(this.externalCheckpointFilePath, prevExtCheckpointJson);
      } catch (rollbackErr) {
        this.integrityIncident = {
          code: 'TRANSACTION_ROLLBACK_FAILED',
          reason: `Disk write failed and rollback was incomplete: ${rollbackErr.message}`
        };
      }

      const err = new Error(`Logical transaction failed: could not persist decision and audit event atomically (${writeErr.message})`);
      err.status = 500;
      err.code = 'PERSISTENCE_TRANSACTION_FAILED';
      throw err;
    }
  }

  /**
   * Dedicated server-side test fixture helper for isolated testing only.
   * Cannot be invoked through the production HTTP route.
   */
  recordSyntheticFixtureDecision(payload, principal = { actor: 'synthetic-owner-test', role: 'governance-owner' }) {
    return this.recordProtectedOwnerDecision(payload, principal, { allowSyntheticFixture: true });
  }

  /**
   * AC-47: Validate archive entries against path traversal, symlinks, huge input, and bombs
   */
  validateArchiveSafety(entries = []) {
    for (const entry of entries) {
      const name = entry.name || '';
      if (name.includes('..') || path.isAbsolute(name) || name.startsWith('/') || name.startsWith('\\')) {
        return { safe: false, reason: 'PATH_TRAVERSAL_DETECTED', entry: name };
      }
      if (entry.isSymlink) {
        return { safe: false, reason: 'SYMLINK_REJECTED', entry: name };
      }
      if (entry.uncompressedSize && entry.uncompressedSize > 100 * 1024 * 1024) {
        return { safe: false, reason: 'HUGE_INPUT_REJECTED', entry: name };
      }
      if (entry.uncompressedSize && entry.compressedSize && (entry.uncompressedSize / entry.compressedSize > 100)) {
        return { safe: false, reason: 'NESTED_BOMB_RATIO_EXCEEDED', entry: name };
      }
      if (entry.hasMacro) {
        return { safe: false, reason: 'MACRO_EXECUTION_REJECTED', entry: name };
      }
    }
    return { safe: true };
  }

  /**
   * AC-40: Verifiable backup snapshot and safe restore verification
   */
  createBackupSnapshot() {
    const backup = {
      backup_id: `BKP-${crypto.randomUUID()}`,
      created_at: new Date().toISOString(),
      metadata: this.getOverview().metadata,
      draft_decisions: [...this.draftDecisions.values()],
      owner_decisions: [...this.ownerDecisions.values()],
      audit_ledger: [...this.auditLedger],
      tip_hash: this.lastHash
    };
    const digest = crypto.createHash('sha256').update(JSON.stringify(backup)).digest('hex');
    backup.backup_digest = digest;
    return backup;
  }

  verifyBackupSnapshot(backup) {
    if (!backup || !backup.backup_digest) {
      return { verifiable: false, reason: 'MISSING_BACKUP_DIGEST' };
    }
    const copy = { ...backup };
    delete copy.backup_digest;
    const computed = crypto.createHash('sha256').update(JSON.stringify(copy)).digest('hex');
    const isValid = computed === backup.backup_digest;
    return {
      verifiable: isValid,
      backup_id: backup.backup_id,
      can_overwrite_owner_database: false, // Invariant: Restore-copy NEVER overwrites active owner database
      reason: isValid ? 'BACKUP_VERIFIED_TAMPER_FREE' : 'BACKUP_DIGEST_MISMATCH'
    };
  }

  /**
   * AC-43 & AGHR-QLE-GOV-OBS-004:
   * Genuine JSON Schema validation against version-pinned schema files.
   * Returns VALIDATION_FAILED with errors if malformed, NOT_VERIFIED if missing.
   */
  validateExportAgainstSchema(exportArtifact, schemaId) {
    // 1. Resolve schema file from known pinned locations
    let schemaPath = path.resolve('server/studio/sgo/schemas', schemaId);
    if (!fs.existsSync(schemaPath)) {
      schemaPath = path.resolve('docs/contracts/aghr-rc3', schemaId);
    }
    
    if (!fs.existsSync(schemaPath)) {
      return {
        schema_id: schemaId,
        valid: false,
        validation_status: 'NOT_VERIFIED',
        reason: 'SCHEMA_MISSING'
      };
    }

    try {
      const schemaContent = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
      let artifactData = exportArtifact;
      if (typeof exportArtifact === 'string') {
        artifactData = JSON.parse(exportArtifact);
      } else if (exportArtifact && typeof exportArtifact.content === 'string') {
        artifactData = JSON.parse(exportArtifact.content);
      }

      const valResult = validateDataAgainstSchema(artifactData, schemaContent);
      if (!valResult.valid) {
        return {
          schema_id: schemaId,
          valid: false,
          validation_status: 'VALIDATION_FAILED',
          errors: valResult.errors
        };
      }

      return {
        schema_id: schemaId,
        valid: true,
        validation_status: 'VALIDATED_PASSED'
      };
    } catch (err) {
      return {
        schema_id: schemaId,
        valid: false,
        validation_status: 'VALIDATION_FAILED',
        errors: [{ path: '/', message: `Malformed JSON artifact or schema: ${err.message}` }]
      };
    }
  }

  _appendAuditEvent(eventData) {
    if (this.integrityIncident) {
      const err = new Error(`Audit event recording blocked by active integrity incident: ${this.integrityIncident.reason} (${this.integrityIncident.code})`);
      err.status = 500;
      err.code = this.integrityIncident.code || 'INTEGRITY_INCIDENT_FAIL_CLOSED';
      throw err;
    }

    const eventId = `EVT-${crypto.randomUUID()}`;
    const timestamp = new Date().toISOString();
    const prevHash = this.lastHash;
    
    const payloadToHash = JSON.stringify({
      eventId,
      prevHash,
      timestamp,
      action: eventData.action,
      principal: eventData.principal,
      target: eventData.target,
      details: eventData.details
    });
    
    const currentHash = crypto.createHash('sha256').update(payloadToHash).digest('hex');
    
    const fullEvent = {
      eventId,
      prevHash,
      currentHash,
      timestamp,
      action: eventData.action,
      principal: eventData.principal,
      target: eventData.target,
      details: eventData.details
    };
    
    const prevLedger = [...this.auditLedger];
    const prevLastHash = this.lastHash;
    const newLedger = [...this.auditLedger, fullEvent];

    // Atomically persist ledger and checkpoints without silent error suppression
    try {
      writeFileSyncAtomic(this.auditLedgerFilePath, JSON.stringify(newLedger, null, 2));

      const checkpoint = {
        checkpoint_id: `CHK-${crypto.randomUUID()}`,
        recorded_at: timestamp,
        ledger_tip_hash: currentHash,
        events_count: newLedger.length,
        decisions_count: this.ownerDecisions.size,
        checkpoint_digest: crypto.createHash('sha256').update(`${currentHash}:${newLedger.length}:${this.ownerDecisions.size}`).digest('hex')
      };
      writeFileSyncAtomic(this.checkpointFilePath, JSON.stringify(checkpoint, null, 2));

      const externalCheckpoint = {
        ...checkpoint,
        trust_boundary: 'EXTERNAL_ISOLATED_CHECKPOINT'
      };
      writeFileSyncAtomic(this.externalCheckpointFilePath, JSON.stringify(externalCheckpoint, null, 2));

      const historyDir = path.dirname(this.checkpointHistoryPath);
      if (!fs.existsSync(historyDir)) {
        fs.mkdirSync(historyDir, { recursive: true });
      }
      fs.appendFileSync(this.checkpointHistoryPath, JSON.stringify(externalCheckpoint) + '\n', 'utf8');

      // Commit in-memory state ONLY AFTER all disk writes succeed
      this.auditLedger = newLedger;
      this.lastHash = currentHash;

      return fullEvent;
    } catch (writeErr) {
      // Roll back in-memory state immediately
      this.auditLedger = prevLedger;
      this.lastHash = prevLastHash;
      const err = new Error(`Failed to persist audit event: ${writeErr.message}`);
      err.status = 500;
      err.code = 'PERSISTENCE_FAILED';
      throw err;
    }
  }

  _syncCheckpointFile() {
    const checkpoint = {
      checkpoint_id: `CHK-${crypto.randomUUID()}`,
      recorded_at: new Date().toISOString(),
      ledger_tip_hash: this.lastHash,
      events_count: this.auditLedger.length,
      decisions_count: this.ownerDecisions.size,
      checkpoint_digest: crypto.createHash('sha256').update(`${this.lastHash}:${this.auditLedger.length}:${this.ownerDecisions.size}`).digest('hex')
    };
    writeFileSyncAtomic(this.checkpointFilePath, JSON.stringify(checkpoint, null, 2));

    // Synchronize external checkpoint across trust boundary (AGHR-QLE-GOV-OBS-005)
    const externalCheckpoint = {
      ...checkpoint,
      trust_boundary: 'EXTERNAL_ISOLATED_CHECKPOINT'
    };
    writeFileSyncAtomic(this.externalCheckpointFilePath, JSON.stringify(externalCheckpoint, null, 2));

    // Append to historical checkpoint ledger log
    const historyDir = path.dirname(this.checkpointHistoryPath);
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true });
    }
    fs.appendFileSync(this.checkpointHistoryPath, JSON.stringify(externalCheckpoint) + '\n', 'utf8');
  }

  getAuditLedger() {
    return {
      tip_hash: this.lastHash,
      events_count: this.auditLedger.length,
      events: [...this.auditLedger]
    };
  }

  verifyLedgerIntegrity() {
    // 0. Active integrity incident immediately fails verification
    if (this.integrityIncident) {
      return {
        valid: false,
        incident: this.integrityIncident,
        reason: this.integrityIncident.reason,
        code: this.integrityIncident.code
      };
    }

    // 1. Verify internal hash chain
    let prev = this.genesisHash;
    for (let i = 0; i < this.auditLedger.length; i++) {
      const event = this.auditLedger[i];
      if (event.prevHash !== prev) {
        return {
          valid: false,
          error_index: i,
          reason: `Broken hash chain at index ${i}: expected prevHash ${prev}, found ${event.prevHash}`
        };
      }
      
      const payloadToHash = JSON.stringify({
        eventId: event.eventId,
        prevHash: event.prevHash,
        timestamp: event.timestamp,
        action: event.action,
        principal: event.principal,
        target: event.target,
        details: event.details
      });
      
      const computed = crypto.createHash('sha256').update(payloadToHash).digest('hex');
      if (computed !== event.currentHash) {
        return {
          valid: false,
          error_index: i,
          reason: `Hash mismatch at index ${i}: recomputed ${computed}, recorded ${event.currentHash}`
        };
      }
      prev = event.currentHash;
    }

    // 2. Verify ledger tip
    if (this.auditLedger.length > 0 && prev !== this.lastHash) {
      return {
        valid: false,
        reason: `Ledger tip mismatch: computed tip ${prev} does not match recorded tip ${this.lastHash}. Truncation detected.`
      };
    }

    // 3. Verify against independently retained checkpoint file (AGHR-QLE-GOV-OBS-004)
    if (fs.existsSync(this.checkpointFilePath)) {
      try {
        const checkpoint = JSON.parse(fs.readFileSync(this.checkpointFilePath, 'utf8'));
        if (checkpoint.ledger_tip_hash && checkpoint.ledger_tip_hash !== this.lastHash) {
          return {
            valid: false,
            reason: `Checkpoint mismatch: independent checkpoint tip '${checkpoint.ledger_tip_hash}' does not match active ledger tip '${this.lastHash}'. Truncation or tamper detected.`,
            checkpoint_tip: checkpoint.ledger_tip_hash,
            ledger_tip: this.lastHash
          };
        }
        if (typeof checkpoint.events_count === 'number' && checkpoint.events_count !== this.auditLedger.length) {
          return {
            valid: false,
            reason: `Checkpoint event count mismatch: expected ${checkpoint.events_count}, found ${this.auditLedger.length}. Truncation detected.`
          };
        }
      } catch (e) {
        return {
          valid: false,
          reason: `Failed to verify independent checkpoint: ${e.message}`
        };
      }
    }

    // 4. Verify against independently retained external checkpoint (AGHR-QLE-GOV-OBS-005)
    if (fs.existsSync(this.externalCheckpointFilePath)) {
      try {
        const extCheckpoint = JSON.parse(fs.readFileSync(this.externalCheckpointFilePath, 'utf8'));
        if (extCheckpoint.ledger_tip_hash && extCheckpoint.ledger_tip_hash !== this.lastHash) {
          return {
            valid: false,
            reason: `External checkpoint mismatch: external checkpoint tip '${extCheckpoint.ledger_tip_hash}' does not match active ledger tip '${this.lastHash}'. Cross-boundary tampering or truncation detected.`,
            external_checkpoint_tip: extCheckpoint.ledger_tip_hash,
            ledger_tip: this.lastHash
          };
        }
        if (typeof extCheckpoint.events_count === 'number' && extCheckpoint.events_count !== this.auditLedger.length) {
          return {
            valid: false,
            reason: `External checkpoint event count mismatch: expected ${extCheckpoint.events_count}, found ${this.auditLedger.length}. Truncation detected.`
          };
        }
      } catch (e) {
        return {
          valid: false,
          reason: `Failed to verify external checkpoint: ${e.message}`
        };
      }
    }

    return {
      valid: true,
      events_verified: this.auditLedger.length,
      tip_hash: this.lastHash,
      external_checkpoint_verified: fs.existsSync(this.externalCheckpointFilePath)
    };
  }
}
