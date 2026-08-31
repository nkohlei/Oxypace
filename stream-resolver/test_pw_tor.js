const { chromium } = require('playwright-extra');
const stealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(stealthPlugin());

async function test() {
  const browser = await chromium.launch({
    headless: true,
    proxy: {
      server: 'socks5://127.0.0.1:9050'
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul'
  });

  const page = await context.newPage();

  page.on('response', res => {
    const u = res.url();
    if (u.includes('.m3u8') || u.includes('.mp4') || u.includes('master.txt') || u.includes('embed') || u.includes('player')) {
      console.log('INTERCEPTED:', u.substring(0, 120));
    }
  });

  console.log('Navigating to fullhdfilmizlesene via Playwright + Tor...');
  await page.goto('https://www.fullhdfilmizlesene.now/film/fisilti-adam-the-whisper-man/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('PAGE TITLE:', await page.title());

  await page.waitForTimeout(4000);

  // Click play button if exists
  const playBtn = await page.$('.video-play-button, #play-video, .player-alan, body');
  if (playBtn) {
    console.log('Clicking play button...');
    await playBtn.click().catch(() => {});
  }

  await page.waitForTimeout(6000);

  const ifrs = await page.evaluate(() => Array.from(document.querySelectorAll('iframe')).map(i => i.src || i.dataset.src));
  console.log('PAGE IFRAMES:', ifrs);

  await browser.close();
}
test();
