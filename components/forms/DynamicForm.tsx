import React, { useState, useEffect } from 'react';
import { FormConfig, FormField, FormValidationResult } from '../../lib/types/write-types';
import { useFormState } from '../../hooks/useFormState';
import { validateForm } from '../../lib/form-validation';

interface DynamicFormProps {
  config: FormConfig;
  onSubmit?: (data: Record<string, unknown>) => void | Promise<void>;
  onValidationChange?: (isValid: boolean, errors: Record<string, string>) => void;
  className?: string;
  disabled?: boolean;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  config,
  onSubmit,
  onValidationChange,
  className = '',
  disabled = false
}) => {
  const {
    formData,
    errors,
    touched,
    isSubmitting,
    updateField,
    validateField,
    resetForm,
    setSubmitting
  } = useFormState(config);

  const [validationResult, setValidationResult] = useState<FormValidationResult>({
    isValid: false,
    errors: {}
  });

  useEffect(() => {
    const result = validateForm(formData, config.validation || []);
    setValidationResult(result);
    onValidationChange?.(result.isValid, result.errors);
  }, [formData, config.validation, onValidationChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (disabled || isSubmitting) return;

    // Validate all fields
    const finalValidation = validateForm(formData, config.validation || []);
    
    if (!finalValidation.isValid) {
      setValidationResult(finalValidation);
      return;
    }

    try {
      setSubmitting(true);
      
      if (config.onSubmit) {
        await config.onSubmit(formData);
      }
      
      if (onSubmit) {
        await onSubmit(formData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    resetForm();
    if (config.onReset) {
      config.onReset();
    }
  };

  const renderField = (field: FormField) => {
    const fieldValue = formData[field.name];
    const fieldError = errors[field.name] || validationResult.errors[field.name];
    const isFieldTouched = touched[field.name];

    const commonProps = {
      id: field.name,
      name: field.name,
      required: field.required,
      disabled: disabled || isSubmitting,
      className: `form-field ${fieldError ? 'error' : ''} ${isFieldTouched ? 'touched' : ''}`,
      onBlur: () => validateField(field.name),
      'aria-invalid': !!fieldError,
      'aria-describedby': fieldError ? `${field.name}-error` : undefined
    };

    const handleChange = (value: unknown) => {
      updateField(field.name, value);
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
        return (
          <input
            {...commonProps}
            type={field.type}
            value={fieldValue as string || ''}
            placeholder={field.placeholder}
            onChange={(e) => handleChange(e.target.value)}
          />
        );

      case 'textarea':
        return (
          <textarea
            {...commonProps}
            value={fieldValue as string || ''}
            placeholder={field.placeholder}
            onChange={(e) => handleChange(e.target.value)}
            rows={4}
          />
        );

      case 'select':
        return (
          <select
            {...commonProps}
            value={fieldValue as string || ''}
            onChange={(e) => handleChange(e.target.value)}
          >
            <option value="">{field.placeholder || 'Select an option'}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <input
            {...commonProps}
            type="checkbox"
            checked={fieldValue as boolean || false}
            onChange={(e) => handleChange(e.target.checked)}
          />
        );

      case 'radio':
        return (
          <div className="radio-group">
            {field.options?.map(option => (
              <label key={option.value} className="radio-option">
                <input
                  type="radio"
                  name={field.name}
                  value={option.value}
                  checked={fieldValue === option.value}
                  onChange={(e) => handleChange(e.target.value)}
                  disabled={disabled || isSubmitting}
                />
                {option.label}
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`dynamic-form ${className}`}>
      {config.fields.map(field => (
        <div key={field.name} className="form-group">
          <label htmlFor={field.name} className="form-label">
            {field.label}
            {field.required && <span className="required">*</span>}
          </label>
          
          {renderField(field)}
          
          {(errors[field.name] || validationResult.errors[field.name]) && (
            <div 
              id={`${field.name}-error`}
              className="form-error"
              role="alert"
            >
              {errors[field.name] || validationResult.errors[field.name]}
            </div>
          )}
        </div>
      ))}

      <div className="form-actions">
        <button
          type="submit"
          disabled={disabled || isSubmitting || !validationResult.isValid}
          className="submit-button"
        >
          {isSubmitting ? 'Submitting...' : (config.submitLabel || 'Submit')}
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={disabled || isSubmitting}
          className="reset-button"
        >
          {config.resetLabel || 'Reset'}
        </button>
      </div>
    </form>
  );
};

export default DynamicForm;