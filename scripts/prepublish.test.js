const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const {
  validatePackageJson,
  validateRequiredFiles,
  validateScripts,
  validateBuildStatus,
  generateDistributionManifest
} = require('./prepublish');

// Mock execSync for testing
jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

// Mock fs for testing
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  accessSync: jest.fn(),
  writeFileSync: jest.fn(),
  constants: {
    F_OK: 0,
    X_OK: 1
  }
}));

describe('Prepublish Script Tests', () => {
  const mockProjectRoot = '/mock/project';
  const mockPackageJson = {
    name: 'test-package',
    version: '1.0.0',
    description: 'Test package',
    main: 'index.js',
    keywords: ['test'],
    license: 'MIT'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock require for package.json
    jest.doMock(path.join(mockProjectRoot, 'package.json'), () => mockPackageJson, { virtual: true });
  });

  describe('validatePackageJson', () => {
    test('should validate a correct package.json', () => {
      fs.existsSync.mockReturnValue(true);
      
      const result = validatePackageJson();
      
      expect(result).toEqual(mockPackageJson);
    });

    test('should throw error if package.json is missing', () => {
      fs.existsSync.mockReturnValue(false);
      
      expect(() => validatePackageJson()).toThrow('package.json not found');
    });

    test('should throw error if required fields are missing', () => {
      fs.existsSync.mockReturnValue(true);
      const incompletePackage = { name: 'test', version: '1.0.0' };
      jest.doMock(path.join(mockProjectRoot, 'package.json'), () => incompletePackage, { virtual: true });
      
      expect(() => validatePackageJson()).toThrow('Missing required field in package.json');
    });

    test('should throw error for invalid version format', () => {
      fs.existsSync.mockReturnValue(true);
      const invalidVersionPackage = { ...mockPackageJson, version: 'invalid' };
      jest.doMock(path.join(mockProjectRoot, 'package.json'), () => invalidVersionPackage, { virtual: true });
      
      expect(() => validatePackageJson()).toThrow('Invalid version format');
    });
  });

  describe('validateRequiredFiles', () => {
    test('should pass when all required files exist', () => {
      fs.existsSync.mockReturnValue(true);
      
      expect(() => validateRequiredFiles()).not.toThrow();
    });

    test('should throw error when required files are missing', () => {
      fs.existsSync.mockReturnValue(false);
      
      expect(() => validateRequiredFiles()).toThrow('Missing required files');
    });

    test('should identify specific missing files', () => {
      fs.existsSync.mockImplementation((filePath) => {
        return !filePath.includes('README.md');
      });
      
      expect(() => validateRequiredFiles()).toThrow('README.md');
    });
  });

  describe('validateScripts', () => {
    test('should pass when all required scripts exist', () => {
      fs.existsSync.mockReturnValue(true);
      fs.accessSync.mockReturnValue(true);
      
      expect(() => validateScripts()).not.toThrow();
    });

    test('should throw error when scripts are missing', () => {
      fs.existsSync.mockReturnValue(false);
      
      expect(() => validateScripts()).toThrow('Missing required scripts');
    });

    test('should make shell scripts executable', () => {
      fs.existsSync.mockReturnValue(true);
      fs.accessSync.mockImplementation(() => {
        throw new Error('Not executable');
      });
      
      expect(() => validateScripts()).not.toThrow();
      expect(execSync).toHaveBeenCalledWith(expect.stringContaining('chmod +x'));
    });
  });

  describe('validateBuildStatus', () => {
    test('should pass with clean git status', () => {
      execSync.mockReturnValue('');
      
      expect(() => validateBuildStatus()).not.toThrow();
    });

    test('should throw error with uncommitted changes', () => {
      execSync.mockReturnValue('M  modified-file.js\n');
      
      expect(() => validateBuildStatus()).toThrow('Working directory has uncommitted changes');
    });

    test('should pass with uncommitted changes when ALLOW_DIRTY is set', () => {
      process.env.ALLOW_DIRTY = '1';
      execSync.mockReturnValue('M  modified-file.js\n');
      
      expect(() => validateBuildStatus()).not.toThrow();
      
      delete process.env.ALLOW_DIRTY;
    });

    test('should handle non-git repositories gracefully', () => {
      execSync.mockImplementation(() => {
        throw new Error('not a git repository');
      });
      
      expect(() => validateBuildStatus()).not.toThrow();
    });
  });

  describe('generateDistributionManifest', () => {
    test('should generate a valid distribution manifest', () => {
      fs.existsSync.mockReturnValue(true);
      
      const manifest = generateDistributionManifest();
      
      expect(manifest).toHaveProperty('package', mockPackageJson.name);
      expect(manifest).toHaveProperty('version', mockPackageJson.version);
      expect(manifest).toHaveProperty('publishedAt');
      expect(manifest).toHaveProperty('distribution');
      expect(manifest).toHaveProperty('validation');
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('should include distribution metadata', () => {
      fs.existsSync.mockReturnValue(true);
      
      const manifest = generateDistributionManifest();
      
      expect(manifest.distribution).toHaveProperty('type', 'global-npx-package');
      expect(manifest.distribution).toHaveProperty('entryPoint');
      expect(manifest.distribution).toHaveProperty('keywords');
      expect(manifest.distribution).toHaveProperty('scripts');
      expect(Array.isArray(manifest.distribution.scripts)).toBe(true);
    });

    test('should include validation metadata', () => {
      fs.existsSync.mockReturnValue(true);
      
      const manifest = generateDistributionManifest();
      
      expect(manifest.validation).toHaveProperty('filesValidated');
      expect(manifest.validation).toHaveProperty('scriptsValidated');
      expect(manifest.validation).toHaveProperty('buildClean');
    });
  });

  describe('Integration Tests', () => {
    test('should complete full prepublish workflow', () => {
      fs.existsSync.mockReturnValue(true);
      fs.accessSync.mockReturnValue(true);
      execSync.mockReturnValue('');
      
      // Test that all functions can be called in sequence
      expect(() => {
        validatePackageJson();
        validateRequiredFiles();
        validateScripts();
        validateBuildStatus();
        generateDistributionManifest();
      }).not.toThrow();
    });

    test('should fail gracefully with detailed error messages', () => {
      fs.existsSync.mockReturnValue(false);
      
      expect(() => validatePackageJson()).toThrow(/package\.json not found/);
    });
  });
});