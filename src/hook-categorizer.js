/**
 * HookCategorizer - Categorizes hooks into tiers based on security and importance
 *
 * Tier 1 (Critical): Security, validation, and enforcement hooks
 * Tier 2 (Important): Quality, standards, and automation hooks
 * Tier 3 (Optional): Convenience and notification hooks
 * Utils: Shared utilities and helper functions
 */
class HookCategorizer {
  constructor() {
    // Define hook categorization rules
    this.categoryRules = {
      tier1: {
        description: 'Critical security and validation hooks',
        keywords: ['security', 'validation', 'enforcer', 'validator', 'auth', 'permission'],
        patterns: [/validator\.py$/, /enforcer\.py$/, /security/i],
        hooks: [
          'commit-message-validator.py',
          'typescript-validator.py',
          'task-completion-enforcer.py',
          'pnpm-enforcer.py',
        ],
      },
      tier2: {
        description: 'Important quality and standards hooks',
        keywords: ['quality', 'standards', 'linter', 'checker', 'reporter', 'organizer'],
        patterns: [/checker\.py$/, /reporter\.py$/, /linter\.py$/, /organizer\.py$/],
        hooks: [
          'api-standards-checker.py',
          'code-quality-reporter.py',
          'universal-linter.py',
          'import-organizer.py',
        ],
      },
      tier3: {
        description: 'Optional convenience and notification hooks',
        keywords: ['notification', 'helper', 'utility', 'optional'],
        patterns: [/notification\.py$/, /helper\.py$/],
        hooks: [
          'notification.py',
          'stop.py',
          'subagent_stop.py',
          'pre_tool_use.py',
          'post_tool_use.py',
        ],
      },
      utils: {
        description: 'Shared utilities and helper functions',
        keywords: ['util', 'utils', 'helper', 'shared', 'common'],
        patterns: [/utils?\//],
        hooks: [],
      },
    };
  }

  /**
   * Categorize a list of hooks into tiers
   */
  async categorize(hooks) {
    const categorized = {
      tier1: [],
      tier2: [],
      tier3: [],
      utils: [],
    };

    for (const hook of hooks) {
      const tier = this.determineHookTier(hook);
      const categorizedHook = {
        ...hook,
        tier,
        category: this.getHookCategory(hook),
        description: this.getHookDescription(hook),
        importance: this.getImportanceLevel(tier),
      };

      categorized[tier].push(categorizedHook);
    }

    return categorized;
  }

  /**
   * Determine which tier a hook belongs to
   */
  determineHookTier(hook) {
    // Check if it's a utility
    if (hook.path && hook.path.includes('/utils/')) {
      return 'utils';
    }

    // Check each tier's rules
    for (const [tier, rules] of Object.entries(this.categoryRules)) {
      // Check if hook name is in explicit list
      if (rules.hooks.includes(hook.name)) {
        return tier;
      }

      // Check patterns
      for (const pattern of rules.patterns) {
        if (pattern.test(hook.name) || (hook.path && pattern.test(hook.path))) {
          return tier;
        }
      }

      // Check keywords in content
      if (hook.content) {
        const contentLower = hook.content.toLowerCase();
        for (const keyword of rules.keywords) {
          if (contentLower.includes(keyword)) {
            return tier;
          }
        }
      }
    }

    // Default to tier3 if no match
    return 'tier3';
  }

  /**
   * Get the category of a hook based on its functionality
   */
  getHookCategory(hook) {
    const name = hook.name.toLowerCase();
    const content = (hook.content || '').toLowerCase();

    if (name.includes('validator') || name.includes('validation')) {
      return 'validation';
    }
    if (name.includes('enforcer') || name.includes('enforce')) {
      return 'enforcement';
    }
    if (name.includes('checker') || name.includes('check')) {
      return 'checking';
    }
    if (name.includes('reporter') || name.includes('report')) {
      return 'reporting';
    }
    if (name.includes('linter') || name.includes('lint')) {
      return 'linting';
    }
    if (name.includes('organizer') || name.includes('organize')) {
      return 'organization';
    }
    if (name.includes('notification') || name.includes('notify')) {
      return 'notification';
    }
    if (name.includes('util') || content.includes('utility')) {
      return 'utility';
    }
    if (name.includes('pre_') || name.includes('post_')) {
      return 'lifecycle';
    }

    return 'general';
  }

  /**
   * Get a description of what the hook does
   */
  getHookDescription(hook) {
    const descriptions = {
      'commit-message-validator.py': 'Validates commit message format and content',
      'typescript-validator.py': 'Validates TypeScript code and type safety',
      'task-completion-enforcer.py': 'Ensures tasks are completed before proceeding',
      'pnpm-enforcer.py': 'Enforces use of pnpm package manager',
      'api-standards-checker.py': 'Checks API code against standards',
      'code-quality-reporter.py': 'Reports on code quality metrics',
      'universal-linter.py': 'Runs linting across multiple file types',
      'import-organizer.py': 'Organizes and sorts import statements',
      'notification.py': 'Sends notifications for various events',
      'stop.py': 'Handles stop events',
      'subagent_stop.py': 'Handles subagent stop events',
      'pre_tool_use.py': 'Runs before tool usage',
      'post_tool_use.py': 'Runs after tool usage',
    };

    return descriptions[hook.name] || this.generateDescription(hook);
  }

  /**
   * Generate a description based on hook name and content
   */
  generateDescription(hook) {
    const name = hook.name.replace('.py', '').replace(/-/g, ' ').replace(/_/g, ' ');
    const words = name.split(' ');

    // Capitalize first letter of each word
    const formatted = words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    return `${formatted} hook`;
  }

  /**
   * Get importance level for a tier
   */
  getImportanceLevel(tier) {
    const levels = {
      tier1: 'critical',
      tier2: 'important',
      tier3: 'optional',
      utils: 'utility',
    };

    return levels[tier] || 'optional';
  }

  /**
   * Analyze hook content for additional categorization hints
   */
  analyzeHookContent(content) {
    const features = {
      hasSecurityChecks: /security|auth|permission|access/i.test(content),
      hasValidation: /validate|check|verify|ensure/i.test(content),
      hasEnforcement: /enforce|require|must|block/i.test(content),
      hasReporting: /report|log|track|monitor/i.test(content),
      hasNotification: /notify|alert|message|email/i.test(content),
      isAsync: /async|await|promise/i.test(content),
      usesExternalAPI: /request|fetch|api|http/i.test(content),
    };

    return features;
  }
}

module.exports = HookCategorizer;
