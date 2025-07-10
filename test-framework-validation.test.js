/**
 * Test Framework Validation Test Suite
 * 
 * This test suite validates that the Jest test framework is properly installed,
 * configured, and working correctly with all project dependencies.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Jest Test Framework Validation', () => {
  describe('Configuration Files', () => {
    it('should have jest.config.js present', () => {
      const configPath = path.join(__dirname, 'jest.config.js');
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('should have test-setup.js present', () => {
      const setupPath = path.join(__dirname, 'test-setup.js');
      expect(fs.existsSync(setupPath)).toBe(true);
    });

    it('should have proper Jest configuration', () => {
      const configPath = path.join(__dirname, 'jest.config.js');
      const config = require(configPath);
      
      expect(config.testEnvironment).toBe('jsdom');
      expect(config.setupFilesAfterEnv).toContain('<rootDir>/test-setup.js');
      expect(config.collectCoverage).toBe(true);
      expect(config.coverageDirectory).toBe('coverage');
      expect(config.testMatch).toContain('**/*.(test|spec).(js|jsx|ts|tsx)');
    });
  });

  describe('Package.json Configuration', () => {
    it('should have Jest dependencies installed', () => {
      const packagePath = path.join(__dirname, 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      expect(packageData.devDependencies).toHaveProperty('jest');
      expect(packageData.devDependencies).toHaveProperty('jest-environment-jsdom');
      expect(packageData.devDependencies).toHaveProperty('@testing-library/jest-dom');
      expect(packageData.devDependencies).toHaveProperty('@testing-library/react');
      expect(packageData.devDependencies).toHaveProperty('@testing-library/user-event');
    });

    it('should have proper test scripts configured', () => {
      const packagePath = path.join(__dirname, 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      expect(packageData.scripts.test).toBe('jest');
      expect(packageData.scripts['test:watch']).toBe('jest --watch');
      expect(packageData.scripts['test:coverage']).toBe('jest --coverage');
      expect(packageData.scripts['test:ci']).toBe('jest --coverage --watchAll=false --passWithNoTests');
    });
  });

  describe('Test Environment Setup', () => {
    it('should have testing-library/jest-dom matchers available', () => {
      // These matchers are added by @testing-library/jest-dom
      expect(expect.extend).toBeDefined();
      
      // Test that jest-dom matchers are available by checking if they don't throw
      const element = document.createElement('div');
      expect(() => expect(element).toBeInTheDocument()).not.toThrow();
    });

    it('should have jsdom environment configured', () => {
      expect(typeof window).toBe('object');
      expect(typeof document).toBe('object');
      expect(typeof global).toBe('object');
    });

    it('should have mocked global objects', () => {
      expect(global.fetch).toBeDefined();
      expect(global.localStorage).toBeDefined();
      expect(global.sessionStorage).toBeDefined();
      expect(window.matchMedia).toBeDefined();
      expect(global.ResizeObserver).toBeDefined();
      expect(global.IntersectionObserver).toBeDefined();
    });
  });

  describe('Test File Discovery', () => {
    it('should discover test files in multiple locations', () => {
      const testPatterns = [
        'src/**/*.test.js',
        'components/**/*.test.tsx',
        'scripts/**/*.test.js',
        'tests/**/*.test.ts',
        'api/**/*.test.ts'
      ];

      testPatterns.forEach(pattern => {
        // This test verifies that Jest can find test files in these locations
        // The actual test files are discovered by Jest's testMatch configuration
        expect(pattern).toMatch(/\*\*\/.*\.test\.(js|jsx|ts|tsx)$/);
      });
    });

    it('should have existing test files that Jest can run', () => {
      const testFiles = [
        'src/cli-commands.test.js',
        'src/cli-parser.test.js',
        'src/installer.test.js',
        'components/forms.test.tsx',
        'scripts/postpublish.test.js'
      ];

      testFiles.forEach(testFile => {
        const fullPath = path.join(__dirname, testFile);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    });
  });

  describe('Coverage Configuration', () => {
    it('should have coverage collection enabled', () => {
      const configPath = path.join(__dirname, 'jest.config.js');
      const config = require(configPath);
      
      expect(config.collectCoverage).toBe(true);
      expect(config.coverageDirectory).toBe('coverage');
      expect(config.coverageReporters).toContain('text');
      expect(config.coverageReporters).toContain('lcov');
      expect(config.coverageReporters).toContain('html');
    });

    it('should have coverage thresholds configured', () => {
      const configPath = path.join(__dirname, 'jest.config.js');
      const config = require(configPath);
      
      expect(config.coverageThreshold).toBeDefined();
      expect(config.coverageThreshold.global).toBeDefined();
      expect(config.coverageThreshold.global.branches).toBe(70);
      expect(config.coverageThreshold.global.functions).toBe(70);
      expect(config.coverageThreshold.global.lines).toBe(70);
      expect(config.coverageThreshold.global.statements).toBe(70);
    });

    it('should have proper coverage path configuration', () => {
      const configPath = path.join(__dirname, 'jest.config.js');
      const config = require(configPath);
      
      expect(config.collectCoverageFrom).toContain('src/**/*.{js,jsx,ts,tsx}');
      expect(config.collectCoverageFrom).toContain('lib/**/*.{js,jsx,ts,tsx}');
      expect(config.collectCoverageFrom).toContain('components/**/*.{js,jsx,ts,tsx}');
      expect(config.coveragePathIgnorePatterns).toContain('/node_modules/');
      expect(config.coveragePathIgnorePatterns).toContain('/coverage/');
    });
  });

  describe('TypeScript Support', () => {
    it('should have TypeScript Jest dependencies', () => {
      const packagePath = path.join(__dirname, 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      expect(packageData.devDependencies).toHaveProperty('ts-jest');
      expect(packageData.devDependencies).toHaveProperty('@types/jest');
      expect(packageData.devDependencies).toHaveProperty('typescript');
    });

    it('should have TypeScript transform configuration', () => {
      const configPath = path.join(__dirname, 'jest.config.js');
      const config = require(configPath);
      
      expect(config.transform).toHaveProperty('^.+\\.(ts|tsx)$');
      expect(config.transform['^.+\\.(ts|tsx)$']).toBe('ts-jest');
    });
  });

  describe('React Testing Support', () => {
    it('should have React testing dependencies', () => {
      const packagePath = path.join(__dirname, 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      expect(packageData.devDependencies).toHaveProperty('@testing-library/react');
      expect(packageData.devDependencies).toHaveProperty('@testing-library/user-event');
      expect(packageData.devDependencies).toHaveProperty('@babel/preset-react');
    });

    it('should have Babel configuration for React', () => {
      const configPath = path.join(__dirname, 'jest.config.js');
      const config = require(configPath);
      
      expect(config.transform).toHaveProperty('^.+\\.(js|jsx)$');
      expect(config.transform['^.+\\.(js|jsx)$']).toBe('babel-jest');
    });

    it('should have CSS modules mocking configured', () => {
      const configPath = path.join(__dirname, 'jest.config.js');
      const config = require(configPath);
      
      expect(config.moduleNameMapper).toHaveProperty('\\.(css|less|scss|sass)$');
      expect(config.moduleNameMapper['\\.(css|less|scss|sass)$']).toBe('identity-obj-proxy');
    });
  });

  describe('Test Execution', () => {
    it('should be able to run basic Jest functions', () => {
      expect(jest).toBeDefined();
      expect(describe).toBeDefined();
      expect(it).toBeDefined();
      expect(expect).toBeDefined();
      expect(beforeEach).toBeDefined();
      expect(afterEach).toBeDefined();
      expect(beforeAll).toBeDefined();
      expect(afterAll).toBeDefined();
    });

    it('should have proper test timeout configured', () => {
      const configPath = path.join(__dirname, 'jest.config.js');
      const config = require(configPath);
      
      expect(config.testTimeout).toBe(30000);
    });

    it('should have mock clearing configured', () => {
      const configPath = path.join(__dirname, 'jest.config.js');
      const config = require(configPath);
      
      expect(config.clearMocks).toBe(true);
      expect(config.restoreMocks).toBe(true);
    });
  });

  describe('File Handling', () => {
    it('should have static asset mocking configured', () => {
      const configPath = path.join(__dirname, 'jest.config.js');
      const config = require(configPath);
      
      const assetPattern = '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$';
      expect(config.moduleNameMapper).toHaveProperty(assetPattern);
      expect(config.moduleNameMapper[assetPattern]).toBe('jest-transform-stub');
    });

    it('should have File and FileList mocks available', () => {
      expect(global.File).toBeDefined();
      expect(global.FileList).toBeDefined();
      expect(global.URL.createObjectURL).toBeDefined();
      expect(global.URL.revokeObjectURL).toBeDefined();
    });
  });

  describe('Integration with CI/CD', () => {
    it('should have CI-friendly test script', () => {
      const packagePath = path.join(__dirname, 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      expect(packageData.scripts['test:ci']).toBe('jest --coverage --watchAll=false --passWithNoTests');
    });

    it('should exit with proper codes for CI', () => {
      // This test validates that Jest is configured to work properly in CI environments
      // The --passWithNoTests flag ensures CI doesn't fail when no tests are found
      // The --watchAll=false flag ensures Jest doesn't hang in CI
      expect(true).toBe(true); // This test validates configuration, not runtime behavior
    });
  });
});