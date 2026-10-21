"""Bounded integration checks; no model execution, network or arbitrary scripts."""
from __future__ import annotations
import re
from pathlib import Path
from runtime.common import load, sha, check_request, check_state

REQUIRED=(
 'compatibility/AGHR_1_0_INPUTS.json','compatibility/ADDITIONS_CONTROL_MAPPING.json',
 'compatibility/ADDITIONS_FILE_DISPOSITION.json','compatibility/ACADEMIC_INTEGRATION_MAP.json',
 'compatibility/MERGE_REVIEW_AR.md','compatibility/MERGE_REQUEST_COVERAGE.json',
 'procedures/SMART_CLARIFICATION_AR.md','procedures/LIFECYCLE_AR.md',
 'procedures/MIGRATION_1_0_TO_1_1.md','procedures/PROGRESS_AND_DRIFT_AR.md',
 'runtime/delivery.py','runtime/DELIVERY.md','templates/DELIVERY_RECORD_MAPPING.md',
 'sources/REVALIDATION_1.1.0.json','sources/REGISTER_AR.md','optional_skills/REGISTER.json',
 'standards/CONTROL_CATALOG.json','evaluations/DELIVERY_SCENARIOS.json',
 'evaluations/DELIVERY_EVAL_PLAN_AR.md','DELIVERY_REPORT_AR.md')

def check_integration(root: Path) -> list[str]:
    errors=[];root=root.resolve()
    missing=[p for p in REQUIRED if not (root/p).is_file()]
    if missing:return ['Integration files missing: '+', '.join(missing)]
    pkg_ver = (root/'VERSION').read_text(encoding='utf-8').strip()
    if pkg_ver not in ('1.1.0', '1.2.0', '1.2.0-rc1'):errors.append('Integration requires version 1.1.0 or candidate 1.2.0')
    status=load(root/'PACKAGE_STATUS.json')
    if status.get('integration')!='COMPLETE_WITH_DOCUMENTED_LIMITS':errors.append('Incorrect integration state')
    rules=load(root/'registry/RULES.json')['rules'];ids={r['id'] for r in rules}
    sources=load(root/'sources/REGISTER.json')['sources'];source_ids={s['id'] for s in sources}
    if len({s['url'] for s in sources})!=len(sources):errors.append('Duplicate canonical source URL')
    rule41=next((r for r in rules if r['id']=='AGHR-041'),{})
    if rule41.get('force')!='MUST' or rule41.get('waivable') is not False:errors.append('Material clarification MUST weakened')
    for n in range(1,41):
        if f'AGHR-{n:03d}' not in ids:errors.append('Original rule ID lost')
    disposition=load(root/'compatibility/ADDITIONS_FILE_DISPOSITION.json')['rows']
    if len(disposition)!=78 or len({r['source_path'] for r in disposition})!=78:errors.append('Additions file accounting incomplete')
    for row in disposition:
        if not row['targets'] or not row['rationale']:errors.append('Unexplained additions disposition')
        for target in row['targets']:
            if not (root/target).is_file():errors.append('Missing additions target: '+target)
    mapping=load(root/'compatibility/ADDITIONS_CONTROL_MAPPING.json')['rows']
    if {r['source_id'] for r in mapping}!={f'EXT-{n:02d}' for n in range(1,13)}:errors.append('Missing EXT mapping')
    for row in mapping:
        if not row['target_ids'] or set(row['target_ids'])-ids:errors.append('Invalid EXT rule target')
    ac=load(root/'compatibility/ACADEMIC_INTEGRATION_MAP.json')['rows']
    if {r['source_section'] for r in ac}!=set(range(1,19)):errors.append('Academic topic coverage incomplete')
    guide=(root/'guide/GUIDE_AR.md').read_text(encoding='utf-8')
    for row in ac:
        if not re.search(r'^# '+str(row['target_chapter'])+r'\.',guide,re.M):errors.append('Academic target chapter missing')
    cat=load(root/'standards/CONTROL_CATALOG.json')
    if cat.get('not_standard_clause_extraction') is not True:errors.append('Standards extraction claim is not allowed')
    controls=cat['controls']
    if len(controls)!=80 or len({c['id'] for c in controls})!=80:errors.append('Standards recommendation population changed')
    for c in controls:
        if c['adoption']!='PENDING_APPLICABILITY_DECISION':errors.append('Standards silently adopted')
        if set(c['source_ids'])-source_ids:errors.append('Unknown standards source')
        if not (root/c['card']).is_file():errors.append('Missing standards card')
    skills=load(root/'optional_skills/REGISTER.json')['skills']
    if len(skills)!=10 or len({s['id'] for s in skills})!=10:errors.append('Optional skill identity population invalid')
    for s in skills:
        path=root/s['path']
        if s['auto_installed'] is not False or s['host_qualification']!='NOT_RUN':errors.append('Skill activation/qualification claimed')
        if not path.is_file() or sha(path)!=s['sha256']:errors.append('Skill payload missing/changed without registry update')
    for name in ('.agents','.codex','.claude'):
        if (root/name).exists():errors.append('Unexpected auto-discovery directory')
    scenarios=load(root/'evaluations/DELIVERY_SCENARIOS.json')['cases']
    if len(scenarios)!=24 or len({s['id'] for s in scenarios})!=24:errors.append('Delivery scenario population invalid')
    for s in scenarios:
        if s['verdict']!='NOT_RUN' or s['observed_behavior'] is not None or s['evidence']:errors.append('Unrun behavior promoted to evidence')
        if not s['rule_ids'] or set(s['rule_ids'])-ids:errors.append('Scenario rule mapping invalid')
    # No source may resolve outside the distribution; histories have their own frozen checker.
    for p in root.rglob('*.md'):
        if 'design/frozen' in p.relative_to(root).as_posix():continue
        for link in re.findall(r'(?<!!)\[[^\]]*\]\(([^\s)]+)\)',p.read_text(encoding='utf-8')):
            link=link.split('#')[0]
            if not link or link.startswith(('https://','http://','mailto:')):continue
            q=(p.parent/link).resolve()
            if not q.is_relative_to(root) or not q.exists():errors.append('Missing/outside local link: '+p.relative_to(root).as_posix()+' -> '+link)
    errors.extend(check_request(load(root/'templates/REQUEST.json')))
    errors.extend(check_request(load(root/'examples/REQUEST_WITH_CLARIFICATION.json')))
    # Shapes are already checked against the inspected root by the main checker.
    # The active templates contain no claims that require real project evidence.
    original=load(root/'compatibility/AGHR_1_0_INPUTS.json')['original_files']
    if len(original)!=135:errors.append('Original file inventory incomplete')
    for f in original:
        p=root/f['path']
        if not p.is_file():errors.append('Original path lost: '+f['path'])
        if f['path'].startswith(('design/frozen/','compatibility/V4_')) and (not p.is_file() or sha(p)!=f['sha256']):errors.append('Preserved historical payload changed: '+f['path'])
    return errors
