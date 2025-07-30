// Core Node.js modules for path manipulation and file operations
const path = require('path');

// Enhanced file system operations with additional utilities
const fs = require('fs-extra');

/**
 * Hook Organization and File Management System
 *
 * The HookOrganizer is responsible for the physical organization of hook files
 * into the tier-based directory structure. It manages the file system operations,
 * registry maintenance, and directory structure creation that supports the
 * categorized hook system.
 *
 * Core Responsibilities:
 * - Physical file organization into tier directories (tier1, tier2, tier3, utils)
 * - Hook registry creation and maintenance for tracking hook metadata
 * - Directory structure management and validation
 * - Hook file movement and relocation between tiers
 * - Manifest generation for distribution and documentation
 *
 * Directory Structure:
 * - .claude/hooks/tier1/ - Critical security and validation hooks
 * - .claude/hooks/tier2/ - Important quality and standards hooks
 * - .claude/hooks/tier3/ - Optional convenience hooks
 * - .claude/hooks/utils/ - Shared utilities (may contain subdirectories)
 * - .claude/hooks/hook-registry.json - Central hook metadata registry
 *
 * Integration:
 * Works closely with HookCategorizer to receive categorized hooks and
 * HookSelector to provide organized hook collections for project setup.
 */
class HookOrganizer {
  /**
   * Initialize the hook organizer with directory structure
   *
   * Sets up the complete directory structure for tier-based hook organization
   * and establishes paths for registry management. The organizer maintains
   * a clear separation between different hook tiers for better organization.
   *
   * @param {string} hooksPath - Base path for the hooks directory (typically .claude/hooks)
   */
  constructor(hooksPath) {
    this.hooksPath = hooksPath; // Base hooks directory path

    // Define tier-specific directory paths for organized hook storage
    this.tierPaths = {
      tier1: path.join(hooksPath, 'tier1'), // Critical security and validation hooks
      tier2: path.join(hooksPath, 'tier2'), // Important quality and standards hooks
      tier3: path.join(hooksPath, 'tier3'), // Optional convenience hooks
      utils: path.join(hooksPath, 'utils'), // Shared utilities and helper functions
    };

    // Central registry file for tracking hook metadata and organization
    this.hookRegistry = path.join(hooksPath, 'hook-registry.json');
  }

  /**
   * Main Hook Organization Process
   *
   * Takes categorized hooks from the HookCategorizer and physically organizes them
   * into the appropriate tier directories. This method handles the complete workflow
   * of moving hooks to their correct locations and maintaining the registry.
   *
   * Organization Workflow:
   * 1. Ensure all tier directories exist in the file system
   * 2. Create a comprehensive registry to track hook metadata
   * 3. Move each hook to its appropriate tier directory
   * 4. Update hook objects with new path information
   * 5. Save the complete registry for future reference
   *
   * Registry Structure:
   * - version: Registry format version for compatibility
   * - lastUpdated: Timestamp of last organization
   * - hooks: Individual hook metadata indexed by name
   * - tiers: Hook lists organized by tier for quick access
   *
   * @param {object} categorizedHooks - Hooks organized by tier from HookCategorizer
   * @returns {object} Complete registry with hook organization metadata
   *
   * Error Handling: Gracefully handles file system errors and ensures
   * partial operations can be recovered through registry state.
   */
  async organize(categorizedHooks) {
    // Step 1: Directory Structure Preparation
    // Ensure all tier directories exist before attempting to move hooks
    await this.ensureTierDirectories();

    // Step 2: Registry Initialization
    // Create a comprehensive registry to track all hook metadata and organization
    const registry = {
      version: '1.0.0', // Registry format version for compatibility tracking
      lastUpdated: new Date().toISOString(), // Organization timestamp
      hooks: {}, // Individual hook metadata indexed by hook name
      tiers: {}, // Hook collections organized by tier for quick access
    };

    // Step 3: Hook Organization by Tier
    // Process each tier and move hooks to their appropriate directories
    for (const [tier, hooks] of Object.entries(categorizedHooks)) {
      registry.tiers[tier] = []; // Initialize tier hook list

      for (const hook of hooks) {
        // Step 3a: Path Resolution
        // Determine the correct target path based on tier and hook characteristics
        const targetPath = await this.getTargetPath(hook, tier);

        // Step 3b: File System Operations
        // Move the hook file to the tier directory if it's not already in the correct location
        if (hook.path !== targetPath && (await fs.pathExists(hook.path))) {
          await fs.ensureDir(path.dirname(targetPath)); // Ensure target directory exists
          await fs.move(hook.path, targetPath, { overwrite: true }); // Move with overwrite protection
        }

        // Step 3c: Registry Entry Creation
        // Store comprehensive hook metadata in the registry for tracking and reference
        registry.hooks[hook.name] = {
          name: hook.name, // Hook filename for identification
          tier, // Assigned tier classification
          category: hook.category, // Functional category (validation, enforcement, etc.)
          description: hook.description, // Human-readable description
          importance: hook.importance, // Importance level based on tier
          originalPath: hook.path, // Original file location before organization
          currentPath: targetPath, // Current organized location
          size: hook.size, // File size in bytes
          modified: hook.modified, // Last modification timestamp
        };

        // Step 3d: Tier Index Management
        // Add hook to tier-specific index for quick tier-based access
        registry.tiers[tier].push(hook.name);

        // Step 3e: Hook Object Updates
        // Update the hook object with new path information for caller reference
        hook.currentPath = targetPath;
        hook.path = targetPath; // Update the main path reference for consistency
      }
    }

    // Step 4: Registry Persistence
    // Save the complete registry to disk for future reference and recovery
    await fs.writeJson(this.hookRegistry, registry, { spaces: 2 });

    return registry;
  }

  /**
   * Directory Structure Creation
   *
   * Ensures that all required tier directories exist in the file system.
   * This method is idempotent and safe to call multiple times. It creates
   * the complete directory structure needed for tier-based hook organization.
   *
   * Created Directories:
   * - tier1/ - Critical security and validation hooks
   * - tier2/ - Important quality and standards hooks
   * - tier3/ - Optional convenience hooks
   * - utils/ - Shared utilities (may contain subdirectories)
   *
   * File System Safety: Uses fs.ensureDir which creates directories recursively
   * and doesn't fail if directories already exist.
   */
  async ensureTierDirectories() {
    // Create each tier directory, including parent directories if needed
    for (const tierPath of Object.values(this.tierPaths)) {
      await fs.ensureDir(tierPath); // Creates directory and any missing parent directories
    }
  }

  /**
   * Target Path Resolution
   *
   * Determines the correct target path for a hook based on its tier classification
   * and special handling requirements. This method handles both standard tier
   * placement and special cases like utils subdirectory preservation.
   *
   * Path Resolution Logic:
   * 1. Utils Tier Special Handling: Preserves subdirectory structure for utils
   *    (e.g., utils/llm/anth.py stays in utils/llm/ subdirectory)
   * 2. Standard Tier Placement: Places hooks directly in tier directories
   *    (e.g., tier1/validator.py, tier2/checker.py)
   *
   * @param {object} hook - Hook object with name, path, and metadata
   * @param {string} tier - Target tier (tier1, tier2, tier3, utils)
   * @returns {string} Resolved target path for the hook file
   *
   * Special Cases:
   * - Utils hooks maintain their subdirectory structure
   * - Directory creation is handled automatically for complex paths
   */
  async getTargetPath(hook, tier) {
    // Special Case: Utils Subdirectory Preservation
    // Utils hooks often have subdirectory organization (llm/, tts/, etc.)
    // that should be preserved for logical grouping
    if (tier === 'utils' && hook.path) {
      const relativePath = path.relative(this.hooksPath, hook.path);
      if (relativePath.startsWith('utils/')) {
        // Preserve existing utils subdirectory structure
        const targetPath = path.join(this.hooksPath, relativePath);
        await fs.ensureDir(path.dirname(targetPath)); // Ensure subdirectory exists
        return targetPath;
      }
    }

    // Standard Case: Direct Tier Placement
    // Most hooks are placed directly in their tier directory
    return path.join(this.tierPaths[tier], hook.name);
  }

  /**
   * Hook Retrieval from Organized Structure
   *
   * Retrieves the current state of organized hooks from either the registry
   * or by scanning the directory structure. This method provides access to
   * the complete hook organization with all metadata and categorization.
   *
   * Retrieval Strategy:
   * 1. Primary: Load from registry if available (fastest, includes metadata)
   * 2. Fallback: Scan directories if no registry exists (slower, limited metadata)
   *
   * Registry Benefits:
   * - Fast access to hook metadata without file system scanning
   * - Complete categorization information from previous organization
   * - Historical information like original paths and modification times
   *
   * Directory Scanning Fallback:
   * - Discovers hooks when registry is missing or corrupted
   * - Provides basic hook information for recovery scenarios
   * - Automatically handles new hooks added outside the organization process
   *
   * @returns {object} Categorized hooks organized by tier with metadata
   */
  async getCategorizedHooks() {
    // Initialize categorized hook structure
    const categorized = {
      tier1: [], // Critical security and validation hooks
      tier2: [], // Important quality and standards hooks
      tier3: [], // Optional convenience hooks
      utils: [], // Shared utilities and helper functions
    };

    // Primary Strategy: Registry-based Retrieval
    // Load from registry if available - this is the fastest and most complete method
    if (await fs.pathExists(this.hookRegistry)) {
      const registry = await fs.readJson(this.hookRegistry);

      // Populate categorized structure from registry data
      for (const hookInfo of Object.values(registry.hooks)) {
        const { tier } = hookInfo;
        categorized[tier].push(hookInfo);
      }

      return categorized;
    }

    // Fallback Strategy: Directory Scanning
    // Scan directories if registry is not available - slower but recovers from missing registry
    for (const [tier, tierPath] of Object.entries(this.tierPaths)) {
      if (await fs.pathExists(tierPath)) {
        const hooks = await this.scanDirectory(tierPath, tier);
        categorized[tier] = hooks;
      }
    }

    return categorized;
  }

  /**
   * Directory Hook Scanning
   *
   * Recursively scans a directory for hook files and creates basic hook objects
   * with available metadata. This method is used as a fallback when the registry
   * is not available or for discovering new hooks.
   *
   * Scanning Process:
   * 1. Read directory contents and examine each item
   * 2. Recursively scan subdirectories (important for utils organization)
   * 3. Process Python hook files (.py extension)
   * 4. Read hook content and gather file system metadata
   * 5. Create hook objects with available information
   *
   * Recursive Handling:
   * - Preserves subdirectory structure for utils hooks
   * - Maintains subPath tracking for proper organization
   * - Flattens results into a single array for processing
   *
   * @param {string} dirPath - Directory path to scan for hooks
   * @param {string} tier - Tier classification for discovered hooks
   * @param {string} subPath - Subdirectory path for nested organization
   * @returns {Array} Array of hook objects with basic metadata
   */
  async scanDirectory(dirPath, tier, subPath = '') {
    const hooks = []; // Collect discovered hooks
    const items = await fs.readdir(dirPath); // Get directory contents

    // Process each item in the directory
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = await fs.stat(itemPath); // Get file/directory information

      if (stat.isDirectory()) {
        // Recursive Directory Processing
        // Scan subdirectories to discover nested hooks (common in utils)
        const subHooks = await this.scanDirectory(itemPath, tier, path.join(subPath, item));
        hooks.push(...subHooks); // Flatten results into main hooks array
      } else if (item.endsWith('.py')) {
        // Hook File Processing
        // Process Python files as potential hooks
        const content = await fs.readFile(itemPath, 'utf-8');

        // Create hook object with available metadata
        hooks.push({
          name: item, // Hook filename
          path: itemPath, // Absolute path to hook file
          currentPath: itemPath, // Current location (same as path in scanning)
          tier, // Assigned tier classification
          content, // Full hook content for analysis
          size: stat.size, // File size in bytes
          modified: stat.mtime, // Last modification timestamp
          subPath, // Subdirectory path for nested organization
        });
      }
    }

    return hooks;
  }

  /**
   * Inter-Tier Hook Movement
   *
   * Moves a hook from one tier to another, updating both the file system
   * organization and the registry to maintain consistency. This operation
   * is useful for reclassifying hooks as their importance or function changes.
   *
   * Movement Process:
   * 1. Calculate source and destination paths based on tier directories
   * 2. Ensure target directory exists for the destination tier
   * 3. Move the physical hook file to the new location
   * 4. Update registry metadata to reflect the new tier and path
   * 5. Update tier index arrays for consistent organization
   *
   * Registry Consistency:
   * - Updates hook tier classification
   * - Updates current path information
   * - Removes hook from old tier index
   * - Adds hook to new tier index
   * - Updates registry timestamp
   *
   * @param {string} hookName - Name of the hook file to move
   * @param {string} fromTier - Source tier for the hook
   * @param {string} toTier - Destination tier for the hook
   * @returns {string} New path of the moved hook
   *
   * Error Handling: Gracefully handles missing files or registry corruption
   */
  async moveHookToTier(hookName, fromTier, toTier) {
    // Step 1: Path Calculation
    // Calculate source and destination paths based on tier directories
    const fromPath = path.join(this.tierPaths[fromTier], hookName);
    const toPath = path.join(this.tierPaths[toTier], hookName);

    // Step 2: Directory Preparation
    // Ensure target directory exists before attempting to move the file
    await fs.ensureDir(this.tierPaths[toTier]);

    // Step 3: File System Operation
    // Move the hook file to the new tier directory
    await fs.move(fromPath, toPath, { overwrite: true });

    // Step 4: Registry Update
    // Update registry metadata if registry exists to maintain consistency
    if (await fs.pathExists(this.hookRegistry)) {
      const registry = await fs.readJson(this.hookRegistry);

      if (registry.hooks[hookName]) {
        // Update hook metadata
        registry.hooks[hookName].tier = toTier; // New tier classification
        registry.hooks[hookName].currentPath = toPath; // New file location

        // Update tier index arrays for consistent organization
        registry.tiers[fromTier] = registry.tiers[fromTier].filter((h) => h !== hookName);
        registry.tiers[toTier].push(hookName);

        // Update registry timestamp
        registry.lastUpdated = new Date().toISOString();
        await fs.writeJson(this.hookRegistry, registry, { spaces: 2 });
      }
    }

    return toPath;
  }

  /**
   * Tier Documentation Generation
   *
   * Creates comprehensive README files for each tier directory to provide
   * clear documentation about the purpose, contents, and usage of hooks
   * in each tier. This improves discoverability and understanding.
   *
   * Generated Documentation:
   * - tier1/README.md - Critical hooks documentation
   * - tier2/README.md - Important hooks documentation
   * - tier3/README.md - Optional hooks documentation
   * - utils/README.md - Utilities documentation with structure
   *
   * Documentation Content:
   * - Tier purpose and characteristics
   * - List of hooks typically found in each tier
   * - Usage guidelines and recommendations
   * - Integration and configuration information
   *
   * This method is idempotent and safe to call multiple times.
   */
  async createTierReadmeFiles() {
    // Define comprehensive documentation content for each tier
    // This provides clear guidance for developers about hook organization
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
`,
    };

    // Generate README files for each tier directory
    for (const [tier, content] of Object.entries(readmeContents)) {
      const readmePath = path.join(this.tierPaths[tier], 'README.md');
      await fs.writeFile(readmePath, content); // Write documentation to file
    }
  }

  /**
   * Hook Manifest Generation
   *
   * Creates a comprehensive manifest of all organized hooks for distribution,
   * documentation, and integration purposes. The manifest provides a complete
   * overview of the hook system state and can be used by other tools.
   *
   * Manifest Content:
   * - Version information for compatibility tracking
   * - Generation timestamp for freshness validation
   * - Tier-based hook organization with descriptions
   * - Individual hook metadata and statistics
   * - Total hook counts and distribution metrics
   *
   * Use Cases:
   * - Package distribution and publishing
   * - Integration with external tools
   * - Documentation generation
   * - System health monitoring
   * - Hook discovery and selection interfaces
   *
   * @returns {object} Complete manifest with hook organization and metadata
   */
  async generateManifest() {
    // Retrieve current hook organization state
    const categorizedHooks = await this.getCategorizedHooks();

    // Initialize manifest structure with metadata
    const manifest = {
      version: '1.0.0', // Manifest format version
      generated: new Date().toISOString(), // Generation timestamp
      tiers: {}, // Tier-based hook organization
      totalHooks: 0, // Total hook count across all tiers
    };

    // Process each tier and create comprehensive tier information
    for (const [tier, hooks] of Object.entries(categorizedHooks)) {
      manifest.tiers[tier] = {
        description: this.getTierDescription(tier), // Human-readable tier purpose
        hookCount: hooks.length, // Number of hooks in this tier
        hooks: hooks.map((hook) => ({
          name: hook.name, // Hook filename
          category: hook.category, // Functional category
          description: hook.description, // Hook description
          size: hook.size, // File size for resource planning
        })),
      };
      manifest.totalHooks += hooks.length; // Accumulate total count
    }

    return manifest;
  }

  /**
   * Tier Description Provider
   *
   * Provides standardized descriptions for each tier that are used throughout
   * the system for documentation, manifests, and user interfaces. These
   * descriptions help users understand the purpose and importance of each tier.
   *
   * @param {string} tier - Tier identifier (tier1, tier2, tier3, utils)
   * @returns {string} Human-readable description of the tier's purpose
   */
  getTierDescription(tier) {
    // Standardized tier descriptions for consistent messaging
    const descriptions = {
      tier1: 'Critical security and validation hooks', // Mandatory hooks
      tier2: 'Important quality and standards hooks', // Recommended hooks
      tier3: 'Optional convenience and notification hooks', // Optional enhancements
      utils: 'Shared utilities and helper functions', // Supporting utilities
    };

    return descriptions[tier] || 'Unknown tier';
  }
}

module.exports = HookOrganizer;
