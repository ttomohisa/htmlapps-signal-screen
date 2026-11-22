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
        assert.equal(await badge.isVisible(), width > 760, label+': preserve existing mobile badge hiding');
        if(width > 760) assert.ok(await badge.evaluate(el=>{const r=el.getBoundingClientRect(),p=el.parentElement.getBoundingClientRect();return r.left>=p.left&&r.right<=p.right+1;}), label+': badge not clipped');
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+': page width');
        assert.equal(await page.locator('footer').count(),1,'Standard informational footer is added.');
        assert.equal(await page.locator('footer').isVisible(), width > 760, label+': footer hidden on smartphones');
        if(width > 760) assert.equal((await page.locator('footer').innerText()).replace(/\s+/g,' ').trim(),language==='ja'?'Signal Screen · MIT License · 合図の表示はブラウザー内で完結':'Signal Screen · MIT License · Signal display stays in the browser',label+': footer text');
        if(width!==393) await page.screenshot({path:path.join(evidence,label+'.png')});
        // Check real browser typography and focus/reading order in compact layouts.
        await page.locator('#messageInput').fill('ここです');
        const oneLine=await page.locator('#previewMessage').evaluate(el=>({
          whiteSpace:getComputedStyle(el).whiteSpace,
          withinWidth:el.scrollWidth<=el.clientWidth+1
        }));
        assert.equal(oneLine.whiteSpace,'nowrap',label+': short signals remain on one line');
        assert.equal(oneLine.withinWidth,true,label+': short text stays inside the preview');
        const presetFirst=await page.evaluate(()=>document.querySelector('#quickField').compareDocumentPosition(document.querySelector('#messageField'))&Node.DOCUMENT_POSITION_FOLLOWING);
        assert.ok(presetFirst,label+': presets precede freeform entry in DOM');
        if(width<=760)assert.equal(await page.locator('#mobileResetButton').isVisible(),true,label+': mobile reset is reachable');
        if(height>520){
          await page.locator('#messageInput').fill('Gate A');
          await page.locator('#saveSignalButton').click();
          assert.equal(await page.locator('.saved-item').count(),1,label+': saved signal shown');
          await page.locator('.saved-apply').click();
          assert.equal(await page.locator('#messageInput').inputValue(),'Gate A',label+': saved signal applies');
          await page.locator('.saved-remove').click();
          assert.equal(await page.locator('#removeSavedDialog').isVisible(),true,label+': removal asks for confirmation');
          await page.locator('#removeSavedDialog [data-i18n="cancel"]').click();
          assert.equal(await page.locator('.saved-item').count(),1,label+': cancel retains saved signal');
          await page.locator('#qrModeButton').click();
          await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{readText:async()=> 'https://example.test/local'}}));
          await page.locator('#pasteQrButton').click();
          assert.equal(await page.locator('#qrInput').inputValue(),'https://example.test/local',label+': QR paste uses local clipboard text');
          await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{readText:async()=>{throw Error('denied');}}}));
          await page.locator('#pasteQrButton').click();
          assert.equal(await page.locator('#qrInput').inputValue(),'https://example.test/local',label+': rejected clipboard read retains QR');
          await page.locator(width<=760?'#mobileResetButton':'#resetButton').click();
          assert.equal(await page.locator('#resetDialog').isVisible(),true,label+': reset works in both layouts');
          await page.locator('#resetConfirmButton').click();
          assert.equal(await page.locator('.saved-item').count(),0,label+': reset clears saved signals');
          assert.equal(await page.locator('#qrInput').inputValue(),'',label+': reset clears QR text');
          assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+': no horizontal overflow after interactions');
        }
        await page.locator('#helpButton').click();
        const body=page.locator('#helpDialog .dialog-body');
        await body.evaluate(el=>{el.scrollTop=el.scrollHeight;});
        const helpEnd = await page.locator('[data-i18n="helpLimits"]').evaluate(el=>{const r=el.getBoundingClientRect(),body=el.parentElement.getBoundingClientRect(),dialog=el.closest('dialog').getBoundingClientRect();return {top:r.top,bottom:r.bottom,clipTop:Math.max(0,body.top,dialog.top),clipBottom:Math.min(innerHeight,body.bottom,dialog.bottom)};});
        assert.ok(helpEnd.top>=helpEnd.clipTop-1&&helpEnd.bottom<=helpEnd.clipBottom+1,label+': final Help guidance reachable '+JSON.stringify(helpEnd));
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
