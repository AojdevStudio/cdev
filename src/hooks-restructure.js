// Core Node.js modules for path manipulation and file operations
const path = require('path');

// Enhanced file system operations with additional utilities
const fs = require('fs-extra');

// Hook management system integration
const HookManager = require('./hook-manager');

/**
 * Hook Restructuring and Migration Utility
 *
 * The HooksRestructure class provides comprehensive functionality for migrating
 * existing hook installations from flat directory structures to the new tier-based
 * organization system. It handles the complete migration workflow with safety
 * features and verification capabilities.
 *
 * Core Functionality:
 * - Safe migration from flat to tier-based hook organization
 * - Automatic backup creation and restoration capabilities
 * - Dry-run mode for testing migration plans without making changes
 * - Comprehensive verification of migration success
 * - Detailed reporting and error handling throughout the process
 *
 * Migration Process:
 * 1. Backup Creation: Create timestamped backup of current hook structure
 * 2. Hook Analysis: Categorize existing hooks using the categorization system
 * 3. Plan Generation: Create detailed migration plan with file movements
 * 4. Plan Execution: Execute file movements and directory creation
 * 5. Documentation: Generate README files and manifests for new structure
 * 6. Verification: Validate that migration completed successfully
 *
 * Safety Features:
 * - Automatic backup before migration
 * - Dry-run mode for testing
 * - Error tracking and rollback capabilities
 * - Verification of migration completeness
 * - Preservation of utils subdirectory structure
 *
 * Use Cases:
 * - Upgrading existing CDEV installations to new tier system
 * - Reorganizing hook installations that have become disorganized
 * - Testing new categorization rules on existing hook collections
 * - Creating clean, organized hook structures from legacy installations
 */
class HooksRestructure {
  /**
   * Initialize the hook restructuring system
   *
   * Sets up the restructuring environment with all necessary paths and
   * integrations. The system is designed to work within existing CDEV
   * installations and safely migrate them to the new tier structure.
   *
   * @param {string} projectPath - Root directory of the project (defaults to current working directory)
   */
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath; // Project root directory
    this.hooksPath = path.join(projectPath, '.claude', 'hooks'); // Current hooks directory
    this.backupPath = path.join(projectPath, '.claude', 'hooks-backup'); // Backup location
    this.hookManager = new HookManager(projectPath); // Hook management system integration
  }

  /**
   * Main Hook Restructuring Process
   *
   * Orchestrates the complete migration from flat hook directory structure
   * to the new tier-based organization system. This method provides a safe,
   * comprehensive migration with extensive reporting and error handling.
   *
   * Restructuring Workflow:
   * 1. Backup Creation: Create timestamped backup of current structure
   * 2. Hook Discovery: Load and analyze all existing hooks
   * 3. Categorization: Apply tier categorization to existing hooks
   * 4. Plan Generation: Create detailed migration plan
   * 5. Plan Review: Display migration plan for user review
   * 6. Plan Execution: Execute file movements and directory creation
   * 7. Documentation: Generate README files and manifest
   * 8. Completion: Display summary and results
   *
   * Safety Features:
   * - Automatic backup unless disabled
   * - Dry-run mode for testing without changes
   * - Detailed error tracking and reporting
   * - Preservation of existing utils subdirectory structure
   *
   * @param {object} options - Restructuring configuration options
   * @param {boolean} options.backup - Create backup before restructuring (default: true)
   * @param {boolean} options.dryRun - Show plan without executing (default: false)
   * @returns {object} Restructuring result with statistics and any errors
   *
   * Error Handling: All errors are tracked and reported, but don't halt
   * the entire process unless critical (like backup failure).
   */
  async restructure(options = {}) {
    // Extract configuration options with sensible defaults
    const { backup = true, dryRun = false } = options;

    console.log('🔄 Starting hook restructuring process...');

    // Step 1: Backup Creation (if requested and not in dry-run mode)
    // Critical safety step to preserve current state before migration
    if (backup && !dryRun) {
      await this.createBackup();
    }

    // Step 2: Hook Discovery
    // Load all existing hooks from the current directory structure
    const existingHooks = await this.hookManager.loadExistingHooks();
    console.log(`📊 Found ${existingHooks.length} hooks to restructure`);

    // Step 3: Hook Categorization
    // Apply the tier categorization system to determine where each hook should go
    const categorizedHooks = await this.hookManager.categorizer.categorize(existingHooks);

    // Step 4: Migration Plan Generation
    // Create a detailed plan of all file movements and directory creation needed
    const plan = this.generateRestructuringPlan(categorizedHooks);
    this.displayPlan(plan);

    // Step 5: Dry-Run Completion Check
    // If this is a dry run, stop here and return the plan for review
    if (dryRun) {
      console.log('\n✅ Dry run complete. No files were moved.');
      return plan;
    }

    // Step 6: Plan Execution
    // Execute the migration plan by moving files and creating directories
    const result = await this.executePlan(plan);

    // Step 7: Documentation Generation
    // Create comprehensive documentation for the new tier structure
    await this.hookManager.organizer.createTierReadmeFiles();

    // Step 8: Manifest Creation
    // Generate and save a complete manifest of the new hook organization
    const manifest = await this.hookManager.organizer.generateManifest();
    await fs.writeJson(path.join(this.hooksPath, 'hooks-manifest.json'), manifest, { spaces: 2 });

    // Step 9: Completion Reporting
    // Display final results and summary to user
    console.log('\n✅ Hook restructuring complete!');
    this.displaySummary(result);

    return result;
  }

  /**
   * Backup Creation with Timestamp Management
   *
   * Creates a complete backup of the current hooks directory structure
   * before beginning the restructuring process. Handles multiple backups
   * by adding timestamps to preserve historical backups.
   *
   * Backup Strategy:
   * 1. Check for existing backup directory
   * 2. If exists, rename with timestamp to preserve it
   * 3. Create fresh backup of current hooks directory
   * 4. Maintain backup history for multiple restructuring attempts
   *
   * Error Handling: Backup creation is critical - any failure here
   * should halt the restructuring process to prevent data loss.
   */
  async createBackup() {
    console.log('📦 Creating backup of current hooks...');

    // Handle existing backup preservation
    if (await fs.pathExists(this.backupPath)) {
      // Create timestamp for backup versioning (filesystem-safe format)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const timestampedBackup = `${this.backupPath}-${timestamp}`;
      await fs.move(this.backupPath, timestampedBackup); // Preserve old backup with timestamp
    }

    // Create fresh backup of current hooks directory structure
    await fs.copy(this.hooksPath, this.backupPath);
    console.log(`✅ Backup created at: ${this.backupPath}`);
  }

  /**
   * Migration Plan Generation
   *
   * Analyzes the categorized hooks and generates a comprehensive plan
   * for migrating them to the tier-based directory structure. The plan
   * includes all file movements, directory creation, and preservation decisions.
   *
   * Plan Components:
   * - moves: Hooks that need to be relocated to different directories
   * - creates: Directories that need to be created for the tier structure
   * - preserves: Hooks that are already in correct locations
   * - summary: Statistical overview of the migration scope
   *
   * Planning Logic:
   * 1. For each categorized hook, determine its target location
   * 2. Compare current location with target location
   * 3. Special handling for utils subdirectories (preserve structure)
   * 4. Track all required directory creation operations
   * 5. Generate statistical summary for reporting
   *
   * @param {object} categorizedHooks - Hooks organized by tier from categorization
   * @returns {object} Complete migration plan with all operations and statistics
   */
  generateRestructuringPlan(categorizedHooks) {
    // Initialize comprehensive migration plan structure
    const plan = {
      moves: [], // Hooks that need to be moved to different locations
      creates: [], // Directories that need to be created
      preserves: [], // Hooks already in correct locations
      summary: {
        tier1: 0, // Count of tier1 hooks
        tier2: 0, // Count of tier2 hooks
        tier3: 0, // Count of tier3 hooks
        utils: 0, // Count of utils hooks
        total: 0, // Total hook count
      },
    };

    // Process each tier and its hooks to determine required operations
    for (const [tier, hooks] of Object.entries(categorizedHooks)) {
      for (const hook of hooks) {
        // Calculate target path based on tier-based organization
        const targetPath = path.join(this.hooksPath, tier, path.basename(hook.name));

        // Determine if hook needs to be moved by comparing current and target paths
        if (hook.path !== targetPath) {
          // Special Case: Utils Subdirectory Preservation
          // Utils hooks may be in subdirectories that should be preserved
          if (tier === 'utils' && hook.path.includes('/utils/')) {
            // Hook is already in utils subdirectory structure - preserve it
            plan.preserves.push({
              hook: hook.name,
              path: hook.path,
              reason: 'Already in correct utils subdirectory',
            });
          } else {
            // Hook needs to be moved to its correct tier directory
            plan.moves.push({
              hook: hook.name,
              from: hook.path, // Current location
              to: targetPath, // Target location in tier directory
              tier, // Destination tier for reporting
            });
          }
        } else {
          // Hook is already in the correct location
          plan.preserves.push({
            hook: hook.name,
            path: hook.path,
            reason: 'Already in correct location',
          });
        }

        // Update summary statistics
        plan.summary[tier]++;
        plan.summary.total++;
      }
    }

    // Add required tier directories to creation list
    // These directories are essential for the tier-based organization
    for (const tier of ['tier1', 'tier2', 'tier3']) {
      plan.creates.push({
        type: 'directory',
        path: path.join(this.hooksPath, tier),
      });
    }

    return plan;
  }

  /**
   * Migration Plan Display
   *
   * Presents the migration plan to the user in a clear, organized format.
   * This allows users to review what changes will be made before execution
   * and helps with debugging migration issues.
   *
   * Display Sections:
   * 1. Directories to Create: New tier directories that will be created
   * 2. Hooks to Move: Files that will be relocated with source and destination
   * 3. Preserved Hooks: Files already in correct locations
   * 4. Summary Statistics: Overview of hook distribution by tier
   *
   * @param {object} plan - Migration plan with all operations and statistics
   */
  displayPlan(plan) {
    console.log('\n📋 Restructuring Plan:');
    console.log('====================');

    // Section 1: Directory Creation Operations
    console.log('\n📁 Directories to create:');
    for (const create of plan.creates) {
      console.log(`  - ${create.path}`);
    }

    // Section 2: Hook Movement Operations
    console.log('\n🔄 Hooks to move:');
    for (const move of plan.moves) {
      console.log(`  - ${move.hook}`);
      console.log(`    From: ${move.from}`);
      console.log(`    To:   ${move.to}`);
      console.log(`    Tier: ${move.tier}`);
    }

    // Section 3: Preservation Information (if applicable)
    if (plan.preserves.length > 0) {
      console.log('\n✅ Hooks already in correct location:');
      for (const preserve of plan.preserves) {
        console.log(`  - ${preserve.hook}: ${preserve.reason}`);
      }
    }

    // Section 4: Summary Statistics
    console.log('\n📊 Summary:');
    console.log(`  - Tier 1 (Critical): ${plan.summary.tier1} hooks`);
    console.log(`  - Tier 2 (Important): ${plan.summary.tier2} hooks`);
    console.log(`  - Tier 3 (Optional): ${plan.summary.tier3} hooks`);
    console.log(`  - Utils: ${plan.summary.utils} hooks`);
    console.log(`  - Total: ${plan.summary.total} hooks`);
  }

  /**
   * Migration Plan Execution
   *
   * Executes the migration plan by performing all required file operations
   * including directory creation and hook file movements. Provides comprehensive
   * error handling and progress reporting throughout the execution process.
   *
   * Execution Workflow:
   * 1. Directory Creation: Create all required tier directories
   * 2. Hook Movement: Move hooks to their designated tier locations
   * 3. Registry Update: Initialize the hook management system with new structure
   * 4. Error Tracking: Record any failures for reporting and troubleshooting
   *
   * Error Handling Strategy:
   * - Individual operation failures don't halt the entire process
   * - All errors are tracked and reported in the final result
   * - Partial migrations can be completed and verified
   * - Registry update happens regardless of individual file operation results
   *
   * @param {object} plan - Migration plan with all required operations
   * @returns {object} Execution result with success counts and error details
   */
  async executePlan(plan) {
    // Initialize result tracking structure
    const result = {
      created: [], // Successfully created directories
      moved: [], // Successfully moved hooks
      preserved: plan.preserves.length, // Hooks that were already in correct locations
      errors: [], // Any errors encountered during execution
    };

    // Phase 1: Directory Creation
    // Create all required tier directories before moving files
    for (const create of plan.creates) {
      try {
        await fs.ensureDir(create.path); // Creates directory and any missing parent directories
        result.created.push(create.path);
      } catch (error) {
        // Track directory creation failures but continue with other operations
        result.errors.push({
          action: 'create',
          path: create.path,
          error: error.message,
        });
      }
    }

    // Phase 2: Hook File Movement
    // Move each hook to its designated tier directory
    for (const move of plan.moves) {
      try {
        // Ensure target directory exists (safety check in case directory creation failed)
        await fs.ensureDir(path.dirname(move.to));

        // Move the hook file to its new location
        // overwrite: false prevents accidental overwrites
        await fs.move(move.from, move.to, { overwrite: false });
        result.moved.push(move.hook);

        console.log(`✅ Moved ${move.hook} to ${move.tier}`);
      } catch (error) {
        // Track movement failures but continue with other hooks
        result.errors.push({
          action: 'move',
          hook: move.hook,
          error: error.message,
        });
        console.error(`❌ Failed to move ${move.hook}: ${error.message}`);
      }
    }

    // Phase 3: Registry Update
    // Initialize the hook management system to create registry for the new structure
    await this.hookManager.initialize();

    return result;
  }

  /**
   * Migration Results Summary Display
   *
   * Presents the final results of the migration process in a clear format
   * showing successes, preserved files, and any errors encountered. This
   * provides users with complete information about the migration outcome.
   *
   * Summary Components:
   * - Success metrics (directories created, hooks moved, hooks preserved)
   * - Error reporting with specific details for troubleshooting
   * - Overall migration status assessment
   *
   * @param {object} result - Execution result with success counts and errors
   */
  displaySummary(result) {
    console.log('\n📊 Restructuring Summary:');
    console.log('========================');

    // Display success metrics
    console.log(`✅ Directories created: ${result.created.length}`);
    console.log(`✅ Hooks moved: ${result.moved.length}`);
    console.log(`✅ Hooks preserved: ${result.preserved}`);

    // Display error information if any errors occurred
    if (result.errors.length > 0) {
      console.log(`❌ Errors: ${result.errors.length}`);
      for (const error of result.errors) {
        console.log(`   - ${error.action} ${error.hook || error.path}: ${error.error}`);
      }
    }
  }

  /**
   * Backup Restoration System
   *
   * Restores the hooks directory from a previously created backup. This
   * provides a rollback mechanism in case the migration encounters issues
   * or if the user wants to revert to the previous structure.
   *
   * Restoration Process:
   * 1. Verify backup exists before attempting restoration
   * 2. Remove current hooks directory completely
   * 3. Copy backup directory to restore original structure
   * 4. Confirm successful restoration
   *
   * Safety Note: This operation completely replaces the current hooks
   * directory, so any changes made after the backup will be lost.
   *
   * Error Handling: Throws error if no backup is found to prevent
   * accidental data loss.
   */
  async restoreFromBackup() {
    // Safety check: Ensure backup exists before attempting restoration
    if (!(await fs.pathExists(this.backupPath))) {
      throw new Error('No backup found. Cannot restore.');
    }

    console.log('🔄 Restoring hooks from backup...');

    // Step 1: Remove current hooks directory completely
    await fs.remove(this.hooksPath);

    // Step 2: Restore from backup by copying backup to hooks location
    await fs.copy(this.backupPath, this.hooksPath);

    console.log('✅ Hooks restored from backup successfully');
  }

  /**
   * Migration Verification System
   *
   * Performs comprehensive verification of the migration results to ensure
   * the tier-based structure was created correctly and completely. This
   * validation helps identify any issues with the migration process.
   *
   * Verification Checks:
   * 1. Tier Directory Existence: Verify all required tier directories exist
   * 2. Registry File Existence: Confirm hook registry was created properly
   * 3. Root Directory Cleanup: Ensure no hooks remain in root directory
   * 4. Structure Integrity: Validate overall directory structure
   *
   * Validation Criteria:
   * - All tier directories (tier1, tier2, tier3, utils) must exist
   * - Hook registry file must be present and readable
   * - No .py files should remain in the root hooks directory
   * - Directory structure should match tier-based organization requirements
   *
   * @returns {object} Verification result with validity status and issue details
   */
  async verify() {
    console.log('\n🔍 Verifying hook structure...');

    // Initialize verification result tracking
    const verificationResult = {
      valid: true, // Overall validation status
      issues: [], // List of specific issues found
    };

    // Verification Check 1: Tier Directory Existence
    // Ensure all required tier directories were created properly
    for (const tier of ['tier1', 'tier2', 'tier3', 'utils']) {
      const tierPath = path.join(this.hooksPath, tier);
      if (!(await fs.pathExists(tierPath))) {
        verificationResult.valid = false;
        verificationResult.issues.push(`Missing tier directory: ${tier}`);
      }
    }

    // Verification Check 2: Hook Registry Existence
    // Confirm that the hook registry was created and is accessible
    const registryPath = path.join(this.hooksPath, 'hook-registry.json');
    if (!(await fs.pathExists(registryPath))) {
      verificationResult.valid = false;
      verificationResult.issues.push('Missing hook registry');
    }

    // Verification Check 3: Root Directory Cleanup
    // Ensure no hook files remain in the root directory after migration
    const rootFiles = await fs.readdir(this.hooksPath);
    for (const file of rootFiles) {
      const filePath = path.join(this.hooksPath, file);
      const stat = await fs.stat(filePath);

      // Check for Python hook files that should have been moved to tier directories
      if (!stat.isDirectory() && file.endsWith('.py')) {
        verificationResult.valid = false;
        verificationResult.issues.push(`Hook in root directory: ${file}`);
      }
    }

    // Display verification results
    if (verificationResult.valid) {
      console.log('✅ Hook structure is valid');
    } else {
      console.log('❌ Hook structure has issues:');
      for (const issue of verificationResult.issues) {
        console.log(`   - ${issue}`);
      }
    }

    return verificationResult;
  }
}

module.exports = HooksRestructure;
