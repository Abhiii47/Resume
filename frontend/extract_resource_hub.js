const { execSync } = require('child_process');
const fs = require('fs');

try {
  const content = execSync('git show 64d8a4c:frontend/src/pages/DashboardPage.js', { encoding: 'utf8' });
  const lines = content.split('\n');
  
  let startIdx = -1;
  let endIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('function ResourceHub')) {
      startIdx = i;
      break;
    }
  }

  if (startIdx !== -1) {
    let braceCount = 0;
    let started = false;
    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('{')) {
        started = true;
        braceCount += (line.match(/{/g) || []).length;
      }
      if (line.includes('}')) {
        braceCount -= (line.match(/}/g) || []).length;
      }
      if (started && braceCount === 0) {
        endIdx = i;
        break;
      }
    }
    const result = lines.slice(startIdx, endIdx + 1).join('\n');
    fs.writeFileSync('frontend/extracted_resource_hub.js', result, 'utf8');
    console.log('ResourceHub extracted to frontend/extracted_resource_hub.js');
  } else {
    console.log('ResourceHub not found');
  }
} catch (err) {
  console.error(err);
}
