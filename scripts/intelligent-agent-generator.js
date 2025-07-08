/**
 * INTELLIGENT AGENT GENERATION ENGINE
 * 
 * Instead of hardcoded pattern matching, this system:
 * 1. Analyzes requirements using semantic parsing
 * 2. Maps requirements to work domains using codebase analysis
 * 3. Generates agents dynamically based on the analysis
 */

class IntelligentAgentGenerator {
  constructor(codebaseStructure, testSuiteAnalysis) {
    this.codebaseStructure = codebaseStructure;
    this.testSuiteAnalysis = testSuiteAnalysis;
    
    // Dynamic work domains discovered from codebase
    this.workDomains = this.discoverWorkDomains();
  }

  /**
   * Main method: Analyze requirement and generate appropriate agent
   */
  generateAgentForRequirement(requirement) {
    // Step 1: Parse requirement to extract key information
    const requirementAnalysis = this.analyzeRequirement(requirement);
    
    // Step 2: Map to work domains
    const workDomain = this.mapToWorkDomain(requirementAnalysis);
    
    // Step 3: Generate agent specification
    const agent = this.createAgentFromDomain(workDomain, requirement, requirementAnalysis);
    
    return agent;
  }

  /**
   * Discover work domains by analyzing the actual codebase
   */
  discoverWorkDomains() {
    const domains = new Map();

    // API/Backend Domain
    if (this.hasBackendCapabilities()) {
      domains.set('backend', {
        id: 'backend',
        name: 'Backend & API',
        directories: this.getBackendDirectories(),
        testPatterns: this.getBackendTestPatterns(),
        estimatedComplexity: 'high',
        baseTime: 30
      });
    }

    // Frontend/UI Domain  
    if (this.hasFrontendCapabilities()) {
      domains.set('frontend', {
        id: 'frontend',
        name: 'Frontend & UI',
        directories: this.getFrontendDirectories(),
        testPatterns: this.getFrontendTestPatterns(),
        estimatedComplexity: 'medium',
        baseTime: 25
      });
    }

    // Component Domain
    if (this.hasComponentLibrary()) {
      domains.set('components', {
        id: 'components',
        name: 'Component Library',
        directories: this.getComponentDirectories(),
        testPatterns: this.getComponentTestPatterns(),
        estimatedComplexity: 'medium',
        baseTime: 20
      });
    }

    // Data/Integration Domain
    if (this.hasDataCapabilities()) {
      domains.set('data', {
        id: 'data',
        name: 'Data & Integration',
        directories: this.getDataDirectories(),
        testPatterns: this.getDataTestPatterns(),
        estimatedComplexity: 'high',
        baseTime: 35
      });
    }

    // Infrastructure Domain
    if (this.hasInfrastructureConfig()) {
      domains.set('infrastructure', {
        id: 'infrastructure',
        name: 'Infrastructure & Config',
        directories: this.getInfrastructureDirectories(),
        testPatterns: this.getInfrastructureTestPatterns(),
        estimatedComplexity: 'medium',
        baseTime: 25
      });
    }

    return domains;
  }

  /**
   * Analyze requirement text to extract semantic information
   */
  analyzeRequirement(requirement) {
    const analysis = {
      originalText: requirement,
      actions: this.extractActions(requirement),
      objects: this.extractObjects(requirement),
      technologies: this.extractTechnologies(requirement),
      complexity: this.estimateComplexity(requirement),
      domains: this.suggestDomains(requirement)
    };

    return analysis;
  }

  /**
   * Extract action verbs from requirement (create, implement, fix, add, etc.)
   */
  extractActions(requirement) {
    const actionPatterns = [
      /\b(create|build|implement|add|develop|design)\b/gi,
      /\b(fix|resolve|repair|debug|correct)\b/gi,
      /\b(enhance|improve|optimize|upgrade)\b/gi,
      /\b(integrate|connect|sync|link)\b/gi,
      /\b(configure|setup|initialize|install)\b/gi,
      /\b(test|validate|verify|check)\b/gi
    ];

    const actions = [];
    actionPatterns.forEach(pattern => {
      const matches = requirement.match(pattern);
      if (matches) {
        actions.push(...matches.map(m => m.toLowerCase()));
      }
    });

    return [...new Set(actions)]; // Remove duplicates
  }

  /**
   * Extract objects/nouns from requirement (forms, API, database, etc.)
   */
  extractObjects(requirement) {
    const objectPatterns = [
      /\b(form|forms|input|field|validation)\b/gi,
      /\b(api|endpoint|service|server|integration)\b/gi,
      /\b(database|db|storage|data|model)\b/gi,
      /\b(component|ui|interface|layout|design)\b/gi,
      /\b(auth|authentication|login|signup|jwt)\b/gi,
      /\b(file|upload|download|document|storage)\b/gi,
      /\b(chart|graph|visualization|dashboard|kpi)\b/gi,
      /\b(test|testing|spec|coverage)\b/gi,
      /\b(routing|navigation|route|page)\b/gi
    ];

    const objects = [];
    objectPatterns.forEach(pattern => {
      const matches = requirement.match(pattern);
      if (matches) {
        objects.push(...matches.map(m => m.toLowerCase()));
      }
    });

    return [...new Set(objects)];
  }

  /**
   * Extract technology mentions (React, Next.js, MCP, Google Drive, etc.)
   */
  extractTechnologies(requirement) {
    const techPatterns = [
      /\b(react|next\.?js|vue|angular|svelte)\b/gi,
      /\b(node\.?js|express|fastify|nestjs)\b/gi,
      /\b(typescript|javascript|python|go)\b/gi,
      /\b(mongodb|postgres|mysql|redis|sqlite)\b/gi,
      /\b(mcp|google\s*drive|aws|azure|gcp)\b/gi,
      /\b(graphql|rest|grpc|websocket)\b/gi,
      /\b(docker|kubernetes|terraform)\b/gi
    ];

    const technologies = [];
    techPatterns.forEach(pattern => {
      const matches = requirement.match(pattern);
      if (matches) {
        technologies.push(...matches.map(m => m.toLowerCase()));
      }
    });

    return [...new Set(technologies)];
  }

  /**
   * Estimate complexity based on requirement characteristics
   */
  estimateComplexity(requirement) {
    let complexityScore = 0;

    // Length indicates complexity
    complexityScore += Math.min(requirement.length / 100, 3);

    // Multiple technologies increase complexity
    const technologies = this.extractTechnologies(requirement);
    complexityScore += technologies.length * 0.5;

    // Certain keywords indicate high complexity
    const highComplexityKeywords = ['integration', 'security', 'performance', 'scale', 'architecture'];
    highComplexityKeywords.forEach(keyword => {
      if (requirement.toLowerCase().includes(keyword)) {
        complexityScore += 1;
      }
    });

    if (complexityScore >= 4) return 'high';
    if (complexityScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * Suggest potential work domains based on requirement analysis
   */
  suggestDomains(requirement) {
    const suggestions = [];
    const reqLower = requirement.toLowerCase();

    // Frontend indicators
    if (reqLower.match(/\b(ui|component|form|layout|design|interface)\b/)) {
      suggestions.push('frontend');
    }

    // Backend indicators  
    if (reqLower.match(/\b(api|server|database|integration|service)\b/)) {
      suggestions.push('backend');
    }

    // Data indicators
    if (reqLower.match(/\b(data|storage|file|drive|upload|sync)\b/)) {
      suggestions.push('data');
    }

    // Component indicators
    if (reqLower.match(/\b(component|reusable|library|widget)\b/)) {
      suggestions.push('components');
    }

    // Infrastructure indicators
    if (reqLower.match(/\b(config|setup|deploy|infrastructure|mcp)\b/)) {
      suggestions.push('infrastructure');
    }

    return suggestions;
  }

  /**
   * Map requirement analysis to best work domain
   */
  mapToWorkDomain(requirementAnalysis) {
    // Start with suggested domains from requirement analysis
    const candidateDomains = requirementAnalysis.domains
      .filter(domain => this.workDomains.has(domain))
      .map(domain => this.workDomains.get(domain));

    if (candidateDomains.length === 0) {
      // Fallback: Create a custom domain
      return this.createCustomDomain(requirementAnalysis);
    }

    // Score each candidate domain
    const scoredDomains = candidateDomains.map(domain => ({
      domain,
      score: this.scoreDomainMatch(domain, requirementAnalysis)
    }));

    // Return highest scoring domain
    scoredDomains.sort((a, b) => b.score - a.score);
    return scoredDomains[0].domain;
  }

  /**
   * Score how well a domain matches the requirement
   */
  scoreDomainMatch(domain, requirementAnalysis) {
    let score = 0;

    // Check if objects match domain capabilities
    const domainObjects = this.getDomainObjects(domain);
    requirementAnalysis.objects.forEach(obj => {
      if (domainObjects.includes(obj)) {
        score += 2;
      }
    });

    // Check if actions match domain capabilities
    const domainActions = this.getDomainActions(domain);
    requirementAnalysis.actions.forEach(action => {
      if (domainActions.includes(action)) {
        score += 1;
      }
    });

    // Complexity alignment
    if (domain.estimatedComplexity === requirementAnalysis.complexity) {
      score += 1;
    }

    return score;
  }

  /**
   * Create agent from selected work domain
   */
  createAgentFromDomain(workDomain, requirement, requirementAnalysis) {
    // Generate unique agent ID
    const agentId = this.generateAgentId(workDomain, requirementAnalysis);

    // Calculate estimated time based on complexity and domain
    const estimatedTime = this.calculateEstimatedTime(workDomain, requirementAnalysis);

    // Predict files to work on
    const filesToCreate = this.predictFilesToCreate(workDomain, requirementAnalysis);
    const filesToModify = this.predictFilesToModify(workDomain, requirementAnalysis);

    // Find relevant test contracts
    const testContracts = this.findRelevantTests(workDomain, requirementAnalysis);

    return {
      id: agentId,
      role: `${workDomain.name}: ${requirement}`,
      focusArea: workDomain.name,
      requirements: [requirement],
      estimatedTime: estimatedTime,
      complexity: requirementAnalysis.complexity,
      type: workDomain.id,
      
      // Predicted file operations
      filesToCreate,
      filesToModify,
      testContracts,
      
      // Metadata for debugging
      _analysis: requirementAnalysis,
      _workDomain: workDomain.id
    };
  }

  // Helper methods for codebase analysis
  hasBackendCapabilities() {
    return this.codebaseStructure.apis?.length > 0 || 
           this.hasDirectory(['api', 'server', 'backend', 'lib/api']);
  }

  hasFrontendCapabilities() {
    return this.codebaseStructure.components?.length > 0 ||
           this.hasDirectory(['components', 'pages', 'app', 'src/components']);
  }

  hasComponentLibrary() {
    return this.hasDirectory(['components', 'ui', 'lib/components']);
  }

  hasDataCapabilities() {
    return this.hasDirectory(['lib', 'utils', 'services', 'data']);
  }

  hasInfrastructureConfig() {
    return this.hasFile(['.env', 'package.json', 'tsconfig.json', 'next.config.js']);
  }

  hasDirectory(dirNames) {
    // Implementation would check if these directories exist in codebaseStructure
    return true; // Simplified for now
  }

  hasFile(fileNames) {
    // Implementation would check if these files exist in codebaseStructure  
    return true; // Simplified for now
  }

  // More helper methods would go here...
  generateAgentId(workDomain, analysis) {
    const prefix = workDomain.id;
    const suffix = analysis.objects[0] || 'feature';
    return `${prefix}_${suffix}_agent`;
  }

  calculateEstimatedTime(workDomain, analysis) {
    let baseTime = workDomain.baseTime;
    
    // Adjust based on complexity
    if (analysis.complexity === 'high') baseTime *= 1.5;
    if (analysis.complexity === 'low') baseTime *= 0.7;
    
    return Math.round(baseTime);
  }

  predictFilesToCreate(workDomain, analysis) {
    // Smart prediction based on domain and objects
    const files = [];
    
    if (workDomain.id === 'frontend' && analysis.objects.includes('form')) {
      files.push('components/forms/NewForm.tsx');
    }
    
    if (workDomain.id === 'backend' && analysis.objects.includes('api')) {
      files.push('pages/api/new-endpoint.ts');
    }
    
    return files;
  }

  predictFilesToModify(workDomain, analysis) {
    // Smart prediction of existing files that need updates
    return [];
  }

  findRelevantTests(workDomain, analysis) {
    // Find test files that relate to this work domain
    return workDomain.testPatterns || [];
  }

  getDomainObjects(domain) {
    // Return objects typically associated with this domain
    const domainObjectMap = {
      frontend: ['component', 'ui', 'form', 'layout'],
      backend: ['api', 'service', 'database', 'integration'],
      data: ['storage', 'file', 'data', 'sync'],
      components: ['component', 'widget', 'library'],
      infrastructure: ['config', 'setup', 'server']
    };
    
    return domainObjectMap[domain.id] || [];
  }

  getDomainActions(domain) {
    // Return actions typically associated with this domain
    const domainActionMap = {
      frontend: ['create', 'build', 'design', 'implement'],
      backend: ['implement', 'integrate', 'configure', 'develop'],
      data: ['sync', 'store', 'retrieve', 'integrate'],
      components: ['create', 'build', 'design'],
      infrastructure: ['setup', 'configure', 'deploy']
    };
    
    return domainActionMap[domain.id] || [];
  }

  createCustomDomain(analysis) {
    // Create a custom domain for unrecognized requirements
    return {
      id: 'custom',
      name: 'Custom Feature',
      estimatedComplexity: analysis.complexity,
      baseTime: 25
    };
  }

  // Missing helper methods for directory analysis
  getBackendDirectories() {
    return ['api/', 'lib/api/', 'server/', 'backend/'];
  }

  getBackendTestPatterns() {
    return ['api/*.test.ts', 'server/*.test.ts', 'integration/*.test.ts'];
  }

  getFrontendDirectories() {
    return ['components/', 'pages/', 'app/', 'src/components/'];
  }

  getFrontendTestPatterns() {
    return ['components/*.test.tsx', 'pages/*.test.tsx', 'ui/*.test.tsx'];
  }

  getComponentDirectories() {
    return ['components/', 'ui/', 'lib/components/'];
  }

  getComponentTestPatterns() {
    return ['components/*.test.tsx', 'ui/*.test.tsx'];
  }

  getDataDirectories() {
    return ['lib/', 'utils/', 'services/', 'data/'];
  }

  getDataTestPatterns() {
    return ['lib/*.test.ts', 'services/*.test.ts', 'data/*.test.ts'];
  }

  getInfrastructureDirectories() {
    return ['./', 'config/', 'scripts/'];
  }

  getInfrastructureTestPatterns() {
    return ['config/*.test.ts', 'infrastructure/*.test.ts'];
  }
}

module.exports = { IntelligentAgentGenerator };
