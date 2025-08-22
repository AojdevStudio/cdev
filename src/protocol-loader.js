#!/usr/bin/env node

/**
 * Protocol Loader - Assembles agent instructions with modular protocols
 *
 * This script provides two loading strategies:
 * 1. Build-time assembly from YAML manifests
 * 2. Runtime resolution of @include directives
 */

const path = require('path');

const fs = require('fs-extra');
const yaml = require('js-yaml');

class ProtocolLoader {
  constructor(basePath = '.claude') {
    this.basePath = basePath;
    this.protocolsPath = path.join(basePath, 'protocols');
    this.agentsPath = path.join(basePath, 'agents');
    this.cache = new Map();
  }

  /**
   * Option 1: Build-Time Assembly
   * Loads agent manifest and assembles with protocols
   */
  async assembleAgent(agentName) {
    const manifestPath = path.join(this.agentsPath, `${agentName}.yaml`);

    if (!(await fs.pathExists(manifestPath))) {
      throw new Error(`Agent manifest not found: ${manifestPath}`);
    }

    const manifest = yaml.load(await fs.readFile(manifestPath, 'utf8'));
    const protocols = await this.loadProtocols(manifest.protocols || []);

    return this.buildSystemPrompt(manifest, protocols);
  }

  /**
   * Load protocol definitions
   */
  async loadProtocols(protocolList) {
    const protocols = [];

    for (const protocolRef of protocolList) {
      const [name, version] = protocolRef.split('@');
      const protocol = await this.loadProtocol(name, version);
      protocols.push(protocol);
    }

    return protocols;
  }

  /**
   * Load a single protocol with caching
   */
  async loadProtocol(name, version = 'latest') {
    const cacheKey = `${name}@${version}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const protocolPath = path.join(this.protocolsPath, `${name}.yaml`);

    if (!(await fs.pathExists(protocolPath))) {
      throw new Error(`Protocol not found: ${name}`);
    }

    const protocol = yaml.load(await fs.readFile(protocolPath, 'utf8'));
    this.cache.set(cacheKey, protocol);

    return protocol;
  }

  /**
   * Build complete system prompt from manifest and protocols
   */
  buildSystemPrompt(manifest, protocols) {
    const sections = [];

    // Add agent header
    sections.push(`# ${manifest.name}\n\n${manifest.description}\n`);

    // Add core expertise
    if (manifest.core_expertise) {
      sections.push(`## Core Expertise\n${manifest.core_expertise}`);
    }

    // Add protocols
    if (protocols.length > 0) {
      sections.push(this.formatProtocols(protocols));
    }

    // Add context files
    if (manifest.context_files) {
      sections.push(this.formatContextFiles(manifest.context_files));
    }

    return sections.join('\n\n---\n\n');
  }

  /**
   * Format protocols into readable sections
   */
  formatProtocols(protocols) {
    const critical = protocols.filter((p) => p.priority === 'critical');
    const important = protocols.filter((p) => p.priority === 'important');
    const optional = protocols.filter((p) => p.priority === 'optional');

    let output = '## Active Protocols\n\n';

    if (critical.length > 0) {
      output += '### Critical (MUST FOLLOW)\n';
      critical.forEach((p) => {
        output += this.formatProtocol(p);
      });
    }

    if (important.length > 0) {
      output += '\n### Important\n';
      important.forEach((p) => {
        output += this.formatProtocol(p);
      });
    }

    if (optional.length > 0) {
      output += '\n### Optional\n';
      optional.forEach((p) => {
        output += this.formatProtocol(p);
      });
    }

    return output;
  }

  /**
   * Format a single protocol
   */
  formatProtocol(protocol) {
    let output = `\n#### ${protocol.name} v${protocol.version}\n`;
    output += `${protocol.description}\n\n`;

    if (protocol.rules) {
      output += 'Rules:\n';
      protocol.rules.forEach((rule) => {
        output += `- **${rule.id}**: ${rule.description}\n`;
      });
    }

    if (protocol.setup) {
      output += '\nSetup required - see protocol documentation\n';
    }

    return output;
  }

  /**
   * Option 2: Reference-Based Loading
   * Processes @include directives in markdown files
   */
  async processIncludes(filePath) {
    let content = await fs.readFile(filePath, 'utf8');
    const includePattern = /@include:\s*(.+)/g;
    let match = includePattern.exec(content);

    while (match !== null) {
      const includePath = match[1].trim();
      const fullPath = path.join(this.basePath, includePath);

      if (await fs.pathExists(fullPath)) {
        const includeContent = await fs.readFile(fullPath, 'utf8');
        content = content.replace(match[0], includeContent);
      } else {
        console.warn(`Include file not found: ${includePath}`);
      }

      match = includePattern.exec(content);
    }

    return content;
  }

  /**
   * Format context files references
   */
  formatContextFiles(files) {
    let output = '## Context Files\n\n';
    output += 'The following files provide additional context:\n';

    files.forEach((file) => {
      output += `- ${file}\n`;
    });

    return output;
  }
}

/**
 * CLI Interface
 */
async function main() {
  const loader = new ProtocolLoader();
  const command = process.argv[2];
  const agentName = process.argv[3];

  if (!command) {
    console.log('Usage:');
    console.log('  node protocol-loader.js assemble <agent-name>  # Option 1: Build from YAML');
    console.log('  node protocol-loader.js process <file-path>    # Option 2: Process @includes');
    console.log('  node protocol-loader.js validate              # Validate all protocols');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'assemble':
        if (!agentName) {
          throw new Error('Agent name required');
        }
        const prompt = await loader.assembleAgent(agentName);
        console.log(prompt);

        // Optionally save to file
        const outputPath = path.join('.claude', 'agents', `${agentName}-assembled.md`);
        await fs.writeFile(outputPath, prompt);
        console.error(`\nAssembled agent saved to: ${outputPath}`);
        break;

      case 'process':
        if (!agentName) {
          throw new Error('File path required');
        }
        const processed = await loader.processIncludes(agentName);
        console.log(processed);
        break;

      case 'validate':
        await validateAllProtocols(loader);
        break;

      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

/**
 * Validate all protocols and agents
 */
async function validateAllProtocols(loader) {
  console.log('Validating protocols...\n');

  const protocolFiles = await fs.readdir(loader.protocolsPath);
  const agentFiles = await fs.readdir(loader.agentsPath);

  // Validate protocols
  for (const file of protocolFiles) {
    if (file.endsWith('.yaml')) {
      const name = path.basename(file, '.yaml');
      try {
        await loader.loadProtocol(name);
        console.log(`✅ Protocol: ${name}`);
      } catch (error) {
        console.log(`❌ Protocol: ${name} - ${error.message}`);
      }
    }
  }

  console.log('\nValidating agents...\n');

  // Validate agents
  for (const file of agentFiles) {
    if (file.endsWith('.yaml')) {
      const name = path.basename(file, '.yaml');
      try {
        await loader.assembleAgent(name);
        console.log(`✅ Agent: ${name}`);
      } catch (error) {
        console.log(`❌ Agent: ${name} - ${error.message}`);
      }
    }
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ProtocolLoader;
