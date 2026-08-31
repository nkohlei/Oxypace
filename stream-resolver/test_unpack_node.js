const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('/tmp/fire.html', 'utf8');

const regex = /eval\s*\(\s*(function\s*\([\s\S]*?\.split\(['"]\|['"]\)\s*\))\s*\)/gi;
let m;
let count = 0;
while ((m = regex.exec(html)) !== null) {
  count++;
  try {
    const unpacked = vm.runInNewContext('(' + m[1] + ')');
    console.log('=== UNPACKED SCRIPT #' + count + ' ===');
    console.log(unpacked);
  } catch (e) {
    console.log('Unpack error #' + count, e.message);
  }
}
console.log('Total unpacked:', count);
