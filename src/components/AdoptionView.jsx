import { useState, useEffect } from "react";
import { useI18n } from "../i18n/I18nProvider.jsx";

export default function AdoptionView({ onGoToStaging }) {
  const { t } = useI18n();
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [profile, setProfile] = useState("STANDARD");
  const [provider, setProvider] = useState("OPENAI");
  const [host, setHost] = useState("CODEX");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stagingMsg, setStagingMsg] = useState(null);
  const [error, setError] = useState(null);

  // Host-artifact compatibility (preview only — never writes)
  const [compatTools, setCompatTools] = useState([]);
  const [compatKinds, setCompatKinds] = useState({});
  const [detection, setDetection] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [compatError, setCompatError] = useState(null);

  useEffect(() => {
    loadCandidates();
  }, []);

  async function loadCandidates() {
    try {
      const res = await fetch("/api/adoption/candidates");
      const data = await res.json();
      setCandidates(data.candidates || []);
      if (data.candidates && data.candidates.length > 0) {
        setSelectedCandidate(data.candidates[0]);
      }
    } catch (err) {
      setError("error.candidates");
    }
  }

  async function handlePreparePlan() {
    if (!selectedCandidate) return;
    setLoading(true);
    setError(null);
    setStagingMsg(null);
    try {
      const res = await fetch("/api/adoption/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectDir: selectedCandidate.dir,
          profile,
          provider,
          host,
          owner: "Project Owner",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "error.adoption");
      setPlan(data.plan);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStagePlan() {
    if (!plan) return;
    setLoading(true);
    try {
      const res = await fetch("/api/staging/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packetId: `ADOPT-${plan.projectName.toUpperCase()}`,
          targetProjectDir: plan.projectDir,
          plannedFiles: plan.plannedFiles,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "error.stage");
      setStagingMsg(data.manifest.stagingId);
      if (onGoToStaging) {
        onGoToStaging(data.manifest.stagingId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Load the host-compat contract once.
  useEffect(() => {
    fetch("/api/host-compat/tools")
      .then((r) => r.json())
      .then((d) => {
        setCompatTools(d.compatibility?.tools || []);
        setCompatKinds(d.compatibility?.artifactKinds || {});
      })
      .catch(() => setCompatError("hostcompat.loadError"));
  }, []);

  // Read-only tool detection for the selected project (never scans user folders).
  useEffect(() => {
    if (!selectedCandidate?.dir) {
      setDetection(null);
      return;
    }
    fetch("/api/host-compat/detect?project=" + encodeURIComponent(selectedCandidate.dir))
      .then((r) => r.json())
      .then((d) => setDetection(d.detection || null))
      .catch(() => setDetection(null));
  }, [selectedCandidate]);

  async function handlePreview(toolId, artifactKind) {
    if (!selectedCandidate?.dir) return;
    setPreviewLoading(true);
    setCompatError(null);
    try {
      const qs = new URLSearchParams({ tool: toolId, artifactKind, project: selectedCandidate.dir, source: "sample" });
      const r = await fetch("/api/host-compat/preview?" + qs.toString());
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "hostcompat.previewError");
      setPreview(d.preview);
    } catch (err) {
      setCompatError(err.message);
    } finally {
      setPreviewLoading(false);
    }
  }

  const statusClass = (s) =>
    "badge " + (s === "SUPPORTED" ? "badge-success" : s === "PARTIAL" ? "badge-warning" : s === "UNSUPPORTED" ? "badge-danger" : "badge-kind");

  return (
    <div className="adoption-studio-view">
      {/* Alert Header */}
      <div className="gov-alert-banner">
        <span className="alert-icon">🏗️</span>
        <div>
          <strong>{t("adoption.principleTitle")}</strong> {t("adoption.principle")}
        </div>
      </div>

      <div className="adoption-grid">
        {/* Left Column: Candidate & Configuration */}
        <div className="adoption-config-col">
          <div className="pane-title">{t("adoption.candidates")}</div>

          <div className="candidates-list">
            {candidates.map((c) => (
              <div
                key={c.id}
                className={"candidate-card" + (selectedCandidate?.id === c.id ? " active" : "")}
                onClick={() => {
                  setSelectedCandidate(c);
                  setPlan(null);
                }}
              >
                <div className="cand-top">
                  <span className="cand-name">{c.name}</span>
                  <span className={`cand-status status-${c.governanceState.toLowerCase()}`}>
                    {c.governanceState === "ADOPTED_AGHR" ? t("adoption.adopted") : t("adoption.notAdopted")}
                  </span>
                </div>
                <div className="cand-stack">
                  {(c.detectedStack || []).map((s) => (
                    <span key={s} className="stack-pill">
                      {s}
                    </span>
                  ))}
                  {c.hasAgentsMd && <span className="stack-pill pill-agents">{t("adoption.hasAgents")}</span>}
                </div>
              </div>
            ))}
            {candidates.length === 0 && <div className="cand-empty">{t("adoption.empty")}</div>}
          </div>

          {selectedCandidate && (
          <div className="adoption-options-box">
            <div className="pane-title">{t("adoption.options")}</div>

            <div className="form-group">
              <label>{t("adoption.profile")}</label>
              <select aria-label={t("adoption.profile")} value={profile} onChange={(e) => setProfile(e.target.value)}>
                <option value="LITE">{t("adoption.lite")}</option>
                <option value="STANDARD">{t("adoption.standard")}</option>
                <option value="CONTROLLED">{t("adoption.controlled")}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t("adoption.provider")}</label>
              <select aria-label={t("adoption.provider")} value={provider} onChange={(e) => setProvider(e.target.value)}>
                <option value="OPENAI">{t("adoption.openai")}</option>
                <option value="ANTHROPIC">Anthropic (Claude 3.5 Sonnet)</option>
                <option value="GOOGLE">Google (Gemini 2.0 / 2.5 Pro)</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t("adoption.host")}</label>
              <select aria-label={t("adoption.host")} value={host} onChange={(e) => setHost(e.target.value)}>
                <option value="CODEX">{t("adoption.codex")}</option>
                <option value="CLAUDE_CODE">Claude Code</option>
                <option value="GEMINI_CLI">Gemini CLI</option>
                <option value="GITHUB_COPILOT">GitHub Copilot</option>
              </select>
            </div>

            <button
              className="btn btn-primary btn-block"
              onClick={handlePreparePlan}
              disabled={loading || !selectedCandidate}
            >
              {loading ? t("adoption.preparing") : t("adoption.prepare")}
            </button>

            {error && <div className="gov-error-msg">{t(error)}</div>}
          </div>
          )}
        </div>

        {/* Right Column: Adoption Plan & Diff Preview */}
        <div className="adoption-preview-col">
          {plan ? (
            <div className="plan-details-box">
              <div className="plan-header">
                <div>
                  <h3>{t("adoption.plan")} {plan.projectName}</h3>
                  <div className="plan-tags">
                    <span className="badge badge-primary">{plan.profile}</span>
                    <span className="badge badge-info">{plan.provider}</span>
                    <span className="badge badge-success">{plan.host}</span>
                  </div>
                </div>
                <button className="btn btn-success" onClick={handleStagePlan} disabled={loading}>
                  {t("adoption.stage")}
                </button>
              </div>

              {stagingMsg && <div className="gov-success-banner">{t("adoption.staged", { id: stagingMsg })}</div>}

              <h4>{t("adoption.files")}</h4>

              {plan.plannedFiles.map((pf) => (
                <div key={pf.path} className="planned-file-card">
                  <div className="pf-header">
                    <span>📄 <strong>{pf.path}</strong> ({pf.action})</span>
                  </div>
                  <pre className="diff-view-content">{pf.proposedContent}</pre>
                </div>
              ))}

              <h4>{t("adoption.record")}</h4>
              <pre className="json-record-view">{JSON.stringify(plan.projectRecord, null, 2)}</pre>
            </div>
          ) : (
            <div className="pane-placeholder">
              <span>{t("adoption.empty")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Host-artifact compatibility — preview only, no writes */}
      <section className="hostcompat-panel card">
        <div className="hostcompat-head">
          <div>
            <h2>{t("hostcompat.title")}</h2>
            <p className="hostcompat-sub">{t("hostcompat.subtitle")}</p>
          </div>
          <span className="badge badge-warning">{t("hostcompat.previewOnlyBadge")}</span>
        </div>

        {compatError && <div className="gov-error-msg">{t(compatError)}</div>}

        <div className="hostcompat-grid">
          {compatTools.map((tool) => {
            const det = detection?.tools?.find((x) => x.toolId === tool.toolId);
            return (
              <div key={tool.toolId} className="hostcompat-tool">
                <div className="hostcompat-tool-head">
                  <strong>{tool.label}</strong>
                  <div className="badge-group">
                    <span className="badge badge-kind">{tool.format}</span>
                    <span className="badge badge-kind">{tool.trust}</span>
                  </div>
                </div>
                <div className="hostcompat-meta">
                  <span>{t("hostcompat.scope")}: {tool.scope.join(", ")}</span>
                  <span>{t("hostcompat.detection")}: {det?.detected ? t("hostcompat.detected") : t("hostcompat.notDetected")}</span>
                  <span>{t("hostcompat.version")}: {tool.hostVersionRange}</span>
                </div>
                <div className="hostcompat-kinds">
                  {Object.entries(tool.artifactKinds).map(([kind, status]) => (
                    <div key={kind} className="hostcompat-kind-row">
                      <span>{t(`hostcompat.kind.${kind}`)}</span>
                      <span className={statusClass(status)}>{status}</span>
                    </div>
                  ))}
                </div>
                <div className="hostcompat-actions">
                  {Object.entries(tool.artifactKinds)
                    .filter(([, status]) => status === "SUPPORTED" || status === "PARTIAL")
                    .map(([kind]) => (
                      <button
                        key={kind}
                        className="btn btn-secondary btn-sm"
                        disabled={!selectedCandidate || previewLoading}
                        onClick={() => handlePreview(tool.toolId, kind)}
                      >
                        {t("hostcompat.preview")} · {t(`hostcompat.kind.${kind}`)}
                      </button>
                    ))}
                  {!selectedCandidate && <span className="hostcompat-hint">{t("hostcompat.noProject")}</span>}
                </div>
                {tool.unsupported && Object.keys(tool.unsupported).length > 0 && (
                  <details className="hostcompat-unsupported">
                    <summary>{t("hostcompat.unsupportedTitle")}</summary>
                    <ul>
                      {Object.entries(tool.unsupported).map(([kind, reason]) => (
                        <li key={kind}><strong>{t(`hostcompat.kind.${kind}`)}</strong>: {reason}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            );
          })}
        </div>

        {preview && (
          <div className="hostcompat-preview">
            <div className="hostcompat-preview-head">
              <strong>{preview.tool.label} · {t(`hostcompat.kind.${preview.artifactKind}`)}</strong>
              <span className={statusClass(preview.compatibility)}>{preview.compatibility}</span>
            </div>
            {preview.compatibilityReason && <div className="alert alert-warning">{preview.compatibilityReason}</div>}
            <div className="hostcompat-preview-grid">
              <div><span className="meta-lbl">{t("hostcompat.destination")}</span><code dir="ltr">{preview.destination}</code></div>
              <div><span className="meta-lbl">{t("hostcompat.scope")}</span><span>{preview.tool.scope.join(", ")}</span></div>
              <div><span className="meta-lbl">{t("hostcompat.trust")}</span><span>{preview.tool.trust}</span></div>
              <div><span className="meta-lbl">{t("hostcompat.bytes")}</span><span>{preview.bytes}</span></div>
              <div><span className="meta-lbl">{t("hostcompat.sha")}</span><code dir="ltr">{preview.sha256.slice(0, 20)}…</code></div>
              <div><span className="meta-lbl">{t("hostcompat.renderer")}</span><code dir="ltr">{preview.renderer.id}</code></div>
              <div><span className="meta-lbl">{t("hostcompat.action")}</span><span>{preview.destinationAction}</span></div>
              <div><span className="meta-lbl">{t("hostcompat.spec")}</span><span>{preview.tool.spec.version}</span></div>
            </div>
            {preview.droppedFields?.length > 0 && (
              <div className="alert alert-warning">
                {t("hostcompat.dropped")}: {preview.droppedFields.join(", ")}
              </div>
            )}
            <div className="hostcompat-note">
              <strong>{t("hostcompat.previewOnly")}</strong> {t("hostcompat.applyUnavailable")}
            </div>
            <pre className="unified-diff-view" dir="ltr">{preview.diff}</pre>
          </div>
        )}
      </section>
    </div>
  );
}
