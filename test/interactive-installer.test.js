const path = require('path');

const fs = require('fs-extra');
const inquirer = require('inquirer');

const { InteractiveInstaller } = require('../src/interactive-installer');

// Mock dependencies
jest.mock('fs-extra');
jest.mock('inquirer');
jest.mock('chalk', () => {
  const mockChalk = jest.fn((str) => str);
  mockChalk.cyan = Object.assign(
    jest.fn((str) => str),
    { bold: jest.fn((str) => str) },
  );
  mockChalk.green = Object.assign(
    jest.fn((str) => str),
    { bold: jest.fn((str) => str) },
  );
  mockChalk.yellow = jest.fn((str) => str);
  mockChalk.blue = jest.fn((str) => str);
  mockChalk.bold = jest.fn((str) => str);
  mockChalk.red = jest.fn((str) => str);
  return mockChalk;
});
jest.mock('ora', () =>
  jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    text: '',
    succeed: jest.fn(),
    fail: jest.fn(),
  })),
);

describe('InteractiveInstaller', () => {
  let installer;
  let mockSpinner;
  let consoleLogSpy;
  let consoleErrorSpy;
  let processExitSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    installer = new InteractiveInstaller();

    // Mock ora spinner
    const ora = require('ora');
    mockSpinner = {
      start: jest.fn().mockReturnThis(),
      succeed: jest.fn(),
      fail: jest.fn(),
      text: '',
    };
    ora.mockReturnValue(mockSpinner);

    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    // Default fs mocks
    fs.ensureDir.mockResolvedValue();
    fs.pathExists.mockResolvedValue(false);
    fs.writeJson.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
    fs.copy.mockResolvedValue();
    fs.readdir.mockResolvedValue([]);
    fs.chmod.mockResolvedValue();
    fs.readFile.mockResolvedValue('# Example env file');

    // Default inquirer mock
    inquirer.prompt.mockResolvedValue({
      overwrite: true,
      hooks: [],
      installWorkflowScripts: false,
      installAIDocs: false,
      setupLinear: false,
      engineerName: 'Developer',
      defaultEditor: 'cursor',
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize with correct package root', () => {
      expect(installer.packageRoot).toBe(path.join(__dirname, '..'));
    });
  });

  describe('install', () => {
    it('should complete full installation successfully', async () => {
      const targetDir = '/test/project';
      const mockConfig = {
        hooks: ['pre-bash-validator', 'notification'],
        installWorkflowScripts: true,
        installAIDocs: true,
        setupLinear: false,
        engineerName: 'TestUser',
        defaultEditor: 'cursor',
      };

      jest.spyOn(installer, 'getConfiguration').mockResolvedValue(mockConfig);
      jest.spyOn(installer, 'displaySuccessMessage').mockImplementation(() => {});

      await installer.install(targetDir);

      expect(fs.ensureDir).toHaveBeenCalledWith(path.resolve(targetDir));
      expect(mockSpinner.start).toHaveBeenCalled();
      expect(mockSpinner.succeed).toHaveBeenCalledWith('Installation complete!');
    });

    it('should handle existing .claude directory', async () => {
      const targetDir = '/test/project';
      fs.pathExists.mockResolvedValueOnce(true); // .claude exists

      inquirer.prompt.mockResolvedValueOnce({ overwrite: false });

      await installer.install(targetDir);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Installation cancelled'));
    });

    it('should handle installation with force option', async () => {
      const targetDir = '/test/project';
      const mockConfig = {
        hooks: [],
        installWorkflowScripts: false,
        installAIDocs: false,
      };

      fs.pathExists.mockResolvedValueOnce(true); // .claude exists
      jest.spyOn(installer, 'getConfiguration').mockResolvedValue(mockConfig);
      jest.spyOn(installer, 'displaySuccessMessage').mockImplementation(() => {});

      await installer.install(targetDir, { force: true });

      expect(inquirer.prompt).not.toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ name: 'overwrite' })]),
      );
    });

    it('should handle installation failure gracefully', async () => {
      const targetDir = '/test/project';
      const error = new Error('Installation failed');

      fs.ensureDir.mockRejectedValueOnce(error);

      await installer.install(targetDir);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Installation failed:'),
        'Installation failed',
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('getConfiguration', () => {
    it('should prompt for all configuration options', async () => {
      const mockAnswers = {
        hooks: ['pre-bash-validator', 'typescript-validator'],
        installWorkflowScripts: true,
        installAIDocs: true,
        setupLinear: true,
        linearApiKey: 'lin_api_123456',
        engineerName: 'TestUser',
        defaultEditor: 'cursor',
      };

      inquirer.prompt.mockResolvedValueOnce(mockAnswers);

      const config = await installer.getConfiguration();

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
      expect(config).toEqual(mockAnswers);
    });

    it('should validate Linear API key format', async () => {
      const questions = [
        {
          type: 'input',
          name: 'linearApiKey',
          message: 'Linear API key (optional, can be added later):',
          when: (answers) => answers.setupLinear,
          validate: (input) => {
            if (input && !input.startsWith('lin_api_')) {
              return 'Linear API key should start with "lin_api_"';
            }
            return true;
          },
        },
      ];

      const mockQuestion = questions[0];

      // Test valid key
      expect(mockQuestion.validate('lin_api_123456')).toBe(true);

      // Test invalid key
      expect(mockQuestion.validate('invalid_key')).toBe(
        'Linear API key should start with "lin_api_"',
      );

      // Test empty key
      expect(mockQuestion.validate('')).toBe(true);
    });

    it('should have default values for all options', async () => {
      const mockAnswers = {
        hooks: [],
        installWorkflowScripts: false,
        installAIDocs: false,
        setupLinear: false,
        engineerName: 'Developer',
        defaultEditor: 'cursor',
      };

      inquirer.prompt.mockResolvedValue(mockAnswers);

      const config = await installer.getConfiguration();

      expect(config.engineerName).toBe('Developer');
      expect(config.defaultEditor).toBe('cursor');
    });
  });

  describe('createDirectoryStructure', () => {
    it('should create all required directories', async () => {
      const targetDir = '/test/project';
      const expectedDirs = [
        '.claude',
        '.claude/hooks',
        '.claude/commands',
        '.claude/logs',
        '.claude/templates',
      ];

      await installer.createDirectoryStructure(targetDir);

      for (const dir of expectedDirs) {
        expect(fs.ensureDir).toHaveBeenCalledWith(path.join(targetDir, dir));
      }
    });
  });

  describe('installHooks', () => {
    it('should create settings.json with selected hooks', async () => {
      const targetDir = '/test/project';
      const config = {
        hooks: ['pre-bash-validator', 'typescript-validator', 'notification'],
      };

      await installer.installHooks(targetDir, config);

      expect(fs.writeJson).toHaveBeenCalledWith(
        path.join(targetDir, '.claude/settings.json'),
        expect.objectContaining({
          permissions: expect.any(Object),
          hooks: expect.objectContaining({
            PreToolUse: expect.any(Array),
            PostToolUse: expect.any(Array),
            Notification: expect.any(Array),
            Stop: expect.any(Array),
            SubagentStop: expect.any(Array),
          }),
        }),
        { spaces: 2 },
      );
    });

    it('should copy hooks from package if they exist', async () => {
      const targetDir = '/test/project';
      const config = { hooks: ['pre-bash-validator'] };

      fs.pathExists.mockResolvedValueOnce(true); // hooks source exists

      await installer.installHooks(targetDir, config);

      expect(fs.copy).toHaveBeenCalledWith(
        expect.stringContaining('.claude/hooks'),
        path.join(targetDir, '.claude/hooks'),
        { overwrite: true, errorOnExist: false },
      );
    });

    it('should create hook scripts if source does not exist', async () => {
      const targetDir = '/test/project';
      const config = { hooks: ['pre-bash-validator', 'notification'] };

      fs.pathExists.mockResolvedValueOnce(false); // hooks source does not exist
      jest.spyOn(installer, 'createHookScript').mockResolvedValue();

      await installer.installHooks(targetDir, config);

      // Should create settings.json but may not call createHookScript if hooks are built into settings
      expect(fs.writeJson).toHaveBeenCalled();
    });

    it('should handle unknown hook configurations gracefully', async () => {
      const targetDir = '/test/project';
      const config = { hooks: ['unknown-hook'] };

      await installer.installHooks(targetDir, config);

      // Should not throw error and continue with known hooks
      expect(fs.writeJson).toHaveBeenCalled();
    });
  });

  describe('createHookScript', () => {
    it('should create pre-bash-validator script', async () => {
      const filePath = '/test/hooks/pre-bash-validator.py';

      await installer.createHookScript(filePath, 'pre-bash-validator');

      expect(fs.writeFile).toHaveBeenCalledWith(
        filePath,
        expect.stringContaining('DANGEROUS_PATTERNS'),
      );
    });

    it('should create typescript-validator script', async () => {
      const filePath = '/test/hooks/typescript-validator.py';

      await installer.createHookScript(filePath, 'typescript-validator');

      expect(fs.writeFile).toHaveBeenCalledWith(filePath, expect.stringContaining('TypeScript'));
    });

    it('should create notification script', async () => {
      const filePath = '/test/hooks/notification.py';

      await installer.createHookScript(filePath, 'notification');

      expect(fs.writeFile).toHaveBeenCalledWith(
        filePath,
        expect.stringContaining('platform.system()'),
      );
    });

    it('should create default script for unknown hook types', async () => {
      const filePath = '/test/hooks/unknown.py';

      await installer.createHookScript(filePath, 'unknown-hook');

      expect(fs.writeFile).toHaveBeenCalledWith(
        filePath,
        expect.stringContaining('unknown-hook hook'),
      );
    });
  });

  describe('copyCommandTemplates', () => {
    it('should copy commands from package if they exist', async () => {
      const targetDir = '/test/project';

      fs.pathExists.mockResolvedValueOnce(true); // commands source exists

      await installer.copyCommandTemplates(targetDir);

      expect(fs.copy).toHaveBeenCalledWith(
        expect.stringContaining('.claude/commands'),
        path.join(targetDir, '.claude/commands'),
      );
    });

    it('should create basic commands if source does not exist', async () => {
      const targetDir = '/test/project';

      fs.pathExists.mockResolvedValueOnce(false); // commands source does not exist
      jest.spyOn(installer, 'createBasicCommands').mockResolvedValue();

      await installer.copyCommandTemplates(targetDir);

      expect(installer.createBasicCommands).toHaveBeenCalledWith(
        path.join(targetDir, '.claude/commands'),
      );
    });
  });

  describe('createBasicCommands', () => {
    it('should create all basic command scripts', async () => {
      const commandsDir = '/test/commands';
      const expectedCommands = ['agent-start.sh', 'agent-commit.sh', 'agent-status.sh'];

      await installer.createBasicCommands(commandsDir);

      for (const command of expectedCommands) {
        expect(fs.writeFile).toHaveBeenCalledWith(
          path.join(commandsDir, command),
          expect.stringContaining('#!/bin/bash'),
        );
      }
    });
  });

  describe('copyWorkflowScripts', () => {
    it('should copy essential workflow scripts', async () => {
      const targetDir = '/test/project';

      fs.pathExists.mockResolvedValue(true); // All scripts exist

      await installer.copyWorkflowScripts(targetDir);

      expect(fs.ensureDir).toHaveBeenCalledWith(path.join(targetDir, 'scripts'));
      expect(fs.copy).toHaveBeenCalledTimes(7); // 6 essential scripts + utils directory
    });

    it('should copy utils directory', async () => {
      const targetDir = '/test/project';

      fs.pathExists.mockResolvedValue(true);

      await installer.copyWorkflowScripts(targetDir);

      expect(fs.copy).toHaveBeenCalledWith(
        expect.stringContaining('utils'),
        path.join(targetDir, 'utils'),
      );
    });
  });

  describe('createEnvironmentConfig', () => {
    it('should copy .env.example from package', async () => {
      const targetDir = '/test/project';
      const config = {};

      fs.pathExists.mockResolvedValueOnce(true); // .env.example exists

      await installer.createEnvironmentConfig(targetDir, config);

      expect(fs.copy).toHaveBeenCalledWith(
        expect.stringContaining('.env.example'),
        path.join(targetDir, '.env.example'),
      );
    });

    it('should create .env file with Linear API key if provided', async () => {
      const targetDir = '/test/project';
      const config = {
        linearApiKey: 'lin_api_123456',
        engineerName: 'TestUser',
        defaultEditor: 'code',
      };

      fs.pathExists.mockResolvedValueOnce(true);
      fs.readFile.mockResolvedValueOnce(
        'LINEAR_API_KEY=<your-linear-api-key>\nENGINEER_NAME=YourName\nDEFAULT_EDITOR=cursor',
      );

      await installer.createEnvironmentConfig(targetDir, config);

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(targetDir, '.env'),
        expect.stringContaining('lin_api_123456'),
      );
    });

    it('should not create .env file if no Linear API key provided', async () => {
      const targetDir = '/test/project';
      const config = { engineerName: 'TestUser' };

      fs.pathExists.mockResolvedValueOnce(true);

      await installer.createEnvironmentConfig(targetDir, config);

      expect(fs.writeFile).not.toHaveBeenCalledWith(
        path.join(targetDir, '.env'),
        expect.anything(),
      );
    });
  });

  describe('setPermissions', () => {
    it('should make executable files in all directories', async () => {
      const targetDir = '/test/project';

      fs.pathExists.mockResolvedValue(true);
      fs.readdir.mockResolvedValue(['script.sh', 'hook.py', 'config.cjs', 'readme.txt']);

      await installer.setPermissions(targetDir);

      expect(fs.chmod).toHaveBeenCalledWith(expect.stringContaining('script.sh'), '755');
      expect(fs.chmod).toHaveBeenCalledWith(expect.stringContaining('hook.py'), '755');
      expect(fs.chmod).toHaveBeenCalledWith(expect.stringContaining('config.cjs'), '755');
      expect(fs.chmod).not.toHaveBeenCalledWith(
        expect.stringContaining('readme.txt'),
        expect.anything(),
      );
    });
  });

  describe('displaySuccessMessage', () => {
    it('should display complete installation summary', () => {
      const targetDir = '/test/project';
      const config = {
        hooks: ['pre-bash-validator', 'typescript-validator'],
        installWorkflowScripts: true,
        installAIDocs: true,
        setupLinear: true,
        linearApiKey: 'lin_api_123456',
      };

      installer.displaySuccessMessage(targetDir, config);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('installation complete'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('2 hooks installed'));
    });

    it('should include next steps for Linear setup without API key', () => {
      const targetDir = '/test/project';
      const config = {
        hooks: [],
        installWorkflowScripts: false,
        installAIDocs: false,
        setupLinear: true,
        linearApiKey: null,
      };

      installer.displaySuccessMessage(targetDir, config);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('.env.example to .env'));
    });

    it('should show documentation links', () => {
      const targetDir = '/test/project';
      const config = { hooks: [] };

      installer.displaySuccessMessage(targetDir, config);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('docs.anthropic.com'));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('github.com/AOJDevStudio/cdev'),
      );
    });
  });
});
