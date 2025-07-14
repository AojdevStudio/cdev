/**
 * Tests for InteractiveInstaller
 */

const path = require('path');

const fs = require('fs-extra');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');

const { InteractiveInstaller } = require('./interactive-installer');

// Mock dependencies
jest.mock('fs-extra');
jest.mock('inquirer');
jest.mock('ora');
jest.mock('chalk', () => ({
  cyan: {
    bold: jest.fn((text) => text),
  },
  blue: jest.fn((text) => text),
  green: {
    bold: jest.fn((text) => text),
  },
  yellow: jest.fn((text) => text),
  red: jest.fn((text) => text),
}));

describe('InteractiveInstaller', () => {
  let interactiveInstaller;
  let mockSpinner;
  let consoleLogSpy;
  let consoleErrorSpy;
  let processExitSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();

    // Setup mock spinner
    mockSpinner = {
      start: jest.fn().mockReturnThis(),
      succeed: jest.fn().mockReturnThis(),
      fail: jest.fn().mockReturnThis(),
      text: '',
    };
    ora.mockReturnValue(mockSpinner);

    // Setup fs mocks
    fs.ensureDir.mockResolvedValue();
    fs.pathExists.mockResolvedValue(false);
    fs.writeJson.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
    fs.copy.mockResolvedValue();
    fs.readFile.mockResolvedValue('');
    fs.readdir.mockResolvedValue([]);
    fs.chmod.mockResolvedValue();

    interactiveInstaller = new InteractiveInstaller();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('constructor', () => {
    test('sets package root correctly', () => {
      expect(interactiveInstaller.packageRoot).toBe(path.join(__dirname, '..'));
    });
  });

  describe('install', () => {
    const mockConfig = {
      hooks: ['pre-bash-validator', 'typescript-validator'],
      installWorkflowScripts: true,
      installAIDocs: true,
      setupLinear: true,
      linearApiKey: 'lin_api_test123',
      engineerName: 'Test Developer',
      defaultEditor: 'cursor',
    };

    beforeEach(() => {
      inquirer.prompt.mockResolvedValue(mockConfig);
    });

    test('completes full installation with all options', async () => {
      await interactiveInstaller.install('/test/project');

      // Verify welcome message
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Welcome to cdev'));

      // Verify spinner started
      expect(mockSpinner.start).toHaveBeenCalledWith('Installing cdev files...');

      // Verify all installation steps
      expect(fs.ensureDir).toHaveBeenCalledWith(path.resolve('/test/project'));
      expect(inquirer.prompt).toHaveBeenCalled();

      // Verify directory structure created
      const expectedDirs = [
        '.claude',
        '.claude/hooks',
        '.claude/commands',
        '.claude/logs',
        '.claude/templates',
      ];
      for (const dir of expectedDirs) {
        expect(fs.ensureDir).toHaveBeenCalledWith(path.join('/test/project', dir));
      }

      // Verify hooks installed
      expect(fs.writeJson).toHaveBeenCalledWith(
        path.join('/test/project', '.claude', 'settings.json'),
        expect.any(Object),
        { spaces: 2 },
      );

      // Verify success
      expect(mockSpinner.succeed).toHaveBeenCalledWith('Installation complete!');
    });

    test('handles existing .claude directory with overwrite', async () => {
      fs.pathExists.mockResolvedValueOnce(true); // .claude exists
      inquirer.prompt.mockResolvedValueOnce({ overwrite: true }); // User chooses overwrite
      inquirer.prompt.mockResolvedValueOnce(mockConfig); // Configuration

      await interactiveInstaller.install('/test/project');

      expect(inquirer.prompt).toHaveBeenCalledWith([
        {
          type: 'confirm',
          name: 'overwrite',
          message: '.claude directory already exists. Overwrite?',
          default: false,
        },
      ]);
      expect(mockSpinner.succeed).toHaveBeenCalled();
    });

    test('cancels installation when user declines overwrite', async () => {
      fs.pathExists.mockResolvedValueOnce(true); // .claude exists
      inquirer.prompt.mockResolvedValueOnce({ overwrite: false }); // User declines

      await interactiveInstaller.install('/test/project');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Installation cancelled'));
      expect(inquirer.prompt).toHaveBeenCalledTimes(1); // Only overwrite prompt
    });

    test('forces installation without prompting', async () => {
      fs.pathExists.mockResolvedValueOnce(true); // .claude exists

      await interactiveInstaller.install('/test/project', { force: true });

      // Should skip overwrite prompt and go straight to configuration
      expect(inquirer.prompt).toHaveBeenCalledTimes(1);
      expect(mockSpinner.succeed).toHaveBeenCalled();
    });

    test('handles installation errors', async () => {
      const error = new Error('Permission denied');
      fs.ensureDir.mockRejectedValueOnce(error);

      await interactiveInstaller.install('/test/project');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Installation failed:'),
        'Permission denied',
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('uses current directory when no target specified', async () => {
      await interactiveInstaller.install();

      expect(fs.ensureDir).toHaveBeenCalledWith(path.resolve('.'));
    });
  });

  describe('getConfiguration', () => {
    test('prompts for all configuration options', async () => {
      const expectedConfig = {
        hooks: ['pre-bash-validator', 'typescript-validator'],
        installWorkflowScripts: true,
        installAIDocs: true,
        setupLinear: true,
        linearApiKey: 'lin_api_test123',
        engineerName: 'Test Developer',
        defaultEditor: 'cursor',
      };

      inquirer.prompt.mockResolvedValue(expectedConfig);

      const config = await interactiveInstaller.getConfiguration();

      expect(config).toEqual(expectedConfig);
      expect(inquirer.prompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'hooks', type: 'checkbox' }),
          expect.objectContaining({ name: 'installWorkflowScripts', type: 'confirm' }),
          expect.objectContaining({ name: 'installAIDocs', type: 'confirm' }),
          expect.objectContaining({ name: 'setupLinear', type: 'confirm' }),
          expect.objectContaining({ name: 'linearApiKey', type: 'input' }),
          expect.objectContaining({ name: 'engineerName', type: 'input' }),
          expect.objectContaining({ name: 'defaultEditor', type: 'list' }),
        ]),
      );
    });

    test('validates Linear API key format', async () => {
      const prompts = await inquirer.prompt.mock.calls[0][0];
      const linearKeyPrompt = prompts.find((p) => p.name === 'linearApiKey');

      expect(linearKeyPrompt.validate('lin_api_valid')).toBe(true);
      expect(linearKeyPrompt.validate('invalid_key')).toContain('should start with "lin_api_"');
      expect(linearKeyPrompt.validate('')).toBe(true); // Empty is allowed
    });

    test('conditionally shows Linear API key prompt', async () => {
      const prompts = await inquirer.prompt.mock.calls[0][0];
      const linearKeyPrompt = prompts.find((p) => p.name === 'linearApiKey');

      expect(linearKeyPrompt.when({ setupLinear: true })).toBe(true);
      expect(linearKeyPrompt.when({ setupLinear: false })).toBe(undefined);
    });
  });

  describe('createDirectoryStructure', () => {
    test('creates all required directories', async () => {
      await interactiveInstaller.createDirectoryStructure('/test/project');

      const expectedDirs = [
        '.claude',
        '.claude/hooks',
        '.claude/commands',
        '.claude/logs',
        '.claude/templates',
      ];

      for (const dir of expectedDirs) {
        expect(fs.ensureDir).toHaveBeenCalledWith(path.join('/test/project', dir));
      }
    });
  });

  describe('installHooks', () => {
    const mockConfig = {
      hooks: ['pre-bash-validator', 'typescript-validator', 'notification'],
    };

    test('creates settings.json with selected hooks', async () => {
      await interactiveInstaller.installHooks('/test/project', mockConfig);

      const settingsCall = fs.writeJson.mock.calls.find((call) =>
        call[0].includes('settings.json'),
      );

      expect(settingsCall).toBeDefined();
      const settings = settingsCall[1];

      expect(settings).toMatchObject({
        version: '1.0',
        description: 'cdev hooks configuration',
        hooks: {
          PreToolUse: expect.arrayContaining([
            expect.objectContaining({
              matcher: 'Bash',
              hooks: expect.arrayContaining([
                expect.objectContaining({
                  command: expect.stringContaining('pre-bash-validator.py'),
                }),
              ]),
            }),
            expect.objectContaining({
              matcher: 'Write|Edit|MultiEdit',
              hooks: expect.arrayContaining([
                expect.objectContaining({
                  command: expect.stringContaining('typescript-validator.py'),
                }),
              ]),
            }),
          ]),
          Notification: expect.any(Array),
        },
      });
    });

    test('creates hook scripts when source directory does not exist', async () => {
      fs.pathExists.mockResolvedValue(false); // No source hooks directory

      await interactiveInstaller.installHooks('/test/project', mockConfig);

      // Should create hook scripts
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('pre-bash-validator.py'),
        expect.any(String),
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('typescript-validator.py'),
        expect.any(String),
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('notification.py'),
        expect.any(String),
      );
    });

    test('copies existing hook scripts when available', async () => {
      fs.pathExists.mockImplementation((path) => {
        if (path.includes('.claude/hooks') && !path.endsWith('.py')) {
          return Promise.resolve(true); // Source directory exists
        }
        if (path.endsWith('.py')) {
          return Promise.resolve(true); // Script files exist
        }
        return Promise.resolve(false);
      });

      await interactiveInstaller.installHooks('/test/project', mockConfig);

      // Should copy existing scripts
      expect(fs.copy).toHaveBeenCalledWith(
        expect.stringContaining('pre-bash-validator.py'),
        expect.stringContaining('pre-bash-validator.py'),
      );
    });

    test('groups hooks by event type correctly', async () => {
      const config = {
        hooks: [
          'pre-bash-validator',
          'commit-message-validator',
          'pnpm-enforcer',
          'typescript-validator',
        ],
      };

      await interactiveInstaller.installHooks('/test/project', config);

      const settingsCall = fs.writeJson.mock.calls[0];
      const settings = settingsCall[1];

      // All Bash matchers should be grouped together
      const bashHooks = settings.hooks.PreToolUse.find((g) => g.matcher === 'Bash');
      expect(bashHooks.hooks).toHaveLength(3); // pre-bash, commit-message, pnpm
    });
  });

  describe('createHookScript', () => {
    test('creates pre-bash-validator script with dangerous patterns', async () => {
      await interactiveInstaller.createHookScript('/test/hook.py', 'pre-bash-validator');

      const writeCall = fs.writeFile.mock.calls[0];
      expect(writeCall[0]).toBe('/test/hook.py');

      const script = writeCall[1];
      expect(script).toContain('rm\\\\s+-rf');
      expect(script).toContain('sudo|su');
      expect(script).toContain('Fork bomb pattern');
      expect(script).toContain('chmod|chown');
    });

    test('creates typescript-validator script', async () => {
      await interactiveInstaller.createHookScript('/test/hook.py', 'typescript-validator');

      const script = fs.writeFile.mock.calls[0][1];
      expect(script).toContain("Avoid using 'any' type");
      expect(script).toContain("('.ts', '.tsx')");
    });

    test('creates notification script with platform detection', async () => {
      await interactiveInstaller.createHookScript('/test/hook.py', 'notification');

      const script = fs.writeFile.mock.calls[0][1];
      expect(script).toContain('platform.system()');
      expect(script).toContain('osascript');
      expect(script).toContain('notify-send');
    });

    test('creates default script for unknown hook type', async () => {
      await interactiveInstaller.createHookScript('/test/hook.py', 'unknown-hook');

      const script = fs.writeFile.mock.calls[0][1];
      expect(script).toContain('unknown-hook hook');
      expect(script).toContain('Hook implementation goes here');
    });
  });

  describe('copyCommandTemplates', () => {
    test('copies commands when source directory exists', async () => {
      fs.pathExists.mockResolvedValueOnce(true); // Commands source exists

      await interactiveInstaller.copyCommandTemplates('/test/project');

      expect(fs.copy).toHaveBeenCalledWith(
        path.join(interactiveInstaller.packageRoot, '.claude', 'commands'),
        path.join('/test/project', '.claude', 'commands'),
      );
    });

    test('creates basic commands when source does not exist', async () => {
      fs.pathExists.mockResolvedValueOnce(false); // No source commands

      await interactiveInstaller.copyCommandTemplates('/test/project');

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('agent-start.sh'),
        expect.stringContaining('agent_context.json'),
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('agent-commit.sh'),
        expect.stringContaining('git commit'),
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('agent-status.sh'),
        expect.stringContaining('git status'),
      );
    });
  });

  describe('copyWorkflowScripts', () => {
    test('copies essential workflow scripts', async () => {
      fs.pathExists.mockResolvedValue(true); // Scripts exist

      await interactiveInstaller.copyWorkflowScripts('/test/project');

      const expectedScripts = [
        'cache-linear-issue.sh',
        'decompose-parallel.cjs',
        'spawn-agents.sh',
        'monitor-agents.sh',
        'agent-commit-enhanced.sh',
        'intelligent-agent-generator.js',
      ];

      for (const script of expectedScripts) {
        expect(fs.copy).toHaveBeenCalledWith(
          path.join(interactiveInstaller.packageRoot, 'scripts', script),
          path.join('/test/project', 'scripts', script),
        );
      }

      // Also copies utils
      expect(fs.copy).toHaveBeenCalledWith(
        path.join(interactiveInstaller.packageRoot, 'utils'),
        path.join('/test/project', 'utils'),
      );
    });

    test('handles missing script files gracefully', async () => {
      fs.pathExists.mockImplementation((path) =>
        // Only some scripts exist
        Promise.resolve(path.includes('cache-linear-issue.sh')),
      );

      await interactiveInstaller.copyWorkflowScripts('/test/project');

      // Should only copy existing scripts
      expect(fs.copy).toHaveBeenCalledWith(
        expect.stringContaining('cache-linear-issue.sh'),
        expect.any(String),
      );
      // Should not copy non-existent scripts
      expect(fs.copy).not.toHaveBeenCalledWith(
        expect.stringContaining('spawn-agents.sh'),
        expect.any(String),
      );
    });
  });

  describe('copyAIDocs', () => {
    test('copies AI documentation when it exists', async () => {
      fs.pathExists.mockResolvedValue(true);

      await interactiveInstaller.copyAIDocs('/test/project');

      expect(fs.copy).toHaveBeenCalledWith(
        path.join(interactiveInstaller.packageRoot, 'ai-docs'),
        path.join('/test/project', 'ai-docs'),
      );
    });

    test('creates directory even when source does not exist', async () => {
      fs.pathExists.mockResolvedValue(false);

      await interactiveInstaller.copyAIDocs('/test/project');

      expect(fs.ensureDir).toHaveBeenCalledWith(path.join('/test/project', 'ai-docs'));
      expect(fs.copy).not.toHaveBeenCalled();
    });
  });

  describe('createEnvironmentConfig', () => {
    const mockConfig = {
      linearApiKey: 'lin_api_test123',
      engineerName: 'Test Developer',
      defaultEditor: 'vscode',
    };

    test('copies .env.example when it exists', async () => {
      fs.pathExists.mockResolvedValue(true);

      await interactiveInstaller.createEnvironmentConfig('/test/project', mockConfig);

      expect(fs.copy).toHaveBeenCalledWith(
        path.join(interactiveInstaller.packageRoot, '.env.example'),
        path.join('/test/project', '.env.example'),
      );
    });

    test('creates .env file with user configuration', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readFile.mockResolvedValue(`
LINEAR_API_KEY=<your-linear-api-key>
ENGINEER_NAME=YourName
DEFAULT_EDITOR=cursor
      `);

      await interactiveInstaller.createEnvironmentConfig('/test/project', mockConfig);

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join('/test/project', '.env'),
        expect.stringContaining('lin_api_test123'),
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join('/test/project', '.env'),
        expect.stringContaining('Test Developer'),
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join('/test/project', '.env'),
        expect.stringContaining('vscode'),
      );
    });

    test('skips .env creation when no Linear API key provided', async () => {
      const configWithoutKey = { ...mockConfig, linearApiKey: undefined };

      await interactiveInstaller.createEnvironmentConfig('/test/project', configWithoutKey);

      expect(fs.writeFile).not.toHaveBeenCalledWith(
        path.join('/test/project', '.env'),
        expect.any(String),
      );
    });
  });

  describe('createClaudeMD', () => {
    test('creates CLAUDE.md with configuration details', async () => {
      const config = {
        hooks: ['pre-bash-validator', 'typescript-validator'],
        installWorkflowScripts: true,
        setupLinear: true,
        linearApiKey: 'lin_api_test',
        engineerName: 'Developer',
        defaultEditor: 'cursor',
      };

      await interactiveInstaller.createClaudeMD('/test/project', config);

      const writeCall = fs.writeFile.mock.calls[0];
      expect(writeCall[0]).toBe(path.join('/test/project', 'CLAUDE.md'));

      const content = writeCall[1];
      expect(content).toContain('pre bash validator');
      expect(content).toContain('typescript validator');
      expect(content).toContain('Engineer: Developer');
      expect(content).toContain('Default Editor: cursor');
      expect(content).toContain('Linear Integration: Enabled');
      expect(content).toContain('/agent-start');
    });

    test('shows message to add Linear key when not provided', async () => {
      const config = {
        hooks: [],
        installWorkflowScripts: false,
        setupLinear: true,
        linearApiKey: undefined,
        engineerName: 'Developer',
        defaultEditor: 'cursor',
      };

      await interactiveInstaller.createClaudeMD('/test/project', config);

      const content = fs.writeFile.mock.calls[0][1];
      expect(content).toContain('Add your Linear API key to .env');
    });
  });

  describe('setPermissions', () => {
    test('sets executable permissions on scripts', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readdir.mockImplementation((dir) => {
        if (dir.includes('scripts')) {
          return Promise.resolve(['script.sh', 'tool.cjs']);
        }
        if (dir.includes('hooks')) {
          return Promise.resolve(['hook.py']);
        }
        if (dir.includes('commands')) {
          return Promise.resolve(['cmd.sh']);
        }
        return Promise.resolve([]);
      });

      await interactiveInstaller.setPermissions('/test/project');

      expect(fs.chmod).toHaveBeenCalledWith(
        path.join('/test/project', 'scripts', 'script.sh'),
        '755',
      );
      expect(fs.chmod).toHaveBeenCalledWith(
        path.join('/test/project', 'scripts', 'tool.cjs'),
        '755',
      );
      expect(fs.chmod).toHaveBeenCalledWith(
        path.join('/test/project', '.claude', 'hooks', 'hook.py'),
        '755',
      );
      expect(fs.chmod).toHaveBeenCalledWith(
        path.join('/test/project', '.claude', 'commands', 'cmd.sh'),
        '755',
      );
    });

    test('handles missing directories gracefully', async () => {
      fs.pathExists.mockResolvedValue(false);

      await interactiveInstaller.setPermissions('/test/project');

      expect(fs.readdir).not.toHaveBeenCalled();
      expect(fs.chmod).not.toHaveBeenCalled();
    });
  });

  describe('displaySuccessMessage', () => {
    test('displays comprehensive success message', () => {
      const config = {
        hooks: ['hook1', 'hook2', 'hook3'],
        installWorkflowScripts: true,
        installAIDocs: true,
        setupLinear: true,
        linearApiKey: undefined,
      };

      interactiveInstaller.displaySuccessMessage('/test/project', config);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('installation complete!'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('3 hooks installed'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('scripts/'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ai-docs/'));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('add your Linear API key'),
      );
    });

    test('adjusts next steps based on configuration', () => {
      const config = {
        hooks: [],
        installWorkflowScripts: false,
        installAIDocs: false,
        setupLinear: false,
      };

      interactiveInstaller.displaySuccessMessage('/test/project', config);

      // Should not mention Linear API key step
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Linear API key'));
      // Should not show workflow scripts
      expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('scripts/'));
    });
  });

  describe('error handling in createHookScript', () => {
    test('handles JavaScript syntax in hook script template', async () => {
      // Note: The file has a JavaScript comment syntax error on line 410
      // This test verifies the method still works despite the syntax issue
      await interactiveInstaller.createHookScript('/test/hook.py', 'unknown-type');

      const script = fs.writeFile.mock.calls[0][1];
      expect(script).toContain('#!/usr/bin/env python3');
      expect(script).toContain('unknown-type hook');
    });
  });
});
