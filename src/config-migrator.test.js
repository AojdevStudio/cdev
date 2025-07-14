/**
 * Tests for config-migrator.js
 */

const fs = require('fs');
const path = require('path');

const {
  migrateConfig,
  performMigration,
  applyMigrationTransformations,
  isValidConfiguration,
  checkMigrationStatus,
} = require('./config-migrator');
const { deepMerge } = require('./config-generator');

// Mock dependencies
jest.mock('fs');
jest.mock('./config-generator');

describe('ConfigMigrator', () => {
  const testProjectPath = '/test/project';
  const claudeDir = path.join(testProjectPath, '.claude');
  const localConfigPath = path.join(claudeDir, 'settings.local.json');
  const targetConfigPath = path.join(claudeDir, 'settings.json');

  const mockSourceConfig = {
    version: '0.9',
    hooks: {
      pre: 'old-hook-format',
      post: ['hook1', 'hook2'],
    },
    env: {
      NODE_ENV: 'development',
    },
    customSettings: {
      feature: true,
    },
  };

  const mockTargetConfig = {
    version: '1.0',
    hooks: {
      pre: [{ command: 'existing-hook', blocking: true }],
    },
    existingSettings: {
      value: 42,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    deepMerge.mockImplementation((target, source) => ({
      ...target,
      ...source,
    }));
  });

  describe('migrateConfig', () => {
    test('handles missing source file gracefully', async () => {
      fs.existsSync.mockReturnValue(false);

      const result = await migrateConfig(testProjectPath);

      expect(result).toEqual({
        migrated: false,
        source: localConfigPath,
        target: targetConfigPath,
        backup: null,
        changes: [],
        warnings: ['No settings.local.json found to migrate'],
      });
    });

    test('performs basic migration without existing target', async () => {
      fs.existsSync.mockImplementation((path) => path === localConfigPath);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockSourceConfig));
      fs.writeFileSync.mockImplementation();

      const result = await migrateConfig(testProjectPath);

      expect(result.migrated).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalledWith(targetConfigPath, expect.any(String), 'utf8');
    });

    test('creates backup when target exists', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation((path) => {
        if (path === localConfigPath) {
          return JSON.stringify(mockSourceConfig);
        }
        if (path === targetConfigPath) {
          return JSON.stringify(mockTargetConfig);
        }
      });
      fs.copyFileSync.mockImplementation();
      fs.writeFileSync.mockImplementation();

      const result = await migrateConfig(testProjectPath);

      expect(result.backup).toMatch(/settings\.json\.backup\.\d+$/);
      expect(fs.copyFileSync).toHaveBeenCalledWith(targetConfigPath, result.backup);
    });

    test('skips backup when option is false', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation((path) => {
        if (path === localConfigPath) {
          return JSON.stringify(mockSourceConfig);
        }
        if (path === targetConfigPath) {
          return JSON.stringify(mockTargetConfig);
        }
      });

      const result = await migrateConfig(testProjectPath, { backup: false });

      expect(result.backup).toBeNull();
      expect(fs.copyFileSync).not.toHaveBeenCalled();
    });

    test('removes source file when removeSource option is true', async () => {
      fs.existsSync.mockImplementation((path) => path === localConfigPath);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockSourceConfig));
      fs.unlinkSync.mockImplementation();

      const result = await migrateConfig(testProjectPath, { removeSource: true });

      expect(fs.unlinkSync).toHaveBeenCalledWith(localConfigPath);
      expect(result.changes).toContain('Removed settings.local.json after successful migration');
    });

    test('archives source file when archiveSource option is true', async () => {
      fs.existsSync.mockImplementation((path) => path === localConfigPath);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockSourceConfig));
      fs.renameSync.mockImplementation();

      const result = await migrateConfig(testProjectPath, { archiveSource: true });

      expect(fs.renameSync).toHaveBeenCalledWith(
        localConfigPath,
        expect.stringMatching(/settings\.local\.json\.migrated\.\d+$/),
      );
      expect(result.changes).toContain(expect.stringMatching(/^Archived settings\.local\.json to/));
    });

    test('handles invalid source JSON', async () => {
      fs.existsSync.mockImplementation((path) => path === localConfigPath);
      fs.readFileSync.mockReturnValue('invalid json');

      await expect(migrateConfig(testProjectPath)).rejects.toThrow(
        'Failed to read settings.local.json',
      );
    });

    test('handles invalid target JSON gracefully', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation((path) => {
        if (path === localConfigPath) {
          return JSON.stringify(mockSourceConfig);
        }
        if (path === targetConfigPath) {
          return 'invalid json';
        }
      });

      const result = await migrateConfig(testProjectPath);

      expect(result.warnings).toContain(
        expect.stringMatching(/Existing settings\.json is invalid/),
      );
      expect(result.migrated).toBe(true);
    });

    test('validates migrated configuration', async () => {
      fs.existsSync.mockImplementation((path) => path === localConfigPath);
      fs.readFileSync.mockReturnValue(JSON.stringify({ invalid: 'config' }));

      await expect(migrateConfig(testProjectPath)).rejects.toThrow(
        'Migration resulted in invalid configuration',
      );
    });
  });

  describe('performMigration', () => {
    test('tracks new keys being added', () => {
      const source = { newKey1: 'value1', newKey2: 'value2' };
      const target = { existingKey: 'value' };
      const result = { changes: [], warnings: [] };

      performMigration(source, target, result);

      expect(result.changes).toContain('Added new keys: newKey1, newKey2');
    });

    test('tracks merged keys', () => {
      const source = { sharedKey: 'newValue', uniqueKey: 'value' };
      const target = { sharedKey: 'oldValue', otherKey: 'value' };
      const result = { changes: [], warnings: [] };

      performMigration(source, target, result);

      expect(result.changes).toContain('Merged existing keys: sharedKey');
    });

    test('applies transformations to merged config', () => {
      const source = { env: { test: true } };
      const target = {};
      const result = { changes: [], warnings: [] };

      const migrated = performMigration(source, target, result);

      expect(migrated.environment).toEqual({ test: true });
      expect(migrated.env).toBeUndefined();
    });
  });

  describe('applyMigrationTransformations', () => {
    test('transforms string hooks to array format', () => {
      const config = {
        hooks: {
          pre: 'single-hook',
          post: ['already-array'],
        },
      };
      const result = { changes: [] };

      const transformed = applyMigrationTransformations(config, result);

      expect(transformed.hooks.pre).toEqual([{ command: 'single-hook', blocking: true }]);
      expect(transformed.hooks.post).toEqual([{ command: 'already-array', blocking: true }]);
      expect(result.changes).toContain('Transformed legacy hook formats to current format');
    });

    test('transforms hook arrays with string elements', () => {
      const config = {
        hooks: {
          pre: ['hook1', { command: 'hook2', blocking: false }],
        },
      };
      const result = { changes: [] };

      const transformed = applyMigrationTransformations(config, result);

      expect(transformed.hooks.pre).toEqual([
        { command: 'hook1', blocking: true },
        { command: 'hook2', blocking: false },
      ]);
    });

    test('migrates env to environment', () => {
      const config = {
        env: { NODE_ENV: 'production' },
      };
      const result = { changes: [] };

      const transformed = applyMigrationTransformations(config, result);

      expect(transformed.environment).toEqual({ NODE_ENV: 'production' });
      expect(transformed.env).toBeUndefined();
      expect(result.changes).toContain('Migrated "env" to "environment"');
    });

    test('does not migrate if environment already exists', () => {
      const config = {
        env: { OLD_ENV: 'value' },
        environment: { NODE_ENV: 'production' },
      };
      const result = { changes: [] };

      const transformed = applyMigrationTransformations(config, result);

      expect(transformed.environment).toEqual({ NODE_ENV: 'production' });
      expect(transformed.env).toEqual({ OLD_ENV: 'value' });
      expect(result.changes).not.toContain('Migrated "env" to "environment"');
    });

    test('adds version field if missing', () => {
      const config = { hooks: {} };
      const result = { changes: [] };

      const transformed = applyMigrationTransformations(config, result);

      expect(transformed.version).toBe('1.0');
      expect(result.changes).toContain('Added version field');
    });

    test('preserves existing version', () => {
      const config = { version: '2.0' };
      const result = { changes: [] };

      const transformed = applyMigrationTransformations(config, result);

      expect(transformed.version).toBe('2.0');
      expect(result.changes).not.toContain('Added version field');
    });

    test('creates deep clone to avoid mutations', () => {
      const config = { nested: { value: 1 } };
      const result = { changes: [] };

      const transformed = applyMigrationTransformations(config, result);
      transformed.nested.value = 2;

      expect(config.nested.value).toBe(1);
    });
  });

  describe('isValidConfiguration', () => {
    test('validates correct configuration', () => {
      const config = {
        version: '1.0',
        hooks: {
          pre: [{ command: 'hook', blocking: true }],
        },
      };

      expect(isValidConfiguration(config)).toBe(true);
    });

    test('rejects non-object configurations', () => {
      expect(isValidConfiguration(null)).toBe(false);
      expect(isValidConfiguration('string')).toBe(false);
      expect(isValidConfiguration(123)).toBe(false);
      expect(isValidConfiguration(undefined)).toBe(false);
    });

    test('requires version field', () => {
      const config = { hooks: {} };

      expect(isValidConfiguration(config)).toBe(false);
    });

    test('validates hooks structure', () => {
      const invalidHooks1 = { version: '1.0', hooks: 'not-object' };
      const invalidHooks2 = { version: '1.0', hooks: { pre: 'not-array' } };
      const validHooks = { version: '1.0', hooks: { pre: [] } };

      expect(isValidConfiguration(invalidHooks1)).toBe(false);
      expect(isValidConfiguration(invalidHooks2)).toBe(false);
      expect(isValidConfiguration(validHooks)).toBe(true);
    });

    test('allows missing hooks', () => {
      const config = { version: '1.0' };

      expect(isValidConfiguration(config)).toBe(true);
    });
  });

  describe('checkMigrationStatus', () => {
    test('detects when migration is needed', () => {
      fs.existsSync.mockImplementation((path) => path === localConfigPath);

      const status = checkMigrationStatus(testProjectPath);

      expect(status).toEqual({
        hasLocalConfig: true,
        hasTargetConfig: false,
        needsMigration: true,
        localConfigPath,
        targetConfigPath,
      });
    });

    test('detects when both configs exist', () => {
      fs.existsSync.mockReturnValue(true);

      const status = checkMigrationStatus(testProjectPath);

      expect(status).toEqual({
        hasLocalConfig: true,
        hasTargetConfig: true,
        needsMigration: false,
        localConfigPath,
        targetConfigPath,
      });
    });

    test('detects when no configs exist', () => {
      fs.existsSync.mockReturnValue(false);

      const status = checkMigrationStatus(testProjectPath);

      expect(status).toEqual({
        hasLocalConfig: false,
        hasTargetConfig: false,
        needsMigration: false,
        localConfigPath,
        targetConfigPath,
      });
    });

    test('detects when only target exists', () => {
      fs.existsSync.mockImplementation((path) => path === targetConfigPath);

      const status = checkMigrationStatus(testProjectPath);

      expect(status).toEqual({
        hasLocalConfig: false,
        hasTargetConfig: true,
        needsMigration: false,
        localConfigPath,
        targetConfigPath,
      });
    });
  });

  describe('edge cases', () => {
    test('handles empty configurations', () => {
      const result = { changes: [] };
      const migrated = performMigration({}, {}, result);

      expect(migrated).toBeDefined();
      expect(migrated.version).toBe('1.0');
    });

    test('handles nested hook structures', () => {
      const config = {
        hooks: {
          pre: {
            nested: ['should-become-array'],
          },
        },
      };
      const result = { changes: [] };

      const transformed = applyMigrationTransformations(config, result);

      // Non-array hooks should be preserved as-is (invalid structure)
      expect(transformed.hooks.pre).toEqual({
        nested: ['should-become-array'],
      });
    });

    test('handles multiple transformation passes', () => {
      const config = {
        env: { test: true },
        hooks: { pre: 'hook' },
      };
      const result = { changes: [] };

      const transformed = applyMigrationTransformations(config, result);

      expect(transformed.environment).toEqual({ test: true });
      expect(transformed.hooks.pre).toEqual([{ command: 'hook', blocking: true }]);
      expect(transformed.version).toBe('1.0');
      expect(result.changes).toHaveLength(3);
    });
  });
});
