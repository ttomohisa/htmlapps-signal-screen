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
test('late fullscreen completion from the stage button exits after the display closes', async () => {
  const app=setup(); await open(app); let finish,exits=0;
  app.document.documentElement.requestFullscreen=()=>new Promise(done=>{finish=()=>{app.document.fullscreenElement=app.document.documentElement;done();};});
  app.document.exitFullscreen=async()=>{exits++;app.document.fullscreenElement=null;};
  app.el('stageFullscreenButton').click(); app.el('stageCloseButton').click(); await app.settle(); finish(); await app.settle();
  assert.equal(active(app),false); assert.equal(app.document.fullscreenElement,null); assert.equal(exits,1);
});

// These assertions execute the shipped script with deterministic Wake Lock sentinels.
// A missing pin guard or intent/generation check must make the corresponding test fail.
function wakeFixture(language = 'en') {
  const requests = [];
  const app = setup(language, {navigator: {wakeLock: {request(type) {
    assert.equal(type, 'screen');
    return new Promise((resolve, reject) => requests.push({resolve, reject}));
  }}}});
  function lock() {
    const listeners = [];
    return {released:false, releases:0, addEventListener(type, fn) {if (type === 'release') listeners.push(fn);},
      async release() {this.released=true;this.releases++;listeners.forEach(fn=>fn());}};
  }
  async function resolve(index) {const sentinel=lock();requests[index].resolve(sentinel);await app.settle();return sentinel;}
  async function visible() {app.document.visibilityState='hidden';app.document.dispatch('visibilitychange');app.document.visibilityState='visible';app.document.dispatch('visibilitychange');await app.settle();}
  return {app, requests, resolve, visible};
}
test('keep-awake does not claim an acquired state when the API is unavailable', async () => {
  const app=setup();await open(app);
  assert.equal(active(app),true);assert.equal(app.run('wakeLock'),null);
  assert.equal(app.el('stageWakeButton').getAttribute('aria-pressed'),null);
});
for (const language of ['ja', 'en']) {
  test(`${language}: pin controls is localized, off by default, and cancels auto-hide and background hiding`, async () => {
    const app=setup(language);await open(app);
    const pin=app.el('stagePinButton');assert.ok(pin, 'Pin controls button exists');
    assert.equal(pin.getAttribute('aria-pressed'),'false');
    assert.equal(pin.textContent, language==='ja'?'操作を固定':'Pin controls');
    app.flushTimers();assert.equal(app.el('stageUi').classList.contains('hidden'),true);
    app.el('stageSurface').click();assert.equal(app.el('stageUi').classList.contains('hidden'),false);
    pin.click();assert.equal(pin.getAttribute('aria-pressed'),'true');
    app.flushTimers();assert.equal(app.el('stageUi').classList.contains('hidden'),false);
    app.el('stageSurface').click();app.flushTimers();assert.equal(app.el('stageUi').classList.contains('hidden'),false);
    pin.click();assert.equal(pin.getAttribute('aria-pressed'),'false');
    app.flushTimers();assert.equal(app.el('stageUi').classList.contains('hidden'),true);
  });
  test(`${language}: unpin preserves focused controls and open-dialog protections`, async () => {
    const app=setup(language);await open(app);const pin=app.el('stagePinButton');assert.ok(pin);
    pin.focus();pin.click();pin.click();app.flushTimers();assert.equal(app.el('stageUi').classList.contains('hidden'),false);
    pin.click();app.el('stageFlashButton').click();pin.click();app.flushTimers();
    assert.equal(app.el('flashConfirmDialog').open,true);assert.equal(app.el('stageUi').classList.contains('hidden'),false);
    app.el('flashCancelButton').click();assert.equal(app.run('state.flash'),'steady');
    app.el('stageSurface').click();assert.equal(app.el('stageUi').classList.contains('hidden'),true);
  });
  test(`${language}: pin resets on close and reopen without changing stored content`, async () => {
    const app=setup(language);app.input(app.el('messageInput'),'Gate A');app.input(app.el('qrInput'),'synthetic QR');
    const saved=[...app.storage];await open(app);assert.ok(app.el('stagePinButton'));app.el('stagePinButton').click();
    app.document.dispatch('keydown',{key:'Escape'});await app.settle();assert.equal(active(app),false);
    assert.deepEqual([...app.storage],saved);await open(app);assert.equal(app.el('stagePinButton').getAttribute('aria-pressed'),'false');
    app.flushTimers();assert.equal(app.el('stageUi').classList.contains('hidden'),true);
    assert.equal(app.run('state.message'),'Gate A');assert.equal(app.run('state.qrText'),'synthetic QR');
  });
  test(`${language}: pin works in steady QR mode with the flash control hidden`, async () => {
    const app=setup(language);app.input(app.el('qrInput'),'https://example.test/synthetic');app.el('qrModeButton').click();await open(app);assert.equal(active(app),true);
    assert.ok(app.el('stagePinButton'));app.el('stagePinButton').click();app.el('stageSurface').click();app.flushTimers();
    assert.equal(app.el('stageUi').classList.contains('hidden'),false);assert.equal(app.el('stageFlashButton').hidden,true);
    assert.equal(app.run('state.flash'),'steady');assert.ok(app.el('stageQr').innerHTML.includes('<svg'));
  });
  test(`${language}: manually disabled keep-awake stays off across visibility until explicitly enabled`, async () => {
    const f=wakeFixture(language);await open(f.app);const lock=await f.resolve(0);
    f.app.el('stageWakeButton').click();await f.app.settle();assert.equal(lock.released,true);
    await f.visible();assert.equal(f.requests.length,1,'Manual off must not reacquire on visibility');
    assert.equal(f.app.run('wakeLock'),null);
    f.app.el('stageWakeButton').click();await f.app.settle();assert.equal(f.requests.length,2);
    const enabled=await f.resolve(1);assert.equal(f.app.run('wakeLock'),enabled);
    assert.equal(enabled.released,false);
  });
  test(`${language}: Off while acquisition is pending releases the late sentinel`, async () => {
    const f=wakeFixture(language);await open(f.app);f.app.el('stageWakeButton').click();await f.app.settle();
    assert.equal(f.requests.length,1,'Off must cancel intent instead of issuing another request');
    const late=await f.resolve(0);assert.equal(late.released,true);assert.equal(f.app.run('wakeLock'),null);
    await f.visible();assert.equal(f.requests.length,1);
  });
  test(`${language}: off-on races release obsolete acquisition and retain only the latest lock`, async () => {
    const f=wakeFixture(language);await open(f.app);f.app.el('stageWakeButton').click();f.app.el('stageWakeButton').click();await f.app.settle();
    assert.equal(f.requests.length,2);const current=await f.resolve(1);const obsolete=await f.resolve(0);
    assert.equal(obsolete.released,true);assert.equal(current.released,false);assert.equal(f.app.run('wakeLock'),current);
    f.app.el('stageCloseButton').click();await f.app.settle();assert.equal(current.released,true);
  });
  test(`${language}: OS release reacquires on visibility only while requested and retained locks never duplicate`, async () => {
    const f=wakeFixture(language);await open(f.app);await f.visible();await f.visible();assert.equal(f.requests.length,1,'Do not duplicate pending requests');
    const first=await f.resolve(0);await f.visible();assert.equal(f.requests.length,1);
    await first.release();await f.visible();assert.equal(f.requests.length,2);await f.resolve(1);
    f.app.el('stageCloseButton').click();await f.app.settle();await f.visible();assert.equal(f.requests.length,2);
  });
  test(`${language}: closing and reopening ignores older locks and failures`, async () => {
    const f=wakeFixture(language);await open(f.app);f.app.el('stageCloseButton').click();await f.app.settle();await open(f.app);
    const current=await f.resolve(1);const old=await f.resolve(0);assert.equal(old.released,true);assert.equal(f.app.run('wakeLock'),current);
    f.app.el('stageWakeButton').click();f.app.el('stageWakeButton').click();await f.app.settle();
    f.app.el('stageWakeButton').click();f.app.el('stageWakeButton').click();await f.app.settle();
    const latest=await f.resolve(3);const status=f.app.el('statusLine').textContent;f.requests[2].reject(new Error('Obsolete request'));await f.app.settle();
    assert.equal(f.app.el('statusLine').textContent,status);assert.equal(f.app.run('wakeLock'),latest);
  });
}

// Changing a target label, translated Help title or privacy text breaks this UI contract.
for (const initial of ['en', 'ja']) test(`${initial}: header remains localized through repeated language changes and reload`, () => {
  const app = setup(initial); app.input(app.el('messageInput'), '集合 Gate A →');
  for (let i = 0; i < 4; i++) {
    const ja = app.document.documentElement.lang === 'ja';
    const target = ja ? '英語に切り替え' : 'Switch to Japanese';
    const help = ja ? '使い方と注意事項' : 'How to use & notes';
    assert.equal(app.el('languageButton').textContent, ja ? 'EN' : 'JA');
    assert.equal(app.el('languageButton').getAttribute('aria-label'), target);
    assert.equal(app.el('languageButton').getAttribute('title'), target);
    assert.equal(app.el('helpButton').getAttribute('aria-label'), help);
    assert.equal(app.el('helpButton').getAttribute('title'), help);
    assert.equal(app.document.querySelector('[data-i18n="localOnly"]').textContent, ja ? '完全ローカル処理' : 'Processed on device');
    assert.equal(app.el('versionBadge').textContent, 'v' + require('../app.config.json').version);
    app.el('helpButton').click(); assert.equal(app.el('helpDialog').open, true);
    app.el('helpDialog').querySelector('[data-close-dialog]').click(); assert.equal(app.el('helpDialog').open, false);
    app.el('languageButton').click();
    assert.equal(app.el('messageInput').value, '集合 Gate A →');
    const reloaded = setup(initial, {storage: [...app.storage]});
    assert.equal(reloaded.document.documentElement.lang, app.document.documentElement.lang);
    assert.equal(reloaded.el('languageButton').getAttribute('aria-label'), app.el('languageButton').getAttribute('aria-label'));
  }
});

(async () => { let failed = 0; for (const {name,body} of tests) { try { await body(); console.log('ok - '+name); } catch (error) { failed++; console.error('not ok - '+name+'\n'+error.stack); } } console.log(`${tests.length-failed}/${tests.length} passed`); process.exitCode = failed ? 1 : 0; })();
