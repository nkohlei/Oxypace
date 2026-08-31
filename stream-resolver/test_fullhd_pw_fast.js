const { chromium } = require('playwright-extra');
const stealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(stealthPlugin());

async function getIframeUrl(targetUrl) {
  const browser = await chromium.launch({
    headless: true,
    proxy: { server: 'socks5://127.0.0.1:9050' },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();
    let rapidVidUrl = null;

    page.on('response', res => {
      const u = res.url();
      if (u.includes('rapidvid.net/vx/')) {
        rapidVidUrl = u;
      }
    });

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);

    const playBtn = await page.$('.video-play-button, #play-video, .player-alan');
    if (playBtn) await playBtn.click().catch(() => {});

    // Wait until rapidvid iframe response is seen
    for (let i = 0; i < 20; i++) {
      if (rapidVidUrl) break;
      await page.waitForTimeout(250);
    }

    return rapidVidUrl;
  } finally {
    await browser.close();
  }
}

async function run() {
  const start = Date.now();
  const ifr = await getIframeUrl('https://www.fullhdfilmizlesene.now/film/fisilti-adam-the-whisper-man/');
  console.log('Found Iframe (' + (Date.now() - start) + 'ms):', ifr);
}
run();
