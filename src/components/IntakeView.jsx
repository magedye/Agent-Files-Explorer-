import { useState, useEffect } from "react";
import { useI18n } from "../i18n/I18nProvider.jsx";

export default function IntakeView({ onStagePacket }) {
  const { t, locale } = useI18n();
  const [rawText, setRawText] = useState("");
  const [author, setAuthor] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPacket, setCurrentPacket] = useState(null);
  const [packetsHistory, setPacketsHistory] = useState([]);
  const [error, setError] = useState(null);

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
      setRawText(
        t("intake.exampleCompound")
      );
    } else if (type === "conflict") {
      setRawText(t("intake.exampleConflict"));
    } else if (type === "tool") {
      setRawText(t("intake.exampleTool"));
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

      <div className="intake-layout-grid">
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
                  <button type="button" onClick={() => loadExample("conflict")} className="link-btn">
                    {t("intake.conflict")}
                  </button>
                  <button type="button" onClick={() => loadExample("tool")} className="link-btn">
                    {t("intake.tool")}
                  </button>
                </div>
              </div>
              <textarea
                dir="auto"
                className="input-textarea"
                rows="6"
                placeholder={t("intake.placeholder")}
                aria-label={t("intake.text")}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading || !rawText.trim()}>
                {loading ? t("intake.processing") : t("intake.submit")}
              </button>
            </div>

            {error && <div className="gov-error-msg">{t(error)}</div>}
          </form>

          {/* History of ChangePackets */}
          <div className="packets-history-section">
            <h4>{t("intake.history", { count: packetsHistory.length })}</h4>
            <div className="packets-list">
              {packetsHistory.map((p) => (
                <div
                  key={p.packetId}
                  className={"packet-item" + (currentPacket?.packetId === p.packetId ? " active" : "")}
                  onClick={() => setCurrentPacket(p)}
                >
                  <div className="packet-item-id">{p.packetId}</div>
                  <div className="packet-item-meta">
                    <span>{new Date(p.createdAt).toLocaleTimeString(locale)}</span>
                    <span>{t("intake.atomicCount", { count: p.changeItems?.length || 0 })}</span>
                  </div>
                  <div className="packet-item-text" dir="auto">{p.rawText?.slice(0, 50)}…</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Pane: Generated ChangePacket & Traceable ChangeItems */}
        <div className="intake-result-pane">
          {currentPacket ? (
            <div className="packet-details">
              <div className="packet-header">
                <div>
                  <h3>{t("intake.packet")} {currentPacket.packetId}</h3>
                  <div className="packet-meta-row">
                    <span>{t("intake.digest")} <code>{currentPacket.rawDigestSha256?.slice(0, 16)}…</code></span>
                    <span className="badge badge-warning">{currentPacket.status}</span>
                  </div>
                </div>
              </div>

              <div className="raw-preserved-box">
                <div className="box-label">{t("intake.preserved")}</div>
                <div className="raw-text-content" dir="auto">{currentPacket.rawText}</div>
              </div>

              <h4>{t("intake.items")}</h4>

              <div className="change-items-grid">
                {currentPacket.changeItems.map((item, idx) => (
                  <div key={item.itemId} className={`change-item-card action-${item.proposedAction.toLowerCase()}`}>
                    <div className="item-card-top">
                      <span className="item-id">{item.itemId}</span>
                      <span className={`action-badge action-${item.proposedAction.toLowerCase()}`}>
                        {item.proposedAction}
                      </span>
                    </div>

                    <div className="item-statement">
                      <strong>{t("intake.statement")}</strong> <bdi>{item.statement}</bdi>
                    </div>

                    {/* 2-Layer Classification Badges */}
                    <div className="item-badges-row">
                      <span className="badge badge-domain" title="Domain Concern">
                        {item.domainConcern}
                      </span>
                      <span className={`force-badge force-${item.normativeForce.toLowerCase()}`}>
                        {item.normativeForce}
                      </span>
                      <span className="badge badge-locus" title="Enforcement Locus">
                        {item.enforcementLocus}
                      </span>
                      <span className="badge badge-intent" title="Intent">
                        {item.intent}
                      </span>
                    </div>

                    {/* Reconciliation details */}
                    <div className="reconciliation-box">
                      <div className="rec-rationale">
                        <strong>{t("intake.rationale")}</strong> <bdi>{item.rationale}</bdi>
                      </div>
                      {item.relatedRules && item.relatedRules.length > 0 && (
                        <div className="rec-rules">
                          <strong>{t("intake.relatedRules")}</strong> {item.relatedRules.join(", ")}
                        </div>
                      )}
                    </div>

                    <div className="item-status-footer">
                      <span>{t("intake.status")} <strong>{item.status}</strong></span>
                      <span>{t("intake.authority")} {currentPacket.authorityRequired}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="pane-placeholder">
              <span>{t("intake.empty")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
