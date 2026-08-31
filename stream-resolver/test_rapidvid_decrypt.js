const fs = require('fs');
const html = fs.readFileSync('/tmp/rapidvid.html', 'utf8');

const p8Match = html.match(/window\._p8\s*=\s*['"]([^'"]+)['"]/);
if (!p8Match) {
  console.log('No _p8 found');
  process.exit(0);
}

const p8 = p8Match[1];
console.log('Found _p8 length:', p8.length);

function decryptRapidVid(t) {
  let e = Buffer.from(String(t || "").split("").reverse().join(""), 'base64').toString('latin1');
  let n = "";
  for (let t = 0; t < e.length; t++) {
    let a = "K9L"[t % 3];
    let i = e.charCodeAt(t) - (a.charCodeAt(0) % 5 + 1);
    n += String.fromCharCode(i);
  }
  return n;
}

try {
  const decrypted = decryptRapidVid(p8);
  console.log('DECRYPTED RESULT:');
  console.log(decrypted);
  const json = JSON.parse(decrypted);
  console.log('PARSED JSON:', json);
} catch (err) {
  console.log('Error:', err.message);
}
