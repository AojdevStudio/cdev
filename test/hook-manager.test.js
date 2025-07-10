const HookManager = require('../src/hook-manager');
const fs = require('fs-extra');
const path = require('path');

describe('HookManager', () => {
  let hookManager;
  let testProjectPath;

  beforeEach(async () => {
    // Create a temporary test directory
    testProjectPath = path.join(__dirname, 'tmp', 'test-project');
    await fs.ensureDir(testProjectPath);
    await fs.ensureDir(path.join(testProjectPath, '.claude', 'hooks'));
    
    // Create some test hooks
    const testHooks = [
      { name: 'commit-message-validator.py', content: '# Validator hook' },
      { name: 'api-standards-checker.py', content: '# API checker' },
      { name: 'notification.py', content: '# Notification hook' }
    ];
    
    for (const hook of testHooks) {
      await fs.writeFile(
        path.join(testProjectPath, '.claude', 'hooks', hook.name),
        hook.content
      );
    }
    
    hookManager = new HookManager(testProjectPath);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.remove(path.join(__dirname, 'tmp'));
  });

  describe('initialize', () => {
    it('should create tier directories', async () => {
      await hookManager.initialize();
      
      const tiers = ['tier1', 'tier2', 'tier3', 'utils'];
      for (const tier of tiers) {
        const tierPath = path.join(testProjectPath, '.claude', 'hooks', tier);
        expect(await fs.pathExists(tierPath)).toBe(true);
      }
    });

    it('should categorize existing hooks', async () => {
      const result = await hookManager.initialize();
      
      expect(result.tier1).toBeDefined();
      expect(result.tier2).toBeDefined();
      expect(result.tier3).toBeDefined();
      
      // Check specific hooks are in correct tiers
      const tier1Names = result.tier1.map(h => h.name);
      const tier2Names = result.tier2.map(h => h.name);
      const tier3Names = result.tier3.map(h => h.name);
      
      expect(tier1Names).toContain('commit-message-validator.py');
      expect(tier2Names).toContain('api-standards-checker.py');
      expect(tier3Names).toContain('notification.py');
    });
  });

  describe('loadExistingHooks', () => {
    it('should load all Python hooks', async () => {
      const hooks = await hookManager.loadExistingHooks();
      
      expect(hooks).toHaveLength(3);
      expect(hooks[0]).toHaveProperty('name');
      expect(hooks[0]).toHaveProperty('path');
      expect(hooks[0]).toHaveProperty('content');
      expect(hooks[0]).toHaveProperty('size');
      expect(hooks[0]).toHaveProperty('modified');
    });

    it('should ignore non-Python files', async () => {
      // Add a non-Python file
      await fs.writeFile(
        path.join(testProjectPath, '.claude', 'hooks', 'readme.txt'),
        'This is not a hook'
      );
      
      const hooks = await hookManager.loadExistingHooks();
      const hookNames = hooks.map(h => h.name);
      
      expect(hookNames).not.toContain('readme.txt');
    });

    it('should ignore directories', async () => {
      // Add a directory
      await fs.ensureDir(path.join(testProjectPath, '.claude', 'hooks', 'subdir'));
      
      const hooks = await hookManager.loadExistingHooks();
      const hookNames = hooks.map(h => h.name);
      
      expect(hookNames).not.toContain('subdir');
    });
  });

  describe('selectHooks', () => {
    it('should select hooks based on project type', async () => {
      await hookManager.initialize();
      
      const selectedHooks = await hookManager.selectHooks('typescript');
      const hookNames = selectedHooks.map(h => h.name);
      
      expect(hookNames).toContain('commit-message-validator.py');
    });

    it('should respect user preferences', async () => {
      await hookManager.initialize();
      
      const selectedHooks = await hookManager.selectHooks('typescript', {
        excludeHooks: ['commit-message-validator.py']
      });
      const hookNames = selectedHooks.map(h => h.name);
      
      expect(hookNames).not.toContain('commit-message-validator.py');
    });

    it('should include user-requested hooks', async () => {
      await hookManager.initialize();
      
      const selectedHooks = await hookManager.selectHooks('typescript', {
        includeHooks: ['notification.py']
      });
      const hookNames = selectedHooks.map(h => h.name);
      
      expect(hookNames).toContain('notification.py');
    });
  });

  describe('installHooks', () => {
    it('should copy selected hooks to project', async () => {
      await hookManager.initialize();
      const selectedHooks = await hookManager.selectHooks('typescript');
      
      // Create a different target directory for installation
      const targetDir = path.join(testProjectPath, '.claude', 'installed-hooks');
      await fs.ensureDir(targetDir);
      hookManager.hooksPath = targetDir;
      
      const installedHooks = await hookManager.installHooks(selectedHooks);
      
      expect(installedHooks.length).toBeGreaterThan(0);
      
      for (const hook of installedHooks) {
        const hookPath = path.join(targetDir, hook.name);
        expect(await fs.pathExists(hookPath)).toBe(true);
      }
    });
  });

  describe('getHookStats', () => {
    it('should return hook statistics', async () => {
      await hookManager.initialize();
      
      const stats = await hookManager.getHookStats();
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byTier');
      expect(stats).toHaveProperty('hooks');
      
      expect(stats.total).toBe(3);
      expect(stats.byTier.tier1).toBeGreaterThanOrEqual(1);
      expect(stats.byTier.tier2).toBeGreaterThanOrEqual(1);
      expect(stats.byTier.tier3).toBeGreaterThanOrEqual(1);
    });
  });

  describe('restructureHooks', () => {
    it('should move hooks to tier directories', async () => {
      const categorizedHooks = await hookManager.restructureHooks();
      
      // Check that hooks were moved to appropriate tiers
      for (const [tier, hooks] of Object.entries(categorizedHooks)) {
        for (const hook of hooks) {
          if (!hook.path.includes('/utils/')) {
            expect(hook.path).toContain(`/${tier}/`);
          }
        }
      }
    });
  });
});