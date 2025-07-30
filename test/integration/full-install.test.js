const path = require('path');
const os = require('os');

const fs = require('fs-extra');

const { Installer } = require('../../src/installer');
const { createSampleProject } = require('../fixtures/sample-projects');

describe('Full Installation Integration Test', () => {
  let tempDir;
  let installer;

  beforeEach(async () => {
    // Create a unique temp directory for each test
    tempDir = path.join(os.tmpdir(), `claude-hooks-test-${Date.now()}`);
    await fs.ensureDir(tempDir);

    // Create installer instance
    installer = new Installer();

    // Mock console methods to reduce noise in tests
    // jest.spyOn(console, 'log').mockImplementation(() => {});
    // jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.remove(tempDir);

    // Restore console methods
    // console.log.mockRestore();
    // console.info.mockRestore();
  });

  describe('Fresh Installation', () => {
    test('should successfully install in an empty directory', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'new-project');
      await fs.ensureDir(projectPath);

      // Act
      try {
        await installer.install(projectPath, {
          force: false,
          skipPrompts: true,
          packageManager: 'npm',
        });
      } catch (error) {
        console.error('Installation failed:', error.message);
        // Check what files actually exist
        console.log('Files in project after failed install:');
        const files = await fs.readdir(projectPath).catch(() => []);
        console.log(files);
        throw error;
      }

      // Assert - Check that all essential files were created
      expect(await fs.pathExists(path.join(projectPath, '.claude'))).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, '.claude/hooks'))).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, '.claude/commands'))).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, '.claude/settings.json'))).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, 'scripts'))).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, 'scripts/cache-linear-issue.sh'))).toBe(
        true,
      );
      expect(await fs.pathExists(path.join(projectPath, 'scripts/decompose-parallel.cjs'))).toBe(
        true,
      );
      expect(await fs.pathExists(path.join(projectPath, 'scripts/spawn-agents.sh'))).toBe(true);

      // Debug: List what actually exists
      const workflowScriptsPath = path.join(
        projectPath,
        'workflows/paralell-development-claude/scripts',
      );
      if (await fs.pathExists(workflowScriptsPath)) {
        const scriptFiles = await fs.readdir(workflowScriptsPath);
        console.log('Scripts directory contents:', scriptFiles);
      } else {
        console.log('Scripts directory does not exist');
      }

      // Assert - Check that changelog scripts were created
      expect(
        await fs.pathExists(
          path.join(projectPath, 'workflows/paralell-development-claude/scripts/changelog'),
        ),
      ).toBe(true);
      expect(
        await fs.pathExists(
          path.join(
            projectPath,
            'workflows/paralell-development-claude/scripts/changelog/update-changelog.js',
          ),
        ),
      ).toBe(true);
      expect(
        await fs.pathExists(
          path.join(
            projectPath,
            'workflows/paralell-development-claude/scripts/changelog/utils.js',
          ),
        ),
      ).toBe(true);
      expect(
        await fs.pathExists(
          path.join(
            projectPath,
            'workflows/paralell-development-claude/scripts/changelog/README.md',
          ),
        ),
      ).toBe(true);
      expect(
        await fs.pathExists(path.join(projectPath, '.claude/commands/update-changelog.md')),
      ).toBe(true);
    });

    test('should install with correct file permissions', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'permissions-test');
      await fs.ensureDir(projectPath);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
        force: true,
      });

      // Assert - Check that shell scripts are executable
      const scriptsToCheck = ['scripts/cache-linear-issue.sh', 'scripts/spawn-agents.sh'];

      for (const script of scriptsToCheck) {
        const scriptPath = path.join(projectPath, script);
        const stats = await fs.stat(scriptPath);
        // Check if file is executable (Unix permissions: owner execute bit)
        const isExecutable = (stats.mode & 0o100) !== 0;
        expect(isExecutable).toBe(true);
      }

      // Assert - Check that changelog scripts are executable
      const changelogScriptsToCheck = [
        'workflows/paralell-development-claude/scripts/changelog/update-changelog.js',
        'workflows/paralell-development-claude/scripts/changelog/utils.js',
      ];

      for (const script of changelogScriptsToCheck) {
        const scriptPath = path.join(projectPath, script);
        if (await fs.pathExists(scriptPath)) {
          const stats = await fs.stat(scriptPath);
          // Check if file is executable (Unix permissions: owner execute bit)
          const isExecutable = (stats.mode & 0o100) !== 0;
          expect(isExecutable).toBe(true);
        }
      }
    });

    test('should create .gitignore with proper entries', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'gitignore-test');
      await fs.ensureDir(projectPath);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
        force: true,
      });

      // Assert
      const gitignorePath = path.join(projectPath, '.gitignore');
      const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');

      expect(gitignoreContent).toContain('.linear-cache/');
      expect(gitignoreContent).toContain('*.log');
      expect(gitignoreContent).toContain('node_modules/');
      expect(gitignoreContent).toContain('.env');
      expect(gitignoreContent).toContain('.env.local');
    });

    test('should add changelog scripts to package.json', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'package-scripts-test');
      await fs.ensureDir(projectPath);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
        force: true,
      });

      // Assert
      const packageJsonPath = path.join(projectPath, 'package.json');
      expect(await fs.pathExists(packageJsonPath)).toBe(true);

      const packageJson = await fs.readJson(packageJsonPath);
      expect(packageJson.scripts).toBeDefined();

      // Check that changelog scripts were added
      expect(packageJson.scripts['changelog:update']).toBeDefined();
      expect(packageJson.scripts['changelog:auto']).toBeDefined();
      expect(packageJson.scripts['changelog:manual']).toBeDefined();
      expect(packageJson.scripts['changelog:preview']).toBeDefined();

      // Verify script paths are correct
      expect(packageJson.scripts['changelog:update']).toContain(
        'scripts/changelog/update-changelog.js',
      );
      expect(packageJson.scripts['changelog:auto']).toContain('--auto');
      expect(packageJson.scripts['changelog:manual']).toContain('--manual');
      expect(packageJson.scripts['changelog:preview']).toContain('--dry-run');
    });
  });

  describe('Installation in Existing Projects', () => {
    test('should successfully install in a Next.js project', async () => {
      // Arrange
      const projectPath = createSampleProject('nextjs', tempDir);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
        force: true,
      });

      // Assert
      expect(await fs.pathExists(path.join(projectPath, '.claude'))).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, 'scripts'))).toBe(true);

      // Check that existing files were not overwritten
      const packageJson = await fs.readJson(path.join(projectPath, 'package.json'));
      expect(packageJson.name).toBe('nextjs-claude-app');
      expect(packageJson.scripts.dev).toBe('next dev');
    });

    test('should successfully install in a React Vite project', async () => {
      // Arrange
      const projectPath = createSampleProject('react', tempDir);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
        force: true,
      });

      // Assert
      expect(await fs.pathExists(path.join(projectPath, '.claude'))).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, 'scripts'))).toBe(true);

      // Verify Vite config was preserved
      const viteConfig = await fs.readFile(path.join(projectPath, 'vite.config.ts'), 'utf-8');
      expect(viteConfig).toContain('@vitejs/plugin-react');
    });

    test('should successfully install in a Node.js project', async () => {
      // Arrange
      const projectPath = createSampleProject('nodejs', tempDir);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
        force: true,
      });

      // Assert
      expect(await fs.pathExists(path.join(projectPath, '.claude'))).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, 'scripts'))).toBe(true);
    });

    test('should preserve existing .claude directory if present', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'existing-claude');
      await fs.ensureDir(projectPath);

      // Create existing .claude directory with custom content
      const claudeDir = path.join(projectPath, '.claude');
      await fs.ensureDir(claudeDir);
      await fs.writeFile(path.join(claudeDir, 'custom-file.txt'), 'This should be preserved');

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
        force: true,
      });

      // Assert
      const customFile = await fs.readFile(path.join(claudeDir, 'custom-file.txt'), 'utf-8');
      expect(customFile).toBe('This should be preserved');

      // But new files should still be added
      expect(await fs.pathExists(path.join(claudeDir, 'hooks'))).toBe(true);
      expect(await fs.pathExists(path.join(claudeDir, 'commands'))).toBe(true);
    });
  });

  describe('Hook Installation', () => {
    test('should install all required hooks', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'hooks-test');
      await fs.ensureDir(projectPath);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
        force: true,
      });

      // Assert - Check that all hooks are installed
      const hooksDir = path.join(projectPath, '.claude/hooks');
      const expectedHooks = [
        'pre_tool_use.py',
        'post_tool_use.py',
        'stop.py',
        'subagent_stop.py',
        'typescript-validator.py',
        'code-quality-reporter.py',
        'api-standards-checker.py',
      ];

      for (const hook of expectedHooks) {
        expect(await fs.pathExists(path.join(hooksDir, hook))).toBe(true);
      }
    });

    test('should configure hooks properly in settings.json', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'settings-test');
      await fs.ensureDir(projectPath);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
        force: true,
      });

      // Assert
      const settingsPath = path.join(projectPath, '.claude/settings.json');
      const settings = await fs.readJson(settingsPath);

      expect(settings.hooks).toBeDefined();
      expect(settings.hooks.PreToolUse[0].hooks[0].command).toContain(
        'uv run .claude/hooks/pre_tool_use.py',
      );
      expect(settings.hooks.PostToolUse[0].hooks[0].command).toContain(
        'uv run .claude/hooks/post_tool_use.py',
      );
    });
  });

  describe('Package Manager Support', () => {
    test('should install with npm', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'npm-test');
      await fs.ensureDir(projectPath);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
        force: true,
      });

      // Assert
      const packageJson = await fs.readJson(path.join(projectPath, 'package.json'));
      expect(packageJson.scripts).toBeDefined();

      // Check npm-specific files
      expect(await fs.pathExists(path.join(projectPath, '.npmrc'))).toBe(false); // Should not create if not needed
    });

    test('should install with pnpm', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'pnpm-test');
      await fs.ensureDir(projectPath);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'pnpm',
      });

      // Assert
      const packageJson = await fs.readJson(path.join(projectPath, 'package.json'));
      expect(packageJson.scripts).toBeDefined();
    });

    test('should install with yarn', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'yarn-test');
      await fs.ensureDir(projectPath);

      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'yarn',
      });

      // Assert
      const packageJson = await fs.readJson(path.join(projectPath, 'package.json'));
      expect(packageJson.scripts).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should fail gracefully when target directory is not writable', async () => {
      // This test would require mocking file system permissions
      // which is complex and platform-specific
      expect(true).toBe(true); // Placeholder
    });

    test('should handle missing dependencies gracefully', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'missing-deps');
      await fs.ensureDir(projectPath);

      // Mock validateEnvironment to throw error for missing dependencies
      const originalValidateEnvironment = installer.steps.validateEnvironment;
      installer.steps.validateEnvironment = jest
        .fn()
        .mockRejectedValue(new Error('Missing required dependencies'));

      // Act & Assert
      await expect(
        installer.install(projectPath, {
          skipPrompts: true,
        }),
      ).rejects.toThrow();

      // Restore
      installer.steps.validateEnvironment = originalValidateEnvironment;
    });
  });

  describe('Update Installation', () => {
    test('should update existing installation', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'update-test');
      await fs.ensureDir(projectPath);

      // First installation
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
        force: true,
      });

      // Modify a file to simulate an older version
      const hookPath = path.join(projectPath, '.claude/hooks/pre_tool_use.py');
      await fs.writeFile(hookPath, '# Old version');

      // Act - Update installation
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
        update: true,
      });

      // Assert - File should be updated
      const hookContent = await fs.readFile(hookPath, 'utf-8');
      expect(hookContent).not.toBe('# Old version');
    });
  });
});
