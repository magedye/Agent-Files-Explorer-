import { useState, useEffect } from "react";

export default function EvaluationView() {
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
      if (!res.ok) throw new Error(data.error || "فشل تنفيذ حزمة الاختبارات");
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
      if (!res.ok) throw new Error(data.error || "فشل فحص الحزمة");
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
          <strong>ضابط الأدلة والأمانة (Honest Evaluation Principle):</strong> لا تقبل المنصة أي نجاح ذاتي غير مثبت
          بالأدلة الحقيقية. نتائج الاختبارات المحلية مقيدة بنطاقها الفعلي، ولا تمنح اعتماد الإصدار (Release Acceptance)
          أو مراجعة مستقلة، كما لا تعوض عن الاختبارات الحية للمضيف.
        </div>
      </div>

      {/* Control Actions Bar */}
      <div className="eval-actions-bar">
        <button className="btn btn-primary" onClick={handleRunSuite} disabled={running}>
          {running ? "جارٍ تشغيل الاختبارات…" : "🧪 تشغيل اختبارات الوحدة الحوكمية (127 Tests)"}
        </button>
        <button className="btn btn-secondary" onClick={handleCheckPackage} disabled={running}>
          {running ? "جارٍ فحص الحزمة…" : "🔍 فحص تكامل الحزمة (check_package.py)"}
        </button>
      </div>

      {error && <div className="gov-error-msg">{error}</div>}

      <div className="eval-grid">
        {/* Left Column: History */}
        <div className="eval-history-col">
          <div className="pane-title">📜 سجلات الفحص والتحقق السابقة</div>
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
                <div className="h-time">{new Date(h.executed_at).toLocaleString("ar")}</div>
              </div>
            ))}
            {history.length === 0 && <div className="empty-state">لم يُسجل أي فحص بعد.</div>}
          </div>
        </div>

        {/* Right Column: Evidence Inspector */}
        <div className="eval-evidence-col">
          {activeResult ? (
            <div className="evidence-panel">
              <div className="evidence-header">
                <div>
                  <h3>تقرير التحقق: {activeResult.runId}</h3>
                  <div className="evidence-meta">
                    <span>الجناح: {activeResult.suite}</span>
                    <span>كود الخروج: {activeResult.exitCode}</span>
                  </div>
                </div>
                <div className={`eval-status-stamp status-${(activeResult.status || "FAIL").toLowerCase()}`}>
                  {activeResult.status}
                </div>
              </div>

              {/* Boundaries & Disclaimers */}
              <div className="evidence-boundaries-box">
                <div className="b-row">
                  <span>حدود النطاق:</span>
                  <strong>LOCAL_REFERENCE_TOOLS_ONLY</strong>
                </div>
                <div className="b-row">
                  <span>تقييم النموذج الحي (Live Model):</span>
                  <strong className="text-muted">NOT_RUN</strong>
                </div>
                <div className="b-row">
                  <span>تأهيل المضيف الأصلي (Native Host):</span>
                  <strong className="text-muted">NOT_RUN</strong>
                </div>
                <div className="b-row">
                  <span>المراجعة المستقلة (Independent Review):</span>
                  <strong className="text-muted">NOT_PERFORMED</strong>
                </div>
                <div className="b-row">
                  <span>قبول الإصدار (Release Acceptance):</span>
                  <strong className="text-danger">NOT_GRANTED</strong>
                </div>
              </div>

              <h4>الأدلة الخام والمخرجات النصية (Raw Output):</h4>
              <pre className="raw-output-viewer">{activeResult.rawStdout || activeResult.rawStderr || "لا توجد مخرجات نصية."}</pre>
            </div>
          ) : (
            <div className="pane-placeholder">
              <span>👈 اضغط على أحد أزرار الفحص لتنفيذ الاختبارات وجمع الأدلة المحكومة.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
