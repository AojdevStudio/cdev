import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DynamicForm, DirectoryValidationForm } from '../components/forms/DynamicForm';
import { useFormState } from '../hooks/useFormState';
import { FormField } from '../lib/form-validation';

// Mock external dependencies
jest.mock('../lib/form-validation', () => ({
  ...jest.requireActual('../lib/form-validation'),
  // Mock any external validation calls if needed
}));

describe('Form Submission Integration', () => {
  describe('DynamicForm submission flow', () => {
    const loginFields: FormField[] = [
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        placeholder: 'Enter your email',
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        required: true,
        placeholder: 'Enter your password',
      },
      {
        name: 'rememberMe',
        label: 'Remember me',
        type: 'checkbox',
        defaultValue: false,
      },
    ];

    it('successfully submits valid form data', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn().mockResolvedValue(undefined);
      const mockValidationChange = jest.fn();

      render(
        <DynamicForm
          fields={loginFields}
          onSubmit={mockSubmit}
          onValidationChange={mockValidationChange}
        />
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(rememberMeCheckbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          rememberMe: true,
        });
      });

      // Check that validation change was called
      expect(mockValidationChange).toHaveBeenCalledWith(true);
    });

    it('prevents submission with invalid data', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn();

      render(
        <DynamicForm
          fields={loginFields}
          onSubmit={mockSubmit}
        />
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'short');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });

      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('handles submission errors gracefully', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn().mockRejectedValue(new Error('Server error'));

      render(
        <DynamicForm
          fields={loginFields}
          onSubmit={mockSubmit}
        />
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/server error/i)).toBeInTheDocument();
      });

      expect(mockSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false,
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <DynamicForm
          fields={loginFields}
          onSubmit={mockSubmit}
        />
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(screen.getByText(/submitting/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByText(/submit/i)).toBeInTheDocument();
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('prevents multiple simultaneous submissions', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <DynamicForm
          fields={loginFields}
          onSubmit={mockSubmit}
        />
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      // Click submit multiple times quickly
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/submit/i)).toBeInTheDocument();
      });

      // Should only be called once
      expect(mockSubmit).toHaveBeenCalledTimes(1);
    });

    it('resets form after successful submission', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn().mockResolvedValue(undefined);

      render(
        <DynamicForm
          fields={loginFields}
          onSubmit={mockSubmit}
          showResetButton={true}
        />
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const resetButton = screen.getByRole('button', { name: /reset/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(resetButton);

      expect(emailInput).toHaveValue('');
      expect(passwordInput).toHaveValue('');
    });
  });

  describe('DirectoryValidationForm submission flow', () => {
    it('successfully validates and submits directory information', async () => {
      const user = userEvent.setup();
      const mockOnValidDirectory = jest.fn();

      render(
        <DirectoryValidationForm
          onValidDirectory={mockOnValidDirectory}
        />
      );

      const pathInput = screen.getByLabelText(/directory path/i);
      const nameInput = screen.getByLabelText(/directory name/i);
      const createCheckbox = screen.getByLabelText(/create directory if it does not exist/i);
      const submitButton = screen.getByRole('button', { name: /validate directory/i });

      await user.type(pathInput, 'src/components');
      await user.type(nameInput, 'forms');
      await user.click(createCheckbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnValidDirectory).toHaveBeenCalledWith('src/components', 'forms', true);
      });
    });

    it('prevents submission with invalid directory path', async () => {
      const user = userEvent.setup();
      const mockOnValidDirectory = jest.fn();

      render(
        <DirectoryValidationForm
          onValidDirectory={mockOnValidDirectory}
        />
      );

      const pathInput = screen.getByLabelText(/directory path/i);
      const nameInput = screen.getByLabelText(/directory name/i);
      const submitButton = screen.getByRole('button', { name: /validate directory/i });

      await user.type(pathInput, '../invalid/path');
      await user.type(nameInput, 'forms');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/directory path must be relative/i)).toBeInTheDocument();
      });

      expect(mockOnValidDirectory).not.toHaveBeenCalled();
    });

    it('prevents submission with invalid directory name', async () => {
      const user = userEvent.setup();
      const mockOnValidDirectory = jest.fn();

      render(
        <DirectoryValidationForm
          onValidDirectory={mockOnValidDirectory}
        />
      );

      const pathInput = screen.getByLabelText(/directory path/i);
      const nameInput = screen.getByLabelText(/directory name/i);
      const submitButton = screen.getByRole('button', { name: /validate directory/i });

      await user.type(pathInput, 'src/components');
      await user.type(nameInput, 'invalid name!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/directory name must contain only letters/i)).toBeInTheDocument();
      });

      expect(mockOnValidDirectory).not.toHaveBeenCalled();
    });

    it('handles empty required fields', async () => {
      const user = userEvent.setup();
      const mockOnValidDirectory = jest.fn();

      render(
        <DirectoryValidationForm
          onValidDirectory={mockOnValidDirectory}
        />
      );

      const submitButton = screen.getByRole('button', { name: /validate directory/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/directory path is required/i)).toBeInTheDocument();
        expect(screen.getByText(/directory name is required/i)).toBeInTheDocument();
      });

      expect(mockOnValidDirectory).not.toHaveBeenCalled();
    });

    it('pre-fills form with initial values', async () => {
      const user = userEvent.setup();
      const mockOnValidDirectory = jest.fn();

      render(
        <DirectoryValidationForm
          initialPath="src/components"
          initialName="forms"
          onValidDirectory={mockOnValidDirectory}
        />
      );

      const pathInput = screen.getByDisplayValue('src/components');
      const nameInput = screen.getByDisplayValue('forms');
      const submitButton = screen.getByRole('button', { name: /validate directory/i });

      expect(pathInput).toBeInTheDocument();
      expect(nameInput).toBeInTheDocument();

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnValidDirectory).toHaveBeenCalledWith('src/components', 'forms', false);
      });
    });
  });

  describe('Form state integration', () => {
    it('validates form state updates correctly', async () => {
      const user = userEvent.setup();
      const mockValidationChange = jest.fn();

      render(
        <DynamicForm
          fields={[
            { name: 'email', label: 'Email', type: 'email', required: true },
          ]}
          onValidationChange={mockValidationChange}
          validateOnChange={true}
        />
      );

      const emailInput = screen.getByLabelText(/email/i);

      // Initially invalid (empty)
      expect(mockValidationChange).toHaveBeenCalledWith(false);

      await user.type(emailInput, 'test@example.com');

      // Should become valid
      await waitFor(() => {
        expect(mockValidationChange).toHaveBeenCalledWith(true);
      });

      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');

      // Should become invalid again
      await waitFor(() => {
        expect(mockValidationChange).toHaveBeenCalledWith(false);
      });
    });

    it('handles form field touching correctly', async () => {
      const user = userEvent.setup();

      render(
        <DynamicForm
          fields={[
            { name: 'email', label: 'Email', type: 'email', required: true },
          ]}
          validateOnBlur={true}
        />
      );

      const emailInput = screen.getByLabelText(/email/i);

      // Error should not show initially
      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();

      await user.click(emailInput);
      await user.tab(); // Trigger blur

      // Error should show after blur
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('handles complex form interactions', async () => {
      const user = userEvent.setup();
      const mockSubmit = jest.fn().mockResolvedValue(undefined);

      const complexFields: FormField[] = [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'age', label: 'Age', type: 'number', required: false },
        { name: 'bio', label: 'Bio', type: 'textarea', required: false },
        { name: 'country', label: 'Country', type: 'select', required: true, options: [
          { value: 'us', label: 'United States' },
          { value: 'ca', label: 'Canada' },
        ]},
        { name: 'terms', label: 'Accept Terms', type: 'checkbox', required: true },
      ];

      render(
        <DynamicForm
          fields={complexFields}
          onSubmit={mockSubmit}
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const ageInput = screen.getByLabelText(/age/i);
      const bioInput = screen.getByLabelText(/bio/i);
      const countrySelect = screen.getByLabelText(/country/i);
      const termsCheckbox = screen.getByLabelText(/accept terms/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(ageInput, '30');
      await user.type(bioInput, 'Software developer');
      await user.selectOptions(countrySelect, 'us');
      await user.click(termsCheckbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          age: 30,
          bio: 'Software developer',
          country: 'us',
          terms: true,
        });
      });
    });
  });
});