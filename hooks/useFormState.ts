import { useState, useCallback, useEffect } from 'react';
import { FormField, FormValidator, ValidationResult, ValidationError } from '../lib/form-validation';

// Form state interface
export interface FormState {
  values: Record<string, unknown>;
  errors: ValidationError[];
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

// Form actions interface
export interface FormActions {
  setValue: (field: string, value: unknown) => void;
  setValues: (values: Record<string, unknown>) => void;
  setError: (field: string, message: string) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  touchField: (field: string) => void;
  touchAllFields: () => void;
  reset: () => void;
  validate: () => ValidationResult;
  validateField: (field: string) => ValidationError[];
  submit: () => Promise<void>;
}

// Hook options
export interface UseFormStateOptions {
  initialValues?: Record<string, unknown>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onSubmit?: (values: Record<string, unknown>) => Promise<void> | void;
  onValidationChange?: (isValid: boolean) => void;
}

// Main hook
export const useFormState = (
  fields: FormField[],
  options: UseFormStateOptions = {}
): [FormState, FormActions] => {
  const {
    initialValues = {},
    validateOnChange = true,
    validateOnBlur = true,
    onSubmit,
    onValidationChange,
  } = options;

  // Initialize form validator
  const validator = new FormValidator(fields);

  // Initialize state
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const defaultValues: Record<string, unknown> = {};
    fields.forEach(field => {
      defaultValues[field.name] = initialValues[field.name] ?? field.defaultValue ?? '';
    });
    return defaultValues;
  });

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived state
  const isValid = errors.length === 0;
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  // Validation functions
  const validateForm = useCallback((): ValidationResult => {
    const result = validator.validate(values);
    setErrors(result.errors);
    return result;
  }, [validator, values]);

  const validateSingleField = useCallback((fieldName: string): ValidationError[] => {
    const field = fields.find(f => f.name === fieldName);
    if (!field) return [];

    const fieldValidator = new FormValidator([field]);
    const result = fieldValidator.validate({ [fieldName]: values[fieldName] });
    
    // Update errors by removing old errors for this field and adding new ones
    setErrors(prevErrors => {
      const filteredErrors = prevErrors.filter(error => error.field !== fieldName);
      return [...filteredErrors, ...result.errors];
    });

    return result.errors;
  }, [fields, values]);

  // Actions
  const setValue = useCallback((field: string, value: unknown) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    if (validateOnChange) {
      setTimeout(() => validateSingleField(field), 0);
    }
  }, [validateOnChange, validateSingleField]);

  const setFormValues = useCallback((newValues: Record<string, unknown>) => {
    setValues(newValues);
    
    if (validateOnChange) {
      setTimeout(() => validateForm(), 0);
    }
  }, [validateOnChange, validateForm]);

  const setError = useCallback((field: string, message: string) => {
    setErrors(prev => {
      const filteredErrors = prev.filter(error => error.field !== field);
      return [...filteredErrors, { field, message, code: 'CUSTOM_ERROR' }];
    });
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors(prev => prev.filter(error => error.field !== field));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const touchField = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (validateOnBlur) {
      setTimeout(() => validateSingleField(field), 0);
    }
  }, [validateOnBlur, validateSingleField]);

  const touchAllFields = useCallback(() => {
    const allTouched: Record<string, boolean> = {};
    fields.forEach(field => {
      allTouched[field.name] = true;
    });
    setTouched(allTouched);
    validateForm();
  }, [fields, validateForm]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors([]);
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const submit = useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    touchAllFields();
    
    const result = validateForm();
    
    if (result.isValid && onSubmit) {
      try {
        await onSubmit(result.values);
      } catch (error) {
        console.error('Form submission error:', error);
        setError('form', error instanceof Error ? error.message : 'Submission failed');
      }
    }
    
    setIsSubmitting(false);
  }, [isSubmitting, touchAllFields, validateForm, onSubmit, setError]);

  // Effect for validation change callback
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [isValid, onValidationChange]);

  // Form state object
  const formState: FormState = {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
  };

  // Form actions object
  const formActions: FormActions = {
    setValue,
    setValues: setFormValues,
    setError,
    clearError,
    clearAllErrors,
    touchField,
    touchAllFields,
    reset,
    validate: validateForm,
    validateField: validateSingleField,
    submit,
  };

  return [formState, formActions];
};

// Helper hook for directory validation specifically
export const useDirectoryValidation = (
  initialPath: string = '',
  initialName: string = '',
  onValidDirectory?: (path: string, name: string) => void
) => {
  const fields: FormField[] = [
    {
      name: 'path',
      label: 'Directory Path',
      type: 'text',
      required: true,
      placeholder: 'e.g., src/components',
    },
    {
      name: 'name',
      label: 'Directory Name',
      type: 'text',
      required: true,
      placeholder: 'e.g., forms',
    },
    {
      name: 'createIfMissing',
      label: 'Create if Missing',
      type: 'checkbox',
      defaultValue: false,
    },
  ];

  const [formState, formActions] = useFormState(fields, {
    initialValues: {
      path: initialPath,
      name: initialName,
      createIfMissing: false,
    },
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      if (onValidDirectory) {
        onValidDirectory(values.path as string, values.name as string);
      }
    },
  });

  return { formState, formActions };
};

// Export types
export type { FormState, FormActions, UseFormStateOptions };