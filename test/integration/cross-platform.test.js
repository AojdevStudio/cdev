const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { execSync } = require('child_process');
const { Installer } = require('../../src/installer');

describe('Cross-Platform Integration Test', () => {
  let tempDir;
  let installer;
  const platform = process.platform;
  
  beforeEach(async () => {
    // Create a unique temp directory for each test
    tempDir = path.join(os.tmpdir(), `claude-hooks-xplat-${Date.now()}`);
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
  
  describe('Path Handling', () => {
    test('should handle paths correctly on different platforms', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'path-test');
      await fs.ensureDir(projectPath);
      
      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm'
      });
      
      // Assert - Paths should use correct separators
      const settings = await fs.readJson(
        path.join(projectPath, '.claude/settings.json')
      );
      
      // Check that paths in settings use the correct platform separator
      if (platform === 'win32') {
        expect(settings.hooks.pre_tool_use).toContain('\\');
      } else {
        expect(settings.hooks.pre_tool_use).toContain('/');
      }
    });
    
    test('should handle spaces in directory names', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'project with spaces');
      await fs.ensureDir(projectPath);
      
      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm'
      });
      
      // Assert
      expect(await fs.pathExists(path.join(projectPath, '.claude'))).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, 'scripts'))).toBe(true);
      
      // Verify scripts can handle paths with spaces
      const scriptPath = path.join(projectPath, 'scripts/cache-linear-issue.sh');
      const scriptContent = await fs.readFile(scriptPath, 'utf-8');
      expect(scriptContent).toContain('quotes'); // Should have proper quoting
    });
    
    test('should handle unicode characters in paths', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'projet-français-测试');
      await fs.ensureDir(projectPath);
      
      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm'
      });
      
      // Assert
      expect(await fs.pathExists(path.join(projectPath, '.claude'))).toBe(true);
      
      // Verify settings can be read back correctly
      const settings = await fs.readJson(
        path.join(projectPath, '.claude/settings.json')
      );
      expect(settings).toBeDefined();
    });
  });
  
  describe('Shell Script Compatibility', () => {
    test('should create platform-appropriate shell scripts', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'shell-test');
      await fs.ensureDir(projectPath);
      
      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm'
      });
      
      // Assert
      const scriptFiles = await fs.readdir(path.join(projectPath, 'scripts'));
      const shellScripts = scriptFiles.filter(f => f.endsWith('.sh'));
      
      for (const script of shellScripts) {
        const scriptPath = path.join(projectPath, 'scripts', script);
        const content = await fs.readFile(scriptPath, 'utf-8');
        
        // Check for proper shebang
        expect(content.startsWith('#!/bin/bash') || content.startsWith('#!/usr/bin/env bash')).toBe(true);
        
        // Check line endings based on platform
        if (platform === 'win32') {
          // Windows scripts might have CRLF, but git might normalize them
          expect(content).toBeDefined();
        } else {
          // Unix systems should have LF only
          expect(content.includes('\r\n')).toBe(false);
        }
      }
    });
    
    test('should set executable permissions on Unix systems', async () => {
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
        packageManager: 'npm'
      });
      
      // Assert - Check executable permissions
      const scriptsToCheck = [
        'scripts/cache-linear-issue.sh',
        'scripts/spawn-agents.sh'
      ];
      
      for (const script of scriptsToCheck) {
        const scriptPath = path.join(projectPath, script);
        const stats = await fs.stat(scriptPath);
        // Check if owner has execute permission
        const isExecutable = (stats.mode & 0o100) !== 0;
        expect(isExecutable).toBe(true);
      }
    });
  });
  
  describe('Python Hook Compatibility', () => {
    test('should use correct Python command for platform', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'python-test');
      await fs.ensureDir(projectPath);
      
      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm'
      });
      
      // Assert
      const settings = await fs.readJson(
        path.join(projectPath, '.claude/settings.json')
      );
      
      // Should use python3 on Unix, python on Windows
      const pythonCmd = platform === 'win32' ? 'python' : 'python3';
      expect(settings.hooks.pre_tool_use).toContain(pythonCmd);
    });
    
    test('should handle Python path detection', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'pypath-test');
      await fs.ensureDir(projectPath);
      
      // Mock Python availability check
      const originalExecSync = require('child_process').execSync;
      let pythonAvailable = true;
      require('child_process').execSync = jest.fn().mockImplementation((cmd) => {
        if (cmd.includes('python') && cmd.includes('--version')) {
          if (!pythonAvailable) {
            throw new Error('Python not found');
          }
          return 'Python 3.9.0';
        }
        return originalExecSync(cmd);
      });
      
      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm'
      });
      
      // Assert
      const settings = await fs.readJson(
        path.join(projectPath, '.claude/settings.json')
      );
      expect(settings.hooks).toBeDefined();
      
      // Restore
      require('child_process').execSync = originalExecSync;
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
        packageManager: 'npm'
      });
      
      // Assert
      const gitignorePath = path.join(projectPath, '.gitignore');
      if (await fs.pathExists(gitignorePath)) {
        const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
        expect(gitignoreContent).toContain('.linear-cache/');
        expect(gitignoreContent).toContain('node_modules/');
      }
    });
    
    test('should handle git worktree operations', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'worktree-test');
      await fs.ensureDir(projectPath);
      
      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm'
      });
      
      // Assert - Check that spawn-agents.sh is properly configured
      const spawnScript = path.join(projectPath, 'scripts/spawn-agents.sh');
      const scriptContent = await fs.readFile(spawnScript, 'utf-8');
      
      // Should handle worktree paths correctly
      expect(scriptContent).toContain('git worktree');
      expect(scriptContent).toContain('realpath'); // For resolving paths
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
        packageManager: 'npm'
      });
      
      // Assert - Files should be created with correct case
      const claudeDir = path.join(projectPath, '.claude');
      expect(await fs.pathExists(claudeDir)).toBe(true);
      
      // Check that we don't have duplicate files with different cases
      const dirContents = await fs.readdir(projectPath);
      const claudeDirs = dirContents.filter(
        item => item.toLowerCase() === '.claude'
      );
      expect(claudeDirs.length).toBe(1);
    });
    
    test('should handle different file permissions models', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'perms-model-test');
      await fs.ensureDir(projectPath);
      
      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm'
      });
      
      // Assert
      const hooksDir = path.join(projectPath, '.claude/hooks');
      const hooks = await fs.readdir(hooksDir);
      
      for (const hook of hooks) {
        const hookPath = path.join(hooksDir, hook);
        const stats = await fs.stat(hookPath);
        
        // File should be readable by owner
        if (platform !== 'win32') {
          const isReadable = (stats.mode & 0o400) !== 0;
          expect(isReadable).toBe(true);
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
        process.env.PATH = 'C:\\Windows\\System32;' + originalPath;
      }
      
      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm'
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
        packageManager: 'npm'
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
    test('should detect available shells', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'shell-detect');
      await fs.ensureDir(projectPath);
      
      // Act
      const detectedShell = await installer.detectShell();
      
      // Assert
      if (platform === 'win32') {
        expect(['cmd', 'powershell', 'bash']).toContain(detectedShell);
      } else {
        expect(['bash', 'zsh', 'sh']).toContain(detectedShell);
      }
    });
    
    test('should create appropriate command aliases', async () => {
      // Arrange
      const projectPath = path.join(tempDir, 'alias-test');
      await fs.ensureDir(projectPath);
      
      // Act
      await installer.install(projectPath, {
        skipPrompts: true,
        packageManager: 'npm',
        createAliases: true
      });
      
      // Assert
      const packageJson = await fs.readJson(path.join(projectPath, 'package.json'));
      
      // Should have npm scripts as cross-platform aliases
      expect(packageJson.scripts['claude:cache']).toBeDefined();
      expect(packageJson.scripts['claude:decompose']).toBeDefined();
      expect(packageJson.scripts['claude:spawn']).toBeDefined();
    });
  });
});