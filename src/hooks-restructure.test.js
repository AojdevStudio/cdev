/**
 * Tests for HooksRestructure
 */

const path = require('path');

const fs = require('fs-extra');

const { createMockFileSystem } = require('../test/utils/mock-factory');

const HooksRestructure = require('./hooks-restructure');
const HookManager = require('./hook-manager');

// Mock dependencies
jest.mock('fs-extra');
jest.mock('./hook-manager');

describe('HooksRestructure', () => {
  let hooksRestructure;
  let mockHookManager;
  const testProjectPath = '/test/project';
  const testHooksPath = '/test/project/.claude/hooks';
  const testBackupPath = '/test/project/.claude/hooks-backup';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Setup mock HookManager
    mockHookManager = {
      loadExistingHooks: jest.fn(),
      categorizer: {
        categorize: jest.fn(),
      },
      organizer: {
        createTierReadmeFiles: jest.fn(),
        generateManifest: jest.fn(),
      },
      initialize: jest.fn(),
    };

    HookManager.mockImplementation(() => mockHookManager);

    // Create instance
    hooksRestructure = new HooksRestructure(testProjectPath);
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('constructor', () => {
    test('initializes with correct paths', () => {
      expect(hooksRestructure.projectPath).toBe(testProjectPath);
      expect(hooksRestructure.hooksPath).toBe(testHooksPath);
      expect(hooksRestructure.backupPath).toBe(testBackupPath);
      expect(HookManager).toHaveBeenCalledWith(testProjectPath);
    });

    test('uses current working directory if no path provided', () => {
      const originalCwd = process.cwd();
      process.cwd = jest.fn(() => '/current/dir');

      const instance = new HooksRestructure();
      expect(instance.projectPath).toBe('/current/dir');

      process.cwd = originalCwd;
    });
  });

  describe('restructure', () => {
    const mockExistingHooks = [
      { name: 'pre_tool_use.py', path: '/test/project/.claude/hooks/pre_tool_use.py' },
      { name: 'api_validation.py', path: '/test/project/.claude/hooks/api_validation.py' },
    ];

    const mockCategorizedHooks = {
      tier1: [{ name: 'pre_tool_use.py', path: '/test/project/.claude/hooks/pre_tool_use.py' }],
      tier2: [{ name: 'api_validation.py', path: '/test/project/.claude/hooks/api_validation.py' }],
      tier3: [],
      utils: [],
    };

    beforeEach(() => {
      mockHookManager.loadExistingHooks.mockResolvedValue(mockExistingHooks);
      mockHookManager.categorizer.categorize.mockResolvedValue(mockCategorizedHooks);
      mockHookManager.organizer.generateManifest.mockResolvedValue({ version: '1.0.0', hooks: {} });

      fs.pathExists.mockResolvedValue(false);
      fs.copy.mockResolvedValue();
      fs.ensureDir.mockResolvedValue();
      fs.move.mockResolvedValue();
      fs.writeJson.mockResolvedValue();
    });

    test('performs restructuring with backup', async () => {
      const result = await hooksRestructure.restructure({ backup: true });

      expect(mockHookManager.loadExistingHooks).toHaveBeenCalled();
      expect(mockHookManager.categorizer.categorize).toHaveBeenCalledWith(mockExistingHooks);
      expect(fs.copy).toHaveBeenCalledWith(testHooksPath, testBackupPath);
      expect(mockHookManager.organizer.createTierReadmeFiles).toHaveBeenCalled();
      expect(mockHookManager.organizer.generateManifest).toHaveBeenCalled();
      expect(fs.writeJson).toHaveBeenCalledWith(
        path.join(testHooksPath, 'hooks-manifest.json'),
        expect.any(Object),
        { spaces: 2 },
      );

      expect(result.created).toContain('/test/project/.claude/hooks/tier1');
      expect(result.created).toContain('/test/project/.claude/hooks/tier2');
      expect(result.created).toContain('/test/project/.claude/hooks/tier3');
    });

    test('performs dry run without making changes', async () => {
      const result = await hooksRestructure.restructure({ dryRun: true });

      expect(mockHookManager.loadExistingHooks).toHaveBeenCalled();
      expect(mockHookManager.categorizer.categorize).toHaveBeenCalled();
      expect(fs.copy).not.toHaveBeenCalled();
      expect(fs.move).not.toHaveBeenCalled();
      expect(fs.writeJson).not.toHaveBeenCalled();

      expect(result.moves).toBeDefined();
      expect(result.creates).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    test('skips backup when backup option is false', async () => {
      await hooksRestructure.restructure({ backup: false });

      expect(fs.copy).not.toHaveBeenCalledWith(testHooksPath, testBackupPath);
    });

    test('handles errors during restructuring', async () => {
      fs.move.mockRejectedValueOnce(new Error('Permission denied'));

      const result = await hooksRestructure.restructure();

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        action: 'move',
        error: 'Permission denied',
      });
    });
  });

  describe('createBackup', () => {
    test('creates backup of hooks directory', async () => {
      fs.pathExists.mockResolvedValue(false);

      await hooksRestructure.createBackup();

      expect(fs.copy).toHaveBeenCalledWith(testHooksPath, testBackupPath);
    });

    test('renames existing backup with timestamp', async () => {
      fs.pathExists.mockResolvedValue(true);
      const mockDate = new Date('2023-01-01T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      await hooksRestructure.createBackup();

      expect(fs.move).toHaveBeenCalledWith(
        testBackupPath,
        expect.stringContaining('hooks-backup-2023-01-01T12-00-00-000Z'),
      );
      expect(fs.copy).toHaveBeenCalledWith(testHooksPath, testBackupPath);

      global.Date.mockRestore();
    });
  });

  describe('generateRestructuringPlan', () => {
    test('creates plan for moving hooks to tiers', () => {
      const categorizedHooks = {
        tier1: [{ name: 'pre_tool_use.py', path: '/test/project/.claude/hooks/pre_tool_use.py' }],
        tier2: [
          { name: 'api_validation.py', path: '/test/project/.claude/hooks/api_validation.py' },
        ],
        tier3: [],
        utils: [{ name: 'helper.py', path: '/test/project/.claude/hooks/utils/helper.py' }],
      };

      const plan = hooksRestructure.generateRestructuringPlan(categorizedHooks);

      expect(plan.moves).toHaveLength(2);
      expect(plan.moves[0]).toMatchObject({
        hook: 'pre_tool_use.py',
        from: '/test/project/.claude/hooks/pre_tool_use.py',
        to: '/test/project/.claude/hooks/tier1/pre_tool_use.py',
        tier: 'tier1',
      });

      expect(plan.preserves).toHaveLength(1);
      expect(plan.preserves[0]).toMatchObject({
        hook: 'helper.py',
        reason: 'Already in correct utils subdirectory',
      });

      expect(plan.creates).toHaveLength(3);
      expect(plan.summary).toEqual({
        tier1: 1,
        tier2: 1,
        tier3: 0,
        utils: 1,
        total: 3,
      });
    });

    test('preserves hooks already in correct location', () => {
      const categorizedHooks = {
        tier1: [
          { name: 'pre_tool_use.py', path: '/test/project/.claude/hooks/tier1/pre_tool_use.py' },
        ],
        tier2: [],
        tier3: [],
        utils: [],
      };

      const plan = hooksRestructure.generateRestructuringPlan(categorizedHooks);

      expect(plan.moves).toHaveLength(0);
      expect(plan.preserves).toHaveLength(1);
      expect(plan.preserves[0].reason).toBe('Already in correct location');
    });
  });

  describe('executePlan', () => {
    const mockPlan = {
      creates: [
        { type: 'directory', path: '/test/project/.claude/hooks/tier1' },
        { type: 'directory', path: '/test/project/.claude/hooks/tier2' },
      ],
      moves: [
        {
          hook: 'pre_tool_use.py',
          from: '/test/project/.claude/hooks/pre_tool_use.py',
          to: '/test/project/.claude/hooks/tier1/pre_tool_use.py',
          tier: 'tier1',
        },
      ],
      preserves: [],
    };

    test('executes plan successfully', async () => {
      fs.ensureDir.mockResolvedValue();
      fs.move.mockResolvedValue();

      const result = await hooksRestructure.executePlan(mockPlan);

      expect(fs.ensureDir).toHaveBeenCalledTimes(3); // 2 creates + 1 for move target
      expect(fs.move).toHaveBeenCalledWith(
        '/test/project/.claude/hooks/pre_tool_use.py',
        '/test/project/.claude/hooks/tier1/pre_tool_use.py',
        { overwrite: false },
      );
      expect(mockHookManager.initialize).toHaveBeenCalled();

      expect(result).toEqual({
        created: ['/test/project/.claude/hooks/tier1', '/test/project/.claude/hooks/tier2'],
        moved: ['pre_tool_use.py'],
        preserved: 0,
        errors: [],
      });
    });

    test('handles errors during execution', async () => {
      fs.ensureDir.mockRejectedValueOnce(new Error('Permission denied'));
      fs.move.mockRejectedValueOnce(new Error('File exists'));

      const result = await hooksRestructure.executePlan(mockPlan);

      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toMatchObject({
        action: 'create',
        path: '/test/project/.claude/hooks/tier1',
        error: 'Permission denied',
      });
      expect(result.errors[1]).toMatchObject({
        action: 'move',
        hook: 'pre_tool_use.py',
        error: 'File exists',
      });
    });
  });

  describe('restoreFromBackup', () => {
    test('restores hooks from backup', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.remove.mockResolvedValue();
      fs.copy.mockResolvedValue();

      await hooksRestructure.restoreFromBackup();

      expect(fs.remove).toHaveBeenCalledWith(testHooksPath);
      expect(fs.copy).toHaveBeenCalledWith(testBackupPath, testHooksPath);
    });

    test('throws error if no backup exists', async () => {
      fs.pathExists.mockResolvedValue(false);

      await expect(hooksRestructure.restoreFromBackup()).rejects.toThrow(
        'No backup found. Cannot restore.',
      );
    });
  });

  describe('verify', () => {
    test('verifies valid hook structure', async () => {
      fs.pathExists.mockImplementation((path) =>
        Promise.resolve(
          path.includes('tier1') ||
            path.includes('tier2') ||
            path.includes('tier3') ||
            path.includes('utils') ||
            path.includes('hook-registry.json'),
        ),
      );

      fs.readdir.mockResolvedValue(['tier1', 'tier2', 'tier3', 'utils', 'hook-registry.json']);
      fs.stat.mockResolvedValue({ isDirectory: jest.fn(() => true) });

      const result = await hooksRestructure.verify();

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    test('detects missing tier directories', async () => {
      fs.pathExists.mockImplementation((path) => Promise.resolve(!path.includes('tier2')));

      const result = await hooksRestructure.verify();

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Missing tier directory: tier2');
    });

    test('detects hooks in root directory', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readdir.mockResolvedValue(['tier1', 'tier2', 'tier3', 'utils', 'stray_hook.py']);
      fs.stat.mockImplementation((path) => ({
        isDirectory: jest.fn(() => !path.endsWith('.py')),
      }));

      const result = await hooksRestructure.verify();

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Hook in root directory: stray_hook.py');
    });
  });

  describe('displayPlan', () => {
    test('displays restructuring plan to console', () => {
      const plan = {
        creates: [{ path: '/test/tier1' }],
        moves: [
          {
            hook: 'test.py',
            from: '/old/path',
            to: '/new/path',
            tier: 'tier1',
          },
        ],
        preserves: [
          {
            hook: 'preserved.py',
            reason: 'Already in correct location',
          },
        ],
        summary: {
          tier1: 1,
          tier2: 0,
          tier3: 0,
          utils: 0,
          total: 1,
        },
      };

      hooksRestructure.displayPlan(plan);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Restructuring Plan'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('/test/tier1'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('test.py'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('preserved.py'));
    });
  });

  describe('displaySummary', () => {
    test('displays restructuring summary', () => {
      const result = {
        created: ['dir1', 'dir2'],
        moved: ['hook1', 'hook2'],
        preserved: 3,
        errors: [
          {
            action: 'move',
            hook: 'error.py',
            error: 'Permission denied',
          },
        ],
      };

      hooksRestructure.displaySummary(result);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Directories created: 2'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Hooks moved: 2'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Hooks preserved: 3'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Errors: 1'));
    });
  });
});
