/**
 * services/fastScraper.js
 *
 * Cloudflare ve ASN engellerini aşan hibrit Scraper & Stream Extractor motoru.
 * ScraperAPI (veya doğrudan HTTP) kullanarak sayfadaki gizlenmiş iframe,
 * packer/eval scriptleri, dinamik dc_ şifre çözücü VM ve doğrudan .m3u8/.mp4/master.txt akışlarını ayıklar.
 */

const vm = require('vm');
const logger = require('../utils/logger');
const browserPool = require('./browserPool');

const FAST_STREAM_PATTERNS = [
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\.m3u8[^"'\s\\<>{}|^`[\]]*)/i,
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+master\.txt[^"'\s\\<>{}|^`[\]]*)/i,
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\/hls\/[^"'\s\\<>{}|^`[\]]*\.(?:m3u8|txt|mp4)[^"'\s\\<>{}|^`[\]]*)/i,
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\/txt\/master\.txt[^"'\s\\<>{}|^`[\]]*)/i,
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\/playlist\.m3u8[^"'\s\\<>{}|^`[\]]*)/i,
];

/**
 * Safely executes dynamic array-based obfuscator functions (e.g. HDFilmCehennemi, Rapidrame, Playmix, etc.)
 * Matches: var <streamVar> = <funcName>(["chunk1", "chunk2", ...]);
 */
function decodeDynamicObfuscation(html) {
  try {
    const scriptTags = html.match(/<script[\s\S]*?<\/script>/gi) || [];

    // 1. High-priority: Detect JWPlayer actual source variable e.g. sources: [{file: yi9m, type: "hls"}]
    const jwFileMatch =
      html.match(/sources\s*:\s*\[\s*\{\s*file\s*:\s*([a-zA-Z0-9_$]+)/i) ||
      html.match(/file\s*:\s*([a-zA-Z0-9_$]+)\s*,\s*type\s*:\s*["']hls["']/i);
    const preferredVarName = jwFileMatch ? jwFileMatch[1] : null;

    if (preferredVarName) {
      for (const scriptTag of scriptTags) {
        if (scriptTag.includes(preferredVarName)) {
          const cleanScript = scriptTag.replace(/<\/?script[^>]*>/gi, '');
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
            window: {},
            document: { location: { protocol: 'https:' } },
            location: { protocol: 'https:', hostname: '' },
          };
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
            window: {},
            document: { location: { protocol: 'https:' } },
            location: { protocol: 'https:', hostname: '' },
          };

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
      const evalIdx = packedJs.indexOf('eval(function(p,a,c,k,e,', cursor);
      if (evalIdx === -1) break;

      let depth = 1;
      let i = evalIdx + 5; // right after 'eval('
      while (i < packedJs.length && depth > 0) {
        if (packedJs[i] === '(') depth++;
        else if (packedJs[i] === ')') depth--;
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
async function fetchHtmlWithBypass(targetUrl, referer = '') {
  const apiKey = process.env.SCRAPER_API_KEY || 'dd731ac1103c696ebe32ad67ba329a0e';
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  };
  if (referer) headers['Referer'] = referer;

  // 1. Python TLS Chrome Impersonation + Residential/Tor Routing (En Yüksek Başarı Oranı)
  try {
    const tlsHtml = await fetchWithTlsImpersonation(targetUrl, referer);
    if (tlsHtml && tlsHtml.length > 0 && !tlsHtml.includes('error code: 1005') && !tlsHtml.includes('Attention Required! | Cloudflare')) {
      logger.info(`[FastScraper] 🛡️ TLS Impersonation ile sayfa başarıyla çekildi (${tlsHtml.length} byte): ${targetUrl}`);
      return tlsHtml;
    }
  } catch (e) {
    logger.debug(`[FastScraper] TLS fetcher error: ${e.message}`);
  }

  // 1.5. Doğrudan Curl İsteği (Cloudflare TLS fingerprinting atlatır)
  try {
    const curlBin = process.platform === 'win32' ? 'curl.exe' : 'curl';
    const curlArgs = [
      '-s', '-L', '--max-time', '6',
      '-A', headers['User-Agent'],
      '-H', `Accept: ${headers['Accept']}`,
      '-H', `Accept-Language: ${headers['Accept-Language']}`,
    ];
    if (referer) curlArgs.push('-H', `Referer: ${referer}`);
    curlArgs.push(targetUrl);
    const { stdout } = await execFileAsync(curlBin, curlArgs);
    if (stdout && stdout.length > 500 && !stdout.includes('Attention Required! | Cloudflare') && !stdout.includes('error code: 1005') && !stdout.includes('403 Forbidden')) {
      logger.info(`[FastScraper] ⚡ Curl ile sayfa başarıyla çekildi (${stdout.length} byte): ${targetUrl}`);
      return stdout;
    }
  } catch (curlErr) {
    // continue
  }

  // 2. Doğrudan İstek Denemesi
  try {
    const res = await fetch(targetUrl, { headers, redirect: 'follow' });
    if (res.ok) {
      const text = await res.text();
      if (!text.includes('error code: 1005') && !text.includes('Attention Required! | Cloudflare') && !text.includes('Access denied') && !text.includes('403 Forbidden')) {
        return text;
      }
    }
  } catch (e) {
    // Fallback
  }

  // 3. ScraperAPI Standart Bypass
  if (apiKey) {
    try {
      const proxyUrl = `http://api.scraperapi.com?api_key=${apiKey}&keep_headers=true&url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl, { headers });
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 200 && !text.includes('Request failed. You will not be charged') && !text.includes('exhausted')) {
          return text;
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
  
  if (streamUrl.includes('playmix') || embedUrl.includes('playmix')) {
    referer = 'https://playmix.uno/';
  } else if (streamUrl.includes('imagecdn') || streamUrl.includes('rapidvid') || embedUrl.includes('rapidvid') || targetUrl.includes('fullhdfilmizlesene')) {
    referer = 'https://rapidvid.org/';
  } else if (streamUrl.includes('cdnimages') || streamUrl.includes('shop') || embedUrl.includes('hdfilmcehennemi') || targetUrl.includes('hdfilmcehennemi')) {
    referer = 'https://hdfilmcehennemi.mobi/';
  } else if (streamUrl.includes('closeload') || embedUrl.includes('closeload') || targetUrl.includes('filmmakinesi')) {
    referer = 'https://closeload.filmmakinesi.to/';
  } else if (streamUrl.includes('vidmoly') || embedUrl.includes('vidmoly')) {
    referer = 'https://vidmoly.to/';
  } else if (streamUrl.includes('vidoza') || embedUrl.includes('vidoza')) {
    referer = 'https://vidoza.net/';
  } else if (streamUrl.includes('filemoon') || embedUrl.includes('filemoon')) {
    referer = 'https://filemoon.sx/';
  } else if (streamUrl.includes('dood') || embedUrl.includes('dood')) {
    referer = 'https://doodstream.com/';
  } else if (streamUrl.includes('bbstream') || embedUrl.includes('bbstream')) {
    referer = embedUrl || 'https://bbstream.org/';
  } else if (embedUrl && /^https?:\/\//i.test(embedUrl)) {
    referer = embedUrl;
  }

  let origin = referer;
  try {
    origin = new URL(referer).origin;
  } catch (e) {
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

/**
 * @param {string} targetUrl
 * @param {{ timeout?: number }} [options]
 * @returns {Promise<{ streamUrl: string, type: string, headers: any, pageTitle: string, subtitles: any[] } | null>}
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
    }

    const html = await fetchHtmlWithBypass(targetUrl, mainReferer);
    if (!html) return null;

    // Extract Title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';

    // 1. Check dynamic obfuscated or dc_ decoded stream in main page
    const decodedFromMain = decodeDynamicObfuscation(html) || decodeDcFunction(html);
    if (decodedFromMain) {
      return buildResult(decodedFromMain, '', targetUrl, 'm3u8', pageTitle, html);
    }

    // 2. Direct stream pattern in main page
    for (const pattern of FAST_STREAM_PATTERNS) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const streamUrl = match[1].replace(/\\/g, '');
        const lowerStream = streamUrl.toLowerCase();
        const isSubtitle = lowerStream.endsWith('.vtt') || lowerStream.endsWith('.srt') || lowerStream.includes('/vtt/');
        const isImage = /\.(jpg|jpeg|png|webp|gif|svg|ico)(\?|$)/i.test(lowerStream);
        if (!streamUrl.includes('google') && !streamUrl.includes('analytics') && !streamUrl.endsWith('.js') && !streamUrl.includes('playmix.uno') && !streamUrl.includes('blank.mp4') && !isSubtitle && !isImage) {
          logger.info(`[FastScraper] ✅ Doğrudan akış bulundu: ${streamUrl}`);
          return buildResult(streamUrl, '', targetUrl, streamUrl.endsWith('.mp4') ? 'mp4' : 'm3u8', pageTitle, html);
        }
      }
    }

    // 3. Extract Embed iFrames and Players
    const embedQueue = [];
    const visitedEmbeds = new Set();

    function addEmbed(u) {
      if (!u || typeof u !== 'string') return;
      let clean = u.replace(/\\\//g, '/').trim();
      if (clean.startsWith('//')) clean = 'https:' + clean;
      if (!clean.startsWith('http')) return;
      if (/\.(jpg|jpeg|png|webp|gif|svg|ico|css|woff2?|ttf)(\?|$)/i.test(clean)) return;
      if (clean.includes('google') || clean.includes('doubleclick') || clean.includes('analytics') || clean.includes('facebook')) return;
      if (!visitedEmbeds.has(clean)) {
        visitedEmbeds.add(clean);
        embedQueue.push(clean);
      }
    }

    // 2.5 Extract Fullhdfilmizlesene specific player sources (scx / atom / rapidvid)
    if (targetUrl.includes('fullhdfilmizlesene')) {
      const rapidMatch = html.match(/https?:\/\/[^\s"'<>\\]*rapidvid[^\s"'<>\\]*/i);
      if (rapidMatch) addEmbed(rapidMatch[0]);

      const scxMatch = html.match(/var\s+scx\s*=\s*({[\s\S]*?});/);
      if (scxMatch) {
        try {
          const scx = JSON.parse(scxMatch[1]);
          for (const key of Object.keys(scx)) {
            const sx = scx[key]?.sx;
            if (sx) {
              const allUrls = [...(sx.p || []), ...(sx.t || [])];
              for (const u of allUrls) {
                if (typeof u === 'string') {
                  if (u.startsWith('http')) {
                    addEmbed(u);
                  } else {
                    // Try ROT13 + Base64 decode (Fullhdfilmizlesene Atom Player standard)
                    try {
                      const rot = u.replace(/[a-z]/gi, (s) =>
                        String.fromCharCode(s.charCodeAt(0) + (s.toLowerCase() < 'n' ? 13 : -13))
                      );
                      const dec = Buffer.from(rot, 'base64').toString('utf8');
                      if (dec && dec.startsWith('http')) {
                        logger.info(`[FastScraper] 🔓 Fullhdfilmizlesene ROT13 linki çözüldü: ${dec}`);
                        addEmbed(dec);
                      }
                    } catch (decErr) {}
                  }
                }
              }
            }
          }
        } catch (e) {
          // ignore
        }
      }
    }

    // Standard iframe src extraction
    const iframeMatches = [...html.matchAll(/<iframe\b[^>]*\bsrc=["']([^"']+)["']/gi)];
    for (const [, src] of iframeMatches) {
      if (src && !src.includes('google') && !src.includes('ads') && !src.includes('recaptcha') && !src.includes('facebook')) {
        addEmbed(src);
      }
    }

    // Additional data-src / data-url / embedUrl attribute extraction
    const dataSrcMatches = [...html.matchAll(/data-(?:src|url|embed)=["']([^"']+)["']/gi)];
    for (const [, src] of dataSrcMatches) {
      addEmbed(src);
    }

    // Specific player script embed extraction (e.g. video_url = "...")
    const scriptEmbedMatches = [...html.matchAll(/(?:video_url|player_url|embed_url|iframe_url)\s*[:=]\s*["']([^"']+)["']/gi)];
    for (const [, src] of scriptEmbedMatches) {
      addEmbed(src);
    }

    logger.info(`[FastScraper] Bulunan embed URL sayısı: ${embedQueue.length}`);

    // 4. Scan each embed URL
    for (const embedUrl of embedQueue) {
      logger.info(`[FastScraper] Embed taranıyor: ${embedUrl}`);
      const embedHtml = await fetchHtmlWithBypass(embedUrl, targetUrl);
      if (!embedHtml) continue;

      // Check RapidVid custom payload
      if (embedUrl.includes('rapidvid') || embedHtml.includes('_p8')) {
        const rapidStream = decodeRapidVid(embedHtml);
        if (rapidStream) {
          return buildResult(rapidStream, embedUrl, targetUrl, rapidStream.endsWith('.mp4') ? 'mp4' : 'm3u8', pageTitle, embedHtml);
        }
      }

      // Check ?do=getVideo API for players that support it
      if (embedUrl.includes('/video/') || embedUrl.includes('/fireplayer/') || embedUrl.includes('/player/')) {
        try {
          const getVideoUrl = embedUrl.split('?')[0] + '?do=getVideo';
          const videoDataRaw = await fetchHtmlWithBypass(getVideoUrl, embedUrl);
          if (videoDataRaw && (videoDataRaw.includes('videoSrc') || videoDataRaw.includes('videoSource') || videoDataRaw.includes('securedLink'))) {
            const videoData = JSON.parse(videoDataRaw);
            const foundDirectStream = videoData.securedLink || videoData.videoSource;
            if (foundDirectStream) {
              logger.info(`[FastScraper] 🎯 API üzerinden doğrudan stream bulundu: ${foundDirectStream}`);
              return buildResult(foundDirectStream, embedUrl, targetUrl, foundDirectStream.endsWith('.mp4') ? 'mp4' : 'm3u8', pageTitle, videoDataRaw);
            }
            if (videoData.videoSrc) {
              logger.info(`[FastScraper] 🎯 Nested videoSrc bulundu: ${videoData.videoSrc}`);
              addEmbed(videoData.videoSrc);
            }
          }
        } catch (e) {
          // ignore
        }
      }

      // Check dynamic obfuscation or dc_ encoded stream inside embed (Closeload, Rapidrame, Playmix, HDFilmCehennemi)
      const decodedStream = decodeDynamicObfuscation(embedHtml) || decodeDcFunction(embedHtml);
      if (decodedStream) {
        return buildResult(decodedStream, embedUrl, targetUrl, decodedStream.endsWith('.mp4') ? 'mp4' : 'm3u8', pageTitle, embedHtml);
      }

      // Check unpacked JS / Packer eval
      let searchCorpus = embedHtml;
      if (embedHtml.includes('eval(function(p,a,c,k,e,') || embedHtml.includes('eval(function(')) {
        const unpacked = unpackJs(embedHtml);
        if (unpacked) {
          searchCorpus += '\n' + unpacked;
          const unpackedDecoded = decodeDynamicObfuscation(unpacked) || decodeDcFunction(unpacked);
          if (unpackedDecoded) {
            return buildResult(unpackedDecoded, embedUrl, targetUrl, 'm3u8', pageTitle, searchCorpus);
          }
        }
      }

      // Check direct stream patterns in embed (excluding bogus schema meta tags and blank placeholders)
      for (const pattern of FAST_STREAM_PATTERNS) {
        const match = searchCorpus.match(pattern);
        if (match && match[1]) {
          const streamUrl = match[1].replace(/\\/g, '');
          const lowerStream = streamUrl.toLowerCase();
          const isSubtitle = lowerStream.endsWith('.vtt') || lowerStream.endsWith('.srt') || lowerStream.includes('/vtt/');
          const isImage = /\.(jpg|jpeg|png|webp|gif|svg|ico)(\?|$)/i.test(lowerStream);
          if (!streamUrl.includes('google') && !streamUrl.includes('analytics') && !streamUrl.endsWith('.js') && !streamUrl.includes('playmix.uno') && !streamUrl.includes('blank.mp4') && !isSubtitle && !isImage) {
            logger.info(`[FastScraper] ✅ Embed akışı bulundu: ${streamUrl}`);
            return buildResult(streamUrl, embedUrl, targetUrl, streamUrl.endsWith('.mp4') ? 'mp4' : 'm3u8', pageTitle, searchCorpus);
          }
        }
      }

      // Check variable stream assignments e.g. var videolink = "https://..."
      const varStreamMatch = searchCorpus.match(/(?:var|let|const)\s+(?:videolink|video_url|videoUrl|streamUrl|fileLink|source_url|videoSrc)\s*=\s*["'](https?:[^"']+)["']/i);
      if (varStreamMatch && varStreamMatch[1]) {
        const streamUrl = varStreamMatch[1].replace(/\\/g, '');
        const lowerStream = streamUrl.toLowerCase();
        if (!lowerStream.endsWith('.js') && !lowerStream.endsWith('.vtt')) {
          logger.info(`[FastScraper] ✅ Değişken atamasından akış bulundu: ${streamUrl}`);
          return buildResult(streamUrl, embedUrl, targetUrl, streamUrl.endsWith('.mp4') ? 'mp4' : 'm3u8', pageTitle, searchCorpus);
        }
      }

      // Check dynamic iframe.src inside embed scripts (e.g. zipfilmizle / HivePlayer -> fireplayer)
      const jsIfrMatches = [...searchCorpus.matchAll(/iframe\.src\s*=\s*["'](https?:[^"']+)["']/gi)];
      for (const [, src] of jsIfrMatches) {
        addEmbed(src);
      }

      // Check JSON sources config e.g. "file": "https://..." (strictly ignoring .vtt, .srt, image subtitles)
      const fileMatches = [...searchCorpus.matchAll(/["']file["']\s*:\s*["'](https?:[^"']+)["']/gi)];
      for (const fMatch of fileMatches) {
        if (fMatch && fMatch[1]) {
          const streamUrl = fMatch[1].replace(/\\/g, '');
          const lowerStream = streamUrl.toLowerCase();
          const isSubtitle = lowerStream.endsWith('.vtt') || lowerStream.endsWith('.srt') || lowerStream.includes('/vtt/') || lowerStream.includes('/subtitles/');
          const isImage = /\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i.test(lowerStream);
          const isIgnored = lowerStream.includes('blank.mp4') || lowerStream.endsWith('.js') || isSubtitle || isImage;

          if (!isIgnored) {
            logger.info(`[FastScraper] ✅ JSON config içinden akış bulundu: ${streamUrl}`);
            return buildResult(streamUrl, embedUrl, targetUrl, streamUrl.endsWith('.mp4') ? 'mp4' : 'm3u8', pageTitle, searchCorpus);
          }
        }
      }
    }

    return null;
  } catch (err) {
    logger.error(`[FastScraper] Hata: ${err.message}`);
    return null;
  }
}

module.exports = { fastResolve, determineRefererAndOrigin };
