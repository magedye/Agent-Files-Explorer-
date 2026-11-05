import { useState, useEffect, useCallback, useMemo } from 'react';
import { useI18n } from '../../i18n/I18nProvider.jsx';
import { Badge, Empty, useText } from '../phase0/common.jsx';

export default function AapesStudio({ api, workspace, onNavigate }) {
  const t = useText();
  const { locale } = useI18n();

  const [tab, setTab] = useState('framework');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Framework state
  const [framework, setFramework] = useState(null);

  // 2. Policy Review state
  const samplePolicies = [
    {
      id: 'SAMPLE-01-COMPOUND',
      labelEn: 'Compound Rule (MUST + and also MUST)',
      labelAr: 'قاعدة مركبة (إلزام مزدوج)',
      text: 'The model MUST authenticate incoming user tokens and also MUST log every request to the external audit service; otherwise fail closed.'
    },
    {
      id: 'SAMPLE-02-AMBIGUOUS',
      labelEn: 'Ambiguous Adjectives (appropriate, fast, safe)',
      labelAr: 'أوصاف فضفاضة غير محددة عملياً',
      text: 'The agent MUST provide appropriate response times and use reasonably safe tools for data retrieval.'
    },
    {
      id: 'SAMPLE-03-ATOMIC',
      labelEn: 'Atomic Compliant Policy with Fail-Closed State',
      labelAr: 'سياسة ذرية محددة مع حالة إخفاق منيعة',
      text: 'Before executing any state-changing tool call, the PEP MUST verify that the caller presents an unexpired server-issued write grant; otherwise the operation MUST fail closed and return 403.'
    }
  ];
  const [policyText, setPolicyText] = useState(samplePolicies[0].text);
  const [ruleId, setRuleId] = useState('AAPES-RULE-001');
  const [reviewResult, setReviewResult] = useState(null);
  const [draftCreated, setDraftCreated] = useState(null);

  // 3. Readiness Assessment state
  const [riskLevel, setRiskLevel] = useState('R2');
  const [scores, setScores] = useState({});
  const [assessmentResult, setAssessmentResult] = useState(null);

  // 4. Compatibility Matrix state
  const [matrixData, setMatrixData] = useState(null);
  const [matrixFilter, setMatrixFilter] = useState('ALL');
  const [matrixSearch, setMatrixSearch] = useState('');

  // 5. Decision Oracles state
  const [evalResult, setEvalResult] = useState(null);

  // Load Framework and Matrix on mount
  const loadFramework = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const fw = await api('/aapes/framework');
      setFramework(fw.framework);

      // Initialize default scores
      const initScores = {};
      fw.framework.domains.forEach(d => {
        initScores[d.id] = { maturity: 2, evidence_refs: [] };
      });
      setScores(initScores);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const loadMatrix = useCallback(async () => {
    try {
      const data = await api('/aapes/matrix');
      setMatrixData(data);
    } catch (e) {
      setError(e.message);
    }
  }, [api]);

  useEffect(() => {
    loadFramework();
    loadMatrix();
  }, [loadFramework, loadMatrix]);

  // Policy Review action
  const handleReview = async () => {
    setLoading(true);
    setError('');
    setDraftCreated(null);
    try {
      const res = await api('/aapes/review', 'POST', { policy_text: policyText, rule_id: ruleId });
      setReviewResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Convert review proposal to draft change package in rc3-local
  const handleCreateDraft = async () => {
    if (!reviewResult || !reviewResult.proposal) return;
    setLoading(true);
    setError('');
    try {
      const prop = reviewResult.proposal;
      const res = await api('/aapes/propose-change-package', 'POST', {
        rule_id: ruleId,
        title: `AAPES Policy Optimization: ${ruleId}`,
        proposed_text: prop.proposed_text,
        reason: prop.reason
      });
      setDraftCreated(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Assessment action
  const handleAssess = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api('/aapes/assess', 'POST', {
        risk_level: riskLevel,
        scores
      });
      setAssessmentResult(res.assessment);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Preset assessment configs
  const applyPreset = (type) => {
    if (!framework) return;
    const newScores = {};
    if (type === 'low') {
      framework.domains.forEach(d => {
        newScores[d.id] = { maturity: 1, evidence_refs: [] };
      });
    } else if (type === 'high_score_failed_gate') {
      framework.domains.forEach(d => {
        // D07 (Tool boundary) is P0: setting it to 1 causes critical gate blockage despite high average score
        newScores[d.id] = { maturity: d.id === 'D07' ? 1 : 4, evidence_refs: [] };
      });
    } else if (type === 'fully_qualified') {
      framework.domains.forEach(d => {
        newScores[d.id] = { maturity: 4, evidence_refs: [`ev://${d.id}/qualified`] };
      });
    }
    setScores(newScores);
  };

  // Run synthetic oracles
  const handleRunOracles = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api('/aapes/evaluate', 'POST', { test_type: 'all' });
      setEvalResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter matrix rows
  const filteredMatrix = useMemo(() => {
    if (!matrixData || !matrixData.requirements) return [];
    return matrixData.requirements.filter(r => {
      const matchStatus = matrixFilter === 'ALL' || r.coverage_status === matrixFilter;
      const q = matrixSearch.toLowerCase();
      const matchSearch = !q || (r.requirement_id + ' ' + r.title + ' ' + r.aghr_ref).toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [matrixData, matrixFilter, matrixSearch]);

  return (
    <section className="aapes-studio" data-testid="aapes-studio">
      <div className="p0-section-title">
        <div>
          <h2>{t('هندسة سياسات AAPES v2.1', 'AAPES v2.1 Policy Engineering')}</h2>
          <p>{t('إطار عمل مرشح للمراجعة والتدقيق، وتقييم الجاهزية الموزونة بالمخاطر، وتتبع التوافقية.', 'Review-candidate framework for policy engineering, risk-weighted readiness, and compatibility traceability.')}</p>
        </div>
        <Badge code="REVIEW_CANDIDATE" tone="warning">
          {t('مرشح للمراجعة · غير معتمد', 'Candidate for Review · Not Adopted')}
        </Badge>
      </div>

      <div className="p0-banner">
        <Badge code="ADVISORY" />{' '}
        {t(
          'مواصفة مقترحة للأغراض الهندسية الداخلية؛ ليست شهادة امتثال أو اعتماداً إنتاجياً. المرجع المعتمد هو AGHR rc.3.',
          'Proposed internal engineering specification; not certification or production authority. Accepted reference remains AGHR rc.3.'
        )}
      </div>

      <nav className="studio-nav aapes-nav" aria-label={t('تبويبات AAPES', 'AAPES tabs')} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>
        {[
          ['framework', 'إطار العمل والمتطلبات', 'Framework & Requirements'],
          ['review', 'مراجعة وهندسة السياسات', 'Policy Review & Drafting'],
          ['assessment', 'تقييم الجاهزية بالمخاطر', 'Readiness Assessment'],
          ['matrix', 'مصفوفة التوافقية (48 بنداً)', 'Compatibility Matrix (48)'],
          ['oracles', 'أوراكل القرار والتقييم', 'Decision Oracles & Synthetic Evals']
        ].map(([key, ar, en]) => (
          <button
            key={key}
            data-testid={`aapes-tab-${key}`}
            aria-current={tab === key ? 'page' : undefined}
            onClick={() => setTab(key)}
            className={`p0-button ${tab === key ? 'active' : ''}`}
            style={{ fontWeight: tab === key ? 'bold' : 'normal', padding: '0.4rem 0.8rem' }}
          >
            {t(ar, en)}
          </button>
        ))}
      </nav>

      {error && <p role="alert" style={{ color: '#d32f2f' }}>{t('خطأ: ', 'Error: ')} {error}</p>}
      {loading && <p role="status">{t('جارٍ التحميل...', 'Loading...')}</p>}

      {/* TAB 1: FRAMEWORK */}
      {tab === 'framework' && framework && (
        <section data-testid="aapes-framework-tab">
          <h3>{t('المجالات الـ 12 والمتطلبات الـ 48', '12 Domains & 48 Requirements')}</h3>
          <p className="p0-hint">
            {t(
              'أوزان الأهمية تعبر عن أولويات التصميم وليست احتمالات موثوقية مثبتة تجريبياً.',
              'Importance weights represent design priorities, not empirically established reliability percentages.'
            )}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', margin: '1rem 0' }}>
            <div className="p0-detail" style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }}>
              <h4>{t('مستويات المخاطر (R0–R3)', 'Risk Levels (R0–R3)')}</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {Object.entries(framework.risk_levels).map(([lvl, info]) => (
                  <li key={lvl} style={{ margin: '0.3rem 0' }}>
                    <strong>{lvl}:</strong> {info.description} · <small>{t('الحد الأدنى للجاهزية: ', 'Min readiness: ')}{info.minimum_readiness}%</small>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p0-detail" style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }}>
              <h4>{t('بوابات المراحل (G0–G7)', 'Stage Gates (G0–G7)')}</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {framework.gate_order.map(g => (
                  <li key={g} style={{ margin: '0.2rem 0' }}>
                    <strong>{g}:</strong> {framework.gate_descriptions[g]}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p0-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('المعرف', 'ID')}</th>
                  <th>{t('المجال', 'Domain')}</th>
                  <th>{t('الوزن', 'Weight')}</th>
                  <th>{t('الأولوية', 'Priority')}</th>
                  <th>{t('مضاعف R3', 'R3 Multiplier')}</th>
                  <th>{t('المخرجات المتوقعة', 'Expected Deliverable')}</th>
                  <th>{t('المتطلبات', 'Reqs')}</th>
                </tr>
              </thead>
              <tbody>
                {framework.domains.map(d => (
                  <tr key={d.id}>
                    <td><code>{d.id}</code></td>
                    <td><strong>{d.name}</strong></td>
                    <td>{d.importance_weight_percent}%</td>
                    <td><Badge code={d.priority_base} /></td>
                    <td>{d.impact_multiplier_by_risk?.R3 || 1.0}x</td>
                    <td><small>{d.deliverable}</small></td>
                    <td>{d.requirements.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: POLICY REVIEW */}
      {tab === 'review' && (
        <section data-testid="aapes-review-tab">
          <h3>{t('مراجعة وهندسة نصوص السياسات والتعليمات', 'Policy Engineering & Text Review')}</h3>
          <p className="p0-hint">
            {t(
              'فحص الذرية، اصطلاحات BCP 14، الأوصاف الفضفاضة، واكتمال حالات الفشل المنيع (Fail-Closed).',
              'Atomicity check, BCP 14 normative analysis, ambiguous adjective linter, and fail-closed completeness.'
            )}
          </p>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 'bold' }}>
              {t('اختر عينة تجريبية:', 'Choose a test sample:')}
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {samplePolicies.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setPolicyText(s.text); setRuleId(s.id); setReviewResult(null); setDraftCreated(null); }}
                  className="p0-button"
                  style={{ padding: '0.3rem 0.6rem' }}
                >
                  {t(s.labelAr, s.labelEn)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <div>
              <label htmlFor="aapes-rule-id" style={{ display: 'block', fontWeight: 'bold' }}>{t('معرف البند:', 'Rule ID:')}</label>
              <input id="aapes-rule-id" value={ruleId} onChange={e => setRuleId(e.target.value)} style={{ width: '100%', maxWidth: '300px', marginBottom: '0.5rem' }} />

              <label htmlFor="aapes-policy-text" style={{ display: 'block', fontWeight: 'bold' }}>{t('نص السياسة:', 'Policy Text:')}</label>
              <textarea
                id="aapes-policy-text"
                rows={5}
                dir="ltr"
                value={policyText}
                onChange={e => setPolicyText(e.target.value)}
                style={{ width: '100%', fontFamily: 'monospace', padding: '0.5rem' }}
              />
              <button
                type="button"
                data-testid="aapes-run-review-btn"
                onClick={handleReview}
                disabled={loading}
                className="p0-button"
                style={{ marginTop: '0.5rem', fontWeight: 'bold' }}
              >
                {t('تشغيل مراجعة AAPES', 'Run AAPES Review')}
              </button>
            </div>

            {reviewResult && (
              <div className="p0-detail" data-testid="aapes-review-output" style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px' }}>
                <h4>{t('نتائج فحص السياسة', 'Policy Review Findings')}</h4>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', margin: '0.5rem 0' }}>
                  <span><strong>{t('الكلمات الإلزامية (BCP 14):', 'BCP 14 Keywords:')}</strong> {reviewResult.detected_bcp14.join(', ') || t('لا توجد', 'None')}</span>
                  <span><strong>{t('أوصاف فضفاضة:', 'Ambiguities:')}</strong> {reviewResult.ambiguities.length ? reviewResult.ambiguities.join(', ') : t('لا توجد', 'None')}</span>
                  <span><strong>{t('حالة الفشل المنيع:', 'Failure State:')}</strong> {reviewResult.completeness.has_failure_state ? <Badge code="PASS" tone="success"/> : <Badge code="MISSING" tone="danger"/>}</span>
                  <span><strong>{t('المقترح المحكم:', 'Governed Proposal:')}</strong> <Badge code={reviewResult.proposal.action} /></span>
                </div>

                <h5>{t('الملاحظات المصنفة:', 'Categorized Findings:')}</h5>
                <ul>
                  {reviewResult.findings.map((f, i) => (
                    <li key={i}>
                      <Badge code={f.classification} /> <strong>[{f.domain}]</strong> {f.message}
                    </li>
                  ))}
                </ul>

                {reviewResult.proposal && (
                  <div style={{ marginTop: '1rem' }}>
                    <h5>{t('فروقات الصياغة المقترحة (Unified Diff):', 'Proposed Formulation Diff:')}</h5>
                    <pre dir="ltr" style={{ background: '#f5f5f5', padding: '0.8rem', borderRadius: '4px', overflowX: 'auto', fontSize: '0.85rem' }}>
                      {reviewResult.proposal.diff}
                    </pre>

                    <div style={{ marginTop: '1rem' }}>
                      <button
                        type="button"
                        data-testid="aapes-create-draft-btn"
                        onClick={handleCreateDraft}
                        disabled={loading || !!draftCreated}
                        className="p0-button"
                        style={{ background: '#1976d2', color: '#fff', padding: '0.5rem 1rem', fontWeight: 'bold' }}
                      >
                        {t('إعداد حزمة تغيير كمسودة حوكمة في rc3-local', 'Prepare Governed Draft Change Package in rc3-local')}
                      </button>
                    </div>
                  </div>
                )}

                {draftCreated && (
                  <div role="status" style={{ marginTop: '1rem', padding: '0.8rem', background: '#e8f5e9', border: '1px solid #4caf50', borderRadius: '4px' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#2e7d32' }}>
                      ✔ {t('تم إنشاء مسودة حزمة التغيير بنجاح في عهدة مسودات rc3-local!', 'Draft Change Package successfully created in rc3-local draft custody!')}
                    </p>
                    <p style={{ margin: '0.4rem 0' }}>
                      <code>{draftCreated.change_package?.id}</code> · {draftCreated.change_package?.title}
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate && onNavigate('packages')}
                      className="p0-button"
                      style={{ marginTop: '0.4rem' }}
                    >
                      {t('عرض في شاشة حزم التغيير →', 'View in Change Packages Screen →')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 3: READINESS ASSESSMENT */}
      {tab === 'assessment' && framework && (
        <section data-testid="aapes-assessment-tab">
          <h3>{t('تقييم الجاهزية الموزونة بالمخاطر (R0–R3)', 'Risk-Weighted Readiness Assessment')}</h3>
          <p className="p0-hint">
            {t(
              'الدرجة التشخيصية مفصولة تماماً عن قرار التأهيل؛ الدرجة العالية لا تعوض فشل البوابات الحرجة P0.',
              'Diagnostic score is strictly separated from qualification. A high score MUST NOT compensate for a failed P0 hard gate.'
            )}
          </p>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', margin: '1rem 0' }}>
            <label>
              <strong>{t('مستوى المخاطر المستهدف:', 'Target Risk Level:')}</strong>{' '}
              <select
                data-testid="aapes-risk-select"
                value={riskLevel}
                onChange={e => setRiskLevel(e.target.value)}
                style={{ padding: '0.3rem', fontWeight: 'bold' }}
              >
                {['R0', 'R1', 'R2', 'R3'].map(r => (
                  <option key={r} value={r}>{r} · {framework.risk_levels[r].description}</option>
                ))}
              </select>
            </label>

            <span style={{ margin: '0 0.5rem' }}>|</span>

            <span>{t('نماذج سريعة:', 'Presets:')}</span>
            <button type="button" onClick={() => applyPreset('low')} className="p0-button">{t('نضج أولي (L1)', 'Initial (L1)')}</button>
            <button type="button" onClick={() => applyPreset('high_score_failed_gate')} className="p0-button" style={{ color: '#d32f2f' }}>
              {t('درجة عالية + فشل بوابة حرجة', 'High Score + Failed Gate')}
            </button>
            <button type="button" onClick={() => applyPreset('fully_qualified')} className="p0-button" style={{ color: '#2e7d32' }}>
              {t('مؤهل بالكامل (L4)', 'Fully Qualified (L4)')}
            </button>
          </div>

          <div className="p0-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('المجال', 'Domain')}</th>
                  <th>{t('الأولوية', 'Priority')}</th>
                  <th>{t('الوزن', 'Weight')}</th>
                  <th>{t('مستوى النضج (0–4)', 'Maturity Level (0–4)')}</th>
                </tr>
              </thead>
              <tbody>
                {framework.domains.map(d => (
                  <tr key={d.id}>
                    <td><code>{d.id}</code> {d.name}</td>
                    <td><Badge code={d.priority_base} /></td>
                    <td>{d.importance_weight_percent}%</td>
                    <td>
                      <select
                        value={scores[d.id]?.maturity ?? 2}
                        onChange={e => {
                          const val = e.target.value;
                          setScores(prev => ({
                            ...prev,
                            [d.id]: { maturity: val === 'NOT_APPLICABLE' ? 'NOT_APPLICABLE' : Number(val), evidence_refs: [] }
                          }));
                        }}
                      >
                        {[0, 1, 2, 3, 4].map(n => (
                          <option key={n} value={n}>{n} - {framework.maturity_scale[String(n)]}</option>
                        ))}
                        {(d.id === 'D08' || d.id === 'D11') && (riskLevel === 'R0' || riskLevel === 'R1') && (
                          <option value="NOT_APPLICABLE">N/A (Permitted for R0/R1)</option>
                        )}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button
              type="button"
              data-testid="aapes-evaluate-assessment-btn"
              onClick={handleAssess}
              disabled={loading}
              className="p0-button"
              style={{ padding: '0.5rem 1rem', fontWeight: 'bold' }}
            >
              {t('حساب الجاهزية وبوابات التأهيل', 'Calculate Readiness & Gates')}
            </button>
          </div>

          {assessmentResult && (
            <div
              className="p0-detail"
              data-testid="aapes-assessment-output"
              style={{
                marginTop: '1.5rem',
                padding: '1rem',
                border: '2px solid',
                borderColor: assessmentResult.qualification === 'READY_FOR_AUTHORIZED_REVIEW' ? '#4caf50' : '#d32f2f',
                borderRadius: '6px',
                background: assessmentResult.qualification === 'READY_FOR_AUTHORIZED_REVIEW' ? '#f1f8e9' : '#ffebee'
              }}
            >
              <h4>{t('نتائج التقييم المستقلة', 'Independent Assessment Outcomes')}</h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', margin: '1rem 0' }}>
                <div style={{ padding: '0.8rem', background: '#fff', borderRadius: '4px', border: '1px solid #ddd' }}>
                  <small style={{ color: '#666', display: 'block' }}>{t('الدرجة التشخيصية (0–100)', 'Diagnostic Score (0–100)')}</small>
                  <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{assessmentResult.diagnostic_score}%</span>
                </div>
                <div style={{ padding: '0.8rem', background: '#fff', borderRadius: '4px', border: '1px solid #ddd' }}>
                  <small style={{ color: '#666', display: 'block' }}>{t('قرار التأهيل الحاكم', 'Governing Qualification')}</small>
                  <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: assessmentResult.qualification === 'READY_FOR_AUTHORIZED_REVIEW' ? '#2e7d32' : '#c62828' }}>
                    {assessmentResult.qualification}
                  </span>
                </div>
                <div style={{ padding: '0.8rem', background: '#fff', borderRadius: '4px', border: '1px solid #ddd' }}>
                  <small style={{ color: '#666', display: 'block' }}>{t('حالة البوابات الحرجة P0', 'P0 Hard Gates Status')}</small>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {assessmentResult.blockers.length ? <Badge code="BLOCKED" tone="danger" /> : <Badge code="PASSED" tone="success" />}
                  </span>
                </div>
              </div>

              {assessmentResult.blockers.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <h5>{t('الموانع الحرجة غير القابلة للتجاوز (Blockers):', 'Critical Hard Blockers:')}</h5>
                  <ul style={{ color: '#c62828' }}>
                    {assessmentResult.blockers.map((b, i) => (
                      <li key={i}><strong>{b}</strong></li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="p0-hint" style={{ marginTop: '0.8rem' }}>
                {assessmentResult.hard_limit}
              </p>
            </div>
          )}
        </section>
      )}

      {/* TAB 4: COMPATIBILITY MATRIX */}
      {tab === 'matrix' && matrixData && (
        <section data-testid="aapes-matrix-tab">
          <h3>{t('مصفوفة التوافقية بين AAPES وAGHR (48 بنداً)', 'AAPES–AGHR Traceability Matrix (48 Reqs)')}</h3>
          <p className="p0-hint">
            {t(
              'تتبع الأدلة والتحقق المستقل لكل بند؛ لا يُستنتج التوافق من تشابه المصطلحات دون فحص فعلي.',
              'Traceability to existing AGHR rules, contracts, and tests. Coverage is never inferred from terminology alone.'
            )}
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', margin: '1rem 0' }}>
            <label>
              <strong>{t('تصفية الحالة:', 'Filter Status:')}</strong>{' '}
              <select value={matrixFilter} onChange={e => setMatrixFilter(e.target.value)}>
                <option value="ALL">{t('الكل', 'All')} ({matrixData.summary.total})</option>
                <option value="COVERED">{t('مغطى (COVERED)', 'Covered')} ({matrixData.summary.covered})</option>
                <option value="PARTIAL">{t('جزئي (PARTIAL)', 'Partial')} ({matrixData.summary.partial})</option>
                <option value="MISSING">{t('ناقص (MISSING)', 'Missing')} ({matrixData.summary.missing})</option>
                <option value="CONFLICT">{t('تعارض (CONFLICT)', 'Conflict')} ({matrixData.summary.conflict})</option>
              </select>
            </label>

            <label>
              <strong>{t('بحث:', 'Search:')}</strong>{' '}
              <input value={matrixSearch} onChange={e => setMatrixSearch(e.target.value)} placeholder="REQ / title / ref..." />
            </label>

            <a
              href="/api/v1/aapes/matrix?format=csv"
              download="AAPES_AGHR_COMPATIBILITY_MATRIX.csv"
              className="p0-button"
              style={{ textDecoration: 'none', display: 'inline-block', padding: '0.4rem 0.8rem' }}
            >
              📥 {t('تنزيل المصفوفة كـ CSV', 'Download Matrix CSV')}
            </a>
          </div>

          <div className="p0-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('المعرف', 'ID')}</th>
                  <th>{t('المجال', 'Domain')}</th>
                  <th>{t('العنوان', 'Title')}</th>
                  <th>{t('الإلزام', 'Force')}</th>
                  <th>{t('الأولوية', 'Priority')}</th>
                  <th>{t('حالة التغطية', 'Coverage')}</th>
                  <th>{t('مرجع AGHR', 'AGHR Reference')}</th>
                  <th>{t('الأدلة والتفاصيل', 'Evidence & Details')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatrix.map(r => (
                  <tr key={r.requirement_id}>
                    <td><code>{r.requirement_id}</code></td>
                    <td>{r.domain}</td>
                    <td><strong>{r.title}</strong></td>
                    <td><Badge code={r.normative_level} /></td>
                    <td><Badge code={r.base_priority} /></td>
                    <td>
                      <Badge
                        code={r.coverage_status}
                        tone={r.coverage_status === 'COVERED' ? 'success' : r.coverage_status === 'PARTIAL' ? 'warning' : 'danger'}
                      />
                    </td>
                    <td><small dir="ltr">{r.aghr_ref}</small></td>
                    <td>
                      <details>
                        <summary>{t('عرض الأدلة والفجوة', 'View Evidence & Gap')}</summary>
                        <div style={{ fontSize: '0.85rem', padding: '0.4rem 0' }}>
                          <p><strong>{t('الدليل:', 'Evidence:')}</strong> {r.evidence}</p>
                          <p><strong>{t('الفجوة أو التعارض:', 'Gap or Conflict:')}</strong> {r.gap_or_conflict}</p>
                          <p><strong>{t('الإجراء التصحيحي:', 'Corrective Action:')}</strong> {r.corrective_action}</p>
                          <p><strong>{t('طريقة التحقق:', 'Verification Method:')}</strong> {r.verification_method}</p>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 5: DECISION ORACLES */}
      {tab === 'oracles' && (
        <section data-testid="aapes-oracles-tab">
          <h3>{t('أوراكل القرار والتقييم الحتمي (Deterministic Decision Oracles)', 'Deterministic Decision Oracles')}</h3>
          <p className="p0-hint">
            {t(
              'تنفيذ اختبارات حتمية ثلاثية القيم (TRUE/FALSE/UNKNOWN) لضمان عدم منح صلاحيات دون أدلة مثبتة.',
              'Deterministic 3-valued logic (ALLOW / DENY / UNKNOWN) to prevent unauthorized mutations.'
            )}
          </p>

          <button
            type="button"
            data-testid="aapes-run-oracles-btn"
            onClick={handleRunOracles}
            disabled={loading}
            className="p0-button"
            style={{ margin: '1rem 0', fontWeight: 'bold' }}
          >
            {t('تشغيل اختبارات أوراكل وOPA', 'Run Oracles & OPA Tests')}
          </button>

          {evalResult && (
            <div className="p0-detail" data-testid="aapes-oracles-output" style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
              <h4>{t('نتائج الاختبارات الحتمية', 'Deterministic Test Results')}</h4>
              <p><strong>{t('إجمالي الحالات المختبرة:', 'Total Scenarios Tested:')}</strong> {evalResult.synthetic_tests?.total}</p>
              <p><strong>{t('الحالات الناجحة:', 'Passed Scenarios:')}</strong> {evalResult.synthetic_tests?.passed}</p>
              <p><strong>{t('الحالات الفاشلة الممنوعة:', 'Failed / Denied Scenarios:')}</strong> {evalResult.synthetic_tests?.failed}</p>

              <h5>{t('تفاصيل سيناريوهات الإنفاذ (PEP/PDP):', 'PEP/PDP Enforcement Scenarios:')}</h5>
              <div className="p0-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t('السيناريو', 'Scenario')}</th>
                      <th>{t('القرار المتوقع', 'Expected')}</th>
                      <th>{t('القرار الفعلي', 'Actual')}</th>
                      <th>{t('النتيجة', 'Outcome')}</th>
                      <th>{t('السبب', 'Reason')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evalResult.synthetic_tests?.cases?.map((c, i) => (
                      <tr key={i}>
                        <td><strong>{c.case}</strong></td>
                        <td><Badge code={c.expected} /></td>
                        <td><Badge code={c.decision} tone={c.decision === 'ALLOW' ? 'success' : 'danger'} /></td>
                        <td>{c.passed ? <Badge code="PASS" tone="success" /> : <Badge code="FAIL" tone="danger" />}</td>
                        <td><small>{c.reason}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h5>{t('حالة سياسات OPA / Rego:', 'OPA / Rego Policies Status:')}</h5>
                <Badge code={evalResult.opa_policies?.status || 'OPA_NOT_IN_PATH'} />
                <p style={{ margin: '0.4rem 0' }}><small>{evalResult.opa_policies?.message}</small></p>
              </div>
            </div>
          )}
        </section>
      )}
    </section>
  );
}
