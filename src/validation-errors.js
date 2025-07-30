/**
 * Validation Error System
 *
 * Provides a comprehensive error handling system for data validation in the CDEV framework.
 * This module defines a hierarchy of specialized error classes that enable precise error
 * reporting, debugging, and user-friendly error messages throughout the application.
 *
 * Error Class Hierarchy:
 * - ValidationError: Base class for all validation errors
 * - RequiredFieldError: For missing required fields
 * - TypeValidationError: For incorrect data types
 * - FormatValidationError: For format/pattern mismatches (regex, date formats, etc.)
 * - RangeValidationError: For values outside acceptable ranges
 * - ValidationErrorCollection: Container for managing multiple validation errors
 *
 * Key Features:
 * - Structured error information with field names, error codes, and timestamps
 * - Hierarchical error classification for specific error handling
 * - Collection management for batch validation scenarios
 * - JSON serialization support for API responses and logging
 * - Field-specific error filtering for targeted error display
 *
 * Usage Context:
 * This error system is used throughout CDEV for:
 * - Configuration file validation during installation
 * - Linear API response validation
 * - User input validation in CLI commands
 * - Git worktree configuration validation
 * - Project structure validation
 */

/**
 * Base Validation Error Class
 *
 * The foundation class for all validation errors in the CDEV system. Provides
 * common error properties and behavior that all specific validation errors inherit.
 *
 * Standard Error Properties:
 * - message: Human-readable error description
 * - field: Name of the field that failed validation (optional)
 * - code: Machine-readable error code for programmatic handling (optional)
 * - timestamp: ISO timestamp when the error occurred
 *
 * This base class enables consistent error handling patterns throughout the
 * application and provides a foundation for more specific error types.
 *
 * @extends Error - JavaScript's built-in Error class
 */
class ValidationError extends Error {
  /**
   * Create a validation error
   *
   * @param {string} message - Human-readable error description
   * @param {string|null} field - Name of the field that failed validation
   * @param {string|null} code - Machine-readable error code for programmatic handling
   */
  constructor(message, field = null, code = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field; // Field name for targeted error display
    this.code = code; // Error code for programmatic error handling
    this.timestamp = new Date().toISOString(); // ISO timestamp for debugging and logging
  }
}

/**
 * Required Field Validation Error
 *
 * Specialized error class for handling missing required fields in data validation.
 * This error type is commonly used during configuration validation, API request
 * validation, and user input processing where certain fields are mandatory.
 *
 * Use Cases:
 * - Missing project name during CDEV initialization
 * - Missing Linear API key when Linear integration is required
 * - Missing target directory in installation commands
 * - Missing issue ID in workflow commands
 *
 * @extends ValidationError - Inherits base validation error functionality
 */
class RequiredFieldError extends ValidationError {
  /**
   * Create a required field error
   *
   * @param {string} field - Name of the required field that is missing
   */
  constructor(field) {
    super(`Field '${field}' is required`, field, 'REQUIRED_FIELD');
    this.name = 'RequiredFieldError';
  }
}

/**
 * Type Validation Error
 *
 * Specialized error class for handling incorrect data types in validation.
 * This error occurs when a field receives data of the wrong type, such as
 * receiving a string when a number is expected, or an object when an array is required.
 *
 * Use Cases:
 * - Configuration files with incorrect data types (string vs number)
 * - API responses with unexpected data types
 * - CLI arguments that don't match expected types
 * - JSON parsing results with type mismatches
 *
 * Additional Properties:
 * - expectedType: The data type that was expected
 * - actualType: The data type that was actually received
 *
 * @extends ValidationError - Inherits base validation error functionality
 */
class TypeValidationError extends ValidationError {
  /**
   * Create a type validation error
   *
   * @param {string} field - Name of the field with incorrect type
   * @param {string} expectedType - The data type that was expected (e.g., 'string', 'number', 'object')
   * @param {string} actualType - The data type that was actually received
   */
  constructor(field, expectedType, actualType) {
    super(
      `Field '${field}' must be of type '${expectedType}', got '${actualType}'`,
      field,
      'TYPE_MISMATCH',
    );
    this.name = 'TypeValidationError';
    this.expectedType = expectedType; // For programmatic error handling and debugging
    this.actualType = actualType; // For detailed error analysis and logging
  }
}

/**
 * Format Validation Error
 *
 * Specialized error class for handling format and pattern validation failures.
 * This error occurs when data doesn't match expected patterns, regular expressions,
 * or structured formats like dates, emails, URLs, or custom identifiers.
 *
 * Use Cases:
 * - Invalid Linear issue IDs (not matching PROJ-123 pattern)
 * - Malformed Linear API keys (not starting with 'lin_api_')
 * - Invalid file paths or directory names
 * - Incorrect date/time formats in configuration
 * - Invalid JSON or YAML structure
 * - URL format validation for webhook endpoints
 *
 * Additional Properties:
 * - format: The expected format or pattern description
 * - value: The actual value that failed validation
 *
 * @extends ValidationError - Inherits base validation error functionality
 */
class FormatValidationError extends ValidationError {
  /**
   * Create a format validation error
   *
   * @param {string} field - Name of the field with invalid format
   * @param {string} format - Description of the expected format or pattern
   * @param {any} value - The actual value that failed format validation
   */
  constructor(field, format, value) {
    super(
      `Field '${field}' does not match expected format '${format}': ${value}`,
      field,
      'FORMAT_INVALID',
    );
    this.name = 'FormatValidationError';
    this.format = format; // Expected format description for debugging
    this.value = value; // Actual value for detailed error analysis
  }
}

/**
 * Range Validation Error
 *
 * Specialized error class for handling values that fall outside acceptable ranges.
 * This error occurs when numeric values, string lengths, array sizes, or other
 * measurable properties exceed defined minimum or maximum boundaries.
 *
 * Use Cases:
 * - Configuration timeout values outside reasonable ranges (1-300 seconds)
 * - String length validation (project names too short/long)
 * - Numeric parameter validation (port numbers, thread counts)
 * - Array size limits (maximum number of parallel agents)
 * - Performance threshold validation (memory limits, CPU usage)
 *
 * Additional Properties:
 * - min: The minimum acceptable value
 * - max: The maximum acceptable value
 * - value: The actual value that exceeded the range
 *
 * @extends ValidationError - Inherits base validation error functionality
 */
class RangeValidationError extends ValidationError {
  /**
   * Create a range validation error
   *
   * @param {string} field - Name of the field with value outside acceptable range
   * @param {number} min - The minimum acceptable value
   * @param {number} max - The maximum acceptable value
   * @param {number} value - The actual value that exceeded the range
   */
  constructor(field, min, max, value) {
    super(
      `Field '${field}' value '${value}' is outside allowed range [${min}, ${max}]`,
      field,
      'RANGE_INVALID',
    );
    this.name = 'RangeValidationError';
    this.min = min; // Minimum boundary for programmatic validation
    this.max = max; // Maximum boundary for programmatic validation
    this.value = value; // Actual out-of-range value for debugging
  }
}

/**
 * Validation Error Collection
 *
 * A container class for managing multiple validation errors that occur during
 * batch validation processes. This class provides methods for collecting,
 * organizing, and reporting validation errors in a structured way.
 *
 * Key Features:
 * - Collects multiple validation errors from different sources
 * - Provides field-specific error filtering for targeted error display
 * - Supports error message extraction for user-friendly reporting
 * - Offers JSON serialization for API responses and logging
 * - Enables bulk error management operations (clear, count, check)
 *
 * Use Cases:
 * - Form validation with multiple field errors
 * - Configuration file validation with multiple issues
 * - Batch API request validation
 * - Multi-step installation validation
 * - Complex object validation with nested properties
 *
 * The collection automatically converts non-ValidationError instances
 * to ValidationError objects to maintain consistency in error handling.
 */
class ValidationErrorCollection {
  /**
   * Initialize an empty error collection
   */
  constructor() {
    this.errors = []; // Array to store all validation errors
  }

  /**
   * Add a validation error to the collection
   *
   * Accepts either ValidationError instances or generic errors/strings.
   * Generic errors are automatically converted to ValidationError instances
   * to maintain consistency in the error handling system.
   *
   * @param {ValidationError|Error|string} error - The error to add to the collection
   */
  addError(error) {
    if (error instanceof ValidationError) {
      // Native validation errors are added directly
      this.errors.push(error);
    } else {
      // Convert generic errors to ValidationError instances for consistency
      this.errors.push(new ValidationError(error.message || error));
    }
  }

  /**
   * Check if the collection contains any errors
   *
   * @returns {boolean} True if there are validation errors, false otherwise
   */
  hasErrors() {
    return this.errors.length > 0;
  }

  /**
   * Get all errors in the collection
   *
   * @returns {Array<ValidationError>} Array of all validation errors
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Get errors for a specific field
   *
   * Useful for displaying field-specific error messages in forms
   * or highlighting specific configuration issues.
   *
   * @param {string} field - Name of the field to filter errors by
   * @returns {Array<ValidationError>} Array of errors for the specified field
   */
  getErrorsByField(field) {
    return this.errors.filter((error) => error.field === field);
  }

  /**
   * Extract all error messages as strings
   *
   * Convenient method for displaying all error messages to users
   * without needing to iterate through error objects.
   *
   * @returns {Array<string>} Array of error messages
   */
  getErrorMessages() {
    return this.errors.map((error) => error.message);
  }

  /**
   * Clear all errors from the collection
   *
   * Useful for resetting validation state before re-running validation
   * or when starting a new validation process.
   */
  clear() {
    this.errors = [];
  }

  /**
   * Serialize the error collection to JSON
   *
   * Provides a structured representation of all validation errors suitable
   * for API responses, logging systems, or client-side error handling.
   * The JSON format includes summary information and detailed error data.
   *
   * @returns {object} JSON representation of the error collection
   * @returns {boolean} returns.hasErrors - Whether any errors exist
   * @returns {number} returns.errorCount - Total number of errors
   * @returns {Array<object>} returns.errors - Array of serialized error objects
   */
  toJSON() {
    return {
      hasErrors: this.hasErrors(), // Quick boolean check for error presence
      errorCount: this.errors.length, // Total error count for summary display
      errors: this.errors.map((error) => ({
        name: error.name, // Error class name for error type identification
        message: error.message, // Human-readable error message
        field: error.field, // Field name for targeted error display
        code: error.code, // Machine-readable error code for programmatic handling
        timestamp: error.timestamp, // When the error occurred for debugging
      })),
    };
  }
}

module.exports = {
  ValidationError,
  RequiredFieldError,
  TypeValidationError,
  FormatValidationError,
  RangeValidationError,
  ValidationErrorCollection,
};
