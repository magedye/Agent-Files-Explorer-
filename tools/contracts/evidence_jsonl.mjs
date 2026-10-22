// Serialization reference only. No filesystem access, discovery, permissions or skill verification.
import { createHash } from 'node:crypto';

export const EVIDENCE_LIMITS = Object.freeze({ maxBytes: 16 * 1024 * 1024, maxLineBytes: 1024 * 1024, maxRecords: 10000 });
const hash = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const invalidUnicode = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

// RFC 8785 primitive encoding and UTF-16 property ordering. Input is parsed I-JSON.
export function canonicalJson(value) {
  if (value === null || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('NON_FINITE_NUMBER');
    return JSON.stringify(value);
  }
  if (typeof value === 'string') {
    if (invalidUnicode.test(value)) throw new Error('INVALID_UNICODE');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return '[' + Array.from(value, canonicalJson).join(',') + ']';
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return '{' + Object.keys(value).sort().map(key => canonicalJson(key) + ':' + canonicalJson(value[key])).join(',') + '}';
  }
  throw new Error('NON_JSON_VALUE');
}

export function encodeJsonl(records) {
  return Buffer.from(records.map(canonicalJson).join('\n') + (records.length ? '\n' : ''), 'utf8');
}

export function decodeJsonl(original, { expectedTaskId, ...limits } = {}) {
  if (!Buffer.isBuffer(original)) throw new TypeError('Expected original source bytes');
  const bounds = { ...EVIDENCE_LIMITS, ...limits };
  for (const value of Object.values(bounds)) if (!Number.isSafeInteger(value) || value < 1) throw new Error('INVALID_LIMIT');
  const result = { original, source_hash: hash(original), syntax_status: 'PASS', schema_status: 'NOT_RUN', trust_status: 'UNKNOWN', records: [], issues: [] };
  const fail = (code, line, status = 'FAIL') => { result.issues.push({ code, line }); result.syntax_status = status; };
  if (original.length > bounds.maxBytes) { fail('SOURCE_SIZE_LIMIT', 1); return result; }
  let source;
  try { source = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(original); }
  catch { fail('INVALID_UTF8', 1); return result; }
  if (source.startsWith('\uFEFF')) { fail('BOM_NOT_SUPPORTED', 1, 'UNSUPPORTED_SERIALIZATION'); return result; }
  const lines = source.split('\n');
  if (lines.at(-1) === '') lines.pop();
  if (!lines.length) { fail('EMPTY_SOURCE', 1); return result; }
  if (lines.length > bounds.maxRecords) { fail('RECORD_COUNT_LIMIT', 1); return result; }
  const seen = new Set();
  let identity;
  let endedAt;
  for (let index = 0; index < lines.length; index++) {
    const lineNumber = index + 1;
    const line = lines[index].endsWith('\r') ? lines[index].slice(0, -1) : lines[index];
    if (Buffer.byteLength(line, 'utf8') > bounds.maxLineBytes) { fail('LINE_SIZE_LIMIT', lineNumber); break; }
    let record;
    try { record = JSON.parse(line); } catch { fail('INVALID_JSON', lineNumber); break; }
    let canonical;
    try { canonical = canonicalJson(record); } catch { fail('INVALID_I_JSON', lineNumber); break; }
    if (canonical !== line) { fail('NON_CANONICAL_JSON', lineNumber, 'UNSUPPORTED_SERIALIZATION'); break; }
    if (!record || typeof record !== 'object' || Array.isArray(record) || !record.session || typeof record.session !== 'object' || Array.isArray(record.session) || !Array.isArray(record.events) || record.events.length !== 1) {
      fail('INVALID_RECORD_FRAMING', lineNumber); break;
    }
    const key = canonicalJson({ task_id: record.task_id ?? null, agent: record.session.agent ?? null, agent_version: record.session.agent_version ?? null, host_os: record.session.host_os ?? null, started_at: record.session.started_at ?? null });
    if ((expectedTaskId && record.task_id !== expectedTaskId) || (identity && key !== identity)) { fail('SESSION_IDENTITY_CONFLICT', lineNumber); break; }
    identity = key;
    if (record.session.ended_at != null) {
      if (endedAt && endedAt !== record.session.ended_at) { fail('SESSION_END_CONFLICT', lineNumber); break; }
      endedAt = record.session.ended_at;
    }
    if (seen.has(canonical)) { fail('DUPLICATE_RECORD', lineNumber); break; }
    seen.add(canonical);
    result.records.push({ source_line: lineNumber, record });
  }
  // A parsed prefix is diagnostic only after any failure. Never import it as successful evidence.
  return result;
}
