/**
 * Tests for the main validator interface
 */

const { Validator, validator } = require('./validator');
const { ValidationError } = require('./validation-errors');

describe('Validator', () => {
  let validatorInstance;

  beforeEach(() => {
    validatorInstance = new Validator();
  });

  describe('schema management', () => {
    test('should define and get schema', () => {
      const schema = {
        name: ['required', 'string'],
        age: ['required', 'number'],
      };

      validatorInstance.defineSchema('user', schema);

      expect(validatorInstance.getSchema('user')).toBe(schema);
    });

    test('should return undefined for unknown schema', () => {
      expect(validatorInstance.getSchema('unknown')).toBeUndefined();
    });
  });

  describe('single value validation', () => {
    test('should validate single value', () => {
      const errors = validatorInstance.validateValue('test', 'field', ['required', 'string']);

      expect(errors.hasErrors()).toBe(false);
    });

    test('should collect errors for invalid value', () => {
      const errors = validatorInstance.validateValue('', 'field', ['required', 'string']);

      expect(errors.hasErrors()).toBe(true);
      expect(errors.getErrors()).toHaveLength(1);
    });
  });

  describe('object validation', () => {
    test('should validate object against schema', () => {
      const schema = {
        name: ['required', 'string'],
        age: ['required', 'number'],
        email: ['required', 'email'],
      };

      const data = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      };

      const result = validatorInstance.validate(data, schema);

      expect(result.isValid).toBe(true);
      expect(result.errors.hasErrors()).toBe(false);
      expect(result.errorCount).toBe(0);
      expect(result.data).toEqual(data);
    });

    test('should collect validation errors', () => {
      const schema = {
        name: ['required', 'string'],
        age: ['required', 'number'],
        email: ['required', 'email'],
      };

      const data = {
        name: '',
        age: 'not a number',
        email: 'invalid-email',
      };

      const result = validatorInstance.validate(data, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.hasErrors()).toBe(true);
      expect(result.errorCount).toBe(3);
      expect(result.errorMessages).toHaveLength(3);
    });

    test('should validate with defined schema name', () => {
      const schema = {
        name: ['required', 'string'],
        age: ['required', 'number'],
      };

      validatorInstance.defineSchema('user', schema);

      const data = {
        name: 'John Doe',
        age: 30,
      };

      const result = validatorInstance.validate(data, 'user');

      expect(result.isValid).toBe(true);
    });

    test('should throw error for unknown schema name', () => {
      const data = { name: 'John' };

      expect(() => validatorInstance.validate(data, 'unknown')).toThrow(
        'Schema not found: unknown',
      );
    });
  });

  describe('nested object validation', () => {
    test('should handle nested values', () => {
      const data = {
        user: {
          profile: {
            name: 'John Doe',
          },
        },
      };

      const value = validatorInstance.getNestedValue(data, 'user.profile.name');
      expect(value).toBe('John Doe');
    });

    test('should handle missing nested paths', () => {
      const data = {
        user: {
          profile: {},
        },
      };

      const value = validatorInstance.getNestedValue(data, 'user.profile.name');
      expect(value).toBeUndefined();
    });

    test('should set nested values', () => {
      const data = {};

      validatorInstance.setNestedValue(data, 'user.profile.name', 'John Doe');

      expect(data.user.profile.name).toBe('John Doe');
    });

    test('should validate nested object schema', () => {
      const schema = {
        user: {
          schema: {
            name: ['required', 'string'],
            age: ['required', 'number'],
          },
        },
      };

      const data = {
        user: {
          name: 'John Doe',
          age: 30,
        },
      };

      const result = validatorInstance.validate(data, schema);

      expect(result.isValid).toBe(true);
    });

    test('should collect nested validation errors', () => {
      const schema = {
        user: {
          schema: {
            name: ['required', 'string'],
            age: ['required', 'number'],
          },
        },
      };

      const data = {
        user: {
          name: '',
          age: 'not a number',
        },
      };

      const result = validatorInstance.validate(data, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors.hasErrors()).toBe(true);

      const errors = result.errors.getErrors();
      expect(errors.some((e) => e.field === 'user.name')).toBe(true);
      expect(errors.some((e) => e.field === 'user.age')).toBe(true);
    });
  });

  describe('custom rules', () => {
    test('should add custom rule', () => {
      const customValidator = jest.fn(() => true);
      validatorInstance.addRule('custom', customValidator);

      expect(validatorInstance.getAvailableRules()).toContain('custom');
    });

    test('should use custom rule in validation', () => {
      const customValidator = jest.fn(() => {
        throw new ValidationError('Custom validation failed');
      });

      validatorInstance.addRule('custom', customValidator);

      const errors = validatorInstance.validateValue('value', 'field', ['custom']);

      expect(errors.hasErrors()).toBe(true);
      expect(customValidator).toHaveBeenCalled();
    });
  });

  describe('utility methods', () => {
    test('should check if value is valid', () => {
      expect(validatorInstance.isValid('test', 'string')).toBe(true);
      expect(validatorInstance.isValid(123, 'string')).toBe(false);
    });

    test('should validate required fields', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const result = validatorInstance.validateRequired(data, ['name', 'email']);

      expect(result.isValid).toBe(true);
    });

    test('should detect missing required fields', () => {
      const data = {
        name: 'John Doe',
      };

      const result = validatorInstance.validateRequired(data, ['name', 'email']);

      expect(result.isValid).toBe(false);
      expect(result.errorCount).toBe(1);
    });

    test('should get available rules', () => {
      const rules = validatorInstance.getAvailableRules();

      expect(rules).toContain('required');
      expect(rules).toContain('string');
      expect(rules).toContain('number');
      expect(rules).toContain('email');
    });
  });

  describe('field schema variations', () => {
    test('should handle object field schema with rules', () => {
      const schema = {
        name: {
          rules: ['required', 'string'],
        },
      };

      const data = {
        name: 'John Doe',
      };

      const result = validatorInstance.validate(data, schema);

      expect(result.isValid).toBe(true);
    });

    test('should handle array field schema', () => {
      const schema = {
        name: ['required', 'string'],
      };

      const data = {
        name: 'John Doe',
      };

      const result = validatorInstance.validate(data, schema);

      expect(result.isValid).toBe(true);
    });
  });
});

describe('default validator instance', () => {
  test('should export default validator instance', () => {
    expect(validator).toBeInstanceOf(Validator);
  });

  test('should use default validator', () => {
    const schema = {
      name: ['required', 'string'],
    };

    const data = {
      name: 'John Doe',
    };

    const result = validator.validate(data, schema);

    expect(result.isValid).toBe(true);
  });
});
