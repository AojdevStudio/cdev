#!/usr/bin/env node

/**
 * decompose-parallel.cjs - Intelligent Task Decomposition Engine
 *
 * This script analyzes Linear issues and breaks them down into parallel
 * agent workstreams that can work independently against an established test suite.
 *
 * Usage: node decompose-parallel.cjs [LINEAR_ISSUE_ID]
 * Example: node decompose-parallel.cjs AOJ-63
 */

const fs = require('node:fs').promises;
const path = require('node:path');

// Import the external intelligent agent generator
const { IntelligentAgentGenerator } = require('./intelligent-agent-generator.js');

// Enhanced inline agent generator that extends the external one
class EnhancedIntelligentAgentGenerator extends IntelligentAgentGenerator {
  constructor(codebaseStructure, testSuiteAnalysis, projectRoot) {
    super(codebaseStructure, testSuiteAnalysis);
    this.projectRoot = projectRoot;
    this.existingFiles = [];
  }

  async initialize() {
    // Scan existing files for better prediction
    this.existingFiles = await this.scanExistingFiles();
    console.log(`   📁 Scanned ${this.existingFiles.length} existing files`);
  }

  generateAgentForRequirement(requirement, allRequirements = []) {
    console.log(`   🧠 Enhanced analyzing requirement: "${requirement}"`);
    
    const analysis = this.analyzeRequirement(requirement);
    console.log(`   📊 Analysis: actions=[${analysis.actions.join(', ')}], objects=[${analysis.objects.join(', ')}], complexity=${analysis.complexity}`);
    
    const agent = this.createAgentFromAnalysis(requirement, analysis);
    
    // Enhanced predictions using better logic
    agent.filesToCreate = this.predictFilesToCreateEnhanced(agent, analysis, requirement);
    agent.filesToModify = this.predictFilesToModifyEnhanced(agent, analysis, requirement);
    agent.testContracts = this.generateTestContractsEnhanced(agent, analysis, requirement);
    agent.validationCriteria = this.generateValidationCriteriaEnhanced(agent, analysis, requirement);
    agent.dependencies = this.calculateAgentDependencies(agent, analysis, allRequirements);
    
    console.log(`   ✅ Enhanced ${agent.type} agent: ${agent.id}`);
    console.log(`      📁 Files to create: ${agent.filesToCreate.length}`);
    console.log(`      ✏️  Files to modify: ${agent.filesToModify.length}`);
    console.log(`      🧪 Test contracts: ${agent.testContracts.length}`);
    console.log(`      ✅ Validation criteria: ${agent.validationCriteria.length}`);
    
    return agent;
  }

  async scanExistingFiles() {
    const files = [];
    try {
      await this.scanDirectory(this.projectRoot, files);
    } catch (error) {
      console.log(`   ⚠️  Could not scan project files: ${error.message}`);
    }
    return files;
  }

  async scanDirectory(dir, files, depth = 0) {
    if (depth > 3) return; // Limit depth to avoid infinite recursion
    
    try {
      const entries = await require('node:fs').promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        
        const fullPath = require('node:path').join(dir, entry.name);
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

  predictFilesToCreateEnhanced(agent, analysis, requirement) {
    const files = [];
    const reqLower = requirement.toLowerCase();

    // Authentication related files
    if (this.isAuthenticationRelated(reqLower, analysis)) {
      files.push(
        'lib/auth/authentication.ts',
        'lib/auth/token-manager.ts',
        'middleware/auth.ts'
      );
    }

    // API/Integration related files
    if (this.isApiIntegrationRelated(reqLower, analysis)) {
      files.push(
        'lib/api/client.ts',
        'lib/integrations/external-service.ts',
        'types/api-responses.ts'
      );
    }

    // Forms related files
    if (this.isFormsRelated(reqLower, analysis)) {
      files.push(
        'components/forms/DynamicForm.tsx',
        'lib/form-validation.ts',
        'hooks/useFormState.ts'
      );
    }

    // Google Drive/MCP related files
    if (this.isDriveOrMcpRelated(reqLower, analysis)) {
      files.push(
        'lib/mcp/drive-client.ts',
        'lib/mcp/server-setup.ts',
        'types/drive-types.ts'
      );
    }

    // Docker/Infrastructure files
    if (this.isInfrastructureRelated(reqLower, analysis)) {
      files.push(
        'Dockerfile',
        'docker-compose.yml',
        'scripts/deploy.sh'
      );
    }

    // Search related files
    if (this.isSearchRelated(reqLower, analysis)) {
      files.push(
        'lib/search/search-engine.ts',
        'components/search/SearchInterface.tsx',
        'lib/search/indexer.ts'
      );
    }

    // Write capabilities files
    if (this.isWriteCapabilitiesRelated(reqLower, analysis)) {
      files.push(
        'lib/operations/write-operations.ts',
        'lib/operations/file-writer.ts',
        'lib/validation/write-validation.ts'
      );
    }

    return files;
  }

  predictFilesToModifyEnhanced(agent, analysis, requirement) {
    const files = [];
    const reqLower = requirement.toLowerCase();
    
    // Common files that usually need modification
    const commonModifications = [];

    // Main entry points
    if (this.existingFiles.includes('index.ts')) {
      commonModifications.push('index.ts');
    }
    if (this.existingFiles.includes('src/index.ts')) {
      commonModifications.push('src/index.ts');
    }

    // Configuration files
    if (this.isInfrastructureRelated(reqLower, analysis)) {
      if (this.existingFiles.includes('package.json')) {
        commonModifications.push('package.json');
      }
      if (this.existingFiles.includes('tsconfig.json')) {
        commonModifications.push('tsconfig.json');
      }
    }

    // API routes
    if (this.isApiIntegrationRelated(reqLower, analysis)) {
      const apiFiles = this.existingFiles.filter(f => 
        f.includes('/api/') || f.includes('routes') || f.includes('handlers')
      );
      commonModifications.push(...apiFiles.slice(0, 3)); // Limit to avoid overwhelming
    }

    // Component files for UI changes
    if (this.isFormsRelated(reqLower, analysis) || reqLower.includes('ui')) {
      const componentFiles = this.existingFiles.filter(f => 
        f.includes('components/') && f.includes('.tsx')
      );
      commonModifications.push(...componentFiles.slice(0, 2));
    }

    files.push(...commonModifications);
    return [...new Set(files)]; // Remove duplicates
  }

  generateTestContractsEnhanced(agent, analysis, requirement) {
    const tests = [];
    const reqLower = requirement.toLowerCase();

    // Authentication tests
    if (this.isAuthenticationRelated(reqLower, analysis)) {
      tests.push(
        'auth/authentication.test.ts',
        'auth/token-validation.test.ts',
        'integration/auth-flow.test.ts'
      );
    }

    // API/Integration tests
    if (this.isApiIntegrationRelated(reqLower, analysis)) {
      tests.push(
        'api/client.test.ts',
        'integration/external-service.test.ts',
        'api/error-handling.test.ts'
      );
    }

    // Forms tests
    if (this.isFormsRelated(reqLower, analysis)) {
      tests.push(
        'components/forms.test.tsx',
        'validation/form-validation.test.ts',
        'integration/form-submission.test.ts'
      );
    }

    // MCP/Drive tests
    if (this.isDriveOrMcpRelated(reqLower, analysis)) {
      tests.push(
        'mcp/drive-operations.test.ts',
        'mcp/server-setup.test.ts',
        'integration/mcp-client.test.ts'
      );
    }

    // Search tests
    if (this.isSearchRelated(reqLower, analysis)) {
      tests.push(
        'search/search-engine.test.ts',
        'search/indexing.test.ts',
        'integration/search-api.test.ts'
      );
    }

    // Write operations tests
    if (this.isWriteCapabilitiesRelated(reqLower, analysis)) {
      tests.push(
        'operations/write-operations.test.ts',
        'operations/file-validation.test.ts',
        'integration/write-flow.test.ts'
      );
    }

    // Docker/Infrastructure tests
    if (this.isInfrastructureRelated(reqLower, analysis)) {
      tests.push(
        'infrastructure/docker.test.ts',
        'infrastructure/deployment.test.ts'
      );
    }

    return tests;
  }

  generateValidationCriteriaEnhanced(agent, analysis, requirement) {
    const criteria = [];
    const reqLower = requirement.toLowerCase();

    // Authentication validation
    if (this.isAuthenticationRelated(reqLower, analysis)) {
      criteria.push(
        'Authentication tokens are properly validated',
        'OAuth2 flow works end-to-end',
        'Unauthorized access is properly blocked',
        'Token refresh mechanism functions correctly'
      );
    }

    // API/Integration validation
    if (this.isApiIntegrationRelated(reqLower, analysis)) {
      criteria.push(
        'External API calls return expected responses',
        'Error handling works for network failures',
        'Rate limiting is respected',
        'Integration endpoints are accessible'
      );
    }

    // Forms validation
    if (this.isFormsRelated(reqLower, analysis)) {
      criteria.push(
        'Form validation rules work correctly',
        'Dynamic form generation functions properly',
        'Form submission triggers expected actions',
        'Error states are displayed to users'
      );
    }

    // MCP/Drive validation
    if (this.isDriveOrMcpRelated(reqLower, analysis)) {
      criteria.push(
        'Google Drive operations complete successfully',
        'MCP server starts without errors',
        'File operations (read/write) work correctly',
        'Authentication with Google APIs succeeds'
      );
    }

    // Search validation
    if (this.isSearchRelated(reqLower, analysis)) {
      criteria.push(
        'Search queries return relevant results',
        'Search indexing completes successfully',
        'Search performance meets requirements',
        'Search filters work as expected'
      );
    }

    // Write capabilities validation
    if (this.isWriteCapabilitiesRelated(reqLower, analysis)) {
      criteria.push(
        'Write operations complete without data loss',
        'File permissions are properly validated',
        'Concurrent write operations are handled safely',
        'Write operation rollback works when needed'
      );
    }

    // Docker/Infrastructure validation
    if (this.isInfrastructureRelated(reqLower, analysis)) {
      criteria.push(
        'Docker containers build successfully',
        'Application starts in containerized environment',
        'Environment variables are properly configured',
        'Health checks pass in deployment environment'
      );
    }

    // Generic functional validation based on actions
    analysis.actions.forEach(action => {
      switch(action) {
        case 'create':
        case 'build':
          criteria.push('New functionality is created and accessible');
          break;
        case 'fix':
        case 'resolve':
          criteria.push('Reported issues are resolved and no longer reproducible');
          break;
        case 'enhance':
        case 'improve':
          criteria.push('Enhanced functionality performs better than previous version');
          break;
        case 'integrate':
          criteria.push('Integration works seamlessly with existing systems');
          break;
      }
    });

    return [...new Set(criteria)]; // Remove duplicates
  }

  // Helper methods to identify requirement types
  isAuthenticationRelated(reqLower, analysis) {
    return reqLower.includes('auth') || reqLower.includes('login') || 
           reqLower.includes('token') || reqLower.includes('oauth') ||
           analysis.objects.includes('authentication') || analysis.objects.includes('auth');
  }

  isApiIntegrationRelated(reqLower, analysis) {
    return reqLower.includes('api') || reqLower.includes('integration') || 
           reqLower.includes('service') || reqLower.includes('endpoint') ||
           analysis.objects.includes('api') || analysis.objects.includes('integration');
  }

  isFormsRelated(reqLower, analysis) {
    return reqLower.includes('form') || reqLower.includes('input') || 
           reqLower.includes('validation') || analysis.objects.includes('forms');
  }

  isDriveOrMcpRelated(reqLower, analysis) {
    return reqLower.includes('drive') || reqLower.includes('mcp') || 
           reqLower.includes('google') || analysis.objects.includes('storage') ||
           analysis.technologies.includes('google drive') || analysis.technologies.includes('mcp');
  }

  isInfrastructureRelated(reqLower, analysis) {
    return reqLower.includes('docker') || reqLower.includes('deploy') || 
           reqLower.includes('config') || reqLower.includes('setup') ||
           analysis.technologies.includes('docker');
  }

  isSearchRelated(reqLower, analysis) {
    return reqLower.includes('search') || reqLower.includes('index') || 
           reqLower.includes('query') || reqLower.includes('find');
  }

  isWriteCapabilitiesRelated(reqLower, analysis) {
    return reqLower.includes('write') || reqLower.includes('create') || 
           reqLower.includes('update') || reqLower.includes('modify') ||
           reqLower.includes('capabilities');
  }

  calculateAgentDependencies(agent, analysis, allRequirements) {
    const dependencies = [];
    
    // Authentication should come first for most other features
    if (!this.isAuthenticationRelated(agent.role.toLowerCase(), analysis)) {
      const hasAuthRequirement = allRequirements.some(req => 
        this.isAuthenticationRelated(req.toLowerCase(), { objects: [], technologies: [] })
      );
      if (hasAuthRequirement) {
        dependencies.push('authentication_agent');
      }
    }

    // Infrastructure/Docker should come before application features
    if (!this.isInfrastructureRelated(agent.role.toLowerCase(), analysis)) {
      const hasInfraRequirement = allRequirements.some(req => 
        this.isInfrastructureRelated(req.toLowerCase(), { technologies: [] })
      );
      if (hasInfraRequirement && this.isApiIntegrationRelated(agent.role.toLowerCase(), analysis)) {
        dependencies.push('infrastructure_agent');
      }
    }

    // Forms might depend on validation infrastructure
    if (this.isFormsRelated(agent.role.toLowerCase(), analysis)) {
      const hasApiRequirement = allRequirements.some(req => 
        this.isApiIntegrationRelated(req.toLowerCase(), { objects: [] })
      );
      if (hasApiRequirement) {
        dependencies.push('backend_integration_agent');
      }
    }

    // Search features might depend on data/storage infrastructure
    if (this.isSearchRelated(agent.role.toLowerCase(), analysis)) {
      const hasStorageRequirement = allRequirements.some(req => 
        this.isDriveOrMcpRelated(req.toLowerCase(), { objects: [], technologies: [] })
      );
      if (hasStorageRequirement) {
        dependencies.push('data_storage_agent');
      }
    }

    return [...new Set(dependencies)]; // Remove duplicates
  }

  createAgentFromAnalysis(requirement, analysis) {
    // Try to use the parent class's intelligent generation first
    try {
      const agent = super.generateAgentForRequirement(requirement);
      if (agent) {
        return agent;
      }
    } catch (error) {
      console.log(`   ⚠️  Parent generator failed, using fallback: ${error.message}`);
    }

    // Enhanced fallback logic
    const reqLower = requirement.toLowerCase();
    
    // Determine agent type based on analysis
    if (analysis.objects.includes('server') || analysis.objects.includes('integration') || reqLower.includes('mcp')) {
      return {
        id: 'backend_integration_agent',
        role: `Backend & Integration: ${requirement}`,
        focusArea: 'Backend & Integration',
        requirements: [requirement],
        estimatedTime: analysis.complexity === 'high' ? 45 : 35,
        complexity: analysis.complexity,
        type: 'backend',
        _analysis: analysis
      };
    }

    if (analysis.objects.includes('storage') || analysis.objects.includes('data') || reqLower.includes('drive')) {
      return {
        id: 'data_storage_agent',
        role: `Data & Storage: ${requirement}`,
        focusArea: 'Data & Storage',
        requirements: [requirement],
        estimatedTime: analysis.complexity === 'high' ? 40 : 30,
        complexity: analysis.complexity,
        type: 'data',
        _analysis: analysis
      };
    }

    if (analysis.objects.includes('forms') || analysis.objects.includes('ui')) {
      return {
        id: 'frontend_forms_agent',
        role: `Frontend & Forms: ${requirement}`,
        focusArea: 'Frontend & Forms',
        requirements: [requirement],
        estimatedTime: analysis.complexity === 'high' ? 35 : 25,
        complexity: analysis.complexity,
        type: 'frontend',
        _analysis: analysis
      };
    }

    // Enhanced generic fallback with better ID generation
    const agentId = this.generateEnhancedAgentId(requirement, analysis);

    return {
      id: agentId,
      role: `Feature Implementation: ${requirement}`,
      focusArea: 'Custom Feature',
      requirements: [requirement],
      estimatedTime: analysis.complexity === 'high' ? 35 : 25,
      complexity: analysis.complexity,
      type: 'feature',
      _analysis: analysis
    };
  }

  generateEnhancedAgentId(requirement, analysis) {
    const reqLower = requirement.toLowerCase();
    
    // Try to extract meaningful keywords for better agent IDs
    let agentType = 'feature';
    
    if (this.isAuthenticationRelated(reqLower, analysis)) {
      agentType = 'authentication';
    } else if (this.isApiIntegrationRelated(reqLower, analysis)) {
      agentType = 'backend_integration';
    } else if (this.isFormsRelated(reqLower, analysis)) {
      agentType = 'frontend_forms';
    } else if (this.isDriveOrMcpRelated(reqLower, analysis)) {
      agentType = 'data_storage';
    } else if (this.isInfrastructureRelated(reqLower, analysis)) {
      agentType = 'infrastructure';
    } else if (this.isSearchRelated(reqLower, analysis)) {
      agentType = 'enhanced_search';
    } else if (this.isWriteCapabilitiesRelated(reqLower, analysis)) {
      agentType = 'complete_write';
    }
    
    return `${agentType}_agent`;
  }
}

// Note: For Node.js versions that don't have fetch built-in, you may need:
// const fetch = require('node-fetch');
// But Node.js 18+ has fetch built-in

class ParallelTaskDecomposer {
  constructor() {
    this.projectRoot = process.cwd();
    this.testSuiteAnalysis = null;
    this.codebaseStructure = null;
    this.linearIssue = null;
  }

  /**
   * Main decomposition workflow
   */
  async decompose(issueId) {
    try {
      // Step 1: Gather intelligence
      await this.analyzeTestSuite();
      await this.analyzeCodebaseStructure();
      await this.fetchLinearIssue(issueId);

      // Step 2: Intelligent decomposition
      const decompositionPlan = await this.createDecompositionPlan();

      // Step 3: Generate deployment JSON
      const deploymentPlan = await this.generateDeploymentPlan(decompositionPlan);

      // Step 4: Save and report
      await this.saveDeploymentPlan(deploymentPlan, issueId);
      this.reportDecomposition(deploymentPlan);

      return deploymentPlan;
    } catch (error) {
      console.error('❌ Decomposition failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Analyze existing test suite to understand development contracts
   */
  async analyzeTestSuite() {
    const testDirs = ['__tests__', 'tests', 'src/__tests__', 'test'];
    const testFiles = [];

    for (const dir of testDirs) {
      const testPath = path.join(this.projectRoot, dir);
      try {
        const files = await this.findTestFiles(testPath);
        testFiles.push(...files);
      } catch (_e) {
        // Directory doesn't exist, continue
      }
    }

    this.testSuiteAnalysis = {
      totalTestFiles: testFiles.length,
      testAreas: this.categorizeTests(testFiles),
      testContracts: this.extractTestContracts(testFiles),
      coverageAreas: this.identifyCoverageAreas(testFiles),
    };
  }

  /**
   * Analyze codebase structure to understand architectural patterns
   */
  async analyzeCodebaseStructure() {
    const srcDirs = ['src', 'app', 'components', 'lib', 'pages'];
    const structure = {};

    for (const dir of srcDirs) {
      const dirPath = path.join(this.projectRoot, dir);
      try {
        structure[dir] = await this.analyzeDirectory(dirPath);
      } catch (_e) {
        // Directory doesn't exist, continue
      }
    }

    this.codebaseStructure = {
      architecture: this.identifyArchitecture(structure),
      components: this.findComponents(structure),
      apis: this.findApiRoutes(structure),
      utilities: this.findUtilities(structure),
      styles: this.findStyles(structure),
    };
  }

  /**
   * Fetch Linear issue details using the Linear MCP tool
   */
  async fetchLinearIssue(issueId) {
    try {
      // Option 1: Use Linear MCP tool if available (requires MCP environment)
      if (this.isRunningInMCPEnvironment()) {
        const issue = await this.fetchFromLinearMCP(issueId);
        this.linearIssue = this.transformLinearResponse(issue);
      }
      // Option 2: Use Linear GraphQL API directly
      else if (process.env.LINEAR_API_KEY) {
        const issue = await this.fetchFromLinearAPI(issueId);
        this.linearIssue = this.transformLinearResponse(issue);
      }
      // Option 3: Use local Linear data cache (if available)
      else if (await this.hasLocalLinearCache(issueId)) {
        const issue = await this.fetchFromLocalCache(issueId);
        this.linearIssue = this.transformLinearResponse(issue);
      }
      // Option 4: Fall back to manual input prompt
      else {
        this.linearIssue = await this.promptForIssueDetails(issueId);
      }
    } catch (error) {
      console.error(`❌ Failed to fetch Linear issue ${issueId}:`, error.message);
      this.linearIssue = await this.promptForIssueDetails(issueId);
    }
  }

  /**
   * Check if running in MCP environment (Claude Desktop/Code)
   */
  isRunningInMCPEnvironment() {
    // Check for MCP environment indicators
    return (
      process.env.MCP_ENABLED === 'true' ||
      process.env.CLAUDE_DESKTOP === 'true' ||
      typeof global.mcpTools !== 'undefined'
    );
  }

  /**
   * Fetch from Linear using MCP tool (when running in Claude Desktop/Code)
   */
  fetchFromLinearMCP(_issueId) {
    // In a real MCP environment, this might look like:
    // const issue = await window.mcp.linear.getIssue(issueId);
    // return issue;

    throw new Error('MCP Linear integration not available in Node.js environment');
  }

  /**
   * Fetch from Linear GraphQL API directly
   */
  async fetchFromLinearAPI(issueId) {
    const query = `
      query GetIssue($id: String!) {
        issue(id: $id) {
          id
          identifier
          title
          description
          priority
          priorityLabel
          state {
            name
          }
          assignee {
            name
          }
          team {
            name
          }
          project {
            name
          }
        }
      }
    `;

    const response = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        Authorization: process.env.LINEAR_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { id: issueId },
      }),
    });

    if (!response.ok) {
      throw new Error(`Linear API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`Linear GraphQL error: ${data.errors[0].message}`);
    }

    return data.data.issue;
  }

  /**
   * Check if local Linear cache exists
   */
  async hasLocalLinearCache(issueId) {
    const cacheDir = path.join(this.projectRoot, '.linear-cache');
    const cacheFile = path.join(cacheDir, `${issueId}.json`);

    try {
      await fs.access(cacheFile);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fetch from local Linear cache
   */
  async fetchFromLocalCache(issueId) {
    const cacheDir = path.join(this.projectRoot, '.linear-cache');
    const cacheFile = path.join(cacheDir, `${issueId}.json`);

    const cacheData = await fs.readFile(cacheFile, 'utf8');
    return JSON.parse(cacheData);
  }

  /**
   * Prompt user for manual issue details
   */
  promptForIssueDetails(issueId) {
    // For now, return a basic structure that prompts user to fill in
    return {
      id: issueId,
      title: `[MANUAL INPUT NEEDED] Issue ${issueId}`,
      description: '[Please provide description with numbered requirements]',
      priority: 'Unknown',
      status: 'Unknown',
      requirements: ['[Please list requirements manually]'],
    };
  }

  /**
   * Transform Linear API response to internal format
   */
  transformLinearResponse(issue) {
    return {
      id: issue.identifier || issue.id,
      title: issue.title,
      description: issue.description || '',
      priority: issue.priorityLabel || issue.priority || 'Unknown',
      status: issue.state?.name || 'Unknown',
      assignee: issue.assignee?.name,
      team: issue.team?.name,
      project: issue.project?.name,
      requirements: this.extractRequirements(issue.description || ''),
    };
  }

  /**
   * Create intelligent decomposition plan based on analysis
   */
  async createDecompositionPlan() {
    const requirements = this.linearIssue.requirements;
    
    // Initialize enhanced intelligent agent generator
    const agentGenerator = new EnhancedIntelligentAgentGenerator(
      this.codebaseStructure,
      this.testSuiteAnalysis,
      this.projectRoot
    );

    // Initialize the enhanced generator (scan existing files)
    await agentGenerator.initialize();

    console.log(`🧠 Analyzing ${requirements.length} requirements with enhanced intelligent agent generator...`);
    
    const agents = [];

    // Use enhanced intelligent agent generation
    for (const requirement of requirements) {
      console.log(`   🔍 Enhanced analyzing: "${requirement}"`);
      
      const agent = agentGenerator.generateAgentForRequirement(requirement, requirements);
      if (agent) {
        console.log(`   ✅ Created enhanced ${agent.type} agent: ${agent.id}`);
        agents.push(agent);
      } else {
        console.log(`   ⚠️  Could not create agent for: "${requirement}"`);
      }
    }

    // If no requirements found, try to analyze the title/description as a whole
    if (requirements.length === 0) {
      console.log(`⚠️  No numbered requirements found. Analyzing title as single requirement...`);
      const titleAgent = agentGenerator.generateAgentForRequirement(this.linearIssue.title, [this.linearIssue.title]);
      if (titleAgent) {
        agents.push(titleAgent);
      }
    }

    console.log(`📊 Generated ${agents.length} enhanced intelligent agents`);

    // Optimize agent assignments for parallelism
    const optimizedAgents = this.optimizeForParallelism(agents);

    // Calculate enhanced dependencies
    const agentsWithDependencies = this.calculateEnhancedDependencies(optimizedAgents);

    return {
      agents: agentsWithDependencies,
      totalEstimatedTime: this.calculateTotalTime(agentsWithDependencies),
      parallelismFactor: this.calculateParallelismFactor(agentsWithDependencies),
    };
  }

  /**
   * Create specialized agent for a specific requirement
   */
  createAgentForRequirement(requirement) {
    const reqText = requirement.toLowerCase();

    // Routing/Navigation Agent
    if (reqText.includes('404') || reqText.includes('routing') || reqText.includes('navigation')) {
      return {
        id: 'routing_agent',
        role: 'Fix routing and navigation issues',
        focusArea: 'Navigation & Routing',
        requirements: [requirement],
        estimatedTime: 20,
        complexity: 'medium',
        type: 'infrastructure',
      };
    }

    // Data Visualization Agent
    if (reqText.includes('chart') || reqText.includes('visualization') || reqText.includes('kpi')) {
      return {
        id: 'chart_agent',
        role: 'Build chart components and visualization library',
        focusArea: 'Data Visualization',
        requirements: [requirement],
        estimatedTime: 25,
        complexity: 'medium',
        type: 'component',
      };
    }

    // Data Integration Agent
    if (reqText.includes('database') || reqText.includes('data') || reqText.includes('api')) {
      return {
        id: 'data_agent',
        role: 'Implement data layer and API integration',
        focusArea: 'Data Layer',
        requirements: [requirement],
        estimatedTime: 30,
        complexity: 'high',
        type: 'backend',
      };
    }

    // UI/Dashboard Agent
    if (reqText.includes('dashboard') || reqText.includes('layout') || reqText.includes('ui')) {
      return {
        id: 'ui_agent',
        role: 'Create user interface and layout components',
        focusArea: 'User Interface',
        requirements: [requirement],
        estimatedTime: 25,
        complexity: 'medium',
        type: 'frontend',
      };
    }

    // Authentication Agent
    if (reqText.includes('auth') || reqText.includes('login') || reqText.includes('signup') || reqText.includes('jwt')) {
      return {
        id: 'auth_agent',
        role: 'Implement authentication and authorization',
        focusArea: 'Authentication',
        requirements: [requirement],
        estimatedTime: 30,
        complexity: 'high',
        type: 'security',
      };
    }

    // Integration Agent (APIs, third-party services, MCP, etc.)
    if (reqText.includes('integration') || reqText.includes('mcp') || reqText.includes('server') || 
        reqText.includes('google drive') || reqText.includes('webhook') || reqText.includes('external')) {
      return {
        id: 'integration_agent',
        role: 'Implement external service integrations',
        focusArea: 'External Integrations',
        requirements: [requirement],
        estimatedTime: 35,
        complexity: 'high',
        type: 'integration',
      };
    }

    // Forms Agent
    if (reqText.includes('form') || reqText.includes('input') || reqText.includes('validation')) {
      return {
        id: 'forms_agent',
        role: 'Build form components and validation',
        focusArea: 'Forms & Validation',
        requirements: [requirement],
        estimatedTime: 20,
        complexity: 'medium',
        type: 'component',
      };
    }

    // File/Storage Agent
    if (reqText.includes('file') || reqText.includes('upload') || reqText.includes('storage') || 
        reqText.includes('download') || reqText.includes('write capabilities')) {
      return {
        id: 'storage_agent',
        role: 'Implement file operations and storage',
        focusArea: 'File Operations',
        requirements: [requirement],
        estimatedTime: 25,
        complexity: 'medium',
        type: 'storage',
      };
    }

    // Testing Agent
    if (reqText.includes('test') || reqText.includes('testing') || reqText.includes('spec')) {
      return {
        id: 'testing_agent',
        role: 'Create and maintain test suites',
        focusArea: 'Testing',
        requirements: [requirement],
        estimatedTime: 20,
        complexity: 'medium',
        type: 'testing',
      };
    }

    // Generic/Fallback Agent - Create agent for unrecognized patterns
    console.log(`⚠️  Creating generic agent for unrecognized requirement: "${requirement}"`);
    
    // Generate a simple ID from the requirement text
    const agentId = reqText
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .split(' ')
      .slice(0, 2) // Take first 2 words
      .join('_') + '_agent';

    return {
      id: agentId,
      role: `Implement: ${requirement}`,
      focusArea: 'Custom Feature',
      requirements: [requirement],
      estimatedTime: 25,
      complexity: 'medium',
      type: 'feature',
    };
  }

  /**
   * Generate complete deployment plan
   */
  async generateDeploymentPlan(decompositionPlan) {
    const deploymentPlan = {
      taskId: this.linearIssue.id,
      taskTitle: this.linearIssue.title,
      decompositionStrategy: 'parallel_feature_streams',
      estimatedTotalTime: `${decompositionPlan.totalEstimatedTime} minutes`,
      parallelismFactor: `${decompositionPlan.parallelismFactor}x faster than sequential`,

      parallelAgents: decompositionPlan.agents.map((agent) => ({
        agentId: agent.id,
        agentRole: agent.role,
        focusArea: agent.focusArea,
        dependencies: agent.dependencies || [],

        filesToCreate: agent.filesToCreate || [],
        filesToModify: agent.filesToModify || [],
        testContracts: agent.testContracts || [],

        validationCriteria: agent.validationCriteria || [],
        estimatedTime: `${agent.estimatedTime} minutes`,
        canStartImmediately: (agent.dependencies || []).length === 0,

        workspaceSetup: {
          contextFile: `workspaces/${agent.id}/agent_context.json`,
          fileList: `workspaces/${agent.id}/files_to_work_on.txt`,
          testContracts: `workspaces/${agent.id}/test_contracts.txt`,
          checklist: `workspaces/${agent.id}/validation_checklist.txt`,
        },
      })),

      integrationPlan: {
        mergeOrder: this.calculateMergeOrder(decompositionPlan.agents),
        validationSteps: [
          'Run agent-specific tests',
          'Cross-agent integration tests',
          'Full test suite validation',
          'E2E testing',
        ],
        estimatedIntegrationTime: '10 minutes',
      },

      coordination: {
        statusFile: 'shared/coordination/parallel-agent-status.json',
        resultsAggregation: 'shared/coordination/agent-results.json',
        conflictResolution: 'shared/coordination/merge-conflicts.json',
      },
    };

    return deploymentPlan;
  }

  /**
   * Save deployment plan to file system
   */
  async saveDeploymentPlan(plan, issueId) {
    const outputDir = path.join(this.projectRoot, 'shared', 'deployment-plans');
    await fs.mkdir(outputDir, { recursive: true });

    const filename = `${issueId.toLowerCase()}-deployment-plan.json`;
    const filepath = path.join(outputDir, filename);

    await fs.writeFile(filepath, JSON.stringify(plan, null, 2));
    return filepath;
  }

  /**
   * Report decomposition results
   */
  reportDecomposition(plan) {
    plan.parallelAgents.forEach((agent) => {
      const _canStart = agent.canStartImmediately ? '✅' : '⏳';
    });
    const _immediateAgents = plan.parallelAgents.filter((a) => a.canStartImmediately);
    const dependentAgents = plan.parallelAgents.filter((a) => !a.canStartImmediately);
    if (dependentAgents.length > 0) {
    }
  }

  // Helper methods for analysis and prediction

  async findTestFiles(dir) {
    const files = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...(await this.findTestFiles(fullPath)));
        } else if (entry.name.match(/\.(test|spec)\.(js|ts|jsx|tsx)$/)) {
          files.push(fullPath);
        }
      }
    } catch (_e) {
      // Directory doesn't exist or no permission
    }
    return files;
  }

  categorizeTests(testFiles) {
    const categories = {
      component: [],
      integration: [],
      api: [],
      e2e: [],
      unit: [],
    };

    testFiles.forEach((file) => {
      const filename = path.basename(file).toLowerCase();
      if (filename.includes('component')) {
        categories.component.push(file);
      } else if (filename.includes('integration')) {
        categories.integration.push(file);
      } else if (filename.includes('api')) {
        categories.api.push(file);
      } else if (filename.includes('e2e')) {
        categories.e2e.push(file);
      } else {
        categories.unit.push(file);
      }
    });

    return categories;
  }

  extractTestContracts(_testFiles) {
    // In a real implementation, this would parse test files to extract test names and contracts
    return {
      routing: ['routing.test.js', 'navigation.test.js'],
      components: ['chart-components.test.js', 'ui-components.test.js'],
      api: ['api.test.js', 'data-integration.test.js'],
      dashboard: ['dashboard.test.js', 'visualization.test.js'],
    };
  }

  identifyCoverageAreas(_testFiles) {
    return ['routing', 'components', 'api', 'database', 'ui', 'integration'];
  }

  async analyzeDirectory(dir) {
    const structure = { files: [], subdirs: [] };
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          structure.subdirs.push(entry.name);
        } else {
          structure.files.push(entry.name);
        }
      }
    } catch (_e) {
      // Directory doesn't exist
    }
    return structure;
  }

  identifyArchitecture(structure) {
    if (structure.app) {
      return 'Next.js App Router';
    }
    if (structure.pages) {
      return 'Next.js Pages Router';
    }
    if (structure.src) {
      return 'React/TypeScript';
    }
    return 'Unknown';
  }

  findComponents(structure) {
    const components = [];
    ['components', 'src/components', 'app/components'].forEach((dir) => {
      if (structure[dir] || structure.src?.subdirs?.includes('components')) {
        components.push(`${dir}/*`);
      }
    });
    return components;
  }

  findApiRoutes(structure) {
    const apis = [];
    if (structure.app?.subdirs?.includes('api')) {
      apis.push('app/api/*');
    }
    if (structure.pages?.subdirs?.includes('api')) {
      apis.push('pages/api/*');
    }
    return apis;
  }

  findUtilities(structure) {
    const utils = [];
    if (structure.lib) {
      utils.push('lib/*');
    }
    if (structure.src?.subdirs?.includes('lib')) {
      utils.push('src/lib/*');
    }
    return utils;
  }

  findStyles(structure) {
    const styles = [];
    if (structure.styles) {
      styles.push('styles/*');
    }
    if (structure.src?.subdirs?.includes('styles')) {
      styles.push('src/styles/*');
    }
    return styles;
  }

  extractRequirements(description) {
    // Simple regex to extract numbered requirements
    const requirements = [];
    const lines = description.split('\n');
    lines.forEach((line) => {
      const match = line.match(/^\s*\d+\.\s*(.+)/);
      if (match) {
        requirements.push(match[1].trim());
      }
    });
    return requirements;
  }

  optimizeForParallelism(agents) {
    // Group agents by type and ensure they can work independently
    return agents.map((agent) => ({
      ...agent,
      isolation: this.calculateIsolation(agent),
      parallelizable: this.isParallelizable(agent),
    }));
  }

  calculateEnhancedDependencies(agents) {
    return agents.map((agent) => {
      const dependencies = agent.dependencies || [];

      // Add file-based dependencies - agents that modify the same files should not run in parallel
      agents.forEach(otherAgent => {
        if (otherAgent.id === agent.id) return;
        
        const sharedFilesToModify = agent.filesToModify?.filter(file => 
          otherAgent.filesToModify?.includes(file)
        ) || [];
        
        if (sharedFilesToModify.length > 0) {
          console.log(`   🔗 Detected file conflict between ${agent.id} and ${otherAgent.id}: ${sharedFilesToModify.join(', ')}`);
          if (!dependencies.includes(otherAgent.id)) {
            dependencies.push(otherAgent.id);
          }
        }
      });

      return {
        ...agent,
        dependencies,
      };
    });
  }

  calculateTotalTime(agents) {
    if (!agents || agents.length === 0) {
      return 0; // Prevent -Infinity
    }

    const immediateAgents = agents.filter((a) => (a.dependencies || []).length === 0);
    const dependentAgents = agents.filter((a) => (a.dependencies || []).length > 0);

    const maxImmediateTime = immediateAgents.length > 0 ? Math.max(...immediateAgents.map((a) => a.estimatedTime)) : 0;
    const maxDependentTime =
      dependentAgents.length > 0 ? Math.max(...dependentAgents.map((a) => a.estimatedTime)) : 0;

    return maxImmediateTime + maxDependentTime;
  }

  calculateParallelismFactor(agents) {
    if (!agents || agents.length === 0) {
      return 1; // Prevent division by zero
    }

    const sequentialTime = agents.reduce((sum, agent) => sum + agent.estimatedTime, 0);
    const parallelTime = this.calculateTotalTime(agents);
    
    if (parallelTime === 0) {
      return 1; // Prevent division by zero
    }
    
    return Math.round((sequentialTime / parallelTime) * 10) / 10;
  }

  predictFilesToCreate(agent) {
    const files = [];

    switch (agent.id) {
      case 'routing_agent':
        files.push('app/providers/[id]/page.tsx', 'app/providers/[id]/loading.tsx');
        break;
      case 'chart_agent':
        files.push(
          'components/charts/KPIChart.tsx',
          'components/charts/ProviderMetrics.tsx',
          'lib/chart-utils.ts'
        );
        break;
      case 'data_agent':
        files.push('lib/kpi-calculations.ts', 'lib/provider-analytics.ts');
        break;
      case 'ui_agent':
        files.push(
          'components/dashboard/ProviderDashboard.tsx',
          'components/dashboard/MetricsGrid.tsx'
        );
        break;
    }

    return files;
  }

  predictFilesToModify(agent) {
    const files = [];

    switch (agent.id) {
      case 'routing_agent':
        files.push('lib/routing.ts', 'components/navigation.tsx');
        break;
      case 'chart_agent':
        files.push('lib/chart-config.ts', 'components/ui/chart.tsx');
        break;
      case 'data_agent':
        files.push('lib/api/providers.ts', 'lib/database/queries.ts');
        break;
      case 'ui_agent':
        files.push('app/providers/page.tsx', 'components/provider-card.tsx');
        break;
    }

    return files;
  }

  findRelevantTestContracts(agent) {
    const contracts = [];

    switch (agent.id) {
      case 'routing_agent':
        contracts.push('routing.test.js', 'navigation.test.js');
        break;
      case 'chart_agent':
        contracts.push('chart-components.test.js', 'visualization.test.js');
        break;
      case 'data_agent':
        contracts.push('api.test.js', 'data-integration.test.js', 'kpi-logic.test.js');
        break;
      case 'ui_agent':
        contracts.push('dashboard.test.js', 'ui-components.test.js');
        break;
    }

    return contracts;
  }

  generateValidationCriteria(agent) {
    const criteria = [];

    switch (agent.id) {
      case 'routing_agent':
        criteria.push(
          'All provider links navigate correctly',
          'No 404 errors on provider detail pages',
          'Navigation breadcrumbs work'
        );
        break;
      case 'chart_agent':
        criteria.push(
          'Charts render with mock data',
          'Responsive design works on mobile',
          'Chart interactions function properly'
        );
        break;
      case 'data_agent':
        criteria.push(
          'KPI calculations are accurate',
          'Database queries perform well',
          'Data transformations work correctly'
        );
        break;
      case 'ui_agent':
        criteria.push(
          'Dashboard layout is responsive',
          'Provider comparisons work',
          'UI components match design system'
        );
        break;
    }

    return criteria;
  }

  calculateMergeOrder(agents) {
    // Calculate optimal merge order based on dependencies
    const order = [];
    const processed = new Set();

    // First, add agents with no dependencies
    agents
      .filter((a) => (a.dependencies || []).length === 0)
      .forEach((a) => {
        order.push(a.id);
        processed.add(a.id);
      });

    // Then add dependent agents
    agents
      .filter((a) => (a.dependencies || []).length > 0)
      .forEach((a) => {
        order.push(a.id);
      });

    return order;
  }

  calculateIsolation(agent) {
    // Determine how isolated this agent's work is from others
    return agent.type === 'component' ? 'high' : 'medium';
  }

  isParallelizable(_agent) {
    // All agents are designed to be parallelizable
    return true;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    process.exit(1);
  }

  const issueId = args[0];
  const decomposer = new ParallelTaskDecomposer();

  await decomposer.decompose(issueId);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ParallelTaskDecomposer };
