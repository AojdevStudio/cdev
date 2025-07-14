const HookCategorizer = require('../src/hook-categorizer');

describe('HookCategorizer', () => {
  let categorizer;

  beforeEach(() => {
    categorizer = new HookCategorizer();
  });

  describe('categorize', () => {
    it('should categorize hooks into tiers', async () => {
      const hooks = [
        {
          name: 'commit-message-validator.py',
          path: '/hooks/commit-message-validator.py',
          content: '# Validator',
        },
        {
          name: 'api-standards-checker.py',
          path: '/hooks/api-standards-checker.py',
          content: '# Checker',
        },
        { name: 'notification.py', path: '/hooks/notification.py', content: '# Notify' },
        { name: 'utils/anth.py', path: '/hooks/utils/anth.py', content: '# Utility' },
      ];

      const result = await categorizer.categorize(hooks);

      expect(result.tier1).toBeDefined();
      expect(result.tier2).toBeDefined();
      expect(result.tier3).toBeDefined();
      expect(result.utils).toBeDefined();

      // Check specific categorizations
      const tier1Names = result.tier1.map((h) => h.name);
      const tier2Names = result.tier2.map((h) => h.name);
      const tier3Names = result.tier3.map((h) => h.name);
      const utilNames = result.utils.map((h) => h.name);

      expect(tier1Names).toContain('commit-message-validator.py');
      expect(tier2Names).toContain('api-standards-checker.py');
      expect(tier3Names).toContain('notification.py');
      expect(utilNames).toContain('utils/anth.py');
    });

    it('should add metadata to categorized hooks', async () => {
      const hooks = [
        {
          name: 'typescript-validator.py',
          path: '/hooks/typescript-validator.py',
          content: '# Validate TS',
        },
      ];

      const result = await categorizer.categorize(hooks);
      const hook = result.tier1[0];

      expect(hook).toHaveProperty('tier', 'tier1');
      expect(hook).toHaveProperty('category');
      expect(hook).toHaveProperty('description');
      expect(hook).toHaveProperty('importance', 'critical');
    });
  });

  describe('determineHookTier', () => {
    it('should identify tier1 hooks by name', () => {
      const hook = { name: 'commit-message-validator.py', content: '' };
      expect(categorizer.determineHookTier(hook)).toBe('tier1');
    });

    it('should identify tier2 hooks by pattern', () => {
      const hook = { name: 'custom-checker.py', content: '' };
      expect(categorizer.determineHookTier(hook)).toBe('tier2');
    });

    it('should identify tier3 hooks by default', () => {
      const hook = { name: 'random-hook.py', content: '' };
      expect(categorizer.determineHookTier(hook)).toBe('tier3');
    });

    it('should identify utils by path', () => {
      const hook = { name: 'helper.py', path: '/hooks/utils/helper.py', content: '' };
      expect(categorizer.determineHookTier(hook)).toBe('utils');
    });

    it('should identify hooks by content keywords', () => {
      const hook = { name: 'custom.py', content: 'This hook enforces security policies' };
      expect(categorizer.determineHookTier(hook)).toBe('tier1');
    });
  });

  describe('getHookCategory', () => {
    it('should categorize validation hooks', () => {
      const hook = { name: 'input-validator.py', content: '' };
      expect(categorizer.getHookCategory(hook)).toBe('validation');
    });

    it('should categorize enforcement hooks', () => {
      const hook = { name: 'rule-enforcer.py', content: '' };
      expect(categorizer.getHookCategory(hook)).toBe('enforcement');
    });

    it('should categorize checking hooks', () => {
      const hook = { name: 'code-checker.py', content: '' };
      expect(categorizer.getHookCategory(hook)).toBe('checking');
    });

    it('should categorize reporting hooks', () => {
      const hook = { name: 'metrics-reporter.py', content: '' };
      expect(categorizer.getHookCategory(hook)).toBe('reporting');
    });

    it('should categorize linting hooks', () => {
      const hook = { name: 'style-linter.py', content: '' };
      expect(categorizer.getHookCategory(hook)).toBe('linting');
    });

    it('should categorize organization hooks', () => {
      const hook = { name: 'file-organizer.py', content: '' };
      expect(categorizer.getHookCategory(hook)).toBe('organization');
    });

    it('should categorize notification hooks', () => {
      const hook = { name: 'email-notification.py', content: '' };
      expect(categorizer.getHookCategory(hook)).toBe('notification');
    });

    it('should categorize lifecycle hooks', () => {
      const hook = { name: 'pre_build.py', content: '' };
      expect(categorizer.getHookCategory(hook)).toBe('lifecycle');
    });

    it('should default to general category', () => {
      const hook = { name: 'misc.py', content: '' };
      expect(categorizer.getHookCategory(hook)).toBe('general');
    });
  });

  describe('getHookDescription', () => {
    it('should return predefined descriptions', () => {
      const hook = { name: 'commit-message-validator.py' };
      expect(categorizer.getHookDescription(hook)).toBe(
        'Validates commit message format and content',
      );
    });

    it('should generate descriptions for unknown hooks', () => {
      const hook = { name: 'custom-helper.py' };
      expect(categorizer.getHookDescription(hook)).toBe('Custom Helper hook');
    });
  });

  describe('getImportanceLevel', () => {
    it('should return correct importance levels', () => {
      expect(categorizer.getImportanceLevel('tier1')).toBe('critical');
      expect(categorizer.getImportanceLevel('tier2')).toBe('important');
      expect(categorizer.getImportanceLevel('tier3')).toBe('optional');
      expect(categorizer.getImportanceLevel('utils')).toBe('utility');
      expect(categorizer.getImportanceLevel('unknown')).toBe('optional');
    });
  });

  describe('analyzeHookContent', () => {
    it('should detect security features', () => {
      const content = 'Check authentication and validate permissions';
      const features = categorizer.analyzeHookContent(content);
      expect(features.hasSecurityChecks).toBe(true);
    });

    it('should detect validation features', () => {
      const content = 'Validate input and ensure data integrity';
      const features = categorizer.analyzeHookContent(content);
      expect(features.hasValidation).toBe(true);
    });

    it('should detect enforcement features', () => {
      const content = 'Enforce coding standards and block invalid commits';
      const features = categorizer.analyzeHookContent(content);
      expect(features.hasEnforcement).toBe(true);
    });

    it('should detect reporting features', () => {
      const content = 'Generate report and log metrics';
      const features = categorizer.analyzeHookContent(content);
      expect(features.hasReporting).toBe(true);
    });

    it('should detect notification features', () => {
      const content = 'Send email alert and notify team';
      const features = categorizer.analyzeHookContent(content);
      expect(features.hasNotification).toBe(true);
    });

    it('should detect async features', () => {
      const content = 'async function processData() { await fetch(url); }';
      const features = categorizer.analyzeHookContent(content);
      expect(features.isAsync).toBe(true);
    });

    it('should detect external API usage', () => {
      const content = 'Make HTTP request to external API';
      const features = categorizer.analyzeHookContent(content);
      expect(features.usesExternalAPI).toBe(true);
    });
  });
});
