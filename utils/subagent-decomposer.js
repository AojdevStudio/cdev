#!/usr/bin/env node

/**
 * Sub-agent Decomposer - Intelligent task decomposition for concurrent sub-agents
 * 
 * This module specializes in decomposing tasks for concurrent execution
 * within a single Claude instance using the Task tool for sub-agent spawning.
 * 
 * Key differences from parallel decomposer:
 * - Optimized for single worktree (no git worktrees)
 * - Focuses on concurrent sub-agent execution
 * - Designed for orchestration within one Claude conversation
 * - Handles various input formats (markdown, text, JSON)
 */

const fs = require('node:fs').promises;
const path = require('node:path');
const crypto = require('node:crypto');

// Load environment variables from .env file
try {
  require('dotenv').config();
} catch (error) {
  console.warn('dotenv package not found. Using system environment variables.');
}

// Use node-fetch for older Node.js versions
let fetch;
if (typeof global.fetch === 'undefined') {
  try {
    fetch = require('node-fetch');
  } catch (error) {
    console.error('❌ node-fetch is required for Node.js < 18. Install with: npm install node-fetch');
    process.exit(1);
  }
} else {
  fetch = global.fetch;
}

class SubagentDecomposer {
  constructor() {
    this.projectRoot = process.cwd();
    this.cacheDir = path.join(this.projectRoot, '.cache', 'subagent-decomposition');
    this.llmProvider = process.env.LLM_PROVIDER || 'openai';
    this.llmModel = process.env.LLM_MODEL || 'gpt-4';
    this.apiKey = this.getApiKey();
    
    // Log configuration on startup
    if (this.apiKey) {
      console.log(`🔑 LLM configured: ${this.llmProvider} (${this.llmModel})`);
    } else {
      console.warn('⚠️  No LLM API key found - will use rule-based analysis only');
    }
    
    this.ensureCacheDir();
  }

  /**
   * Get the appropriate API key based on the selected provider
   */
  getApiKey() {
    switch (this.llmProvider) {
      case 'openai':
        return process.env.OPENAI_API_KEY;
      case 'anthropic':
        return process.env.ANTHROPIC_API_KEY;
      case 'openrouter':
        return process.env.OPENROUTER_API_KEY;
      case 'ollama':
        return null; // Ollama doesn't require an API key for local instances
      default:
        return process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_API_KEY;
    }
  }

  async ensureCacheDir() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  /**
   * Main decomposition method for sub-agents
   */
  async decomposeForSubagents(tasks, projectContext = {}) {
    console.log('🔍 Starting sub-agent decomposition analysis...');
    
    try {
      // Check if API keys are configured
      if (!this.apiKey && this.llmProvider !== 'ollama') {
        console.log('⚠️  No API key found, using rule-based analysis only');
        return await this.analyzeWithRules(tasks, projectContext);
      }
      
      // Try LLM analysis for intelligent grouping
      try {
        console.log('🤖 Using LLM for intelligent concurrent sub-agent grouping...');
        const llmResult = await this.analyzeWithLLM(tasks, projectContext);
        return llmResult;
      } catch (llmError) {
        console.warn(`⚠️  LLM analysis failed: ${llmError.message}`);
        console.log('🔄 Falling back to rule-based analysis...');
        
        // Fallback to rule-based analysis
        const ruleBasedResult = await this.analyzeWithRules(tasks, projectContext);
        console.log(`✅ Rule-based analysis completed`);
        return ruleBasedResult;
      }
      
    } catch (error) {
      console.error('❌ Sub-agent decomposition failed:', error.message);
      throw error;
    }
  }

  /**
   * Rule-based analysis for common task patterns
   */
  async analyzeWithRules(tasks, projectContext) {
    const taskGroups = {
      validation: [],
      documentation: [],
      configuration: [],
      testing: [],
      security: [],
      publishing: [],
      general: []
    };

    // Categorize tasks based on keywords
    const patterns = {
      validation: /\b(lint|format|check|validate|quality|eslint|prettier)\b/i,
      documentation: /\b(readme|changelog|docs|documentation|api doc|guide)\b/i,
      configuration: /\b(package\.json|config|version|name|dependency|dependencies)\b/i,
      testing: /\b(test|spec|coverage|jest|mocha|unit|integration)\b/i,
      security: /\b(security|audit|vulnerability|secret|token|api key)\b/i,
      publishing: /\b(publish|npm|release|deploy|tag|push)\b/i
    };

    // Categorize each task
    for (const task of tasks) {
      const taskText = typeof task === 'string' ? task : task.text || task.content || '';
      let categorized = false;

      for (const [category, pattern] of Object.entries(patterns)) {
        if (pattern.test(taskText)) {
          taskGroups[category].push(task);
          categorized = true;
          break;
        }
      }

      if (!categorized) {
        taskGroups.general.push(task);
      }
    }

    // Convert to sub-agent structure
    const subagents = [];
    
    for (const [category, categoryTasks] of Object.entries(taskGroups)) {
      if (categoryTasks.length > 0) {
        subagents.push({
          agentId: `${category}_subagent`,
          agentRole: `${category.charAt(0).toUpperCase() + category.slice(1)} Tasks`,
          focusArea: category,
          tasks: categoryTasks,
          canStartImmediately: !['publishing'].includes(category), // Publishing waits
          dependencies: category === 'publishing' ? ['validation', 'testing', 'configuration'] : [],
          estimatedTime: categoryTasks.length * 5 // Simple estimate
        });
      }
    }

    return {
      strategy: 'concurrent_subagents',
      confidence: 0.7,
      subagents: subagents,
      orchestrationPlan: {
        phases: [
          {
            phase: 1,
            concurrent: subagents.filter(a => a.canStartImmediately).map(a => a.agentId),
            description: 'Run validation, testing, documentation, and configuration concurrently'
          },
          {
            phase: 2,
            concurrent: subagents.filter(a => !a.canStartImmediately).map(a => a.agentId),
            description: 'Run publishing tasks after prerequisites complete'
          }
        ]
      }
    };
  }

  /**
   * LLM analysis for intelligent sub-agent grouping
   */
  async analyzeWithLLM(tasks, projectContext) {
    const cacheKey = this.getCacheKey(tasks, projectContext);
    const cached = await this.getCachedResult(cacheKey);
    
    if (cached) {
      console.log('📋 Using cached LLM result');
      return cached;
    }

    const prompt = this.buildSubagentPrompt(tasks, projectContext);
    const response = await this.callLLM(prompt);
    const result = this.parseLLMResponse(response);

    await this.cacheResult(cacheKey, result);
    return result;
  }

  /**
   * Build prompt specifically for sub-agent decomposition
   */
  buildSubagentPrompt(tasks, projectContext) {
    const taskList = Array.isArray(tasks) ? tasks : [tasks];
    const formattedTasks = taskList.map((task, idx) => {
      if (typeof task === 'string') {
        return `${idx + 1}. ${task}`;
      }
      return `${idx + 1}. ${task.text || task.content || JSON.stringify(task)}`;
    }).join('\n');

    return `You are an expert at organizing tasks for CONCURRENT SUB-AGENT execution within a single Claude instance.

CONTEXT:
- Tasks will be executed by sub-agents spawned using the Task tool
- All sub-agents work in the SAME directory (no git worktrees)
- Sub-agents should run CONCURRENTLY when possible
- The main agent will orchestrate and monitor all sub-agents
- Goal: Maximize parallel execution while avoiding conflicts

TASKS TO ORGANIZE:
${formattedTasks}

PROJECT CONTEXT:
${JSON.stringify(projectContext, null, 2)}

INSTRUCTIONS:
1. Group related tasks that can be handled by a single sub-agent
2. Identify which sub-agents can run concurrently (no shared resources/conflicts)
3. Identify dependencies between sub-agents
4. Create an orchestration plan with concurrent phases

IMPORTANT CONSIDERATIONS:
- File operations should be grouped to avoid conflicts
- Tests can usually run concurrently with documentation updates
- Configuration changes might need to happen before or after other tasks
- Publishing/deployment tasks typically happen last
- Security and validation checks can often run in parallel

Return your analysis as a JSON object:
{
  "strategy": "concurrent_subagents",
  "confidence": 0.95,
  "reasoning": "Brief explanation of the grouping strategy",
  "subagents": [
    {
      "agentId": "validation_subagent",
      "agentRole": "Code Quality and Validation",
      "focusArea": "validation",
      "tasks": ["Run all tests", "Check linting", "Format check"],
      "canStartImmediately": true,
      "dependencies": [],
      "estimatedTime": 30,
      "resources": ["test files", "source code read-only"]
    }
  ],
  "orchestrationPlan": {
    "phases": [
      {
        "phase": 1,
        "concurrent": ["validation_subagent", "documentation_subagent"],
        "description": "Run validation and documentation updates in parallel"
      },
      {
        "phase": 2,
        "concurrent": ["publishing_subagent"],
        "description": "Publish after validation completes"
      }
    ],
    "criticalPath": ["validation_subagent", "publishing_subagent"],
    "estimatedTotalTime": 45
  },
  "potentialConflicts": ["List any identified resource conflicts"],
  "optimizationNotes": "Suggestions for better concurrency if any"
}

Focus on creating sub-agents that can work independently and concurrently to minimize total execution time.`;
  }

  /**
   * Call LLM API (reuses methods from parent class)
   */
  async callLLM(prompt) {
    switch (this.llmProvider) {
      case 'openai':
        return await this.callOpenAI(prompt);
      case 'anthropic':
        return await this.callAnthropic(prompt);
      case 'openrouter':
        return await this.callOpenRouter(prompt);
      case 'ollama':
        return await this.callOllama(prompt);
      default:
        throw new Error(`Unsupported LLM provider: ${this.llmProvider}`);
    }
  }

  // API call methods (same as LLMDecomposer)
  async callOpenAI(prompt) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not found. Set OPENAI_API_KEY environment variable.');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.llmModel,
        messages: [
          { role: 'system', content: 'You are an expert at organizing tasks for concurrent sub-agent execution.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async callAnthropic(prompt) {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not found. Set ANTHROPIC_API_KEY environment variable.');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.llmModel || 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  async callOpenRouter(prompt) {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not found. Set OPENROUTER_API_KEY environment variable.');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/paralell-development-claude',
        'X-Title': 'Sub-agent Decomposer'
      },
      body: JSON.stringify({
        model: this.llmModel,
        messages: [
          { role: 'system', content: 'You are an expert at organizing tasks for concurrent sub-agent execution.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async callOllama(prompt) {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.llmModel || 'llama2',
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  }

  /**
   * Parse and validate LLM response
   */
  parseLLMResponse(response) {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in LLM response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsed.subagents || !Array.isArray(parsed.subagents)) {
        throw new Error('Invalid LLM response structure - missing subagents array');
      }

      if (!parsed.orchestrationPlan) {
        throw new Error('Invalid LLM response structure - missing orchestrationPlan');
      }

      // Ensure high confidence for LLM results
      parsed.confidence = Math.max(parsed.confidence || 0.9, 0.9);
      
      return parsed;
    } catch (error) {
      console.error('Failed to parse LLM response:', error.message);
      throw new Error('Failed to parse LLM response');
    }
  }

  /**
   * Generate cache key
   */
  getCacheKey(tasks, projectContext) {
    const content = JSON.stringify({ tasks, projectContext, model: this.llmModel });
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Get cached result
   */
  async getCachedResult(cacheKey) {
    try {
      const cacheFile = path.join(this.cacheDir, `${cacheKey}.json`);
      const cached = await fs.readFile(cacheFile, 'utf8');
      const result = JSON.parse(cached);
      
      // Check if cache is not too old (24 hours)
      const age = Date.now() - result.timestamp;
      if (age > 24 * 60 * 60 * 1000) {
        return null;
      }
      
      return result.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Cache result
   */
  async cacheResult(cacheKey, result) {
    try {
      const cacheFile = path.join(this.cacheDir, `${cacheKey}.json`);
      const cacheData = {
        timestamp: Date.now(),
        data: result
      };
      await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      console.warn('Failed to cache result:', error.message);
    }
  }

  /**
   * Convert decomposition result to agent contexts
   */
  async generateAgentContexts(decomposition, taskSource) {
    const contexts = [];

    for (const subagent of decomposition.subagents) {
      const context = {
        identity: {
          agentId: subagent.agentId,
          taskId: `subagent_${Date.now()}_${subagent.agentId}`,
          agentRole: subagent.agentRole,
          focusArea: subagent.focusArea,
          taskSource: taskSource
        },
        execution: {
          canStartImmediately: subagent.canStartImmediately,
          dependencies: subagent.dependencies || [],
          estimatedTime: subagent.estimatedTime
        },
        deliverables: {
          tasks: subagent.tasks,
          validationCriteria: subagent.tasks.map(task => `Complete: ${task}`),
          successMetrics: [`All ${subagent.focusArea} tasks completed successfully`]
        },
        orchestration: {
          phase: decomposition.orchestrationPlan.phases.findIndex(p => 
            p.concurrent.includes(subagent.agentId)
          ) + 1,
          concurrentWith: decomposition.orchestrationPlan.phases
            .find(p => p.concurrent.includes(subagent.agentId))
            ?.concurrent.filter(id => id !== subagent.agentId) || []
        }
      };

      contexts.push(context);
    }

    return {
      contexts,
      orchestrationPlan: decomposition.orchestrationPlan,
      strategy: decomposition.strategy
    };
  }
}

module.exports = { SubagentDecomposer };