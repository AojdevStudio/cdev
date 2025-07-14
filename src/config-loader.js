const fs = require('fs');
const path = require('path');

class ConfigLoader {
  constructor() {
    this.supportedFormats = ['.js', '.json'];
  }

  loadFromFile(filePath) {
    if (!filePath) {
      throw new Error('Config file path is required');
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`Config file not found: ${filePath}`);
    }

    const ext = path.extname(filePath).toLowerCase();

    if (!this.supportedFormats.includes(ext)) {
      throw new Error(
        `Unsupported config file format: ${ext}. Supported formats: ${this.supportedFormats.join(', ')}`,
      );
    }

    try {
      return this.parseConfigFile(filePath, ext);
    } catch (error) {
      throw new Error(`Error loading config from ${filePath}: ${error.message}`);
    }
  }

  parseConfigFile(filePath, ext) {
    switch (ext) {
      case '.json':
        return this.loadJsonConfig(filePath);
      case '.js':
        return this.loadJsConfig(filePath);
      default:
        throw new Error(`Unsupported file extension: ${ext}`);
    }
  }

  loadJsonConfig(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in config file: ${error.message}`);
      }
      throw error;
    }
  }

  loadJsConfig(filePath) {
    try {
      const absolutePath = path.resolve(filePath);

      if (require.cache[absolutePath]) {
        delete require.cache[absolutePath];
      }

      const config = require(absolutePath);

      if (typeof config === 'function') {
        return config();
      }

      return config;
    } catch (error) {
      throw new Error(`Error loading JavaScript config: ${error.message}`);
    }
  }

  loadFromEnvironment(prefix = 'CLAUDE_CODE_HOOKS') {
    const config = {};
    const prefixPattern = new RegExp(`^${prefix}_(.+)$`);

    for (const [key, value] of Object.entries(process.env)) {
      const match = key.match(prefixPattern);
      if (match) {
        const configKey = match[1].toLowerCase().replace(/_/g, '.');
        config[configKey] = this.parseEnvironmentValue(value);
      }
    }

    return config;
  }

  parseEnvironmentValue(value) {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    if (value === 'null') {
      return null;
    }
    if (value === 'undefined') {
      return undefined;
    }

    if (!isNaN(value) && !isNaN(parseFloat(value))) {
      return parseFloat(value);
    }

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  loadFromMultipleSources(sources) {
    let mergedConfig = {};

    for (const source of sources) {
      try {
        let config = {};

        if (source.type === 'file') {
          config = this.loadFromFile(source.path);
        } else if (source.type === 'env') {
          config = this.loadFromEnvironment(source.prefix);
        } else if (source.type === 'object') {
          config = source.data || {};
        }

        mergedConfig = this.mergeConfigs(mergedConfig, config);
      } catch (error) {
        if (source.required) {
          throw error;
        }
        console.warn(`Warning: Could not load config from ${source.type} source:`, error.message);
      }
    }

    return mergedConfig;
  }

  mergeConfigs(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          typeof source[key] === 'object' &&
          source[key] !== null &&
          !Array.isArray(source[key])
        ) {
          result[key] = this.mergeConfigs(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  validateConfig(config, schema) {
    if (!schema) {
      return { valid: true, errors: [] };
    }

    const errors = [];

    for (const key in schema) {
      const rule = schema[key];
      const value = config[key];

      if (rule.required && (value === undefined || value === null)) {
        errors.push(`Missing required configuration: ${key}`);
        continue;
      }

      if (value !== undefined && rule.type) {
        const actualType = typeof value;
        if (actualType !== rule.type) {
          errors.push(`Invalid type for ${key}: expected ${rule.type}, got ${actualType}`);
        }
      }

      if (rule.validate && typeof rule.validate === 'function') {
        const validationResult = rule.validate(value);
        if (validationResult !== true) {
          errors.push(`Validation failed for ${key}: ${validationResult}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

const configLoader = new ConfigLoader();

module.exports = {
  ConfigLoader,
  loadFromFile: (filePath) => configLoader.loadFromFile(filePath),
  loadFromEnvironment: (prefix) => configLoader.loadFromEnvironment(prefix),
  loadFromMultipleSources: (sources) => configLoader.loadFromMultipleSources(sources),
  mergeConfigs: (target, source) => configLoader.mergeConfigs(target, source),
  validateConfig: (config, schema) => configLoader.validateConfig(config, schema),
  parseEnvironmentValue: (value) => configLoader.parseEnvironmentValue(value),
};
