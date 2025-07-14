const fs = require('fs');

const {
  validateConfig,
  validateConfigFile,
  formatValidationResult,
  validateRequiredFields,
  validateFieldTypes,
  validateHooks,
  validateEnvironment,
  validateTools,
} = require('../src/config-validator');

// Mock fs module
jest.mock('fs');

describe('Config Validator', () => {
  describe('validateConfig', () => {
    it('should validate a correct configuration', () => {
      const config = {
        version: '1.0',
        hooks: {
          pre_tool_use: ['echo "test"'],
        },
        environment: {
          NODE_ENV: 'development',
        },
        tools: {
          bash: { enabled: true },
        },
        disabled: false,
        debug: false,
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should reject non-object configuration', () => {
      const result = validateConfig(null);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Configuration must be a valid object');
    });

    it('should detect invalid JSON structure', () => {
      const circular = {};
      circular.self = circular;

      const result = validateConfig(circular);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/Invalid JSON structure/);
    });

    it('should apply custom validation rules', () => {
      const config = { version: '1.0' };
      const customRules = [(cfg) => (cfg.customField ? {} : { error: 'Missing customField' })];

      const result = validateConfig(config, { customRules });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing customField');
    });
  });

  describe('validateRequiredFields', () => {
    it('should check for required fields', () => {
      const errors = [];

      validateRequiredFields({}, errors);
      expect(errors).toContain('Missing required field: version');

      errors.length = 0;
      validateRequiredFields({ version: '1.0' }, errors);
      expect(errors).toHaveLength(0);
    });
  });

  describe('validateFieldTypes', () => {
    it('should validate field types', () => {
      const errors = [];
      const config = {
        version: 123, // Should be string
        hooks: [], // Should be object
        disabled: 'false', // Should be boolean
      };

      validateFieldTypes(config, errors);

      expect(errors).toContain('Field "version" must be of type string, got number');
      expect(errors).toContain('Field "hooks" must be of type object, got array');
      expect(errors).toContain('Field "disabled" must be of type boolean, got string');
    });
  });

  describe('validateHooks', () => {
    it('should validate hook structure', () => {
      const errors = [];
      const warnings = [];

      const hooks = {
        pre_tool_use: ['echo "valid"'],
        invalid_event: ['echo "unknown"'],
        post_tool_use: 'not an array',
        pre_command: [
          { command: 'valid hook', blocking: true },
          {
            /* missing command */
          },
          { command: 'timeout', timeout: 'not a number' },
        ],
      };

      validateHooks(hooks, errors, warnings);

      expect(warnings).toContain('Unknown hook event: invalid_event');
      expect(errors).toContain('Hooks for event "post_tool_use" must be an array');
      expect(errors).toContain('Hook at pre_command[1] missing required field: command');
      expect(errors).toContain('Hook at pre_command[2].timeout must be a number');
    });

    it('should accept both string and object hook formats', () => {
      const errors = [];
      const warnings = [];

      const hooks = {
        pre_tool_use: [
          'echo "string format"',
          { command: 'echo "object format"', blocking: false },
        ],
      };

      validateHooks(hooks, errors, warnings);

      expect(errors).toHaveLength(0);
    });
  });

  describe('validateEnvironment', () => {
    it('should validate environment variables', () => {
      const errors = [];
      const warnings = [];

      const environment = {
        VALID_VAR: 'string',
        ANOTHER_VAR: 123,
        'lowercase-var': 'value',
        INVALID_TYPE: { nested: 'object' },
      };

      validateEnvironment(environment, errors, warnings);

      expect(warnings).toContain(
        'Environment variable "lowercase-var" should follow UPPER_SNAKE_CASE convention',
      );
      expect(errors).toContain(
        'Environment variable "INVALID_TYPE" must be a string, number, or boolean',
      );
    });
  });

  describe('validateTools', () => {
    it('should validate tools configuration', () => {
      const errors = [];
      const warnings = [];

      const tools = {
        bash: { enabled: true, timeout: 30000 },
        unknown_tool: { enabled: true },
        invalid: 'not an object',
        read: { enabled: 'yes', timeout: '5000' },
      };

      validateTools(tools, errors, warnings);

      expect(warnings).toContain('Unknown tool name: unknown_tool');
      expect(errors).toContain('Tool configuration for "invalid" must be an object');
      expect(errors).toContain('Tool "read".enabled must be a boolean');
      expect(errors).toContain('Tool "read".timeout must be a number');
    });
  });

  describe('validateConfigFile', () => {
    it('should validate configuration from file', async () => {
      const config = {
        version: '1.0',
        hooks: {},
      };

      fs.readFileSync.mockReturnValue(JSON.stringify(config));

      const result = await validateConfigFile('/test/settings.json');

      expect(result.valid).toBe(true);
      expect(fs.readFileSync).toHaveBeenCalledWith('/test/settings.json', 'utf8');
    });

    it('should handle file read errors', async () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = await validateConfigFile('/test/settings.json');

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/Failed to read or parse configuration file/);
    });

    it('should handle JSON parse errors', async () => {
      fs.readFileSync.mockReturnValue('{ invalid json }');

      const result = await validateConfigFile('/test/settings.json');

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/Failed to read or parse configuration file/);
    });
  });

  describe('formatValidationResult', () => {
    it('should format valid result', () => {
      const result = {
        valid: true,
        errors: [],
        warnings: [],
      };

      const formatted = formatValidationResult(result);

      expect(formatted).toBe('✅ Configuration is valid');
    });

    it('should format result with errors and warnings', () => {
      const result = {
        valid: false,
        errors: ['Error 1', 'Error 2'],
        warnings: ['Warning 1'],
      };

      const formatted = formatValidationResult(result);

      expect(formatted).toContain('❌ Configuration is invalid');
      expect(formatted).toContain('Errors:');
      expect(formatted).toContain('  • Error 1');
      expect(formatted).toContain('  • Error 2');
      expect(formatted).toContain('Warnings:');
      expect(formatted).toContain('  • Warning 1');
    });
  });

  describe('deprecated fields', () => {
    it('should warn about deprecated fields', () => {
      const config = {
        version: '1.0',
        env: { OLD: 'value' },
        pre_hook: 'echo "old"',
        post_hook: 'echo "old"',
      };

      const result = validateConfig(config);

      expect(result.warnings).toContain('Deprecated field "env": Use "environment" instead');
      expect(result.warnings).toContain(
        'Deprecated field "pre_hook": Use "hooks.pre_command" instead',
      );
      expect(result.warnings).toContain(
        'Deprecated field "post_hook": Use "hooks.post_command" instead',
      );
    });
  });
});
