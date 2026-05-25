const fs = require('fs');

try {
  const content = fs.readFileSync('C:\\Users\\DELL\\.gemini\\antigravity\\brain\\f3cee1cb-ab09-4ce6-93ad-b9539179918c\\.system_generated\\tasks\\task-106.log', 'utf8');
  const lines = content.split('\n');
  
  const relevant = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('.js:') || lines[i].includes('@parcel/transformer-js:')) {
      relevant.push(`${i}: ${lines[i]}`);
      // Push some surrounding context
      for (let j = Math.max(0, i-2); j <= Math.min(lines.length-1, i+5); j++) {
        relevant.push(`  [${j}] ${lines[j]}`);
      }
      relevant.push('-------------------');
    }
  }
  console.log(relevant.slice(-20).join('\n'));
} catch (err) {
  console.error(err);
}
