/**
 * Tests for validation-rules.js
 */

const { ValidationRules, ValidationRule } = require('../src/validation-rules');
const {
  RequiredFieldError,
  TypeValidationError,
  FormatValidationError,
  RangeValidationError
} = require('../src/validation-errors');

describe('ValidationRules', () => {
  let rules;

  beforeEach(() => {
    rules = new ValidationRules();
  });

  describe('built-in rules', () => {
    describe('required rule', () => {
      test('validates non-empty values', () => {
        expect(() => rules.validateValue('test', 'field', 'required')).not.toThrow();
        expect(() => rules.validateValue(123, 'field', 'required')).not.toThrow();
        expect(() => rules.validateValue(true, 'field', 'required')).not.toThrow();
        expect(() => rules.validateValue([], 'field', 'required')).not.toThrow();
        expect(() => rules.validateValue({}, 'field', 'required')).not.toThrow();
      });

      test('throws error for empty values', () => {
        expect(() => rules.validateValue(null, 'field', 'required')).toThrow(RequiredFieldError);
        expect(() => rules.validateValue(undefined, 'field', 'required')).toThrow(RequiredFieldError);
        expect(() => rules.validateValue('', 'field', 'required')).toThrow(RequiredFieldError);
      });
    });

    describe('type validation rules', () => {
      test('validates string type', () => {
        expect(() => rules.validateValue('test', 'field', 'string')).not.toThrow();
        expect(() => rules.validateValue(123, 'field', 'string')).toThrow(TypeValidationError);
        expect(() => rules.validateValue(null, 'field', 'string')).toThrow(TypeValidationError);
      });

      test('validates number type', () => {
        expect(() => rules.validateValue(123, 'field', 'number')).not.toThrow();
        expect(() => rules.validateValue(12.34, 'field', 'number')).not.toThrow();
        expect(() => rules.validateValue('123', 'field', 'number')).toThrow(TypeValidationError);
        expect(() => rules.validateValue(NaN, 'field', 'number')).toThrow(TypeValidationError);
      });

      test('validates boolean type', () => {
        expect(() => rules.validateValue(true, 'field', 'boolean')).not.toThrow();
        expect(() => rules.validateValue(false, 'field', 'boolean')).not.toThrow();
        expect(() => rules.validateValue(1, 'field', 'boolean')).toThrow(TypeValidationError);
        expect(() => rules.validateValue('true', 'field', 'boolean')).toThrow(TypeValidationError);
      });

      test('validates array type', () => {
        expect(() => rules.validateValue([], 'field', 'array')).not.toThrow();
        expect(() => rules.validateValue([1, 2, 3], 'field', 'array')).not.toThrow();
        expect(() => rules.validateValue({}, 'field', 'array')).toThrow(TypeValidationError);
        expect(() => rules.validateValue('array', 'field', 'array')).toThrow(TypeValidationError);
      });

      test('validates object type', () => {
        expect(() => rules.validateValue({}, 'field', 'object')).not.toThrow();
        expect(() => rules.validateValue({ key: 'value' }, 'field', 'object')).not.toThrow();
        expect(() => rules.validateValue([], 'field', 'object')).toThrow(TypeValidationError);
        expect(() => rules.validateValue(null, 'field', 'object')).toThrow(TypeValidationError);
      });
    });

    describe('format validation rules', () => {
      test('validates email format', () => {
        expect(() => rules.validateValue('test@example.com', 'field', 'email')).not.toThrow();
        expect(() => rules.validateValue('user.name@domain.co.uk', 'field', 'email')).not.toThrow();
        expect(() => rules.validateValue('invalid-email', 'field', 'email')).toThrow(FormatValidationError);
        expect(() => rules.validateValue('@example.com', 'field', 'email')).toThrow(FormatValidationError);
        expect(() => rules.validateValue('test@', 'field', 'email')).toThrow(FormatValidationError);
      });

      test('validates URL format', () => {
        expect(() => rules.validateValue('https://example.com', 'field', 'url')).not.toThrow();
        expect(() => rules.validateValue('http://localhost:3000', 'field', 'url')).not.toThrow();
        expect(() => rules.validateValue('ftp://files.example.com', 'field', 'url')).not.toThrow();
        expect(() => rules.validateValue('not-a-url', 'field', 'url')).toThrow(FormatValidationError);
        expect(() => rules.validateValue('//example.com', 'field', 'url')).toThrow(FormatValidationError);
      });

      test('validates UUID format', () => {
        expect(() => rules.validateValue('550e8400-e29b-41d4-a716-446655440000', 'field', 'uuid')).not.toThrow();
        expect(() => rules.validateValue('123e4567-e89b-12d3-a456-426614174000', 'field', 'uuid')).not.toThrow();
        expect(() => rules.validateValue('not-a-uuid', 'field', 'uuid')).toThrow(FormatValidationError);
        expect(() => rules.validateValue('550e8400-e29b-41d4-a716', 'field', 'uuid')).toThrow(FormatValidationError);
      });
    });

    describe('range validation rules', () => {
      test('validates min rule for strings', () => {
        expect(() => rules.validateValue('hello', 'field', 'min', { min: 3 })).not.toThrow();
        expect(() => rules.validateValue('hi', 'field', 'min', { min: 3 })).toThrow(RangeValidationError);
      });

      test('validates min rule for numbers', () => {
        expect(() => rules.validateValue(10, 'field', 'min', { min: 5 })).not.toThrow();
        expect(() => rules.validateValue(5, 'field', 'min', { min: 5 })).not.toThrow();
        expect(() => rules.validateValue(3, 'field', 'min', { min: 5 })).toThrow(RangeValidationError);
      });

      test('validates min rule for arrays', () => {
        expect(() => rules.validateValue([1, 2, 3], 'field', 'min', { min: 2 })).not.toThrow();
        expect(() => rules.validateValue([1], 'field', 'min', { min: 2 })).toThrow(RangeValidationError);
      });

      test('validates max rule', () => {
        expect(() => rules.validateValue('hi', 'field', 'max', { max: 5 })).not.toThrow();
        expect(() => rules.validateValue('hello world', 'field', 'max', { max: 5 })).toThrow(RangeValidationError);
        expect(() => rules.validateValue(3, 'field', 'max', { max: 5 })).not.toThrow();
        expect(() => rules.validateValue(10, 'field', 'max', { max: 5 })).toThrow(RangeValidationError);
      });

      test('validates range rule', () => {
        expect(() => rules.validateValue(5, 'field', 'range', { min: 1, max: 10 })).not.toThrow();
        expect(() => rules.validateValue(0, 'field', 'range', { min: 1, max: 10 })).toThrow(RangeValidationError);
        expect(() => rules.validateValue(11, 'field', 'range', { min: 1, max: 10 })).toThrow(RangeValidationError);
        expect(() => rules.validateValue('hello', 'field', 'range', { min: 3, max: 10 })).not.toThrow();
        expect(() => rules.validateValue('hi', 'field', 'range', { min: 3, max: 10 })).toThrow(RangeValidationError);
      });

      test('throws error when min option is missing', () => {
        expect(() => rules.validateValue(5, 'field', 'min', {})).toThrow('min rule requires a "min" option');
      });
    });

    describe('pattern validation', () => {
      test('validates against regex pattern', () => {
        expect(() => rules.validateValue('123-45-6789', 'field', 'pattern', { 
          pattern: /^\d{3}-\d{2}-\d{4}$/ 
        })).not.toThrow();
        
        expect(() => rules.validateValue('123456789', 'field', 'pattern', { 
          pattern: /^\d{3}-\d{2}-\d{4}$/ 
        })).toThrow(FormatValidationError);
      });

      test('validates against string pattern', () => {
        expect(() => rules.validateValue('test123', 'field', 'pattern', { 
          pattern: '^test\\d+$' 
        })).not.toThrow();
        
        expect(() => rules.validateValue('test', 'field', 'pattern', { 
          pattern: '^test\\d+$' 
        })).toThrow(FormatValidationError);
      });
    });

    describe('custom validation', () => {
      test('runs custom validator function', () => {
        const customValidator = jest.fn((value) => value > 10);
        
        expect(() => rules.validateValue(15, 'field', 'custom', { 
          validator: customValidator 
        })).not.toThrow();
        
        expect(customValidator).toHaveBeenCalledWith(15, 'field', expect.any(Object));
      });

      test('throws error when custom validation fails', () => {
        const customValidator = (value) => value > 10 ? true : 'Value must be greater than 10';
        
        expect(() => rules.validateValue(5, 'field', 'custom', { 
          validator: customValidator 
        })).toThrow('Value must be greater than 10');
      });
    });
  });

  describe('validateWithRules', () => {
    test('validates multiple rules', () => {
      const ruleSpecs = [
        'required',
        'string',
        { rule: 'min', min: 3 },
        { rule: 'max', max: 10 }
      ];

      const errors = rules.validateWithRules('hello', 'field', ruleSpecs);
      expect(errors.hasErrors()).toBe(false);
    });

    test('collects multiple errors', () => {
      const ruleSpecs = [
        'required',
        'number',
        { rule: 'min', min: 10 }
      ];

      const errors = rules.validateWithRules('5', 'field', ruleSpecs);
      expect(errors.hasErrors()).toBe(true);
      expect(errors.errors.length).toBe(2); // Type error and min error
    });
  });

  describe('custom rules', () => {
    test('adds custom rule', () => {
      const customValidator = jest.fn((value) => value === 'test');
      
      rules.addRule('isTest', customValidator);
      expect(rules.hasRule('isTest')).toBe(true);
      
      rules.validateValue('test', 'field', 'isTest');
      expect(customValidator).toHaveBeenCalled();
    });

    test('custom rule with options', () => {
      const customValidator = (value, field, context, options) => {
        return value.length >= options.minLength;
      };
      
      rules.addRule('minLength', customValidator, { minLength: 5 });
      
      expect(() => rules.validateValue('hello', 'field', 'minLength')).not.toThrow();
      expect(() => rules.validateValue('hi', 'field', 'minLength')).toThrow();
    });
  });

  describe('rule management', () => {
    test('gets available rules', () => {
      const availableRules = rules.getAvailableRules();
      
      expect(availableRules).toContain('required');
      expect(availableRules).toContain('string');
      expect(availableRules).toContain('number');
      expect(availableRules).toContain('email');
      expect(availableRules).toContain('min');
      expect(availableRules).toContain('max');
      expect(availableRules).toContain('pattern');
      expect(availableRules).toContain('custom');
    });

    test('checks if rule exists', () => {
      expect(rules.hasRule('required')).toBe(true);
      expect(rules.hasRule('nonexistent')).toBe(false);
    });

    test('gets rule by name', () => {
      const rule = rules.getRule('required');
      expect(rule).toBeInstanceOf(ValidationRule);
      expect(rule.name).toBe('required');
    });

    test('throws error for unknown rule', () => {
      expect(() => rules.validateValue('test', 'field', 'unknownRule')).toThrow('Unknown validation rule: unknownRule');
    });
  });
});