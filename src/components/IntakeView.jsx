import { useState, useEffect } from "react";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { reviewAapesPolicy, proposeAapesChangePackage } from "../api.js";

export default function IntakeView({ onStagePacket }) {
  const { t, locale } = useI18n();
  const [activeSubTab, setActiveSubTab] = useState("standard"); // 'standard' | 'aapes'
  
  // Standard Intake State
  const [rawText, setRawText] = useState("");
  const [author, setAuthor] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPacket, setCurrentPacket] = useState(null);
  const [packetsHistory, setPacketsHistory] = useState([]);
  const [error, setError] = useState(null);

  // AAPES Review State
  const [aapesText, setAapesText] = useState("");
  const [aapesRuleId, setAapesRuleId] = useState("AAPES-POL-SAMPLE-01");
  const [aapesReview, setAapesReview] = useState(null);
  const [aapesLoading, setAapesLoading] = useState(false);
  const [aapesSuccessMsg, setAapesSuccessMsg] = useState(null);

  useEffect(() => {
    loadPackets();
  }, []);

  async function loadPackets() {
    try {
      const res = await fetch("/api/intake/packets");
      const data = await res.json();
      setPacketsHistory(data.packets || []);
    } catch {}
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rawText.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/intake/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText,
          author: author.trim() || t("intake.defaultAuthor"),
          source: "STUDIO_WEB_INTAKE",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "error.intake");
      setCurrentPacket(data.packet);
      loadPackets();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const loadExample = (type) => {
    if (type === "compound") {
      setRawText(t("intake.exampleCompound"));
    } else if (type === "conflict") {
      setRawText(t("intake.exampleConflict"));
    } else if (type === "tool") {
      setRawText(t("intake.exampleTool"));
    }
  };

  // AAPES Review Handlers
  const handleAapesAnalyze = async () => {
    if (!aapesText.trim()) return;
    setAapesLoading(true);
    setAapesSuccessMsg(null);
    try {
      const review = await reviewAapesPolicy(aapesText, aapesRuleId);
      setAapesReview(review);
    } catch (err) {
      setError(err.message);
    } finally {
      setAapesLoading(false);
    }
  };

  const handleCreateDraftCp = async () => {
    if (!aapesReview || !aapesReview.proposal) return;
    setAapesLoading(true);
    try {
      const result = await proposeAapesChangePackage({
        title: `AAPES Policy Optimization: ${aapesReview.ruleId}`,
        action: aapesReview.proposal.action,
        originalRuleId: aapesReview.ruleId,
        proposedText: aapesReview.proposal.proposed_text,
        reason: aapesReview.proposal.reason,
        domain: "SEC"
      });
      setAapesSuccessMsg(`Draft ChangePackage ${result.packet?.packetId || "created"} saved in Draft custody. Owner authorization required before apply.`);
      loadPackets();
    } catch (err) {
      setError(err.message);
    } finally {
      setAapesLoading(false);
    }
  };

  const loadAapesSample = (sampleType) => {
    if (sampleType === "ambiguous") {
      setAapesRuleId("AAPES-POL-AMBIGUOUS-01");
      setAapesText("The agent should appropriately execute user instructions in a safe and timely manner.");
    } else if (sampleType === "compound") {
      setAapesRuleId("AAPES-POL-COMPOUND-02");
      setAapesText("The agent MUST validate incoming headers and also MUST verify token signatures; furthermore it MUST write audit logs.");
    } else if (sampleType === "prod_write") {
      setAapesRuleId("AAPES-POL-PROD-WRITE-01");
      setAapesText("Upon receiving a state-changing write request, the agent MUST verify that all trusted authorization claims are present; otherwise the operation MUST fail closed and return DENY.");
    }
  };

  return (
    <div className="intake-studio-view">
      {/* Top Banner Notice */}
      <div className="gov-alert-banner">
        <span className="alert-icon">🛡️</span>
        <div>
          <strong>{t("intake.principleTitle")}</strong> {t("intake.principle")}
        </div>
      </div>

      {/* Sub-tab switcher */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border)", marginBottom: "16px" }}>
        <button
          className={`gov-tab-btn ${activeSubTab === "standard" ? "active" : ""}`}
          onClick={() => setActiveSubTab("standard")}
        >
          {t("app.intake")}
        </button>
        <button
          className={`gov-tab-btn ${activeSubTab === "aapes" ? "active" : ""}`}
          onClick={() => setActiveSubTab("aapes")}
        >
          {t("aapes.reviewTab")}
        </button>
      </div>

      {/* Tab 1: Standard Intake */}
      {activeSubTab === "standard" && (
        <div className={"intake-layout-grid" + (currentPacket ? "" : " form-dominant")}>
          {/* Left Form: Intake Capture */}
          <div className="intake-form-pane">
            <form onSubmit={handleSubmit}>
              <div className="pane-title">{t("intake.heading")}</div>

              <div className="form-group">
                <label>{t("intake.author")}</label>
                <input
                  type="text"
                  dir="auto"
                  className="input-text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder={t("intake.authorPlaceholder")}
                  aria-label={t("intake.author")}
                />
              </div>

              <div className="form-group">
                <div className="label-with-examples">
                  <label>{t("intake.text")}</label>
                  <div className="example-links">
                    <span>{t("intake.examples")} </span>
                    <button type="button" onClick={() => loadExample("compound")} className="link-btn">
                      {t("intake.compound")}
                    </button>
                    <span> · </span>
                    <button type="button" onClick={() => loadExample("conflict")} className="link-btn">
                      {t("intake.conflict")}
                    </button>
                    <span> · </span>
                    <button type="button" onClick={() => loadExample("tool")} className="link-btn">
                      {t("intake.toolBoundary")}
                    </button>
                  </div>
                </div>
                <textarea
                  className="input-textarea"
                  dir="auto"
                  rows="6"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={t("intake.placeholder")}
                  aria-label={t("intake.text")}
                />
              </div>

              {error && <div className="gov-error-msg">{t(error)}</div>}

              <div className="inline-note" role="note">{t("gov.blockedWriteNote")}</div>

              <button type="submit" className="btn btn-primary" disabled={loading || !rawText.trim()}>
                {loading ? t("intake.submitting") : t("intake.submit")}
              </button>
            </form>
          </div>

          {/* Right Panel: Active Packet & Results */}
          <div className="intake-result-pane">
            {currentPacket ? (
              <div className="packet-card">
                <div className="packet-header">
                  <div>
                    <span className="packet-id">{currentPacket.packetId}</span>
                    <span className="packet-status status-proposed">{currentPacket.status}</span>
                  </div>
                  <div className="packet-date">
                    {new Date(currentPacket.createdAt).toLocaleString(locale)}
                  </div>
                </div>

                <div className="packet-meta">
                  <span>{t("intake.sourceLabel")}: <code>{currentPacket.source}</code></span>
                  <span>{t("intake.authorLabel")}: {currentPacket.author}</span>
                </div>

                <div className="section-title">{t("intake.itemsHeading", { count: currentPacket.changeItems?.length || 0 })}</div>
                <div className="items-list">
                  {currentPacket.changeItems?.map((it) => (
                    <div key={it.itemId} className={"item-box " + (it.conflict ? "has-conflict" : "")}>
                      <div className="item-top">
                        <span className="item-id">{it.itemId}</span>
                        <div className="badge-group">
                          <span className={`badge badge-domain domain-${it.domainConcern.toLowerCase()}`}>
                            {it.domainConcern}
                          </span>
                          <span className={`badge badge-force force-${it.normativeForce.toLowerCase()}`}>
                            {it.normativeForce}
                          </span>
                        </div>
                      </div>

                      <div className="item-statement" dir="auto">{it.statement}</div>

                      {it.conflict && (
                        <div className="conflict-box">
                          <span className="conflict-icon">⚠️</span>
                          <div>
                            <strong>{t("intake.conflictDetected")}</strong> {it.conflictDetails}
                          </div>
                        </div>
                      )}

                      <div className="item-proposal">
                        <strong>{t("intake.proposedAction")}:</strong> {it.proposedAction} — {it.rationale}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="packet-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => onStagePacket && onStagePacket(currentPacket.packetId)}
                  >
                    {t("intake.stageButton")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <div className="empty-text">{t("intake.emptyText")}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: AAPES Policy Engineering Review */}
      {activeSubTab === "aapes" && (
        <div className={"intake-layout-grid" + (aapesReview ? "" : " form-dominant")}>
          {/* Left Form: Policy Engineering Review Input */}
          <div className="intake-form-pane">
            <div className="pane-title">{t("aapes.reviewTab")}</div>

            <div className="form-group">
              <label>{t("aapes.ruleIdLabel")}</label>
              <input
                type="text"
                className="input-text"
                value={aapesRuleId}
                onChange={(e) => setAapesRuleId(e.target.value)}
                style={{ background: "var(--surface-sunken)", color: "var(--text)", border: "1px solid var(--border)" }}
              />
            </div>

            <div className="form-group">
              <div className="label-with-examples">
                <label>{t("aapes.inputPolicy")}</label>
                <div className="example-links">
                  <span>Samples: </span>
                  <button type="button" onClick={() => loadAapesSample("ambiguous")} className="link-btn">
                    Ambiguous
                  </button>
                  <span> · </span>
                  <button type="button" onClick={() => loadAapesSample("compound")} className="link-btn">
                    Compound
                  </button>
                  <span> · </span>
                  <button type="button" onClick={() => loadAapesSample("prod_write")} className="link-btn">
                    Production Write
                  </button>
                </div>
              </div>
              <textarea
                className="input-textarea"
                dir="auto"
                rows="6"
                value={aapesText}
                onChange={(e) => setAapesText(e.target.value)}
                placeholder="Enter policy rule statement to review under AAPES v2.1..."
                style={{ background: "var(--surface-sunken)", color: "var(--text)", border: "1px solid var(--border)" }}
              />
            </div>

            <button
              type="button"
              className="btn btn-primary"
              disabled={aapesLoading || !aapesText.trim()}
              onClick={handleAapesAnalyze}
            >
              {aapesLoading ? "Analyzing..." : t("aapes.btnAnalyze")}
            </button>
          </div>

          {/* Right Panel: AAPES Analysis & Governed Optimization Proposal */}
          <div className="intake-result-pane">
            {aapesReview ? (
              <div className="packet-card" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="packet-header" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
                  <div>
                    <span className="packet-id" style={{ color: "var(--accent)" }}>{aapesReview.ruleId}</span>
                    <span style={{
                      marginLeft: "8px",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      background: aapesReview.proposal.action === "KEEP" ? "var(--success-soft)" : "var(--warning-soft)",
                      color: aapesReview.proposal.action === "KEEP" ? "var(--success)" : "var(--warning)"
                    }}>
                      {aapesReview.proposal.action}
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                    SHA: {aapesReview.source_hash.slice(0, 12)}...
                  </div>
                </div>

                {/* Analysis Badges Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px", margin: "12px 0" }}>
                  <div style={{ background: "var(--surface-sunken)", padding: "8px", borderRadius: "6px", border: "1px solid var(--surface-2)", textAlign: "center" }}>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>BCP 14 Keywords</div>
                    <div style={{ fontSize: "12px", fontWeight: "bold", color: aapesReview.detected_bcp14.length > 0 ? "var(--accent)" : "var(--danger)" }}>
                      {aapesReview.detected_bcp14.join(", ") || "None (Missing)"}
                    </div>
                  </div>
                  <div style={{ background: "var(--surface-sunken)", padding: "8px", borderRadius: "6px", border: "1px solid var(--surface-2)", textAlign: "center" }}>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>Ambiguous Adjectives</div>
                    <div style={{ fontSize: "12px", fontWeight: "bold", color: aapesReview.ambiguities.length > 0 ? "var(--danger)" : "var(--success)" }}>
                      {aapesReview.ambiguities.join(", ") || "None (Clear)"}
                    </div>
                  </div>
                  <div style={{ background: "var(--surface-sunken)", padding: "8px", borderRadius: "6px", border: "1px solid var(--surface-2)", textAlign: "center" }}>
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>Failure State</div>
                    <div style={{ fontSize: "12px", fontWeight: "bold", color: aapesReview.completeness.has_failure_state ? "var(--success)" : "var(--warning)" }}>
                      {aapesReview.completeness.has_failure_state ? "Defined" : "Missing"}
                    </div>
                  </div>
                </div>

                {/* Findings List */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text)", marginBottom: "6px" }}>
                    {t("aapes.findings")}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {aapesReview.findings.map((f, idx) => {
                      const typeColors = {
                        fact: { bg: "var(--info-soft)", text: "var(--accent)", border: "var(--accent)" },
                        inference: { bg: "var(--warning-soft)", text: "var(--warning)", border: "#d97706" },
                        assumption: { bg: "var(--accent-soft)", text: "#c084fc", border: "#9333ea" },
                        recommendation: { bg: "var(--success-soft)", text: "var(--success)", border: "#059669" }
                      };
                      const col = typeColors[f.type] || typeColors.fact;
                      return (
                        <div key={idx} style={{ background: col.bg, borderLeft: `3px solid ${col.border}`, padding: "6px 10px", borderRadius: "4px", fontSize: "12px" }}>
                          <span style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: "10px", color: col.text }}>[{f.type}] ({f.category}):</span>{" "}
                          <span style={{ color: "var(--text)" }}>{f.message}</span>
                          {f.snippet && <div style={{ fontSize: "11px", color: "var(--muted)", fontStyle: "italic", marginTop: "2px" }}>"{f.snippet}"</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Proposed Diff View */}
                {aapesReview.proposal.action !== "KEEP" && (
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "bold", color: "var(--text)", marginBottom: "6px" }}>
                      {t("aapes.diffView")}
                    </div>
                    <pre style={{ background: "var(--surface-sunken)", padding: "10px", borderRadius: "6px", fontSize: "12px", border: "1px solid var(--surface-2)", overflowX: "auto", color: "var(--text-secondary)" }}>
                      {aapesReview.proposal.diff}
                    </pre>
                  </div>
                )}

                {/* Action Button: Create Draft Change Package */}
                <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button
                    className="btn btn-primary"
                    disabled={aapesLoading}
                    onClick={handleCreateDraftCp}
                  >
                    {t("aapes.btnProposeCp")}
                  </button>
                  {aapesSuccessMsg && (
                    <div style={{ fontSize: "12px", color: "var(--success)", background: "var(--success-soft)", padding: "8px", borderRadius: "4px" }}>
                      ✔ {aapesSuccessMsg}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔬</div>
                <div className="empty-text">Enter policy text or select a sample on the left to analyze under AAPES v2.1.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
