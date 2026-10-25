import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(__dirname, "..");
export const AGHR_1_0_0_ROOT = path.resolve(
  PROJECT_ROOT,
  "governance_packages",
  "archive",
  "Agent_Governance_Harness_Reference_1.0.0_repository_baseline",
  "Agent_Governance_Harness_Reference_1.0.0"
);
export const GOVERNANCE_PACKAGES_ROOT = path.resolve(PROJECT_ROOT, "governance_packages");
export const AGHR_1_1_0_ROOT = path.resolve(
  GOVERNANCE_PACKAGES_ROOT,
  "archive",
  "Agent_Governance_Harness_Reference_1.1.0"
);
export const AGHR_MINIMAL_1_1_0_ROOT = path.resolve(
  GOVERNANCE_PACKAGES_ROOT,
  "archive",
  "AGHR_Minimal_1.1.0"
);
export const DATA_ROOT = path.resolve(PROJECT_ROOT, "data");
export const AGHR_1_2_0_ROOT = path.resolve(
  GOVERNANCE_PACKAGES_ROOT,
  "references",
  "Agent_Governance_Harness_Reference_1.2.0"
);
// Owner sign-off2026-10-26 promotes the existing pinned bytes without moving them.
export const AGHR_RC3_ROOT = path.join(GOVERNANCE_PACKAGES_ROOT, "candidates", "AGHR_rc3_Core_Candidate");
export const DEFAULT_PACKAGE_ID = "aghr_rc3";
// Disabled legacy evaluation tools retain their original source binding.
export const AGHR_ROOT = AGHR_1_2_0_ROOT;

export const MAX_TEXT_BYTES = 2_000_000; // 2 MB
export const MAX_RAW_BYTES = 8_000_000;  // 8 MB

export const PROTECTED_PATTERNS = [
  /^\.git($|[\\/])/i,
  /^\.env/i,
  /^\.ssh($|[\\/])/i,
  /node_modules($|[\\/])/i,
  /__pycache__($|[\\/])/i,
  /\.pyc$/i,
  /\.(key|pem|pfx|pkcs12|secret|credentials|token)$/i,
  /id_rsa/i,
  /id_ed25519/i,
  /\.DS_Store$/i,
  /Thumbs\.db$/i,
];

export class SecurityError extends Error {
  constructor(message, status = 403) {
    super(message);
    this.name = "SecurityError";
    this.status = status;
  }
}

/**
 * Registry of explicitly approved roots.
 */
class RootRegistry {
  constructor() {
    this._roots = new Map();
    this._initializeDefaultRoots();
  }

  _initializeDefaultRoots() {
    if (fs.existsSync(AGHR_RC3_ROOT)) {
      this.registerRoot({id: "aghr_rc3", name: "AGHR rc.3 — Official Local Reference", path: AGHR_RC3_ROOT,
        type: "reference", description: "Owner-accepted Studio v1.0.0 local reference; existing projects are not migrated", readOnly: true});
    }
    // Historical baseline retains its stable ID for explicit selection/comparison.
    if (fs.existsSync(AGHR_1_0_0_ROOT)) {
      this.registerRoot({
        id: "aghr",
        name: "AGHR Reference 1.0.0",
        path: AGHR_1_0_0_ROOT,
        type: "reference",
        description: "Authoritative Agent Governance and Harness Reference v1.0.0",
        readOnly: true,
      });
    }

    // Previous full reference, retained read-only for comparison.
    if (fs.existsSync(AGHR_1_1_0_ROOT)) {
      this.registerRoot({
        id: "aghr_1_1_0",
        name: "AGHR Reference 1.1.0 (Full, Archived)",
        path: AGHR_1_1_0_ROOT,
        type: "reference",
        description: "Archived AGHR v1.1.0 reference for historical comparison",
        readOnly: true,
      });
    }

    // Previous minimal distribution, retained read-only for comparison.
    if (fs.existsSync(AGHR_MINIMAL_1_1_0_ROOT)) {
      this.registerRoot({
        id: "aghr_minimal_1_1_0",
        name: "AGHR Minimal 1.1.0 (Archived)",
        path: AGHR_MINIMAL_1_1_0_ROOT,
        type: "reference",
        description: "Archived AGHR Minimal v1.1.0 (Core & Contracts)",
        readOnly: true,
      });
    }

    if (fs.existsSync(AGHR_1_2_0_ROOT)) {
      this.registerRoot({
        id: "aghr_1_2_0",
        name: "AGHR Reference 1.2.0",
        path: AGHR_1_2_0_ROOT,
        type: "reference",
        description: "Owner-directed updated AGHR reference with governed learning",
        readOnly: true,
      });
    }

    // Optional local candidate projects in data/
    if (fs.existsSync(DATA_ROOT)) {
      const entries = fs.readdirSync(DATA_ROOT, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith(".")) {
          const fullPath = path.join(DATA_ROOT, entry.name);
          this.registerRoot({
            id: `data-${entry.name}`,
            name: entry.name,
            path: fullPath,
            type: "candidate_project",
            description: `Candidate project / skill under data/${entry.name}`,
            readOnly: true,
          });
        }
      }
    }
  }

  registerRoot({ id, name, path: dirPath, type = "project", description = "", readOnly = true }) {
    if (!id || typeof id !== "string") throw new SecurityError("Invalid root identifier");
    const canonical = fs.realpathSync(path.resolve(dirPath));
    if (!fs.statSync(canonical).isDirectory()) {
      throw new SecurityError(`Root ${id} is not a valid directory`);
    }
    this._roots.set(id, {
      id,
      name,
      path: canonical,
      type,
      description,
      readOnly,
    });
  }

  getRoot(id) {
    return this._roots.get(id);
  }

  listRoots() {
    return Array.from(this._roots.values()).map((r) => ({
      id: r.id,
      name: r.name,
      path: r.path.replace(/\\/g, "/"),
      type: r.type,
      description: r.description,
      readOnly: r.readOnly,
      isDefault: r.id === DEFAULT_PACKAGE_ID,
    }));
  }

  findRootForPath(targetPath) {
    try {
      const canonical = fs.realpathSync(path.resolve(targetPath));
      for (const root of this._roots.values()) {
        if (canonical === root.path || canonical.startsWith(root.path + path.sep)) {
          return { root, canonical };
        }
      }
    } catch {
      return null;
    }
    return null;
  }
}

export const registry = new RootRegistry();

/**
 * Verify whether a file or path matches protected sensitive patterns.
 */
export function isProtectedPath(relPath) {
  const normalized = relPath.replace(/\\/g, "/").replace(/^\/+/, "");
  const baseName = path.basename(normalized);
  for (const pat of PROTECTED_PATTERNS) {
    if (pat.test(normalized) || pat.test(baseName)) {
      return true;
    }
  }
  return false;
}

/**
 * Validate and safely resolve a path within an approved root.
 */
export function resolveSafePath({ rootId, relPath, clientPath }) {
  let targetCanonical;
  let targetRoot;

  if (rootId) {
    const root = registry.getRoot(rootId);
    if (!root) {
      throw new SecurityError(`Unapproved or unknown root identifier: '${rootId}'`, 403);
    }
    targetRoot = root;

    // Sanitize relPath
    const sanitizedRel = (relPath || "").replace(/\\/g, "/").trim();
    if (sanitizedRel.includes("\0")) {
      throw new SecurityError("Null byte injection detected", 400);
    }
    // Disallow absolute path in relPath or parent traversal
    if (path.isAbsolute(sanitizedRel)) {
      throw new SecurityError("Relative path expected, absolute provided", 400);
    }
    const resolved = path.resolve(root.path, sanitizedRel);
    
    // Check containment before canonicalizing (in case target does not exist yet)
    const normResolved = path.normalize(resolved);
    if (!normResolved.startsWith(root.path + path.sep) && normResolved !== root.path) {
      throw new SecurityError("Path traversal attempt detected", 403);
    }

    // Check protected file/directory pattern before disk lookup (prevents existence oracle)
    if (isProtectedPath(sanitizedRel)) {
      throw new SecurityError("Access denied: path is protected or sensitive", 403);
    }

    try {
      targetCanonical = fs.realpathSync(resolved);
    } catch (e) {
      if (e.code === "ENOENT") {
        throw new SecurityError("File or directory not found", 404);
      }
      throw new SecurityError("Filesystem resolution failed", 500);
    }

    if (!targetCanonical.startsWith(root.path + path.sep) && targetCanonical !== root.path) {
      throw new SecurityError("Symlink escape detected: path escapes approved root", 403);
    }
  } else if (clientPath) {
    // Legacy support: match clientPath strictly against approved roots
    if (typeof clientPath !== "string" || clientPath.includes("\0")) {
      throw new SecurityError("Invalid path parameter", 400);
    }
    const match = registry.findRootForPath(clientPath);
    if (!match) {
      throw new SecurityError("Access denied: path is outside approved roots", 403);
    }
    targetRoot = match.root;
    targetCanonical = match.canonical;
    const rel = path.relative(targetRoot.path, targetCanonical);
    if (isProtectedPath(rel)) {
      throw new SecurityError("Access denied: path is protected or sensitive", 403);
    }
  } else {
    throw new SecurityError("Missing path or root parameter", 400);
  }

  // Calculate relative path inside root
  const relativeInside = path.relative(targetRoot.path, targetCanonical);
  if (isProtectedPath(relativeInside)) {
    throw new SecurityError("Access denied: path is protected or sensitive", 403);
  }

  return {
    root: targetRoot,
    canonicalPath: targetCanonical,
    relativePath: relativeInside.replace(/\\/g, "/"),
  };
}

/**
 * Sanitize error message to prevent system path and stack leakage.
 */
export function sanitizeErrorMessage(err) {
  if (err instanceof SecurityError) {
    return { error: err.message, status: err.status };
  }
  // Generic error
  return { error: "An internal server error occurred", status: 500 };
}
