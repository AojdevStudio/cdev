import { useState, useCallback, useReducer } from 'react';
import { validateField, ValidationRule } from '../lib/form-validation';

export interface FormState {
  data: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isDirty: boolean;
}

export interface FormAction {
  type: 'SET_FIELD' | 'SET_ERROR' | 'SET_ERRORS' | 'SET_TOUCHED' | 'SET_SUBMITTING' | 'RESET_FORM' | 'SET_FORM_DATA';
  payload?: Record<string, unknown> | { field: string; value: unknown } | { field: string; error: string } | boolean;
}

const initialState: FormState = {
  data: {},
  errors: {},
  touched: {},
  isSubmitting: false,
  isDirty: false
};

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_FIELD':
      const { field, value } = action.payload as { field: string; value: unknown };
      return {
        ...state,
        data: {
          ...state.data,
          [field]: value
        },
        isDirty: true,
        // Clear error when field is updated
        errors: {
          ...state.errors,
          [field]: ''
        }
      };

    case 'SET_ERROR':
      const { field: errorField, error } = action.payload as { field: string; error: string };
      return {
        ...state,
        errors: {
          ...state.errors,
          [errorField]: error
        }
      };

    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.payload as Record<string, string>
      };

    case 'SET_TOUCHED':
      const touchedField = action.payload as string;
      return {
        ...state,
        touched: {
          ...state.touched,
          [touchedField]: true
        }
      };

    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.payload as boolean
      };

    case 'SET_FORM_DATA':
      return {
        ...state,
        data: action.payload as Record<string, unknown>,
        isDirty: false
      };

    case 'RESET_FORM':
      return initialState;

    default:
      return state;
  }
};

export interface UseFormStateOptions {
  initialData?: Record<string, unknown>;
  onSubmit?: (data: Record<string, unknown>) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export const useFormState = (options: UseFormStateOptions = {}) => {
  const [state, dispatch] = useReducer(formReducer, {
    ...initialState,
    data: options.initialData || {}
  });

  const [validationCache, setValidationCache] = useState<Record<string, ValidationRule[]>>({});

  // Update a single field
  const updateField = useCallback((field: string, value: unknown) => {
    dispatch({
      type: 'SET_FIELD',
      payload: { field, value }
    });

    // Auto-validate on change if enabled
    if (options.validateOnChange && validationCache[field]) {
      const error = validateField(value, validationCache[field]);
      if (error) {
        dispatch({
          type: 'SET_ERROR',
          payload: { field, error }
        });
      }
    }
  }, [options.validateOnChange, validationCache]);

  // Set form data (useful for initialization)
  const setFormData = useCallback((data: Record<string, unknown>) => {
    dispatch({
      type: 'SET_FORM_DATA',
      payload: data
    });
  }, []);

  // Update multiple fields at once
  const updateFields = useCallback((fields: Record<string, unknown>) => {
    Object.entries(fields).forEach(([field, value]) => {
      updateField(field, value);
    });
  }, [updateField]);

  // Validate a single field
  const validateField = useCallback((field: string, value: unknown, rules: ValidationRule[]) => {
    // Cache validation rules for this field
    setValidationCache(prev => ({
      ...prev,
      [field]: rules
    }));

    const error = validateField(value, rules);
    
    dispatch({
      type: 'SET_ERROR',
      payload: { field, error: error || '' }
    });

    return error;
  }, []);

  // Validate entire form
  const validateForm = useCallback((errors: Record<string, string>) => {
    dispatch({
      type: 'SET_ERRORS',
      payload: errors
    });
  }, []);

  // Mark field as touched
  const touchField = useCallback((field: string) => {
    dispatch({
      type: 'SET_TOUCHED',
      payload: field
    });

    // Auto-validate on blur if enabled
    if (options.validateOnBlur && validationCache[field]) {
      const error = validateField(state.data[field], validationCache[field]);
      if (error) {
        dispatch({
          type: 'SET_ERROR',
          payload: { field, error }
        });
      }
    }
  }, [options.validateOnBlur, validationCache, state.data]);

  // Set submitting state
  const setSubmitting = useCallback((isSubmitting: boolean) => {
    dispatch({
      type: 'SET_SUBMITTING',
      payload: isSubmitting
    });
  }, []);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
    setValidationCache({});
  }, []);

  // Get field value
  const getFieldValue = useCallback((field: string) => {
    return state.data[field];
  }, [state.data]);

  // Get field error
  const getFieldError = useCallback((field: string) => {
    return state.errors[field];
  }, [state.errors]);

  // Check if field is touched
  const isFieldTouched = useCallback((field: string) => {
    return state.touched[field] || false;
  }, [state.touched]);

  // Check if field has error
  const hasFieldError = useCallback((field: string) => {
    return Boolean(state.errors[field]);
  }, [state.errors]);

  // Check if form is valid
  const isFormValid = useCallback(() => {
    return Object.values(state.errors).every(error => !error);
  }, [state.errors]);

  // Get all form errors
  const getFormErrors = useCallback(() => {
    return Object.entries(state.errors)
      .filter(([, error]) => error)
      .reduce((acc, [field, error]) => ({ ...acc, [field]: error }), {});
  }, [state.errors]);

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (state.isSubmitting) {
      return;
    }

    setSubmitting(true);

    try {
      if (options.onSubmit) {
        await options.onSubmit(state.data);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [state.data, state.isSubmitting, options.onSubmit]);

  // Create field props helper
  const getFieldProps = useCallback((field: string) => {
    return {
      value: getFieldValue(field) || '',
      error: getFieldError(field),
      touched: isFieldTouched(field),
      hasError: hasFieldError(field),
      onChange: (value: unknown) => updateField(field, value),
      onBlur: () => touchField(field)
    };
  }, [getFieldValue, getFieldError, isFieldTouched, hasFieldError, updateField, touchField]);

  return {
    // State
    formData: state.data,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    isDirty: state.isDirty,
    
    // Actions
    updateField,
    updateFields,
    setFormData,
    validateField,
    validateForm,
    touchField,
    setSubmitting,
    resetForm,
    handleSubmit,
    
    // Getters
    getFieldValue,
    getFieldError,
    isFieldTouched,
    hasFieldError,
    isFormValid,
    getFormErrors,
    getFieldProps
  };
};

export default useFormState;