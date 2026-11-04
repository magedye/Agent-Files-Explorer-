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
  { id: "D12", name: "Lifecycle and Change Governance" }
];

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
  const [domainFilter, setDomainFilter] = useState("");
  const [activeTab, setActiveTab] = useState("rules"); // rules | sources | adapters | compare
  const [selectedRule, setSelectedRule] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [matrixData, setMatrixData] = useState([]);

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
        setDomainFilter("");
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

  // Load matrix on demand
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
      {/* Package Selector Bar */}
      <div className="gov-package-bar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", background: "rgba(30, 41, 59, 0.7)", padding: "10px 16px", borderRadius: "8px", marginBottom: "16px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "#94a3b8" }}>{t("reference.activePackage")}</span>
          <select
            aria-label={t("reference.activePackage")}
            value={selectedPackageId}
            onChange={(e) => setSelectedPackageId(e.target.value)}
            style={{ background: "#0f172a", color: "#f8fafc", padding: "6px 12px", borderRadius: "6px", border: "1px solid #334155", fontSize: "14px", cursor: "pointer" }}
          >
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name} ({pkg.version}) {pkg.isDefault ? `— ${t("reference.default")}` : ""} {pkg.id === "aapes_v2_1" ? "— [AAPES Candidate]" : ""}
              </option>
            ))}
          </select>
          {isAapes && (
            <span style={{ fontSize: "12px", padding: "3px 8px", borderRadius: "4px", background: "#f59e0b", color: "#000", fontWeight: "bold" }}>
              {t("aapes.candidateNotice")}
            </span>
          )}
        </div>

        <button
          className="btn btn-secondary"
          onClick={handleOpenMatrix}
          style={{ fontSize: "13px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px" }}
        >
          {t("aapes.matrixBtn")}
        </button>
      </div>

      {/* Package Summary Header Card */}
      {summary && (
        <div className="gov-summary-card" style={{ background: "rgba(15, 23, 42, 0.6)", padding: "16px", borderRadius: "8px", marginBottom: "16px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h2 style={{ fontSize: "18px", margin: "0 0 6px 0", color: "#f8fafc" }}>
                {summary.package} <span style={{ fontSize: "13px", color: "#38bdf8", fontWeight: "normal" }}>v{summary.version}</span>
              </h2>
              <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                {t("reference.counts", { rules: summary.counts?.rules || 0, sources: summary.counts?.sources || 0 })}
                {summary.counts?.adapters > 0 && ` · ${summary.counts.adapters} ${t("reference.adapters")}`}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span className={`gov-status-pill ${summary.reference_state === "AUTHORITATIVE_BASELINE" || summary.reference_state === "OFFICIAL_LOCAL_REFERENCE" ? "status-stable" : "status-scoped"}`}>
                {summary.reference_state}
              </span>
              <span className="gov-status-pill status-gray">{summary.default_provider || "AGHR Engine"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="gov-nav-tabs" style={{ display: "flex", gap: "8px", borderBottom: "1px solid #334155", marginBottom: "16px" }}>
        <button
          className={`gov-tab-btn ${activeTab === "rules" ? "active" : ""}`}
          onClick={() => setActiveTab("rules")}
        >
          {t("reference.rulesTab")} ({rules.length})
        </button>
        <button
          className={`gov-tab-btn ${activeTab === "sources" ? "active" : ""}`}
          onClick={() => setActiveTab("sources")}
        >
          {t("reference.sourcesTab")} ({sources.length})
        </button>
        <button
          className={`gov-tab-btn ${activeTab === "adapters" ? "active" : ""}`}
          onClick={() => setActiveTab("adapters")}
        >
          {t("reference.adaptersTab")} ({adapters.length})
        </button>
        <button
          className={`gov-tab-btn ${activeTab === "compare" ? "active" : ""}`}
          onClick={() => setActiveTab("compare")}
        >
          {t("reference.compareTab", { version: comparisonTargetVersion })}
        </button>
      </div>

      {/* Search and Domain Filters */}
      {activeTab === "rules" && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
          <input
            type="text"
            dir="auto"
            placeholder={t("reference.searchRules")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: "200px", padding: "8px 12px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
          />
          <select
            value={forceFilter}
            onChange={(e) => setForceFilter(e.target.value)}
            style={{ padding: "8px 12px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
          >
            <option value="">{t("reference.allForces")}</option>
            <option value="MUST">MUST</option>
            <option value="MUST_NOT">MUST_NOT</option>
            <option value="SHOULD">SHOULD</option>
            <option value="MAY">MAY</option>
          </select>
          {isAapes && (
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              style={{ padding: "8px 12px", background: "#0f172a", border: "1px solid #38bdf8", borderRadius: "6px", color: "#38bdf8" }}
            >
              <option value="">{t("aapes.allDomains")}</option>
              {AAPES_DOMAINS.map((dom) => (
                <option key={dom.id} value={dom.id}>
                  {dom.id}: {dom.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Rules Master-Detail View */}
      {activeTab === "rules" && (
        <div style={{ display: "grid", gridTemplateColumns: selectedRule ? "1fr 1fr" : "1fr", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "650px", overflowY: "auto" }}>
            {filteredRules.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedRule(r)}
                style={{
                  padding: "12px",
                  borderRadius: "6px",
                  background: selectedRule?.id === r.id ? "rgba(56, 189, 248, 0.15)" : "rgba(30, 41, 59, 0.5)",
                  border: selectedRule?.id === r.id ? "1px solid #38bdf8" : "1px solid #334155",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontWeight: "bold", color: "#38bdf8", fontSize: "14px" }}>{r.id}</span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {r.domain && (
                      <span style={{ fontSize: "11px", background: "#1e293b", color: "#94a3b8", padding: "2px 6px", borderRadius: "4px", border: "1px solid #475569" }}>
                        {r.domain}
                      </span>
                    )}
                    {r.priority && (
                      <span style={{ fontSize: "11px", background: r.priority === "P0" ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.2)", color: r.priority === "P0" ? "#f87171" : "#60a5fa", padding: "2px 6px", borderRadius: "4px" }}>
                        {r.priority}
                      </span>
                    )}
                    <span style={{ fontSize: "11px", background: r.force === "MUST" || r.force === "MUST_NOT" ? "rgba(245, 158, 11, 0.2)" : "rgba(16, 185, 129, 0.2)", color: r.force === "MUST" || r.force === "MUST_NOT" ? "#fbbf24" : "#34d399", padding: "2px 6px", borderRadius: "4px" }}>
                      {r.force}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: "500", marginBottom: "4px" }}>{r.name || r.title}</div>
                <div style={{ fontSize: "12px", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.text}
                </div>
              </div>
            ))}
            {filteredRules.length === 0 && <div style={{ color: "#94a3b8", padding: "20px", textAlign: "center" }}>{t("common.noData")}</div>}
          </div>

          {/* Rule Detail Panel */}
          {selectedRule && (
            <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid #334155", borderRadius: "8px", padding: "16px", maxHeight: "650px", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ margin: "0 0 4px 0", color: "#38bdf8", fontSize: "16px" }}>{selectedRule.id}</h3>
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: "#f8fafc" }}>{selectedRule.name || selectedRule.title}</div>
                </div>
                <button
                  onClick={() => setSelectedRule(null)}
                  style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "18px" }}
                >
                  ✕
                </button>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <span style={{ fontSize: "12px", fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase" }}>{t("reference.ruleStatement")}</span>
                <div style={{ background: "#0f172a", padding: "12px", borderRadius: "6px", border: "1px solid #1e293b", marginTop: "6px", color: "#f8fafc", fontSize: "13px", lineHeight: "1.5" }}>
                  {selectedRule.text}
                </div>
              </div>

              {selectedRule.acceptance_test && (
                <div style={{ marginBottom: "16px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase" }}>Acceptance Test / Criteria</span>
                  <div style={{ background: "#0f172a", padding: "10px", borderRadius: "6px", border: "1px solid #1e293b", marginTop: "6px", color: "#38bdf8", fontSize: "12px" }}>
                    {selectedRule.acceptance_test}
                  </div>
                </div>
              )}

              {selectedRule.basis && selectedRule.basis.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase" }}>{t("reference.basisSources")}</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                    {selectedRule.basis.map((b, idx) => (
                      <div key={idx} style={{ fontSize: "12px", background: "rgba(30, 41, 59, 0.4)", padding: "6px 10px", borderRadius: "4px", color: "#cbd5e1" }}>
                        <strong>{b.id}:</strong> {b.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRule.enforcementClass && (
                <div>
                  <span style={{ fontSize: "12px", fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase" }}>{t("reference.enforcementCoverage")}</span>
                  <div style={{ marginTop: "6px", fontSize: "12px", color: "#a5b4fc" }}>
                    Class: <code>{selectedRule.enforcementClass}</code> ({selectedRule.coverage})
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sources Tab */}
      {activeTab === "sources" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filteredSources.map((s) => (
            <div key={s.id} style={{ background: "rgba(30, 41, 59, 0.5)", border: "1px solid #334155", borderRadius: "6px", padding: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontWeight: "bold", color: "#38bdf8", fontSize: "14px" }}>{s.id}</span>
                <span style={{ fontSize: "11px", background: "#1e293b", color: "#94a3b8", padding: "2px 6px", borderRadius: "4px" }}>{s.kind}</span>
              </div>
              <div style={{ fontSize: "13px", fontWeight: "bold", color: "#f8fafc", marginBottom: "4px" }}>{s.title}</div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>Publisher: {s.publisher}</div>
              {s.supported_takeaway && (
                <div style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "6px", background: "#0f172a", padding: "8px", borderRadius: "4px" }}>
                  {s.supported_takeaway}
                </div>
              )}
            </div>
          ))}
          {filteredSources.length === 0 && <div style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>{t("common.noData")}</div>}
        </div>
      )}

      {/* Adapters Tab */}
      {activeTab === "adapters" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {adapters.map((a) => (
            <div key={a.id} style={{ background: "rgba(30, 41, 59, 0.5)", border: "1px solid #334155", borderRadius: "6px", padding: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontWeight: "bold", color: "#38bdf8", fontSize: "14px" }}>{a.id}</span>
                <span style={{ fontSize: "11px", background: "#1e293b", color: "#34d399", padding: "2px 6px", borderRadius: "4px" }}>{a.type}</span>
              </div>
              <div style={{ fontSize: "13px", fontWeight: "bold", color: "#f8fafc" }}>{a.name}</div>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>Target Version: {a.targetVersion}</div>
            </div>
          ))}
          {adapters.length === 0 && <div style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>{t("common.noData")}</div>}
        </div>
      )}

      {/* Compare Tab */}
      {activeTab === "compare" && comparison && (
        <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "16px", borderRadius: "8px", border: "1px solid #334155" }}>
          <h3 style={{ margin: "0 0 12px 0", color: "#f8fafc", fontSize: "16px" }}>
            {t("reference.compareHeading", { base: comparison.base?.version || "1.0.0", target: comparisonTargetVersion })}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
            <div style={{ background: "#0f172a", padding: "12px", borderRadius: "6px", border: "1px solid #1e293b", textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: "#34d399" }}>+{comparison.rulesDelta?.added?.length || 0}</div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>{t("reference.rulesAdded")}</div>
            </div>
            <div style={{ background: "#0f172a", padding: "12px", borderRadius: "6px", border: "1px solid #1e293b", textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: "#f59e0b" }}>~{comparison.rulesDelta?.modified?.length || 0}</div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>{t("reference.rulesModified")}</div>
            </div>
            <div style={{ background: "#0f172a", padding: "12px", borderRadius: "6px", border: "1px solid #1e293b", textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: "#f87171" }}>-{comparison.rulesDelta?.removed?.length || 0}</div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>{t("reference.rulesRemoved")}</div>
            </div>
          </div>
        </div>
      )}

      {/* Compatibility Matrix Modal */}
      {showMatrixModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0, 0, 0, 0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#0f172a", border: "1px solid #38bdf8", borderRadius: "10px", width: "95%", maxWidth: "1100px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: "0 0 4px 0", color: "#38bdf8", fontSize: "18px" }}>{t("aapes.matrixBtn")}</h3>
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                  Complete traceability across all 48 AAPES requirements (43 COVERED, 5 PARTIAL)
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <a
                  href="/api/aapes/matrix?format=csv"
                  download="AAPES_AGHR_COMPATIBILITY_MATRIX.csv"
                  className="btn btn-primary"
                  style={{ fontSize: "12px", padding: "6px 12px", textDecoration: "none" }}
                >
                  {t("aapes.downloadCsv")}
                </a>
                <button
                  onClick={() => setShowMatrixModal(false)}
                  style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "20px" }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#1e293b", color: "#cbd5e1" }}>
                    <th style={{ padding: "8px", borderBottom: "1px solid #334155" }}>Req ID</th>
                    <th style={{ padding: "8px", borderBottom: "1px solid #334155" }}>Domain</th>
                    <th style={{ padding: "8px", borderBottom: "1px solid #334155" }}>Level</th>
                    <th style={{ padding: "8px", borderBottom: "1px solid #334155" }}>Title</th>
                    <th style={{ padding: "8px", borderBottom: "1px solid #334155" }}>Status</th>
                    <th style={{ padding: "8px", borderBottom: "1px solid #334155" }}>AGHR Reference & Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {matrixData.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #1e293b", background: idx % 2 === 0 ? "rgba(15, 23, 42, 0.4)" : "transparent" }}>
                      <td style={{ padding: "8px", color: "#38bdf8", fontWeight: "bold" }}>{row.requirement_id}</td>
                      <td style={{ padding: "8px", color: "#94a3b8" }}>{row.domain}</td>
                      <td style={{ padding: "8px", color: row.normative_level === "MUST" ? "#fbbf24" : "#a7f3d0" }}>{row.normative_level}</td>
                      <td style={{ padding: "8px", color: "#f8fafc", maxWidth: "250px" }}>{row.title}</td>
                      <td style={{ padding: "8px" }}>
                        <span style={{
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "bold",
                          background: row.coverage_status === "COVERED" ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                          color: row.coverage_status === "COVERED" ? "#34d399" : "#fbbf24"
                        }}>
                          {row.coverage_status}
                        </span>
                      </td>
                      <td style={{ padding: "8px", color: "#cbd5e1", maxWidth: "320px", fontSize: "11px" }}>
                        <div><strong>Ref:</strong> {row.aghr_ref}</div>
                        <div style={{ color: "#94a3b8" }}>{row.evidence}</div>
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
