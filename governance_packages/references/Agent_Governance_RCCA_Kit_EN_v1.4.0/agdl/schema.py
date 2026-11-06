"""Validate only the JSON Schema subset used by this package, not arbitrary schemas.

Supported: type, required, properties, additionalProperties, enum, const,
items, minItems, uniqueItems, minLength, maxLength, pattern, minimum.
Schemas are package-owned; no remote references or code evaluation.
"""
from __future__ import annotations
import re
from typing import Any

TYPES = {'object': dict, 'array': list, 'string': str, 'boolean': bool,
         'integer': int, 'number': (int, float), 'null': type(None)}

def check(value: Any, schema: dict, path: str = '$') -> list[str]:
    errors = []
    wanted = schema.get('type')
    if wanted:
        types = [wanted] if isinstance(wanted, str) else wanted
        matched = any(isinstance(value, TYPES[t]) and not (t in ('integer', 'number') and isinstance(value, bool)) for t in types)
        if not matched:
            return [path + ':type']
    if 'const' in schema and value != schema['const']:
        errors.append(path + ':const')
    if 'enum' in schema and value not in schema['enum']:
        errors.append(path + ':enum')
    if isinstance(value, dict):
        for key in schema.get('required', []):
            if key not in value:
                errors.append(path + '.' + key + ':required')
        props = schema.get('properties', {})
        for key, item in value.items():
            if key in props:
                errors.extend(check(item, props[key], path + '.' + key))
            elif schema.get('additionalProperties') is False:
                errors.append(path + '.' + key + ':additional_property')
            elif isinstance(schema.get('additionalProperties'), dict):
                errors.extend(check(item, schema['additionalProperties'], path + '.' + key))
    elif isinstance(value, list):
        if len(value) < schema.get('minItems', 0):
            errors.append(path + ':minItems')
        if schema.get('uniqueItems') and any(item == earlier for i, item in enumerate(value) for earlier in value[:i]):
            errors.append(path + ':uniqueItems')
        for i, item in enumerate(value):
            errors.extend(check(item, schema.get('items', {}), path + f'[{i}]'))
    elif isinstance(value, str):
        if len(value) < schema.get('minLength', 0):
            errors.append(path + ':minLength')
        if len(value) > schema.get('maxLength', 10**9):
            errors.append(path + ':maxLength')
        if 'pattern' in schema and not re.search(schema['pattern'], value):
            errors.append(path + ':pattern')
    elif isinstance(value, (int, float)) and not isinstance(value, bool):
        if value < schema.get('minimum', float('-inf')):
            errors.append(path + ':minimum')
    return errors
