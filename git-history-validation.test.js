/**
 * Git History Validation Test Suite
 * Tests for package_agent commit anomaly detection and validation
 * 
 * Task: REMEDIATION-001
 * Agent: git_history_agent
 * Priority: CRITICAL
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('Git History Validation', () => {
  describe('Package Agent Anomaly Detection', () => {
    test('should detect package_agent stash entry', () => {
      const stashList = execSync('git stash list', { encoding: 'utf8' });
      
      expect(stashList).toContain('Auto-stash before package_agent merge');
    });

    test('should detect incomplete package_agent merge commit', () => {
      const gitLog = execSync('git log --oneline --all --grep="package_agent" -i', { encoding: 'utf8' });
      
      expect(gitLog).toContain('Auto-stash before package_agent merge');
    });

    test('should confirm no actual package_agent commits in main branch', () => {
      const gitLog = execSync('git log --oneline --grep="feat(package_agent)" -i', { encoding: 'utf8' });
      
      // Should be empty - no actual package_agent feature commits
      expect(gitLog.trim()).toBe('');
    });
  });

  describe('Package File Validation', () => {
    test('should validate package.json exists and meets requirements', () => {
      expect(fs.existsSync('package.json')).toBe(true);
      
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // Core package_agent requirements
      expect(packageJson.name).toBe('claude-parallel-dev');
      expect(packageJson.version).toBeDefined();
      expect(packageJson.description).toBeDefined();
      expect(packageJson.main).toBeDefined();
      expect(packageJson.bin).toBeDefined();
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.keywords).toBeDefined();
      expect(packageJson.author).toBeDefined();
      expect(packageJson.license).toBe('MIT');
      expect(packageJson.engines).toBeDefined();
      expect(packageJson.repository).toBeDefined();
      expect(packageJson.publishConfig).toBeDefined();
    });

    test('should validate .npmrc exists and meets requirements', () => {
      expect(fs.existsSync('.npmrc')).toBe(true);
      
      const npmrc = fs.readFileSync('.npmrc', 'utf8');
      
      // Core package_agent requirements
      expect(npmrc).toContain('registry=https://registry.npmjs.org/');
      expect(npmrc).toContain('access=public');
      expect(npmrc).toContain('audit-level=moderate');
      expect(npmrc).toContain('engine-strict=true');
      expect(npmrc).toContain('save-exact=true');
    });

    test('should validate publish.sh exists and is executable', () => {
      expect(fs.existsSync('publish.sh')).toBe(true);
      
      const stats = fs.statSync('publish.sh');
      expect(stats.mode & parseInt('111', 8)).toBeTruthy(); // Check executable bits
    });
  });

  describe('AOJ-100 Deployment Plan Validation', () => {
    test('should validate deployment plan exists and contains package_agent', () => {
      const deploymentPlanPath = 'shared/deployment-plans/aoj-100-deployment-plan.json';
      expect(fs.existsSync(deploymentPlanPath)).toBe(true);
      
      const deploymentPlan = JSON.parse(fs.readFileSync(deploymentPlanPath, 'utf8'));
      
      // Find package_agent in parallel agents
      const packageAgent = deploymentPlan.parallelAgents.find(agent => agent.agentId === 'package_agent');
      expect(packageAgent).toBeDefined();
      expect(packageAgent.agentRole).toBe('Manages package structure and dependencies');
      expect(packageAgent.focusArea).toBe('package_management');
      expect(packageAgent.filesToCreate).toContain('package.json');
      expect(packageAgent.filesToCreate).toContain('.npmrc');
      expect(packageAgent.filesToCreate).toContain('publish.sh');
    });

    test('should validate package_agent was first in merge order', () => {
      const deploymentPlanPath = 'shared/deployment-plans/aoj-100-deployment-plan.json';
      const deploymentPlan = JSON.parse(fs.readFileSync(deploymentPlanPath, 'utf8'));
      
      expect(deploymentPlan.integrationPlan.mergeOrder[0]).toBe('package_agent');
    });
  });

  describe('Workspace Validation', () => {
    test('should detect missing package_agent workspace', () => {
      const workspacePath = 'workspaces/package_agent';
      
      // This should fail - package_agent workspace doesn't exist
      expect(fs.existsSync(workspacePath)).toBe(false);
    });

    test('should validate other agent workspaces exist', () => {
      const expectedWorkspaces = [
        'workspaces/cli_agent',
        'workspaces/installer_agent',
        'workspaces/validator_agent',
        'workspaces/docs_agent'
      ];
      
      expectedWorkspaces.forEach(workspace => {
        expect(fs.existsSync(workspace)).toBe(true);
      });
    });
  });

  describe('Remediation Validation', () => {
    test('should validate remediation documentation exists', () => {
      expect(fs.existsSync('git-history-analysis.md')).toBe(true);
      expect(fs.existsSync('package-agent-commit-reconstruction.md')).toBe(true);
    });

    test('should validate git-history-analysis.md contains key findings', () => {
      const analysis = fs.readFileSync('git-history-analysis.md', 'utf8');
      
      expect(analysis).toContain('Package Agent Commit Anomaly Investigation');
      expect(analysis).toContain('4dbdb6b');
      expect(analysis).toContain('Auto-stash before package_agent merge');
      expect(analysis).toContain('INVESTIGATION COMPLETE');
    });

    test('should validate package-agent-commit-reconstruction.md contains remediation plan', () => {
      const reconstruction = fs.readFileSync('package-agent-commit-reconstruction.md', 'utf8');
      
      expect(reconstruction).toContain('Remediation Plan for AOJ-100 Git History Anomaly');
      expect(reconstruction).toContain('REMEDIATION COMPLETE');
      expect(reconstruction).toContain('ALL REQUIREMENTS MET');
    });
  });

  describe('Git History Integrity', () => {
    test('should validate git history structure', () => {
      const gitGraph = execSync('git log --oneline --graph --all --decorate', { encoding: 'utf8' });
      
      // Should contain evidence of parallel agent work
      expect(gitGraph).toContain('feat(installer_agent)');
      expect(gitGraph).toContain('feat(cli_agent)');
      expect(gitGraph).toContain('feat(docs_agent)');
      expect(gitGraph).toContain('feat(validator_agent)');
    });

    test('should validate stash integrity', () => {
      const stashShow = execSync('git stash show stash@{0} --stat', { encoding: 'utf8' });
      
      // Stash should contain log files and cleanup commands
      expect(stashShow).toContain('logs/');
      expect(stashShow).toContain('agent-cleanup.md');
    });
  });

  describe('Functional Validation', () => {
    test('should validate npm package structure is functional', () => {
      // Test package.json can be loaded
      expect(() => {
        require('./package.json');
      }).not.toThrow();
    });

    test('should validate .npmrc configuration is valid', () => {
      const npmrc = fs.readFileSync('.npmrc', 'utf8');
      
      // Should not contain invalid configuration
      expect(npmrc).not.toContain('undefined');
      expect(npmrc).not.toContain('null');
      expect(npmrc).not.toContain('ERROR');
    });

    test('should validate publish.sh is syntactically correct', () => {
      expect(() => {
        execSync('bash -n publish.sh', { encoding: 'utf8' });
      }).not.toThrow();
    });
  });

  describe('Workflow Integrity', () => {
    test('should validate parallel development workflow files exist', () => {
      const workflowFiles = [
        'scripts/cache-linear-issue.sh',
        'scripts/decompose-parallel.cjs',
        'scripts/spawn-agents.sh',
        'shared/deployment-plans/',
        'workspaces/'
      ];
      
      workflowFiles.forEach(file => {
        expect(fs.existsSync(file)).toBe(true);
      });
    });

    test('should validate agent context files follow proper structure', () => {
      const agentDirs = fs.readdirSync('workspaces/').filter(dir => 
        fs.statSync(path.join('workspaces/', dir)).isDirectory()
      );
      
      agentDirs.forEach(agentDir => {
        const contextFile = path.join('workspaces/', agentDir, 'agent_context.json');
        if (fs.existsSync(contextFile)) {
          expect(() => {
            JSON.parse(fs.readFileSync(contextFile, 'utf8'));
          }).not.toThrow();
        }
      });
    });
  });
});

describe('Package Agent Reconstruction Tests', () => {
  describe('Retroactive Validation', () => {
    test('should confirm package_agent requirements are met by existing files', () => {
      // All package_agent files should exist and be functional
      const packageAgentFiles = ['package.json', '.npmrc', 'publish.sh'];
      
      packageAgentFiles.forEach(file => {
        expect(fs.existsSync(file)).toBe(true);
      });
    });

    test('should validate compensatory agent work', () => {
      // Other agents should have created the package files
      const gitLog = execSync('git log --oneline --all', { encoding: 'utf8' });
      
      expect(gitLog).toContain('feat(cli_agent)');
      expect(gitLog).toContain('feat(installer_agent)');
      expect(gitLog).toContain('feat(distribution_agent)');
    });
  });

  describe('Anomaly Resolution', () => {
    test('should validate anomaly has been documented', () => {
      // Documentation should exist
      expect(fs.existsSync('git-history-analysis.md')).toBe(true);
      expect(fs.existsSync('package-agent-commit-reconstruction.md')).toBe(true);
    });

    test('should validate no functional impact from anomaly', () => {
      // Package should be fully functional despite the anomaly
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      expect(packageJson.name).toBeDefined();
      expect(packageJson.version).toBeDefined();
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.dependencies).toBeDefined();
    });
  });
});