import { useMemo, useState } from "react";
import { fileKind } from "../parse.js";
import { useI18n } from "../i18n/I18nProvider.jsx";

const ICON = { skill: "★", doc: "📄", script: "🐍", data: "🧬", image: "🖼", other: "▪" };

function collectMatches(entries, q, acc, prefix) {
  for (const e of entries) {
    if (e.type === "dir") {
      collectMatches(e.children, q, acc, prefix + e.name + "/");
    } else if (!q || e.name.toLowerCase().includes(q) || (prefix + e.name).toLowerCase().includes(q)) {
      acc.push(prefix + e.rel);
    }
  }
  return acc;
}

function Node({ entry, depth, expanded, toggle, selectedRel, onSelect, matchSet }) {
  const isDir = entry.type === "dir";
  const open = expanded.has(entry.rel);
  const matched = !isDir && matchSet && !matchSet.has(entry.rel);
  if (matched) return null;
  const k = isDir ? null : fileKind(entry);

  return (
    <div className={"tree-row" + (!isDir && selectedRel === entry.rel ? " active" : "")}
      style={{ paddingInlineStart: depth * 14 + 6 }}>
      {isDir ? (
        <button className="tree-label dir" onClick={() => toggle(entry.rel)}>
          <span className="tree-caret">{open ? "▾" : "▸"}</span>
          <span className="tree-icon">{open ? "📂" : "📁"}</span>
          <span dir="auto">{entry.name}</span>
          <span className="tree-count">{countFiles(entry)}</span>
        </button>
      ) : (
        <button className="tree-label file" onClick={() => onSelect(entry)} title={entry.rel}>
          <span className="tree-icon">{ICON[k]}</span>
          <span dir="auto">{entry.name}</span>
        </button>
      )}
      {isDir && open && (
        <div className="tree-children">
          {entry.children.map((c) => (
            <Node key={c.rel} entry={c} depth={depth + 1} expanded={expanded} toggle={toggle}
              selectedRel={selectedRel} onSelect={onSelect} matchSet={matchSet} />
          ))}
        </div>
      )}
    </div>
  );
}

function countFiles(dir) {
  let n = 0;
  for (const c of dir.children) n += c.type === "dir" ? countFiles(c) : 1;
  return n;
}

export default function FileTree({ tree, selectedRel, onSelect, files }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(() => {
    const s = new Set();
    if (tree) for (const e of tree.entries) if (e.type === "dir") s.add(e.rel);
    return s;
  });

  const toggle = (rel) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(rel)) n.delete(rel); else n.add(rel);
      return n;
    });

  const matchSet = useMemo(() => {
    if (!query.trim() || !tree) return null;
    return new Set(collectMatches(tree.entries, query.trim().toLowerCase(), [], ""));
  }, [query, tree]);

  const counts = useMemo(() => {
    const m = new Map();
    for (const f of files || []) {
      const k = fileKind(f);
      m.set(k, (m.get(k) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [files]);

  // عند البحث: افتح كل المجلدات تلقائياً
  const effectiveExpanded = matchSet
    ? new Set((function collectDirs(entries) {
        const s = new Set();
        for (const e of entries || []) {
          if (e.type === "dir") { s.add(e.rel); collectDirs(e.children).forEach((x) => s.add(x)); }
        }
        return s;
      })(tree?.entries))
    : expanded;

  return (
    <div className="tree-wrap">
      <div className="search-wrap">
        <input className="search" placeholder={t("tree.search")} aria-label={t("tree.search")} value={query}
          onChange={(e) => setQuery(e.target.value)} />
        {query && (
          <button className="search-clear" onClick={() => setQuery("")} title={t("tree.clear")}>✕</button>
        )}
      </div>
      {counts.length > 0 && (
        <div className="counts">
          {counts.map(([k, n]) => (
            <span key={k} className="chip">{t(`kind.${k}`)}: {n}</span>
          ))}
        </div>
      )}
      <div className="tree">
        {(tree?.entries || []).map((e) => (
          <Node key={e.rel} entry={e} depth={0} expanded={effectiveExpanded} toggle={toggle}
            selectedRel={selectedRel} onSelect={onSelect} matchSet={matchSet} />
        ))}
      </div>
    </div>
  );
}
