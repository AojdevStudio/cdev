const path = require('path');

const fs = require('fs-extra');

const HookCategorizer = require('./hook-categorizer');
const HookSelector = require('./hook-selector');
const HookOrganizer = require('./hook-organizer');

/**
 * HookManager - Central class for managing Claude Code hooks
 * Coordinates categorization, selection, and organization of hooks
 */
class HookManager {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.hooksPath = path.join(projectPath, '.claude', 'hooks');
    this.categorizer = new HookCategorizer();
    this.selector = new HookSelector();
    this.organizer = new HookOrganizer(this.hooksPath);
  }

  /**
   * Initialize the hook system with tier-based organization
   */
  async initialize() {
    // Ensure hook directories exist
    await this.ensureHookDirectories();

    // Load and categorize existing hooks
    const hooks = await this.loadExistingHooks();
    const categorizedHooks = await this.categorizer.categorize(hooks);

    // Organize hooks into tier directories
    await this.organizer.organize(categorizedHooks);

    return categorizedHooks;
  }

  /**
   * Ensure tier directories and structure exist
   */
  async ensureHookDirectories() {
    const tiers = ['tier1', 'tier2', 'tier3', 'utils'];

    for (const tier of tiers) {
      const tierPath = path.join(this.hooksPath, tier);
      await fs.ensureDir(tierPath);
    }
  }

  /**
   * Load all existing hooks from the hooks directory
   */
  async loadExistingHooks() {
    const hooks = [];

    if (!(await fs.pathExists(this.hooksPath))) {
      return hooks;
    }

    const files = await fs.readdir(this.hooksPath);

    for (const file of files) {
      const filePath = path.join(this.hooksPath, file);
      const stat = await fs.stat(filePath);

      // Skip directories and non-Python files
      if (stat.isDirectory() || !file.endsWith('.py')) {
        continue;
      }

      // Read hook content for analysis
      const content = await fs.readFile(filePath, 'utf-8');

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
