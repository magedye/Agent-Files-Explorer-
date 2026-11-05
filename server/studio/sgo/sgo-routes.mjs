import crypto from 'node:crypto';
import { SgoStore } from './sgo-store.mjs';
import { SgoAnalyzer } from './sgo-analyzer.mjs';
import { SgoChat } from './sgo-chat.mjs';
import { SgoExporter } from './sgo-export.mjs';
import { StudioError } from '../auth.js';

let sharedStore = null;

export function getSharedSgoStore(options = {}) {
  if (!sharedStore || options.reset || (options.storageRoot && sharedStore.storageRoot !== options.storageRoot)) {
    sharedStore = new SgoStore(options);
  }
  return sharedStore;
}

export function resetSharedSgoStore(options = {}) {
  sharedStore = new SgoStore(options);
  return sharedStore;
}

export function createSgoWorkspaceView() {
  return {
    id: 'sgo-qle',
    name: 'Semantic Governance Observatory (QLE)',
    package_path: 'governance_packages/candidates/QLE_SGO_Candidate',
    package_version: '1.0.0',
    schema_version: '1.2.0',
    read_only: true,
    package_signature_verified: false,
    created_at: '2026-11-05T00:00:00.000Z',
    last_scanned_at: new Date().toISOString()
  };
}

export async function handleSgoApi(req, res, studio) {
  const url = new URL(req.url, 'http://127.0.0.1');
  const pathname = url.pathname;
  const store = getSharedSgoStore({ storageRoot: studio.storageRoot });
  const analyzer = new SgoAnalyzer(store);
  const chat = new SgoChat(store);
  const exporter = new SgoExporter(store, studio);

  // Canonical Studio send helper
  const send = (status, data, error = null, meta = {}) => {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(JSON.stringify({
      data,
      meta: {
        request_id: crypto.randomUUID(),
        recorded_at: new Date().toISOString(),
        contract_revision: 'contract.1',
        ...meta,
        ...(error ? {
          error: {
            code: error.code || 'INTERNAL_ERROR',
            message: error instanceof StudioError ? error.message : (error.message || 'SGO API error.'),
            halted: true,
            issues: []
          }
        } : {})
      }
    }));
  };

  // Helper to read JSON body
  const readJson = async () => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    if (chunks.length === 0) return {};
    try {
      return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      throw new StudioError(400, 'INVALID_REQUEST', 'Malformed JSON in request body.');
    }
  };

  try {
    // -------------------------------------------------------------------------
    // Priority 2: Security & Authorization Boundary Enforcement
    // -------------------------------------------------------------------------
    // All SGO routes require canonical Studio authentication
    const principal = studio.authority.authenticate(req);

    // 1. Overview
    if (req.method === 'GET' && pathname === '/api/v1/sgo/overview') {
      return send(200, store.getOverview());
    }

    // 2. Items list & detail
    if (req.method === 'GET' && pathname === '/api/v1/sgo/items') {
      const filters = {
        origin: url.searchParams.get('origin') || undefined,
        force: url.searchParams.get('force') || undefined,
        q: url.searchParams.get('q') || undefined,
        population: url.searchParams.get('population') || undefined,
        include_additions: url.searchParams.get('include_additions') || undefined,
        limit: url.searchParams.get('limit') || 100,
        offset: url.searchParams.get('offset') || 0
      };
      return send(200, store.getItems(filters));
    }

    const itemDetailMatch = pathname.match(/^\/api\/v1\/sgo\/items\/([^/]+)$/);
    if (req.method === 'GET' && itemDetailMatch) {
      const item = store.getItem(itemDetailMatch[1]);
      if (!item) throw new StudioError(404, 'UNKNOWN_ID', `Item '${itemDetailMatch[1]}' not found.`);
      return send(200, item);
    }

    // 3. Priority Decisions list & detail
    if (req.method === 'GET' && pathname === '/api/v1/sgo/priority-decisions') {
      return send(200, store.getPriorityDecisions());
    }

    const pDecisionDetailMatch = pathname.match(/^\/api\/v1\/sgo\/priority-decisions\/([^/]+)$/);
    if (req.method === 'GET' && pDecisionDetailMatch) {
      const dec = store.getPriorityDecision(pDecisionDetailMatch[1]);
      if (!dec) throw new StudioError(404, 'UNKNOWN_ID', `Priority Decision '${pDecisionDetailMatch[1]}' not found.`);
      return send(200, dec);
    }

    // 4. Semantic Relations Graph
    if (req.method === 'GET' && pathname === '/api/v1/sgo/relations') {
      const filters = {
        type: url.searchParams.get('type') || undefined,
        catalog: url.searchParams.get('catalog') || undefined,
        basis: url.searchParams.get('basis') || undefined,
        item_id: url.searchParams.get('item_id') || undefined,
        limit: url.searchParams.get('limit') || 500
      };
      return send(200, store.getRelations(filters));
    }

    // 5. Co-Merge Lab Analysis
    if (req.method === 'POST' && pathname === '/api/v1/sgo/merge/analyze') {
      const body = await readJson();
      const sourceIds = body.source_item_ids || body.source_ids || [];
      const statement = body.candidate_statement || body.statement || '';
      const opts = {
        proposed_force: body.proposed_force || body.options?.proposed_force,
        simulate_drop_p0: body.simulate_drop_p0 || body.options?.simulate_drop_p0,
        ...(body.options || {})
      };
      const analysis = analyzer.analyzeMergeProposal(sourceIds, statement, opts);
      return send(200, analysis);
    }

    // 6. Impact Simulator
    if (req.method === 'POST' && pathname === '/api/v1/sgo/impact/simulate') {
      const body = await readJson();
      const targetId = body.target_item_id || body.target_id;
      if (!targetId) throw new StudioError(400, 'INVALID_REQUEST', 'target_item_id is required.');
      const simulation = analyzer.simulateImpact(targetId, body.proposed_change || {});
      return send(200, simulation);
    }

    // 7. Grounded Policy Chat
    if (req.method === 'POST' && (pathname === '/api/v1/sgo/chat' || pathname === '/api/v1/sgo/chat/ask')) {
      const body = await readJson();
      const question = body.question || body.query || '';
      const answer = chat.ask(question, body.options || {});
      return send(200, answer);
    }

    // 8. Non-Normative Draft Decisions (Requires valid session)
    if (req.method === 'POST' && pathname === '/api/v1/sgo/decisions/draft') {
      const body = await readJson();
      const draft = store.saveDraftDecision(body, principal?.actor || 'operator');
      return send(201, draft);
    }

    // 8b. Representation Mapping (AC-07)
    if (req.method === 'GET' && pathname === '/api/v1/sgo/representations') {
      return send(200, store.getRepresentationMapping());
    }

    // 9. Protected Owner Decision Recording (Fails closed if not provisioned)
    if (req.method === 'POST' && pathname === '/api/v1/sgo/decisions/protected') {
      const body = await readJson();
      const decision = store.recordProtectedOwnerDecision(body, principal, {
        synthetic: body.synthetic === true || principal?.actor === 'synthetic-owner-test',
        scope: body.scope || principal?.scope
      });
      return send(201, decision);
    }

    // 10. Audit Ledger & Hash Chain Verification
    if (req.method === 'GET' && pathname === '/api/v1/sgo/audit/ledger') {
      return send(200, store.getAuditLedger());
    }

    if (req.method === 'GET' && pathname === '/api/v1/sgo/audit/verify') {
      return send(200, store.verifyLedgerIntegrity());
    }

    // 10b. Verifiable Backup Snapshot & Safe Restore Verification (AC-40)
    if (pathname === '/api/v1/sgo/backup') {
      if (req.method === 'GET') {
        return send(200, store.createBackupSnapshot());
      }
      if (req.method === 'POST') {
        const body = await readJson();
        return send(200, store.verifyBackupSnapshot(body));
      }
    }

    // 10c. Safe Archive / Input Validation (AC-47)
    if (req.method === 'POST' && pathname === '/api/v1/sgo/archive/validate') {
      const body = await readJson();
      const result = store.validateArchiveSafety(body.entries || []);
      return send(200, result);
    }

    // 11. Governed Exports
    const exportMatch = pathname.match(/^\/api\/v1\/sgo\/export\/([^/]+)$/);
    if (req.method === 'GET' && exportMatch) {
      const exportType = decodeURIComponent(exportMatch[1]);
      const artifact = exporter.exportArtifact(exportType);
      res.writeHead(200, {
        'Content-Type': artifact.mime_type,
        'Content-Disposition': `attachment; filename="${artifact.filename}"`,
        'Cache-Control': 'no-store'
      });
      return res.end(artifact.content);
    }

    // 12. Governed Draft Change Package Proposing
    if (req.method === 'POST' && pathname === '/api/v1/sgo/propose-change-package') {
      const body = await readJson();
      const result = await exporter.proposeChangePackage(body, studio, principal);
      return send(201, result);
    }

    throw new StudioError(404, 'UNKNOWN_ROUTE', `SGO endpoint '${pathname}' not found.`);
  } catch (error) {
    if (error instanceof StudioError) {
      return send(error.status, null, error);
    }
    const status = error.status || 500;
    return send(status, null, {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Internal SGO server error.'
    });
  }
}
