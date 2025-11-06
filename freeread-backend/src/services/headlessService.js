const puppeteer = require('puppeteer');

class HeadlessService {
  async fetchRenderedHtml(url, options = {}) {
    const launchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--window-size=1920,1080'
      ]
    };

    const navigationTimeoutMs = options.timeout || 20000;

    let browser;
    try {
      browser = await puppeteer.launch(launchOptions);
      const page = await browser.newPage();
      
      // Remove webdriver property to avoid detection
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
      });

      // Set realistic viewport
      await page.setViewport({ width: 1920, height: 1080 });
      
      await page.setUserAgent(options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      });

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: navigationTimeoutMs });

      // Check for bot protection/CAPTCHA
      let initialContent = await page.content();
      let hasBotProtection = initialContent.includes('captcha-delivery.com') || 
                             initialContent.includes('cf-browser-verification') ||
                             initialContent.includes('checking your browser') ||
                             initialContent.includes('just a moment') ||
                             initialContent.includes('DataDome CAPTCHA');

      if (hasBotProtection) {
        // Wait for bot protection to complete (DataDome can take 10-20 seconds)
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        // Check if page has changed
        try {
          await page.waitForFunction(
            () => {
              const body = document.body;
              return body && !body.innerHTML.includes('captcha-delivery.com') && body.innerHTML.length > 5000;
            },
            { timeout: 20000 }
          );
        } catch (e) {
          // Page might not change, continue anyway
        }
        
        // Try to wait for navigation
        try {
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
        } catch (e) {
          // Navigation might not happen, continue anyway
        }
        
        // Re-check content
        initialContent = await page.content();
        hasBotProtection = initialContent.includes('captcha-delivery.com') || 
                          initialContent.includes('DataDome CAPTCHA');
        
        if (hasBotProtection) {
          // Still has bot protection - try to interact with it
          try {
            // Try to find and interact with CAPTCHA iframe
            const iframe = await page.$('iframe[title*="CAPTCHA"], iframe[src*="captcha"]');
            if (iframe) {
              // Switch to iframe and try to interact
              const frame = await iframe.contentFrame();
              if (frame) {
                // Wait a bit more for CAPTCHA to load
                await new Promise(resolve => setTimeout(resolve, 5000));
              }
            }
          } catch (e) {
            // Iframe interaction failed, continue
          }
        }
      }

      // Wait for JavaScript to render
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Try to remove paywall overlays and unlock content
      try {
        await page.evaluate(() => {
          // Remove common paywall overlays
          const paywallSelectors = [
            '[class*="paywall"]',
            '[id*="paywall"]',
            '[data-module="paywall"]',
            '.paywall-overlay',
            '.subscription-wall',
            '.article-lock'
          ];
          
          paywallSelectors.forEach(selector => {
            try {
              const elements = document.querySelectorAll(selector);
              elements.forEach(el => {
                if (el) {
                  el.style.display = 'none';
                  el.remove();
                }
              });
            } catch (e) {}
          });

          // Unlock article content by removing locked classes
          const lockedElements = document.querySelectorAll('[class*="locked"], [class*="premium"], [class*="subscriber"]');
          lockedElements.forEach(el => {
            if (el) {
              el.classList.remove('locked', 'premium', 'subscriber-only');
              el.style.display = '';
            }
          });

          // Try to click "Continue reading" or similar buttons
          const continueButtons = [
            'button:contains("Continue reading")',
            'button:contains("Read more")',
            'a:contains("Continue reading")',
            '[data-testid*="continue"]',
            '[class*="continue-reading"]'
          ];
          
          continueButtons.forEach(selector => {
            try {
              const buttons = Array.from(document.querySelectorAll('button, a')).filter(el => 
                el.textContent && el.textContent.toLowerCase().includes('continue')
              );
              buttons.forEach(btn => {
                if (btn) {
                  btn.click();
                }
              });
            } catch (e) {}
          });
        });
      } catch (e) {
        // Continue even if paywall removal fails
      }

      // Wait a bit more for content to unlock
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Scroll to trigger lazy loading
      try {
        await page.evaluate(async () => {
          await new Promise((resolve) => {
            let total = 0;
            const step = () => {
              const { scrollHeight } = document.documentElement;
              window.scrollBy(0, 500);
              total += 500;
              if (total < scrollHeight * 1.5) {
                setTimeout(step, 200);
              } else {
                resolve();
              }
            };
            step();
          });
        });
      } catch (_) {}

      // Wait for article content to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try to wait for article content specifically
      try {
        await page.waitForSelector('article, [data-testid="article-body"], section[name="articleBody"], main article, .wsj-article-body, .article-body, [class*="article-body"], p', { timeout: 10000 });
      } catch (_) {}

      // Try to extract content even if paywall is present
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


