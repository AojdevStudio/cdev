const HookSelector = require('./src/hook-selector');

const mockCategorizedHooks = {
  tier1: [
    {
      name: 'commit-message-validator.py',
      tier: 'tier1',
      importance: 'critical',
      category: 'validation',
    },
    {
      name: 'typescript-validator.py',
      tier: 'tier1',
      importance: 'critical',
      category: 'validation',
    },
    { name: 'pnpm-enforcer.py', tier: 'tier1', importance: 'critical', category: 'enforcement' },
  ],
  tier2: [
    {
      name: 'api-standards-checker.py',
      tier: 'tier2',
      importance: 'important',
      category: 'checking',
    },
    {
      name: 'code-quality-reporter.py',
      tier: 'tier2',
      importance: 'important',
      category: 'reporting',
    },
    { name: 'universal-linter.py', tier: 'tier2', importance: 'important', category: 'linting' },
  ],
  tier3: [
    { name: 'notification.py', tier: 'tier3', importance: 'optional', category: 'notification' },
    { name: 'stop.py', tier: 'tier3', importance: 'optional', category: 'lifecycle' },
  ],
  utils: [],
};

const selector = new HookSelector();
const selected = selector.selectHooks(mockCategorizedHooks, 'default');

console.log('Default config:', selector.getProjectConfig('default'));
console.log('\nSelected hooks order:');
selected.forEach((hook, index) => {
  console.log(`${index}: ${hook.name} (${hook.importance}) - tier: ${hook.tier}`);
});

console.log(
  '\nCritical index:',
  selected.findIndex((h) => h.importance === 'critical'),
);
console.log(
  'Important index:',
  selected.findIndex((h) => h.importance === 'important'),
);

// Test what happens if we manually sort by importance
const manuallySorted = [...selected].sort((a, b) => {
  const order = { critical: 0, important: 1, optional: 2, utility: 3 };
  return (order[a.importance] || 3) - (order[b.importance] || 3);
});

console.log('\nManually sorted hooks:');
manuallySorted.forEach((hook, index) => {
  console.log(`${index}: ${hook.name} (${hook.importance})`);
});
