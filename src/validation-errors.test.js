/**
 * Tests for validation error classes
 */

const {
  ValidationError,
  RequiredFieldError,
  TypeValidationError,
  FormatValidationError,
  RangeValidationError,
  ValidationErrorCollection
} = require('./validation-errors');

describe('ValidationError', () => {
  test('should create basic validation error', () => {
    const error = new ValidationError('Test error', 'testField', 'TEST_CODE');
    
    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Test error');
    expect(error.field).toBe('testField');
    expect(error.code).toBe('TEST_CODE');
    expect(error.timestamp).toBeDefined();
  });

  test('should create error with minimal parameters', () => {
    const error = new ValidationError('Test error');
    
    expect(error.name).toBe('ValidationError');
    expect(error.message).toBe('Test error');
    expect(error.field).toBeNull();
    expect(error.code).toBeNull();
  });
});

describe('RequiredFieldError', () => {
  test('should create required field error', () => {
    const error = new RequiredFieldError('username');
    
    expect(error.name).toBe('RequiredFieldError');
    expect(error.message).toBe("Field 'username' is required");
    expect(error.field).toBe('username');
    expect(error.code).toBe('REQUIRED_FIELD');
  });
});

describe('TypeValidationError', () => {
  test('should create type validation error', () => {
    const error = new TypeValidationError('age', 'number', 'string');
    
    expect(error.name).toBe('TypeValidationError');
    expect(error.message).toBe("Field 'age' must be of type 'number', got 'string'");
    expect(error.field).toBe('age');
    expect(error.code).toBe('TYPE_MISMATCH');
    expect(error.expectedType).toBe('number');
    expect(error.actualType).toBe('string');
  });
});

describe('FormatValidationError', () => {
  test('should create format validation error', () => {
    const error = new FormatValidationError('email', 'email', 'invalid-email');
    
    expect(error.name).toBe('FormatValidationError');
    expect(error.message).toBe("Field 'email' does not match expected format 'email': invalid-email");
    expect(error.field).toBe('email');
    expect(error.code).toBe('FORMAT_INVALID');
    expect(error.format).toBe('email');
    expect(error.value).toBe('invalid-email');
  });
});

describe('RangeValidationError', () => {
  test('should create range validation error', () => {
    const error = new RangeValidationError('count', 1, 10, 15);
    
    expect(error.name).toBe('RangeValidationError');
    expect(error.message).toBe("Field 'count' value '15' is outside allowed range [1, 10]");
    expect(error.field).toBe('count');
    expect(error.code).toBe('RANGE_INVALID');
    expect(error.min).toBe(1);
    expect(error.max).toBe(10);
    expect(error.value).toBe(15);
  });
});

describe('ValidationErrorCollection', () => {
  let collection;

  beforeEach(() => {
    collection = new ValidationErrorCollection();
  });

  test('should initialize empty collection', () => {
    expect(collection.hasErrors()).toBe(false);
    expect(collection.getErrors()).toEqual([]);
  });

  test('should add validation error', () => {
    const error = new ValidationError('Test error');
    collection.addError(error);
    
    expect(collection.hasErrors()).toBe(true);
    expect(collection.getErrors()).toHaveLength(1);
    expect(collection.getErrors()[0]).toBe(error);
  });

  test('should add non-validation error', () => {
    const error = new Error('Generic error');
    collection.addError(error);
    
    expect(collection.hasErrors()).toBe(true);
    expect(collection.getErrors()).toHaveLength(1);
    expect(collection.getErrors()[0]).toBeInstanceOf(ValidationError);
  });

  test('should get errors by field', () => {
    const error1 = new ValidationError('Error 1', 'field1');
    const error2 = new ValidationError('Error 2', 'field2');
    const error3 = new ValidationError('Error 3', 'field1');
    
    collection.addError(error1);
    collection.addError(error2);
    collection.addError(error3);
    
    const field1Errors = collection.getErrorsByField('field1');
    expect(field1Errors).toHaveLength(2);
    expect(field1Errors[0].message).toBe('Error 1');
    expect(field1Errors[1].message).toBe('Error 3');
  });

  test('should get error messages', () => {
    const error1 = new ValidationError('Error 1');
    const error2 = new ValidationError('Error 2');
    
    collection.addError(error1);
    collection.addError(error2);
    
    const messages = collection.getErrorMessages();
    expect(messages).toEqual(['Error 1', 'Error 2']);
  });

  test('should clear errors', () => {
    const error = new ValidationError('Test error');
    collection.addError(error);
    
    expect(collection.hasErrors()).toBe(true);
    
    collection.clear();
    
    expect(collection.hasErrors()).toBe(false);
    expect(collection.getErrors()).toEqual([]);
  });

  test('should convert to JSON', () => {
    const error = new ValidationError('Test error', 'testField', 'TEST_CODE');
    collection.addError(error);
    
    const json = collection.toJSON();
    
    expect(json.hasErrors).toBe(true);
    expect(json.errorCount).toBe(1);
    expect(json.errors).toHaveLength(1);
    expect(json.errors[0]).toEqual({
      name: 'ValidationError',
      message: 'Test error',
      field: 'testField',
      code: 'TEST_CODE',
      timestamp: error.timestamp
    });
  });
});