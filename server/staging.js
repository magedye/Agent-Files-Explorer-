import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PROJECT_ROOT, isProtectedPath } from "./security.js";

const STAGING_DIR = path.join(PROJECT_ROOT, ".governance", "staging");
const BACKUP_DIR = path.join(PROJECT_ROOT, ".governance", "backups");
const AUDIT_FILE = path.join(PROJECT_ROOT, ".governance", "audit.jsonl");

function ensureDirs() {
  for (const d of [STAGING_DIR, BACKUP_DIR]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function fileSha256(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return sha256(fs.readFileSync(filePath));
}

/**
 * Compute unified diff between old and new text lines.
 */
export function computeDiff(oldText = "", newText = "") {
  const oldLines = oldText.split(/\r?\n/);
  const newLines = newText.split(/\r?\n/);
  const diffLines = [];

  let i = 0, j = 0;
  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      diffLines.push(`  ${oldLines[i]}`);
      i++;
      j++;
    } else {
      if (i < oldLines.length) {
        diffLines.push(`- ${oldLines[i]}`);
        i++;
      }
      if (j < newLines.length) {
        diffLines.push(`+ ${newLines[j]}`);
        j++;
      }
    }
  }

  return diffLines.join("\n");
}

/**
 * Governed Staging and Apply Service.
 */
class StagingService {
  constructor() {
    ensureDirs();
  }

  /**
   * Stage planned changes into an isolated staging workspace.
   */
  createStagingWorkspace({ packetId, targetProjectDir, plannedFiles = [] }) {
    ensureDirs();
    const stagingId = `STAGE-${packetId || Date.now().toString(36).toUpperCase()}`;
    const workspaceDir = path.join(STAGING_DIR, stagingId);
    if (!fs.existsSync(workspaceDir)) fs.mkdirSync(workspaceDir, { recursive: true });

    const absProject = path.resolve(targetProjectDir);
    const stagedEntries = [];

    for (const item of plannedFiles) {
      if (isProtectedPath(item.path)) {
        throw new Error(`Cannot stage protected path: ${item.path}`);
      }

      const targetPath = path.join(absProject, item.path);
      const currentExists = fs.existsSync(targetPath);
      const currentContent = currentExists ? fs.readFileSync(targetPath, "utf8") : "";
      const currentSha = currentExists ? fileSha256(targetPath) : null;

      // Write to isolated staging directory
      const stagedFilePath = path.join(workspaceDir, item.path);
      const stagedFileDir = path.dirname(stagedFilePath);
      if (!fs.existsSync(stagedFileDir)) fs.mkdirSync(stagedFileDir, { recursive: true });
      fs.writeFileSync(stagedFilePath, item.proposedContent, "utf8");

      const diff = computeDiff(currentContent, item.proposedContent);

      stagedEntries.push({
        relPath: item.path,
        action: currentExists ? "UPDATE" : "CREATE",
        preconditionSha256: currentSha,
        stagedSha256: sha256(item.proposedContent),
        diff,
      });
    }

    const manifest = {
      stagingId,
      packetId,
      targetProjectDir: absProject.replace(/\\/g, "/"),
      createdAt: new Date().toISOString(),
      status: "STAGED_READY_FOR_AUTHORIZATION",
      files: stagedEntries,
    };

    fs.writeFileSync(path.join(workspaceDir, "staging-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
    return manifest;
  }

  getStagingManifest(stagingId) {
    const manifestPath = path.join(STAGING_DIR, stagingId, "staging-manifest.json");
    if (!fs.existsSync(manifestPath)) return null;
    return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  }

  /**
   * Apply staged changes with strict precondition and authorization checks.
   */
  applyStagedChanges({ stagingId, authorizationToken }) {
    if (authorizationToken !== "AUTHORIZED_BY_PROJECT_OWNER") {
      throw new Error("Authorization denied: valid authorizationToken required for apply.");
    }

    const manifest = this.getStagingManifest(stagingId);
    if (!manifest) throw new Error(`Staging workspace not found: ${stagingId}`);

    const absProject = path.resolve(manifest.targetProjectDir);
    const workspaceDir = path.join(STAGING_DIR, stagingId);

    // 1. Precondition verification: ensure no target file drifted
    for (const f of manifest.files) {
      const targetPath = path.join(absProject, f.relPath);
      const currentSha = fileSha256(targetPath);
      if (currentSha !== f.preconditionSha256) {
        throw new Error(
          `STALE_PRECONDITION: Target file '${f.relPath}' has changed since staging. Expected SHA ${f.preconditionSha256}, got ${currentSha}. Apply aborted.`
        );
      }
    }

    // 2. Create recovery backup snapshot
    const backupId = `BACKUP-${Date.now().toString(36).toUpperCase()}`;
    const backupDir = path.join(BACKUP_DIR, backupId);
    fs.mkdirSync(backupDir, { recursive: true });

    for (const f of manifest.files) {
      const targetPath = path.join(absProject, f.relPath);
      if (fs.existsSync(targetPath)) {
        const backupFilePath = path.join(backupDir, f.relPath);
        const backupFileParent = path.dirname(backupFilePath);
        if (!fs.existsSync(backupFileParent)) fs.mkdirSync(backupFileParent, { recursive: true });
        fs.copyFileSync(targetPath, backupFilePath);
      }
    }

    // 3. Atomically apply staged changes to target project
    const appliedFiles = [];
    for (const f of manifest.files) {
      const stagedFilePath = path.join(workspaceDir, f.relPath);
      const targetPath = path.join(absProject, f.relPath);
      const targetParent = path.dirname(targetPath);
      if (!fs.existsSync(targetParent)) fs.mkdirSync(targetParent, { recursive: true });

      fs.copyFileSync(stagedFilePath, targetPath);
      appliedFiles.push(f.relPath);
    }

    // 4. Record audit entry
    const auditRecord = {
      timestamp: new Date().toISOString(),
      action: "GOVERNED_APPLY",
      stagingId,
      backupId,
      targetProject: manifest.targetProjectDir,
      filesApplied: appliedFiles,
      authorizedBy: authorizationToken,
    };
    fs.appendFileSync(AUDIT_FILE, JSON.stringify(auditRecord) + "\n", "utf8");

    // 5. Update staging status
    manifest.status = "APPLIED";
    manifest.appliedAt = new Date().toISOString();
    manifest.backupId = backupId;
    fs.writeFileSync(path.join(workspaceDir, "staging-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

    return {
      status: "APPLY_SUCCESS",
      stagingId,
      backupId,
      filesApplied: appliedFiles,
    };
  }

  /**
   * Rollback changes from a backup snapshot.
   */
  rollbackBackup({ backupId }) {
    const backupDir = path.join(BACKUP_DIR, backupId);
    if (!fs.existsSync(backupDir)) throw new Error(`Backup snapshot not found: ${backupId}`);

    // Read audit log to find target project
    let targetProject = null;
    if (fs.existsSync(AUDIT_FILE)) {
      const lines = fs.readFileSync(AUDIT_FILE, "utf8").split(/\r?\n/).filter(Boolean);
      for (const line of lines.reverse()) {
        try {
          const rec = JSON.parse(line);
          if (rec.backupId === backupId) {
            targetProject = rec.targetProject;
            break;
          }
        } catch {}
      }
    }

    if (!targetProject) throw new Error("Could not determine target project from audit log for rollback");

    // Restore files
    const restored = [];
    const walkBackup = (dir, relBase = "") => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        const rel = relBase ? relBase + "/" + e.name : e.name;
        if (e.isDirectory()) walkBackup(full, rel);
        else {
          const target = path.join(targetProject, rel);
          fs.copyFileSync(full, target);
          restored.push(rel);
        }
      }
    };
    walkBackup(backupDir);

    // Audit rollback
    fs.appendFileSync(
      AUDIT_FILE,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        action: "GOVERNED_ROLLBACK",
        backupId,
        targetProject,
        filesRestored: restored,
      }) + "\n",
      "utf8"
    );

    return {
      status: "ROLLBACK_SUCCESS",
      backupId,
      filesRestored: restored,
    };
  }
}

export const stagingService = new StagingService();
