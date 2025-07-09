import { z } from 'zod';

// Base validation error type
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Form field types
export type FormFieldType = 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'textarea' | 'file';

// Form field configuration
export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string; }[];
  validation?: z.ZodSchema<unknown>;
  defaultValue?: unknown;
}

// Form validation result
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  values: Record<string, unknown>;
}

// Directory validation schema
export const directoryValidationSchema = z.object({
  path: z.string().min(1, 'Directory path is required'),
  name: z.string().min(1, 'Directory name is required').regex(/^[a-zA-Z0-9_-]+$/, 'Directory name must contain only letters, numbers, underscores, and hyphens'),
  createIfMissing: z.boolean().default(false),
});

// Common validation schemas
export const commonValidationSchemas = {
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  required: z.string().min(1, 'This field is required'),
  number: z.number().min(0, 'Number must be positive'),
  url: z.string().url('Please enter a valid URL'),
  directoryPath: z.string().min(1, 'Directory path is required').refine(
    (path) => !path.includes('..') && !path.startsWith('/'),
    'Directory path must be relative and not contain parent references'
  ),
};

// Main form validation class
export class FormValidator {
  private fields: FormField[];
  private schema: z.ZodObject<Record<string, z.ZodSchema<unknown>>>;

  constructor(fields: FormField[]) {
    this.fields = fields;
    this.schema = this.buildSchema();
  }

  private buildSchema(): z.ZodObject<Record<string, z.ZodSchema<unknown>>> {
    const schemaObj: Record<string, z.ZodSchema<unknown>> = {};

    this.fields.forEach(field => {
      let fieldSchema = field.validation || z.any();

      // Apply common validation based on field type
      if (field.type === 'email') {
        fieldSchema = commonValidationSchemas.email;
      } else if (field.type === 'password') {
        fieldSchema = commonValidationSchemas.password;
      } else if (field.type === 'number') {
        fieldSchema = commonValidationSchemas.number;
      }

      // Make field required if specified
      if (field.required && fieldSchema instanceof z.ZodString) {
        fieldSchema = fieldSchema.min(1, `${field.label} is required`);
      }

      schemaObj[field.name] = fieldSchema;
    });

    return z.object(schemaObj);
  }

  validate(data: Record<string, unknown>): ValidationResult {
    try {
      const validatedData = this.schema.parse(data);
      return {
        isValid: true,
        errors: [],
        values: validatedData,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        return {
          isValid: false,
          errors,
          values: data,
        };
      }

      return {
        isValid: false,
        errors: [{
          field: 'form',
          message: 'An unexpected validation error occurred',
          code: 'UNKNOWN_ERROR',
        }],
        values: data,
      };
    }
  }

  getFieldError(fieldName: string, errors: ValidationError[]): string | undefined {
    return errors.find(error => error.field === fieldName)?.message;
  }

  hasFieldError(fieldName: string, errors: ValidationError[]): boolean {
    return errors.some(error => error.field === fieldName);
  }
}

// Directory validation utility
export const validateDirectory = (path: string, name: string, createIfMissing: boolean = false): ValidationResult => {
  const validator = new FormValidator([
    { name: 'path', label: 'Directory Path', type: 'text', required: true, validation: commonValidationSchemas.directoryPath },
    { name: 'name', label: 'Directory Name', type: 'text', required: true },
    { name: 'createIfMissing', label: 'Create if Missing', type: 'checkbox' },
  ]);

  return validator.validate({ path, name, createIfMissing });
};

// Form field validation helper
export const validateField = (field: FormField, value: unknown): ValidationError[] => {
  const validator = new FormValidator([field]);
  const result = validator.validate({ [field.name]: value });
  return result.errors;
};

// Export types for external use
export type { FormField, ValidationResult, ValidationError, FormFieldType };