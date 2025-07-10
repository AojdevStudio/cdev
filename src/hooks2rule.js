#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Hooks2Rule - Analyze existing Claude Code hooks and generate rules
 * This command intelligently evaluates hook files and extracts the rules they implement
 */
class Hooks2Rule {
  constructor() {
    this.projectPath = process.cwd();
    this.hooksPath = path.join(this.projectPath, '.claude', 'hooks');
    this.settingsPath = path.join(this.projectPath, '.claude', 'settings.json');
    this.userSettingsPath = path.join(process.env.HOME || process.env.USERPROFILE, '.claude', 'settings.json');
  }

  /**
   * Main entry point for the hooks2rule command
   */
  async analyze(options = {}) {
    try {
      console.log('🔍 Analyzing Claude Code hooks...\n');

      // Discover hooks from various sources
      const hooks = await this.discoverHooks();
      
      if (hooks.length === 0) {
        console.log('No hooks found to analyze.');
        return;
      }

      console.log(`Found ${hooks.length} hooks to analyze\n`);

      // Analyze each hook to extract rules
      const rules = await this.generateRules(hooks);
      
      console.log(`Generated ${rules.length} rules\n`);

      // Output the rules
      await this.outputRules(rules, options);

    } catch (error) {
      console.error('Error analyzing hooks:', error.message);
      process.exit(1);
    }
  }

  /**
   * Discover hooks from all possible sources
   */
  async discoverHooks() {
    const hooks = [];

    // 1. File-based hooks in .claude/hooks directory
    const fileHooks = await this.discoverFileHooks();
    hooks.push(...fileHooks);

    // 2. Settings-based hooks
    const settingsHooks = await this.discoverSettingsHooks();
    hooks.push(...settingsHooks);

    return hooks;
  }

  /**
   * Discover file-based hooks in .claude/hooks directory
   */
  async discoverFileHooks() {
    const hooks = [];

    if (!await fs.pathExists(this.hooksPath)) {
      return hooks;
    }

    const discoverInDir = async (dir, tier = null) => {
      const files = await fs.readdir(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isDirectory()) {
          // Recursively check subdirectories (like tier1, tier2, etc.)
          await discoverInDir(filePath, file);
        } else if (file.endsWith('.py') || file.endsWith('.sh') || file.endsWith('.js')) {
          const content = await fs.readFile(filePath, 'utf-8');
          
          hooks.push({
            type: 'file',
            name: file,
            path: filePath,
            content,
            tier,
            size: stat.size,
            modified: stat.mtime
          });
        }
      }
    };

    await discoverInDir(this.hooksPath);
    return hooks;
  }

  /**
   * Discover hooks configured in settings.json files
   */
  async discoverSettingsHooks() {
    const hooks = [];
    const settingsFiles = [this.settingsPath, this.userSettingsPath];

    for (const settingsFile of settingsFiles) {
      if (await fs.pathExists(settingsFile)) {
        try {
          const settings = await fs.readJson(settingsFile);
          const hooksConfig = settings.hooks || {};

          for (const [event, matchers] of Object.entries(hooksConfig)) {
            if (Array.isArray(matchers)) {
              for (const matcher of matchers) {
                for (const hook of matcher.hooks || []) {
                  hooks.push({
                    type: 'settings',
                    event,
                    matcher: matcher.matcher,
                    command: hook.command,
                    timeout: hook.timeout,
                    source: settingsFile
                  });
                }
              }
            }
          }
        } catch (error) {
          console.warn(`Warning: Could not parse settings file ${settingsFile}: ${error.message}`);
        }
      }
    }

    return hooks;
  }

  /**
   * Generate rules from discovered hooks
   */
  async generateRules(hooks) {
    const rules = [];

    for (const hook of hooks) {
      try {
        const rule = await this.analyzeHook(hook);
        if (rule) {
          rules.push(rule);
        }
      } catch (error) {
        console.warn(`Warning: Could not analyze hook ${hook.name || hook.type}: ${error.message}`);
      }
    }

    return rules;
  }

  /**
   * Analyze a single hook to extract its rule
   */
  async analyzeHook(hook) {
    if (hook.type === 'file') {
      return this.analyzeFileHook(hook);
    } else if (hook.type === 'settings') {
      return this.analyzeSettingsHook(hook);
    }
    return null;
  }

  /**
   * Analyze a file-based hook
   */
  analyzeFileHook(hook) {
    const analysis = {
      name: hook.name,
      type: 'file',
      path: hook.path,
      tier: hook.tier,
      purpose: this.extractPurpose(hook),
      eventType: this.detectEventType(hook),
      toolMatchers: this.extractToolMatchers(hook),
      behavior: this.analyzeBehavior(hook),
      security: this.analyzeSecurityFeatures(hook),
      rule: null
    };

    // Generate human-readable rule
    analysis.rule = this.generateRuleFromAnalysis(analysis);

    return analysis;
  }

  /**
   * Analyze a settings-based hook
   */
  analyzeSettingsHook(hook) {
    const analysis = {
      name: `${hook.event} ${hook.matcher || 'all tools'}`,
      type: 'settings',
      event: hook.event,
      matcher: hook.matcher,
      command: hook.command,
      timeout: hook.timeout,
      source: hook.source,
      purpose: this.extractPurposeFromCommand(hook.command),
      behavior: this.analyzeBehaviorFromCommand(hook.command),
      rule: null
    };

    // Generate human-readable rule
    analysis.rule = this.generateRuleFromSettingsAnalysis(analysis);

    return analysis;
  }

  /**
   * Extract purpose from hook file content
   */
  extractPurpose(hook) {
    const content = hook.content.toLowerCase();
    const comments = this.extractComments(hook.content);
    
    // Look for explicit purpose statements
    const purposePatterns = [
      /purpose:\s*(.+)/i,
      /description:\s*(.+)/i,
      /what it does:\s*(.+)/i,
      /this hook\s+(.+)/i
    ];

    for (const comment of comments) {
      for (const pattern of purposePatterns) {
        const match = comment.match(pattern);
        if (match) {
          return match[1].trim();
        }
      }
    }

    // Infer purpose from filename and content
    if (hook.name.includes('validator')) {
      return 'validates code or input';
    }
    if (hook.name.includes('enforcer')) {
      return 'enforces rules or standards';
    }
    if (hook.name.includes('checker')) {
      return 'checks code quality or standards';
    }
    if (hook.name.includes('reporter')) {
      return 'reports on code quality or metrics';
    }
    if (hook.name.includes('organizer')) {
      return 'organizes code structure';
    }
    if (hook.name.includes('notification')) {
      return 'sends notifications';
    }
    if (hook.name.includes('linter')) {
      return 'lints code for errors';
    }

    return 'performs automated task';
  }

  /**
   * Extract purpose from command string
   */
  extractPurposeFromCommand(command) {
    if (command.includes('jq') && command.includes('log')) {
      return 'logs information';
    }
    if (command.includes('prettier') || command.includes('format')) {
      return 'formats code';
    }
    if (command.includes('lint')) {
      return 'lints code';
    }
    if (command.includes('notify') || command.includes('notification')) {
      return 'sends notifications';
    }
    if (command.includes('validate') || command.includes('check')) {
      return 'validates or checks';
    }
    if (command.includes('test')) {
      return 'runs tests';
    }
    
    return 'executes command';
  }

  /**
   * Detect event type from hook content
   */
  detectEventType(hook) {
    const content = hook.content.toLowerCase();
    
    if (content.includes('pretooluse') || content.includes('pre_tool_use')) {
      return 'PreToolUse';
    }
    if (content.includes('posttooluse') || content.includes('post_tool_use')) {
      return 'PostToolUse';
    }
    if (content.includes('notification')) {
      return 'Notification';
    }
    if (content.includes('stop')) {
      return 'Stop';
    }
    if (content.includes('subagent')) {
      return 'SubagentStop';
    }

    // Try to infer from filename
    if (hook.name.includes('pre_tool_use')) {
      return 'PreToolUse';
    }
    if (hook.name.includes('post_tool_use')) {
      return 'PostToolUse';
    }
    if (hook.name.includes('notification')) {
      return 'Notification';
    }
    if (hook.name.includes('stop')) {
      return 'Stop';
    }

    return 'Unknown';
  }

  /**
   * Extract tool matchers from hook content
   */
  extractToolMatchers(hook) {
    const content = hook.content || '';
    const matchers = [];

    // Look for tool name patterns
    const toolPatterns = [
      /tool_name.*["']([^"']+)["']/gi,
      /matcher.*["']([^"']+)["']/gi,
      /\b(Bash|Write|Edit|MultiEdit|Read|Glob|Grep|Task|WebFetch|WebSearch)\b/gi
    ];

    for (const pattern of toolPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        matchers.push(...matches);
      }
    }

    return [...new Set(matchers)]; // Remove duplicates
  }

  /**
   * Analyze behavior from hook content
   */
  analyzeBehavior(hook) {
    const content = hook.content.toLowerCase();
    const behavior = {
      blocks: content.includes('exit(2)') || content.includes('sys.exit(2)'),
      logs: content.includes('log') || content.includes('print'),
      modifies: content.includes('write') || content.includes('modify'),
      validates: content.includes('validate') || content.includes('check'),
      formats: content.includes('format') || content.includes('prettier'),
      notifies: content.includes('notify') || content.includes('notification'),
      async: content.includes('async') || content.includes('await'),
      usesApi: content.includes('request') || content.includes('fetch') || content.includes('api')
    };

    return behavior;
  }

  /**
   * Analyze behavior from command string
   */
  analyzeBehaviorFromCommand(command) {
    const behavior = {
      blocks: command.includes('exit 2'),
      logs: command.includes('log') || command.includes('>>'),
      modifies: command.includes('write') || command.includes('>'),
      validates: command.includes('validate') || command.includes('check'),
      formats: command.includes('format') || command.includes('prettier'),
      notifies: command.includes('notify') || command.includes('notification'),
      async: false,
      usesApi: command.includes('curl') || command.includes('wget') || command.includes('api')
    };

    return behavior;
  }

  /**
   * Analyze security features
   */
  analyzeSecurityFeatures(hook) {
    const content = hook.content.toLowerCase();
    
    return {
      hasPathValidation: content.includes('path') && (content.includes('validate') || content.includes('check')),
      hasInputSanitization: content.includes('sanitize') || content.includes('escape'),
      hasPermissionChecks: content.includes('permission') || content.includes('access'),
      blocksSensitiveOps: content.includes('sensitive') || content.includes('block'),
      hasSecurityKeywords: /security|auth|permission|access|sensitive/.test(content)
    };
  }

  /**
   * Generate a human-readable rule from analysis
   */
  generateRuleFromAnalysis(analysis) {
    const { name, purpose, eventType, behavior, tier } = analysis;
    
    let rule = '';
    
    // Start with the event type
    if (eventType === 'PreToolUse') {
      rule += 'Before using tools, ';
    } else if (eventType === 'PostToolUse') {
      rule += 'After using tools, ';
    } else if (eventType === 'Notification') {
      rule += 'When sending notifications, ';
    } else if (eventType === 'Stop') {
      rule += 'When stopping, ';
    }

    // Add the main purpose
    rule += purpose;

    // Add behavior details
    if (behavior.blocks) {
      rule += ' and block execution if validation fails';
    }
    if (behavior.logs) {
      rule += ' and log the activity';
    }
    if (behavior.formats) {
      rule += ' and format the code';
    }
    if (behavior.notifies) {
      rule += ' and send notifications';
    }

    // Add tier information
    if (tier) {
      rule += ` (${tier} hook)`;
    }

    return rule;
  }

  /**
   * Generate rule from settings analysis
   */
  generateRuleFromSettingsAnalysis(analysis) {
    const { event, matcher, purpose, behavior } = analysis;
    
    let rule = '';
    
    // Event context
    if (event === 'PreToolUse') {
      rule += 'Before using ';
    } else if (event === 'PostToolUse') {
      rule += 'After using ';
    } else if (event === 'Notification') {
      rule += 'When sending notifications, ';
    } else if (event === 'Stop') {
      rule += 'When stopping, ';
    }

    // Tool matcher context
    if (matcher && event !== 'Notification' && event !== 'Stop') {
      rule += `${matcher} tools, `;
    }

    // Purpose
    rule += purpose;

    // Behavior
    if (behavior.blocks) {
      rule += ' and block if needed';
    }
    if (behavior.logs) {
      rule += ' and log to file';
    }
    if (behavior.formats) {
      rule += ' and format code';
    }

    return rule;
  }

  /**
   * Extract comments from file content
   */
  extractComments(content) {
    const comments = [];
    
    // Python comments
    const pythonComments = content.match(/^#.*$/gm) || [];
    comments.push(...pythonComments.map(c => c.replace(/^#\s*/, '')));
    
    // Shell comments
    const shellComments = content.match(/^#.*$/gm) || [];
    comments.push(...shellComments.map(c => c.replace(/^#\s*/, '')));
    
    // Multi-line comments
    const multilineComments = content.match(/"""[\s\S]*?"""/g) || [];
    comments.push(...multilineComments.map(c => c.replace(/"""/g, '')));
    
    return comments;
  }

  /**
   * Output rules in the specified format
   */
  async outputRules(rules, options) {
    const format = options.format || 'markdown';
    
    switch (format) {
      case 'json':
        console.log(JSON.stringify(rules, null, 2));
        break;
      case 'claude':
        await this.outputClaudeFormat(rules);
        break;
      case 'markdown':
      default:
        await this.outputMarkdownFormat(rules);
        break;
    }
  }

  /**
   * Output rules in Markdown format
   */
  async outputMarkdownFormat(rules) {
    console.log('# Claude Code Hook Rules\n');
    console.log('*Generated from existing hooks*\n');

    const rulesByTier = {
      tier1: [],
      tier2: [],
      tier3: [],
      settings: [],
      utils: [],
      unknown: []
    };

    // Categorize rules
    for (const rule of rules) {
      if (!rule) continue; // Skip undefined rules
      
      try {
        if (rule.tier && rulesByTier[rule.tier]) {
          rulesByTier[rule.tier].push(rule);
        } else if (rule.tier) {
          // Handle unknown tiers by adding them to utils
          if (!rulesByTier[rule.tier]) {
            rulesByTier[rule.tier] = [];
          }
          rulesByTier[rule.tier].push(rule);
        } else if (rule.type === 'settings') {
          rulesByTier.settings.push(rule);
        } else {
          rulesByTier.unknown.push(rule);
        }
      } catch (error) {
        console.warn(`Error categorizing rule:`, error.message, rule);
      }
    }

    // Output by tier
    for (const [tier, tierRules] of Object.entries(rulesByTier)) {
      if (tierRules.length === 0) continue;

      const tierName = {
        tier1: 'Tier 1 - Critical Security & Validation',
        tier2: 'Tier 2 - Important Quality & Standards',
        tier3: 'Tier 3 - Optional Convenience',
        settings: 'Settings-Based Hooks',
        utils: 'Utility Hooks',
        llm: 'LLM Integration Hooks',
        tts: 'Text-to-Speech Hooks',
        unknown: 'Other Hooks'
      }[tier] || `${tier.charAt(0).toUpperCase() + tier.slice(1)} Hooks`;

      console.log(`## ${tierName}\n`);

      for (const rule of tierRules) {
        console.log(`### ${rule.name}`);
        console.log(`**Rule:** ${rule.rule}\n`);
        
        if (rule.type === 'file') {
          console.log(`- **File:** ${rule.path}`);
          console.log(`- **Event:** ${rule.eventType}`);
          if (rule.toolMatchers.length > 0) {
            console.log(`- **Tools:** ${rule.toolMatchers.join(', ')}`);
          }
        } else if (rule.type === 'settings') {
          console.log(`- **Event:** ${rule.event}`);
          console.log(`- **Matcher:** ${rule.matcher || 'all tools'}`);
          console.log(`- **Command:** \`${rule.command}\``);
        }
        
        console.log();
      }
    }

    // Summary
    console.log('## Summary\n');
    console.log(`Total rules analyzed: ${rules.length}`);
    console.log(`- Tier 1 (Critical): ${rulesByTier.tier1.length}`);
    console.log(`- Tier 2 (Important): ${rulesByTier.tier2.length}`);
    console.log(`- Tier 3 (Optional): ${rulesByTier.tier3.length}`);
    console.log(`- Settings-based: ${rulesByTier.settings.length}`);
    console.log(`- Other: ${rulesByTier.unknown.length}`);
  }

  /**
   * Output rules in CLAUDE.md format
   */
  async outputClaudeFormat(rules) {
    console.log('# Hook Rules for Claude\n');
    console.log('These rules describe the behavior of configured hooks:\n');

    for (const rule of rules) {
      console.log(`- ${rule.rule}`);
    }

    console.log('\n## Hook Categories\n');
    
    const categories = {};
    for (const rule of rules) {
      const category = rule.tier || 'settings';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(rule);
    }

    for (const [category, categoryRules] of Object.entries(categories)) {
      console.log(`### ${category.toUpperCase()}\n`);
      for (const rule of categoryRules) {
        console.log(`- ${rule.name}: ${rule.purpose}`);
      }
      console.log();
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--format') {
      options.format = args[++i];
    } else if (arg === '--output') {
      options.output = args[++i];
    } else if (arg === '--help') {
      console.log(`
Usage: node hooks2rule.js [options]

Options:
  --format <format>   Output format (markdown, json, claude) [default: markdown]
  --output <file>     Output to file instead of stdout
  --help              Show this help message

Examples:
  node hooks2rule.js
  node hooks2rule.js --format json
  node hooks2rule.js --format claude --output CLAUDE.md
      `);
      process.exit(0);
    }
  }

  const analyzer = new Hooks2Rule();
  analyzer.analyze(options).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = Hooks2Rule;