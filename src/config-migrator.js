const fs = require('fs');
const path = require('path');

const { deepMerge } = require('./config-generator');

/**
 * Migrate configuration from settings.local.json to settings.json
 * @param {string} projectPath - Path to the project
 * @param {Object} options - Migration options
 * @returns {Object} Migration result
 */
async function migrateConfig(projectPath, options = {}) {
  const claudeDir = path.join(projectPath, '.claude');
  const localConfigPath = path.join(claudeDir, 'settings.local.json');
  const targetConfigPath = path.join(claudeDir, 'settings.json');

  const result = {
    migrated: false,
    source: localConfigPath,
    target: targetConfigPath,
    backup: null,
    changes: [],
    warnings: [],
  };

  // Check if source file exists
  if (!fs.existsSync(localConfigPath)) {
    result.warnings.push('No settings.local.json found to migrate');
    return result;
  }

  // Load source configuration
  let sourceConfig;
  try {
    const content = fs.readFileSync(localConfigPath, 'utf8');
    sourceConfig = JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read settings.local.json: ${error.message}`);
  }

  // Check if target exists and handle accordingly
  let targetConfig = {};
  if (fs.existsSync(targetConfigPath)) {
    if (options.backup !== false) {
      // Create backup
      const backupPath = `${targetConfigPath}.backup.${Date.now()}`;
      fs.copyFileSync(targetConfigPath, backupPath);
      result.backup = backupPath;
    }

    try {
      const content = fs.readFileSync(targetConfigPath, 'utf8');
      targetConfig = JSON.parse(content);
    } catch (error) {
      result.warnings.push(`Existing settings.json is invalid: ${error.message}`);
    }
  }

  // Perform migration
  const migratedConfig = performMigration(sourceConfig, targetConfig, result);

  // Validate migrated configuration
  if (!isValidConfiguration(migratedConfig)) {
    throw new Error('Migration resulted in invalid configuration');
  }

  // Write migrated configuration
  fs.writeFileSync(targetConfigPath, JSON.stringify(migratedConfig, null, 2), 'utf8');

  // Handle source file based on options
  if (options.removeSource) {
    fs.unlinkSync(localConfigPath);
    result.changes.push('Removed settings.local.json after successful migration');
  } else if (options.archiveSource) {
    const archivePath = `${localConfigPath}.migrated.${Date.now()}`;
    fs.renameSync(localConfigPath, archivePath);
    result.changes.push(`Archived settings.local.json to ${path.basename(archivePath)}`);
  }

  result.migrated = true;
  return result;
}

/**
 * Perform the actual migration logic
 * @param {Object} source - Source configuration
 * @param {Object} target - Target configuration
 * @param {Object} result - Result object to track changes
 * @returns {Object} Migrated configuration
 */
function performMigration(source, target, result) {
  // Track what's being migrated
  const sourceKeys = Object.keys(source);
  const targetKeys = Object.keys(target);

  // Identify new keys
  const newKeys = sourceKeys.filter((key) => !targetKeys.includes(key));
  if (newKeys.length > 0) {
    result.changes.push(`Added new keys: ${newKeys.join(', ')}`);
  }

  // Identify conflicts
  const conflicts = sourceKeys.filter((key) => targetKeys.includes(key));
  if (conflicts.length > 0) {
    result.changes.push(`Merged existing keys: ${conflicts.join(', ')}`);
  }

  // Merge configurations
  const merged = deepMerge(target, source);

  // Apply any necessary transformations
  const migrated = applyMigrationTransformations(merged, result);

  return migrated;
}

/**
 * Apply any necessary transformations during migration
 * @param {Object} config - Configuration to transform
 * @param {Object} result - Result object to track changes
 * @returns {Object} Transformed configuration
 */
function applyMigrationTransformations(config, result) {
  const transformed = JSON.parse(JSON.stringify(config)); // Deep clone

  // Transform old hook formats to new format
  if (
    transformed.hooks &&
    typeof transformed.hooks === 'object' &&
    !Array.isArray(transformed.hooks)
  ) {
    let hooksTransformed = false;

    for (const [event, hooks] of Object.entries(transformed.hooks)) {
      // Convert string hooks to array format
      if (typeof hooks === 'string') {
        transformed.hooks[event] = [hooks];
        hooksTransformed = true;
      }

      // Ensure all hook entries have required properties
      if (Array.isArray(transformed.hooks[event])) {
        transformed.hooks[event] = transformed.hooks[event].map((hook) => {
          if (typeof hook === 'string') {
            return {
              command: hook,
              blocking: true,
            };
          }
          return hook;
        });
      }
    }

    if (hooksTransformed) {
      result.changes.push('Transformed legacy hook formats to current format');
    }
  }

  // Transform old environment variable format
  if (transformed.env && !transformed.environment) {
    transformed.environment = transformed.env;
    delete transformed.env;
    result.changes.push('Migrated "env" to "environment"');
  }

  // Ensure required fields exist
  if (!transformed.version) {
    transformed.version = '1.0';
    result.changes.push('Added version field');
  }

  return transformed;
}

/**
 * Validate if configuration is valid
 * @param {Object} config - Configuration to validate
 * @returns {boolean} True if valid
 */
function isValidConfiguration(config) {
  // Basic structure validation
  if (!config || typeof config !== 'object') {
    return false;
  }

  // Check for required fields
  const requiredFields = ['version'];
  for (const field of requiredFields) {
    if (!(field in config)) {
      return false;
    }
  }

  // Validate hooks structure if present
  if (config.hooks) {
    if (typeof config.hooks !== 'object') {
      return false;
    }

    for (const hooks of Object.values(config.hooks)) {
      if (!Array.isArray(hooks)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Check if migration is needed
 * @param {string} projectPath - Path to the project
 * @returns {Object} Migration status
 */
function checkMigrationStatus(projectPath) {
  const claudeDir = path.join(projectPath, '.claude');
  const localConfigPath = path.join(claudeDir, 'settings.local.json');
  const targetConfigPath = path.join(claudeDir, 'settings.json');

  return {
    hasLocalConfig: fs.existsSync(localConfigPath),
    hasTargetConfig: fs.existsSync(targetConfigPath),
    needsMigration: fs.existsSync(localConfigPath) && !fs.existsSync(targetConfigPath),
    localConfigPath,
    targetConfigPath,
  };
}

module.exports = {
  migrateConfig,
  performMigration,
  applyMigrationTransformations,
  isValidConfiguration,
  checkMigrationStatus,
};
