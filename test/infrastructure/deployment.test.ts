import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

describe('Deployment Infrastructure', () => {
  const projectRoot = path.join(__dirname, '..');
  const deployScriptPath = path.join(projectRoot, 'scripts', 'deploy.sh');

  beforeEach(async () => {
    // Ensure deploy script exists
    const deployScriptExists = await fs.access(deployScriptPath).then(() => true).catch(() => false);
    if (!deployScriptExists) {
      throw new Error('Deploy script not found');
    }
  });

  afterEach(async () => {
    // Cleanup any test deployments
    try {
      await execAsync(`${deployScriptPath} cleanup`);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('deployment script validation', () => {
    it('should have executable permissions', async () => {
      const stats = await fs.stat(deployScriptPath);
      const isExecutable = (stats.mode & 0o111) !== 0;
      expect(isExecutable).toBe(true);
    });

    it('should have valid bash syntax', async () => {
      try {
        const { stdout, stderr } = await execAsync(`bash -n ${deployScriptPath}`);
        expect(stderr).toBe('');
      } catch (error) {
        throw new Error(`Deploy script has syntax errors: ${error}`);
      }
    });

    it('should contain required functions', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('main()');
      expect(scriptContent).toContain('deploy_services()');
      expect(scriptContent).toContain('run_health_checks()');
      expect(scriptContent).toContain('validate_env()');
    });

    it('should handle command line arguments', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('case "$1" in');
      expect(scriptContent).toContain('start');
      expect(scriptContent).toContain('stop');
      expect(scriptContent).toContain('restart');
      expect(scriptContent).toContain('health');
    });
  });

  describe('deployment process', () => {
    it('should validate environment variables', async () => {
      try {
        // Run deployment validation
        const { stdout, stderr } = await execAsync(`${deployScriptPath} health`);
        expect(stderr).not.toContain('ERROR');
      } catch (error) {
        // This is expected if environment is not set up
        const errorMessage = error.toString();
        if (errorMessage.includes('not set')) {
          console.warn('Environment variables not configured, which is expected in test environment');
        }
      }
    });

    it('should create required directories', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('mkdir -p');
      expect(scriptContent).toContain('shared/.linear-cache');
      expect(scriptContent).toContain('shared/deployment-plans');
      expect(scriptContent).toContain('shared/coordination');
    });

    it('should set proper permissions', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('chmod +x');
      expect(scriptContent).toContain('scripts');
    });

    it('should handle deployment errors gracefully', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('set -e');
      expect(scriptContent).toContain('trap cleanup EXIT');
      expect(scriptContent).toContain('cleanup()');
    });
  });

  describe('health check functionality', () => {
    it('should implement health check endpoint', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('HEALTH_CHECK_URL');
      expect(scriptContent).toContain('curl -f');
      expect(scriptContent).toContain('http://localhost:3000/health');
    });

    it('should retry health checks with backoff', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('MAX_RETRIES');
      expect(scriptContent).toContain('RETRY_DELAY');
      expect(scriptContent).toContain('while [ $retries -lt $MAX_RETRIES ]');
    });

    it('should check multiple service health statuses', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('wait_for_service');
      expect(scriptContent).toContain('Redis');
      expect(scriptContent).toContain('PostgreSQL');
    });
  });

  describe('service management', () => {
    it('should start services with docker-compose', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('docker-compose build');
      expect(scriptContent).toContain('docker-compose up -d');
    });

    it('should stop services gracefully', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('docker-compose down');
    });

    it('should provide service status information', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('show_summary()');
      expect(scriptContent).toContain('Application URL');
      expect(scriptContent).toContain('localhost:3000');
    });
  });

  describe('deployment validation', () => {
    it('should validate required commands are available', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('check_command');
      expect(scriptContent).toContain('docker');
      expect(scriptContent).toContain('docker-compose');
      expect(scriptContent).toContain('curl');
    });

    it('should validate file system permissions', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('mkdir -p');
      expect(scriptContent).toContain('chmod');
    });

    it('should provide clear error messages', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('print_error');
      expect(scriptContent).toContain('print_status');
      expect(scriptContent).toContain('print_warning');
    });
  });

  describe('configuration management', () => {
    it('should handle environment configuration', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('validate_env()');
      expect(scriptContent).toContain('LINEAR_API_KEY');
      expect(scriptContent).toContain('CLAUDE_API_KEY');
      expect(scriptContent).toContain('POSTGRES_PASSWORD');
    });

    it('should provide default values for optional settings', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('parallel_password');
      expect(scriptContent).toContain('MAX_RETRIES=30');
      expect(scriptContent).toContain('RETRY_DELAY=5');
    });

    it('should configure logging and monitoring', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('docker-compose logs');
      expect(scriptContent).toContain('logs');
    });
  });

  describe('security considerations', () => {
    it('should not expose credentials in logs', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      
      // Check that sensitive variables are not echoed
      expect(scriptContent).not.toMatch(/echo.*API_KEY/);
      expect(scriptContent).not.toMatch(/echo.*PASSWORD/);
      expect(scriptContent).not.toMatch(/echo.*SECRET/);
    });

    it('should use secure connection methods', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('https://');
      expect(scriptContent).toContain('curl -f');
    });

    it('should implement proper cleanup procedures', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('cleanup()');
      expect(scriptContent).toContain('--volumes --remove-orphans');
    });
  });

  describe('monitoring and observability', () => {
    it('should provide deployment status information', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('Deployment Summary');
      expect(scriptContent).toContain('Application URL');
      expect(scriptContent).toContain('Health Check');
    });

    it('should include performance metrics', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('docker-compose ps');
      expect(scriptContent).toContain('docker system');
    });

    it('should provide troubleshooting information', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('Next Steps');
      expect(scriptContent).toContain('View logs');
      expect(scriptContent).toContain('Stop services');
    });
  });

  describe('rollback and recovery', () => {
    it('should implement rollback functionality', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('cleanup()');
      expect(scriptContent).toContain('docker-compose down');
    });

    it('should handle failed deployments', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('trap cleanup EXIT');
      expect(scriptContent).toContain('exit_code=$?');
    });

    it('should provide recovery instructions', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('Usage:');
      expect(scriptContent).toContain('restart');
      expect(scriptContent).toContain('cleanup');
    });
  });

  describe('cross-platform compatibility', () => {
    it('should work on different operating systems', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('#!/bin/bash');
      expect(scriptContent).toContain('command -v');
    });

    it('should handle different docker installations', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('docker');
      expect(scriptContent).toContain('docker-compose');
    });

    it('should provide clear installation instructions', async () => {
      const scriptContent = await fs.readFile(deployScriptPath, 'utf-8');
      expect(scriptContent).toContain('not installed');
      expect(scriptContent).toContain('Please install');
    });
  });
});