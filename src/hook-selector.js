/**
 * Hook Selection and Project Type Matching System
 *
 * The HookSelector is responsible for intelligently selecting the most appropriate
 * hooks for a project based on its type, framework, and user preferences. It provides
 * a sophisticated matching system that balances project requirements with user choice.
 *
 * Core Functionality:
 * - Project type detection and classification (Node.js, Python, React, monorepo, etc.)
 * - Hook selection based on project-specific requirements and best practices
 * - User preference integration for customized hook configurations
 * - Recommendation system for missing or beneficial hooks
 * - Filtering and prioritization based on importance and categories
 *
 * Selection Strategy:
 * 1. Required Tiers: Automatically include hooks from essential tiers
 * 2. Recommended Hooks: Add project-specific recommended hooks
 * 3. User Preferences: Apply user include/exclude preferences
 * 4. Filtering: Remove excluded hooks and apply category filters
 * 5. Prioritization: Sort by importance (critical → important → optional)
 *
 * Project Type Support:
 * - node: Basic Node.js projects
 * - typescript: TypeScript-based projects
 * - react: React applications with TypeScript support
 * - python: Python projects with appropriate tooling
 * - monorepo: Multi-package repositories with enhanced coordination
 * - api: Backend API services with specialized validation
 * - default: Minimal fallback configuration
 */
class HookSelector {
  /**
   * Initialize the hook selector with project type configurations
   *
   * Sets up comprehensive project type configurations that define the hook
   * selection strategy for each supported project type. Each configuration
   * specifies required tiers, recommended hooks, and exclusions.
   */
  constructor() {
    // Define comprehensive project type configurations
    // Each configuration specifies the hook selection strategy for that project type
    this.projectConfigs = {
      // Basic Node.js Projects
      // Focus on fundamental quality gates without TypeScript-specific tooling
      node: {
        requiredTiers: ['tier1'], // Critical security and validation hooks
        recommendedHooks: [
          'commit-message-validator.py', // Ensure consistent commit standards
          'code-quality-reporter.py', // Monitor code quality metrics
          'universal-linter.py', // JavaScript linting and formatting
        ],
        excludeHooks: ['typescript-validator.py'], // Skip TypeScript validation for JS projects
      },
      // TypeScript Projects
      // Enhanced tooling for type safety and code organization
      typescript: {
        requiredTiers: ['tier1'], // Critical hooks including TypeScript validation
        recommendedHooks: [
          'commit-message-validator.py', // Consistent commit standards
          'typescript-validator.py', // TypeScript type checking and validation
          'code-quality-reporter.py', // Code quality monitoring
          'universal-linter.py', // TypeScript/JavaScript linting
          'import-organizer.py', // Import statement organization and optimization
        ],
        excludeHooks: [], // No exclusions - all hooks are relevant for TypeScript
      },
      // React Applications
      // Full frontend development toolchain with TypeScript support
      react: {
        requiredTiers: ['tier1'], // Critical hooks for frontend development
        recommendedHooks: [
          'commit-message-validator.py', // Consistent commit standards
          'typescript-validator.py', // TypeScript support (common in React projects)
          'code-quality-reporter.py', // Code quality monitoring
          'universal-linter.py', // React/TypeScript linting with JSX support
          'import-organizer.py', // React import optimization and organization
        ],
        excludeHooks: [], // All hooks are beneficial for React development
      },
      // Python Projects
      // Python-specific tooling without JavaScript/Node.js dependencies
      python: {
        requiredTiers: ['tier1'], // Critical hooks adapted for Python
        recommendedHooks: [
          'commit-message-validator.py', // Language-agnostic commit standards
          'code-quality-reporter.py', // Python code quality monitoring
          'universal-linter.py', // Python linting (flake8, black, etc.)
          'import-organizer.py', // Python import organization and sorting
        ],
        excludeHooks: ['typescript-validator.py', 'pnpm-enforcer.py'], // Skip JS/Node.js specific tools
      },
      // Monorepo Projects
      // Enhanced coordination and consistency across multiple packages
      monorepo: {
        requiredTiers: ['tier1', 'tier2'], // Critical and important hooks for coordination
        recommendedHooks: [
          'commit-message-validator.py', // Consistent commits across packages
          'typescript-validator.py', // Type consistency across packages
          'pnpm-enforcer.py', // Package manager consistency (important for monorepos)
          'task-completion-enforcer.py', // Task coordination across packages
          'code-quality-reporter.py', // Quality monitoring across all packages
          'universal-linter.py', // Consistent linting across packages
          'import-organizer.py', // Import organization across package boundaries
        ],
        excludeHooks: [], // All hooks provide value in monorepo coordination
      },
      // API/Backend Services
      // Specialized hooks for backend development and API standards
      api: {
        requiredTiers: ['tier1'], // Critical hooks for backend reliability
        recommendedHooks: [
          'commit-message-validator.py', // Consistent commit standards
          'api-standards-checker.py', // API design and consistency validation
          'code-quality-reporter.py', // Backend code quality monitoring
          'universal-linter.py', // Backend code linting and formatting
        ],
        excludeHooks: [], // All recommended hooks are relevant for API development
      },
      // Default Configuration
      // Minimal but essential hook set for unknown or generic projects
      default: {
        requiredTiers: ['tier1'], // Critical hooks only for safety
        recommendedHooks: [
          'commit-message-validator.py', // Universal commit standard enforcement
          'code-quality-reporter.py', // Basic quality monitoring
          'universal-linter.py', // General-purpose linting
        ],
        excludeHooks: [], // No exclusions for maximum compatibility
      },
    };
  }

  /**
   * Main Hook Selection Process
   *
   * Performs intelligent hook selection based on project type and user preferences.
   * This is the primary method that orchestrates the complete selection workflow
   * from project analysis to final hook filtering and prioritization.
   *
   * Selection Workflow:
   * 1. Project Configuration: Load project-specific hook requirements
   * 2. Required Tiers: Include hooks from mandatory tier categories
   * 3. Recommended Hooks: Add project-specific recommended hooks
   * 4. User Inclusions: Add any user-requested additional hooks
   * 5. Preference Filtering: Apply user exclude/include preferences
   * 6. Final Processing: Sort and prioritize the final hook selection
   *
   * @param {object} categorizedHooks - Hooks organized by tier from HookCategorizer
   * @param {string} projectType - Project type identifier (node, react, python, etc.)
   * @param {object} preferences - User preferences for hook selection
   * @param {boolean} preferences.minimalSetup - Use minimal hook set (exclude optional)
   * @param {Array} preferences.includeHooks - Additional hooks to include
   * @param {Array} preferences.excludeHooks - Hooks to exclude from selection
   * @param {Array} preferences.includeCategories - Only include these categories
   * @param {Array} preferences.excludeCategories - Exclude these categories
   * @param {string} preferences.minImportance - Minimum importance level
   * @returns {Array} Selected and prioritized hooks for the project
   */
  selectHooks(categorizedHooks, projectType, preferences = {}) {
    // Step 1: Project Configuration Loading
    // Get the project-specific configuration that defines hook requirements
    const config = this.getProjectConfig(projectType);
    const selectedHooks = [];

    // Step 2: Required Tier Processing
    // Include hooks from tiers that are mandatory for this project type
    for (const tier of config.requiredTiers) {
      if (categorizedHooks[tier]) {
        const tierHooks = this.filterTierHooks(categorizedHooks[tier], config, preferences);
        selectedHooks.push(...tierHooks);
      }
    }

    // Step 3: Recommended Hook Addition
    // Add project-specific recommended hooks unless user wants minimal setup
    if (!preferences.minimalSetup) {
      for (const hookName of config.recommendedHooks) {
        const hook = this.findHookByName(categorizedHooks, hookName);
        if (hook && !selectedHooks.some((h) => h.name === hookName)) {
          selectedHooks.push(hook);
        }
      }
    }

    // Step 4: User-Requested Hook Inclusion
    // Add any additional hooks specifically requested by the user
    if (preferences.includeHooks) {
      for (const hookName of preferences.includeHooks) {
        const hook = this.findHookByName(categorizedHooks, hookName);
        if (hook && !selectedHooks.some((h) => h.name === hookName)) {
          selectedHooks.push(hook);
        }
      }
    }

    // Step 5: Final Preference Processing
    // Apply user filtering, categorization, and prioritization preferences
    return this.applyPreferences(selectedHooks, preferences);
  }

  /**
   * Project Configuration Retrieval
   *
   * Returns the configuration object for a specific project type, including
   * required tiers, recommended hooks, and exclusions. Falls back to default
   * configuration for unknown project types to ensure compatibility.
   *
   * @param {string} projectType - Project type identifier
   * @returns {object} Project configuration with tiers, hooks, and exclusions
   */
  getProjectConfig(projectType) {
    return this.projectConfigs[projectType] || this.projectConfigs.default;
  }

  /**
   * Tier-Based Hook Filtering
   *
   * Filters hooks from a specific tier based on project configuration and
   * user preferences. This method applies multiple filtering criteria to
   * determine which hooks from a tier should be included in the selection.
   *
   * Filtering Criteria:
   * 1. Configuration Exclusions: Remove hooks excluded by project config
   * 2. User Exclusions: Remove hooks excluded by user preferences
   * 3. Critical Hook Inclusion: Always include critical hooks (unless explicitly disabled)
   * 4. Recommended Hook Inclusion: Include hooks recommended for this project type
   * 5. Minimal Setup Filter: Exclude optional hooks in minimal setup mode
   *
   * @param {Array} tierHooks - Hooks from a specific tier to filter
   * @param {object} config - Project configuration with exclusions and recommendations
   * @param {object} preferences - User preferences for filtering
   * @returns {Array} Filtered hooks that meet all criteria
   */
  filterTierHooks(tierHooks, config, preferences) {
    return tierHooks.filter((hook) => {
      // Filter 1: Configuration-Based Exclusions
      // Remove hooks that are incompatible with this project type
      if (config.excludeHooks.includes(hook.name)) {
        return false;
      }

      // Filter 2: User-Specified Exclusions
      // Remove hooks that the user explicitly doesn't want
      if (preferences.excludeHooks && preferences.excludeHooks.includes(hook.name)) {
        return false;
      }

      // Filter 3: Critical Hook Protection
      // Always include critical hooks unless user explicitly disables them
      if (hook.importance === 'critical' && !preferences.noCritical) {
        return true;
      }

      // Filter 4: Recommended Hook Inclusion
      // Include hooks that are recommended for this project type
      if (config.recommendedHooks.includes(hook.name)) {
        return true;
      }

      // Filter 5: Minimal Setup Consideration
      // In minimal mode, exclude optional hooks; otherwise include all remaining
      return !preferences.minimalSetup;
    });
  }

  /**
   * Cross-Tier Hook Search
   *
   * Searches for a specific hook by name across all tier categories.
   * This utility method enables finding hooks regardless of their tier
   * classification, which is useful for user-requested inclusions and
   * recommendation processing.
   *
   * @param {object} categorizedHooks - Hooks organized by tier
   * @param {string} hookName - Name of the hook to find
   * @returns {object|null} Hook object if found, null otherwise
   */
  findHookByName(categorizedHooks, hookName) {
    // Search through all tiers to find the named hook
    for (const hooks of Object.values(categorizedHooks)) {
      const hook = hooks.find((h) => h.name === hookName);
      if (hook) {
        return hook;
      }
    }
    return null; // Hook not found in any tier
  }

  /**
   * User Preference Application and Final Processing
   *
   * Applies comprehensive user preferences to the selected hooks and performs
   * final processing including filtering, categorization, and prioritization.
   * This is the final step in the hook selection process.
   *
   * Preference Processing:
   * 1. User Exclusion Filter: Remove any user-excluded hooks
   * 2. Category Inclusion Filter: Only include specified categories
   * 3. Category Exclusion Filter: Remove excluded categories
   * 4. Importance Threshold Filter: Apply minimum importance requirements
   * 5. Priority Sorting: Sort by importance (critical → important → optional → utility)
   *
   * @param {Array} hooks - Selected hooks before preference application
   * @param {object} preferences - User preferences for final filtering and sorting
   * @returns {Array} Final processed and prioritized hook selection
   */
  applyPreferences(hooks, preferences) {
    // Create a copy to avoid mutating the original array
    let filtered = [...hooks];

    // Step 1: User Exclusion Processing
    // Remove any hooks that the user has explicitly excluded
    if (preferences.excludeHooks) {
      filtered = filtered.filter((hook) => !preferences.excludeHooks.includes(hook.name));
    }

    // Step 2: Category-Based Filtering
    // Apply include/exclude filters based on hook categories
    if (preferences.includeCategories) {
      // Only include hooks from specified categories
      filtered = filtered.filter((hook) => preferences.includeCategories.includes(hook.category));
    }

    if (preferences.excludeCategories) {
      // Exclude hooks from specified categories
      filtered = filtered.filter((hook) => !preferences.excludeCategories.includes(hook.category));
    }

    // Step 3: Importance Threshold Filtering
    // Apply minimum importance level requirements
    if (preferences.minImportance) {
      const importanceLevels = ['optional', 'important', 'critical'];
      const minIndex = importanceLevels.indexOf(preferences.minImportance);

      filtered = filtered.filter((hook) => {
        const hookIndex = importanceLevels.indexOf(hook.importance);
        return hookIndex >= minIndex; // Include if importance meets or exceeds minimum
      });
    }

    // Step 4: Priority-Based Sorting
    // Sort hooks by importance level with critical hooks first
    filtered.sort((a, b) => {
      const order = { critical: 0, important: 1, optional: 2, utility: 3 };
      const aValue = order[a.importance] !== undefined ? order[a.importance] : 3;
      const bValue = order[b.importance] !== undefined ? order[b.importance] : 3;
      return aValue - bValue; // Lower values (higher importance) come first
    });

    return filtered;
  }

  /**
   * Hook Recommendation System
   *
   * Analyzes a project and existing hook setup to provide intelligent
   * recommendations for missing or beneficial hooks. This method helps
   * users discover hooks that would improve their workflow.
   *
   * Recommendation Categories:
   * - Required: Critical missing hooks that should be installed
   * - Recommended: Beneficial hooks that improve workflow quality
   * - Optional: Nice-to-have hooks based on project characteristics
   *
   * Analysis Process:
   * 1. Compare existing hooks against project type requirements
   * 2. Identify missing hooks from recommended list
   * 3. Classify missing hooks by importance (validators/enforcers = required)
   * 4. Add project-specific optional recommendations
   *
   * @param {string} projectType - Type of project being analyzed
   * @param {Array} existingHooks - Currently installed hook names
   * @returns {object} Categorized recommendations for the project
   */
  getRecommendations(projectType, existingHooks = []) {
    // Get project-specific configuration
    const config = this.getProjectConfig(projectType);

    // Initialize recommendation categories
    const recommendations = {
      required: [], // Critical missing hooks
      recommended: [], // Beneficial missing hooks
      optional: [], // Nice-to-have additions
    };

    // Analyze missing hooks from project recommendations
    for (const hookName of config.recommendedHooks) {
      if (!existingHooks.includes(hookName)) {
        // Classify hook importance based on naming conventions and function
        if (hookName.includes('validator') || hookName.includes('enforcer')) {
          // Validators and enforcers are critical for project integrity
          recommendations.required.push(hookName);
        } else {
          // Other hooks are beneficial but not critical
          recommendations.recommended.push(hookName);
        }
      }
    }

    // Add project-specific optional recommendations
    // These are hooks that provide additional value for specific project types
    if (projectType === 'monorepo') {
      // Monorepos benefit from enhanced coordination and notification
      if (!existingHooks.includes('notification.py')) {
        recommendations.optional.push('notification.py');
      }
    }

    return recommendations;
  }

  /**
   * Intelligent Project Type Detection
   *
   * Analyzes a project directory to automatically detect the project type
   * based on configuration files, dependencies, and project structure.
   * This enables automatic hook selection without manual project type specification.
   *
   * Detection Strategy:
   * 1. Node.js Projects: Analyze package.json for frameworks and dependencies
   * 2. TypeScript Detection: Check for TypeScript dependencies and configuration
   * 3. Framework Detection: Identify React, API frameworks, monorepo setup
   * 4. Python Projects: Look for Python-specific files and configuration
   * 5. Fallback: Default configuration for unknown project types
   *
   * Project Type Priority:
   * - React (if React + TypeScript detected)
   * - TypeScript (if TypeScript without React)
   * - Monorepo (if workspace configuration found)
   * - API (if backend frameworks detected)
   * - Node (if package.json without specific framework)
   * - Python (if Python configuration files found)
   * - Default (fallback for unrecognized projects)
   *
   * @param {string} projectPath - Absolute path to the project directory
   * @returns {string} Detected project type identifier
   */
  async detectProjectType(projectPath) {
    // Import required modules for file system operations
    const fs = require('fs-extra');
    const path = require('path');

    try {
      // Primary Detection: Node.js Projects via package.json
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);

        // TypeScript Detection (high priority for frontend projects)
        if (packageJson.devDependencies?.typescript || packageJson.dependencies?.typescript) {
          // React + TypeScript Combination (most specific)
          if (packageJson.dependencies?.react) {
            return 'react';
          }

          // Pure TypeScript Project
          return 'typescript';
        }

        // Monorepo Detection (workspace configuration or Lerna)
        if (packageJson.workspaces || (await fs.pathExists(path.join(projectPath, 'lerna.json')))) {
          return 'monorepo';
        }

        // API/Backend Framework Detection
        if (
          packageJson.dependencies?.express || // Express.js
          packageJson.dependencies?.fastify || // Fastify
          packageJson.dependencies?.['@nestjs/core'] // NestJS
        ) {
          return 'api';
        }

        // Generic Node.js Project (fallback for package.json projects)
        return 'node';
      }

      // Python Project Detection (secondary priority)
      if (
        (await fs.pathExists(path.join(projectPath, 'requirements.txt'))) || // pip requirements
        (await fs.pathExists(path.join(projectPath, 'setup.py'))) || // setuptools configuration
        (await fs.pathExists(path.join(projectPath, 'pyproject.toml'))) // modern Python projects
      ) {
        return 'python';
      }

      // Fallback for unrecognized project types
      return 'default';
    } catch (error) {
      // Error handling: return default on any file system or parsing errors
      return 'default';
    }
  }
}

module.exports = HookSelector;
