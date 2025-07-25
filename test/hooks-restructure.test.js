const fs = require('fs-extra');

const HooksRestructure = require('../src/hooks-restructure');
const HookManager = require('../src/hook-manager');

// Mock dependencies
jest.mock('fs-extra');
jest.mock('../src/hook-manager');

describe('HooksRestructure', () => {
  let restructurer;
  let mockHookManager;
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock HookManager
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

    restructurer = new HooksRestructure('/test/project');

    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Default fs mocks
    fs.pathExists.mockResolvedValue(false);
    fs.move.mockResolvedValue();
    fs.copy.mockResolvedValue();
    fs.remove.mockResolvedValue();
    fs.ensureDir.mockResolvedValue();
    fs.writeJson.mockResolvedValue();
    fs.readdir.mockResolvedValue([]);
    fs.stat.mockResolvedValue({ isDirectory: () => false });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize with correct paths', () => {
      expect(restructurer.projectPath).toBe('/test/project');
      expect(restructurer.hooksPath).toBe('/test/project/.claude/hooks');
      expect(restructurer.backupPath).toBe('/test/project/.claude/hooks-backup');
    });

    it('should use current working directory as default', () => {
      const defaultRestructurer = new HooksRestructure();
      expect(defaultRestructurer.projectPath).toBe(process.cwd());
    });
  });

  describe('restructure', () => {
    it('should complete full restructuring successfully', async () => {
      const mockHooks = [
        { name: 'validator.py', path: '/hooks/validator.py' },
        { name: 'formatter.py', path: '/hooks/formatter.py' },
      ];
      const mockCategorized = {
        tier1: [mockHooks[0]],
        tier2: [mockHooks[1]],
      };
      const mockManifest = { version: '1.0', hooks: 2 };

      mockHookManager.loadExistingHooks.mockResolvedValue(mockHooks);
      mockHookManager.categorizer.categorize.mockResolvedValue(mockCategorized);
      mockHookManager.organizer.generateManifest.mockResolvedValue(mockManifest);

      jest.spyOn(restructurer, 'createBackup').mockResolvedValue();
      jest.spyOn(restructurer, 'generateRestructuringPlan').mockReturnValue({
        moves: [],
        creates: [],
        preserves: [],
        summary: { tier1: 1, tier2: 1, tier3: 0, utils: 0, total: 2 },
      });
      jest.spyOn(restructurer, 'executePlan').mockResolvedValue({
        created: [],
        moved: [],
        preserved: 0,
        errors: [],
      });

      await restructurer.restructure();

      expect(mockHookManager.loadExistingHooks).toHaveBeenCalled();
      expect(mockHookManager.categorizer.categorize).toHaveBeenCalledWith(mockHooks);
      expect(mockHookManager.organizer.createTierReadmeFiles).toHaveBeenCalled();
      expect(fs.writeJson).toHaveBeenCalledWith(
        '/test/project/.claude/hooks/hooks-manifest.json',
        mockManifest,
        { spaces: 2 },
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Hook restructuring complete'),
      );
    });

    it('should skip backup when backup option is false', async () => {
      mockHookManager.loadExistingHooks.mockResolvedValue([]);
      mockHookManager.categorizer.categorize.mockResolvedValue({});
      mockHookManager.organizer.generateManifest.mockResolvedValue({});

      jest.spyOn(restructurer, 'createBackup').mockResolvedValue();
      jest.spyOn(restructurer, 'generateRestructuringPlan').mockReturnValue({
        moves: [],
        creates: [],
        preserves: [],
        summary: { tier1: 0, tier2: 0, tier3: 0, utils: 0, total: 0 },
      });
      jest.spyOn(restructurer, 'executePlan').mockResolvedValue({
        created: [],
        moved: [],
        preserved: 0,
        errors: [],
      });

      await restructurer.restructure({ backup: false });

      expect(restructurer.createBackup).not.toHaveBeenCalled();
    });

    it('should perform dry run without making changes', async () => {
      const mockHooks = [{ name: 'test.py', path: '/hooks/test.py' }];
      const mockCategorized = { tier1: mockHooks };

      mockHookManager.loadExistingHooks.mockResolvedValue(mockHooks);
      mockHookManager.categorizer.categorize.mockResolvedValue(mockCategorized);

      jest.spyOn(restructurer, 'generateRestructuringPlan').mockReturnValue({
        moves: [],
        creates: [],
        preserves: [],
        summary: { tier1: 1, tier2: 0, tier3: 0, utils: 0, total: 1 },
      });

      const result = await restructurer.restructure({ dryRun: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Dry run complete'));
      expect(fs.move).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle empty hooks gracefully', async () => {
      mockHookManager.loadExistingHooks.mockResolvedValue([]);
      mockHookManager.categorizer.categorize.mockResolvedValue({});
      mockHookManager.organizer.generateManifest.mockResolvedValue({});

      jest.spyOn(restructurer, 'generateRestructuringPlan').mockReturnValue({
        moves: [],
        creates: [],
        preserves: [],
        summary: { tier1: 0, tier2: 0, tier3: 0, utils: 0, total: 0 },
      });
      jest.spyOn(restructurer, 'executePlan').mockResolvedValue({
        created: [],
        moved: [],
        preserved: 0,
        errors: [],
      });

      await restructurer.restructure();

      expect(consoleLogSpy).toHaveBeenCalledWith('📊 Found 0 hooks to restructure');
    });
  });

  describe('createBackup', () => {
    it('should create backup successfully', async () => {
      fs.pathExists.mockResolvedValueOnce(false); // backup doesn't exist

      await restructurer.createBackup();

      expect(fs.copy).toHaveBeenCalledWith(
        '/test/project/.claude/hooks',
        '/test/project/.claude/hooks-backup',
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('📦 Creating backup of current hooks...');
    });

    it('should handle existing backup by adding timestamp', async () => {
      fs.pathExists.mockResolvedValueOnce(true); // backup exists

      await restructurer.createBackup();

      expect(fs.move).toHaveBeenCalledWith(
        '/test/project/.claude/hooks-backup',
        expect.stringContaining('hooks-backup-'),
      );
    });
  });

  describe('generateRestructuringPlan', () => {
    it('should generate plan for hooks needing movement', () => {
      const categorizedHooks = {
        tier1: [
          {
            name: 'validator.py',
            path: '/test/project/.claude/hooks/validator.py',
          },
        ],
        tier2: [
          {
            name: 'formatter.py',
            path: '/test/project/.claude/hooks/formatter.py',
          },
        ],
      };

      const plan = restructurer.generateRestructuringPlan(categorizedHooks);

      expect(plan.moves).toHaveLength(2);
      expect(plan.moves[0]).toEqual({
        hook: 'validator.py',
        from: '/test/project/.claude/hooks/validator.py',
        to: '/test/project/.claude/hooks/tier1/validator.py',
        tier: 'tier1',
      });
      expect(plan.summary.total).toBe(2);
      expect(plan.summary.tier1).toBe(1);
      expect(plan.summary.tier2).toBe(1);
    });

    it('should preserve hooks already in correct location', () => {
      const categorizedHooks = {
        tier1: [
          {
            name: 'validator.py',
            path: '/test/project/.claude/hooks/tier1/validator.py',
          },
        ],
      };

      const plan = restructurer.generateRestructuringPlan(categorizedHooks);

      expect(plan.moves).toHaveLength(0);
      expect(plan.preserves).toHaveLength(1);
      expect(plan.preserves[0].reason).toBe('Already in correct location');
    });

    it('should preserve utils subdirectory structure', () => {
      const categorizedHooks = {
        utils: [
          {
            name: 'helper.py',
            path: '/test/project/.claude/hooks/some-dir/utils/helper.py', // In utils subdirectory but not at target
          },
        ],
      };

      const plan = restructurer.generateRestructuringPlan(categorizedHooks);

      expect(plan.moves).toHaveLength(0);
      expect(plan.preserves).toHaveLength(1);
      expect(plan.preserves[0].reason).toBe('Already in correct utils subdirectory');
    });

    it('should include tier directories in creates list', () => {
      const plan = restructurer.generateRestructuringPlan({});

      expect(plan.creates).toHaveLength(3);
      expect(plan.creates).toEqual([
        {
          type: 'directory',
          path: '/test/project/.claude/hooks/tier1',
        },
        {
          type: 'directory',
          path: '/test/project/.claude/hooks/tier2',
        },
        {
          type: 'directory',
          path: '/test/project/.claude/hooks/tier3',
        },
      ]);
    });
  });

  describe('displayPlan', () => {
    it('should display comprehensive restructuring plan', () => {
      const plan = {
        moves: [
          {
            hook: 'validator.py',
            from: '/hooks/validator.py',
            to: '/hooks/tier1/validator.py',
            tier: 'tier1',
          },
        ],
        creates: [
          {
            type: 'directory',
            path: '/hooks/tier1',
          },
        ],
        preserves: [
          {
            hook: 'existing.py',
            path: '/hooks/tier2/existing.py',
            reason: 'Already in correct location',
          },
        ],
        summary: { tier1: 1, tier2: 1, tier3: 0, utils: 0, total: 2 },
      };

      restructurer.displayPlan(plan);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Restructuring Plan'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Directories to create'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Hooks to move'));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Hooks already in correct location'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Summary'));
    });

    it('should skip preserves section when empty', () => {
      const plan = {
        moves: [],
        creates: [],
        preserves: [],
        summary: { tier1: 0, tier2: 0, tier3: 0, utils: 0, total: 0 },
      };

      restructurer.displayPlan(plan);

      expect(consoleLogSpy).not.toHaveBeenCalledWith('✅ Hooks already in correct location:');
    });
  });

  describe('executePlan', () => {
    it('should execute plan successfully', async () => {
      const plan = {
        creates: [
          {
            type: 'directory',
            path: '/hooks/tier1',
          },
        ],
        moves: [
          {
            hook: 'validator.py',
            from: '/hooks/validator.py',
            to: '/hooks/tier1/validator.py',
            tier: 'tier1',
          },
        ],
        preserves: [{ hook: 'existing.py' }],
      };

      const result = await restructurer.executePlan(plan);

      expect(fs.ensureDir).toHaveBeenCalledWith('/hooks/tier1');
      expect(fs.move).toHaveBeenCalledWith('/hooks/validator.py', '/hooks/tier1/validator.py', {
        overwrite: false,
      });
      expect(mockHookManager.initialize).toHaveBeenCalled();

      expect(result.created).toEqual(['/hooks/tier1']);
      expect(result.moved).toEqual(['validator.py']);
      expect(result.preserved).toBe(1);
      expect(result.errors).toEqual([]);
    });

    it('should handle directory creation errors', async () => {
      const plan = {
        creates: [
          {
            type: 'directory',
            path: '/hooks/tier1',
          },
        ],
        moves: [],
        preserves: [],
      };

      const error = new Error('Permission denied');
      fs.ensureDir.mockRejectedValueOnce(error);

      const result = await restructurer.executePlan(plan);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        action: 'create',
        path: '/hooks/tier1',
        error: 'Permission denied',
      });
    });

    it('should handle file move errors', async () => {
      const plan = {
        creates: [],
        moves: [
          {
            hook: 'validator.py',
            from: '/hooks/validator.py',
            to: '/hooks/tier1/validator.py',
            tier: 'tier1',
          },
        ],
        preserves: [],
      };

      const error = new Error('File not found');
      fs.move.mockRejectedValueOnce(error);

      const result = await restructurer.executePlan(plan);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        action: 'move',
        hook: 'validator.py',
        error: 'File not found',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '❌ Failed to move validator.py: File not found',
      );
    });
  });

  describe('displaySummary', () => {
    it('should display restructuring summary', () => {
      const result = {
        created: ['/hooks/tier1', '/hooks/tier2'],
        moved: ['validator.py', 'formatter.py'],
        preserved: 1,
        errors: [],
      };

      restructurer.displaySummary(result);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Restructuring Summary'));
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Directories created: 2');
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Hooks moved: 2');
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Hooks preserved: 1');
    });

    it('should display errors when present', () => {
      const result = {
        created: [],
        moved: [],
        preserved: 0,
        errors: [
          {
            action: 'move',
            hook: 'broken.py',
            error: 'Permission denied',
          },
          {
            action: 'create',
            path: '/hooks/tier1',
            error: 'Directory exists',
          },
        ],
      };

      restructurer.displaySummary(result);

      expect(consoleLogSpy).toHaveBeenCalledWith('❌ Errors: 2');
      expect(consoleLogSpy).toHaveBeenCalledWith('   - move broken.py: Permission denied');
      expect(consoleLogSpy).toHaveBeenCalledWith('   - create /hooks/tier1: Directory exists');
    });
  });

  describe('restoreFromBackup', () => {
    it('should restore from backup successfully', async () => {
      fs.pathExists.mockResolvedValueOnce(true); // backup exists

      await restructurer.restoreFromBackup();

      expect(fs.remove).toHaveBeenCalledWith('/test/project/.claude/hooks');
      expect(fs.copy).toHaveBeenCalledWith(
        '/test/project/.claude/hooks-backup',
        '/test/project/.claude/hooks',
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Hooks restored from backup successfully');
    });

    it('should throw error when no backup exists', async () => {
      fs.pathExists.mockResolvedValueOnce(false); // backup doesn't exist

      await expect(restructurer.restoreFromBackup()).rejects.toThrow(
        'No backup found. Cannot restore.',
      );
    });
  });

  describe('verify', () => {
    it('should verify valid hook structure', async () => {
      fs.pathExists.mockResolvedValue(true); // all directories exist
      fs.readdir.mockResolvedValueOnce(['tier1', 'tier2', 'hook-registry.json', 'README.md']);
      fs.stat.mockResolvedValueOnce({ isDirectory: () => true }); // tier1
      fs.stat.mockResolvedValueOnce({ isDirectory: () => true }); // tier2
      fs.stat.mockResolvedValueOnce({ isDirectory: () => false }); // hook-registry.json
      fs.stat.mockResolvedValueOnce({ isDirectory: () => false }); // README.md

      const result = await restructurer.verify();

      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Hook structure is valid');
    });

    it('should detect missing tier directories', async () => {
      fs.pathExists
        .mockResolvedValueOnce(false) // tier1 missing
        .mockResolvedValueOnce(true) // tier2 exists
        .mockResolvedValueOnce(true) // tier3 exists
        .mockResolvedValueOnce(true) // utils exists
        .mockResolvedValueOnce(true); // registry exists

      fs.readdir.mockResolvedValueOnce([]);

      const result = await restructurer.verify();

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Missing tier directory: tier1');
    });

    it('should detect missing hook registry', async () => {
      fs.pathExists
        .mockResolvedValueOnce(true) // tier1 exists
        .mockResolvedValueOnce(true) // tier2 exists
        .mockResolvedValueOnce(true) // tier3 exists
        .mockResolvedValueOnce(true) // utils exists
        .mockResolvedValueOnce(false); // registry missing

      fs.readdir.mockResolvedValueOnce([]);

      const result = await restructurer.verify();

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Missing hook registry');
    });

    it('should detect hooks in root directory', async () => {
      fs.pathExists.mockResolvedValue(true); // all directories exist
      fs.readdir.mockResolvedValueOnce(['tier1', 'old-hook.py', 'hook-registry.json']);
      fs.stat.mockResolvedValueOnce({ isDirectory: () => true }); // tier1
      fs.stat.mockResolvedValueOnce({ isDirectory: () => false }); // old-hook.py
      fs.stat.mockResolvedValueOnce({ isDirectory: () => false }); // hook-registry.json

      const result = await restructurer.verify();

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Hook in root directory: old-hook.py');
    });

    it('should display issues when structure is invalid', async () => {
      fs.pathExists
        .mockResolvedValueOnce(false) // tier1 missing
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false); // registry missing

      fs.readdir.mockResolvedValueOnce([]);

      await restructurer.verify();

      expect(consoleLogSpy).toHaveBeenCalledWith('❌ Hook structure has issues:');
      expect(consoleLogSpy).toHaveBeenCalledWith('   - Missing tier directory: tier1');
      expect(consoleLogSpy).toHaveBeenCalledWith('   - Missing hook registry');
    });
  });
});
