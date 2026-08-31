const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('video/embed/') && !url.includes('check/performance')) {
      const html = await res.text();
      // Extract scripts
      const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
      scripts.forEach((s, idx) => {
        console.log(`=== SCRIPT ${idx+1} ===`);
        console.log(s[1].trim());
      });
    }
  });

  await page.goto('https://www.hdfilmcehennemi.nl/1-yuzuklerin-efendisi-yuzuk-kardesligi-izle-hdf-8/', { waitUntil: 'domcontentloaded' });
  const playBtn = await page.$('.player-overlay, [aria-label*="Play" i], video, .cover-play');
  if (playBtn) await playBtn.click({ force: true }).catch(() => {});

  await page.waitForTimeout(4000);
  await browser.close();
})();
