const path = require('path');
const os = require('os');

const fs = require('fs-extra');

const Hooks2Rule = require('./hooks2rule');

describe('Hooks2Rule', () => {
  let hooks2rule;
  let tempDir;
  let originalCwd;

  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hooks2rule-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);

    hooks2rule = new Hooks2Rule();
  });

  afterEach(async () => {
    // Cleanup
    process.chdir(originalCwd);
    await fs.remove(tempDir);
  });

  describe('Hook Discovery', () => {
    it('should discover file-based hooks', async () => {
      // Create test hook files
      const hooksDir = path.join(tempDir, '.claude', 'hooks');
      await fs.ensureDir(hooksDir);

      const hookContent = `#!/usr/bin/env python3
# Purpose: Validate TypeScript syntax before editing
import json
import sys

def validate_typescript():
    input_data = json.load(sys.stdin)
    tool_name = input_data.get("tool_name", "")
    if tool_name in ["Edit", "Write", "MultiEdit"]:
        # Validation logic here
        pass

if __name__ == "__main__":
    validate_typescript()
`;

      await fs.writeFile(path.join(hooksDir, 'typescript-validator.py'), hookContent);

      const hooks = await hooks2rule.discoverFileHooks();

      expect(hooks).toHaveLength(1);
      expect(hooks[0].name).toBe('typescript-validator.py');
      expect(hooks[0].type).toBe('file');
      expect(hooks[0].content).toContain('validate_typescript');
    });

    it('should discover hooks in tier directories', async () => {
      // Create tiered hook structure
      const tier1Dir = path.join(tempDir, '.claude', 'hooks', 'tier1');
      await fs.ensureDir(tier1Dir);

      await fs.writeFile(
        path.join(tier1Dir, 'security-enforcer.py'),
        '# Security enforcement hook\nprint("Security check")',
      );

      const hooks = await hooks2rule.discoverFileHooks();

      expect(hooks).toHaveLength(1);
      expect(hooks[0].tier).toBe('tier1');
      expect(hooks[0].name).toBe('security-enforcer.py');
    });

    it('should discover settings-based hooks', async () => {
      // Create settings file with hooks
      const settingsDir = path.join(tempDir, '.claude');
      await fs.ensureDir(settingsDir);

      const settings = {
        hooks: {
          PreToolUse: [
            {
              matcher: 'Bash',
              hooks: [
                {
                  type: 'command',
                  command:
                    'jq -r \'"\(.tool_input.command) - \(.tool_input.description // "No description")"\' >> ~/.claude/bash-command-log.txt',
                },
              ],
            },
          ],
        },
      };

      await fs.writeJson(path.join(settingsDir, 'settings.json'), settings);

      const hooks = await hooks2rule.discoverSettingsHooks();

      expect(hooks).toHaveLength(1);
      expect(hooks[0].type).toBe('settings');
      expect(hooks[0].event).toBe('PreToolUse');
      expect(hooks[0].matcher).toBe('Bash');
    });

    it('should handle malformed settings files gracefully', async () => {
      const settingsDir = path.join(tempDir, '.claude');
      await fs.ensureDir(settingsDir);

      // Write invalid JSON
      await fs.writeFile(path.join(settingsDir, 'settings.json'), '{ invalid json }');

      const hooks = await hooks2rule.discoverSettingsHooks();

      expect(hooks).toHaveLength(0);
    });
  });

  describe('Hook Analysis', () => {
    it('should extract purpose from hook comments', () => {
      const hook = {
        name: 'test-hook.py',
        content: `#!/usr/bin/env python3
# Purpose: Validate TypeScript syntax before editing
# This hook ensures type safety
import sys
`,
        type: 'file',
      };

      const purpose = hooks2rule.extractPurpose(hook);
      expect(purpose).toBe('Validate TypeScript syntax before editing');
    });

    it('should infer purpose from filename', () => {
      const hook = {
        name: 'typescript-validator.py',
        content: 'import sys',
        type: 'file',
      };

      const purpose = hooks2rule.extractPurpose(hook);
      expect(purpose).toBe('validates code or input');
    });

    it('should detect event type from content', () => {
      const hook = {
        name: 'test-hook.py',
        content: 'PreToolUse hook implementation',
        type: 'file',
      };

      const eventType = hooks2rule.detectEventType(hook);
      expect(eventType).toBe('PreToolUse');
    });

    it('should detect event type from filename', () => {
      const hook = {
        name: 'post_tool_use.py',
        content: 'import sys',
        type: 'file',
      };

      const eventType = hooks2rule.detectEventType(hook);
      expect(eventType).toBe('PostToolUse');
    });

    it('should extract tool matchers from content', () => {
      const hook = {
        name: 'test-hook.py',
        content: `
if tool_name == "Bash":
    print("Bash tool")
elif tool_name in ["Write", "Edit"]:
    print("File operations")
`,
        type: 'file',
      };

      const matchers = hooks2rule.extractToolMatchers(hook);
      expect(matchers).toContain('Bash');
      expect(matchers).toContain('Write');
      expect(matchers).toContain('Edit');
    });

    it('should analyze behavior patterns', () => {
      const hook = {
        name: 'test-hook.py',
        content: `
import sys
import logging

def validate():
    logging.info("Validating input")
    if not valid:
        sys.exit(2)  # Block execution
    print("Validation passed")
`,
        type: 'file',
      };

      const behavior = hooks2rule.analyzeBehavior(hook);
      expect(behavior.blocks).toBe(true);
      expect(behavior.logs).toBe(true);
      expect(behavior.validates).toBe(true);
    });

    it('should analyze security features', () => {
      const hook = {
        name: 'security-hook.py',
        content: `
import os
import sys

def check_permissions():
    if not os.access(file_path, os.W_OK):
        print("Permission denied", file=sys.stderr)
        sys.exit(2)
    
    if "sensitive" in file_path:
        print("Blocking sensitive operation", file=sys.stderr)
        sys.exit(2)
`,
        type: 'file',
      };

      const security = hooks2rule.analyzeSecurityFeatures(hook);
      expect(security.hasPermissionChecks).toBe(true);
      expect(security.blocksSensitiveOps).toBe(true);
      expect(security.hasSecurityKeywords).toBe(true);
    });
  });

  describe('Rule Generation', () => {
    it('should generate rule from file hook analysis', () => {
      const analysis = {
        name: 'typescript-validator.py',
        type: 'file',
        purpose: 'validates TypeScript syntax',
        eventType: 'PreToolUse',
        behavior: {
          blocks: true,
          validates: true,
          logs: false,
        },
        tier: 'tier1',
      };

      const rule = hooks2rule.generateRuleFromAnalysis(analysis);
      expect(rule).toBe(
        'Before using tools, validates TypeScript syntax and block execution if validation fails (tier1 hook)',
      );
    });

    it('should generate rule from settings hook analysis', () => {
      const analysis = {
        event: 'PreToolUse',
        matcher: 'Bash',
        purpose: 'logs information',
        behavior: {
          logs: true,
          blocks: false,
        },
      };

      const rule = hooks2rule.generateRuleFromSettingsAnalysis(analysis);
      expect(rule).toBe('Before using Bash tools, logs information and log to file');
    });

    it('should handle notification hooks differently', () => {
      const analysis = {
        event: 'Notification',
        matcher: '',
        purpose: 'sends notifications',
        behavior: {
          notifies: true,
        },
      };

      const rule = hooks2rule.generateRuleFromSettingsAnalysis(analysis);
      expect(rule).toBe('When sending notifications, sends notifications');
    });
  });

  describe('Output Formats', () => {
    it('should output markdown format', async () => {
      const rules = [
        {
          name: 'typescript-validator.py',
          type: 'file',
          tier: 'tier1',
          rule: 'Before using tools, validates TypeScript syntax',
          eventType: 'PreToolUse',
          toolMatchers: ['Edit', 'Write'],
          path: '/test/path',
        },
      ];

      // Capture console output
      const originalLog = console.log;
      const output = [];
      console.log = (...args) => output.push(args.join(' '));

      await hooks2rule.outputMarkdownFormat(rules);

      console.log = originalLog;

      const fullOutput = output.join('\n');
      expect(fullOutput).toContain('# Claude Code Hook Rules');
      expect(fullOutput).toContain('## Tier 1 - Critical Security & Validation');
      expect(fullOutput).toContain('### typescript-validator.py');
      expect(fullOutput).toContain('Before using tools, validates TypeScript syntax');
    });

    it('should output CLAUDE.md format', async () => {
      const rules = [
        {
          name: 'test-hook',
          rule: 'Before using tools, validates input',
          tier: 'tier1',
          purpose: 'validates input',
        },
      ];

      // Capture console output
      const originalLog = console.log;
      const output = [];
      console.log = (...args) => output.push(args.join(' '));

      await hooks2rule.outputClaudeFormat(rules);

      console.log = originalLog;

      const fullOutput = output.join('\n');
      expect(fullOutput).toContain('# Hook Rules for Claude');
      expect(fullOutput).toContain('- Before using tools, validates input');
      expect(fullOutput).toContain('### TIER1');
    });

    it('should output JSON format', async () => {
      const rules = [
        {
          name: 'test-hook',
          rule: 'Test rule',
          type: 'file',
        },
      ];

      // Capture console output
      const originalLog = console.log;
      const output = [];
      console.log = (...args) => output.push(args.join(' '));

      await hooks2rule.outputRules(rules, { format: 'json' });

      console.log = originalLog;

      const jsonOutput = output.join('\n');
      const parsed = JSON.parse(jsonOutput);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('test-hook');
    });
  });

  describe('Comment Extraction', () => {
    it('should extract Python comments', () => {
      const content = `#!/usr/bin/env python3
# This is a comment
# Another comment
import sys
`;

      const comments = hooks2rule.extractComments(content);
      expect(comments).toContain('This is a comment');
      expect(comments).toContain('Another comment');
    });

    it('should extract multi-line comments', () => {
      const content = `
"""
This is a multi-line comment
describing the hook purpose
"""
import sys
`;

      const comments = hooks2rule.extractComments(content);
      expect(comments.some((c) => c.includes('multi-line comment'))).toBe(true);
    });
  });

  describe('Purpose Extraction from Commands', () => {
    it('should identify logging commands', () => {
      const command = 'jq -r \'"\(.tool_input.command)"\' >> ~/.claude/bash-command-log.txt';
      const purpose = hooks2rule.extractPurposeFromCommand(command);
      expect(purpose).toBe('logs information');
    });

    it('should identify formatting commands', () => {
      const command = 'prettier --write "$FILE"';
      const purpose = hooks2rule.extractPurposeFromCommand(command);
      expect(purpose).toBe('formats code');
    });

    it('should identify linting commands', () => {
      const command = 'eslint --fix "$FILE"';
      const purpose = hooks2rule.extractPurposeFromCommand(command);
      expect(purpose).toBe('lints code');
    });

    it('should identify validation commands', () => {
      const command = '/usr/local/bin/validate-typescript.sh "$FILE"';
      const purpose = hooks2rule.extractPurposeFromCommand(command);
      expect(purpose).toBe('validates or checks');
    });
  });

  describe('Integration Tests', () => {
    it('should analyze complete hook ecosystem', async () => {
      // Create a realistic hook setup
      const hooksDir = path.join(tempDir, '.claude', 'hooks');
      const tier1Dir = path.join(hooksDir, 'tier1');
      const settingsDir = path.join(tempDir, '.claude');

      await fs.ensureDir(tier1Dir);
      await fs.ensureDir(settingsDir);

      // File-based hook
      const hookContent = `#!/usr/bin/env python3
# Purpose: Validate TypeScript syntax before editing .ts/.tsx files
import json
import sys
import subprocess

def validate_typescript():
    input_data = json.load(sys.stdin)
    tool_name = input_data.get("tool_name", "")
    
    if tool_name in ["Edit", "Write", "MultiEdit"]:
        file_path = input_data.get("tool_input", {}).get("file_path", "")
        if file_path.endswith(('.ts', '.tsx')):
            try:
                result = subprocess.run(['tsc', '--noEmit', file_path], 
                                      capture_output=True, text=True)
                if result.returncode != 0:
                    print(f"TypeScript validation failed: {result.stderr}", file=sys.stderr)
                    sys.exit(2)
            except Exception as e:
                print(f"Error running TypeScript validation: {e}", file=sys.stderr)
                sys.exit(2)

if __name__ == "__main__":
    validate_typescript()
`;

      await fs.writeFile(path.join(tier1Dir, 'typescript-validator.py'), hookContent);

      // Settings-based hook
      const settings = {
        hooks: {
          PreToolUse: [
            {
              matcher: 'Bash',
              hooks: [
                {
                  type: 'command',
                  command:
                    'jq -r \'"\(.tool_input.command) - \(.tool_input.description // "No description")"\' >> ~/.claude/bash-command-log.txt',
                },
              ],
            },
          ],
          PostToolUse: [
            {
              matcher: 'Write|Edit|MultiEdit',
              hooks: [
                {
                  type: 'command',
                  command: 'prettier --write "$FILE" 2>/dev/null || true',
                },
              ],
            },
          ],
        },
      };

      await fs.writeJson(path.join(settingsDir, 'settings.json'), settings);

      // Analyze the complete setup
      const rules = await hooks2rule.generateRules(await hooks2rule.discoverHooks());

      expect(rules).toHaveLength(3);

      // Check file-based hook
      const fileHook = rules.find((r) => r.name === 'typescript-validator.py');
      expect(fileHook).toBeDefined();
      expect(fileHook.tier).toBe('tier1');
      expect(fileHook.rule).toContain('TypeScript syntax');

      // Check settings-based hooks
      const bashHook = rules.find((r) => r.event === 'PreToolUse' && r.matcher === 'Bash');
      expect(bashHook).toBeDefined();
      expect(bashHook.rule).toContain('logs information');

      const formattingHook = rules.find((r) => r.event === 'PostToolUse');
      expect(formattingHook).toBeDefined();
      expect(formattingHook.rule).toContain('formats code');
    });
  });
});
