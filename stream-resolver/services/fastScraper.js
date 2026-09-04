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
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\/hls\/[^"'\s\\<>{}|^`[\]]*)/i,
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\/txt\/master\.txt[^"'\s\\<>{}|^`[\]]*)/i,
  /(https?:\/\/[^"'\s\\<>{}|^`[\]]+\/playlist\.m3u8[^"'\s\\<>{}|^`[\]]*)/i,
];

/**
 * Safely executes dynamic array-based obfuscator functions (e.g. HDFilmCehennemi, Rapidrame, Playmix, etc.)
 * Matches: var <streamVar> = <funcName>(["chunk1", "chunk2", ...]);
 */
function decodeDynamicObfuscation(html) {
  try {
    const arrayCallRegex = /(?:var|let|const)\s+([a-zA-Z0-9_$]+)\s*=\s*([a-zA-Z0-9_$]+)\s*\(\s*(\[\s*(?:["'][^"']*["']\s*,\s*)*["'][^"']*["']\s*\])\s*\)\s*;/g;
    let match;
    const scriptTags = html.match(/<script[\s\S]*?<\/script>/gi) || [];

    while ((match = arrayCallRegex.exec(html)) !== null) {
      const varName = match[1];
      const funcName = match[2];

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
            if (decoded && typeof decoded === 'string' && (decoded.startsWith('http://') || decoded.startsWith('https://'))) {
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
    const p8Match = html.match(/window\._p8\s*=\s*['"]([^'"]+)['"]/);
    if (!p8Match) return null;
    const p8 = p8Match[1];
    let e = Buffer.from(String(p8 || '').split('').reverse().join(''), 'base64').toString('latin1');
    let n = '';
    for (let t = 0; t < e.length; t++) {
      let a = 'K9L'[t % 3];
      let i = e.charCodeAt(t) - (a.charCodeAt(0) % 5 + 1);
      n += String.fromCharCode(i);
    }
    const decodedJsonStr = Buffer.from(n, 'base64').toString('utf8');
    const obj = JSON.parse(decodedJsonStr);
    const stream = obj.cm || obj.tm || (obj.sources && obj.sources[0] && obj.sources[0].file);
    if (stream && typeof stream === 'string' && stream.startsWith('http')) {
      logger.info(`[FastScraper] 🔓 RapidVid akışı başarıyla çözüldü: ${stream}`);
      return stream;
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
        if (text && text.length > 200 && !text.includes('Request failed. You will not be charged')) {
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
  
  if (streamUrl.includes('cdnimages') || streamUrl.includes('shop') || streamUrl.includes('playmix') || embedUrl.includes('hdfilmcehennemi') || targetUrl.includes('hdfilmcehennemi')) {
    referer = 'https://hdfilmcehennemi.mobi/';
  } else if (streamUrl.includes('closeload') || embedUrl.includes('closeload') || targetUrl.includes('filmmakinesi')) {
    referer = 'https://closeload.filmmakinesi.to/';
  } else if (streamUrl.includes('rapidvid') || embedUrl.includes('rapidvid') || targetUrl.includes('fullhdfilmizlesene')) {
    referer = 'https://rapidvid.net/';
  } else if (streamUrl.includes('vidmoly') || embedUrl.includes('vidmoly')) {
    referer = 'https://vidmoly.to/';
  } else if (streamUrl.includes('vidoza') || embedUrl.includes('vidoza')) {
    referer = 'https://vidoza.net/';
  } else if (streamUrl.includes('filemoon') || embedUrl.includes('filemoon')) {
    referer = 'https://filemoon.sx/';
  } else if (streamUrl.includes('dood') || embedUrl.includes('dood')) {
    referer = 'https://doodstream.com/';
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
 * @param {string} targetUrl
 * @param {{ timeout?: number }} [options]
 * @returns {Promise<{ streamUrl: string, type: string, headers: any, pageTitle: string } | null>}
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
      const { referer, origin } = determineRefererAndOrigin(decodedFromMain, '', targetUrl);
      return {
        streamUrl: decodedFromMain,
        type: 'm3u8',
        headers: {
          referer,
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          origin,
        },
        pageTitle,
      };
    }

    // 2. Direct stream pattern in main page
    for (const pattern of FAST_STREAM_PATTERNS) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const streamUrl = match[1].replace(/\\/g, '');
        const lowerStream = streamUrl.toLowerCase();
        const isSubtitle = lowerStream.endsWith('.vtt') || lowerStream.endsWith('.srt') || lowerStream.includes('/vtt/');
        if (!streamUrl.includes('google') && !streamUrl.includes('analytics') && !streamUrl.endsWith('.js') && !streamUrl.includes('playmix.uno') && !streamUrl.includes('blank.mp4') && !isSubtitle) {
          logger.info(`[FastScraper] ✅ Doğrudan akış bulundu: ${streamUrl}`);
          const { referer, origin } = determineRefererAndOrigin(streamUrl, '', targetUrl);
          return {
            streamUrl,
            type: streamUrl.endsWith('.mp4') ? 'mp4' : 'm3u8',
            headers: {
              referer,
              'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              origin,
            },
            pageTitle,
          };
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
                if (typeof u === 'string' && u.startsWith('http')) addEmbed(u);
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
          const { referer, origin } = determineRefererAndOrigin(rapidStream, embedUrl, targetUrl);
          return {
            streamUrl: rapidStream,
            type: rapidStream.endsWith('.mp4') ? 'mp4' : 'm3u8',
            headers: {
              referer,
              'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              origin,
            },
            pageTitle: pageTitle || 'Film / Dizi Akışı',
          };
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
              const { referer, origin } = determineRefererAndOrigin(foundDirectStream, embedUrl, targetUrl);
              return {
                streamUrl: foundDirectStream,
                type: foundDirectStream.endsWith('.mp4') ? 'mp4' : 'm3u8',
                headers: {
                  referer,
                  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  origin,
                },
                pageTitle: pageTitle || 'Film / Dizi Akışı',
              };
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
        const { referer, origin } = determineRefererAndOrigin(decodedStream, embedUrl, targetUrl);
        return {
          streamUrl: decodedStream,
          type: decodedStream.endsWith('.mp4') ? 'mp4' : 'm3u8',
          headers: {
            referer,
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            origin,
          },
          pageTitle: pageTitle || 'Film / Dizi Akışı',
        };
      }

      // Check unpacked JS / Packer eval
      let searchCorpus = embedHtml;
      if (embedHtml.includes('eval(function(p,a,c,k,e,') || embedHtml.includes('eval(function(')) {
        const unpacked = unpackJs(embedHtml);
        if (unpacked) {
          searchCorpus += '\n' + unpacked;
          const unpackedDecoded = decodeDynamicObfuscation(unpacked) || decodeDcFunction(unpacked);
          if (unpackedDecoded) {
            const { referer, origin } = determineRefererAndOrigin(unpackedDecoded, embedUrl, targetUrl);
            return {
              streamUrl: unpackedDecoded,
              type: 'm3u8',
              headers: {
                referer,
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                origin,
              },
              pageTitle: pageTitle || 'Film / Dizi Akışı',
            };
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
          if (!streamUrl.includes('google') && !streamUrl.includes('analytics') && !streamUrl.endsWith('.js') && !streamUrl.includes('playmix.uno') && !streamUrl.includes('blank.mp4') && !isSubtitle) {
            logger.info(`[FastScraper] ✅ Embed akışı bulundu: ${streamUrl}`);
            const { referer, origin } = determineRefererAndOrigin(streamUrl, embedUrl, targetUrl);

            return {
              streamUrl,
              type: streamUrl.endsWith('.mp4') ? 'mp4' : 'm3u8',
              headers: {
                referer,
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                origin,
              },
              pageTitle: pageTitle || 'Film / Dizi Akışı',
            };
          }
        }
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
            const { referer, origin } = determineRefererAndOrigin(streamUrl, embedUrl, targetUrl);
            return {
              streamUrl,
              type: streamUrl.endsWith('.mp4') ? 'mp4' : 'm3u8',
              headers: {
                referer,
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                origin,
              },
              pageTitle: pageTitle || 'Film / Dizi Akışı',
            };
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
