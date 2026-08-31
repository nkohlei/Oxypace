const fs = require('fs');
const html = fs.readFileSync('/tmp/fire.html', 'utf8');

const sIdx = html.indexOf('eval(function');
if (sIdx !== -1) {
  console.log('Found eval(function at index:', sIdx);
  console.log('Snippet:', html.substring(sIdx, sIdx + 400));
} else {
  console.log('eval(function not found directly');
}
