// Read-only contract integrity and in-memory SQL checks, not an AGHR policy engine.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { loadDocuments, visitReferences, bundleSchema } from './contracts/schema_documents.mjs';
import { contractVectors } from './contracts/fixtures.mjs';
import { EVIDENCE_LIMITS } from './contracts/evidence_jsonl.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contracts = path.join(root, 'docs/contracts/aghr-rc3');
const read = file => fs.readFileSync(file, 'utf8');
const checks = [];
const check = (name, action) => { action(); checks.push({ name, status: 'PASS' }); };
const documents = loadDocuments(contracts);
if (process.argv.includes('--schema-bundles')) {
  console.log(JSON.stringify(Object.fromEntries([...documents.keys()].filter(name => name.endsWith('.schema.json')).map(name => [name, bundleSchema(documents, name)]))));
  process.exit(0);
}
if (process.argv.includes('--contract-vectors')) {
  console.log(JSON.stringify(contractVectors(documents.get('API_OPERATIONS.json'), JSON.parse(read(path.join(contracts, 'settings.yaml'))))));
  process.exit(0);
}
check('json_documents_parse', () => assert(documents.size >= 5));

check('all_local_json_references_resolve', () => {
  let count = 0;
  visitReferences(documents, () => count++);
  assert(count > 0);
});

const api = documents.get('openapi.json');
const catalog = documents.get('API_OPERATIONS.json');
check('api_covers_every_canonical_operation_and_declared_extension', () => {
  assert.equal(api['x-contract-status'], 'COMPLETE_FOR_IMPLEMENTATION_REVIEW');
  assert.equal(api.components.securitySchemes.StudioToken.name, 'X-Studio-Token');
  assert.deepEqual(api.security, [{ StudioToken: [] }]);
  const source = read(path.join(root, 'docs/specs/aghr-rc3/STUDIO_SPECIFICATION.md'));
  const section = source.slice(source.indexOf('### 27.'), source.indexOf('## Part V'));
  const expected = [...section.matchAll(/^(GET|POST|PATCH|DELETE|WS)\s+(\/\S+)/gm)].map(m => `${m[1]} ${m[2].split('?')[0]}`).sort();
  assert.equal(expected.length, 58);
  assert.deepEqual(catalog.operations.filter(op => !op.extension).map(op => `${op.method} ${op.path}`).sort(), expected);
  assert.deepEqual(catalog.operations.filter(op => op.extension).map(op => `${op.method} ${op.path}`), ['POST /workspaces/{id}/cps/{cp_id}/submit']);
  let count = 0;
  for (const [route, item] of Object.entries(api.paths)) for (const [method, operation] of Object.entries(item)) {
    const declared = catalog.operations.find(op => op.path === route && (op.method === 'WS' ? 'get' : op.method.toLowerCase()) === method);
    assert(declared, `Undeclared operation: ${method} ${route}`);
    assert(!Object.hasOwn(operation, 'security'), 'No unauthenticated override');
    assert.equal(operation['x-request-body'], declared.request ? 'typed' : 'forbidden');
    assert.equal(operation.requestBody?.content['application/json'].schema.$ref || null, declared.request);
    assert(operation.responses['401'] && operation.responses['403']);
    const success = operation.responses[String(declared.method === 'WS' ? 101 : (declared.status || 200))];
    assert(success);
    if (declared.method === 'WS') assert.equal(operation['x-transport'], 'websocket');
    else assert(success.content['application/json'].schema.$ref);
    if (declared.if_match) assert(operation.parameters.some(p => p.in === 'header' && p.name === 'If-Match' && p.required));
    count++;
  }
  assert.equal(count, 59);
});
check('instruction_query_contract_has_no_language_filter', () => {
  const query = api.paths['/workspaces/{id}/instructions'].get.parameters;
  assert.equal(api['x-unknown-query-parameters'], 'reject');
  assert.deepEqual(query.filter(p => p.in === 'query').map(p => p.name).sort(), ['kind', 'force', 'priority', 'authority_level', 'status', 'impact_evidence', 'is_review_due', 'host', 'path', 'q', 'limit', 'cursor'].sort());
});
check('canonical_state_and_runtime_evidence_have_no_write_endpoint', () => {
  for (const op of catalog.operations) {
    assert(!op.path.includes('state.json'));
    if (op.path.includes('/evidence/') && !['GET', 'WS'].includes(op.method)) assert(op.method === 'POST' && op.path.endsWith('/submit-to-ci'));
    if (op.path.includes('/instructions')) assert.equal(op.method, 'GET');
  }
});
check('evidence_profile_matches_bounded_reference_codec', () => {
  const profile = documents.get('EVIDENCE_FORMAT.json');
  assert.equal(profile.max_bytes, EVIDENCE_LIMITS.maxBytes);
  assert.equal(profile.max_line_bytes, EVIDENCE_LIMITS.maxLineBytes);
  assert.equal(profile.max_records, EVIDENCE_LIMITS.maxRecords);
  assert.equal(profile.schema_validity_is_execution_proof, false);
});
check('contract_lock_matches_all_artifacts_and_canonical_sources', () => {
  const lock = documents.get('CONTRACTS.lock.json');
  assert.equal(lock.contract_revision, 'contract.1');
  assert.equal(lock.status, 'COMPLETE_FOR_IMPLEMENTATION_REVIEW');
  const actualFiles = [];
  const collect = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      assert(!entry.isSymbolicLink(), 'Contract artifacts cannot follow symbolic links');
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) collect(file);
      else if (entry.name !== 'CONTRACTS.lock.json') actualFiles.push(path.relative(root, file).split(path.sep).join('/'));
    }
  };
  collect(contracts);
  assert.deepEqual(lock.files.map(file => file.path).sort(), actualFiles.sort());
  for (const artifact of lock.files) {
    const target = path.resolve(root, artifact.path);
    assert(target.startsWith(contracts + path.sep));
    const bytes = fs.readFileSync(target);
    assert.equal(bytes.length, artifact.bytes, artifact.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), artifact.sha256, artifact.path);
  }
  assert.deepEqual(lock.canonical_sources.map(source => source.path).sort(), ['docs/specs/aghr-rc3/AGHR_REFERENCE.md', 'docs/specs/aghr-rc3/STUDIO_SPECIFICATION.md']);
  for (const source of lock.canonical_sources) assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, source.path))).digest('hex'), source.sha256);
});

const source = read(path.join(root, 'docs/specs/aghr-rc3/STUDIO_SPECIFICATION.md'));
const blocks = [...source.matchAll(/```sql\r?\n([\s\S]*?)```/g)].map(m => m[1].replace(/\r\n/g, '\n').trimEnd());
const sql = read(path.join(contracts, 'sqlite/001_initial.sql')).replace(/\r\n/g, '\n');
check('sql_exactly_matches_six_source_blocks', () => {
  assert.equal(blocks.length, 6);
  const header = '-- DRAFT projection; extracted verbatim (LF normalized) from STUDIO_SPECIFICATION.md sections 5-10.\n-- Do not initialize a persistent database from this draft. Local checks use :memory: only.\n\n';
  assert.equal(sql, header + blocks.join('\n\n') + '\n');
});

const db = new DatabaseSync(':memory:');
try {
  db.exec('PRAGMA foreign_keys = ON');
  const migration = documents.get('MIGRATIONS.json').migrations[0];
  assert.equal(migration.sha256, createHash('sha256').update(fs.readFileSync(path.join(contracts, migration.file))).digest('hex'));
  db.exec('BEGIN IMMEDIATE');
  try { db.exec(sql); db.exec('PRAGMA user_version = 1'); db.exec('COMMIT'); }
  catch (error) { db.exec('ROLLBACK'); throw error; }
  check('migration_version_and_foreign_keys_applied_in_memory', () => {
    assert.equal(migration.version, 1);
    assert.equal(db.prepare('PRAGMA user_version').get().user_version, 1);
    assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
  });
  check('twelve_tables_created_in_memory', () => {
    const names = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name);
    assert.deepEqual(names, ['workspaces', 'target_projects', 'instruction_items_cache', 'capability_items_cache', 'skill_qualification_snapshot', 'change_packages', 'change_package_approvals', 'change_package_approval_history', 'runtime_evidence_events', 'verification_runs', 'metrics_snapshots', 'audit_events'].sort());
    assert.equal(db.prepare('PRAGMA database_list').get().file, '');
  });
  db.prepare('INSERT INTO workspaces (id,name,package_path,package_version,schema_version,created_at) VALUES (?,?,?,?,?,?)').run('w', 'synthetic contract test', '/not-a-real-package', '0.0.0-test', '1.2', '2026-10-22');
  check('qualification_primary_key_preserves_all_four_dimensions', () => {
    const insert = db.prepare('INSERT INTO skill_qualification_snapshot (workspace_id,skill_id,host,host_version,scope,status,content_hash,read_at) VALUES (?,?,?,?,?,?,?,?)');
    const base = ['w', 'synthetic-skill', 'synthetic-host', '0-test', 'test/**', 'NOT_RUN', 'synthetic-hash', '2026-10-22'];
    insert.run(...base);
    assert.throws(() => insert.run(...base), /UNIQUE constraint failed/);
    for (const index of [2, 3, 4, 6]) {
      const changed = [...base]; changed[index] += '-changed'; insert.run(...changed);
    }
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM skill_qualification_snapshot').get().n, 5);
  });
  db.prepare('INSERT INTO change_packages (id,workspace_id,title,kind,status_updated_at,base_package_version,proposed_yaml,proposal_version_hash,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run('cp', 'w', 'synthetic', 'CONSTRAINT', '2026-10-22', '0-test', 'synthetic: true', 'hash-1', 'test-only', '2026-10-22', '2026-10-22');
  check('approval_uniqueness_includes_exact_proposal_hash', () => {
    const insert = db.prepare('INSERT INTO change_package_approvals (package_id,role,approver,decision,approved_version_hash,at) VALUES (?,?,?,?,?,?)');
    const base = ['cp', 'governance-owner', 'synthetic-actor', 'approve', 'hash-1', '2026-10-22'];
    insert.run(...base);
    assert.throws(() => insert.run(...base), /UNIQUE constraint failed/);
    const changed = [...base]; changed[4] = 'hash-2'; insert.run(...changed);
    // Schema can retain both versions. Invalidating stale approvals is a separate runtime gate.
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM change_package_approvals').get().n, 2);
  });
  check('evidence_source_line_cannot_be_silently_overwritten', () => {
    const insert = db.prepare('INSERT INTO runtime_evidence_events (workspace_id,task_id,event_type,payload_json,recorded_at,source_file,source_line,ingested_at) VALUES (?,?,?,?,?,?,?,?)');
    const base = ['w', 'test-task', 'discovery.outcome', '{}', '2026-10-22', 'test-task.jsonl', 1, '2026-10-22'];
    insert.run(...base);
    assert.throws(() => insert.run(...base), /UNIQUE constraint failed/);
    const nextLine = [...base]; nextLine[6] = 2; insert.run(...nextLine);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM runtime_evidence_events').get().n, 2);
  });
} finally { db.close(); }

console.log(JSON.stringify({ status: 'PASS', scope: 'LOCAL_CONTRACT_INTEGRITY_AND_SQL_ONLY', checks, runtime_engine: 'NOT_RUN', http_and_browser: 'NOT_RUN', phase_0_exit: 'NOT_RUN' }, null, 2));
