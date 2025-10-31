const puppeteer = require('puppeteer');

class HeadlessService {
  async fetchRenderedHtml(url, options = {}) {
    const launchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    };

    const navigationTimeoutMs = options.timeout || 20000;

    let browser;
    try {
      browser = await puppeteer.launch(launchOptions);
      const page = await browser.newPage();
      await page.setUserAgent(options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9'
      });

      await page.goto(url, { waitUntil: ['domcontentloaded', 'networkidle2'], timeout: navigationTimeoutMs });

      // Try to wait for common article containers but don't fail if absent
      try {
        await page.waitForSelector('article, [data-testid="article-body"], section[name="articleBody"], main, #site-content', { timeout: 12000 });
      } catch (_) {}

      // Gentle auto-scroll to trigger lazy-loading
      try {
        await page.evaluate(async () => {
          await new Promise((resolve) => {
            let total = 0;
            const step = () => {
              const { scrollHeight } = document.documentElement;
              window.scrollBy(0, 600);
              total += 600;
              if (total < scrollHeight * 1.2) {
                setTimeout(step, 150);
              } else {
                resolve();
              }
            };
            step();
          });
        });
      } catch (_) {}

      const html = await page.content();
      return html;
    } catch (err) {
      throw new Error(`Headless fetch failed: ${err.message}`);
    } finally {
      if (browser) {
        try { await browser.close(); } catch (_) {}
      }
    }
  }
}

module.exports = HeadlessService;


