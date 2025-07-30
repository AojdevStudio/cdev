/**
 * Hook Categorization Engine
 *
 * The HookCategorizer is responsible for analyzing hook files and categorizing them
 * into appropriate tiers based on their functionality, importance, and security impact.
 * This categorization system ensures that critical hooks are properly prioritized
 * and organized for optimal workflow integration.
 *
 * Tier Classification System:
 * - Tier 1 (Critical): Security, validation, and enforcement hooks that are mandatory
 *   for maintaining code quality and security standards. These hooks can block operations.
 *
 * - Tier 2 (Important): Quality, standards, and automation hooks that significantly
 *   improve code maintainability and consistency. These are recommended for most projects.
 *
 * - Tier 3 (Optional): Convenience and notification hooks that enhance developer
 *   experience but are not essential for core functionality.
 *
 * - Utils: Shared utilities and helper functions that provide common functionality
 *   used by hooks across all tiers.
 *
 * Categorization Strategy:
 * The categorizer uses multiple analysis techniques including filename patterns,
 * content analysis, keyword matching, and explicit hook lists to determine
 * the appropriate tier for each hook.
 */
class HookCategorizer {
  /**
   * Initialize the categorization engine with tier classification rules
   *
   * Sets up the comprehensive rule system used to analyze and categorize hooks.
   * Each tier has specific patterns, keywords, and explicit hook lists that
   * guide the categorization process.
   */
  constructor() {
    // Define comprehensive hook categorization rules by tier
    // Each tier contains patterns, keywords, and explicit hook lists for accurate classification
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
   * Main Hook Categorization Process
   *
   * Analyzes a collection of hooks and categorizes them into appropriate tiers
   * based on their functionality, security impact, and importance. Each hook
   * is enhanced with additional metadata for better organization and selection.
   *
   * Categorization Process:
   * 1. Initialize tier buckets (tier1, tier2, tier3, utils)
   * 2. For each hook, determine its appropriate tier
   * 3. Classify hook functionality and generate description
   * 4. Assign importance level based on tier classification
   * 5. Create enhanced hook object with all metadata
   * 6. Group categorized hooks by tier for organized access
   *
   * @param {Array} hooks - Array of hook objects with name, path, content, and metadata
   * @returns {object} Categorized hooks organized by tier with enhanced metadata
   *
   * Return Structure:
   * {
   *   tier1: [hook objects], // Critical security and validation hooks
   *   tier2: [hook objects], // Important quality and standards hooks
   *   tier3: [hook objects], // Optional convenience hooks
   *   utils: [hook objects]  // Shared utilities and helper functions
   * }
   */
  async categorize(hooks) {
    // Initialize tier-based categorization buckets
    const categorized = {
      tier1: [], // Critical hooks that can block operations
      tier2: [], // Important hooks for code quality
      tier3: [], // Optional convenience hooks
      utils: [], // Shared utilities and helpers
    };

    // Process each hook through the categorization pipeline
    for (const hook of hooks) {
      // Step 1: Determine appropriate tier based on analysis
      const tier = this.determineHookTier(hook);

      // Step 2: Create enhanced hook object with additional metadata
      const categorizedHook = {
        ...hook, // Preserve original hook data
        tier, // Assigned tier classification
        category: this.getHookCategory(hook), // Functional category (validation, enforcement, etc.)
        description: this.getHookDescription(hook), // Human-readable description
        importance: this.getImportanceLevel(tier), // Importance level based on tier
      };

      // Step 3: Add categorized hook to appropriate tier bucket
      categorized[tier].push(categorizedHook);
    }

    return categorized;
  }

  /**
   * Tier Determination Algorithm
   *
   * Analyzes a single hook to determine its appropriate tier classification.
   * Uses multiple analysis techniques in priority order to ensure accurate
   * categorization based on functionality and importance.
   *
   * Analysis Priority Order:
   * 1. Path-based detection (utils directory check)
   * 2. Explicit hook name matching (predefined lists)
   * 3. Filename pattern matching (regex patterns)
   * 4. Content-based keyword analysis
   * 5. Default tier assignment (tier3 as fallback)
   *
   * @param {object} hook - Hook object with name, path, and content
   * @returns {string} Tier classification ('tier1', 'tier2', 'tier3', 'utils')
   *
   * Special Cases:
   * - Hooks in /utils/ subdirectory are automatically classified as 'utils'
   * - Explicit hook lists take precedence over pattern/keyword matching
   * - Content analysis is used for hooks without clear filename indicators
   */
  determineHookTier(hook) {
    // Priority 1: Utility Detection
    // Check if hook is in utils subdirectory - these are shared helper functions
    if (hook.path && hook.path.includes('/utils/')) {
      return 'utils';
    }

    // Priority 2-4: Tier-based Analysis
    // Check each tier's classification rules in order (tier1 -> tier2 -> tier3 -> utils)
    for (const [tier, rules] of Object.entries(this.categoryRules)) {
      // Priority 2: Explicit Hook Name Matching
      // Check if hook name is in the predefined list for this tier
      if (rules.hooks.includes(hook.name)) {
        return tier;
      }

      // Priority 3: Filename Pattern Matching
      // Check if hook name or path matches tier-specific regex patterns
      for (const pattern of rules.patterns) {
        if (pattern.test(hook.name) || (hook.path && pattern.test(hook.path))) {
          return tier;
        }
      }

      // Priority 4: Content-based Keyword Analysis
      // Analyze hook content for tier-specific keywords and functionality indicators
      if (hook.content) {
        const contentLower = hook.content.toLowerCase();
        for (const keyword of rules.keywords) {
          if (contentLower.includes(keyword)) {
            return tier;
          }
        }
      }
    }

    // Priority 5: Default Fallback
    // If no specific tier can be determined, default to tier3 (optional)
    // This ensures all hooks are categorized and available for selection
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
