'use strict';
// Release screenshots are rendered from the freshly built single HTML, never from a hosted page.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const appUrl = pathToFileURL(path.join(root, 'dist', 'index.html')).href;
const shots = [
  { file: 'screenshot.png', lang: 'ja', width: 1360, height: 900, mobile: false },
  { file: 'screenshot-en.png', lang: 'en', width: 1360, height: 900, mobile: false },
  { file: 'screenshot-mobile.png', lang: 'ja', width: 393, height: 852, mobile: true }
];

async function main() {
  const browser = await chromium.launch();
  try {
    for (const shot of shots) {
      const context = await browser.newContext({
        viewport: { width: shot.width, height: shot.height },
        deviceScaleFactor: shot.mobile ? 2 : 1,
        isMobile: shot.mobile,
        hasTouch: shot.mobile,
        locale: shot.lang,
        reducedMotion: 'reduce'
      });
      try {
        const page = await context.newPage();
        const errors = [], requests = [];
        page.on('pageerror', err => errors.push(err.message));
        page.on('request', req => {
          if (/^https?:/i.test(req.url())) requests.push(req.url());
        });
        await page.goto(appUrl);
        await page.locator('#languageButton').waitFor();
        if (await page.locator('html').getAttribute('lang') !== shot.lang) {
          await page.locator('#languageButton').click();
        }
        assert.equal(await page.locator('#versionBadge').innerText(),
          'v' + JSON.parse(fs.readFileSync(path.join(root, 'app.config.json'), 'utf8')).version);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          shot.file + ': horizontal overflow');
        await page.screenshot({
          path: path.join(root, 'assets', shot.file),
          fullPage: true,
          animations: 'disabled'
        });
        assert.deepEqual(errors, [], shot.file + ': browser exceptions');
        assert.deepEqual(requests, [], shot.file + ': external runtime requests');
        console.log('PASS release screenshot ' + shot.file);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}
main().catch(err => { console.error(err); process.exitCode = 1; });
