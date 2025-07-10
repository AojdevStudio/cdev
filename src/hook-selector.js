/**
 * HookSelector - Selects appropriate hooks based on project type and user preferences
 */
class HookSelector {
  constructor() {
    // Define project type configurations
    this.projectConfigs = {
      'node': {
        requiredTiers: ['tier1'],
        recommendedHooks: [
          'commit-message-validator.py',
          'code-quality-reporter.py',
          'universal-linter.py'
        ],
        excludeHooks: ['typescript-validator.py']
      },
      'typescript': {
        requiredTiers: ['tier1'],
        recommendedHooks: [
          'commit-message-validator.py',
          'typescript-validator.py',
          'code-quality-reporter.py',
          'universal-linter.py',
          'import-organizer.py'
        ],
        excludeHooks: []
      },
      'react': {
        requiredTiers: ['tier1'],
        recommendedHooks: [
          'commit-message-validator.py',
          'typescript-validator.py',
          'code-quality-reporter.py',
          'universal-linter.py',
          'import-organizer.py'
        ],
        excludeHooks: []
      },
      'python': {
        requiredTiers: ['tier1'],
        recommendedHooks: [
          'commit-message-validator.py',
          'code-quality-reporter.py',
          'universal-linter.py',
          'import-organizer.py'
        ],
        excludeHooks: ['typescript-validator.py', 'pnpm-enforcer.py']
      },
      'monorepo': {
        requiredTiers: ['tier1', 'tier2'],
        recommendedHooks: [
          'commit-message-validator.py',
          'typescript-validator.py',
          'pnpm-enforcer.py',
          'task-completion-enforcer.py',
          'code-quality-reporter.py',
          'universal-linter.py',
          'import-organizer.py'
        ],
        excludeHooks: []
      },
      'api': {
        requiredTiers: ['tier1'],
        recommendedHooks: [
          'commit-message-validator.py',
          'api-standards-checker.py',
          'code-quality-reporter.py',
          'universal-linter.py'
        ],
        excludeHooks: []
      },
      'default': {
        requiredTiers: ['tier1'],
        recommendedHooks: [
          'commit-message-validator.py',
          'code-quality-reporter.py',
          'universal-linter.py'
        ],
        excludeHooks: []
      }
    };
  }

  /**
   * Select hooks based on project type and preferences
   */
  selectHooks(categorizedHooks, projectType, preferences = {}) {
    const config = this.getProjectConfig(projectType);
    const selectedHooks = [];

    // Get hooks from required tiers
    for (const tier of config.requiredTiers) {
      if (categorizedHooks[tier]) {
        const tierHooks = this.filterTierHooks(
          categorizedHooks[tier],
          config,
          preferences
        );
        selectedHooks.push(...tierHooks);
      }
    }

    // Add recommended hooks if not already included
    if (!preferences.minimalSetup) {
      for (const hookName of config.recommendedHooks) {
        const hook = this.findHookByName(categorizedHooks, hookName);
        if (hook && !selectedHooks.some(h => h.name === hookName)) {
          selectedHooks.push(hook);
        }
      }
    }

    // Add user-requested hooks
    if (preferences.includeHooks) {
      for (const hookName of preferences.includeHooks) {
        const hook = this.findHookByName(categorizedHooks, hookName);
        if (hook && !selectedHooks.some(h => h.name === hookName)) {
          selectedHooks.push(hook);
        }
      }
    }

    // Apply user preferences
    return this.applyPreferences(selectedHooks, preferences);
  }

  /**
   * Get project configuration
   */
  getProjectConfig(projectType) {
    return this.projectConfigs[projectType] || this.projectConfigs.default;
  }

  /**
   * Filter hooks from a tier based on configuration
   */
  filterTierHooks(tierHooks, config, preferences) {
    return tierHooks.filter(hook => {
      // Exclude hooks in the exclude list
      if (config.excludeHooks.includes(hook.name)) {
        return false;
      }

      // Exclude hooks user doesn't want
      if (preferences.excludeHooks && preferences.excludeHooks.includes(hook.name)) {
        return false;
      }

      // Include critical hooks by default
      if (hook.importance === 'critical' && !preferences.noCritical) {
        return true;
      }

      // Include if it's a recommended hook
      if (config.recommendedHooks.includes(hook.name)) {
        return true;
      }

      // Otherwise, only include if not minimal setup
      return !preferences.minimalSetup;
    });
  }

  /**
   * Find a hook by name across all tiers
   */
  findHookByName(categorizedHooks, hookName) {
    for (const [tier, hooks] of Object.entries(categorizedHooks)) {
      const hook = hooks.find(h => h.name === hookName);
      if (hook) {
        return hook;
      }
    }
    return null;
  }

  /**
   * Apply user preferences to selected hooks
   */
  applyPreferences(hooks, preferences) {
    let filtered = [...hooks];

    // Apply category filters
    if (preferences.includeCategories) {
      filtered = filtered.filter(hook => 
        preferences.includeCategories.includes(hook.category)
      );
    }

    if (preferences.excludeCategories) {
      filtered = filtered.filter(hook => 
        !preferences.excludeCategories.includes(hook.category)
      );
    }

    // Apply importance filter
    if (preferences.minImportance) {
      const importanceLevels = ['optional', 'important', 'critical'];
      const minIndex = importanceLevels.indexOf(preferences.minImportance);
      
      filtered = filtered.filter(hook => {
        const hookIndex = importanceLevels.indexOf(hook.importance);
        return hookIndex >= minIndex;
      });
    }

    // Sort by importance (critical first)
    filtered.sort((a, b) => {
      const order = { critical: 0, important: 1, optional: 2, utility: 3 };
      return (order[a.importance] || 3) - (order[b.importance] || 3);
    });

    return filtered;
  }

  /**
   * Get hook recommendations for a project
   */
  getRecommendations(projectType, existingHooks = []) {
    const config = this.getProjectConfig(projectType);
    const recommendations = {
      required: [],
      recommended: [],
      optional: []
    };

    // Check for missing required hooks
    for (const hookName of config.recommendedHooks) {
      if (!existingHooks.includes(hookName)) {
        if (hookName.includes('validator') || hookName.includes('enforcer')) {
          recommendations.required.push(hookName);
        } else {
          recommendations.recommended.push(hookName);
        }
      }
    }

    // Add optional hooks based on project type
    if (projectType === 'monorepo') {
      recommendations.optional.push('notification.py');
    }

    return recommendations;
  }

  /**
   * Detect project type from package.json or other files
   */
  async detectProjectType(projectPath) {
    const fs = require('fs-extra');
    const path = require('path');

    try {
      // Check for package.json
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        
        // Check for TypeScript
        if (packageJson.devDependencies?.typescript || 
            packageJson.dependencies?.typescript) {
          
          // Check for React
          if (packageJson.dependencies?.react) {
            return 'react';
          }
          
          return 'typescript';
        }

        // Check for monorepo
        if (packageJson.workspaces || await fs.pathExists(path.join(projectPath, 'lerna.json'))) {
          return 'monorepo';
        }

        // Check for API frameworks
        if (packageJson.dependencies?.express || 
            packageJson.dependencies?.fastify ||
            packageJson.dependencies?.['@nestjs/core']) {
          return 'api';
        }

        return 'node';
      }

      // Check for Python
      if (await fs.pathExists(path.join(projectPath, 'requirements.txt')) ||
          await fs.pathExists(path.join(projectPath, 'setup.py')) ||
          await fs.pathExists(path.join(projectPath, 'pyproject.toml'))) {
        return 'python';
      }

      return 'default';
    } catch (error) {
      return 'default';
    }
  }
}

module.exports = HookSelector;