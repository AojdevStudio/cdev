const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { Installer } = require('../../src/installer');
const { createSampleProject, getProjectTypes } = require('../fixtures/sample-projects');

describe('Project Types Integration Test', () => {
  let tempDir;
  let installer;
  
  beforeEach(async () => {
    // Create a unique temp directory for each test
    tempDir = path.join(os.tmpdir(), `claude-hooks-project-types-${Date.now()}`);
    await fs.ensureDir(tempDir);
    
    // Create installer instance
    installer = new Installer();
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
  });
  
  afterEach(async () => {
    // Clean up temp directory
    await fs.remove(tempDir);
    
    // Restore console methods
    console.log.mockRestore();
    console.info.mockRestore();
  });
  
  describe('Framework-Specific Installation', () => {
    test('should correctly detect and configure Next.js projects', async () => {
      // Arrange
      const projectPath = createSampleProject('nextjs', tempDir);
      
      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm'
      });
      
      // Assert
      const claudeSettings = await fs.readJson(
        path.join(projectPath, '.claude/settings.json')
      );
      
      expect(claudeSettings.projectType).toBe('nextjs');
      expect(claudeSettings.framework).toBe('next');
      
      // Check for Next.js specific configurations
      const packageJson = await fs.readJson(path.join(projectPath, 'package.json'));
      expect(packageJson.scripts['claude:cache']).toBeDefined();
      expect(packageJson.scripts['claude:decompose']).toBeDefined();
      expect(packageJson.scripts['claude:spawn']).toBeDefined();
    });
    
    test('should correctly detect and configure React Vite projects', async () => {
      // Arrange
      const projectPath = createSampleProject('react', tempDir);
      
      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm'
      });
      
      // Assert
      const claudeSettings = await fs.readJson(
        path.join(projectPath, '.claude/settings.json')
      );
      
      expect(claudeSettings.projectType).toBe('react');
      expect(claudeSettings.buildTool).toBe('vite');
      
      // Verify Vite-specific configuration
      expect(claudeSettings.testRunner).toBe('vitest');
    });
    
    test('should correctly detect and configure Node.js backend projects', async () => {
      // Arrange
      const projectPath = createSampleProject('nodejs', tempDir);
      
      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm'
      });
      
      // Assert
      const claudeSettings = await fs.readJson(
        path.join(projectPath, '.claude/settings.json')
      );
      
      expect(claudeSettings.projectType).toBe('nodejs');
      expect(claudeSettings.runtime).toBe('node');
      
      // Check for backend-specific hooks
      const hooksDir = path.join(projectPath, '.claude/hooks');
      expect(await fs.pathExists(path.join(hooksDir, 'api-standards-checker.py'))).toBe(true);
    });
    
    test('should correctly detect and configure Python Flask projects', async () => {
      // Arrange
      const projectPath = createSampleProject('python', tempDir);
      
      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'pip'
      });
      
      // Assert
      const claudeSettings = await fs.readJson(
        path.join(projectPath, '.claude/settings.json')
      );
      
      expect(claudeSettings.projectType).toBe('python');
      expect(claudeSettings.framework).toBe('flask');
      expect(claudeSettings.packageManager).toBe('pip');
      
      // Check for Python-specific configurations
      expect(claudeSettings.hooks.pre_tool_use).toContain('python3');
    });
    
    test('should correctly handle monorepo projects', async () => {
      // Arrange
      const projectPath = createSampleProject('monorepo', tempDir);
      
      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'pnpm'
      });
      
      // Assert
      const claudeSettings = await fs.readJson(
        path.join(projectPath, '.claude/settings.json')
      );
      
      expect(claudeSettings.projectType).toBe('monorepo');
      expect(claudeSettings.workspaces).toBeDefined();
      expect(claudeSettings.monorepoTool).toBe('turbo');
      
      // Verify workspace configuration
      const packageJson = await fs.readJson(path.join(projectPath, 'package.json'));
      expect(packageJson.workspaces).toBeDefined();
    });
    
    test('should handle minimal JavaScript projects', async () => {
      // Arrange
      const projectPath = createSampleProject('minimal', tempDir);
      
      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm'
      });
      
      // Assert
      const claudeSettings = await fs.readJson(
        path.join(projectPath, '.claude/settings.json')
      );
      
      expect(claudeSettings.projectType).toBe('javascript');
      expect(claudeSettings.minimal).toBe(true);
    });
  });
  
  describe('Project Detection Accuracy', () => {
    test('should detect all supported project types', async () => {
      const projectTypes = getProjectTypes();
      
      for (const projectType of projectTypes) {
        // Arrange
        const projectPath = createSampleProject(projectType, tempDir);
        
        // Act
        const detectedType = await installer.detectProjectType(projectPath);
        
        // Assert
        expect(detectedType).toBeDefined();
        expect(detectedType.type).toBe(projectType);
      }
    });
    
    test('should handle projects with multiple framework indicators', async () => {
      // Arrange - Create a project with both React and Next.js indicators
      const projectPath = path.join(tempDir, 'hybrid-project');
      await fs.ensureDir(projectPath);
      
      // Create package.json with mixed dependencies
      await fs.writeJson(path.join(projectPath, 'package.json'), {
        name: 'hybrid-project',
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          next: '^14.0.0'
        }
      });
      
      // Create next.config.js to make it a Next.js project
      await fs.writeFile(
        path.join(projectPath, 'next.config.js'),
        'module.exports = { reactStrictMode: true }'
      );
      
      // Act
      const detectedType = await installer.detectProjectType(projectPath);
      
      // Assert - Should prioritize Next.js over plain React
      expect(detectedType.type).toBe('nextjs');
      expect(detectedType.confidence).toBeGreaterThan(0.8);
    });
    
    test('should handle unknown project types gracefully', async () => {
      // Arrange - Create a project with unknown structure
      const projectPath = path.join(tempDir, 'unknown-project');
      await fs.ensureDir(projectPath);
      
      await fs.writeFile(
        path.join(projectPath, 'Makefile'),
        'build:\n\techo "Building..."'
      );
      
      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm'
      });
      
      // Assert
      const claudeSettings = await fs.readJson(
        path.join(projectPath, '.claude/settings.json')
      );
      
      expect(claudeSettings.projectType).toBe('generic');
      expect(await fs.pathExists(path.join(projectPath, '.claude'))).toBe(true);
    });
  });
  
  describe('Framework-Specific Features', () => {
    test('should add Next.js specific commands', async () => {
      // Arrange
      const projectPath = createSampleProject('nextjs', tempDir);
      
      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm'
      });
      
      // Assert
      const commandsDir = path.join(projectPath, '.claude/commands');
      expect(await fs.pathExists(path.join(commandsDir, 'next-page-generator.md'))).toBe(true);
      expect(await fs.pathExists(path.join(commandsDir, 'next-api-route.md'))).toBe(true);
    });
    
    test('should add React specific hooks and commands', async () => {
      // Arrange
      const projectPath = createSampleProject('react', tempDir);
      
      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm'
      });
      
      // Assert
      const commandsDir = path.join(projectPath, '.claude/commands');
      expect(await fs.pathExists(path.join(commandsDir, 'react-component.md'))).toBe(true);
      expect(await fs.pathExists(path.join(commandsDir, 'react-hook.md'))).toBe(true);
    });
    
    test('should add backend specific tools for Node.js projects', async () => {
      // Arrange
      const projectPath = createSampleProject('nodejs', tempDir);
      
      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm'
      });
      
      // Assert
      const hooksDir = path.join(projectPath, '.claude/hooks');
      const hasApiChecker = await fs.pathExists(
        path.join(hooksDir, 'api-standards-checker.py')
      );
      expect(hasApiChecker).toBe(true);
      
      // Check for API-specific commands
      const commandsDir = path.join(projectPath, '.claude/commands');
      expect(await fs.pathExists(path.join(commandsDir, 'api-endpoint.md'))).toBe(true);
    });
  });
  
  describe('Package Manager Detection', () => {
    test('should auto-detect npm from package-lock.json', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'npm-detect');
      await fs.ensureDir(projectPath);
      await fs.writeJson(path.join(projectPath, 'package.json'), { name: 'test' });
      await fs.writeFile(path.join(projectPath, 'package-lock.json'), '{}');
      
      // Act
      const detectedPM = await installer.detectPackageManager(projectPath);
      
      // Assert
      expect(detectedPM).toBe('npm');
    });
    
    test('should auto-detect pnpm from pnpm-lock.yaml', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'pnpm-detect');
      await fs.ensureDir(projectPath);
      await fs.writeJson(path.join(projectPath, 'package.json'), { name: 'test' });
      await fs.writeFile(path.join(projectPath, 'pnpm-lock.yaml'), '');
      
      // Act
      const detectedPM = await installer.detectPackageManager(projectPath);
      
      // Assert
      expect(detectedPM).toBe('pnpm');
    });
    
    test('should auto-detect yarn from yarn.lock', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'yarn-detect');
      await fs.ensureDir(projectPath);
      await fs.writeJson(path.join(projectPath, 'package.json'), { name: 'test' });
      await fs.writeFile(path.join(projectPath, 'yarn.lock'), '');
      
      // Act
      const detectedPM = await installer.detectPackageManager(projectPath);
      
      // Assert
      expect(detectedPM).toBe('yarn');
    });
    
    test('should default to npm when no lock file exists', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'no-lock');
      await fs.ensureDir(projectPath);
      await fs.writeJson(path.join(projectPath, 'package.json'), { name: 'test' });
      
      // Act
      const detectedPM = await installer.detectPackageManager(projectPath);
      
      // Assert
      expect(detectedPM).toBe('npm');
    });
  });
  
  describe('TypeScript Support', () => {
    test('should detect TypeScript projects', async () => {
      // Arrange
      const projectPath = createSampleProject('nodejs', tempDir);
      
      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm'
      });
      
      // Assert
      const claudeSettings = await fs.readJson(
        path.join(projectPath, '.claude/settings.json')
      );
      
      expect(claudeSettings.typescript).toBe(true);
      
      // Check for TypeScript-specific hooks
      const hooksDir = path.join(projectPath, '.claude/hooks');
      expect(await fs.pathExists(
        path.join(hooksDir, 'typescript-validator.py')
      )).toBe(true);
    });
    
    test('should configure TypeScript validation for TS projects', async () => {
      // Arrange
      const projectPath = createSampleProject('nextjs', tempDir);
      
      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm'
      });
      
      // Assert
      const settings = await fs.readJson(
        path.join(projectPath, '.claude/settings.json')
      );
      
      expect(settings.validation.typescript).toBe(true);
      expect(settings.validation.typeCheck).toBe(true);
    });
  });
});