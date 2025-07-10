const fs = require('fs-extra');
const path = require('path');

/**
 * HookOrganizer - Organizes hooks into tier directories and maintains references
 */
class HookOrganizer {
  constructor(hooksPath) {
    this.hooksPath = hooksPath;
    this.tierPaths = {
      tier1: path.join(hooksPath, 'tier1'),
      tier2: path.join(hooksPath, 'tier2'),
      tier3: path.join(hooksPath, 'tier3'),
      utils: path.join(hooksPath, 'utils')
    };
    this.hookRegistry = path.join(hooksPath, 'hook-registry.json');
  }

  /**
   * Organize categorized hooks into tier directories
   */
  async organize(categorizedHooks) {
    // Ensure tier directories exist
    await this.ensureTierDirectories();

    // Create hook registry
    const registry = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      hooks: {},
      tiers: {}
    };

    // Organize hooks by tier
    for (const [tier, hooks] of Object.entries(categorizedHooks)) {
      registry.tiers[tier] = [];
      
      for (const hook of hooks) {
        // Determine target path
        const targetPath = await this.getTargetPath(hook, tier);
        
        // Store hook information in registry
        registry.hooks[hook.name] = {
          name: hook.name,
          tier: tier,
          category: hook.category,
          description: hook.description,
          importance: hook.importance,
          originalPath: hook.path,
          currentPath: targetPath,
          size: hook.size,
          modified: hook.modified
        };
        
        registry.tiers[tier].push(hook.name);
        
        // Update hook object with new path
        hook.currentPath = targetPath;
      }
    }

    // Save registry
    await fs.writeJson(this.hookRegistry, registry, { spaces: 2 });
    
    return registry;
  }

  /**
   * Ensure all tier directories exist
   */
  async ensureTierDirectories() {
    for (const tierPath of Object.values(this.tierPaths)) {
      await fs.ensureDir(tierPath);
    }
  }

  /**
   * Get target path for a hook based on its tier
   */
  async getTargetPath(hook, tier) {
    // Handle utils subdirectories
    if (tier === 'utils' && hook.path) {
      const relativePath = path.relative(this.hooksPath, hook.path);
      if (relativePath.startsWith('utils/')) {
        // Preserve utils subdirectory structure
        const targetPath = path.join(this.hooksPath, relativePath);
        await fs.ensureDir(path.dirname(targetPath));
        return targetPath;
      }
    }
    
    // Standard tier path
    return path.join(this.tierPaths[tier], hook.name);
  }

  /**
   * Get categorized hooks from the current structure
   */
  async getCategorizedHooks() {
    const categorized = {
      tier1: [],
      tier2: [],
      tier3: [],
      utils: []
    };

    // Try to load from registry first
    if (await fs.pathExists(this.hookRegistry)) {
      const registry = await fs.readJson(this.hookRegistry);
      
      for (const [hookName, hookInfo] of Object.entries(registry.hooks)) {
        const tier = hookInfo.tier;
        categorized[tier].push(hookInfo);
      }
      
      return categorized;
    }

    // Otherwise scan directories
    for (const [tier, tierPath] of Object.entries(this.tierPaths)) {
      if (await fs.pathExists(tierPath)) {
        const hooks = await this.scanDirectory(tierPath, tier);
        categorized[tier] = hooks;
      }
    }

    return categorized;
  }

  /**
   * Scan a directory for hooks
   */
  async scanDirectory(dirPath, tier, subPath = '') {
    const hooks = [];
    const items = await fs.readdir(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = await fs.stat(itemPath);

      if (stat.isDirectory()) {
        // Recursively scan subdirectories (for utils)
        const subHooks = await this.scanDirectory(
          itemPath, 
          tier, 
          path.join(subPath, item)
        );
        hooks.push(...subHooks);
      } else if (item.endsWith('.py')) {
        // Read hook content
        const content = await fs.readFile(itemPath, 'utf-8');
        
        hooks.push({
          name: item,
          path: itemPath,
          currentPath: itemPath,
          tier: tier,
          content: content,
          size: stat.size,
          modified: stat.mtime,
          subPath: subPath
        });
      }
    }

    return hooks;
  }

  /**
   * Move a hook to a different tier
   */
  async moveHookToTier(hookName, fromTier, toTier) {
    const fromPath = path.join(this.tierPaths[fromTier], hookName);
    const toPath = path.join(this.tierPaths[toTier], hookName);

    // Ensure target directory exists
    await fs.ensureDir(this.tierPaths[toTier]);

    // Move the file
    await fs.move(fromPath, toPath, { overwrite: true });

    // Update registry if it exists
    if (await fs.pathExists(this.hookRegistry)) {
      const registry = await fs.readJson(this.hookRegistry);
      
      if (registry.hooks[hookName]) {
        registry.hooks[hookName].tier = toTier;
        registry.hooks[hookName].currentPath = toPath;
        
        // Update tier arrays
        registry.tiers[fromTier] = registry.tiers[fromTier].filter(h => h !== hookName);
        registry.tiers[toTier].push(hookName);
        
        registry.lastUpdated = new Date().toISOString();
        await fs.writeJson(this.hookRegistry, registry, { spaces: 2 });
      }
    }

    return toPath;
  }

  /**
   * Create tier README files
   */
  async createTierReadmeFiles() {
    const readmeContents = {
      tier1: `# Tier 1 - Critical Hooks

This directory contains critical security and validation hooks that are essential for project integrity.

## Hooks in this tier:
- **commit-message-validator.py**: Validates commit message format and content
- **typescript-validator.py**: Validates TypeScript code and type safety
- **task-completion-enforcer.py**: Ensures tasks are completed before proceeding
- **pnpm-enforcer.py**: Enforces use of pnpm package manager

## Characteristics:
- Security-focused
- Validation and enforcement
- Required for all projects
- Cannot be disabled without explicit override

## Usage:
These hooks are automatically included in all project setups unless explicitly excluded.
`,
      tier2: `# Tier 2 - Important Hooks

This directory contains important quality and standards hooks that improve code quality and maintainability.

## Hooks in this tier:
- **api-standards-checker.py**: Checks API code against standards
- **code-quality-reporter.py**: Reports on code quality metrics
- **universal-linter.py**: Runs linting across multiple file types
- **import-organizer.py**: Organizes and sorts import statements

## Characteristics:
- Quality-focused
- Standards enforcement
- Recommended for most projects
- Can be selectively disabled

## Usage:
These hooks are recommended for all projects but can be excluded based on project needs.
`,
      tier3: `# Tier 3 - Optional Hooks

This directory contains optional convenience and notification hooks that provide additional functionality.

## Hooks in this tier:
- **notification.py**: Sends notifications for various events
- **stop.py**: Handles stop events
- **subagent_stop.py**: Handles subagent stop events
- **pre_tool_use.py**: Runs before tool usage
- **post_tool_use.py**: Runs after tool usage

## Characteristics:
- Convenience features
- Optional enhancements
- Project-specific utilities
- Can be freely enabled/disabled

## Usage:
These hooks are optional and can be selectively enabled based on project requirements and developer preferences.
`,
      utils: `# Utils - Shared Utilities

This directory contains shared utilities and helper functions used by various hooks.

## Structure:
- **llm/**: Language model utilities
  - anth.py: Anthropic API utilities
  - oai.py: OpenAI API utilities
- **tts/**: Text-to-speech utilities
  - elevenlabs_tts.py: ElevenLabs TTS integration
  - openai_tts.py: OpenAI TTS integration
  - pyttsx3_tts.py: Local TTS using pyttsx3

## Usage:
These utilities are imported and used by various hooks. They provide common functionality like:
- API integrations
- Text-to-speech capabilities
- Shared helper functions
- Common validation logic

## Note:
Do not run these files directly. They are meant to be imported by hooks.
`
    };

    for (const [tier, content] of Object.entries(readmeContents)) {
      const readmePath = path.join(this.tierPaths[tier], 'README.md');
      await fs.writeFile(readmePath, content);
    }
  }

  /**
   * Generate a hook manifest for distribution
   */
  async generateManifest() {
    const categorizedHooks = await this.getCategorizedHooks();
    const manifest = {
      version: '1.0.0',
      generated: new Date().toISOString(),
      tiers: {},
      totalHooks: 0
    };

    for (const [tier, hooks] of Object.entries(categorizedHooks)) {
      manifest.tiers[tier] = {
        description: this.getTierDescription(tier),
        hookCount: hooks.length,
        hooks: hooks.map(hook => ({
          name: hook.name,
          category: hook.category,
          description: hook.description,
          size: hook.size
        }))
      };
      manifest.totalHooks += hooks.length;
    }

    return manifest;
  }

  /**
   * Get tier description
   */
  getTierDescription(tier) {
    const descriptions = {
      tier1: 'Critical security and validation hooks',
      tier2: 'Important quality and standards hooks',
      tier3: 'Optional convenience and notification hooks',
      utils: 'Shared utilities and helper functions'
    };
    
    return descriptions[tier] || 'Unknown tier';
  }
}

module.exports = HookOrganizer;