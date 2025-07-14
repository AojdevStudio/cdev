const path = require('path');

const fs = require('fs-extra');

const HookManager = require('./hook-manager');

/**
 * HooksRestructure - Utility to restructure existing hooks into tier-based organization
 */
class HooksRestructure {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.hooksPath = path.join(projectPath, '.claude', 'hooks');
    this.backupPath = path.join(projectPath, '.claude', 'hooks-backup');
    this.hookManager = new HookManager(projectPath);
  }

  /**
   * Restructure hooks from flat structure to tier-based organization
   */
  async restructure(options = {}) {
    const { backup = true, dryRun = false } = options;

    console.log('🔄 Starting hook restructuring process...');

    // Create backup if requested
    if (backup && !dryRun) {
      await this.createBackup();
    }

    // Get current hooks
    const existingHooks = await this.hookManager.loadExistingHooks();
    console.log(`📊 Found ${existingHooks.length} hooks to restructure`);

    // Categorize hooks
    const categorizedHooks = await this.hookManager.categorizer.categorize(existingHooks);

    // Display restructuring plan
    const plan = this.generateRestructuringPlan(categorizedHooks);
    this.displayPlan(plan);

    if (dryRun) {
      console.log('\n✅ Dry run complete. No files were moved.');
      return plan;
    }

    // Execute restructuring
    const result = await this.executePlan(plan);

    // Create tier README files
    await this.hookManager.organizer.createTierReadmeFiles();

    // Generate and save manifest
    const manifest = await this.hookManager.organizer.generateManifest();
    await fs.writeJson(path.join(this.hooksPath, 'hooks-manifest.json'), manifest, { spaces: 2 });

    console.log('\n✅ Hook restructuring complete!');
    this.displaySummary(result);

    return result;
  }

  /**
   * Create backup of current hooks structure
   */
  async createBackup() {
    console.log('📦 Creating backup of current hooks...');

    if (await fs.pathExists(this.backupPath)) {
      // Add timestamp to existing backup
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const timestampedBackup = `${this.backupPath}-${timestamp}`;
      await fs.move(this.backupPath, timestampedBackup);
    }

    await fs.copy(this.hooksPath, this.backupPath);
    console.log(`✅ Backup created at: ${this.backupPath}`);
  }

  /**
   * Generate restructuring plan
   */
  generateRestructuringPlan(categorizedHooks) {
    const plan = {
      moves: [],
      creates: [],
      preserves: [],
      summary: {
        tier1: 0,
        tier2: 0,
        tier3: 0,
        utils: 0,
        total: 0,
      },
    };

    for (const [tier, hooks] of Object.entries(categorizedHooks)) {
      for (const hook of hooks) {
        const targetPath = path.join(this.hooksPath, tier, path.basename(hook.name));

        // Check if hook needs to be moved
        if (hook.path !== targetPath) {
          // Check if it's in utils subdirectory
          if (tier === 'utils' && hook.path.includes('/utils/')) {
            // Preserve utils subdirectory structure
            plan.preserves.push({
              hook: hook.name,
              path: hook.path,
              reason: 'Already in correct utils subdirectory',
            });
          } else {
            plan.moves.push({
              hook: hook.name,
              from: hook.path,
              to: targetPath,
              tier,
            });
          }
        } else {
          plan.preserves.push({
            hook: hook.name,
            path: hook.path,
            reason: 'Already in correct location',
          });
        }

        plan.summary[tier]++;
        plan.summary.total++;
      }
    }

    // Add tier directories to create
    for (const tier of ['tier1', 'tier2', 'tier3']) {
      plan.creates.push({
        type: 'directory',
        path: path.join(this.hooksPath, tier),
      });
    }

    return plan;
  }

  /**
   * Display restructuring plan
   */
  displayPlan(plan) {
    console.log('\n📋 Restructuring Plan:');
    console.log('====================');

    console.log('\n📁 Directories to create:');
    for (const create of plan.creates) {
      console.log(`  - ${create.path}`);
    }

    console.log('\n🔄 Hooks to move:');
    for (const move of plan.moves) {
      console.log(`  - ${move.hook}`);
      console.log(`    From: ${move.from}`);
      console.log(`    To:   ${move.to}`);
      console.log(`    Tier: ${move.tier}`);
    }

    if (plan.preserves.length > 0) {
      console.log('\n✅ Hooks already in correct location:');
      for (const preserve of plan.preserves) {
        console.log(`  - ${preserve.hook}: ${preserve.reason}`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  - Tier 1 (Critical): ${plan.summary.tier1} hooks`);
    console.log(`  - Tier 2 (Important): ${plan.summary.tier2} hooks`);
    console.log(`  - Tier 3 (Optional): ${plan.summary.tier3} hooks`);
    console.log(`  - Utils: ${plan.summary.utils} hooks`);
    console.log(`  - Total: ${plan.summary.total} hooks`);
  }

  /**
   * Execute restructuring plan
   */
  async executePlan(plan) {
    const result = {
      created: [],
      moved: [],
      preserved: plan.preserves.length,
      errors: [],
    };

    // Create directories
    for (const create of plan.creates) {
      try {
        await fs.ensureDir(create.path);
        result.created.push(create.path);
      } catch (error) {
        result.errors.push({
          action: 'create',
          path: create.path,
          error: error.message,
        });
      }
    }

    // Move hooks
    for (const move of plan.moves) {
      try {
        // Ensure target directory exists
        await fs.ensureDir(path.dirname(move.to));

        // Move the file
        await fs.move(move.from, move.to, { overwrite: false });
        result.moved.push(move.hook);

        console.log(`✅ Moved ${move.hook} to ${move.tier}`);
      } catch (error) {
        result.errors.push({
          action: 'move',
          hook: move.hook,
          error: error.message,
        });
        console.error(`❌ Failed to move ${move.hook}: ${error.message}`);
      }
    }

    // Update hook registry
    await this.hookManager.initialize();

    return result;
  }

  /**
   * Display restructuring summary
   */
  displaySummary(result) {
    console.log('\n📊 Restructuring Summary:');
    console.log('========================');
    console.log(`✅ Directories created: ${result.created.length}`);
    console.log(`✅ Hooks moved: ${result.moved.length}`);
    console.log(`✅ Hooks preserved: ${result.preserved}`);

    if (result.errors.length > 0) {
      console.log(`❌ Errors: ${result.errors.length}`);
      for (const error of result.errors) {
        console.log(`   - ${error.action} ${error.hook || error.path}: ${error.error}`);
      }
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup() {
    if (!(await fs.pathExists(this.backupPath))) {
      throw new Error('No backup found. Cannot restore.');
    }

    console.log('🔄 Restoring hooks from backup...');

    // Remove current hooks directory
    await fs.remove(this.hooksPath);

    // Copy backup to hooks directory
    await fs.copy(this.backupPath, this.hooksPath);

    console.log('✅ Hooks restored from backup successfully');
  }

  /**
   * Verify restructuring was successful
   */
  async verify() {
    console.log('\n🔍 Verifying hook structure...');

    const verificationResult = {
      valid: true,
      issues: [],
    };

    // Check tier directories exist
    for (const tier of ['tier1', 'tier2', 'tier3', 'utils']) {
      const tierPath = path.join(this.hooksPath, tier);
      if (!(await fs.pathExists(tierPath))) {
        verificationResult.valid = false;
        verificationResult.issues.push(`Missing tier directory: ${tier}`);
      }
    }

    // Check hook registry exists
    const registryPath = path.join(this.hooksPath, 'hook-registry.json');
    if (!(await fs.pathExists(registryPath))) {
      verificationResult.valid = false;
      verificationResult.issues.push('Missing hook registry');
    }

    // Check no hooks in root directory (except registry and manifests)
    const rootFiles = await fs.readdir(this.hooksPath);
    for (const file of rootFiles) {
      const filePath = path.join(this.hooksPath, file);
      const stat = await fs.stat(filePath);

      if (!stat.isDirectory() && file.endsWith('.py')) {
        verificationResult.valid = false;
        verificationResult.issues.push(`Hook in root directory: ${file}`);
      }
    }

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
