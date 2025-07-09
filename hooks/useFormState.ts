import { useState, useCallback, useEffect } from 'react';
import { FormConfig, FormField, FormValidationRule } from '../lib/types/write-types';
import { validateField } from '../lib/form-validation';

interface FormState {
  data: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isDirty: boolean;
}

interface UseFormStateReturn {
  formData: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
  updateField: (name: string, value: unknown) => void;
  validateField: (name: string) => boolean;
  validateForm: () => boolean;
  resetForm: () => void;
  setSubmitting: (submitting: boolean) => void;
  setFieldError: (name: string, error: string) => void;
  clearFieldError: (name: string) => void;
  getFieldValue: (name: string) => unknown;
  setFieldValue: (name: string, value: unknown) => void;
}

export const useFormState = (config: FormConfig): UseFormStateReturn => {
  const [formState, setFormState] = useState<FormState>(() => {
    const initialData: Record<string, unknown> = {};
    
    config.fields.forEach(field => {
      initialData[field.name] = field.defaultValue ?? getDefaultValueForFieldType(field.type);
    });

    return {
      data: initialData,
      errors: {},
      touched: {},
      isSubmitting: false,
      isDirty: false
    };
  });

  // Calculate if form is valid
  const isValid = Object.keys(formState.errors).length === 0;

  const updateField = useCallback((name: string, value: unknown) => {
    setFormState(prev => ({
      ...prev,
      data: { ...prev.data, [name]: value },
      isDirty: true,
      touched: { ...prev.touched, [name]: true }
    }));
  }, []);

  const validateFieldInternal = useCallback((name: string): boolean => {
    const field = config.fields.find(f => f.name === name);
    if (!field) return true;

    const value = formState.data[name];
    const rules = field.validation || [];
    
    // Add implicit required rule if field is required
    if (field.required && !rules.some(rule => rule.type === 'required')) {
      rules.unshift({
        field: name,
        type: 'required',
        message: `${field.label} is required`
      });
    }

    const validationResult = validateField(value, rules);
    
    setFormState(prev => ({
      ...prev,
      errors: validationResult.isValid
        ? { ...prev.errors, [name]: '' }
        : { ...prev.errors, [name]: validationResult.error || 'Validation failed' }
    }));

    return validationResult.isValid;
  }, [config.fields, formState.data]);

  const validateForm = useCallback((): boolean => {
    let isFormValid = true;
    
    config.fields.forEach(field => {
      const fieldValid = validateFieldInternal(field.name);
      if (!fieldValid) {
        isFormValid = false;
      }
    });

    return isFormValid;
  }, [config.fields, validateFieldInternal]);

  const resetForm = useCallback(() => {
    const initialData: Record<string, unknown> = {};
    
    config.fields.forEach(field => {
      initialData[field.name] = field.defaultValue ?? getDefaultValueForFieldType(field.type);
    });

    setFormState({
      data: initialData,
      errors: {},
      touched: {},
      isSubmitting: false,
      isDirty: false
    });
  }, [config.fields]);

  const setSubmitting = useCallback((submitting: boolean) => {
    setFormState(prev => ({
      ...prev,
      isSubmitting: submitting
    }));
  }, []);

  const setFieldError = useCallback((name: string, error: string) => {
    setFormState(prev => ({
      ...prev,
      errors: { ...prev.errors, [name]: error }
    }));
  }, []);

  const clearFieldError = useCallback((name: string) => {
    setFormState(prev => ({
      ...prev,
      errors: { ...prev.errors, [name]: '' }
    }));
  }, []);

  const getFieldValue = useCallback((name: string): unknown => {
    return formState.data[name];
  }, [formState.data]);

  const setFieldValue = useCallback((name: string, value: unknown) => {
    setFormState(prev => ({
      ...prev,
      data: { ...prev.data, [name]: value },
      isDirty: true
    }));
  }, []);

  // Auto-validate fields when they change
  useEffect(() => {
    Object.keys(formState.touched).forEach(fieldName => {
      if (formState.touched[fieldName]) {
        validateFieldInternal(fieldName);
      }
    });
  }, [formState.data, formState.touched, validateFieldInternal]);

  return {
    formData: formState.data,
    errors: formState.errors,
    touched: formState.touched,
    isSubmitting: formState.isSubmitting,
    isDirty: formState.isDirty,
    isValid,
    updateField,
    validateField: validateFieldInternal,
    validateForm,
    resetForm,
    setSubmitting,
    setFieldError,
    clearFieldError,
    getFieldValue,
    setFieldValue
  };
};

// Helper function to get default values for different field types
function getDefaultValueForFieldType(type: string): unknown {
  switch (type) {
    case 'text':
    case 'email':
    case 'password':
    case 'textarea':
    case 'select':
      return '';
    case 'number':
      return 0;
    case 'checkbox':
      return false;
    case 'radio':
      return '';
    default:
      return '';
  }
}

// Additional hook for form persistence
export const useFormPersistence = (
  formId: string,
  formData: Record<string, unknown>,
  options: { autoSave?: boolean; saveInterval?: number } = {}
) => {
  const { autoSave = true, saveInterval = 1000 } = options;

  const saveToStorage = useCallback(() => {
    try {
      localStorage.setItem(`form_${formId}`, JSON.stringify(formData));
    } catch (error) {
      console.warn('Failed to save form data to localStorage:', error);
    }
  }, [formId, formData]);

  const loadFromStorage = useCallback((): Record<string, unknown> | null => {
    try {
      const stored = localStorage.getItem(`form_${formId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load form data from localStorage:', error);
      return null;
    }
  }, [formId]);

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(`form_${formId}`);
    } catch (error) {
      console.warn('Failed to clear form data from localStorage:', error);
    }
  }, [formId]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave) return;

    const timer = setTimeout(() => {
      saveToStorage();
    }, saveInterval);

    return () => clearTimeout(timer);
  }, [autoSave, saveInterval, saveToStorage]);

  return {
    saveToStorage,
    loadFromStorage,
    clearStorage
  };
};

// Hook for handling form arrays (dynamic lists)
export const useFormArray = (
  name: string,
  initialValue: unknown[] = []
) => {
  const [items, setItems] = useState<unknown[]>(initialValue);

  const addItem = useCallback((item: unknown) => {
    setItems(prev => [...prev, item]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback((index: number, item: unknown) => {
    setItems(prev => prev.map((existing, i) => i === index ? item : existing));
  }, []);

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    setItems(prev => {
      const newItems = [...prev];
      const item = newItems.splice(fromIndex, 1)[0];
      newItems.splice(toIndex, 0, item);
      return newItems;
    });
  }, []);

  const resetItems = useCallback(() => {
    setItems(initialValue);
  }, [initialValue]);

  return {
    items,
    addItem,
    removeItem,
    updateItem,
    moveItem,
    resetItems
  };
};