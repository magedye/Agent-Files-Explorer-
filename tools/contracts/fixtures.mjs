// Independent synthetic transport examples. None of these names, hashes or approvals is runtime evidence.
import { encodeJsonl } from './evidence_jsonl.mjs';
import { createHash } from 'node:crypto';

export function contractVectors(catalog, settings) {
  const time = '2026-10-22T00:00:00Z';
  const h = 'sha256:' + '0'.repeat(64);
  const artifact = { path: 'synthetic://contract-fixture', content_hash: h, bytes: 0 };
  const issue = { code: 'SYNTHETIC_ONLY', message: 'Synthetic contract example, never a runtime verdict.', severity: 'warning' };
  const unknownTrust = { status: 'UNKNOWN', evidence: [], reason: 'Synthetic, no trusted issuer.' };
  const notRun = { status: 'NOT_RUN', evidence: [], reason: 'Synthetic test, not executed.' };
  const qualification = { skillId: 'synthetic-skill', host: 'synthetic-host', hostVersion: '0-test', scope: 'synthetic/**', contentHash: h, status: 'NOT_RUN' };
  const permissions = { read: ['synthetic/**'], write: [], network: 'deny', secrets: 'deny' };
  const capability = { skillId: 'synthetic-skill', source: 'project', function: 'verification', permissions, inputs: [{ name: 'input', schema: { type: 'string' } }], outputs: [{ name: 'report', schema: { type: 'string' } }] };
  const item = { id: 'CONTRACT-TEST-ONLY', kind: 'OBSERVATION', force: 'INFORMATIVE', severity: 'info', scope: {}, rule: 'Synthetic structural example.', impact: { evidence: 'assumed' } };
  const itemView = { item, source_path: 'synthetic/item.yaml', source_hash: h, source_yaml: JSON.stringify(item), validation_status: 'VALID', diagnostics: [], translation_unavailable: true, is_review_due: null, priority_tier: null, issuer_trust: unknownTrust };
  const observation = { state: 'NOT_RUN', evidence: [], reason: 'Synthetic fixture only.' };
  const usage = { task_id: 'synthetic-task', skill_id: 'synthetic-skill', selected: observation, loaded: observation, host_signal: observation, executed: observation, verified: observation };
  const run = { id: 'synthetic-run', workspace_id: 'synthetic-workspace', command: 'eval', args: [], status: 'errored', exit_code: null, started_at: time, finished_at: time, duration_ms: 0, resource_peak_mib: null, limits: settings.limits.eval, engine: settings.engine, control_adapter: null, termination_reason: 'controls_unavailable', raw_stdout: '', raw_stderr: 'Synthetic only: controls not qualified.', raw_output: 'Synthetic only: controls not qualified.', summary: { errors: [], warnings: [issue], p0_issues: 0 }, linked_package_id: null, candidate_hash: h, inputs_hash: h, config_hash: h, evidence: [] };
  const generation = { content: '', content_hash: h, stage: 'fail', byte_size: 0, byte_delta: 0, budget_bytes: 32768, p0_preserved: false, prin_007_present: false, adoption_level: 'L1', p0_evidence: [], overflow_items: ['SYNTHETIC-P0'], acknowledgements: [], lookup: notRun, run_id: 'synthetic-run' };
  const source = { type: 'request', ref: 'synthetic-only' };
  const proposal = 'synthetic: true\n';
  const preview = { proposal_version_hash: h, diff: '', files: [], source_written: false, state_written: false };
  const cp = { id: 'SYNTHETIC-CP', workspace_id: 'synthetic-workspace', title: 'Synthetic example', kind: 'GUIDELINE', target_item_id: null, status: 'draft', source, base_package_version: '0.0.0-test', base_candidate_hash: h, proposed_yaml: proposal, proposal_version_hash: h, checks: { validate: notRun, lint: notRun, skill_states: notRun, generate: notRun, doctor: notRun, eval: notRun }, generation: null, ci_comparison: null, required_approvals: ['governance-owner'], approvals: [], approval_history: [], blockers: [issue], created_by: 'synthetic-actor', created_at: time, updated_at: time, impact: { on_authority: 'Synthetic only', on_compatibility: 'Not evaluated', on_consumers: [], budget_deltas: {} }, preview };
  const exported = { package_id: 'SYNTHETIC-CP', proposal_version_hash: h, format: 'patch', artifact, commit_sha: null, signed: false, warnings: ['Synthetic transport example, no export occurred.'], state_written: false, publication: 'NOT_PERFORMED' };
  const adoption = { id: 'SYNTHETIC-CP', change_package_id: 'SYNTHETIC-CP', target_project_id: 'synthetic-project', level: 'L1', profile: 'synthetic', proposal_version_hash: h, status: 'draft' };
  const workspace = { id: 'synthetic-workspace', name: 'Synthetic', package_path: '/synthetic/not-an-installation', package_version: '0.0.0-test', schema_version: '1.2', read_only: true, package_signature_verified: false, created_at: time, last_scanned_at: null };
  const project = { id: 'synthetic-project', workspace_id: workspace.id, name: 'Synthetic project', path: '/synthetic/project', host: 'synthetic-host', host_version: '0-test', instruction_level: 'L0', skill_level: 'L0' };
  const selection = { skill_id: 'synthetic-skill', preferred: true, alternatives: [], rationale: 'Synthetic test.' };
  const record = { task_id: 'synthetic-task', session: { agent: 'synthetic-host', agent_version: '0-test', host_os: 'test', started_at: time }, events: [{ at: time, type: 'discovery.outcome', task_language: 'ar', outcome: 'NO_SKILL_MATCH', reason: 'Synthetic only.' }], submit_to_ci: false };
  const bytes = encodeJsonl([record]);
  const sourceHash = 'sha256:' + createHash('sha256').update(bytes).digest('hex');
  const task = { task_id: 'synthetic-task', agent: 'synthetic-host', agent_version: '0-test', event_count: 1, attention_flags: [], parse_status: 'VALID' };
  const metric = unit => ({ status: 'NOT_RUN', value: null, unit, numerator: null, denominator: null, evidence: [], reason: 'No measurement in this synthetic fixture.' });
  const metrics = { workspace_id: workspace.id, captured_at: time, candidate_hash: h, package_version: '0.0.0-test', period_start: time, period_end: time,
    instruction_metrics: { policy_coverage_pct: metric('percent'), eval_pass_rate_pct: metric('percent'), exception_half_life_days: metric('days'), drift_rate_pct: metric('percent'), calibration_coverage_pct: metric('percent') },
    skill_metrics: { skill_qualification_coverage_pct: metric('percent'), skill_eval_pass_rate_pct: metric('percent'), false_success_rate_pct: metric('percent'), discovery_recall_multilingual_pct: metric('percent'), qualification_drift_count: metric('count') },
    honesty: metric('percent'), behavioral: metric('percent'), discovery_reporting_accuracy: metric('percent') };
  const audit = { id: 1, at: time, actor: 'synthetic-actor', actor_role: 'developer', simulated_role: 'governance-owner', event_type: 'synthetic.preview', workspace_id: workspace.id, resource_type: 'synthetic', resource_id: 'synthetic', payload: { note: 'Simulation confers no authority.' } };
  const fixtures = new Map();
  const set = (file, name, value) => fixtures.set(`${file}.schema.json#/$defs/${name}`, value);
  for (const [name, value] of Object.entries({ WorkspaceCreate: { name: 'Synthetic', package_path: '/synthetic/package' }, Workspace: workspace, Workspaces: [workspace], Scan: { workspace_id: workspace.id, scanned_at: time, duration_ms: 0, counts: { items: 1 }, issues: [], source_written: false }, ProjectCreate: { name: project.name, path: project.path, host: project.host, host_version: project.host_version }, Project: project, Projects: [project], ProjectConfig: { project_id: project.id, state: null, source: null, profile: null, selections: [selection] }, ItemView: itemView, Items: [itemView], Relations: [{ source_id: item.id, target_id: 'synthetic-other', relation: 'references', resolved: false }], History: [{ item_id: item.id, source_hash: h, source_path: 'synthetic.yaml', at: time, change_package_id: null }], Calibrations: [{ item_id: item.id, change_package_id: cp.id, eval_run_id: run.id, measured_delta: 0.1, at: time, reason: 'Synthetic calibration transport only, not approved.', evidence: [artifact] }], CapabilityView: { item_id: item.id, capability, qualifications: [qualification], availability: [observation], source_path: 'synthetic/capability.yaml', content_hash: h, issuer_trust: unknownTrust }, Qualifications: [qualification], Usages: [usage], Matrix: { skills: [qualification.skillId], hosts: [{ host: qualification.host, host_version: qualification.hostVersion }], cells: [qualification] }, EvidenceTasks: [task], EvidenceDetail: { task, source_file: 'synthetic-task.jsonl', source_hash: sourceHash, raw_source_base64: bytes.toString('base64'), source_bytes: bytes.length, issues: [] }, EvidenceEvents: [{ task_id: task.task_id, source_file: 'synthetic-task.jsonl', source_line: 1, source_hash: sourceHash, event: record.events[0] }], EvidenceSubmission: { task_id: task.task_id, source_hash: sourceHash, state_written: false, evidence_written: false, ci_status: 'NOT_RUN' }, Metrics: metrics, MetricsHistory: [metrics], AuditEvent: audit, AuditEvents: [audit] })) set('api.read', name, value);
  fixtures.set('api.read.schema.json#/$defs/Capabilities', [fixtures.get('api.read.schema.json#/$defs/CapabilityView')]);
  for (const [name, value] of Object.entries({ GeneratePreviewRequest: { agent: 'synthetic-host', profile: 'synthetic', dry_run: true }, Generation: generation, GenerateExportRequest: { agent: 'synthetic-host', profile: 'synthetic', mode: 'file' }, GeneratedDownload: { content: 'Synthetic only', content_hash: h, filename: 'synthetic.md', repository_written: false }, VerifyRequest: { command: 'eval', args: ['--fixture', 'synthetic'] }, StartedRun: { run_id: run.id }, VerificationRun: run, VerificationRuns: [run], Sarif: { version: '2.1.0', runs: [] }, StreamFrame: { run_id: run.id, sequence: 0, at: time, type: 'heartbeat' } })) set('api.execution', name, value);
  for (const [name, value] of Object.entries({ Create: { title: cp.title, kind: cp.kind, source, proposed_yaml: proposal }, Edit: { proposed_yaml: proposal }, ApprovalRequest: { role: 'governance-owner', decision: 'approve', reason: 'Synthetic requested slot only; no authority granted.' }, Package: cp, Packages: [cp], Preview: preview, ExportRequest: { format: 'patch' }, Export: exported, AdoptionCreate: { target_project_id: project.id, level: 'L1', profile: 'synthetic' }, Adoption: adoption, AdoptionApply: { mode: 'patch' } })) set('api.change', name, value);
  for (const [name, value] of Object.entries({ RolesPatch: { bindings: [{ principal: 'synthetic-principal', roles: ['developer'] }] }, GitPatch: { gpg_key_id: null }, LimitsPatch: { eval: settings.limits.eval }, HostsPatch: { hosts: [{ host: 'synthetic-host', binary_path: '/synthetic/not-executable', version_detection: { kind: 'argv', args: ['--version'] }, budget_bytes: 32768 }] }, SecurityPatch: { audit_retention_days: 90 }, SigningResult: { status: 'NOT_RUN', key_id: null, evidence: [], reason: 'No signing performed.', repository_written: false } })) set('settings', name, value);
  fixtures.set('settings.schema.json', settings);
  set('transport', 'Ack', { accepted: true, resource_id: 'synthetic-only' });
  set('transport', 'RemovedRegistration', { id: 'synthetic-only', registration_removed: true, source_deleted: false });
  const meta = { request_id: 'synthetic-request', contract_revision: 'contract.1', recorded_at: time };
  const vectors = [];
  const add = (name, schema, value, valid) => vectors.push({ name, schema, value, valid });
  const requests = new Set();
  for (const operation of catalog.operations) {
    if (operation.request && !requests.has(operation.request)) {
      requests.add(operation.request);
      if (!fixtures.has(operation.request)) throw new Error('Missing independent request fixture: ' + operation.request);
      const example = fixtures.get(operation.request);
      add('request_' + operation.operation_id, operation.request, example, true);
      add('reject_body_authority_' + operation.operation_id, operation.request, { ...example, authenticated_actor: 'forged-owner' }, false);
    }
    if (!fixtures.has(operation.response)) throw new Error('Missing independent response fixture: ' + operation.response);
    const schema = `api.responses.schema.json#/$defs/${operation.operation_id}Response`;
    add('response_' + operation.operation_id, schema, { data: fixtures.get(operation.response), meta }, true);
    add('reject_false_success_shape_' + operation.operation_id, schema, { data: 'PASS_WITHOUT_TYPED_RESULT', meta }, false);
  }
  const error = { code: 'DISCOVERY_UNAVAILABLE', message: 'Synthetic discovery failure.', halted: true, issues: [] };
  add('discovery_failure_error_envelope', 'transport.schema.json#/$defs/ErrorEnvelope', { data: null, meta: { ...meta, error } }, true);
  add('discovery_unavailable_cannot_be_nonhalting', 'transport.schema.json#/$defs/ErrorEnvelope', { data: null, meta: { ...meta, error: { ...error, halted: false } } }, false);
  add('no_skill_match_is_not_an_error_code', 'transport.schema.json#/$defs/ErrorEnvelope', { data: null, meta: { ...meta, error: { ...error, code: 'NO_SKILL_MATCH' } } }, false);
  add('missing_translation_keeps_invalid_item_visible', 'api.read.schema.json#/$defs/ItemView', { ...itemView, item: null, validation_status: 'INVALID', diagnostics: [issue] }, true);
  add('unmeasured_metric_cannot_claim_zero', 'api.read.schema.json#/$defs/Metric', { ...metric('percent'), value: 0 }, false);
  add('measured_metric_needs_evidence', 'api.read.schema.json#/$defs/Metric', { ...metric('percent'), status: 'MEASURED', value: 1, numerator: 1, denominator: 100 }, false);
  add('resource_limit_cannot_mean_user_cancel', 'api.execution.schema.json#/$defs/VerificationRun', { ...run, status: 'resource_limit_exceeded', termination_reason: 'user_cancelled' }, false);
  add('exit_failure_cannot_be_passed', 'api.execution.schema.json#/$defs/VerificationRun', { ...run, status: 'passed', exit_code: 1, termination_reason: 'completed' }, false);
  add('engine_unconfigured_cannot_claim_qualified', 'engine.schema.json', { ...settings.engine, status: 'QUALIFIED' }, false);
  add('host_permissions_are_declarations', 'capability.schema.json', capability, true);
  add('qualification_list_preserves_multiple_skills', 'item.schema.json', { ...item, scope: { skillIds: ['synthetic-skill', 'synthetic-other'] }, skillQualification: [qualification, { ...qualification, skillId: 'synthetic-other' }] }, true);
  add('capability_has_full_payload', 'item.schema.json', { ...item, kind: 'CAPABILITY', ...capability, skillQualification: qualification }, true);
  add('capability_missing_permissions_rejected', 'item.schema.json', { ...item, kind: 'CAPABILITY', ...capability, permissions: undefined, skillQualification: qualification }, false);
  add('exception_needs_expiry_and_target', 'item.schema.json', { ...item, kind: 'EXCEPTION' }, false);
  add('exception_complete_structural_record', 'item.schema.json', { ...item, kind: 'EXCEPTION', expiresOn: '2026-12-31', references: ['SYNTHETIC-TARGET'] }, true);
  add('repo_measured_needs_measurement_metadata', 'item.schema.json', { ...item, impact: { evidence: 'repo-measured' } }, false);
  add('settings_cannot_disable_resource_controls', 'settings.schema.json', { ...settings, resource_controls: { ...settings.resource_controls, require_qualified_process_tree_adapter: false } }, false);
  add('settings_cannot_disable_ci_state_ownership', 'settings.schema.json', { ...settings, sources: { ...settings.sources, canonical_state: 'write' } }, false);
  const state = { schemaVersion: '1.2', aghrVersion: '0.0.0-test', adoptionLevel: 'L0', domainLevels: { instructions: 'L0', skills: 'L0' }, evalStatus: 'NOT_RUN', skillQualification: [qualification], exceptions: [], publication: { publisher: 'ci', ciRunRef: 'synthetic-only-not-authenticated', commitHash: '0'.repeat(40), publishedAt: time, sourceEvidence: [] } };
  add('state_structure_does_not_authenticate_ci', 'state.schema.json', state, true);
  add('agent_is_not_a_state_publisher', 'state.schema.json', { ...state, publication: { ...state.publication, publisher: 'agent' } }, false);
  add('published_eval_pass_requires_evidence', 'state.schema.json', { ...state, evalStatus: 'PASS' }, false);
  add('project_selection_wrapper', 'proposal.schema.json', { kind: 'PROJECT_SELECTION', project_id: project.id, selections: [selection] }, true);
  add('generated_file_wrapper', 'proposal.schema.json', { kind: 'GENERATED_FILE', target_project_id: project.id, files: [{ path: 'synthetic.md', content: 'synthetic', content_hash: h }] }, true);
  add('calibration_wrapper_is_not_an_item_kind', 'proposal.schema.json', { kind: 'calibration', target_item_id: item.id, eval_run_id: run.id, measured_delta: 0.1, reason: 'Synthetic contract only.', proposed_item: { ...item, impact: { evidence: 'repo-measured', lastCalibrated: '2026-10-22', measuredDelta: 0.1 } } }, true);
  add('governance_item_is_a_supported_proposal', 'proposal.schema.json', item, true);
  add('server_authorization_context_structure', 'auth.schema.json', { authenticated_actor: 'synthetic-actor', server_resolved_role: 'developer', action: 'read:synthetic', workspace_id: workspace.id, target_project: null, resource_id: null, proposal_version_hash: null, installation_owner_verified: false }, true);
  add('verified_issuer_without_provenance_rejected', 'auth.schema.json#/$defs/Trust', { status: 'VERIFIED', issuer: 'self-claimed', evidence: [] }, false);
  add('raw_host_acknowledgement_has_no_lifecycle_claim', 'evidence.schema.json', { ...record, events: [{ at: time, type: 'host.acknowledged', skill_id: 'synthetic-skill', acknowledgement: { synthetic_only: true } }] }, true);
  add('resource_adapter_cannot_self_qualify_without_controls', 'engine.schema.json#/$defs/ControlAdapter', { platform: 'synthetic', adapter: 'synthetic', status: 'QUALIFIED', process_tree: false, wall_clock: false, memory: false, evidence: [] }, false);
  add('approval_role_is_a_slot_not_an_actor_override', 'api.change.schema.json#/$defs/ApprovalRequest', { role: 'governance-owner', decision: 'approve', reason: 'Synthetic slot request.' }, true);
  add('generation_acknowledgement_cannot_forge_role', 'api.execution.schema.json#/$defs/AcknowledgementInput', { stage: 'compact', reason: 'Synthetic', role: 'governance-owner' }, false);
  add('loading_axis_cannot_report_verified', 'api.read.schema.json#/$defs/Usage', { ...usage, loaded: { state: 'VERIFIED', evidence: [artifact] } }, false);
  add('verified_axis_requires_evidence_refs', 'api.read.schema.json#/$defs/Usage', { ...usage, verified: { state: 'VERIFIED', evidence: [] } }, false);
  return vectors;
}
