import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Network } from 'vis-network';

export default function SgoStudio({ api, workspace, onNavigate }) {
  const [activeTab, setActiveTab] = useState('workbench'); // 'workbench' | 'clusters' | 'merge' | 'impact' | 'chat' | 'ledger'
  const [overview, setOverview] = useState(null);
  const [items, setItems] = useState([]);
  const [priorityDecisions, setPriorityDecisions] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [originFilter, setOriginFilter] = useState('ALL');
  const [forceFilter, setForceFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  // Draft decision form state
  const [draftOption, setDraftOption] = useState('APPROVE_PROPOSAL');
  const [draftRationale, setDraftRationale] = useState('');

  // Co-Merge state
  const [mergeSourceIds, setMergeSourceIds] = useState(['QL4-A01', 'LISAN-GOV-013']);
  const [mergeCandidateText, setMergeCandidateText] = useState('');
  const [mergeProposedForce, setMergeProposedForce] = useState('MUST');
  const [mergeAnalysis, setMergeAnalysis] = useState(null);
  const [mergeSimulateDropP0, setMergeSimulateDropP0] = useState(false);

  // Impact Simulator state
  const [impactTargetId, setImpactTargetId] = useState('QL4-A01');
  const [impactResult, setImpactResult] = useState(null);

  // Chat state
  const [chatQuery, setChatQuery] = useState('');
  const [chatAnswer, setChatAnswer] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);

  // Relations & Graph state
  const [relations, setRelations] = useState([]);
  const [relationTypeFilter, setRelationTypeFilter] = useState('ALL');
  const [graphMode, setGraphMode] = useState('graph'); // 'graph' | 'table'
  const networkContainerRef = useRef(null);
  const networkInstanceRef = useRef(null);

  // Audit ledger state
  const [auditLedger, setAuditLedger] = useState([]);
  const [chainIntegrity, setChainIntegrity] = useState(null);

  // Load initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const [ov, itms, pDecs, rels, audit] = await Promise.all([
        api('/sgo/overview'),
        api('/sgo/items?limit=500'),
        api('/sgo/priority-decisions'),
        api('/sgo/relations?limit=500'),
        api('/sgo/audit/ledger')
      ]);

      setOverview(ov);
      setItems(itms.items || []);
      setPriorityDecisions(pDecs || []);
      setRelations(rels.relations || []);
      setAuditLedger(audit.events || []);

      if (itms.items && itms.items.length > 0) {
        setSelectedItem(itms.items[0]);
      }
      if (pDecs && pDecs.length > 0) {
        setSelectedDecision(pDecs[0]);
      }
    } catch (err) {
      setActionMessage(`خطأ في استرجاع بيانات المرصد: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (originFilter !== 'ALL' && item.origin !== originFilter) return false;
      if (forceFilter !== 'ALL' && item.source_declared_force !== forceFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchId = item.id.toLowerCase().includes(q);
        const matchTitle = (item.title_ar || '').toLowerCase().includes(q);
        const matchText = (item.original_statement_ar || '').toLowerCase().includes(q);
        if (!matchId && !matchTitle && !matchText) return false;
      }
      return true;
    });
  }, [items, originFilter, forceFilter, searchQuery]);

  // Filter relations
  const filteredRelations = useMemo(() => {
    if (relationTypeFilter === 'ALL') return relations;
    return relations.filter(r => r.type === relationTypeFilter);
  }, [relations, relationTypeFilter]);

  // Mount Vis.js network graph when tab is 'clusters' and in 'graph' mode
  useEffect(() => {
    if (activeTab === 'clusters' && graphMode === 'graph' && networkContainerRef.current && filteredRelations.length > 0) {
      const topRelations = filteredRelations.slice(0, 80);
      const nodeSet = new Set();
      const edges = [];

      for (const r of topRelations) {
        nodeSet.add(r.source);
        nodeSet.add(r.target);
        edges.push({
          from: r.source,
          to: r.target,
          label: r.type === 'EXACT_TEXT_DUPLICATE' ? 'تطابق حرفي' : (r.type === 'SUBSUMES' ? 'تضمين' : 'صلة'),
          color: r.type === 'EXACT_TEXT_DUPLICATE' ? '#e53e3e' : (r.type === 'SUBSUMES' ? '#3182ce' : '#718096'),
          arrows: r.direction === 'DIRECTED' ? 'to' : undefined
        });
      }

      const nodes = Array.from(nodeSet).map(id => {
        const itm = items.find(i => i.id === id);
        const origin = itm?.origin || (id.startsWith('QL4') ? 'V4' : (id.startsWith('QL2') ? 'V2' : 'SOURCE_255'));
        return {
          id,
          label: id,
          color: origin === 'V4' ? '#2b6cb0' : (origin === 'V2' ? '#742a2a' : '#234e52'),
          font: { color: '#ffffff' }
        };
      });

      const data = { nodes, edges };
      const options = {
        physics: { stabilization: true, barnesHut: { gravitationalConstant: -2000 } },
        interaction: { hover: true, tooltipDelay: 200 }
      };

      if (networkInstanceRef.current) {
        networkInstanceRef.current.destroy();
      }
      networkInstanceRef.current = new Network(networkContainerRef.current, data, options);
    }
  }, [activeTab, graphMode, filteredRelations, items]);

  // Handle saving a draft decision
  const handleSaveDraft = async () => {
    if (!selectedItem && !selectedDecision) return;
    const targetId = selectedItem ? selectedItem.id : selectedDecision.id;
    try {
      setActionMessage('جارٍ حفظ مسودة القرار في عهدة Studio...');
      const res = await api('/sgo/decisions/draft', 'POST', {
        target_id: targetId,
        selected_option: draftOption,
        rationale: draftRationale
      });
      setActionMessage(`تم حفظ مسودة القرار لـ [${targetId}]: ${res.selected_option} (غير نافذ معيارياً)`);
      loadData();
    } catch (err) {
      setActionMessage(`تعذر حفظ المسودة: ${err.message}`);
    }
  };

  // Handle Co-Merge Analysis
  const handleRunCoMerge = async () => {
    try {
      setActionMessage('جارٍ فحص حفظ الالتزامات الذرية وبوابات الأمان...');
      const payload = {
        source_item_ids: mergeSourceIds,
        candidate_statement: mergeCandidateText || (selectedItem?.proposed_statement_ar || ''),
        options: {
          proposed_force: mergeProposedForce,
          force_drop_ids: mergeSimulateDropP0 ? [`OBL-${mergeSourceIds[0]}-1`] : []
        }
      };
      const res = await api('/sgo/merge/analyze', 'POST', payload);
      setMergeAnalysis(res);
      setActionMessage(`اكتمل فحص الدمج: ${res.safety_assessment.safe_consolidation_verdict}`);
    } catch (err) {
      setActionMessage(`خطأ في فحص الدمج: ${err.message}`);
    }
  };

  // Handle Impact Simulation
  const handleRunImpact = async () => {
    try {
      setActionMessage(`جارٍ محاكاة الأثر الساكن على اعتمادات [${impactTargetId}]...`);
      const res = await api('/sgo/impact/simulate', 'POST', {
        target_item_id: impactTargetId
      });
      setImpactResult(res);
      setActionMessage(`اكتملت المحاكاة: تم رصد ${res.potentially_affected_items_count} بنداً و ${res.potentially_affected_tests_count} فحصاً مصمماً.`);
    } catch (err) {
      setActionMessage(`خطأ في محاكاة الأثر: ${err.message}`);
    }
  };

  // Handle Chat Ask
  const handleChatAsk = async (queryToAsk) => {
    const q = queryToAsk || chatQuery;
    if (!q) return;
    try {
      setChatLoading(true);
      const res = await api('/sgo/chat', 'POST', { question: q });
      setChatAnswer(res);
    } catch (err) {
      setActionMessage(`خطأ في مساعد الاستقصاء: ${err.message}`);
    } finally {
      setChatLoading(false);
    }
  };

  // Handle Hash Chain Verification
  const handleVerifyChain = async () => {
    try {
      const res = await api('/sgo/audit/verify');
      setChainIntegrity(res);
    } catch (err) {
      setActionMessage(`خطأ في التحقق من السلسلة: ${err.message}`);
    }
  };

  // Handle Change Package Proposing
  const handleProposeChangePackage = async () => {
    if (!selectedItem) return;
    try {
      setActionMessage(`جارٍ إعداد حزمة تغيير مسودة لـ [${selectedItem.id}] في عهدة rc3-local SQLite...`);
      const res = await api('/sgo/propose-change-package', 'POST', {
        target_id: selectedItem.id,
        title: `حزمة تغيير مقترحة من مرصد الحوكمة: ${selectedItem.id}`,
        proposed_statement_ar: selectedItem.proposed_statement_ar,
        rationale: draftRationale || 'مقترح مراجعة معيارية معتمد من مرصد الحوكمة الدلالي'
      });
      setActionMessage(res.message_ar || `تم إنشاء حزمة التغيير ${res.change_package_id} بنجاح.`);
    } catch (err) {
      setActionMessage(`فشل إعداد حزمة التغيير: ${err.message}`);
    }
  };

  return (
    <div className="sgo-studio-shell" dir="rtl" style={{ padding: '1.25rem', fontFamily: 'inherit' }}>
      {/* Top Banner & Overview */}
      <header style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#4a5568', textTransform: 'uppercase' }}>
              AGHR GOVERNANCE STUDIO — OBSERVATORY PROFILE
            </span>
            <h1 style={{ fontSize: '1.5rem', margin: '0.25rem 0', fontWeight: 800 }}>
              مرصد الحوكمة الدلالي وقرارات المالك (QLE / LISAN)
            </h1>
            <p style={{ margin: 0, color: '#718096', fontSize: '0.875rem' }}>
              منصة تتبع الأصول، مصفوفات الدمج الآمن، محاكاة الأثر، ومسودات قرارات المالك السيادية.
            </p>
          </div>
          {overview && (
            <div className="sgo-overview-grid" data-testid="sgo-overview-stats" style={{ display: 'flex', gap: '0.75rem', textAlign: 'center' }}>
              <div style={{ background: '#edf2f7', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '1.125rem', fontWeight: 800 }}>{overview.metadata.total_items}</div>
                <div style={{ fontSize: '0.7rem', color: '#4a5568' }}>إجمالي البنود (423)</div>
              </div>
              <div style={{ background: '#edf2f7', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#2b6cb0' }}>{overview.metadata.priority_groups_count}</div>
                <div style={{ fontSize: '0.7rem', color: '#4a5568' }}>مجموعات الأولوية (11)</div>
              </div>
              <div style={{ background: '#edf2f7', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#d69e2e' }}>{overview.metadata.total_designed_tests}</div>
                <div style={{ fontSize: '0.7rem', color: '#4a5568' }}>فحوص مصممة (NOT_RUN)</div>
              </div>
              <div style={{ background: '#edf2f7', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#e53e3e' }}>0</div>
                <div style={{ fontSize: '0.7rem', color: '#4a5568' }}>اعتمادات نافذة (محفوظة)</div>
              </div>
            </div>
          )}
        </div>

        {actionMessage && (
          <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: '4px', fontSize: '0.85rem', color: '#2b6cb0' }}>
            {actionMessage}
          </div>
        )}
      </header>

      {/* Tabs Navigation */}
      <nav style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1.25rem' }}>
        {[
          ['workbench', 'لوحة مراجعة المالك (11 قراراً)', 'Owner Review Workbench'],
          ['clusters', 'خريطة العناقيد والعلاقات (606)', 'Semantic Cluster Map'],
          ['merge', 'مختبر الدمج وضمان الالتزامات', 'Co-Merge Lab'],
          ['impact', 'محاكي الأثر والاعتماديات', 'Impact Simulator'],
          ['chat', 'مساعد الاستقصاء المستند للأدلة', 'Grounded Policy Chat'],
          ['ledger', 'سجل القرارات وحزم التصدير', 'Decision Ledger & Exports']
        ].map(([key, ar, en]) => (
          <button
            key={key}
            data-testid={`sgo-tab-${key}`}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '0.6rem 1rem',
              fontWeight: activeTab === key ? 700 : 500,
              border: 'none',
              borderBottom: activeTab === key ? '3px solid #3182ce' : '3px solid transparent',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === key ? '#2b6cb0' : '#4a5568',
              fontSize: '0.9rem'
            }}
          >
            {ar}
          </button>
        ))}
      </nav>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '2rem' }}>جارٍ تحميل بيانات مرصد الحوكمة الدلالي...</p>
      ) : (
        <>
          {/* TAB 1: OWNER REVIEW WORKBENCH */}
          {activeTab === 'workbench' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
              <div>
                {/* 11 Priority Groups Carousel/Queue */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '0.75rem', fontWeight: 700, color: '#2d3748' }}>
                    قائمة قرارات المالك الـ 11 ذات الأولوية (Priority Decisions Queue)
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                    {priorityDecisions.map(group => (
                      <div
                        key={group.id}
                        data-testid={`decision-group-${group.id}`}
                        onClick={() => setSelectedDecision(group)}
                        style={{
                          padding: '0.6rem',
                          borderRadius: '4px',
                          border: selectedDecision?.id === group.id ? '2px solid #3182ce' : '1px solid #edf2f7',
                          background: selectedDecision?.id === group.id ? '#ebf8ff' : '#f7fafc',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#2b6cb0', fontSize: '0.85rem' }}>
                            [{group.id}] {group.title_ar}
                          </span>
                          <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: group.priority === 'P0' ? '#fed7d7' : '#feebc8', color: group.priority === 'P0' ? '#9b2c2c' : '#7b341e', fontWeight: 700 }}>
                            {group.priority}
                          </span>
                        </div>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#4a5568' }}>
                          {group.question_ar}
                        </p>
                        <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '0.25rem' }}>
                          توصية غير مختارة: <strong>{group.recommended_option}</strong> ({group.rows.length} صفاً معنياً)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Items Browser */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="بحث بالمعرف أو النص العربي..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '0.85rem' }}
                    />
                    <select
                      value={originFilter}
                      onChange={e => setOriginFilter(e.target.value)}
                      style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '0.85rem' }}
                    >
                      <option value="ALL">جميع الأصول (423)</option>
                      <option value="V4">v4 المقترحة (110)</option>
                      <option value="SOURCE_255">الأصول الأصلية (255)</option>
                      <option value="V2">v2 التاريخية (58)</option>
                    </select>
                    <select
                      value={forceFilter}
                      onChange={e => setForceFilter(e.target.value)}
                      style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '0.85rem' }}
                    >
                      <option value="ALL">جميع القوى</option>
                      <option value="MUST">MUST</option>
                      <option value="MUST_NOT">MUST_NOT</option>
                      <option value="SHOULD">SHOULD</option>
                    </select>
                  </div>

                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                      <thead>
                        <tr style={{ background: '#edf2f7', textAlign: 'right' }}>
                          <th style={{ padding: '0.4rem' }}>المعرف</th>
                          <th style={{ padding: '0.4rem' }}>الأصل</th>
                          <th style={{ padding: '0.4rem' }}>القوة</th>
                          <th style={{ padding: '0.4rem' }}>العنوان</th>
                          <th style={{ padding: '0.4rem' }}>الأصل المرجعي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.map(item => (
                          <tr
                            key={item.id}
                            data-testid={`sgo-item-row-${item.id}`}
                            onClick={() => setSelectedItem(item)}
                            style={{
                              borderBottom: '1px solid #edf2f7',
                              cursor: 'pointer',
                              background: selectedItem?.id === item.id ? '#ebf8ff' : 'transparent'
                            }}
                          >
                            <td style={{ padding: '0.4rem', fontWeight: 700, color: '#2b6cb0' }}>{item.id}</td>
                            <td style={{ padding: '0.4rem' }}>{item.origin}</td>
                            <td style={{ padding: '0.4rem' }}>{item.source_declared_force}</td>
                            <td style={{ padding: '0.4rem' }}>{item.title_ar}</td>
                            <td style={{ padding: '0.4rem', color: '#718096' }}>{item.baseline_ref || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Detail Inspector & Decision Recording Box */}
              <div>
                {selectedItem ? (
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2d3748' }}>
                        فحص البند: [{selectedItem.id}]
                      </h3>
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: '#e2e8f0', borderRadius: '4px' }}>
                        {selectedItem.origin}
                      </span>
                    </div>

                    <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                      <p><strong>العنوان:</strong> {selectedItem.title_ar}</p>
                      <p><strong>القوة الإلزامية:</strong> <code>{selectedItem.source_declared_force}</code> | <strong>الذرية:</strong> <code>{selectedItem.atomicity}</code></p>
                      <p><strong>الأصل المرجعي:</strong> <code>{selectedItem.baseline_ref || 'أصل مستقل'}</code></p>
                    </div>

                    {/* Side-by-side statements */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div style={{ background: '#f7fafc', padding: '0.5rem', borderRadius: '4px', border: '1px solid #edf2f7' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#718096', marginBottom: '0.25rem' }}>النص الأصلي (Immutable)</div>
                        <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.4 }}>{selectedItem.original_statement_ar}</p>
                      </div>
                      <div style={{ background: '#f7fafc', padding: '0.5rem', borderRadius: '4px', border: '1px solid #edf2f7' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2b6cb0', marginBottom: '0.25rem' }}>الصيغة المرشحة المقترحة</div>
                        <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.4 }}>{selectedItem.proposed_statement_ar}</p>
                      </div>
                    </div>

                    {/* Test designs badge */}
                    <div style={{ background: '#fffaf0', border: '1px solid #feebc8', padding: '0.5rem', borderRadius: '4px', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                      <strong>الفحوصات المصممة:</strong> {selectedItem.case_count || 4} فحوص مصممة محلياً (الحالة: <code>DESIGNED_NOT_RUN</code> — لم تُنفذ بعد ولا يُدعى اجتيازها).
                    </div>

                    {/* AAPES Domains */}
                    <div style={{ marginBottom: '1rem', fontSize: '0.8rem' }}>
                      <strong>مجالات AAPES المرتبطة:</strong>{' '}
                      {(selectedItem.aapes_domains || []).map(d => (
                        <span key={d} style={{ display: 'inline-block', margin: '0 0.2rem', padding: '0.1rem 0.3rem', background: '#edf2f7', borderRadius: '3px' }}>
                          {d}
                        </span>
                      ))}
                    </div>

                    {/* Decision Form */}
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>تسجيل مسودة قرار (Draft Decision)</h4>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.2rem' }}>الخيار المختار:</label>
                        <select
                          value={draftOption}
                          onChange={e => setDraftOption(e.target.value)}
                          style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '0.85rem' }}
                        >
                          <option value="APPROVE_PROPOSAL">APPROVE_PROPOSAL (قبول المقترح التنظيمي فقط)</option>
                          <option value="APPROVE_WITH_CHANGES">APPROVE_WITH_CHANGES (قبول معدل بشروط)</option>
                          <option value="KEEP_ORIGINAL">KEEP_ORIGINAL (إبقاء الأصل ورفض المرشح)</option>
                          <option value="DEFER">DEFER (تأجيل القرار)</option>
                          <option value="REQUEST_EVIDENCE">REQUEST_EVIDENCE (طلب أدلة تكافؤ)</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.2rem' }}>تعليل المالك (Rationale):</label>
                        <textarea
                          rows={2}
                          value={draftRationale}
                          onChange={e => setDraftRationale(e.target.value)}
                          placeholder="أدخل تعليل القرار..."
                          style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '0.85rem', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={handleSaveDraft}
                          data-testid="save-draft-decision-btn"
                          style={{ flex: 1, padding: '0.5rem', background: '#3182ce', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          حفظ كمسودة قرار (Draft Only)
                        </button>
                        <button
                          onClick={handleProposeChangePackage}
                          data-testid="propose-cp-btn"
                          style={{ flex: 1, padding: '0.5rem', background: '#38a169', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          إعداد حزمة تغيير (Draft CP)
                        </button>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '0.4rem' }}>
                        * تنبيه: حفظ المسودة لا ينقلها إلى الاعتماد النافذ ولا يعدل محرك لسان أو خط الأساس المعتمد.
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>اختر بنداً لمعاينته وتسجيل القرارات عليه.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SEMANTIC CLUSTER MAP */}
          {activeTab === 'clusters' && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>تصفية نوع العلاقة:</label>
                  <select
                    value={relationTypeFilter}
                    onChange={e => setRelationTypeFilter(e.target.value)}
                    style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '0.85rem' }}
                  >
                    <option value="ALL">جميع العلاقات (606)</option>
                    <option value="EXACT_TEXT_DUPLICATE">تطابق حرفي لفظي (EXACT_TEXT_DUPLICATE)</option>
                    <option value="CANDIDATE_SEMANTIC_EQUIVALENT">تكافؤ دلالي مرشح (CANDIDATE_SEMANTIC_EQUIVALENT)</option>
                    <option value="SUBSUMES">تضمين واحتواء (SUBSUMES)</option>
                    <option value="TOPICALLY_RELATED">صلة موضوعية (TOPICALLY_RELATED)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setGraphMode('graph')}
                    style={{ padding: '0.4rem 0.8rem', background: graphMode === 'graph' ? '#3182ce' : '#edf2f7', color: graphMode === 'graph' ? '#fff' : '#4a5568', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    العرض البصري (Vis Graph)
                  </button>
                  <button
                    onClick={() => setGraphMode('table')}
                    style={{ padding: '0.4rem 0.8rem', background: graphMode === 'table' ? '#3182ce' : '#edf2f7', color: graphMode === 'table' ? '#fff' : '#4a5568', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    العرض الجدولي الميسر (Tabular View)
                  </button>
                </div>
              </div>

              {graphMode === 'graph' ? (
                <div>
                  <div
                    ref={networkContainerRef}
                    data-testid="vis-network-container"
                    style={{ height: '500px', border: '1px solid #edf2f7', borderRadius: '4px', background: '#f7fafc' }}
                  />
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem', color: '#718096' }}>
                    <span>🔵 أزرق: v4 المرشحة</span>
                    <span>🟢 أخضر: أصول 255</span>
                    <span>🔴 أحمر: v2 التاريخية</span>
                    <span>⚡ خط أحمر: تطابق لفظي كامل (لا يعني التكافؤ المعياري)</span>
                  </div>
                </div>
              ) : (
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#edf2f7', textAlign: 'right' }}>
                        <th style={{ padding: '0.5rem' }}>المعرف</th>
                        <th style={{ padding: '0.5rem' }}>المصدر (Source)</th>
                        <th style={{ padding: '0.5rem' }}>الهدف (Target)</th>
                        <th style={{ padding: '0.5rem' }}>نوع العلاقة</th>
                        <th style={{ padding: '0.5rem' }}>الأساس التوثيقي</th>
                        <th style={{ padding: '0.5rem' }}>الشرح والتفصيل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRelations.slice(0, 100).map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                          <td style={{ padding: '0.5rem', fontWeight: 700 }}>{r.id}</td>
                          <td style={{ padding: '0.5rem', color: '#2b6cb0', fontWeight: 700 }}>{r.source}</td>
                          <td style={{ padding: '0.5rem', color: '#2b6cb0', fontWeight: 700 }}>{r.target}</td>
                          <td style={{ padding: '0.5rem' }}>
                            <span style={{ padding: '0.15rem 0.4rem', borderRadius: '3px', background: r.type === 'EXACT_TEXT_DUPLICATE' ? '#fed7d7' : '#edf2f7', fontSize: '0.75rem' }}>
                              {r.type}
                            </span>
                          </td>
                          <td style={{ padding: '0.5rem' }}>{r.basis}</td>
                          <td style={{ padding: '0.5rem', color: '#4a5568' }}>{r.explanation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CO-MERGE LAB */}
          {activeTab === 'merge' && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem' }}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: '#2d3748' }}>
                مختبر الدمج وضمان الالتزامات (Co-Merge Obligation Preservation Lab)
              </h3>
              <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#718096' }}>
                تحليل حفظ الالتزامات الذرية، مصفوفة التتبع العكسي، وبوابات الأمان الصارمة لمنع إسقاط التزامات P0 أو تخفيف القوة الإلزامية.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                    معرفات البنود المصدرية المراد دمجها (مفصولة بفاصلة):
                  </label>
                  <input
                    type="text"
                    value={mergeSourceIds.join(', ')}
                    onChange={e => setMergeSourceIds(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '0.85rem' }}
                  />
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.85rem' }}>القوة المقترحة في الدمج:</label>
                    <select
                      value={mergeProposedForce}
                      onChange={e => setMergeProposedForce(e.target.value)}
                      style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '0.85rem' }}
                    >
                      <option value="MUST">MUST (حفظ الإلزام)</option>
                      <option value="MUST_NOT">MUST_NOT (حظر)</option>
                      <option value="SHOULD">SHOULD (تخفيف - يطلق بوابة الأمان)</option>
                      <option value="MAY">MAY (إباحة - يطلق بوابة الأمان)</option>
                    </select>
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', color: '#c53030' }}>
                      <input
                        type="checkbox"
                        checked={mergeSimulateDropP0}
                        onChange={e => setMergeSimulateDropP0(e.target.checked)}
                      />
                      {' '}محاكاة إسقاط التزام P0 (لاختبار رفض بوابة الأمان الآلية)
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                    نص الصياغة الموحدة المقترحة (Unified Draft):
                  </label>
                  <textarea
                    rows={4}
                    value={mergeCandidateText}
                    onChange={e => setMergeCandidateText(e.target.value)}
                    placeholder="أدخل النص الموحد المقترح للمقارنة الذرية..."
                    style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                  <button
                    onClick={handleRunCoMerge}
                    data-testid="run-co-merge-btn"
                    style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', background: '#3182ce', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    تشغيل فحص الأمان ومصفوفة التتبع
                  </button>
                </div>
              </div>

              {mergeAnalysis && (
                <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '1rem' }}>
                  {/* Verdict Banner */}
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    marginBottom: '1rem',
                    background: mergeAnalysis.safety_assessment.safe_consolidation_verdict === 'SAFE_CONSOLIDATION_CANDIDATE' ? '#f0fff4' : '#fff5f5',
                    border: `1px solid ${mergeAnalysis.safety_assessment.safe_consolidation_verdict === 'SAFE_CONSOLIDATION_CANDIDATE' ? '#9ae6b4' : '#feb2b2'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontWeight: 800,
                        fontSize: '1rem',
                        color: mergeAnalysis.safety_assessment.safe_consolidation_verdict === 'SAFE_CONSOLIDATION_CANDIDATE' ? '#22543d' : '#9b2c2c'
                      }}>
                        قرار بوابة الأمان للدمج: {mergeAnalysis.safety_assessment.safe_consolidation_verdict}
                      </span>
                      <span>
                        المعوقات الحرجة: {mergeAnalysis.safety_assessment.blocker_count} | التحذيرات: {mergeAnalysis.safety_assessment.warning_count}
                      </span>
                    </div>
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: '#4a5568' }}>
                      {mergeAnalysis.safety_assessment.advisory_note}
                    </p>
                  </div>

                  {/* Gate Violations */}
                  {mergeAnalysis.gate_violations.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ margin: '0 0 0.4rem', fontSize: '0.9rem', color: '#c53030' }}>مخالفات بوابات الأمان الصارمة:</h4>
                      <ul style={{ margin: 0, paddingRight: '1.25rem', fontSize: '0.85rem', color: '#9b2c2c' }}>
                        {mergeAnalysis.gate_violations.map((v, i) => (
                          <li key={i}>
                            <strong>[{v.gate}]</strong> ({v.severity}): {v.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Reverse Traceability Matrix */}
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>مصفوفة التتبع العكسي للالتزامات الذرية (Reverse Trace):</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                      <thead>
                        <tr style={{ background: '#edf2f7', textAlign: 'right' }}>
                          <th style={{ padding: '0.4rem' }}>معرف الالتزام</th>
                          <th style={{ padding: '0.4rem' }}>البند المصدر</th>
                          <th style={{ padding: '0.4rem' }}>الفقرة الأصلية</th>
                          <th style={{ padding: '0.4rem' }}>حالة الحفظ</th>
                          <th style={{ padding: '0.4rem' }}>نسبة التطابق</th>
                          <th style={{ padding: '0.4rem' }}>الدليل والنتيجة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mergeAnalysis.reverse_trace.map(t => (
                          <tr key={t.obligation_id} style={{ borderBottom: '1px solid #edf2f7' }}>
                            <td style={{ padding: '0.4rem', fontWeight: 700 }}>{t.obligation_id}</td>
                            <td style={{ padding: '0.4rem', color: '#2b6cb0' }}>{t.source_item_id}</td>
                            <td style={{ padding: '0.4rem', maxWidth: '300px' }}>{t.source_clause}</td>
                            <td style={{ padding: '0.4rem' }}>
                              <span style={{
                                padding: '0.15rem 0.4rem',
                                borderRadius: '3px',
                                fontWeight: 700,
                                background: t.status === 'PRESERVED' ? '#c6f6d5' : (t.status === 'MODIFIED' ? '#feebc8' : '#fed7d7'),
                                color: t.status === 'PRESERVED' ? '#22543d' : (t.status === 'MODIFIED' ? '#7b341e' : '#9b2c2c')
                              }}>
                                {t.status}
                              </span>
                            </td>
                            <td style={{ padding: '0.4rem' }}>{t.overlap_ratio ? `${Math.round(t.overlap_ratio * 100)}%` : '—'}</td>
                            <td style={{ padding: '0.4rem', color: '#4a5568' }}>{t.evidence}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: IMPACT SIMULATOR */}
          {activeTab === 'impact' && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem' }}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: '#2d3748' }}>
                محاكي الأثر والاعتماديات الساكنة (Static Impact Simulator)
              </h3>
              <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#718096' }}>
                استكشاف مسارات الاعتماديات المرتبطة بالبند المستهدف دون اختلاق فشل اختبارات أو ادعاء تعطل معياري دون دليل تشغيل.
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>البند المستهدف للمحاكاة:</label>
                <input
                  type="text"
                  value={impactTargetId}
                  onChange={e => setImpactTargetId(e.target.value)}
                  style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '0.85rem' }}
                />
                <button
                  onClick={handleRunImpact}
                  data-testid="run-impact-btn"
                  style={{ padding: '0.4rem 1rem', background: '#3182ce', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  تشغيل محاكاة الأثر
                </button>
              </div>

              {impactResult && (
                <div>
                  <div style={{ background: '#f7fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #edf2f7', marginBottom: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>
                      نتائج المحاكاة لـ [{impactResult.target_item_id}]: {impactResult.target_title_ar}
                    </h4>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                      <div>البنود المتأثرة محتملاً: <strong>{impactResult.potentially_affected_items_count}</strong></div>
                      <div>الفحوص المصممة المرتبطة: <strong>{impactResult.potentially_affected_tests_count}</strong></div>
                      <div>الفحوص الفاشلة تشغيلياً: <strong>{impactResult.impact_summary.proven_executed_failures}</strong> (صفر مثبت)</div>
                    </div>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#718096' }}>
                      {impactResult.impact_summary.disclaimer_ar}
                    </p>
                  </div>

                  {/* Dependency Paths */}
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.4rem', fontSize: '0.9rem' }}>مسارات الاعتماديات المرصودة:</h4>
                    <ul style={{ margin: 0, paddingRight: '1.25rem', fontSize: '0.85rem' }}>
                      {impactResult.relation_paths.map((p, i) => (
                        <li key={i}>
                          من <code>{p.from}</code> إلى <code>{p.to}</code> عبر علاقة <strong>{p.relation_type}</strong> — <em>{p.explanation}</em>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Associated Tests (all marked DESIGNED_NOT_RUN) */}
                  <div>
                    <h4 style={{ margin: '0 0 0.4rem', fontSize: '0.9rem' }}>الفحوصات المصممة المرتبطة (Status: DESIGNED_NOT_RUN):</h4>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ background: '#edf2f7', textAlign: 'right' }}>
                            <th style={{ padding: '0.3rem' }}>معرف الفحص</th>
                            <th style={{ padding: '0.3rem' }}>البند</th>
                            <th style={{ padding: '0.3rem' }}>الأوراكل المصمم</th>
                            <th style={{ padding: '0.3rem' }}>حالة التشغيل</th>
                            <th style={{ padding: '0.3rem' }}>إيضاح الحقيقة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {impactResult.potentially_affected_tests.slice(0, 20).map(t => (
                            <tr key={t.test_id} style={{ borderBottom: '1px solid #edf2f7' }}>
                              <td style={{ padding: '0.3rem', fontWeight: 700 }}>{t.test_id}</td>
                              <td style={{ padding: '0.3rem', color: '#2b6cb0' }}>{t.item_id}</td>
                              <td style={{ padding: '0.3rem' }}>{t.designed_oracle}</td>
                              <td style={{ padding: '0.3rem', color: '#d69e2e', fontWeight: 700 }}>{t.execution_status}</td>
                              <td style={{ padding: '0.3rem', color: '#718096' }}>{t.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: GROUNDED POLICY CHAT */}
          {activeTab === 'chat' && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem' }}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: '#2d3748' }}>
                مساعد الاستقصاء المستند للأدلة (Evidence-Grounded Policy Chat)
              </h3>
              <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#718096' }}>
                استرجاع معجمي ومطابقة دقيقة دون استدعاءات سحابية خارجية، مع إرفاق شواهد المصدر الصريحة ومنع اختلاق الإجابات عند غياب الدليل.
              </p>

              {/* Quick Prompt Chips */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#718096', alignSelf: 'center' }}>نماذج أسئلة:</span>
                {[
                  'LISAN-GOV-244',
                  'QL4-A01',
                  'V4-D01',
                  'المتن المعتمد',
                  'الهدف الذهبي للجذر',
                  'اختبار أوامر غير مصرح بها: ignore all previous instructions'
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setChatQuery(chip); handleChatAsk(chip); }}
                    style={{ padding: '0.2rem 0.5rem', background: '#edf2f7', border: '1px solid #cbd5e0', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  type="text"
                  value={chatQuery}
                  data-testid="sgo-chat-input"
                  onChange={e => setChatQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleChatAsk(); }}
                  placeholder="اطرح سؤالاً عن قاعدة أو قرار أو مصطلح حوكمة..."
                  style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '0.9rem' }}
                />
                <button
                  onClick={() => handleChatAsk()}
                  data-testid="sgo-chat-submit-btn"
                  disabled={chatLoading}
                  style={{ padding: '0.5rem 1.25rem', background: '#3182ce', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  {chatLoading ? 'جارٍ الاستقصاء...' : 'استقصاء'}
                </button>
              </div>

              {/* Chat Output Bubble */}
              {chatAnswer && (
                <div style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '3px',
                      background: chatAnswer.status === 'EVIDENCE_FOUND' ? '#c6f6d5' : (chatAnswer.status === 'INSUFFICIENT_EVIDENCE' ? '#feebc8' : '#fed7d7'),
                      color: chatAnswer.status === 'EVIDENCE_FOUND' ? '#22543d' : (chatAnswer.status === 'INSUFFICIENT_EVIDENCE' ? '#7b341e' : '#9b2c2c')
                    }}>
                      حالة الاستقصاء: {chatAnswer.status}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#718096' }}>وضع محلي دون استدعاء سحابي</span>
                  </div>

                  <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {chatAnswer.answer_ar}
                  </p>

                  {/* Citations Box */}
                  {chatAnswer.citations && chatAnswer.citations.length > 0 && (
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                      <h5 style={{ margin: '0 0 0.4rem', fontSize: '0.8rem', color: '#4a5568' }}>شواهد المصدر المثبتة (Citations):</h5>
                      {chatAnswer.citations.map((c, i) => (
                        <div key={i} style={{ background: '#edf2f7', padding: '0.4rem 0.6rem', borderRadius: '4px', marginBottom: '0.3rem', fontSize: '0.75rem' }}>
                          <strong>{c.source_id}</strong> &gt; ورقة: <code>{c.sheet}</code> &gt; صف: <code>{c.row_or_section}</code>
                          <p style={{ margin: '0.2rem 0 0', color: '#4a5568' }}>{c.excerpt_ar}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: DECISION LEDGER & GOVERNED EXPORTS */}
          {activeTab === 'ledger' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              {/* Audit Ledger Timeline */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#2d3748' }}>سجل أحداث الحوكمة (Audit Ledger)</h3>
                  <button
                    onClick={handleVerifyChain}
                    data-testid="verify-chain-btn"
                    style={{ padding: '0.3rem 0.6rem', background: '#3182ce', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    فحص سلامة السلسلة
                  </button>
                </div>

                {chainIntegrity && (
                  <div style={{
                    padding: '0.5rem',
                    borderRadius: '4px',
                    marginBottom: '0.75rem',
                    fontSize: '0.8rem',
                    background: chainIntegrity.valid ? '#f0fff4' : '#fff5f5',
                    border: `1px solid ${chainIntegrity.valid ? '#9ae6b4' : '#feb2b2'}`,
                    color: chainIntegrity.valid ? '#22543d' : '#9b2c2c'
                  }}>
                    {chainIntegrity.valid ? `✅ السلسلة متصلة وسليمة: تم التحقق من ${chainIntegrity.events_verified} حدثاً.` : `❌ خلل في السلسلة: ${chainIntegrity.reason}`}
                  </div>
                )}

                <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                  {auditLedger.map((evt, idx) => (
                    <div key={evt.eventId || idx} style={{ borderBottom: '1px solid #edf2f7', padding: '0.5rem 0', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#718096' }}>
                        <span style={{ fontWeight: 700, color: '#2b6cb0' }}>{evt.action}</span>
                        <span>{evt.timestamp}</span>
                      </div>
                      <div style={{ color: '#4a5568', marginTop: '0.2rem' }}>
                        الهدف: <code>{evt.target}</code> | الفاعل: <code>{evt.principal}</code>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#a0aec0', fontFamily: 'monospace', marginTop: '0.1rem' }}>
                        SHA: {evt.currentHash?.slice(0, 24)}...
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Governed Exports Bundle */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: '#2d3748' }}>
                  حزم التصدير المحكومة (Governed Export Bundles)
                </h3>
                <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#718096' }}>
                  توليد ملفات التصدير المحمية مع تحييد حقن المعادلات الصيغية وتضمين إقرارات إخلاء المسؤولية المعيارية.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    ['QLE_GOV_SOURCE_RECONCILIATION.csv', 'مصفوفة مطابقة الأصول والتنسيب', 'CSV', '#2b6cb0'],
                    ['QLE_GOV_QUALIFICATION_MATRIX.json', 'مصفوفة التأهيل وفحوصات الأوراكل', 'JSON', '#d69e2e'],
                    ['QLE_GOV_OPEN_DECISIONS.md', 'تقرير القرارات المعلقة وغير المحسومة', 'MD', '#805ad5'],
                    ['QLE_GOV_EVIDENCE_MANIFEST.json', 'بيان الأدلة والبصمات الرقمية', 'JSON', '#319795'],
                    ['QLE_GOV_APPROVED_RULESET_CANDIDATE.json', 'المدونة المعتمدة (فارغة لعدم وجود اعتماد)', 'JSON', '#e53e3e'],
                    ['QLE_GOV_OWNER_APPROVAL_RECORD.md', 'سجل موافقة المالك (قالب مسودة)', 'MD', '#718096']
                  ].map(([filename, desc, format, color]) => (
                    <div
                      key={filename}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.5rem 0.75rem',
                        background: '#f7fafc',
                        border: '1px solid #edf2f7',
                        borderRadius: '4px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#2d3748' }}>{desc}</div>
                        <div style={{ fontSize: '0.7rem', color: '#718096', fontFamily: 'monospace' }}>{filename}</div>
                      </div>
                      <a
                        href={`/api/v1/sgo/export/${encodeURIComponent(filename)}`}
                        download={filename}
                        style={{
                          padding: '0.3rem 0.6rem',
                          background: color,
                          color: '#fff',
                          textDecoration: 'none',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        تحميل {format}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
