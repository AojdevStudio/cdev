/**
 * Tests for intelligent-agent-generator.js
 */

const { IntelligentAgentGenerator } = require('./intelligent-agent-generator');

describe('IntelligentAgentGenerator', () => {
  let generator;
  
  const mockCodebaseStructure = {
    apis: ['pages/api/auth.ts', 'pages/api/users.ts'],
    components: ['components/Button.tsx', 'components/Form.tsx'],
    pages: ['pages/index.tsx', 'pages/about.tsx'],
    lib: ['lib/utils.ts', 'lib/api.ts'],
    tests: ['__tests__/Button.test.tsx', '__tests__/api.test.ts']
  };

  const mockTestSuiteAnalysis = {
    coverage: 85,
    testFiles: 12,
    testPatterns: ['*.test.ts', '*.test.tsx', '*.spec.ts']
  };

  beforeEach(() => {
    generator = new IntelligentAgentGenerator(mockCodebaseStructure, mockTestSuiteAnalysis);
  });

  describe('constructor', () => {
    test('initializes with codebase structure and test analysis', () => {
      expect(generator.codebaseStructure).toBe(mockCodebaseStructure);
      expect(generator.testSuiteAnalysis).toBe(mockTestSuiteAnalysis);
      expect(generator.workDomains).toBeDefined();
      expect(generator.workDomains.size).toBeGreaterThan(0);
    });
  });

  describe('discoverWorkDomains', () => {
    test('discovers backend domain when APIs exist', () => {
      const domains = generator.discoverWorkDomains();
      
      expect(domains.has('backend')).toBe(true);
      const backendDomain = domains.get('backend');
      expect(backendDomain.id).toBe('backend');
      expect(backendDomain.name).toBe('Backend & API');
      expect(backendDomain.estimatedComplexity).toBe('high');
      expect(backendDomain.baseTime).toBe(30);
    });

    test('discovers frontend domain when components exist', () => {
      const domains = generator.discoverWorkDomains();
      
      expect(domains.has('frontend')).toBe(true);
      const frontendDomain = domains.get('frontend');
      expect(frontendDomain.id).toBe('frontend');
      expect(frontendDomain.name).toBe('Frontend & UI');
      expect(frontendDomain.estimatedComplexity).toBe('medium');
      expect(frontendDomain.baseTime).toBe(25);
    });

    test('discovers all relevant domains', () => {
      const domains = generator.discoverWorkDomains();
      
      expect(domains.has('backend')).toBe(true);
      expect(domains.has('frontend')).toBe(true);
      expect(domains.has('components')).toBe(true);
      expect(domains.has('data')).toBe(true);
      expect(domains.has('infrastructure')).toBe(true);
    });
  });

  describe('analyzeRequirement', () => {
    test('extracts actions from requirement', () => {
      const requirement = 'Create a new authentication system and implement user login';
      const analysis = generator.analyzeRequirement(requirement);
      
      expect(analysis.actions).toContain('create');
      expect(analysis.actions).toContain('implement');
      expect(analysis.originalText).toBe(requirement);
    });

    test('extracts objects from requirement', () => {
      const requirement = 'Build a form with validation for user authentication';
      const analysis = generator.analyzeRequirement(requirement);
      
      expect(analysis.objects).toContain('form');
      expect(analysis.objects).toContain('validation');
      expect(analysis.objects).toContain('authentication');
    });

    test('extracts technologies from requirement', () => {
      const requirement = 'Integrate React components with Next.js API using TypeScript';
      const analysis = generator.analyzeRequirement(requirement);
      
      expect(analysis.technologies).toContain('react');
      expect(analysis.technologies).toContain('next.js');
      expect(analysis.technologies).toContain('typescript');
    });

    test('estimates complexity correctly', () => {
      const simpleReq = 'Fix button color';
      const complexReq = 'Build scalable microservices architecture with security integration and performance optimization';
      
      const simpleAnalysis = generator.analyzeRequirement(simpleReq);
      const complexAnalysis = generator.analyzeRequirement(complexReq);
      
      expect(simpleAnalysis.complexity).toBe('low');
      expect(complexAnalysis.complexity).toBe('high');
    });

    test('suggests appropriate domains', () => {
      const requirement = 'Create API endpoints for user management with database integration';
      const analysis = generator.analyzeRequirement(requirement);
      
      expect(analysis.domains).toContain('backend');
      expect(analysis.domains).toContain('data');
    });
  });

  describe('extractActions', () => {
    test('extracts all action verbs', () => {
      const requirement = 'Create, build, implement, fix, enhance, integrate, configure, and test the system';
      const actions = generator.extractActions(requirement);
      
      expect(actions).toContain('create');
      expect(actions).toContain('build');
      expect(actions).toContain('implement');
      expect(actions).toContain('fix');
      expect(actions).toContain('enhance');
      expect(actions).toContain('integrate');
      expect(actions).toContain('configure');
      expect(actions).toContain('test');
    });

    test('removes duplicate actions', () => {
      const requirement = 'Create and create again, build and build more';
      const actions = generator.extractActions(requirement);
      
      const createCount = actions.filter(a => a === 'create').length;
      const buildCount = actions.filter(a => a === 'build').length;
      
      expect(createCount).toBe(1);
      expect(buildCount).toBe(1);
    });

    test('converts actions to lowercase', () => {
      const requirement = 'CREATE something, BUILD another, IMPLEMENT feature';
      const actions = generator.extractActions(requirement);
      
      expect(actions).toContain('create');
      expect(actions).toContain('build');
      expect(actions).toContain('implement');
      expect(actions).not.toContain('CREATE');
    });
  });

  describe('extractObjects', () => {
    test('extracts all object types', () => {
      const requirement = 'Build forms with API endpoints, database models, and UI components';
      const objects = generator.extractObjects(requirement);
      
      expect(objects).toContain('forms');
      expect(objects).toContain('api');
      expect(objects).toContain('database');
      expect(objects).toContain('component');
      expect(objects).toContain('ui');
    });

    test('extracts authentication-related objects', () => {
      const requirement = 'Implement auth system with login, signup, and JWT tokens';
      const objects = generator.extractObjects(requirement);
      
      expect(objects).toContain('auth');
      expect(objects).toContain('login');
      expect(objects).toContain('signup');
      expect(objects).toContain('jwt');
    });

    test('handles plurals and variations', () => {
      const requirement = 'Create form, forms, and input fields';
      const objects = generator.extractObjects(requirement);
      
      expect(objects).toContain('form');
      expect(objects).toContain('forms');
      expect(objects).toContain('input');
      expect(objects).toContain('field');
    });
  });

  describe('extractTechnologies', () => {
    test('extracts frontend frameworks', () => {
      const requirement = 'Use React with Next.js, Vue, Angular, and Svelte';
      const technologies = generator.extractTechnologies(requirement);
      
      expect(technologies).toContain('react');
      expect(technologies).toContain('next.js');
      expect(technologies).toContain('vue');
      expect(technologies).toContain('angular');
      expect(technologies).toContain('svelte');
    });

    test('extracts backend technologies', () => {
      const requirement = 'Build with Node.js, Express, NestJS, and MongoDB';
      const technologies = generator.extractTechnologies(requirement);
      
      expect(technologies).toContain('node.js');
      expect(technologies).toContain('express');
      expect(technologies).toContain('nestjs');
      expect(technologies).toContain('mongodb');
    });

    test('extracts cloud and infrastructure technologies', () => {
      const requirement = 'Deploy to AWS using Docker and Kubernetes with MCP integration';
      const technologies = generator.extractTechnologies(requirement);
      
      expect(technologies).toContain('aws');
      expect(technologies).toContain('docker');
      expect(technologies).toContain('kubernetes');
      expect(technologies).toContain('mcp');
    });

    test('handles technology variations', () => {
      const requirement = 'Use NextJS, Next.js, nodejs, and Node.js';
      const technologies = generator.extractTechnologies(requirement);
      
      // Should capture both variations
      const nextVariants = technologies.filter(t => t.includes('next'));
      const nodeVariants = technologies.filter(t => t.includes('node'));
      
      expect(nextVariants.length).toBeGreaterThan(0);
      expect(nodeVariants.length).toBeGreaterThan(0);
    });
  });

  describe('estimateComplexity', () => {
    test('returns low complexity for simple requirements', () => {
      const requirement = 'Fix typo';
      const complexity = generator.estimateComplexity(requirement);
      
      expect(complexity).toBe('low');
    });

    test('returns medium complexity for moderate requirements', () => {
      const requirement = 'Add new form component with basic validation using React';
      const complexity = generator.estimateComplexity(requirement);
      
      expect(complexity).toBe('medium');
    });

    test('returns high complexity for complex requirements', () => {
      const requirement = 'Implement secure authentication system with JWT tokens, integrate with multiple OAuth providers, ensure scalability and performance optimization, add comprehensive security measures';
      const complexity = generator.estimateComplexity(requirement);
      
      expect(complexity).toBe('high');
    });

    test('increases complexity for integration keywords', () => {
      const withIntegration = 'Create form with third-party integration';
      const withoutIntegration = 'Create simple form';
      
      const complexityWith = generator.estimateComplexity(withIntegration);
      const complexityWithout = generator.estimateComplexity(withoutIntegration);
      
      // Integration should increase complexity
      expect(['medium', 'high']).toContain(complexityWith);
      expect(complexityWithout).toBe('low');
    });

    test('increases complexity for security keywords', () => {
      const withSecurity = 'Add feature with security considerations';
      const withoutSecurity = 'Add simple feature';
      
      const complexityWith = generator.estimateComplexity(withSecurity);
      const complexityWithout = generator.estimateComplexity(withoutSecurity);
      
      expect(['medium', 'high']).toContain(complexityWith);
      expect(complexityWithout).toBe('low');
    });
  });

  describe('suggestDomains', () => {
    test('suggests frontend for UI-related requirements', () => {
      const requirement = 'Create new UI components with responsive layout';
      const domains = generator.suggestDomains(requirement);
      
      expect(domains).toContain('frontend');
      expect(domains).toContain('components');
    });

    test('suggests backend for API-related requirements', () => {
      const requirement = 'Build REST API with database integration';
      const domains = generator.suggestDomains(requirement);
      
      expect(domains).toContain('backend');
      expect(domains).toContain('data');
    });

    test('suggests multiple domains for complex requirements', () => {
      const requirement = 'Create full-stack feature with API, UI components, and file upload';
      const domains = generator.suggestDomains(requirement);
      
      expect(domains).toContain('frontend');
      expect(domains).toContain('backend');
      expect(domains).toContain('components');
      expect(domains).toContain('data');
    });

    test('suggests infrastructure for config-related requirements', () => {
      const requirement = 'Setup MCP configuration and deploy infrastructure';
      const domains = generator.suggestDomains(requirement);
      
      expect(domains).toContain('infrastructure');
    });
  });

  describe('mapToWorkDomain', () => {
    test('maps to best matching domain', () => {
      const requirementAnalysis = {
        domains: ['backend', 'data'],
        objects: ['api', 'database'],
        actions: ['implement', 'integrate'],
        complexity: 'high'
      };
      
      const domain = generator.mapToWorkDomain(requirementAnalysis);
      
      expect(domain.id).toBe('backend');
    });

    test('creates custom domain when no matches found', () => {
      const requirementAnalysis = {
        domains: ['nonexistent'],
        objects: ['unknown'],
        actions: ['mystery'],
        complexity: 'medium'
      };
      
      const domain = generator.mapToWorkDomain(requirementAnalysis);
      
      expect(domain.id).toBe('custom');
      expect(domain.name).toBe('Custom Feature');
      expect(domain.estimatedComplexity).toBe('medium');
    });

    test('scores domains based on object matches', () => {
      const requirementAnalysis = {
        domains: ['frontend', 'backend'],
        objects: ['component', 'ui', 'form'], // More frontend objects
        actions: ['create'],
        complexity: 'medium'
      };
      
      const domain = generator.mapToWorkDomain(requirementAnalysis);
      
      expect(domain.id).toBe('frontend');
    });
  });

  describe('scoreDomainMatch', () => {
    test('scores based on object matches', () => {
      const domain = generator.workDomains.get('frontend');
      const requirementAnalysis = {
        objects: ['component', 'ui', 'form'],
        actions: ['create'],
        complexity: 'medium'
      };
      
      const score = generator.scoreDomainMatch(domain, requirementAnalysis);
      
      expect(score).toBeGreaterThan(0);
    });

    test('scores based on action matches', () => {
      const domain = generator.workDomains.get('backend');
      const requirementAnalysis = {
        objects: [],
        actions: ['implement', 'integrate'],
        complexity: 'high'
      };
      
      const score = generator.scoreDomainMatch(domain, requirementAnalysis);
      
      expect(score).toBeGreaterThan(0);
    });

    test('adds bonus for complexity alignment', () => {
      const domain = generator.workDomains.get('backend'); // high complexity
      const matchingAnalysis = {
        objects: [],
        actions: [],
        complexity: 'high'
      };
      const mismatchAnalysis = {
        objects: [],
        actions: [],
        complexity: 'low'
      };
      
      const matchScore = generator.scoreDomainMatch(domain, matchingAnalysis);
      const mismatchScore = generator.scoreDomainMatch(domain, mismatchAnalysis);
      
      expect(matchScore).toBeGreaterThan(mismatchScore);
    });
  });

  describe('createAgentFromDomain', () => {
    test('creates agent with all required fields', () => {
      const domain = generator.workDomains.get('backend');
      const requirement = 'Build user authentication API';
      const requirementAnalysis = {
        objects: ['api', 'authentication'],
        actions: ['build'],
        complexity: 'high',
        technologies: [],
        domains: ['backend']
      };
      
      const agent = generator.createAgentFromDomain(domain, requirement, requirementAnalysis);
      
      expect(agent.id).toContain('backend');
      expect(agent.id).toContain('api');
      expect(agent.role).toContain('Backend & API');
      expect(agent.role).toContain(requirement);
      expect(agent.focusArea).toBe('Backend & API');
      expect(agent.requirements).toEqual([requirement]);
      expect(agent.estimatedTime).toBeGreaterThan(0);
      expect(agent.complexity).toBe('high');
      expect(agent.type).toBe('backend');
      expect(agent.filesToCreate).toBeDefined();
      expect(agent.filesToModify).toBeDefined();
      expect(agent.testContracts).toBeDefined();
    });

    test('adjusts time based on complexity', () => {
      const domain = { id: 'test', name: 'Test', baseTime: 20 };
      
      const lowComplexity = { complexity: 'low' };
      const highComplexity = { complexity: 'high' };
      
      const lowAgent = generator.createAgentFromDomain(domain, 'req', lowComplexity);
      const highAgent = generator.createAgentFromDomain(domain, 'req', highComplexity);
      
      expect(lowAgent.estimatedTime).toBeLessThan(20);
      expect(highAgent.estimatedTime).toBeGreaterThan(20);
    });

    test('includes metadata for debugging', () => {
      const domain = generator.workDomains.get('frontend');
      const requirementAnalysis = {
        objects: ['form'],
        actions: ['create'],
        complexity: 'medium',
        technologies: ['react'],
        domains: ['frontend']
      };
      
      const agent = generator.createAgentFromDomain(domain, 'Create form', requirementAnalysis);
      
      expect(agent._analysis).toBe(requirementAnalysis);
      expect(agent._workDomain).toBe('frontend');
    });
  });

  describe('generateAgentForRequirement', () => {
    test('generates complete agent for simple requirement', () => {
      const requirement = 'Fix login button styling';
      const agent = generator.generateAgentForRequirement(requirement);
      
      expect(agent).toBeDefined();
      expect(agent.id).toBeDefined();
      expect(agent.role).toContain(requirement);
      expect(agent.complexity).toBe('low');
      expect(agent.estimatedTime).toBeGreaterThan(0);
    });

    test('generates backend agent for API requirement', () => {
      const requirement = 'Create REST API endpoints for user management with database integration';
      const agent = generator.generateAgentForRequirement(requirement);
      
      expect(agent.type).toBe('backend');
      expect(agent.focusArea).toBe('Backend & API');
      expect(agent.complexity).toBe('high');
    });

    test('generates frontend agent for UI requirement', () => {
      const requirement = 'Build responsive dashboard components with charts and graphs';
      const agent = generator.generateAgentForRequirement(requirement);
      
      expect(agent.type).toBe('frontend');
      expect(agent.focusArea).toBe('Frontend & UI');
    });

    test('handles complex multi-domain requirements', () => {
      const requirement = 'Implement full-stack feature with React frontend, Node.js API, MongoDB integration, and comprehensive testing';
      const agent = generator.generateAgentForRequirement(requirement);
      
      expect(agent).toBeDefined();
      expect(agent.complexity).toBe('high');
      expect(agent.estimatedTime).toBeGreaterThan(30);
    });
  });

  describe('helper methods', () => {
    test('hasBackendCapabilities returns true when APIs exist', () => {
      expect(generator.hasBackendCapabilities()).toBe(true);
    });

    test('hasFrontendCapabilities returns true when components exist', () => {
      expect(generator.hasFrontendCapabilities()).toBe(true);
    });

    test('hasComponentLibrary returns true', () => {
      expect(generator.hasComponentLibrary()).toBe(true);
    });

    test('hasDataCapabilities returns true', () => {
      expect(generator.hasDataCapabilities()).toBe(true);
    });

    test('hasInfrastructureConfig returns true', () => {
      expect(generator.hasInfrastructureConfig()).toBe(true);
    });

    test('getBackendDirectories returns correct paths', () => {
      const dirs = generator.getBackendDirectories();
      expect(dirs).toContain('api/');
      expect(dirs).toContain('lib/api/');
      expect(dirs).toContain('server/');
      expect(dirs).toContain('backend/');
    });

    test('getBackendTestPatterns returns test patterns', () => {
      const patterns = generator.getBackendTestPatterns();
      expect(patterns).toContain('api/*.test.ts');
      expect(patterns).toContain('server/*.test.ts');
      expect(patterns).toContain('integration/*.test.ts');
    });

    test('getFrontendDirectories returns correct paths', () => {
      const dirs = generator.getFrontendDirectories();
      expect(dirs).toContain('components/');
      expect(dirs).toContain('pages/');
      expect(dirs).toContain('app/');
      expect(dirs).toContain('src/components/');
    });

    test('getFrontendTestPatterns returns test patterns', () => {
      const patterns = generator.getFrontendTestPatterns();
      expect(patterns).toContain('components/*.test.tsx');
      expect(patterns).toContain('pages/*.test.tsx');
      expect(patterns).toContain('ui/*.test.tsx');
    });
  });

  describe('getDomainObjects', () => {
    test('returns frontend objects', () => {
      const domain = { id: 'frontend' };
      const objects = generator.getDomainObjects(domain);
      
      expect(objects).toContain('component');
      expect(objects).toContain('ui');
      expect(objects).toContain('form');
      expect(objects).toContain('layout');
    });

    test('returns backend objects', () => {
      const domain = { id: 'backend' };
      const objects = generator.getDomainObjects(domain);
      
      expect(objects).toContain('api');
      expect(objects).toContain('service');
      expect(objects).toContain('database');
      expect(objects).toContain('integration');
    });

    test('returns empty array for unknown domain', () => {
      const domain = { id: 'unknown' };
      const objects = generator.getDomainObjects(domain);
      
      expect(objects).toEqual([]);
    });
  });

  describe('getDomainActions', () => {
    test('returns frontend actions', () => {
      const domain = { id: 'frontend' };
      const actions = generator.getDomainActions(domain);
      
      expect(actions).toContain('create');
      expect(actions).toContain('build');
      expect(actions).toContain('design');
      expect(actions).toContain('implement');
    });

    test('returns backend actions', () => {
      const domain = { id: 'backend' };
      const actions = generator.getDomainActions(domain);
      
      expect(actions).toContain('implement');
      expect(actions).toContain('integrate');
      expect(actions).toContain('configure');
      expect(actions).toContain('develop');
    });

    test('returns empty array for unknown domain', () => {
      const domain = { id: 'unknown' };
      const actions = generator.getDomainActions(domain);
      
      expect(actions).toEqual([]);
    });
  });

  describe('createCustomDomain', () => {
    test('creates custom domain with analysis properties', () => {
      const analysis = {
        complexity: 'medium',
        objects: ['widget'],
        actions: ['build']
      };
      
      const domain = generator.createCustomDomain(analysis);
      
      expect(domain.id).toBe('custom');
      expect(domain.name).toBe('Custom Feature');
      expect(domain.estimatedComplexity).toBe('medium');
      expect(domain.baseTime).toBe(25);
    });
  });

  describe('predictFilesToCreate', () => {
    test('predicts form files for frontend domain', () => {
      const domain = { id: 'frontend' };
      const analysis = { objects: ['form'] };
      
      const files = generator.predictFilesToCreate(domain, analysis);
      
      expect(files).toContain('components/forms/NewForm.tsx');
    });

    test('predicts API files for backend domain', () => {
      const domain = { id: 'backend' };
      const analysis = { objects: ['api'] };
      
      const files = generator.predictFilesToCreate(domain, analysis);
      
      expect(files).toContain('pages/api/new-endpoint.ts');
    });

    test('returns empty array for non-matching combinations', () => {
      const domain = { id: 'data' };
      const analysis = { objects: ['button'] };
      
      const files = generator.predictFilesToCreate(domain, analysis);
      
      expect(files).toEqual([]);
    });
  });

  describe('predictFilesToModify', () => {
    test('returns empty array (simplified implementation)', () => {
      const domain = { id: 'frontend' };
      const analysis = { objects: ['form'] };
      
      const files = generator.predictFilesToModify(domain, analysis);
      
      expect(files).toEqual([]);
    });
  });

  describe('findRelevantTests', () => {
    test('returns domain test patterns', () => {
      const domain = {
        id: 'frontend',
        testPatterns: ['*.test.tsx', '*.spec.tsx']
      };
      const analysis = {};
      
      const tests = generator.findRelevantTests(domain, analysis);
      
      expect(tests).toEqual(['*.test.tsx', '*.spec.tsx']);
    });

    test('returns empty array when no test patterns', () => {
      const domain = { id: 'custom' };
      const analysis = {};
      
      const tests = generator.findRelevantTests(domain, analysis);
      
      expect(tests).toEqual([]);
    });
  });

  describe('generateAgentId', () => {
    test('generates ID with domain and object', () => {
      const domain = { id: 'backend' };
      const analysis = { objects: ['api', 'auth'] };
      
      const id = generator.generateAgentId(domain, analysis);
      
      expect(id).toBe('backend_api_agent');
    });

    test('uses feature as default when no objects', () => {
      const domain = { id: 'frontend' };
      const analysis = { objects: [] };
      
      const id = generator.generateAgentId(domain, analysis);
      
      expect(id).toBe('frontend_feature_agent');
    });
  });

  describe('calculateEstimatedTime', () => {
    test('uses base time for medium complexity', () => {
      const domain = { baseTime: 30 };
      const analysis = { complexity: 'medium' };
      
      const time = generator.calculateEstimatedTime(domain, analysis);
      
      expect(time).toBe(30);
    });

    test('increases time for high complexity', () => {
      const domain = { baseTime: 30 };
      const analysis = { complexity: 'high' };
      
      const time = generator.calculateEstimatedTime(domain, analysis);
      
      expect(time).toBe(45); // 30 * 1.5
    });

    test('decreases time for low complexity', () => {
      const domain = { baseTime: 30 };
      const analysis = { complexity: 'low' };
      
      const time = generator.calculateEstimatedTime(domain, analysis);
      
      expect(time).toBe(21); // 30 * 0.7
    });
  });

  describe('edge cases', () => {
    test('handles empty requirement', () => {
      const requirement = '';
      const agent = generator.generateAgentForRequirement(requirement);
      
      expect(agent).toBeDefined();
      expect(agent.id).toBeDefined();
      expect(agent.complexity).toBe('low');
    });

    test('handles requirement with only whitespace', () => {
      const requirement = '   \n\t  ';
      const agent = generator.generateAgentForRequirement(requirement);
      
      expect(agent).toBeDefined();
      expect(agent.complexity).toBe('low');
    });

    test('handles requirement with special characters', () => {
      const requirement = 'Create @#$% component with &*() validation';
      const agent = generator.generateAgentForRequirement(requirement);
      
      expect(agent).toBeDefined();
      expect(agent._analysis.objects).toContain('component');
      expect(agent._analysis.objects).toContain('validation');
    });

    test('handles very long requirement', () => {
      const requirement = 'A'.repeat(1000) + ' create API endpoint';
      const agent = generator.generateAgentForRequirement(requirement);
      
      expect(agent).toBeDefined();
      expect(agent.complexity).toBe('high'); // Length contributes to complexity
    });

    test('handles requirement with no matching domains', () => {
      const requirement = 'Do something mysterious with unknown technology';
      const agent = generator.generateAgentForRequirement(requirement);
      
      expect(agent).toBeDefined();
      expect(agent.type).toBe('custom');
      expect(agent.focusArea).toBe('Custom Feature');
    });

    test('handles empty codebase structure', () => {
      const emptyGenerator = new IntelligentAgentGenerator({}, {});
      const requirement = 'Create new feature';
      const agent = emptyGenerator.generateAgentForRequirement(requirement);
      
      expect(agent).toBeDefined();
      expect(agent.type).toBe('custom');
    });
  });
});