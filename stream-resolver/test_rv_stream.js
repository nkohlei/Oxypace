function _(e){let t=Buffer.from(e.split("").reverse().join(""), "base64").toString("latin1"),o="";for(let e=0;e<t.length;e++){let r="K9L"[e%3],n=t.charCodeAt(e)-(r.charCodeAt(0)%5+1);o+=String.fromCharCode(n)}return Buffer.from(o, "base64").toString("utf8")};

const enc = '/AkUPx3WKJletpkZ5BVWjFVc1U2aYd0Y3tGWnhlOZxVex52Y2MXSP5mNyUWcm9GV41FWnlzVHRmcqh0UMllRn11QGdFNyl0TzwFblRTZYZVecVzV28WbXRTaaVFc3MzUjNnbYZTbIRmNx52Y5tTMVFVZaFFTcNTTsRzMOl3WvVWc3wnY39GSkFnMZRmdp1mT8xjeOljTKZWMUtkY';
const decoded = _(enc);
console.log("DECODED STREAM URL:", decoded);
