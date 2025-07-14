/**
 * Tests for SimpleInstaller
 */

const path = require('path');

const fs = require('fs-extra');
const ora = require('ora');

const { SimpleInstaller } = require('./simple-installer');

// Mock dependencies
jest.mock('fs-extra');
jest.mock('ora');
jest.mock('chalk', () => ({
  green: jest.fn((text) => text),
  yellow: jest.fn((text) => text),
  cyan: jest.fn((text) => text),
}));

describe('SimpleInstaller', () => {
  let simpleInstaller;
  let mockSpinner;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();

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
    fs.writeJson.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
    fs.copy.mockResolvedValue();
    fs.pathExists.mockResolvedValue(true);
    fs.readdir.mockResolvedValue([]);
    fs.chmod.mockResolvedValue();

    simpleInstaller = new SimpleInstaller();
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  describe('constructor', () => {
    test('sets package root correctly', () => {
      expect(simpleInstaller.packageRoot).toBe(path.join(__dirname, '..'));
    });
  });

  describe('install', () => {
    const testTargetDir = '/test/project';

    test('completes full installation successfully', async () => {
      await simpleInstaller.install(testTargetDir);

      expect(mockSpinner.start).toHaveBeenCalledWith('Installing cdev files to your project...');
      expect(mockSpinner.succeed).toHaveBeenCalledWith('cdev installation complete!');

      // Verify all installation steps were called
      expect(fs.ensureDir).toHaveBeenCalledWith(path.resolve(testTargetDir));
      expect(fs.writeJson).toHaveBeenCalled(); // settings.json
      expect(fs.writeFile).toHaveBeenCalled(); // Multiple files
      expect(fs.chmod).toHaveBeenCalled(); // Permissions

      // Verify console output
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Successfully installed cdev files'),
      );
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Next steps:'));
    });

    test('uses current directory when no target specified', async () => {
      await simpleInstaller.install();

      expect(fs.ensureDir).toHaveBeenCalledWith(path.resolve('.'));
    });

    test('handles installation failure', async () => {
      const error = new Error('Permission denied');
      fs.ensureDir.mockRejectedValueOnce(error);

      await expect(simpleInstaller.install(testTargetDir)).rejects.toThrow('Permission denied');
      expect(mockSpinner.fail).toHaveBeenCalledWith('Installation failed');
    });

    test('updates spinner text during installation steps', async () => {
      await simpleInstaller.install(testTargetDir);

      // Verify spinner text was set (can't directly verify assignment)
      expect(mockSpinner.succeed).toHaveBeenCalled();
    });
  });

  describe('createClaudeDirectory', () => {
    test('creates all required directories', async () => {
      await simpleInstaller.createClaudeDirectory('/test/project');

      const expectedDirs = [
        '/test/project/.claude',
        '/test/project/.claude/hooks',
        '/test/project/.claude/commands',
        '/test/project/.claude/logs',
        '/test/project/.claude/templates',
      ];

      for (const dir of expectedDirs) {
        expect(fs.ensureDir).toHaveBeenCalledWith(dir);
      }
    });
  });

  describe('copyHookConfigurations', () => {
    test('creates settings.json with hook configurations', async () => {
      await simpleInstaller.copyHookConfigurations('/test/project');

      expect(fs.writeJson).toHaveBeenCalledWith(
        '/test/project/.claude/settings.json',
        expect.objectContaining({
          version: '1.0',
          description: 'Claude Code Hooks configuration',
          hooks: expect.objectContaining({
            PreToolUse: expect.any(Array),
            PostToolUse: expect.any(Array),
            Notification: expect.any(Array),
            Stop: expect.any(Array),
          }),
        }),
        { spaces: 2 },
      );
    });

    test('creates all hook scripts', async () => {
      await simpleInstaller.copyHookConfigurations('/test/project');

      const expectedScripts = [
        'pre-bash-validator.py',
        'typescript-validator.py',
        'import-organizer.py',
        'notification.py',
        'task-completion-enforcer.py',
      ];

      for (const script of expectedScripts) {
        expect(fs.writeFile).toHaveBeenCalledWith(
          `/test/project/.claude/hooks/${script}`,
          expect.any(String),
        );
      }
    });
  });

  describe('createBasicHookScripts', () => {
    test('creates pre-bash-validator with dangerous patterns', async () => {
      await simpleInstaller.createBasicHookScripts('/test/hooks');

      const preBashCall = fs.writeFile.mock.calls.find((call) =>
        call[0].includes('pre-bash-validator.py'),
      );

      expect(preBashCall).toBeDefined();
      expect(preBashCall[1]).toContain('rm\\\\s+-rf');
      expect(preBashCall[1]).toContain('sudo|su');
      expect(preBashCall[1]).toContain('Fork bomb pattern');
    });

    test('creates typescript-validator with any type check', async () => {
      await simpleInstaller.createBasicHookScripts('/test/hooks');

      const tsCall = fs.writeFile.mock.calls.find((call) =>
        call[0].includes('typescript-validator.py'),
      );

      expect(tsCall).toBeDefined();
      expect(tsCall[1]).toContain("Avoid using 'any' type");
      expect(tsCall[1]).toContain(".ts', '.tsx'");
    });

    test('creates notification hook with platform detection', async () => {
      await simpleInstaller.createBasicHookScripts('/test/hooks');

      const notificationCall = fs.writeFile.mock.calls.find((call) =>
        call[0].includes('notification.py'),
      );

      expect(notificationCall).toBeDefined();
      expect(notificationCall[1]).toContain('platform.system()');
      expect(notificationCall[1]).toContain('osascript');
      expect(notificationCall[1]).toContain('notify-send');
    });

    test('creates task-completion-enforcer with TODO/FIXME detection', async () => {
      await simpleInstaller.createBasicHookScripts('/test/hooks');

      const taskCall = fs.writeFile.mock.calls.find((call) =>
        call[0].includes('task-completion-enforcer.py'),
      );

      expect(taskCall).toBeDefined();
      expect(taskCall[1]).toContain('TODO');
      expect(taskCall[1]).toContain('FIXME');
    });
  });

  describe('copyCommandTemplates', () => {
    test('creates agent-start command', async () => {
      await simpleInstaller.copyCommandTemplates('/test/project');

      const agentStartCall = fs.writeFile.mock.calls.find((call) =>
        call[0].includes('agent-start.sh'),
      );

      expect(agentStartCall).toBeDefined();
      expect(agentStartCall[1]).toContain('agent_context.json');
      expect(agentStartCall[1]).toContain('validation_checklist.txt');
      expect(agentStartCall[1]).toContain('files_to_work_on.txt');
    });

    test('creates agent-commit command', async () => {
      await simpleInstaller.copyCommandTemplates('/test/project');

      const agentCommitCall = fs.writeFile.mock.calls.find((call) =>
        call[0].includes('agent-commit.sh'),
      );

      expect(agentCommitCall).toBeDefined();
      expect(agentCommitCall[1]).toContain('grep -c "\\\\[ \\\\]"');
      expect(agentCommitCall[1]).toContain('git add -A');
      expect(agentCommitCall[1]).toContain('Co-Authored-By: Claude');
    });

    test('creates agent-status command', async () => {
      await simpleInstaller.copyCommandTemplates('/test/project');

      const agentStatusCall = fs.writeFile.mock.calls.find((call) =>
        call[0].includes('agent-status.sh'),
      );

      expect(agentStatusCall).toBeDefined();
      expect(agentStatusCall[1]).toContain('git worktree list');
      expect(agentStatusCall[1]).toContain('Ready to merge');
      expect(agentStatusCall[1]).toContain('In Progress');
    });
  });

  describe('copyWorkflowScripts', () => {
    test('copies workflow scripts when they exist', async () => {
      fs.pathExists.mockResolvedValue(true);

      await simpleInstaller.copyWorkflowScripts('/test/project');

      const expectedScripts = [
        'cache-linear-issue.sh',
        'decompose-parallel.cjs',
        'spawn-agents.sh',
        'monitor-agents.sh',
        'agent-commit-enhanced.sh',
      ];

      for (const script of expectedScripts) {
        expect(fs.copy).toHaveBeenCalledWith(
          path.join(simpleInstaller.packageRoot, 'scripts', script),
          path.join('/test/project/scripts', script),
        );
      }
    });

    test('skips copying when source scripts do not exist', async () => {
      fs.pathExists.mockResolvedValue(false);

      await simpleInstaller.copyWorkflowScripts('/test/project');

      expect(fs.copy).not.toHaveBeenCalled();
    });
  });

  describe('copyAIDocs', () => {
    test('copies AI documentation when it exists', async () => {
      fs.pathExists.mockResolvedValue(true);

      await simpleInstaller.copyAIDocs('/test/project');

      expect(fs.copy).toHaveBeenCalledWith(
        path.join(simpleInstaller.packageRoot, 'ai-docs'),
        '/test/project/ai-docs',
      );
    });

    test('creates directory even when source does not exist', async () => {
      fs.pathExists.mockResolvedValue(false);

      await simpleInstaller.copyAIDocs('/test/project');

      expect(fs.ensureDir).toHaveBeenCalledWith('/test/project/ai-docs');
      expect(fs.copy).not.toHaveBeenCalled();
    });
  });

  describe('createExampleConfig', () => {
    test('creates .env.example file', async () => {
      await simpleInstaller.createExampleConfig('/test/project');

      const envCall = fs.writeFile.mock.calls.find((call) => call[0].includes('.env.example'));

      expect(envCall).toBeDefined();
      expect(envCall[1]).toContain('LINEAR_API_KEY=lin_api_XXXXXXXX');
      expect(envCall[1]).toContain('LLM_PROVIDER=openrouter');
      expect(envCall[1]).toContain('ENGINEER_NAME=YourName');
    });

    test('creates CLAUDE.md file', async () => {
      await simpleInstaller.createExampleConfig('/test/project');

      const claudeMdCall = fs.writeFile.mock.calls.find((call) => call[0].includes('CLAUDE.md'));

      expect(claudeMdCall).toBeDefined();
      expect(claudeMdCall[1]).toContain('Claude Code Instructions');
      expect(claudeMdCall[1]).toContain('/agent-start');
      expect(claudeMdCall[1]).toContain('Hooks');
    });
  });

  describe('setPermissions', () => {
    test('sets executable permissions on scripts and hooks', async () => {
      fs.readdir.mockImplementation((dir) => {
        if (dir.includes('scripts')) {
          return Promise.resolve(['script1.sh', 'script2.sh']);
        }
        if (dir.includes('commands')) {
          return Promise.resolve(['cmd.sh']);
        }
        if (dir.includes('hooks')) {
          return Promise.resolve(['hook.py']);
        }
        return Promise.resolve([]);
      });

      await simpleInstaller.setPermissions('/test/project');

      expect(fs.chmod).toHaveBeenCalledWith('/test/project/scripts/script1.sh', '755');
      expect(fs.chmod).toHaveBeenCalledWith('/test/project/scripts/script2.sh', '755');
      expect(fs.chmod).toHaveBeenCalledWith('/test/project/.claude/commands/cmd.sh', '755');
      expect(fs.chmod).toHaveBeenCalledWith('/test/project/.claude/hooks/hook.py', '755');
    });

    test('handles missing directories gracefully', async () => {
      fs.pathExists.mockResolvedValue(false);

      await simpleInstaller.setPermissions('/test/project');

      expect(fs.readdir).not.toHaveBeenCalled();
      expect(fs.chmod).not.toHaveBeenCalled();
    });

    test('only sets permissions on .sh and .py files', async () => {
      fs.readdir.mockResolvedValue(['script.sh', 'readme.md', 'tool.py', 'data.json']);

      await simpleInstaller.setPermissions('/test/project');

      expect(fs.chmod).toHaveBeenCalledWith(expect.stringContaining('script.sh'), '755');
      expect(fs.chmod).toHaveBeenCalledWith(expect.stringContaining('tool.py'), '755');
      expect(fs.chmod).not.toHaveBeenCalledWith(expect.stringContaining('readme.md'), '755');
      expect(fs.chmod).not.toHaveBeenCalledWith(expect.stringContaining('data.json'), '755');
    });
  });
});
