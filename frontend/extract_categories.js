const fs = require('fs');

try {
  const content = fs.readFileSync('frontend/dashboard_first_utf8.js', 'utf8');
  const lines = content.split('\n');
  
  let startIdx = -1;
  let endIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const CATEGORIES = [')) {
      startIdx = i;
      break;
    }
  }

  if (startIdx !== -1) {
    let bracketCount = 0;
    let started = false;
    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('[')) {
        started = true;
        bracketCount += (line.match(/\[/g) || []).length;
      }
      if (line.includes(']')) {
        bracketCount -= (line.match(/\]/g) || []).length;
      }
      if (started && bracketCount === 0) {
        endIdx = i;
        break;
      }
    }
    const result = lines.slice(startIdx, endIdx + 1).join('\n');
    console.log(result);
  } else {
    console.log('CATEGORIES not found');
  }
} catch (err) {
  console.error(err);
}
