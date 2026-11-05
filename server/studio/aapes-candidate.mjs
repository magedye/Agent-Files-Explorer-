import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { StudioError } from './auth.js';
import { getAapesFramework, evaluateAssessment } from '../aapes-assessment.js';
import { reviewPolicyText } from '../aapes-policy.js';
import { runAapesSyntheticTests, evaluateOpaPolicies } from '../aapes-evaluation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repository = path.resolve(__dirname, '../..');
const matrixCsvPath = path.join(repository, 'AAPES_AGHR_COMPATIBILITY_MATRIX.csv');

export const aapesWorkspace = Object.freeze({
  id: 'aapes-candidate',
  name: 'AAPES v2.1 Policy Engineering Candidate',
  package_path: 'governance_packages/candidates/AAPES_v2.1_Candidate',
  package_version: '2.1.0-rc.1',
  schema_version: '1.2',
  read_only: true,
  package_signature_verified: false,
  created_at: '2026-11-04T00:00:00.000Z',
  last_scanned_at: '2026-11-04T00:00:00.000Z'
});

let cachedViews = null;

export function getAapesViews() {
  if (cachedViews) return cachedViews;
  const fw = getAapesFramework();
  const views = [];

  for (const dom of fw.domains) {
    for (const req of dom.requirements) {
      const yaml = [
        `id: ${req.id}`,
        `title: "${req.title.replace(/"/g, '\\"')}"`,
        `kind: REQUIREMENT`,
        `force: ${req.normative_level}`,
        `priority: ${req.priority}`,
        `domain: ${dom.id}`,
        `statement: >-\n  ${req.statement}`,
        `acceptance_test: >-\n  ${req.acceptance_test}`,
        `authority:`,
        `  level: CANDIDATE_POLICY_SPEC`,
        `  owner: AAPES-WG`,
        `  status: REVIEW_CANDIDATE`,
        `impact:`,
        `  band: ${req.priority === 'P0' ? 'HIGH' : 'MEDIUM'}`,
        `  evidence: PROPOSED`
      ].join('\n') + '\n';

      const digest = crypto.createHash('sha256').update(yaml).digest('hex');

      views.push({
        item: {
          id: req.id,
          kind: 'REQUIREMENT',
          title: req.title,
          force: req.normative_level,
          defaultTier: req.priority,
          statement: req.statement,
          domain: dom.id,
          domain_name: dom.name,
          acceptance_test: req.acceptance_test,
          authority: {
            level: 'CANDIDATE_POLICY_SPEC',
            owner: 'AAPES-WG',
            status: 'REVIEW_CANDIDATE'
          },
          impact: {
            band: req.priority === 'P0' ? 'HIGH' : 'MEDIUM',
            evidence: 'PROPOSED'
          }
        },
        source_path: 'governance_packages/candidates/AAPES_v2.1_Candidate/skills/aapes-policy-engineering/resources/aapes-v2.1/framework.yaml',
        source_hash: 'sha256:' + digest,
        source_yaml: yaml,
        validation_status: 'REVIEW_CANDIDATE',
        diagnostics: [],
        translation_unavailable: false,
        is_review_due: false,
        priority_tier: req.priority,
        issuer_trust: {
          status: 'CANDIDATE_UNVERIFIED',
          evidence: [],
          reason: 'AAPES v2.1 is an unadopted candidate framework. Requires governed review and owner authorization.'
        }
      });
    }
  }

  cachedViews = views;
  return cachedViews;
}

function parseCsv(content) {
  const lines = content.split('\n');
  const rows = [];
  const parseLine = (text) => {
    const res = [];
    let cur = '', inQuote = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') {
        if (inQuote && text[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        res.push(cur); cur = '';
      } else {
        cur += ch;
      }
    }
    res.push(cur);
    return res;
  };

  const headers = parseLine(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseLine(line);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = values[idx] !== undefined ? values[idx].trim() : '';
    });
    rows.push(obj);
  }
  return rows;
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const b of req) {
    size += b.length;
    if (size > 65536) throw new StudioError(413, 'PAYLOAD_TOO_LARGE', 'Payload exceeds 64KiB');
    chunks.push(b);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new StudioError(400, 'INVALID_REQUEST', 'Invalid JSON body');
  }
}

/**
 * Handle workspace routing for aapes-candidate
 */
export async function handleAapesCandidate(req, res, { match, url, p, send, studio }) {
  studio.authority.authenticate(req);
  if (req.method !== 'GET') {
    studio.store.recordAttempt({
      ...studio.authority.auditIdentity(req),
      action: 'aapes-candidate.write',
      resourceId: match?.[1],
      result: 'DENY',
      status: 403,
      reason: 'AAPES candidate workspace is read-only. Use a new Draft CP in rc3-local.',
      requestId: crypto.randomUUID()
    });
    throw new StudioError(403, 'FORBIDDEN', 'AAPES candidate workspace is read-only. Use a new Draft CP in rc3-local.');
  }

  const tail = match[2] || '';
  const parts = tail.split('/');
  const views = getAapesViews();

  if (tail === 'projects') return send(200, [], null, { total: 0, limit: 100, next_cursor: null });
  if (tail === 'published') return send(200, null);
  if (tail === 'cps') return send(200, [], null, { total: 0, limit: 100, next_cursor: null });
  if (tail === 'capabilities' || tail === 'capabilities/matrix') return send(200, [], null, { total: 0, limit: 100, next_cursor: null });

  if (parts[0] === 'instructions') {
    if (parts.length === 1) {
      const allowed = ['q', 'kind', 'force', 'authority_level', 'status', 'impact_evidence', 'priority', 'is_review_due', 'limit', 'cursor'];
      if ([...url.searchParams.keys()].some(k => !allowed.includes(k)) || url.searchParams.get('cursor')) {
        throw new StudioError(400, 'INVALID_REQUEST', 'Unsupported filter/cursor.');
      }
      let rows = views;
      for (const [key, value] of url.searchParams) {
        if (['limit', 'cursor'].includes(key)) continue;
        rows = rows.filter(v =>
          key === 'q'
            ? (v.item.id + ' ' + v.item.title + ' ' + v.source_yaml).toLowerCase().includes(value.toLowerCase())
            : String(
                key === 'authority_level'
                  ? v.item.authority?.level
                  : key === 'status'
                  ? v.item.authority?.status
                  : key === 'impact_evidence'
                  ? v.item.impact?.evidence
                  : key === 'priority'
                  ? v.priority_tier
                  : key === 'is_review_due'
                  ? v.is_review_due
                  : v.item[key]
              ) === value
        );
      }
      return send(200, rows, null, { total: rows.length, limit: 500, next_cursor: null });
    }

    const item = views.find(v => v.item.id === parts[1]);
    if (!item) throw new StudioError(404, 'UNKNOWN_ID', 'Unknown AAPES requirement.');
    if (parts.length === 2) return send(200, item);
    if (['relations', 'history', 'evals', 'calibrations'].includes(parts[2])) return send(200, []);
  }

  throw new StudioError(404, 'UNKNOWN_ID', 'Unknown AAPES candidate resource.');
}

/**
 * Handle dedicated /api/v1/aapes/* routes under studio canonical authentication
 */
export async function handleAapesApi(req, res, { p, url, send, studio }) {
  const principal = studio.authority.authenticate(req);

  // 1. GET /api/v1/aapes/framework
  if (p === '/api/v1/aapes/framework' && req.method === 'GET') {
    const fw = getAapesFramework();
    return send(200, {
      framework: fw,
      candidate_status: 'REVIEW_CANDIDATE_NOT_ADOPTED',
      standard_id: fw.standard_id,
      version: fw.version,
      domains_count: fw.domains.length,
      requirements_count: fw.domains.reduce((acc, d) => acc + d.requirements.length, 0)
    });
  }

  // 2. GET /api/v1/aapes/matrix
  if (p === '/api/v1/aapes/matrix' && req.method === 'GET') {
    if (!fs.existsSync(matrixCsvPath)) throw new StudioError(500, 'FILE_MISSING', 'Compatibility matrix CSV missing.');
    const content = fs.readFileSync(matrixCsvPath, 'utf8');

    if (url.searchParams.get('format') === 'csv' || req.headers.accept === 'text/csv') {
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="AAPES_AGHR_COMPATIBILITY_MATRIX.csv"',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      });
      return res.end(content);
    }

    const rows = parseCsv(content);
    const summary = {
      total: rows.length,
      covered: rows.filter(r => r.coverage_status === 'COVERED').length,
      partial: rows.filter(r => r.coverage_status === 'PARTIAL').length,
      missing: rows.filter(r => r.coverage_status === 'MISSING').length,
      conflict: rows.filter(r => r.coverage_status === 'CONFLICT').length
    };
    return send(200, { summary, requirements: rows });
  }

  // 3. POST /api/v1/aapes/review
  if (p === '/api/v1/aapes/review' && req.method === 'POST') {
    const body = await readJson(req);
    if (!body || !body.policy_text) {
      throw new StudioError(400, 'INVALID_REQUEST', 'Missing policy_text in request body.');
    }
    const result = reviewPolicyText(body.policy_text, body.rule_id || 'AAPES-DRAFT');
    return send(200, result);
  }

  // 4. POST /api/v1/aapes/assess
  if (p === '/api/v1/aapes/assess' && req.method === 'POST') {
    const body = await readJson(req);
    if (!body || !body.risk_level) {
      throw new StudioError(400, 'INVALID_REQUEST', 'Missing risk_level in assessment payload.');
    }
    const result = evaluateAssessment(body);
    return send(200, {
      assessment: result,
      evaluated_at: new Date().toISOString()
    });
  }

  // 5. POST /api/v1/aapes/evaluate
  if (p === '/api/v1/aapes/evaluate' && req.method === 'POST') {
    const syntheticTests = runAapesSyntheticTests();
    const opaPolicies = evaluateOpaPolicies();
    return send(200, {
      synthetic_tests: syntheticTests,
      opa_policies: opaPolicies,
      deterministic_verification: true
    });
  }

  // 6. POST /api/v1/aapes/propose-change-package
  if (p === '/api/v1/aapes/propose-change-package' && req.method === 'POST') {
    const body = await readJson(req);
    if (!body || !body.proposed_text) {
      throw new StudioError(400, 'INVALID_REQUEST', 'Missing proposed_text in request body.');
    }

    const rawId = (body.rule_id || 'AAPES-001').replace(/[^a-zA-Z0-9_-]/g, '-');
    const cleanId = rawId.startsWith('OBS-') ? rawId.toUpperCase() : `OBS-${rawId.toUpperCase()}`;
    const title = body.title || `AAPES Policy Optimization: ${rawId}`;

    let proposedYaml = body.proposed_text.trim();
    let kind = body.kind || 'OBSERVATION';
    try {
      const parsed = JSON.parse(proposedYaml);
      if (parsed.kind) kind = parsed.kind;
      proposedYaml = JSON.stringify(parsed, null, 2) + '\n';
    } catch {
      const structured = {
        id: cleanId,
        title,
        kind: 'OBSERVATION',
        force: 'INFORMATIVE',
        severity: 'info',
        scope: { paths: ['server/security.js'] },
        rule: proposedYaml,
        impact: { band: 'info', evidence: 'assumed' }
      };
      kind = structured.kind;
      proposedYaml = JSON.stringify(structured, null, 2) + '\n';
    }

    const payload = {
      title,
      kind,
      source: { type: 'request', ref: `aapes://${rawId}` },
      proposed_yaml: proposedYaml
    };

    // Prepare proposal using Studio Draft Validator
    const prepared = await studio.draftValidator.prepare(payload);
    const cpId = `CP-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0, 8)}`;
    const fullPrepared = {
      ...prepared,
      id: cpId,
      request_id: crypto.randomUUID(),
      target_item_id: rawId
    };

    const scope = {
      workspace_id: studio.workspace.id,
      target_project: 'studio-drafts',
      action: 'cp.create',
      resource_id: cpId,
      proposal_version_hash: prepared.proposal_version_hash
    };

    const intentId = crypto.randomUUID();
    studio.intents.set(intentId, {
      principal,
      payload,
      prepared: Object.freeze(fullPrepared),
      scope,
      expires: Date.now() + 120000,
      grant: null
    });

    // Authorize locally via operator intent approval
    studio.approveIntent(intentId);
    const entry = studio.intents.get(intentId);
    if (!entry || !entry.grant) throw new StudioError(500, 'INTERNAL_ERROR', 'Failed to issue local draft grant.');

    const receipt = studio.authority.authorize(principal, scope, entry.grant);
    const created = studio.store.createDraft(receipt, fullPrepared);
    studio.intents.delete(intentId);

    return send(201, {
      change_package: created,
      workspace_id: studio.workspace.id,
      message: 'Draft Change Package created in rc3-local draft custody.'
    });
  }

  throw new StudioError(404, 'UNKNOWN_ID', 'Unknown AAPES API endpoint.');
}
