import fs from "node:fs";
import path from "node:path";
import {
  registry,
  resolveSafePath,
  isProtectedPath,
  sanitizeErrorMessage,
  MAX_TEXT_BYTES,
  MAX_RAW_BYTES,
  DEFAULT_PACKAGE_ID,
  SecurityError,
} from "./security.js";
import { governanceService } from "./governance.js";
import { comparisonService } from "./comparison.js";
import { intakeService } from "./intake.js";
import { adoptionService } from "./adoption.js";
import { evaluationService } from "./evaluation.js";
import { stagingService } from "./staging.js";

const TEXT_EXTS = new Set([
  "md", "markdown", "txt", "py", "js", "jsx", "ts", "tsx", "json", "yaml", "yml",
  "toml", "cfg", "ini", "conf", "html", "htm", "css", "scss", "sh", "bash",
  "ps1", "bat", "cmd", "csv", "tsv", "log", "xml", "cff", "gitignore", "editorconfig",
]);

const IMAGE_EXTS = new Set(["svg", "png", "jpg", "jpeg", "gif", "webp", "ico", "bmp"]);

const MIME = {
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  ico: "image/x-icon",
  bmp: "image/bmp",
  json: "application/json; charset=utf-8",
  md: "text/markdown; charset=utf-8",
  txt: "text/plain; charset=utf-8",
};

const toPosix = (p) => p.replace(/\\/g, "/");
const extOf = (n) => (n.includes(".") ? n.split(".").pop().toLowerCase() : "");

/**
 * Read and parse JSON request body safely with size capping.
 */
function readJsonBody(req, maxBytes = 1_000_000) {
  return new Promise((resolve, reject) => {
    let raw = "";
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new SecurityError("Request payload exceeds limit", 413));
        return;
      }
      raw += chunk.toString("utf8");
    });
    req.on("end", () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new SecurityError("Invalid JSON in request body", 400));
      }
    });
    req.on("error", (err) => reject(err));
  });
}

/**
 * Recursively walk an approved directory tree safely.
 */
function walk(absDir, relBase, rootCanonical) {
  const out = [];
  let entries;
  try {
    entries = fs.readdirSync(absDir, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const e of entries) {
    const rel = relBase ? relBase + "/" + e.name : e.name;
    if (isProtectedPath(rel)) continue;

    const absP = path.join(absDir, e.name);

    if (e.isDirectory()) {
      out.push({
        name: e.name,
        rel,
        type: "dir",
        children: walk(absP, rel, rootCanonical),
      });
    } else {
      let size = 0;
      try {
        size = fs.statSync(absP).size;
      } catch {}
      out.push({
        name: e.name,
        rel,
        type: "file",
        ext: extOf(e.name),
        size,
      });
    }
  }

  out.sort((a, b) =>
    a.type !== b.type
      ? a.type === "dir" ? -1 : 1
      : a.name.localeCompare(b.name, "ar", { numeric: true })
  );
  return out;
}

/**
 * Handle incoming API requests with deterministic security validation.
 */
export async function handleApiRequest(req, res) {
  const send = (code, obj) => {
    res.statusCode = code;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.end(JSON.stringify(obj));
  };

  let u;
  try {
    u = new URL(req.url, "http://localhost");
  } catch {
    return send(400, { error: "Malformed request URL" });
  }

  if (!u.pathname.startsWith("/api/")) {
    return send(404, { error: "API route not found" });
  }

  try {
    // -------------------------------------------------------------------------
    // 1. Core Health & Explorer Roots
    // -------------------------------------------------------------------------
    if (u.pathname === "/api/health") {
      return send(200, {
        status: "OK",
        studio: "AGHR Governance Studio",
        version: "1.0.0",
        security: "CANONICAL_ROOT_ISOLATED",
        roots: registry.listRoots().length,
      });
    }

    if (u.pathname === "/api/roots") {
      return send(200, { roots: registry.listRoots() });
    }

    // -------------------------------------------------------------------------
    // 2. AGHR Governance Reference (M2)
    // -------------------------------------------------------------------------
    if (u.pathname === "/api/governance/packages") {
      return send(200, { packages: governanceService.listPackages() });
    }

    if (u.pathname === "/api/governance/summary") {
      const packageId = u.searchParams.get("packageId") || u.searchParams.get("package") || "";
      return send(200, governanceService.getSummary(packageId));
    }

    if (u.pathname === "/api/governance/rules") {
      const packageId = u.searchParams.get("packageId") || u.searchParams.get("package") || "";
      const search = u.searchParams.get("search") || "";
      const force = u.searchParams.get("force") || "";
      const source = u.searchParams.get("source") || "";
      const enforcementClass = u.searchParams.get("enforcementClass") || "";
      const rules = governanceService.getRules({ search, force, source, enforcementClass, packageId });
      return send(200, { rules, total: rules.length });
    }

    if (u.pathname === "/api/governance/rule") {
      const packageId = u.searchParams.get("packageId") || u.searchParams.get("package") || "";
      const id = u.searchParams.get("id");
      if (!id) return send(400, { error: "Rule id parameter is required" });
      const rule = governanceService.getRule(id, packageId);
      if (!rule) return send(404, { error: `Rule '${id}' not found` });
      return send(200, { rule });
    }

    if (u.pathname === "/api/governance/sources") {
      const packageId = u.searchParams.get("packageId") || u.searchParams.get("package") || "";
      const search = u.searchParams.get("search") || "";
      const publisher = u.searchParams.get("publisher") || "";
      const kind = u.searchParams.get("kind") || "";
      const sources = governanceService.getSources({ search, publisher, kind, packageId });
      return send(200, { sources, total: sources.length });
    }

    if (u.pathname === "/api/governance/source") {
      const packageId = u.searchParams.get("packageId") || u.searchParams.get("package") || "";
      const id = u.searchParams.get("id");
      if (!id) return send(400, { error: "Source id parameter is required" });
      const source = governanceService.getSource(id, packageId);
      if (!source) return send(404, { error: `Source '${id}' not found` });
      return send(200, { source });
    }

    if (u.pathname === "/api/governance/adapters") {
      const packageId = u.searchParams.get("packageId") || u.searchParams.get("package") || "";
      return send(200, { adapters: governanceService.getAdapters(packageId) });
    }

    if (u.pathname === "/api/governance/graph") {
      const packageId = u.searchParams.get("packageId") || u.searchParams.get("package") || "";
      return send(200, governanceService.getRelationshipGraph(packageId));
    }

    if (u.pathname === "/api/governance/compare") {
      const base = u.searchParams.get("base") || "aghr";
      const target = u.searchParams.get("target") || DEFAULT_PACKAGE_ID;
      const comparison = comparisonService.comparePackages(base, target);
      return send(200, { comparison });
    }

    if (u.pathname === "/api/governance/impact") {
      const ruleId = u.searchParams.get("ruleId") || u.searchParams.get("rule");
      if (!ruleId) return send(400, { error: "ruleId parameter is required" });
      const packageId = u.searchParams.get("packageId") || u.searchParams.get("package") || DEFAULT_PACKAGE_ID;
      const impact = comparisonService.analyzeRuleImpact(ruleId, {}, packageId);
      return send(200, { impact });
    }

    // -------------------------------------------------------------------------
    // 3. Intake and Change Management (M3)
    // -------------------------------------------------------------------------
    if (u.pathname === "/api/intake/submit" && req.method === "POST") {
      const body = await readJsonBody(req);
      const packet = intakeService.submitIntake(body);
      return send(201, { packet });
    }

    if (u.pathname === "/api/intake/packets") {
      return send(200, { packets: intakeService.listPackets() });
    }

    if (u.pathname === "/api/intake/packet") {
      const id = u.searchParams.get("id");
      if (!id) return send(400, { error: "Parameter 'id' is required" });
      const packet = intakeService.getPacket(id);
      if (!packet) return send(404, { error: `ChangePacket '${id}' not found` });
      return send(200, { packet });
    }

    // -------------------------------------------------------------------------
    // 4. Project Adoption Center (M4)
    // -------------------------------------------------------------------------
    if (u.pathname === "/api/adoption/candidates") {
      return send(200, { candidates: adoptionService.listCandidates() });
    }

    if (u.pathname === "/api/adoption/inspect" && req.method === "POST") {
      const body = await readJsonBody(req);
      if (!body.projectDir) return send(400, { error: "projectDir is required" });
      const inspection = adoptionService.inspectCandidate(body.projectDir);
      return send(200, { inspection });
    }

    if (u.pathname === "/api/adoption/prepare" && req.method === "POST") {
      const body = await readJsonBody(req);
      const plan = adoptionService.prepareAdoption(body);
      return send(200, { plan });
    }

    // -------------------------------------------------------------------------
    // 5. Compliance, Evidence & Evaluation (M5)
    // -------------------------------------------------------------------------
    if (u.pathname === "/api/evaluation/run-suite" && req.method === "POST") {
      const result = await evaluationService.runUnitTestSuite();
      return send(200, { result });
    }

    if (u.pathname === "/api/evaluation/check-package" && req.method === "POST") {
      const result = await evaluationService.runPackageCheck();
      return send(200, { result });
    }

    if (u.pathname === "/api/evaluation/history") {
      return send(200, { history: evaluationService.listEvaluationHistory() });
    }

    // -------------------------------------------------------------------------
    // 6. Governed Staging & Apply (M6)
    // -------------------------------------------------------------------------
    if (u.pathname === "/api/staging/create" && req.method === "POST") {
      const body = await readJsonBody(req);
      const manifest = stagingService.createStagingWorkspace(body);
      return send(201, { manifest });
    }

    if (u.pathname === "/api/staging/manifest") {
      const stagingId = u.searchParams.get("stagingId");
      if (!stagingId) return send(400, { error: "stagingId is required" });
      const manifest = stagingService.getStagingManifest(stagingId);
      if (!manifest) return send(404, { error: `Staging workspace '${stagingId}' not found` });
      return send(200, { manifest });
    }

    if (u.pathname === "/api/governed-apply" && req.method === "POST") {
      const body = await readJsonBody(req);
      const result = stagingService.applyStagedChanges(body);
      return send(200, { result });
    }

    if (u.pathname === "/api/governed-apply/rollback" && req.method === "POST") {
      const body = await readJsonBody(req);
      const result = stagingService.rollbackBackup(body);
      return send(200, { result });
    }

    // -------------------------------------------------------------------------
    // 7. Tree & File Retrieval (Preserved & Enhanced)
    // -------------------------------------------------------------------------
    const rootId = u.searchParams.get("rootId");
    const relPath = u.searchParams.get("rel") || "";
    const legacyDir = u.searchParams.get("dir");
    const legacyPath = u.searchParams.get("path");

    if (u.pathname === "/api/tree") {
      let safeTarget;
      if (rootId) {
        safeTarget = resolveSafePath({ rootId, relPath: "" });
      } else if (legacyDir) {
        safeTarget = resolveSafePath({ clientPath: legacyDir });
      } else {
        return send(400, { error: "Parameter 'rootId' or 'dir' is required" });
      }

      const st = fs.statSync(safeTarget.canonicalPath, { throwIfNoEntry: false });
      if (!st || !st.isDirectory()) {
        return send(404, { error: "Directory not found or inaccessible" });
      }

      const entries = walk(safeTarget.canonicalPath, "", safeTarget.root.path);
      return send(200, {
        rootId: safeTarget.root.id,
        path: toPosix(safeTarget.canonicalPath),
        name: safeTarget.root.name,
        entries,
      });
    }

    if (u.pathname === "/api/file") {
      let safeTarget;
      if (rootId && relPath) {
        safeTarget = resolveSafePath({ rootId, relPath });
      } else if (legacyPath) {
        safeTarget = resolveSafePath({ clientPath: legacyPath });
      } else {
        return send(400, { error: "Parameter 'path' or ('rootId' + 'rel') is required" });
      }

      const st = fs.statSync(safeTarget.canonicalPath, { throwIfNoEntry: false });
      if (!st || !st.isFile()) {
        return send(404, { error: "File not found" });
      }

      const ext = extOf(safeTarget.canonicalPath);
      const base = {
        rootId: safeTarget.root.id,
        rel: safeTarget.relativePath,
        path: toPosix(safeTarget.canonicalPath),
        name: path.basename(safeTarget.canonicalPath),
        ext,
        size: st.size,
      };

      if (IMAGE_EXTS.has(ext)) {
        if (st.size > MAX_RAW_BYTES) return send(200, { ...base, kind: "too-large" });
        return send(200, { ...base, kind: "image" });
      }

      if (!TEXT_EXTS.has(ext)) {
        return send(200, { ...base, kind: "binary" });
      }

      if (st.size > MAX_TEXT_BYTES) {
        return send(200, { ...base, kind: "too-large" });
      }

      const content = fs.readFileSync(safeTarget.canonicalPath, "utf8");
      return send(200, { ...base, kind: "text", content });
    }

    if (u.pathname === "/api/raw") {
      let safeTarget;
      if (rootId && relPath) {
        safeTarget = resolveSafePath({ rootId, relPath });
      } else if (legacyPath) {
        safeTarget = resolveSafePath({ clientPath: legacyPath });
      } else {
        return send(400, { error: "Parameter 'path' or ('rootId' + 'rel') is required" });
      }

      const st = fs.statSync(safeTarget.canonicalPath, { throwIfNoEntry: false });
      if (!st || !st.isFile()) {
        return send(404, { error: "File not found" });
      }

      if (st.size > MAX_RAW_BYTES) {
        return send(413, { error: "File exceeds maximum allowed raw payload size (8MB)" });
      }

      const ext = extOf(safeTarget.canonicalPath);
      res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
      res.setHeader("Content-Length", st.size);
      res.setHeader("X-Content-Type-Options", "nosniff");
      return fs.createReadStream(safeTarget.canonicalPath).pipe(res);
    }

    return send(404, { error: "Unknown API endpoint" });
  } catch (err) {
    const { error, status } = sanitizeErrorMessage(err);
    return send(status, { error });
  }
}
