import { useState, useEffect } from "react";
import { useI18n } from "../i18n/I18nProvider.jsx";

export default function EvaluationView() {
  const { t, locale } = useI18n();
  const [running, setRunning] = useState(false);
  const [activeResult, setActiveResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHistory();
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

  return (
    <div className="eval-studio-view">
      {/* Alert Header */}
      <div className="gov-alert-banner">
        <span className="alert-icon">⚖️</span>
        <div>
          <strong>{t("evaluation.principleTitle")}</strong> {t("evaluation.principle")}
        </div>
      </div>

      {/* Control Actions Bar */}
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

        {/* Right Column: Evidence Inspector */}
        <div className="eval-evidence-col">
          {activeResult ? (
            <div className="evidence-panel">
              <div className="evidence-header">
                <div>
                  <h3>{t("evaluation.report")} {activeResult.runId}</h3>
                  <div className="evidence-meta">
                    <span>{t("evaluation.suite")} {activeResult.suite}</span>
                    <span>{t("evaluation.exitCode")} {activeResult.exitCode}</span>
                  </div>
                </div>
                <div className={`eval-status-stamp status-${(activeResult.status || "FAIL").toLowerCase()}`}>
                  {activeResult.status}
                </div>
              </div>

              {/* Boundaries & Disclaimers */}
              <div className="evidence-boundaries-box">
                <div className="b-row">
                  <span>{t("evaluation.scope")}</span>
                  <strong>LOCAL_REFERENCE_TOOLS_ONLY</strong>
                </div>
                <div className="b-row">
                  <span>{t("evaluation.live")}</span>
                  <strong className="text-muted">NOT_RUN</strong>
                </div>
                <div className="b-row">
                  <span>{t("evaluation.native")}</span>
                  <strong className="text-muted">NOT_RUN</strong>
                </div>
                <div className="b-row">
                  <span>{t("evaluation.review")}</span>
                  <strong className="text-muted">NOT_PERFORMED</strong>
                </div>
                <div className="b-row">
                  <span>{t("evaluation.acceptance")}</span>
                  <strong className="text-danger">NOT_GRANTED</strong>
                </div>
              </div>

              <h4>{t("evaluation.output")}</h4>
              <pre className="raw-output-viewer">{activeResult.rawStdout || activeResult.rawStderr || t("evaluation.noOutput")}</pre>
            </div>
          ) : (
            <div className="pane-placeholder">
              <span>{t("evaluation.empty")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
