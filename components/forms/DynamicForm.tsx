import React, { useState, useEffect } from 'react';
import { useFormState } from '../../hooks/useFormState';
import { validateForm, ValidationRule } from '../../lib/form-validation';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validationRules?: ValidationRule[];
  defaultValue?: string | number | boolean;
  disabled?: boolean;
  description?: string;
}

interface DynamicFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  submitLabel?: string;
  className?: string;
  isLoading?: boolean;
  resetOnSubmit?: boolean;
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit';
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  onSubmit,
  submitLabel = 'Submit',
  className = '',
  isLoading = false,
  resetOnSubmit = false,
  validationMode = 'onBlur'
}) => {
  const {
    formData,
    errors,
    isSubmitting,
    updateField,
    validateField,
    validateForm: validateFormData,
    resetForm,
    setFormData
  } = useFormState();

  // Initialize form data with default values
  useEffect(() => {
    const initialData: Record<string, unknown> = {};
    fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        initialData[field.id] = field.defaultValue;
      }
    });
    setFormData(initialData);
  }, [fields, setFormData]);

  const handleFieldChange = (fieldId: string, value: unknown) => {
    updateField(fieldId, value);
    
    if (validationMode === 'onChange') {
      const field = fields.find(f => f.id === fieldId);
      if (field?.validationRules) {
        validateField(fieldId, value, field.validationRules);
      }
    }
  };

  const handleFieldBlur = (fieldId: string) => {
    if (validationMode === 'onBlur') {
      const field = fields.find(f => f.id === fieldId);
      if (field?.validationRules) {
        validateField(fieldId, formData[fieldId], field.validationRules);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isLoading) return;

    // Validate all fields
    const validation = validateForm(formData, fields);
    
    if (!validation.isValid) {
      validateFormData(validation.errors);
      return;
    }

    try {
      await onSubmit(formData);
      
      if (resetOnSubmit) {
        resetForm();
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const renderField = (field: FormField) => {
    const fieldError = errors[field.id];
    const fieldValue = formData[field.id];
    
    const commonProps = {
      id: field.id,
      name: field.id,
      disabled: field.disabled || isLoading,
      className: `form-input ${fieldError ? 'error' : ''}`,
      onBlur: () => handleFieldBlur(field.id)
    };

    let fieldElement: React.ReactElement;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
        fieldElement = (
          <input
            {...commonProps}
            type={field.type}
            value={fieldValue as string || ''}
            placeholder={field.placeholder}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
          />
        );
        break;

      case 'textarea':
        fieldElement = (
          <textarea
            {...commonProps}
            value={fieldValue as string || ''}
            placeholder={field.placeholder}
            rows={4}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
          />
        );
        break;

      case 'select':
        fieldElement = (
          <select
            {...commonProps}
            value={fieldValue as string || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
          >
            <option value="">Select an option</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        break;

      case 'checkbox':
        fieldElement = (
          <input
            {...commonProps}
            type="checkbox"
            checked={fieldValue as boolean || false}
            onChange={(e) => handleFieldChange(field.id, e.target.checked)}
            className="form-checkbox"
          />
        );
        break;

      case 'radio':
        fieldElement = (
          <div className="radio-group">
            {field.options?.map(option => (
              <label key={option.value} className="radio-label">
                <input
                  type="radio"
                  name={field.id}
                  value={option.value}
                  checked={fieldValue === option.value}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  disabled={field.disabled || isLoading}
                  className="form-radio"
                />
                {option.label}
              </label>
            ))}
          </div>
        );
        break;

      default:
        fieldElement = (
          <input
            {...commonProps}
            type="text"
            value={fieldValue as string || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );
    }

    return (
      <div key={field.id} className="form-field">
        <label htmlFor={field.id} className="form-label">
          {field.label}
          {field.required && <span className="required">*</span>}
        </label>
        
        {field.description && (
          <p className="field-description">{field.description}</p>
        )}
        
        {fieldElement}
        
        {fieldError && (
          <div className="error-message" role="alert">
            {fieldError}
          </div>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className={`dynamic-form ${className}`}>
      {fields.map(renderField)}
      
      <button
        type="submit"
        disabled={isSubmitting || isLoading}
        className="submit-button"
      >
        {isSubmitting || isLoading ? 'Submitting...' : submitLabel}
      </button>
    </form>
  );
};

export default DynamicForm;