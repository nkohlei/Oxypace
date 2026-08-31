const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('/tmp/fire.html', 'utf8');

function robustUnpack(code) {
  const evalRegex = /eval\s*\(\s*(function\s*\([\s\S]*?\.split\(['"]\|['"]\)\s*\))\s*\)/gi;
  let match;
  let result = code;
  const matches = [];
  while ((match = evalRegex.exec(code)) !== null) {
    matches.push(match);
  }
  console.log('Regex matches found:', matches.length);
  for (const m of matches) {
    try {
      const unpacked = vm.runInNewContext('(' + m[1] + ')');
      if (typeof unpacked === 'string') {
        result += '\n' + unpacked;
        console.log('Unpacked snippet:', unpacked.substring(0, 200));
      }
    } catch (e) {
      console.log('Unpack err:', e.message);
    }
  }
  return result;
}

const res = robustUnpack(html);
const streams = res.match(/https?:\/\/[^\s"'<>\\]+(?:\.m3u8|\.mp4|master\.txt|\/hls\/)[^\s"'<>\\]*/gi);
console.log('Found streams:', streams);
