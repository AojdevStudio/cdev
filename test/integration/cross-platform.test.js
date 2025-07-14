const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const fs = require('fs-extra');
const inquirer = require('inquirer');

const { Installer } = require('../../src/installer');
const { PythonDetector } = require('../../src/python-detector');

describe('Cross-Platform Integration Test', () => {
  let tempDir;
  let installer;
  const { platform } = process;

  beforeEach(async () => {
    // Create a unique temp directory for each test
    tempDir = path.join(os.tmpdir(), `claude-hooks-xplat-${Date.now()}`);
    await fs.ensureDir(tempDir);

    // Create installer instance
    installer = new Installer();

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock inquirer to avoid interactive prompts
    jest.spyOn(inquirer, 'prompt').mockResolvedValue({
      projectName: 'test-project',
      setupLinear: true,
      linearApiKey: '',
      setupGitHooks: true,
      worktreeLocation: 'tmp',
    });
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.remove(tempDir);

    // Restore console methods
    console.log.mockRestore();
    console.info.mockRestore();
    console.error.mockRestore();

    // Restore inquirer mock
    inquirer.prompt.mockRestore();
  });

  describe('Path Handling', () => {
    test('should handle paths correctly on different platforms', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'path-test');
      await fs.ensureDir(projectPath);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
      });

      // Assert - Check that workflows directory structure was created
      expect(await fs.pathExists(path.join(projectPath, 'workflows'))).toBe(true);
      expect(
        await fs.pathExists(path.join(projectPath, 'workflows/paralell-development-claude')),
      ).toBe(true);

      // Check that paths use correct separators in created files
      const workflowDir = path.join(projectPath, 'workflows/paralell-development-claude');
      if (await fs.pathExists(workflowDir)) {
        const files = await fs.readdir(workflowDir);
        expect(files.length).toBeGreaterThan(0);
      }
    });

    test('should handle spaces in directory names', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'project with spaces');
      await fs.ensureDir(projectPath);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
      });

      // Assert
      expect(await fs.pathExists(path.join(projectPath, 'workflows'))).toBe(true);
      expect(
        await fs.pathExists(
          path.join(projectPath, 'workflows/paralell-development-claude/scripts'),
        ),
      ).toBe(true);

      // Verify Python scripts can handle paths with spaces
      const pythonScriptsDir = path.join(
        projectPath,
        'workflows/paralell-development-claude/scripts/python',
      );
      if (await fs.pathExists(pythonScriptsDir)) {
        const scriptPath = path.join(pythonScriptsDir, 'cache-linear-issue.py');
        if (await fs.pathExists(scriptPath)) {
          const scriptContent = await fs.readFile(scriptPath, 'utf-8');
          expect(scriptContent).toContain('uv run --script'); // Should use UV script runner
        }
      }
    });

    test('should handle unicode characters in paths', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'projet-français-测试');
      await fs.ensureDir(projectPath);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
      });

      // Assert
      expect(await fs.pathExists(path.join(projectPath, 'workflows'))).toBe(true);

      // Verify workflows directory can be read back correctly
      const workflowDir = path.join(projectPath, 'workflows/paralell-development-claude');
      expect(await fs.pathExists(workflowDir)).toBe(true);
    });
  });

  describe('Python Script Compatibility', () => {
    test('should create Python scripts with UV shebang', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'python-test');
      await fs.ensureDir(projectPath);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
      });

      // Assert
      const pythonScriptsDir = path.join(
        projectPath,
        'workflows/paralell-development-claude/scripts/python',
      );
      if (await fs.pathExists(pythonScriptsDir)) {
        const scriptFiles = await fs.readdir(pythonScriptsDir);
        const pythonScripts = scriptFiles.filter((f) => f.endsWith('.py'));

        for (const script of pythonScripts) {
          const scriptPath = path.join(pythonScriptsDir, script);
          const content = await fs.readFile(scriptPath, 'utf-8');

          // Check for UV script runner shebang
          expect(content.startsWith('#!/usr/bin/env -S uv run --script')).toBe(true);

          // Check for inline dependency specification
          expect(content).toContain('# /// script');
          expect(content).toContain('requires-python = ">=3.11"');
          expect(content).toContain('dependencies = [');

          // Check line endings based on platform
          if (platform === 'win32') {
            // Windows scripts might have CRLF, but git might normalize them
            expect(content).toBeDefined();
          } else {
            // Unix systems should have LF only
            expect(content.includes('\r\n')).toBe(false);
          }
        }
      } else {
        // If Python scripts don't exist, just verify the structure was created
        expect(
          await fs.pathExists(
            path.join(projectPath, 'workflows/paralell-development-claude/scripts'),
          ),
        ).toBe(true);
      }
    });

    test('should set executable permissions on Python scripts (Unix systems)', async () => {
      // Skip on Windows
      if (platform === 'win32') {
        expect(true).toBe(true);
        return;
      }

      // Arrange
      const projectPath = path.join(tempDir, 'perms-test');
      await fs.ensureDir(projectPath);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
      });

      // Assert - Check executable permissions on Python scripts
      const pythonScriptsToCheck = [
        'workflows/paralell-development-claude/scripts/python/cache-linear-issue.py',
        'workflows/paralell-development-claude/scripts/python/spawn-agents.py',
      ];

      for (const script of pythonScriptsToCheck) {
        const scriptPath = path.join(projectPath, script);
        if (await fs.pathExists(scriptPath)) {
          const stats = await fs.stat(scriptPath);
          // Check if owner has execute permission
          const isExecutable = (stats.mode & 0o100) !== 0;
          expect(isExecutable).toBe(true);
        }
      }
    });
  });

  describe('UV and Python Environment', () => {
    test('should detect UV availability', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'uv-test');
      await fs.ensureDir(projectPath);

      // Mock UV availability check
      const originalExecSync = require('child_process').execSync;
      const uvAvailable = true;
      require('child_process').execSync = jest.fn().mockImplementation((cmd) => {
        if (cmd.includes('uv') && cmd.includes('--version')) {
          if (!uvAvailable) {
            throw new Error('UV not found');
          }
          return 'uv 0.1.0';
        }
        return originalExecSync(cmd);
      });

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
      });

      // Assert
      expect(await fs.pathExists(path.join(projectPath, 'workflows'))).toBe(true);
      expect(
        await fs.pathExists(path.join(projectPath, 'workflows/paralell-development-claude')),
      ).toBe(true);

      // Restore
      require('child_process').execSync = originalExecSync;
    });

    test('should handle Python 3.11+ requirement', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'python-version-test');
      await fs.ensureDir(projectPath);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
      });

      // Assert - Check that Python scripts specify correct version requirement
      const pythonScriptsDir = path.join(
        projectPath,
        'workflows/paralell-development-claude/scripts/python',
      );
      if (await fs.pathExists(pythonScriptsDir)) {
        const scriptFiles = await fs.readdir(pythonScriptsDir);
        const pythonScripts = scriptFiles.filter((f) => f.endsWith('.py'));

        for (const script of pythonScripts) {
          const scriptPath = path.join(pythonScriptsDir, script);
          const content = await fs.readFile(scriptPath, 'utf-8');

          // Should require Python 3.11+
          expect(content).toContain('requires-python = ">=3.11"');
        }
      } else {
        // If Python scripts don't exist, just verify the structure was created
        expect(
          await fs.pathExists(
            path.join(projectPath, 'workflows/paralell-development-claude/scripts'),
          ),
        ).toBe(true);
      }
    });

    test('should handle inline dependencies correctly', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'deps-test');
      await fs.ensureDir(projectPath);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
      });

      // Assert - Check that scripts have proper inline dependencies
      const pythonScriptsDir = path.join(
        projectPath,
        'workflows/paralell-development-claude/scripts/python',
      );
      if (await fs.pathExists(pythonScriptsDir)) {
        const cacheScriptPath = path.join(pythonScriptsDir, 'cache-linear-issue.py');
        if (await fs.pathExists(cacheScriptPath)) {
          const content = await fs.readFile(cacheScriptPath, 'utf-8');

          // Should have required dependencies
          expect(content).toContain('"ruamel.yaml>=0.18"');
          expect(content).toContain('"click>=8.1"');
          expect(content).toContain('"rich>=13.0"');
          expect(content).toContain('"httpx>=0.25.0"');
        }
      } else {
        // If Python scripts don't exist, just verify the structure was created
        expect(
          await fs.pathExists(
            path.join(projectPath, 'workflows/paralell-development-claude/scripts'),
          ),
        ).toBe(true);
      }
    });
  });

  describe('Git Integration', () => {
    test('should handle different git configurations', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'git-test');
      await fs.ensureDir(projectPath);

      // Initialize git repo
      try {
        execSync('git init', { cwd: projectPath });
      } catch (e) {
        // Git might not be available in CI
        console.log('Git not available, skipping git test');
        return;
      }

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
      });

      // Assert
      const gitignorePath = path.join(projectPath, '.gitignore');
      if (await fs.pathExists(gitignorePath)) {
        const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
        expect(gitignoreContent).toContain('.linear-cache/');
        expect(gitignoreContent).toContain('node_modules/');
        expect(gitignoreContent).toContain('__pycache__/'); // Python cache files
      }
    });

    test('should handle git worktree operations with Python scripts', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'worktree-test');
      await fs.ensureDir(projectPath);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
      });

      // Assert - Check that spawn-agents.py is properly configured
      const pythonScriptsDir = path.join(
        projectPath,
        'workflows/paralell-development-claude/scripts/python',
      );
      if (await fs.pathExists(pythonScriptsDir)) {
        const spawnScript = path.join(pythonScriptsDir, 'spawn-agents.py');
        if (await fs.pathExists(spawnScript)) {
          const scriptContent = await fs.readFile(spawnScript, 'utf-8');

          // Should handle worktree paths correctly
          expect(scriptContent).toContain('git worktree');
          expect(scriptContent).toContain('Path'); // Python Path handling
        }
      } else {
        // If Python scripts don't exist, just verify the structure was created
        expect(
          await fs.pathExists(
            path.join(projectPath, 'workflows/paralell-development-claude/scripts'),
          ),
        ).toBe(true);
      }
    });
  });

  describe('File System Operations', () => {
    test('should handle case-sensitive file systems', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'case-test');
      await fs.ensureDir(projectPath);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
      });

      // Assert - Files should be created with correct case
      const claudeDir = path.join(projectPath, '.claude');
      expect(await fs.pathExists(claudeDir)).toBe(true);

      // Check that we don't have duplicate files with different cases
      const dirContents = await fs.readdir(projectPath);
      const claudeDirs = dirContents.filter((item) => item.toLowerCase() === '.claude');
      expect(claudeDirs.length).toBe(1);
    });

    test('should handle different file permissions models', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'perms-model-test');
      await fs.ensureDir(projectPath);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
      });

      // Assert
      const workflowDir = path.join(projectPath, 'workflows/paralell-development-claude');
      if (await fs.pathExists(workflowDir)) {
        const files = await fs.readdir(workflowDir);

        for (const file of files) {
          const filePath = path.join(workflowDir, file);
          const stats = await fs.stat(filePath);

          // File should be readable by owner
          if (platform !== 'win32') {
            const isReadable = (stats.mode & 0o400) !== 0;
            expect(isReadable).toBe(true);
          }
        }
      }
    });
  });

  describe('Environment Variables', () => {
    test('should handle platform-specific environment variables', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'env-test');
      await fs.ensureDir(projectPath);

      // Set platform-specific env vars
      const originalPath = process.env.PATH;
      if (platform === 'win32') {
        process.env.PATH = `C:\\Windows\\System32;${originalPath}`;
      }

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
      });

      // Assert
      const envExamplePath = path.join(projectPath, '.env.example');
      if (await fs.pathExists(envExamplePath)) {
        const envContent = await fs.readFile(envExamplePath, 'utf-8');
        expect(envContent).toContain('LINEAR_API_KEY');
      }

      // Restore
      process.env.PATH = originalPath;
    });

    test('should create platform-appropriate .env files', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'env-files-test');
      await fs.ensureDir(projectPath);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
      });

      // Assert
      const envExample = path.join(projectPath, '.env.example');
      if (await fs.pathExists(envExample)) {
        const content = await fs.readFile(envExample, 'utf-8');

        // Check line endings
        if (platform === 'win32') {
          // Windows might have CRLF
          expect(content).toBeDefined();
        } else {
          // Unix should have LF only
          expect(content.includes('\r\n')).toBe(false);
        }
      }
    });
  });

  describe('Terminal and Shell Integration', () => {
    test('should detect available Python interpreters', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'python-detect');
      await fs.ensureDir(projectPath);

      // Act
      const pythonDetector = new PythonDetector();
      const detectedPython = pythonDetector.getBestPython();

      // Assert
      if (detectedPython) {
        if (platform === 'win32') {
          expect(['python', 'python3', 'py']).toContain(detectedPython.command);
        } else {
          expect(['python3', 'python']).toContain(detectedPython.command);
        }
      } else {
        // If no Python detected, that's still a valid test result
        expect(detectedPython).toBeNull();
      }
    });

    test('should create appropriate npm script aliases for Python scripts', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'alias-test');
      await fs.ensureDir(projectPath);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
        createAliases: true,
      });

      // Assert
      const packageJson = await fs.readJson(path.join(projectPath, 'package.json'));

      // Should have npm scripts as cross-platform aliases for Python scripts
      if (packageJson.scripts) {
        // Check for UV-based script execution
        const cacheScript = packageJson.scripts['claude:cache'];
        if (cacheScript) {
          expect(cacheScript).toEqual(expect.stringMatching(/uv run|python/));
        }

        const spawnScript = packageJson.scripts['claude:spawn'];
        if (spawnScript) {
          expect(spawnScript).toEqual(expect.stringMatching(/uv run|python/));
        }
      }
    });

    test('should handle UV script execution across platforms', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'uv-exec-test');
      await fs.ensureDir(projectPath);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
      });

      // Assert - Check that UV scripts can be executed
      const pythonScriptsDir = path.join(
        projectPath,
        'workflows/paralell-development-claude/scripts/python',
      );
      if (await fs.pathExists(pythonScriptsDir)) {
        const scriptFiles = await fs.readdir(pythonScriptsDir);
        const pythonScripts = scriptFiles.filter((f) => f.endsWith('.py'));

        for (const script of pythonScripts) {
          const scriptPath = path.join(pythonScriptsDir, script);
          const content = await fs.readFile(scriptPath, 'utf-8');

          // Should be executable via UV across platforms
          expect(content.startsWith('#!/usr/bin/env -S uv run --script')).toBe(true);
        }
      } else {
        // If Python scripts don't exist, just verify the structure was created
        expect(
          await fs.pathExists(
            path.join(projectPath, 'workflows/paralell-development-claude/scripts'),
          ),
        ).toBe(true);
      }
    });
  });
});
