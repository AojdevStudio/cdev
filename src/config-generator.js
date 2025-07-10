const fs = require('fs');
const path = require('path');
const { detectProjectType } = require('./install-utils');
const templateEngine = require('./template-engine');

/**
 * Generate configuration based on project type and user preferences
 * @param {string} projectPath - Path to the project
 * @param {Object} options - Configuration options
 * @returns {Object} Generated configuration
 */
function generateConfig(projectPath, options = {}) {
  const projectType = detectProjectType(projectPath);
  const templatePath = path.join(__dirname, '..', 'templates', `${projectType}.json`);
  const defaultTemplatePath = path.join(__dirname, '..', 'templates', 'default.json');
  
  let template;
  
  // Try to load project-specific template, fall back to default
  try {
    if (fs.existsSync(templatePath)) {
      template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    } else {
      template = JSON.parse(fs.readFileSync(defaultTemplatePath, 'utf8'));
    }
  } catch (error) {
    throw new Error(`Failed to load configuration template: ${error.message}`);
  }
  
  // Merge template with user options
  const config = mergeConfigurations(template, options);
  
  // Apply template variables
  const processedConfig = templateEngine.processTemplate(config, {
    projectPath,
    projectType,
    timestamp: new Date().toISOString(),
    ...options.variables
  });
  
  return processedConfig;
}

/**
 * Merge base configuration with user options
 * @param {Object} base - Base configuration
 * @param {Object} overrides - User overrides
 * @returns {Object} Merged configuration
 */
function mergeConfigurations(base, overrides) {
  const result = JSON.parse(JSON.stringify(base)); // Deep clone
  
  // Handle hooks specially - append rather than replace
  if (overrides.hooks && base.hooks) {
    result.hooks = mergeHooks(base.hooks, overrides.hooks);
    delete overrides.hooks;
  }
  
  // Merge other properties recursively
  return deepMerge(result, overrides);
}

/**
 * Merge hook configurations intelligently
 * @param {Object} baseHooks - Base hooks
 * @param {Object} overrideHooks - Override hooks
 * @returns {Object} Merged hooks
 */
function mergeHooks(baseHooks, overrideHooks) {
  const merged = { ...baseHooks };
  
  for (const [event, hooks] of Object.entries(overrideHooks)) {
    if (!merged[event]) {
      merged[event] = hooks;
    } else if (Array.isArray(merged[event]) && Array.isArray(hooks)) {
      // Merge arrays, avoiding duplicates
      merged[event] = [...new Set([...merged[event], ...hooks])];
    } else {
      // Replace if types don't match
      merged[event] = hooks;
    }
  }
  
  return merged;
}

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

/**
 * Check if value is a plain object
 * @param {*} obj - Value to check
 * @returns {boolean} True if plain object
 */
function isObject(obj) {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
}

/**
 * Write configuration to file
 * @param {string} filePath - Path to write configuration
 * @param {Object} config - Configuration object
 * @returns {Promise<void>}
 */
async function writeConfig(filePath, config) {
  const configStr = JSON.stringify(config, null, 2);
  
  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Write configuration
  fs.writeFileSync(filePath, configStr, 'utf8');
}

/**
 * Generate and write configuration for a project
 * @param {string} projectPath - Path to the project
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Generated configuration
 */
async function generateAndWriteConfig(projectPath, options = {}) {
  const config = generateConfig(projectPath, options);
  const configPath = path.join(projectPath, '.claude', 'settings.json');
  
  await writeConfig(configPath, config);
  
  return {
    config,
    path: configPath,
    projectType: detectProjectType(projectPath)
  };
}

module.exports = {
  generateConfig,
  mergeConfigurations,
  mergeHooks,
  deepMerge,
  writeConfig,
  generateAndWriteConfig
};