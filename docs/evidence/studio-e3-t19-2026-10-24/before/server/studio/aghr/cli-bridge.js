import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const engineRoot = path.join(repository, 'governance_packages/candidates/AGHR_rc3_Core_Candidate');
export const sourceHash = '037fe1426f36765a8c237a04cc7fb62295b15f8e150561c2e7fd8372fde441a3';
const pinPath = path.join(repository, 'docs/evidence/studio-e2-2026-10-22/SOURCE_PIN.json');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const launcher = fileURLToPath(new URL('./read-only-launcher.py', import.meta.url));
const allowed = new Map([['catalog', ['catalog']], ['validate', ['validate', '--strict']], ['lint', ['lint']]]);

export function verifySource() {
  const pin = JSON.parse(fs.readFileSync(pinPath, 'utf8'));
  if (pin.source_hash !== sourceHash || Object.keys(pin.files).length !== 46) throw Error('ENGINE_PIN_MISMATCH');
  const files = {};
  for (const name of Object.keys(pin.files).sort()) {
    const resolved = path.resolve(engineRoot, name);
    if (!resolved.startsWith(engineRoot + path.sep)) throw Error('ENGINE_PATH_INVALID');
    let current = engineRoot;
    for (const part of name.split('/')) {
      current = path.join(current, part);
      if (fs.lstatSync(current).isSymbolicLink()) throw Error('ENGINE_REPARSE_POINT');
    }
    files[name] = digest(fs.readFileSync(resolved));
    if (files[name] !== pin.files[name]) throw Error('ENGINE_SOURCE_DRIFT');
  }
  if (digest(Buffer.from(JSON.stringify(files))) !== sourceHash) throw Error('ENGINE_AGGREGATE_MISMATCH');
  return files;
}

export function decodeResult(stdout, stderr, exitCode, command) {
  let report;
  try { report = JSON.parse(stdout); } catch { throw Error('ENGINE_INVALID_JSON'); }
  const exit = { INFO: 0, READ: 0, VALID: 0, INVALID: 1, ERROR: 2, BLOCKED: 3 };
  if (report.protocol_version !== '3' || report.command !== command || report.source?.content_hash !== sourceHash ||
      report.exit_code !== exitCode || exit[report.result] !== exitCode ||
      !Array.isArray(report.diagnostics) || !report.checks ||
      !(report.data&&typeof report.data==='object'||report.result==='ERROR'&&report.data===null&&exitCode===2&&report.diagnostics.length>0&&report.checks.status==='NOT_RUN')) throw Error('ENGINE_PROTOCOL_MISMATCH');
  if (command === 'catalog' && report.result !== 'READ' && exitCode === 0) throw Error('ENGINE_CATALOG_FALSE_SUCCESS');
  if (command !== 'catalog' && exitCode === 0 && (report.result !== 'VALID' || report.data.validation?.result !== 'VALID' || report.checks.status !== 'COMPLETE')) throw Error('ENGINE_FALSE_SUCCESS');
  return { report, stdout, stderr, exitCode };
}

function verifyPackageRoot(packageRoot) {
  // Selection is trusted startup configuration only. HTTP clients cannot choose
  // a package path; Python remains loaded from the unchanged pinned engine.
  const candidatesRoot=path.dirname(engineRoot);
  if(typeof packageRoot!=='string'||!path.isAbsolute(packageRoot))throw Error('PACKAGE_ROOT_INVALID');
  const selectedRoot=path.resolve(packageRoot),relative=path.relative(candidatesRoot,selectedRoot);
  if(!relative||relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative))throw Error('PACKAGE_ROOT_OUTSIDE_CANDIDATES');
  let current=candidatesRoot;
  for(const part of relative.split(path.sep)){
    current=path.join(current,part);
    if(fs.lstatSync(current).isSymbolicLink())throw Error('PACKAGE_ROOT_REPARSE_POINT');
  }
  if(!fs.statSync(selectedRoot).isDirectory())throw Error('PACKAGE_ROOT_INVALID');
  return selectedRoot;
}

// Configuration comes from the local operator, never an HTTP body or query.
export function createBridge({ python, packageRoot = engineRoot, timeoutMs = 30_000, maxBytes = 16 * 1024 * 1024 } = {}) {
  if (!python || !path.isAbsolute(python)) throw Error('ENGINE_EXECUTABLE_REQUIRED');
  const selectedRoot=verifyPackageRoot(packageRoot);
  const pythonHash = digest(fs.readFileSync(python));
  return {
    binding: { status: 'PINNED', source_hash: sourceHash, protocol_version: '3', publisher_authentication: 'UNKNOWN', qualification: 'NOT_RUN' },
    async run(command, context = {}) {
      if (!allowed.has(command)) throw Error('ENGINE_COMMAND_NOT_ALLOWED');
      const contextArgs=[];
      for(const [key,value] of Object.entries(context)) {
        if(!['path','agent','host_version','environment','stage','task_type','skill_id','language'].includes(key)||typeof value!=='string'||!value||value.length>1024||/[\x00-\x1f]/.test(value))throw Error('ENGINE_CONTEXT_INVALID');
        contextArgs.push(`--${key.replaceAll('_','-')}=${value}`);
      }
      if(command==='catalog'&&contextArgs.length)throw Error('ENGINE_CONTEXT_INVALID');
      verifyPackageRoot(selectedRoot);
      verifySource();
      if (digest(fs.readFileSync(python)) !== pythonHash) throw Error('ENGINE_EXECUTABLE_DRIFT');
      const args = ['-I', '-B', '-S', '-X', 'utf8', launcher, path.join(engineRoot, 'tools/cli.py'), ...allowed.get(command), ...contextArgs];
      const startedAt = new Date().toISOString();
      const capture = await new Promise((resolve, reject) => {
        const env = Object.fromEntries(['SystemRoot', 'WINDIR', 'SYSTEMDRIVE'].filter(k => process.env[k]).map(k => [k, process.env[k]]));
        const child = spawn(python, args, { cwd: selectedRoot, shell: false, windowsHide: true, env, stdio: ['ignore', 'pipe', 'pipe'] });
        const out = [], err = []; let bytes = 0, failure;
        const timer = setTimeout(() => { failure = Error('ENGINE_TIMEOUT'); child.kill(); }, timeoutMs);
        const collect = list => b => { bytes += b.length; if (bytes > maxBytes) { failure = Error('ENGINE_OUTPUT_LIMIT'); child.kill(); } else list.push(b); };
        child.stdout.on('data', collect(out)); child.stderr.on('data', collect(err));
        child.on('error', e => { clearTimeout(timer); reject(e); });
        child.on('close', code => { clearTimeout(timer); if (failure) reject(failure); else resolve({ stdout: Buffer.concat(out).toString('utf8'), stderr: Buffer.concat(err).toString('utf8'), code }); });
      });
      verifyPackageRoot(selectedRoot);
      verifySource();
      return { ...decodeResult(capture.stdout, capture.stderr, capture.code, command), startedAt, finishedAt: new Date().toISOString(), invocation: { executable: python, args, cwd: selectedRoot, shell: false, pythonHash, launcherHash: digest(fs.readFileSync(launcher)) } };
    },
  };
}
