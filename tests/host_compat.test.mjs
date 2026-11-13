// Host-artifact compatibility pilot: contract, determinism, safety, no-write.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { validateContract, loadContract, ARTIFACT_KINDS, CONTRACT_PATH } from "../server/host-compat/contract.mjs";
import { renderers, RENDERERS_HASH, slugify } from "../server/host-compat/renderers.mjs";
import { preview, detectTools, listTools, HostCompatError } from "../server/host-compat/preview.mjs";
import { SAMPLES } from "../server/host-compat/samples.mjs";
import { handleApiRequest } from "../server/api.js";

const sha = (s) => crypto.createHash("sha256").update(s, "utf8").digest("hex");

function tempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aghr-hostcompat-"));
}
function snapshot(dir) {
  const out = [];
  const walk = (d, rel = "") => {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) { out.push(`dir:${r}`); walk(path.join(d, e.name), r); }
      else out.push(`file:${r}:${sha(fs.readFileSync(path.join(d, e.name)))}`);
    }
  };
  walk(dir);
  return out;
}
function mockReq(url, method = "GET") {
  return { url, method, headers: { host: "localhost:5180" }, on(event, handler) { if (event === "end") handler(); return this; } };
}
function mockRes() {
  let status = 200;
  const headers = {};
  const chunks = [];
  return {
    get statusCode() { return status; },
    set statusCode(v) { status = v; },
    setHeader(k, v) { headers[k.toLowerCase()] = v; },
    end(d) { if (d) chunks.push(Buffer.from(d)); },
    json() { return JSON.parse(Buffer.concat(chunks).toString("utf8")); },
    statusOf() { return status; },
  };
}

// ---------------------------------------------------------------------------
// Contract validity
// ---------------------------------------------------------------------------
test("HostCompat: shipped contract is valid and covers all four artifact kinds", () => {
  const c = loadContract();
  assert.equal(c.schema, "aghr.host-compat/1");
  for (const k of ARTIFACT_KINDS) assert.ok(c.artifactKinds[k], `missing ${k}`);
  assert.equal(c.tools.length, 2);
  const claude = c.tools.find((t) => t.toolId === "claude-code");
  const cursor = c.tools.find((t) => t.toolId === "cursor");
  assert.equal(claude.artifactKinds.AGENT_DEFINITION, "PARTIAL");
  assert.equal(cursor.artifactKinds.PROJECT_RULE, "SUPPORTED");
  assert.equal(claude.trust, "UNVERIFIED");
});

test("HostCompat: invalid contracts are rejected (absolute dest, missing {slug}, duplicate tool)", () => {
  const base = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
  const bad1 = structuredClone(base); bad1.tools[0].dest.AGENT_DEFINITION = "/etc/agents/{slug}.md";
  assert.throws(() => validateContract(bad1), /HOST_COMPAT_CONTRACT_INVALID/);
  const bad2 = structuredClone(base); bad2.tools[0].dest.AGENT_DEFINITION = ".claude/agents/file.md";
  assert.throws(() => validateContract(bad2), /{slug}/);
  const bad3 = structuredClone(base); bad3.tools.push(structuredClone(bad3.tools[0]));
  assert.throws(() => validateContract(bad3), /duplicate toolId/);
  const bad4 = structuredClone(base); delete bad4.tools[0].renderer;
  assert.throws(() => validateContract(bad4), /renderer required/);
});

// ---------------------------------------------------------------------------
// Determinism + honest compatibility
// ---------------------------------------------------------------------------
test("HostCompat: Claude Code agent rendering is deterministic and drops non-host fields", () => {
  const a = renderers["claude-agent-md@1"].render(SAMPLES.AGENT_DEFINITION);
  const b = renderers["claude-agent-md@1"].render(SAMPLES.AGENT_DEFINITION);
  assert.equal(a.content, b.content);
  assert.equal(sha(a.content), sha(b.content));
  assert.equal(a.slug, "code-reviewer");
  assert.deepEqual(a.droppedFields.sort(), ["color", "emoji", "vibe"]);
  assert.match(a.content, /^---\nname: Code Reviewer\ndescription: /);
  assert.doesNotMatch(a.content, /^color:/m);
  assert.equal(RENDERERS_HASH.startsWith("sha256:"), true);
});

test("HostCompat: Cursor project-rule rendering is deterministic and keeps host fields", () => {
  const a = renderers["cursor-mdc@1"].render(SAMPLES.PROJECT_RULE);
  assert.equal(a.slug, "code-review");
  assert.deepEqual(a.droppedFields, []);
  assert.match(a.content, /^---\ndescription: /);
  assert.match(a.content, /globs: \["src\/\*\*"\]/);
  assert.match(a.content, /alwaysApply: false/);
});

test("HostCompat: slugify produces safe slugs and rejects empty input", () => {
  assert.equal(slugify("Code Reviewer"), "code-reviewer");
  assert.equal(slugify("  A/B  "), "a-b");
  assert.equal(slugify("////"), "");
});

// ---------------------------------------------------------------------------
// Unsupported combinations fail closed
// ---------------------------------------------------------------------------
test("HostCompat: unsupported tool/kind combinations are rejected, not misrendered", () => {
  const tmp = tempProject();
  assert.throws(
    () => preview({ toolId: "claude-code", artifactKind: "PROJECT_RULE", projectDir: tmp }),
    (e) => e instanceof HostCompatError && e.code === "UNSUPPORTED_ARTIFACT"
  );
  assert.throws(
    () => preview({ toolId: "cursor", artifactKind: "AGENT_DEFINITION", projectDir: tmp }),
    (e) => e instanceof HostCompatError && e.code === "UNSUPPORTED_ARTIFACT"
  );
  assert.throws(
    () => preview({ toolId: "claude-code", artifactKind: "AGENT_SKILL", projectDir: tmp }),
    (e) => e instanceof HostCompatError && e.code === "ARTIFACT_KIND_NOT_IN_PILOT"
  );
});

// ---------------------------------------------------------------------------
// Path safety
// ---------------------------------------------------------------------------
test("HostCompat: unsafe destination segments are rejected", () => {
  const tmp = tempProject();
  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
  // Absolute and traversal templates are rejected at contract validation time.
  const t = structuredClone(contract);
  t.tools[0].dest.AGENT_DEFINITION = ".claude/../escape/{slug}.md";
  assert.throws(() => validateContract(t), /HOST_COMPAT_CONTRACT_INVALID/);
});

test("HostCompat: symlinked destination segment is rejected (safeFile reuse)", (t) => {
  const tmp = tempProject();
  const original = fs.lstatSync;
  t.mock.method(fs, "lstatSync", function (p, opts) {
    if (typeof p === "string" && p.includes(`${path.sep}agents`)) return { isSymbolicLink: () => true };
    return original.call(this, p, opts);
  });
  assert.throws(
    () => preview({ toolId: "claude-code", artifactKind: "AGENT_DEFINITION", projectDir: tmp }),
    (e) => e instanceof HostCompatError && e.code === "UNSAFE_DESTINATION"
  );
});

test("HostCompat: source outside the project or too large is rejected", () => {
  const tmp = tempProject();
  fs.writeFileSync(path.join(tmp, "big.md"), "# " + "x".repeat(300000), "utf8");
  assert.throws(
    () => preview({ toolId: "claude-code", artifactKind: "AGENT_DEFINITION", projectDir: tmp, source: "big.md" }),
    (e) => e instanceof HostCompatError && e.code === "SOURCE_TOO_LARGE"
  );
  assert.throws(
    () => preview({ toolId: "claude-code", artifactKind: "AGENT_DEFINITION", projectDir: tmp, source: "../escape.md" }),
    (e) => e instanceof HostCompatError && e.code === "INVALID_SOURCE"
  );
});

// ---------------------------------------------------------------------------
// No-write guarantee
// ---------------------------------------------------------------------------
test("HostCompat: preview writes nothing to the project or state", () => {
  const tmp = tempProject();
  fs.mkdirSync(path.join(tmp, ".claude"), { recursive: true });
  const before = snapshot(tmp);
  const result = preview({ toolId: "claude-code", artifactKind: "AGENT_DEFINITION", projectDir: tmp });
  const after = snapshot(tmp);
  assert.deepEqual(after, before);
  assert.equal(result.source_written, false);
  assert.equal(result.state_written, false);
  assert.equal(result.apply_available, false);
  assert.equal(result.destination, ".claude/agents/code-reviewer.md");
  assert.equal(result.destinationAction, "CREATE");
  assert.equal(fs.existsSync(path.join(tmp, ".claude", "agents")), false);
});

test("HostCompat: detection is read-only and never claims availability", () => {
  const tmp = tempProject();
  fs.mkdirSync(path.join(tmp, ".cursor"), { recursive: true });
  const before = snapshot(tmp);
  const d = detectTools(tmp);
  assert.deepEqual(snapshot(tmp), before);
  const claude = d.tools.find((x) => x.toolId === "claude-code");
  const cursor = d.tools.find((x) => x.toolId === "cursor");
  assert.equal(claude.detected, false);
  assert.equal(cursor.detected, true);
  assert.equal(cursor.evidence, ".cursor");
  const invalid = detectTools(path.join(tmp, "does-not-exist"));
  assert.equal(invalid.project.valid, false);
  assert.equal(invalid.tools.every((x) => x.detected === false), true);
});

// ---------------------------------------------------------------------------
// API (read-only GET)
// ---------------------------------------------------------------------------
test("HostCompat API: tools + preview + unsupported are read-only and correct", async () => {
  const tmp = tempProject();
  const before = snapshot(tmp);

  const toolsRes = mockRes();
  await handleApiRequest(mockReq("/api/host-compat/tools"), toolsRes);
  assert.equal(toolsRes.statusOf(), 200);
  const tools = toolsRes.json().compatibility;
  assert.equal(tools.tools.length, 2);
  assert.equal(tools.artifactKinds.AGENT_DEFINITION.label, "Agent Definition");

  const previewRes = mockRes();
  await handleApiRequest(
    mockReq(`/api/host-compat/preview?tool=claude-code&artifactKind=AGENT_DEFINITION&project=${encodeURIComponent(tmp)}&source=sample`),
    previewRes
  );
  assert.equal(previewRes.statusOf(), 200);
  const p = previewRes.json().preview;
  assert.equal(p.compatibility, "PARTIAL");
  assert.equal(p.destination, ".claude/agents/code-reviewer.md");
  assert.deepEqual(p.droppedFields.sort(), ["color", "emoji", "vibe"]);
  assert.equal(p.source_written, false);

  const unsupportedRes = mockRes();
  await handleApiRequest(
    mockReq(`/api/host-compat/preview?tool=claude-code&artifactKind=PROJECT_RULE&project=${encodeURIComponent(tmp)}&source=sample`),
    unsupportedRes
  );
  assert.equal(unsupportedRes.statusOf(), 400);
  assert.equal(unsupportedRes.json().code, "UNSUPPORTED_ARTIFACT");

  assert.deepEqual(snapshot(tmp), before, "API preview must not write");
});

test("HostCompat: listTools exposes partial and unsupported evidence honestly", () => {
  const l = listTools();
  const claude = l.tools.find((t) => t.toolId === "claude-code");
  const cursor = l.tools.find((t) => t.toolId === "cursor");
  assert.equal(claude.artifactKinds.AGENT_DEFINITION, "PARTIAL");
  assert.ok(claude.partial.AGENT_DEFINITION.reason);
  assert.equal(cursor.artifactKinds.PROJECT_RULE, "SUPPORTED");
  assert.ok(cursor.unsupported.AGENT_DEFINITION);
  assert.equal(l.tools.every((t) => t.trust === "UNVERIFIED"), true);
});
