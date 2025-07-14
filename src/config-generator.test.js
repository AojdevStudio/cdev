/**
 * Tests for config-generator.js
 */

import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

import {
  generateConfig,
  mergeConfigurations,
  mergeHooks,
  deepMerge,
  writeConfig,
  generateAndWriteConfig,
} from './config-generator';
import { detectProjectType } from './install-utils';
import { processTemplate } from './template-engine';
// Mock dependencies first
jest.mock('fs');
jest.mock('./install-utils');
jest.mock('./template-engine');

describe('ConfigGenerator', () => {
  const testProjectPath = '/test/project';
  const mockTemplate = {
    name: 'test-config',
    version: '1.0.0',
    hooks: {
      pre: ['hook1', 'hook2'],
      post: ['hook3'],
    },
    settings: {
      feature: true,
      value: 42,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    detectProjectType.mockReturnValue('nodejs');
    existsSync.mockReturnValue(true);
    readFileSync.mockReturnValue(JSON.stringify(mockTemplate));
    mkdirSync.mockImplementation();
    writeFileSync.mockImplementation();

    processTemplate.mockImplementation((template) => template);
  });

  describe('generateConfig', () => {
    test('loads project-specific template when available', () => {
      const config = generateConfig(testProjectPath);

      expect(detectProjectType).toHaveBeenCalledWith(testProjectPath);
      expect(existsSync).toHaveBeenCalledWith(expect.stringContaining('templates/nodejs.json'));
      expect(readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('templates/nodejs.json'),
        'utf8',
      );
      expect(config).toEqual(mockTemplate);
    });

    test('falls back to default template when project-specific not found', () => {
      existsSync.mockReturnValue(false);

      generateConfig(testProjectPath);

      expect(readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('templates/default.json'),
        'utf8',
      );
    });

    test('merges user options with template', () => {
      const options = {
        settings: { feature: false, newOption: 'test' },
      };

      generateConfig(testProjectPath, options);

      expect(processTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            feature: false,
            newOption: 'test',
          }),
        }),
        expect.any(Object),
      );
    });

    test('applies template variables', () => {
      const options = {
        variables: { customVar: 'value' },
      };

      generateConfig(testProjectPath, options);

      expect(processTemplate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          projectPath: testProjectPath,
          projectType: 'nodejs',
          timestamp: expect.any(String),
          customVar: 'value',
        }),
      );
    });

    test('throws error when template loading fails', () => {
      readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      expect(() => generateConfig(testProjectPath)).toThrow(
        'Failed to load configuration template: File not found',
      );
    });

    test('throws error when template JSON is invalid', () => {
      readFileSync.mockReturnValue('invalid json');

      expect(() => generateConfig(testProjectPath)).toThrow(
        'Failed to load configuration template',
      );
    });
  });

  describe('mergeConfigurations', () => {
    test('merges simple properties', () => {
      const base = { a: 1, b: 2 };
      const overrides = { b: 3, c: 4 };

      const result = mergeConfigurations(base, overrides);

      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    test('merges nested objects', () => {
      const base = {
        settings: { feature1: true, feature2: false },
        metadata: { version: '1.0' },
      };
      const overrides = {
        settings: { feature2: true, feature3: true },
        metadata: { author: 'test' },
      };

      const result = mergeConfigurations(base, overrides);

      expect(result).toEqual({
        settings: { feature1: true, feature2: true, feature3: true },
        metadata: { version: '1.0', author: 'test' },
      });
    });

    test('handles hooks specially by appending', () => {
      const base = {
        hooks: { pre: ['hook1'], post: ['hook2'] },
      };
      const overrides = {
        hooks: { pre: ['hook3'], post: ['hook2', 'hook4'] },
      };

      const result = mergeConfigurations(base, overrides);

      expect(result.hooks).toEqual({
        pre: ['hook1', 'hook3'],
        post: ['hook2', 'hook4'],
      });
    });

    test('deep clones base configuration', () => {
      const base = { nested: { value: 1 } };
      const overrides = {};

      const result = mergeConfigurations(base, overrides);
      result.nested.value = 2;

      expect(base.nested.value).toBe(1);
    });
  });

  describe('mergeHooks', () => {
    test('merges hook arrays without duplicates', () => {
      const baseHooks = {
        pre: ['hook1', 'hook2'],
        post: ['hook3'],
      };
      const overrideHooks = {
        pre: ['hook2', 'hook4'],
        post: ['hook3', 'hook5'],
      };

      const result = mergeHooks(baseHooks, overrideHooks);

      expect(result).toEqual({
        pre: ['hook1', 'hook2', 'hook4'],
        post: ['hook3', 'hook5'],
      });
    });

    test('adds new hook events', () => {
      const baseHooks = { pre: ['hook1'] };
      const overrideHooks = { post: ['hook2'] };

      const result = mergeHooks(baseHooks, overrideHooks);

      expect(result).toEqual({
        pre: ['hook1'],
        post: ['hook2'],
      });
    });

    test('replaces when types do not match', () => {
      const baseHooks = { pre: 'single-hook' };
      const overrideHooks = { pre: ['hook1', 'hook2'] };

      const result = mergeHooks(baseHooks, overrideHooks);

      expect(result.pre).toEqual(['hook1', 'hook2']);
    });

    test('preserves base hooks not in overrides', () => {
      const baseHooks = { pre: ['hook1'], post: ['hook2'] };
      const overrideHooks = { pre: ['hook3'] };

      const result = mergeHooks(baseHooks, overrideHooks);

      expect(result.post).toEqual(['hook2']);
    });
  });

  describe('deepMerge', () => {
    test('merges plain objects', () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 };

      const result = deepMerge(target, source);

      expect(result).toEqual({
        a: 1,
        b: { c: 2, d: 3 },
        e: 4,
      });
    });

    test('overwrites non-object values', () => {
      const target = { a: 1, b: 'string' };
      const source = { a: 2, b: { nested: true } };

      const result = deepMerge(target, source);

      expect(result).toEqual({
        a: 2,
        b: { nested: true },
      });
    });

    test('handles arrays as values', () => {
      const target = { arr: [1, 2] };
      const source = { arr: [3, 4] };

      const result = deepMerge(target, source);

      expect(result.arr).toEqual([3, 4]);
    });

    test('handles null and undefined', () => {
      const target = { a: null, b: 1 };
      const source = { a: 2, b: null, c: undefined };

      const result = deepMerge(target, source);

      expect(result).toEqual({
        a: 2,
        b: null,
        c: undefined,
      });
    });

    test('deeply nested merge', () => {
      const target = {
        level1: {
          level2: {
            level3: { value: 1 },
          },
        },
      };
      const source = {
        level1: {
          level2: {
            level3: { value: 2, extra: true },
          },
        },
      };

      const result = deepMerge(target, source);

      expect(result.level1.level2.level3).toEqual({
        value: 2,
        extra: true,
      });
    });

    test('returns target when source is not object', () => {
      const target = { a: 1 };

      expect(deepMerge(target, null)).toEqual(target);
      expect(deepMerge(target, 'string')).toEqual(target);
      expect(deepMerge(target, 123)).toEqual(target);
    });
  });

  describe('writeConfig', () => {
    test('writes configuration to file', async () => {
      const config = { test: true };
      const filePath = '/test/config.json';

      await writeConfig(filePath, config);

      expect(writeFileSync).toHaveBeenCalledWith(filePath, JSON.stringify(config, null, 2), 'utf8');
    });

    test('creates directory if it does not exist', async () => {
      existsSync.mockReturnValue(false);
      const filePath = '/test/dir/config.json';

      await writeConfig(filePath, {});

      expect(mkdirSync).toHaveBeenCalledWith('/test/dir', { recursive: true });
    });

    test('does not create directory if it exists', async () => {
      existsSync.mockReturnValue(true);
      const filePath = '/test/config.json';

      await writeConfig(filePath, {});

      expect(mkdirSync).not.toHaveBeenCalled();
    });

    test('formats JSON with 2-space indentation', async () => {
      const config = { nested: { value: true } };

      await writeConfig('/test/config.json', config);

      const expectedJson = JSON.stringify(config, null, 2);
      expect(writeFileSync).toHaveBeenCalledWith(expect.any(String), expectedJson, 'utf8');
    });
  });

  describe('generateAndWriteConfig', () => {
    test('generates and writes configuration', async () => {
      const options = { customOption: true };
      const result = await generateAndWriteConfig(testProjectPath, options);

      expect(result).toEqual({
        config: mockTemplate,
        path: join(testProjectPath, '.claude', 'settings.json'),
        projectType: 'nodejs',
      });

      expect(writeFileSync).toHaveBeenCalledWith(
        join(testProjectPath, '.claude', 'settings.json'),
        expect.any(String),
        'utf8',
      );
    });

    test('creates .claude directory if needed', async () => {
      existsSync.mockImplementation((path) => !path.includes('.claude'));

      await generateAndWriteConfig(testProjectPath);

      expect(mkdirSync).toHaveBeenCalledWith(expect.stringContaining('.claude'), {
        recursive: true,
      });
    });

    test('passes options to generateConfig', async () => {
      const options = {
        hooks: { custom: ['hook'] },
        variables: { var1: 'value1' },
      };

      await generateAndWriteConfig(testProjectPath, options);

      expect(processTemplate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          var1: 'value1',
        }),
      );
    });

    test('returns complete result object', async () => {
      detectProjectType.mockReturnValue('nextjs');
      const processedConfig = { processed: true };
      processTemplate.mockReturnValue(processedConfig);

      const result = await generateAndWriteConfig(testProjectPath);

      expect(result).toEqual({
        config: processedConfig,
        path: expect.stringContaining('settings.json'),
        projectType: 'nextjs',
      });
    });
  });

  describe('edge cases', () => {
    test('handles empty configuration', () => {
      readFileSync.mockReturnValue('{}');

      const config = generateConfig(testProjectPath);

      expect(config).toEqual({});
    });

    test('handles deeply nested hook configurations', () => {
      const base = {
        hooks: {
          event1: {
            matchers: ['*.js'],
            hooks: ['hook1'],
          },
        },
      };
      const overrides = {
        hooks: {
          event1: {
            matchers: ['*.ts'],
            hooks: ['hook2'],
          },
        },
      };

      const result = mergeConfigurations(base, overrides);

      // Should replace complex hook structure
      expect(result.hooks.event1).toEqual({
        matchers: ['*.ts'],
        hooks: ['hook2'],
      });
    });

    test('handles circular references in templates', () => {
      const circular = { a: 1 };
      circular.self = circular;

      readFileSync.mockReturnValue(JSON.stringify(mockTemplate));
      processTemplate.mockReturnValue(circular);

      // Should not throw when stringifying
      expect(() => generateConfig(testProjectPath)).not.toThrow();
    });
  });
});
