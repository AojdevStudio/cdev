const path = require('path');

const fs = require('fs-extra');

const HookSelector = require('../src/hook-selector');

describe('HookSelector', () => {
  let selector;

  beforeEach(() => {
    selector = new HookSelector();
  });

  const mockCategorizedHooks = {
    tier1: [
      {
        name: 'commit-message-validator.py',
        tier: 'tier1',
        importance: 'critical',
        category: 'validation',
      },
      {
        name: 'typescript-validator.py',
        tier: 'tier1',
        importance: 'critical',
        category: 'validation',
      },
      { name: 'pnpm-enforcer.py', tier: 'tier1', importance: 'critical', category: 'enforcement' },
    ],
    tier2: [
      {
        name: 'api-standards-checker.py',
        tier: 'tier2',
        importance: 'important',
        category: 'checking',
      },
      {
        name: 'code-quality-reporter.py',
        tier: 'tier2',
        importance: 'important',
        category: 'reporting',
      },
      { name: 'universal-linter.py', tier: 'tier2', importance: 'important', category: 'linting' },
    ],
    tier3: [
      { name: 'notification.py', tier: 'tier3', importance: 'optional', category: 'notification' },
      { name: 'stop.py', tier: 'tier3', importance: 'optional', category: 'lifecycle' },
    ],
    utils: [],
  };

  describe('selectHooks', () => {
    it('should select hooks for typescript project', () => {
      const selected = selector.selectHooks(mockCategorizedHooks, 'typescript');
      const names = selected.map((h) => h.name);

      expect(names).toContain('commit-message-validator.py');
      expect(names).toContain('typescript-validator.py');
      expect(names).toContain('code-quality-reporter.py');
    });

    it('should select hooks for node project', () => {
      const selected = selector.selectHooks(mockCategorizedHooks, 'node');
      const names = selected.map((h) => h.name);

      expect(names).toContain('commit-message-validator.py');
      expect(names).not.toContain('typescript-validator.py');
    });

    it('should select hooks for python project', () => {
      const selected = selector.selectHooks(mockCategorizedHooks, 'python');
      const names = selected.map((h) => h.name);

      expect(names).toContain('commit-message-validator.py');
      expect(names).not.toContain('typescript-validator.py');
      expect(names).not.toContain('pnpm-enforcer.py');
    });

    it('should select more hooks for monorepo', () => {
      const selected = selector.selectHooks(mockCategorizedHooks, 'monorepo');
      const names = selected.map((h) => h.name);

      expect(names).toContain('pnpm-enforcer.py');
      expect(names.length).toBeGreaterThan(4);
    });

    it('should respect minimal setup preference', () => {
      const selected = selector.selectHooks(mockCategorizedHooks, 'typescript', {
        minimalSetup: true,
      });

      expect(selected.length).toBeLessThan(5);
    });

    it('should exclude hooks based on preferences', () => {
      const selected = selector.selectHooks(mockCategorizedHooks, 'typescript', {
        excludeHooks: ['commit-message-validator.py', 'typescript-validator.py'],
      });
      const names = selected.map((h) => h.name);

      expect(names).not.toContain('commit-message-validator.py');
      expect(names).not.toContain('typescript-validator.py');
    });

    it('should include user-requested hooks', () => {
      const selected = selector.selectHooks(mockCategorizedHooks, 'typescript', {
        includeHooks: ['notification.py'],
      });
      const names = selected.map((h) => h.name);

      expect(names).toContain('notification.py');
    });

    it('should filter by category', () => {
      const selected = selector.selectHooks(mockCategorizedHooks, 'typescript', {
        includeCategories: ['validation', 'enforcement'],
      });

      selected.forEach((hook) => {
        expect(['validation', 'enforcement']).toContain(hook.category);
      });
    });

    it('should exclude categories', () => {
      const selected = selector.selectHooks(mockCategorizedHooks, 'typescript', {
        excludeCategories: ['notification', 'lifecycle'],
      });

      selected.forEach((hook) => {
        expect(['notification', 'lifecycle']).not.toContain(hook.category);
      });
    });

    it('should filter by minimum importance', () => {
      const selected = selector.selectHooks(mockCategorizedHooks, 'typescript', {
        minImportance: 'important',
      });

      selected.forEach((hook) => {
        expect(['critical', 'important']).toContain(hook.importance);
      });
    });

    it('should sort by importance', () => {
      const selected = selector.selectHooks(mockCategorizedHooks, 'default');

      // Check that critical hooks come before important hooks
      const criticalIndex = selected.findIndex((h) => h.importance === 'critical');
      const importantIndex = selected.findIndex((h) => h.importance === 'important');

      if (criticalIndex !== -1 && importantIndex !== -1) {
        expect(criticalIndex).toBeLessThan(importantIndex);
      }
    });
  });

  describe('getProjectConfig', () => {
    it('should return config for known project types', () => {
      const tsConfig = selector.getProjectConfig('typescript');
      expect(tsConfig.recommendedHooks).toContain('typescript-validator.py');
    });

    it('should return default config for unknown types', () => {
      const config = selector.getProjectConfig('unknown-type');
      expect(config).toEqual(selector.projectConfigs.default);
    });
  });

  describe('findHookByName', () => {
    it('should find hook across all tiers', () => {
      const hook = selector.findHookByName(mockCategorizedHooks, 'notification.py');
      expect(hook).toBeDefined();
      expect(hook.name).toBe('notification.py');
      expect(hook.tier).toBe('tier3');
    });

    it('should return null for non-existent hook', () => {
      const hook = selector.findHookByName(mockCategorizedHooks, 'non-existent.py');
      expect(hook).toBeNull();
    });
  });

  describe('getRecommendations', () => {
    it('should recommend missing required hooks', () => {
      const existingHooks = ['universal-linter.py'];
      const recommendations = selector.getRecommendations('typescript', existingHooks);

      expect(recommendations.required).toContain('commit-message-validator.py');
      expect(recommendations.required).toContain('typescript-validator.py');
    });

    it('should recommend optional hooks for monorepo', () => {
      const recommendations = selector.getRecommendations('monorepo', []);
      expect(recommendations.optional).toContain('notification.py');
    });
  });

  describe('detectProjectType', () => {
    let tempDir;

    beforeEach(async () => {
      tempDir = path.join(__dirname, 'tmp', 'detect-project');
      await fs.ensureDir(tempDir);
    });

    afterEach(async () => {
      await fs.remove(path.join(__dirname, 'tmp'));
    });

    it('should detect typescript project', async () => {
      await fs.writeJson(path.join(tempDir, 'package.json'), {
        devDependencies: { typescript: '^4.0.0' },
      });

      const type = await selector.detectProjectType(tempDir);
      expect(type).toBe('typescript');
    });

    it('should detect react project', async () => {
      await fs.writeJson(path.join(tempDir, 'package.json'), {
        dependencies: { react: '^17.0.0', typescript: '^4.0.0' },
      });

      const type = await selector.detectProjectType(tempDir);
      expect(type).toBe('react');
    });

    it('should detect monorepo project', async () => {
      await fs.writeJson(path.join(tempDir, 'package.json'), {
        workspaces: ['packages/*'],
      });

      const type = await selector.detectProjectType(tempDir);
      expect(type).toBe('monorepo');
    });

    it('should detect API project', async () => {
      await fs.writeJson(path.join(tempDir, 'package.json'), {
        dependencies: { express: '^4.17.0' },
      });

      const type = await selector.detectProjectType(tempDir);
      expect(type).toBe('api');
    });

    it('should detect node project', async () => {
      await fs.writeJson(path.join(tempDir, 'package.json'), {
        name: 'my-node-app',
      });

      const type = await selector.detectProjectType(tempDir);
      expect(type).toBe('node');
    });

    it('should detect python project', async () => {
      await fs.writeFile(path.join(tempDir, 'requirements.txt'), 'flask==2.0.0');

      const type = await selector.detectProjectType(tempDir);
      expect(type).toBe('python');
    });

    it('should return default for unknown project', async () => {
      const type = await selector.detectProjectType(tempDir);
      expect(type).toBe('default');
    });
  });
});
