const fs = require('fs');
const path = require('path');

const configDefaults = require('./config-defaults');
const configLoader = require('./config-loader');

class ConfigManager {
  constructor() {
    this.config = null;
    this.configPath = null;
  }

  initialize(configPath = null) {
    this.configPath = configPath || this.findConfigFile();
    this.config = this.loadConfig();
    return this.config;
  }

  findConfigFile() {
    const possiblePaths = [
      path.join(process.cwd(), 'claude-code-hooks.config.js'),
      path.join(process.cwd(), 'claude-code-hooks.config.json'),
      path.join(process.cwd(), '.claude-code-hooks.json'),
      path.join(require('os').homedir(), '.claude-code-hooks.json'),
    ];

    for (const configPath of possiblePaths) {
      if (fs.existsSync(configPath)) {
        return configPath;
      }
    }

    return null;
  }

  loadConfig() {
    let userConfig = {};

    if (this.configPath && fs.existsSync(this.configPath)) {
      try {
        userConfig = configLoader.loadFromFile(this.configPath);
      } catch (error) {
        console.warn(`Warning: Could not load config from ${this.configPath}:`, error.message);
      }
    }

    return this.mergeConfigs(configDefaults.getDefaults(), userConfig);
  }

  mergeConfigs(defaults, userConfig) {
    const merged = { ...defaults };

    for (const key in userConfig) {
      if (
        typeof userConfig[key] === 'object' &&
        userConfig[key] !== null &&
        !Array.isArray(userConfig[key])
      ) {
        merged[key] = this.mergeConfigs(merged[key] || {}, userConfig[key]);
      } else {
        merged[key] = userConfig[key];
      }
    }

    return merged;
  }

  get(key, defaultValue = undefined) {
    if (!this.config) {
      throw new Error('Config not initialized. Call initialize() first.');
    }

    const keys = key.split('.');
    let current = this.config;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return defaultValue;
      }
    }

    return current;
  }

  set(key, value) {
    if (!this.config) {
      throw new Error('Config not initialized. Call initialize() first.');
    }

    const keys = key.split('.');
    let current = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }

    current[keys[keys.length - 1]] = value;
    return this;
  }

  save() {
    if (!this.configPath) {
      throw new Error('No config file path specified. Cannot save configuration.');
    }

    try {
      const configData = JSON.stringify(this.config, null, 2);
      fs.writeFileSync(this.configPath, configData, 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving config:', error.message);
      return false;
    }
  }

  reset() {
    this.config = configDefaults.getDefaults();
    return this.config;
  }

  validate() {
    if (!this.config) {
      throw new Error('Config not initialized. Call initialize() first.');
    }

    const required = ['linear', 'git', 'claude'];
    const missing = [];

    for (const key of required) {
      if (!this.config[key]) {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing required configuration keys: ${missing.join(', ')}`);
    }

    return true;
  }
}

const configManager = new ConfigManager();

module.exports = {
  ConfigManager,
  initialize: (configPath) => configManager.initialize(configPath),
  get: (key, defaultValue) => configManager.get(key, defaultValue),
  set: (key, value) => configManager.set(key, value),
  save: () => configManager.save(),
  reset: () => configManager.reset(),
  validate: () => configManager.validate(),
  getConfigPath: () => configManager.configPath,
  getConfig: () => configManager.config,
};
