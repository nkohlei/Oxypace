const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

function fetchTls(url, referer) {
  return new Promise(resolve => {
    execFile('python3', [path.join(__dirname, 'services/tlsFetcher.py'), url, referer || ''], { maxBuffer: 15 * 1024 * 1024 }, (e, out) => resolve(out || ''));
  });
}

async function test() {
  const html = await fetchTls('https://matrudas.com/video/f5f3b8d720f34ebebceb7765e447268b', 'https://myplayersvideo.xyz/');
  fs.writeFileSync('/tmp/matrudas.html', html);
  console.log('Saved /tmp/matrudas.html, len:', html.length);
  
  // Test if matrudas also has ?do=getVideo
  const getVideo = await fetchTls('https://matrudas.com/video/f5f3b8d720f34ebebceb7765e447268b?do=getVideo', 'https://matrudas.com/video/f5f3b8d720f34ebebceb7765e447268b');
  console.log('Matrudas getVideo:', getVideo);
}
test();
