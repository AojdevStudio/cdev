const fs = require('fs');

const {
  processTemplate,
  substituteVariables,
  extractVariables,
  validateVariables,
  createProcessor,
  loadAndProcessTemplate,
  getDefaultVariables,
} = require('../src/template-engine');

// Mock fs module
jest.mock('fs');

describe('Template Engine', () => {
  describe('processTemplate', () => {
    it('should process string templates', () => {
      const template = 'Hello {{name}}, welcome to ${project}!';
      const variables = { name: 'John', project: 'MyApp' };

      const result = processTemplate(template, variables);

      expect(result).toBe('Hello John, welcome to MyApp!');
    });

    it('should process array templates', () => {
      const template = ['{{greeting}}', 'Welcome to ${project}'];
      const variables = { greeting: 'Hello', project: 'MyApp' };

      const result = processTemplate(template, variables);

      expect(result).toEqual(['Hello', 'Welcome to MyApp']);
    });

    it('should process object templates recursively', () => {
      const template = {
        message: '{{greeting}} {{name}}',
        config: {
          project: '${project}',
          version: '{{version}}',
        },
      };
      const variables = {
        greeting: 'Hello',
        name: 'John',
        project: 'MyApp',
        version: '1.0',
      };

      const result = processTemplate(template, variables);

      expect(result).toEqual({
        message: 'Hello John',
        config: {
          project: 'MyApp',
          version: '1.0',
        },
      });
    });

    it('should handle non-string primitive values', () => {
      const template = {
        number: 42,
        boolean: true,
        null: null,
        undefined,
      };

      const result = processTemplate(template);

      expect(result).toEqual(template);
    });
  });

  describe('substituteVariables', () => {
    it('should substitute variables in different formats', () => {
      const variables = { name: 'John', project: 'MyApp', env: 'prod' };

      expect(substituteVariables('{{name}}', variables)).toBe('John');
      expect(substituteVariables('${project}', variables)).toBe('MyApp');
      expect(substituteVariables('%env%', variables)).toBe('prod');
    });

    it('should handle multiple variables in one string', () => {
      const str = '{{name}} is working on ${project} in %env% environment';
      const variables = { name: 'John', project: 'MyApp', env: 'prod' };

      const result = substituteVariables(str, variables);

      expect(result).toBe('John is working on MyApp in prod environment');
    });

    it('should preserve original text if variable not found', () => {
      const str = 'Hello {{unknown}} variable';
      const variables = { name: 'John' };

      const result = substituteVariables(str, variables);

      expect(result).toBe('Hello {{unknown}} variable');
    });

    it('should handle case-insensitive variable matching', () => {
      const str = '{{NAME}} and {{name}}';
      const variables = { name: 'John' };

      const result = substituteVariables(str, variables);

      expect(result).toBe('John and John');
    });

    it('should convert non-string values to JSON', () => {
      const str = 'Config: {{config}}';
      const variables = { config: { key: 'value' } };

      const result = substituteVariables(str, variables);

      expect(result).toBe('Config: {"key":"value"}');
    });
  });

  describe('extractVariables', () => {
    it('should extract variables from strings', () => {
      const template = 'Hello {{name}}, your ${project} in %env% is ready';

      const variables = extractVariables(template);

      expect(variables).toEqual(new Set(['name', 'project', 'env']));
    });

    it('should extract variables from arrays', () => {
      const template = ['{{var1}}', 'text ${var2}', 'more %var3%'];

      const variables = extractVariables(template);

      expect(variables).toEqual(new Set(['var1', 'var2', 'var3']));
    });

    it('should extract variables from nested objects', () => {
      const template = {
        a: '{{var1}}',
        b: {
          c: '${var2}',
          d: ['%var3%', '{{var4}}'],
        },
      };

      const variables = extractVariables(template);

      expect(variables).toEqual(new Set(['var1', 'var2', 'var3', 'var4']));
    });

    it('should handle templates without variables', () => {
      const template = { a: 'no vars', b: ['still', 'none'] };

      const variables = extractVariables(template);

      expect(variables.size).toBe(0);
    });
  });

  describe('validateVariables', () => {
    it('should validate all required variables are provided', () => {
      const template = 'Hello {{name}} from ${project}';
      const variables = { name: 'John', project: 'MyApp' };

      const result = validateVariables(template, variables);

      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
      expect(result.required).toEqual(['name', 'project']);
      expect(result.provided).toEqual(['name', 'project']);
    });

    it('should detect missing variables', () => {
      const template = 'Hello {{name}} from ${project}';
      const variables = { name: 'John' };

      const result = validateVariables(template, variables);

      expect(result.valid).toBe(false);
      expect(result.missing).toEqual(['project']);
    });

    it('should handle case-insensitive validation', () => {
      const template = 'Hello {{NAME}}';
      const variables = { name: 'John' };

      const result = validateVariables(template, variables);

      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });
  });

  describe('createProcessor', () => {
    it('should create processor with default variables', () => {
      const processor = createProcessor({ env: 'dev' });

      const result1 = processor('Running in {{env}}');
      expect(result1).toBe('Running in dev');

      const result2 = processor('Project {{name}} in {{env}}', { name: 'MyApp' });
      expect(result2).toBe('Project MyApp in dev');
    });

    it('should allow overriding default variables', () => {
      const processor = createProcessor({ env: 'dev', name: 'Default' });

      const result = processor('{{name}} in {{env}}', { name: 'Override' });

      expect(result).toBe('Override in dev');
    });
  });

  describe('loadAndProcessTemplate', () => {
    it('should load and process template from file', () => {
      const template = {
        message: 'Hello {{name}}',
        project: '${project}',
      };

      fs.readFileSync.mockReturnValue(JSON.stringify(template));

      const result = loadAndProcessTemplate('/template.json', {
        name: 'John',
        project: 'MyApp',
      });

      expect(result).toEqual({
        message: 'Hello John',
        project: 'MyApp',
      });
      expect(fs.readFileSync).toHaveBeenCalledWith('/template.json', 'utf8');
    });

    it('should handle file loading errors', () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      expect(() => loadAndProcessTemplate('/template.json')).toThrow(
        'Failed to load template from /template.json: File not found',
      );
    });

    it('should handle JSON parsing errors', () => {
      fs.readFileSync.mockReturnValue('{ invalid json }');

      expect(() => loadAndProcessTemplate('/template.json')).toThrow(
        /Failed to load template from \/template.json/,
      );
    });
  });

  describe('getDefaultVariables', () => {
    it('should return system and time variables', () => {
      const variables = getDefaultVariables();

      expect(variables).toHaveProperty('platform');
      expect(variables).toHaveProperty('arch');
      expect(variables).toHaveProperty('homedir');
      expect(variables).toHaveProperty('tmpdir');
      expect(variables).toHaveProperty('timestamp');
      expect(variables).toHaveProperty('date');
      expect(variables).toHaveProperty('year');
      expect(variables).toHaveProperty('username');
      expect(variables).toHaveProperty('projectPath');
      expect(variables).toHaveProperty('projectName');
    });

    it('should accept custom options', () => {
      const variables = getDefaultVariables({
        projectPath: '/custom/path',
        projectName: 'CustomApp',
        projectType: 'react',
        custom: {
          extra: 'value',
        },
      });

      expect(variables.projectPath).toBe('/custom/path');
      expect(variables.projectName).toBe('CustomApp');
      expect(variables.projectType).toBe('react');
      expect(variables.extra).toBe('value');
    });

    it('should use current year in variables', () => {
      const variables = getDefaultVariables();
      const currentYear = new Date().getFullYear();

      expect(variables.year).toBe(currentYear);
    });
  });
});
