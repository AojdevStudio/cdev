/**
 * Tests for validation rules and rule engine
 */

const { ValidationRule, ValidationRules } = require('./validation-rules');
const {
  RequiredFieldError,
  TypeValidationError,
  FormatValidationError,
  RangeValidationError,
} = require('./validation-errors');

describe('ValidationRule', () => {
  test('should create validation rule', () => {
    const validator = jest.fn(() => true);
    const rule = new ValidationRule('test', validator, { option: 'value' });

    expect(rule.name).toBe('test');
    expect(rule.validator).toBe(validator);
    expect(rule.options).toEqual({ option: 'value' });
  });

  test('should validate value', () => {
    const validator = jest.fn(() => true);
    const rule = new ValidationRule('test', validator);

    const result = rule.validate('value', 'field');

    expect(result).toBe(true);
    expect(validator).toHaveBeenCalledWith('value', 'field', {}, {});
  });
});

describe('ValidationRules', () => {
  let rules;

  beforeEach(() => {
    rules = new ValidationRules();
  });

  describe('built-in rules', () => {
    test('should validate required field', () => {
      expect(() => rules.validateValue('value', 'field', 'required')).not.toThrow();
      expect(() => rules.validateValue('', 'field', 'required')).toThrow(RequiredFieldError);
      expect(() => rules.validateValue(null, 'field', 'required')).toThrow(RequiredFieldError);
      expect(() => rules.validateValue(undefined, 'field', 'required')).toThrow(RequiredFieldError);
    });

    test('should validate string type', () => {
      expect(() => rules.validateValue('string', 'field', 'string')).not.toThrow();
      expect(() => rules.validateValue(123, 'field', 'string')).toThrow(TypeValidationError);
      expect(() => rules.validateValue(true, 'field', 'string')).toThrow(TypeValidationError);
    });

    test('should validate number type', () => {
      expect(() => rules.validateValue(123, 'field', 'number')).not.toThrow();
      expect(() => rules.validateValue(123.45, 'field', 'number')).not.toThrow();
      expect(() => rules.validateValue('123', 'field', 'number')).toThrow(TypeValidationError);
      expect(() => rules.validateValue(NaN, 'field', 'number')).toThrow(TypeValidationError);
    });

    test('should validate boolean type', () => {
      expect(() => rules.validateValue(true, 'field', 'boolean')).not.toThrow();
      expect(() => rules.validateValue(false, 'field', 'boolean')).not.toThrow();
      expect(() => rules.validateValue('true', 'field', 'boolean')).toThrow(TypeValidationError);
      expect(() => rules.validateValue(1, 'field', 'boolean')).toThrow(TypeValidationError);
    });

    test('should validate array type', () => {
      expect(() => rules.validateValue([], 'field', 'array')).not.toThrow();
      expect(() => rules.validateValue([1, 2, 3], 'field', 'array')).not.toThrow();
      expect(() => rules.validateValue('array', 'field', 'array')).toThrow(TypeValidationError);
      expect(() => rules.validateValue({}, 'field', 'array')).toThrow(TypeValidationError);
    });

    test('should validate object type', () => {
      expect(() => rules.validateValue({}, 'field', 'object')).not.toThrow();
      expect(() => rules.validateValue({ key: 'value' }, 'field', 'object')).not.toThrow();
      expect(() => rules.validateValue([], 'field', 'object')).toThrow(TypeValidationError);
      expect(() => rules.validateValue(null, 'field', 'object')).toThrow(TypeValidationError);
    });

    test('should validate email format', () => {
      expect(() => rules.validateValue('user@example.com', 'field', 'email')).not.toThrow();
      expect(() => rules.validateValue('test@domain.org', 'field', 'email')).not.toThrow();
      expect(() => rules.validateValue('invalid-email', 'field', 'email')).toThrow(
        FormatValidationError,
      );
      expect(() => rules.validateValue('user@', 'field', 'email')).toThrow(FormatValidationError);
    });

    test('should validate URL format', () => {
      expect(() => rules.validateValue('https://example.com', 'field', 'url')).not.toThrow();
      expect(() => rules.validateValue('http://domain.org', 'field', 'url')).not.toThrow();
      expect(() => rules.validateValue('invalid-url', 'field', 'url')).toThrow(
        FormatValidationError,
      );
    });

    test('should validate UUID format', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(() => rules.validateValue(validUuid, 'field', 'uuid')).not.toThrow();
      expect(() => rules.validateValue('invalid-uuid', 'field', 'uuid')).toThrow(
        FormatValidationError,
      );
    });

    test('should validate minimum length/value', () => {
      expect(() => rules.validateValue('hello', 'field', 'min', { min: 3 })).not.toThrow();
      expect(() => rules.validateValue('hi', 'field', 'min', { min: 3 })).toThrow(
        RangeValidationError,
      );
      expect(() => rules.validateValue(10, 'field', 'min', { min: 5 })).not.toThrow();
      expect(() => rules.validateValue(3, 'field', 'min', { min: 5 })).toThrow(
        RangeValidationError,
      );
    });

    test('should validate maximum length/value', () => {
      expect(() => rules.validateValue('hello', 'field', 'max', { max: 10 })).not.toThrow();
      expect(() => rules.validateValue('very long string', 'field', 'max', { max: 10 })).toThrow(
        RangeValidationError,
      );
      expect(() => rules.validateValue(5, 'field', 'max', { max: 10 })).not.toThrow();
      expect(() => rules.validateValue(15, 'field', 'max', { max: 10 })).toThrow(
        RangeValidationError,
      );
    });

    test('should validate range', () => {
      expect(() => rules.validateValue(5, 'field', 'range', { min: 1, max: 10 })).not.toThrow();
      expect(() => rules.validateValue(0, 'field', 'range', { min: 1, max: 10 })).toThrow(
        RangeValidationError,
      );
      expect(() => rules.validateValue(15, 'field', 'range', { min: 1, max: 10 })).toThrow(
        RangeValidationError,
      );
    });

    test('should validate pattern', () => {
      expect(() =>
        rules.validateValue('abc123', 'field', 'pattern', { pattern: /^[a-z]+\d+$/ }),
      ).not.toThrow();
      expect(() =>
        rules.validateValue('123abc', 'field', 'pattern', { pattern: /^[a-z]+\d+$/ }),
      ).toThrow(FormatValidationError);
    });

    test('should validate custom rule', () => {
      const customValidator = jest.fn(() => true);
      expect(() =>
        rules.validateValue('value', 'field', 'custom', { validator: customValidator }),
      ).not.toThrow();
      expect(customValidator).toHaveBeenCalledWith('value', 'field', {});
    });
  });

  describe('rule management', () => {
    test('should add custom rule', () => {
      const validator = jest.fn(() => true);
      rules.addRule('custom', validator);

      expect(rules.hasRule('custom')).toBe(true);
      expect(rules.getRule('custom')).toBeDefined();
    });

    test('should get available rules', () => {
      const availableRules = rules.getAvailableRules();

      expect(availableRules).toContain('required');
      expect(availableRules).toContain('string');
      expect(availableRules).toContain('number');
      expect(availableRules).toContain('email');
    });

    test('should throw error for unknown rule', () => {
      expect(() => rules.validateValue('value', 'field', 'unknown')).toThrow(
        'Unknown validation rule: unknown',
      );
    });
  });

  describe('validateWithRules', () => {
    test('should validate with multiple rules', () => {
      const ruleSpecs = ['required', 'string', { rule: 'min', min: 3 }];
      const errors = rules.validateWithRules('hello', 'field', ruleSpecs);

      expect(errors.hasErrors()).toBe(false);
    });

    test('should collect multiple errors', () => {
      const ruleSpecs = ['required', 'string', { rule: 'min', min: 10 }];
      const errors = rules.validateWithRules('hi', 'field', ruleSpecs);

      expect(errors.hasErrors()).toBe(true);
      expect(errors.getErrors()).toHaveLength(1); // Only min rule fails
    });

    test('should handle empty value with required rule', () => {
      const ruleSpecs = ['required', 'string'];
      const errors = rules.validateWithRules('', 'field', ruleSpecs);

      expect(errors.hasErrors()).toBe(true);
      expect(errors.getErrors()).toHaveLength(1);
      expect(errors.getErrors()[0]).toBeInstanceOf(RequiredFieldError);
    });
  });
});
