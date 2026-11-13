// Preview-only host-artifact compatibility service.
// Reads the target project, renders in memory, validates destinations, computes a
// diff. It never writes to the target project or the governance state.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadContract, getTool, ARTIFACT_KINDS, safeRelative } from "./contract.mjs";
import { getRenderer, RENDERERS_HASH } from "./renderers.mjs";
import { SAMPLES } from "./samples.mjs";
import { safeFile, computeDiff } from "../staging.js";
import { isProtectedPath } from "../security.js";

const sha256 = (s) => "sha256:" + crypto.createHash("sha256").update(s, "utf8").digest("hex");

export class HostCompatError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = "HostCompatError";
    this.code = code;
    this.status = status;
  }
}

function requireProject(projectDir) {
  if (typeof projectDir !== "string" || !projectDir.trim()) {
    throw new HostCompatError("INVALID_PROJECT", "project path is required");
  }
  const abs = path.resolve(projectDir);
  const st = fs.statSync(abs, { throwIfNoEntry: false });
  if (!st || !st.isDirectory()) {
    throw new HostCompatError("INVALID_PROJECT", "project path is not a directory");
  }
  return fs.realpathSync(abs);
}

export function listTools() {
  const contract = loadContract();
  return {
    schema: contract.schema,
    artifactKinds: Object.fromEntries(
      ARTIFACT_KINDS.map((k) => [
        k,
        {
          label: contract.artifactKinds[k].label,
          supported: contract.artifactKinds[k].supported,
          reason: contract.artifactKinds[k].reason || null,
        },
      ])
    ),
    tools: contract.tools.map((t) => ({
      toolId: t.toolId,
      label: t.label,
      format: t.format,
      installKind: t.installKind,
      scope: t.scope,
      trust: t.trust,
      hostVersionRange: t.hostVersionRange,
      spec: t.spec,
      maxBytes: t.maxBytes,
      artifactKinds: t.artifactKinds,
      partial: t.partial || {},
      unsupported: t.unsupported || {},
    })),
  };
}

export function detectTools(projectDir) {
  const contract = loadContract();
  let project = null;
  try {
    project = requireProject(projectDir);
  } catch {
    project = null;
  }
  const tools = contract.tools.map((t) => {
    if (!project) return { toolId: t.toolId, label: t.label, detected: false, evidence: null };
    const hit = (t.detect.dirs || []).find((d) => fs.existsSync(path.join(project, d)));
    return { toolId: t.toolId, label: t.label, detected: !!hit, evidence: hit || null };
  });
  return { project: { valid: !!project, path: project }, tools };
}

function resolveSource(project, tool, artifactKind, source) {
  if (source === undefined || source === null || source === "" || source === "sample") {
    const sample = SAMPLES[artifactKind];
    if (!sample) throw new HostCompatError("SAMPLE_UNAVAILABLE", `no sample for ${artifactKind}`);
    return { content: sample, info: { kind: "sample" } };
  }
  if (typeof source !== "string" || !safeRelative(source) || isProtectedPath(source)) {
    throw new HostCompatError("INVALID_SOURCE", "source must be 'sample' or a safe project-relative path");
  }
  const abs = path.resolve(project, source);
  if (!abs.startsWith(project + path.sep)) {
    throw new HostCompatError("INVALID_SOURCE", "source escapes the project");
  }
  let real;
  try {
    real = fs.realpathSync(abs);
  } catch {
    throw new HostCompatError("INVALID_SOURCE", "source file not found");
  }
  if (!real.startsWith(project + path.sep)) {
    throw new HostCompatError("INVALID_SOURCE", "source escapes the project through a symlink");
  }
  const st = fs.statSync(real, { throwIfNoEntry: false });
  if (!st || !st.isFile()) throw new HostCompatError("INVALID_SOURCE", "source is not a file");
  if (st.size > tool.maxBytes) throw new HostCompatError("SOURCE_TOO_LARGE", "source exceeds the artifact byte cap");
  if (!/\.(md|mdc|txt)$/i.test(real)) throw new HostCompatError("INVALID_SOURCE", "source must be markdown/text");
  return { content: fs.readFileSync(real, "utf8"), info: { kind: "file", path: source } };
}

export function preview({ toolId, artifactKind, projectDir, source = "sample" } = {}) {
  const contract = loadContract();

  if (!ARTIFACT_KINDS.includes(artifactKind)) {
    throw new HostCompatError("UNKNOWN_ARTIFACT_KIND", `unknown artifact kind: ${artifactKind}`);
  }
  const kindDef = contract.artifactKinds[artifactKind];
  if (!kindDef.supported) {
    throw new HostCompatError("ARTIFACT_KIND_NOT_IN_PILOT", kindDef.reason || `${artifactKind} is out of pilot scope`);
  }
  const tool = getTool(contract, toolId);
  if (!tool) throw new HostCompatError("UNKNOWN_TOOL", `unknown tool: ${toolId}`);
  const status = tool.artifactKinds[artifactKind];
  if (status === "UNSUPPORTED") {
    throw new HostCompatError(
      "UNSUPPORTED_ARTIFACT",
      (tool.unsupported && tool.unsupported[artifactKind]) || `${toolId} does not support ${artifactKind}`
    );
  }

  const project = requireProject(projectDir);
  const destTemplate = tool.dest[artifactKind];
  if (!destTemplate) throw new HostCompatError("DEST_NOT_DEFINED", `${toolId} has no destination for ${artifactKind}`);

  const renderer = getRenderer(tool.renderer);
  if (!renderer) throw new HostCompatError("RENDERER_NOT_REGISTERED", `renderer ${tool.renderer} is not registered`);

  const src = resolveSource(project, tool, artifactKind, source);
  const rendered = renderer.render(src.content);
  if (rendered.error) throw new HostCompatError("RENDER_FAILED", `${tool.renderer}: ${rendered.error}`);

  const bytes = Buffer.byteLength(rendered.content, "utf8");
  if (bytes > tool.maxBytes) {
    throw new HostCompatError("ARTIFACT_TOO_LARGE", `rendered artifact exceeds ${tool.maxBytes} bytes`);
  }

  const dest = destTemplate.replace("{slug}", rendered.slug);
  let destAbs;
  try {
    destAbs = safeFile(project, dest);
  } catch (e) {
    throw new HostCompatError("UNSAFE_DESTINATION", `destination rejected: ${e.message}`);
  }

  const exists = fs.existsSync(destAbs);
  const current = exists ? fs.readFileSync(destAbs, "utf8") : "";
  const diff = computeDiff(current, rendered.content);

  return {
    schema: contract.schema,
    artifactKind,
    tool: {
      toolId: tool.toolId,
      label: tool.label,
      format: tool.format,
      installKind: tool.installKind,
      scope: tool.scope,
      trust: tool.trust,
      hostVersionRange: tool.hostVersionRange,
      spec: tool.spec,
    },
    compatibility: status,
    compatibilityReason:
      status === "PARTIAL"
        ? (tool.partial?.[artifactKind]?.reason || "Host supports a subset of the artifact fields.")
        : null,
    droppedFields: rendered.droppedFields || [],
    slug: rendered.slug,
    destination: dest,
    destinationAction: exists ? "UPDATE" : "CREATE",
    bytes,
    sha256: sha256(rendered.content),
    renderer: { id: renderer.id, hash: RENDERERS_HASH },
    source: src.info,
    diff,
    source_written: false,
    state_written: false,
    apply_available: false,
    note: "Preview only — no files were written; apply is not available in this pilot.",
  };
}
