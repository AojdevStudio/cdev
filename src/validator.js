/**
 * Main validator interface and schema validation system
 */

const { ValidationRules } = require('./validation-rules');
const { ValidationErrorCollection } = require('./validation-errors');

class Validator {
  constructor() {
    this.rules = new ValidationRules();
    this.schemas = new Map();
  }

  /**
   * Define a validation schema for an object
   * @param {string} schemaName - Name of the schema
   * @param {Object} schema - Schema definition
   */
  defineSchema(schemaName, schema) {
    this.schemas.set(schemaName, schema);
  }

  /**
   * Get a defined schema
   * @param {string} schemaName - Name of the schema
   * @returns {Object} Schema definition
   */
  getSchema(schemaName) {
    return this.schemas.get(schemaName);
  }

  /**
   * Validate a single value against rules
   * @param {any} value - Value to validate
   * @param {string} field - Field name
   * @param {Array} ruleSpecs - Array of rule specifications
   * @returns {ValidationErrorCollection} Validation errors
   */
  validateValue(value, field, ruleSpecs) {
    return this.rules.validateWithRules(value, field, ruleSpecs);
  }

  /**
   * Validate an object against a schema
   * @param {Object} data - Data to validate
   * @param {Object|string} schema - Schema definition or schema name
   * @returns {Object} Validation result
   */
  validate(data, schema) {
    const schemaToUse = typeof schema === 'string' ? this.getSchema(schema) : schema;

    if (!schemaToUse) {
      throw new Error(`Schema not found: ${schema}`);
    }

    const allErrors = new ValidationErrorCollection();
    const validatedData = {};

    // Validate each field in the schema
    for (const [fieldPath, fieldSchema] of Object.entries(schemaToUse)) {
      const fieldValue = this.getNestedValue(data, fieldPath);
      const fieldErrors = this.validateField(fieldValue, fieldPath, fieldSchema, data);

      if (fieldErrors.hasErrors()) {
        fieldErrors.getErrors().forEach((error) => allErrors.addError(error));
      } else {
        this.setNestedValue(validatedData, fieldPath, fieldValue);
      }
    }

    return {
      isValid: !allErrors.hasErrors(),
      errors: allErrors,
      data: validatedData,
      errorCount: allErrors.errors.length,
      errorMessages: allErrors.getErrorMessages(),
    };
  }

  /**
   * Validate a single field
   * @param {any} value - Field value
   * @param {string} fieldPath - Field path
   * @param {Object} fieldSchema - Field schema
   * @param {Object} context - Full data context
   * @returns {ValidationErrorCollection} Field validation errors
   */
  validateField(value, fieldPath, fieldSchema) {
    const errors = new ValidationErrorCollection();

    // Handle different schema formats
    if (Array.isArray(fieldSchema)) {
      // Array of rule specifications
      const fieldErrors = this.rules.validateWithRules(value, fieldPath, fieldSchema);
      fieldErrors.getErrors().forEach((error) => errors.addError(error));
    } else if (typeof fieldSchema === 'object' && fieldSchema !== null) {
      if (fieldSchema.rules) {
        // Object with rules property
        const fieldErrors = this.rules.validateWithRules(value, fieldPath, fieldSchema.rules);
        fieldErrors.getErrors().forEach((error) => errors.addError(error));
      }

      // Handle nested object validation
      if (fieldSchema.schema && typeof value === 'object' && value !== null) {
        const nestedResult = this.validate(value, fieldSchema.schema);
        nestedResult.errors.getErrors().forEach((error) => {
          error.field = `${fieldPath}.${error.field}`;
          errors.addError(error);
        });
      }
    }

    return errors;
  }

  /**
   * Get nested value from object using dot notation
   * @param {Object} obj - Object to search
   * @param {string} path - Dot-separated path
   * @returns {any} Value at path
   */
  getNestedValue(obj, path) {
    if (!obj || typeof obj !== 'object') {
      return undefined;
    }

    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * Set nested value in object using dot notation
   * @param {Object} obj - Object to modify
   * @param {string} path - Dot-separated path
   * @param {any} value - Value to set
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Add a custom validation rule
   * @param {string} name - Rule name
   * @param {Function} validator - Validator function
   * @param {Object} options - Rule options
   */
  addRule(name, validator, options = {}) {
    this.rules.addRule(name, validator, options);
  }

  /**
   * Get list of available validation rules
   * @returns {Array} Array of rule names
   */
  getAvailableRules() {
    return this.rules.getAvailableRules();
  }

  /**
   * Quick validation for common cases
   * @param {any} value - Value to validate
   * @param {string} type - Type to validate against
   * @returns {boolean} True if valid
   */
  isValid(value, type) {
    try {
      this.rules.validateValue(value, 'value', type);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate required fields are present
   * @param {Object} data - Data to validate
   * @param {Array} requiredFields - Array of required field names
   * @returns {Object} Validation result
   */
  validateRequired(data, requiredFields) {
    const errors = new ValidationErrorCollection();

    for (const field of requiredFields) {
      const value = this.getNestedValue(data, field);
      try {
        this.rules.validateValue(value, field, 'required');
      } catch (error) {
        errors.addError(error);
      }
    }

    return {
      isValid: !errors.hasErrors(),
      errors,
      errorCount: errors.errors.length,
      errorMessages: errors.getErrorMessages(),
    };
  }
}

// Export both class and a default instance
const defaultValidator = new Validator();

module.exports = {
  Validator,
  validator: defaultValidator,
};
