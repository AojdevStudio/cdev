export interface WriteOperationOptions {
  transactionId?: string;
  createBackup?: boolean;
  maxFileSize?: number;
  preventConcurrentWrites?: boolean;
  rollbackOnFailure?: boolean;
  encoding?: BufferEncoding;
}

export interface WriteOperationResult {
  success: boolean;
  transactionId: string;
  filePath?: string;
  backupPath?: string;
  error?: string;
  rollbackAvailable: boolean;
}

export interface WriteTransaction {
  id: string;
  filePath: string;
  backupPath?: string;
  timestamp: Date;
  options: WriteOperationOptions;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export interface FormValidationRule {
  field: string;
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
  validator?: (value: unknown) => boolean;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: FormValidationRule[];
  defaultValue?: unknown;
}

export interface FormConfig {
  fields: FormField[];
  submitLabel?: string;
  resetLabel?: string;
  onSubmit?: (data: Record<string, unknown>) => void | Promise<void>;
  onReset?: () => void;
  validation?: FormValidationRule[];
}