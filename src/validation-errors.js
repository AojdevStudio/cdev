/**
 * Validation error classes for the validator system
 */

class ValidationError extends Error {
  constructor(message, field = null, code = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.code = code;
    this.timestamp = new Date().toISOString();
  }
}

class RequiredFieldError extends ValidationError {
  constructor(field) {
    super(`Field '${field}' is required`, field, 'REQUIRED_FIELD');
    this.name = 'RequiredFieldError';
  }
}

class TypeValidationError extends ValidationError {
  constructor(field, expectedType, actualType) {
    super(`Field '${field}' must be of type '${expectedType}', got '${actualType}'`, field, 'TYPE_MISMATCH');
    this.name = 'TypeValidationError';
    this.expectedType = expectedType;
    this.actualType = actualType;
  }
}

class FormatValidationError extends ValidationError {
  constructor(field, format, value) {
    super(`Field '${field}' does not match expected format '${format}': ${value}`, field, 'FORMAT_INVALID');
    this.name = 'FormatValidationError';
    this.format = format;
    this.value = value;
  }
}

class RangeValidationError extends ValidationError {
  constructor(field, min, max, value) {
    super(`Field '${field}' value '${value}' is outside allowed range [${min}, ${max}]`, field, 'RANGE_INVALID');
    this.name = 'RangeValidationError';
    this.min = min;
    this.max = max;
    this.value = value;
  }
}

class ValidationErrorCollection {
  constructor() {
    this.errors = [];
  }

  addError(error) {
    if (error instanceof ValidationError) {
      this.errors.push(error);
    } else {
      this.errors.push(new ValidationError(error.message || error));
    }
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  getErrors() {
    return this.errors;
  }

  getErrorsByField(field) {
    return this.errors.filter(error => error.field === field);
  }

  getErrorMessages() {
    return this.errors.map(error => error.message);
  }

  clear() {
    this.errors = [];
  }

  toJSON() {
    return {
      hasErrors: this.hasErrors(),
      errorCount: this.errors.length,
      errors: this.errors.map(error => ({
        name: error.name,
        message: error.message,
        field: error.field,
        code: error.code,
        timestamp: error.timestamp
      }))
    };
  }
}

module.exports = {
  ValidationError,
  RequiredFieldError,
  TypeValidationError,
  FormatValidationError,
  RangeValidationError,
  ValidationErrorCollection
};