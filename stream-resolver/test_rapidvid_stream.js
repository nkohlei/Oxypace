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
  page.on('response', res => {
    const u = res.url();
    if (u.includes('.m3u8') || u.includes('.mp4') || u.includes('master') || u.includes('hls') || u.includes('rapidvid')) {
      console.log('INTERCEPTED:', u.substring(0, 150));
    }
  });

  console.log('Visiting RapidVid embed directly...');
  await page.goto('https://rapidvid.net/vx/v1x18e7b97c', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
    headers: { 'Referer': 'https://www.fullhdfilmizlesene.now/' }
  });

  console.log('Rapidvid page title:', await page.title());
  await page.waitForTimeout(3000);

  const btn = await page.$('.jw-display-icon-display, .vjs-big-play-button, button, body');
  if (btn) {
    console.log('Clicking video inside rapidvid...');
    await btn.click().catch(() => {});
  }

  await page.waitForTimeout(6000);
  await browser.close();
}
test();
