import { describe, it, expect } from '@jest/globals';
import { 
  FormValidator, 
  validateField, 
  validateForm, 
  validationRules, 
  commonValidations 
} from '../../lib/form-validation';
import { FormValidationRule } from '../../lib/types/write-types';

describe('FormValidator', () => {
  describe('validateField', () => {
    it('should validate required fields', () => {
      const rule: FormValidationRule = {
        field: 'name',
        type: 'required',
        message: 'Name is required'
      };

      expect(validateField('John', [rule])).toEqual({ isValid: true });
      expect(validateField('', [rule])).toEqual({ 
        isValid: false, 
        error: 'Name is required' 
      });
      expect(validateField(null, [rule])).toEqual({ 
        isValid: false, 
        error: 'Name is required' 
      });
      expect(validateField(undefined, [rule])).toEqual({ 
        isValid: false, 
        error: 'Name is required' 
      });
    });

    it('should validate minimum length', () => {
      const rule: FormValidationRule = {
        field: 'password',
        type: 'minLength',
        value: 8,
        message: 'Password must be at least 8 characters'
      };

      expect(validateField('12345678', [rule])).toEqual({ isValid: true });
      expect(validateField('1234567', [rule])).toEqual({ 
        isValid: false, 
        error: 'Password must be at least 8 characters' 
      });
      expect(validateField('', [rule])).toEqual({ 
        isValid: false, 
        error: 'Password must be at least 8 characters' 
      });
    });

    it('should validate maximum length', () => {
      const rule: FormValidationRule = {
        field: 'username',
        type: 'maxLength',
        value: 20,
        message: 'Username must be no more than 20 characters'
      };

      expect(validateField('john', [rule])).toEqual({ isValid: true });
      expect(validateField('a'.repeat(20), [rule])).toEqual({ isValid: true });
      expect(validateField('a'.repeat(21), [rule])).toEqual({ 
        isValid: false, 
        error: 'Username must be no more than 20 characters' 
      });
    });

    it('should validate patterns', () => {
      const rule: FormValidationRule = {
        field: 'email',
        type: 'pattern',
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Invalid email format'
      };

      expect(validateField('john@example.com', [rule])).toEqual({ isValid: true });
      expect(validateField('invalid-email', [rule])).toEqual({ 
        isValid: false, 
        error: 'Invalid email format' 
      });
      expect(validateField('', [rule])).toEqual({ isValid: true }); // Empty is valid for pattern
    });

    it('should validate custom functions', () => {
      const rule: FormValidationRule = {
        field: 'age',
        type: 'custom',
        validator: (value) => {
          const age = Number(value);
          return age >= 18 && age <= 100;
        },
        message: 'Age must be between 18 and 100'
      };

      expect(validateField(25, [rule])).toEqual({ isValid: true });
      expect(validateField(17, [rule])).toEqual({ 
        isValid: false, 
        error: 'Age must be between 18 and 100' 
      });
      expect(validateField(101, [rule])).toEqual({ 
        isValid: false, 
        error: 'Age must be between 18 and 100' 
      });
    });

    it('should handle multiple rules', () => {
      const rules: FormValidationRule[] = [
        {
          field: 'password',
          type: 'required',
          message: 'Password is required'
        },
        {
          field: 'password',
          type: 'minLength',
          value: 8,
          message: 'Password must be at least 8 characters'
        }
      ];

      expect(validateField('12345678', rules)).toEqual({ isValid: true });
      expect(validateField('1234567', rules)).toEqual({ 
        isValid: false, 
        error: 'Password must be at least 8 characters' 
      });
      expect(validateField('', rules)).toEqual({ 
        isValid: false, 
        error: 'Password is required' 
      });
    });

    it('should handle validation errors in custom validators', () => {
      const rule: FormValidationRule = {
        field: 'test',
        type: 'custom',
        validator: () => {
          throw new Error('Validation error');
        },
        message: 'Custom validation failed'
      };

      const result = validateField('test', [rule]);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Validation error');
    });
  });

  describe('validateForm', () => {
    it('should validate complete form', () => {
      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25
      };

      const rules: FormValidationRule[] = [
        { field: 'name', type: 'required', message: 'Name is required' },
        { field: 'email', type: 'required', message: 'Email is required' },
        { field: 'age', type: 'required', message: 'Age is required' }
      ];

      const result = validateForm(formData, rules);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return validation errors', () => {
      const formData = {
        name: '',
        email: 'invalid-email',
        age: 25
      };

      const rules: FormValidationRule[] = [
        { field: 'name', type: 'required', message: 'Name is required' },
        { field: 'email', type: 'pattern', value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' }
      ];

      const result = validateForm(formData, rules);
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual({
        name: 'Name is required',
        email: 'Invalid email'
      });
    });

    it('should validate password confirmation', () => {
      const formData = {
        password: 'secret123',
        confirmPassword: 'different'
      };

      const result = validateForm(formData, []);
      expect(result.isValid).toBe(false);
      expect(result.errors.confirmPassword).toBe('Passwords do not match');
    });

    it('should validate email format', () => {
      const formData = {
        email: 'invalid-email'
      };

      const result = validateForm(formData, []);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Please enter a valid email address');
    });

    it('should validate phone number format', () => {
      const formData = {
        phone: 'invalid-phone'
      };

      const result = validateForm(formData, []);
      expect(result.isValid).toBe(false);
      expect(result.errors.phone).toBe('Please enter a valid phone number');
    });

    it('should validate URL format', () => {
      const formData = {
        url: 'invalid-url'
      };

      const result = validateForm(formData, []);
      expect(result.isValid).toBe(false);
      expect(result.errors.url).toBe('Please enter a valid URL');
    });

    it('should validate date ranges', () => {
      const formData = {
        startDate: '2023-12-01',
        endDate: '2023-11-01'
      };

      const result = validateForm(formData, []);
      expect(result.isValid).toBe(false);
      expect(result.errors.endDate).toBe('End date must be after start date');
    });

    it('should validate valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      validEmails.forEach(email => {
        const result = validateForm({ email }, []);
        expect(result.isValid).toBe(true);
      });
    });

    it('should validate valid phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '(123) 456-7890',
        '123-456-7890',
        '123 456 7890'
      ];

      validPhones.forEach(phone => {
        const result = validateForm({ phone }, []);
        expect(result.isValid).toBe(true);
      });
    });

    it('should validate valid URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://test.org',
        'https://subdomain.example.com/path'
      ];

      validUrls.forEach(url => {
        const result = validateForm({ url }, []);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('validationRules', () => {
    it('should create required rule', () => {
      const rule = validationRules.required('Custom message');
      expect(rule.type).toBe('required');
      expect(rule.message).toBe('Custom message');
    });

    it('should create minLength rule', () => {
      const rule = validationRules.minLength(10);
      expect(rule.type).toBe('minLength');
      expect(rule.value).toBe(10);
      expect(rule.message).toBe('Must be at least 10 characters long');
    });

    it('should create maxLength rule', () => {
      const rule = validationRules.maxLength(50, 'Too long');
      expect(rule.type).toBe('maxLength');
      expect(rule.value).toBe(50);
      expect(rule.message).toBe('Too long');
    });

    it('should create email rule', () => {
      const rule = validationRules.email();
      expect(rule.type).toBe('pattern');
      expect(rule.message).toBe('Please enter a valid email address');
    });

    it('should create custom rule', () => {
      const validator = (value: unknown) => value === 'test';
      const rule = validationRules.custom(validator, 'Must be test');
      expect(rule.type).toBe('custom');
      expect(rule.validator).toBe(validator);
      expect(rule.message).toBe('Must be test');
    });
  });

  describe('commonValidations', () => {
    it('should validate name field', () => {
      const rules = commonValidations.name;
      
      expect(validateField('John', rules)).toEqual({ isValid: true });
      expect(validateField('', rules).isValid).toBe(false);
      expect(validateField('a', rules).isValid).toBe(false);
      expect(validateField('a'.repeat(51), rules).isValid).toBe(false);
    });

    it('should validate email field', () => {
      const rules = commonValidations.email;
      
      expect(validateField('john@example.com', rules)).toEqual({ isValid: true });
      expect(validateField('', rules).isValid).toBe(false);
      expect(validateField('invalid-email', rules).isValid).toBe(false);
    });

    it('should validate password field', () => {
      const rules = commonValidations.password;
      
      expect(validateField('StrongPass123', rules)).toEqual({ isValid: true });
      expect(validateField('', rules).isValid).toBe(false);
      expect(validateField('short', rules).isValid).toBe(false);
      expect(validateField('nouppercase123', rules).isValid).toBe(false);
      expect(validateField('NOLOWERCASE123', rules).isValid).toBe(false);
      expect(validateField('NoNumbers', rules).isValid).toBe(false);
    });

    it('should validate phone field', () => {
      const rules = commonValidations.phone;
      
      expect(validateField('+1234567890', rules)).toEqual({ isValid: true });
      expect(validateField('invalid-phone', rules).isValid).toBe(false);
    });

    it('should validate URL field', () => {
      const rules = commonValidations.url;
      
      expect(validateField('https://example.com', rules)).toEqual({ isValid: true });
      expect(validateField('invalid-url', rules).isValid).toBe(false);
    });
  });
});