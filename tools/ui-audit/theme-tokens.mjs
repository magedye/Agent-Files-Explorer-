import fs from "node:fs";

const HEX = {
  "#0f172a": "var(--surface-sunken)",
  "#020617": "var(--surface-sunken)",
  "#1e293b": "var(--surface-2)",
  "#334155": "var(--border)",
  "#475569": "var(--border-strong)",
  "#f8fafc": "var(--text)",
  "#e2e8f0": "var(--text-secondary)",
  "#cbd5e1": "var(--text-secondary)",
  "#94a3b8": "var(--muted)",
  "#64748b": "var(--muted)",
  "#38bdf8": "var(--accent)",
  "#60a5fa": "var(--accent)",
  "#2563eb": "var(--accent)",
  "#34d399": "var(--success)",
  "#10b981": "var(--success)",
  "#f87171": "var(--danger)",
  "#ef4444": "var(--danger)",
  "#fbbf24": "var(--warning)",
  "#f59e0b": "var(--warning)",
  "#a7f3d0": "var(--success)",
  "#a5b4fc": "var(--accent)",
};

const RGBA = {
  "rgba(30, 41, 59, 0.5)": "var(--surface-2)",
  "rgba(30, 41, 59, 0.7)": "var(--surface-2)",
  "rgba(30, 41, 59, 0.4)": "var(--surface-2)",
  "rgba(15, 23, 42, 0.6)": "var(--surface)",
  "rgba(15, 23, 42, 0.8)": "var(--surface)",
  "rgba(15, 23, 42, 0.7)": "var(--surface)",
  "rgba(15, 23, 42, 0.4)": "var(--surface)",
  "rgba(56, 189, 248, 0.15)": "var(--accent-soft)",
  "rgba(56, 189, 248, 0.1)": "var(--accent-soft)",
  "rgba(56, 189, 248, 0.2)": "var(--accent-soft)",
  "rgba(16, 185, 129, 0.2)": "var(--success-soft)",
  "rgba(16, 185, 129, 0.15)": "var(--success-soft)",
  "rgba(239, 68, 68, 0.2)": "var(--danger-soft)",
  "rgba(239, 68, 68, 0.15)": "var(--danger-soft)",
  "rgba(245, 158, 11, 0.2)": "var(--warning-soft)",
  "rgba(245, 158, 11, 0.15)": "var(--warning-soft)",
  "rgba(59, 130, 246, 0.2)": "var(--info-soft)",
  "rgba(59, 130, 246, 0.15)": "var(--info-soft)",
  "rgba(0, 0, 0, 0.8)": "var(--overlay)",
  "rgba(0, 0, 0, 0.5)": "var(--overlay)",
  "rgba(255, 255, 255, 0.1)": "var(--border)",
  "rgba(255, 255, 255, 0.05)": "var(--border)",
  "rgba(168, 85, 247, 0.15)": "var(--accent-soft)",
};

const files = process.argv.slice(2);
for (const f of files) {
  let txt = fs.readFileSync(f, "utf8");
  const before = txt;
  // Longest keys first to avoid partial overlap.
  const rgbaKeys = Object.keys(RGBA).sort((a, b) => b.length - a.length);
  for (const k of rgbaKeys) txt = txt.split(k).join(RGBA[k]);
  for (const [k, v] of Object.entries(HEX)) {
    txt = txt.replace(new RegExp(k.replace("#", "#"), "gi"), v);
  }
  if (txt !== before) {
    fs.writeFileSync(f, txt, "utf8");
    console.log("updated", f);
  } else {
    console.log("unchanged", f);
  }
}
