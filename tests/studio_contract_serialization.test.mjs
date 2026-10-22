import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalJson, encodeJsonl, decodeJsonl } from '../tools/contracts/evidence_jsonl.mjs';
import { bundleSchema } from '../tools/contracts/schema_documents.mjs';

const record = (type = 'discovery.outcome', at = '2026-10-22T00:00:01Z') => ({
  task_id: 'synthetic-task',
  session: { agent: 'synthetic-host', agent_version: '0-test', host_os: 'test', started_at: '2026-10-22T00:00:00Z' },
  events: [{ at, type, task_language: 'ar', outcome: 'NO_SKILL_MATCH', reason: 'مثال تركيبي، ليس نتيجة مهمة فعلية.' }],
  submit_to_ci: false
});

test('Contract JSONL: multiple lines round-trip without changing original bytes or granting trust', () => {
  const values = [record(), record('discovery.outcome', '2026-10-22T00:00:02Z')];
  const bytes = encodeJsonl(values); const before = Buffer.from(bytes);
  const decoded = decodeJsonl(bytes, { expectedTaskId: 'synthetic-task' });
  assert.equal(decoded.syntax_status, 'PASS');
  assert.deepEqual(decoded.records.map(row => row.record), values);
  assert.deepEqual(decoded.records.map(row => row.source_line), [1, 2]);
  assert.deepEqual(decoded.original, before); assert.deepEqual(bytes, before);
  assert.equal(decoded.schema_status, 'NOT_RUN'); assert.equal(decoded.trust_status, 'UNKNOWN');
});

test('Contract JSONL: CRLF and optional final newline preserve source bytes and line locations', () => {
  const bytes = Buffer.from(canonicalJson(record()) + '\r\n' + canonicalJson(record('discovery.outcome', '2026-10-22T00:00:02Z')));
  const result = decodeJsonl(bytes); assert.equal(result.syntax_status, 'PASS');
  assert.equal(result.records[1].source_line, 2); assert.deepEqual(result.original, bytes);
});

test('Contract JSONL: duplicate records are reported, never counted as extra successful use', () => {
  const bytes = encodeJsonl([record(), record()]); const result = decodeJsonl(bytes);
  assert.equal(result.syntax_status, 'FAIL'); assert.equal(result.issues[0].code, 'DUPLICATE_RECORD'); assert.deepEqual(result.original, bytes);
});

test('Contract JSONL: duplicate JSON keys and noncanonical foreign JSON remain unsupported originals', () => {
  for (const text of ['{"a":1,"a":2}', '{ "a": 2 }']) {
    const bytes = Buffer.from(text); const result = decodeJsonl(bytes);
    assert.equal(result.syntax_status, 'UNSUPPORTED_SERIALIZATION'); assert.equal(result.records.length, 0); assert.deepEqual(result.original, bytes);
  }
});

test('Contract JSONL: task or immutable session mismatch blocks import of the entire file', () => {
  const changed = record('discovery.outcome', '2026-10-22T00:00:02Z'); changed.session.agent_version = 'different';
  const result = decodeJsonl(encodeJsonl([record(), changed]));
  assert.equal(result.syntax_status, 'FAIL'); assert.equal(result.issues[0].code, 'SESSION_IDENTITY_CONFLICT');
  assert.equal(decodeJsonl(encodeJsonl([record()]), { expectedTaskId: 'other-task' }).syntax_status, 'FAIL');
});

test('Contract JSONL: a session can acquire an end time, but cannot rewrite it', () => {
  const ended = record('discovery.outcome', '2026-10-22T00:00:02Z'); ended.session.ended_at = '2026-10-22T00:00:03Z';
  assert.equal(decodeJsonl(encodeJsonl([record(), ended])).syntax_status, 'PASS');
  const changed = structuredClone(ended); changed.session.ended_at = '2026-10-22T00:00:04Z';
  assert.equal(decodeJsonl(encodeJsonl([ended, changed])).issues[0].code, 'SESSION_END_CONFLICT');
});

test('Contract JSONL: malformed UTF-8, BOM, YAML and blank records keep their original bytes', () => {
  for (const bytes of [Buffer.from([0xc3, 0x28]), Buffer.from('\uFEFF{}'), Buffer.from('task_id: foreign\nevents: []\n'), Buffer.from('\n'), Buffer.alloc(0)]) {
    const result = decodeJsonl(bytes); assert.notEqual(result.syntax_status, 'PASS'); assert.deepEqual(result.original, bytes);
  }
});

test('Contract JSONL: multiple events on one line cannot overwrite the SQL source-line identity', () => {
  const value = record(); value.events.push({ ...value.events[0] });
  const result = decodeJsonl(encodeJsonl([value])); assert.equal(result.issues[0].code, 'INVALID_RECORD_FRAMING');
});

test('Contract JSONL: byte, line and record-count limits reject bounded inputs explicitly', () => {
  const bytes = encodeJsonl([record()]);
  assert.equal(decodeJsonl(bytes, { maxBytes: 1 }).issues[0].code, 'SOURCE_SIZE_LIMIT');
  assert.equal(decodeJsonl(bytes, { maxLineBytes: 1 }).issues[0].code, 'LINE_SIZE_LIMIT');
  assert.equal(decodeJsonl(encodeJsonl([record(), record()]), { maxRecords: 1 }).issues[0].code, 'RECORD_COUNT_LIMIT');
});

test('Contract canonical JSON: UTF-16 ordering, array order and Unicode text are stable', () => {
  assert.equal(canonicalJson({ z: [3, 1], a: { y: true, b: null } }), '{"a":{"b":null,"y":true},"z":[3,1]}');
  assert.equal(canonicalJson({ '\uE000': 1, '😀': 2 }), '{"😀":2,"\uE000":1}');
  assert.equal(canonicalJson({ text: 'آ / أ', n: -0 }), '{"n":0,"text":"آ / أ"}');
  for (const value of [NaN, Infinity, undefined, '\uD800', new Array(1)]) assert.throws(() => canonicalJson(value));
});

test('Contract schema bundling preserves literal dollar properties and opaque JSON instance values', () => {
  const source = { $id: 'https://synthetic.invalid/schema', type: 'object', properties: { $schema: { type: 'string' }, field: { const: { $ref: 'opaque-instance-value' } } } };
  const before = structuredClone(source);
  const bundle = bundleSchema(new Map([['synthetic.schema.json', source]]), 'synthetic.schema.json');
  assert.deepEqual(bundle.$defs['synthetic.schema.json'].properties.$schema, { type: 'string' });
  assert.deepEqual(bundle.$defs['synthetic.schema.json'].properties.field.const, { $ref: 'opaque-instance-value' });
  assert.deepEqual(source, before);
});
