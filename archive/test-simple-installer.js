#!/usr/bin/env node

const path = require('path');
const fs = require('fs-extra');
const InteractiveInstaller = require('./src/interactive-installer');

async function testInstaller() {
  const testDir = path.join(__dirname, 'test-installation');

  console.log('Testing Interactive Installer...\n');

  try {
    // Clean up any previous test
    await fs.remove(testDir);
    await fs.ensureDir(testDir);

    // Create a mock config to bypass prompts
    const installer = new InteractiveInstaller();

    // Mock the getConfiguration method
    installer.getConfiguration = async () => ({
      hooks: ['code-quality-reporter', 'import-organizer', 'typescript-validator'],
      installWorkflowScripts: true,
      installAIDocs: true,
      setupLinear: true,
      linearApiKey: '',
      engineerName: 'Test Engineer',
      branchNamingStyle: 'simple',
    });

    // Run the installer
    await installer.install(testDir);

    // Verify installation
    console.log('\nVerifying installation...');

    // Check hooks were installed
    const hooksDir = path.join(testDir, '.claude', 'hooks');
    const installedHooks = await fs.readdir(hooksDir);
    console.log(
      '✓ Installed hooks:',
      installedHooks.filter((f) => f.endsWith('.py')),
    );

    // Check tier 1 hooks
    const tier1Hooks = [
      'pre_tool_use.py',
      'post_tool_use.py',
      'notification.py',
      'stop.py',
      'subagent_stop.py',
    ];
    const missingTier1 = tier1Hooks.filter((h) => !installedHooks.includes(h));
    if (missingTier1.length === 0) {
      console.log('✓ All Tier 1 hooks installed');
    } else {
      console.log('✗ Missing Tier 1 hooks:', missingTier1);
    }

    // Check selected optional hooks
    const expectedOptional = [
      'code-quality-reporter.py',
      'import-organizer.py',
      'typescript-validator.py',
    ];
    const missingOptional = expectedOptional.filter((h) => !installedHooks.includes(h));
    if (missingOptional.length === 0) {
      console.log('✓ All selected optional hooks installed');
    } else {
      console.log('✗ Missing optional hooks:', missingOptional);
    }

    // Check other components
    const commandsExist = await fs.pathExists(path.join(testDir, '.claude', 'commands'));
    console.log(commandsExist ? '✓ Commands installed' : '✗ Commands missing');

    const agentsExist = await fs.pathExists(path.join(testDir, '.claude', 'agents'));
    console.log(agentsExist ? '✓ Agents installed' : '✗ Agents missing');

    const scriptsExist = await fs.pathExists(path.join(testDir, '.claude', 'scripts'));
    console.log(scriptsExist ? '✓ Scripts installed' : '✗ Scripts missing');

    const aiDocsExist = await fs.pathExists(path.join(testDir, 'ai-docs'));
    console.log(aiDocsExist ? '✓ AI docs installed' : '✗ AI docs missing');

    const settingsExist = await fs.pathExists(path.join(testDir, '.claude', 'settings.json'));
    console.log(settingsExist ? '✓ Settings created' : '✗ Settings missing');

    console.log('\n✅ Test completed successfully!');

    // Clean up
    await fs.remove(testDir);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testInstaller();
