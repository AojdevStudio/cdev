import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { DynamicForm } from '../../components/forms/DynamicForm';
import { FormConfig } from '../../lib/types/write-types';

// Mock the hooks
jest.mock('../../hooks/useFormState', () => ({
  useFormState: jest.fn()
}));

jest.mock('../../lib/form-validation', () => ({
  validateForm: jest.fn()
}));

import { useFormState } from '../../hooks/useFormState';
import { validateForm } from '../../lib/form-validation';

const mockUseFormState = useFormState as jest.MockedFunction<typeof useFormState>;
const mockValidateForm = validateForm as jest.MockedFunction<typeof validateForm>;

describe('DynamicForm', () => {
  let mockFormState: any;
  let mockConfig: FormConfig;

  beforeEach(() => {
    mockFormState = {
      formData: {},
      errors: {},
      touched: {},
      isSubmitting: false,
      updateField: jest.fn(),
      validateField: jest.fn(),
      resetForm: jest.fn(),
      setSubmitting: jest.fn()
    };

    mockConfig = {
      fields: [
        {
          name: 'name',
          label: 'Name',
          type: 'text',
          required: true
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true
        }
      ],
      submitLabel: 'Submit',
      resetLabel: 'Reset'
    };

    mockUseFormState.mockReturnValue(mockFormState);
    mockValidateForm.mockReturnValue({
      isValid: true,
      errors: {}
    });
  });

  describe('Form Rendering', () => {
    it('should render form with all fields', () => {
      render(<DynamicForm config={mockConfig} />);

      expect(screen.getByLabelText('Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Email *')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    });

    it('should render different field types correctly', () => {
      const configWithVariousFields: FormConfig = {
        fields: [
          { name: 'text', label: 'Text Field', type: 'text' },
          { name: 'email', label: 'Email Field', type: 'email' },
          { name: 'password', label: 'Password Field', type: 'password' },
          { name: 'textarea', label: 'Textarea Field', type: 'textarea' },
          { name: 'select', label: 'Select Field', type: 'select', options: [
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' }
          ]},
          { name: 'checkbox', label: 'Checkbox Field', type: 'checkbox' },
          { name: 'radio', label: 'Radio Field', type: 'radio', options: [
            { value: 'radio1', label: 'Radio 1' },
            { value: 'radio2', label: 'Radio 2' }
          ]}
        ]
      };

      render(<DynamicForm config={configWithVariousFields} />);

      expect(screen.getByLabelText('Text Field')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Field')).toBeInTheDocument();
      expect(screen.getByLabelText('Password Field')).toBeInTheDocument();
      expect(screen.getByLabelText('Textarea Field')).toBeInTheDocument();
      expect(screen.getByLabelText('Select Field')).toBeInTheDocument();
      expect(screen.getByLabelText('Checkbox Field')).toBeInTheDocument();
      expect(screen.getByLabelText('Radio Field')).toBeInTheDocument();
    });

    it('should show required asterisk for required fields', () => {
      render(<DynamicForm config={mockConfig} />);

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should show field errors', () => {
      mockFormState.errors = {
        name: 'Name is required',
        email: 'Email is invalid'
      };

      render(<DynamicForm config={mockConfig} />);

      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is invalid')).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should update field values when user types', () => {
      render(<DynamicForm config={mockConfig} />);

      const nameInput = screen.getByLabelText('Name *');
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });

      expect(mockFormState.updateField).toHaveBeenCalledWith('name', 'John Doe');
    });

    it('should validate field on blur', () => {
      render(<DynamicForm config={mockConfig} />);

      const nameInput = screen.getByLabelText('Name *');
      fireEvent.blur(nameInput);

      expect(mockFormState.validateField).toHaveBeenCalledWith('name');
    });

    it('should handle checkbox changes', () => {
      const configWithCheckbox: FormConfig = {
        fields: [
          { name: 'agree', label: 'I agree', type: 'checkbox' }
        ]
      };

      render(<DynamicForm config={configWithCheckbox} />);

      const checkbox = screen.getByLabelText('I agree');
      fireEvent.click(checkbox);

      expect(mockFormState.updateField).toHaveBeenCalledWith('agree', true);
    });

    it('should handle select changes', () => {
      const configWithSelect: FormConfig = {
        fields: [
          { 
            name: 'category', 
            label: 'Category', 
            type: 'select',
            options: [
              { value: 'cat1', label: 'Category 1' },
              { value: 'cat2', label: 'Category 2' }
            ]
          }
        ]
      };

      render(<DynamicForm config={configWithSelect} />);

      const select = screen.getByLabelText('Category');
      fireEvent.change(select, { target: { value: 'cat1' } });

      expect(mockFormState.updateField).toHaveBeenCalledWith('category', 'cat1');
    });

    it('should handle radio button changes', () => {
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

      render(<DynamicForm config={configWithRadio} />);

      const maleRadio = screen.getByLabelText('Male');
      fireEvent.click(maleRadio);

      expect(mockFormState.updateField).toHaveBeenCalledWith('gender', 'male');
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit when form is submitted', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      mockFormState.formData = { name: 'John', email: 'john@example.com' };

      render(<DynamicForm config={mockConfig} onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({ name: 'John', email: 'john@example.com' });
      });
    });

    it('should call config.onSubmit when form is submitted', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      const configWithOnSubmit = {
        ...mockConfig,
        onSubmit: mockOnSubmit
      };

      render(<DynamicForm config={configWithOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should not submit if form is invalid', async () => {
      const mockOnSubmit = jest.fn();
      mockValidateForm.mockReturnValue({
        isValid: false,
        errors: { name: 'Name is required' }
      });

      render(<DynamicForm config={mockConfig} onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should disable submit button when form is invalid', () => {
      mockValidateForm.mockReturnValue({
        isValid: false,
        errors: { name: 'Name is required' }
      });

      render(<DynamicForm config={mockConfig} />);

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      expect(submitButton).toBeDisabled();
    });

    it('should show submitting state', () => {
      mockFormState.isSubmitting = true;

      render(<DynamicForm config={mockConfig} />);

      const submitButton = screen.getByRole('button', { name: 'Submitting...' });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Reset', () => {
    it('should reset form when reset button is clicked', () => {
      render(<DynamicForm config={mockConfig} />);

      const resetButton = screen.getByRole('button', { name: 'Reset' });
      fireEvent.click(resetButton);

      expect(mockFormState.resetForm).toHaveBeenCalled();
    });

    it('should call config.onReset when reset button is clicked', () => {
      const mockOnReset = jest.fn();
      const configWithOnReset = {
        ...mockConfig,
        onReset: mockOnReset
      };

      render(<DynamicForm config={configWithOnReset} />);

      const resetButton = screen.getByRole('button', { name: 'Reset' });
      fireEvent.click(resetButton);

      expect(mockOnReset).toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    it('should call onValidationChange when validation changes', () => {
      const mockOnValidationChange = jest.fn();
      mockValidateForm.mockReturnValue({
        isValid: false,
        errors: { name: 'Name is required' }
      });

      render(<DynamicForm config={mockConfig} onValidationChange={mockOnValidationChange} />);

      expect(mockOnValidationChange).toHaveBeenCalledWith(false, { name: 'Name is required' });
    });

    it('should show validation errors with proper accessibility attributes', () => {
      mockFormState.errors = { name: 'Name is required' };

      render(<DynamicForm config={mockConfig} />);

      const nameInput = screen.getByLabelText('Name *');
      const errorDiv = screen.getByText('Name is required');

      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      expect(nameInput).toHaveAttribute('aria-describedby', 'name-error');
      expect(errorDiv).toHaveAttribute('id', 'name-error');
      expect(errorDiv).toHaveAttribute('role', 'alert');
    });
  });

  describe('Form Disabled State', () => {
    it('should disable all inputs when disabled prop is true', () => {
      render(<DynamicForm config={mockConfig} disabled={true} />);

      const nameInput = screen.getByLabelText('Name *');
      const emailInput = screen.getByLabelText('Email *');
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      const resetButton = screen.getByRole('button', { name: 'Reset' });

      expect(nameInput).toBeDisabled();
      expect(emailInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(resetButton).toBeDisabled();
    });

    it('should disable all inputs when form is submitting', () => {
      mockFormState.isSubmitting = true;

      render(<DynamicForm config={mockConfig} />);

      const nameInput = screen.getByLabelText('Name *');
      const emailInput = screen.getByLabelText('Email *');

      expect(nameInput).toBeDisabled();
      expect(emailInput).toBeDisabled();
    });
  });
});