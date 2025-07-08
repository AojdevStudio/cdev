import { FormValidationRule, FormValidationResult } from './types/write-types';

export class FormValidator {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly PHONE_REGEX = /^\+?[\d\s\-\(\)]+$/;
  private static readonly URL_REGEX = /^https?:\/\/[^\s]+$/;

  static validateField(
    value: unknown,
    rules: FormValidationRule[]
  ): { isValid: boolean; error?: string } {
    for (const rule of rules) {
      const result = this.applyRule(value, rule);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true };
  }

  static validateForm(
    formData: Record<string, unknown>,
    rules: FormValidationRule[]
  ): FormValidationResult {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    for (const rule of rules) {
      const value = formData[rule.field];
      const result = this.applyRule(value, rule);
      
      if (!result.isValid && result.error) {
        errors[rule.field] = result.error;
      }
    }

    // Cross-field validation
    this.validateCrossFields(formData, rules, errors, warnings);

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings: Object.keys(warnings).length > 0 ? warnings : undefined
    };
  }

  private static applyRule(
    value: unknown,
    rule: FormValidationRule
  ): { isValid: boolean; error?: string } {
    switch (rule.type) {
      case 'required':
        return this.validateRequired(value, rule.message);
      
      case 'minLength':
        return this.validateMinLength(value, rule.value as number, rule.message);
      
      case 'maxLength':
        return this.validateMaxLength(value, rule.value as number, rule.message);
      
      case 'pattern':
        return this.validatePattern(value, rule.value as RegExp, rule.message);
      
      case 'custom':
        return this.validateCustom(value, rule.validator!, rule.message);
      
      default:
        return { isValid: true };
    }
  }

  private static validateRequired(
    value: unknown,
    message: string
  ): { isValid: boolean; error?: string } {
    const isEmpty = value === null || 
                   value === undefined || 
                   value === '' || 
                   (Array.isArray(value) && value.length === 0);
    
    return {
      isValid: !isEmpty,
      error: isEmpty ? message : undefined
    };
  }

  private static validateMinLength(
    value: unknown,
    minLength: number,
    message: string
  ): { isValid: boolean; error?: string } {
    if (value === null || value === undefined) {
      return { isValid: true };
    }

    const stringValue = String(value);
    const isValid = stringValue.length >= minLength;
    
    return {
      isValid,
      error: isValid ? undefined : message
    };
  }

  private static validateMaxLength(
    value: unknown,
    maxLength: number,
    message: string
  ): { isValid: boolean; error?: string } {
    if (value === null || value === undefined) {
      return { isValid: true };
    }

    const stringValue = String(value);
    const isValid = stringValue.length <= maxLength;
    
    return {
      isValid,
      error: isValid ? undefined : message
    };
  }

  private static validatePattern(
    value: unknown,
    pattern: RegExp,
    message: string
  ): { isValid: boolean; error?: string } {
    if (value === null || value === undefined || value === '') {
      return { isValid: true };
    }

    const stringValue = String(value);
    const isValid = pattern.test(stringValue);
    
    return {
      isValid,
      error: isValid ? undefined : message
    };
  }

  private static validateCustom(
    value: unknown,
    validator: (value: unknown) => boolean,
    message: string
  ): { isValid: boolean; error?: string } {
    try {
      const isValid = validator(value);
      return {
        isValid,
        error: isValid ? undefined : message
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static validateCrossFields(
    formData: Record<string, unknown>,
    rules: FormValidationRule[],
    errors: Record<string, string>,
    warnings: Record<string, string>
  ): void {
    // Password confirmation validation
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;
    
    if (password && confirmPassword && password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Email format validation
    const email = formData.email;
    if (email && typeof email === 'string' && !this.EMAIL_REGEX.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone number validation
    const phone = formData.phone;
    if (phone && typeof phone === 'string' && !this.PHONE_REGEX.test(phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    // URL validation
    const url = formData.url || formData.website;
    if (url && typeof url === 'string' && !this.URL_REGEX.test(url)) {
      errors.url = 'Please enter a valid URL';
    }

    // Date range validation
    const startDate = formData.startDate;
    const endDate = formData.endDate;
    
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (start > end) {
        errors.endDate = 'End date must be after start date';
      }
    }
  }
}

// Built-in validation rules
export const validationRules = {
  required: (message = 'This field is required'): FormValidationRule => ({
    field: '',
    type: 'required',
    message
  }),

  minLength: (length: number, message?: string): FormValidationRule => ({
    field: '',
    type: 'minLength',
    value: length,
    message: message || `Must be at least ${length} characters long`
  }),

  maxLength: (length: number, message?: string): FormValidationRule => ({
    field: '',
    type: 'maxLength',
    value: length,
    message: message || `Must be no more than ${length} characters long`
  }),

  email: (message = 'Please enter a valid email address'): FormValidationRule => ({
    field: '',
    type: 'pattern',
    value: FormValidator['EMAIL_REGEX'],
    message
  }),

  phone: (message = 'Please enter a valid phone number'): FormValidationRule => ({
    field: '',
    type: 'pattern',
    value: FormValidator['PHONE_REGEX'],
    message
  }),

  url: (message = 'Please enter a valid URL'): FormValidationRule => ({
    field: '',
    type: 'pattern',
    value: FormValidator['URL_REGEX'],
    message
  }),

  custom: (
    validator: (value: unknown) => boolean,
    message: string
  ): FormValidationRule => ({
    field: '',
    type: 'custom',
    validator,
    message
  })
};

// Convenience function for single field validation
export const validateField = (
  value: unknown,
  rules: FormValidationRule[]
): { isValid: boolean; error?: string } => {
  return FormValidator.validateField(value, rules);
};

// Convenience function for full form validation
export const validateForm = (
  formData: Record<string, unknown>,
  rules: FormValidationRule[]
): FormValidationResult => {
  return FormValidator.validateForm(formData, rules);
};

// Common validation rule sets
export const commonValidations = {
  name: [
    { ...validationRules.required(), field: 'name' },
    { ...validationRules.minLength(2), field: 'name' },
    { ...validationRules.maxLength(50), field: 'name' }
  ],

  email: [
    { ...validationRules.required(), field: 'email' },
    { ...validationRules.email(), field: 'email' }
  ],

  password: [
    { ...validationRules.required(), field: 'password' },
    { ...validationRules.minLength(8, 'Password must be at least 8 characters long'), field: 'password' },
    { 
      ...validationRules.custom(
        (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(String(value)),
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ), 
      field: 'password' 
    }
  ],

  phone: [
    { ...validationRules.phone(), field: 'phone' }
  ],

  url: [
    { ...validationRules.url(), field: 'url' }
  ]
};