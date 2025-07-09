import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DynamicForm, DirectoryValidationForm } from './forms/DynamicForm';
import { FormField } from '../lib/form-validation';

// Mock styles to avoid CSS module issues in tests
jest.mock('./forms/DynamicForm.module.css', () => ({}));

describe('DynamicForm', () => {
  const mockFields: FormField[] = [
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
      name: 'newsletter',
      label: 'Subscribe to newsletter',
      type: 'checkbox',
      defaultValue: false,
    },
  ];

  it('renders all form fields correctly', () => {
    render(<DynamicForm fields={mockFields} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subscribe to newsletter/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('shows required indicators for required fields', () => {
    render(<DynamicForm fields={mockFields} />);

    const emailLabel = screen.getByText('Email');
    const passwordLabel = screen.getByText('Password');
    const newsletterLabel = screen.getByText('Subscribe to newsletter');

    expect(emailLabel.parentElement).toHaveTextContent('*');
    expect(passwordLabel.parentElement).toHaveTextContent('*');
    expect(newsletterLabel.parentElement).not.toHaveTextContent('*');
  });

  it('handles form input changes correctly', async () => {
    const user = userEvent.setup();
    render(<DynamicForm fields={mockFields} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const checkboxInput = screen.getByLabelText(/subscribe to newsletter/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(checkboxInput);

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
    expect(checkboxInput).toBeChecked();
  });

  it('displays validation errors on blur', async () => {
    const user = userEvent.setup();
    render(<DynamicForm fields={mockFields} validateOnBlur={true} />);

    const emailInput = screen.getByLabelText(/email/i);
    
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('validates required fields on submit', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn();
    render(<DynamicForm fields={mockFields} onSubmit={mockSubmit} />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument();
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  it('calls onSubmit with valid data when form is valid', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn();
    render(<DynamicForm fields={mockFields} onSubmit={mockSubmit} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        newsletter: false,
      });
    });
  });

  it('resets form when reset button is clicked', async () => {
    const user = userEvent.setup();
    render(<DynamicForm fields={mockFields} showResetButton={true} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const resetButton = screen.getByRole('button', { name: /reset/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(resetButton);

    expect(emailInput).toHaveValue('');
    expect(passwordInput).toHaveValue('');
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<DynamicForm fields={mockFields} onSubmit={mockSubmit} />);

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

  it('handles select field options correctly', async () => {
    const user = userEvent.setup();
    const selectFields: FormField[] = [
      {
        name: 'country',
        label: 'Country',
        type: 'select',
        required: true,
        options: [
          { value: 'us', label: 'United States' },
          { value: 'ca', label: 'Canada' },
          { value: 'uk', label: 'United Kingdom' },
        ],
      },
    ];

    render(<DynamicForm fields={selectFields} />);

    const selectInput = screen.getByLabelText(/country/i);
    await user.selectOptions(selectInput, 'ca');

    expect(selectInput).toHaveValue('ca');
    expect(screen.getByText('Canada')).toBeInTheDocument();
  });

  it('handles number input correctly', async () => {
    const user = userEvent.setup();
    const numberFields: FormField[] = [
      {
        name: 'age',
        label: 'Age',
        type: 'number',
        required: true,
      },
    ];

    render(<DynamicForm fields={numberFields} />);

    const numberInput = screen.getByLabelText(/age/i);
    await user.type(numberInput, '25');

    expect(numberInput).toHaveValue(25);
  });

  it('handles textarea input correctly', async () => {
    const user = userEvent.setup();
    const textareaFields: FormField[] = [
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        placeholder: 'Enter description',
      },
    ];

    render(<DynamicForm fields={textareaFields} />);

    const textareaInput = screen.getByLabelText(/description/i);
    await user.type(textareaInput, 'This is a test description');

    expect(textareaInput).toHaveValue('This is a test description');
  });
});

describe('DirectoryValidationForm', () => {
  it('renders directory validation form correctly', () => {
    render(<DirectoryValidationForm />);

    expect(screen.getByLabelText(/directory path/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/directory name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/create directory if it does not exist/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /validate directory/i })).toBeInTheDocument();
  });

  it('accepts initial values', () => {
    render(
      <DirectoryValidationForm
        initialPath="src/components"
        initialName="forms"
      />
    );

    expect(screen.getByDisplayValue('src/components')).toBeInTheDocument();
    expect(screen.getByDisplayValue('forms')).toBeInTheDocument();
  });

  it('validates directory path format', async () => {
    const user = userEvent.setup();
    render(<DirectoryValidationForm />);

    const pathInput = screen.getByLabelText(/directory path/i);
    await user.type(pathInput, '../invalid/path');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/directory path must be relative/i)).toBeInTheDocument();
    });
  });

  it('validates directory name format', async () => {
    const user = userEvent.setup();
    render(<DirectoryValidationForm />);

    const nameInput = screen.getByLabelText(/directory name/i);
    await user.type(nameInput, 'invalid name!');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/directory name must contain only letters/i)).toBeInTheDocument();
    });
  });

  it('calls onValidDirectory with correct parameters', async () => {
    const user = userEvent.setup();
    const mockOnValidDirectory = jest.fn();
    render(<DirectoryValidationForm onValidDirectory={mockOnValidDirectory} />);

    const pathInput = screen.getByLabelText(/directory path/i);
    const nameInput = screen.getByLabelText(/directory name/i);
    const checkboxInput = screen.getByLabelText(/create directory if it does not exist/i);
    const submitButton = screen.getByRole('button', { name: /validate directory/i });

    await user.type(pathInput, 'src/components');
    await user.type(nameInput, 'forms');
    await user.click(checkboxInput);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnValidDirectory).toHaveBeenCalledWith('src/components', 'forms', true);
    });
  });

  it('requires both path and name fields', async () => {
    const user = userEvent.setup();
    const mockOnValidDirectory = jest.fn();
    render(<DirectoryValidationForm onValidDirectory={mockOnValidDirectory} />);

    const submitButton = screen.getByRole('button', { name: /validate directory/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/directory path is required/i)).toBeInTheDocument();
      expect(screen.getByText(/directory name is required/i)).toBeInTheDocument();
      expect(mockOnValidDirectory).not.toHaveBeenCalled();
    });
  });

  it('handles checkbox state correctly', async () => {
    const user = userEvent.setup();
    render(<DirectoryValidationForm />);

    const checkboxInput = screen.getByLabelText(/create directory if it does not exist/i);
    
    expect(checkboxInput).not.toBeChecked();
    
    await user.click(checkboxInput);
    expect(checkboxInput).toBeChecked();
    
    await user.click(checkboxInput);
    expect(checkboxInput).not.toBeChecked();
  });
});