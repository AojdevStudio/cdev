import { z } from 'zod';
import {
  FormValidator,
  FormField,
  ValidationResult,
  ValidationError,
  validateDirectory,
  validateField,
  directoryValidationSchema,
  commonValidationSchemas,
} from '../lib/form-validation';

describe('FormValidator', () => {
  describe('constructor and schema building', () => {
    it('builds schema correctly for simple fields', () => {
      const fields: FormField[] = [
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Password', type: 'password', required: true },
        { name: 'newsletter', label: 'Newsletter', type: 'checkbox' },
      ];

      const validator = new FormValidator(fields);
      expect(validator).toBeInstanceOf(FormValidator);
    });

    it('applies type-specific validation for email fields', () => {
      const fields: FormField[] = [
        { name: 'email', label: 'Email', type: 'email', required: true },
      ];

      const validator = new FormValidator(fields);
      const result = validator.validate({ email: 'invalid-email' });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toMatch(/valid email/i);
    });

    it('applies type-specific validation for password fields', () => {
      const fields: FormField[] = [
        { name: 'password', label: 'Password', type: 'password', required: true },
      ];

      const validator = new FormValidator(fields);
      const result = validator.validate({ password: 'short' });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toMatch(/at least 8 characters/i);
    });

    it('applies custom validation schemas when provided', () => {
      const customSchema = z.string().min(5, 'Must be at least 5 characters');
      const fields: FormField[] = [
        { name: 'username', label: 'Username', type: 'text', required: true, validation: customSchema },
      ];

      const validator = new FormValidator(fields);
      const result = validator.validate({ username: 'abc' });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('Must be at least 5 characters');
    });
  });

  describe('validate method', () => {
    let validator: FormValidator;

    beforeEach(() => {
      const fields: FormField[] = [
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'age', label: 'Age', type: 'number', required: false },
        { name: 'newsletter', label: 'Newsletter', type: 'checkbox', required: false },
      ];
      validator = new FormValidator(fields);
    });

    it('returns valid result for valid data', () => {
      const data = {
        email: 'test@example.com',
        age: 25,
        newsletter: true,
      };

      const result = validator.validate(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.values).toEqual(data);
    });

    it('returns invalid result with errors for invalid data', () => {
      const data = {
        email: 'invalid-email',
        age: -5,
        newsletter: false,
      };

      const result = validator.validate(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.find(e => e.field === 'email')).toBeDefined();
    });

    it('validates required fields correctly', () => {
      const data = {
        email: '',
        age: 25,
        newsletter: false,
      };

      const result = validator.validate(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('email');
      expect(result.errors[0].message).toMatch(/required/i);
    });

    it('handles missing fields gracefully', () => {
      const data = {
        age: 25,
        newsletter: false,
      };

      const result = validator.validate(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('email');
    });

    it('handles unexpected validation errors', () => {
      // Create a validator with a field that will throw an unexpected error
      const fields: FormField[] = [
        { name: 'test', label: 'Test', type: 'text', required: true },
      ];
      const validator = new FormValidator(fields);

      // Mock the schema parse to throw a non-ZodError
      const originalParse = validator['schema'].parse;
      validator['schema'].parse = jest.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = validator.validate({ test: 'value' });

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('UNKNOWN_ERROR');
      expect(result.errors[0].message).toBe('An unexpected validation error occurred');

      // Restore original method
      validator['schema'].parse = originalParse;
    });
  });

  describe('utility methods', () => {
    let validator: FormValidator;
    let errors: ValidationError[];

    beforeEach(() => {
      const fields: FormField[] = [
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Password', type: 'password', required: true },
      ];
      validator = new FormValidator(fields);
      errors = [
        { field: 'email', message: 'Email is required', code: 'too_small' },
        { field: 'password', message: 'Password is too short', code: 'too_small' },
      ];
    });

    it('getFieldError returns correct error message', () => {
      const emailError = validator.getFieldError('email', errors);
      const passwordError = validator.getFieldError('password', errors);
      const nonExistentError = validator.getFieldError('nonexistent', errors);

      expect(emailError).toBe('Email is required');
      expect(passwordError).toBe('Password is too short');
      expect(nonExistentError).toBeUndefined();
    });

    it('hasFieldError returns correct boolean values', () => {
      const hasEmailError = validator.hasFieldError('email', errors);
      const hasPasswordError = validator.hasFieldError('password', errors);
      const hasNonExistentError = validator.hasFieldError('nonexistent', errors);

      expect(hasEmailError).toBe(true);
      expect(hasPasswordError).toBe(true);
      expect(hasNonExistentError).toBe(false);
    });
  });
});

describe('validateDirectory function', () => {
  it('validates correct directory inputs', () => {
    const result = validateDirectory('src/components', 'forms', false);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.values).toEqual({
      path: 'src/components',
      name: 'forms',
      createIfMissing: false,
    });
  });

  it('rejects invalid directory paths', () => {
    const result = validateDirectory('../invalid/path', 'forms', false);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.find(e => e.field === 'path')).toBeDefined();
  });

  it('rejects invalid directory names', () => {
    const result = validateDirectory('src/components', 'invalid name!', false);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.find(e => e.field === 'name')).toBeDefined();
  });

  it('requires both path and name', () => {
    const result = validateDirectory('', '', false);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors.find(e => e.field === 'path')).toBeDefined();
    expect(result.errors.find(e => e.field === 'name')).toBeDefined();
  });

  it('handles createIfMissing parameter correctly', () => {
    const result = validateDirectory('src/components', 'forms', true);

    expect(result.isValid).toBe(true);
    expect(result.values.createIfMissing).toBe(true);
  });
});

describe('validateField function', () => {
  it('validates individual fields correctly', () => {
    const emailField: FormField = {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
    };

    const validResult = validateField(emailField, 'test@example.com');
    const invalidResult = validateField(emailField, 'invalid-email');

    expect(validResult).toHaveLength(0);
    expect(invalidResult.length).toBeGreaterThan(0);
    expect(invalidResult[0].field).toBe('email');
  });

  it('validates required fields', () => {
    const requiredField: FormField = {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
    };

    const validResult = validateField(requiredField, 'John Doe');
    const invalidResult = validateField(requiredField, '');

    expect(validResult).toHaveLength(0);
    expect(invalidResult.length).toBeGreaterThan(0);
    expect(invalidResult[0].message).toMatch(/required/i);
  });

  it('handles optional fields correctly', () => {
    const optionalField: FormField = {
      name: 'bio',
      label: 'Biography',
      type: 'textarea',
      required: false,
    };

    const emptyResult = validateField(optionalField, '');
    const filledResult = validateField(optionalField, 'Some bio text');

    expect(emptyResult).toHaveLength(0);
    expect(filledResult).toHaveLength(0);
  });
});

describe('directoryValidationSchema', () => {
  it('validates correct directory schema', () => {
    const validData = {
      path: 'src/components',
      name: 'forms',
      createIfMissing: false,
    };

    const result = directoryValidationSchema.safeParse(validData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });

  it('rejects invalid directory paths', () => {
    const invalidData = {
      path: '../invalid/path',
      name: 'forms',
      createIfMissing: false,
    };

    const result = directoryValidationSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.find(i => i.path.includes('path'))).toBeDefined();
    }
  });

  it('rejects invalid directory names', () => {
    const invalidData = {
      path: 'src/components',
      name: 'invalid name!',
      createIfMissing: false,
    };

    const result = directoryValidationSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.find(i => i.path.includes('name'))).toBeDefined();
    }
  });

  it('applies default value for createIfMissing', () => {
    const dataWithoutCreateIfMissing = {
      path: 'src/components',
      name: 'forms',
    };

    const result = directoryValidationSchema.safeParse(dataWithoutCreateIfMissing);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.createIfMissing).toBe(false);
    }
  });
});

describe('commonValidationSchemas', () => {
  it('validates email addresses correctly', () => {
    const validEmail = 'test@example.com';
    const invalidEmail = 'invalid-email';

    const validResult = commonValidationSchemas.email.safeParse(validEmail);
    const invalidResult = commonValidationSchemas.email.safeParse(invalidEmail);

    expect(validResult.success).toBe(true);
    expect(invalidResult.success).toBe(false);
  });

  it('validates passwords correctly', () => {
    const validPassword = 'password123';
    const invalidPassword = 'short';

    const validResult = commonValidationSchemas.password.safeParse(validPassword);
    const invalidResult = commonValidationSchemas.password.safeParse(invalidPassword);

    expect(validResult.success).toBe(true);
    expect(invalidResult.success).toBe(false);
  });

  it('validates required fields correctly', () => {
    const validValue = 'some value';
    const invalidValue = '';

    const validResult = commonValidationSchemas.required.safeParse(validValue);
    const invalidResult = commonValidationSchemas.required.safeParse(invalidValue);

    expect(validResult.success).toBe(true);
    expect(invalidResult.success).toBe(false);
  });

  it('validates positive numbers correctly', () => {
    const validNumber = 42;
    const invalidNumber = -5;

    const validResult = commonValidationSchemas.number.safeParse(validNumber);
    const invalidResult = commonValidationSchemas.number.safeParse(invalidNumber);

    expect(validResult.success).toBe(true);
    expect(invalidResult.success).toBe(false);
  });

  it('validates URLs correctly', () => {
    const validUrl = 'https://example.com';
    const invalidUrl = 'not-a-url';

    const validResult = commonValidationSchemas.url.safeParse(validUrl);
    const invalidResult = commonValidationSchemas.url.safeParse(invalidUrl);

    expect(validResult.success).toBe(true);
    expect(invalidResult.success).toBe(false);
  });

  it('validates directory paths correctly', () => {
    const validPath = 'src/components';
    const invalidPath1 = '../invalid/path';
    const invalidPath2 = '/absolute/path';

    const validResult = commonValidationSchemas.directoryPath.safeParse(validPath);
    const invalidResult1 = commonValidationSchemas.directoryPath.safeParse(invalidPath1);
    const invalidResult2 = commonValidationSchemas.directoryPath.safeParse(invalidPath2);

    expect(validResult.success).toBe(true);
    expect(invalidResult1.success).toBe(false);
    expect(invalidResult2.success).toBe(false);
  });
});