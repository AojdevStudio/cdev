export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'email' | 'number' | 'custom';
  value?: string | number | RegExp;
  message: string;
  validator?: (value: unknown) => boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FormField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  validationRules?: ValidationRule[];
}

/**
 * Validates a single field value against its validation rules
 */
export const validateField = (value: unknown, rules: ValidationRule[] = []): string | null => {
  for (const rule of rules) {
    const error = validateRule(value, rule);
    if (error) {
      return error;
    }
  }
  return null;
};

/**
 * Validates a single rule against a value
 */
export const validateRule = (value: unknown, rule: ValidationRule): string | null => {
  switch (rule.type) {
    case 'required':
      return validateRequired(value, rule.message);
    
    case 'minLength':
      return validateMinLength(value, rule.value as number, rule.message);
    
    case 'maxLength':
      return validateMaxLength(value, rule.value as number, rule.message);
    
    case 'pattern':
      return validatePattern(value, rule.value as RegExp, rule.message);
    
    case 'email':
      return validateEmail(value, rule.message);
    
    case 'number':
      return validateNumber(value, rule.message);
    
    case 'custom':
      return validateCustom(value, rule.validator!, rule.message);
    
    default:
      return null;
  }
};

/**
 * Validates that a value is not empty
 */
export const validateRequired = (value: unknown, message: string): string | null => {
  if (value === null || value === undefined || value === '') {
    return message;
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return message;
  }
  
  if (Array.isArray(value) && value.length === 0) {
    return message;
  }
  
  return null;
};

/**
 * Validates minimum length for strings
 */
export const validateMinLength = (value: unknown, minLength: number, message: string): string | null => {
  if (typeof value !== 'string') {
    return null; // Skip validation for non-strings
  }
  
  if (value.length < minLength) {
    return message;
  }
  
  return null;
};

/**
 * Validates maximum length for strings
 */
export const validateMaxLength = (value: unknown, maxLength: number, message: string): string | null => {
  if (typeof value !== 'string') {
    return null; // Skip validation for non-strings
  }
  
  if (value.length > maxLength) {
    return message;
  }
  
  return null;
};

/**
 * Validates a value against a regular expression pattern
 */
export const validatePattern = (value: unknown, pattern: RegExp, message: string): string | null => {
  if (typeof value !== 'string') {
    return null; // Skip validation for non-strings
  }
  
  if (!pattern.test(value)) {
    return message;
  }
  
  return null;
};

/**
 * Validates email format
 */
export const validateEmail = (value: unknown, message: string): string | null => {
  if (typeof value !== 'string') {
    return null; // Skip validation for non-strings
  }
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(value)) {
    return message;
  }
  
  return null;
};

/**
 * Validates that a value is a valid number
 */
export const validateNumber = (value: unknown, message: string): string | null => {
  if (typeof value === 'number' && !isNaN(value)) {
    return null;
  }
  
  if (typeof value === 'string') {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      return null;
    }
  }
  
  return message;
};

/**
 * Validates using a custom validator function
 */
export const validateCustom = (value: unknown, validator: (value: unknown) => boolean, message: string): string | null => {
  if (!validator(value)) {
    return message;
  }
  
  return null;
};

/**
 * Validates an entire form against field definitions
 */
export const validateForm = (formData: Record<string, unknown>, fields: FormField[]): ValidationResult => {
  const errors: Record<string, string> = {};
  
  for (const field of fields) {
    const value = formData[field.id];
    const rules = field.validationRules || [];
    
    // Add required rule if field is marked as required
    if (field.required && !rules.some(rule => rule.type === 'required')) {
      rules.unshift({
        type: 'required',
        message: `${field.label} is required`
      });
    }
    
    const error = validateField(value, rules);
    if (error) {
      errors[field.id] = error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Common validation rule factories
 */
export const validationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    type: 'required',
    message
  }),
  
  minLength: (length: number, message = `Must be at least ${length} characters`): ValidationRule => ({
    type: 'minLength',
    value: length,
    message
  }),
  
  maxLength: (length: number, message = `Must be no more than ${length} characters`): ValidationRule => ({
    type: 'maxLength',
    value: length,
    message
  }),
  
  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    type: 'email',
    message
  }),
  
  number: (message = 'Please enter a valid number'): ValidationRule => ({
    type: 'number',
    message
  }),
  
  pattern: (pattern: RegExp, message = 'Invalid format'): ValidationRule => ({
    type: 'pattern',
    value: pattern,
    message
  }),
  
  custom: (validator: (value: unknown) => boolean, message = 'Invalid value'): ValidationRule => ({
    type: 'custom',
    validator,
    message
  }),
  
  // Common patterns
  phone: (message = 'Please enter a valid phone number'): ValidationRule => ({
    type: 'pattern',
    value: /^[\+]?[\d\s\-\(\)]+$/,
    message
  }),
  
  url: (message = 'Please enter a valid URL'): ValidationRule => ({
    type: 'pattern',
    value: /^https?:\/\/.+/,
    message
  }),
  
  strongPassword: (message = 'Password must contain at least 8 characters with uppercase, lowercase, number and special character'): ValidationRule => ({
    type: 'pattern',
    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    message
  })
};

/**
 * Async validation support
 */
export interface AsyncValidationRule {
  type: 'async';
  validator: (value: unknown) => Promise<boolean>;
  message: string;
}

export const validateFieldAsync = async (value: unknown, rules: (ValidationRule | AsyncValidationRule)[] = []): Promise<string | null> => {
  // First run synchronous validations
  const syncRules = rules.filter(rule => rule.type !== 'async') as ValidationRule[];
  const syncError = validateField(value, syncRules);
  
  if (syncError) {
    return syncError;
  }
  
  // Then run async validations
  const asyncRules = rules.filter(rule => rule.type === 'async') as AsyncValidationRule[];
  
  for (const rule of asyncRules) {
    const isValid = await rule.validator(value);
    if (!isValid) {
      return rule.message;
    }
  }
  
  return null;
};

/**
 * Debounced validation for real-time feedback
 */
export const createDebouncedValidator = (
  validator: (value: unknown) => Promise<string | null>,
  delay = 300
) => {
  let timeoutId: NodeJS.Timeout;
  
  return (value: unknown): Promise<string | null> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const result = await validator(value);
        resolve(result);
      }, delay);
    });
  };
};