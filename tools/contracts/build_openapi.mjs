// Deterministic transport documentation compiler. No authorization or AGHR policy evaluation.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const directory = path.join(project, 'docs/contracts/aghr-rc3');
const catalog = JSON.parse(fs.readFileSync(path.join(directory, 'API_OPERATIONS.json'), 'utf8'));
const ref = $ref => ({ $ref });
const text = { type: 'string', minLength: 1 };
const common = name => ref(`common.schema.json#/$defs/${name}`);

function queryParameter(name, operation) {
  let schema = text;
  const cps = operation.path.endsWith('/cps');
  const types = {
    kind: ref(cps ? 'api.change.schema.json#/$defs/Kind' : 'item.schema.json#/properties/kind'),
    force: ref('item.schema.json#/properties/force'),
    priority: common('Priority'), tier: common('Priority'),
    authority_level: ref('item.schema.json#/properties/authority/properties/level'),
    status: ref(cps ? 'api.change.schema.json#/$defs/Status' : 'item.schema.json#/properties/authority/properties/status'),
    impact_evidence: ref('item.schema.json#/properties/impact/properties/evidence'),
    is_review_due: { type: 'boolean' },
    source: ref('capability.schema.json#/$defs/Fields/properties/source'),
    function: ref('capability.schema.json#/$defs/Fields/properties/function'),
    qual_status: common('QualificationStatus'), requires_role: common('ApprovalRole'),
    attention_flag: ref('api.read.schema.json#/$defs/EvidenceTask/properties/attention_flags/items'),
    date_from: common('Time'), date_to: common('Time'),
    q: { type: 'string' },
    days: { type: 'integer', minimum: 1, maximum: 3650, default: 90 },
    limit: { type: 'integer', minimum: 1, maximum: 500, default: operation.default_limit || 100 },
    cursor: { type: 'string', minLength: 1, maxLength: 4096 }
  };
  schema = types[name] || schema;
  return { name, in: 'query', required: false, schema };
}

const result = {
  openapi: '3.1.0',
  jsonSchemaDialect: 'https://json-schema.org/draft/2020-12/schema',
  info: { title: 'AGHR Governance Studio API contracts', version: '1.0.0-contract.1', description: 'Complete implementation contract, not a running API. Canonical baseline: Studio sections 27-36; explicit submit extension: workflow 37 step 6. Contract verification does not qualify the engine, hosts or release.' },
  servers: [{ url: catalog.base_path }],
  security: [{ StudioToken: [] }],
  'x-contract-status': 'COMPLETE_FOR_IMPLEMENTATION_REVIEW',
  'x-unknown-query-parameters': 'reject',
  'x-authentication': 'Ephemeral startup credential bound to a server-resolved principal. Never accept request-body actor/authority claims. Browser WebSocket clients without X-Studio-Token support use authenticated GET polling; no URL token fallback.',
  paths: {},
  components: {
    securitySchemes: { StudioToken: { type: 'apiKey', in: 'header', name: 'X-Studio-Token', description: 'Rotated at startup; never placed in a URL, persisted setting or source record.' } },
    responses: { Error: { description: 'Typed failure envelope, not success', content: { 'application/json': { schema: ref('transport.schema.json#/$defs/ErrorEnvelope') } } } },
    schemas: {}
  }
};
const envelopes = {};

for (const operation of catalog.operations) {
  const route = result.paths[operation.path] ||= {};
  const socket = operation.method === 'WS';
  const method = socket ? 'get' : operation.method.toLowerCase();
  if (route[method]) throw new Error(`Duplicate API method/path: ${operation.method} ${operation.path}`);
  const wrapper = `${operation.operation_id}Response`;
  envelopes[wrapper] = {
    type: 'object', additionalProperties: false, required: ['data', 'meta'],
    properties: { data: ref(operation.response), meta: { ...ref('transport.schema.json#/$defs/Meta'), not: { required: ['error'] } } }
  };
  result.components.schemas[wrapper] = ref(`api.responses.schema.json#/$defs/${wrapper}`);
  const parameters = [...operation.path.matchAll(/\{([^}]+)\}/g)].map(match => ({ name: match[1], in: 'path', required: true, schema: operation.path === '/audit/events/{id}' ? { type: 'integer', minimum: 1 } : text }));
  const query = [...new Set([...(operation.query || []), ...(operation.paged ? ['limit', 'cursor'] : [])])];
  parameters.push(...query.map(name => queryParameter(name, operation)));
  if (operation.if_match) parameters.push({ name: 'If-Match', in: 'header', required: true, description: `Exact quoted ${operation.if_match}; missing -> 428, stale -> 412. Rechecked immediately before effect.`, schema: { type: 'string', pattern: '^"sha256:[a-f0-9]{64}"$' } });
  const code = String(socket ? 101 : (operation.status || 200));
  const responses = { [code]: socket ? { description: 'Authenticated HTTP Upgrade; subsequent JSON text frames use the x-message-envelope schema.' } : { description: 'Typed result; inspect domain status before claiming success', content: { 'application/json': { schema: ref(`#/components/schemas/${wrapper}`) } } } };
  for (const status of [400, 401, 403, 404, 409, 412, 413, 422, 428, 429, 500, 503]) responses[status] = ref('#/components/responses/Error');
  if (operation.etag || ['api.change.schema.json#/$defs/Package', 'api.change.schema.json#/$defs/Adoption', 'api.change.schema.json#/$defs/Preview', 'api.execution.schema.json#/$defs/Generation'].includes(operation.response)) {
    responses[code].headers = { ETag: { description: 'Quoted server-produced content/proposal hash; never computed from client authority claims.', schema: { type: 'string', pattern: '^"sha256:[a-f0-9]{64}"$' } } };
  }
  route[method] = {
    operationId: operation.operation_id,
    summary: operation.operation_id.replace(/([A-Z])/g, ' $1'),
    'x-source-section': operation.source_section,
    'x-source-method': operation.method,
    'x-required-policy': operation.policy,
    'x-request-body': operation.request ? 'typed' : 'forbidden',
    parameters,
    ...(operation.request ? { requestBody: { required: true, content: { 'application/json': { schema: ref(operation.request) } } } } : {}),
    ...(operation.extension ? { 'x-contract-extension': operation.extension } : {}),
    ...(socket ? { 'x-transport': 'websocket', 'x-message-envelope': ref(`#/components/schemas/${wrapper}`) } : {}),
    responses
  };
}
result.paths = Object.fromEntries(Object.entries(result.paths).sort(([left], [right]) => left < right ? -1 : 1));

const artifacts = {
  'openapi.json': result,
  'api.responses.schema.json': { $schema: 'https://json-schema.org/draft/2020-12/schema', $id: 'https://aghr.invalid/contracts/rc3/api.responses.schema.json', title: 'Generated API response envelopes — do not edit directly', $defs: envelopes }
};
const mode = process.argv[2] || '--check';
if (!['--check', '--write'].includes(mode)) throw new Error('Use --write or --check');
for (const [name, value] of Object.entries(artifacts)) {
  const serialized = JSON.stringify(value, null, 2) + '\n';
  const target = path.join(directory, name);
  if (mode === '--write') fs.writeFileSync(target, serialized, 'utf8');
  else if (fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== serialized) throw new Error(`${name} differs from its catalog; regenerate with --write`);
}
console.log(JSON.stringify({ status: 'PASS', mode, operations: catalog.operations.length, source_operations: catalog.operations.filter(op => !op.extension).length, extension_operations: catalog.operations.filter(op => op.extension).length }));
