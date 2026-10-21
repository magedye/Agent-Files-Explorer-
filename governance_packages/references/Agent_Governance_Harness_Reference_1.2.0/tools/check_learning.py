"""Check bounded learning/source relationships, not the truth of source interpretations."""
import re
from runtime.common import load, validate_schema


def check_learning(root):
    errors = []
    schema = load(root / 'schemas/LESSON.schema.json')
    errors.extend(validate_schema(load(root / 'templates/LESSON.json'), schema))
    sources = load(root / 'design/INBOX_SOURCES.json')['files']
    names = {source['name'] for source in sources}
    if len(sources) != 8 or len(names) != 8:
        errors.append('Learning source custody population changed')
    for source in sources:
        if not re.fullmatch('[0-9a-f]{64}', source['sha256']) or source['bytes'] <= 0:
            errors.append('Learning source custody identity invalid')
    matrix = load(root / 'design/INBOX_RECONCILIATION.json')
    rows = matrix['rows']
    ids = {row['id'] for row in rows}
    if not rows or len(ids) != len(rows) or {row['source'] for row in rows} != names:
        errors.append('Learning source/row accounting incomplete')
    kinds = set(schema['properties']['kind']['enum'])
    dispositions = set(schema['properties']['disposition']['enum'])
    forces = set(schema['properties']['proposed_instruction']['properties']['force']['enum'])
    coverage = set(schema['properties']['reconciliation']['properties']['coverage']['enum'])
    mapping = {'CLARIFY':'ADOPT','EXTEND':'ADOPT','IMPLEMENT_CONTROL':'ADOPT','RECONCILE':'RECONCILE',
               'REUSE':'REFERENCE_ONLY','REFERENCE_ONLY':'REFERENCE_ONLY','DEFER':'DEFER','NEEDS_INFORMATION':'HOLD','REJECT':'REJECT'}
    for row in rows:
        if row['classification_layer'] == 'SOURCE_ASSET':
            if row['kind'] != 'REFERENCE_DOCUMENT':errors.append('Invalid learning source asset classification')
        elif row['classification_layer'] != 'PROPOSED_IMPROVEMENT' or row['kind'] not in kinds:
            errors.append('Invalid learning improvement kind')
        if row['disposition'] not in dispositions or mapping.get(row['engineering_action']) != row['disposition']:
            errors.append('Learning disposition/action taxonomy conflict')
        if row['proposed_force'] not in forces or row['coverage_before'] not in coverage:
            errors.append('Learning force/coverage taxonomy conflict')
        if row['source_authority'] != 'PROPOSED_NOT_EFFECTIVE':
            errors.append('Imported source authority was promoted')
        if not row['targets'] or not row['section'] or not row['finding_and_effect']:
            errors.append('Unexplained learning disposition')
        for target in row['targets']:
            file = (root / target).resolve()
            if not file.is_relative_to(root.resolve()) or not file.is_file():
                errors.append('Missing/outside learning target: ' + target)
    for section in matrix['source_section_index']:
        expected = {row['id'] for row in rows if row['source'] == section['source']}
        if not section['headings'] or set(section['disposition_rows']) != expected:
            errors.append('Learning source section relationships incomplete')
    return errors
