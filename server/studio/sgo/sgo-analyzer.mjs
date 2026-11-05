/**
 * SGO Analyzer: Co-Merge Obligation Preservation & Static Impact Simulator
 */

export class SgoAnalyzer {
  constructor(store) {
    this.store = store;
  }

  /**
   * Co-Merge Lab: Analyze consolidation proposal against selected source items
   * Evaluates atomic obligation preservation and enforces safety consolidation gates.
   */
  analyzeMergeProposal(sourceItemIds, candidateStatement, options = {}) {
    if (!Array.isArray(sourceItemIds) || sourceItemIds.length === 0) {
      throw new Error('sourceItemIds must be a non-empty array of item IDs.');
    }

    const items = sourceItemIds.map(id => this.store.getItem(id)).filter(Boolean);
    if (items.length !== sourceItemIds.length) {
      throw new Error('One or more sourceItemIds were not found in the SGO repository.');
    }

    const proposedForce = options.proposed_force || 'MUST';
    const candidateText = candidateStatement || (options.simulate_drop_p0 ? '' : items.map(it => it.proposed_statement_ar || it.original_statement_ar || '').join(' ؛ '));

    // Decompose source obligations
    const sourceObligations = [];
    for (const item of items) {
      const atoms = this._extractAtomicObligations(item);
      sourceObligations.push(...atoms);
    }

    // Evaluate reverse trace and safe consolidation gates
    const reverseTrace = [];
    const gateViolations = [];

    for (const atom of sourceObligations) {
      const match = this._evaluateObligationPreservation(atom, candidateText, proposedForce, options);
      reverseTrace.push(match);

      // Gate 1: Check for dropped or unknown P0 obligations
      if (atom.priority === 'P0' && (match.status === 'DROPPED' || match.status === 'UNKNOWN')) {
        gateViolations.push({
          gate: 'GATE_P0_PRESERVATION',
          severity: 'CRITICAL_BLOCKER',
          source_item_id: atom.source_item_id,
          obligation_id: atom.id,
          reason: `P0 obligation '${atom.id}' from source '${atom.source_item_id}' is dropped or unverified in candidate consolidation.`
        });
      }

      // Gate 2: Check for normative force weakening (e.g. MUST -> SHOULD/MAY)
      if (['MUST', 'MUST_NOT'].includes(atom.normative_force) && ['SHOULD', 'MAY'].includes(proposedForce)) {
        gateViolations.push({
          gate: 'GATE_FORCE_PRESERVATION',
          severity: 'CRITICAL_BLOCKER',
          source_item_id: atom.source_item_id,
          obligation_id: atom.id,
          reason: `Normative force weakened from '${atom.normative_force}' to '${proposedForce}'. Force reduction requires separate explicit owner authority.`
        });
      }

      // Gate 3: Check for altered actor or missing condition
      if (match.status === 'MODIFIED' && match.modifications.includes('ACTOR_CHANGED')) {
        gateViolations.push({
          gate: 'GATE_ACTOR_FIDELITY',
          severity: 'WARNING',
          source_item_id: atom.source_item_id,
          obligation_id: atom.id,
          reason: `Actor was modified in candidate statement: expected '${atom.actor}'.`
        });
      }
    }

    // Check if new obligations are introduced without source provenance
    const introducedObligations = this._detectIntroducedObligations(items, candidateText);

    const safeToConsolidate = gateViolations.filter(v => v.severity === 'CRITICAL_BLOCKER').length === 0;

    return {
      source_item_ids: sourceItemIds,
      candidate_statement: candidateText,
      proposed_force: proposedForce,
      total_source_obligations: sourceObligations.length,
      reverse_trace: reverseTrace,
      introduced_obligations: introducedObligations,
      gate_violations: gateViolations,
      safety_assessment: {
        safe_consolidation_verdict: safeToConsolidate ? 'SAFE_CONSOLIDATION_CANDIDATE' : 'BLOCKED_UNSAFE_MERGE',
        blocker_count: gateViolations.filter(v => v.severity === 'CRITICAL_BLOCKER').length,
        warning_count: gateViolations.filter(v => v.severity === 'WARNING').length,
        advisory_note: safeToConsolidate 
          ? 'التعديل التنظيمي المرشح يحفظ جميع التزامات P0 والقوة الإلزامية. لا يزال يتطلب قرار مالك صريح قبل الإحلال.'
          : 'فشل فحص الأمان للدمج: توجد التزامات P0 مسقطة أو تخفيف في القوة الإلزامية. الدمج الآلي محظور.'
      }
    };
  }

  _extractAtomicObligations(item) {
    const text = item.original_statement_ar || '';
    const clauses = text.split(/[؛.;]/).map(c => c.trim()).filter(Boolean);
    
    return clauses.map((clause, idx) => {
      let actor = 'باحث / نظام تحليلي';
      if (/نموذج|النموذج|الذاكرة/.test(clause)) actor = 'نموذج الذكاء الاصطناعي';
      if (/المتن|المصدر|الرواية/.test(clause)) actor = 'محرك المتن القرآني';
      
      let force = item.source_declared_force || 'MUST';
      if (/يُحظر|يُمنع|لا يجوز/.test(clause)) force = 'MUST_NOT';
      else if (/ينبغي|يُستحسن|يُفضل/.test(clause)) force = 'SHOULD';

      const isP0 = item.origin === 'SOURCE_255' || item.potentially_protected || item.id.includes('A0') || item.id.includes('B0');

      return {
        id: `OBL-${item.id}-${idx + 1}`,
        source_item_id: item.id,
        clause_text: clause,
        actor: actor,
        normative_force: force,
        priority: isP0 ? 'P0' : 'P1',
        trigger: item.scope_trigger || 'سياق التحليل القرآني',
        failure_behavior: force === 'MUST_NOT' ? 'FAIL_CLOSED' : 'AUDIT_FLAG'
      };
    });
  }

  _evaluateObligationPreservation(atom, candidateText, proposedForce, options = {}) {
    // If the candidate statement explicitly simulates dropping an obligation for tests
    if ((options.simulate_drop_p0 && atom.priority === 'P0') || (options.force_drop_ids && options.force_drop_ids.includes(atom.id))) {
      return {
        obligation_id: atom.id,
        source_item_id: atom.source_item_id,
        source_clause: atom.clause_text,
        status: 'DROPPED',
        evidence: 'Obligation dropped in candidate draft.',
        modifications: ['DROPPED']
      };
    }

    // Check lexical similarity / presence
    const atomTokens = atom.clause_text.split(/\s+/).filter(t => t.length > 2);
    let matchedTokens = 0;
    for (const token of atomTokens) {
      if (candidateText.includes(token)) matchedTokens++;
    }

    const overlapRatio = atomTokens.length > 0 ? (matchedTokens / atomTokens.length) : 1;

    let status = 'PRESERVED';
    const modifications = [];

    if (overlapRatio < 0.3) {
      status = 'DROPPED';
      modifications.push('DROPPED');
    } else if (overlapRatio < 0.75 || atom.normative_force !== proposedForce) {
      status = 'MODIFIED';
      if (atom.normative_force !== proposedForce) modifications.push(`FORCE_CHANGED_${atom.normative_force}_TO_${proposedForce}`);
      if (overlapRatio < 0.75) modifications.push('LEXICAL_REDUCTION');
    }

    return {
      obligation_id: atom.id,
      source_item_id: atom.source_item_id,
      source_clause: atom.clause_text,
      status,
      overlap_ratio: Math.round(overlapRatio * 100) / 100,
      modifications,
      evidence: `مطابقة بنسبة ${Math.round(overlapRatio * 100)}% مع النص المرشح.`
    };
  }

  _detectIntroducedObligations(items, candidateText) {
    // Check if candidate text has clauses not present in any source
    const candidateClauses = candidateText.split(/[؛.;]/).map(c => c.trim()).filter(Boolean);
    const introduced = [];

    for (let i = 0; i < candidateClauses.length; i++) {
      const clause = candidateClauses[i];
      const foundInAny = items.some(item => (item.original_statement_ar || '').includes(clause));
      if (!foundInAny && clause.length > 20) {
        introduced.push({
          clause_index: i + 1,
          clause_text: clause,
          note: 'عبارة جديدة مقترحة في النص الموحد لم ترد حرفياً في الأصول المحددة.'
        });
      }
    }
    return introduced;
  }

  /**
   * Impact Simulator: Static dependency-based reachability preview
   * Maps target item to dependent items, test cases, contracts, and change packages.
   * INVARIANT: Never states N tests will fail without executed failure evidence.
   */
  simulateImpact(targetItemId, proposedChange = {}) {
    const item = this.store.getItem(targetItemId);
    if (!item) {
      throw new Error(`Target item '${targetItemId}' not found.`);
    }

    // Direct relations
    const relations = this.store.getRelations({ item_id: targetItemId }).relations;
    const directDependentIds = [];
    const relationPaths = [];

    for (const r of relations) {
      const otherId = r.source === targetItemId ? r.target : r.source;
      if (!directDependentIds.includes(otherId)) {
        directDependentIds.push(otherId);
        relationPaths.push({
          from: targetItemId,
          to: otherId,
          relation_type: r.type,
          basis: r.basis,
          explanation: r.explanation
        });
      }
    }

    // Associated test cases (all DESIGNED_NOT_RUN)
    const associatedTests = this.store.getTestCases(targetItemId);

    // Dependent items' test cases
    const downstreamTests = [];
    for (const depId of directDependentIds) {
      const depTests = this.store.getTestCases(depId);
      downstreamTests.push(...depTests);
    }

    const allAffectedTests = [...associatedTests, ...downstreamTests];

    // Build impact report adhering strictly to Section 5.4 invariants
    return {
      target_item_id: targetItemId,
      target_title_ar: item.title_ar,
      proposed_action: proposedChange.action || 'REVISE_OR_CONSOLIDATE',
      potentially_affected_items_count: directDependentIds.length,
      potentially_affected_items: directDependentIds,
      relation_paths: relationPaths,
      potentially_affected_tests_count: allAffectedTests.length,
      potentially_affected_tests: allAffectedTests.map(t => ({
        test_id: t.test_id,
        item_id: t.item_id,
        designed_oracle: t.designed_oracle,
        // Critical invariant: Mark strictly as DESIGNED_NOT_RUN
        execution_status: 'DESIGNED_NOT_RUN',
        actual_failure_proven: false,
        note: 'فحص مصمم محلياً لم يُنفذ بعد؛ لا يُعد فاشلاً دون دليل تنفيذ حقيقي.'
      })),
      downstream_packages: [
        {
          package_id: 'QLE_423_Skill_v1.2.0',
          impact_type: 'POTENTIAL_METADATA_UPDATE',
          status: 'UNVERIFIED'
        }
      ],
      impact_summary: {
        assessment_verdict: 'POTENTIAL_IMPACT_DISCLOSED',
        proven_executed_failures: 0,
        unverified_dependencies: directDependentIds.length,
        disclaimer_ar: 'هذا التحليل هو استكشاف ساكن للاعتماديات المرجعية. لا يتم افتراض فشل أي اختبار أو تعطل عقدي دون دليل تشغيل محقق.'
      }
    };
  }
}
