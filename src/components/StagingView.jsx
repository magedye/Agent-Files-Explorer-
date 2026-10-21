import { useState, useEffect } from "react";
import { useI18n } from "../i18n/I18nProvider.jsx";

export default function StagingView({ initialStagingId }) {
  const { t } = useI18n();
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
      if (!res.ok) throw new Error(data.error || "error.manifest");
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
      if (!res.ok) throw new Error(data.error || "error.apply");
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
      if (!res.ok) throw new Error(data.error || "error.rollback");
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
          <strong>{t("staging.principleTitle")}</strong> {t("staging.principle")}
        </div>
      </div>

      <div className="staging-top-bar">
        <div className="form-group inline-group">
          <label>{t("staging.id")}</label>
          <input
            type="text"
            className="input-text"
            placeholder="STAGE-…"
            aria-label={t("staging.id")}
            value={stagingId}
            onChange={(e) => setStagingId(e.target.value)}
          />
          <button className="btn btn-secondary" onClick={() => loadManifest(stagingId)} disabled={loading}>
            {t("staging.load")}
          </button>
        </div>
      </div>

      {error && <div className="gov-error-msg">{t(error)}</div>}

      {manifest ? (
        <div className="staging-manifest-card">
          <div className="staging-header">
            <div>
              <h3>{t("staging.workspace")} {manifest.stagingId}</h3>
              <div className="manifest-sub">
                <span>{t("staging.target")} <code>{manifest.targetProjectDir}</code></span>
                <span className="badge badge-warning">{manifest.status}</span>
              </div>
            </div>

            {/* Authorization & Apply controls */}
            {manifest.status !== "APPLIED" && (
              <div className="apply-control-box">
                <div className="auth-field">
                  <label>{t("staging.authorization")}</label>
                  <input
                    type="password"
                    aria-label={t("staging.authorization")}
                    className="input-text"
                    placeholder="AUTHORIZED_BY_PROJECT_OWNER"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                  />
                  <small>{t("staging.demoToken")} <code>AUTHORIZED_BY_PROJECT_OWNER</code></small>
                </div>
                <button
                  className="btn btn-danger"
                  onClick={handleApply}
                  disabled={loading || !authToken.trim()}
                >
                  {loading ? t("staging.applying") : t("staging.apply")}
                </button>
              </div>
            )}
          </div>

          {applyResult && (
            <div className="gov-success-banner">
              <strong>{t("staging.applied")}</strong>
              <div>{t("staging.backup")} <code>{applyResult.backupId}</code></div>
              <div>{t("staging.appliedFiles")} {(applyResult.filesApplied || []).join(", ")}</div>
            </div>
          )}

          {/* Staged Diffs List */}
          <h4>{t("staging.diffs")}</h4>
          <div className="staged-files-list">
            {manifest.files.map((f) => (
              <div key={f.relPath} className="staged-diff-card">
                <div className="diff-card-header">
                  <span>📄 {f.relPath} ({f.action})</span>
                  <span>{t("staging.sha")} <code>{f.preconditionSha256 ? f.preconditionSha256.slice(0, 10) : t("staging.new")}</code></span>
                </div>
                <pre className="unified-diff-view">{f.diff || t("staging.noDiff")}</pre>
              </div>
            ))}
          </div>

          {/* Rollback section */}
          <div className="rollback-section">
            <h4>{t("staging.rollback")}</h4>
            <div className="form-group inline-group">
              <input
                type="text"
                className="input-text"
                placeholder={t("staging.backupId")}
                aria-label={t("staging.backupId")}
                value={rollbackBackupId}
                onChange={(e) => setRollbackBackupId(e.target.value)}
              />
              <button
                className="btn btn-warning"
                onClick={handleRollback}
                disabled={loading || !rollbackBackupId.trim()}
              >
                {t("staging.restore")}
              </button>
            </div>
            {rollbackResult && (
              <div className="gov-success-banner">
                {t("staging.restored")} {(rollbackResult.filesRestored || []).join(", ")}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="pane-placeholder">
          <span>{t("staging.empty")}</span>
        </div>
      )}
    </div>
  );
}
