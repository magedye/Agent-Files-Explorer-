import crypto from 'node:crypto';

/**
 * Neutralizes potential formula injection in CSV/spreadsheet fields
 */
function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`; // Escape formula trigger characters
  }
  return str;
}

function escapeCsv(value) {
  const sanitized = sanitizeCsvCell(value);
  if (/[",\n\r]/.test(sanitized)) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

export class SgoExporter {
  constructor(store, studio = null) {
    this.store = store;
    this.studio = studio;
  }

  exportArtifact(exportType, options = {}) {
    switch (exportType) {
      case 'QLE_GOV_SOURCE_RECONCILIATION.csv':
        return this._exportSourceReconciliationCsv();
      
      case 'QLE_GOV_QUALIFICATION_MATRIX.json':
        return this._exportQualificationMatrixJson();
        
      case 'QLE_GOV_OPEN_DECISIONS.md':
        return this._exportOpenDecisionsMd();
        
      case 'QLE_GOV_EVIDENCE_MANIFEST.json':
        return this._exportEvidenceManifestJson();
        
      case 'QLE_GOV_APPROVED_RULESET_CANDIDATE.json':
        return this._exportApprovedRulesetCandidateJson();
        
      case 'QLE_GOV_OWNER_APPROVAL_RECORD.md':
        return this._exportOwnerApprovalRecordMd();
        
      case 'QLE_GOV_OWNER_DECISIONS.xlsx':
        return this._exportOwnerDecisionsCsvFallback();
        
      case 'QLE_GOV_OWNER_REVIEW_WORKING.xlsx':
        return this._exportOwnerReviewWorkingCsvFallback();
        
      default:
        throw new Error(`Unknown export type: ${exportType}`);
    }
  }

  _exportSourceReconciliationCsv() {
    const items = this.store.getItems({ limit: 1000 }).items;
    const headers = [
      'item_id', 'origin', 'title_ar', 'source_declared_force',
      'baseline_ref', 'atomicity', 'case_count', 'test_status',
      'decision_status', 'aapes_domains'
    ];

    const rows = [headers.join(',')];
    for (const item of items) {
      const row = [
        escapeCsv(item.id),
        escapeCsv(item.origin),
        escapeCsv(item.title_ar),
        escapeCsv(item.source_declared_force),
        escapeCsv(item.baseline_ref || ''),
        escapeCsv(item.atomicity),
        escapeCsv(item.case_count),
        escapeCsv(item.test_execution_status),
        escapeCsv(item.decision_status),
        escapeCsv((item.aapes_domains || []).join(';'))
      ];
      rows.push(row.join(','));
    }

    return {
      filename: 'QLE_GOV_SOURCE_RECONCILIATION.csv',
      mime_type: 'text/csv; charset=utf-8',
      content: rows.join('\r\n') + '\r\n'
    };
  }

  _exportQualificationMatrixJson() {
    const items = this.store.getItems({ limit: 1000 }).items;
    const matrix = items.map(item => ({
      item_id: item.id,
      origin: item.origin,
      source_declared_force: item.source_declared_force,
      designed_cases_count: item.case_count,
      // INVARIANT: All designed test cases remain DESIGNED_NOT_RUN
      test_execution_status: 'DESIGNED_NOT_RUN',
      executed_cases_count: 0,
      passed_cases_count: 0,
      qualification_verdict: 'NOT_ASSESSED',
      aapes_domains: item.aapes_domains || []
    }));

    return {
      filename: 'QLE_GOV_QUALIFICATION_MATRIX.json',
      mime_type: 'application/json; charset=utf-8',
      content: JSON.stringify({
        schema_version: '1.2.0',
        generated_at: new Date().toISOString(),
        total_items_evaluated: matrix.length,
        items: matrix
      }, null, 2) + '\n'
    };
  }

  _exportOpenDecisionsMd() {
    const priorityGroups = this.store.getPriorityDecisions();
    const mdLines = [
      '# قرارات الحوكمة المعلقة وغير المحسومة — QLE Open Decisions',
      '',
      `**تاريخ التوليد:** ${new Date().toISOString()}`,
      `**الحالة المعيارية:** مسودة استعراض غير معتمدة (Pending Owner Review)`,
      '',
      '---',
      '',
      '## 1. مجموعات قرارات الأولوية الـ 11',
      ''
    ];

    for (const g of priorityGroups) {
      mdLines.push(`### [${g.id}] ${g.title_ar} (${g.priority})`);
      mdLines.push(`- **السؤال المعياري:** ${g.question_ar}`);
      mdLines.push(`- **التوصية الاستشارية (غير المختارة):** ${g.recommended_option} — *${g.recommendation_advisory_note}*`);
      mdLines.push(`- **الصفوف المتأثرة:** ${g.rows.length} صفاً`);
      mdLines.push(`- **حالة القرار الحالية:** ${g.draft_decision ? 'DRAFT_RECORDED' : 'PENDING_OWNER_REVIEW'}`);
      mdLines.push('');
    }

    return {
      filename: 'QLE_GOV_OPEN_DECISIONS.md',
      mime_type: 'text/markdown; charset=utf-8',
      content: mdLines.join('\n')
    };
  }

  _exportEvidenceManifestJson() {
    const overview = this.store.getOverview();
    const auditLedger = this.store.getAuditLedger();
    const manifest = {
      manifest_version: '1.0.0',
      generated_at: new Date().toISOString(),
      source_repository: 'https://github.com/magedye/Agent-Files-Explorer-',
      profile: 'QLE_SEMANTIC_GOVERNANCE_OBSERVATORY',
      dataset_metadata: overview.metadata,
      audit_ledger: {
        total_events: auditLedger.events_count,
        tip_hash: auditLedger.tip_hash,
        verification_status: this.store.verifyLedgerIntegrity().valid ? 'TAMPER_EVIDENT_VALID' : 'TAMPER_DETECTED'
      },
      source_digests: {
        'OWNER_RULE_DECISION_TABLE_DRAFT_423.xlsx': '9aa911136b46e391398430f3670da7111a9d6df435ebaa54c287d2145ad002b2',
        'QLE_423_Skill_v1.2.0_Applied_Complete.zip': '4518d980ccfc9e3aa186a9bc35465b24debab00378d7d7a21254b83276725b49'
      }
    };

    return {
      filename: 'QLE_GOV_EVIDENCE_MANIFEST.json',
      mime_type: 'application/json; charset=utf-8',
      content: JSON.stringify(manifest, null, 2) + '\n'
    };
  }

  _exportApprovedRulesetCandidateJson() {
    // INVARIANT: Approved ruleset is EMPTY or BLOCKED with zero authentic approvals
    return {
      filename: 'QLE_GOV_APPROVED_RULESET_CANDIDATE.json',
      mime_type: 'application/json; charset=utf-8',
      content: JSON.stringify({
        status: 'EMPTY_ZERO_AUTHENTIC_APPROVALS',
        approved_items_count: 0,
        approved_items: [],
        disclaimer_ar: 'هذا الملف فارغ عن عمد لعدم وجود اعتمادات سيادية مسجلة من المالك الحقيقي حتى الآن.',
        disclaimer_en: 'This export is intentionally empty as no authentic owner approvals have been granted.'
      }, null, 2) + '\n'
    };
  }

  _exportOwnerApprovalRecordMd() {
    // INVARIANT: Template draft unless genuine authenticated scoped record exists
    return {
      filename: 'QLE_GOV_OWNER_APPROVAL_RECORD.md',
      mime_type: 'text/markdown; charset=utf-8',
      content: `# سجل موافقة المالك المعياري — مسودة قالب غير معتمدة\n\n**الحالة:** قالب مسودة (DRAFT_TEMPLATE) — لا توجد موافقة مالك معتمدة مسجلة حالياً.\n\nتتطلب الموافقة المعيارية جلسة تسجيل سيادية صريحة وفق §6.8 من التوجيه التنفيذي.`
    };
  }

  _exportOwnerDecisionsCsvFallback() {
    const items = this.store.getItems({ limit: 1000 }).items;
    const headers = ['target_id', 'origin', 'decision_option', 'rationale', 'saved_by', 'status'];
    const rows = [headers.join(',')];
    for (const i of items) {
      const d = i.draft_decision;
      if (d) {
        rows.push([
          escapeCsv(i.id),
          escapeCsv(i.origin),
          escapeCsv(d.selected_option),
          escapeCsv(d.rationale),
          escapeCsv(d.saved_by),
          escapeCsv(d.status)
        ].join(','));
      }
    }
    return {
      filename: 'QLE_GOV_OWNER_DECISIONS.csv',
      mime_type: 'text/csv; charset=utf-8',
      content: rows.join('\r\n') + '\r\n'
    };
  }

  _exportOwnerReviewWorkingCsvFallback() {
    const pGroups = this.store.getPriorityDecisions();
    const headers = ['group_id', 'priority', 'title_ar', 'recommended_advisory', 'rows_count', 'draft_status'];
    const rows = [headers.join(',')];
    for (const g of pGroups) {
      rows.push([
        escapeCsv(g.id),
        escapeCsv(g.priority),
        escapeCsv(g.title_ar),
        escapeCsv(g.recommended_option),
        escapeCsv(g.rows.length),
        escapeCsv(g.draft_decision ? 'DRAFT_SAVED' : 'UNREVIEWED')
      ].join(','));
    }
    return {
      filename: 'QLE_GOV_OWNER_REVIEW_WORKING.csv',
      mime_type: 'text/csv; charset=utf-8',
      content: rows.join('\r\n') + '\r\n'
    };
  }

  /**
   * Prepares a Governed Draft Change Package into rc3-local SQLite draft custody
   */
  async proposeChangePackage(payload, studioInstance = null, principal = null) {
    const activeStudio = studioInstance || this.studio;
    if (!activeStudio) {
      throw new StudioError(500, 'INTERNAL_ERROR', 'Studio instance required for Change Package drafting.');
    }

    const { target_id, title, proposed_statement_ar, rationale } = payload;
    const item = (this.store && this.store.getItem(target_id)) || {};

    const rawId = (target_id || 'QL4-A01').replace(/[^a-zA-Z0-9_-]/g, '-').toUpperCase();
    const cleanId = rawId.startsWith('OBS-') ? rawId : `OBS-${rawId}`;
    const cpTitle = title || `SGO QLE Proposal: Review of ${target_id}`;
    const ruleText = (proposed_statement_ar || item.proposed_statement_ar || item.original_statement_ar || 'Governed rule statement under SGO review.').trim();

    // Build compliant AGHR rc3 OBSERVATION item
    const structured = {
      id: cleanId,
      title: cpTitle,
      kind: 'OBSERVATION',
      force: 'INFORMATIVE',
      severity: 'info',
      scope: { paths: ['server/studio/sgo/'] },
      rule: ruleText,
      impact: {
        band: 'info',
        evidence: 'assumed'
      }
    };

    const draftInput = {
      title: cpTitle,
      kind: 'OBSERVATION',
      source: {
        type: 'request',
        ref: `sgo://${target_id}`
      },
      proposed_yaml: JSON.stringify(structured, null, 2) + '\n'
    };

    // Prepare proposal through canonical draftValidator (E5 Python worker)
    const prepared = await activeStudio.draftValidator.prepare(draftInput);
    const cpId = `CP-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0, 8)}`;
    const fullPrepared = {
      ...prepared,
      id: cpId,
      request_id: crypto.randomUUID(),
      target_item_id: target_id
    };

    const scope = {
      workspace_id: activeStudio.workspace.id,
      target_project: 'studio-drafts',
      action: 'cp.create',
      resource_id: cpId,
      proposal_version_hash: prepared.proposal_version_hash
    };

    const activePrincipal = principal || { actor: 'operator', role: 'operator' };
    const intentId = crypto.randomUUID();
    activeStudio.intents.set(intentId, {
      principal: activePrincipal,
      payload: draftInput,
      prepared: Object.freeze(fullPrepared),
      scope,
      expires: Date.now() + 120000,
      grant: null
    });

    // Authorize locally via operator intent approval
    activeStudio.approveIntent(intentId);
    const entry = activeStudio.intents.get(intentId);
    if (!entry || !entry.grant) {
      throw new StudioError(500, 'INTERNAL_ERROR', 'Failed to issue local draft grant.');
    }

    const receipt = activeStudio.authority.authorize(activePrincipal, scope, entry.grant);
    const created = activeStudio.store.createDraft(receipt, fullPrepared);
    activeStudio.intents.delete(intentId);

    return {
      success: true,
      change_package_id: cpId,
      change_package: created,
      status: prepared.status || 'DRAFT',
      target_item_id: target_id,
      proposal_version_hash: prepared.proposal_version_hash,
      message_ar: `تم إنشاء حزمة التغيير المسودة [${cpId}] بنجاح في عهدة rc3-local SQLite دون المساس بالخط الأساسي المعتمد.`
    };
  }
}
