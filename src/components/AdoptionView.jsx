import { useState, useEffect } from "react";

export default function AdoptionView({ onGoToStaging }) {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [profile, setProfile] = useState("STANDARD");
  const [provider, setProvider] = useState("OPENAI");
  const [host, setHost] = useState("CODEX");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stagingMsg, setStagingMsg] = useState(null);
  const [error, setError] = useState(null);

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
      setError("فشل جلب المشاريع المرشحة للتبني");
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
      if (!res.ok) throw new Error(data.error || "فشل إعداد خطة التبني");
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
      if (!res.ok) throw new Error(data.error || "فشل إنشاء مساحة Staging");
      setStagingMsg(`تم تجهيز التبني بنجاح في مساحة Staging معزولة: ${data.manifest.stagingId}`);
      if (onGoToStaging) {
        onGoToStaging(data.manifest.stagingId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="adoption-studio-view">
      {/* Alert Header */}
      <div className="gov-alert-banner">
        <span className="alert-icon">🏗️</span>
        <div>
          <strong>ضابط التبني (Adoption Principle):</strong> يُدمج إطار الحوكمة AGHR دون كتابة صامتة فوق ملفات المشروع القائمة.
          تُحفظ توجيهات المالك السابقة ويُجهز التبني أولاً في Staging معزول للمراجعة الصريحة.
        </div>
      </div>

      <div className="adoption-grid">
        {/* Left Column: Candidate & Configuration */}
        <div className="adoption-config-col">
          <div className="pane-title">📂 المشاريع المرشحة للتبني (Candidate Projects)</div>

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
                    {c.governanceState === "ADOPTED_AGHR" ? "متبنّى سابقاً" : "غير متبنّى"}
                  </span>
                </div>
                <div className="cand-stack">
                  {(c.detectedStack || []).map((s) => (
                    <span key={s} className="stack-pill">
                      {s}
                    </span>
                  ))}
                  {c.hasAgentsMd && <span className="stack-pill pill-agents">AGENTS.md موجود</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="adoption-options-box">
            <div className="pane-title">⚙️ خيارات التبني والحزم التشغيلية</div>

            <div className="form-group">
              <label>مستوى الحوكمة (Governance Profile):</label>
              <select value={profile} onChange={(e) => setProfile(e.target.value)}>
                <option value="LITE">LITE (مستوى خفيف للمهام المحدودة والبيانات العامة)</option>
                <option value="STANDARD">STANDARD (المستوى القياسي لأعمال البرمجة - موصى به)</option>
                <option value="CONTROLLED">CONTROLLED (مستوى حرج محكوم مع متطلب مراجعة مستقلة)</option>
              </select>
            </div>

            <div className="form-group">
              <label>المزود الافتراضي (Default Provider):</label>
              <select value={provider} onChange={(e) => setProvider(e.target.value)}>
                <option value="OPENAI">OpenAI (GPT-4o / GPT-6 Astra) [الافتراضي]</option>
                <option value="ANTHROPIC">Anthropic (Claude 3.5 Sonnet)</option>
                <option value="GOOGLE">Google (Gemini 2.0 / 2.5 Pro)</option>
              </select>
            </div>

            <div className="form-group">
              <label>المضيف التشغيلي (Host Adapter):</label>
              <select value={host} onChange={(e) => setHost(e.target.value)}>
                <option value="CODEX">Codex CLI [الافتراضي]</option>
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
              {loading ? "جارٍ إعداد خطة التبني…" : "📝 إعداد خطة التبني وعرض الفروقات (Diff Preview)"}
            </button>

            {error && <div className="gov-error-msg">{error}</div>}
          </div>
        </div>

        {/* Right Column: Adoption Plan & Diff Preview */}
        <div className="adoption-preview-col">
          {plan ? (
            <div className="plan-details-box">
              <div className="plan-header">
                <div>
                  <h3>خطة التبني: {plan.projectName}</h3>
                  <div className="plan-tags">
                    <span className="badge badge-primary">{plan.profile}</span>
                    <span className="badge badge-info">{plan.provider}</span>
                    <span className="badge badge-success">{plan.host}</span>
                  </div>
                </div>
                <button className="btn btn-success" onClick={handleStagePlan} disabled={loading}>
                  🚀 تجهيز التبني في Staging للمراجعة
                </button>
              </div>

              {stagingMsg && <div className="gov-success-banner">{stagingMsg}</div>}

              <h4>الملفات المستهدفة والفروقات (Planned Files & Diffs):</h4>

              {plan.plannedFiles.map((pf) => (
                <div key={pf.path} className="planned-file-card">
                  <div className="pf-header">
                    <span>📄 <strong>{pf.path}</strong> ({pf.action})</span>
                  </div>
                  <pre className="diff-view-content">{pf.proposedContent}</pre>
                </div>
              ))}

              <h4>سجل التبني الحوكمي المشتق (PROJECT.json Record):</h4>
              <pre className="json-record-view">{JSON.stringify(plan.projectRecord, null, 2)}</pre>
            </div>
          ) : (
            <div className="pane-placeholder">
              <span>👈 اختر مشروعاً ثم اضغط «إعداد خطة التبني» لمعاينة الفروقات ومخرجات التبني قبل أي إجراء.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
