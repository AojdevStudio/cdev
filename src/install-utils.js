const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');

const fs = require('fs-extra');

const execAsync = promisify(exec);

class InstallUtils {
  constructor() {
    this.platform = os.platform();
    this.homeDir = os.homedir();
  }

  async isDirectoryEmpty(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      return files.length === 0;
    } catch (error) {
      return true;
    }
  }

  async isGitRepository(dirPath) {
    try {
      const gitDir = path.join(dirPath, '.git');
      const stats = await fs.stat(gitDir);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

  async getGitRemoteUrl(dirPath) {
    try {
      const { stdout } = await execAsync('git remote get-url origin', { cwd: dirPath });
      return stdout.trim();
    } catch (error) {
      return null;
    }
  }

  async getCurrentGitBranch(dirPath) {
    try {
      const { stdout } = await execAsync('git branch --show-current', { cwd: dirPath });
      return stdout.trim();
    } catch (error) {
      return null;
    }
  }

  resolveWorkTreePath(targetDir, config) {
    const { projectName } = config;

    switch (config.workTreeLocation) {
      case 'alongside':
        const parentDir = path.dirname(targetDir);
        return path.join(parentDir, `${projectName}-worktrees`);

      case 'tmp':
        return path.join(os.tmpdir(), 'parallel-claude-worktrees', projectName);

      case 'custom':
        return path.resolve(config.customWorkTreePath);

      default:
        return path.join(path.dirname(targetDir), `${projectName}-worktrees`);
    }
  }

  async createSymbolicLink(source, target) {
    try {
      await fs.symlink(source, target);
      return true;
    } catch (error) {
      console.warn(`Could not create symbolic link: ${error.message}`);
      return false;
    }
  }

  async copyFileWithBackup(source, target) {
    const targetExists = await fs.pathExists(target);

    if (targetExists) {
      const backupPath = `${target}.backup.${Date.now()}`;
      await fs.copy(target, backupPath);
      console.log(`Backed up existing file to: ${backupPath}`);
    }

    await fs.copy(source, target);
    return targetExists;
  }

  async findPackageJson(startDir) {
    let currentDir = startDir;

    while (currentDir !== path.parse(currentDir).root) {
      const packageJsonPath = path.join(currentDir, 'package.json');

      if (await fs.pathExists(packageJsonPath)) {
        return packageJsonPath;
      }

      currentDir = path.dirname(currentDir);
    }

    return null;
  }

  async detectProjectType(dirPath) {
    const indicators = {
      'package.json': 'node',
      'Cargo.toml': 'rust',
      'pyproject.toml': 'python',
      'go.mod': 'go',
      'composer.json': 'php',
      'pom.xml': 'java',
      Gemfile: 'ruby',
      'requirements.txt': 'python',
      'yarn.lock': 'node-yarn',
      'pnpm-lock.yaml': 'node-pnpm',
    };

    const detectedTypes = [];

    for (const [file, type] of Object.entries(indicators)) {
      const filePath = path.join(dirPath, file);
      if (await fs.pathExists(filePath)) {
        detectedTypes.push(type);
      }
    }

    // Check for framework-specific files
    const frameworkIndicators = {
      'next.config.js': 'nextjs',
      'nuxt.config.js': 'nuxtjs',
      'angular.json': 'angular',
      'vue.config.js': 'vue',
      'svelte.config.js': 'svelte',
      'gatsby-config.js': 'gatsby',
      'remix.config.js': 'remix',
    };

    for (const [file, framework] of Object.entries(frameworkIndicators)) {
      const filePath = path.join(dirPath, file);
      if (await fs.pathExists(filePath)) {
        detectedTypes.push(framework);
      }
    }

    return detectedTypes;
  }

  async readJsonFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to read JSON file ${filePath}: ${error.message}`);
    }
  }

  async writeJsonFile(filePath, data) {
    try {
      const content = JSON.stringify(data, null, 2);
      await fs.writeFile(filePath, content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to write JSON file ${filePath}: ${error.message}`);
    }
  }

  async mergePackageJson(targetPath, additions) {
    const packageJsonPath = path.join(targetPath, 'package.json');

    let packageJson = {};

    if (await fs.pathExists(packageJsonPath)) {
      packageJson = await this.readJsonFile(packageJsonPath);
    }

    // Merge scripts
    if (additions.scripts) {
      packageJson.scripts = {
        ...packageJson.scripts,
        ...additions.scripts,
      };
    }

    // Merge dependencies
    if (additions.dependencies) {
      packageJson.dependencies = {
        ...packageJson.dependencies,
        ...additions.dependencies,
      };
    }

    // Merge devDependencies
    if (additions.devDependencies) {
      packageJson.devDependencies = {
        ...packageJson.devDependencies,
        ...additions.devDependencies,
      };
    }

    // Add keywords
    if (additions.keywords) {
      const existingKeywords = packageJson.keywords || [];
      packageJson.keywords = [...new Set([...existingKeywords, ...additions.keywords])];
    }

    await this.writeJsonFile(packageJsonPath, packageJson);
    return packageJson;
  }

  async validateLinearApiKey(apiKey) {
    if (!apiKey) {
      return { valid: false, reason: 'API key is required' };
    }

    if (!apiKey.startsWith('lin_api_')) {
      return { valid: false, reason: 'Invalid API key format. Should start with "lin_api_"' };
    }

    if (apiKey.length < 50) {
      return { valid: false, reason: 'API key appears to be too short' };
    }

    // For Linear API keys, we could validate by making a test request
    // However, this would require network access during installation
    // which might not be desirable. For now, we just check the format.
    return { valid: true };
  }

  async ensureDirectoryWritable(dirPath) {
    try {
      await fs.ensureDir(dirPath);
      await fs.access(dirPath, fs.constants.W_OK);
      return true;
    } catch (error) {
      throw new Error(`Directory ${dirPath} is not writable: ${error.message}`);
    }
  }

  async getSystemInfo() {
    const info = {
      platform: this.platform,
      architecture: os.arch(),
      nodeVersion: process.version,
      homeDirectory: this.homeDir,
      currentDirectory: process.cwd(),
      tempDirectory: os.tmpdir(),
    };

    try {
      const { stdout: gitVersion } = await execAsync('git --version');
      info.gitVersion = gitVersion.trim();
    } catch (error) {
      info.gitVersion = 'Not installed';
    }

    try {
      const { stdout: claudeVersion } = await execAsync('claude --version');
      info.claudeVersion = claudeVersion.trim();
    } catch (error) {
      info.claudeVersion = 'Not installed';
    }

    return info;
  }

  async checkDiskSpace(dirPath) {
    try {
      const stats = await fs.stat(dirPath);
      // This is a basic check - for more accurate disk space checking,
      // you might want to use a dedicated library like 'check-disk-space'
      return { available: true, stats };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

  async sanitizeFileName(fileName) {
    // Remove or replace invalid characters for file names
    return fileName
      .replace(/[<>:"/\\|?*]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  }

  async generateUniqueId(prefix = 'install') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}-${timestamp}-${random}`;
  }

  async createProgressTracker(totalSteps) {
    let currentStep = 0;

    return {
      increment: () => {
        currentStep++;
        return currentStep;
      },
      getProgress: () => ({
        current: currentStep,
        total: totalSteps,
        percentage: Math.round((currentStep / totalSteps) * 100),
      }),
      isComplete: () => currentStep >= totalSteps,
    };
  }

  async retry(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    // This line should never be reached, but satisfies consistent-return
    throw new Error('Retry loop completed without returning or throwing');
  }

  async findExecutable(command) {
    const paths = process.env.PATH.split(path.delimiter);
    const extensions = this.platform === 'win32' ? ['.exe', '.cmd', '.bat'] : [''];

    for (const dir of paths) {
      for (const ext of extensions) {
        const fullPath = path.join(dir, command + ext);
        try {
          await fs.access(fullPath, fs.constants.F_OK);
          return fullPath;
        } catch (error) {
          // Continue searching
        }
      }
    }

    return null;
  }

  async createConfigTemplate(templateName, config) {
    const templates = {
      'linear-config': {
        linear: {
          apiKey: config.linearApiKey || 'your_linear_api_key',
          teamId: config.linearTeamId || 'your_team_id',
          projectId: config.linearProjectId || 'your_project_id',
        },
      },
      'workflow-config': {
        workflow: {
          projectName: config.projectName,
          workTreePath: config.workTreePath,
          maxParallelAgents: config.maxParallelAgents || 4,
          autoOpenEditor: config.autoOpenEditor !== false,
          editor: config.editor || 'cursor',
        },
      },
      'git-config': {
        git: {
          defaultBranch: config.defaultBranch || 'main',
          autoCommit: config.autoCommit !== false,
          commitMessagePrefix: config.commitMessagePrefix || '[Agent]',
        },
      },
    };

    return templates[templateName] || {};
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) {
      return '0 Bytes';
    }

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
  }

  async logOperation(operation, result) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      operation,
      result,
      platform: this.platform,
      nodeVersion: process.version,
    };

    // In a real implementation, you might want to write this to a log file
    console.log(`[${timestamp}] ${operation}: ${result}`);

    return logEntry;
  }
}

module.exports = { InstallUtils };
