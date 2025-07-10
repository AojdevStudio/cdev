const path = require('path');
const fs = require('fs');

/**
 * Sample project configurations for testing different project types
 * These fixtures represent common project structures and configurations
 */
const sampleProjects = {
  // Next.js application with Claude integration
  nextjs: {
    name: 'nextjs-app',
    description: 'Next.js 14 app with App Router and Claude hooks',
    files: {
      'package.json': JSON.stringify({
        name: 'nextjs-claude-app',
        version: '1.0.0',
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          lint: 'next lint',
          test: 'jest'
        },
        dependencies: {
          next: '^14.0.0',
          react: '^18.2.0',
          'react-dom': '^18.2.0'
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          typescript: '^5.2.0',
          jest: '^29.7.0'
        }
      }, null, 2),
      'next.config.js': `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true
  }
};

module.exports = nextConfig;`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'es5',
          lib: ['dom', 'dom.iterable', 'esnext'],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: 'esnext',
          moduleResolution: 'bundler',
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: 'preserve',
          incremental: true,
          plugins: [{ name: 'next' }],
          paths: { '@/*': ['./src/*'] }
        },
        include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
        exclude: ['node_modules']
      }, null, 2)
    }
  },

  // React Vite application
  react: {
    name: 'react-vite-app',
    description: 'React 18 app with Vite and TypeScript',
    files: {
      'package.json': JSON.stringify({
        name: 'react-vite-claude',
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'tsc && vite build',
          lint: 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0',
          preview: 'vite preview',
          test: 'vitest'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0'
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@vitejs/plugin-react': '^4.0.0',
          typescript: '^5.2.0',
          vite: '^5.0.0',
          vitest: '^1.0.0'
        }
      }, null, 2),
      'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts'
  }
});`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true
        },
        include: ['src'],
        references: [{ path: './tsconfig.node.json' }]
      }, null, 2)
    }
  },

  // Node.js backend service
  nodejs: {
    name: 'nodejs-service',
    description: 'Node.js Express API with TypeScript',
    files: {
      'package.json': JSON.stringify({
        name: 'nodejs-claude-service',
        version: '1.0.0',
        type: 'commonjs',
        scripts: {
          start: 'node dist/index.js',
          dev: 'nodemon --exec ts-node src/index.ts',
          build: 'tsc',
          test: 'jest',
          lint: 'eslint src --ext .ts'
        },
        dependencies: {
          express: '^4.18.0',
          dotenv: '^16.0.0',
          cors: '^2.8.0'
        },
        devDependencies: {
          '@types/express': '^4.17.0',
          '@types/node': '^20.0.0',
          '@types/cors': '^2.8.0',
          typescript: '^5.2.0',
          'ts-node': '^10.9.0',
          nodemon: '^3.0.0',
          jest: '^29.7.0',
          'ts-jest': '^29.1.0'
        }
      }, null, 2),
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          lib: ['ES2020'],
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true,
          noImplicitAny: true,
          strictNullChecks: true,
          strictFunctionTypes: true,
          noImplicitThis: true,
          alwaysStrict: true
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist']
      }, null, 2),
      '.env.example': `NODE_ENV=development
PORT=3000
API_KEY=your-api-key-here
LINEAR_API_KEY=lin_api_xxxxx`
    }
  },

  // Python Flask application
  python: {
    name: 'python-flask-app',
    description: 'Python Flask API with Claude integration',
    files: {
      'requirements.txt': `flask==3.0.0
python-dotenv==1.0.0
pytest==7.4.0
black==23.0.0
flake8==6.0.0
mypy==1.0.0
claude-python==0.1.0`,
      'pyproject.toml': `[build-system]
requires = ["setuptools>=45", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "flask-claude-app"
version = "1.0.0"
description = "Flask API with Claude integration"
dependencies = [
    "flask>=3.0.0",
    "python-dotenv>=1.0.0"
]

[tool.black]
line-length = 88
target-version = ['py39']

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = "test_*.py"
python_classes = "Test*"
python_functions = "test_*"`,
      'app.py': `from flask import Flask, jsonify
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

@app.route('/')
def hello():
    return jsonify({'message': 'Hello from Flask with Claude!'})

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(debug=True, port=port)`,
      '.env.example': `FLASK_ENV=development
PORT=5000
API_KEY=your-api-key-here
LINEAR_API_KEY=lin_api_xxxxx`
    }
  },

  // Minimal JavaScript project
  minimal: {
    name: 'minimal-js',
    description: 'Minimal JavaScript project for testing',
    files: {
      'package.json': JSON.stringify({
        name: 'minimal-claude-project',
        version: '1.0.0',
        main: 'index.js',
        scripts: {
          start: 'node index.js',
          test: 'echo "No tests specified"'
        }
      }, null, 2),
      'index.js': `console.log('Minimal project with Claude hooks');

// Example usage
function main() {
  console.log('Application started');
}

main();`
    }
  },

  // Monorepo project structure
  monorepo: {
    name: 'monorepo',
    description: 'Monorepo with multiple packages',
    files: {
      'package.json': JSON.stringify({
        name: 'claude-monorepo',
        version: '1.0.0',
        private: true,
        workspaces: ['packages/*', 'apps/*'],
        scripts: {
          dev: 'turbo run dev',
          build: 'turbo run build',
          test: 'turbo run test'
        },
        devDependencies: {
          turbo: '^1.10.0',
          typescript: '^5.2.0'
        }
      }, null, 2),
      'turbo.json': JSON.stringify({
        $schema: 'https://turbo.build/schema.json',
        pipeline: {
          build: {
            dependsOn: ['^build'],
            outputs: ['dist/**', '.next/**']
          },
          dev: {
            persistent: true,
            cache: false
          },
          test: {
            dependsOn: ['build'],
            outputs: ['coverage/**']
          }
        }
      }, null, 2),
      'pnpm-workspace.yaml': `packages:
  - 'packages/*'
  - 'apps/*'
  - '!**/dist'
  - '!**/.next'`
    }
  }
};

/**
 * Creates a temporary project directory with the specified project type
 * @param {string} projectType - Type of project to create
 * @param {string} tempDir - Temporary directory path
 * @returns {string} Path to created project
 */
function createSampleProject(projectType, tempDir) {
  const project = sampleProjects[projectType];
  if (!project) {
    throw new Error(`Unknown project type: ${projectType}`);
  }

  const projectPath = path.join(tempDir, project.name);
  
  // Create project directory
  fs.mkdirSync(projectPath, { recursive: true });
  
  // Create all files
  Object.entries(project.files).forEach(([filePath, content]) => {
    const fullPath = path.join(projectPath, filePath);
    const dir = path.dirname(fullPath);
    
    // Ensure directory exists
    fs.mkdirSync(dir, { recursive: true });
    
    // Write file
    fs.writeFileSync(fullPath, content);
  });
  
  // Create common directories
  const commonDirs = ['src', 'tests', '.claude'];
  commonDirs.forEach(dir => {
    fs.mkdirSync(path.join(projectPath, dir), { recursive: true });
  });
  
  return projectPath;
}

/**
 * Gets list of all available project types
 * @returns {string[]} Array of project type names
 */
function getProjectTypes() {
  return Object.keys(sampleProjects);
}

/**
 * Gets project configuration by type
 * @param {string} projectType - Type of project
 * @returns {object} Project configuration
 */
function getProjectConfig(projectType) {
  return sampleProjects[projectType];
}

module.exports = {
  sampleProjects,
  createSampleProject,
  getProjectTypes,
  getProjectConfig
};