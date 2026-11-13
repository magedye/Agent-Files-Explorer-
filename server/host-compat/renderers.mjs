// Deterministic, pinned renderers for the preview-only host-compat pilot.
// No file I/O: renderers take a string and return a string.
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const SOURCE = fs.readFileSync(fileURLToPath(import.meta.url));
export const RENDERERS_HASH = "sha256:" + crypto.createHash("sha256").update(SOURCE).digest("hex");

function parseFrontmatter(content) {
  const text = String(content ?? "").replace(/\r\n/g, "\n");
  if (!text.startsWith("---\n")) return { error: "MISSING_FRONTMATTER" };
  const end = text.indexOf("\n---", 4);
  if (end === -1) return { error: "UNCLOSED_FRONTMATTER" };
  const head = text.slice(4, end);
  const body = text.slice(end + 4).replace(/^\n+/, "");
  const fields = {};
  for (const line of head.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx <= 0) return { error: "MALFORMED_FRONTMATTER" };
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key) return { error: "MALFORMED_FRONTMATTER" };
    fields[key] = value;
  }
  return { fields, body };
}

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function renderWithFields(content, { required, allowed, slugFrom }) {
  const parsed = parseFrontmatter(content);
  if (parsed.error) return { error: parsed.error };
  const { fields, body } = parsed;
  for (const r of required) {
    if (!fields[r] || !String(fields[r]).trim()) return { error: `MISSING_FIELD:${r}` };
  }
  const slug = slugify(fields.slug || fields[slugFrom] || "");
  if (!slug) return { error: "INVALID_SLUG" };

  const droppedFields = Object.keys(fields).filter((k) => k !== "slug" && !allowed.includes(k));
  const fieldLines = allowed
    .filter((k) => fields[k] !== undefined && String(fields[k]).trim() !== "")
    .map((k) => `${k}: ${fields[k]}`);

  const out = ["---", ...fieldLines, "---"];
  if (body.trim()) out.push("", body.trimEnd());
  out.push("");
  return { content: out.join("\n"), slug, fields, droppedFields };
}

const CLAUDE = { required: ["name", "description"], allowed: ["name", "description"], slugFrom: "name" };
const CURSOR = { required: ["description"], allowed: ["description", "globs", "alwaysApply"], slugFrom: "description" };

export const renderers = {
  "claude-agent-md@1": {
    id: "claude-agent-md@1",
    render: (content) => renderWithFields(content, CLAUDE),
  },
  "cursor-mdc@1": {
    id: "cursor-mdc@1",
    render: (content) => renderWithFields(content, CURSOR),
  },
};

export function getRenderer(id) {
  return renderers[id] || null;
}
