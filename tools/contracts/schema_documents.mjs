// Generic local JSON Schema resource handling; contains no AGHR policy decisions.
import fs from 'node:fs';
import path from 'node:path';

export function loadDocuments(directory) {
  return new Map(fs.readdirSync(directory)
    .filter(name => name.endsWith('.json'))
    .map(name => [name, JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'))]));
}

export function resolveReference(documents, owner, reference) {
  const [relative, fragment = ''] = reference.split('#');
  if (/^[a-z]+:/i.test(relative) || relative.includes('\\')) throw new Error(`Non-local reference: ${reference}`);
  const target = relative || owner;
  if (target !== path.posix.basename(target) || !documents.has(target)) throw new Error(`Unknown contract resource: ${target}`);
  let selected = documents.get(target);
  if (fragment) {
    if (!fragment.startsWith('/')) throw new Error(`Not a JSON Pointer: ${reference}`);
    for (const token of decodeURIComponent(fragment).slice(1).split('/')) {
      const key = token.replace(/~1/g, '/').replace(/~0/g, '~');
      if (!selected || !Object.hasOwn(selected, key)) throw new Error(`Unresolved reference: ${owner} -> ${reference}`);
      selected = selected[key];
    }
  }
  return { target, fragment, selected };
}

export function visitReferences(documents, action) {
  const visit = (value, owner) => {
    if (!value || typeof value !== 'object') return;
    if (typeof value.$ref === 'string') action(resolveReference(documents, owner, value.$ref), owner, value.$ref);
    for (const entry of Object.values(value)) visit(entry, owner);
  };
  for (const [owner, value] of documents) visit(value, owner);
}

export function bundleSchema(documents, root) {
  const definitions = {};
  const pointer = name => name.replace(/~/g, '~0').replace(/\//g, '~1');
  const add = name => {
    if (Object.hasOwn(definitions, name)) return;
    definitions[name] = null; // Break recursive schema graphs; never evaluate data here.
    const rewrite = value => {
      if (Array.isArray(value)) return value.map(rewrite);
      if (!value || typeof value !== 'object') return value;
      const result = {};
      for (const [key, member] of Object.entries(value)) {
        if (key === '$id' || key === '$schema') continue;
        if (['const', 'enum', 'default', 'examples'].includes(key)) {
          result[key] = structuredClone(member);
          continue;
        }
        if (['properties', '$defs', 'patternProperties', 'dependentSchemas'].includes(key)) {
          result[key] = Object.fromEntries(Object.entries(member).map(([property, schema]) => [property, rewrite(schema)]));
          continue;
        }
        if (key === '$ref') {
          const { target, fragment } = resolveReference(documents, name, member);
          add(target);
          result.$ref = `#/$defs/${pointer(target)}${fragment}`;
        } else result[key] = rewrite(member);
      }
      return result;
    };
    definitions[name] = rewrite(documents.get(name));
  };
  add(root);
  return { $schema: 'https://json-schema.org/draft/2020-12/schema', $ref: `#/$defs/${pointer(root)}`, $defs: definitions };
}
