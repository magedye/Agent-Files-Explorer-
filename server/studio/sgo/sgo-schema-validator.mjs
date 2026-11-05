/**
 * Robust JSON Schema (Draft 2020-12 conforming subset) validator for SGO
 * Evaluates types, required fields, properties, additionalProperties, enums,
 * const, combinators (allOf/anyOf/oneOf/not), formats, string/number bounds, and item schemas.
 *
 * CRITICAL SECURITY INVARIANT:
 * Unsupported schema keywords must NEVER silently pass. Any unrecognized
 * keyword on a schema node produces an explicit validation error.
 */

const SUPPORTED_SCHEMA_KEYWORDS = new Set([
  '$schema',
  '$id',
  '$defs',
  'definitions',
  'title',
  'description',
  'default',
  'examples',
  'type',
  'properties',
  'required',
  'additionalProperties',
  'enum',
  'const',
  'pattern',
  'minLength',
  'maxLength',
  'minimum',
  'maximum',
  'minItems',
  'maxItems',
  'uniqueItems',
  'items',
  'allOf',
  'anyOf',
  'oneOf',
  'not',
  'format'
]);

export function validateDataAgainstSchema(data, schema, instancePath = '') {
  const errors = [];

  if (!schema || typeof schema !== 'object') {
    return { valid: true, errors: [] };
  }

  // 0. Keyword Support Verification: Unsupported keywords must NOT silently pass
  for (const key of Object.keys(schema)) {
    if (!SUPPORTED_SCHEMA_KEYWORDS.has(key)) {
      errors.push({
        path: instancePath || '/',
        message: `Unsupported schema keyword '${key}' cannot silently pass validation.`
      });
    }
  }

  // 1. Type validation
  if (schema.type) {
    const expectedType = schema.type;
    const actualType = getActualType(data);

    if (expectedType === 'integer') {
      if (typeof data !== 'number' || !Number.isInteger(data)) {
        errors.push({ path: instancePath || '/', message: `Expected integer, received ${typeof data}` });
        return { valid: false, errors };
      }
    } else if (expectedType !== actualType) {
      errors.push({ path: instancePath || '/', message: `Expected ${expectedType}, received ${actualType}` });
      return { valid: false, errors };
    }
  }

  // 2. Enum & Const validation
  if (Array.isArray(schema.enum)) {
    if (!schema.enum.includes(data)) {
      errors.push({ path: instancePath || '/', message: `Value '${data}' is not in allowed enum: [${schema.enum.join(', ')}]` });
    }
  }

  if (schema.const !== undefined) {
    if (data !== schema.const) {
      errors.push({ path: instancePath || '/', message: `Value does not match required const: ${JSON.stringify(schema.const)}` });
    }
  }

  // 3. String pattern, format & length validation
  if (typeof data === 'string') {
    if (schema.pattern) {
      const reg = new RegExp(schema.pattern);
      if (!reg.test(data)) {
        errors.push({ path: instancePath || '/', message: `String does not match required pattern: ${schema.pattern}` });
      }
    }
    if (typeof schema.minLength === 'number' && data.length < schema.minLength) {
      errors.push({ path: instancePath || '/', message: `String length ${data.length} < minLength ${schema.minLength}` });
    }
    if (typeof schema.maxLength === 'number' && data.length > schema.maxLength) {
      errors.push({ path: instancePath || '/', message: `String length ${data.length} > maxLength ${schema.maxLength}` });
    }
    if (schema.format) {
      validateStringFormat(data, schema.format, instancePath || '/', errors);
    }
  }

  // 4. Number bounds
  if (typeof data === 'number') {
    if (typeof schema.minimum === 'number' && data < schema.minimum) {
      errors.push({ path: instancePath || '/', message: `Number ${data} < minimum ${schema.minimum}` });
    }
    if (typeof schema.maximum === 'number' && data > schema.maximum) {
      errors.push({ path: instancePath || '/', message: `Number ${data} > maximum ${schema.maximum}` });
    }
  }

  // 5. Object validation
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    // Required properties
    if (Array.isArray(schema.required)) {
      for (const reqProp of schema.required) {
        if (!Object.prototype.hasOwnProperty.call(data, reqProp) || data[reqProp] === undefined) {
          errors.push({ path: instancePath ? `${instancePath}/${reqProp}` : `/${reqProp}`, message: `Missing required property '${reqProp}'` });
        }
      }
    }

    // Additional properties restriction
    if (schema.additionalProperties === false && schema.properties) {
      const allowedProps = new Set(Object.keys(schema.properties));
      for (const actualKey of Object.keys(data)) {
        if (!allowedProps.has(actualKey)) {
          errors.push({ path: instancePath ? `${instancePath}/${actualKey}` : `/${actualKey}`, message: `Undeclared property '${actualKey}' not allowed by schema` });
        }
      }
    }

    // Validate declared properties recursively
    if (schema.properties) {
      for (const [propKey, propSchema] of Object.entries(schema.properties)) {
        if (Object.prototype.hasOwnProperty.call(data, propKey) && data[propKey] !== undefined) {
          const propPath = instancePath ? `${instancePath}/${propKey}` : `/${propKey}`;
          const subResult = validateDataAgainstSchema(data[propKey], propSchema, propPath);
          errors.push(...subResult.errors);
        }
      }
    }
  }

  // 6. Array validation
  if (Array.isArray(data)) {
    if (typeof schema.minItems === 'number' && data.length < schema.minItems) {
      errors.push({ path: instancePath || '/', message: `Array items count ${data.length} < minItems ${schema.minItems}` });
    }
    if (typeof schema.maxItems === 'number' && data.length > schema.maxItems) {
      errors.push({ path: instancePath || '/', message: `Array items count ${data.length} > maxItems ${schema.maxItems}` });
    }
    if (schema.uniqueItems === true) {
      const serialized = data.map(v => JSON.stringify(v));
      const set = new Set(serialized);
      if (set.size !== data.length) {
        errors.push({ path: instancePath || '/', message: `Array items must be unique, duplicate elements detected` });
      }
    }

    if (schema.items) {
      for (let i = 0; i < data.length; i++) {
        const itemPath = `${instancePath || ''}/${i}`;
        const subResult = validateDataAgainstSchema(data[i], schema.items, itemPath);
        errors.push(...subResult.errors);
      }
    }
  }

  // 7. Combinators (allOf, anyOf, oneOf, not)
  if (Array.isArray(schema.allOf)) {
    for (let i = 0; i < schema.allOf.length; i++) {
      const sub = validateDataAgainstSchema(data, schema.allOf[i], instancePath);
      errors.push(...sub.errors);
    }
  }

  if (Array.isArray(schema.anyOf)) {
    const anyMatches = schema.anyOf.some(subSchema => validateDataAgainstSchema(data, subSchema, instancePath).valid);
    if (!anyMatches) {
      errors.push({ path: instancePath || '/', message: `Data does not match any allowed sub-schema in 'anyOf'` });
    }
  }

  if (Array.isArray(schema.oneOf)) {
    const validCount = schema.oneOf.filter(subSchema => validateDataAgainstSchema(data, subSchema, instancePath).valid).length;
    if (validCount !== 1) {
      errors.push({ path: instancePath || '/', message: `Data must match exactly one sub-schema in 'oneOf' (matched ${validCount})` });
    }
  }

  if (schema.not && typeof schema.not === 'object') {
    const sub = validateDataAgainstSchema(data, schema.not, instancePath);
    if (sub.valid) {
      errors.push({ path: instancePath || '/', message: `Data matches prohibited sub-schema in 'not'` });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function validateStringFormat(str, format, path, errors) {
  if (format === 'date-time') {
    const isIso = !isNaN(Date.parse(str)) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str);
    if (!isIso) {
      errors.push({ path, message: `String '${str}' does not match format 'date-time'` });
    }
  } else if (format === 'uuid') {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
    if (!isUuid) {
      errors.push({ path, message: `String '${str}' does not match format 'uuid'` });
    }
  } else if (format === 'uri') {
    try {
      new URL(str);
    } catch {
      errors.push({ path, message: `String '${str}' does not match format 'uri'` });
    }
  } else if (format === 'email') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
      errors.push({ path, message: `String '${str}' does not match format 'email'` });
    }
  } else {
    // Unsupported format keyword must not silently pass
    errors.push({ path, message: `Unsupported format '${format}' cannot silently pass validation.` });
  }
}

function getActualType(val) {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'array';
  return typeof val;
}
