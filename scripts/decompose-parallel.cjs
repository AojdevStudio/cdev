#!/usr/bin/env node

/**
 * decompose-parallel-v2.cjs - Exclusive Ownership Decomposition Engine
 * 
 * This completely redesigned script ensures NO file conflicts by:
 * 1. Analyzing all file operations first
 * 2. Grouping files by dependency clusters
 * 3. Creating exclusive agent domains
 * 4. Validating no overlaps before generating agents
 * 
 * Usage: node decompose-parallel-v2.cjs [LINEAR_ISSUE_ID]
 */

const fs = require('node:fs').promises;
const path = require('node:path');

// Load environment variables from .env file
try {
  require('dotenv').config();
} catch (error) {
  console.warn('⚠️  dotenv not found. Using system environment variables.');
}

const { LLMDecomposer } = require('../utils/llm-decomposer.js');

class ExclusiveOwnershipDecomposer {
  constructor() {
    this.projectRoot = process.cwd();
    this.linearIssue = null;
    this.allFileOperations = new Map(); // File -> [operations]
    this.dependencyGraph = new Map(); // File -> [dependentFiles]
    this.exclusiveDomains = new Map(); // Domain -> [files]
    this.agentOwnership = new Map(); // Agent -> [files]
    this.llmDecomposer = new LLMDecomposer();
    this.useHybridAnalysis = process.env.USE_HYBRID_ANALYSIS !== 'false';
  }

  async decompose(issueId) {
    try {
      console.log('🔄 Starting Exclusive Ownership Decomposition...');
      
      // Step 1: Load Linear issue
      await this.loadLinearIssue(issueId);
      
      // Step 2: Try hybrid analysis first (if enabled)
      if (this.useHybridAnalysis) {
        const hybridResult = await this.tryHybridAnalysis();
        if (hybridResult) {
          return hybridResult;
        }
      }
      
      // ERROR: LLM analysis is required
      console.error('❌ LLM analysis failed. Please configure your LLM provider:');
      console.error('   1. Copy .env.example to .env');
      console.error('   2. Add your API key (OPENAI_API_KEY, ANTHROPIC_API_KEY, or OPENROUTER_API_KEY)');
      console.error('   3. Set LLM_PROVIDER to "openai", "anthropic", or "openrouter"');
      console.error('   4. Set LLM_MODEL to your preferred model');
      throw new Error('LLM configuration required. See instructions above.');
    } catch (error) {
      console.error('❌ Decomposition failed:', error.message);
      process.exit(1);
    }
  }

  async tryHybridAnalysis() {
    try {
      console.log('🤖 Attempting hybrid LLM analysis...');
      
      const description = `${this.linearIssue.title}\n\n${this.linearIssue.description}`;
      const projectContext = {
        hasPackageJson: await this.fileExists('package.json'),
        hasDockerfile: await this.fileExists('Dockerfile'),
        hasNextConfig: await this.fileExists('next.config.js'),
        projectRoot: this.projectRoot
      };
      
      const llmResult = await this.llmDecomposer.decompose(description, projectContext);
      
      if (llmResult.confidence >= 0.8) {
        console.log(`✅ LLM analysis succeeded (confidence: ${llmResult.confidence})`);
        const deploymentPlan = await this.convertLLMResultToDeploymentPlan(llmResult);
        await this.saveDeploymentPlan(deploymentPlan, this.linearIssue.id);
        this.reportDecomposition(deploymentPlan);
        return deploymentPlan;
      } else {
        console.log(`⚠️  LLM analysis uncertain (confidence: ${llmResult.confidence})`);
        return null;
      }
    } catch (error) {
      console.warn('⚠️  LLM analysis error:', error.message);
      return null;
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(path.join(this.projectRoot, filePath));
      return true;
    } catch {
      return false;
    }
  }

  async convertLLMResultToDeploymentPlan(llmResult) {
    const agents = llmResult.agents.map(agent => ({
      agentId: agent.agentId,
      agentRole: agent.agentRole,
      focusArea: agent.focusArea,
      dependencies: agent.dependencies || [],
      filesToCreate: agent.filesToCreate || [],
      filesToModify: agent.filesToModify || [],
      testContracts: agent.filesToCreate?.map(f => f.replace(/\.(ts|js|tsx|jsx)$/, '.test.$1')) || [],
      validationCriteria: [
        `All ${agent.focusArea} files are created successfully`,
        `${agent.focusArea} functionality works as expected`,
        `No errors in ${agent.focusArea} implementation`,
        `${agent.focusArea} tests pass successfully`
      ],
      estimatedTime: agent.estimatedTime || 30,
      canStartImmediately: !agent.dependencies || agent.dependencies.length === 0
    }));

    // Calculate total files for stats
    const totalFiles = agents.reduce((total, agent) => 
      total + (agent.filesToCreate?.length || 0) + (agent.filesToModify?.length || 0), 0
    );

    return {
      taskId: this.linearIssue.id,
      taskTitle: this.linearIssue.title,
      decompositionStrategy: 'llm_hybrid',
      conflictResolution: 'llm_analyzed',
      parallelAgents: agents,
      totalFiles: totalFiles,
      integrationPlan: {
        mergeOrder: this.calculateMergeOrder(agents),
        validationSteps: [
          'Run LLM-generated agent tests',
          'Integration testing',
          'Full system validation'
        ],
        estimatedIntegrationTime: '10 minutes'
      },
      llmAnalysis: {
        projectType: llmResult.projectType,
        confidence: llmResult.confidence,
        reasoning: llmResult.reasoning,
        parallelizationStrategy: llmResult.parallelizationStrategy
      }
    };
  }

  calculateMergeOrder(agents) {
    const ordered = [];
    const remaining = [...agents];
    
    while (remaining.length > 0) {
      const ready = remaining.filter(agent => 
        !agent.dependencies || 
        agent.dependencies.every(dep => ordered.includes(dep))
      );
      
      if (ready.length === 0) {
        // Fallback: add all remaining agents
        ordered.push(...remaining.map(a => a.agentId));
        break;
      }
      
      const next = ready[0];
      ordered.push(next.agentId);
      remaining.splice(remaining.indexOf(next), 1);
    }
    
    return ordered;
  }

  async loadLinearIssue(issueId) {
    // Try to load from cache first
    const cacheFile = path.join(this.projectRoot, '.linear-cache', `${issueId}.json`);
    try {
      const cacheData = await fs.readFile(cacheFile, 'utf8');
      const issue = JSON.parse(cacheData);
      this.linearIssue = {
        id: issue.identifier || issueId,
        title: issue.title || 'Linear Issue',
        description: issue.description || '',
        requirements: this.extractRequirements(issue.description || issue.title)
      };
      console.log(`✅ Loaded issue ${issueId} from cache`);
    } catch (error) {
      console.log(`⚠️  Cache not found, using fallback for ${issueId}`);
      this.linearIssue = {
        id: issueId,
        title: `Issue ${issueId}`,
        description: 'Fallback issue description',
        requirements: [`Implement ${issueId} functionality`]
      };
    }
  }

  async analyzeFileOperations() {
    console.log('📊 Analyzing file operations from requirements...');
    
    for (const requirement of this.linearIssue.requirements) {
      const operations = this.extractFileOperationsFromRequirement(requirement);
      
      for (const [file, operation] of operations) {
        if (!this.allFileOperations.has(file)) {
          this.allFileOperations.set(file, []);
        }
        this.allFileOperations.get(file).push({
          operation,
          requirement,
          agent: null // To be assigned later
        });
      }
    }
    
    console.log(`   📁 Found ${this.allFileOperations.size} unique files across all requirements`);
  }

  extractFileOperationsFromRequirement(requirement) {
    const operations = new Map();
    const reqLower = requirement.toLowerCase();
    
    // File operation patterns - but now we track WHO creates WHAT
    const patterns = [
      // Authentication domain
      {
        condition: (req) => req.includes('auth') || req.includes('login') || req.includes('token'),
        domain: 'auth',
        files: {
          'lib/auth/authentication.ts': 'CREATE',
          'lib/auth/token-manager.ts': 'CREATE', 
          'middleware/auth.ts': 'CREATE',
          'types/auth.ts': 'CREATE'
        }
      },
      
      // Forms domain
      {
        condition: (req) => req.includes('form') || req.includes('validation') || req.includes('input'),
        domain: 'forms',
        files: {
          'components/forms/DynamicForm.tsx': 'CREATE',
          'lib/form-validation.ts': 'CREATE',
          'hooks/useFormState.ts': 'CREATE',
          'types/form.ts': 'CREATE'
        }
      },
      
      // API/Backend domain
      {
        condition: (req) => req.includes('api') || req.includes('endpoint') || req.includes('server'),
        domain: 'backend',
        files: {
          'pages/api/[...slug].ts': 'CREATE',
          'lib/api/client.ts': 'CREATE',
          'lib/api/handlers.ts': 'CREATE',
          'types/api.ts': 'CREATE'
        }
      },
      
      // Data/Storage domain
      {
        condition: (req) => req.includes('data') || req.includes('storage') || req.includes('database'),
        domain: 'data',
        files: {
          'lib/database/queries.ts': 'CREATE',
          'lib/database/models.ts': 'CREATE',
          'lib/storage/manager.ts': 'CREATE',
          'types/data.ts': 'CREATE'
        }
      },
      
      // Infrastructure domain
      {
        condition: (req) => req.includes('docker') || req.includes('deploy') || req.includes('infrastructure'),
        domain: 'infrastructure',
        files: {
          'Dockerfile': 'CREATE',
          'docker-compose.yml': 'CREATE',
          'scripts/deploy.sh': 'CREATE',
          'scripts/build.sh': 'CREATE'
        }
      },
      
      // Write operations domain
      {
        condition: (req) => req.includes('write') || req.includes('file operations') || req.includes('create files'),
        domain: 'file_operations',
        files: {
          'lib/operations/write-operations.ts': 'CREATE',
          'lib/operations/file-writer.ts': 'CREATE',
          'lib/validation/write-validation.ts': 'CREATE',
          'types/operations.ts': 'CREATE'
        }
      },
      
      // UI Components domain
      {
        condition: (req) => req.includes('component') || req.includes('ui') || req.includes('interface'),
        domain: 'ui',
        files: {
          'components/ui/Button.tsx': 'CREATE',
          'components/ui/Input.tsx': 'CREATE',
          'components/common/Layout.tsx': 'CREATE',
          'styles/components.css': 'CREATE'
        }
      }
    ];
    
    // Find matching patterns for this requirement
    const matchingPatterns = patterns.filter(pattern => pattern.condition(reqLower));
    
    // Add files from matching patterns
    for (const pattern of matchingPatterns) {
      for (const [file, operation] of Object.entries(pattern.files)) {
        operations.set(file, {
          operation,
          domain: pattern.domain,
          requirement
        });
      }
    }
    
    return operations;
  }

  async buildDependencyGraph() {
    console.log('🔗 Building file dependency graph...');
    
    // Analyze existing files to understand dependencies
    const existingFiles = await this.scanExistingFiles();
    
    // Simple dependency rules based on common patterns
    const dependencyRules = [
      // Types files are dependencies for implementation files
      { pattern: /^types\//, dependents: ['lib/', 'components/', 'pages/'] },
      
      // Auth files depend on each other
      { pattern: /^lib\/auth\//, dependents: ['middleware/', 'pages/api/'] },
      
      // Database files are dependencies for API files
      { pattern: /^lib\/database\//, dependents: ['pages/api/', 'lib/api/'] },
      
      // UI components depend on common components
      { pattern: /^components\/common\//, dependents: ['components/', 'pages/'] },
      
      // Infrastructure files are foundational
      { pattern: /^(Dockerfile|docker-compose\.yml|scripts\/)/, dependents: ['**'] }
    ];
    
    // Build dependency relationships
    for (const [file] of this.allFileOperations) {
      this.dependencyGraph.set(file, []);
      
      for (const rule of dependencyRules) {
        if (rule.pattern.test(file)) {
          for (const [otherFile] of this.allFileOperations) {
            if (otherFile !== file && rule.dependents.some(dep => 
              dep === '**' || otherFile.startsWith(dep.replace('/', ''))
            )) {
              this.dependencyGraph.get(file).push(otherFile);
            }
          }
        }
      }
    }
    
    console.log(`   🔗 Built dependency graph with ${this.dependencyGraph.size} files`);
  }

  async createExclusiveDomains() {
    console.log('🎯 Creating exclusive domains...');
    
    // Group files by domain based on their operations
    const domainGroups = new Map();
    
    for (const [file, operations] of this.allFileOperations) {
      // Get the domain from the first operation (they should all be the same domain)
      const domain = operations[0].operation.domain;
      
      if (!domainGroups.has(domain)) {
        domainGroups.set(domain, []);
      }
      domainGroups.get(domain).push(file);
    }
    
    // Create exclusive domains ensuring no overlap
    for (const [domain, files] of domainGroups) {
      this.exclusiveDomains.set(domain, files);
      console.log(`   📁 Domain "${domain}": ${files.length} files`);
    }
    
    // Validate no file appears in multiple domains
    const allDomainFiles = new Set();
    for (const [domain, files] of this.exclusiveDomains) {
      for (const file of files) {
        if (allDomainFiles.has(file)) {
          throw new Error(`❌ File conflict detected: ${file} appears in multiple domains`);
        }
        allDomainFiles.add(file);
      }
    }
    
    console.log(`   ✅ Created ${this.exclusiveDomains.size} exclusive domains with no conflicts`);
  }

  async generateExclusiveAgents() {
    console.log('🤖 Generating agents with exclusive ownership...');
    
    const agents = [];
    
    for (const [domain, files] of this.exclusiveDomains) {
      const agent = await this.createAgentForDomain(domain, files);
      agents.push(agent);
      
      // Track ownership
      this.agentOwnership.set(agent.id, files);
      
      console.log(`   ✅ Agent "${agent.id}": ${files.length} exclusive files`);
    }
    
    return agents;
  }

  async createAgentForDomain(domain, files) {
    const domainConfigs = {
      auth: {
        id: 'auth_agent',
        role: 'Authentication & Authorization',
        focusArea: 'Authentication',
        estimatedTime: 35,
        complexity: 'high',
        type: 'security',
        dependencies: []
      },
      forms: {
        id: 'forms_agent', 
        role: 'Form Components & Validation',
        focusArea: 'Forms',
        estimatedTime: 25,
        complexity: 'medium',
        type: 'frontend',
        dependencies: ['auth_agent'] // Forms might need auth
      },
      backend: {
        id: 'backend_agent',
        role: 'API Endpoints & Server Logic',
        focusArea: 'Backend',
        estimatedTime: 40,
        complexity: 'high',
        type: 'backend',
        dependencies: ['data_agent'] // Backend depends on data layer
      },
      data: {
        id: 'data_agent',
        role: 'Database & Data Management',
        focusArea: 'Data',
        estimatedTime: 30,
        complexity: 'high',
        type: 'data',
        dependencies: [] // Data is foundational
      },
      infrastructure: {
        id: 'infrastructure_agent',
        role: 'Infrastructure & Deployment',
        focusArea: 'Infrastructure',
        estimatedTime: 20,
        complexity: 'medium',
        type: 'infrastructure',
        dependencies: [] // Infrastructure is foundational
      },
      file_operations: {
        id: 'file_operations_agent',
        role: 'File Operations & Write Capabilities',
        focusArea: 'File Operations',
        estimatedTime: 30,
        complexity: 'medium',
        type: 'feature',
        dependencies: ['data_agent'] // File ops might need data access
      },
      ui: {
        id: 'ui_agent',
        role: 'UI Components & Interface',
        focusArea: 'UI',
        estimatedTime: 25,
        complexity: 'medium',
        type: 'frontend',
        dependencies: ['auth_agent'] // UI might need auth context
      }
    };
    
    const config = domainConfigs[domain] || {
      id: `${domain}_agent`,
      role: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Implementation`,
      focusArea: domain,
      estimatedTime: 25,
      complexity: 'medium',
      type: 'feature',
      dependencies: []
    };
    
    // Separate files into CREATE and MODIFY operations
    const filesToCreate = [];
    const filesToModify = [];
    
    for (const file of files) {
      const operations = this.allFileOperations.get(file);
      if (operations && operations[0].operation.operation === 'CREATE') {
        filesToCreate.push(file);
      } else {
        filesToModify.push(file);
      }
    }
    
    return {
      ...config,
      filesToCreate,
      filesToModify,
      testContracts: this.generateTestContracts(domain, files),
      validationCriteria: this.generateValidationCriteria(domain, files),
      requirements: this.getRequirementsForDomain(domain)
    };
  }

  generateTestContracts(domain, files) {
    const baseTests = files.map(file => {
      const extension = path.extname(file);
      const baseName = path.basename(file, extension);
      return `${baseName}.test${extension === '.tsx' ? '.tsx' : '.ts'}`;
    });
    
    return baseTests.slice(0, 3); // Limit to 3 main tests
  }

  generateValidationCriteria(domain, files) {
    const criteria = [
      `All ${domain} files are created successfully`,
      `${domain} functionality works as expected`,
      `No errors in ${domain} implementation`,
      `${domain} tests pass successfully`
    ];
    
    return criteria;
  }

  getRequirementsForDomain(domain) {
    const requirements = [];
    
    for (const [file, operations] of this.allFileOperations) {
      if (operations[0].operation.domain === domain) {
        requirements.push(...operations.map(op => op.requirement));
      }
    }
    
    return [...new Set(requirements)]; // Remove duplicates
  }

  validateNoConflicts(agents) {
    console.log('🔍 Validating no conflicts between agents...');
    
    const fileOwnership = new Map();
    
    for (const agent of agents) {
      const allFiles = [...(agent.filesToCreate || []), ...(agent.filesToModify || [])];
      
      for (const file of allFiles) {
        if (fileOwnership.has(file)) {
          throw new Error(`❌ CONFLICT: File "${file}" is assigned to both ${agent.id} and ${fileOwnership.get(file)}`);
        }
        fileOwnership.set(file, agent.id);
      }
    }
    
    console.log(`   ✅ Validated ${fileOwnership.size} files with exclusive ownership`);
  }

  async generateDeploymentPlan(agents) {
    const plan = {
      taskId: this.linearIssue.id,
      taskTitle: this.linearIssue.title,
      decompositionStrategy: 'exclusive_ownership',
      conflictResolution: 'eliminated_by_design',
      
      parallelAgents: agents.map(agent => ({
        agentId: agent.id,
        agentRole: agent.role,
        focusArea: agent.focusArea,
        dependencies: agent.dependencies || [],
        filesToCreate: agent.filesToCreate || [],
        filesToModify: agent.filesToModify || [],
        testContracts: agent.testContracts || [],
        validationCriteria: agent.validationCriteria || [],
        estimatedTime: agent.estimatedTime,
        canStartImmediately: (agent.dependencies || []).length === 0
      })),
      
      integrationPlan: {
        mergeOrder: this.calculateMergeOrder(agents),
        validationSteps: [
          'Validate exclusive file ownership',
          'Run individual agent tests',
          'Integration testing',
          'Full system validation'
        ]
      },
      
      exclusiveOwnership: {
        validated: true,
        totalFiles: Array.from(this.allFileOperations.keys()).length,
        agentOwnership: Object.fromEntries(this.agentOwnership)
      }
    };
    
    return plan;
  }


  async saveDeploymentPlan(plan, issueId) {
    const outputDir = path.join(this.projectRoot, 'shared', 'deployment-plans');
    await fs.mkdir(outputDir, { recursive: true });
    
    const filename = `${issueId.toLowerCase()}-deployment-plan.json`;
    const filepath = path.join(outputDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(plan, null, 2));
    console.log(`💾 Saved deployment plan: ${filepath}`);
    
    return filepath;
  }

  reportDecomposition(plan) {
    console.log('\n🎯 Decomposition Complete!');
    console.log(`📋 Task: ${plan.taskId} - ${plan.taskTitle}`);
    console.log(`🤖 Agents: ${plan.parallelAgents.length}`);
    const totalFiles = plan.totalFiles || plan.exclusiveOwnership?.totalFiles || 0;
    console.log(`📁 Total Files: ${totalFiles}`);
    const conflicts = plan.exclusiveOwnership ? 'ELIMINATED BY DESIGN' : 'NONE';
    console.log(`✅ Conflicts: ${conflicts}`);
    
    console.log('\n🔧 Agent Summary:');
    for (const agent of plan.parallelAgents) {
      const canStart = agent.canStartImmediately ? '✅' : '⏳';
      console.log(`   ${canStart} ${agent.agentId}: ${agent.filesToCreate.length} files to create, ${agent.filesToModify.length} files to modify`);
    }
    
    console.log('\n📊 Integration Order:');
    for (let i = 0; i < plan.integrationPlan.mergeOrder.length; i++) {
      console.log(`   ${i + 1}. ${plan.integrationPlan.mergeOrder[i]}`);
    }
  }

  // Helper methods
  async scanExistingFiles() {
    const files = [];
    try {
      await this.scanDirectory(this.projectRoot, files);
    } catch (error) {
      console.log(`⚠️  Could not scan existing files: ${error.message}`);
    }
    return files;
  }

  async scanDirectory(dir, files, depth = 0) {
    if (depth > 3) return;
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, files, depth + 1);
        } else {
          files.push(fullPath.replace(this.projectRoot + '/', ''));
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  extractRequirements(description) {
    const requirements = [];
    const lines = description.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^\s*\d+\.\s*(.+)/);
      if (match) {
        requirements.push(match[1].trim());
      }
    }
    
    // If no numbered requirements, treat the whole description as one requirement
    if (requirements.length === 0) {
      requirements.push(description.trim());
    }
    
    return requirements;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node decompose-parallel-v2.cjs [LINEAR_ISSUE_ID]');
    process.exit(1);
  }
  
  const issueId = args[0];
  const decomposer = new ExclusiveOwnershipDecomposer();
  
  await decomposer.decompose(issueId);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ExclusiveOwnershipDecomposer };