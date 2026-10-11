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

// CSS contracts guard the cause of the short-viewport failures. These are not
// pixel/scroll simulations; native browser checks still cover actual allocation.
const cssRules = html => [...html.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
const cssRule = (html, selector) => cssRules(html).filter(match => match[1].trim().split(',').map(s => s.trim()).includes(selector)).map(match => match[2]).join(';');
test('open native dialogs lock both page scroll roots without changing the Help shell', () => {
  const app = setup();
  for (const selector of ['html:has(dialog:modal)', 'body:has(dialog:modal)']) {
    const rule = cssRule(app.html, selector);
    assert.match(rule, /overflow\s*:\s*hidden\b/, `${selector} locks outside wheel/touch scroll`);
    assert.match(rule, /overscroll-behavior\s*:\s*none\b/);
  }
  assert.equal(cssRule(app.html, 'html:has(dialog[open])'), '', 'nonmodal dialogs do not lock the page');
  assert.equal(cssRule(app.html, 'body:has(dialog[open])'), '', 'nonmodal dialogs do not lock the page');
  assert.match(cssRule(app.html, '.dialog-body'), /overscroll-behavior\s*:\s*contain\b/);
  assert.match(cssRule(app.html, '.dialog-body'), /max-height\s*:\s*calc\(100dvh - 94px\)/, 'preserve the working Help allocation');
});
test('only open confirmations reserve fixed header/footer space around a shrinking scroll body', () => {
  const app = setup();
  for (const id of ['resetDialog', 'flashConfirmDialog']) {
    assert.equal(app.el(id).classList.contains('confirmation-dialog'), true);
  }
  assert.equal(app.el('helpDialog').classList.contains('confirmation-dialog'), false);
  assert.match(cssRule(app.html, '.confirmation-dialog[open]'), /display\s*:\s*flex\b/);
  assert.match(cssRule(app.html, '.confirmation-dialog[open]'), /flex-direction\s*:\s*column\b/);
  for (const child of ['.dialog-head', '.dialog-actions']) assert.match(cssRule(app.html, `.confirmation-dialog ${child}`), /flex\s*:\s*0 0 auto\b/);
  const body = cssRule(app.html, '.confirmation-dialog .dialog-body');
  assert.match(body, /min-height\s*:\s*0\b/);
  assert.match(body, /max-height\s*:\s*none\b/);
  assert.match(body, /overflow\s*:\s*auto\b/);
  assert.match(body, /flex\s*:\s*1 1 auto\b/);
});
test('the local-processing badge keeps its existing shield/check artwork', () => {
  const app = setup(); const paths = app.document.querySelector('.local-badge').querySelectorAll('path');
  assert.equal(paths[0].getAttribute('d'), 'M12 3l7 3v5c0 4.8-2.9 8.2-7 10-4.1-1.8-7-5.2-7-10V6z');
  assert.equal(paths[1].getAttribute('d'), 'm9 12 2 2 4-5');
});
const openEditorDialog = (app, id) => {
  const opener = id === 'helpDialog' ? app.el('helpButton') : id === 'resetDialog' ? app.el('resetButton') : app.document.querySelector('[data-flash="slow"]');
  opener.click(); assert.equal(app.el(id).open, true); return opener;
};
const dismissDialog = (app, id, mode) => {
  const dialog = app.el(id);
  if (mode === 'escape') { dialog.dispatch('cancel'); dialog.close(); } // Native default action.
  if (mode === 'cancel') (id === 'flashConfirmDialog' ? app.el('flashCancelButton') : dialog.querySelector('[data-i18n="cancel"]')).click();
  if (mode === 'close') dialog.querySelector('[data-close-dialog]').click();
  if (mode === 'backdrop') dialog.dispatch('click', {clientX:-1, clientY:-1});
};
for (const language of ['ja', 'en']) {
  for (const id of ['helpDialog', 'resetDialog', 'flashConfirmDialog']) for (const mode of id === 'helpDialog' ? ['escape', 'close', 'backdrop'] : ['escape', 'close', 'cancel', 'backdrop']) {
    test(`${language}: ${id} ${mode} restores its pointer opener and preserves editor data`, () => {
      const app = setup(language); app.input(app.el('messageInput'), 'Gate A'); app.input(app.el('qrInput'), 'synthetic QR');
      const saved = [...app.storage];
      for (let i = 0; i < 2; i++) {
        app.el('messageInput').focus(); const opener = openEditorDialog(app, id);
        dismissDialog(app, id, mode); assert.equal(app.el(id).open, false);
        assert.ok(app.document.activeElement === opener, 'focus returns to the current opener'); assert.equal(opener.lastFocusOptions?.preventScroll, true);
        assert.deepEqual([...app.storage], saved); assert.equal(active(app), false); assert.equal(app.run('state.flash'), 'steady');
      }
    });
  }
  for (const mode of ['escape', 'close', 'cancel', 'backdrop', 'confirm']) test(`${language}: reset ${mode} after desktop-to-mobile resize restores visible Show without activating it`, () => {
    const app = setup(language); app.el('resetButton').focus(); openEditorDialog(app, 'resetDialog'); app.resize(393, 252);
    if (mode === 'confirm') app.el('resetConfirmButton').click(); else dismissDialog(app, 'resetDialog', mode);
    assert.equal(app.el('resetDialog').open, false); assert.equal(app.document.activeElement?.id, 'showButton');
    assert.equal(app.el('showButton').lastFocusOptions?.preventScroll, true); assert.equal(active(app), false);
  });
  test(`${language}: a mobile Help opener remains current through resize to desktop`, () => {
    const app = setup(language, {viewportWidth:393, viewportHeight:252}); app.el('messageInput').focus();
    openEditorDialog(app, 'helpDialog'); app.resize(1184, 763); dismissDialog(app, 'helpDialog', 'escape');
    assert.equal(app.document.activeElement?.id, 'helpButton');
  });
  test(`${language}: Reset returns to its opener when a narrow window becomes desktop width again`, () => {
    const app = setup(language); openEditorDialog(app, 'resetDialog'); app.resize(393, 252); app.resize(1184, 763);
    dismissDialog(app, 'resetDialog', 'escape'); assert.equal(app.document.activeElement?.id, 'resetButton');
    assert.equal(active(app), false);
  });
  test(`${language}: Help omits layout implementation commentary`, () => {
    const app = setup(language);
    assert.equal(app.run("t('helpDialogs')"), 'helpDialogs');
    assert.equal(app.document.querySelector('[data-i18n="helpDialogs"]'), null);
  });
}
for (const unavailable of ['hidden', 'disconnected', 'disabled', 'visibility', 'inert']) test(`dialog close skips an ${unavailable} opener`, () => {
  const app = setup(); const opener = openEditorDialog(app, 'resetDialog');
  if (unavailable === 'hidden') opener.hidden = true;
  if (unavailable === 'disconnected') opener.remove();
  if (unavailable === 'disabled') opener.disabled = true;
  if (unavailable === 'visibility') opener.style.visibility = 'hidden';
  if (unavailable === 'inert') opener.inert = true;
  dismissDialog(app, 'resetDialog', 'escape'); assert.equal(app.document.activeElement?.id, 'showButton');
});
test('dialog fallback continues if Show is disabled or cannot accept focus', () => {
  for (const failure of ['disabled', 'unfocusable']) {
    const app = setup(); openEditorDialog(app, 'resetDialog'); app.resize(393, 252);
    if (failure === 'disabled') app.el('showButton').disabled = true; else app.el('showButton').focus = () => {};
    dismissDialog(app, 'resetDialog', 'escape'); assert.equal(app.document.activeElement?.id, 'helpButton');
    assert.equal(active(app), false);
  }
});
test('delayed close cleanup does not steal a newer valid editor focus', () => {
  const app = setup('en', {deferDialogClose:true}); openEditorDialog(app, 'resetDialog'); app.resize(393, 252);
  dismissDialog(app, 'resetDialog', 'escape'); app.el('messageInput').focus(); app.flushCloseEvents();
  assert.equal(app.document.activeElement?.id, 'messageInput');
});
test('delayed close cleanup does not steal focus from a newer dialog', () => {
  const app = setup('en', {deferDialogClose:true}); openEditorDialog(app, 'resetDialog'); app.resize(393, 252);
  dismissDialog(app, 'resetDialog', 'escape'); openEditorDialog(app, 'helpDialog'); const current = app.document.activeElement;
  app.flushCloseEvents(); assert.equal(app.el('helpDialog').open, true); assert.ok(app.document.activeElement === current, 'newer focus is preserved');
  dismissDialog(app, 'helpDialog', 'close'); app.flushCloseEvents(); assert.equal(app.document.activeElement?.id, 'helpButton');
});
test('a queued close cannot clear the current opener of the same reopened dialog', () => {
  const app = setup('en', {deferDialogClose:true}); openEditorDialog(app, 'helpDialog'); dismissDialog(app, 'helpDialog', 'close');
  openEditorDialog(app, 'helpDialog'); const current = app.document.activeElement; app.flushCloseEvents();
  assert.equal(app.el('helpDialog').open, true); assert.ok(app.document.activeElement === current, 'newer focus is preserved');
  dismissDialog(app, 'helpDialog', 'close'); app.flushCloseEvents(); assert.equal(app.document.activeElement?.id, 'helpButton');
});
test('a child click with out-of-dialog keyboard coordinates is not a backdrop dismissal', () => {
  const app = setup(); openEditorDialog(app, 'helpDialog');
  app.el('helpDialog').querySelector('.dialog-body').dispatch('click', {clientX:-1,clientY:-1});
  assert.equal(app.el('helpDialog').open, true);
});

(async () => { let failed = 0; for (const {name,body} of tests) { try { await body(); console.log('ok - '+name); } catch (error) { failed++; console.error('not ok - '+name+'\n'+error.stack); } } console.log(`${tests.length-failed}/${tests.length} passed`); process.exitCode = failed ? 1 : 0; })();
