const scx = {"atom":{"tt":"QXRvbQ==","sx":{"p":[],"t":["nUE0pUZ6Yl9lLKOcMUMcMP5hMKDiqatiqwS4ZGuyA2V5A2Z="]},"order":1}};

function decodeScx(scxObj) {
  for (const key in scxObj) {
    const item = scxObj[key];
    console.log('Source:', key, 'TT:', Buffer.from(item.tt, 'base64').toString());
    const t = item.sx ? item.sx.t : [];
    for (const encoded of t) {
      console.log('  Encoded string:', encoded);
      try {
        // Test base64
        const b64 = Buffer.from(encoded, 'base64').toString('utf8');
        console.log('  Base64 direct:', b64);
      } catch (e) {}
    }
  }
}
decodeScx(scx);
