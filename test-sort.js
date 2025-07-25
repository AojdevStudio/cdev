const items = [
  { name: 'important1', importance: 'important' },
  { name: 'critical1', importance: 'critical' },
  { name: 'important2', importance: 'important' },
  { name: 'critical2', importance: 'critical' },
];

console.log('Before sort:');
items.forEach((item, i) => console.log(`${i}: ${item.name} (${item.importance})`));

const order = { critical: 0, important: 1, optional: 2, utility: 3 };

items.sort((a, b) => {
  console.log(`Sorting: ${a.name}(${a.importance}) vs ${b.name}(${b.importance})`);
  console.log(`a.importance: "${a.importance}" (length: ${a.importance.length})`);
  console.log(`b.importance: "${b.importance}" (length: ${b.importance.length})`);
  console.log(`order[a.importance]: ${order[a.importance]}`);
  console.log(`order[b.importance]: ${order[b.importance]}`);
  const result = (order[a.importance] || 3) - (order[b.importance] || 3);
  console.log(`Result: ${result}`);
  return result;
});

console.log('\nAfter sort:');
items.forEach((item, i) => console.log(`${i}: ${item.name} (${item.importance})`));
