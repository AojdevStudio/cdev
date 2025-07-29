/**
 * CDEV Changelog Utilities
 *
 * Helper functions for changelog automation following ai-docs/changelog-conventions.md
 * Cross-platform compatible utility functions for git analysis and file manipulation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const inquirer = require('inquirer');
const semver = require('semver');

/**
 * Validate semantic version format
 * @param {string} version - Version string to validate
 * @returns {boolean} - True if valid semver format
 */
function validateVersion(version) {
  return semver.valid(version) !== null;
}

/**
 * Get the next semantic version based on current version
 * @param {string} currentVersion - Current version from package.json
 * @param {boolean} autoMode - Whether to automatically determine version bump
 * @param {boolean} forceMode - Skip interactive prompts for autonomous execution
 * @returns {Promise<string>} - Next version string
 */
async function getNextVersion(currentVersion, autoMode = false, forceMode = false) {
  // Force mode: automatically determine version without user interaction
  if (forceMode && !autoMode) {
    console.log(chalk.yellow('🤖 Force mode: Auto-determining version bump from commits...'));
    autoMode = true; // Force auto mode when in force mode
  }

  if (!autoMode && !forceMode) {
    const { versionType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'versionType',
        message: 'What type of version bump?',
        choices: [
          { name: 'Patch (bug fixes)', value: 'patch' },
          { name: 'Minor (new features)', value: 'minor' },
          { name: 'Major (breaking changes)', value: 'major' },
          { name: 'Custom version', value: 'custom' },
        ],
      },
    ]);

    if (versionType === 'custom') {
      const { customVersion } = await inquirer.prompt([
        {
          type: 'input',
          name: 'customVersion',
          message: 'Enter custom version (e.g., 1.5.0):',
          validate: (input) => validateVersion(input) || 'Please enter a valid semantic version',
        },
      ]);
      return customVersion;
    }

    return semver.inc(currentVersion, versionType);
  }

  // Auto-determine version bump based on commit types
  try {
    const commits = parseCommits();
    const hasBreaking = commits.some(
      (commit) => commit.subject.includes('BREAKING') || commit.body?.includes('BREAKING CHANGE'),
    );
    const hasFeatures = commits.some((commit) => commit.type === 'feat' || commit.type === 'add');

    if (hasBreaking) {
      return semver.inc(currentVersion, 'major');
    } else if (hasFeatures) {
      return semver.inc(currentVersion, 'minor');
    } else {
      return semver.inc(currentVersion, 'patch');
    }
  } catch (error) {
    console.warn(chalk.yellow('Warning: Could not auto-determine version, defaulting to patch'));
    return semver.inc(currentVersion, 'patch');
  }
}

/**
 * Parse git commits since last tag/release
 * @returns {Array} - Array of parsed commit objects
 */
function parseCommits() {
  try {
    // Get the last tag
    let lastTag;
    try {
      lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
    } catch (error) {
      // No tags found, get all commits
      lastTag = '';
    }

    // Get commits since last tag
    const gitCommand = lastTag
      ? `git log ${lastTag}..HEAD --pretty=format:"%H|%s|%b|%an"`
      : 'git log --pretty=format:"%H|%s|%b|%an"';

    const gitOutput = execSync(gitCommand, { encoding: 'utf8' });

    if (!gitOutput.trim()) {
      return [];
    }

    const commits = gitOutput
      .trim()
      .split('\n')
      .map((line) => {
        const parts = line.split('|');
        const [hash, subject, body, author] = parts;
        // Skip empty or malformed lines
        if (!hash || !subject) return null;
        return parseCommitMessage({ hash, subject, body: body || '', author: author || '' });
      })
      .filter((commit) => commit !== null);

    return commits.filter((commit) => commit.type !== 'ignore');
  } catch (error) {
    console.error(chalk.red('Error parsing git commits:'), error.message);
    return [];
  }
}

/**
 * Parse individual commit message using conventional commit format
 * @param {Object} commit - Raw commit object
 * @returns {Object} - Parsed commit with type, scope, subject
 */
function parseCommitMessage({ hash, subject, body, author }) {
  // Handle undefined or empty subjects
  if (!subject || typeof subject !== 'string') {
    return { type: 'ignore', hash, subject: '', body, author };
  }

  // Handle merge commits
  if (subject.startsWith('Merge ')) {
    return { type: 'ignore', hash, subject, body, author };
  }

  // Parse conventional commit format: type(scope): subject
  const conventionalPattern = /^(\w+)(\([^)]+\))?: (.+)$/;
  const match = subject.match(conventionalPattern);

  if (match) {
    const [, type, scope, description] = match;
    return {
      hash: hash.substring(0, 8),
      type: type.toLowerCase(),
      scope: scope ? scope.slice(1, -1) : null,
      subject: description,
      body,
      author,
      pr: extractPRNumber(subject, body),
    };
  }

  // Handle non-conventional commits
  const type = inferCommitType(subject);
  return {
    hash: hash.substring(0, 8),
    type,
    scope: null,
    subject: subject,
    body,
    author,
    pr: extractPRNumber(subject, body),
  };
}

/**
 * Infer commit type from subject line for non-conventional commits
 * @param {string} subject - Commit subject line
 * @returns {string} - Inferred commit type
 */
function inferCommitType(subject) {
  const lower = subject.toLowerCase();

  if (lower.includes('fix') || lower.includes('bug') || lower.includes('patch')) {
    return 'fix';
  }
  if (lower.includes('add') || lower.includes('new') || lower.includes('feat')) {
    return 'feat';
  }
  if (lower.includes('update') || lower.includes('change') || lower.includes('modify')) {
    return 'change';
  }
  if (lower.includes('remove') || lower.includes('delete')) {
    return 'remove';
  }
  if (lower.includes('security') || lower.includes('vuln')) {
    return 'security';
  }
  if (lower.includes('deprecate')) {
    return 'deprecate';
  }
  if (lower.includes('doc') || lower.includes('readme')) {
    return 'docs';
  }
  if (lower.includes('test')) {
    return 'test';
  }
  if (lower.includes('chore') || lower.includes('build') || lower.includes('ci')) {
    return 'chore';
  }

  return 'change';
}

/**
 * Extract PR number from commit subject or body
 * @param {string} subject - Commit subject
 * @param {string} body - Commit body
 * @returns {string|null} - PR number or null
 */
function extractPRNumber(subject, body) {
  const prPattern = /#(\d+)/;
  const subjectMatch = subject.match(prPattern);
  if (subjectMatch) {
    return subjectMatch[1];
  }

  if (body) {
    const bodyMatch = body.match(prPattern);
    if (bodyMatch) {
      return bodyMatch[1];
    }
  }

  return null;
}

/**
 * Format changelog entry according to conventions
 * @param {Object} changes - Grouped changes by category
 * @param {string} version - Version number
 * @returns {string} - Formatted changelog entry
 */
function formatChangelog(changes, version) {
  const today = new Date().toISOString().split('T')[0];
  let entry = `## [${version}] - ${today}\n`;

  // Order categories according to Keep a Changelog
  const orderedCategories = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'];

  orderedCategories.forEach((category) => {
    if (changes[category] && changes[category].length > 0) {
      entry += `\n### ${category}\n\n`;
      changes[category].forEach((item) => {
        entry += `- ${item}\n`;
      });
    }
  });

  return entry;
}

/**
 * Update CHANGELOG.md file with new entry
 * @param {string} changelogEntry - Formatted changelog entry
 * @param {string} version - Version number
 */
function updateChangelogFile(changelogEntry, version) {
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');

  if (!fs.existsSync(changelogPath)) {
    throw new Error(`CHANGELOG.md not found at ${changelogPath}`);
  }

  const currentContent = fs.readFileSync(changelogPath, 'utf8');

  // Find the [Unreleased] section and add after it
  const unreleasedPattern = /## \[Unreleased\]\s*\n/;
  const match = currentContent.match(unreleasedPattern);

  if (!match) {
    throw new Error('Could not find [Unreleased] section in CHANGELOG.md');
  }

  // Split content at the unreleased section
  const beforeUnreleased = currentContent.substring(0, match.index + match[0].length);
  const afterUnreleased = currentContent.substring(match.index + match[0].length);

  // Insert new entry after unreleased section
  const newContent = beforeUnreleased + '\n' + changelogEntry + '\n' + afterUnreleased;

  // Update version comparison links at the bottom
  const updatedContent = updateVersionLinks(newContent, version);

  fs.writeFileSync(changelogPath, updatedContent, 'utf8');
}

/**
 * Update version comparison links in changelog footer
 * @param {string} content - Changelog content
 * @param {string} version - New version
 * @returns {string} - Updated content with version links
 */
function updateVersionLinks(content, version) {
  try {
    // Get current repository info
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const repoUrl =
      packageJson.repository?.url?.replace(/\.git$/, '') || 'https://github.com/org/repo';
    const gitUrl = repoUrl.replace(/^git\+/, '');

    // Find the links section at the bottom
    const linksPattern = /(\n\[Unreleased\]: .+?)(\n\[.+?\]: .+?)*/g;

    // Create new unreleased link
    const newUnreleasedLink = `\n[Unreleased]: ${gitUrl}/compare/v${version}...HEAD`;

    // Try to find existing links and update them
    if (content.includes('[Unreleased]:')) {
      // Update existing unreleased link
      const updatedContent = content.replace(
        /\[Unreleased\]: .+/,
        `[Unreleased]: ${gitUrl}/compare/v${version}...HEAD`,
      );

      // Add the new version link
      const versionLink = `[${version}]: ${gitUrl}/releases/tag/v${version}`;

      // Insert after unreleased link
      return updatedContent.replace(
        /(\[Unreleased\]: .+\n)/,
        `$1[${version}]: ${gitUrl}/releases/tag/v${version}\n`,
      );
    } else {
      // Add links section if it doesn't exist
      return (
        content +
        '\n\n## Links\n' +
        newUnreleasedLink +
        '\n' +
        `[${version}]: ${gitUrl}/releases/tag/v${version}\n`
      );
    }
  } catch (error) {
    console.warn(
      chalk.yellow('Warning: Could not update version comparison links:'),
      error.message,
    );
    return content;
  }
}

/**
 * Get git repository information
 * @returns {Object} - Repository info including remote URL
 */
function getRepositoryInfo() {
  try {
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
    const repoMatch = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(?:\.git)?$/);

    if (repoMatch) {
      return {
        owner: repoMatch[1],
        repo: repoMatch[2],
        url: `https://github.com/${repoMatch[1]}/${repoMatch[2]}`,
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Validate changelog file structure
 * @param {string} filePath - Path to changelog file
 * @returns {boolean} - True if valid structure
 */
function validateChangelogStructure(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check for required sections
    const requiredSections = [
      /# Changelog/,
      /## \[Unreleased\]/,
      /The format is based on \[Keep a Changelog\]/,
    ];

    return requiredSections.every((pattern) => pattern.test(content));
  } catch (error) {
    return false;
  }
}

/**
 * Create a backup of the changelog file
 * @param {string} filePath - Path to changelog file
 * @returns {string} - Path to backup file
 */
function createBackup(filePath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.backup.${timestamp}`;
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

module.exports = {
  validateVersion,
  getNextVersion,
  parseCommits,
  parseCommitMessage,
  inferCommitType,
  extractPRNumber,
  formatChangelog,
  updateChangelogFile,
  updateVersionLinks,
  getRepositoryInfo,
  validateChangelogStructure,
  createBackup,
};
