const fs = require('fs');
const path = require('path');

const {
  migrateConfig,
  performMigration,
  applyMigrationTransformations,
  isValidConfiguration,
  checkMigrationStatus,
} = require('../src/config-migrator');

// Mock fs module
jest.mock('fs');

describe('Config Migrator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('migrateConfig', () => {
    const projectPath = '/test/project';
    const localConfigPath = '/test/project/.claude/settings.local.json';
    const targetConfigPath = '/test/project/.claude/settings.json';

    it('should migrate settings.local.json to settings.json', async () => {
      const sourceConfig = {
        version: '0.9',
        hooks: { pre_tool_use: 'echo "old"' },
        env: { TEST: 'value' },
      };

      fs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
      fs.readFileSync.mockReturnValue(JSON.stringify(sourceConfig));
      fs.writeFileSync.mockImplementation(() => {});

      const result = await migrateConfig(projectPath);

      expect(result.migrated).toBe(true);
      expect(result.source).toBe(localConfigPath);
      expect(result.target).toBe(targetConfigPath);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should create backup if target exists', async () => {
      const sourceConfig = { version: '1.0' };
      const targetConfig = { version: '0.9', existing: true };

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync
        .mockReturnValueOnce(JSON.stringify(sourceConfig))
        .mockReturnValueOnce(JSON.stringify(targetConfig));
      fs.copyFileSync.mockImplementation(() => {});
      fs.writeFileSync.mockImplementation(() => {});

      const result = await migrateConfig(projectPath);

      expect(result.backup).toMatch(/settings\.json\.backup\.\d+$/);
      expect(fs.copyFileSync).toHaveBeenCalled();
    });

    it('should return warning if no source file exists', async () => {
      fs.existsSync.mockReturnValue(false);

      const result = await migrateConfig(projectPath);

      expect(result.migrated).toBe(false);
      expect(result.warnings).toContain('No settings.local.json found to migrate');
    });

    it('should remove source file if removeSource option is true', async () => {
      const sourceConfig = { version: '1.0' };

      fs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
      fs.readFileSync.mockReturnValue(JSON.stringify(sourceConfig));
      fs.writeFileSync.mockImplementation(() => {});
      fs.unlinkSync.mockImplementation(() => {});

      const result = await migrateConfig(projectPath, { removeSource: true });

      expect(fs.unlinkSync).toHaveBeenCalledWith(localConfigPath);
      expect(result.changes).toContain('Removed settings.local.json after successful migration');
    });

    it('should archive source file if archiveSource option is true', async () => {
      const sourceConfig = { version: '1.0' };

      fs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
      fs.readFileSync.mockReturnValue(JSON.stringify(sourceConfig));
      fs.writeFileSync.mockImplementation(() => {});
      fs.renameSync.mockImplementation(() => {});

      const result = await migrateConfig(projectPath, { archiveSource: true });

      expect(fs.renameSync).toHaveBeenCalled();
      expect(result.changes).toContainEqual(
        expect.stringMatching(/Archived settings\.local\.json/),
      );
    });

    it('should throw error if migration results in invalid config', async () => {
      const sourceConfig = {}; // Invalid - missing version

      fs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
      fs.readFileSync.mockReturnValue(JSON.stringify(sourceConfig));

      await expect(migrateConfig(projectPath)).rejects.toThrow(
        'Migration resulted in invalid configuration',
      );
    });
  });

  describe('performMigration', () => {
    it('should track new and merged keys', () => {
      const source = {
        version: '1.0',
        newKey: 'value',
        existingKey: 'new value',
      };
      const target = {
        existingKey: 'old value',
        targetOnly: 'keep',
      };
      const result = { changes: [] };

      const migrated = performMigration(source, target, result);

      expect(result.changes).toContain('Added new keys: version, newKey');
      expect(result.changes).toContain('Merged existing keys: existingKey');
      expect(migrated.targetOnly).toBe('keep');
      expect(migrated.newKey).toBe('value');
      expect(migrated.existingKey).toBe('new value');
    });
  });

  describe('applyMigrationTransformations', () => {
    it('should transform string hooks to array format', () => {
      const config = {
        hooks: {
          pre_tool_use: 'echo "single"',
          post_tool_use: ['echo "array"'],
        },
      };
      const result = { changes: [] };

      const transformed = applyMigrationTransformations(config, result);

      expect(transformed.hooks.pre_tool_use).toEqual([
        { command: 'echo "single"', blocking: true },
      ]);
      expect(transformed.hooks.post_tool_use).toHaveLength(1);
      expect(result.changes).toContain('Transformed legacy hook formats to current format');
    });

    it('should migrate env to environment', () => {
      const config = {
        env: { OLD_VAR: 'value' },
      };
      const result = { changes: [] };

      const transformed = applyMigrationTransformations(config, result);

      expect(transformed.environment).toEqual({ OLD_VAR: 'value' });
      expect(transformed.env).toBeUndefined();
      expect(result.changes).toContain('Migrated "env" to "environment"');
    });

    it('should add version field if missing', () => {
      const config = { hooks: {} };
      const result = { changes: [] };

      const transformed = applyMigrationTransformations(config, result);

      expect(transformed.version).toBe('1.0');
      expect(result.changes).toContain('Added version field');
    });
  });

  describe('isValidConfiguration', () => {
    it('should validate correct configuration', () => {
      const config = {
        version: '1.0',
        hooks: {
          pre_tool_use: [],
        },
      };

      expect(isValidConfiguration(config)).toBe(true);
    });

    it('should reject invalid configurations', () => {
      expect(isValidConfiguration(null)).toBe(false);
      expect(isValidConfiguration({})).toBe(false); // Missing version
      expect(isValidConfiguration({ version: '1.0', hooks: 'invalid' })).toBe(false);
      expect(isValidConfiguration({ version: '1.0', hooks: { pre: 'not array' } })).toBe(false);
    });
  });

  describe('checkMigrationStatus', () => {
    it('should check if migration is needed', () => {
      const projectPath = '/test/project';

      fs.existsSync
        .mockReturnValueOnce(true) // settings.local.json exists
        .mockReturnValueOnce(false); // settings.json doesn't exist

      const status = checkMigrationStatus(projectPath);

      expect(status.hasLocalConfig).toBe(true);
      expect(status.hasTargetConfig).toBe(false);
      expect(status.needsMigration).toBe(true);
      expect(status.localConfigPath).toBe('/test/project/.claude/settings.local.json');
      expect(status.targetConfigPath).toBe('/test/project/.claude/settings.json');
    });

    it('should indicate no migration needed if local config absent', () => {
      const projectPath = '/test/project';

      fs.existsSync.mockReturnValue(false);

      const status = checkMigrationStatus(projectPath);

      expect(status.hasLocalConfig).toBe(false);
      expect(status.needsMigration).toBe(false);
    });
  });
});
