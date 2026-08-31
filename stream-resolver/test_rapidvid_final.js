const fs = require('fs');
const html = fs.readFileSync('/tmp/rapidvid.html', 'utf8');

const p8Match = html.match(/window\._p8\s*=\s*['"]([^'"]+)['"]/);
const p8 = p8Match[1];

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

const b64Json = decryptRapidVid(p8);
const decodedJsonStr = Buffer.from(b64Json, 'base64').toString('utf8');
const obj = JSON.parse(decodedJsonStr);
console.log('✅ RAPIDVID RESOLVED:');
console.log('  Stream 1:', obj.cm);
console.log('  Stream 2:', obj.tm);
