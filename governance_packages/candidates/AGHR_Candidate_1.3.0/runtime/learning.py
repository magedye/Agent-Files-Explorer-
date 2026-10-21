"""Evidence-bound lesson records. Never edits active instructions or authenticates grants."""
from __future__ import annotations

from pathlib import Path
import datetime as dt

from runtime.common import ROOT, GovernanceError, instant, load, now, safe_path, save_new, sha, validate_schema


def validate_lesson(record: dict, project: Path) -> list[str]:
    errors = validate_schema(record, load(ROOT / 'schemas/LESSON.schema.json'))
    if errors:
        return errors
    evidence = {row['path']: row for row in record['evidence']}
    if len(evidence) != len(record['evidence']):
        errors.append('Duplicate evidence paths')
    for row in record['evidence']:
        try:
            target = safe_path(project, row['path'], must_exist=True)
            if not target.is_file() or sha(target) != row['sha256']:
                errors.append('Evidence digest mismatch: ' + row['path'])
        except (GovernanceError, OSError) as exc:
            errors.append(str(exc))
    cause = record['root_cause']
    if record['knowledge_state'] == 'SUPPORTED' and not record['evidence']:
        errors.append('Supported knowledge requires captured evidence')
    if any(ref not in evidence for ref in cause['evidence_refs']):
        errors.append('Root cause has an unknown evidence reference')
    for counter in record['counterevidence']:
        if counter['path'] not in evidence or any(ref not in evidence for ref in counter['resolution_refs']):
            errors.append('Counterevidence or resolution reference is missing from captured evidence')
        if counter['resolution'] == 'RESOLVED' and (not counter['resolution_refs'] or counter['path'] in counter['resolution_refs']):
            errors.append('Resolved counterevidence requires separate resolution evidence')
    if cause['status'] == 'PROVEN' and not cause['evidence_refs']:
        errors.append('Proven root cause requires evidence references')
    for ref in record['reconciliation']['coverage_refs']:
        try:
            safe_path(project, ref, must_exist=True)
        except (GovernanceError, OSError) as exc:
            errors.append(str(exc))
    if record['reconciliation']['coverage'] in ('COVERED', 'PARTIAL', 'CONFLICT') and not record['reconciliation']['coverage_refs']:
        errors.append('Coverage claim requires a concrete existing reference')
    if record['supersedes'] == record['lesson_id']:
        errors.append('Lesson cannot supersede itself')
    if record['supersedes']:
        try:
            previous = load(safe_path(project, '.aghr/intake/lessons/' + record['supersedes'] + '.json', must_exist=True))
            if previous['lesson_id'] != record['supersedes']:
                errors.append('Supersession identity mismatch')
        except (GovernanceError, OSError, KeyError) as exc:
            errors.append(str(exc))
    review_after = record['applicability']['review_after']
    if review_after:
        try:
            instant(review_after)
        except GovernanceError as exc:
            errors.append(str(exc))
    if record['knowledge_state'] == 'REJECTED' and record['disposition'] != 'REJECT':
        errors.append('Rejected knowledge must retain a REJECT disposition')
    if record['execution_state'] == 'APPLIED':
        if record['knowledge_state'] != 'SUPPORTED' or record['disposition'] not in ('ADOPT', 'RECONCILE'):
            errors.append('Applied effect requires supported knowledge and an adoption disposition')
        if not record['authority']['adoption_ref'] or not record['authority']['effect_ref']:
            errors.append('Applied effect requires separate adoption and effect authority references')
        refs = record['effect']['artifact_refs'] + record['effect']['verification_refs']
        if not record['effect']['artifact_refs'] or not record['effect']['verification_refs']:
            errors.append('Applied effect requires artifact and verification evidence')
        if any(ref not in evidence for ref in refs):
            errors.append('Applied effect references missing evidence')
    return errors


def exact_duplicates(record: dict, existing: list[dict]) -> list[str]:
    def normalized(text):
        return ' '.join(text.casefold().split())
    instruction = record['proposed_instruction']
    def unapplied_predecessor(other):
        return (record['disposition'] == 'RECONCILE' and other['lesson_id'] == record['supersedes']
                and other['execution_state'] == 'NOT_APPLIED'
                and other['knowledge_state'] in ('CANDIDATE', 'NEEDS_REVIEW', 'STALE', 'REJECTED'))
    return [other['lesson_id'] for other in existing
            if other['lesson_id'] != record['lesson_id']
            and not unapplied_predecessor(other)
            and other['proposed_instruction']['scope'] == instruction['scope']
            and other['applicability']['context'] == record['applicability']['context']
            and normalized(other['proposed_instruction']['text']) == normalized(instruction['text'])]


def review_lesson(record: dict, project: Path, candidate_id: str, existing: list[dict] | None = None) -> dict:
    errors = validate_lesson(record, project)
    if errors:
        return {'status': 'FAIL', 'errors': errors, 'promotion_checks': 'BLOCKED', 'effective_authority': 'NONE_FROM_VALIDATOR'}
    reasons = []
    if record['knowledge_state'] != 'SUPPORTED':
        reasons.append('Knowledge is not SUPPORTED')
    if record['root_cause']['status'] != 'PROVEN':
        reasons.append('Root cause remains UNPROVEN; retain as observation or investigate')
    if record['applicability']['candidate_id'] != candidate_id:
        reasons.append('Candidate changed; lesson applicability is STALE until reviewed')
    if record['applicability']['review_after'] and instant(record['applicability']['review_after']) <= dt.datetime.now(dt.timezone.utc):
        reasons.append('Lesson review date expired')
    if not any(row['result'] == 'PASS' and row['candidate_id'] == candidate_id for row in record['evidence']):
        reasons.append('No matching successful verification evidence')
    rec = record['reconciliation']
    duplicates = exact_duplicates(record, existing or [])
    if rec['coverage'] not in ('MISSING', 'PARTIAL'):
        reasons.append('Coverage requires reuse, conflict resolution or further review')
    if rec['conflicts'] or rec['duplicate_of'] or duplicates:
        reasons.append('Unresolved conflict or duplicate; do not append another instruction')
    evidence = {row['path']: row for row in record['evidence']}
    for counter in record['counterevidence']:
        if counter['resolution'] != 'RESOLVED' or any(evidence[ref]['result'] != 'PASS' or evidence[ref]['candidate_id'] != candidate_id for ref in counter['resolution_refs']):
            reasons.append('Unresolved counterevidence requires successful current-candidate resolution evidence')
    if record['execution_state'] == 'APPLIED' and any(evidence[ref]['result'] != 'PASS' or evidence[ref]['candidate_id'] != candidate_id for ref in record['effect']['verification_refs']):
        reasons.append('Applied effect verification failed or belongs to another candidate')
    if record['proposed_instruction']['scope'] == 'PERSONAL':
        reasons.append('Personal/global changes require their separate destination and authority procedure')
    if record['disposition'] not in ('ADOPT', 'RECONCILE'):
        reasons.append('Disposition does not propose an effective change')
    if not record['authority']['adoption_ref']:
        reasons.append('Adoption authority reference missing')
    try:
        safe_path(project, record['proposed_instruction']['target'])
    except (GovernanceError, OSError):
        reasons.append('Proposed target is not a safe project-relative path')
    return {'status': 'PASS', 'errors': [], 'promotion_checks': 'BLOCKED' if reasons else 'PASS',
            'reasons': reasons, 'exact_duplicates': duplicates,
            'proposed_instruction': record['proposed_instruction'],
            'effective_authority': 'NONE_FROM_VALIDATOR',
            'limits': ['Evidence hashes do not prove the truth of a root cause or authenticate decisions.',
                       'Near-duplicate meaning and conflicts need scoped human/agent reconciliation.',
                       'PASS does not activate instructions, install a skill, authorize a write, or qualify a host.']}


def capture_lesson(project: Path, record: dict) -> dict:
    project = project.resolve(strict=True)
    if project.is_relative_to(ROOT):
        raise GovernanceError('Do not record consumer lessons inside the reference package')
    cfg = load(safe_path(project, '.aghr/project.json', must_exist=True))
    if cfg.get('canonical_backend') != 'LOCAL_JSON':
        raise GovernanceError('Use the declared canonical tracker adapter instead of a parallel lesson store')
    errors = validate_lesson(record, project)
    if errors:
        raise GovernanceError('; '.join(errors))
    target = safe_path(project, '.aghr/intake/lessons/' + record['lesson_id'] + '.json')
    save_new(target, record)
    return {'status': 'CAPTURED_NO_PROMOTION', 'lesson_id': record['lesson_id'], 'sha256': sha(target),
            'captured_at': now(), 'source_authority': 'NOT_AUTHENTICATED', 'active_instructions_changed': False}
