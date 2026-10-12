import { useState, useEffect } from "react";

export default function StagingView({ initialStagingId }) {
  const [stagingId, setStagingId] = useState(initialStagingId || "");
  const [manifest, setManifest] = useState(null);
  const [authToken, setAuthToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [applyResult, setApplyResult] = useState(null);
  const [rollbackBackupId, setRollbackBackupId] = useState("");
  const [rollbackResult, setRollbackResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialStagingId) {
      setStagingId(initialStagingId);
      loadManifest(initialStagingId);
    }
  }, [initialStagingId]);

  async function loadManifest(id) {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staging/manifest?stagingId=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تحميل مساحة Staging");
      setManifest(data.manifest);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!stagingId) return;
    setLoading(true);
    setError(null);
    setApplyResult(null);
    try {
      const res = await fetch("/api/governed-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stagingId,
          authorizationToken: authToken.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تطبيق التغييرات");
      setApplyResult(data.result);
      if (data.result.backupId) {
        setRollbackBackupId(data.result.backupId);
      }
      loadManifest(stagingId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRollback() {
    if (!rollbackBackupId) return;
    setLoading(true);
    setError(null);
    setRollbackResult(null);
    try {
      const res = await fetch("/api/governed-apply/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId: rollbackBackupId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل استعادة النسخة الاحتياطية");
      setRollbackResult(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="staging-studio-view">
      {/* Alert Header */}
      <div className="gov-alert-banner">
        <span className="alert-icon">🛡️</span>
        <div>
          <strong>ضابط التطبيق المحكوم (Governed Apply Principle):</strong> يُنفذ التغيير فقط في بيئة معزولة
          مع فحص شرط عدم تغير الملفات الأصلية (Precondition Check). يتطلب التطبيق تفويضاً صريحاً في لحظة التنفيذ
          مع حفظ نسخة احتياطية فورية لإتاحة الاستعادة (Rollback).
        </div>
      </div>

      <div className="staging-top-bar">
        <div className="form-group inline-group">
          <label>معرّف مساحة Staging:</label>
          <input
            type="text"
            className="input-text"
            placeholder="STAGE-…"
            value={stagingId}
            onChange={(e) => setStagingId(e.target.value)}
          />
          <button className="btn btn-secondary" onClick={() => loadManifest(stagingId)} disabled={loading}>
            جلب المساحة
          </button>
        </div>
      </div>

      {error && <div className="gov-error-msg">{error}</div>}

      {manifest ? (
        <div className="staging-manifest-card">
          <div className="staging-header">
            <div>
              <h3>مساحة Staging: {manifest.stagingId}</h3>
              <div className="manifest-sub">
                <span>المشروع المستهدف: <code>{manifest.targetProjectDir}</code></span>
                <span className="badge badge-warning">{manifest.status}</span>
              </div>
            </div>

            {/* Authorization & Apply controls */}
            {manifest.status !== "APPLIED" && (
              <div className="apply-control-box">
                <div className="auth-field">
                  <label>رمز التفويض الصريح (Authorization Token):</label>
                  <input
                    type="password"
                    className="input-text"
                    placeholder="AUTHORIZED_BY_PROJECT_OWNER"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                  />
                  <small>ملاحظة: الرمز التجريبي المعتمد هو: <code>AUTHORIZED_BY_PROJECT_OWNER</code></small>
                </div>
                <button
                  className="btn btn-danger"
                  onClick={handleApply}
                  disabled={loading || !authToken.trim()}
                >
                  {loading ? "جارٍ التحقق والتطبيق…" : "⚡ تطبيق التغييرات المحكومة (Authorized Apply)"}
                </button>
              </div>
            )}
          </div>

          {applyResult && (
            <div className="gov-success-banner">
              <strong>تم التطبيق بنجاح!</strong>
              <div>تم إنشاء نقطة استعادة احتياطية برقم: <code>{applyResult.backupId}</code></div>
              <div>الملفات المطبقة: {(applyResult.filesApplied || []).join(", ")}</div>
            </div>
          )}

          {/* Staged Diffs List */}
          <h4>الملفات المجهزة والفروقات المحددة (Staged Diffs):</h4>
          <div className="staged-files-list">
            {manifest.files.map((f) => (
              <div key={f.relPath} className="staged-diff-card">
                <div className="diff-card-header">
                  <span>📄 {f.relPath} ({f.action})</span>
                  <span>SHA البداية: <code>{f.preconditionSha256 ? f.preconditionSha256.slice(0, 10) : "جديد"}</code></span>
                </div>
                <pre className="unified-diff-view">{f.diff || "(لا توجد فروقات نصية)"}</pre>
              </div>
            ))}
          </div>

          {/* Rollback section */}
          <div className="rollback-section">
            <h4>🔄 استعادة النسخة الاحتياطية (Rollback Recovery):</h4>
            <div className="form-group inline-group">
              <input
                type="text"
                className="input-text"
                placeholder="معرّف النسخة الاحتياطية (BACKUP-…)"
                value={rollbackBackupId}
                onChange={(e) => setRollbackBackupId(e.target.value)}
              />
              <button
                className="btn btn-warning"
                onClick={handleRollback}
                disabled={loading || !rollbackBackupId.trim()}
              >
                استعادة الملفات السابقة
              </button>
            </div>
            {rollbackResult && (
              <div className="gov-success-banner">
                تمت الاستعادة بنجاح! الملفات المستعادة: {(rollbackResult.filesRestored || []).join(", ")}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="pane-placeholder">
          <span>👈 أدخل معرّف Staging أو قم بتجهيز تبني من تبويب «تبني المشاريع» لعرض الفروقات وتطبيق التغييرات.</span>
        </div>
      )}
    </div>
  );
}
