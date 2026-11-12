/**
 * services/fastScraper.js
 *
 * Cloudflare ve ASN engellerini aşan hibrit Scraper & Stream Extractor motoru.
 * ScraperAPI (veya doğrudan HTTP) kullanarak sayfadaki gizlenmiş iframe,
 * packer/eval scriptleri, dinamik dc_ şifre çözücü VM ve doğrudan .m3u8/.mp4/master.txt akışlarını ayıklar.
 */

const vm = require('vm');
const crypto = require('crypto');
const logger = require('../utils/logger');
const browserPool = require('./browserPool');

const FAST_STREAM_PATTERNS = [
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\.m3u8[^"'\s\\<>{}|^`[\]]*)/i,
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+master\.txt[^"'\s\\<>{}|^`[\]]*)/i,
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\/hls\/[^"'\s\\<>{}|^`[\]]*\.(?:m3u8|txt|mp4)[^"'\s\\<>{}|^`[\]]*)/i,
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\/txt\/master\.txt[^"'\s\\<>{}|^`[\]]*)/i,
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\/playlist\.m3u8[^"'\s\\<>{}|^`[\]]*)/i,
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]*vixolity\.com\/vs\/[^"'\s\\<>{}|^`[\]]*)/i,
];

/**
 * Safely executes dynamic array-based obfuscator functions (e.g. HDFilmCehennemi, Rapidrame, Playmix, etc.)
 * Matches: var <streamVar> = <funcName>(["chunk1", "chunk2", ...]);
 */
function decodeDynamicObfuscation(html, targetUrl = '') {
  try {
    if (!html || typeof html !== 'string') return null;
    let scriptTags = html.match(/<script[\s\S]*?<\/script>/gi) || [];
    // Support raw unpacked JS snippets that contain no <script> wrapper tags
    if (scriptTags.length === 0 && (html.includes('function') || html.includes('sources'))) {
      scriptTags = [html];
    }
    let embedHost = 'hdfilmcehennemi.mobi';
    try {
      if (targetUrl) embedHost = new URL(targetUrl).hostname;
    } catch {}

    const buildSandbox = () => ({
      atob: (str) => Buffer.from(str, 'base64').toString('binary'),
      btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
      Math,
      String,
      Array,
      parseInt,
      parseFloat,
      encodeURIComponent,
      decodeURIComponent,
      self: { location: { protocol: 'https:', hostname: embedHost } },
      window: { location: { protocol: 'https:', hostname: embedHost } },
      document: { location: { protocol: 'https:', hostname: embedHost } },
      location: { protocol: 'https:', hostname: embedHost },
    });

    // 1. High-priority: Detect JWPlayer actual source variable e.g. sources: [{file: yi9m, type: "hls"}]
    const jwFileMatch =
      html.match(/sources\s*:\s*\[\s*\{\s*file\s*:\s*([a-zA-Z0-9_$]+)/i) ||
      html.match(/file\s*:\s*([a-zA-Z0-9_$]+)\s*,\s*type\s*:\s*["']hls["']/i);
    const preferredVarName = jwFileMatch ? jwFileMatch[1] : null;

    if (preferredVarName) {
      // First try executing all scripts together in one sandbox so inter-script dependencies work
      try {
        const combinedScript = scriptTags.map(st => st.replace(/<\/?script[^>]*>/gi, '')).join('\n;\n');
        const sandbox = buildSandbox();
        vm.createContext(sandbox);
        const execCode = `${combinedScript}\n__stream_res__ = (typeof ${preferredVarName} !== 'undefined') ? ${preferredVarName} : null;`;
        vm.runInContext(execCode, sandbox, { timeout: 2000 });
        const decoded = sandbox.__stream_res__;
        if (
          decoded &&
          typeof decoded === 'string' &&
          (decoded.startsWith('http://') || decoded.startsWith('https://')) &&
          !decoded.includes('filmakinesimp4') &&
          !decoded.includes('blank.mp4')
        ) {
          logger.info(`[FastScraper] 🎯 JWPlayer ana oynatıcı değişkeni başarıyla çözüldü (${preferredVarName}): ${decoded}`);
          return decoded;
        }
      } catch (e) {
        // Fallback to per-script execution
      }

      for (const scriptTag of scriptTags) {
        if (scriptTag.includes(preferredVarName)) {
          const cleanScript = scriptTag.replace(/<\/?script[^>]*>/gi, '');
          const sandbox = buildSandbox();
          try {
            vm.createContext(sandbox);
            const execCode = `${cleanScript}\n__stream_res__ = (typeof ${preferredVarName} !== 'undefined') ? ${preferredVarName} : null;`;
            vm.runInContext(execCode, sandbox, { timeout: 1500 });
            const decoded = sandbox.__stream_res__;
            if (
              decoded &&
              typeof decoded === 'string' &&
              (decoded.startsWith('http://') || decoded.startsWith('https://')) &&
              !decoded.includes('filmakinesimp4') &&
              !decoded.includes('blank.mp4')
            ) {
              logger.info(`[FastScraper] 🎯 JWPlayer ana oynatıcı değişkeni başarıyla çözüldü (${preferredVarName}): ${decoded}`);
              return decoded;
            }
          } catch (e) {
            // continue
          }
        }
      }
    }

    // 2. Fallback: Parse obfuscated assignment calls funcName([...]) or funcName("...".split(...))
    const arrayCallRegex = /(?:var|let|const)\s+([a-zA-Z0-9_$]+)\s*=\s*([a-zA-Z0-9_$]+)\s*\(([^;]+)\)\s*;/g;
    let match;

    while ((match = arrayCallRegex.exec(html)) !== null) {
      const varName = match[1];
      const funcName = match[2];
      const argStr = match[3];

      if (!argStr.includes('[') && !argStr.includes('split') && !argStr.includes('atob')) {
        continue;
      }

      for (const scriptTag of scriptTags) {
        if (scriptTag.includes(`function ${funcName}`) || scriptTag.includes(`${funcName}=function`) || scriptTag.includes(`${funcName} = function`)) {
          const cleanScript = scriptTag.replace(/<\/?script[^>]*>/gi, '');
          const sandbox = buildSandbox();

          try {
            vm.createContext(sandbox);
            const execCode = `${cleanScript}\n__stream_res__ = (typeof ${varName} !== 'undefined') ? ${varName} : null;`;
            vm.runInContext(execCode, sandbox, { timeout: 1500 });
            const decoded = sandbox.__stream_res__;
            if (
              decoded &&
              typeof decoded === 'string' &&
              (decoded.startsWith('http://') || decoded.startsWith('https://'))
            ) {
              if (decoded.includes('filmakinesimp4') || decoded.includes('blank.mp4')) {
                logger.warn(`[FastScraper] ⚠️ Sahte/şablon akış tespit edildi, atlanıyor: ${decoded}`);
                continue;
              }
              logger.info(`[FastScraper] 🔓 VM dinamik dizi çözücü ile akış bulundu (${funcName}): ${decoded}`);
              return decoded;
            }
          } catch (e) {
            // continue trying other script tags
          }
        }
      }
    }
  } catch (err) {
    logger.debug(`[FastScraper] VM dinamik dizi decode hatası: ${err.message}`);
  }
  return null;
}

/**
 * Safely executes the embed page's exact dc_ decoder function in an isolated Node.js VM context
 */
function decodeDcFunction(html) {
  try {
    const fnStart = html.indexOf('function dc_');
    if (fnStart === -1) return null;

    const fnEnd = html.indexOf('\n}\n', fnStart) !== -1 ? html.indexOf('\n}\n', fnStart) + 2 : html.indexOf('}', fnStart);
    if (fnEnd === -1) return null;

    const fnBody = html.substring(fnStart, fnEnd + 1);

    const varStart = html.indexOf('var s_', fnEnd);
    if (varStart === -1) return null;

    const varEnd = html.indexOf(';', varStart);
    if (varEnd === -1) return null;

    const varStatement = html.substring(varStart, varEnd + 1);
    const callExprMatch = varStatement.match(/=\s*([^;]+);/);
    if (!callExprMatch) return null;

    const sandbox = {
      atob: (str) => Buffer.from(str, 'base64').toString('binary'),
      btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
      Math,
      String,
      Array,
      parseInt,
      parseFloat,
      encodeURIComponent,
      decodeURIComponent,
    };

    vm.createContext(sandbox);
    const script = `${fnBody}\n${varStatement}\n__final_stream__ = ${callExprMatch[1]};`;
    vm.runInContext(script, sandbox, { timeout: 1000 });

    const decoded = sandbox.__final_stream__;
    if (decoded && typeof decoded === 'string' && (decoded.startsWith('http://') || decoded.startsWith('https://'))) {
      logger.info(`[FastScraper] 🔓 VM ile gizli akış linki başarıyla çözüldü: ${decoded}`);
      return decoded;
    }
  } catch (err) {
    logger.debug(`[FastScraper] VM dc_ decode hatası: ${err.message}`);
  }
  return null;
}

/**
 * Decrypts RapidVid _p8 custom encrypted payload
 */
function decodeRapidVid(html) {
  try {
    const decryptPayload = (payloadStr) => {
      if (!payloadStr) return null;
      try {
        const cleanStr = String(payloadStr).trim();
        const reversed = cleanStr.split('').reverse().join('');
        let e = atob(reversed);
        let n = '';
        for (let t = 0; t < e.length; t++) {
          const a = 'K9L'[t % 3];
          const i = e.charCodeAt(t) - ((a.charCodeAt(0) % 5) + 1);
          n += String.fromCharCode(i);
        }
        return atob(n);
      } catch (err) {
        try {
          const cleanStr = String(payloadStr).trim();
          const reversed = cleanStr.split('').reverse().join('');
          let e = Buffer.from(reversed, 'base64').toString('latin1');
          let n = '';
          for (let t = 0; t < e.length; t++) {
            const a = 'K9L'[t % 3];
            const i = e.charCodeAt(t) - ((a.charCodeAt(0) % 5) + 1);
            n += String.fromCharCode(i);
          }
          return Buffer.from(n, 'base64').toString('utf8');
        } catch {
          return null;
        }
      }
    };

    // 1. window._p8 custom encrypted payload
    const p8Match = html.match(/window\._p8\s*=\s*['"]([^'"]+)['"]/);
    if (p8Match && p8Match[1]) {
      const decodedJsonStr = decryptPayload(p8Match[1]);
      if (decodedJsonStr) {
        try {
          const obj = JSON.parse(decodedJsonStr);
          const stream = obj.cm || obj.tm || (obj.sources && obj.sources[0] && obj.sources[0].file) || obj.file;
          if (stream && typeof stream === 'string' && stream.startsWith('http')) {
            logger.info(`[FastScraper] 🔓 RapidVid _p8 akışı başarıyla çözüldü: ${stream}`);
            return stream;
          }
        } catch (parseErr) {
          if (decodedJsonStr.startsWith('http')) {
            return decodedJsonStr;
          }
        }
      }
    }

    // 2. Direct file: av('...') or _('...') function call in jwSetup.sources
    const avMatch = html.match(/["']?file["']?\s*:\s*(?:av|_)\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (avMatch && avMatch[1]) {
      const decoded = decryptPayload(avMatch[1]);
      if (decoded && typeof decoded === 'string' && decoded.startsWith('http')) {
        logger.info(`[FastScraper] 🔓 RapidVid av() akışı başarıyla çözüldü: ${decoded}`);
        return decoded;
      }
    }
  } catch (err) {
    logger.debug(`[FastScraper] RapidVid decode hatası: ${err.message}`);
  }
  return null;
}

/**
 * Unpacks P.A.C.K.E.R. obfuscated code using isolated Node.js VM context
 */
function unpackJs(packedJs) {
  let output = '';
  try {
    let cursor = 0;
    while (cursor < packedJs.length) {
      const evalIdx = packedJs.indexOf('eval(function(p,a,c,k,e', cursor);
      if (evalIdx === -1) break;

      let depth = 1;
      let i = evalIdx + 5; // right after 'eval('
      let inStr = null;
      let escaped = false;
      while (i < packedJs.length && depth > 0) {
        const ch = packedJs[i];
        if (escaped) {
          escaped = false;
          i++;
          continue;
        }
        if (inStr) {
          if (ch === '\\') escaped = true;
          else if (ch === inStr) inStr = null;
          i++;
          continue;
        }
        if (ch === "'" || ch === '"' || ch === '`') {
          inStr = ch;
        } else if (ch === '(') {
          depth++;
        } else if (ch === ')') {
          depth--;
        }
        i++;
      }

      if (depth === 0) {
        const innerCode = packedJs.substring(evalIdx + 5, i - 1);
        try {
          const unpacked = vm.runInNewContext('(' + innerCode + ')', {
            String, Array, Math, parseInt, parseFloat
          }, { timeout: 1000 });
          if (typeof unpacked === 'string' && unpacked.length > 0) {
            output += '\n' + unpacked;
          }
        } catch (e) {
          // ignore single unpack failure
        }
      }
      cursor = evalIdx + 1;
    }
  } catch (err) {
    // ignore
  }
  return output;
}

/**
 * Checks whether a URL looks like a real playable media stream (excluding decoy/ad/asset URLs)
 */
function isRealMediaStreamUrl(val) {
  if (typeof val !== 'string' || !val.startsWith('http')) return false;
  const low = val.toLowerCase();
  if (low.includes('filmakinesimp4') || low.includes('blank.mp4')) return false;
  if (/\.(?:js|css|jpg|jpeg|png|webp|gif|svg|ico|vtt|srt)(?:\?|$)/i.test(low)) return false;
  return low.includes('.m3u8') || low.includes('.mp4') || low.includes('master') || low.includes('urlset');
}

/**
 * Executes unpacked JavaScript in an isolated VM sandbox to extract stream variables
 * e.g. Rapidrame / rplayer: sources: [{file: rle}] where rle is computed by an unpacked function
 */
function extractStreamFromUnpackedJs(unpackedJs, outerHtml = '', embedUrl = '') {
  if (!unpackedJs || typeof unpackedJs !== 'string') return null;
  try {
    let parsedUrl = null;
    try {
      if (embedUrl && embedUrl.startsWith('http')) parsedUrl = new URL(embedUrl);
    } catch {}
    const locObj = {
      hostname: parsedUrl?.hostname || 'rapid.filmmakinesi.to',
      host: parsedUrl?.host || 'rapid.filmmakinesi.to',
      href: parsedUrl?.href || 'https://rapid.filmmakinesi.to/',
      origin: parsedUrl?.origin || 'https://rapid.filmmakinesi.to',
      protocol: parsedUrl?.protocol || 'https:',
    };

    const sandbox = {
      atob: (s) => Buffer.from(s, 'base64').toString('binary'),
      btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
      String,
      Math,
      Array,
      Object,
      RegExp,
      JSON,
      parseInt,
      parseFloat,
      encodeURIComponent,
      decodeURIComponent,
      location: { ...locObj },
      window: { location: { ...locObj } },
      document: { location: { ...locObj }, referrer: locObj.origin },
      navigator: { userAgent: 'Mozilla/5.0' },
    };
    sandbox.window.window = sandbox.window;
    sandbox.self = sandbox.window;

    vm.createContext(sandbox);
    vm.runInContext(unpackedJs, sandbox, { timeout: 2000 });

    // Prioritize variables referenced in sources: [{ file: VAR }] or file: VAR
    const targetVarMatches = [
      ...outerHtml.matchAll(/sources\s*:\s*\[\s*\{\s*file\s*:\s*([a-zA-Z0-9_$]+)/g),
      ...unpackedJs.matchAll(/["']?file["']?\s*:\s*([a-zA-Z0-9_$]+)/g),
    ];
    for (const m of targetVarMatches) {
      const val = sandbox[m[1]];
      if (isRealMediaStreamUrl(val)) return val;
    }

    // Otherwise scan all sandbox variables while skipping decoy URLs
    const allFound = [];
    for (const key of Object.keys(sandbox)) {
      const val = sandbox[key];
      if (isRealMediaStreamUrl(val)) {
        allFound.push(val);
      }
    }
    if (allFound.length > 0) {
      // Prefer master.m3u8 / urlset over generic master.txt decoys
      return allFound.find(u => u.includes('.m3u8')) || allFound[allFound.length - 1];
    }
  } catch (e) {
    logger.debug(`[FastScraper] extractStreamFromUnpackedJs error: ${e.message}`);
  }
  return null;
}

const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const path = require('path');

/**
 * Fetches HTML using native Python curl_cffi Chrome TLS impersonation (Bypasses Cloudflare ASN 444/403 blocks)
 */
function fetchWithTlsImpersonation(targetUrl, referer = '') {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, 'tlsFetcher.py');
    execFile('python3', [scriptPath, targetUrl, referer], { timeout: 15000, maxBuffer: 15 * 1024 * 1024 }, (err, stdout) => {
      if (err || !stdout || stdout.length === 0) {
        return resolve('');
      }
      resolve(stdout);
    });
  });
}

/**
 * Fetches HTML directly, via TLS Impersonator, or via ScraperAPI if Cloudflare blocked
 */
async function fetchHtmlWithBypass(targetUrl, referer = '', extraHeaders = {}) {
  const apiKey = process.env.SCRAPER_API_KEY || 'dd731ac1103c696ebe32ad67ba329a0e';
  const isHdf = targetUrl.includes('hdfilmcehennemi');
  const isHdfAjax = /hdfilmcehennemi\.[^/]+\/(?:search\/|video\/\d+)/i.test(targetUrl);
  const effectiveReferer = referer || (isHdf ? 'https://www.hdfilmcehennemi.nl/' : '');

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
    'Accept': isHdfAjax ? 'application/json, text/plain, */*' : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    ...extraHeaders,
  };
  if (effectiveReferer) headers['Referer'] = effectiveReferer;
  if (isHdfAjax) headers['x-requested-with'] = 'fetch';

  const parseJsonIfAny = (text) => {
    if (!text || typeof text !== 'string') return '';
    const trimmed = text.trim();
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.data?.html) return parsed.data.html;
        if (parsed.html) return parsed.html;
        if (parsed.content) return parsed.content;
      } catch {}
    }
    return text;
  };

  // 1. Doğrudan İstek Denemesi (En hızlı — ~200-500ms, sıfır ek process maliyeti)
  try {
    const res = await fetch(targetUrl, { headers, redirect: 'follow', signal: AbortSignal.timeout(7000) });
    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 80 && !text.includes('error code: 1005') && !text.includes('Attention Required! | Cloudflare') && !text.includes('Access denied') && !text.includes('403 Forbidden')) {
        return parseJsonIfAny(text);
      }
    }
  } catch (e) {
    // Fallback
  }

  // 1.5. Doğrudan Curl İsteği (Cloudflare TLS fingerprinting atlatır)
  try {
    const curlBin = process.platform === 'win32' ? 'curl.exe' : 'curl';
    const curlArgs = [
      '-s', '-L', '--max-time', '8',
      '-A', headers['User-Agent'],
      '-H', `Accept: ${headers['Accept']}`,
      '-H', `Accept-Language: ${headers['Accept-Language']}`,
    ];
    if (effectiveReferer) curlArgs.push('-H', `Referer: ${effectiveReferer}`);
    if (isHdfAjax) {
      curlArgs.push('-H', 'x-requested-with: fetch');
    }
    curlArgs.push(targetUrl);
    const { stdout } = await execFileAsync(curlBin, curlArgs);
    if (stdout && stdout.length > 80 && !stdout.includes('Attention Required! | Cloudflare') && !stdout.includes('error code: 1005') && !stdout.includes('403 Forbidden')) {
      const parsedBody = parseJsonIfAny(stdout);
      logger.info(`[FastScraper] ⚡ Curl ile sayfa başarıyla çekildi (${parsedBody.length} byte): ${targetUrl}`);
      return parsedBody;
    }
  } catch (curlErr) {
    // continue
  }

  // 2. Python TLS Chrome Impersonation (sadece local/yüklü ortamlar için fallback)
  try {
    const tlsHtml = await fetchWithTlsImpersonation(targetUrl, effectiveReferer);
    if (tlsHtml && tlsHtml.length > 80 && !tlsHtml.includes('error code: 1005') && !tlsHtml.includes('Attention Required! | Cloudflare')) {
      const parsedBody = parseJsonIfAny(tlsHtml);
      logger.info(`[FastScraper] 🛡️ TLS Impersonation ile sayfa başarıyla çekildi (${parsedBody.length} byte): ${targetUrl}`);
      return parsedBody;
    }
  } catch (e) {
    logger.debug(`[FastScraper] TLS fetcher error: ${e.message}`);
  }

  // 3. ScraperAPI Standart Bypass
  if (apiKey) {
    try {
      const proxyUrl = `http://api.scraperapi.com?api_key=${apiKey}&keep_headers=true&url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl, { headers, signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 200 && !text.includes('Request failed. You will not be charged') && !text.includes('exhausted')) {
          return parseJsonIfAny(text);
        }
      }
    } catch (err) {
      logger.warn(`[FastScraper] Standard proxy fetch failed: ${err.message}`);
    }
  }

  return '';
}

/**
 * Determines the best Referer and Origin for playback of a given stream / embed URL
 */
function determineRefererAndOrigin(streamUrl, embedUrl, targetUrl) {
  let referer = targetUrl;
  const s = streamUrl || '';
  const e = embedUrl || '';
  const t = targetUrl || '';

  if (s.includes('vixolity') || e.includes('vixolity')) {
    referer = 'https://pl.vixolity.com/';
  } else if (s.includes('playmix') || e.includes('playmix')) {
    referer = 'https://playmix.uno/';
  } else if (s.includes('closeload') || e.includes('closeload') || t.includes('filmmakinesi')) {
    referer = 'https://closeload.filmmakinesi.to/';
  } else if (s.includes('imagecdn') || s.includes('rapidvid') || e.includes('rapidvid') || t.includes('fullhdfilmizlesene')) {
    referer = 'https://rapidvid.org/';
  } else if (s.includes('cdnimages') || s.includes('shop') || e.includes('rplayer') || t.includes('hdfilmcehennemi')) {
    referer = e.includes('rplayer') ? 'https://www.hdfilmcehennemi.nl/' : 'https://hdfilmcehennemi.mobi/';
  } else if (e.includes('hdfilmcehennemi') || e.includes('rapidrame')) {
    referer = 'https://hdfilmcehennemi.mobi/';
  } else if (s.includes('vidmoly') || e.includes('vidmoly')) {
    referer = 'https://vidmoly.to/';
  } else if (s.includes('okcdn') || s.includes('mycdn.me') || s.includes('vkuser') || e.includes('ok.ru')) {
    referer = 'https://ok.ru/';
  } else if (s.includes('uptostream') || e.includes('uptostream')) {
    referer = 'https://uptostream.com/';
  } else if (s.includes('vidoza') || e.includes('vidoza')) {
    referer = 'https://vidoza.net/';
  } else if (s.includes('filemoon') || e.includes('filemoon')) {
    referer = 'https://filemoon.sx/';
  } else if (s.includes('dood') || e.includes('dood')) {
    referer = 'https://doodstream.com/';
  } else if (s.includes('bbstream') || e.includes('bbstream')) {
    referer = e || 'https://bbstream.org/';
  } else if (e && /^https?:\/\//i.test(e)) {
    referer = e;
  }

  let origin = referer;
  try {
    origin = new URL(referer).origin;
  } catch (err) {
    origin = targetUrl;
  }

  return { referer, origin };
}

/**
 * Extracts WebVTT/SRT subtitles from HTML and script contexts
 */
function extractSubtitles(html, baseUrl = '') {
  const subtitles = [];
  const seenFiles = new Set();
  if (!html || typeof html !== 'string') return subtitles;

  // 1. JWPlayer tracks array: tracks: [ { file: "...", label: "...", kind: "captions" }, ... ]
  try {
    const tracksMatch = html.match(/tracks\s*:\s*(\[[^\]]+\])/i);
    if (tracksMatch && tracksMatch[1]) {
      try {
        const parsed = JSON.parse(tracksMatch[1]);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.file && (item.file.includes('.vtt') || item.file.includes('.srt') || item.kind === 'captions' || item.kind === 'subtitles')) {
              let file = item.file.replace(/\\/g, '');
              let label = item.label || 'Altyazı';
              if (baseUrl && !file.startsWith('http')) {
                try { file = new URL(file, baseUrl).href; } catch {}
              }
              if (!seenFiles.has(file)) {
                seenFiles.add(file);
                subtitles.push({
                  file,
                  label,
                  kind: item.kind || 'subtitles',
                  default: Boolean(item.default),
                });
              }
            }
          }
        }
      } catch (jsonErr) {
        // Fallback regex if unquoted keys
        const itemRegex = /\{([^}]+)\}/g;
        let im;
        while ((im = itemRegex.exec(tracksMatch[1])) !== null) {
          const body = im[1];
          const fileM = body.match(/["']?file["']?\s*:\s*["']([^"']+)["']/i);
          const labelM = body.match(/["']?label["']?\s*:\s*["']([^"']+)["']/i);
          if (fileM && fileM[1]) {
            let file = fileM[1].replace(/\\/g, '');
            let label = labelM ? labelM[1].trim() : 'Altyazı';
            if (baseUrl && !file.startsWith('http')) {
              try { file = new URL(file, baseUrl).href; } catch {}
            }
            if (!seenFiles.has(file) && (file.includes('.vtt') || file.includes('.srt'))) {
              seenFiles.add(file);
              subtitles.push({ file, label, kind: 'subtitles' });
            }
          }
        }
      }
    }
  } catch (e) {}

  // 2. HTML5 <track> tags: <track src="..." label="..." kind="subtitles" srclang="tr">
  try {
    const trackTagRegex = /<track\b[^>]*>/gi;
    let ttm;
    while ((ttm = trackTagRegex.exec(html)) !== null) {
      const tag = ttm[0];
      const srcMatch = tag.match(/src=["']([^"']+)["']/i);
      const labelMatch = tag.match(/label=["']([^"']+)["']/i);
      const langMatch = tag.match(/srclang=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        let file = srcMatch[1].replace(/\\/g, '');
        let label = labelMatch ? labelMatch[1] : (langMatch ? langMatch[1].toUpperCase() : 'Altyazı');
        if (baseUrl && !file.startsWith('http')) {
          try { file = new URL(file, baseUrl).href; } catch {}
        }
        if (!seenFiles.has(file)) {
          seenFiles.add(file);
          subtitles.push({ file, label, kind: 'subtitles' });
        }
      }
    }
  } catch (e) {}

  // 3. Standalone .vtt or .srt URLs (cleaning escaped slashes \/ -> /)
  try {
    const cleanHtml = html.replace(/\\\//g, '/');
    const vttRegex = /(https?:\/\/[^"'\s<>]+\.(?:vtt|srt)(?:[^"'\s<>]*)?)/gi;
    let vm;
    while ((vm = vttRegex.exec(cleanHtml)) !== null) {
      const file = vm[1];
      if (!seenFiles.has(file) && !file.includes('thumbnail') && !file.includes('sprite')) {
        seenFiles.add(file);
        let label = 'Altyazı';
        const lower = file.toLowerCase();
        if (lower.includes('tur') || lower.includes('-tr-') || lower.includes('turkce')) label = 'Türkçe Altyazı';
        else if (lower.includes('eng') || lower.includes('-en-') || lower.includes('english')) label = 'İngilizce Altyazı';
        else if (lower.includes('forced')) label = 'Zorunlu Altyazı';
        else if (lower.includes('fra') || lower.includes('-fr-')) label = 'Fransızca Altyazı';
        else if (lower.includes('ger') || lower.includes('-de-')) label = 'Almanca Altyazı';
        else if (lower.includes('esp') || lower.includes('-es-')) label = 'İspanyolca Altyazı';
        subtitles.push({ file, label, kind: 'subtitles' });
      }
    }
  } catch (e) {}

  return subtitles;
}

function buildResult(streamUrl, embedUrl, targetUrl, type, pageTitle, searchCorpus = '') {
  const { referer, origin } = determineRefererAndOrigin(streamUrl, embedUrl, targetUrl);
  const subtitles = extractSubtitles(searchCorpus, embedUrl || targetUrl);
  return {
    streamUrl,
    type: type || (streamUrl.endsWith('.mp4') ? 'mp4' : 'm3u8'),
    headers: {
      referer,
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      origin,
    },
    pageTitle: pageTitle || 'Film / Dizi Akışı',
    subtitles,
  };
}

function decodeVixolityEmbed(html) {
  if (!html || typeof html !== 'string') return null;
  if (!html.includes('vixolity') && !html.includes('String.fromCharCode(parseInt(')) return null;
  try {
    const m = html.match(/\('([0-9a-fA-F]+)',\s*(\d+)\)/);
    if (!m) return null;
    const hex = m[1];
    const shift = parseInt(m[2], 10);
    let raw = '';
    for (let i = 0; i < hex.length; i += 2) {
      raw += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    const step1 = Buffer.from(raw.split('').reverse().join(''), 'base64').toString('binary');
    let shifted = '';
    for (let i = 0; i < step1.length; i++) {
      shifted += String.fromCharCode(step1.charCodeAt(i) - shift);
    }
    const decoded = decodeURIComponent(escape(Buffer.from(shifted, 'base64').toString('binary')));
    const srcMatch = decoded.match(/"kaynak"\s*:\s*"([^"]+)"/) || decoded.match(/(https?:\/\/[^"'\s]+vixolity\.com\/vs\/[^"'\s]+)/i);
    if (srcMatch && srcMatch[1]) {
      return srcMatch[1].replace(/\\\//g, '/');
    }
  } catch (e) {
    logger.debug(`[FastScraper] Vixolity decode warning: ${e.message}`);
  }
  return null;
}

function decodeOkRuEmbed(html) {
  if (!html || typeof html !== 'string' || (!html.includes('data-options') && !html.includes('ondemandHls'))) return null;
  try {
    const optsMatch = html.match(/data-options="([^"]+)"/i);
    if (optsMatch && optsMatch[1]) {
      const unescaped = optsMatch[1]
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&#039;/g, "'");
      const opts = JSON.parse(unescaped);
      const metaRaw = opts?.flashvars?.metadata;
      const meta = typeof metaRaw === 'string' ? JSON.parse(metaRaw) : metaRaw;
      if (meta) {
        if (meta.ondemandHls && meta.ondemandHls.startsWith('http')) {
          return { url: meta.ondemandHls, type: 'm3u8' };
        }
        if (meta.hlsManifestUrl && meta.hlsManifestUrl.startsWith('http')) {
          return { url: meta.hlsManifestUrl, type: 'm3u8' };
        }
        if (Array.isArray(meta.videos) && meta.videos.length > 0) {
          const priority = { full: 4, hd: 3, sd: 2, low: 1, lowest: 0, mobile: 0 };
          const sorted = [...meta.videos]
            .filter(v => v && v.url && v.url.startsWith('http'))
            .sort((a, b) => (priority[b.name] ?? 1) - (priority[a.name] ?? 1));
          if (sorted[0]) return { url: sorted[0].url, type: 'mp4' };
        }
      }
    }
  } catch (e) {
    logger.debug(`[FastScraper] OK.ru decode warning: ${e.message}`);
  }
  return null;
}

function decryptRoketDiziEnc(html) {
  if (!html || typeof html !== 'string') return '';
  try {
    const normalized = html.replace(/\\"/g, '"').replace(/\\\\\//g, '/').replace(/\\\//g, '/');
    const m = normalized.match(/"enc"\s*:\s*\{\s*"ciphertext"\s*:\s*"([^"]+)"\s*,\s*"iv"\s*:\s*"([^"]+)"\s*,\s*"salt"\s*:\s*"([^"]+)"\s*\}\s*,\s*"k"\s*:\s*"([^"]+)"/);
    if (!m) return '';
    const key = crypto.pbkdf2Sync(Buffer.from(m[4], 'utf8'), Buffer.from(m[3], 'hex'), 999, 32, 'sha512');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(m[2], 'hex'));
    let dec = decipher.update(m[1], 'base64', 'utf8');
    dec += decipher.final('utf8');
    const clean = dec.trim();
    if (clean.startsWith('//')) return 'https:' + clean;
    if (clean.startsWith('http://')) return clean.replace(/^http:\/\//i, 'https://');
    if (clean.startsWith('https://')) return clean;
  } catch (e) {
    logger.debug(`[FastScraper] RoketDizi decrypt warning: ${e.message}`);
  }
  return '';
}

function isTrailerOrAdEmbed(url, label = '') {
  const lower = (url || '').toLowerCase();
  const lbl = (label || '').toLowerCase();
  return (
    lbl.includes('fragman') ||
    lower.includes('youtube.com') ||
    lower.includes('youtu.be') ||
    lower.includes('google') ||
    lower.includes('doubleclick') ||
    lower.includes('analytics') ||
    lower.includes('recaptcha') ||
    lower.includes('facebook')
  );
}

/**
 * Extracts all candidate embed URLs + readable labels from a movie page across all 6 sites
 */
async function collectPageEmbedCandidates(targetUrl, html) {
  const candidates = [];
  const seenUrls = new Set();

  const pushCandidate = (rawUrl, label = '') => {
    if (!rawUrl || typeof rawUrl !== 'string') return;
    let clean = rawUrl.replace(/\\\//g, '/').replace(/&amp;/g, '&').trim();
    if (clean.startsWith('//')) clean = 'https:' + clean;
    if (!clean.startsWith('http')) return;
    if (/\.(jpg|jpeg|png|webp|gif|svg|ico|css|woff2?|ttf)(\?|$)/i.test(clean)) return;
    if (isTrailerOrAdEmbed(clean, label)) return;
    if (seenUrls.has(clean)) return;
    seenUrls.add(clean);
    candidates.push({ url: clean, label: (label || '').trim() });
  };

  // 1. HDFilmCehennemi: <button class="alternative-link" data-video="ID">Label</button> -> AJAX /video/ID/
  if (targetUrl.includes('hdfilmcehennemi')) {
    const altButtons = [...html.matchAll(/<button[^>]*class="[^"]*alternative-link[^"]*"[^>]*data-video=["'](\d+)["'][^>]*>([\s\S]*?)<\/button>/gi)];
    if (altButtons.length > 0) {
      const origin = (() => { try { return new URL(targetUrl).origin; } catch { return 'https://www.hdfilmcehennemi.nl'; } })();
      const fetchedAlts = await Promise.allSettled(
        altButtons.slice(0, 6).map(async ([, videoId, rawLbl]) => {
          const cleanLabel = rawLbl.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
          const ajaxHtml = await fetchHtmlWithBypass(`${origin}/video/${videoId}/`, targetUrl);
          if (!ajaxHtml) return [];
          const iframes = [...ajaxHtml.matchAll(/<iframe\b[^>]*\b(?:data-src|src)=["']([^"']+)["']/gi)].map(m => ({ url: m[1], label: cleanLabel }));
          return iframes;
        })
      );
      for (const settled of fetchedAlts) {
        if (settled.status === 'fulfilled') {
          for (const item of settled.value) {
            pushCandidate(item.url, item.label);
            // Add playmix mirror right after close if applicable
            const idM = item.url.match(/\/video\/embed\/([^/?#]+)/);
            if (item.url.includes('hdfilmcehennemi.mobi') && idM?.[1]) {
              pushCandidate(`https://playmix.uno/video/embed/${idM[1]}/`, item.label ? `${item.label} Ayna` : '');
            }
          }
        }
      }
    }
  }

  // 2. FullHDFilmİzlesene: all rapidvid links + all scx keys & arrays
  if (targetUrl.includes('fullhdfilmizlesene')) {
    for (const rMatch of html.matchAll(/https?:\/\/[^\s"'<>\\]*rapidvid[^\s"'<>\\]*/gi)) {
      pushCandidate(rMatch[0], 'RapidVid');
    }

    const scxMatch = html.match(/var\s+scx\s*=\s*({[\s\S]*?});/);
    if (scxMatch) {
      try {
        const scx = JSON.parse(scxMatch[1]);
        for (const key of Object.keys(scx)) {
          const entry = scx[key];
          const sx = entry?.sx || entry;
          if (!sx || typeof sx !== 'object') continue;
          const allUrls = [];
          for (const v of Object.values(sx)) {
            if (Array.isArray(v)) allUrls.push(...v);
            else if (typeof v === 'string' && v.length > 10 && v !== key && v !== entry?.tt) allUrls.push(v);
          }
          for (const u of allUrls) {
            if (typeof u !== 'string') continue;
            if (u.startsWith('http')) {
              pushCandidate(u, key);
            } else {
              try {
                const rot = u.replace(/[a-z]/gi, (s) =>
                  String.fromCharCode(s.charCodeAt(0) + (s.toLowerCase() < 'n' ? 13 : -13))
                );
                const dec = Buffer.from(rot, 'base64').toString('utf8');
                if (dec && dec.startsWith('http')) {
                  pushCandidate(dec, key);
                }
              } catch {}
            }
          }
        }
      } catch {}
    }
  }

  // 3. FilmMakinesi: <a data-video_url="...">Label</a>
  if (targetUrl.includes('filmmakinesi')) {
    const fmBtns = [...html.matchAll(/<a[^>]+data-video_url=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
    for (const [, vUrl, rawLbl] of fmBtns) {
      pushCandidate(vUrl, rawLbl.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
    }
  }

  // 4. FilmDozu: <button class="src-btn" onclick="loadSource('URL', this)">Label</button>
  if (targetUrl.includes('filmdozu')) {
    const fdzBtns = [...html.matchAll(/loadSource\(\s*['"]([^'"]+)['"][^)]*\)[^>]*>([\s\S]*?)<\/button>/gi)];
    for (const [, sUrl, rawLbl] of fdzBtns) {
      pushCandidate(sUrl, rawLbl.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
    }
  }

  // 5. Filmİzyon: .fz-player__part panels
  if (targetUrl.includes('filmizyon')) {
    const fizPanels = [...html.matchAll(/data-part-panel=["'](\d+)["'][\s\S]{0,600}?<iframe[^>]+(?:data-src|src)=["']([^"']+)["']/gi)];
    for (const [, pNum, pUrl] of fizPanels) {
      pushCandidate(pUrl, `Kaynak ${pNum}`);
    }
  }

  // 6. RoketDizi: decrypt enc+k on current page & follow ?player= tabs
  if (targetUrl.includes('roketdizi')) {
    const firstDec = decryptRoketDiziEnc(html);
    if (firstDec) pushCandidate(firstDec, 'Roket Player');

    const normalized = html.replace(/\\"/g, '"').replace(/\\\\\//g, '/').replace(/\\\//g, '/');
    const sourcesM = normalized.match(/"sources"\s*:\s*(\[[\s\S]*?\])/);
    if (sourcesM) {
      try {
        const srcList = JSON.parse(sourcesM[1]);
        const otherTabs = srcList.filter(s => s && s.href && !s.on).slice(0, 4);
        const tabResults = await Promise.allSettled(
          otherTabs.map(async (tab) => {
            const tabUrl = tab.href.startsWith('http') ? tab.href : new URL(tab.href, 'https://roketdizi.life').href;
            const tabHtml = await fetchHtmlWithBypass(tabUrl, targetUrl);
            const dec = decryptRoketDiziEnc(tabHtml);
            return dec ? { url: dec, label: tab.label || 'Alternatif' } : null;
          })
        );
        for (const r of tabResults) {
          if (r.status === 'fulfilled' && r.value) {
            pushCandidate(r.value.url, r.value.label);
          }
        }
      } catch {}
    }
  }

  // 7. Generic fallback extractors (standard iframes, data-src, script vars)
  for (const [, src] of html.matchAll(/<iframe\b[^>]*\bsrc=["']([^"']+)["']/gi)) {
    pushCandidate(src);
  }
  for (const [, src] of html.matchAll(/data-(?:src|url|embed)=["']([^"']+)["']/gi)) {
    pushCandidate(src);
  }
  for (const [, src] of html.matchAll(/(?:video_url|player_url|embed_url|iframe_url)\s*[:=]\s*["']([^"']+)["']/gi)) {
    pushCandidate(src);
  }

  return candidates;
}

/**
 * Resolves a single embed URL (and follows nested videoSrc if present)
 */
async function resolveSingleEmbed(initialEmbedUrl, targetUrl, pageTitle = '') {
  const queue = [initialEmbedUrl];
  const visited = new Set();

  while (queue.length > 0) {
    const embedUrl = queue.shift();
    if (!embedUrl || visited.has(embedUrl)) continue;
    visited.add(embedUrl);

    logger.info(`[FastScraper] Embed taranıyor: ${embedUrl}`);
    const embedHtml = await fetchHtmlWithBypass(embedUrl, targetUrl);
    if (!embedHtml) continue;

    // Respect anti-bot PoW gates (never compute/solve NP_GATE or captcha challenges)
    if (embedHtml.includes('window.NP_GATE') || embedHtml.includes('cf-turnstile') || embedHtml.includes('g-recaptcha')) {
      logger.info(`[FastScraper] ⏭️ Güvenlik kapısı içeren oynatıcı atlanıyor: ${embedUrl}`);
      continue;
    }

    // Filmİzyon Vixolity obfuscated embed
    const vixKaynak = decodeVixolityEmbed(embedHtml);
    if (vixKaynak) {
      return buildResult(vixKaynak, embedUrl, targetUrl, 'm3u8', pageTitle, embedHtml);
    }

    // OK.ru videoembed metadata extractor
    const okRu = decodeOkRuEmbed(embedHtml);
    if (okRu && okRu.url) {
      return buildResult(okRu.url, embedUrl, targetUrl, okRu.type, pageTitle, embedHtml);
    }

    // RapidVid custom payload
    if (embedUrl.includes('rapidvid') || embedHtml.includes('_p8')) {
      const rapidStream = decodeRapidVid(embedHtml);
      if (rapidStream) {
        return buildResult(rapidStream, embedUrl, targetUrl, rapidStream.endsWith('.mp4') ? 'mp4' : 'm3u8', pageTitle, embedHtml);
      }
    }

    // ?do=getVideo API
    if (embedUrl.includes('/video/') || embedUrl.includes('/fireplayer/') || embedUrl.includes('/player/')) {
      try {
        const getVideoUrl = embedUrl.split('?')[0] + '?do=getVideo';
        const videoDataRaw = await fetchHtmlWithBypass(getVideoUrl, embedUrl);
        if (videoDataRaw && (videoDataRaw.includes('videoSrc') || videoDataRaw.includes('videoSource') || videoDataRaw.includes('securedLink'))) {
          const videoData = JSON.parse(videoDataRaw);
          const foundDirectStream = videoData.securedLink || videoData.videoSource;
          if (foundDirectStream) {
            return buildResult(foundDirectStream, embedUrl, targetUrl, foundDirectStream.endsWith('.mp4') ? 'mp4' : 'm3u8', pageTitle, videoDataRaw);
          }
          if (videoData.videoSrc && !visited.has(videoData.videoSrc)) {
            queue.push(videoData.videoSrc);
          }
        }
      } catch {}
    }

    // Dynamic obfuscation or dc_ encoded stream
    const decodedStream = decodeDynamicObfuscation(embedHtml, embedUrl) || decodeDcFunction(embedHtml);
    if (decodedStream) {
      return buildResult(decodedStream, embedUrl, targetUrl, decodedStream.endsWith('.mp4') ? 'mp4' : 'm3u8', pageTitle, embedHtml);
    }

    // Packed JS / P.A.C.K.E.R eval
    let searchCorpus = embedHtml;
    if (embedHtml.includes('eval(function(p,a,c,k,e') || embedHtml.includes('eval(function(')) {
      const unpacked = unpackJs(embedHtml);
      if (unpacked) {
        searchCorpus += '\n' + unpacked;
        const vmStream = extractStreamFromUnpackedJs(unpacked, embedHtml, embedUrl);
        if (vmStream) {
          return buildResult(vmStream, embedUrl, targetUrl, vmStream.endsWith('.mp4') ? 'mp4' : 'm3u8', pageTitle, searchCorpus);
        }
        const unpackedDecoded = decodeDynamicObfuscation(unpacked, embedUrl) || decodeDcFunction(unpacked);
        if (unpackedDecoded) {
          return buildResult(unpackedDecoded, embedUrl, targetUrl, unpackedDecoded.endsWith('.mp4') ? 'mp4' : 'm3u8', pageTitle, searchCorpus);
        }
      }
    }

    // Direct stream regexes
    for (const pattern of FAST_STREAM_PATTERNS) {
      const match = searchCorpus.match(pattern);
      if (match && match[1]) {
        const streamUrl = match[1].replace(/\\/g, '');
        const lowerStream = streamUrl.toLowerCase();
        const isSubtitle = lowerStream.endsWith('.vtt') || lowerStream.endsWith('.srt') || lowerStream.includes('/vtt/');
        const isImage = /\.(jpg|jpeg|png|webp|gif|svg|ico)(\?|$)/i.test(lowerStream);
        if (!streamUrl.includes('google') && !streamUrl.includes('analytics') && !streamUrl.endsWith('.js') && !streamUrl.includes('playmix.uno') && !streamUrl.includes('blank.mp4') && !isSubtitle && !isImage) {
          return buildResult(streamUrl, embedUrl, targetUrl, streamUrl.endsWith('.mp4') ? 'mp4' : 'm3u8', pageTitle, searchCorpus);
        }
      }
    }

    // Variable assignments
    const varStreamMatch = searchCorpus.match(/(?:var|let|const)\s+(?:videolink|video_url|videoUrl|streamUrl|fileLink|source_url|videoSrc)\s*=\s*["'](https?:[^"']+)["']/i);
    if (varStreamMatch && varStreamMatch[1]) {
      const streamUrl = varStreamMatch[1].replace(/\\/g, '');
      const lowerStream = streamUrl.toLowerCase();
      if (!lowerStream.endsWith('.js') && !lowerStream.endsWith('.vtt')) {
        return buildResult(streamUrl, embedUrl, targetUrl, streamUrl.endsWith('.mp4') ? 'mp4' : 'm3u8', pageTitle, searchCorpus);
      }
    }

    // Dynamic nested iframe
    for (const [, src] of searchCorpus.matchAll(/iframe\.src\s*=\s*["'](https?:[^"']+)["']/gi)) {
      if (!visited.has(src)) queue.push(src);
    }

    // JSON "file": "https://..."
    for (const fMatch of searchCorpus.matchAll(/["']file["']\s*:\s*["'](https?:[^"']+)["']/gi)) {
      if (fMatch && fMatch[1]) {
        const streamUrl = fMatch[1].replace(/\\/g, '');
        const lowerStream = streamUrl.toLowerCase();
        const isSubtitle = lowerStream.endsWith('.vtt') || lowerStream.endsWith('.srt') || lowerStream.includes('/vtt/') || lowerStream.includes('/subtitles/');
        const isImage = /\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i.test(lowerStream);
        const isIgnored = lowerStream.includes('blank.mp4') || lowerStream.endsWith('.js') || isSubtitle || isImage;
        if (!isIgnored) {
          return buildResult(streamUrl, embedUrl, targetUrl, streamUrl.endsWith('.mp4') ? 'mp4' : 'm3u8', pageTitle, searchCorpus);
        }
      }
    }
  }
  return null;
}

/**
 * @param {string} targetUrl
 * @param {{ timeout?: number, collectAlternatives?: boolean }} [options]
 */
async function fastResolve(targetUrl, options = {}) {
  try {
    logger.info(`[FastScraper] 🚀 Sayfa taranıyor: ${targetUrl}`);
    let mainReferer = '';
    if (targetUrl.includes('hdfilmcehennemi.mobi')) {
      mainReferer = 'https://www.hdfilmcehennemi.nl/';
    } else if (targetUrl.includes('closeload')) {
      mainReferer = 'https://closeload.filmmakinesi.to/';
    } else if (targetUrl.includes('rapidvid')) {
      mainReferer = 'https://rapidvid.net/';
    } else if (targetUrl.includes('vixolity')) {
      mainReferer = 'https://www.filmizyon.net/';
    }

    const html = await fetchHtmlWithBypass(targetUrl, mainReferer);
    if (!html) return null;

    if (html.includes('451 - Yasal Nedenlerle') || html.includes('Yasal Nedenlerle Erisime Kapali')) {
      logger.warn(`[FastScraper] ⛔ Telif takedown: ${targetUrl}`);
      return { error: 'Bu film telif ve yasal nedenlerle kaynak site tarafından yayından kaldırılmıştır.', isTakedown: true };
    }

    // Series index auto-navigation (/dizi/)
    if (targetUrl.includes('/dizi/') && !targetUrl.includes('/bolum-')) {
      const epMatch = html.match(/href="([^"]*\/dizi\/[^"]+\/sezon-\d+\/bolum-\d+\/?)"/i) || html.match(/href="([^"]*(?:sezon-1\/bolum-1|bolum-1)[^"]*)"/i);
      if (epMatch && epMatch[1]) {
        const epUrl = epMatch[1].startsWith('http') ? epMatch[1] : new URL(epMatch[1], targetUrl).href;
        logger.info(`[FastScraper] 📺 Dizi sayfası tespit edildi, 1. bölüme yönlendiriliyor: ${epUrl}`);
        return await fastResolve(epUrl, options);
      }
    }

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';

    // Fast path if targetUrl itself IS an embed URL
    if (targetUrl.includes('vixolity.com') || targetUrl.includes('ok.ru/videoembed') || targetUrl.includes('/video/embed/') || targetUrl.includes('/rplayer/') || targetUrl.includes('vidmoly')) {
      const directEmbedRes = await resolveSingleEmbed(targetUrl, mainReferer || targetUrl, pageTitle);
      if (directEmbedRes) return directEmbedRes;
    }

    const decodedFromMain = decodeDynamicObfuscation(html, targetUrl) || decodeDcFunction(html);
    if (decodedFromMain && !options.collectAlternatives) {
      return buildResult(decodedFromMain, '', targetUrl, 'm3u8', pageTitle, html);
    }

    for (const pattern of FAST_STREAM_PATTERNS) {
      const match = html.match(pattern);
      if (match && match[1] && !options.collectAlternatives) {
        const streamUrl = match[1].replace(/\\/g, '');
        const lowerStream = streamUrl.toLowerCase();
        const isSubtitle = lowerStream.endsWith('.vtt') || lowerStream.endsWith('.srt') || lowerStream.includes('/vtt/');
        const isImage = /\.(jpg|jpeg|png|webp|gif|svg|ico)(\?|$)/i.test(lowerStream);
        if (!streamUrl.includes('google') && !streamUrl.includes('analytics') && !streamUrl.endsWith('.js') && !streamUrl.includes('playmix.uno') && !streamUrl.includes('blank.mp4') && !isSubtitle && !isImage) {
          return buildResult(streamUrl, '', targetUrl, streamUrl.endsWith('.mp4') ? 'mp4' : 'm3u8', pageTitle, html);
        }
      }
    }

    const candidates = await collectPageEmbedCandidates(targetUrl, html);
    logger.info(`[FastScraper] Bulunan embed aday sayısı: ${candidates.length} (${targetUrl})`);

    if (options.collectAlternatives) {
      // Resolve up to 6 candidates concurrently so we have both instant stream and ready alternatives
      const resolvedList = await Promise.allSettled(
        candidates.slice(0, 6).map(async (cand, idx) => {
          const r = await resolveSingleEmbed(cand.url, targetUrl, pageTitle);
          return r ? { ...r, candidateLabel: cand.label || `Alternatif ${idx + 1}`, embedUrl: cand.url } : null;
        })
      );
      const working = resolvedList
        .filter(r => r.status === 'fulfilled' && r.value && r.value.streamUrl)
        .map(r => r.value);

      if (working.length > 0) {
        return {
          ...working[0],
          alternatives: working,
          candidateEmbeds: candidates,
        };
      }
      if (candidates.length > 0) {
        return {
          streamUrl: null,
          pageTitle,
          alternatives: [],
          candidateEmbeds: candidates,
        };
      }
      return null;
    }

    // Standard mode: return first working embed
    for (const cand of candidates) {
      const resolved = await resolveSingleEmbed(cand.url, targetUrl, pageTitle);
      if (resolved) {
        resolved.candidateEmbeds = candidates;
        return resolved;
      }
    }

    return null;
  } catch (err) {
    logger.error(`[FastScraper] Hata: ${err.message}`);
    return null;
  }
}

module.exports = { fastResolve, determineRefererAndOrigin, extractSubtitles, resolveSingleEmbed, collectPageEmbedCandidates };
