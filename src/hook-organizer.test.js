/**
 * Tests for hook-organizer.js
 */

const fs = require('fs-extra');
const path = require('path');
const HookOrganizer = require('./hook-organizer');

// Mock fs-extra
jest.mock('fs-extra');

describe('HookOrganizer', () => {
  let organizer;
  const testHooksPath = '/test/hooks';
  const mockCategorizedHooks = {
    tier1: [{
      name: 'validator.py',
      category: 'validation',
      description: 'Validation hook',
      importance: 'critical',
      path: '/old/validator.py',
      size: 100,
      modified: new Date('2024-01-01')
    }],
    tier2: [{
      name: 'checker.py',
      category: 'checking',
      description: 'Checker hook',
      importance: 'important',
      path: '/old/checker.py',
      size: 200,
      modified: new Date('2024-01-02')
    }],
    tier3: [{
      name: 'notification.py',
      category: 'notification',
      description: 'Notification hook',
      importance: 'optional',
      path: '/old/notification.py',
      size: 150,
      modified: new Date('2024-01-03')
    }],
    utils: [{
      name: 'helper.py',
      category: 'utility',
      description: 'Helper utility',
      importance: 'utility',
      path: '/old/utils/helper.py',
      size: 50,
      modified: new Date('2024-01-04')
    }]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    fs.ensureDir.mockResolvedValue();
    fs.pathExists.mockResolvedValue(false);
    fs.readJson.mockResolvedValue({});
    fs.writeJson.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
    fs.readFile.mockResolvedValue('# Hook content');
    fs.readdir.mockResolvedValue([]);
    fs.stat.mockResolvedValue({
      isDirectory: () => false,
      size: 100,
      mtime: new Date()
    });
    fs.move.mockResolvedValue();
    
    organizer = new HookOrganizer(testHooksPath);
  });

  describe('constructor', () => {
    test('initializes with hooks path and tier paths', () => {
      expect(organizer.hooksPath).toBe(testHooksPath);
      expect(organizer.tierPaths).toEqual({
        tier1: path.join(testHooksPath, 'tier1'),
        tier2: path.join(testHooksPath, 'tier2'),
        tier3: path.join(testHooksPath, 'tier3'),
        utils: path.join(testHooksPath, 'utils')
      });
      expect(organizer.hookRegistry).toBe(path.join(testHooksPath, 'hook-registry.json'));
    });
  });

  describe('organize', () => {
    test('organizes hooks and creates registry', async () => {
      const result = await organizer.organize(mockCategorizedHooks);

      // Verify tier directories were created
      expect(fs.ensureDir).toHaveBeenCalledTimes(4);
      expect(fs.ensureDir).toHaveBeenCalledWith(organizer.tierPaths.tier1);
      expect(fs.ensureDir).toHaveBeenCalledWith(organizer.tierPaths.tier2);
      expect(fs.ensureDir).toHaveBeenCalledWith(organizer.tierPaths.tier3);
      expect(fs.ensureDir).toHaveBeenCalledWith(organizer.tierPaths.utils);

      // Verify registry was created
      expect(fs.writeJson).toHaveBeenCalledWith(
        organizer.hookRegistry,
        expect.objectContaining({
          version: '1.0.0',
          lastUpdated: expect.any(String),
          hooks: {
            'validator.py': expect.objectContaining({
              name: 'validator.py',
              tier: 'tier1',
              category: 'validation',
              currentPath: path.join(testHooksPath, 'tier1', 'validator.py')
            }),
            'checker.py': expect.objectContaining({
              name: 'checker.py',
              tier: 'tier2',
              category: 'checking',
              currentPath: path.join(testHooksPath, 'tier2', 'checker.py')
            }),
            'notification.py': expect.objectContaining({
              name: 'notification.py',
              tier: 'tier3',
              category: 'notification',
              currentPath: path.join(testHooksPath, 'tier3', 'notification.py')
            }),
            'helper.py': expect.objectContaining({
              name: 'helper.py',
              tier: 'utils',
              category: 'utility',
              currentPath: path.join(testHooksPath, 'utils', 'helper.py')
            })
          },
          tiers: {
            tier1: ['validator.py'],
            tier2: ['checker.py'],
            tier3: ['notification.py'],
            utils: ['helper.py']
          }
        }),
        { spaces: 2 }
      );
    });

    test('preserves utils subdirectory structure', async () => {
      const utilsHook = {
        name: 'llm_helper.py',
        path: path.join(testHooksPath, 'utils', 'llm', 'llm_helper.py'),
        category: 'utility'
      };

      await organizer.organize({ utils: [utilsHook], tier1: [], tier2: [], tier3: [] });

      // Verify subdirectory was ensured
      expect(fs.ensureDir).toHaveBeenCalledWith(
        path.join(testHooksPath, 'utils', 'llm')
      );
    });

    test('updates hook objects with current path', async () => {
      const hooks = JSON.parse(JSON.stringify(mockCategorizedHooks));
      await organizer.organize(hooks);

      expect(hooks.tier1[0].currentPath).toBe(path.join(testHooksPath, 'tier1', 'validator.py'));
      expect(hooks.tier2[0].currentPath).toBe(path.join(testHooksPath, 'tier2', 'checker.py'));
    });

    test('handles empty categorized hooks', async () => {
      const emptyHooks = { tier1: [], tier2: [], tier3: [], utils: [] };
      const result = await organizer.organize(emptyHooks);

      expect(result.hooks).toEqual({});
      expect(result.tiers).toEqual({
        tier1: [],
        tier2: [],
        tier3: [],
        utils: []
      });
    });
  });

  describe('ensureTierDirectories', () => {
    test('creates all tier directories', async () => {
      await organizer.ensureTierDirectories();

      expect(fs.ensureDir).toHaveBeenCalledTimes(4);
      Object.values(organizer.tierPaths).forEach(tierPath => {
        expect(fs.ensureDir).toHaveBeenCalledWith(tierPath);
      });
    });
  });

  describe('getTargetPath', () => {
    test('returns standard tier path for non-utils hooks', async () => {
      const hook = { name: 'validator.py', path: '/old/validator.py' };
      const targetPath = await organizer.getTargetPath(hook, 'tier1');

      expect(targetPath).toBe(path.join(testHooksPath, 'tier1', 'validator.py'));
    });

    test('preserves utils subdirectory structure', async () => {
      const hook = {
        name: 'helper.py',
        path: path.join(testHooksPath, 'utils', 'llm', 'helper.py')
      };
      
      const targetPath = await organizer.getTargetPath(hook, 'utils');

      expect(targetPath).toBe(path.join(testHooksPath, 'utils', 'llm', 'helper.py'));
      expect(fs.ensureDir).toHaveBeenCalledWith(path.join(testHooksPath, 'utils', 'llm'));
    });

    test('handles utils hooks without subdirectory', async () => {
      const hook = { name: 'simple.py', path: '/old/simple.py' };
      const targetPath = await organizer.getTargetPath(hook, 'utils');

      expect(targetPath).toBe(path.join(testHooksPath, 'utils', 'simple.py'));
    });
  });

  describe('getCategorizedHooks', () => {
    test('loads from registry when available', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readJson.mockResolvedValue({
        hooks: {
          'validator.py': { name: 'validator.py', tier: 'tier1' },
          'checker.py': { name: 'checker.py', tier: 'tier2' }
        }
      });

      const result = await organizer.getCategorizedHooks();

      expect(fs.readJson).toHaveBeenCalledWith(organizer.hookRegistry);
      expect(result.tier1).toHaveLength(1);
      expect(result.tier2).toHaveLength(1);
      expect(result.tier3).toHaveLength(0);
    });

    test('scans directories when no registry exists', async () => {
      fs.pathExists.mockImplementation(path => {
        return path.includes('tier1') || path.includes('tier2');
      });
      fs.readdir.mockImplementation(dirPath => {
        if (dirPath.includes('tier1')) return Promise.resolve(['validator.py']);
        if (dirPath.includes('tier2')) return Promise.resolve(['checker.py']);
        return Promise.resolve([]);
      });

      const result = await organizer.getCategorizedHooks();

      expect(result.tier1).toHaveLength(1);
      expect(result.tier1[0]).toMatchObject({
        name: 'validator.py',
        tier: 'tier1'
      });
      expect(result.tier2).toHaveLength(1);
    });

    test('handles empty directories', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readdir.mockResolvedValue([]);

      const result = await organizer.getCategorizedHooks();

      expect(result.tier1).toEqual([]);
      expect(result.tier2).toEqual([]);
      expect(result.tier3).toEqual([]);
      expect(result.utils).toEqual([]);
    });
  });

  describe('scanDirectory', () => {
    test('scans directory for Python files', async () => {
      fs.readdir.mockResolvedValue(['hook1.py', 'hook2.py', 'README.md']);
      fs.stat.mockImplementation(() => ({
        isDirectory: () => false,
        size: 100,
        mtime: new Date()
      }));

      const hooks = await organizer.scanDirectory('/test/tier1', 'tier1');

      expect(hooks).toHaveLength(2);
      expect(hooks[0]).toMatchObject({
        name: 'hook1.py',
        tier: 'tier1',
        content: '# Hook content'
      });
    });

    test('recursively scans subdirectories', async () => {
      let callCount = 0;
      fs.readdir.mockImplementation(dirPath => {
        callCount++;
        if (callCount === 1) return Promise.resolve(['subdir', 'hook1.py']);
        return Promise.resolve(['hook2.py']);
      });
      
      fs.stat.mockImplementation(itemPath => ({
        isDirectory: () => itemPath.includes('subdir'),
        size: 100,
        mtime: new Date()
      }));

      const hooks = await organizer.scanDirectory('/test/utils', 'utils');

      expect(hooks).toHaveLength(2);
      expect(hooks[0]).toMatchObject({
        name: 'hook2.py',
        subPath: 'subdir'
      });
      expect(hooks[1]).toMatchObject({
        name: 'hook1.py',
        subPath: ''
      });
    });

    test('skips non-Python files', async () => {
      fs.readdir.mockResolvedValue(['hook.py', 'script.js', 'data.json']);
      
      const hooks = await organizer.scanDirectory('/test/tier1', 'tier1');

      expect(hooks).toHaveLength(1);
      expect(hooks[0].name).toBe('hook.py');
    });
  });

  describe('moveHookToTier', () => {
    test('moves hook file and updates registry', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readJson.mockResolvedValue({
        hooks: {
          'validator.py': {
            name: 'validator.py',
            tier: 'tier2',
            currentPath: path.join(testHooksPath, 'tier2', 'validator.py')
          }
        },
        tiers: {
          tier1: [],
          tier2: ['validator.py'],
          tier3: []
        }
      });

      const newPath = await organizer.moveHookToTier('validator.py', 'tier2', 'tier1');

      expect(fs.ensureDir).toHaveBeenCalledWith(organizer.tierPaths.tier1);
      expect(fs.move).toHaveBeenCalledWith(
        path.join(testHooksPath, 'tier2', 'validator.py'),
        path.join(testHooksPath, 'tier1', 'validator.py'),
        { overwrite: true }
      );
      
      expect(fs.writeJson).toHaveBeenCalledWith(
        organizer.hookRegistry,
        expect.objectContaining({
          hooks: {
            'validator.py': expect.objectContaining({
              tier: 'tier1',
              currentPath: path.join(testHooksPath, 'tier1', 'validator.py')
            })
          },
          tiers: {
            tier1: ['validator.py'],
            tier2: [],
            tier3: []
          }
        }),
        { spaces: 2 }
      );

      expect(newPath).toBe(path.join(testHooksPath, 'tier1', 'validator.py'));
    });

    test('moves hook without registry update if registry does not exist', async () => {
      fs.pathExists.mockResolvedValue(false);

      await organizer.moveHookToTier('hook.py', 'tier3', 'tier2');

      expect(fs.move).toHaveBeenCalled();
      expect(fs.readJson).not.toHaveBeenCalled();
      expect(fs.writeJson).not.toHaveBeenCalled();
    });
  });

  describe('createTierReadmeFiles', () => {
    test('creates README files for all tiers', async () => {
      await organizer.createTierReadmeFiles();

      expect(fs.writeFile).toHaveBeenCalledTimes(4);
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(testHooksPath, 'tier1', 'README.md'),
        expect.stringContaining('Tier 1 - Critical Hooks')
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(testHooksPath, 'tier2', 'README.md'),
        expect.stringContaining('Tier 2 - Important Hooks')
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(testHooksPath, 'tier3', 'README.md'),
        expect.stringContaining('Tier 3 - Optional Hooks')
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(testHooksPath, 'utils', 'README.md'),
        expect.stringContaining('Utils - Shared Utilities')
      );
    });
  });

  describe('generateManifest', () => {
    test('generates manifest from categorized hooks', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readJson.mockResolvedValue({
        hooks: {
          'validator.py': {
            name: 'validator.py',
            tier: 'tier1',
            category: 'validation',
            description: 'Validation hook',
            size: 100
          },
          'checker.py': {
            name: 'checker.py',
            tier: 'tier2',
            category: 'checking',
            description: 'Checker hook',
            size: 200
          }
        }
      });

      const manifest = await organizer.generateManifest();

      expect(manifest).toEqual({
        version: '1.0.0',
        generated: expect.any(String),
        tiers: {
          tier1: {
            description: 'Critical security and validation hooks',
            hookCount: 1,
            hooks: [{
              name: 'validator.py',
              category: 'validation',
              description: 'Validation hook',
              size: 100
            }]
          },
          tier2: {
            description: 'Important quality and standards hooks',
            hookCount: 1,
            hooks: [{
              name: 'checker.py',
              category: 'checking',
              description: 'Checker hook',
              size: 200
            }]
          },
          tier3: {
            description: 'Optional convenience and notification hooks',
            hookCount: 0,
            hooks: []
          },
          utils: {
            description: 'Shared utilities and helper functions',
            hookCount: 0,
            hooks: []
          }
        },
        totalHooks: 2
      });
    });
  });

  describe('getTierDescription', () => {
    test('returns correct tier descriptions', () => {
      expect(organizer.getTierDescription('tier1')).toBe('Critical security and validation hooks');
      expect(organizer.getTierDescription('tier2')).toBe('Important quality and standards hooks');
      expect(organizer.getTierDescription('tier3')).toBe('Optional convenience and notification hooks');
      expect(organizer.getTierDescription('utils')).toBe('Shared utilities and helper functions');
    });

    test('returns default for unknown tier', () => {
      expect(organizer.getTierDescription('unknown')).toBe('Unknown tier');
    });
  });

  describe('edge cases', () => {
    test('handles hooks without path property', async () => {
      const hook = { name: 'test.py' };
      const targetPath = await organizer.getTargetPath(hook, 'tier1');

      expect(targetPath).toBe(path.join(testHooksPath, 'tier1', 'test.py'));
    });

    test('handles readdir errors', async () => {
      fs.readdir.mockRejectedValue(new Error('Permission denied'));

      await expect(organizer.scanDirectory('/protected', 'tier1')).rejects.toThrow('Permission denied');
    });

    test('handles readJson errors gracefully in getCategorizedHooks', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readJson.mockRejectedValue(new Error('Invalid JSON'));

      await expect(organizer.getCategorizedHooks()).rejects.toThrow('Invalid JSON');
    });

    test('handles move errors', async () => {
      fs.move.mockRejectedValue(new Error('Move failed'));

      await expect(organizer.moveHookToTier('hook.py', 'tier1', 'tier2')).rejects.toThrow('Move failed');
    });
  });
});