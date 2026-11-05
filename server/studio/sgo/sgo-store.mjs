import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const COMPILED_DATA_PATH = path.resolve('server/studio/sgo/data/sgo-compiled.json');

export class SgoStore {
  constructor(options = {}) {
    this.options = options;
    this.storageRoot = options.storageRoot || path.resolve('.governance/sgo');
    fs.mkdirSync(this.storageRoot, { recursive: true });
    
    // Load compiled static dataset
    const rawData = fs.readFileSync(COMPILED_DATA_PATH, 'utf8');
    this.data = JSON.parse(rawData);
    
    // In-memory runtime state for drafts and audit ledger
    this.draftDecisions = new Map();
    this.auditLedger = [];
    this.genesisHash = '0'.repeat(64);
    this.lastHash = this.genesisHash;
    
    // Enrolled owner identity (null by default; requires explicit enrollment)
    this.enrolledOwner = options.enrolledOwner || null;
    
    // Seed initial genesis audit anchor
    this._appendAuditEvent({
      action: 'SYSTEM_INITIALIZATION',
      principal: 'system',
      target: 'SGO_DATASET_V1.0.0',
      details: {
        total_items: this.data.metadata.total_items,
        source_255: this.data.metadata.source_255_count,
        v4_candidates: this.data.metadata.v4_count,
        v2_historical: this.data.metadata.v2_count,
        priority_groups: this.data.metadata.priority_groups_count,
        total_designed_tests: this.data.metadata.total_designed_tests,
        genesis: true
      }
    });
  }

  getOverview() {
    return {
      version: this.data.version,
      contract_version: this.data.contract_version,
      metadata: {
        ...this.data.metadata,
        draft_decisions_count: this.draftDecisions.size,
        audit_events_count: this.auditLedger.length,
        ledger_tip_hash: this.lastHash,
        owner_enrolled: !!this.enrolledOwner
      }
    };
  }

  getItems(filters = {}) {
    let items = this.data.items;
    
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
      items: items.slice(offset, offset + limit).map(i => ({
        ...i,
        draft_decision: this.draftDecisions.get(i.id) || null
      }))
    };
  }

  getItem(id) {
    const item = this.data.items.find(i => i.id === id);
    if (!item) return null;
    
    const itemRelations = this.data.relations.filter(r => r.source === id || r.target === id);
    const itemTests = this.data.test_cases.filter(t => t.item_id === id);
    const draftDecision = this.draftDecisions.get(id) || null;
    
    return {
      ...item,
      relations: itemRelations,
      test_cases: itemTests,
      draft_decision: draftDecision
    };
  }

  getPriorityDecisions() {
    return this.data.priority_groups.map(g => ({
      ...g,
      draft_decision: this.draftDecisions.get(g.id) || null
    }));
  }

  getPriorityDecision(id) {
    const group = this.data.priority_groups.find(g => g.id === id);
    if (!group) return null;
    
    const affectedItems = this.data.items.filter(i => group.rows.includes(i.id));
    const draftDecision = this.draftDecisions.get(id) || null;
    
    return {
      ...group,
      affected_items: affectedItems,
      draft_decision: draftDecision
    };
  }

  getRelations(filters = {}) {
    let relations = this.data.relations;
    if (filters.type) {
      relations = relations.filter(r => r.type === filters.type);
    }
    if (filters.item_id) {
      relations = relations.filter(r => r.source === filters.item_id || r.target === filters.item_id);
    }
    return {
      total: relations.length,
      relations: relations.slice(0, Number(filters.limit) || 500)
    };
  }

  getTestCases(itemId) {
    if (itemId) {
      return this.data.test_cases.filter(t => t.item_id === itemId);
    }
    return this.data.test_cases;
  }

  saveDraftDecision(payload, actor = 'operator') {
    const { target_id, selected_option, rationale, custom_wording } = payload;
    if (!target_id || !selected_option) {
      throw new Error('target_id and selected_option are required.');
    }
    
    const draft = {
      target_id,
      selected_option,
      rationale: rationale || '',
      custom_wording: custom_wording || null,
      saved_at: new Date().toISOString(),
      saved_by: actor,
      status: 'DRAFT_NON_NORMATIVE', // Invariant: Drafts are never normative approvals
      normative_approval_granted: false
    };
    
    this.draftDecisions.set(target_id, draft);
    
    this._appendAuditEvent({
      action: 'DRAFT_DECISION_SAVED',
      principal: actor,
      target: target_id,
      details: {
        selected_option,
        rationale,
        is_normative: false
      }
    });
    
    return draft;
  }

  recordProtectedOwnerDecision(payload, principal, options = {}) {
    const { target_id, selected_option, rationale, scope, source_sha256 } = payload;
    
    // Check if this is a synthetic test call
    const isSyntheticTest = options.synthetic === true || principal?.actor === 'synthetic-owner-test';
    
    // Check real owner authorization
    const isEnrolledOwner = this.enrolledOwner && (
      principal?.actor === this.enrolledOwner.actor ||
      principal?.role === 'governance-owner'
    );
    
    if (!isEnrolledOwner && !isSyntheticTest) {
      this._appendAuditEvent({
        action: 'PROTECTED_WRITE_DENIED',
        principal: principal?.actor || 'unknown',
        target: target_id,
        details: {
          reason: 'BLOCKED_UNPROVISIONED_OWNER_AUTH',
          attempted_option: selected_option
        }
      });
      
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
      source_sha256: source_sha256 || '9aa911136b46e391398430f3670da7111a9d6df435ebaa54c287d2145ad002b2',
      authorized_actor: principal?.actor || 'unknown',
      recorded_at: new Date().toISOString(),
      is_synthetic: isSyntheticTest,
      // Critical invariant: Decisions in this observatory DO NOT authorize Engine activation or G0 execution
      authorizes_engine_activation: false,
      authorizes_project_g0: false,
      status: isSyntheticTest ? 'SYNTHETIC_TEST_APPROVAL' : 'RECORDED_OWNER_DECISION'
    };
    
    this._appendAuditEvent({
      action: isSyntheticTest ? 'SYNTHETIC_OWNER_DECISION' : 'NORMATIVE_OWNER_DECISION',
      principal: decisionRecord.authorized_actor,
      target: target_id,
      details: decisionRecord
    });
    
    return decisionRecord;
  }

  _appendAuditEvent(eventData) {
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
    
    this.auditLedger.push(fullEvent);
    this.lastHash = currentHash;
    return fullEvent;
  }

  getAuditLedger() {
    return {
      tip_hash: this.lastHash,
      events_count: this.auditLedger.length,
      events: [...this.auditLedger]
    };
  }

  verifyLedgerIntegrity() {
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
    return {
      valid: true,
      events_verified: this.auditLedger.length,
      tip_hash: this.lastHash
    };
  }
}
