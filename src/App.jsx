import { useCallback, useEffect, useState } from "react";
import { fetchRoots, fetchTree, fetchFile } from "./api.js";
import { flattenTree, analyze } from "./parse.js";
import FileTree from "./components/FileTree.jsx";
import FileView from "./components/FileView.jsx";
import GraphView from "./components/GraphView.jsx";
import FlowView from "./components/FlowView.jsx";
import ReferenceManager from "./components/ReferenceManager.jsx";
import IntakeView from "./components/IntakeView.jsx";
import AdoptionView from "./components/AdoptionView.jsx";
import EvaluationView from "./components/EvaluationView.jsx";
import StagingView from "./components/StagingView.jsx";

const PARSE_EXTS = new Set(["md", "py", "js", "ts", "json", "yaml", "yml", "toml", "txt", "cfg", "ini", "sh"]);
const PARSE_MAX = 512_000;
const CONCURRENCY = 6;

async function pool(items, worker, onDone) {
  let i = 0;
  const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (i < items.length) {
      const it = items[i++];
      await worker(it);
      onDone();
    }
  });
  await Promise.all(runners);
}

export default function App() {
  const [roots, setRoots] = useState([]);
  const [root, setRoot] = useState(null);
  const [tree, setTree] = useState(null);
  const [files, setFiles] = useState([]);
  const [contents, setContents] = useState({});
  const [selected, setSelected] = useState(null);

  // Top level view modes: 'explorer' | 'reference' | 'intake' | 'adoption' | 'evaluation' | 'staging'
  const [mode, setMode] = useState(() => new URLSearchParams(location.search).get("mode") || "explorer");

  // Explorer sub-tabs: 'file' | 'graph' | 'flow'
  const [tab, setTab] = useState(() => new URLSearchParams(location.search).get("tab") || "file");

  const [activeStagingId, setActiveStagingId] = useState("");
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const pushHistory = (state) =>
    setHistory((h) => {
      const last = h[h.length - 1];
      if (last && last.mode === state.mode && last.tab === state.tab && last.rel === state.rel) return h;
      return [...h.slice(-29), state];
    });

  const currentState = () => ({ mode, tab, rel: selected?.rel });

  const changeMode = (m) => {
    if (m === mode) return;
    pushHistory(currentState());
    setMode(m);
  };

  const changeTab = (t) => {
    if (t === tab) return;
    pushHistory(currentState());
    setTab(t);
  };

  const openFile = (f, switchTab = true) => {
    if (!f) return;
    if (f.rel === selected?.rel && (!switchTab || tab === "file")) return;
    pushHistory(currentState());
    setSelected(f);
    if (switchTab) setTab("file");
  };

  const goBack = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setHistory(history.slice(0, -1));
    if (prev.mode) setMode(prev.mode);
    if (prev.tab) setTab(prev.tab);
    if (prev.rel) {
      const f = files.find((x) => x.rel === prev.rel);
      if (f) setSelected(f);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") goBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [history, files, mode, tab, selected]);

  const loadRoot = useCallback(async (r) => {
    setRoot(r);
    setTree(null);
    setFiles([]);
    setContents({});
    setSelected(null);
    setError(null);
    try {
      const t = await fetchTree(r.path, r.id);
      setTree(t);
      const flat = flattenTree(t.entries);
      setFiles(flat);

      const parseTargets = flat.filter((f) => PARSE_EXTS.has(f.ext) && f.size <= PARSE_MAX);
      setProgress({ done: 0, total: parseTargets.length });
      const acc = {};
      await pool(
        parseTargets,
        async (f) => {
          try {
            const d = await fetchFile(r.path + "/" + f.rel, r.id, f.rel);
            if (d.kind === "text") acc[f.rel] = d.content;
          } catch {}
        },
        () => setProgress((p) => (p ? { ...p, done: p.done + 1 } : p))
      );
      setContents(acc);
      setProgress(null);

      const start =
        flat.find((f) => /^README\.md$/i.test(f.name)) ||
        flat.find((f) => /^SKILL\.md$/i.test(f.name)) ||
        flat.find((f) => f.ext === "md");
      if (start) setSelected(start);
    } catch (e) {
      setError(String(e.message || e));
      setProgress(null);
    }
  }, []);

  useEffect(() => {
    fetchRoots()
      .then((rs) => {
        setRoots(rs);
        if (rs.length) loadRoot(rs[0]);
      })
      .catch((e) => setError(String(e.message || e)));
  }, [loadRoot]);

  const analysis = files.length && Object.keys(contents).length ? analyze(files, contents) : null;

  const selectInPlace = (f) => openFile(f, false);

  const handleGoToStaging = (stagingId) => {
    setActiveStagingId(stagingId);
    setMode("staging");
  };

  return (
    <div className="app">
      {/* Studio Top Header Bar */}
      <header className="topbar">
        <div className="brand">
          <span className="logo">🏛️</span>
          <div>
            <div className="brand-name">AGHR Governance Studio</div>
            <div className="brand-sub" dir="auto">
              منصة إدارة حوكمة الوكلاء والمرجعية المعيارية 1.0.0
            </div>
          </div>
        </div>

        {/* Primary Studio Navigation */}
        <nav className="mode-nav">
          <button
            className={"mode-btn" + (mode === "explorer" ? " active" : "")}
            onClick={() => changeMode("explorer")}
          >
            🧭 المستكشف (Explorer)
          </button>
          <button
            className={"mode-btn" + (mode === "reference" ? " active" : "")}
            onClick={() => changeMode("reference")}
          >
            📜 مرجعية AGHR (40 Rules)
          </button>
          <button
            className={"mode-btn" + (mode === "intake" ? " active" : "")}
            onClick={() => changeMode("intake")}
          >
            📥 الطلبات والتغييرات (ChangePackets)
          </button>
          <button
            className={"mode-btn" + (mode === "adoption" ? " active" : "")}
            onClick={() => changeMode("adoption")}
          >
            🏗️ تبني المشاريع (Adoption)
          </button>
          <button
            className={"mode-btn" + (mode === "evaluation" ? " active" : "")}
            onClick={() => changeMode("evaluation")}
          >
            ⚖️ التحقق والأدلة (Evaluations)
          </button>
          <button
            className={"mode-btn" + (mode === "staging" ? " active" : "")}
            onClick={() => changeMode("staging")}
          >
            🛡️ التطبيق المحكوم (Staging & Apply)
          </button>
        </nav>

        {/* Controls */}
        <div className="topbar-controls">
          <button
            className={"tab back" + (history.length ? "" : " off")}
            onClick={goBack}
            disabled={!history.length}
            title="العودة إلى الشاشة السابقة (Esc)"
          >
            → رجوع
          </button>
          <button
            className="tab theme-toggle"
            onClick={toggleTheme}
            title={theme === "dark" ? "التبديل إلى النمط النهاري" : "التبديل إلى النمط الليلي"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <div className="body">
        {mode === "explorer" && (
          <>
            <aside className="sidebar">
              <div className="roots">
                <div className="side-title">الجذور المعتمدة محلياً</div>
                {roots.map((r) => (
                  <button
                    key={r.id || r.path}
                    className={"root-item" + (root?.path === r.path ? " active" : "")}
                    onClick={() => loadRoot(r)}
                    title={r.path}
                  >
                    <span className="dot k-doc" />
                    <span dir="auto">{r.name}</span>
                  </button>
                ))}
              </div>

              {progress && (
                <div className="progress">
                  تحليل الملفات… {progress.done}/{progress.total}
                </div>
              )}
              {error && <div className="error">{error}</div>}

              {tree && (
                <FileTree tree={tree} files={files} selectedRel={selected?.rel} onSelect={selectInPlace} />
              )}
            </aside>

            <main className="main">
              {/* Explorer Subtabs */}
              <div className="explorer-subtabs">
                <button
                  className={"tab" + (tab === "file" ? " on" : "")}
                  onClick={() => changeTab("file")}
                >
                  📄 معاينة الملف
                </button>
                <button
                  className={"tab" + (tab === "graph" ? " on" : "")}
                  onClick={() => changeTab("graph")}
                >
                  🕸️ خريطة العلاقات {analysis ? `(${analysis.edges.length})` : ""}
                </button>
                <button
                  className={"tab" + (tab === "flow" ? " on" : "")}
                  onClick={() => changeTab("flow")}
                >
                  🔄 مخطط التدفق
                </button>
              </div>

              <div className="explorer-content-pane">
                {tab === "file" && (
                  <FileView file={selected} rootName={root?.name} rootPath={root?.path} />
                )}
                {tab === "graph" &&
                  (analysis ? (
                    <GraphView
                      files={files}
                      analysis={analysis}
                      selectedRel={selected?.rel}
                      onSelect={(f) => openFile(f)}
                      theme={theme}
                    />
                  ) : (
                    <div className="pane empty">{progress ? "جارٍ التحليل…" : "لا بيانات"}</div>
                  ))}
                {tab === "flow" &&
                  (analysis ? (
                    <FlowView
                      files={files}
                      analysis={analysis}
                      selectedRel={selected?.rel}
                      onSelect={(f) => openFile(f)}
                    />
                  ) : (
                    <div className="pane empty">{progress ? "جارٍ التحليل…" : "لا بيانات"}</div>
                  ))}
              </div>
            </main>
          </>
        )}

        {mode === "reference" && (
          <main className="main studio-full-pane">
            <ReferenceManager />
          </main>
        )}

        {mode === "intake" && (
          <main className="main studio-full-pane">
            <IntakeView onStagePacket={handleGoToStaging} />
          </main>
        )}

        {mode === "adoption" && (
          <main className="main studio-full-pane">
            <AdoptionView onGoToStaging={handleGoToStaging} />
          </main>
        )}

        {mode === "evaluation" && (
          <main className="main studio-full-pane">
            <EvaluationView />
          </main>
        )}

        {mode === "staging" && (
          <main className="main studio-full-pane">
            <StagingView initialStagingId={activeStagingId} />
          </main>
        )}
      </div>
    </div>
  );
}
