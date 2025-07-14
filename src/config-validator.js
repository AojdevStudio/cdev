const fs = require('fs');
const path = require('path');

/**
 * Validate a configuration object
 * @param {Object} config - Configuration to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validateConfig(config, options = {}) {
  const errors = [];
  const warnings = [];

  // Check if config is an object
  if (!config || typeof config !== 'object') {
    errors.push('Configuration must be a valid object');
    return { valid: false, errors, warnings };
  }

  // Validate JSON structure
  try {
    JSON.stringify(config);
  } catch (error) {
    errors.push(`Invalid JSON structure: ${error.message}`);
    return { valid: false, errors, warnings };
  }

  // Validate required fields
  validateRequiredFields(config, errors);

  // Validate field types
  validateFieldTypes(config, errors);

  // Validate hooks
  if (config.hooks) {
    validateHooks(config.hooks, errors, warnings);
  }

  // Validate environment variables
  if (config.environment) {
    validateEnvironment(config.environment, errors, warnings);
  }

  // Validate tools configuration
  if (config.tools) {
    validateTools(config.tools, errors, warnings);
  }

  // Check for deprecated fields
  checkDeprecatedFields(config, warnings);

  // Custom validation rules
  if (options.customRules) {
    applyCustomRules(config, options.customRules, errors, warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate required fields
 * @param {Object} config - Configuration object
 * @param {Array} errors - Errors array
 */
function validateRequiredFields(config, errors) {
  const requiredFields = ['version'];

  for (const field of requiredFields) {
    if (!(field in config)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
}

/**
 * Validate field types
 * @param {Object} config - Configuration object
 * @param {Array} errors - Errors array
 */
function validateFieldTypes(config, errors) {
  const fieldTypes = {
    version: 'string',
    hooks: 'object',
    environment: 'object',
    tools: 'object',
    disabled: 'boolean',
    debug: 'boolean',
  };

  for (const [field, expectedType] of Object.entries(fieldTypes)) {
    if (field in config) {
      const actualType = Array.isArray(config[field]) ? 'array' : typeof config[field];
      if (actualType !== expectedType) {
        errors.push(`Field "${field}" must be of type ${expectedType}, got ${actualType}`);
      }
    }
  }
}

/**
 * Validate hooks configuration
 * @param {Object} hooks - Hooks configuration
 * @param {Array} errors - Errors array
 * @param {Array} warnings - Warnings array
 */
function validateHooks(hooks, errors, warnings) {
  const validEvents = [
    'pre_tool_use',
    'post_tool_use',
    'pre_command',
    'post_command',
    'subagent_start',
    'subagent_stop',
  ];

  for (const [event, hookList] of Object.entries(hooks)) {
    // Check if event is valid
    if (!validEvents.includes(event)) {
      warnings.push(`Unknown hook event: ${event}`);
    }

    // Validate hook list
    if (!Array.isArray(hookList)) {
      errors.push(`Hooks for event "${event}" must be an array`);
      continue;
    }

    // Validate each hook
    hookList.forEach((hook, index) => {
      if (typeof hook === 'string') {
        // Simple string format is allowed
        return;
      }

      if (typeof hook !== 'object' || !hook) {
        errors.push(`Hook at ${event}[${index}] must be a string or object`);
        return;
      }

      // Validate hook object
      if (!hook.command) {
        errors.push(`Hook at ${event}[${index}] missing required field: command`);
      }

      if ('blocking' in hook && typeof hook.blocking !== 'boolean') {
        errors.push(`Hook at ${event}[${index}].blocking must be a boolean`);
      }

      if ('timeout' in hook && typeof hook.timeout !== 'number') {
        errors.push(`Hook at ${event}[${index}].timeout must be a number`);
      }
    });
  }
}

/**
 * Validate environment variables
 * @param {Object} environment - Environment configuration
 * @param {Array} errors - Errors array
 * @param {Array} warnings - Warnings array
 */
function validateEnvironment(environment, errors, warnings) {
  for (const [key, value] of Object.entries(environment)) {
    // Check key format
    if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
      warnings.push(`Environment variable "${key}" should follow UPPER_SNAKE_CASE convention`);
    }

    // Check value type
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
      errors.push(`Environment variable "${key}" must be a string, number, or boolean`);
    }
  }
}

/**
 * Validate tools configuration
 * @param {Object} tools - Tools configuration
 * @param {Array} errors - Errors array
 * @param {Array} warnings - Warnings array
 */
function validateTools(tools, errors, warnings) {
  const validToolNames = ['bash', 'read', 'write', 'edit', 'search', 'grep', 'task'];

  for (const [toolName, toolConfig] of Object.entries(tools)) {
    if (!validToolNames.includes(toolName.toLowerCase())) {
      warnings.push(`Unknown tool name: ${toolName}`);
    }

    if (typeof toolConfig !== 'object' || !toolConfig) {
      errors.push(`Tool configuration for "${toolName}" must be an object`);
      continue;
    }

    // Validate tool-specific settings
    if ('enabled' in toolConfig && typeof toolConfig.enabled !== 'boolean') {
      errors.push(`Tool "${toolName}".enabled must be a boolean`);
    }

    if ('timeout' in toolConfig && typeof toolConfig.timeout !== 'number') {
      errors.push(`Tool "${toolName}".timeout must be a number`);
    }
  }
}

/**
 * Check for deprecated fields
 * @param {Object} config - Configuration object
 * @param {Array} warnings - Warnings array
 */
function checkDeprecatedFields(config, warnings) {
  const deprecatedFields = {
    env: 'Use "environment" instead',
    pre_hook: 'Use "hooks.pre_command" instead',
    post_hook: 'Use "hooks.post_command" instead',
  };

  for (const [field, message] of Object.entries(deprecatedFields)) {
    if (field in config) {
      warnings.push(`Deprecated field "${field}": ${message}`);
    }
  }
}

/**
 * Apply custom validation rules
 * @param {Object} config - Configuration object
 * @param {Array} rules - Custom validation rules
 * @param {Array} errors - Errors array
 * @param {Array} warnings - Warnings array
 */
function applyCustomRules(config, rules, errors, warnings) {
  for (const rule of rules) {
    try {
      const result = rule(config);
      if (result.error) {
        errors.push(result.error);
      }
      if (result.warning) {
        warnings.push(result.warning);
      }
    } catch (error) {
      errors.push(`Custom rule failed: ${error.message}`);
    }
  }
}

/**
 * Validate a configuration file
 * @param {string} filePath - Path to configuration file
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
async function validateConfigFile(filePath, options = {}) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const config = JSON.parse(content);
    return validateConfig(config, options);
  } catch (error) {
    return {
      valid: false,
      errors: [`Failed to read or parse configuration file: ${error.message}`],
      warnings: [],
    };
  }
}

/**
 * Format validation result for display
 * @param {Object} result - Validation result
 * @returns {string} Formatted result
 */
function formatValidationResult(result) {
  const lines = [];

  if (result.valid) {
    lines.push('✅ Configuration is valid');
  } else {
    lines.push('❌ Configuration is invalid');
  }

  if (result.errors.length > 0) {
    lines.push('');
    lines.push('Errors:');
    result.errors.forEach((error) => {
      lines.push(`  • ${error}`);
    });
  }

  if (result.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    result.warnings.forEach((warning) => {
      lines.push(`  • ${warning}`);
    });
  }

  return lines.join('\n');
}

module.exports = {
  validateConfig,
  validateConfigFile,
  formatValidationResult,
  validateRequiredFields,
  validateFieldTypes,
  validateHooks,
  validateEnvironment,
  validateTools,
};
