'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const evidence = path.resolve('test-results/mobile-label');
async function main() {
  fs.mkdirSync(evidence, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const language of ['ja', 'en']) for (const [width, height] of [[1360,900],[320,568],[393,252]]) {
      const context = await browser.newContext({ viewport: {width,height}, locale: language, reducedMotion:'reduce' });
      const page = await context.newPage();
      const errors=[], requests=[];
      const label=`${language}-${width}x${height}`;
      page.on('pageerror', e=>errors.push(e.message));
      page.on('console', m=>{if(m.type()==='error')errors.push(m.text());});
      page.on('request', r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
      try {
        await page.goto(pathToFileURL(path.resolve(__dirname,'../dist/index.html')).href);
        await page.locator('#languageButton').waitFor();
        if(await page.locator('html').getAttribute('lang')!==language)await page.locator('#languageButton').click();
        const badge=page.locator('[data-i18n="localOnly"]');
        assert.equal(await badge.innerText(),language==='ja'?'完全ローカル処理':'Fully local processing');
        assert.ok(await badge.evaluate(el=>{const r=el.getBoundingClientRect(),p=el.parentElement.getBoundingClientRect();return r.left>=p.left&&r.right<=p.right+1&&el.scrollWidth<=el.clientWidth+1;}), label+': badge not clipped');
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+': page width');
        assert.equal(await page.locator('footer').count(),0,'No informational footer is added.');
        if(width!==393) await page.screenshot({path:path.join(evidence,label+'.png')});
        await page.locator('#helpButton').click();
        const body=page.locator('#helpDialog .dialog-body');
        await body.evaluate(el=>{el.scrollTop=el.scrollHeight;});
        assert.ok(await body.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1&&el.scrollTop+el.clientHeight>=el.scrollHeight-1;}),label+': Help end reachable');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#helpDialog').isVisible(),false);
        assert.deepEqual(errors,[],label+': runtime errors');
        assert.deepEqual(requests,[],label+': external requests');
        console.log('PASS '+label);
      } catch(error) {
        await page.screenshot({path:path.join(evidence,'failure-'+label+'.png')}).catch(()=>{});
        throw error;
      } finally {await context.close();}
    }
  } finally {await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
