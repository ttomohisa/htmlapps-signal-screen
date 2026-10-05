'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { createApp } = require('./signal-screen-harness.cjs');
const filename = path.resolve(process.argv[2] || path.join(__dirname, '..', 'src/index.template.html'));
const tests = [];
const test = (name, body) => tests.push({name, body});
const setup = (language = 'en', options = {}) => createApp(filename, {language, ...options});
const active = app => app.el('stage').classList.contains('active');
async function open(app) { app.el('showButton').focus(); app.el('showButton').click(); await app.settle(); app.frame(1); }
for (const language of ['ja', 'en']) {
  test(`${language}: short preview uses available size rather than shrinking to 34px`, () => {
    const app = setup(language); app.input(app.el('messageInput'), language === 'ja' ? 'ここです' : 'Gate A');
    assert.ok(parseFloat(app.el('previewMessage').style.fontSize) > 34);
  });
  for (const width of [547, 250]) for (const text of ['→', 'Gate A\nMeeting point', '集合場所はこちら'.repeat(6), 'W'.repeat(60), ('A\n').repeat(29)+'A']) {
    test(`${language}: measured content fits ${width}px for ${JSON.stringify(text.slice(0,12))}`, () => {
      const app = setup(language, {width, height: width === 250 ? 250 : 345}); app.input(app.el('messageInput'), text);
      const el = app.el('previewMessage'); assert.ok(el.scrollWidth <= app.el('preview').clientWidth);
      assert.ok(el.scrollHeight <= app.el('preview').clientHeight * .78 + 1, `${el.scrollHeight}px exceeds available height`);
      assert.ok(parseFloat(el.style.fontSize) >= 1);
    });
  }
  test(`${language}: repeated stage entry isolates editor and restores Show focus`, async () => {
    const app = setup(language);
    for (let i = 0; i < 3; i++) {
      await open(app); assert.equal(active(app), true);
      assert.ok(app.el('stage').contains(app.document.activeElement));
      assert.equal(app.document.querySelector('main').inert, true);
      assert.equal(app.document.querySelector('header').inert, true);
      assert.equal(app.el('stage').getAttribute('role'), 'dialog');
      assert.equal(app.el('stageCloseButton').getAttribute('aria-label'), language === 'ja' ? '閉じる' : 'Close');
      app.el('stageCloseButton').click(); await app.settle();
      assert.equal(active(app), false); assert.equal(app.document.querySelector('main').inert, false);
      assert.equal(app.document.activeElement.id, 'showButton');
    }
  });
  test(`${language}: Tab wraps stage controls and focused controls remain visible`, async () => {
    const app = setup(language); await open(app);
    app.el('stageCloseButton').focus(); app.document.dispatch('keydown', {key:'Tab', shiftKey:true});
    assert.equal(app.document.activeElement.id, 'stageWakeButton');
    app.document.dispatch('keydown', {key:'Tab'}); assert.equal(app.document.activeElement.id, 'stageCloseButton');
    app.flushTimers(); assert.equal(app.el('stageUi').classList.contains('hidden'), false);
  });
  for (const dismissal of ['escape', 'cancel', 'close', 'backdrop']) test(`${language}: flash ${dismissal} keeps display open and restores Flash focus`, async () => {
    const app = setup(language); await open(app); app.el('stageFlashButton').focus(); app.el('stageFlashButton').click();
    assert.equal(app.el('flashConfirmDialog').open, true);
    if (dismissal === 'escape') { app.document.dispatch('keydown', {key:'Escape'}); app.el('flashConfirmDialog').dispatch('cancel'); app.el('flashConfirmDialog').close(); }
    if (dismissal === 'cancel') app.el('flashCancelButton').click();
    if (dismissal === 'close') app.el('flashConfirmDialog').querySelector('[data-close-dialog]').click();
    if (dismissal === 'backdrop') app.el('flashConfirmDialog').dispatch('click', {clientX:-1,clientY:-1});
    await app.settle(); assert.equal(active(app), true); assert.equal(app.document.activeElement.id, 'stageFlashButton');
    assert.equal(app.run('pendingFlash'), null); assert.equal(app.run('state.flash'), 'steady');
    app.document.dispatch('keydown', {key:'Escape'}); await app.settle(); assert.equal(active(app), false);
    assert.equal(app.document.activeElement.id, 'showButton');
  });
  test(`${language}: reset accurately discloses QR deletion, Cancel preserves data, confirmed defaults survive reload`, () => {
    const app = setup(language); app.input(app.el('messageInput'), 'Gate A'); app.input(app.el('qrInput'), 'synthetic QR');
    app.run("state.mode='qr'; state.color='#f6cf32'; saveState()");
    app.el('resetButton').focus(); app.el('resetButton').click();
    assert.match(app.run("t('resetBody')"), /QR/);
    const cancel = app.el('resetDialog').querySelector('[data-i18n="cancel"]');
    assert.ok(cancel.getAttribute('aria-label') === null || cancel.getAttribute('aria-label') === (language === 'ja' ? 'キャンセル' : 'Cancel'));
    cancel.click(); assert.equal(app.run('state.qrText'), 'synthetic QR'); assert.equal(app.run('state.message'), 'Gate A');
    app.el('resetButton').click(); app.el('resetConfirmButton').click();
    assert.equal(app.run('state.message'), language === 'ja' ? 'ここです' : 'HERE');
    assert.equal(app.run('state.qrText'), ''); assert.equal(app.run('state.mode'), 'message');
    assert.equal(app.run('state.color'), '#101110'); assert.equal(app.run('state.flash'), 'steady');
    const reloaded = setup(language, {storage: [...app.storage]}); assert.equal(reloaded.el('messageInput').value, language === 'ja' ? 'ここです' : 'HERE'); assert.equal(reloaded.el('qrInput').value, '');
  });
  test(`${language}: language switch preserves arbitrary message and saved color`, () => {
    const app = setup(language); app.input(app.el('messageInput'), '集合 Gate A →'); app.run("setColor('#f6cf32')"); app.el('languageButton').click();
    assert.equal(app.el('messageInput').value, '集合 Gate A →'); assert.equal(app.run('state.color'), '#f6cf32');
  });
}
test('pointer entry and flash dismissal restore invokers even when clicks do not focus buttons', async () => {
  const app = setup(); app.el('messageInput').focus(); app.el('showButton').click(); await app.settle();
  app.el('stageFlashButton').click(); app.el('flashCancelButton').click();
  assert.equal(app.document.activeElement.id, 'stageFlashButton');
  app.el('stageCloseButton').click(); await app.settle(); assert.equal(app.document.activeElement.id, 'showButton');
});
test('late wake acquisition after closing is released without reviving the session', async () => {
  let resolve, released = false;
  const app = setup('en', {navigator:{wakeLock:{request:() => new Promise(done => {resolve=done;})}}});
  app.el('showButton').focus(); app.el('showButton').click(); app.el('stageCloseButton').click(); await app.settle();
  resolve({addEventListener(){}, async release(){released=true;}}); await app.settle();
  assert.equal(released, true); assert.equal(app.run('wakeLock'), null); assert.equal(active(app), false);
});
test('closing an older session cannot exit fullscreen in a reopened session', async () => {
  const app = setup(); let release;
  app.globals.navigator.wakeLock={request:async()=>({addEventListener(){},release:()=>new Promise(done=>{release=done;})})};
  let exits=0; app.document.fullscreenElement=app.document.documentElement; app.document.exitFullscreen=async()=>{exits++;};
  await open(app); app.el('stageCloseButton').click(); await open(app); release(); await app.settle();
  assert.equal(exits,0); assert.equal(active(app),true);
});
test('overlapping wake acquisitions release redundant locks and close releases the retained lock', async () => {
  const resolves=[], released=[false,false];
  const app=setup('en',{navigator:{wakeLock:{request:()=>new Promise(done=>resolves.push(done))}}});
  app.el('showButton').click(); app.el('stageWakeButton').click();
  for(let i=0;i<2;i++){resolves[i]({addEventListener(){},async release(){released[i]=true;}});await app.settle();}
  app.el('stageCloseButton').click(); await app.settle(); assert.deepEqual(released,[true,true]);
});
test('late fullscreen completion from the stage button exits after the display closes', async () => {
  const app=setup(); await open(app); let finish,exits=0;
  app.document.documentElement.requestFullscreen=()=>new Promise(done=>{finish=()=>{app.document.fullscreenElement=app.document.documentElement;done();};});
  app.document.exitFullscreen=async()=>{exits++;app.document.fullscreenElement=null;};
  app.el('stageFullscreenButton').click(); app.el('stageCloseButton').click(); await app.settle(); finish(); await app.settle();
  assert.equal(active(app),false); assert.equal(app.document.fullscreenElement,null); assert.equal(exits,1);
});
(async () => { let failed = 0; for (const {name,body} of tests) { try { await body(); console.log('ok - '+name); } catch (error) { failed++; console.error('not ok - '+name+'\n'+error.stack); } } console.log(`${tests.length-failed}/${tests.length} passed`); process.exitCode = failed ? 1 : 0; })();
