/**
 * Tests for hook-selector.js
 */

const path = require('path');

const fs = require('fs-extra');

const HookSelector = require('./hook-selector');

// Mock fs-extra
jest.mock('fs-extra');

describe('HookSelector', () => {
  let selector;

  const mockCategorizedHooks = {
    tier1: [
      { name: 'commit-message-validator.py', importance: 'critical', category: 'validation' },
      { name: 'typescript-validator.py', importance: 'critical', category: 'validation' },
      { name: 'task-completion-enforcer.py', importance: 'critical', category: 'enforcement' },
      { name: 'pnpm-enforcer.py', importance: 'critical', category: 'enforcement' },
    ],
    tier2: [
      { name: 'code-quality-reporter.py', importance: 'important', category: 'reporting' },
      { name: 'universal-linter.py', importance: 'important', category: 'linting' },
      { name: 'import-organizer.py', importance: 'important', category: 'organization' },
      { name: 'api-standards-checker.py', importance: 'important', category: 'checking' },
    ],
    tier3: [
      { name: 'notification.py', importance: 'optional', category: 'notification' },
      { name: 'pre_tool_use.py', importance: 'optional', category: 'lifecycle' },
    ],
    utils: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    selector = new HookSelector();
  });

  describe('constructor', () => {
    test('initializes with project configurations', () => {
      expect(selector.projectConfigs).toBeDefined();
      expect(selector.projectConfigs.node).toBeDefined();
      expect(selector.projectConfigs.typescript).toBeDefined();
      expect(selector.projectConfigs.react).toBeDefined();
      expect(selector.projectConfigs.python).toBeDefined();
      expect(selector.projectConfigs.monorepo).toBeDefined();
      expect(selector.projectConfigs.api).toBeDefined();
      expect(selector.projectConfigs.default).toBeDefined();
    });
  });

  describe('selectHooks', () => {
    test('selects hooks for Node.js project', () => {
      const selected = selector.selectHooks(mockCategorizedHooks, 'node');

      const hookNames = selected.map((h) => h.name);
      expect(hookNames).toContain('commit-message-validator.py');
      expect(hookNames).toContain('code-quality-reporter.py');
      expect(hookNames).toContain('universal-linter.py');
      expect(hookNames).not.toContain('typescript-validator.py'); // Excluded for node
    });

    test('selects hooks for TypeScript project', () => {
      const selected = selector.selectHooks(mockCategorizedHooks, 'typescript');

      const hookNames = selected.map((h) => h.name);
      expect(hookNames).toContain('commit-message-validator.py');
      expect(hookNames).toContain('typescript-validator.py');
      expect(hookNames).toContain('code-quality-reporter.py');
      expect(hookNames).toContain('import-organizer.py');
    });

    test('selects hooks for Python project', () => {
      const selected = selector.selectHooks(mockCategorizedHooks, 'python');

      const hookNames = selected.map((h) => h.name);
      expect(hookNames).toContain('commit-message-validator.py');
      expect(hookNames).not.toContain('typescript-validator.py'); // Excluded for python
      expect(hookNames).not.toContain('pnpm-enforcer.py'); // Excluded for python
    });

    test('selects hooks for monorepo', () => {
      const selected = selector.selectHooks(mockCategorizedHooks, 'monorepo');

      const hookNames = selected.map((h) => h.name);
      expect(hookNames).toContain('pnpm-enforcer.py');
      expect(hookNames).toContain('task-completion-enforcer.py');
      expect(selected.length).toBeGreaterThan(5); // Should include many hooks
    });

    test('respects minimal setup preference', () => {
      const preferences = { minimalSetup: true };
      const selected = selector.selectHooks(mockCategorizedHooks, 'node', preferences);

      // Should only include critical hooks from required tiers
      expect(selected.length).toBeLessThan(5);
      selected.forEach((hook) => {
        expect(hook.importance).toBe('critical');
      });
    });

    test('includes user-requested hooks', () => {
      const preferences = { includeHooks: ['notification.py'] };
      const selected = selector.selectHooks(mockCategorizedHooks, 'node', preferences);

      const hookNames = selected.map((h) => h.name);
      expect(hookNames).toContain('notification.py');
    });

    test('excludes user-specified hooks', () => {
      const preferences = { excludeHooks: ['commit-message-validator.py'] };
      const selected = selector.selectHooks(mockCategorizedHooks, 'typescript', preferences);

      const hookNames = selected.map((h) => h.name);
      expect(hookNames).not.toContain('commit-message-validator.py');
    });

    test('handles unknown project type', () => {
      const selected = selector.selectHooks(mockCategorizedHooks, 'unknown');

      // Should use default configuration
      const hookNames = selected.map((h) => h.name);
      expect(hookNames).toContain('commit-message-validator.py');
      expect(hookNames).toContain('code-quality-reporter.py');
    });
  });

  describe('getProjectConfig', () => {
    test('returns specific project config', () => {
      const config = selector.getProjectConfig('typescript');

      expect(config.requiredTiers).toContain('tier1');
      expect(config.recommendedHooks).toContain('typescript-validator.py');
    });

    test('returns default config for unknown type', () => {
      const config = selector.getProjectConfig('unknown');

      expect(config).toBe(selector.projectConfigs.default);
    });
  });

  describe('filterTierHooks', () => {
    test('excludes hooks in exclude list', () => {
      const tierHooks = mockCategorizedHooks.tier1;
      const config = { excludeHooks: ['typescript-validator.py'], recommendedHooks: [] };

      const filtered = selector.filterTierHooks(tierHooks, config, {});

      const hookNames = filtered.map((h) => h.name);
      expect(hookNames).not.toContain('typescript-validator.py');
    });

    test('excludes user-specified hooks', () => {
      const tierHooks = mockCategorizedHooks.tier1;
      const config = { excludeHooks: [], recommendedHooks: [] };
      const preferences = { excludeHooks: ['pnpm-enforcer.py'] };

      const filtered = selector.filterTierHooks(tierHooks, config, preferences);

      const hookNames = filtered.map((h) => h.name);
      expect(hookNames).not.toContain('pnpm-enforcer.py');
    });

    test('includes critical hooks by default', () => {
      const tierHooks = mockCategorizedHooks.tier1;
      const config = { excludeHooks: [], recommendedHooks: [] };

      const filtered = selector.filterTierHooks(tierHooks, config, {});

      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((hook) => {
        expect(hook.importance).toBe('critical');
      });
    });

    test('excludes critical hooks when noCritical is true', () => {
      const tierHooks = mockCategorizedHooks.tier1;
      const config = { excludeHooks: [], recommendedHooks: [] };
      const preferences = { noCritical: true };

      const filtered = selector.filterTierHooks(tierHooks, config, preferences);

      expect(filtered.length).toBe(0);
    });

    test('includes recommended hooks', () => {
      const tierHooks = mockCategorizedHooks.tier2;
      const config = {
        excludeHooks: [],
        recommendedHooks: ['code-quality-reporter.py'],
      };

      const filtered = selector.filterTierHooks(tierHooks, config, {});

      const hookNames = filtered.map((h) => h.name);
      expect(hookNames).toContain('code-quality-reporter.py');
    });
  });

  describe('findHookByName', () => {
    test('finds hook in tier1', () => {
      const hook = selector.findHookByName(mockCategorizedHooks, 'commit-message-validator.py');

      expect(hook).toBeDefined();
      expect(hook.name).toBe('commit-message-validator.py');
      expect(hook.importance).toBe('critical');
    });

    test('finds hook in tier2', () => {
      const hook = selector.findHookByName(mockCategorizedHooks, 'code-quality-reporter.py');

      expect(hook).toBeDefined();
      expect(hook.name).toBe('code-quality-reporter.py');
    });

    test('finds hook in tier3', () => {
      const hook = selector.findHookByName(mockCategorizedHooks, 'notification.py');

      expect(hook).toBeDefined();
      expect(hook.name).toBe('notification.py');
    });

    test('returns null for non-existent hook', () => {
      const hook = selector.findHookByName(mockCategorizedHooks, 'non-existent.py');

      expect(hook).toBeNull();
    });
  });

  describe('applyPreferences', () => {
    test('filters by included categories', () => {
      const hooks = [...mockCategorizedHooks.tier1, ...mockCategorizedHooks.tier2];
      const preferences = { includeCategories: ['validation', 'reporting'] };

      const filtered = selector.applyPreferences(hooks, preferences);

      filtered.forEach((hook) => {
        expect(['validation', 'reporting']).toContain(hook.category);
      });
    });

    test('filters by excluded categories', () => {
      const hooks = [...mockCategorizedHooks.tier1, ...mockCategorizedHooks.tier2];
      const preferences = { excludeCategories: ['enforcement'] };

      const filtered = selector.applyPreferences(hooks, preferences);

      filtered.forEach((hook) => {
        expect(hook.category).not.toBe('enforcement');
      });
    });

    test('filters by minimum importance', () => {
      const allHooks = [
        ...mockCategorizedHooks.tier1,
        ...mockCategorizedHooks.tier2,
        ...mockCategorizedHooks.tier3,
      ];
      const preferences = { minImportance: 'important' };

      const filtered = selector.applyPreferences(allHooks, preferences);

      filtered.forEach((hook) => {
        expect(['critical', 'important']).toContain(hook.importance);
      });

      const hookNames = filtered.map((h) => h.name);
      expect(hookNames).not.toContain('notification.py'); // optional hook
    });

    test('sorts hooks by importance', () => {
      const hooks = [
        { name: 'optional.py', importance: 'optional' },
        { name: 'critical.py', importance: 'critical' },
        { name: 'important.py', importance: 'important' },
      ];

      const sorted = selector.applyPreferences(hooks, {});

      expect(sorted[0].importance).toBe('critical');
      expect(sorted[1].importance).toBe('important');
      expect(sorted[2].importance).toBe('optional');
    });

    test('handles utility importance level', () => {
      const hooks = [
        { name: 'util.py', importance: 'utility' },
        { name: 'optional.py', importance: 'optional' },
      ];

      const sorted = selector.applyPreferences(hooks, {});

      expect(sorted[0].importance).toBe('optional');
      expect(sorted[1].importance).toBe('utility');
    });
  });

  describe('getRecommendations', () => {
    test('recommends missing hooks for project type', () => {
      const recommendations = selector.getRecommendations('typescript', []);

      expect(recommendations.required).toContain('commit-message-validator.py');
      expect(recommendations.required).toContain('typescript-validator.py');
      expect(recommendations.recommended).toContain('code-quality-reporter.py');
    });

    test('excludes existing hooks from recommendations', () => {
      const existing = ['commit-message-validator.py', 'typescript-validator.py'];
      const recommendations = selector.getRecommendations('typescript', existing);

      expect(recommendations.required).not.toContain('commit-message-validator.py');
      expect(recommendations.required).not.toContain('typescript-validator.py');
    });

    test('adds optional hooks for monorepo', () => {
      const recommendations = selector.getRecommendations('monorepo', []);

      expect(recommendations.optional).toContain('notification.py');
    });

    test('categorizes validators and enforcers as required', () => {
      const recommendations = selector.getRecommendations('monorepo', []);

      expect(recommendations.required).toContain('typescript-validator.py');
      expect(recommendations.required).toContain('pnpm-enforcer.py');
      expect(recommendations.required).toContain('task-completion-enforcer.py');
    });
  });

  describe('detectProjectType', () => {
    test('detects TypeScript project', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readJson.mockResolvedValue({
        devDependencies: { typescript: '^4.0.0' },
      });

      const type = await selector.detectProjectType('/test/project');

      expect(type).toBe('typescript');
    });

    test('detects React project', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readJson.mockResolvedValue({
        dependencies: {
          react: '^17.0.0',
          typescript: '^4.0.0',
        },
      });

      const type = await selector.detectProjectType('/test/project');

      expect(type).toBe('react');
    });

    test('detects monorepo by workspaces', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readJson.mockResolvedValue({
        workspaces: ['packages/*'],
      });

      const type = await selector.detectProjectType('/test/project');

      expect(type).toBe('monorepo');
    });

    test('detects monorepo by lerna.json', async () => {
      fs.pathExists.mockImplementation(
        (path) => path.includes('package.json') || path.includes('lerna.json'),
      );
      fs.readJson.mockResolvedValue({});

      const type = await selector.detectProjectType('/test/project');

      expect(type).toBe('monorepo');
    });

    test('detects API project', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readJson.mockResolvedValue({
        dependencies: { express: '^4.0.0' },
      });

      const type = await selector.detectProjectType('/test/project');

      expect(type).toBe('api');
    });

    test('detects Node.js project', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readJson.mockResolvedValue({
        dependencies: { lodash: '^4.0.0' },
      });

      const type = await selector.detectProjectType('/test/project');

      expect(type).toBe('node');
    });

    test('detects Python project by requirements.txt', async () => {
      fs.pathExists.mockImplementation((path) => path.includes('requirements.txt'));

      const type = await selector.detectProjectType('/test/project');

      expect(type).toBe('python');
    });

    test('detects Python project by setup.py', async () => {
      fs.pathExists.mockImplementation((path) => path.includes('setup.py'));

      const type = await selector.detectProjectType('/test/project');

      expect(type).toBe('python');
    });

    test('detects Python project by pyproject.toml', async () => {
      fs.pathExists.mockImplementation((path) => path.includes('pyproject.toml'));

      const type = await selector.detectProjectType('/test/project');

      expect(type).toBe('python');
    });

    test('returns default for unknown project', async () => {
      fs.pathExists.mockResolvedValue(false);

      const type = await selector.detectProjectType('/test/project');

      expect(type).toBe('default');
    });

    test('handles errors gracefully', async () => {
      fs.pathExists.mockRejectedValue(new Error('Permission denied'));

      const type = await selector.detectProjectType('/test/project');

      expect(type).toBe('default');
    });
  });

  describe('edge cases', () => {
    test('handles empty categorized hooks', () => {
      const emptyHooks = { tier1: [], tier2: [], tier3: [], utils: [] };
      const selected = selector.selectHooks(emptyHooks, 'typescript');

      expect(selected).toEqual([]);
    });

    test('handles missing tier in categorized hooks', () => {
      const partialHooks = { tier1: mockCategorizedHooks.tier1 };
      const selected = selector.selectHooks(partialHooks, 'monorepo');

      // Should still return hooks from available tiers
      expect(selected.length).toBeGreaterThan(0);
    });

    test('handles duplicate hook requests', () => {
      const preferences = {
        includeHooks: ['commit-message-validator.py', 'commit-message-validator.py'],
      };
      const selected = selector.selectHooks(mockCategorizedHooks, 'node', preferences);

      // Should not include duplicates
      const commitValidatorCount = selected.filter(
        (h) => h.name === 'commit-message-validator.py',
      ).length;
      expect(commitValidatorCount).toBe(1);
    });

    test('handles conflicting preferences', () => {
      const preferences = {
        includeHooks: ['notification.py'],
        excludeHooks: ['notification.py'], // Conflict
      };
      const selected = selector.selectHooks(mockCategorizedHooks, 'node', preferences);

      // Exclude should take precedence
      const hookNames = selected.map((h) => h.name);
      expect(hookNames).not.toContain('notification.py');
    });
  });
});
