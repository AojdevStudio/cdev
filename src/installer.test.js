const path = require('path');

const { describe, it, expect, beforeEach, afterEach, jest } = require('@jest/globals');
const fs = require('fs-extra');

const { Installer } = require('./installer');
const { InstallSteps } = require('./install-steps');
const { InstallUtils } = require('./install-utils');

// Mock dependencies
jest.mock('fs-extra');
jest.mock('inquirer');
jest.mock('chalk', () => ({
  cyan: jest.fn((text) => text),
  blue: jest.fn((text) => text),
  green: jest.fn((text) => text),
  yellow: jest.fn((text) => text),
  red: jest.fn((text) => text),
  gray: jest.fn((text) => text),
  magenta: jest.fn((text) => text),
}));

describe('Installer', () => {
  let installer;
  let mockConsoleLog;
  let mockConsoleError;

  beforeEach(() => {
    installer = new Installer();

    // Mock console methods
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock process.exit
    jest.spyOn(process, 'exit').mockImplementation(() => {});

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const newInstaller = new Installer();
      expect(newInstaller.options).toEqual({});
      expect(newInstaller.steps).toBeInstanceOf(InstallSteps);
      expect(newInstaller.utils).toBeInstanceOf(InstallUtils);
    });

    it('should initialize with provided options', () => {
      const options = { force: true, verbose: true };
      const newInstaller = new Installer(options);
      expect(newInstaller.options).toEqual(options);
    });
  });

  describe('install', () => {
    beforeEach(() => {
      // Mock all step methods
      installer.steps.validateTargetDirectory = jest.fn().mockResolvedValue(true);
      installer.steps.validateEnvironment = jest.fn().mockResolvedValue([]);
      installer.steps.createDirectoryStructure = jest.fn().mockResolvedValue(true);
      installer.steps.copyWorkflowTemplates = jest.fn().mockResolvedValue(true);
      installer.steps.setupScriptsAndPermissions = jest.fn().mockResolvedValue(true);
      installer.steps.createConfigurationFiles = jest.fn().mockResolvedValue(true);
      installer.steps.setupEnvironmentVariables = jest.fn().mockResolvedValue(true);
      installer.steps.setupGitHooks = jest.fn().mockResolvedValue(true);
      installer.steps.createExampleFiles = jest.fn().mockResolvedValue(true);
      installer.steps.finalValidation = jest.fn().mockResolvedValue(true);

      // Mock utility methods
      installer.utils.resolveWorkTreePath = jest.fn().mockReturnValue('/test/worktrees');

      // Mock inquirer
      const inquirer = require('inquirer');
      inquirer.prompt = jest.fn().mockResolvedValue({
        projectName: 'test-project',
        setupLinear: true,
        linearApiKey: 'lin_api_test123',
        setupGitHooks: true,
        workTreeLocation: 'alongside',
      });
    });

    it('should complete installation successfully', async () => {
      await installer.install('/test/dir');

      expect(installer.steps.validateTargetDirectory).toHaveBeenCalledWith('/test/dir', {});
      expect(installer.steps.validateEnvironment).toHaveBeenCalled();
      expect(installer.steps.createDirectoryStructure).toHaveBeenCalledWith('/test/dir');
      expect(installer.steps.copyWorkflowTemplates).toHaveBeenCalledWith('/test/dir');
      expect(installer.steps.setupScriptsAndPermissions).toHaveBeenCalledWith('/test/dir');
      expect(installer.steps.createConfigurationFiles).toHaveBeenCalled();
      expect(installer.steps.setupEnvironmentVariables).toHaveBeenCalled();
      expect(installer.steps.setupGitHooks).toHaveBeenCalledWith('/test/dir');
      expect(installer.steps.createExampleFiles).toHaveBeenCalled();
      expect(installer.steps.finalValidation).toHaveBeenCalled();
    });

    it('should use current directory when no targetDir provided', async () => {
      const currentDir = process.cwd();

      await installer.install();

      expect(installer.steps.validateTargetDirectory).toHaveBeenCalledWith(currentDir, {});
    });

    it('should handle installation errors gracefully', async () => {
      const error = new Error('Installation failed');
      installer.steps.validateTargetDirectory.mockRejectedValue(error);

      await installer.install('/test/dir');

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Installation failed:'),
        error.message,
      );
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should skip git hooks setup when user declines', async () => {
      const inquirer = require('inquirer');
      inquirer.prompt.mockResolvedValue({
        projectName: 'test-project',
        setupLinear: false,
        setupGitHooks: false,
        workTreeLocation: 'alongside',
      });

      await installer.install('/test/dir');

      expect(installer.steps.setupGitHooks).not.toHaveBeenCalled();
    });
  });

  describe('preInstallValidation', () => {
    beforeEach(() => {
      installer.steps.validateTargetDirectory = jest.fn().mockResolvedValue(true);
      installer.steps.validateEnvironment = jest.fn().mockResolvedValue([]);
    });

    it('should run all validation steps', async () => {
      await installer.preInstallValidation('/test/dir', {});

      expect(installer.steps.validateTargetDirectory).toHaveBeenCalledWith('/test/dir', {});
      expect(installer.steps.validateEnvironment).toHaveBeenCalled();
    });

    it('should log validation phases', async () => {
      await installer.preInstallValidation('/test/dir', {});

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Phase 1: Pre-installation validation'),
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Pre-installation validation complete'),
      );
    });
  });

  describe('interactiveConfiguration', () => {
    it('should prompt for configuration and process results', async () => {
      const inquirer = require('inquirer');
      inquirer.prompt.mockResolvedValue({
        projectName: 'my-project',
        setupLinear: true,
        linearApiKey: 'lin_api_test123',
        setupGitHooks: true,
        workTreeLocation: 'alongside',
      });

      installer.utils.resolveWorkTreePath = jest.fn().mockReturnValue('/test/worktrees');

      const config = await installer.interactiveConfiguration('/test/project');

      expect(config.projectName).toBe('my-project');
      expect(config.setupLinear).toBe(true);
      expect(config.linearApiKey).toBe('lin_api_test123');
      expect(config.setupGitHooks).toBe(true);
      expect(config.workTreePath).toBe('/test/worktrees');
    });

    it('should use default project name from directory', async () => {
      const inquirer = require('inquirer');
      inquirer.prompt.mockImplementation((questions) => {
        const projectNameQuestion = questions.find((q) => q.name === 'projectName');
        expect(projectNameQuestion.default).toBe('my-project');

        return Promise.resolve({
          projectName: 'my-project',
          setupLinear: false,
          setupGitHooks: false,
          workTreeLocation: 'alongside',
        });
      });

      await installer.interactiveConfiguration('/test/my-project');
    });
  });

  describe('uninstall', () => {
    beforeEach(() => {
      installer.steps.removeWorkflowDirectories = jest.fn().mockResolvedValue(true);
      installer.steps.cleanupWorktrees = jest.fn().mockResolvedValue(true);
      installer.steps.removeConfigurationFiles = jest.fn().mockResolvedValue(true);
    });

    it('should complete uninstall when confirmed', async () => {
      const inquirer = require('inquirer');
      inquirer.prompt.mockResolvedValue({ confirmUninstall: true });

      await installer.uninstall('/test/dir');

      expect(installer.steps.removeWorkflowDirectories).toHaveBeenCalledWith('/test/dir');
      expect(installer.steps.cleanupWorktrees).toHaveBeenCalledWith('/test/dir');
      expect(installer.steps.removeConfigurationFiles).toHaveBeenCalledWith('/test/dir');
    });

    it('should cancel uninstall when not confirmed', async () => {
      const inquirer = require('inquirer');
      inquirer.prompt.mockResolvedValue({ confirmUninstall: false });

      await installer.uninstall('/test/dir');

      expect(installer.steps.removeWorkflowDirectories).not.toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Uninstall cancelled'));
    });

    it('should handle uninstall errors gracefully', async () => {
      const inquirer = require('inquirer');
      inquirer.prompt.mockResolvedValue({ confirmUninstall: true });

      const error = new Error('Uninstall failed');
      installer.steps.removeWorkflowDirectories.mockRejectedValue(error);

      await installer.uninstall('/test/dir');

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Uninstall failed:'),
        error.message,
      );
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('displaySuccessMessage', () => {
    it('should display success message with Linear API key reminder', () => {
      const config = {
        projectName: 'test-project',
        setupLinear: true,
        linearApiKey: null,
      };

      installer.displaySuccessMessage('/test/dir', config);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Installation complete!'),
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Set your Linear API key:'),
      );
    });

    it('should display success message without Linear API key reminder', () => {
      const config = {
        projectName: 'test-project',
        setupLinear: true,
        linearApiKey: 'lin_api_test123',
      };

      installer.displaySuccessMessage('/test/dir', config);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Installation complete!'),
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Try the workflow:'));
    });
  });
});
