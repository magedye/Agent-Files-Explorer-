import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PROJECT_ROOT, GOVERNANCE_PACKAGES_ROOT, isProtectedPath } from "./security.js";
import {consumeAuthorization} from './studio/write-authorization.js';

function ensureDirs(dirs) {
  for (const d of dirs) {
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

export function stagingScope(action,resourceId,projectDir,proposal) {
  const root=fs.realpathSync(projectDir);
  if(root===GOVERNANCE_PACKAGES_ROOT||root.startsWith(GOVERNANCE_PACKAGES_ROOT+path.sep))throw Error('Protected governance root');
  return {workspace_id:'legacy-local',target_project:root,action,resource_id:resourceId,proposal_version_hash:'sha256:'+sha256(JSON.stringify(proposal))};
}
function safeFile(root,name) {
  if(typeof name!=='string'||path.isAbsolute(name)||name.includes('\\')||name.split('/').some(p=>!p||p==='.'||p==='..')||isProtectedPath(name))throw Error('Unsafe staged path');
  let p=path.parse(path.resolve(root)).root;for(const bit of path.relative(p,path.resolve(root)).split(path.sep)){p=path.join(p,bit);if(fs.lstatSync(p,{throwIfNoEntry:false})?.isSymbolicLink())throw Error('Staging reparse point');}
  for(const bit of name.split('/')){p=path.join(p,bit);if(fs.lstatSync(p,{throwIfNoEntry:false})?.isSymbolicLink())throw Error('Staging reparse point');}return p;
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
export class StagingService {
  constructor({storageRoot=path.join(PROJECT_ROOT,'.governance')}={}) {
    if(!path.isAbsolute(storageRoot)||storageRoot===GOVERNANCE_PACKAGES_ROOT||storageRoot.startsWith(GOVERNANCE_PACKAGES_ROOT+path.sep))throw Error('Unsafe staging storage');
    this.stagingDir=path.join(storageRoot,'staging');this.backupDir=path.join(storageRoot,'backups');this.auditFile=path.join(storageRoot,'audit.jsonl');
  }

  /**
   * Stage planned changes into an isolated staging workspace.
   */
  createStagingWorkspace({ packetId, targetProjectDir, plannedFiles = [] }, authorization) {
    if(packetId&&!/^[\w-]+$/.test(packetId))throw Error('Unsafe packet id');
    for(const f of plannedFiles)safeFile(path.resolve(targetProjectDir),f.path);
    safeFile(this.stagingDir,'staging-manifest.json');
    consumeAuthorization(authorization,stagingScope('staging.create',packetId||'new-staging',targetProjectDir,plannedFiles));
    ensureDirs([this.stagingDir,this.backupDir]);
    const stagingId = `STAGE-${packetId || Date.now().toString(36).toUpperCase()}`;
    if(!/^STAGE-[\w-]+$/.test(stagingId))throw Error('Unsafe staging id');
    const workspaceDir = path.join(this.stagingDir, stagingId);
    safeFile(this.stagingDir,stagingId);
    if (!fs.existsSync(workspaceDir)) fs.mkdirSync(workspaceDir, { recursive: true });

    const absProject = path.resolve(targetProjectDir);
    const stagedEntries = [];

    for (const item of plannedFiles) {
      if (isProtectedPath(item.path)) {
        throw new Error(`Cannot stage protected path: ${item.path}`);
      }

      const targetPath = safeFile(absProject, item.path);
      const currentExists = fs.existsSync(targetPath);
      const currentContent = currentExists ? fs.readFileSync(targetPath, "utf8") : "";
      const currentSha = currentExists ? fileSha256(targetPath) : null;

      // Write to isolated staging directory
      const stagedFilePath = safeFile(workspaceDir, item.path);
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
    if(!/^STAGE-[\w-]+$/.test(stagingId))throw Error('Unsafe staging id');
    const manifestPath = path.join(this.stagingDir, stagingId, "staging-manifest.json");
    if (!fs.existsSync(manifestPath)) return null;
    return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  }

  /**
   * Issue a short-lived, cryptographically secure authorization token for a staged workspace.
   */
  issueAuthorizationToken(stagingId, authorization) {
    const manifest = this.getStagingManifest(stagingId);
    if (!manifest) throw new Error(`Staging workspace not found: ${stagingId}`);
    const actor=consumeAuthorization(authorization,stagingScope('staging.authorize',stagingId,manifest.targetProjectDir,manifest.files));

    const nonce = crypto.randomBytes(16).toString("hex");
    const payload = `${stagingId}:${manifest.createdAt}:${nonce}`;
    const token = `AUTH-${sha256(payload).slice(0, 32)}`;

    // Store active token in workspace manifest
    manifest.activeAuthorization = {
      token,
      issuedAt: new Date().toISOString(),
      approverIdentity:actor.authenticated_actor,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min expiry
    };

    const workspaceDir = path.join(this.stagingDir, stagingId);
    fs.writeFileSync(path.join(workspaceDir, "staging-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
    return token;
  }

  /**
   * Apply staged changes with strict precondition and authorization checks.
   */
  applyStagedChanges({ stagingId, authorizationToken }, authorization) {
    const manifest = this.getStagingManifest(stagingId);
    if (!manifest) throw new Error(`Staging workspace not found: ${stagingId}`);

    // A dynamic token is additional binding; it never replaces server authority.
    const isDynamicValid = manifest.activeAuthorization &&
      manifest.activeAuthorization.token === authorizationToken &&
      new Date(manifest.activeAuthorization.expiresAt) > new Date();

    if (!isDynamicValid) {
      throw new Error("Authorization denied: valid authorizationToken required for apply.");
    }

    const absProject = path.resolve(manifest.targetProjectDir);
    const workspaceDir = path.join(this.stagingDir, stagingId);

    // 1. Precondition verification: ensure no target file drifted
    for (const f of manifest.files) {
      const targetPath = safeFile(absProject, f.relPath);
      if(fileSha256(safeFile(workspaceDir,f.relPath))!==f.stagedSha256)throw Error('STAGED_CONTENT_CHANGED');
      const currentSha = fileSha256(targetPath);
      if (currentSha !== f.preconditionSha256) {
        throw new Error(
          `STALE_PRECONDITION: Target file '${f.relPath}' has changed since staging. Expected SHA ${f.preconditionSha256}, got ${currentSha}. Apply aborted.`
        );
      }
    }

    const actor=consumeAuthorization(authorization,stagingScope('adoption.apply',stagingId,absProject,manifest.files));
    // 2. Create recovery backup snapshot
    const backupId = `BACKUP-${Date.now().toString(36).toUpperCase()}`;
    const backupDir = path.join(this.backupDir, backupId);
    safeFile(this.backupDir,backupId);
    fs.mkdirSync(backupDir, { recursive: true });

    for (const f of manifest.files) {
      const targetPath = safeFile(absProject, f.relPath);
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
      const stagedFilePath = safeFile(workspaceDir, f.relPath);
      const targetPath = safeFile(absProject, f.relPath);
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
      authorizedBy: actor.authenticated_actor,
      actorRole: actor.server_resolved_role,
    };
    fs.appendFileSync(this.auditFile, JSON.stringify(auditRecord) + "\n", "utf8");

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
  backupProposal(backupId) {
    if(!/^BACKUP-[\w-]+$/.test(backupId))throw Error('Unsafe backup id');
    const root=path.join(this.backupDir,backupId),files=[];
    const walk=(dir,prefix='')=>{if(fs.lstatSync(dir).isSymbolicLink())throw Error('Backup reparse point');for(const e of fs.readdirSync(dir,{withFileTypes:true})){const rel=prefix?prefix+'/'+e.name:e.name,p=safeFile(root,rel);e.isDirectory()?walk(p,rel):files.push({path:rel,sha256:fileSha256(p)});}};
    walk(root);files.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);return {backupId,files};
  }
  rollbackBackup({ backupId }, authorization) {
    if(!/^BACKUP-[\w-]+$/.test(backupId))throw Error('Unsafe backup id');
    const backupDir = path.join(this.backupDir, backupId);
    if (!fs.existsSync(backupDir)) throw new Error(`Backup snapshot not found: ${backupId}`);

    // Read audit log to find target project
    let targetProject = null;
    if (fs.existsSync(this.auditFile)) {
      const lines = fs.readFileSync(this.auditFile, "utf8").split(/\r?\n/).filter(Boolean);
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
    const actor=consumeAuthorization(authorization,stagingScope('adoption.rollback',backupId,targetProject,this.backupProposal(backupId)));

    // Restore files
    const restored = [];
    const walkBackup = (dir, relBase = "") => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        const rel = relBase ? relBase + "/" + e.name : e.name;
        if (e.isDirectory()) walkBackup(full, rel);
        else {
          const target = safeFile(targetProject, rel);
          fs.copyFileSync(full, target);
          restored.push(rel);
        }
      }
    };
    walkBackup(backupDir);

    // Audit rollback
    fs.appendFileSync(
      this.auditFile,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        action: "GOVERNED_ROLLBACK",
        backupId,
        targetProject,
        filesRestored: restored,
        authorizedBy: actor.authenticated_actor,
        actorRole: actor.server_resolved_role,
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
