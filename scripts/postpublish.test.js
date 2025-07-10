const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const {
  verifyPublishedPackage,
  testGlobalInstallation,
  updateDistributionManifest,
  generateUsageDocumentation,
  cleanupTemporaryFiles
} = require('./postpublish');

// Mock dependencies
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn()
}));

jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

jest.mock('https', () => ({
  request: jest.fn()
}));

describe('Postpublish Script Tests', () => {
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

  describe('verifyPublishedPackage', () => {
    test('should verify package exists on NPM', async () => {
      const https = require('https');
      const mockResponse = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(JSON.stringify({
              'dist-tags': { latest: '1.0.0' }
            }));
          } else if (event === 'end') {
            callback();
          }
        })
      };
      
      https.request.mockImplementation((url, options, callback) => {
        callback(mockResponse);
        return { on: jest.fn(), end: jest.fn() };
      });

      const result = await verifyPublishedPackage();
      expect(result).toBe(true);
    });

    test('should handle package not found', async () => {
      const https = require('https');
      const mockResponse = {
        statusCode: 404,
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback('{"error":"Not found"}');
          } else if (event === 'end') {
            callback();
          }
        })
      };
      
      https.request.mockImplementation((url, options, callback) => {
        callback(mockResponse);
        return { on: jest.fn(), end: jest.fn() };
      });

      const result = await verifyPublishedPackage();
      expect(result).toBe(false);
    });

    test('should handle version mismatch', async () => {
      const https = require('https');
      const mockResponse = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(JSON.stringify({
              'dist-tags': { latest: '0.9.0' }
            }));
          } else if (event === 'end') {
            callback();
          }
        })
      };
      
      https.request.mockImplementation((url, options, callback) => {
        callback(mockResponse);
        return { on: jest.fn(), end: jest.fn() };
      });

      const result = await verifyPublishedPackage();
      expect(result).toBe(false);
    });
  });

  describe('testGlobalInstallation', () => {
    test('should test NPX installation successfully', async () => {
      execSync.mockReturnValue('1.0.0\n');
      
      const result = await testGlobalInstallation();
      
      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('npx test-package@1.0.0 --version'),
        expect.any(Object)
      );
    });

    test('should handle NPX installation failure', async () => {
      execSync.mockImplementation(() => {
        throw new Error('Command failed');
      });
      
      const result = await testGlobalInstallation();
      
      expect(result).toBe(false);
    });

    test('should handle timeout', async () => {
      execSync.mockImplementation(() => {
        throw new Error('Command timed out');
      });
      
      const result = await testGlobalInstallation();
      
      expect(result).toBe(false);
    });
  });

  describe('updateDistributionManifest', () => {
    test('should update existing manifest', () => {
      const existingManifest = {
        package: 'test-package',
        version: '1.0.0'
      };
      
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(existingManifest));
      
      updateDistributionManifest();
      
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('dist-manifest.json'),
        expect.stringContaining('publishStatus')
      );
    });

    test('should create new manifest if not exists', () => {
      fs.existsSync.mockReturnValue(false);
      
      updateDistributionManifest();
      
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('dist-manifest.json'),
        expect.stringContaining('publishStatus')
      );
    });

    test('should include correct publish status', () => {
      fs.existsSync.mockReturnValue(false);
      
      updateDistributionManifest();
      
      const writeCall = fs.writeFileSync.mock.calls[0];
      const manifestData = JSON.parse(writeCall[1]);
      
      expect(manifestData.publishStatus).toEqual({
        published: true,
        publishedAt: expect.any(String),
        npmVerified: true,
        globalInstallTested: true
      });
    });
  });

  describe('generateUsageDocumentation', () => {
    test('should generate usage documentation', () => {
      generateUsageDocumentation();
      
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('USAGE.md'),
        expect.stringContaining('test-package')
      );
    });

    test('should include installation instructions', () => {
      generateUsageDocumentation();
      
      const writeCall = fs.writeFileSync.mock.calls[0];
      const usageContent = writeCall[1];
      
      expect(usageContent).toContain('npm install -g test-package');
      expect(usageContent).toContain('npx test-package');
    });

    test('should include command examples', () => {
      generateUsageDocumentation();
      
      const writeCall = fs.writeFileSync.mock.calls[0];
      const usageContent = writeCall[1];
      
      expect(usageContent).toContain('cache-linear-issue');
      expect(usageContent).toContain('decompose-parallel');
      expect(usageContent).toContain('spawn-agents');
    });

    test('should include version information', () => {
      generateUsageDocumentation();
      
      const writeCall = fs.writeFileSync.mock.calls[0];
      const usageContent = writeCall[1];
      
      expect(usageContent).toContain('Version: 1.0.0');
      expect(usageContent).toContain('Package: test-package');
    });
  });

  describe('cleanupTemporaryFiles', () => {
    test('should clean up existing temporary files', () => {
      fs.existsSync.mockReturnValue(true);
      
      cleanupTemporaryFiles();
      
      expect(fs.unlinkSync).toHaveBeenCalledWith(
        expect.stringContaining('dist-manifest.json')
      );
      expect(fs.unlinkSync).toHaveBeenCalledWith(
        expect.stringContaining('npm-debug.log')
      );
    });

    test('should skip non-existent files', () => {
      fs.existsSync.mockReturnValue(false);
      
      cleanupTemporaryFiles();
      
      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    test('should handle cleanup errors gracefully', () => {
      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      // Should not throw
      expect(() => cleanupTemporaryFiles()).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('should complete full postpublish workflow', async () => {
      // Mock all dependencies for success
      const https = require('https');
      const mockResponse = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(JSON.stringify({
              'dist-tags': { latest: '1.0.0' }
            }));
          } else if (event === 'end') {
            callback();
          }
        })
      };
      
      https.request.mockImplementation((url, options, callback) => {
        callback(mockResponse);
        return { on: jest.fn(), end: jest.fn() };
      });
      
      execSync.mockReturnValue('1.0.0\n');
      fs.existsSync.mockReturnValue(false);
      
      // Test that all functions can be called in sequence
      const packageVerified = await verifyPublishedPackage();
      const globalInstallTested = await testGlobalInstallation();
      
      expect(packageVerified).toBe(true);
      expect(globalInstallTested).toBe(true);
      
      expect(() => {
        updateDistributionManifest();
        generateUsageDocumentation();
        cleanupTemporaryFiles();
      }).not.toThrow();
    });

    test('should handle workflow failures gracefully', async () => {
      // Mock dependencies for failure
      const https = require('https');
      https.request.mockImplementation((url, options, callback) => {
        throw new Error('Network error');
      });
      
      const packageVerified = await verifyPublishedPackage();
      expect(packageVerified).toBe(false);
    });
  });
});