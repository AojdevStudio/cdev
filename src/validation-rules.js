/**
 * Validation rules and rule engine for the validator system
 */

const {
  ValidationError,
  RequiredFieldError,
  TypeValidationError,
  FormatValidationError,
  RangeValidationError,
  ValidationErrorCollection
} = require('./validation-errors');

class ValidationRule {
  constructor(name, validator, options = {}) {
    this.name = name;
    this.validator = validator;
    this.options = options;
  }

  validate(value, field, context = {}) {
    return this.validator(value, field, context, this.options);
  }
}

class ValidationRules {
  constructor() {
    this.rules = new Map();
    this.initializeBuiltInRules();
  }

  initializeBuiltInRules() {
    // Required field validation
    this.addRule('required', (value, field) => {
      if (value === null || value === undefined || value === '') {
        throw new RequiredFieldError(field);
      }
      return true;
    });

    // Type validation
    this.addRule('string', (value, field) => {
      if (typeof value !== 'string') {
        throw new TypeValidationError(field, 'string', typeof value);
      }
      return true;
    });

    this.addRule('number', (value, field) => {
      if (typeof value !== 'number' || isNaN(value)) {
        throw new TypeValidationError(field, 'number', typeof value);
      }
      return true;
    });

    this.addRule('boolean', (value, field) => {
      if (typeof value !== 'boolean') {
        throw new TypeValidationError(field, 'boolean', typeof value);
      }
      return true;
    });

    this.addRule('array', (value, field) => {
      if (!Array.isArray(value)) {
        throw new TypeValidationError(field, 'array', typeof value);
      }
      return true;
    });

    this.addRule('object', (value, field) => {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new TypeValidationError(field, 'object', typeof value);
      }
      return true;
    });

    // Format validation
    this.addRule('email', (value, field) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        throw new FormatValidationError(field, 'email', value);
      }
      return true;
    });

    this.addRule('url', (value, field) => {
      try {
        new URL(value);
        return true;
      } catch {
        throw new FormatValidationError(field, 'url', value);
      }
    });

    this.addRule('uuid', (value, field) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        throw new FormatValidationError(field, 'uuid', value);
      }
      return true;
    });

    // Range validation
    this.addRule('min', (value, field, context, options) => {
      const min = options.min;
      if (min === undefined) {
        throw new Error('min rule requires a "min" option');
      }
      if (typeof value === 'string' && value.length < min) {
        throw new RangeValidationError(field, min, Infinity, value.length);
      }
      if (typeof value === 'number' && value < min) {
        throw new RangeValidationError(field, min, Infinity, value);
      }
      if (Array.isArray(value) && value.length < min) {
        throw new RangeValidationError(field, min, Infinity, value.length);
      }
      return true;
    });

    this.addRule('max', (value, field, context, options) => {
      const max = options.max;
      if (typeof value === 'string' && value.length > max) {
        throw new RangeValidationError(field, -Infinity, max, value.length);
      }
      if (typeof value === 'number' && value > max) {
        throw new RangeValidationError(field, -Infinity, max, value);
      }
      if (Array.isArray(value) && value.length > max) {
        throw new RangeValidationError(field, -Infinity, max, value.length);
      }
      return true;
    });

    this.addRule('range', (value, field, context, options) => {
      const { min, max } = options;
      if (typeof value === 'number' && (value < min || value > max)) {
        throw new RangeValidationError(field, min, max, value);
      }
      if (typeof value === 'string' && (value.length < min || value.length > max)) {
        throw new RangeValidationError(field, min, max, value.length);
      }
      return true;
    });

    // Pattern validation
    this.addRule('pattern', (value, field, context, options) => {
      const pattern = options.pattern;
      const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
      if (!regex.test(value)) {
        throw new FormatValidationError(field, pattern.toString(), value);
      }
      return true;
    });

    // Custom validation
    this.addRule('custom', (value, field, context, options) => {
      const customValidator = options.validator;
      if (typeof customValidator === 'function') {
        const result = customValidator(value, field, context);
        if (result !== true) {
          throw new ValidationError(result || `Custom validation failed for field '${field}'`, field, 'CUSTOM_VALIDATION');
        }
      }
      return true;
    });
  }

  addRule(name, validator, options = {}) {
    this.rules.set(name, new ValidationRule(name, validator, options));
  }

  getRule(name) {
    return this.rules.get(name);
  }

  hasRule(name) {
    return this.rules.has(name);
  }

  validateValue(value, field, ruleName, options = {}) {
    const rule = this.getRule(ruleName);
    if (!rule) {
      throw new Error(`Unknown validation rule: ${ruleName}`);
    }
    // Pass options to the validator along with the rule's default options
    const mergedOptions = { ...rule.options, ...options };
    return rule.validator(value, field, {}, mergedOptions);
  }

  validateWithRules(value, field, ruleSpecs) {
    const errors = new ValidationErrorCollection();
    
    for (const ruleSpec of ruleSpecs) {
      try {
        if (typeof ruleSpec === 'string') {
          this.validateValue(value, field, ruleSpec);
        } else if (typeof ruleSpec === 'object') {
          const { rule, ...options } = ruleSpec;
          this.validateValue(value, field, rule, options);
        }
      } catch (error) {
        errors.addError(error);
      }
    }
    
    return errors;
  }

  getAvailableRules() {
    return Array.from(this.rules.keys());
  }
}

module.exports = {
  ValidationRule,
  ValidationRules
};