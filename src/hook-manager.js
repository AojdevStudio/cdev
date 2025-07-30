// Core Node.js modules for file system operations
const path = require('path');

// Enhanced file system operations with promises
const fs = require('fs-extra');

// Hook management system components
const HookCategorizer = require('./hook-categorizer');
const HookSelector = require('./hook-selector');
const HookOrganizer = require('./hook-organizer');

/**
 * Central Hook Management Coordinator
 *
 * The HookManager serves as the primary orchestrator for the Claude Code hook system,
 * coordinating the categorization, selection, and organization of hooks across the
 * entire CDEV installation. It provides a unified interface for managing hooks
 * throughout their lifecycle from installation to execution.
 *
 * Architecture Overview:
 * - HookCategorizer: Analyzes hooks and assigns them to appropriate tiers (tier1-3, utils)
 * - HookSelector: Chooses relevant hooks based on project type and user preferences
 * - HookOrganizer: Manages the physical organization of hooks in tier-based directories
 *
 * Hook Tier System:
 * - Tier 1: Critical security and validation hooks (mandatory)
 * - Tier 2: Important quality and standards hooks (recommended)
 * - Tier 3: Optional convenience and notification hooks (optional)
 * - Utils: Shared utilities and helper functions (dependencies)
 *
 * Workflow Integration:
 * The hook system integrates with Claude Code's lifecycle events to provide
 * automated quality gates, validation, and workflow enhancements.
 */
class HookManager {
  /**
   * Initialize the hook management system
   *
   * Sets up the hook management components and establishes the directory structure
   * for organizing hooks in a tier-based system. Each component is specialized
   * for a specific aspect of hook management.
   *
   * @param {string} projectPath - Root directory of the project (defaults to current working directory)
   */
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.hooksPath = path.join(projectPath, '.claude', 'hooks'); // Standard hooks directory location

    // Initialize specialized hook management components
    this.categorizer = new HookCategorizer(); // Analyzes and categorizes hooks by importance and functionality
    this.selector = new HookSelector(); // Selects appropriate hooks based on project requirements
    this.organizer = new HookOrganizer(this.hooksPath); // Manages physical organization and file operations
  }

  /**
   * Hook System Initialization
   *
   * Performs the complete setup and organization of the hook system. This method
   * coordinates the discovery, categorization, and organization of existing hooks
   * into the tier-based directory structure.
   *
   * Initialization Process:
   * 1. Create necessary directory structure (tier1, tier2, tier3, utils)
   * 2. Discover and load existing hooks from the filesystem
   * 3. Analyze and categorize hooks based on their purpose and importance
   * 4. Organize hooks into appropriate tier directories
   * 5. Generate registry and manifest files for tracking
   *
   * @returns {object} Categorized hooks organized by tier (tier1, tier2, tier3, utils)
   *
   * This method is idempotent and can be called multiple times safely.
   */
  async initialize() {
    // Step 1: Ensure the tier-based directory structure exists
    await this.ensureHookDirectories();

    // Step 2: Discover and load existing hooks from the filesystem
    const hooks = await this.loadExistingHooks();

    // Step 3: Categorize hooks based on their functionality and importance
    const categorizedHooks = await this.categorizer.categorize(hooks);

    // Step 4: Organize hooks into their appropriate tier directories
    await this.organizer.organize(categorizedHooks);

    return categorizedHooks;
  }

  /**
   * Directory Structure Creation
   *
   * Ensures that all required tier directories exist in the hooks path.
   * This creates the foundational directory structure for the tier-based
   * hook organization system.
   *
   * Directory Structure:
   * - .claude/hooks/tier1/ - Critical security and validation hooks
   * - .claude/hooks/tier2/ - Important quality and standards hooks
   * - .claude/hooks/tier3/ - Optional convenience hooks
   * - .claude/hooks/utils/ - Shared utilities and helper functions
   *
   * This method is safe to call multiple times and will not overwrite existing directories.
   */
  async ensureHookDirectories() {
    const tiers = ['tier1', 'tier2', 'tier3', 'utils'];

    // Create each tier directory, including parent directories if needed
    for (const tier of tiers) {
      const tierPath = path.join(this.hooksPath, tier);
      await fs.ensureDir(tierPath); // Creates directory and any missing parent directories
    }
  }

  /**
   * Hook Discovery and Loading
   *
   * Scans the hooks directory for existing hook files and loads their metadata
   * and content for analysis. This method provides the foundation for hook
   * categorization and organization.
   *
   * Discovery Process:
   * 1. Check if hooks directory exists (return empty array if not)
   * 2. Scan for Python (.py) hook files in the root directory
   * 3. Read file content and gather metadata (size, modification time)
   * 4. Create hook objects with all necessary information for categorization
   *
   * File Type Filter: Currently only processes .py files, but can be extended
   * to support other hook types (shell scripts, JavaScript, etc.).
   *
   * @returns {Array} Array of hook objects with metadata and content
   *
   * Hook Object Structure:
   * - name: filename of the hook
   * - path: absolute path to the hook file
   * - content: full file content for analysis
   * - size: file size in bytes
   * - modified: last modification timestamp
   */
  async loadExistingHooks() {
    const hooks = [];

    // Check if hooks directory exists before attempting to read it
    if (!(await fs.pathExists(this.hooksPath))) {
      return hooks; // Return empty array if hooks directory doesn't exist
    }

    // Get list of all files in the hooks directory
    const files = await fs.readdir(this.hooksPath);

    // Process each file to determine if it's a valid hook
    for (const file of files) {
      const filePath = path.join(this.hooksPath, file);
      const stat = await fs.stat(filePath);

      // Skip directories and non-Python files
      // This filter can be extended to support additional hook types
      if (stat.isDirectory() || !file.endsWith('.py')) {
        continue;
      }

      // Read hook content for categorization analysis
      const content = await fs.readFile(filePath, 'utf-8');

      // Create hook object with all necessary metadata
      hooks.push({
        name: file,
        path: filePath,
        content,
        size: stat.size,
        modified: stat.mtime,
      });
    }

    return hooks;
  }

  /**
   * Select hooks based on project type and preferences
   */
  async selectHooks(projectType, preferences = {}) {
    const categorizedHooks = await this.organizer.getCategorizedHooks();
    return this.selector.selectHooks(categorizedHooks, projectType, preferences);
  }

  /**
   * Install selected hooks into the project
   */
  async installHooks(selectedHooks) {
    const installedHooks = [];

    for (const hook of selectedHooks) {
      const sourcePath = hook.currentPath || hook.path;
      const destPath = path.join(this.hooksPath, path.basename(hook.name));

      // Copy hook to project hooks directory
      await fs.copy(sourcePath, destPath);

      installedHooks.push({
        name: hook.name,
        tier: hook.tier,
        path: destPath,
      });
    }

    return installedHooks;
  }

  /**
   * Get hook statistics and organization info
   */
  async getHookStats() {
    const categorizedHooks = await this.organizer.getCategorizedHooks();

    const stats = {
      total: 0,
      byTier: {
        tier1: 0,
        tier2: 0,
        tier3: 0,
        utils: 0,
      },
      hooks: [],
    };

    for (const [tier, hooks] of Object.entries(categorizedHooks)) {
      stats.byTier[tier] = hooks.length;
      stats.total += hooks.length;

      for (const hook of hooks) {
        stats.hooks.push({
          name: hook.name,
          tier,
          category: hook.category,
          description: hook.description,
        });
      }
    }

    return stats;
  }

  /**
   * Restructure hooks according to new tier organization
   */
  async restructureHooks() {
    const hooks = await this.loadExistingHooks();
    const categorizedHooks = await this.categorizer.categorize(hooks);

    // Move hooks to their appropriate tier directories
    for (const [tier, tierHooks] of Object.entries(categorizedHooks)) {
      for (const hook of tierHooks) {
        const oldPath = hook.path;
        const newPath = path.join(this.hooksPath, tier, hook.name);

        // Only move if not already in correct location
        if (oldPath !== newPath) {
          await fs.move(oldPath, newPath, { overwrite: true });
          hook.path = newPath;
        }
      }
    }

    return categorizedHooks;
  }
}

module.exports = HookManager;
