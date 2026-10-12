import { useState, useEffect } from "react";

export default function ReferenceManager({ onSelectContract }) {
  const [summary, setSummary] = useState(null);
  const [rules, setRules] = useState([]);
  const [sources, setSources] = useState([]);
  const [adapters, setAdapters] = useState([]);
  const [search, setSearch] = useState("");
  const [forceFilter, setForceFilter] = useState("");
  const [activeTab, setActiveTab] = useState("rules"); // rules | sources | adapters
  const [selectedRule, setSelectedRule] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [sumRes, rulesRes, srcRes, adaptRes] = await Promise.all([
          fetch("/api/governance/summary").then((r) => r.json()),
          fetch("/api/governance/rules").then((r) => r.json()),
          fetch("/api/governance/sources").then((r) => r.json()),
          fetch("/api/governance/adapters").then((r) => r.json()),
        ]);
        setSummary(sumRes);
        setRules(rulesRes.rules || []);
        setSources(srcRes.sources || []);
        setAdapters(adaptRes.adapters || []);
      } catch (err) {
        console.error("Failed to load governance data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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
      {/* Summary Metrics Bar */}
      <div className="gov-summary-cards">
        <div className="metric-card">
          <div className="metric-val">{summary?.counts?.rules || 40}</div>
          <div className="metric-lbl">قاعدة حاكمة (Rules)</div>
          <span className="badge badge-primary">AGHR-001 … 040</span>
        </div>
        <div className="metric-card">
          <div className="metric-val">{summary?.counts?.sources || 30}</div>
          <div className="metric-lbl">مصدر رسمي (Official Sources)</div>
          <span className="badge badge-success">OpenAI · Google · Anthropic</span>
        </div>
        <div className="metric-card">
          <div className="metric-val">{summary?.counts?.adapters || 12}</div>
          <div className="metric-lbl">محول تشغيلي (Adapters)</div>
          <span className="badge badge-info">6 Hosts · 6 Providers</span>
        </div>
        <div className="metric-card">
          <div className="metric-val">FINAL_REF</div>
          <div className="metric-lbl">حالة المرجعية (v1.0.0)</div>
          <span className="badge badge-warning">Local-First Verified</span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="gov-subtabs">
        <button
          className={"subtab" + (activeTab === "rules" ? " active" : "")}
          onClick={() => setActiveTab("rules")}
        >
          📜 القواعد الحاكمة ({rules.length})
        </button>
        <button
          className={"subtab" + (activeTab === "sources" ? " active" : "")}
          onClick={() => setActiveTab("sources")}
        >
          🌐 المصادر الرسمية المعتمدة ({sources.length})
        </button>
        <button
          className={"subtab" + (activeTab === "adapters" ? " active" : "")}
          onClick={() => setActiveTab("adapters")}
        >
          🔌 محولات النماذج والمضيفين ({adapters.length})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="gov-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="بحث في القواعد والمصادر والمفاهيم…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {activeTab === "rules" && (
          <div className="filter-group">
            <label>قوة الإلزام:</label>
            <select value={forceFilter} onChange={(e) => setForceFilter(e.target.value)}>
              <option value="">الكل (All Forces)</option>
              <option value="MUST">MUST (إلزامي قطعي)</option>
              <option value="MUST_NOT">MUST_NOT (محظور قطعي)</option>
              <option value="SHOULD">SHOULD (موصى به)</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="gov-content-grid">
        {/* Left Column: List */}
        <div className="gov-list-col">
          {loading && <div className="loading-state">جارٍ تحميل بيانات الحوكمة المرجعية…</div>}

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
                  <div className="rule-card-title">{r.title}</div>
                  <div className="rule-card-text">{r.text}</div>
                  <div className="rule-card-footer">
                    <span className="applies-when">📌 {r.applies_when}</span>
                    <span className="sources-count">🔗 {(r.basis || []).length} مصادر</span>
                  </div>
                </div>
              ))}
              {filteredRules.length === 0 && !loading && (
                <div className="empty-state">لا توجد قواعد مطابقة للبحث المحدد.</div>
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
                  <div className="source-card-takeaway">{s.supported_takeaway}</div>
                  <div className="source-card-footer">
                    <a href={s.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                      🔗 رابط المصدر الرسمي ↗
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
                    <div>المسار: <code>{a.path}</code></div>
                    <div>المصادر المرجعية: {(a.source_ids || []).join(", ")}</div>
                  </div>
                </div>
              ))}
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
                <h4>نص القاعدة الحاكمة (Governing Text)</h4>
                <div className="inspector-quote">{selectedRule.text}</div>
              </div>
              <div className="inspector-section">
                <h4>شرط الانطباق (Applicability)</h4>
                <div>{selectedRule.applies_when}</div>
              </div>
              <div className="inspector-section">
                <h4>عقد التفسير (Explanation Reference)</h4>
                <code>{selectedRule.explanation_ref}</code>
              </div>
              <div className="inspector-section">
                <h4>المصادر التأسيسية المعتمدة (Basis Sources)</h4>
                <div className="basis-chips">
                  {(selectedRule.basis || []).map((bid) => (
                    <span key={bid} className="basis-chip">
                      {bid}
                    </span>
                  ))}
                </div>
              </div>
              <div className="inspector-section">
                <h4>فئة الإنفاذ والتحقق (Enforcement Class)</h4>
                <div className="enforcement-info">
                  <div><strong>الفئة:</strong> {selectedRule.enforcement_class}</div>
                  <div><strong>التحقق:</strong> {selectedRule.verification}</div>
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
                <h4>الخلاصة المعتمدة (Supported Takeaway)</h4>
                <div className="inspector-quote">{selectedSource.supported_takeaway}</div>
              </div>
              <div className="inspector-section">
                <h4>المحدد المرجعي (Locator)</h4>
                <div>{selectedSource.locator}</div>
              </div>
              <div className="inspector-section">
                <h4>نطاق الإصدار (Version Scope)</h4>
                <div>{selectedSource.version_scope}</div>
              </div>
              <div className="inspector-section">
                <h4>الرابط الرسمي</h4>
                <a href={selectedSource.url} target="_blank" rel="noreferrer">
                  {selectedSource.url} ↗
                </a>
              </div>
            </div>
          ) : (
            <div className="inspector-empty">
              <span>👈 اختر قاعدة أو مصدراً من القائمة لعرض تفاصيله المرجعية وروابطه.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
