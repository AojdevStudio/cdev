const path = require('path');

const fs = require('fs-extra');

const Hooks2Rule = require('../src/hooks2rule');

// Mock dependencies
jest.mock('fs-extra');

describe('Hooks2Rule', () => {
  let analyzer;
  let consoleLogSpy;
  let consoleWarnSpy;
  let processExitSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    analyzer = new Hooks2Rule();

    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    // Default fs mocks
    fs.pathExists.mockResolvedValue(false);
    fs.readdir.mockResolvedValue([]);
    fs.stat.mockResolvedValue({ isDirectory: () => false, size: 1000, mtime: new Date() });
    fs.readFile.mockResolvedValue('# Mock hook content');
    fs.readJson.mockResolvedValue({});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize with correct paths', () => {
      expect(analyzer.projectPath).toBe(process.cwd());
      expect(analyzer.hooksPath).toBe(path.join(process.cwd(), '.claude', 'hooks'));
      expect(analyzer.settingsPath).toBe(path.join(process.cwd(), '.claude', 'settings.json'));
    });
  });

  describe('analyze', () => {
    it('should complete analysis successfully', async () => {
      const mockHooks = [
        {
          type: 'file',
          name: 'pre_tool_use.py',
          content: '# Pre tool use hook',
          path: '/test/hooks/pre_tool_use.py',
        },
      ];

      jest.spyOn(analyzer, 'discoverHooks').mockResolvedValue(mockHooks);
      jest
        .spyOn(analyzer, 'generateRules')
        .mockResolvedValue([{ name: 'pre_tool_use.py', rule: 'Test rule' }]);
      jest.spyOn(analyzer, 'outputRules').mockResolvedValue();

      await analyzer.analyze();

      expect(consoleLogSpy).toHaveBeenCalledWith('🔍 Analyzing Claude Code hooks...\n');
      expect(consoleLogSpy).toHaveBeenCalledWith('Found 1 hooks to analyze\n');
      expect(consoleLogSpy).toHaveBeenCalledWith('Generated 1 rules\n');
    });

    it('should handle no hooks found', async () => {
      jest.spyOn(analyzer, 'discoverHooks').mockResolvedValue([]);

      await analyzer.analyze();

      expect(consoleLogSpy).toHaveBeenCalledWith('No hooks found to analyze.');
    });

    it('should handle analysis errors', async () => {
      const error = new Error('Analysis failed');
      jest.spyOn(analyzer, 'discoverHooks').mockRejectedValue(error);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await analyzer.analyze();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error analyzing hooks:', 'Analysis failed');
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('discoverHooks', () => {
    it('should discover both file and settings hooks', async () => {
      const fileHooks = [{ type: 'file', name: 'test.py' }];
      const settingsHooks = [{ type: 'settings', event: 'PreToolUse' }];

      jest.spyOn(analyzer, 'discoverFileHooks').mockResolvedValue(fileHooks);
      jest.spyOn(analyzer, 'discoverSettingsHooks').mockResolvedValue(settingsHooks);

      const hooks = await analyzer.discoverHooks();

      expect(hooks).toEqual([...fileHooks, ...settingsHooks]);
    });
  });

  describe('discoverFileHooks', () => {
    it('should return empty array if hooks directory does not exist', async () => {
      fs.pathExists.mockResolvedValue(false);

      const hooks = await analyzer.discoverFileHooks();

      expect(hooks).toEqual([]);
    });

    it('should discover Python, shell, and JavaScript hook files', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readdir.mockResolvedValueOnce(['hook.py', 'script.sh', 'tool.js', 'readme.txt']);
      fs.stat
        .mockResolvedValueOnce({ isDirectory: () => false, size: 100, mtime: new Date() })
        .mockResolvedValueOnce({ isDirectory: () => false, size: 200, mtime: new Date() })
        .mockResolvedValueOnce({ isDirectory: () => false, size: 300, mtime: new Date() })
        .mockResolvedValueOnce({ isDirectory: () => false, size: 400, mtime: new Date() });
      fs.readFile
        .mockResolvedValueOnce('# Python hook')
        .mockResolvedValueOnce('# Shell script')
        .mockResolvedValueOnce('// JavaScript hook');

      const hooks = await analyzer.discoverFileHooks();

      expect(hooks).toHaveLength(3);
      expect(hooks[0].name).toBe('hook.py');
      expect(hooks[1].name).toBe('script.sh');
      expect(hooks[2].name).toBe('tool.js');
    });

    it('should discover hooks in tier directories', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readdir
        .mockResolvedValueOnce(['tier1']) // root directory
        .mockResolvedValueOnce(['validator.py']); // tier1 directory
      fs.stat
        .mockResolvedValueOnce({ isDirectory: () => true }) // tier1 is directory
        .mockResolvedValueOnce({ isDirectory: () => false, size: 500, mtime: new Date() }); // validator.py is file
      fs.readFile.mockResolvedValueOnce('# Tier 1 validator');

      const hooks = await analyzer.discoverFileHooks();

      expect(hooks).toHaveLength(1);
      expect(hooks[0].name).toBe('validator.py');
      expect(hooks[0].tier).toBe('tier1');
    });
  });

  describe('discoverSettingsHooks', () => {
    it('should discover hooks from settings.json files', async () => {
      const settingsConfig = {
        hooks: {
          PreToolUse: [
            {
              matcher: 'Bash',
              hooks: [{ command: 'python hook.py', timeout: 5000 }],
            },
          ],
        },
      };

      fs.pathExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false); // Only project settings exist
      fs.readJson.mockResolvedValue(settingsConfig);

      const hooks = await analyzer.discoverSettingsHooks();

      expect(hooks).toHaveLength(1);
      expect(hooks[0]).toEqual({
        type: 'settings',
        event: 'PreToolUse',
        matcher: 'Bash',
        command: 'python hook.py',
        timeout: 5000,
        source: analyzer.settingsPath,
      });
    });

    it('should handle invalid settings files gracefully', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readJson.mockRejectedValue(new Error('Invalid JSON'));

      const hooks = await analyzer.discoverSettingsHooks();

      expect(hooks).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not parse settings file'),
      );
    });

    it('should handle settings files without hooks', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readJson.mockResolvedValue({ permissions: {} });

      const hooks = await analyzer.discoverSettingsHooks();

      expect(hooks).toEqual([]);
    });
  });

  describe('generateRules', () => {
    it('should generate rules for all hooks', async () => {
      const hooks = [
        { type: 'file', name: 'test.py', content: '# Test hook' },
        { type: 'settings', event: 'PreToolUse', command: 'echo test' },
      ];

      jest
        .spyOn(analyzer, 'analyzeHook')
        .mockResolvedValueOnce({ name: 'test.py', rule: 'File rule' })
        .mockResolvedValueOnce({ name: 'settings hook', rule: 'Settings rule' });

      const rules = await analyzer.generateRules(hooks);

      expect(rules).toHaveLength(2);
      expect(rules[0].rule).toBe('File rule');
      expect(rules[1].rule).toBe('Settings rule');
    });

    it('should handle hook analysis errors gracefully', async () => {
      const hooks = [{ type: 'file', name: 'broken.py' }];

      jest.spyOn(analyzer, 'analyzeHook').mockRejectedValue(new Error('Analysis failed'));

      const rules = await analyzer.generateRules(hooks);

      expect(rules).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not analyze hook broken.py'),
      );
    });
  });

  describe('analyzeFileHook', () => {
    it('should analyze file hook and generate rule', () => {
      const hook = {
        name: 'commit-validator.py',
        path: '/hooks/commit-validator.py',
        tier: 'tier1',
        content: 'def validate_commit():\n    pass',
      };

      jest.spyOn(analyzer, 'extractPurpose').mockReturnValue('validates commits');
      jest.spyOn(analyzer, 'detectEventType').mockReturnValue('PreToolUse');
      jest.spyOn(analyzer, 'extractToolMatchers').mockReturnValue(['Bash']);
      jest.spyOn(analyzer, 'analyzeBehavior').mockReturnValue({ blocks: true, logs: false });
      jest.spyOn(analyzer, 'analyzeSecurityFeatures').mockReturnValue({ hasPathValidation: false });
      jest
        .spyOn(analyzer, 'generateRuleFromAnalysis')
        .mockReturnValue(
          'Before using tools, validates commits and block execution if validation fails',
        );

      const analysis = analyzer.analyzeFileHook(hook);

      expect(analysis.name).toBe('commit-validator.py');
      expect(analysis.type).toBe('file');
      expect(analysis.tier).toBe('tier1');
      expect(analysis.purpose).toBe('validates commits');
      expect(analysis.eventType).toBe('PreToolUse');
      expect(analysis.rule).toBe(
        'Before using tools, validates commits and block execution if validation fails',
      );
    });
  });

  describe('analyzeSettingsHook', () => {
    it('should analyze settings hook and generate rule', () => {
      const hook = {
        event: 'PostToolUse',
        matcher: 'Write|Edit',
        command: 'python format.py',
        timeout: 3000,
        source: '/settings.json',
      };

      jest.spyOn(analyzer, 'extractPurposeFromCommand').mockReturnValue('formats code');
      jest
        .spyOn(analyzer, 'analyzeBehaviorFromCommand')
        .mockReturnValue({ formats: true, logs: false });
      jest
        .spyOn(analyzer, 'generateRuleFromSettingsAnalysis')
        .mockReturnValue('After using Write|Edit tools, formats code');

      const analysis = analyzer.analyzeSettingsHook(hook);

      expect(analysis.name).toBe('PostToolUse Write|Edit');
      expect(analysis.type).toBe('settings');
      expect(analysis.event).toBe('PostToolUse');
      expect(analysis.matcher).toBe('Write|Edit');
      expect(analysis.command).toBe('python format.py');
      expect(analysis.rule).toBe('After using Write|Edit tools, formats code');
    });
  });

  describe('extractPurpose', () => {
    it('should extract purpose from comments', () => {
      const hook = {
        content: '# Purpose: validates TypeScript files\ndef validate():\n    pass',
      };

      jest
        .spyOn(analyzer, 'extractComments')
        .mockReturnValue(['Purpose: validates TypeScript files']);

      const purpose = analyzer.extractPurpose(hook);

      expect(purpose).toBe('validates TypeScript files');
    });

    it('should infer purpose from filename', () => {
      const validatorHook = { name: 'typescript-validator.py', content: '' };
      const enforcerHook = { name: 'pnpm-enforcer.py', content: '' };
      const checkerHook = { name: 'api-checker.py', content: '' };

      jest.spyOn(analyzer, 'extractComments').mockReturnValue([]);

      expect(analyzer.extractPurpose(validatorHook)).toBe('validates code or input');
      expect(analyzer.extractPurpose(enforcerHook)).toBe('enforces rules or standards');
      expect(analyzer.extractPurpose(checkerHook)).toBe('checks code quality or standards');
    });

    it('should return default purpose if no pattern matches', () => {
      const hook = { name: 'unknown.py', content: '' };

      jest.spyOn(analyzer, 'extractComments').mockReturnValue([]);

      const purpose = analyzer.extractPurpose(hook);

      expect(purpose).toBe('performs automated task');
    });
  });

  describe('detectEventType', () => {
    it('should detect event type from content', () => {
      expect(analyzer.detectEventType({ content: 'def pretooluse():' })).toBe('PreToolUse');
      expect(analyzer.detectEventType({ content: 'post_tool_use hook' })).toBe('PostToolUse');
      expect(analyzer.detectEventType({ content: 'send notification' })).toBe('Notification');
      expect(analyzer.detectEventType({ content: 'stop session' })).toBe('Stop');
      expect(analyzer.detectEventType({ content: 'subagent cleanup' })).toBe('SubagentStop');
    });

    it('should detect event type from filename', () => {
      expect(analyzer.detectEventType({ name: 'pre_tool_use.py', content: '' })).toBe('PreToolUse');
      expect(analyzer.detectEventType({ name: 'post_tool_use.py', content: '' })).toBe(
        'PostToolUse',
      );
      expect(analyzer.detectEventType({ name: 'notification.py', content: '' })).toBe(
        'Notification',
      );
      expect(analyzer.detectEventType({ name: 'stop.py', content: '' })).toBe('Stop');
    });

    it('should return Unknown for unrecognizable hooks', () => {
      expect(analyzer.detectEventType({ name: 'unknown.py', content: 'random content' })).toBe(
        'Unknown',
      );
    });
  });

  describe('extractToolMatchers', () => {
    it('should extract tool names from content', () => {
      const hook = {
        content: `
          tool_name = "Bash"
          if matcher == "Write|Edit":
            process()
          use Grep for searching
        `,
      };

      const matchers = analyzer.extractToolMatchers(hook);

      // Check that some form of the patterns are matched
      expect(matchers.some((m) => m.includes('Bash'))).toBe(true);
      expect(matchers.some((m) => m.includes('Write') || m.includes('Edit'))).toBe(true);
      expect(matchers).toContain('Grep');
    });

    it('should return empty array for content without tool references', () => {
      const hook = { content: 'def simple_function(): pass' };

      const matchers = analyzer.extractToolMatchers(hook);

      expect(matchers).toEqual([]);
    });
  });

  describe('analyzeBehavior', () => {
    it('should analyze hook behavior from content', () => {
      const hook = {
        content: `
          sys.exit(2)  # blocks execution
          print("logging")  # logs
          file.write()  # modifies
          validate_input()  # validates
          subprocess.format()  # formats
          send_notification()  # notifies
          async def process():  # async
            await fetch_api()  # uses API
        `,
      };

      const behavior = analyzer.analyzeBehavior(hook);

      expect(behavior.blocks).toBe(true);
      expect(behavior.logs).toBe(true);
      expect(behavior.modifies).toBe(true);
      expect(behavior.validates).toBe(true);
      expect(behavior.formats).toBe(true);
      expect(behavior.notifies).toBe(true);
      expect(behavior.async).toBe(true);
      expect(behavior.usesApi).toBe(true);
    });

    it('should return false for behaviors not present', () => {
      const hook = { content: 'def simple(): pass' };

      const behavior = analyzer.analyzeBehavior(hook);

      expect(behavior.blocks).toBe(false);
      expect(behavior.logs).toBe(false);
      expect(behavior.modifies).toBe(false);
      expect(behavior.validates).toBe(false);
      expect(behavior.formats).toBe(false);
      expect(behavior.notifies).toBe(false);
      expect(behavior.async).toBe(false);
      expect(behavior.usesApi).toBe(false);
    });
  });

  describe('analyzeSecurityFeatures', () => {
    it('should detect security features in hook content', () => {
      const hook = {
        content: `
          validate_path(filepath)
          sanitize_input(data)
          check_permissions(user)
          block_sensitive_operation()
          security_check()
        `,
      };

      const security = analyzer.analyzeSecurityFeatures(hook);

      expect(security.hasPathValidation).toBe(true);
      expect(security.hasInputSanitization).toBe(true);
      expect(security.hasPermissionChecks).toBe(true);
      expect(security.blocksSensitiveOps).toBe(true);
      expect(security.hasSecurityKeywords).toBe(true);
    });
  });

  describe('generateRuleFromAnalysis', () => {
    it('should generate human-readable rule from analysis', () => {
      const analysis = {
        purpose: 'validates TypeScript code',
        eventType: 'PreToolUse',
        behavior: { blocks: true, logs: true, formats: false, notifies: false },
        tier: 'tier1',
      };

      const rule = analyzer.generateRuleFromAnalysis(analysis);

      expect(rule).toBe(
        'Before using tools, validates TypeScript code and block execution if validation fails and log the activity (tier1 hook)',
      );
    });

    it('should handle different event types', () => {
      const postAnalysis = {
        purpose: 'formats code',
        eventType: 'PostToolUse',
        behavior: { blocks: false, logs: false, formats: true, notifies: false },
        tier: null,
      };

      const rule = analyzer.generateRuleFromAnalysis(postAnalysis);

      expect(rule).toBe('After using tools, formats code and format the code');
    });
  });

  describe('outputRules', () => {
    it('should output rules in markdown format by default', async () => {
      const rules = [{ name: 'test.py', rule: 'Test rule', tier: 'tier1', type: 'file' }];

      jest.spyOn(analyzer, 'outputMarkdownFormat').mockResolvedValue();

      await analyzer.outputRules(rules, {});

      expect(analyzer.outputMarkdownFormat).toHaveBeenCalledWith(rules);
    });

    it('should output rules in JSON format', async () => {
      const rules = [{ name: 'test.py', rule: 'Test rule' }];

      await analyzer.outputRules(rules, { format: 'json' });

      expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify(rules, null, 2));
    });

    it('should output rules in Claude format', async () => {
      const rules = [{ name: 'test.py', rule: 'Test rule' }];

      jest.spyOn(analyzer, 'outputClaudeFormat').mockResolvedValue();

      await analyzer.outputRules(rules, { format: 'claude' });

      expect(analyzer.outputClaudeFormat).toHaveBeenCalledWith(rules);
    });
  });

  describe('outputMarkdownFormat', () => {
    it('should output rules grouped by tier', async () => {
      const rules = [
        {
          name: 'validator.py',
          rule: 'Validates input',
          tier: 'tier1',
          type: 'file',
          path: '/hooks/validator.py',
          eventType: 'PreToolUse',
          toolMatchers: ['Bash'],
        },
        {
          name: 'settings hook',
          rule: 'Settings based rule',
          type: 'settings',
          event: 'PostToolUse',
          matcher: 'Write',
          command: 'echo test',
        },
      ];

      await analyzer.outputMarkdownFormat(rules);

      expect(consoleLogSpy).toHaveBeenCalledWith('# Claude Code Hook Rules\n');
      expect(consoleLogSpy).toHaveBeenCalledWith('## Tier 1 - Critical Security & Validation\n');
      expect(consoleLogSpy).toHaveBeenCalledWith('### validator.py');
      expect(consoleLogSpy).toHaveBeenCalledWith('**Rule:** Validates input\n');
      expect(consoleLogSpy).toHaveBeenCalledWith('## Settings-Based Hooks\n');
    });

    it('should display summary statistics', async () => {
      const rules = [
        { tier: 'tier1', type: 'file', name: 'test1', rule: 'Rule 1', toolMatchers: [] },
        { tier: 'tier2', type: 'file', name: 'test2', rule: 'Rule 2', toolMatchers: [] },
        { type: 'settings', name: 'test3', rule: 'Rule 3' },
      ];

      await analyzer.outputMarkdownFormat(rules);

      expect(consoleLogSpy).toHaveBeenCalledWith('Total rules analyzed: 3');
      expect(consoleLogSpy).toHaveBeenCalledWith('- Tier 1 (Critical): 1');
      expect(consoleLogSpy).toHaveBeenCalledWith('- Tier 2 (Important): 1');
      expect(consoleLogSpy).toHaveBeenCalledWith('- Settings-based: 1');
    });
  });

  describe('outputClaudeFormat', () => {
    it('should output rules in CLAUDE.md format', async () => {
      const rules = [
        { rule: 'Rule 1', tier: 'tier1', name: 'hook1', purpose: 'validates' },
        { rule: 'Rule 2', tier: 'tier2', name: 'hook2', purpose: 'formats' },
      ];

      await analyzer.outputClaudeFormat(rules);

      expect(consoleLogSpy).toHaveBeenCalledWith('# Hook Rules for Claude\n');
      expect(consoleLogSpy).toHaveBeenCalledWith('- Rule 1');
      expect(consoleLogSpy).toHaveBeenCalledWith('- Rule 2');
      expect(consoleLogSpy).toHaveBeenCalledWith('### TIER1\n');
      expect(consoleLogSpy).toHaveBeenCalledWith('- hook1: validates');
    });
  });

  describe('extractComments', () => {
    it('should extract Python comments', () => {
      const content = `# This is a comment
def function():
# Another comment
    pass
"""Multi-line
comment"""`;

      const comments = analyzer.extractComments(content);

      expect(comments).toContain('This is a comment');
      expect(comments).toContain('Another comment');
      expect(comments.some((c) => c.includes('Multi-line'))).toBe(true);
    });

    it('should extract shell comments', () => {
      const content = `#!/bin/bash
# Shell comment
echo "hello"`;

      const comments = analyzer.extractComments(content);

      expect(comments).toContain('!/bin/bash');
      expect(comments).toContain('Shell comment');
    });
  });
});
