const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

function fetchTls(url) {
  return new Promise(resolve => {
    execFile('python3', [path.join(__dirname, 'services/tlsFetcher.py'), url], { maxBuffer: 15 * 1024 * 1024 }, (e, out) => resolve(out || ''));
  });
}

async function inspect() {
  const fullhd = await fetchTls('https://www.fullhdfilmizlesene.now/film/fisilti-adam-the-whisper-man/');
  console.log('Fullhd len:', fullhd.length);
  fs.writeFileSync('/tmp/fullhd.html', fullhd);
  console.log('Saved /tmp/fullhd.html');

  // Zipfilmizle fireplayer inspect
  const zipFire = await fetchTls('https://myplayersvideo.xyz/fireplayer/video/7de47452d56d59cf1b1e1542f9baeb13');
  console.log('Zip Fireplayer len:', zipFire.length);
  fs.writeFileSync('/tmp/zipfire.html', zipFire);
  console.log('Saved /tmp/zipfire.html');
}
inspect();
