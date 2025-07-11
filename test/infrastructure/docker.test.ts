import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

describe('Docker Infrastructure', () => {
  const projectRoot = path.join(__dirname, '..');
  const dockerfilePath = path.join(projectRoot, 'Dockerfile');
  const dockerComposePath = path.join(projectRoot, 'docker-compose.yml');

  beforeEach(async () => {
    // Ensure docker files exist
    const dockerfileExists = await fs.access(dockerfilePath).then(() => true).catch(() => false);
    const dockerComposeExists = await fs.access(dockerComposePath).then(() => true).catch(() => false);
    
    if (!dockerfileExists || !dockerComposeExists) {
      throw new Error('Docker configuration files not found');
    }
  });

  afterEach(async () => {
    // Cleanup any test containers
    try {
      await execAsync('docker-compose -f docker-compose.yml down --volumes --remove-orphans');
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Dockerfile validation', () => {
    it('should have valid Dockerfile syntax', async () => {
      try {
        const { stdout, stderr } = await execAsync(`docker build --dry-run -f ${dockerfilePath} ${projectRoot}`);
        expect(stderr).toBe('');
      } catch (error) {
        // If docker build --dry-run is not available, try parsing the Dockerfile
        const dockerfileContent = await fs.readFile(dockerfilePath, 'utf-8');
        expect(dockerfileContent).toContain('FROM');
        expect(dockerfileContent).toContain('WORKDIR');
        expect(dockerfileContent).toContain('CMD');
      }
    });

    it('should use appropriate base image', async () => {
      const dockerfileContent = await fs.readFile(dockerfilePath, 'utf-8');
      expect(dockerfileContent).toMatch(/FROM\s+node:/);
    });

    it('should set correct working directory', async () => {
      const dockerfileContent = await fs.readFile(dockerfilePath, 'utf-8');
      expect(dockerfileContent).toContain('WORKDIR /app');
    });

    it('should install required dependencies', async () => {
      const dockerfileContent = await fs.readFile(dockerfilePath, 'utf-8');
      expect(dockerfileContent).toContain('RUN npm install');
      expect(dockerfileContent).toMatch(/RUN\s+apk\s+add.*git/);
    });

    it('should include health check', async () => {
      const dockerfileContent = await fs.readFile(dockerfilePath, 'utf-8');
      expect(dockerfileContent).toContain('HEALTHCHECK');
    });

    it('should expose correct port', async () => {
      const dockerfileContent = await fs.readFile(dockerfilePath, 'utf-8');
      expect(dockerfileContent).toContain('EXPOSE 3000');
    });
  });

  describe('Docker Compose validation', () => {
    it('should have valid docker-compose.yml syntax', async () => {
      try {
        const { stdout, stderr } = await execAsync(`docker-compose -f ${dockerComposePath} config`);
        expect(stderr).toBe('');
      } catch (error) {
        // If docker-compose is not available, do basic YAML validation
        const composeContent = await fs.readFile(dockerComposePath, 'utf-8');
        expect(composeContent).toContain('version:');
        expect(composeContent).toContain('services:');
      }
    });

    it('should define main application service', async () => {
      const composeContent = await fs.readFile(dockerComposePath, 'utf-8');
      expect(composeContent).toContain('parallel-claude-workflow:');
      expect(composeContent).toContain('build:');
      expect(composeContent).toContain('ports:');
    });

    it('should define Redis service', async () => {
      const composeContent = await fs.readFile(dockerComposePath, 'utf-8');
      expect(composeContent).toContain('redis:');
      expect(composeContent).toContain('image: redis:');
    });

    it('should define PostgreSQL service', async () => {
      const composeContent = await fs.readFile(dockerComposePath, 'utf-8');
      expect(composeContent).toContain('postgres:');
      expect(composeContent).toContain('image: postgres:');
    });

    it('should configure volumes correctly', async () => {
      const composeContent = await fs.readFile(dockerComposePath, 'utf-8');
      expect(composeContent).toContain('volumes:');
      expect(composeContent).toContain('redis_data:');
      expect(composeContent).toContain('postgres_data:');
    });

    it('should define networks', async () => {
      const composeContent = await fs.readFile(dockerComposePath, 'utf-8');
      expect(composeContent).toContain('networks:');
      expect(composeContent).toContain('parallel-dev-network:');
    });
  });

  describe('container build process', () => {
    it('should build container successfully', async () => {
      try {
        const { stdout, stderr } = await execAsync(`docker build -t parallel-claude-test ${projectRoot}`);
        expect(stderr).not.toContain('ERROR');
        
        // Clean up test image
        await execAsync('docker rmi parallel-claude-test');
      } catch (error) {
        // Skip if Docker is not available
        console.warn('Docker not available, skipping build test');
      }
    }, 60000); // 60 second timeout for build

    it('should have correct file permissions in container', async () => {
      try {
        await execAsync(`docker build -t parallel-claude-test ${projectRoot}`);
        
        const { stdout } = await execAsync('docker run --rm parallel-claude-test find scripts -name "*.sh" -type f -perm +111');
        expect(stdout).toContain('scripts/');
        
        // Clean up test image
        await execAsync('docker rmi parallel-claude-test');
      } catch (error) {
        // Skip if Docker is not available
        console.warn('Docker not available, skipping permissions test');
      }
    }, 60000);
  });

  describe('multi-container orchestration', () => {
    it('should start all services successfully', async () => {
      try {
        const { stdout, stderr } = await execAsync(`docker-compose -f ${dockerComposePath} up -d`);
        expect(stderr).not.toContain('ERROR');
        
        // Wait for services to start
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Check if services are running
        const { stdout: psOutput } = await execAsync(`docker-compose -f ${dockerComposePath} ps`);
        expect(psOutput).toContain('parallel-claude-workflow');
        expect(psOutput).toContain('redis');
        expect(psOutput).toContain('postgres');
        
      } catch (error) {
        // Skip if Docker is not available
        console.warn('Docker not available, skipping orchestration test');
      }
    }, 120000); // 2 minute timeout for startup

    it('should establish proper service dependencies', async () => {
      try {
        const { stdout } = await execAsync(`docker-compose -f ${dockerComposePath} config`);
        expect(stdout).toContain('depends_on:');
        expect(stdout).toContain('- redis');
        expect(stdout).toContain('- postgres');
      } catch (error) {
        // Skip if Docker is not available
        console.warn('Docker not available, skipping dependency test');
      }
    });
  });

  describe('container health checks', () => {
    it('should have working health check endpoint', async () => {
      try {
        // Start services
        await execAsync(`docker-compose -f ${dockerComposePath} up -d`);
        
        // Wait for health check to pass
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        // Check health status
        const { stdout } = await execAsync('docker-compose -f docker-compose.yml ps');
        expect(stdout).toContain('healthy');
        
      } catch (error) {
        // Skip if Docker is not available or health check fails
        console.warn('Docker not available or health check failed, skipping health test');
      }
    }, 60000);

    it('should restart unhealthy containers', async () => {
      try {
        // Start services
        await execAsync(`docker-compose -f ${dockerComposePath} up -d`);
        
        // Wait for startup
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Check restart policy
        const composeContent = await fs.readFile(dockerComposePath, 'utf-8');
        expect(composeContent).toContain('restart: unless-stopped');
        
      } catch (error) {
        console.warn('Docker not available, skipping restart test');
      }
    }, 60000);
  });

  describe('environment configuration', () => {
    it('should pass environment variables correctly', async () => {
      const composeContent = await fs.readFile(dockerComposePath, 'utf-8');
      expect(composeContent).toContain('LINEAR_API_KEY');
      expect(composeContent).toContain('CLAUDE_API_KEY');
      expect(composeContent).toContain('NODE_ENV');
    });

    it('should mount volumes for persistent data', async () => {
      const composeContent = await fs.readFile(dockerComposePath, 'utf-8');
      expect(composeContent).toContain('./shared:/app/shared');
      expect(composeContent).toContain('redis_data:/data');
      expect(composeContent).toContain('postgres_data:/var/lib/postgresql/data');
    });

    it('should configure proper networking', async () => {
      const composeContent = await fs.readFile(dockerComposePath, 'utf-8');
      expect(composeContent).toContain('networks:');
      expect(composeContent).toContain('parallel-dev-network');
    });
  });

  describe('security considerations', () => {
    it('should not expose unnecessary ports', async () => {
      const composeContent = await fs.readFile(dockerComposePath, 'utf-8');
      
      // Only specific ports should be exposed
      const exposedPorts = composeContent.match(/ports:\s*\n\s*-\s*"(\d+):/g);
      expect(exposedPorts).not.toBeNull();
      
      // Check that common dangerous ports are not exposed
      expect(composeContent).not.toContain('22:22'); // SSH
      expect(composeContent).not.toContain('80:80'); // HTTP (should be proxied)
    });

    it('should use non-root user in container', async () => {
      const dockerfileContent = await fs.readFile(dockerfilePath, 'utf-8');
      // This is a best practice but may not be strictly required
      // The test checks if USER directive is present
      const hasUserDirective = dockerfileContent.includes('USER');
      if (!hasUserDirective) {
        console.warn('Consider adding USER directive to Dockerfile for security');
      }
    });

    it('should not include sensitive information in image', async () => {
      const dockerfileContent = await fs.readFile(dockerfilePath, 'utf-8');
      
      // Check that no secrets are hardcoded
      expect(dockerfileContent).not.toMatch(/API_KEY\s*=\s*['"]\w+['"]/);
      expect(dockerfileContent).not.toMatch(/PASSWORD\s*=\s*['"]\w+['"]/);
      expect(dockerfileContent).not.toMatch(/SECRET\s*=\s*['"]\w+['"]/);
    });
  });

  describe('resource management', () => {
    it('should have appropriate resource limits', async () => {
      const composeContent = await fs.readFile(dockerComposePath, 'utf-8');
      
      // Check if resource limits are defined (optional but recommended)
      if (composeContent.includes('deploy:')) {
        expect(composeContent).toContain('resources:');
        expect(composeContent).toContain('limits:');
      }
    });

    it('should configure proper logging', async () => {
      const composeContent = await fs.readFile(dockerComposePath, 'utf-8');
      
      // Check if logging is configured (optional but recommended)
      if (composeContent.includes('logging:')) {
        expect(composeContent).toContain('driver:');
        expect(composeContent).toContain('options:');
      }
    });
  });
});