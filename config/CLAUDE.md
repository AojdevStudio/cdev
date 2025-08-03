# Config Directory Documentation

## Overview

The `config/` directory contains all configuration files for the CDEV (Claude Development) project. These files define build environments, testing configurations, containerization settings, and development tooling for the AI-powered development orchestration system.

## File Structure

```
config/
├── Dockerfile                   # Multi-stage Docker build configuration
├── babel.config.js             # Babel JavaScript transpilation settings
├── dist-manifest.yaml          # Distribution and publishing metadata
├── docker-compose.yml          # Multi-service container orchestration
├── jest.config.js              # Main Jest testing configuration
├── jest.config.coverage.js     # Jest configuration for coverage reports
├── jest.config.dom.js          # Jest configuration for DOM-based tests
├── jest.config.integration.js  # Jest configuration for integration tests
├── jest.config.main.js         # Jest configuration (main/default)
├── jest.config.unit.js         # Jest configuration for unit tests
├── nginx.conf                  # Nginx reverse proxy configuration
└── tsconfig.json               # TypeScript compiler configuration
```

## Files Documentation

### Dockerfile
**Purpose**: Multi-stage Docker build configuration for creating development, production, and NPX package distribution images of the CDEV application.

**Entry Points**:
- `base` stage: Base Node.js Alpine image with system dependencies
- `development` stage: Development environment with hot reload
- `build` stage: Production build compilation
- `production` stage: Optimized production runtime
- `npx-package` stage: Global NPX package distribution

**Key Features**:
- Multi-package manager support (npm, yarn, pnpm)
- Security-hardened non-root user setup
- Health check endpoints for container monitoring
- Optimized layer caching for faster builds
- NPX global package linking for CLI distribution

**Important Variables/Constants**:
- `NODE_ENV`: Environment variable (development/production)
- `NEXT_TELEMETRY_DISABLED`: Disables Next.js telemetry
- `PORT`: Application port (default 3000)
- Health check intervals and retry configurations

### babel.config.js
**Purpose**: Configures Babel JavaScript transpilation for Node.js compatibility and modern JavaScript features.

**Entry Points**:
- `module.exports`: Main configuration object export

**Key Configuration**:
- `@babel/preset-env`: Modern JavaScript transpilation preset
- Node.js current version targeting
- Plugin system ready for additional transformations

**Important Variables/Constants**:
- `targets.node`: Set to 'current' for Node.js compatibility
- `presets`: Array containing Babel preset configurations
- `plugins`: Array for additional Babel plugins (currently empty)

### dist-manifest.yaml
**Purpose**: Metadata file containing distribution information, publishing status, and package validation details for NPX distribution.

**Key Configuration Sections**:
- `distribution`: Package entry point and keywords
- `scripts`: Executable Python scripts for the package
- `package`: NPM package identifier
- `publishStatus`: Publishing verification flags
- `validation`: Build and file validation status

**Important Variables/Constants**:
- `entryPoint`: Main package entry (src/installer.js)
- `type`: Package type (global-npx-package)
- `version`: Current package version (0.0.17)
- `keywords`: Package discovery tags (claude, parallel, development, etc.)

### docker-compose.yml
**Purpose**: Multi-service container orchestration configuration for development and production environments with supporting services.

**Entry Points**:
- `app`: Main production application service
- `app-dev`: Development application service
- `redis`: Caching and session management
- `postgres`: Persistent data storage
- `nginx`: Reverse proxy and load balancer
- `agent-monitor`: Parallel agent monitoring service
- `worktree-manager`: Git worktree management service
- `linear-cache`: Linear API caching service
- `healthcheck`: System health monitoring

**Key Services Configuration**:
- Network isolation with `claude-network`
- Volume persistence for data and cache
- Environment-specific overrides for development/production
- Service dependencies and health checks
- Port mappings and security configurations

**Important Variables/Constants**:
- `LINEAR_API_KEY`: Linear integration API key
- `POSTGRES_PASSWORD`: Database authentication
- `NODE_ENV`: Environment specification
- Volume mount paths for persistence and development

### jest.config.js
**Purpose**: Main Jest testing framework configuration for comprehensive test coverage with DOM and Node.js compatibility.

**Entry Points**:
- `module.exports`: Main Jest configuration object

**Key Functions**:
- Test environment setup with jsdom for browser compatibility
- Transform configuration for JavaScript/TypeScript files
- Module name mapping for static assets and CSS
- Coverage collection and reporting
- Performance optimization settings

**Important Variables/Constants**:
- `testEnvironment`: 'jsdom' for browser-like testing
- `testTimeout`: 60000ms for slower integration tests
- `coverageThreshold`: 95% for all metrics (branches, functions, lines, statements)
- `maxWorkers`: '50%' for performance optimization
- `workerIdleMemoryLimit`: '512MB' for memory management

### jest.config.main.js
**Purpose**: Main Jest configuration (duplicate of jest.config.js) with identical settings for comprehensive testing.

**Entry Points**:
- `module.exports`: Main Jest configuration object

**Key Features**:
- Same configuration as jest.config.js
- Root directory set to parent ('..') 
- Full coverage collection and reporting
- DOM compatibility with jsdom

### jest.config.unit.js
**Purpose**: Optimized Jest configuration for fast unit testing with Node.js environment and reduced overhead.

**Entry Points**:
- `module.exports`: Unit test configuration object

**Key Functions**:
- Node.js test environment for faster execution
- Specific test pattern matching for unit tests
- Exclusion of integration and DOM tests
- Disabled coverage for speed optimization

**Important Variables/Constants**:
- `testEnvironment`: 'node' for faster execution
- `testTimeout`: 30000ms for quicker unit tests
- `collectCoverage`: false for speed
- `testPathIgnorePatterns`: Excludes integration and DOM tests

### jest.config.integration.js
**Purpose**: Specialized Jest configuration for integration testing with longer timeouts and reduced parallelization.

**Entry Points**:
- `module.exports`: Integration test configuration object

**Key Functions**:
- Node.js environment for integration testing
- Specific test matching for integration directory
- Reduced worker count for I/O heavy tests
- Extended timeout for complex integration scenarios

**Important Variables/Constants**:
- `testMatch`: Only integration test directory
- `testTimeout`: 90000ms for complex tests
- `maxWorkers`: 2 for I/O heavy operations
- `collectCoverage`: false for performance

### jest.config.coverage.js
**Purpose**: Jest configuration specifically optimized for comprehensive code coverage collection and reporting.

**Entry Points**:
- `module.exports`: Coverage-focused configuration extending main config

**Key Functions**:
- Extends main Jest configuration
- V8 coverage provider for better performance
- Serial test execution for accurate coverage
- Comprehensive coverage path configuration

**Important Variables/Constants**:
- `coverageProvider`: 'v8' for performance
- `maxWorkers`: 1 for serial execution
- `collectCoverageFrom`: Specific file patterns for coverage
- `coverageThreshold`: 95% for all metrics

### jest.config.dom.js
**Purpose**: Specialized Jest configuration for DOM-dependent tests requiring browser-like environment and asset handling.

**Entry Points**:
- `module.exports`: DOM test configuration object

**Key Functions**:
- jsdom environment for browser simulation
- Module name mapping for CSS and static assets
- Specific test matching for DOM-related tests
- Reduced worker count for DOM complexity

**Important Variables/Constants**:
- `testEnvironment`: 'jsdom' for DOM testing
- `testMatch`: Only hook-selector.test.js (DOM-specific)
- `moduleNameMapper`: CSS and asset mocking
- `maxWorkers`: 2 for DOM test complexity

### nginx.conf
**Purpose**: Nginx reverse proxy configuration for production deployment with security headers, compression, and static file optimization.

**Entry Points**:
- `events` block: Worker connection configuration
- `http` block: Main HTTP server configuration
- `upstream app` block: Application server definition
- `server` block: Virtual host configuration

**Key Functions**:
- Reverse proxy to Node.js application
- Static file caching and compression
- Security header implementation
- API route proxying with WebSocket support

**Important Variables/Constants**:
- `worker_connections`: 1024 concurrent connections
- `server app:3000`: Upstream application server
- `gzip_comp_level`: 6 for balanced compression
- Cache expiry: 1 year for static assets
- Security headers: XSS protection, frame options, content type sniffing

### tsconfig.json
**Purpose**: TypeScript compiler configuration for type checking, module resolution, and build output settings across the project.

**Entry Points**:
- `compilerOptions`: Compiler behavior configuration
- `include`: Files and directories to compile
- `exclude`: Files and directories to ignore

**Key Compilation Settings**:
- ES2017 target for modern JavaScript features
- CommonJS module system for Node.js compatibility
- Strict type checking enabled
- JSX support with React 17+ transform

**Important Variables/Constants**:
- `target`: "es2017" for modern JavaScript
- `module`: "commonjs" for Node.js compatibility
- `strict`: true for comprehensive type checking
- `noEmit`: true for type checking only
- `jsx`: "react-jsx" for modern React support
- Include patterns: Source, library, component, and test files
- Exclude patterns: Node modules, build artifacts, and workspace directories

## Configuration Integration

These configuration files work together to provide:

1. **Development Environment**: Docker Compose with hot reload, Babel transpilation, and comprehensive testing
2. **Production Deployment**: Multi-stage Docker builds, Nginx reverse proxy, and optimized static serving
3. **Testing Framework**: Multiple Jest configurations for unit, integration, DOM, and coverage testing
4. **Type Safety**: TypeScript configuration for development-time type checking
5. **Package Distribution**: NPX package configuration for global CLI installation

The configuration supports the CDEV project's goal of providing a sophisticated development orchestration system with zero-friction setup and production-ready distribution capabilities.