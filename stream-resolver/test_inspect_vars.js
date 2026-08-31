const fs = require('fs');
const html = fs.readFileSync('/tmp/fullhd.html', 'utf8');

const vidid = (html.match(/var\s+vidid\s*=\s*['"]?(\d+)['"]?/) || [])[1];
const scxStr = (html.match(/var\s+scx\s*=\s*(\{[\s\S]*?\});/) || [])[1];

console.log('vidid:', vidid);
console.log('scxStr:', scxStr);

if (scxStr) {
  const scx = JSON.parse(scxStr);
  console.log('scx object:', JSON.stringify(scx, null, 2));
}
