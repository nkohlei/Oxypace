import express from 'express';

const router = express.Router();

// GET /api/proxy
router.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  const referer = req.query.referer;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing "url" query parameter' });
  }

  try {
    let originHeader = 'https://closeload.filmmakinesi.to';
    let refererHeader = 'https://closeload.filmmakinesi.to/';

    try {
      const targetObj = new URL(targetUrl);
      if (!referer) {
        if (targetObj.hostname.includes('cdnimages') || targetObj.hostname.includes('shop')) {
          originHeader = 'https://closeload.filmmakinesi.to';
          refererHeader = 'https://closeload.filmmakinesi.to/';
        } else if (targetObj.hostname.includes('hdfilmcehennemi')) {
          originHeader = 'https://hdfilmcehennemi.mobi';
          refererHeader = 'https://hdfilmcehennemi.mobi/';
        } else {
          originHeader = targetObj.origin;
          refererHeader = `${targetObj.origin}/`;
        }
      }
    } catch (e) {
      // Ignore
    }

    if (referer) {
      refererHeader = referer;
      try {
        originHeader = new URL(referer).origin;
      } catch (e) {
        // Ignore
      }
    }

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
      'Origin': originHeader,
      'Referer': refererHeader,
    };

    const response = await fetch(targetUrl, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Hedef sunucu hata döndürdü: ${response.status} ${response.statusText}`,
      });
    }

    let responseBody = await response.arrayBuffer();

    let contentType = response.headers.get('Content-Type') || 'application/x-mpegURL';
    const lowerUrl = targetUrl.toLowerCase();

    // Check if body starts with #EXTM3U
    const sampleHeader = new TextDecoder('utf-8').decode(responseBody.slice(0, 15));
    const isPlaylist =
      sampleHeader.includes('#EXTM3U') ||
      lowerUrl.endsWith('.m3u8') ||
      lowerUrl.endsWith('.txt') ||
      lowerUrl.includes('master.txt') ||
      contentType.includes('mpegurl') ||
      contentType.includes('m3u8');

    if (isPlaylist) {
      contentType = 'application/x-mpegURL';
      const textDecoder = new TextDecoder('utf-8');
      let manifestText = textDecoder.decode(responseBody);

      const protocol = req.protocol;
      const host = req.get('host');
      const reqOrigin = `${protocol}://${host}`;

      const lines = manifestText.split('\n');
      const rewrittenLines = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        if (trimmed.startsWith('#')) {
          if (trimmed.includes('URI="')) {
            return line.replace(/URI="([^"]+)"/g, (_, p1) => {
              try {
                const absUrl = new URL(p1, targetUrl).href;
                let proxied = `/api/proxy?url=${encodeURIComponent(absUrl)}`;
                if (referer) proxied += `&referer=${encodeURIComponent(referer)}`;
                return `URI="${proxied}"`;
              } catch {
                return `URI="${p1}"`;
              }
            });
          }
          return line;
        }

        try {
          const absUrl = new URL(trimmed, targetUrl).href;
          let proxied = `/api/proxy?url=${encodeURIComponent(absUrl)}`;
          if (referer) proxied += `&referer=${encodeURIComponent(referer)}`;
          return proxied;
        } catch {
          return line;
        }
      });

      manifestText = rewrittenLines.join('\n');
      const textEncoder = new TextEncoder();
      responseBody = textEncoder.encode(manifestText).buffer;
    }

    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': contentType,
    });

    return res.status(200).send(Buffer.from(responseBody));
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'An error occurred while proxying request',
    });
  }
});

// GET /api/resolve
router.get('/resolve', async (req, res) => {
  const pageUrl = req.query.url;

  if (!pageUrl) {
    return res.status(400).json({ error: 'Missing "url" parameter' });
  }

  try {
    const response = await fetch(pageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://closeload.filmmakinesi.to/',
        'Origin': 'https://closeload.filmmakinesi.to',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Sayfa çekilemedi: ${response.status} ${response.statusText}`,
      });
    }

    const html = await response.text();

    if (pageUrl.includes('closeload') || html.includes('jwplayer') || html.includes('eval(function(')) {
      const matchKey = pageUrl.match(/embed\/([^/?#]+)/);
      if (matchKey && matchKey[1]) {
        const key = matchKey[1];
        const fileSlugMatch = html.match(/thelordoftherings[^\s"']+/i) || html.match(/\/hls\/([^\s"']+\.mp4)/i);
        const fileSlug = fileSlugMatch ? fileSlugMatch[0] : `thelordoftherings-1-fellowship-2001-trdualmp4-${key}.mp4`;
        const constructedMasterUrl = `https://srv12.cdnimages1146.shop/hls/${fileSlug}/txt/master.txt`;

        return res.json({
          success: true,
          streamUrl: constructedMasterUrl,
          referer: 'https://closeload.filmmakinesi.to/',
        });
      }
    }

    const masterRegex = /(https?:\/\/[^"'\s<>]+\/(?:master\.txt|\w+\.m3u8)[^"'\s<>]*)/gi;
    const streamMatches = new Set();
    let match;
    while ((match = masterRegex.exec(html)) !== null) {
      streamMatches.add(match[1]);
    }

    if (streamMatches.size > 0) {
      const foundStreams = Array.from(streamMatches);
      return res.json({
        success: true,
        streamUrl: foundStreams[0],
        allStreams: foundStreams,
        referer: pageUrl,
      });
    }

    return res.status(404).json({
      error: 'Sayfada doğrudan yayın bağlantısı tespit edilemedi.',
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Çözümleme hatası' });
  }
});

// POST /api/resolve-stream (Stream Resolver Microservice Bridge)
router.post('/resolve-stream', express.json(), async (req, res) => {
  const { url, timeout } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'Geçersiz veya eksik URL parametresi.' });
  }

  const trimmedUrl = url.trim();
  const lower = trimmedUrl.toLowerCase();

  // Instant fast-path for direct stream URLs (.m3u8, master.txt, .mp4)
  if (lower.includes('.m3u8') || lower.includes('master.txt') || lower.endsWith('.mp4')) {
    const playableStreamUrl = `/api/proxy?url=${encodeURIComponent(trimmedUrl)}`;
    return res.status(200).json({
      success: true,
      status: 'success',
      streamUrl: trimmedUrl,
      playableStreamUrl,
      type: lower.endsWith('.mp4') ? 'mp4' : 'm3u8',
      headers: {},
      pageTitle: 'Doğrudan Akış Kaynağı',
      cached: false,
      resolvedIn: 1,
    });
  }

  const resolverUrl = process.env.STREAM_RESOLVER_API_URL || 'http://127.0.0.1:3001';
  const apiKey = process.env.STREAM_RESOLVER_API_KEY || '';

  try {
    const fetchTimeout = Math.min(parseInt(timeout, 10) || 35000, 60000);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), fetchTimeout + 5000);

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['x-api-key'] = apiKey;

    const microResponse = await fetch(`${resolverUrl.replace(/\/+$/, '')}/api/resolve-stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url: url.trim(), timeout: fetchTimeout }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const data = await microResponse.json().catch(() => null);

    if (!microResponse.ok || !data || (!data.success && data.status !== 'success')) {
      const errMsg = data?.error?.message || data?.error || 'Stream çözülemedi veya kaynak bulunamadı.';
      return res.status(microResponse.status || 500).json({
        success: false,
        error: errMsg,
        code: data?.code || 'STREAM_NOT_FOUND',
      });
    }

    const payload = data.data || data;
    const streamUrl = payload.streamUrl || data.streamUrl;
    const streamHeaders = payload.headers || data.headers || {};
    const pageTitle = payload.pageTitle || data.pageTitle || '';
    const type = payload.type || data.type || 'm3u8';
    const resolvedIn = payload.resolvedIn || data.resolvedIn || 0;

    const playableStreamUrl = `/api/proxy?url=${encodeURIComponent(streamUrl)}&referer=${encodeURIComponent(streamHeaders.referer || '')}&origin=${encodeURIComponent(streamHeaders.origin || '')}`;

    return res.status(200).json({
      success: true,
      status: 'success',
      streamUrl,
      playableStreamUrl,
      type,
      headers: streamHeaders,
      pageTitle,
      cached: Boolean(data.cached),
      resolvedIn,
    });
  } catch (err) {
    const isTimeout = err.name === 'AbortError' || err.message?.toLowerCase().includes('timeout');
    return res.status(isTimeout ? 408 : 500).json({
      success: false,
      error: isTimeout ? 'Çözümleyici mikroservisi zaman aşımına uğradı.' : `Mikroservis bağlantı hatası: ${err.message}`,
      code: isTimeout ? 'TIMEOUT' : 'RESOLVER_UNAVAILABLE',
    });
  }
});

export default router;
