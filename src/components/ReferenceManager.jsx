import { useState, useEffect } from "react";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { fetchAapesMatrix } from "../api.js";

const AAPES_DOMAINS = [
  { id: "D01", name: "Requirements Engineering" },
  { id: "D02", name: "Formal Semantics and Invariants" },
  { id: "D03", name: "Instruction Authority and Conflict" },
  { id: "D04", name: "Context Engineering and Few-Shot" },
  { id: "D05", name: "Trust and Memory Boundaries" },
  { id: "D06", name: "Agent Authority and Delegation" },
  { id: "D07", name: "Tool Boundary Enforcement" },
  { id: "D08", name: "Workflow and Recovery Governance" },
  { id: "D09", name: "Evidence Provenance and Audit" },
  { id: "D10", name: "Evaluation and Calibration" },
  { id: "D11", name: "Adversarial Testing and Resilience" },
  { id: "D12", name: "Lifecycle and Change Governance" },
];

const forceClass = (force) => "force-badge force-" + String(force || "").toLowerCase().replace(/\s+/g, "_");

export default function ReferenceManager() {
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
  const [domainFilter, setDomainFilter] = useState("");
  const [activeTab, setActiveTab] = useState("rules");
  const [selectedRule, setSelectedRule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [matrixData, setMatrixData] = useState([]);
  const [matrixSearch, setMatrixSearch] = useState("");

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
        setDomainFilter("");
      } catch (err) {
        console.error("Failed to load governance data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedPackageId]);

  useEffect(() => {
    if (activeTab === "compare" && !comparison) {
      fetch("/api/governance/compare?base=aghr")
        .then((r) => r.json())
        .then((d) => setComparison(d.comparison))
        .catch((e) => console.error("Failed to load comparison", e));
    }
  }, [activeTab, comparison]);

  const handleOpenMatrix = async () => {
    try {
      const res = await fetchAapesMatrix();
      setMatrixData(res.matrix || []);
      setShowMatrixModal(true);
    } catch (e) {
      console.error("Failed to load matrix", e);
    }
  };

  const comparisonTargetVersion = comparison?.target?.version || packages.find((pkg) => pkg.isDefault)?.version || "…";
  const isAapes = selectedPackageId === "aapes_v2_1";

  const matrixFiltered = matrixData.filter((r) => {
    if (!matrixSearch) return true;
    const q = matrixSearch.toLowerCase();
    return `${r.requirement_id} ${r.domain} ${r.title} ${r.aghr_ref || ""} ${r.evidence || ""}`.toLowerCase().includes(q);
  });
  const matrixCovered = matrixData.filter((r) => r.coverage_status === "COVERED").length;
  const matrixPartial = matrixData.length - matrixCovered;

  const filteredRules = rules.filter((r) => {
    if (forceFilter && r.force !== forceFilter) return false;
    if (domainFilter && r.domain !== domainFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const hay = `${r.id} ${r.name || ""} ${r.title || ""} ${r.text || ""} ${r.applies_when || ""}`.toLowerCase();
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
      <div className="gov-package-bar">
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span>{t("reference.activePackage")}</span>
          <select
            className="input"
            style={{ width: "auto", minWidth: 240 }}
            aria-label={t("reference.activePackage")}
            value={selectedPackageId}
            onChange={(e) => setSelectedPackageId(e.target.value)}
          >
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name} ({pkg.version}) {pkg.isDefault ? `— ${t("reference.default")}` : ""} {pkg.id === "aapes_v2_1" ? "— AAPES" : ""}
              </option>
            ))}
          </select>
          {isAapes && <span className="badge badge-warning">{t("aapes.candidateNotice")}</span>}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleOpenMatrix}>
          {t("aapes.matrixBtn")}
        </button>
      </div>

      {summary && (
        <div className="gov-summary-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h2>
                {summary.package}{" "}
                <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 500 }}>v{summary.version}</span>
              </h2>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                {t("reference.counts", { rules: summary.counts?.rules || 0, sources: summary.counts?.sources || 0 })}
                {summary.counts?.adapters > 0 && ` · ${summary.counts.adapters} ${t("reference.adapters")}`}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span className={"gov-status-pill " + (summary.reference_state === "AUTHORITATIVE_BASELINE" || summary.reference_state === "OFFICIAL_LOCAL_REFERENCE" ? "status-stable" : "status-scoped")}>
                {summary.reference_state}
              </span>
              <span className="gov-status-pill status-gray">{summary.default_provider || "AGHR Engine"}</span>
            </div>
          </div>
        </div>
      )}

      <div className="gov-nav-tabs" role="tablist">
        <button className={"gov-tab-btn " + (activeTab === "rules" ? "active" : "")} role="tab" aria-selected={activeTab === "rules"} onClick={() => setActiveTab("rules")}>
          {t("reference.rulesTab", { count: rules.length })}
        </button>
        <button className={"gov-tab-btn " + (activeTab === "sources" ? "active" : "")} role="tab" aria-selected={activeTab === "sources"} onClick={() => setActiveTab("sources")}>
          {t("reference.sourcesTab", { count: sources.length })}
        </button>
        <button className={"gov-tab-btn " + (activeTab === "adapters" ? "active" : "")} role="tab" aria-selected={activeTab === "adapters"} onClick={() => setActiveTab("adapters")}>
          {t("reference.adaptersTab", { count: adapters.length })}
        </button>
        <button className={"gov-tab-btn " + (activeTab === "compare" ? "active" : "")} role="tab" aria-selected={activeTab === "compare"} onClick={() => setActiveTab("compare")}>
          {t("reference.compareTab", { version: comparisonTargetVersion })}
        </button>
      </div>

      {activeTab === "rules" && (
        <div className="gov-toolbar">
          <input
            type="text"
            dir="auto"
            className="search-input"
            placeholder={t("reference.searchRules")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={forceFilter} onChange={(e) => setForceFilter(e.target.value)} aria-label={t("reference.force")}>
            <option value="">{t("reference.allForces")}</option>
            <option value="MUST">MUST</option>
            <option value="MUST_NOT">MUST_NOT</option>
            <option value="SHOULD">SHOULD</option>
            <option value="MAY">MAY</option>
          </select>
          {isAapes && (
            <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)} aria-label={t("aapes.filterDomain")}>
              <option value="">{t("aapes.allDomains")}</option>
              {AAPES_DOMAINS.map((dom) => (
                <option key={dom.id} value={dom.id}>{dom.id}: {dom.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {activeTab === "rules" && (
        <div className={"gov-content-grid " + (selectedRule ? "" : "single")}>
          <div className="gov-list-col">
            {loading && <div className="skeleton" style={{ height: 80 }} />}
            {!loading && filteredRules.map((r) => (
              <div key={r.id} className={"rule-card" + (selectedRule?.id === r.id ? " selected" : "")} onClick={() => setSelectedRule(r)} tabIndex={0} role="button"
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedRule(r); } }}>
                <div className="rule-card-header">
                  <span className="rule-id">{r.id}</span>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {r.domain && <span className="badge badge-kind">{r.domain}</span>}
                    {r.priority && <span className={"badge " + (r.priority === "P0" ? "badge-warning" : "badge-info")}>{r.priority}</span>}
                    <span className={forceClass(r.force)}>{r.force}</span>
                  </div>
                </div>
                <div className="rule-card-title">{r.name || r.title}</div>
                <div className="rule-card-text">{r.text}</div>
              </div>
            ))}
            {!loading && filteredRules.length === 0 && (
              <div className="state-empty"><span className="state-icon">🔎</span>{t("reference.noMatches")}</div>
            )}
          </div>

          {selectedRule && (
            <div className="inspector-panel gov-detail-col">
              <div className="inspector-header">
                <div>
                  <h3>{selectedRule.id}</h3>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{selectedRule.name || selectedRule.title}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedRule(null)} aria-label="Close">✕</button>
              </div>

              <div className="inspector-section">
                <h4>{t("reference.ruleStatement")}</h4>
                <div className="inspector-quote">{selectedRule.text}</div>
              </div>

              {selectedRule.acceptance_test && (
                <div className="inspector-section">
                  <h4>Acceptance Test / Criteria</h4>
                  <div className="inspector-quote" style={{ borderInlineStartColor: "var(--success)" }}>{selectedRule.acceptance_test}</div>
                </div>
              )}

              {selectedRule.basis && selectedRule.basis.length > 0 && (
                <div className="inspector-section">
                  <h4>{t("reference.basisSources")}</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                    {selectedRule.basis.map((b, idx) => (
                      <div key={idx} style={{ fontSize: 12, background: "var(--surface-2)", padding: "6px 10px", borderRadius: 6, color: "var(--text-secondary)" }}>
                        <strong>{b.id}:</strong> {b.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRule.enforcementClass && (
                <div className="inspector-section">
                  <h4>{t("reference.enforcementCoverage")}</h4>
                  <div style={{ marginTop: 6, fontSize: 12, color: "var(--accent)" }}>
                    Class: <code>{selectedRule.enforcementClass}</code> ({selectedRule.coverage})
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "sources" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredSources.map((s) => (
            <div key={s.id} className="source-card">
              <div className="source-card-header">
                <span className="source-id">{s.id}</span>
                <span className="badge badge-kind">{s.kind}</span>
              </div>
              <div className="source-card-title">{s.title}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Publisher: {s.publisher}</div>
              {s.supported_takeaway && <div className="source-card-takeaway" style={{ marginTop: 6, background: "var(--surface-2)", padding: 8, borderRadius: 6 }}>{s.supported_takeaway}</div>}
            </div>
          ))}
          {filteredSources.length === 0 && <div className="state-empty"><span className="state-icon">🌐</span>{t("common.noData")}</div>}
        </div>
      )}

      {activeTab === "adapters" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {adapters.map((a) => (
            <div key={a.id} className="adapter-card">
              <div className="adapter-card-header">
                <span className="adapter-id">{a.id}</span>
                <span className="badge badge-success">{a.type}</span>
              </div>
              <div className="adapter-card-title">{a.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Target Version: {a.targetVersion}</div>
            </div>
          ))}
          {adapters.length === 0 && <div className="state-empty"><span className="state-icon">🔌</span>{t("common.noData")}</div>}
        </div>
      )}

      {activeTab === "compare" && comparison && (
        <div className="gov-summary-card">
          <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>
            {t("reference.compareHeading", { base: comparison.base?.version || "1.0.0", target: comparisonTargetVersion })}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            <div className="metric-card" style={{ alignItems: "center" }}>
              <div className="metric-val" style={{ color: "var(--success)" }}>+{comparison.rulesDelta?.added?.length || 0}</div>
              <div className="metric-lbl">{t("reference.rulesAdded")}</div>
            </div>
            <div className="metric-card" style={{ alignItems: "center" }}>
              <div className="metric-val" style={{ color: "var(--warning)" }}>~{comparison.rulesDelta?.modified?.length || 0}</div>
              <div className="metric-lbl">{t("reference.rulesModified")}</div>
            </div>
            <div className="metric-card" style={{ alignItems: "center" }}>
              <div className="metric-val" style={{ color: "var(--danger)" }}>-{comparison.rulesDelta?.removed?.length || 0}</div>
              <div className="metric-lbl">{t("reference.rulesRemoved")}</div>
            </div>
          </div>
        </div>
      )}

      {showMatrixModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setShowMatrixModal(false); }}>
          <div className="modal">
            <div className="modal-head">
              <div>
                <h3>{t("aapes.matrixBtn")}</h3>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {t("matrix.summary", { total: matrixData.length, covered: matrixCovered, partial: matrixPartial })}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <a href="/api/aapes/matrix?format=csv" download="AAPES_AGHR_COMPATIBILITY_MATRIX.csv" className="btn btn-primary btn-sm">
                  {t("aapes.downloadCsv")}
                </a>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowMatrixModal(false)} aria-label="Close">✕</button>
              </div>
            </div>
            <div className="modal-body">
              <div className="matrix-toolbar">
                <input
                  type="text"
                  dir="auto"
                  className="input matrix-search"
                  placeholder={t("matrix.search")}
                  aria-label={t("matrix.search")}
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                />
                <div className="matrix-summary">
                  <span className="badge badge-success">{t("matrix.covered", { count: matrixCovered })}</span>
                  <span className="badge badge-warning">{t("matrix.partial", { count: matrixPartial })}</span>
                  <span className="badge badge-kind">{t("matrix.total", { count: matrixData.length })}</span>
                </div>
              </div>
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th>Req ID</th><th>Domain</th><th>Level</th><th>Title</th><th>Status</th><th>AGHR Reference &amp; Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {matrixFiltered.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ color: "var(--accent)", fontWeight: 700 }}>{row.requirement_id}</td>
                      <td>{row.domain}</td>
                      <td style={{ color: row.normative_level === "MUST" ? "var(--warning)" : "var(--success)" }}>{row.normative_level}</td>
                      <td style={{ color: "var(--text)", maxWidth: 250 }}>{row.title}</td>
                      <td>
                        <span className={"badge " + (row.coverage_status === "COVERED" ? "badge-success" : "badge-warning")}>{row.coverage_status}</span>
                      </td>
                      <td style={{ maxWidth: 340, fontSize: 11 }}>
                        <details>
                          <summary style={{ cursor: "pointer" }}><strong>{row.aghr_ref}</strong></summary>
                          <div style={{ color: "var(--muted)", marginTop: 4 }}>{row.evidence}</div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
