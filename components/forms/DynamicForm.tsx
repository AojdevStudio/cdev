import React from 'react';
import { FormField, FormFieldType } from '../../lib/form-validation';
import { useFormState, FormState, FormActions } from '../../hooks/useFormState';

// Props for individual form field components
interface FormFieldProps {
  field: FormField;
  value: unknown;
  error?: string;
  touched?: boolean;
  onChange: (value: unknown) => void;
  onBlur: () => void;
}

// Text input component
const TextInput: React.FC<FormFieldProps> = ({ field, value, error, touched, onChange, onBlur }) => (
  <div className="form-field">
    <label htmlFor={field.name} className="form-label">
      {field.label}
      {field.required && <span className="required">*</span>}
    </label>
    <input
      id={field.name}
      name={field.name}
      type={field.type}
      value={value as string || ''}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={`form-input ${error && touched ? 'error' : ''}`}
    />
    {error && touched && <span className="error-message">{error}</span>}
  </div>
);

// Textarea component
const TextArea: React.FC<FormFieldProps> = ({ field, value, error, touched, onChange, onBlur }) => (
  <div className="form-field">
    <label htmlFor={field.name} className="form-label">
      {field.label}
      {field.required && <span className="required">*</span>}
    </label>
    <textarea
      id={field.name}
      name={field.name}
      value={value as string || ''}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={`form-textarea ${error && touched ? 'error' : ''}`}
      rows={4}
    />
    {error && touched && <span className="error-message">{error}</span>}
  </div>
);

// Select component
const Select: React.FC<FormFieldProps> = ({ field, value, error, touched, onChange, onBlur }) => (
  <div className="form-field">
    <label htmlFor={field.name} className="form-label">
      {field.label}
      {field.required && <span className="required">*</span>}
    </label>
    <select
      id={field.name}
      name={field.name}
      value={value as string || ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={`form-select ${error && touched ? 'error' : ''}`}
    >
      <option value="">{field.placeholder || 'Select an option'}</option>
      {field.options?.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && touched && <span className="error-message">{error}</span>}
  </div>
);

// Checkbox component
const Checkbox: React.FC<FormFieldProps> = ({ field, value, error, touched, onChange, onBlur }) => (
  <div className="form-field">
    <label className="form-checkbox-label">
      <input
        id={field.name}
        name={field.name}
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
        onBlur={onBlur}
        className="form-checkbox"
      />
      <span className="checkbox-text">
        {field.label}
        {field.required && <span className="required">*</span>}
      </span>
    </label>
    {error && touched && <span className="error-message">{error}</span>}
  </div>
);

// Number input component
const NumberInput: React.FC<FormFieldProps> = ({ field, value, error, touched, onChange, onBlur }) => (
  <div className="form-field">
    <label htmlFor={field.name} className="form-label">
      {field.label}
      {field.required && <span className="required">*</span>}
    </label>
    <input
      id={field.name}
      name={field.name}
      type="number"
      value={value as number || ''}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
      onBlur={onBlur}
      className={`form-input ${error && touched ? 'error' : ''}`}
    />
    {error && touched && <span className="error-message">{error}</span>}
  </div>
);

// File input component
const FileInput: React.FC<FormFieldProps> = ({ field, value, error, touched, onChange, onBlur }) => (
  <div className="form-field">
    <label htmlFor={field.name} className="form-label">
      {field.label}
      {field.required && <span className="required">*</span>}
    </label>
    <input
      id={field.name}
      name={field.name}
      type="file"
      onChange={(e) => onChange(e.target.files?.[0] || null)}
      onBlur={onBlur}
      className={`form-input ${error && touched ? 'error' : ''}`}
    />
    {error && touched && <span className="error-message">{error}</span>}
  </div>
);

// Field type mapping
const fieldComponents: Record<FormFieldType, React.FC<FormFieldProps>> = {
  text: TextInput,
  email: TextInput,
  password: TextInput,
  textarea: TextArea,
  select: Select,
  checkbox: Checkbox,
  number: NumberInput,
  file: FileInput,
};

// Dynamic form component props
export interface DynamicFormProps {
  fields: FormField[];
  onSubmit?: (values: Record<string, unknown>) => Promise<void> | void;
  onValidationChange?: (isValid: boolean) => void;
  initialValues?: Record<string, unknown>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  submitButtonText?: string;
  resetButtonText?: string;
  showResetButton?: boolean;
  loading?: boolean;
  className?: string;
}

// Main dynamic form component
export const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  onSubmit,
  onValidationChange,
  initialValues,
  validateOnChange = true,
  validateOnBlur = true,
  submitButtonText = 'Submit',
  resetButtonText = 'Reset',
  showResetButton = true,
  loading = false,
  className = '',
}) => {
  const [formState, formActions] = useFormState(fields, {
    initialValues,
    validateOnChange,
    validateOnBlur,
    onSubmit,
    onValidationChange,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    formActions.submit();
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    formActions.reset();
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return formState.errors.find(error => error.field === fieldName)?.message;
  };

  const isFieldTouched = (fieldName: string): boolean => {
    return formState.touched[fieldName] || false;
  };

  return (
    <form onSubmit={handleSubmit} className={`dynamic-form ${className}`}>
      {fields.map((field) => {
        const FieldComponent = fieldComponents[field.type];
        const fieldError = getFieldError(field.name);
        const touched = isFieldTouched(field.name);

        return (
          <FieldComponent
            key={field.name}
            field={field}
            value={formState.values[field.name]}
            error={fieldError}
            touched={touched}
            onChange={(value) => formActions.setValue(field.name, value)}
            onBlur={() => formActions.touchField(field.name)}
          />
        );
      })}

      {/* Global form errors */}
      {formState.errors.some(error => error.field === 'form') && (
        <div className="form-error">
          {formState.errors
            .filter(error => error.field === 'form')
            .map((error, index) => (
              <p key={index} className="error-message">
                {error.message}
              </p>
            ))}
        </div>
      )}

      {/* Form buttons */}
      <div className="form-buttons">
        <button
          type="submit"
          disabled={formState.isSubmitting || loading}
          className={`form-button primary ${formState.isSubmitting ? 'loading' : ''}`}
        >
          {formState.isSubmitting ? 'Submitting...' : submitButtonText}
        </button>

        {showResetButton && (
          <button
            type="button"
            onClick={handleReset}
            disabled={formState.isSubmitting || loading}
            className="form-button secondary"
          >
            {resetButtonText}
          </button>
        )}
      </div>
    </form>
  );
};

// Directory validation form component
export interface DirectoryValidationFormProps {
  initialPath?: string;
  initialName?: string;
  onValidDirectory?: (path: string, name: string, createIfMissing: boolean) => void;
  className?: string;
}

export const DirectoryValidationForm: React.FC<DirectoryValidationFormProps> = ({
  initialPath = '',
  initialName = '',
  onValidDirectory,
  className = '',
}) => {
  const directoryFields: FormField[] = [
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
      label: 'Create directory if it does not exist',
      type: 'checkbox',
      defaultValue: false,
    },
  ];

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (onValidDirectory) {
      onValidDirectory(
        values.path as string,
        values.name as string,
        values.createIfMissing as boolean
      );
    }
  };

  return (
    <DynamicForm
      fields={directoryFields}
      onSubmit={handleSubmit}
      initialValues={{
        path: initialPath,
        name: initialName,
        createIfMissing: false,
      }}
      submitButtonText="Validate Directory"
      className={`directory-validation-form ${className}`}
    />
  );
};

// Export types
export type { DynamicFormProps, DirectoryValidationFormProps };
export { DynamicForm, DirectoryValidationForm };