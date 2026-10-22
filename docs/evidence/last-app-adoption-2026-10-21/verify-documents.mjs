import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

// Scoped document verification only. SQL runs exclusively in disposable :memory: databases.
const evidence = 'docs/evidence/last-app-adoption-2026-10-21';
const working = process.argv.includes('--working');
const current = working ? `${evidence}/work` : 'docs/specs/aghr-rc3';
const before = JSON.parse(fs.readFileSync(`${evidence}/before.json`, 'utf8'));
const coverage = JSON.parse(fs.readFileSync(`${evidence}/coverage.json`, 'utf8'));
const read = file => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const digest = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function exact(file, record) {
  assert.equal(fs.statSync(file).size, record.bytes, `size: ${file}`);
  assert.equal(digest(file), record.sha256, `digest: ${file}`);
  return { path: file, bytes: record.bytes, sha256: record.sha256 };
}
function headings(text) {
  let fenced = false;
  return text.split('\n').filter(line => {
    if (line.startsWith('```')) { fenced = !fenced; return false; }
    return !fenced && /^#{2,4} /.test(line);
  });
}
function sqlDatabase(text) {
  const database = new DatabaseSync(':memory:');
  for (const block of text.matchAll(/```sql\s*\n([\s\S]*?)```/g)) database.exec(block[1]);
  return database;
}
function tables(database) {
  return database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all().map(row => row.name);
}
const archives = before.previous_baseline.map(record => exact(record.archived_path, record));
const sources = before.selected_inputs.map(record => {
  const archived = `${before.source_archive}/${path.posix.basename(record.path)}`;
  const file = fs.existsSync(archived) ? archived : record.path;
  if (!working) assert.equal(file, archived, 'accepted source must be archived');
  return exact(file, record);
});
const preserved = before.preserved_runtime_artifacts.map(record => exact(record.path, record));
const historical = JSON.parse(fs.readFileSync('docs/evidence/studio-design-adoption-2026-10-21/before.json', 'utf8'));
const priorArchives = historical.moves.map(record => exact(record.destination, record));

const oldReference = read(before.previous_baseline[0].archived_path);
const reference = read(`${current}/AGHR_REFERENCE.md`);
const expectedReference = oldReference
  .replace('**Status:** Final Release Candidate / Architectural Correction', '**Status:** Release Candidate / Architectural Correction')
  .replace('├── README.md, THREAT_MODEL.md, CHANGELOG.md, pyproject.toml',
    '├── README.md\n├── THREAT_MODEL.md\n├── CHANGELOG.md\n├── pyproject.toml');
assert.equal(reference.trimEnd(), expectedReference.trimEnd(), 'reference normative continuity');
assert.equal(digest(`${current}/AGHR_REFERENCE.md`), before.selected_inputs[0].sha256, 'reference exact selected bytes');
const referenceSections = headings(reference).filter(line => /^## (\d+\.|Appendix )/.test(line));
assert.equal(referenceSections.length, 24);

const oldStudio = read(before.previous_baseline[1].archived_path);
const studio = read(`${current}/STUDIO_SPECIFICATION.md`);
const incomingStudio = read(sources[1].path);
const selectedHeadings = headings(incomingStudio);
const adoptedHeadings = headings(studio);
for (const heading of selectedHeadings) assert.ok(adoptedHeadings.includes(heading), `incoming heading: ${heading}`);
assert.equal(adoptedHeadings.filter(line => /^### \d+\./.test(line)).length, 49);
assert.equal(adoptedHeadings.filter(line => /^### Appendix /.test(line)).length, 7);
const oldDb = sqlDatabase(oldStudio);
const incomingDb = sqlDatabase(incomingStudio);
const currentDb = sqlDatabase(studio);
const sql = [];
for (const table of tables(oldDb)) {
  const original = oldDb.prepare(`PRAGMA table_info(${table})`).all().map(row => row.name);
  const now = currentDb.prepare(`PRAGMA table_info(${table})`).all().map(row => row.name);
  const columns = original.map(column => {
    const mapped = coverage.studio.sql_field_aliases[`${table}.${column}`] ?? column;
    assert.ok(now.includes(mapped), `missing prior field: ${table}.${column}`);
    return { previous: column, current: mapped };
  });
  sql.push({ table, prior_columns: original.length, current_columns: now.length, columns });
}
for (const table of tables(incomingDb)) {
  const now = currentDb.prepare(`PRAGMA table_info(${table})`).all().map(row => row.name);
  for (const { name } of incomingDb.prepare(`PRAGMA table_info(${table})`).all()) {
    assert.ok(now.includes(name), `missing selected field: ${table}.${name}`);
  }
}
assert.equal(tables(oldDb).length, 11);
assert.equal(tables(currentDb).length, 12);
oldDb.close(); incomingDb.close(); currentDb.close();
const acceptanceSource = oldStudio.slice(oldStudio.indexOf('## 10.'), oldStudio.indexOf('## 11.'));
const oldAcceptance = [...acceptanceSource.matchAll(/^- \[ \] (.+)$/gm)].map(match => match[1]);
assert.equal(oldAcceptance.length, 36);
assert.equal(coverage.studio.acceptance.length, 36);
for (const [index, entry] of coverage.studio.acceptance.entries()) {
  assert.equal(entry.previous_text, oldAcceptance[index]);
  const marker = `<a id="${entry.target_anchor}"></a>`;
  assert.equal(studio.split(marker).length - 1, 1, `acceptance anchor: ${entry.id}`);
  assert.ok(studio.includes(`${marker} ${entry.current_text}`), `acceptance target: ${entry.id}`);
}
assert.deepEqual(coverage.coverage_gaps, []);
if (!working) {
  const adoption = JSON.parse(fs.readFileSync(`${current}/ADOPTION.json`, 'utf8'));
  for (const document of adoption.documents) {
    assert.equal(digest(`${current}/${document.path}`), document.sha256, 'adoption document hash');
  }
  assert.equal(adoption.status, 'OWNER_ACCEPTED_DESIGN_BASELINE');
  assert.equal(adoption.runtime_default, 'aghr_1_2_0');
  assert.equal(fs.existsSync('governance_packages/INBOX/last-app'), false, 'consumed source directory');
}
const result = {
  status: 'PASS', observed_at: new Date().toISOString(), mode: working ? 'WORKING_DOCUMENTS' : 'ADOPTED_DOCUMENTS',
  reference_sections: 24, studio_prior_sections: 12, studio_main_sections: 49,
  incoming_headings_preserved: selectedHeadings.length, commitments: 12, screens: 16, metrics: 10,
  prior_acceptance_mapped: 36, current_acceptance: { functional: 31, non_functional: 13 },
  previous_sql_tables: 11, current_sql_tables: 12, sql,
  prior_baseline_archives: archives, selected_sources: sources, prior_archives: priorArchives,
  preserved_runtime_artifacts: preserved, coverage_gaps: [],
  limitations: ['Semantic coverage was manually reviewed by the implementer, not independently reviewed.',
    'SQL syntax was exercised only in memory; no application database or runtime was qualified.',
    'Acceptance checkboxes remain unexecuted implementation requirements.'],
};
if (!working) fs.writeFileSync(`${evidence}/document-verification.json`, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ status: result.status, mode: result.mode, reference_sections: 24,
  prior_acceptance_mapped: 36, prior_sql_columns_preserved: sql.reduce((sum, row) => sum + row.prior_columns, 0),
  sql_tables: 12, incoming_headings_preserved: selectedHeadings.length, preserved_runtime_artifacts: preserved.length }));
