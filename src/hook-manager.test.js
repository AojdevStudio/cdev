/**
 * Tests for hook-manager.js
 */

const fs = require('fs-extra');
const path = require('path');
const HookManager = require('./hook-manager');
const HookCategorizer = require('./hook-categorizer');
const HookSelector = require('./hook-selector');
const HookOrganizer = require('./hook-organizer');

// Mock dependencies
jest.mock('fs-extra');
jest.mock('./hook-categorizer');
jest.mock('./hook-selector');
jest.mock('./hook-organizer');

describe('HookManager', () => {
  let hookManager;
  const testProjectPath = '/test/project';
  const hooksPath = path.join(testProjectPath, '.claude', 'hooks');

  const mockHooks = [
    {
      name: 'pre_tool_use.py',
      path: '/test/project/.claude/hooks/pre_tool_use.py',
      content: '# Pre tool use hook',
      size: 100,
      modified: new Date('2024-01-01')
    },
    {
      name: 'typescript-validator.py',
      path: '/test/project/.claude/hooks/typescript-validator.py',
      content: '# TypeScript validator',
      size: 200,
      modified: new Date('2024-01-02')
    }
  ];

  const mockCategorizedHooks = {
    tier1: [{
      name: 'pre_tool_use.py',
      tier: 'tier1',
      category: 'security',
      description: 'Pre-tool validation'
    }],
    tier2: [{
      name: 'typescript-validator.py',
      tier: 'tier2',
      category: 'validation',
      description: 'TypeScript validation'
    }],
    tier3: [],
    utils: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fs-extra methods
    fs.ensureDir.mockResolvedValue();
    fs.pathExists.mockResolvedValue(true);
    fs.readdir.mockResolvedValue(['pre_tool_use.py', 'typescript-validator.py', 'README.md']);
    fs.stat.mockImplementation((filePath) => {
      const fileName = path.basename(filePath);
      if (fileName === 'README.md') {
        return Promise.resolve({ isDirectory: () => false, size: 50 });
      }
      const hook = mockHooks.find(h => h.name === fileName);
      return Promise.resolve({
        isDirectory: () => false,
        size: hook?.size || 0,
        mtime: hook?.modified || new Date()
      });
    });
    fs.readFile.mockImplementation((filePath) => {
      const fileName = path.basename(filePath);
      const hook = mockHooks.find(h => h.name === fileName);
      return Promise.resolve(hook?.content || '');
    });
    fs.copy.mockResolvedValue();
    fs.move.mockResolvedValue();

    // Mock HookCategorizer
    HookCategorizer.mockImplementation(() => ({
      categorize: jest.fn().mockResolvedValue(mockCategorizedHooks)
    }));

    // Mock HookSelector
    HookSelector.mockImplementation(() => ({
      selectHooks: jest.fn().mockReturnValue([
        mockCategorizedHooks.tier1[0],
        mockCategorizedHooks.tier2[0]
      ])
    }));

    // Mock HookOrganizer
    HookOrganizer.mockImplementation(() => ({
      organize: jest.fn().mockResolvedValue(),
      getCategorizedHooks: jest.fn().mockResolvedValue(mockCategorizedHooks)
    }));

    hookManager = new HookManager(testProjectPath);
  });

  describe('constructor', () => {
    test('initializes with project path', () => {
      expect(hookManager.projectPath).toBe(testProjectPath);
      expect(hookManager.hooksPath).toBe(hooksPath);
      expect(HookCategorizer).toHaveBeenCalled();
      expect(HookSelector).toHaveBeenCalled();
      expect(HookOrganizer).toHaveBeenCalledWith(hooksPath);
    });

    test('uses current working directory if no path provided', () => {
      const cwdManager = new HookManager();
      expect(cwdManager.projectPath).toBe(process.cwd());
    });
  });

  describe('initialize', () => {
    test('sets up hook system with tier organization', async () => {
      const result = await hookManager.initialize();

      expect(fs.ensureDir).toHaveBeenCalledWith(path.join(hooksPath, 'tier1'));
      expect(fs.ensureDir).toHaveBeenCalledWith(path.join(hooksPath, 'tier2'));
      expect(fs.ensureDir).toHaveBeenCalledWith(path.join(hooksPath, 'tier3'));
      expect(fs.ensureDir).toHaveBeenCalledWith(path.join(hooksPath, 'utils'));
      
      expect(hookManager.categorizer.categorize).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'pre_tool_use.py' }),
          expect.objectContaining({ name: 'typescript-validator.py' })
        ])
      );
      
      expect(hookManager.organizer.organize).toHaveBeenCalledWith(mockCategorizedHooks);
      expect(result).toEqual(mockCategorizedHooks);
    });

    test('handles missing hooks directory', async () => {
      fs.pathExists.mockResolvedValue(false);
      
      const result = await hookManager.initialize();
      
      expect(hookManager.categorizer.categorize).toHaveBeenCalledWith([]);
      expect(result).toEqual(mockCategorizedHooks);
    });
  });

  describe('ensureHookDirectories', () => {
    test('creates all tier directories', async () => {
      await hookManager.ensureHookDirectories();

      const expectedTiers = ['tier1', 'tier2', 'tier3', 'utils'];
      expect(fs.ensureDir).toHaveBeenCalledTimes(expectedTiers.length);
      
      expectedTiers.forEach(tier => {
        expect(fs.ensureDir).toHaveBeenCalledWith(path.join(hooksPath, tier));
      });
    });
  });

  describe('loadExistingHooks', () => {
    test('loads Python hook files', async () => {
      const hooks = await hookManager.loadExistingHooks();

      expect(hooks).toHaveLength(2);
      expect(hooks[0]).toEqual({
        name: 'pre_tool_use.py',
        path: path.join(hooksPath, 'pre_tool_use.py'),
        content: '# Pre tool use hook',
        size: 100,
        modified: expect.any(Date)
      });
    });

    test('skips non-Python files', async () => {
      fs.readdir.mockResolvedValue(['hook.py', 'README.md', 'script.sh']);
      fs.stat.mockImplementation((filePath) => {
        const fileName = path.basename(filePath);
        return Promise.resolve({
          isDirectory: () => false,
          size: 100,
          mtime: new Date()
        });
      });
      fs.readFile.mockResolvedValue('# Content');

      const hooks = await hookManager.loadExistingHooks();

      expect(hooks).toHaveLength(1);
      expect(hooks[0].name).toBe('hook.py');
    });

    test('skips directories', async () => {
      fs.readdir.mockResolvedValue(['tier1', 'hook.py']);
      fs.stat.mockImplementation((filePath) => {
        const fileName = path.basename(filePath);
        return Promise.resolve({
          isDirectory: () => fileName === 'tier1',
          size: 100,
          mtime: new Date()
        });
      });

      const hooks = await hookManager.loadExistingHooks();

      expect(hooks).toHaveLength(1);
      expect(hooks[0].name).toBe('hook.py');
    });

    test('returns empty array when hooks directory does not exist', async () => {
      fs.pathExists.mockResolvedValue(false);

      const hooks = await hookManager.loadExistingHooks();

      expect(hooks).toEqual([]);
      expect(fs.readdir).not.toHaveBeenCalled();
    });
  });

  describe('selectHooks', () => {
    test('selects hooks based on project type', async () => {
      const selected = await hookManager.selectHooks('nodejs', { tier1Only: false });

      expect(hookManager.organizer.getCategorizedHooks).toHaveBeenCalled();
      expect(hookManager.selector.selectHooks).toHaveBeenCalledWith(
        mockCategorizedHooks,
        'nodejs',
        { tier1Only: false }
      );
      
      expect(selected).toHaveLength(2);
    });

    test('passes preferences to selector', async () => {
      const preferences = {
        tier1Only: true,
        excludeCategories: ['validation']
      };

      await hookManager.selectHooks('python', preferences);

      expect(hookManager.selector.selectHooks).toHaveBeenCalledWith(
        mockCategorizedHooks,
        'python',
        preferences
      );
    });
  });

  describe('installHooks', () => {
    test('installs selected hooks to project', async () => {
      const selectedHooks = [
        {
          name: 'pre_tool_use.py',
          tier: 'tier1',
          path: '/source/pre_tool_use.py'
        },
        {
          name: 'typescript-validator.py',
          tier: 'tier2',
          currentPath: '/current/typescript-validator.py'
        }
      ];

      const installed = await hookManager.installHooks(selectedHooks);

      expect(fs.copy).toHaveBeenCalledWith(
        '/source/pre_tool_use.py',
        path.join(hooksPath, 'pre_tool_use.py')
      );
      expect(fs.copy).toHaveBeenCalledWith(
        '/current/typescript-validator.py',
        path.join(hooksPath, 'typescript-validator.py')
      );

      expect(installed).toEqual([
        {
          name: 'pre_tool_use.py',
          tier: 'tier1',
          path: path.join(hooksPath, 'pre_tool_use.py')
        },
        {
          name: 'typescript-validator.py',
          tier: 'tier2',
          path: path.join(hooksPath, 'typescript-validator.py')
        }
      ]);
    });

    test('prefers currentPath over path', async () => {
      const hook = {
        name: 'hook.py',
        tier: 'tier1',
        path: '/old/path/hook.py',
        currentPath: '/new/path/hook.py'
      };

      await hookManager.installHooks([hook]);

      expect(fs.copy).toHaveBeenCalledWith(
        '/new/path/hook.py',
        expect.any(String)
      );
    });
  });

  describe('getHookStats', () => {
    test('returns hook statistics', async () => {
      const stats = await hookManager.getHookStats();

      expect(stats).toEqual({
        total: 2,
        byTier: {
          tier1: 1,
          tier2: 1,
          tier3: 0,
          utils: 0
        },
        hooks: [
          {
            name: 'pre_tool_use.py',
            tier: 'tier1',
            category: 'security',
            description: 'Pre-tool validation'
          },
          {
            name: 'typescript-validator.py',
            tier: 'tier2',
            category: 'validation',
            description: 'TypeScript validation'
          }
        ]
      });
    });

    test('handles empty hooks', async () => {
      hookManager.organizer.getCategorizedHooks.mockResolvedValue({
        tier1: [],
        tier2: [],
        tier3: [],
        utils: []
      });

      const stats = await hookManager.getHookStats();

      expect(stats.total).toBe(0);
      expect(stats.hooks).toEqual([]);
    });
  });

  describe('restructureHooks', () => {
    test('moves hooks to tier directories', async () => {
      const result = await hookManager.restructureHooks();

      expect(fs.move).toHaveBeenCalledWith(
        path.join(hooksPath, 'pre_tool_use.py'),
        path.join(hooksPath, 'tier1', 'pre_tool_use.py'),
        { overwrite: true }
      );
      expect(fs.move).toHaveBeenCalledWith(
        path.join(hooksPath, 'typescript-validator.py'),
        path.join(hooksPath, 'tier2', 'typescript-validator.py'),
        { overwrite: true }
      );

      expect(result).toEqual(mockCategorizedHooks);
    });

    test('skips hooks already in correct location', async () => {
      const categorizedHooks = {
        tier1: [{
          name: 'pre_tool_use.py',
          path: path.join(hooksPath, 'tier1', 'pre_tool_use.py'),
          tier: 'tier1'
        }],
        tier2: [],
        tier3: [],
        utils: []
      };

      hookManager.categorizer.categorize.mockResolvedValue(categorizedHooks);

      await hookManager.restructureHooks();

      expect(fs.move).not.toHaveBeenCalled();
    });

    test('updates hook paths after moving', async () => {
      const hooks = {
        tier1: [{
          name: 'hook.py',
          path: '/old/path/hook.py'
        }],
        tier2: [],
        tier3: [],
        utils: []
      };

      hookManager.categorizer.categorize.mockResolvedValue(hooks);

      const result = await hookManager.restructureHooks();

      expect(result.tier1[0].path).toBe(path.join(hooksPath, 'tier1', 'hook.py'));
    });
  });

  describe('edge cases', () => {
    test('handles file read errors gracefully', async () => {
      fs.readFile.mockRejectedValue(new Error('Permission denied'));

      const hooks = await hookManager.loadExistingHooks();

      // Should still return hooks but with failed content reads
      expect(hooks).toHaveLength(2);
    });

    test('handles stat errors gracefully', async () => {
      fs.stat.mockRejectedValue(new Error('File not found'));

      const hooks = await hookManager.loadExistingHooks();

      expect(hooks).toEqual([]);
    });

    test('handles readdir errors gracefully', async () => {
      fs.readdir.mockRejectedValue(new Error('Directory not found'));

      await expect(hookManager.loadExistingHooks()).rejects.toThrow('Directory not found');
    });

    test('handles copy errors during installation', async () => {
      fs.copy.mockRejectedValue(new Error('Copy failed'));

      await expect(hookManager.installHooks([{
        name: 'hook.py',
        path: '/source/hook.py'
      }])).rejects.toThrow('Copy failed');
    });

    test('handles move errors during restructuring', async () => {
      fs.move.mockRejectedValue(new Error('Move failed'));

      await expect(hookManager.restructureHooks()).rejects.toThrow('Move failed');
    });
  });
});