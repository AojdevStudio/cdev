/**
 * Tests for config-validator.js
 */

const fs = require('fs');
const {
  validateConfig,
  validateConfigFile,
  formatValidationResult,
  validateRequiredFields,
  validateFieldTypes,
  validateHooks,
  validateEnvironment,
  validateTools
} = require('./config-validator');

// Mock fs
jest.mock('fs');

describe('ConfigValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateConfig', () => {
    test('validates valid configuration', () => {
      const config = {
        version: '1.0.0',
        hooks: {
          pre_tool_use: ['hook1.py', 'hook2.py']
        }
      };

      const result = validateConfig(config);

      expect(result).toEqual({
        valid: true,
        errors: [],
        warnings: []
      });
    });

    test('rejects non-object configuration', () => {
      const result = validateConfig('not an object');

      expect(result).toEqual({
        valid: false,
        errors: ['Configuration must be a valid object'],
        warnings: []
      });
    });

    test('rejects null configuration', () => {
      const result = validateConfig(null);

      expect(result).toEqual({
        valid: false,
        errors: ['Configuration must be a valid object'],
        warnings: []
      });
    });

    test('detects invalid JSON structure', () => {
      const config = {};
      config.circular = config; // Create circular reference

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid JSON structure');
    });

    test('validates required fields', () => {
      const config = {}; // Missing version

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: version');
    });

    test('validates field types', () => {
      const config = {
        version: 123, // Should be string
        debug: 'yes' // Should be boolean
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Field "version" must be of type string, got number');
      expect(result.errors).toContain('Field "debug" must be of type boolean, got string');
    });

    test('validates hooks configuration', () => {
      const config = {
        version: '1.0.0',
        hooks: {
          pre_tool_use: 'not-an-array' // Should be array
        }
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Hooks for event "pre_tool_use" must be an array');
    });

    test('validates environment configuration', () => {
      const config = {
        version: '1.0.0',
        environment: {
          'lowercase': 'value', // Should warn about naming
          'VALID_VAR': {}  // Should error on object value
        }
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Environment variable "VALID_VAR" must be a string, number, or boolean');
      expect(result.warnings).toContain('Environment variable "lowercase" should follow UPPER_SNAKE_CASE convention');
    });

    test('validates tools configuration', () => {
      const config = {
        version: '1.0.0',
        tools: {
          bash: {
            enabled: 'yes' // Should be boolean
          }
        }
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Tool "bash".enabled must be a boolean');
    });

    test('detects deprecated fields', () => {
      const config = {
        version: '1.0.0',
        env: { NODE_ENV: 'test' }, // Deprecated
        pre_hook: 'hook.py' // Deprecated
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Deprecated field "env": Use "environment" instead');
      expect(result.warnings).toContain('Deprecated field "pre_hook": Use "hooks.pre_command" instead');
    });

    test('applies custom validation rules', () => {
      const config = { version: '1.0.0' };
      const customRules = [
        (cfg) => cfg.version === '2.0.0' ? {} : { error: 'Version must be 2.0.0' },
        (cfg) => ({ warning: 'Custom warning' })
      ];

      const result = validateConfig(config, { customRules });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Version must be 2.0.0');
      expect(result.warnings).toContain('Custom warning');
    });

    test('handles custom rule errors gracefully', () => {
      const config = { version: '1.0.0' };
      const customRules = [
        () => { throw new Error('Rule failed'); }
      ];

      const result = validateConfig(config, { customRules });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Custom rule failed: Rule failed');
    });
  });

  describe('validateRequiredFields', () => {
    test('checks for required fields', () => {
      const errors = [];
      const config = {};

      validateRequiredFields(config, errors);

      expect(errors).toContain('Missing required field: version');
    });

    test('accepts config with all required fields', () => {
      const errors = [];
      const config = { version: '1.0.0' };

      validateRequiredFields(config, errors);

      expect(errors).toHaveLength(0);
    });
  });

  describe('validateFieldTypes', () => {
    test('validates correct field types', () => {
      const errors = [];
      const config = {
        version: '1.0.0',
        hooks: {},
        environment: {},
        tools: {},
        disabled: false,
        debug: true
      };

      validateFieldTypes(config, errors);

      expect(errors).toHaveLength(0);
    });

    test('detects incorrect field types', () => {
      const errors = [];
      const config = {
        version: 123,
        hooks: [],
        disabled: 'false'
      };

      validateFieldTypes(config, errors);

      expect(errors).toContain('Field "version" must be of type string, got number');
      expect(errors).toContain('Field "hooks" must be of type object, got array');
      expect(errors).toContain('Field "disabled" must be of type boolean, got string');
    });
  });

  describe('validateHooks', () => {
    test('validates valid hook configuration', () => {
      const errors = [];
      const warnings = [];
      const hooks = {
        pre_tool_use: ['hook1.py'],
        post_tool_use: [
          { command: 'hook2.py', blocking: true, timeout: 5000 }
        ]
      };

      validateHooks(hooks, errors, warnings);

      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(0);
    });

    test('warns about unknown hook events', () => {
      const errors = [];
      const warnings = [];
      const hooks = {
        unknown_event: ['hook.py']
      };

      validateHooks(hooks, errors, warnings);

      expect(warnings).toContain('Unknown hook event: unknown_event');
    });

    test('validates hook array requirement', () => {
      const errors = [];
      const warnings = [];
      const hooks = {
        pre_tool_use: 'not-an-array'
      };

      validateHooks(hooks, errors, warnings);

      expect(errors).toContain('Hooks for event "pre_tool_use" must be an array');
    });

    test('validates hook object structure', () => {
      const errors = [];
      const warnings = [];
      const hooks = {
        pre_tool_use: [
          123, // Invalid type
          { /* Missing command */ },
          { command: 'hook.py', blocking: 'yes' }, // Invalid blocking type
          { command: 'hook.py', timeout: '5000' } // Invalid timeout type
        ]
      };

      validateHooks(hooks, errors, warnings);

      expect(errors).toContain('Hook at pre_tool_use[0] must be a string or object');
      expect(errors).toContain('Hook at pre_tool_use[1] missing required field: command');
      expect(errors).toContain('Hook at pre_tool_use[2].blocking must be a boolean');
      expect(errors).toContain('Hook at pre_tool_use[3].timeout must be a number');
    });
  });

  describe('validateEnvironment', () => {
    test('validates valid environment variables', () => {
      const errors = [];
      const warnings = [];
      const environment = {
        NODE_ENV: 'production',
        PORT: 3000,
        DEBUG: false
      };

      validateEnvironment(environment, errors, warnings);

      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(0);
    });

    test('warns about naming convention', () => {
      const errors = [];
      const warnings = [];
      const environment = {
        'camelCase': 'value',
        'lower-case': 'value',
        '123_START': 'value'
      };

      validateEnvironment(environment, errors, warnings);

      expect(warnings).toHaveLength(3);
      warnings.forEach(warning => {
        expect(warning).toContain('should follow UPPER_SNAKE_CASE convention');
      });
    });

    test('validates environment value types', () => {
      const errors = [];
      const warnings = [];
      const environment = {
        VALID_STRING: 'value',
        VALID_NUMBER: 123,
        VALID_BOOL: true,
        INVALID_ARRAY: [],
        INVALID_OBJECT: {}
      };

      validateEnvironment(environment, errors, warnings);

      expect(errors).toContain('Environment variable "INVALID_ARRAY" must be a string, number, or boolean');
      expect(errors).toContain('Environment variable "INVALID_OBJECT" must be a string, number, or boolean');
    });
  });

  describe('validateTools', () => {
    test('validates valid tool configuration', () => {
      const errors = [];
      const warnings = [];
      const tools = {
        bash: { enabled: true, timeout: 30000 },
        read: { enabled: false }
      };

      validateTools(tools, errors, warnings);

      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(0);
    });

    test('warns about unknown tools', () => {
      const errors = [];
      const warnings = [];
      const tools = {
        'custom-tool': { enabled: true }
      };

      validateTools(tools, errors, warnings);

      expect(warnings).toContain('Unknown tool name: custom-tool');
    });

    test('validates tool configuration object', () => {
      const errors = [];
      const warnings = [];
      const tools = {
        bash: 'not-an-object'
      };

      validateTools(tools, errors, warnings);

      expect(errors).toContain('Tool configuration for "bash" must be an object');
    });

    test('validates tool properties', () => {
      const errors = [];
      const warnings = [];
      const tools = {
        bash: {
          enabled: 'yes', // Should be boolean
          timeout: '5000' // Should be number
        }
      };

      validateTools(tools, errors, warnings);

      expect(errors).toContain('Tool "bash".enabled must be a boolean');
      expect(errors).toContain('Tool "bash".timeout must be a number');
    });

    test('handles case-insensitive tool names', () => {
      const errors = [];
      const warnings = [];
      const tools = {
        'BASH': { enabled: true },
        'Read': { enabled: true }
      };

      validateTools(tools, errors, warnings);

      expect(warnings).toHaveLength(0); // Should recognize uppercase variants
    });
  });

  describe('validateConfigFile', () => {
    test('validates configuration from file', async () => {
      const config = {
        version: '1.0.0',
        hooks: { pre_tool_use: ['hook.py'] }
      };
      fs.readFileSync.mockReturnValue(JSON.stringify(config));

      const result = await validateConfigFile('/test/config.json');

      expect(fs.readFileSync).toHaveBeenCalledWith('/test/config.json', 'utf8');
      expect(result.valid).toBe(true);
    });

    test('handles file read errors', async () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = await validateConfigFile('/test/config.json');

      expect(result).toEqual({
        valid: false,
        errors: ['Failed to read or parse configuration file: File not found'],
        warnings: []
      });
    });

    test('handles JSON parse errors', async () => {
      fs.readFileSync.mockReturnValue('invalid json');

      const result = await validateConfigFile('/test/config.json');

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Failed to read or parse configuration file');
    });
  });

  describe('formatValidationResult', () => {
    test('formats valid result', () => {
      const result = {
        valid: true,
        errors: [],
        warnings: []
      };

      const formatted = formatValidationResult(result);

      expect(formatted).toBe('✅ Configuration is valid');
    });

    test('formats invalid result with errors', () => {
      const result = {
        valid: false,
        errors: ['Error 1', 'Error 2'],
        warnings: []
      };

      const formatted = formatValidationResult(result);

      expect(formatted).toContain('❌ Configuration is invalid');
      expect(formatted).toContain('Errors:');
      expect(formatted).toContain('  • Error 1');
      expect(formatted).toContain('  • Error 2');
    });

    test('formats result with warnings', () => {
      const result = {
        valid: true,
        errors: [],
        warnings: ['Warning 1', 'Warning 2']
      };

      const formatted = formatValidationResult(result);

      expect(formatted).toContain('✅ Configuration is valid');
      expect(formatted).toContain('Warnings:');
      expect(formatted).toContain('  • Warning 1');
      expect(formatted).toContain('  • Warning 2');
    });

    test('formats result with both errors and warnings', () => {
      const result = {
        valid: false,
        errors: ['Error 1'],
        warnings: ['Warning 1']
      };

      const formatted = formatValidationResult(result);

      expect(formatted).toContain('❌ Configuration is invalid');
      expect(formatted).toContain('Errors:');
      expect(formatted).toContain('  • Error 1');
      expect(formatted).toContain('Warnings:');
      expect(formatted).toContain('  • Warning 1');
    });
  });

  describe('edge cases', () => {
    test('handles empty configuration', () => {
      const result = validateConfig({});

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: version');
    });

    test('handles configuration with extra fields', () => {
      const config = {
        version: '1.0.0',
        customField: 'value',
        anotherField: 123
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(true); // Extra fields are allowed
    });

    test('handles deeply nested invalid structures', () => {
      const config = {
        version: '1.0.0',
        hooks: {
          pre_tool_use: [
            {
              command: 'hook.py',
              options: {
                nested: {
                  invalid: undefined // undefined should cause JSON stringify to fail
                }
              }
            }
          ]
        }
      };

      const result = validateConfig(config);

      // undefined is handled by JSON.stringify, so this should still be valid
      expect(result.valid).toBe(true);
    });
  });
});