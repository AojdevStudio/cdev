/**
 * Tests for hook-categorizer.js
 */

const HookCategorizer = require('./hook-categorizer');

describe('HookCategorizer', () => {
  let categorizer;

  const mockHooks = [
    {
      name: 'commit-message-validator.py',
      path: '/hooks/commit-message-validator.py',
      content: '# Validates commit messages'
    },
    {
      name: 'typescript-validator.py',
      path: '/hooks/typescript-validator.py',
      content: '# TypeScript validation logic'
    },
    {
      name: 'api-standards-checker.py',
      path: '/hooks/api-standards-checker.py',
      content: '# Check API standards'
    },
    {
      name: 'notification.py',
      path: '/hooks/notification.py',
      content: '# Send notifications'
    },
    {
      name: 'utils/helper.py',
      path: '/hooks/utils/helper.py',
      content: '# Helper utilities'
    },
    {
      name: 'custom-security.py',
      path: '/hooks/custom-security.py',
      content: '# Custom security checks with authentication'
    },
    {
      name: 'data-quality-reporter.py',
      path: '/hooks/data-quality-reporter.py',
      content: '# Reports data quality metrics'
    },
    {
      name: 'optional-helper.py',
      path: '/hooks/optional-helper.py',
      content: '# Optional helper functionality'
    }
  ];

  beforeEach(() => {
    categorizer = new HookCategorizer();
  });

  describe('constructor', () => {
    test('initializes with category rules', () => {
      expect(categorizer.categoryRules).toBeDefined();
      expect(categorizer.categoryRules.tier1).toBeDefined();
      expect(categorizer.categoryRules.tier2).toBeDefined();
      expect(categorizer.categoryRules.tier3).toBeDefined();
      expect(categorizer.categoryRules.utils).toBeDefined();
    });

    test('defines correct tier descriptions', () => {
      expect(categorizer.categoryRules.tier1.description).toBe('Critical security and validation hooks');
      expect(categorizer.categoryRules.tier2.description).toBe('Important quality and standards hooks');
      expect(categorizer.categoryRules.tier3.description).toBe('Optional convenience and notification hooks');
      expect(categorizer.categoryRules.utils.description).toBe('Shared utilities and helper functions');
    });
  });

  describe('categorize', () => {
    test('categorizes hooks into correct tiers', async () => {
      const result = await categorizer.categorize(mockHooks);

      expect(result.tier1).toHaveLength(3); // commit-message-validator, typescript-validator, custom-security
      expect(result.tier2).toHaveLength(2); // api-standards-checker, data-quality-reporter
      expect(result.tier3).toHaveLength(2); // notification, optional-helper
      expect(result.utils).toHaveLength(1); // utils/helper

      expect(result.tier1[0].name).toBe('commit-message-validator.py');
      expect(result.tier1[0].tier).toBe('tier1');
      expect(result.tier1[0].importance).toBe('critical');
    });

    test('adds metadata to categorized hooks', async () => {
      const result = await categorizer.categorize([mockHooks[0]]);
      const hook = result.tier1[0];

      expect(hook).toHaveProperty('tier', 'tier1');
      expect(hook).toHaveProperty('category', 'validation');
      expect(hook).toHaveProperty('description');
      expect(hook).toHaveProperty('importance', 'critical');
    });

    test('handles empty hook list', async () => {
      const result = await categorizer.categorize([]);

      expect(result.tier1).toEqual([]);
      expect(result.tier2).toEqual([]);
      expect(result.tier3).toEqual([]);
      expect(result.utils).toEqual([]);
    });
  });

  describe('determineHookTier', () => {
    test('categorizes utils based on path', () => {
      const hook = { name: 'helper.py', path: '/hooks/utils/helper.py' };
      expect(categorizer.determineHookTier(hook)).toBe('utils');
    });

    test('categorizes tier1 hooks by name', () => {
      const hook = { name: 'commit-message-validator.py' };
      expect(categorizer.determineHookTier(hook)).toBe('tier1');
    });

    test('categorizes tier2 hooks by pattern', () => {
      const hook = { name: 'custom-checker.py' };
      expect(categorizer.determineHookTier(hook)).toBe('tier2');
    });

    test('categorizes tier3 hooks by pattern', () => {
      const hook = { name: 'custom-notification.py' };
      expect(categorizer.determineHookTier(hook)).toBe('tier3');
    });

    test('categorizes by content keywords', () => {
      const securityHook = { 
        name: 'custom.py', 
        content: 'This hook handles security authentication' 
      };
      expect(categorizer.determineHookTier(securityHook)).toBe('tier1');

      const qualityHook = { 
        name: 'custom.py', 
        content: 'This hook checks code quality standards' 
      };
      expect(categorizer.determineHookTier(qualityHook)).toBe('tier2');
    });

    test('defaults to tier3 when no match', () => {
      const hook = { name: 'unknown-hook.py' };
      expect(categorizer.determineHookTier(hook)).toBe('tier3');
    });

    test('pattern matching is case insensitive', () => {
      const hook = { name: 'SECURITY-CHECK.py' };
      expect(categorizer.determineHookTier(hook)).toBe('tier1');
    });
  });

  describe('getHookCategory', () => {
    test('identifies validation category', () => {
      expect(categorizer.getHookCategory({ name: 'input-validator.py' })).toBe('validation');
      expect(categorizer.getHookCategory({ name: 'data-validation.py' })).toBe('validation');
    });

    test('identifies enforcement category', () => {
      expect(categorizer.getHookCategory({ name: 'rule-enforcer.py' })).toBe('enforcement');
      expect(categorizer.getHookCategory({ name: 'policy-enforce.py' })).toBe('enforcement');
    });

    test('identifies checking category', () => {
      expect(categorizer.getHookCategory({ name: 'style-checker.py' })).toBe('checking');
      expect(categorizer.getHookCategory({ name: 'syntax-check.py' })).toBe('checking');
    });

    test('identifies reporting category', () => {
      expect(categorizer.getHookCategory({ name: 'error-reporter.py' })).toBe('reporting');
      expect(categorizer.getHookCategory({ name: 'status-report.py' })).toBe('reporting');
    });

    test('identifies linting category', () => {
      expect(categorizer.getHookCategory({ name: 'code-linter.py' })).toBe('linting');
      expect(categorizer.getHookCategory({ name: 'style-lint.py' })).toBe('linting');
    });

    test('identifies organization category', () => {
      expect(categorizer.getHookCategory({ name: 'file-organizer.py' })).toBe('organization');
      expect(categorizer.getHookCategory({ name: 'import-organize.py' })).toBe('organization');
    });

    test('identifies notification category', () => {
      expect(categorizer.getHookCategory({ name: 'email-notification.py' })).toBe('notification');
      expect(categorizer.getHookCategory({ name: 'slack-notify.py' })).toBe('notification');
    });

    test('identifies utility category', () => {
      expect(categorizer.getHookCategory({ name: 'utils.py' })).toBe('utility');
      expect(categorizer.getHookCategory({ name: 'helper.py', content: 'utility functions' })).toBe('utility');
    });

    test('identifies lifecycle category', () => {
      expect(categorizer.getHookCategory({ name: 'pre_commit.py' })).toBe('lifecycle');
      expect(categorizer.getHookCategory({ name: 'post_build.py' })).toBe('lifecycle');
    });

    test('defaults to general category', () => {
      expect(categorizer.getHookCategory({ name: 'custom.py' })).toBe('general');
    });
  });

  describe('getHookDescription', () => {
    test('returns predefined descriptions', () => {
      expect(categorizer.getHookDescription({ name: 'commit-message-validator.py' }))
        .toBe('Validates commit message format and content');
      
      expect(categorizer.getHookDescription({ name: 'typescript-validator.py' }))
        .toBe('Validates TypeScript code and type safety');
    });

    test('generates descriptions for unknown hooks', () => {
      expect(categorizer.getHookDescription({ name: 'custom-hook.py' }))
        .toBe('Custom Hook hook');
      
      expect(categorizer.getHookDescription({ name: 'data_processor.py' }))
        .toBe('Data Processor hook');
    });

    test('handles complex hook names', () => {
      expect(categorizer.getHookDescription({ name: 'api-response-validator.py' }))
        .toBe('Api Response Validator hook');
    });
  });

  describe('getImportanceLevel', () => {
    test('returns correct importance levels', () => {
      expect(categorizer.getImportanceLevel('tier1')).toBe('critical');
      expect(categorizer.getImportanceLevel('tier2')).toBe('important');
      expect(categorizer.getImportanceLevel('tier3')).toBe('optional');
      expect(categorizer.getImportanceLevel('utils')).toBe('utility');
    });

    test('defaults to optional for unknown tier', () => {
      expect(categorizer.getImportanceLevel('unknown')).toBe('optional');
    });
  });

  describe('analyzeHookContent', () => {
    test('detects security features', () => {
      const content = 'Check user authentication and permissions';
      const features = categorizer.analyzeHookContent(content);
      
      expect(features.hasSecurityChecks).toBe(true);
      expect(features.hasValidation).toBe(false);
    });

    test('detects validation features', () => {
      const content = 'Validate input and ensure data integrity';
      const features = categorizer.analyzeHookContent(content);
      
      expect(features.hasValidation).toBe(true);
      expect(features.hasEnforcement).toBe(true);
    });

    test('detects enforcement features', () => {
      const content = 'Enforce rules and block invalid requests';
      const features = categorizer.analyzeHookContent(content);
      
      expect(features.hasEnforcement).toBe(true);
    });

    test('detects reporting features', () => {
      const content = 'Track metrics and report statistics';
      const features = categorizer.analyzeHookContent(content);
      
      expect(features.hasReporting).toBe(true);
    });

    test('detects notification features', () => {
      const content = 'Send email alerts when errors occur';
      const features = categorizer.analyzeHookContent(content);
      
      expect(features.hasNotification).toBe(true);
    });

    test('detects async features', () => {
      const content = 'async def process(): await fetch_data()';
      const features = categorizer.analyzeHookContent(content);
      
      expect(features.isAsync).toBe(true);
    });

    test('detects external API usage', () => {
      const content = 'Make HTTP request to external API';
      const features = categorizer.analyzeHookContent(content);
      
      expect(features.usesExternalAPI).toBe(true);
    });

    test('handles empty content', () => {
      const features = categorizer.analyzeHookContent('');
      
      expect(features.hasSecurityChecks).toBe(false);
      expect(features.hasValidation).toBe(false);
      expect(features.hasEnforcement).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('handles hooks without content', async () => {
      const hooks = [{ name: 'test.py' }];
      const result = await categorizer.categorize(hooks);
      
      expect(result.tier3).toHaveLength(1);
    });

    test('handles hooks without path', async () => {
      const hooks = [{ name: 'validator.py', content: 'validation logic' }];
      const result = await categorizer.categorize(hooks);
      
      expect(result.tier1).toHaveLength(1);
    });

    test('handles hooks with only path', async () => {
      const hooks = [{ path: '/hooks/utils/helper.py' }];
      const result = await categorizer.categorize(hooks);
      
      expect(result.utils).toHaveLength(1);
    });

    test('preserves original hook properties', async () => {
      const hook = {
        name: 'test.py',
        customProp: 'value',
        size: 100
      };
      
      const result = await categorizer.categorize([hook]);
      const categorizedHook = result.tier3[0];
      
      expect(categorizedHook.customProp).toBe('value');
      expect(categorizedHook.size).toBe(100);
    });

    test('handles special characters in hook names', () => {
      const hook = { name: 'test@#$%-validator.py' };
      expect(categorizer.determineHookTier(hook)).toBe('tier1');
    });
  });
});