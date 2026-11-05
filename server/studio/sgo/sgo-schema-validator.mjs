/**
 * Robust JSON Schema (Draft 2020-12 conforming subset) validator for SGO
 * Evaluates types, required fields, properties, additionalProperties, enums, patterns, and item schemas.
 */

export function validateDataAgainstSchema(data, schema, instancePath = '') {
  const errors = [];

  if (!schema || typeof schema !== 'object') {
    return { valid: true, errors: [] };
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

  // 2. Enum validation
  if (Array.isArray(schema.enum)) {
    if (!schema.enum.includes(data)) {
      errors.push({ path: instancePath || '/', message: `Value '${data}' is not in allowed enum: [${schema.enum.join(', ')}]` });
    }
  }

  // 3. String pattern & length validation
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

    if (schema.items) {
      for (let i = 0; i < data.length; i++) {
        const itemPath = `${instancePath || ''}/${i}`;
        const subResult = validateDataAgainstSchema(data[i], schema.items, itemPath);
        errors.push(...subResult.errors);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function getActualType(val) {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'array';
  return typeof val;
}
