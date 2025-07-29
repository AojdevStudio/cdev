#!/usr/bin/env node
/**
 * CDEV Changelog Update Script
 *
 * Production-ready changelog automation script following ai-docs/changelog-conventions.md
 * Supports automatic git analysis and manual entry modes
 *
 * Usage:
 *   npm run changelog:update [version] [--auto|--manual] [--dry-run]
 *
 * Examples:
 *   npm run changelog:update 1.5.0 --auto          # Auto-analyze git commits
 *   npm run changelog:update 1.5.0 --manual        # Interactive mode
 *   npm run changelog:update --auto --dry-run      # Preview without changes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { program } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const {
  validateVersion,
  parseCommits,
  formatChangelog,
  updateChangelogFile,
  getNextVersion,
} = require('./utils');

// Configuration
const CHANGELOG_PATH = path.join(process.cwd(), 'CHANGELOG.md');
const PACKAGE_JSON_PATH = path.join(process.cwd(), 'package.json');

/**
 * Main changelog update function
 */
async function updateChangelog(options) {
  try {
    console.log(chalk.blue('🔄 CDEV Changelog Updater\n'));

    // Validate environment
    if (!fs.existsSync(CHANGELOG_PATH)) {
      throw new Error(`CHANGELOG.md not found at ${CHANGELOG_PATH}`);
    }

    if (!fs.existsSync(PACKAGE_JSON_PATH)) {
      throw new Error(`package.json not found at ${PACKAGE_JSON_PATH}`);
    }

    // Determine version
    let version = options.version;
    if (!version) {
      const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
      version = await getNextVersion(packageJson.version, options.auto, options.force);
    }

    // Validate version format
    if (!validateVersion(version)) {
      throw new Error(`Invalid version format: ${version}. Expected format: X.Y.Z`);
    }

    console.log(chalk.green(`📝 Updating changelog for version ${version}`));

    // Get changes based on mode
    let changes;
    if (options.auto || options.force) {
      if (options.force && options.manual) {
        console.log(chalk.yellow('⚠️  Force mode overrides manual mode - using auto mode'));
      }
      console.log(chalk.blue('🔍 Analyzing git commits since last release...\n'));
      changes = await getChangesFromGit();
    } else {
      console.log(chalk.blue('✏️  Manual entry mode\n'));
      changes = await getChangesManually();
    }

    // Validate changes
    if (
      !changes ||
      Object.keys(changes).every((key) => !changes[key] || changes[key].length === 0)
    ) {
      console.log(chalk.yellow('⚠️  No changes detected. Aborting.'));
      return;
    }

    // Format changelog entry
    const changelogEntry = formatChangelog(changes, version);

    // Preview changes
    console.log(chalk.blue('\n📋 Preview of changelog entry:'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(changelogEntry);
    console.log(chalk.gray('─'.repeat(60)));

    // Confirm or dry-run
    if (options.dryRun) {
      console.log(chalk.yellow('\n🔍 Dry run complete. No files were modified.'));
      return;
    }

    // Skip confirmation if force flag is set (for autonomous execution)
    let confirm = true;
    if (!options.force) {
      const response = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Add this entry to CHANGELOG.md?',
          default: true,
        },
      ]);
      confirm = response.confirm;
    } else {
      console.log(chalk.green('\n🚀 Force mode enabled - automatically proceeding...'));
    }

    if (!confirm) {
      console.log(chalk.yellow('❌ Changelog update cancelled.'));
      return;
    }

    // Update changelog file
    updateChangelogFile(changelogEntry, version);

    console.log(chalk.green(`✅ Successfully updated CHANGELOG.md for version ${version}`));
    console.log(chalk.blue(`📁 File location: ${CHANGELOG_PATH}`));

    // Suggest next steps
    console.log(chalk.blue('\n💡 Next steps:'));
    console.log(chalk.gray('   1. Review the changes in CHANGELOG.md'));
    console.log(chalk.gray('   2. Update package.json version if needed'));
    console.log(
      chalk.gray(
        '   3. Commit changes: git add CHANGELOG.md && git commit -m "docs: update changelog for v' +
          version +
          '"',
      ),
    );
    console.log(chalk.gray('   4. Create release tag: git tag v' + version));
  } catch (error) {
    console.error(chalk.red('❌ Error updating changelog:'), error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Get changes from git commits since last tag
 */
async function getChangesFromGit() {
  try {
    const commits = parseCommits();

    if (commits.length === 0) {
      console.log(chalk.yellow('⚠️  No commits found since last release.'));
      return null;
    }

    console.log(chalk.green(`📊 Found ${commits.length} commits to analyze\n`));

    // Group commits by type
    const changes = {
      Added: [],
      Changed: [],
      Deprecated: [],
      Removed: [],
      Fixed: [],
      Security: [],
    };

    commits.forEach((commit) => {
      const entry = `${commit.subject}${commit.pr ? ` [#${commit.pr}](${commit.prUrl || '#'})` : ''}`;

      switch (commit.type) {
        case 'feat':
        case 'add':
          changes.Added.push(entry);
          break;
        case 'fix':
        case 'bugfix':
          changes.Fixed.push(entry);
          break;
        case 'refactor':
        case 'perf':
        case 'improve':
          changes.Changed.push(entry);
          break;
        case 'remove':
          changes.Removed.push(entry);
          break;
        case 'security':
          changes.Security.push(entry);
          break;
        case 'deprecate':
          changes.Deprecated.push(entry);
          break;
        default:
          // Default to Changed for misc commits
          if (!commit.type.match(/^(docs|test|chore|style)$/)) {
            changes.Changed.push(entry);
          }
      }
    });

    // Show summary
    Object.entries(changes).forEach(([category, items]) => {
      if (items.length > 0) {
        console.log(chalk.blue(`${category}: ${items.length} items`));
      }
    });

    return changes;
  } catch (error) {
    console.error(chalk.red('Error parsing git commits:'), error.message);
    throw error;
  }
}

/**
 * Get changes through manual entry
 */
async function getChangesManually() {
  const changes = {
    Added: [],
    Changed: [],
    Deprecated: [],
    Removed: [],
    Fixed: [],
    Security: [],
  };

  console.log(
    chalk.blue(
      '📝 Enter changes for each category (press Enter with empty line to finish each section)\n',
    ),
  );

  for (const [category, description] of Object.entries({
    Added: 'new features or capabilities',
    Changed: 'changes in existing functionality',
    Deprecated: 'features that will be removed in future versions',
    Removed: 'features that have been removed',
    Fixed: 'bug fixes',
    Security: 'security-related changes',
  })) {
    console.log(chalk.blue(`\n${category} (${description}):`));

    let items = [];
    while (true) {
      const { item } = await inquirer.prompt([
        {
          type: 'input',
          name: 'item',
          message: `  ${category} item (empty to finish):`,
          validate: (input, answers) => {
            if (!input && items.length === 0) {
              return true; // Allow empty category
            }
            return true;
          },
        },
      ]);

      if (!item) break;
      items.push(item);
    }

    changes[category] = items;
  }

  return changes;
}

// CLI setup
program
  .name('update-changelog')
  .description('Update CHANGELOG.md with new version entries')
  .version('1.0.0')
  .argument('[version]', 'Version number (e.g., 1.5.0)')
  .option('--auto', 'Automatically analyze git commits since last release')
  .option('--manual', 'Manual entry mode')
  .option('--dry-run', 'Preview changes without modifying files')
  .option('--verbose', 'Show detailed error information')
  .option('--force', 'Skip all confirmation prompts for autonomous execution')
  .action(async (version, options) => {
    // Default to auto mode if neither specified
    if (!options.auto && !options.manual) {
      options.auto = true;
    }

    await updateChangelog({
      version,
      ...options,
    });
  });

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, chalk.red('reason:'), reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  program.parse();
}

module.exports = { updateChangelog };
