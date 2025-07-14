const fs = require('fs');
const path = require('path');

const {
  generateConfig,
  mergeConfigurations,
  mergeHooks,
  deepMerge,
  writeConfig,
  generateAndWriteConfig,
} = require('../src/config-generator');

// Mock dependencies
jest.mock('fs');
jest.mock('../src/install-utils', () => ({
  detectProjectType: jest.fn(),
}));
jest.mock('../src/template-engine', () => ({
  processTemplate: jest.fn((template) => template),
}));

const { detectProjectType } = require('../src/install-utils');
const templateEngine = require('../src/template-engine');

describe('Config Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(
      JSON.stringify({
        version: '1.0',
        hooks: {},
        environment: {},
      }),
    );
  });

  describe('generateConfig', () => {
    it('should generate config based on project type', () => {
      detectProjectType.mockReturnValue('typescript');

      const config = generateConfig('/test/project', {});

      expect(detectProjectType).toHaveBeenCalledWith('/test/project');
      expect(fs.readFileSync).toHaveBeenCalled();
      expect(templateEngine.processTemplate).toHaveBeenCalled();
      expect(config).toHaveProperty('version', '1.0');
    });

    it('should fall back to default template if project-specific not found', () => {
      detectProjectType.mockReturnValue('unknown');
      fs.existsSync.mockReturnValueOnce(false).mockReturnValueOnce(true);

      const config = generateConfig('/test/project', {});

      expect(fs.existsSync).toHaveBeenCalledTimes(2);
      expect(config).toHaveProperty('version', '1.0');
    });

    it('should merge user options with template', () => {
      detectProjectType.mockReturnValue('default');

      const config = generateConfig('/test/project', {
        debug: true,
        custom: { key: 'value' },
      });

      expect(config).toHaveProperty('debug', true);
      expect(config).toHaveProperty('custom', { key: 'value' });
    });

    it('should throw error if template loading fails', () => {
      detectProjectType.mockReturnValue('default');
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      expect(() => generateConfig('/test/project')).toThrow(
        'Failed to load configuration template',
      );
    });
  });

  describe('mergeConfigurations', () => {
    it('should merge base and override configurations', () => {
      const base = {
        version: '1.0',
        debug: false,
        tools: { bash: { enabled: true } },
      };
      const overrides = {
        debug: true,
        tools: { read: { enabled: true } },
      };

      const result = mergeConfigurations(base, overrides);

      expect(result.version).toBe('1.0');
      expect(result.debug).toBe(true);
      expect(result.tools.bash.enabled).toBe(true);
      expect(result.tools.read.enabled).toBe(true);
    });

    it('should handle hooks specially by appending', () => {
      const base = {
        hooks: {
          pre_tool_use: ['echo "base"'],
        },
      };
      const overrides = {
        hooks: {
          pre_tool_use: ['echo "override"'],
          post_tool_use: ['echo "new"'],
        },
      };

      const result = mergeConfigurations(base, overrides);

      expect(result.hooks.pre_tool_use).toEqual(['echo "base"', 'echo "override"']);
      expect(result.hooks.post_tool_use).toEqual(['echo "new"']);
    });
  });

  describe('mergeHooks', () => {
    it('should merge hook arrays without duplicates', () => {
      const baseHooks = {
        pre_tool_use: ['echo "1"', 'echo "2"'],
      };
      const overrideHooks = {
        pre_tool_use: ['echo "2"', 'echo "3"'],
      };

      const result = mergeHooks(baseHooks, overrideHooks);

      expect(result.pre_tool_use).toEqual(['echo "1"', 'echo "2"', 'echo "3"']);
    });

    it('should add new hook events', () => {
      const baseHooks = {
        pre_tool_use: ['echo "pre"'],
      };
      const overrideHooks = {
        post_tool_use: ['echo "post"'],
      };

      const result = mergeHooks(baseHooks, overrideHooks);

      expect(result.pre_tool_use).toEqual(['echo "pre"']);
      expect(result.post_tool_use).toEqual(['echo "post"']);
    });
  });

  describe('deepMerge', () => {
    it('should deep merge nested objects', () => {
      const target = {
        a: 1,
        b: { c: 2, d: 3 },
        e: [1, 2],
      };
      const source = {
        b: { c: 4, f: 5 },
        e: [3, 4],
        g: 6,
      };

      const result = deepMerge(target, source);

      expect(result).toEqual({
        a: 1,
        b: { c: 4, d: 3, f: 5 },
        e: [3, 4],
        g: 6,
      });
    });

    it('should handle null and undefined values', () => {
      const target = { a: 1 };
      const source = { b: null, c: undefined };

      const result = deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: null, c: undefined });
    });
  });

  describe('writeConfig', () => {
    it('should write config to file with proper formatting', async () => {
      const config = { version: '1.0', debug: true };
      const filePath = '/test/.claude/settings.json';

      fs.existsSync.mockReturnValue(false);
      fs.mkdirSync.mockImplementation(() => {});
      fs.writeFileSync.mockImplementation(() => {});

      await writeConfig(filePath, config);

      expect(fs.mkdirSync).toHaveBeenCalledWith('/test/.claude', { recursive: true });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        filePath,
        JSON.stringify(config, null, 2),
        'utf8',
      );
    });

    it('should not create directory if it exists', async () => {
      const config = { version: '1.0' };
      const filePath = '/test/.claude/settings.json';

      fs.existsSync.mockReturnValue(true);
      fs.writeFileSync.mockImplementation(() => {});

      await writeConfig(filePath, config);

      expect(fs.mkdirSync).not.toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('generateAndWriteConfig', () => {
    it('should generate and write config in one operation', async () => {
      detectProjectType.mockReturnValue('typescript');
      fs.existsSync.mockReturnValue(true);
      fs.writeFileSync.mockImplementation(() => {});

      const result = await generateAndWriteConfig('/test/project', { debug: true });

      expect(result).toHaveProperty('config');
      expect(result).toHaveProperty('path', '/test/project/.claude/settings.json');
      expect(result).toHaveProperty('projectType', 'typescript');
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });
});
