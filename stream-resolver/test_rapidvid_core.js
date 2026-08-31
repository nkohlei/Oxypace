const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

function fetchTls(url, referer) {
  return new Promise(resolve => {
    execFile('python3', [path.join(__dirname, 'services/tlsFetcher.py'), url, referer || ''], { maxBuffer: 15 * 1024 * 1024 }, (e, out) => resolve(out || ''));
  });
}

async function test() {
  const coreJs = await fetchTls('https://rapidvid.net/ifr/vod/js/core.min.2026082802.js', 'https://rapidvid.net/vx/v1x18e7b97c');
  fs.writeFileSync('/tmp/rapidvid_core.js', coreJs);
  console.log('Saved /tmp/rapidvid_core.js, len:', coreJs.length);
  
  // Find decode function for _p8
  const lines = coreJs.split('\n');
  console.log('Lines count:', lines.length);
  console.log('Snippet:', coreJs.substring(0, 1000));
}
test();
