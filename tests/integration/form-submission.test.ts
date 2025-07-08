import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useFormState } from '../../hooks/useFormState';
import { validateForm } from '../../lib/form-validation';
import { FormConfig } from '../../lib/types/write-types';

describe('Form Submission Integration', () => {
  let formConfig: FormConfig;

  beforeEach(() => {
    formConfig = {
      fields: [
        {
          name: 'name',
          label: 'Name',
          type: 'text',
          required: true,
          validation: [
            { field: 'name', type: 'required', message: 'Name is required' },
            { field: 'name', type: 'minLength', value: 2, message: 'Name must be at least 2 characters' }
          ]
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
          validation: [
            { field: 'email', type: 'required', message: 'Email is required' },
            { field: 'email', type: 'pattern', value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' }
          ]
        },
        {
          name: 'age',
          label: 'Age',
          type: 'number',
          validation: [
            { 
              field: 'age', 
              type: 'custom', 
              validator: (value) => {
                const age = Number(value);
                return age >= 18 && age <= 100;
              },
              message: 'Age must be between 18 and 100' 
            }
          ]
        },
        {
          name: 'agree',
          label: 'I agree to terms',
          type: 'checkbox',
          required: true,
          validation: [
            { 
              field: 'agree', 
              type: 'custom', 
              validator: (value) => value === true,
              message: 'You must agree to the terms' 
            }
          ]
        }
      ],
      submitLabel: 'Submit Form',
      resetLabel: 'Reset Form'
    };
  });

  describe('Form State Management', () => {
    it('should initialize form with default values', () => {
      const { result } = renderHook(() => useFormState(formConfig));

      expect(result.current.formData).toEqual({
        name: '',
        email: '',
        age: 0,
        agree: false
      });
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.isDirty).toBe(false);
    });

    it('should update field values', () => {
      const { result } = renderHook(() => useFormState(formConfig));

      act(() => {
        result.current.updateField('name', 'John Doe');
      });

      expect(result.current.formData.name).toBe('John Doe');
      expect(result.current.isDirty).toBe(true);
      expect(result.current.touched.name).toBe(true);
    });

    it('should validate individual fields', () => {
      const { result } = renderHook(() => useFormState(formConfig));

      act(() => {
        result.current.updateField('name', '');
      });

      act(() => {
        result.current.validateField('name');
      });

      expect(result.current.errors.name).toBe('Name is required');
    });

    it('should validate all fields', () => {
      const { result } = renderHook(() => useFormState(formConfig));

      act(() => {
        result.current.updateField('name', 'J');
        result.current.updateField('email', 'invalid-email');
        result.current.updateField('age', 150);
      });

      act(() => {
        const isValid = result.current.validateForm();
        expect(isValid).toBe(false);
      });

      expect(result.current.errors.name).toBe('Name must be at least 2 characters');
      expect(result.current.errors.email).toBe('Invalid email format');
      expect(result.current.errors.age).toBe('Age must be between 18 and 100');
    });

    it('should reset form to initial state', () => {
      const { result } = renderHook(() => useFormState(formConfig));

      act(() => {
        result.current.updateField('name', 'John Doe');
        result.current.updateField('email', 'john@example.com');
        result.current.setFieldError('name', 'Some error');
      });

      expect(result.current.isDirty).toBe(true);
      expect(result.current.formData.name).toBe('John Doe');
      expect(result.current.errors.name).toBe('Some error');

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.isDirty).toBe(false);
      expect(result.current.formData.name).toBe('');
      expect(result.current.errors.name).toBe('');
    });
  });

  describe('Form Validation Integration', () => {
    it('should validate complete form with all field types', () => {
      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
        agree: true
      };

      const allRules = formConfig.fields.flatMap(field => field.validation || []);
      const result = validateForm(formData, allRules);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should handle validation errors for all field types', () => {
      const formData = {
        name: '',
        email: 'invalid-email',
        age: 150,
        agree: false
      };

      const allRules = formConfig.fields.flatMap(field => field.validation || []);
      const result = validateForm(formData, allRules);

      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('Name is required');
      expect(result.errors.email).toBe('Invalid email format');
      expect(result.errors.age).toBe('Age must be between 18 and 100');
      expect(result.errors.agree).toBe('You must agree to the terms');
    });

    it('should handle cross-field validation', () => {
      const formData = {
        password: 'secret123',
        confirmPassword: 'different123',
        email: 'john@example.com'
      };

      const result = validateForm(formData, []);
      expect(result.isValid).toBe(false);
      expect(result.errors.confirmPassword).toBe('Passwords do not match');
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
  });

  describe('Form Submission Flow', () => {
    it('should handle successful form submission', async () => {
      const { result } = renderHook(() => useFormState(formConfig));

      // Fill form with valid data
      act(() => {
        result.current.updateField('name', 'John Doe');
        result.current.updateField('email', 'john@example.com');
        result.current.updateField('age', 25);
        result.current.updateField('agree', true);
      });

      // Validate form
      act(() => {
        const isValid = result.current.validateForm();
        expect(isValid).toBe(true);
      });

      // Simulate submission
      act(() => {
        result.current.setSubmitting(true);
      });

      expect(result.current.isSubmitting).toBe(true);

      // Complete submission
      act(() => {
        result.current.setSubmitting(false);
      });

      expect(result.current.isSubmitting).toBe(false);
    });

    it('should handle form submission errors', async () => {
      const { result } = renderHook(() => useFormState(formConfig));

      // Fill form with invalid data
      act(() => {
        result.current.updateField('name', '');
        result.current.updateField('email', 'invalid-email');
      });

      // Validate form
      act(() => {
        const isValid = result.current.validateForm();
        expect(isValid).toBe(false);
      });

      // Should not submit if invalid
      expect(result.current.isValid).toBe(false);
    });

    it('should handle server-side validation errors', () => {
      const { result } = renderHook(() => useFormState(formConfig));

      // Simulate server-side validation error
      act(() => {
        result.current.setFieldError('email', 'This email is already registered');
      });

      expect(result.current.errors.email).toBe('This email is already registered');
      expect(result.current.isValid).toBe(false);
    });

    it('should clear specific field errors', () => {
      const { result } = renderHook(() => useFormState(formConfig));

      // Set error
      act(() => {
        result.current.setFieldError('email', 'Some error');
      });

      expect(result.current.errors.email).toBe('Some error');

      // Clear error
      act(() => {
        result.current.clearFieldError('email');
      });

      expect(result.current.errors.email).toBe('');
    });
  });

  describe('Field Value Management', () => {
    it('should get and set field values', () => {
      const { result } = renderHook(() => useFormState(formConfig));

      act(() => {
        result.current.setFieldValue('name', 'Jane Doe');
      });

      expect(result.current.getFieldValue('name')).toBe('Jane Doe');
      expect(result.current.isDirty).toBe(true);
    });

    it('should handle different field types', () => {
      const { result } = renderHook(() => useFormState(formConfig));

      act(() => {
        result.current.setFieldValue('name', 'John');
        result.current.setFieldValue('email', 'john@example.com');
        result.current.setFieldValue('age', 30);
        result.current.setFieldValue('agree', true);
      });

      expect(result.current.getFieldValue('name')).toBe('John');
      expect(result.current.getFieldValue('email')).toBe('john@example.com');
      expect(result.current.getFieldValue('age')).toBe(30);
      expect(result.current.getFieldValue('agree')).toBe(true);
    });
  });

  describe('Form Configuration', () => {
    it('should handle form with default values', () => {
      const configWithDefaults: FormConfig = {
        fields: [
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            defaultValue: 'Default Name'
          },
          {
            name: 'age',
            label: 'Age',
            type: 'number',
            defaultValue: 25
          },
          {
            name: 'subscribe',
            label: 'Subscribe',
            type: 'checkbox',
            defaultValue: true
          }
        ]
      };

      const { result } = renderHook(() => useFormState(configWithDefaults));

      expect(result.current.formData).toEqual({
        name: 'Default Name',
        age: 25,
        subscribe: true
      });
    });

    it('should handle select field with options', () => {
      const configWithSelect: FormConfig = {
        fields: [
          {
            name: 'category',
            label: 'Category',
            type: 'select',
            options: [
              { value: 'cat1', label: 'Category 1' },
              { value: 'cat2', label: 'Category 2' }
            ],
            defaultValue: 'cat1'
          }
        ]
      };

      const { result } = renderHook(() => useFormState(configWithSelect));

      expect(result.current.formData.category).toBe('cat1');

      act(() => {
        result.current.updateField('category', 'cat2');
      });

      expect(result.current.formData.category).toBe('cat2');
    });

    it('should handle radio field with options', () => {
      const configWithRadio: FormConfig = {
        fields: [
          {
            name: 'gender',
            label: 'Gender',
            type: 'radio',
            options: [
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' }
            ]
          }
        ]
      };

      const { result } = renderHook(() => useFormState(configWithRadio));

      expect(result.current.formData.gender).toBe('');

      act(() => {
        result.current.updateField('gender', 'female');
      });

      expect(result.current.formData.gender).toBe('female');
    });
  });
});