const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const fs = require('fs-extra');

const { InstallSteps } = require('./install-steps');

// Mock dependencies
jest.mock('fs-extra');
jest.mock('child_process');
jest.mock('chalk', () => ({
  gray: jest.fn((text) => text),
  yellow: jest.fn((text) => text),
  red: jest.fn((text) => text),
  green: jest.fn((text) => text),
}));

describe('InstallSteps', () => {
  let installSteps;
  let mockConsoleLog;

  beforeEach(() => {
    installSteps = new InstallSteps();

    // Mock console methods
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    jest.restoreAllMocks();
  });

  describe('validateTargetDirectory', () => {
    it('should create directory if it does not exist', async () => {
      fs.pathExists.mockResolvedValue(false);
      fs.ensureDir.mockResolvedValue(true);
      fs.access.mockResolvedValue(true);

      await installSteps.validateTargetDirectory('/test/dir', {});

      expect(fs.ensureDir).toHaveBeenCalledWith('/test/dir');
      expect(fs.access).toHaveBeenCalledWith('/test/dir', fs.constants.W_OK);
    });

    it('should validate existing directory', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readdir.mockResolvedValue([]);
      fs.access.mockResolvedValue(true);

      await installSteps.validateTargetDirectory('/test/dir', {});

      expect(fs.readdir).toHaveBeenCalledWith('/test/dir');
      expect(fs.access).toHaveBeenCalledWith('/test/dir', fs.constants.W_OK);
    });

    it('should throw error if directory contains workflow without force flag', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readdir.mockResolvedValue(['workflows']);

      await expect(installSteps.validateTargetDirectory('/test/dir', {})).rejects.toThrow(
        'already contains a workflow',
      );
    });

    it('should proceed with force flag even if workflow exists', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readdir.mockResolvedValue(['workflows']);
      fs.access.mockResolvedValue(true);

      await installSteps.validateTargetDirectory('/test/dir', { force: true });

      expect(fs.access).toHaveBeenCalledWith('/test/dir', fs.constants.W_OK);
    });

    it('should throw error if no write permission', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readdir.mockResolvedValue([]);
      fs.access.mockRejectedValue(new Error('Permission denied'));

      await expect(installSteps.validateTargetDirectory('/test/dir', {})).rejects.toThrow(
        'No write permission',
      );
    });
  });

  describe('validateEnvironment', () => {
    it('should validate all required dependencies', async () => {
      const mockExec = jest.fn();
      require('child_process').exec = mockExec;

      // Mock successful command executions
      mockExec.mockImplementation((cmd, options, callback) => {
        callback(null, { stdout: 'v16.0.0' }, null);
      });

      const { promisify } = require('util');
      const execAsync = promisify(mockExec);

      execAsync
        .mockResolvedValueOnce({ stdout: 'v16.0.0' })
        .mockResolvedValueOnce({ stdout: 'git version 2.30.0' })
        .mockResolvedValueOnce({ stdout: 'claude version 1.0.0' })
        .mockResolvedValueOnce({ stdout: '8.0.0' });

      const results = await installSteps.validateEnvironment();

      expect(results).toHaveLength(4);
      expect(results[0]).toMatchObject({
        name: 'Node.js',
        available: true,
        required: true,
      });
    });

    it('should throw error for missing required dependencies', async () => {
      const { promisify } = require('util');
      const mockExec = jest.fn();
      require('child_process').exec = mockExec;
      const execAsync = promisify(mockExec);

      execAsync
        .mockRejectedValueOnce(new Error('Node.js not found'))
        .mockResolvedValueOnce({ stdout: 'git version 2.30.0' })
        .mockResolvedValueOnce({ stdout: 'claude version 1.0.0' })
        .mockResolvedValueOnce({ stdout: '8.0.0' });

      await expect(installSteps.validateEnvironment()).rejects.toThrow(
        'Missing required dependencies',
      );
    });
  });

  describe('createDirectoryStructure', () => {
    it('should create all required directories', async () => {
      fs.ensureDir.mockResolvedValue(true);

      await installSteps.createDirectoryStructure('/test/dir');

      expect(fs.ensureDir).toHaveBeenCalledWith('/test/dir/workflows');
      expect(fs.ensureDir).toHaveBeenCalledWith('/test/dir/workflows/paralell-development-claude');
      expect(fs.ensureDir).toHaveBeenCalledWith(
        '/test/dir/workflows/paralell-development-claude/scripts',
      );
      expect(fs.ensureDir).toHaveBeenCalledWith('/test/dir/shared');
      expect(fs.ensureDir).toHaveBeenCalledWith('/test/dir/.linear-cache');
    });
  });

  describe('copyWorkflowTemplates', () => {
    it('should copy all template files', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.ensureDir.mockResolvedValue(true);
      fs.copy.mockResolvedValue(true);

      await installSteps.copyWorkflowTemplates('/test/dir');

      expect(fs.copy).toHaveBeenCalledWith(
        expect.stringContaining('scripts/cache-linear-issue.sh'),
        expect.stringContaining(
          'workflows/paralell-development-claude/scripts/cache-linear-issue.sh',
        ),
      );
      expect(fs.copy).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.stringContaining('workflows/paralell-development-claude/README.md'),
      );
    });

    it('should handle missing template files gracefully', async () => {
      fs.pathExists.mockResolvedValue(false);
      fs.ensureDir.mockResolvedValue(true);

      await installSteps.copyWorkflowTemplates('/test/dir');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Template file not found'),
      );
    });
  });

  describe('setupScriptsAndPermissions', () => {
    it('should make shell scripts executable', async () => {
      fs.readdir.mockResolvedValue([
        'cache-linear-issue.sh',
        'spawn-agents.sh',
        'decompose-parallel.cjs',
      ]);
      fs.chmod.mockResolvedValue(true);
      fs.pathExists.mockResolvedValue(true);

      await installSteps.setupScriptsAndPermissions('/test/dir');

      expect(fs.chmod).toHaveBeenCalledWith(
        expect.stringContaining('cache-linear-issue.sh'),
        '755',
      );
      expect(fs.chmod).toHaveBeenCalledWith(expect.stringContaining('spawn-agents.sh'), '755');
      expect(fs.chmod).toHaveBeenCalledWith(
        expect.stringContaining('decompose-parallel.cjs'),
        '755',
      );
    });

    it('should handle permission errors gracefully', async () => {
      fs.readdir.mockResolvedValue(['cache-linear-issue.sh']);
      fs.chmod.mockRejectedValue(new Error('Permission denied'));

      await installSteps.setupScriptsAndPermissions('/test/dir');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Could not set script permissions'),
      );
    });
  });

  describe('createConfigurationFiles', () => {
    it('should create all configuration files', async () => {
      fs.writeFile.mockResolvedValue(true);
      fs.ensureDir.mockResolvedValue(true);
      fs.pathExists.mockResolvedValue(false);

      const config = {
        projectName: 'test-project',
        workTreePath: '/test/worktrees',
        linearApiKey: 'lin_api_test123',
      };

      await installSteps.createConfigurationFiles('/test/dir', config);

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/dir/.env.example',
        expect.stringContaining('PROJECT_NAME=test-project'),
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/dir/.env',
        expect.stringContaining('lin_api_test123'),
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/dir/.claude/CLAUDE.md',
        expect.stringContaining('test-project'),
      );
    });

    it('should not create .env file if no API key provided', async () => {
      fs.writeFile.mockResolvedValue(true);
      fs.ensureDir.mockResolvedValue(true);
      fs.pathExists.mockResolvedValue(false);

      const config = {
        projectName: 'test-project',
        workTreePath: '/test/worktrees',
        linearApiKey: null,
      };

      await installSteps.createConfigurationFiles('/test/dir', config);

      expect(fs.writeFile).toHaveBeenCalledWith('/test/dir/.env.example', expect.any(String));
      expect(fs.writeFile).not.toHaveBeenCalledWith('/test/dir/.env', expect.any(String));
    });
  });

  describe('setupGitHooks', () => {
    it('should create git hooks if git repository exists', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.writeFile.mockResolvedValue(true);
      fs.chmod.mockResolvedValue(true);
      fs.move.mockResolvedValue(true);

      await installSteps.setupGitHooks('/test/dir');

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/dir/.git/hooks/pre-commit',
        expect.stringContaining('validation_checklist.txt'),
      );
      expect(fs.chmod).toHaveBeenCalledWith('/test/dir/.git/hooks/pre-commit', '755');
    });

    it('should skip git hooks if not a git repository', async () => {
      fs.pathExists.mockResolvedValue(false);

      await installSteps.setupGitHooks('/test/dir');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Not a Git repository'),
      );
    });
  });

  describe('finalValidation', () => {
    it('should validate all required files exist', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.stat.mockResolvedValue({ mode: 0o755 });

      await installSteps.finalValidation('/test/dir', {});

      expect(fs.pathExists).toHaveBeenCalledWith(
        '/test/dir/workflows/paralell-development-claude/README.md',
      );
      expect(fs.pathExists).toHaveBeenCalledWith('/test/dir/.env.example');
    });

    it('should warn about missing files', async () => {
      fs.pathExists.mockResolvedValue(false);

      await installSteps.finalValidation('/test/dir', {});

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Some files were not created'),
      );
    });

    it('should validate script permissions', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.stat.mockResolvedValue({ mode: 0o755 });

      await installSteps.finalValidation('/test/dir', {});

      expect(fs.stat).toHaveBeenCalledWith(expect.stringContaining('cache-linear-issue.sh'));
    });
  });

  describe('uninstall methods', () => {
    describe('removeWorkflowDirectories', () => {
      it('should remove workflow directories', async () => {
        fs.pathExists.mockResolvedValue(true);
        fs.remove.mockResolvedValue(true);

        await installSteps.removeWorkflowDirectories('/test/dir');

        expect(fs.remove).toHaveBeenCalledWith('/test/dir/workflows/paralell-development-claude');
        expect(fs.remove).toHaveBeenCalledWith('/test/dir/shared/deployment-plans');
        expect(fs.remove).toHaveBeenCalledWith('/test/dir/.linear-cache');
      });
    });

    describe('cleanupWorktrees', () => {
      it('should clean up git worktrees', async () => {
        const { promisify } = require('util');
        const mockExec = jest.fn();
        require('child_process').exec = mockExec;
        const execAsync = promisify(mockExec);

        execAsync
          .mockResolvedValueOnce({
            stdout:
              'worktree /test/worktree1\nbranch refs/heads/TASK-123-agent1\n\nworktree /test/worktree2\nbranch refs/heads/TASK-123-agent2',
          })
          .mockResolvedValueOnce({})
          .mockResolvedValueOnce({});

        await installSteps.cleanupWorktrees('/test/dir');

        expect(execAsync).toHaveBeenCalledWith('git worktree list --porcelain', {
          cwd: '/test/dir',
        });
      });

      it('should handle worktree cleanup errors gracefully', async () => {
        const { promisify } = require('util');
        const mockExec = jest.fn();
        require('child_process').exec = mockExec;
        const execAsync = promisify(mockExec);

        execAsync.mockRejectedValue(new Error('Git error'));

        await installSteps.cleanupWorktrees('/test/dir');

        expect(mockConsoleLog).toHaveBeenCalledWith(
          expect.stringContaining('Warning: Could not clean up worktrees'),
        );
      });
    });
  });
});
