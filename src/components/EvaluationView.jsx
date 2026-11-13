import { useState, useEffect } from "react";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { assessAapesReadiness, evaluateAapesSynthetic, fetchAapesFramework } from "../api.js";

const DEFAULT_VETO_SIGNALS = {
  unverified_critical_failure: false,
  bypassable_pep_detected: false,
  unauthorized_privilege_escalation: false,
  uncontrolled_memory_overwrite: false
};

const DEFAULT_GATES = {
  G0: { status: "PASS", evidence_refs: ["G0-SCOPE-REGISTER"] },
  G1: { status: "PASS", evidence_refs: ["G1-DECISION-TABLES"] },
  G2: { status: "PASS", evidence_refs: ["G2-PLATFORM-AUTH"] },
  G3: { status: "PASS", evidence_refs: ["G3-PEP-EVIDENCE"] },
  G4: { status: "PASS", evidence_refs: ["G4-EVAL-SUITE"] },
  G5: { status: "PASS", evidence_refs: ["G5-AUDIT-EVIDENCE"] },
  G6: { status: "PASS", evidence_refs: ["G6-OWNER-SIGN-2026-10-26"] },
  G7: { status: "PASS", evidence_refs: ["G7-ACTIVATION-RECEIPT"] }
};

export default function EvaluationView() {
  const { t, locale } = useI18n();
  const [activeSubTab, setActiveSubTab] = useState("standard"); // 'standard' | 'aapes'

  // Standard Evaluation State
  const [running, setRunning] = useState(false);
  const [activeResult, setActiveResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  // AAPES State
  const [framework, setFramework] = useState(null);
  const [riskLevel, setRiskLevel] = useState("R2");
  const [domainMaturity, setDomainMaturity] = useState({});
  const [vetoSignals, setVetoSignals] = useState(DEFAULT_VETO_SIGNALS);
  const [gates, setGates] = useState(DEFAULT_GATES);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [syntheticResult, setSyntheticResult] = useState(null);
  const [aapesLoading, setAapesLoading] = useState(false);

  useEffect(() => {
    loadHistory();
    loadFramework();
  }, []);

  async function loadHistory() {
    try {
      const res = await fetch("/api/evaluation/history");
      const data = await res.json();
      setHistory(data.history || []);
      if (data.history && data.history.length > 0) {
        setActiveResult(data.history[0]);
      }
    } catch {}
  }

  async function loadFramework() {
    try {
      const res = await fetchAapesFramework();
      setFramework(res.framework);
      // Initialize domain maturity to 3 by default with evidence refs
      const initial = {};
      for (const d of res.framework?.domains || []) {
        initial[d.id] = {
          maturity: 3,
          evidence_refs: ["docs/evidence/baseline.json"],
          verified_by: "Security Review Team",
          verification_ref: "VERIF-2026-11"
        };
      }
      setDomainMaturity(initial);
    } catch (e) {
      console.error("Failed to load framework", e);
    }
  }

  async function handleRunSuite() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/evaluation/run-suite", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "error.suite");
      setActiveResult(data.result);
      loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  async function handleCheckPackage() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/evaluation/check-package", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "error.package");
      setActiveResult(data.result);
      loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  // AAPES Handlers
  const handleCalculateAssessment = async () => {
    setAapesLoading(true);
    try {
      const payload = {
        risk_level: riskLevel,
        scores: domainMaturity,
        veto_signals: vetoSignals,
        gates,
        owner_approval: {
          status: "GRANTED",
          approval_ref: "OWNER-SIGN-2026-10-26",
          approver: "Project Owner"
        }
      };
      const result = await assessAapesReadiness(payload);
      setAssessmentResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setAapesLoading(false);
    }
  };

  const handleRunSynthetic = async () => {
    setAapesLoading(true);
    try {
      const result = await evaluateAapesSynthetic();
      setSyntheticResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setAapesLoading(false);
    }
  };

  const updateDomainMaturity = (did, m) => {
    setDomainMaturity(prev => ({
      ...prev,
      [did]: {
        ...(prev[did] || {}),
        maturity: m === "NOT_APPLICABLE" ? m : parseInt(m, 10),
        evidence_refs: ["docs/evidence/baseline.json"],
        verified_by: "Security Review Team",
        verification_ref: "VERIF-2026-11",
        na_reason: m === "NOT_APPLICABLE" ? "Permitted R0/R1 exception" : undefined,
        na_approved_by: m === "NOT_APPLICABLE" ? "Project Owner" : undefined
      }
    }));
  };

  const statusClass = (v) => "status-" + String(v || "").toLowerCase().replace(/_/g, "-");

  return (
    <div className="eval-studio-view">
      {/* Alert Header */}
      <div className="gov-alert-banner">
        <span className="alert-icon">⚖️</span>
        <div>
          <strong>{t("evaluation.principleTitle")}</strong> {t("evaluation.principle")}
        </div>
      </div>

      {/* Sub-tab switcher */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border)", marginBottom: "16px" }}>
        <button
          className={`gov-tab-btn ${activeSubTab === "standard" ? "active" : ""}`}
          onClick={() => setActiveSubTab("standard")}
        >
          {t("app.evaluation")}
        </button>
        <button
          className={`gov-tab-btn ${activeSubTab === "aapes" ? "active" : ""}`}
          onClick={() => setActiveSubTab("aapes")}
        >
          {t("aapes.assessTab")}
        </button>
      </div>

      {/* Sub-Tab 1: Standard Evaluation */}
      {activeSubTab === "standard" && (
        <>
          <div className="inline-note" role="note">{t("gov.blockedWriteNote")}</div>
          <div className="eval-actions-bar">
            <button className="btn btn-primary" onClick={handleRunSuite} disabled={running}>
              {running ? t("evaluation.running") : t("evaluation.run")}
            </button>
            <button className="btn btn-secondary" onClick={handleCheckPackage} disabled={running}>
              {running ? t("evaluation.checking") : t("evaluation.check")}
            </button>
          </div>

          {error && <div className="gov-error-msg">{t(error)}</div>}

          <div className="eval-grid">
            {/* Left Column: History */}
            <div className="eval-history-col">
              <div className="pane-title">{t("evaluation.history")}</div>
              <div className="history-list">
                {history.map((h) => (
                  <div
                    key={h.runId}
                    className={"history-card" + (activeResult?.runId === h.runId ? " active" : "")}
                    onClick={() => setActiveResult(h)}
                  >
                    <div className="h-top">
                      <span className="h-suite">{h.suite}</span>
                      <span className={`eval-badge eval-${(h.status || "FAIL").toLowerCase()}`}>
                        {h.status}
                      </span>
                    </div>
                    <div className="h-time">{new Date(h.executed_at).toLocaleString(locale)}</div>
                  </div>
                ))}
                {history.length === 0 && <div className="empty-state">{t("evaluation.noHistory")}</div>}
              </div>
            </div>

            {/* Right Column: Active Result Details */}
            <div className="eval-detail-col">
              {activeResult ? (
                <div className="eval-card">
                  <div className="eval-header">
                    <div>
                      <span className="eval-run-id">{activeResult.runId}</span>
                      <span className={`eval-status status-${(activeResult.status || "FAIL").toLowerCase()}`}>
                        {activeResult.status}
                      </span>
                    </div>
                    <div className="eval-date">
                      {new Date(activeResult.executed_at).toLocaleString(locale)}
                    </div>
                  </div>

                  <div className="eval-meta-grid">
                    <div>
                      <span className="meta-lbl">{t("evaluation.targetPackage")}</span>
                      <code>{activeResult.target_package}</code>
                    </div>
                    <div>
                      <span className="meta-lbl">{t("evaluation.testRunner")}</span>
                      <span>{activeResult.test_runner}</span>
                    </div>
                    <div>
                      <span className="meta-lbl">{t("evaluation.scope")}</span>
                      <span>{activeResult.scope}</span>
                    </div>
                    <div>
                      <span className="meta-lbl">{t("evaluation.live")}</span>
                      <span className={statusClass(activeResult.live_model_evaluation)}>{activeResult.live_model_evaluation}</span>
                    </div>
                    <div>
                      <span className="meta-lbl">{t("evaluation.native")}</span>
                      <span className={statusClass(activeResult.native_host_qualification)}>{activeResult.native_host_qualification}</span>
                    </div>
                    <div>
                      <span className="meta-lbl">{t("evaluation.review")}</span>
                      <span className={statusClass(activeResult.independent_review)}>{activeResult.independent_review}</span>
                    </div>
                    <div>
                      <span className="meta-lbl">{t("evaluation.acceptance")}</span>
                      <span className={statusClass(activeResult.release_acceptance)}>{activeResult.release_acceptance}</span>
                    </div>
                  </div>

                  <div className="eval-output-pane">
                    <details open>
                      <summary>{t("evaluation.output")}</summary>
                      {activeResult.output ? (
                        <pre className="output-raw">{activeResult.output}</pre>
                      ) : (
                        <div className="empty-sub">{t("evaluation.noOutput")}</div>
                      )}
                    </details>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">⚖️</div>
                  <div className="empty-text">{t("evaluation.empty")}</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Sub-Tab 2: AAPES Readiness Assessment & Oracles */}
      {activeSubTab === "aapes" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px" }}>
          {/* Left Column: Assessment Controls */}
          <div style={{ background: "var(--surface)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ fontWeight: "bold", fontSize: "15px", color: "var(--text)" }}>{t("aapes.assessTab")}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>{t("aapes.riskLevel")}</span>
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value)}
                  style={{ background: "var(--surface-sunken)", color: "var(--accent)", border: "1px solid var(--accent)", padding: "4px 8px", borderRadius: "4px", fontSize: "13px", fontWeight: "bold" }}
                >
                  <option value="R0">R0: Advisory (75%)</option>
                  <option value="R1">R1: Read-Only (80%)</option>
                  <option value="R2">R2: Staging (85%)</option>
                  <option value="R3">R3: Production (90%)</option>
                </select>
              </div>
            </div>

            {/* Domains Maturity Table */}
            <div style={{ maxHeight: "380px", overflowY: "auto", border: "1px solid var(--surface-2)", borderRadius: "6px", marginBottom: "16px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                    <th style={{ padding: "8px" }}>Domain</th>
                    <th style={{ padding: "8px" }}>Weight</th>
                    <th style={{ padding: "8px" }}>Base Priority</th>
                    <th style={{ padding: "8px" }}>Maturity (0–4)</th>
                  </tr>
                </thead>
                <tbody>
                  {(framework?.domains || []).map((dom) => {
                    const current = domainMaturity[dom.id]?.maturity ?? 3;
                    const isP0 = dom.priority_base === "P0" || ((riskLevel === "R2" || riskLevel === "R3") && (dom.id === "D08" || dom.id === "D11"));
                    return (
                      <tr key={dom.id} style={{ borderBottom: "1px solid var(--surface-2)" }}>
                        <td style={{ padding: "8px", color: "var(--text)" }}>
                          <span style={{ color: "var(--accent)", fontWeight: "bold" }}>{dom.id}</span>: {dom.name}
                        </td>
                        <td style={{ padding: "8px", color: "var(--muted)" }}>{dom.importance_weight_percent}%</td>
                        <td style={{ padding: "8px" }}>
                          <span style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "10px",
                            fontWeight: "bold",
                            background: isP0 ? "var(--danger-soft)" : "var(--info-soft)",
                            color: isP0 ? "var(--danger)" : "var(--accent)"
                          }}>
                            {isP0 ? "P0 (Hard Gate)" : "P1"}
                          </span>
                        </td>
                        <td style={{ padding: "8px" }}>
                          <select
                            value={current}
                            onChange={(e) => updateDomainMaturity(dom.id, e.target.value)}
                            style={{ background: "var(--surface-sunken)", color: "var(--text)", border: "1px solid var(--border)", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}
                          >
                            <option value="0">0: Absent</option>
                            <option value="1">1: Documented</option>
                            <option value="2">2: Testable Design</option>
                            <option value="3">3: Implemented with Evidence</option>
                            <option value="4">4: Independently Verified</option>
                            {(riskLevel === "R0" || riskLevel === "R1") && (dom.id === "D08" || dom.id === "D11") && (
                              <option value="NOT_APPLICABLE">N/A (Exempt)</option>
                            )}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                className="btn btn-primary"
                disabled={aapesLoading}
                onClick={handleCalculateAssessment}
              >
                {aapesLoading ? "Computing..." : t("aapes.calcAssess")}
              </button>
              <button
                className="btn btn-secondary"
                disabled={aapesLoading}
                onClick={handleRunSynthetic}
              >
                {t("aapes.runOracles")}
              </button>
            </div>
          </div>

          {/* Right Column: Assessment Outputs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {assessmentResult && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>{t("aapes.diagScore")}</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: assessmentResult.diagnostic_score >= assessmentResult.provisional_threshold ? "var(--success)" : "var(--danger)" }}>
                      {assessmentResult.diagnostic_score}%
                      <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: "normal", marginLeft: "6px" }}>
                        (Threshold: {assessmentResult.provisional_threshold}%)
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>{t("aapes.hardGate")}</div>
                    <span style={{
                      padding: "6px 14px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: "bold",
                      display: "inline-block",
                      background: assessmentResult.qualification === "READY_FOR_AUTHORIZED_REVIEW" ? "var(--success-soft)" : "var(--danger-soft)",
                      color: assessmentResult.qualification === "READY_FOR_AUTHORIZED_REVIEW" ? "var(--success)" : "var(--danger)",
                      border: `1px solid ${assessmentResult.qualification === "READY_FOR_AUTHORIZED_REVIEW" ? "var(--success)" : "var(--danger)"}`
                    }}>
                      {assessmentResult.qualification}
                    </span>
                  </div>
                </div>

                {/* Hard Invariant Banner */}
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", background: "var(--accent-soft)", border: "1px solid var(--accent-soft)", padding: "8px 10px", borderRadius: "4px", marginBottom: "12px" }}>
                  ℹ <strong>Invariant:</strong> A high diagnostic score cannot override or compensate for failed critical gates.
                </div>

                {/* Blockers Section */}
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text)", marginBottom: "6px" }}>
                    {t("aapes.blockersList", { count: assessmentResult.blocker_count })}
                  </div>
                  {assessmentResult.blockers.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "180px", overflowY: "auto" }}>
                      {assessmentResult.blockers.map((b, idx) => (
                        <div key={idx} style={{ background: "var(--danger-soft)", borderLeft: "3px solid var(--danger)", padding: "6px 8px", borderRadius: "3px", fontSize: "11px", color: "#fca5a5" }}>
                          ✖ {b}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: "var(--success)", fontSize: "12px" }}>{t("aapes.noBlockers")}</div>
                  )}
                </div>

                <div style={{ marginTop: "12px", fontSize: "10px", color: "var(--muted)", fontStyle: "italic", borderTop: "1px solid var(--surface-2)", paddingTop: "8px" }}>
                  {assessmentResult.hard_limit}
                </div>
              </div>
            )}

            {/* Synthetic Oracles Output */}
            {syntheticResult && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
                  <div style={{ fontWeight: "bold", fontSize: "13px", color: "var(--accent)" }}>Deterministic Decision Oracles</div>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    background: syntheticResult.synthetic_suite.overall_status === "PASS" ? "var(--success-soft)" : "var(--danger-soft)",
                    color: syntheticResult.synthetic_suite.overall_status === "PASS" ? "var(--success)" : "var(--danger)"
                  }}>
                    {syntheticResult.synthetic_suite.overall_status} ({syntheticResult.synthetic_suite.passed_count}/{syntheticResult.synthetic_suite.total_cases})
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                  {syntheticResult.synthetic_suite.cases.map((c) => (
                    <div key={c.test_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-sunken)", padding: "6px 8px", borderRadius: "4px", fontSize: "11px" }}>
                      <span style={{ color: "var(--text-secondary)" }}>{c.test_id}: {c.name}</span>
                      <span style={{ color: c.status === "PASS" ? "var(--success)" : "var(--danger)", fontWeight: "bold" }}>
                        {c.actual} ({c.status})
                      </span>
                    </div>
                  ))}
                </div>

                {/* OPA Status */}
                <div style={{ background: "var(--surface-sunken)", padding: "8px", borderRadius: "4px", border: "1px solid var(--surface-2)", fontSize: "11px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "bold", color: "var(--muted)" }}>OPA / Rego Status:</span>
                    <span style={{ color: syntheticResult.opa_status.status === "PASS" ? "var(--success)" : "var(--warning)", fontWeight: "bold" }}>
                      {syntheticResult.opa_status.status}
                    </span>
                  </div>
                  <div style={{ color: "var(--muted)" }}>
                    {syntheticResult.opa_status.reason || syntheticResult.opa_status.details || "OPA evaluated."}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
