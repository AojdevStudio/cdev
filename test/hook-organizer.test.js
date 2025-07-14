const path = require('path');

const fs = require('fs-extra');

const HookOrganizer = require('../src/hook-organizer');

describe('HookOrganizer', () => {
  let organizer;
  let testHooksPath;

  beforeEach(async () => {
    testHooksPath = path.join(__dirname, 'tmp', 'hooks');
    await fs.ensureDir(testHooksPath);
    organizer = new HookOrganizer(testHooksPath);
  });

  afterEach(async () => {
    await fs.remove(path.join(__dirname, 'tmp'));
  });

  const mockCategorizedHooks = {
    tier1: [
      {
        name: 'validator.py',
        path: '/old/path/validator.py',
        category: 'validation',
        description: 'Test validator',
        importance: 'critical',
        size: 1000,
        modified: new Date(),
      },
    ],
    tier2: [
      {
        name: 'checker.py',
        path: '/old/path/checker.py',
        category: 'checking',
        description: 'Test checker',
        importance: 'important',
        size: 800,
        modified: new Date(),
      },
    ],
    tier3: [
      {
        name: 'helper.py',
        path: '/old/path/helper.py',
        category: 'utility',
        description: 'Test helper',
        importance: 'optional',
        size: 600,
        modified: new Date(),
      },
    ],
    utils: [],
  };

  describe('organize', () => {
    it('should create tier directories', async () => {
      await organizer.organize(mockCategorizedHooks);

      for (const tier of ['tier1', 'tier2', 'tier3', 'utils']) {
        const tierPath = path.join(testHooksPath, tier);
        expect(await fs.pathExists(tierPath)).toBe(true);
      }
    });

    it('should create hook registry', async () => {
      await organizer.organize(mockCategorizedHooks);

      const registryPath = path.join(testHooksPath, 'hook-registry.json');
      expect(await fs.pathExists(registryPath)).toBe(true);

      const registry = await fs.readJson(registryPath);
      expect(registry).toHaveProperty('version', '1.0.0');
      expect(registry).toHaveProperty('hooks');
      expect(registry).toHaveProperty('tiers');
    });

    it('should store hook information in registry', async () => {
      const registry = await organizer.organize(mockCategorizedHooks);

      expect(registry.hooks['validator.py']).toMatchObject({
        name: 'validator.py',
        tier: 'tier1',
        category: 'validation',
        description: 'Test validator',
        importance: 'critical',
      });
    });

    it('should organize hooks by tier in registry', async () => {
      const registry = await organizer.organize(mockCategorizedHooks);

      expect(registry.tiers.tier1).toContain('validator.py');
      expect(registry.tiers.tier2).toContain('checker.py');
      expect(registry.tiers.tier3).toContain('helper.py');
    });

    it('should update hook objects with current path', async () => {
      await organizer.organize(mockCategorizedHooks);

      expect(mockCategorizedHooks.tier1[0].currentPath).toBe(
        path.join(testHooksPath, 'tier1', 'validator.py'),
      );
    });
  });

  describe('getTargetPath', () => {
    it('should return standard tier path for non-utils hooks', async () => {
      const hook = { name: 'test.py', path: '/some/path/test.py' };
      const targetPath = await organizer.getTargetPath(hook, 'tier1');

      expect(targetPath).toBe(path.join(testHooksPath, 'tier1', 'test.py'));
    });

    it('should preserve utils subdirectory structure', async () => {
      await fs.ensureDir(path.join(testHooksPath, 'utils', 'llm'));

      const hook = {
        name: 'anth.py',
        path: path.join(testHooksPath, 'utils', 'llm', 'anth.py'),
      };
      const targetPath = await organizer.getTargetPath(hook, 'utils');

      expect(targetPath).toBe(path.join(testHooksPath, 'utils', 'llm', 'anth.py'));
    });
  });

  describe('getCategorizedHooks', () => {
    it('should load from registry if exists', async () => {
      // Create a registry
      await organizer.organize(mockCategorizedHooks);

      // Load categorized hooks
      const categorized = await organizer.getCategorizedHooks();

      expect(categorized.tier1).toHaveLength(1);
      expect(categorized.tier1[0].name).toBe('validator.py');
    });

    it('should scan directories if no registry', async () => {
      // Create hook files without registry
      await fs.ensureDir(path.join(testHooksPath, 'tier1'));
      await fs.writeFile(path.join(testHooksPath, 'tier1', 'test.py'), '# Test hook');

      const categorized = await organizer.getCategorizedHooks();

      expect(categorized.tier1).toHaveLength(1);
      expect(categorized.tier1[0].name).toBe('test.py');
    });
  });

  describe('scanDirectory', () => {
    it('should recursively scan directories', async () => {
      const utilsPath = path.join(testHooksPath, 'utils');
      await fs.ensureDir(path.join(utilsPath, 'llm'));
      await fs.ensureDir(path.join(utilsPath, 'tts'));

      await fs.writeFile(path.join(utilsPath, 'llm', 'anth.py'), '# LLM util');
      await fs.writeFile(path.join(utilsPath, 'tts', 'openai.py'), '# TTS util');

      const hooks = await organizer.scanDirectory(utilsPath, 'utils');

      expect(hooks).toHaveLength(2);
      expect(hooks.find((h) => h.name === 'anth.py')).toBeDefined();
      expect(hooks.find((h) => h.name === 'openai.py')).toBeDefined();
    });

    it('should ignore non-Python files', async () => {
      const tierPath = path.join(testHooksPath, 'tier1');
      await fs.ensureDir(tierPath);

      await fs.writeFile(path.join(tierPath, 'hook.py'), '# Python hook');
      await fs.writeFile(path.join(tierPath, 'readme.txt'), 'Not a hook');

      const hooks = await organizer.scanDirectory(tierPath, 'tier1');

      expect(hooks).toHaveLength(1);
      expect(hooks[0].name).toBe('hook.py');
    });
  });

  describe('moveHookToTier', () => {
    it('should move hook between tiers', async () => {
      // Create initial structure
      await organizer.organize(mockCategorizedHooks);

      // Create actual hook file
      const tier3Path = path.join(testHooksPath, 'tier3');
      const hookPath = path.join(tier3Path, 'helper.py');
      await fs.writeFile(hookPath, '# Helper hook');

      // Move to tier2
      const newPath = await organizer.moveHookToTier('helper.py', 'tier3', 'tier2');

      expect(newPath).toBe(path.join(testHooksPath, 'tier2', 'helper.py'));
      expect(await fs.pathExists(newPath)).toBe(true);
      expect(await fs.pathExists(hookPath)).toBe(false);
    });

    it('should update registry when moving hooks', async () => {
      await organizer.organize(mockCategorizedHooks);

      // Create actual hook file
      await fs.writeFile(path.join(testHooksPath, 'tier3', 'helper.py'), '# Helper hook');

      await organizer.moveHookToTier('helper.py', 'tier3', 'tier2');

      const registry = await fs.readJson(path.join(testHooksPath, 'hook-registry.json'));
      expect(registry.hooks['helper.py'].tier).toBe('tier2');
      expect(registry.tiers.tier2).toContain('helper.py');
      expect(registry.tiers.tier3).not.toContain('helper.py');
    });
  });

  describe('createTierReadmeFiles', () => {
    it('should create README files for all tiers', async () => {
      await organizer.ensureTierDirectories();
      await organizer.createTierReadmeFiles();

      for (const tier of ['tier1', 'tier2', 'tier3', 'utils']) {
        const readmePath = path.join(testHooksPath, tier, 'README.md');
        expect(await fs.pathExists(readmePath)).toBe(true);

        const content = await fs.readFile(readmePath, 'utf-8');
        expect(content).toContain(`# ${tier === 'utils' ? 'Utils' : 'Tier'}`);
      }
    });
  });

  describe('generateManifest', () => {
    it('should generate hook manifest', async () => {
      await organizer.organize(mockCategorizedHooks);

      const manifest = await organizer.generateManifest();

      expect(manifest).toHaveProperty('version', '1.0.0');
      expect(manifest).toHaveProperty('generated');
      expect(manifest).toHaveProperty('tiers');
      expect(manifest).toHaveProperty('totalHooks', 3);

      expect(manifest.tiers.tier1).toMatchObject({
        description: 'Critical security and validation hooks',
        hookCount: 1,
      });
    });
  });

  describe('getTierDescription', () => {
    it('should return correct tier descriptions', () => {
      expect(organizer.getTierDescription('tier1')).toBe('Critical security and validation hooks');
      expect(organizer.getTierDescription('tier2')).toBe('Important quality and standards hooks');
      expect(organizer.getTierDescription('tier3')).toBe(
        'Optional convenience and notification hooks',
      );
      expect(organizer.getTierDescription('utils')).toBe('Shared utilities and helper functions');
      expect(organizer.getTierDescription('unknown')).toBe('Unknown tier');
    });
  });
});
