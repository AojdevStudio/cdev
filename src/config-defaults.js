const path = require('path');
const os = require('os');

const defaults = {
  linear: {
    apiKey: process.env.LINEAR_API_KEY || null,
    baseUrl: 'https://api.linear.app/graphql',
    timeout: 30000,
    retries: 3,
    cacheDir: '.linear-cache',
    cacheTtl: 3600000
  },
  
  git: {
    worktreeBase: '../parallel-claude-work-trees',
    branchPrefix: '',
    autoCommit: true,
    commitMessageTemplate: '{{agentRole}}: {{taskTitle}}\n\n🤖 Generated with [Claude Code](https://claude.ai/code)\n\nCo-Authored-By: Claude <noreply@anthropic.com>',
    mergeStrategy: 'recursive',
    cleanupAfterMerge: false
  },
  
  claude: {
    timeout: 300000,
    maxRetries: 3,
    contextWindow: 200000,
    enableHooks: true,
    enableValidation: true,
    autoExitPlan: true
  },
  
  agent: {
    maxConcurrency: 4,
    estimatedTimeBuffer: 1.2,
    progressTracking: true,
    validationRequired: true,
    testRequired: true,
    autoStart: false,
    coordinationDir: 'coordination',
    workspacesDir: 'workspaces'
  },
  
  deployment: {
    plansDir: 'shared/deployment-plans',
    reportsDir: 'shared/reports', 
    backupDir: 'shared/backups',
    logLevel: 'info',
    enableMetrics: true,
    metricsDir: 'metrics'
  },
  
  validation: {
    required: ['linear', 'git', 'claude'],
    strict: false,
    warnOnMissing: true,
    exitOnValidationError: false
  },
  
  hooks: {
    enabled: true,
    pre: {
      'agent-start': [],
      'agent-commit': [],
      'agent-spawn': []
    },
    post: {
      'agent-start': [],
      'agent-commit': [],
      'agent-spawn': []
    }
  },
  
  logging: {
    level: 'info',
    format: 'json',
    destination: 'logs',
    maxFiles: 10,
    maxSize: '10mb',
    enableConsole: true,
    enableFile: true
  },
  
  security: {
    validateInputs: true,
    sanitizeOutputs: true,
    allowUnsafeOperations: false,
    maxFileSize: 10485760,
    allowedExtensions: ['.js', '.ts', '.json', '.md', '.txt', '.yml', '.yaml'],
    blockedPaths: ['node_modules', '.git', 'dist', 'build']
  },
  
  performance: {
    enableCaching: true,
    cacheTimeout: 300000,
    maxCacheSize: 104857600,
    enableCompression: true,
    parallelOperations: true,
    maxConcurrentOperations: 10
  },
  
  paths: {
    home: os.homedir(),
    config: path.join(os.homedir(), '.claude-code-hooks'),
    cache: path.join(os.homedir(), '.claude-code-hooks', 'cache'),
    logs: path.join(os.homedir(), '.claude-code-hooks', 'logs'),
    temp: path.join(os.tmpdir(), 'claude-code-hooks')
  }
};

function getDefaults() {
  return JSON.parse(JSON.stringify(defaults));
}

function getDefaultsForCategory(category) {
  if (!defaults[category]) {
    throw new Error(`Unknown configuration category: ${category}`);
  }
  return JSON.parse(JSON.stringify(defaults[category]));
}

function validateDefaults() {
  const required = ['linear', 'git', 'claude', 'agent'];
  const missing = [];

  for (const key of required) {
    if (!defaults[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required default configuration categories: ${missing.join(', ')}`);
  }

  return true;
}

function mergeWithDefaults(userConfig) {
  const defaultConfig = getDefaults();
  return deepMerge(defaultConfig, userConfig);
}

function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }

  return result;
}

function getConfigSchema() {
  return {
    linear: {
      apiKey: { type: 'string', required: false },
      baseUrl: { type: 'string', required: true },
      timeout: { type: 'number', required: true },
      retries: { type: 'number', required: true }
    },
    git: {
      worktreeBase: { type: 'string', required: true },
      branchPrefix: { type: 'string', required: false },
      autoCommit: { type: 'boolean', required: true }
    },
    claude: {
      timeout: { type: 'number', required: true },
      maxRetries: { type: 'number', required: true },
      contextWindow: { type: 'number', required: true }
    },
    agent: {
      maxConcurrency: { type: 'number', required: true },
      estimatedTimeBuffer: { type: 'number', required: true },
      progressTracking: { type: 'boolean', required: true }
    }
  };
}

module.exports = {
  defaults,
  getDefaults,
  getDefaultsForCategory,
  validateDefaults,
  mergeWithDefaults,
  deepMerge,
  getConfigSchema
};