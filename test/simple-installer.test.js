const path = require('path');

const fs = require('fs-extra');

const { SimpleInstaller } = require('../src/simple-installer');

// Mock dependencies
jest.mock('fs-extra');
jest.mock('chalk', () => ({
  green: jest.fn((str) => str),
  yellow: jest.fn((str) => str),
  cyan: jest.fn((str) => str),
}));
jest.mock('ora', () =>
  jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    text: '',
    succeed: jest.fn(),
    fail: jest.fn(),
  })),
);

describe('SimpleInstaller', () => {
  let installer;
  let mockSpinner;
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    installer = new SimpleInstaller();

    // Mock ora spinner
    const ora = require('ora');
    mockSpinner = {
      start: jest.fn().mockReturnThis(),
      succeed: jest.fn(),
      fail: jest.fn(),
      text: '',
    };
    ora.mockReturnValue(mockSpinner);

    // Mock console.log to avoid output during tests
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Default fs mocks
    fs.ensureDir.mockResolvedValue();
    fs.writeJson.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
    fs.copy.mockResolvedValue();
    fs.pathExists.mockResolvedValue(true);
    fs.readdir.mockResolvedValue([]);
    fs.chmod.mockResolvedValue();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize with correct package root', () => {
      expect(installer.packageRoot).toBe(path.join(__dirname, '..'));
    });
  });

  describe('install', () => {
    it('should complete full installation successfully', async () => {
      const targetDir = '/test/project';

      await installer.install(targetDir);

      expect(fs.ensureDir).toHaveBeenCalledWith(path.resolve(targetDir));
      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.succeed).toHaveBeenCalledWith('cdev installation complete!');
    });

    it('should handle installation failure gracefully', async () => {
      const targetDir = '/test/project';
      const error = new Error('Installation failed');

      fs.ensureDir.mockRejectedValueOnce(error);

      await expect(installer.install(targetDir)).rejects.toThrow('Installation failed');
      expect(mockSpinner.fail).toHaveBeenCalledWith('Installation failed');
    });

    it('should use current directory as default target', async () => {
      await installer.install();

      expect(fs.ensureDir).toHaveBeenCalledWith(path.resolve('.'));
    });

    it('should display success message after installation', async () => {
      await installer.install('/test/project');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Successfully installed cdev files'),
      );
    });
  });

  describe('createClaudeDirectory', () => {
    it('should create all required Claude directories', async () => {
      const targetDir = '/test/project';
      const expectedDirs = [
        '.claude',
        '.claude/hooks',
        '.claude/commands',
        '.claude/logs',
        '.claude/templates',
      ];

      await installer.createClaudeDirectory(targetDir);

      for (const dir of expectedDirs) {
        expect(fs.ensureDir).toHaveBeenCalledWith(path.join(targetDir, dir));
      }
    });
  });

  describe('copyHookConfigurations', () => {
    it('should create settings.json with hook configurations', async () => {
      const targetDir = '/test/project';
      const claudeDir = path.join(targetDir, '.claude');

      await installer.copyHookConfigurations(targetDir);

      expect(fs.writeJson).toHaveBeenCalledWith(
        path.join(claudeDir, 'settings.json'),
        expect.objectContaining({
          permissions: expect.any(Object),
          hooks: expect.any(Object),
        }),
        { spaces: 2 },
      );
    });

    it('should copy hooks from package if they exist', async () => {
      const targetDir = '/test/project';
      fs.pathExists.mockResolvedValueOnce(true); // hooks source exists

      await installer.copyHookConfigurations(targetDir);

      expect(fs.copy).toHaveBeenCalledWith(
        expect.stringContaining('.claude/hooks'),
        path.join(targetDir, '.claude/hooks'),
        { overwrite: true, errorOnExist: false },
      );
    });

    it('should create minimal hooks if source does not exist', async () => {
      const targetDir = '/test/project';
      fs.pathExists.mockResolvedValueOnce(false); // hooks source does not exist

      await installer.copyHookConfigurations(targetDir);

      expect(console.warn).toHaveBeenCalledWith(
        'Warning: Hook source directory not found. Creating minimal hooks.',
      );
    });
  });

  describe('createMinimalHooks', () => {
    it('should create all required minimal hook files', async () => {
      const hooksDir = '/test/project/.claude/hooks';
      const expectedHooks = [
        'pre_tool_use.py',
        'typescript-validator.py',
        'import-organizer.py',
        'notification.py',
        'post_tool_use.py',
        'stop.py',
        'subagent_stop.py',
        'task-completion-enforcer.py',
      ];

      await installer.createMinimalHooks(hooksDir);

      for (const hook of expectedHooks) {
        expect(fs.writeFile).toHaveBeenCalledWith(
          path.join(hooksDir, hook),
          expect.stringContaining('#!/usr/bin/env python3'),
        );
      }
    });

    it('should create pre_tool_use hook with dangerous command detection', async () => {
      const hooksDir = '/test/project/.claude/hooks';

      await installer.createMinimalHooks(hooksDir);

      const preToolUseCall = fs.writeFile.mock.calls.find((call) =>
        call[0].endsWith('pre_tool_use.py'),
      );
      expect(preToolUseCall).toBeDefined();
      expect(preToolUseCall[1]).toContain('DANGEROUS_PATTERNS');
      expect(preToolUseCall[1]).toContain('rm -rf');
    });

    it('should create typescript validator with type checking', async () => {
      const hooksDir = '/test/project/.claude/hooks';

      await installer.createMinimalHooks(hooksDir);

      const tsValidatorCall = fs.writeFile.mock.calls.find((call) =>
        call[0].endsWith('typescript-validator.py'),
      );
      expect(tsValidatorCall).toBeDefined();
      expect(tsValidatorCall[1]).toContain('any');
      expect(tsValidatorCall[1]).toContain('.ts');
    });

    it('should create notification hook with platform detection', async () => {
      const hooksDir = '/test/project/.claude/hooks';

      await installer.createMinimalHooks(hooksDir);

      const notificationCall = fs.writeFile.mock.calls.find((call) =>
        call[0].endsWith('notification.py'),
      );
      expect(notificationCall).toBeDefined();
      expect(notificationCall[1]).toContain('platform.system()');
      expect(notificationCall[1]).toContain('osascript');
    });
  });

  describe('copyCommandTemplates', () => {
    it('should create all agent command templates', async () => {
      const targetDir = '/test/project';
      const expectedCommands = ['agent-start.sh', 'agent-commit.sh', 'agent-status.sh'];

      await installer.copyCommandTemplates(targetDir);

      for (const command of expectedCommands) {
        expect(fs.writeFile).toHaveBeenCalledWith(
          path.join(targetDir, '.claude/commands', command),
          expect.stringContaining('#!/bin/bash'),
        );
      }
    });

    it('should create agent-start command with context loading', async () => {
      const targetDir = '/test/project';

      await installer.copyCommandTemplates(targetDir);

      const agentStartCall = fs.writeFile.mock.calls.find((call) =>
        call[0].endsWith('agent-start.sh'),
      );
      expect(agentStartCall).toBeDefined();
      expect(agentStartCall[1]).toContain('agent_context.json');
      expect(agentStartCall[1]).toContain('validation_checklist.txt');
    });

    it('should create agent-commit command with validation', async () => {
      const targetDir = '/test/project';

      await installer.copyCommandTemplates(targetDir);

      const agentCommitCall = fs.writeFile.mock.calls.find((call) =>
        call[0].endsWith('agent-commit.sh'),
      );
      expect(agentCommitCall).toBeDefined();
      expect(agentCommitCall[1]).toContain('validation_checklist.txt');
      expect(agentCommitCall[1]).toContain('git add -A');
    });
  });

  describe('copyWorkflowScripts', () => {
    it('should copy essential workflow scripts', async () => {
      const targetDir = '/test/project';
      const scriptsDir = path.join(targetDir, 'scripts');

      fs.pathExists.mockResolvedValue(true); // All scripts exist

      await installer.copyWorkflowScripts(targetDir);

      expect(fs.ensureDir).toHaveBeenCalledWith(scriptsDir);
      expect(fs.copy).toHaveBeenCalledTimes(5); // 5 essential scripts
    });

    it('should handle missing scripts gracefully', async () => {
      const targetDir = '/test/project';

      fs.pathExists.mockResolvedValue(false); // Scripts don't exist

      await installer.copyWorkflowScripts(targetDir);

      expect(fs.copy).not.toHaveBeenCalled();
    });
  });

  describe('copyAIDocs', () => {
    it('should copy AI documentation if it exists', async () => {
      const targetDir = '/test/project';
      fs.pathExists.mockResolvedValueOnce(true); // AI docs exist

      await installer.copyAIDocs(targetDir);

      expect(fs.copy).toHaveBeenCalledWith(
        expect.stringContaining('ai-docs'),
        path.join(targetDir, 'ai-docs'),
      );
    });

    it('should create directory even if source does not exist', async () => {
      const targetDir = '/test/project';
      fs.pathExists.mockResolvedValueOnce(false); // AI docs don't exist

      await installer.copyAIDocs(targetDir);

      expect(fs.ensureDir).toHaveBeenCalledWith(path.join(targetDir, 'ai-docs'));
      expect(fs.copy).not.toHaveBeenCalled();
    });
  });

  describe('createExampleConfig', () => {
    it('should create .env.example with default configuration', async () => {
      const targetDir = '/test/project';

      await installer.createExampleConfig(targetDir);

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(targetDir, '.env.example'),
        expect.stringContaining('LINEAR_API_KEY=lin_api_XXXXXXXX'),
      );
    });

    it('should include all required environment variables', async () => {
      const targetDir = '/test/project';

      await installer.createExampleConfig(targetDir);

      const envCall = fs.writeFile.mock.calls.find((call) => call[0].endsWith('.env.example'));
      expect(envCall).toBeDefined();

      const envContent = envCall[1];
      expect(envContent).toContain('LINEAR_API_KEY');
      expect(envContent).toContain('LLM_PROVIDER');
      expect(envContent).toContain('LLM_MODEL');
      expect(envContent).toContain('ENGINEER_NAME');
    });
  });

  describe('setPermissions', () => {
    it('should make scripts executable', async () => {
      const targetDir = '/test/project';

      fs.pathExists.mockResolvedValue(true);
      fs.readdir.mockResolvedValue(['script.sh', 'hook.py', 'readme.txt']);

      await installer.setPermissions(targetDir);

      expect(fs.chmod).toHaveBeenCalledWith(expect.stringContaining('script.sh'), '755');
      expect(fs.chmod).toHaveBeenCalledWith(expect.stringContaining('hook.py'), '755');
      expect(fs.chmod).not.toHaveBeenCalledWith(
        expect.stringContaining('readme.txt'),
        expect.anything(),
      );
    });

    it('should handle non-existent directories gracefully', async () => {
      const targetDir = '/test/project';

      fs.pathExists.mockResolvedValue(false);

      await installer.setPermissions(targetDir);

      expect(fs.readdir).not.toHaveBeenCalled();
      expect(fs.chmod).not.toHaveBeenCalled();
    });
  });
});
