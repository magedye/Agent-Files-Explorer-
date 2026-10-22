import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const candidate = 'governance_packages/candidates/AGHR_Candidate_1.3.0';
const reference = 'governance_packages/references/Agent_Governance_Harness_Reference_1.2.0';
const output = 'docs/reviews/aghr-items-2026-10-22';
const absolute = relative => path.join(workspace, relative);
const read = relative => fs.readFileSync(absolute(relative), 'utf8');
const json = relative => JSON.parse(read(relative));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const fileRecord = relative => ({ path: relative, bytes: fs.statSync(absolute(relative)).size,
  sha256: hash(fs.readFileSync(absolute(relative))) });
const writeJson = (relative, value) => fs.writeFileSync(absolute(relative), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const normalized = text => text.normalize('NFKC').replace(/\s+/g, ' ').trim();
const escape = text => String(text ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('[', '&#91;').replaceAll(']', '&#93;').replaceAll('|', '&#124;');

// Lossless segmentation of explicitly selected documents, never a directory crawl.
// Headings/blank lines/table separators are structural; examples remain examples.
export function segmentMarkdown(raw) {
  const lines = raw.split('\n');
  const clean = lines.map(line => line.replace(/\r$/, ''));
  const structural = new Set();
  const blocks = [];
  let headings = [];
  let tableHeader = null;
  const add = (start, end, type, context = {}) => blocks.push({
    line_start: start + 1, line_end: end + 1, block_type: type,
    section: [...headings], original_text: lines.slice(start, end + 1).join('\n'), ...context,
  });
  let index = 0;
  if (clean[0] === '---') {
    const end = clean.indexOf('---', 1);
    assert.ok(end > 0, 'unterminated YAML front matter');
    for (; index <= end; index++) structural.add(index);
  }
  const isHeader = line => /^#{1,6}\s/.test(line);
  const isList = line => /^\s*(?:[-*+]\s|\d+[.)]\s)/.test(line);
  const isFence = line => /^\s*(`{3,}|~{3,})/.exec(line);
  const isRow = line => /^\s*\|/.test(line);
  const isTableSeparator = line => /^\s*\|?[\s:|\-]+\|\s*$/.test(line) && line.includes('---');
  for (; index < clean.length; index++) {
    const line = clean[index];
    const header = /^(#{1,6})\s+(.+)$/.exec(line);
    if (header) {
      headings = headings.slice(0, header[1].length - 1);
      headings[header[1].length - 1] = header[2];
      structural.add(index); tableHeader = null; continue;
    }
    if (!line.trim() || /^\s*(?:---+|\*\*\*+)\s*$/.test(line)) {
      structural.add(index); continue;
    }
    const fence = isFence(line);
    if (fence) {
      const start = index;
      const marker = fence[1][0];
      const minimum = fence[1].length;
      index++;
      while (index < clean.length && !new RegExp(`^\\s*${marker}{${minimum},}\\s*$`).test(clean[index])) index++;
      assert.ok(index < clean.length, `unterminated code fence at line ${start + 1}`);
      add(start, index, 'EXAMPLE_BLOCK'); continue;
    }
    if (isRow(line)) {
      if (isTableSeparator(line)) { structural.add(index); continue; }
      if (isTableSeparator(clean[index + 1] ?? '')) {
        tableHeader = line; structural.add(index); continue;
      }
      add(index, index, 'TABLE_ROW', { table_header: tableHeader }); continue;
    }
    tableHeader = null;
    const start = index;
    while (index + 1 < clean.length && clean[index + 1].trim() &&
      !isHeader(clean[index + 1]) && !isList(clean[index + 1]) && !isFence(clean[index + 1]) &&
      !isRow(clean[index + 1]) && !/^\s*---+\s*$/.test(clean[index + 1])) index++;
    add(start, index, isList(line) ? 'LIST_ITEM' : 'PARAGRAPH');
  }
  const covered = new Set(structural);
  for (const block of blocks) for (let line = block.line_start - 1; line < block.line_end; line++) {
    assert.ok(!covered.has(line), `overlapping source line ${line + 1}`); covered.add(line);
  }
  assert.equal(covered.size, lines.length, 'unaccounted source lines');
  return { blocks, lines: lines.length, structural_lines: structural.size, covered_lines: covered.size };
}

export function referencedRules(text) {
  const ids = new Set();
  for (const match of text.matchAll(/AGHR-(\d{3}(?:(?:\/|[–-])(?:AGHR-)?\d{3})*)/g)) {
    for (const part of match[1].replaceAll('AGHR-', '').split('/')) {
      const [start, end = start] = part.split(/[–-]/).map(Number);
      if (start < 1 || end > 47 || end < start) continue;
      for (let number = start; number <= end; number++) ids.add(`AGHR-${String(number).padStart(3, '0')}`);
    }
  }
  return [...ids].sort();
}

function selfTest() {
  const fixture = '---\r\nname: test\r\n---\r\n# Title\r\n\r\n1. Main step\r\n   continuation\r\n   - Nested step\r\n\r\n| A | B |\r\n|---|---|\r\n| x | y |\r\n\r\n```json\r\n{"rule":"MUST is example data"}\r\n```\r\n';
  const result = segmentMarkdown(fixture);
  assert.equal(result.blocks.length, 4);
  assert.equal(result.blocks[0].original_text, '1. Main step\r\n   continuation\r');
  assert.equal(result.blocks[2].block_type, 'TABLE_ROW');
  assert.equal(result.blocks[3].block_type, 'EXAMPLE_BLOCK');
  assert.equal(result.covered_lines, fixture.split('\n').length);
  assert.throws(() => segmentMarkdown('```sh\nunterminated'), /unterminated code fence/);
  assert.deepEqual(referencedRules('AGHR-002/004/015–017 and AGHR-041–043'),
    ['AGHR-002', 'AGHR-004', 'AGHR-015', 'AGHR-016', 'AGHR-017', 'AGHR-041', 'AGHR-042', 'AGHR-043']);
  console.log('PASS: lossless CRLF segmentation, nested steps, tables, example separation, malformed fences, rule ranges.');
}

const ruleNamesAr = [
  'مرجعية المطور التقنية','فصل أبعاد السلطة','التمييز بين الواقع والالتزام','منع الترقية التلقائية للمحتوى',
  'حل التعارض بحسب النطاق','اقتصاد التعليمات والسياق','حفظ السياق والثقة','التكييف المرتبط بالإصدار',
  'هدف منتج قابل للتحقق','استمرار العمل ضمن التفويض','تخطيط متناسب','حماية العمل غير المرتبط',
  'سلامة الواجهات والاعتماديات','منع التلاعب بالاختبارات','إعادة الإنتاج والتحقق من التراجع','صدق الأدلة',
  'فصل التنفيذ والتحقق والقبول','أقل الصلاحيات','التفويض وقت الأثر','حماية منظومة التحكم',
  'حماية البيانات ومسارات خروجها','مقاومة حقن التعليمات','موافقة محددة النطاق','تفويض الوكلاء بحدود',
  'إعادة محاولة آمنة','حالة مشروع مرجعية مستدامة','ميزانيات الموارد','رصد آمن',
  'مسار موحد لاستقبال التغييرات','استثناءات محددة','إبطال الأدلة المتأثرة','حيازة المصادر',
  'ملفات ضمان متناسبة','أبسط تصميم كافٍ','التوقف والاسترداد','ربط الادعاء بالأثر الفعلي',
  'صحة بروتوكول الأدوات','حوكمة سلسلة توريد التعليمات','تأهيل المضيف','تقييم النتائج والسلوك',
  'استيضاح مؤثر ومحدد','بدائل عملية دون استبدال الهدف','تسليم متناسب مع دورة الحياة',
  'وضوح الفرع والإغلاق الآمن','تواصل واضح وتسليم قابل للتنفيذ','اتساق الخطة والانحراف المرصود',
  'انطباق المعايير وحدود ادعاء المطابقة',
];
const ruleKinds = [
  'PRINCIPLE','PRINCIPLE','PRINCIPLE','CONSTRAINT','PROCEDURE','GUIDELINE','REQUIREMENT','PROCEDURE',
  'REQUIREMENT','PRINCIPLE','GUIDELINE','CONSTRAINT','REQUIREMENT','CONSTRAINT','PROCEDURE','CONSTRAINT',
  'PRINCIPLE','PRINCIPLE','CONSTRAINT','CONSTRAINT','CONSTRAINT','CONSTRAINT','PROCEDURE','PROCEDURE',
  'PROCEDURE','REQUIREMENT','CONSTRAINT','REQUIREMENT','PROCEDURE','PROCEDURE','CONSTRAINT','REQUIREMENT',
  'POLICY','GUIDELINE','PROCEDURE','CONSTRAINT','REQUIREMENT','PROCEDURE','REQUIREMENT','REQUIREMENT',
  'PROCEDURE','PROCEDURE','PROCEDURE','PROCEDURE','REQUIREMENT','PROCEDURE','REQUIREMENT',
];
const typeNames = {
  CORE_RULE: 'قاعدة حاكمة', SKILL: 'مهارة اختيارية', STANDARD_RECOMMENDATION: 'توصية هندسية للمعايير',
  DOCUMENT_CLAUSE: 'فقرة أو خطوة شارحة', DOCUMENT_TABLE_ROW: 'صف في جدول توثيقي', EXAMPLE_BLOCK: 'مثال توضيحي',
  PROFILE: 'ملف ضمان', ADAPTER: 'موائم موثق', SCENARIO: 'سيناريو تقييم', HOST_QUALIFICATION: 'حالة تأهيل مضيف',
  SOURCE_REFERENCE: 'مرجع مصدر', SCHEMA: 'عقد بيانات', TEMPLATE: 'قالب سجل',
  ENFORCEMENT_RECORD: 'تغطية إنفاذ معلنة', CATALOG_METADATA: 'بيانات سجل ووصف نطاقه',
};
const pointerEscape = value => value.replaceAll('~', '~0').replaceAll('/', '~1');
const stable = value => JSON.stringify(value, (_, entry) => entry && !Array.isArray(entry) && typeof entry === 'object'
  ? Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a.localeCompare(b))) : entry);

function selectSources(manifest) {
  const roots = ['AGENTS.md','CHARTER.md','ARCHITECTURE.md','README.md','LICENSE.md','THIRD_PARTY_NOTICES.md','START_HERE.md','START_HERE_AR.md',
    'CONTEXT_GUIDE.md','sources/REFERENCE_POLICY.md','runtime/README.md','runtime/SKILLS.md',
    'runtime/DELIVERY.md','SKILLS_CHANGE_PLAN.md','SKILLS_MIGRATION_1_2_TO_1_3.md',
    'optional_skills/README.md','schemas/README.md','evaluations/README.md','evaluations/DELIVERY_EVAL_PLAN_AR.md'];
  const md = Object.keys(manifest.files).filter(file => file.endsWith('.md') && (roots.includes(file) ||
    /^(contracts|policies|procedures|protocols|profiles|prompts|options|standards|adapters|templates)\//.test(file) ||
    /^optional_skills\/[^/]+\/SKILL.md$/.test(file)));
  const catalogs = ['registry/RULES.json','registry/ENFORCEMENT_COVERAGE.json','optional_skills/REGISTER.json',
    'standards/CONTROL_CATALOG.json','adapters/REGISTER.json','sources/REGISTER.json','profiles/PROFILES.json',
    'evaluations/SCENARIOS.json','evaluations/DELIVERY_SCENARIOS.json','evaluations/SKILL_HOST_QUALIFICATION.json'];
  const records = Object.keys(manifest.files).filter(file => /^(schemas\/[^/]+\.schema\.json|templates\/[^/]+\.json)$/.test(file));
  return [...md, ...catalogs, ...records].sort();
}

function targetRoute(type, relative) {
  if (type === 'CORE_RULE') return ['GOVERNANCE_ITEM_DRAFT', ['Instructions Registry', 'Instruction Detail', 'Change Package Detail']];
  if (type === 'SKILL') return ['CAPABILITY_DRAFT', ['Capabilities & Hosts', 'Skill Detail', 'Meta-Governance']];
  if (type === 'STANDARD_RECOMMENDATION') return ['APPLICABILITY_REVIEW', ['Intake & Learning', 'Instructions Registry']];
  if (relative.includes('GOVERNED_LEARNING') || relative.includes('governed-learning') || relative.includes('LESSON'))
    return ['LEARNING_CONTRACT_REVIEW', ['Intake & Learning', 'Change Package Detail']];
  if (relative.includes('SKILLS') || relative.includes('EXTERNAL_CAPABILITIES'))
    return ['SKILL_CONTRACT_REVIEW', ['Capabilities & Hosts', 'Verification & Evidence', 'Runtime Evidence']];
  if (type === 'SCENARIO' || type === 'ENFORCEMENT_RECORD' || type === 'HOST_QUALIFICATION')
    return ['VERIFICATION_REFERENCE', ['Verification & Evidence', 'Runtime Evidence']];
  if (type === 'PROFILE') return ['PROFILE_CONFIGURATION', ['Profiles & Scope', 'Dashboard']];
  if (type === 'ADAPTER') return ['HOST_PROVIDER_CONFIGURATION', ['Settings', 'Capabilities & Hosts']];
  if (['SOURCE_REFERENCE','CATALOG_METADATA','EXAMPLE_BLOCK'].includes(type)) return ['REFERENCE_ONLY', ['Intake & Learning']];
  if (['SCHEMA','TEMPLATE'].includes(type)) return ['DATA_CONTRACT_REVIEW', ['Instruction Detail', 'Intake & Learning']];
  return ['EXPLANATION_OR_PROCEDURE_REVIEW', ['Instruction Detail', 'Meta-Governance']];
}

export function attachContexts(items) {
  const byFile = new Map();
  for (const item of items.filter(row => row.source.line_start)) byFile.set(item.source.path, [...(byFile.get(item.source.path) ?? []), item]);
  for (const rows of byFile.values()) for (const [index, item] of rows.entries()) {
    const skillName = /optional_skills\/([^/]+)\/SKILL\.md$/.exec(item.source.path)?.[1];
    item.context = { heading_path: item.source.section.filter(Boolean), preceding_item_id: rows[index - 1]?.id ?? null,
      following_item_id: rows[index + 1]?.id ?? null, parent_skill_id: skillName ? `SKILL-${skillName}` : null,
      standalone_import: 'REQUIRES_SHARED_CONDITION_AND_EXCEPTION_REVIEW' };
  }
}

export function fieldChanges(before, after, pointer = '') {
  if (stable(before) === stable(after)) return [];
  if (before && after && !Array.isArray(before) && !Array.isArray(after) &&
    typeof before === 'object' && typeof after === 'object') {
    return [...new Set([...Object.keys(before), ...Object.keys(after)])].flatMap(key =>
      fieldChanges(before[key], after[key], `${pointer}/${pointerEscape(key)}`));
  }
  return [{ pointer, before_present: before !== undefined, after_present: after !== undefined,
    before: before ?? null, after: after ?? null }];
}

function build(extend = false) {
  const existing = extend ? json(`${output}/REVIEW_REGISTER.json`) : null;
  if (!extend) assert.ok(!fs.existsSync(absolute(`${output}/REVIEW_REGISTER.json`)), 'Existing review data must not be overwritten.');
  const extensionCustody = existing ? { prior_register: fileRecord(`${output}/REVIEW_REGISTER.json`),
    prior_rows: existing.items.length, prior_inputs: json(`${output}/evidence/before.json`) } : null;
  const manifest = json(`${candidate}/MANIFEST.json`);
  const oldManifest = json(`${reference}/MANIFEST.json`);
  const paths = selectSources(manifest);
  const selected = new Set(paths);
  const packageFiles = [];
  const documents = new Map();
  const oldDocuments = new Map();
  const segmentCoverage = [];
  for (const relative of paths) {
    assert.ok(relative.split('/').every(part => part && part !== '.' && part !== '..') && !/[:\\\0]/.test(relative), 'portable bounded source path');
    assert.ok(!/(^|\/)(compatibility|verification)(\/|$)|^design\//.test(relative), 'No-crawl boundary');
    const source = fileRecord(`${candidate}/${relative}`);
    assert.equal(source.sha256, manifest.files[relative], `candidate integrity: ${relative}`);
    const text = read(source.path);
    const current = { ...source, relative, version: '1.3.0', original_text: text };
    if (relative.endsWith('.json')) current.data = JSON.parse(text);
    else current.markdown = segmentMarkdown(text);
    documents.set(relative, current);
    if (oldManifest.files[relative]) {
      const previous = { ...fileRecord(`${reference}/${relative}`), relative, version: '1.2.0' };
      assert.equal(previous.sha256, oldManifest.files[relative], `reference integrity: ${relative}`);
      previous.original_text = read(previous.path);
      if (relative.endsWith('.json')) previous.data = JSON.parse(previous.original_text);
      else previous.markdown = segmentMarkdown(previous.original_text);
      oldDocuments.set(relative, previous);
    }
    packageFiles.push({ relative, current: source, previous: oldDocuments.get(relative) ? fileRecord(oldDocuments.get(relative).path) : null,
      comparison: !oldDocuments.has(relative) ? 'ADDED_FILE' : oldDocuments.get(relative).sha256 === source.sha256 ? 'UNCHANGED_FILE' : 'MODIFIED_FILE' });
    if (current.markdown) segmentCoverage.push({ relative, ...Object.fromEntries(Object.entries(current.markdown).filter(([key]) => key !== 'blocks')),
      blocks: current.markdown.blocks.length });
  }
  const inputFiles = [...packageFiles.flatMap(record => [record.current, record.previous].filter(Boolean)),
    ...[`${candidate}/MANIFEST.json`, `${candidate}/PACKAGE_STATUS.json`, `${reference}/MANIFEST.json`, `${reference}/PACKAGE_STATUS.json`,
      'governance_packages/candidates/AGHR_Candidate_1.3.0.zip','governance_packages/references/Agent_Governance_Harness_Reference_1.2.0.zip',
      'docs/specs/aghr-rc3/AGHR_REFERENCE.md','docs/specs/aghr-rc3/STUDIO_SPECIFICATION.md','docs/specs/aghr-rc3/ADOPTION.json',
      'server/security.js','package.json'].map(fileRecord)];
  const byPath = relative => documents.get(relative).data;
  const items = [];
  function add({ id, type, relative, pointer = '', payload, previous, previousPointer, text, title, kind = null, force = null,
    sourceId = null, location = {}, related = [] }) {
    const current = documents.get(relative);
    const old = oldDocuments.get(relative);
    const route = targetRoute(type, relative);
    const rule = type === 'CORE_RULE';
    const instructionCandidate = rule || type === 'SKILL' || type === 'STANDARD_RECOMMENDATION';
    const missing = instructionCandidate ? ['severity','scope','authority.level','authority.owner','authority.approvedBy',
      'authority.effectiveFrom','rationale','verification.commands','verification.evalFixtures','enforcement.technical',
      'enforcement.mergeEffect','enforcement.gate','impact.band','impact.evidence','reviewCadence','nextReview']
      : ['classification_and_target_route','owning_item_or_procedure','review_disposition'];
    if (instructionCandidate && !force) missing.push('force');
    if (type === 'SKILL') missing.push('skillQualification(host,version,scope,contentHash)');
    const comparison = location.line_start ? !old ? 'ADDED_FILE' : old.markdown.blocks.some(block =>
      normalized(block.original_text) === normalized(text)) ? 'TEXT_PRESENT_IN_REFERENCE' : 'NO_EXACT_TEXT_MATCH_REVIEW_REQUIRED'
      : previous === undefined ? 'NO_PRIOR_RECORD' : stable(payload) === stable(previous) ? 'UNCHANGED_RECORD' : 'MODIFIED_RECORD';
    const inheritedRules = byPath('registry/RULES.json').rules.filter(entry => entry.explanation_ref === relative).map(entry => entry.id);
    const relatedRules = [...new Set([...related, ...referencedRules(text), ...inheritedRules])].sort();
    items.push({ id, source_id: sourceId, record_type: type, record_type_ar: typeNames[type], title,
      original_text: text, original_payload: payload ?? null,
      source: { package_version: '1.3.0', package_status: 'CANDIDATE_FOR_REVIEW', path: current.path, sha256: current.sha256,
        json_pointer: pointer, ...location },
      previous: old ? { package_version: '1.2.0', package_status: 'FINAL_REFERENCE', path: old.path, sha256: old.sha256,
        json_pointer: previousPointer ?? null, original_payload: previous ?? null } : null,
      comparison, comparison_changes: previous === undefined ? [] : fieldChanges(previous, payload),
      instruction_file_comparison: type === 'SKILL' ? {
        current_sha256: documents.get(payload.path)?.sha256 ?? null,
        previous_sha256: oldDocuments.get(payload.path)?.sha256 ?? null,
        status: documents.get(payload.path)?.sha256 === oldDocuments.get(payload.path)?.sha256 ? 'UNCHANGED_INSTRUCTIONS' : 'REVIEW_REQUIRED',
      } : null,
      declared_force: force, related_rule_ids: relatedRules,
      migration: { status: 'NOT_READY_FOR_GOVERNING_IMPORT', route: route[0], proposed_kind: kind,
        classification_status: kind ? 'SUGGESTED_REQUIRES_REVIEW' : 'UNCLASSIFIED',
        proposed_path: rule ? `policies/imported/${id}.yaml` : type === 'SKILL' ? `capabilities/package/${sourceId}.yaml` : null,
        target_screens: route[1], missing_details: missing,
        draft: instructionCandidate ? { id: sourceId ?? id, title, kind, force, severity: null, scope: null, rule: text,
          authority: { source: current.path, level: null, owner: null, approvedBy: null, status: 'draft', effectiveFrom: null },
          rationale: null, enforcement: { textual: true, technical: null, mergeEffect: null, gate: null },
          verification: { commands: null, evidence: null, evalFixtures: null },
          impact: { band: null, evidence: null }, reviewCadence: null, nextReview: null } : null },
      review: { status: 'PENDING_REVIEW', disposition: null, proposed_text: null, change_reason: null,
        reviewer: null, reviewed_at: null, decision_ref: null, conflict_resolution: null,
        acceptance_criteria: [], evidence_refs: [], target_item_ids: [] },
    });
  }
  function array(relative, key, type, prefix = '', idKey = 'id') {
    const data = byPath(relative)[key];
    const previous = oldDocuments.get(relative)?.data[key] ?? [];
    for (const [index, entry] of data.entries()) {
      const sourceId = entry[idKey] ?? entry.host;
      const priorIndex = previous.findIndex(old => (old[idKey] ?? old.host) === sourceId);
      const ruleNumber = type === 'CORE_RULE' ? Number(sourceId.slice(5)) : null;
      add({ id: `${prefix}${sourceId}`, sourceId, type, relative, pointer: `/${key}/${index}`, payload: entry,
        previous: priorIndex < 0 ? undefined : previous[priorIndex], previousPointer: priorIndex < 0 ? null : `/${key}/${priorIndex}`,
        text: entry.text ?? entry.recommended_action_ar ?? entry.expected ?? entry.expected_behavior_ar ?? entry.supported_takeaway ?? JSON.stringify(entry, null, 2),
        title: ruleNumber ? ruleNamesAr[ruleNumber - 1] : entry.title_ar ?? entry.focus_ar ?? entry.title ?? entry.name ?? sourceId,
        kind: ruleNumber ? ruleKinds[ruleNumber - 1] : type === 'SKILL' ? 'CAPABILITY' : type === 'STANDARD_RECOMMENDATION' ? 'GUIDELINE' : null,
        force: entry.force ?? null, related: entry.rule_ids ?? [] });
    }
    const metadata = Object.fromEntries(Object.entries(byPath(relative)).filter(([name]) => name !== key));
    add({ id: `META-${hash(relative).slice(0, 12)}`, type: 'CATALOG_METADATA', relative, pointer: '', payload: metadata,
      text: JSON.stringify(metadata, null, 2), title: `بيانات السجل: ${relative}`, location: { selection: { excluded_top_level_keys: [key] } } });
  }
  array('registry/RULES.json', 'rules', 'CORE_RULE');
  array('registry/ENFORCEMENT_COVERAGE.json', 'rules', 'ENFORCEMENT_RECORD', 'ENF-', 'rule_id');
  array('optional_skills/REGISTER.json', 'skills', 'SKILL', 'SKILL-');
  array('standards/CONTROL_CATALOG.json', 'controls', 'STANDARD_RECOMMENDATION');
  array('adapters/REGISTER.json', 'adapters', 'ADAPTER', 'ADAPTER-');
  array('sources/REGISTER.json', 'sources', 'SOURCE_REFERENCE', 'SOURCE-');
  array('evaluations/SCENARIOS.json', 'scenarios', 'SCENARIO');
  array('evaluations/DELIVERY_SCENARIOS.json', 'cases', 'SCENARIO', 'DELIVERY-');
  array('evaluations/SKILL_HOST_QUALIFICATION.json', 'hosts', 'HOST_QUALIFICATION', 'HOST-');
  for (const [name, entry] of Object.entries(byPath('profiles/PROFILES.json').profiles)) {
    const previous = oldDocuments.get('profiles/PROFILES.json')?.data.profiles[name];
    add({ id: `PROFILE-${name}`, sourceId: name, type: 'PROFILE', relative: 'profiles/PROFILES.json', pointer: `/profiles/${name}`,
      payload: entry, previous, previousPointer: `/profiles/${name}`, text: JSON.stringify(entry, null, 2), title: name });
  }
  const profileMeta = { ...byPath('profiles/PROFILES.json') }; delete profileMeta.profiles;
  add({ id: 'META-PROFILES', type: 'CATALOG_METADATA', relative: 'profiles/PROFILES.json', payload: profileMeta,
    text: JSON.stringify(profileMeta, null, 2), title: 'بيانات ملفات الضمان', location: { selection: { excluded_top_level_keys: ['profiles'] } } });
  for (const [relative, doc] of documents) {
    if (doc.markdown) for (const [index, block] of doc.markdown.blocks.entries()) {
      add({ id: `DOC-${hash(`${relative}:${index}`).slice(0, 16)}`, relative,
        type: block.block_type === 'EXAMPLE_BLOCK' ? 'EXAMPLE_BLOCK' : block.block_type === 'TABLE_ROW' ? 'DOCUMENT_TABLE_ROW' : 'DOCUMENT_CLAUSE',
        text: block.original_text, title: `${block.section.filter(Boolean).at(-1) ?? relative} — ${index + 1}`,
        location: { ...block, original_text: undefined } });
    }
    else if (/^(schemas|templates)\//.test(relative)) {
      add({ id: `${relative.startsWith('schemas/') ? 'SCHEMA' : 'TEMPLATE'}-${path.posix.basename(relative).replace(/\.schema\.json$|\.json$/g, '')}`,
        type: relative.startsWith('schemas/') ? 'SCHEMA' : 'TEMPLATE', relative, pointer: '', payload: doc.data,
        previous: oldDocuments.get(relative)?.data, text: JSON.stringify(doc.data, null, 2), title: relative });
    }
  }
  assert.equal(new Set(items.map(item => item.id)).size, items.length, 'unique review IDs');
  attachContexts(items);
  if (existing) {
    const freshById = new Map(items.map((item, index) => [item.id, { item, index }]));
    for (const prior of existing.items) {
      const next = freshById.get(prior.id);
      assert.ok(next, `extension must retain prior item ${prior.id}`);
      assert.equal(prior.original_text, next.item.original_text);
      assert.deepEqual(prior.original_payload, next.item.original_payload);
      assert.deepEqual(prior.source, JSON.parse(JSON.stringify(next.item.source)), 'same serialized source locator');
      items[next.index] = prior; // Preserve every review/draft field, including human edits.
    }
  }
  for (const [type, count] of Object.entries({ CORE_RULE: 47, SKILL: 11, STANDARD_RECOMMENDATION: 80, ADAPTER: 12,
    SOURCE_REFERENCE: 56, PROFILE: 3, SCENARIO: 60, HOST_QUALIFICATION: 2, ENFORCEMENT_RECORD: 47, SCHEMA: 6, TEMPLATE: 7 })) {
    assert.equal(items.filter(item => item.record_type === type).length, count, `${type} coverage`);
  }
  const dispositions = Object.keys(manifest.files).map(relative => ({ relative, disposition: selected.has(relative) ? 'EXTRACTED' :
    /^(compatibility|verification)\/|^design\/frozen\//.test(relative) ? 'NO_CRAWL_HISTORY_NOT_LOADED' :
      /\.(py|toml)$|^tests\/|^tools\//.test(relative) ? 'IMPLEMENTATION_NOT_GOVERNANCE_ITEMS' :
        /^design\/|REPORT|CHANGELOG|HANDOFF|BASELINE|STATUS|VERSION|^guide\//.test(relative) ? 'STATUS_HISTORY_OR_DERIVED_VIEW' :
          'SUPPORTING_ARTIFACT_NOT_ACTIVE_INSTRUCTION_SOURCE' }));
  fs.mkdirSync(absolute(`${output}/details`), { recursive: true });
  fs.mkdirSync(absolute(`${output}/evidence`), { recursive: true });
  if (extensionCustody) writeJson(`${output}/evidence/source-extension.json`, { ...extensionCustody,
    retained_previous_rows: existing.items.length, added_rows: items.length - existing.items.length,
    preservation: 'ALL_PRIOR_REVIEW_RECORD_OBJECTS_RETAINED_WITHOUT_MODIFICATION' });
  writeJson(`${output}/evidence/before.json`, { observed_at: new Date().toISOString(), owner_request: 'Extract all current package items for review and future migration',
    scope: 'LATEST_IMPLEMENTED_CANDIDATE_WITH_REFERENCE_COMPARISON', candidate, reference, input_files: inputFiles,
    selected_sources: paths, package_manifest_dispositions: dispositions, forbidden_trees_loaded: false });
  writeJson(`${output}/SOURCE_DOCUMENTS.json`, { candidate: [...documents.values()].map(({ markdown, data, ...doc }) => doc),
    reference: [...oldDocuments.values()].map(({ markdown, data, ...doc }) => doc) });
  writeJson(`${output}/REVIEW_REGISTER.json`, { schema_version: '1.0', status: 'REVIEW_WORKSPACE_NOT_ADOPTED_POLICY',
    candidate_version: '1.3.0', reference_version: '1.2.0', candidate_status: 'CANDIDATE_FOR_REVIEW',
    target_design: 'docs/specs/aghr-rc3/README.md', items });
  const counts = Object.fromEntries(Object.keys(typeNames).map(type => [type, items.filter(item => item.record_type === type).length]));
  const groups = new Map();
  for (const item of items.filter(row => ['DOCUMENT_CLAUSE','DOCUMENT_TABLE_ROW'].includes(row.record_type))) {
    const text = normalized(item.original_text); if (text.length < 80) continue;
    const key = hash(text); groups.set(key, [...(groups.get(key) ?? []), item.id]);
  }
  const duplicates = [...groups].filter(([, ids]) => ids.length > 1).map(([sha256, ids]) => ({ sha256, item_ids: ids,
    interpretation: 'EXACT_NORMALIZED_TEXT_OVERLAP_NOT_AN_AUTOMATIC_MERGE_DECISION' }));
  writeJson(`${output}/RELATIONS.json`, { exact_text_overlap_groups: duplicates,
    rule_links: items.filter(item => item.related_rule_ids.length).map(item => ({ id: item.id, related_rule_ids: item.related_rule_ids })),
    limits: 'No semantic duplicate claim. Examples, translations, metadata and containers are not automatically merged.' });
  writeJson(`${output}/COVERAGE.json`, { status: 'PASS_EXTRACTION_ACCOUNTING', counts, total_review_rows: items.length,
    package_manifest_files: dispositions.length, extracted_files: paths.length, omitted_file_dispositions: dispositions.filter(row => row.disposition !== 'EXTRACTED'),
    markdown_line_accounting: segmentCoverage, coverage_gaps: [], independent_semantic_review: 'NOT_PERFORMED',
    native_qualification: 'NOT_RUN_BY_THIS_EXTRACTION', target_import: 'NOT_EXECUTED' });
  render(items, counts, duplicates, paths.length);
  console.log(JSON.stringify({ status: 'EXTRACTED_FOR_REVIEW', rows: items.length, sources: paths.length, counts, duplicates: duplicates.length, output }));
}

export function render(items, counts, duplicates, sourceCount) {
  const write = (name, text) => fs.writeFileSync(absolute(`${output}/${name}`), `${text.trimEnd()}\n`, 'utf8');
  const rows = ['# جدول البنود الكامل للمراجعة', '',
    'كل صف وحدة مراجعة، وليس قاعدة ملزمة جديدة. النص والبيانات الأصلية كاملة في التفاصيل وJSON. التصنيفات والمسارات المقترحة غير معتمدة.', '',
    '| المعرّف | الاسم | الفئة | القوة المعلنة | المقارنة مع 1.2.0 | التفاصيل |', '| --- | --- | --- | --- | --- | --- |'];
  for (const item of items) rows.push(`| ${escape(item.id)} | ${escape(item.title)} | ${item.record_type_ar} | ${item.declared_force ?? 'غير محددة'} | ${item.comparison} | [تفاصيل](details/${item.record_type.toLowerCase()}.md) |`);
  write('ITEMS.md', rows.join('\n'));
  const checklist = ['# قائمة المراجعة', '', 'حالة البنود كلها PENDING_REVIEW. المراجعة والقرار يحفظان في REVIEW_REGISTER.json بواسطة معرف البند؛ لا تُدمج التغييرات من نسخ العرض تلقائيًا.', ''];
  for (const [type, label] of Object.entries(typeNames)) {
    checklist.push(`## ${label} (${counts[type]})`, '');
    for (const item of items.filter(row => row.record_type === type)) checklist.push(`- [ ] ${escape(item.id)} — ${escape(item.title)}`);
    checklist.push('');
    const detail = [`# ${label} — التفاصيل الكاملة`, '',
      'وحدات مستخرجة للمراجعة؛ ورود النص هنا لا يمنحه صلاحية أو قبولًا جديدًا. مصادر الحزمة تبقى مستقلة عن اقتراحات الترحيل.', ''];
    for (const item of items.filter(row => row.record_type === type)) {
      detail.push(`## ${escape(item.id)} — ${escape(item.title)}`, '',
        `المصدر: [${escape(item.source.path)}](../../../../${item.source.path}).`, '',
        `الموضع: ${escape(item.source.line_start ? `الأسطر ${item.source.line_start} إلى ${item.source.line_end}` : item.source.json_pointer || 'بيانات الكائن الجذري')}.`, '',
        `بصمة المصدر SHA-256: ${item.source.sha256}`, '',
        `القوة المعلنة: ${item.declared_force ?? 'غير محددة على مستوى هذا السجل'}؛ المقارنة: ${item.comparison}.`, '',
        ...(item.comparison_changes?.length ? ['الفروق المسجلة عن 1.2.0 (الحالة السابقة واللاحقة):', '', `<pre dir="auto">${escape(JSON.stringify(item.comparison_changes, null, 2))}</pre>`, ''] : []),
        ...(item.instruction_file_comparison ? [`ملف SKILL.md: ${item.instruction_file_comparison.status}. تغيير بيانات السجل لا يعني تغيير تعليمات المهارة.`, ''] : []),
        `القواعد المرتبطة: ${item.related_rule_ids.join(', ') || 'لم يصرح المصدر بربط مباشر'}. الربط سياقي، ولا يثبت التطابق الدلالي.`, '',
        ...(item.context ? [`سياق الفقرة: ${escape(item.context.heading_path.join(' / '))}. السابق: ${item.context.preceding_item_id ?? 'لا يوجد'}؛ اللاحق: ${item.context.following_item_id ?? 'لا يوجد'}؛ المهارة الأم: ${item.context.parent_skill_id ?? 'لا ينطبق'}. الشروط والاستثناءات المشتركة تحتاج مراجعة قبل فصل الفقرة كبند مستقل.`, ''] : []),
        '### النص الأصلي', '', `<pre dir="auto">${escape(item.original_text)}</pre>`, '',
        ...(item.original_payload ? ['### بيانات السجل الأصلية كاملة', '', `<pre dir="auto">${escape(JSON.stringify(item.original_payload, null, 2))}</pre>`, ''] : []),
        '### استكمال المراجعة والترحيل', '',
        `النوع المقترح: ${item.migration.proposed_kind ?? 'يحدد عند المراجعة'}؛ المسار: ${item.migration.route}.`, '',
        `شاشات التطبيق المقترحة: ${item.migration.target_screens.join(' / ')}.`, '',
        `البيانات المطلوب استكمالها: ${item.migration.missing_details.join('، ')}.`, '',
        `حالة المراجعة: ${item.review.status}. القرار: ${item.review.disposition ?? 'لم يحدد'}؛ السبب: ${escape(item.review.change_reason ?? 'لم يسجل')}. الاستيراد كسياسة حاكمة يحتاج قرارًا مخولًا خارج ملف المراجعة.`, '');
    }
    write(`details/${type.toLowerCase()}.md`, detail.join('\n'));
  }
  write('REVIEW_LIST.md', checklist.join('\n'));
  const headers = ['معرف_المراجعة','المعرف_الأصلي','الاسم','الفئة','القوة_المعلنة','النص_الأصلي','البيانات_الأصلية_JSON',
    'ملف_المصدر','موضع_JSON','بداية_السطر','نهاية_السطر','بصمة_المصدر','المقارنة_مع_1_2_0','النوع_المقترح','مسار_الترحيل',
    'شاشات_التطبيق','البيانات_الناقصة','القواعد_المرتبطة','حالة_المراجعة','القرار','النص_المقترح','سبب_التغيير','المراجع','مرجع_القرار'];
  const csvCell = value => {
    let string = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(string)) string = `'${string}`;
    return `"${string.replaceAll('"', '""')}"`;
  };
  const csv = [headers, ...items.map(item => [item.id,item.source_id,item.title,item.record_type,item.declared_force,item.original_text,
    item.original_payload ? JSON.stringify(item.original_payload) : '',item.source.path,item.source.json_pointer,item.source.line_start,
    item.source.line_end,item.source.sha256,item.comparison,item.migration.proposed_kind,item.migration.route,
    item.migration.target_screens.join(' / '),item.migration.missing_details.join(' / '),item.related_rule_ids.join(' / '),
    item.review.status,item.review.disposition,item.review.proposed_text,item.review.change_reason,item.review.reviewer,item.review.decision_ref])].map(row => row.map(csvCell).join(',')).join('\r\n');
  fs.writeFileSync(absolute(`${output}/REVIEW_TABLE.csv`), `\uFEFF${csv}\r\n`, 'utf8');
  for (const [type, name] of [['CORE_RULE','CORE_RULES_REVIEW.csv'], ['SKILL','SKILLS_REVIEW.csv'], ['STANDARD_RECOMMENDATION','STANDARDS_REVIEW.csv']]) {
    const selected = parseCsv(`\uFEFF${csv}\r\n`);
    const body = [selected[0], ...selected.slice(1).filter((_, index) => items[index].record_type === type)]
      .map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(',')).join('\r\n');
    fs.writeFileSync(absolute(`${output}/${name}`), `\uFEFF${body}\r\n`, 'utf8');
  }
  const learning = items.filter(item => /GOVERNED_LEARNING|governed-learning|LESSON/.test(item.source.path) || item.id === 'SKILL-governed-learning');
  const skills = items.filter(item => item.record_type === 'SKILL' || /EXTERNAL_CAPABILITIES|runtime\/SKILLS|SKILL_HOST_QUALIFICATION/.test(item.source.path));
  for (const [name, title, list] of [['LEARNING_ITEMS.md','بنود استخراج الدروس والتعليمات المصنفة',learning],['SKILLS_ITEMS.md','بنود حوكمة المهارات',skills]]) {
    write(name, [`# ${title}`, '', 'عرض مشتق من السجل الموحد؛ يحتفظ كل بند بمعرفه الأصلي وحالته ومصدره. لا ينشئ هذا العرض سجلًا حاكمًا موازيًا.', '',
      '| المعرّف | الفئة | الاسم | التفاصيل |','| --- | --- | --- | --- |',
      ...list.map(item => `| ${item.id} | ${item.record_type_ar} | ${escape(item.title)} | [تفاصيل](details/${item.record_type.toLowerCase()}.md) |`)].join('\n'));
  }
  const comparison = items.filter(item => ['CORE_RULE','SKILL','STANDARD_RECOMMENDATION'].includes(item.record_type));
  write('COMPARISON.md', ['# المقارنة مع المرجع 1.2.0', '',
    'المقارنة للسجلات بهويتها الأصلية؛ مقارنة الفقرات تطابق نصي مطبع فقط، ولا تستنتج تغيير المعنى أو الإضافة من غياب تطابق نصي.', '',
    'القواعد الـ47 والتوصيات الـ80 متطابقة كسجلات. سجلات المهارات الـ11 تغيرت بياناتها؛ ملفات SKILL.md نفسها احتفظت ببصماتها. تفاصيل كل مهارة تعرض الحقول السابقة واللاحقة، دون مساواة تعديل الاكتشاف بتعديل تعليمات المهارة.', '',
    '| المعرّف | الفئة | الحالة |','| --- | --- | --- |',
    ...comparison.map(item => `| ${item.id} | ${item.record_type_ar} | ${item.comparison} |`), '',
    'تفاصيل ملف مقابل ملف والتصرف في جميع أعضاء manifest متاحة في COVERAGE.json وإيصال evidence/before.json. النص السابق والحالي محفوظان في SOURCE_DOCUMENTS.json. لا تعني حالة المرشح 1.3.0 أنه مرجع تشغيل أو أن نصوص القواعد تغيرت.'].join('\n'));
  write('MIGRATION_GUIDE.md', `# مسار المراجعة والإدراج في الحزمة والتطبيق الجديدين

## طريقة العمل

1. افتح REVIEW_TABLE.csv للفرز، أو ITEMS.md للقراءة، ثم التفاصيل الكاملة لكل فئة.
2. حرر حقول review داخل REVIEW_REGISTER.json بمعرف البند. ملفات CSV وMarkdown عروض مشتقة لا تُدمج تلقائيًا. احتفظ original_payload وoriginal_text وsource دون تعديل؛ ضع الصياغة الجديدة في review.proposed_text.
3. حدد ADOPT / RECONCILE / REJECT / DEFER / HOLD / REFERENCE_ONLY، والسبب والمراجع والتعارض والموضع المالك. لا يجعل تسجيل قرار داخل ملف المراجعة القرار مصدقًا؛ يحتاج مسار اعتماد مخول.
4. استكمل النوع والقوة والخطورة والنطاق والمالك والموافق وتاريخ النفاذ وآلية الإنفاذ ومعايير التحقق ودليلها. لا تستنتج سلطة المؤسسة من ملف الحزمة، ولا مستوى النظام من النص، ولا درجة الخطورة من قوة MUST.
5. اربط البنود الشارحة بالقواعد الـ47 أو إجراءاتها قبل اقتراح بند جديد. راجع فصل الالتزامات المركبة مع حفظ الشروط والاستثناءات، والتكرار والتعارض. مجموعات التطابق في RELATIONS.json مرشحات مراجعة نصية فقط.
6. جهز Change Package ببصمة للنسخة والموافقة والفروق ومعايير القبول. الاستيراد الأول إلى التطبيق يكون staging / draft، وليس active أو منشورًا. لا يتضمن هذا التسليم استيرادًا أو تغييرًا للحزمة.

## تحويل الحقول

| الحقل القديم | موضع المراجعة الجديد | ما يلزم |
| --- | --- | --- |
| id / title / text | draft.id / title / rule | حفظ الهوية والأصل؛ الصياغة المعدلة منفصلة |
| force | declared_force ثم draft.force | حفظ القوة؛ UNRESOLVED أو غيابها يبقى قرارًا معلقًا ولا يحول إلى INFORMATIVE |
| applies_when | شرط انطباق أصلي ثم scope | استكمال paths / agents / environments / stages / taskTypes دون تعميم تخميني |
| basis / explanation_ref / origin | original_payload ثم references / rationale | الاحتفاظ بالمصدر ومعناه؛ المبرر بحاجة مراجعة |
| waivable | exceptions | قرار الاستثناء ونطاقه وصاحبه وانتهاؤه؛ لا يسمح بالعفو عن قيد أعلى |
| enforcement_class / سجل التغطية | enforcement + verification | فصل المعلن عن الإنفاذ المقاس؛ لا توجد ضمانة تقنية من تسمية الحقل |
| سجل المهارة وSKILL.md | CAPABILITY + instructionsPath + permissions + qualification | الأصل PACKAGE؛ مسار التحميل والتأهيل لكل مضيف ونسخة ونطاق وبصمة يراجع فعلًا |
| توصيات المعايير REC-* | GUIDELINE مقترح بعد قرار الانطباق | ليست استخراجًا رسميًا لبنود معيار ولا شهادة مطابقة |
| schemas/templates | عقود وتهيئة للتطبيق | ليست كلها تعليمات؛ لا تحول أمثلة القوالب إلى سياسة |
| السيناريوهات والتأهيل | Verification & Evidence | الحفاظ على NOT_RUN / NOT_OBSERVABLE وعدم استنتاج نجاح من وجود السيناريو |

نموذج الهدف هو مواصفة AGHR rc.3 §3 و§4، ومتطلبات Studio §13 و§21 و§22 والملحق G. الأنواع المتقدمة ومنها CAPABILITY وPOLICY تحتاج الموضع والمراجعة المخولين؛ الأنواع المقترحة في السجل توصيات تصنيف لا اعتماد.

## المهارات والتعلم

التحميل LOADED أو PREPARED أو HOST_HANDOFF لا يثبت EXECUTED أو VERIFIED. يظل BLOCKED مختلفًا عن NO_SKILL_NEEDED وNO_MATCHING_SKILLS؛ يلزم حسم ترجمة هذه الحالات إلى أسماء النموذج الجديد بعقد صريح دون دمجها. تحقق task_criteria والمخرجات غير الفارغة وأدلة التنفيذ في المسار الجديد بدل الاكتفاء بأسماء المخرجات.

راجع LEARNING_ITEMS.md: Scan → Generate → Dedup → Confirm → Execute → Review، مع الدليل والسبب UNPROVEN عند غياب البرهان، وتصنيف التعليمات، ومراجعة التكرار والتعارض. قبول درس أو نجاح مهارة لا يغير سياسة تلقائيًا. نوع المعرفة وحالة الأثر وقرار التصرف حقول مستقلة، ولا تنشأ ذاكرة عامة أو مهارة توجيه إلزامية بهذا الجرد.

## حدود النقل

الملف REVIEW_REGISTER.json حزمة مراجعة وسيطة وليس ملفًا مطابقًا نهائيًا لـitem.schema.json. جميع المقترحات غير جاهزة للاستيراد كتعليمات حاكمة حتى حسم التفاصيل والموافقة والتحقق. نصوص المصدر محفوظة كاملة دون ترجمة. CSV بترميز UTF-8 مع BOM لعرض العربية؛ تسبق قيم الصيغ المحتملة علامة اقتباس مفردة، والأصل غير المعدل موجود في JSON.

لا تعديل للمرجع 1.2.0 أو المرشح 1.3.0 أو مواصفات التصميم أو التطبيق بهذا الاستخراج. روابط المصادر الخارجية تمثل بيانات الحزمة بتاريخها ولم تعاد مراجعتها عبر الإنترنت.
`);
  write('README.md', `# جرد بنود AGHR للمراجعة والترحيل

**التاريخ:** 2026-10-22. **الحالة:** REVIEW_WORKSPACE_NOT_ADOPTED_POLICY.

الأساس هو أحدث حزمة منفذة: **مرشح 1.3.0**، مع مقارنة **مرجع التشغيل 1.2.0** وربط بمواصفات [الحزمة والتطبيق الجديدين](../../specs/aghr-rc3/README.md). لا يغير الجرد حالات اعتماد هذه المصادر.

## ملفات المراجعة

- [الجدول القابل للفرز والتحرير في Excel](REVIEW_TABLE.csv) — ${items.length} صفًا، مع النص والتفاصيل وحقول قرار المراجعة.
- جداول مركزة: [القواعد الـ47](CORE_RULES_REVIEW.csv)، [المهارات الـ11](SKILLS_REVIEW.csv)، [توصيات المعايير الـ80](STANDARDS_REVIEW.csv).
- [الجدول الكامل للقراءة](ITEMS.md) و[قائمة المراجعة](REVIEW_LIST.md).
- [القواعد الحاكمة الـ47 بالتفصيل](details/core_rule.md).
- [سجل JSON الموحد](REVIEW_REGISTER.json) — الموضع الأساسي لتسجيل مراجعات البنود؛ CSV وMarkdown نسخ عرض مشتقة.
- [التعلم والدروس](LEARNING_ITEMS.md) و[حوكمة المهارات](SKILLS_ITEMS.md).
- [المقارنة مع 1.2.0](COMPARISON.md)، [دليل استكمال الحقول والترحيل](MIGRATION_GUIDE.md)، [التغطية](COVERAGE.json)، و[العلاقات والتداخل النصي](RELATIONS.json).
- [أولويات الاستكمال](REVIEW_BACKLOG.md) و[مخطط ملف المراجعة](REVIEW_REGISTER.schema.json).
- [المصادر كاملة للنص السابق واللاحق](SOURCE_DOCUMENTS.json)، [إيصال المدخلات](evidence/before.json)، و[التحقق](evidence/verification.json).

## مكونات الجرد

| الفئة | العدد |
| --- | --- |
${Object.entries(typeNames).map(([type, label]) => `| ${label} | ${counts[type]} |`).join('\n')}

العدد الكلي وحدات مراجعة؛ القواعد الحاكمة المسجلة **47 فقط**. الفقرات الشارحة والصفوف والأمثلة والسجلات والمراجع لا تتحول إلى قواعد جديدة. شملت القراءة البرمجية ${sourceCount} مسارًا محددًا من manifest، دون تحميل أرشيفات compatibility أو verification أو design/frozen. يوضح COVERAGE.json تصرف كل ملف من الملفات الـ245؛ الشيفرة والنتائج التاريخية والأدلة السابقة ليست بنود تعليمات جديدة.

كل بند يحتفظ بهويته ومصدره وبصمته وموضعه ونصه وبياناته الأصلية، والمقارنة والتصنيف المقترح والبيانات الناقصة وشاشات التطبيق المستهدفة وحقول القرار. جميع المراجعات PENDING_REVIEW؛ لا بيانات موافقة أو خطورة أو سلطة مُختلقة. توجد ${duplicates.length} مجموعة تطابق نصي مطبع تستحق النظر، دون ادعاء كشف كل التكرار الدلالي.

## ترتيب المراجعة المقترح

1. القواعد الـ47: النوع والخطورة والسلطة والنطاق والقبول والإنفاذ والاستثناءات.
2. التعلم وحوكمة المهارات: صدق الحالات والأدلة، التصنيف، مصدر الدرس، وحجب الترقية التلقائية.
3. الإجراءات والعقود وملفات الضمان والموائمات: ربط الشرح بموضع مالك واحد.
4. توصيات المعايير والسيناريوهات وعقود البيانات والقوالب: الانطباق وقابلية الاختبار والنقل.

## حدود النتيجة

الاستخراج والتحقق البنيوي لا يثبتان سلامة الصياغات دلاليًا ولا تأهيل المضيف أو قبول الإصدار. لا استيراد للتطبيق ولا تعديل للحزم ولا تنفيذ لمحتوياتها. التحسينات المستقبلية تمر بسجل المراجعة ثم Change Package مخول.
`);
  write('PLAN.md', `# خطة الاستخراج والتحقق

النطاق: جمع القواعد والمكونات التشغيلية الحالية من المرشح 1.3.0 ومقارنتها بالمرجع 1.2.0 وتجهيز مراجعة قابلة للنقل إلى تصميم rc.3؛ الحزم والتطبيق للقراءة فقط.

- تثبيت المدخلات: مسارات محددة من manifest وبصماتها وحالتها، مع حيازة ما قبل القراءة.
- استخلاص القواعد والسجلات ثم الفقرات والخطوات والصفوف مع فصل الأمثلة، وحساب تغطية كل سطر.
- إنشاء جدول وقائمة وتفاصيل وJSON وCSV وحالات المراجعة والحقول الناقصة، مع مصدر وحيد للمراجعات.
- مقارنة النسخ دون ادعاء تطابق دلالي، ثم ربط الهدف والمصادر والمقاييس والاختبارات.
- التحقق من العدد والهوية والنصوص والتغطية وبقاء المصادر واختبارات المشروع وسلامة السياق.

معيار القبول: 47 قاعدة و11 مهارة و80 توصية و60 سيناريو محفوظة كاملة، دون سقوط سجل أو سطر غير محسوب؛ جميع التفاصيل الأصلية قابلة للاسترجاع؛ لا تفعيل تلقائي أو استيراد أو تغيير مصدر.
`);
}

function parseCsv(raw) {
  const rows = [];
  let row = [], value = '', quoted = false;
  for (let index = raw.charCodeAt(0) === 0xfeff ? 1 : 0; index < raw.length; index++) {
    const character = raw[index];
    if (character === '"') {
      if (quoted && raw[index + 1] === '"') { value += '"'; index++; }
      else quoted = !quoted;
    } else if (character === ',' && !quoted) { row.push(value); value = ''; }
    else if (character === '\n' && !quoted) { row.push(value); rows.push(row); row = []; value = ''; }
    else if (character !== '\r' || quoted) value += character;
  }
  assert.equal(quoted, false, 'CSV quote balance');
  assert.equal(row.length, 0, 'CSV final row terminator');
  return rows;
}

function verify() {
  const before = json(`${output}/evidence/before.json`);
  const register = json(`${output}/REVIEW_REGISTER.json`);
  const snapshots = json(`${output}/SOURCE_DOCUMENTS.json`);
  const coverage = json(`${output}/COVERAGE.json`);
  const manifest = json(`${candidate}/MANIFEST.json`);
  assert.equal(register.status, 'REVIEW_WORKSPACE_NOT_ADOPTED_POLICY');
  assert.deepEqual(before.selected_sources, selectSources(manifest));
  for (const record of before.input_files) assert.deepEqual(fileRecord(record.path), record, `preserved input: ${record.path}`);
  const docs = new Map(snapshots.candidate.map(doc => [doc.path, doc]));
  for (const doc of [...snapshots.candidate, ...snapshots.reference]) {
    assert.equal(hash(Buffer.from(doc.original_text, 'utf8')), doc.sha256, `snapshot text: ${doc.path}`);
  }
  const locate = (value, pointer) => pointer ? pointer.slice(1).split('/').reduce((entry, key) => entry[key.replaceAll('~1', '/').replaceAll('~0', '~')], value) : value;
  for (const item of register.items) {
    const doc = docs.get(item.source.path);
    assert.ok(doc, `known source: ${item.id}`);
    assert.equal(item.source.sha256, doc.sha256);
    if (item.source.line_start) {
      assert.equal(item.original_text, doc.original_text.split('\n').slice(item.source.line_start - 1, item.source.line_end).join('\n'), `verbatim block: ${item.id}`);
    } else {
      let original = locate(JSON.parse(doc.original_text), item.source.json_pointer);
      if (item.source.selection) original = Object.fromEntries(Object.entries(original).filter(([key]) => !item.source.selection.excluded_top_level_keys.includes(key)));
      assert.deepEqual(item.original_payload, original, `complete original record: ${item.id}`);
    }
    assert.equal(item.migration.status, 'NOT_READY_FOR_GOVERNING_IMPORT');
    assert.equal(item.review.status, 'PENDING_REVIEW', 'no fabricated review decision');
    assert.equal(item.review.decision_ref, null);
    if (item.record_type === 'CORE_RULE') assert.equal(item.original_text, item.original_payload.text);
    if (item.context) for (const key of ['preceding_item_id', 'following_item_id', 'parent_skill_id']) {
      if (item.context[key]) assert.ok(register.items.some(row => row.id === item.context[key]), `valid context link: ${item.id}`);
    }
  }
  assert.equal(new Set(register.items.map(item => item.id)).size, register.items.length);
  for (const record of coverage.markdown_line_accounting) {
    const doc = docs.get(`${candidate}/${record.relative}`);
    const parsed = segmentMarkdown(doc.original_text);
    assert.equal(parsed.lines, parsed.covered_lines);
    const extracted = register.items.filter(item => item.source.path === doc.path && item.source.line_start);
    assert.equal(extracted.length, parsed.blocks.length, `every block: ${record.relative}`);
    for (const block of parsed.blocks) assert.equal(extracted.filter(item => item.source.line_start === block.line_start && item.source.line_end === block.line_end).length, 1);
  }
  for (const [type, count] of Object.entries(coverage.counts)) assert.equal(register.items.filter(item => item.record_type === type).length, count);
  assert.equal(register.items.filter(item => item.record_type === 'CORE_RULE').length, 47);
  assert.equal(register.items.filter(item => item.record_type === 'SKILL').length, 11);
  assert.equal(register.items.filter(item => item.record_type === 'STANDARD_RECOMMENDATION').length, 80);
  assert.equal(register.items.filter(item => item.record_type === 'SCENARIO').length, 60);
  const csv = parseCsv(read(`${output}/REVIEW_TABLE.csv`));
  assert.equal(csv.length, register.items.length + 1, 'all rows survive CSV quoting/newlines');
  assert.ok(csv.every(row => row.length === 24), 'consistent CSV columns');
  assert.deepEqual(csv.slice(1).map(row => row[0]), register.items.map(item => item.id), 'CSV identity/order');
  for (const [type, name, count] of [['CORE_RULE','CORE_RULES_REVIEW.csv',47],['SKILL','SKILLS_REVIEW.csv',11],['STANDARD_RECOMMENDATION','STANDARDS_REVIEW.csv',80]]) {
    const group = parseCsv(read(`${output}/${name}`));
    assert.equal(group.length, count + 1);
    assert.deepEqual(group.slice(1).map(row => row[0]), register.items.filter(item => item.record_type === type).map(item => item.id));
  }
  for (const [index, item] of register.items.entries()) {
    const expected = /^[\s]*[=+@-]/.test(item.original_text) ? `'${item.original_text}` : item.original_text;
    assert.equal(csv[index + 1][5], expected, `complete CSV source text: ${item.id}`);
  }
  assert.equal(coverage.package_manifest_files, Object.keys(manifest.files).length);
  assert.equal(before.package_manifest_dispositions.length, Object.keys(manifest.files).length);
  assert.deepEqual(coverage.coverage_gaps, []);
  console.log(JSON.stringify({ status: 'PASS', rows: register.items.length, source_files: docs.size,
    preserved_inputs: before.input_files.length, csv_rows: csv.length - 1, csv_columns: 24,
    rules: 47, skills: 11, recommendations: 80, scenarios: 60,
    markdown_lines_accounted: coverage.markdown_line_accounting.reduce((sum, row) => sum + row.covered_lines, 0),
    scope: 'EXTRACTION_AND_CUSTODY_ONLY', independent_semantic_review: 'NOT_PERFORMED', target_import: 'NOT_EXECUTED' }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--self-test') selfTest();
  else if (process.argv[2] === '--build') build();
  else if (process.argv[2] === '--extend-sources') build(true);
  else if (process.argv[2] === '--verify') verify();
  else throw new Error('Use --self-test | --build | --extend-sources | --verify. Extension preserves existing review records.');
}
