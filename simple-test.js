const order = { critical: 0, important: 1, optional: 2, utility: 3 };

console.log('order.critical:', order.critical);
console.log('order.important:', order.important);

const a = { importance: 'critical' };
const b = { importance: 'important' };

console.log('a.importance:', a.importance);
console.log('b.importance:', b.importance);
console.log('order[a.importance]:', order[a.importance]);
console.log('order[b.importance]:', order[b.importance]);

const result = (order[a.importance] || 3) - (order[b.importance] || 3);
console.log(
  'Calculation: (',
  order[a.importance] || 3,
  ') - (',
  order[b.importance] || 3,
  ') =',
  result,
);

// Test array sort
const items = [
  { name: 'imp', importance: 'important' },
  { name: 'crit', importance: 'critical' },
];

console.log(
  '\nBefore sort:',
  items.map((i) => i.name),
);

items.sort((a, b) => {
  const aVal = order[a.importance] || 3;
  const bVal = order[b.importance] || 3;
  console.log(`Sorting ${a.name}(${aVal}) vs ${b.name}(${bVal}) = ${aVal - bVal}`);
  return aVal - bVal;
});

console.log(
  'After sort:',
  items.map((i) => i.name),
);
