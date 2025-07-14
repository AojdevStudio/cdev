/**
 * Template engine for processing configuration templates with variable substitution
 */

/**
 * Process a template object, replacing variables with values
 * @param {Object|Array|string} template - Template to process
 * @param {Object} variables - Variables to substitute
 * @returns {Object|Array|string} Processed template
 */
function processTemplate(template, variables = {}) {
  if (typeof template === 'string') {
    return substituteVariables(template, variables);
  }

  if (Array.isArray(template)) {
    return template.map((item) => processTemplate(item, variables));
  }

  if (template && typeof template === 'object') {
    const processed = {};
    for (const [key, value] of Object.entries(template)) {
      processed[key] = processTemplate(value, variables);
    }
    return processed;
  }

  return template;
}

/**
 * Substitute variables in a string
 * @param {string} str - String with variable placeholders
 * @param {Object} variables - Variables to substitute
 * @returns {string} String with variables substituted
 */
function substituteVariables(str, variables) {
  // Support multiple variable formats
  // {{variable}} - double braces
  // ${variable} - template literal style
  // %variable% - Windows style

  let result = str;

  // Replace {{variable}} format
  result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) =>
    getVariableValue(varName, variables, match),
  );

  // Replace ${variable} format
  result = result.replace(/\$\{(\w+)\}/g, (match, varName) =>
    getVariableValue(varName, variables, match),
  );

  // Replace %variable% format
  result = result.replace(/%(\w+)%/g, (match, varName) =>
    getVariableValue(varName, variables, match),
  );

  return result;
}

/**
 * Get variable value with fallback
 * @param {string} varName - Variable name
 * @param {Object} variables - Variables object
 * @param {string} originalMatch - Original matched string
 * @returns {string} Variable value or original match
 */
function getVariableValue(varName, variables, originalMatch) {
  if (varName in variables) {
    const value = variables[varName];
    // Convert non-string values to string
    if (typeof value !== 'string') {
      return JSON.stringify(value);
    }
    return value;
  }

  // Check for case-insensitive match
  const lowerVarName = varName.toLowerCase();
  for (const [key, value] of Object.entries(variables)) {
    if (key.toLowerCase() === lowerVarName) {
      if (typeof value !== 'string') {
        return JSON.stringify(value);
      }
      return value;
    }
  }

  // Return original match if variable not found
  return originalMatch;
}

/**
 * Extract variables from a template
 * @param {Object|Array|string} template - Template to analyze
 * @returns {Set<string>} Set of variable names found
 */
function extractVariables(template) {
  const variables = new Set();

  if (typeof template === 'string') {
    // Extract from all supported formats
    const patterns = [/\{\{(\w+)\}\}/g, /\$\{(\w+)\}/g, /%(\w+)%/g];

    for (const pattern of patterns) {
      for (const match of template.matchAll(pattern)) {
        variables.add(match[1]);
      }
    }
  } else if (Array.isArray(template)) {
    template.forEach((item) => {
      const itemVars = extractVariables(item);
      itemVars.forEach((v) => variables.add(v));
    });
  } else if (template && typeof template === 'object') {
    Object.values(template).forEach((value) => {
      const valueVars = extractVariables(value);
      valueVars.forEach((v) => variables.add(v));
    });
  }

  return variables;
}

/**
 * Validate that all required variables are provided
 * @param {Object|Array|string} template - Template to validate
 * @param {Object} variables - Provided variables
 * @returns {Object} Validation result
 */
function validateVariables(template, variables) {
  const required = extractVariables(template);
  const provided = new Set(Object.keys(variables));
  const missing = [];

  for (const varName of required) {
    if (!provided.has(varName)) {
      // Check case-insensitive
      const found = Array.from(provided).some((p) => p.toLowerCase() === varName.toLowerCase());
      if (!found) {
        missing.push(varName);
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    required: Array.from(required),
    provided: Array.from(provided),
  };
}

/**
 * Create a template processor with default variables
 * @param {Object} defaultVariables - Default variables
 * @returns {Function} Template processor function
 */
function createProcessor(defaultVariables = {}) {
  return (template, additionalVariables = {}) => {
    const variables = { ...defaultVariables, ...additionalVariables };
    return processTemplate(template, variables);
  };
}

/**
 * Load and process a template file
 * @param {string} filePath - Path to template file
 * @param {Object} variables - Variables to substitute
 * @returns {Object} Processed template
 */
function loadAndProcessTemplate(filePath, variables = {}) {
  const fs = require('fs');

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const template = JSON.parse(content);
    return processTemplate(template, variables);
  } catch (error) {
    throw new Error(`Failed to load template from ${filePath}: ${error.message}`);
  }
}

/**
 * Get default variables for templates
 * @param {Object} options - Options for default variables
 * @returns {Object} Default variables
 */
function getDefaultVariables(options = {}) {
  const os = require('os');
  const path = require('path');

  return {
    // System variables
    platform: os.platform(),
    arch: os.arch(),
    homedir: os.homedir(),
    tmpdir: os.tmpdir(),

    // Time variables
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    year: new Date().getFullYear(),

    // Project variables
    projectPath: options.projectPath || process.cwd(),
    projectName: options.projectName || path.basename(process.cwd()),
    projectType: options.projectType || 'unknown',

    // User variables
    username: os.userInfo().username,

    // Custom variables
    ...options.custom,
  };
}

module.exports = {
  processTemplate,
  substituteVariables,
  extractVariables,
  validateVariables,
  createProcessor,
  loadAndProcessTemplate,
  getDefaultVariables,
};
