// Host-artifact compatibility contract: load + strict validation.
// Source of truth: host-compat.contract.json (preview-only pilot).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CONTRACT_PATH = path.join(__dirname, "host-compat.contract.json");
export const SCHEMA = "aghr.host-compat/1";
export const ARTIFACT_KINDS = ["AGENT_DEFINITION", "PROJECT_RULE", "PROJECT_INSTRUCTIONS", "AGENT_SKILL"];
export const STATUSES = ["SUPPORTED", "PARTIAL", "UNSUPPORTED", "UNKNOWN"];

function fail(msg) {
  throw new Error(`HOST_COMPAT_CONTRACT_INVALID: ${msg}`);
}

export function safeRelative(p) {
  if (typeof p !== "string" || !p) return false;
  if (path.isAbsolute(p)) return false;
  if (p.includes("\\")) return false;
  return !p.split("/").some((seg) => !seg || seg === "." || seg === "..");
}

export function validateContract(contract) {
  if (!contract || typeof contract !== "object") fail("contract must be an object");
  if (contract.schema !== SCHEMA) fail(`schema must be ${SCHEMA}`);

  const kinds = contract.artifactKinds;
  if (!kinds || typeof kinds !== "object") fail("artifactKinds missing");
  for (const k of ARTIFACT_KINDS) {
    if (!kinds[k]) fail(`artifactKinds.${k} missing`);
    if (typeof kinds[k].supported !== "boolean") fail(`artifactKinds.${k}.supported must be boolean`);
    if (kinds[k].supported && !Array.isArray(kinds[k].requiredFrontmatter)) {
      fail(`artifactKinds.${k}.requiredFrontmatter must be an array`);
    }
  }

  if (!Array.isArray(contract.tools) || contract.tools.length === 0) fail("tools must be a non-empty array");
  const seen = new Set();
  for (const t of contract.tools) {
    if (!t || typeof t.toolId !== "string" || !t.toolId) fail("toolId missing");
    if (seen.has(t.toolId)) fail(`duplicate toolId ${t.toolId}`);
    seen.add(t.toolId);
    if (typeof t.label !== "string" || !t.label) fail(`${t.toolId}: label required`);
    if (typeof t.format !== "string" || !t.format) fail(`${t.toolId}: format required`);
    if (typeof t.renderer !== "string" || !t.renderer) fail(`${t.toolId}: renderer required`);
    if (!["per-agent", "per-rule", "roster", "plugin"].includes(t.installKind)) fail(`${t.toolId}: invalid installKind`);
    if (!Array.isArray(t.scope) || t.scope.length === 0) fail(`${t.toolId}: scope required`);
    for (const s of t.scope) if (!["project", "user"].includes(s)) fail(`${t.toolId}: invalid scope ${s}`);
    if (!t.detect || !Array.isArray(t.detect.dirs)) fail(`${t.toolId}: detect.dirs required`);
    for (const d of t.detect.dirs) if (!safeRelative(d)) fail(`${t.toolId}: detect dir must be relative`);
    if (!t.dest || typeof t.dest !== "object") fail(`${t.toolId}: dest required`);
    for (const [kind, template] of Object.entries(t.dest)) {
      if (!ARTIFACT_KINDS.includes(kind)) fail(`${t.toolId}: dest kind ${kind} invalid`);
      if (!safeRelative(template)) fail(`${t.toolId}: dest template must be a relative path`);
      if (!template.includes("{slug}")) fail(`${t.toolId}: dest template must include {slug}`);
    }
    if (!t.artifactKinds || typeof t.artifactKinds !== "object") fail(`${t.toolId}: artifactKinds missing`);
    for (const k of ARTIFACT_KINDS) {
      if (!STATUSES.includes(t.artifactKinds[k])) fail(`${t.toolId}: artifactKinds.${k} invalid`);
    }
    if (typeof t.maxBytes !== "number" || !Number.isInteger(t.maxBytes) || t.maxBytes <= 0) fail(`${t.toolId}: maxBytes invalid`);
    if (!["UNVERIFIED", "PARTIAL", "VERIFIED"].includes(t.trust)) fail(`${t.toolId}: trust invalid`);
    if (!t.spec || typeof t.spec.url !== "string" || !t.spec.url) fail(`${t.toolId}: spec.url required`);
  }
  return contract;
}

export function loadContract() {
  return validateContract(JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8")));
}

export function getTool(contract, toolId) {
  return contract.tools.find((t) => t.toolId === toolId) || null;
}
