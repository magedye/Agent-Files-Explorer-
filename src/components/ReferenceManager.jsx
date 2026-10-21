import { useState, useEffect } from "react";
import { useI18n } from "../i18n/I18nProvider.jsx";

export default function ReferenceManager({ onSelectContract }) {
  const { t } = useI18n();
  const [packages, setPackages] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [summary, setSummary] = useState(null);
  const [rules, setRules] = useState([]);
  const [sources, setSources] = useState([]);
  const [adapters, setAdapters] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [search, setSearch] = useState("");
  const [forceFilter, setForceFilter] = useState("");
  const [activeTab, setActiveTab] = useState("rules"); // rules | sources | adapters | compare
  const [selectedRule, setSelectedRule] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load packages list once
  useEffect(() => {
    fetch("/api/governance/packages")
      .then((r) => r.json())
      .then((data) => {
        if (data.packages && data.packages.length > 0) {
          setPackages(data.packages);
          setSelectedPackageId((data.packages.find((pkg) => pkg.isDefault) || data.packages[0]).id);
        }
      })
      .catch((err) => console.error("Failed to load packages", err));
  }, []);

  // Load data whenever selectedPackageId changes
  useEffect(() => {
    if (!selectedPackageId) return;
    async function loadData() {
      setLoading(true);
      try {
        const pkgParam = `?packageId=${selectedPackageId}`;
        const [sumRes, rulesRes, srcRes, adaptRes] = await Promise.all([
          fetch(`/api/governance/summary${pkgParam}`).then((r) => r.json()),
          fetch(`/api/governance/rules${pkgParam}`).then((r) => r.json()),
          fetch(`/api/governance/sources${pkgParam}`).then((r) => r.json()),
          fetch(`/api/governance/adapters${pkgParam}`).then((r) => r.json()),
        ]);
        setSummary(sumRes);
        setRules(rulesRes.rules || []);
        setSources(srcRes.sources || []);
        setAdapters(adaptRes.adapters || []);
        setSelectedRule(null);
        setSelectedSource(null);
      } catch (err) {
        console.error("Failed to load governance data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedPackageId]);

  // Load comparison on demand
  useEffect(() => {
    if (activeTab === "compare" && !comparison) {
      fetch("/api/governance/compare?base=aghr")
        .then((r) => r.json())
        .then((d) => setComparison(d.comparison))
        .catch((e) => console.error("Failed to load comparison", e));
    }
  }, [activeTab, comparison]);

  const comparisonTargetVersion = comparison?.target?.version || packages.find((pkg) => pkg.isDefault)?.version || "…";

  const filteredRules = rules.filter((r) => {
    if (forceFilter && r.force !== forceFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const hay = `${r.id} ${r.title} ${r.text} ${r.applies_when}`.toLowerCase();
      return hay.includes(s);
    }
    return true;
  });

  const filteredSources = sources.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${s.id} ${s.title} ${s.publisher} ${s.supported_takeaway}`.toLowerCase().includes(q);
  });

  return (
    <div className="gov-ref-manager">
      {/* Package Selector Bar */}
      <div className="gov-package-bar" style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(30, 41, 59, 0.7)", padding: "10px 16px", borderRadius: "8px", marginBottom: "16px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <span style={{ fontSize: "14px", fontWeight: "600", color: "#94a3b8" }}>{t("reference.activePackage")}</span>
        <select
          aria-label={t("reference.activePackage")}
          value={selectedPackageId}
          onChange={(e) => setSelectedPackageId(e.target.value)}
          style={{ background: "#0f172a", color: "#f8fafc", padding: "6px 12px", borderRadius: "6px", border: "1px solid #334155", fontSize: "14px", cursor: "pointer" }}
        >
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name} ({pkg.version}) — {pkg.counts.rules} {t("common.rules")}
            </option>
          ))}
        </select>
        <span className="badge badge-info" style={{ marginInlineStart: "auto" }}>
          {summary?.reference_state || "LOCAL_VERIFIED"}
        </span>
      </div>

      {/* Summary Metrics Bar */}
      <div className="gov-summary-cards">
        <div className="metric-card">
          <div className="metric-val">{summary?.counts?.rules || 0}</div>
          <div className="metric-lbl">{t("reference.ruleMetric")}</div>
          <span className="badge badge-primary">{summary?.version || "…"}</span>
        </div>
        <div className="metric-card">
          <div className="metric-val">{summary?.counts?.sources || 0}</div>
          <div className="metric-lbl">{t("reference.sourceMetric")}</div>
          <span className="badge badge-success">OpenAI · Google · Anthropic</span>
        </div>
        <div className="metric-card">
          <div className="metric-val">{summary?.counts?.adapters || 0}</div>
          <div className="metric-lbl">{t("reference.adapterMetric")}</div>
          <span className="badge badge-info">Multi-Host & Provider</span>
        </div>
        <div className="metric-card">
          <div className="metric-val">{summary?.version || "…"}</div>
          <div className="metric-lbl">{t("reference.versionMetric")}</div>
          <span className="badge badge-warning">{summary?.packageId || "…"}</span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="gov-subtabs">
        <button
          className={"subtab" + (activeTab === "rules" ? " active" : "")}
          onClick={() => setActiveTab("rules")}
        >
          {t("reference.rulesTab", { count: rules.length })}
        </button>
        <button
          className={"subtab" + (activeTab === "sources" ? " active" : "")}
          onClick={() => setActiveTab("sources")}
        >
          {t("reference.sourcesTab", { count: sources.length })}
        </button>
        <button
          className={"subtab" + (activeTab === "adapters" ? " active" : "")}
          onClick={() => setActiveTab("adapters")}
        >
          {t("reference.adaptersTab", { count: adapters.length })}
        </button>
        <button
          className={"subtab" + (activeTab === "compare" ? " active" : "")}
          onClick={() => setActiveTab("compare")}
        >
          {t("reference.compareTab", { version: comparisonTargetVersion })}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="gov-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder={t("reference.search")}
          aria-label={t("reference.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {activeTab === "rules" && (
          <div className="filter-group">
            <label>{t("reference.force")}</label>
            <select aria-label={t("reference.force")} value={forceFilter} onChange={(e) => setForceFilter(e.target.value)}>
              <option value="">{t("reference.allForces")}</option>
              <option value="MUST">{t("reference.must")}</option>
              <option value="MUST_NOT">{t("reference.mustNot")}</option>
              <option value="SHOULD">{t("reference.should")}</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="gov-content-grid">
        {/* Left Column: List */}
        <div className="gov-list-col">
          {loading && <div className="loading-state">{t("reference.loading")}</div>}

          {/* RULES LIST */}
          {activeTab === "rules" && (
            <div className="rule-items-list">
              {filteredRules.map((r) => (
                <div
                  key={r.id}
                  className={"rule-card" + (selectedRule?.id === r.id ? " selected" : "")}
                  onClick={() => setSelectedRule(r)}
                >
                  <div className="rule-card-header">
                    <span className="rule-id">{r.id}</span>
                    <span className={`force-badge force-${r.force.toLowerCase()}`}>{r.force}</span>
                  </div>
                  <div className="rule-card-title" dir="auto">{r.title}</div>
                  <div className="rule-card-text" dir="auto">{r.text}</div>
                  <div className="rule-card-footer">
                    <span className="applies-when">📌 {r.applies_when}</span>
                    <span className="sources-count">🔗 {(r.basis || []).length} {t("common.sources")}</span>
                  </div>
                </div>
              ))}
              {filteredRules.length === 0 && !loading && (
                <div className="empty-state">{t("reference.noMatches")}</div>
              )}
            </div>
          )}

          {/* SOURCES LIST */}
          {activeTab === "sources" && (
            <div className="source-items-list">
              {filteredSources.map((s) => (
                <div
                  key={s.id}
                  className={"source-card" + (selectedSource?.id === s.id ? " selected" : "")}
                  onClick={() => setSelectedSource(s)}
                >
                  <div className="source-card-header">
                    <span className="source-id">{s.id}</span>
                    <span className="badge badge-publisher">{s.publisher}</span>
                    <span className="badge badge-kind">{s.kind}</span>
                  </div>
                  <div className="source-card-title">{s.title}</div>
                  <div className="source-card-takeaway" dir="auto">{s.supported_takeaway}</div>
                  <div className="source-card-footer">
                    <a href={s.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                      {t("reference.officialSource")}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ADAPTERS LIST */}
          {activeTab === "adapters" && (
            <div className="adapter-items-list">
              {adapters.map((a) => (
                <div key={a.id} className="adapter-card">
                  <div className="adapter-card-header">
                    <span className="adapter-id">{a.id}</span>
                    <span className="badge badge-axis">{a.axis}</span>
                    <span className="badge badge-qual">{a.live_qualification}</span>
                  </div>
                  <div className="adapter-card-title">{a.name}</div>
                  <div className="adapter-card-body">
                    <div>{t("common.path")} <code>{a.path}</code></div>
                    <div>{t("reference.basisRefs")} {(a.source_ids || []).join(", ")}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VERSION COMPARISON VIEW */}
          {activeTab === "compare" && (
            <div className="compare-items-list" style={{ padding: "12px", background: "rgba(15, 23, 42, 0.6)", borderRadius: "8px" }}>
              {!comparison ? (
                <div className="loading-state">{t("reference.comparing", { version: comparisonTargetVersion })}</div>
              ) : (
                <div>
                  <div style={{ background: "rgba(30, 41, 59, 0.8)", padding: "12px", borderRadius: "6px", marginBottom: "12px", borderInlineStart: "4px solid #3b82f6" }}>
                    <h4 style={{ margin: "0 0 6px 0", color: "#60a5fa" }}>{t("reference.comparisonHeading", { base: comparison.base.version, target: comparison.target.version })}</h4>
                    <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>{comparison.impactNotice}</p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                    <div style={{ background: "#0f172a", padding: "10px", borderRadius: "6px", border: "1px solid #334155" }}>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{t("reference.base")}</div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#f8fafc" }}>AGHR {comparison.base.version}</div>
                      <div style={{ fontSize: "13px", color: "#94a3b8" }}>{t("reference.counts", { rules: comparison.base.ruleCount, sources: comparison.base.sourceCount })}</div>
                    </div>
                    <div style={{ background: "#0f172a", padding: "10px", borderRadius: "6px", border: "1px solid #334155" }}>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{t("reference.target")}</div>
                      <div style={{ fontSize: "16px", fontWeight: "bold", color: "#10b981" }}>AGHR {comparison.target.version}</div>
                      <div style={{ fontSize: "13px", color: "#94a3b8" }}>{t("reference.counts", { rules: comparison.target.ruleCount, sources: comparison.target.sourceCount })}</div>
                    </div>
                  </div>

                  <h5 style={{ margin: "10px 0 6px 0", color: "#f1f5f9" }}>
                    {t("reference.addedRules", { version: comparison.target.version, count: comparison.rulesDelta.addedCount })}
                  </h5>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "250px", overflowY: "auto" }}>
                    {comparison.rulesDelta.added.map((r) => (
                      <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "8px 12px", borderRadius: "6px" }}>
                        <div>
                          <strong style={{ color: "#34d399", marginInlineEnd: "8px" }}>{r.id}</strong>
                          <span style={{ color: "#e2e8f0", fontSize: "13px" }}>{r.title}</span>
                        </div>
                        <span className={`force-badge force-${r.force.toLowerCase()}`}>{r.force}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Inspector Details */}
        <div className="gov-detail-col">
          {activeTab === "rules" && selectedRule ? (
            <div className="inspector-panel">
              <div className="inspector-header">
                <h3>{selectedRule.id}: {selectedRule.title}</h3>
                <span className={`force-badge force-${selectedRule.force.toLowerCase()}`}>
                  {selectedRule.force}
                </span>
              </div>
              <div className="inspector-section">
                <h4>{t("reference.governingText")}</h4>
                <div className="inspector-quote" dir="auto">{selectedRule.text}</div>
              </div>
              <div className="inspector-section">
                <h4>{t("reference.applicability")}</h4>
                <div>{selectedRule.applies_when}</div>
              </div>
              <div className="inspector-section">
                <h4>{t("reference.explanation")}</h4>
                <code>{selectedRule.explanation_ref}</code>
              </div>
              <div className="inspector-section">
                <h4>{t("reference.basisSources")}</h4>
                <div className="basis-chips">
                  {(selectedRule.basis || []).map((bid) => (
                    <span key={bid} className="basis-chip">
                      {bid}
                    </span>
                  ))}
                </div>
              </div>
              <div className="inspector-section">
                <h4>{t("reference.enforcement")}</h4>
                <div className="enforcement-info">
                  <div><strong>{t("reference.class")}</strong> {selectedRule.enforcement_class}</div>
                  <div><strong>{t("reference.verification")}</strong> {selectedRule.verification}</div>
                </div>
              </div>
            </div>
          ) : activeTab === "sources" && selectedSource ? (
            <div className="inspector-panel">
              <div className="inspector-header">
                <h3>{selectedSource.id}: {selectedSource.title}</h3>
                <span className="badge badge-publisher">{selectedSource.publisher}</span>
              </div>
              <div className="inspector-section">
                <h4>{t("reference.takeaway")}</h4>
                <div className="inspector-quote" dir="auto">{selectedSource.supported_takeaway}</div>
              </div>
              <div className="inspector-section">
                <h4>{t("reference.locator")}</h4>
                <div>{selectedSource.locator}</div>
              </div>
              <div className="inspector-section">
                <h4>{t("reference.versionScope")}</h4>
                <div>{selectedSource.version_scope}</div>
              </div>
              <div className="inspector-section">
                <h4>{t("reference.officialLink")}</h4>
                <a href={selectedSource.url} target="_blank" rel="noreferrer">
                  {selectedSource.url} ↗
                </a>
              </div>
            </div>
          ) : (
            <div className="inspector-empty">
              <span>{t("reference.select")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
