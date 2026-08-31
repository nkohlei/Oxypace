const { chromium } = require('playwright-extra');
const stealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(stealthPlugin());

async function test() {
  const browser = await chromium.launch({
    headless: true,
    proxy: { server: 'socks5://127.0.0.1:9050' },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  page.on('response', async res => {
    const u = res.url();
    if (u.includes('.m3u8') || u.includes('.mp4') || u.includes('master') || u.includes('rapidvid') || u.includes('vidmoly')) {
      console.log('INTERCEPTED RESPONSE [' + res.status() + ']:', u);
      try {
        const text = await res.text();
        if (text.includes('m3u8') || text.includes('eval') || text.includes('player') || text.includes('sources')) {
          console.log('   Body preview:', text.substring(0, 200));
        }
      } catch (e) {}
    }
  });

  console.log('1. Navigating to Fullhdfilmizlesene...');
  await page.goto('https://www.fullhdfilmizlesene.now/film/fisilti-adam-the-whisper-man/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  await page.waitForTimeout(3000);
  console.log('2. Clicking play button...');
  const playBtn = await page.$('.video-play-button, #play-video, .player-alan');
  if (playBtn) {
    await playBtn.click();
    console.log('   Clicked!');
  }

  await page.waitForTimeout(6000);

  // Check iframes after play button click
  const frames = page.frames();
  console.log('3. Frames count:', frames.length);
  for (const f of frames) {
    const fUrl = f.url();
    console.log('   Frame URL:', fUrl);
    if (fUrl.includes('rapidvid') || fUrl.includes('player') || fUrl.includes('embed')) {
      const btn = await f.$('.jw-display-icon-display, .vjs-big-play-button, button, body, video');
      if (btn) {
        console.log('   Clicking inside iframe:', fUrl);
        await btn.click().catch(() => {});
      }
    }
  }

  await page.waitForTimeout(8000);
  await browser.close();
}
test();
