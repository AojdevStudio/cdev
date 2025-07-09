#!/usr/bin/env node

/**
 * LLM Decomposer - Hybrid Rule-Based + LLM Task Decomposition
 * 
 * This module provides intelligent task decomposition using:
 * 1. Fast rule-based analysis for common patterns
 * 2. LLM analysis for complex/ambiguous cases
 * 3. Caching for cost optimization
 * 
 * Supported LLM providers:
 * - OpenAI (GPT-4, GPT-3.5-turbo)
 * - Anthropic Claude (via API)
 * - Local models (Ollama)
 */

const fs = require('node:fs').promises;
const path = require('node:path');
const crypto = require('node:crypto');

// Load environment variables from .env file
try {
  require('dotenv').config();
} catch (error) {
  console.warn('dotenv package not found. Install with: npm install dotenv');
}

class LLMDecomposer {
  constructor() {
    this.projectRoot = process.cwd();
    this.cacheDir = path.join(this.projectRoot, '.cache', 'llm-decomposition');
    this.llmProvider = process.env.LLM_PROVIDER || 'openai';
    this.llmModel = process.env.LLM_MODEL || 'gpt-4';
    this.apiKey = this.getApiKey();
    this.confidenceThreshold = 0.8;
    
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
   * Main decomposition method - tries rule-based first, falls back to LLM
   */
  async decompose(issueDescription, projectContext = {}) {
    console.log('🔍 Starting LLM-powered decomposition analysis...');
    
    try {
      // Check if API keys are configured
      if (!this.apiKey) {
        console.log('⚠️  No API key found, using rule-based analysis only');
        return await this.analyzeWithRules(issueDescription, projectContext);
      }
      
      // Try LLM analysis first (primary method)
      try {
        console.log('🤖 Attempting LLM analysis...');
        const llmResult = await this.analyzeWithLLM(issueDescription, projectContext, null);
        return llmResult;
      } catch (llmError) {
        console.warn(`⚠️  LLM analysis failed: ${llmError.message}`);
        console.log('🔄 Falling back to rule-based analysis...');
        
        // Fallback to rule-based analysis
        const ruleBasedResult = await this.analyzeWithRules(issueDescription, projectContext);
        console.log(`✅ Rule-based analysis completed (confidence: ${ruleBasedResult.confidence})`);
        return ruleBasedResult;
      }
      
    } catch (error) {
      console.error('❌ Decomposition failed:', error.message);
      throw error;
    }
  }

  /**
   * Rule-based analysis with confidence scoring
   */
  async analyzeWithRules(description, projectContext) {
    const analysis = {
      projectType: 'unknown',
      confidence: 0,
      domains: [],
      agents: [],
      reasoning: []
    };

    // Project type detection patterns
    const projectTypePatterns = [
      {
        type: 'cli-tool',
        patterns: ['npx', 'command line', 'cli', 'terminal', 'bin/', 'executable'],
        weight: 0.3
      },
      {
        type: 'web-app',
        patterns: ['react', 'next.js', 'vue', 'angular', 'frontend', 'backend', 'api'],
        weight: 0.2
      },
      {
        type: 'library',
        patterns: ['library', 'package', 'npm', 'module', 'sdk'],
        weight: 0.25
      },
      {
        type: 'mobile-app',
        patterns: ['react native', 'flutter', 'ios', 'android', 'mobile'],
        weight: 0.3
      },
      {
        type: 'desktop-app',
        patterns: ['electron', 'desktop', 'native', 'gui'],
        weight: 0.3
      },
      {
        type: 'infrastructure',
        patterns: ['docker', 'kubernetes', 'deployment', 'ci/cd', 'infrastructure'],
        weight: 0.25
      }
    ];

    const descLower = description.toLowerCase();
    let maxScore = 0;
    let bestType = 'unknown';

    // Calculate project type scores
    for (const pattern of projectTypePatterns) {
      let score = 0;
      for (const keyword of pattern.patterns) {
        if (descLower.includes(keyword)) {
          score += pattern.weight;
        }
      }
      
      if (score > maxScore) {
        maxScore = score;
        bestType = pattern.type;
      }
    }

    analysis.projectType = bestType;
    analysis.confidence = Math.min(maxScore, 1.0);
    analysis.reasoning.push(`Detected project type: ${bestType} (confidence: ${analysis.confidence})`);

    // Generate domain-specific suggestions based on project type
    if (analysis.confidence >= 0.5) {
      analysis.domains = this.generateDomainsForProjectType(bestType, descLower);
      analysis.agents = this.generateAgentsForDomains(analysis.domains, bestType);
    }

    return analysis;
  }

  /**
   * Generate logical domains based on project type
   */
  generateDomainsForProjectType(projectType, description) {
    const domainMappings = {
      'cli-tool': [
        { domain: 'cli', keywords: ['command', 'argument', 'option', 'cli'] },
        { domain: 'core', keywords: ['logic', 'processing', 'algorithm'] },
        { domain: 'io', keywords: ['file', 'input', 'output', 'stream'] },
        { domain: 'config', keywords: ['configuration', 'settings', 'env'] },
        { domain: 'packaging', keywords: ['package', 'build', 'distribution'] }
      ],
      'web-app': [
        { domain: 'frontend', keywords: ['ui', 'component', 'react', 'vue'] },
        { domain: 'backend', keywords: ['api', 'server', 'endpoint'] },
        { domain: 'database', keywords: ['database', 'storage', 'data'] },
        { domain: 'auth', keywords: ['authentication', 'authorization', 'login'] },
        { domain: 'deployment', keywords: ['deploy', 'production', 'hosting'] }
      ],
      'library': [
        { domain: 'core', keywords: ['main', 'primary', 'core'] },
        { domain: 'utils', keywords: ['utility', 'helper', 'tool'] },
        { domain: 'types', keywords: ['type', 'interface', 'schema'] },
        { domain: 'testing', keywords: ['test', 'spec', 'validation'] },
        { domain: 'documentation', keywords: ['doc', 'readme', 'guide'] }
      ]
    };

    const mapping = domainMappings[projectType] || domainMappings['web-app'];
    const matchedDomains = [];

    for (const domainDef of mapping) {
      for (const keyword of domainDef.keywords) {
        if (description.includes(keyword)) {
          matchedDomains.push(domainDef.domain);
          break;
        }
      }
    }

    return matchedDomains.length > 0 ? matchedDomains : ['core', 'utils'];
  }

  /**
   * Generate agents based on domains and project type
   */
  generateAgentsForDomains(domains, projectType) {
    return domains.map(domain => ({
      agentId: `${domain}_agent`,
      agentRole: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Implementation`,
      focusArea: domain,
      projectType: projectType,
      estimatedTime: 30 // Default estimate
    }));
  }

  /**
   * LLM analysis for complex cases
   */
  async analyzeWithLLM(description, projectContext, ruleBasedHint) {
    const cacheKey = this.getCacheKey(description, projectContext);
    const cached = await this.getCachedResult(cacheKey);
    
    if (cached) {
      console.log('📋 Using cached LLM result');
      return cached;
    }

    const prompt = this.buildLLMPrompt(description, projectContext, ruleBasedHint);
    const response = await this.callLLM(prompt);
    const result = this.parseLLMResponse(response);

    await this.cacheResult(cacheKey, result);
    return result;
  }

  /**
   * Build structured prompt for LLM
   */
  buildLLMPrompt(description, projectContext, ruleBasedHint) {
    return `You are an expert software architect analyzing a development task for PARALLEL decomposition using Git worktrees.

CRITICAL REQUIREMENTS FOR PARALLEL EXECUTION:
1. Each agent MUST have EXCLUSIVE file ownership - no two agents can modify the same file
2. Agents should be able to work SIMULTANEOUSLY without waiting for each other
3. Dependencies should be MINIMIZED - prefer data contracts over code dependencies
4. Each agent should own a complete functional domain that can be developed independently

TASK DESCRIPTION:
${description}

PROJECT CONTEXT:
${JSON.stringify(projectContext, null, 2)}

ANALYSIS INSTRUCTIONS:
1. Identify distinct functional domains that can be developed in COMPLETE ISOLATION
2. Assign each file to EXACTLY ONE agent - no shared files allowed
3. If multiple agents need to interact, they should do so through well-defined interfaces (not shared code)
4. Minimize sequential dependencies - maximize parallel execution potential

DECOMPOSITION RULES:
- NEVER have multiple agents modify the same file
- NEVER create long dependency chains (A→B→C→D is bad, prefer independent agents)
- Each agent should own all files for their domain (e.g., cli_agent owns ALL CLI files)
- If a shared file like package.json needs updates, assign it to ONE coordination agent
- Prefer creating new interface files over modifying existing shared files

Return your analysis as a JSON object:
{
  "projectType": "cli-tool|web-app|library|mobile-app|desktop-app|infrastructure|other",
  "confidence": 0.9,
  "architecture": "description of the architecture",
  "workDomains": ["domain1", "domain2", ...],
  "agents": [
    {
      "agentId": "agent_name",
      "agentRole": "Human readable role description",
      "focusArea": "domain",
      "filesToCreate": ["file1.js", "file2.ts"],
      "filesToModify": [],  // Should be empty or contain ONLY files this agent exclusively owns
      "estimatedTime": 45,
      "dependencies": []    // Should be empty or minimal for true parallelization
    }
  ],
  "fileOwnership": {
    "file1.js": "agent_name",  // Each file mapped to exactly one agent
    "file2.ts": "agent_name"
  },
  "parallelizationStrategy": "explanation of how agents work in parallel",
  "reasoning": "explanation of your analysis"
}

EXAMPLE OF GOOD DECOMPOSITION (CLI tool):
- cli_agent: owns bin/cli.js, src/cli-parser.js, src/cli-commands.js
- installer_agent: owns src/installer.js, src/install-steps.js, src/install-utils.js  
- validator_agent: owns src/validator.js, src/validation-rules.js, src/validation-errors.js
- config_agent: owns src/config.js, src/config-loader.js, src/config-defaults.js
- package_agent: owns package.json, .npmrc, publish.sh

EXAMPLE OF BAD DECOMPOSITION (sequential dependencies):
- agent1 creates package.json → agent2 modifies package.json → agent3 modifies package.json (BAD!)
- agent1 creates base files → agent2 waits for agent1 → agent3 waits for agent2 (BAD!)

Remember: The goal is MAXIMUM PARALLELIZATION with ZERO FILE CONFLICTS.`;
  }

  /**
   * Call LLM API based on configured provider
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

  /**
   * OpenAI API integration
   */
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
          { role: 'system', content: 'You are an expert software architect specializing in parallel development decomposition.' },
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

  /**
   * Anthropic Claude API integration
   */
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

  /**
   * OpenRouter API integration
   */
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
        'X-Title': 'Parallel Development Claude'
      },
      body: JSON.stringify({
        model: this.llmModel,
        messages: [
          { role: 'system', content: 'You are an expert software architect specializing in parallel development decomposition.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Ollama local model integration
   */
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
   * Parse LLM response and validate structure
   */
  parseLLMResponse(response) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in LLM response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsed.projectType || !parsed.agents || !Array.isArray(parsed.agents)) {
        throw new Error('Invalid LLM response structure');
      }

      // Validate exclusive file ownership
      this.validateExclusiveFileOwnership(parsed);

      // Set high confidence for LLM results
      parsed.confidence = Math.max(parsed.confidence || 0.9, 0.9);
      
      return parsed;
    } catch (error) {
      console.error('Failed to parse LLM response:', error.message);
      console.error('Raw response:', response);
      throw new Error('Failed to parse LLM response');
    }
  }

  /**
   * Validate that no two agents modify the same file
   */
  validateExclusiveFileOwnership(result) {
    const fileOwnershipMap = new Map();
    const conflicts = [];

    // Check all agents for file conflicts
    for (const agent of result.agents) {
      const allFiles = [
        ...(agent.filesToCreate || []),
        ...(agent.filesToModify || [])
      ];

      for (const file of allFiles) {
        if (fileOwnershipMap.has(file)) {
          const existingOwner = fileOwnershipMap.get(file);
          conflicts.push({
            file,
            agents: [existingOwner, agent.agentId]
          });
        } else {
          fileOwnershipMap.set(file, agent.agentId);
        }
      }
    }

    if (conflicts.length > 0) {
      console.error('❌ File ownership conflicts detected:');
      for (const conflict of conflicts) {
        console.error(`   - ${conflict.file}: claimed by ${conflict.agents.join(' and ')}`);
      }
      throw new Error(`File ownership conflicts detected: ${conflicts.length} files have multiple owners`);
    }

    // Validate minimal dependencies for parallelization
    let dependencyWarnings = 0;
    for (const agent of result.agents) {
      if (agent.dependencies && agent.dependencies.length > 0) {
        dependencyWarnings++;
        console.warn(`⚠️  Agent ${agent.agentId} has dependencies: ${agent.dependencies.join(', ')}`);
      }
    }

    if (dependencyWarnings > result.agents.length / 2) {
      console.warn('⚠️  High dependency count may limit parallelization effectiveness');
    }

    console.log(`✅ File ownership validation passed: ${fileOwnershipMap.size} files with exclusive ownership`);
    return true;
  }

  /**
   * Generate cache key for request
   */
  getCacheKey(description, projectContext) {
    const content = JSON.stringify({ description, projectContext, model: this.llmModel });
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
}

module.exports = { LLMDecomposer };