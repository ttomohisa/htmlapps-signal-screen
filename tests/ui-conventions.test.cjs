const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {createApp}=require('../scripts/signal-screen-harness.cjs');
const file=process.env.SIGNAL_SCREEN_HTML||path.resolve(__dirname,'../src/index.template.html');
const saved={mode:'message',message:'Gate A',qrText:'https://example.test/',color:'#101110',flash:'steady',flashAcknowledged:false,language:'en'};
const setup=(options={})=>createApp(file,{storage:[['signal-screen:v1',JSON.stringify(saved)]],...options});
test('shared language priority and startup reads never write app or common preferences',()=>{
 for(const [options,expected] of [[{url:'https://example.test/?lang=ja'},'ja'],[{storage:[['signal-screen:v1',JSON.stringify(saved)],['browser-kitty:ui-language:v1','ja']]},'ja'],[{},'en']]){const app=setup(options);assert.equal(app.run('lang'),expected);assert.equal(app.writes.length,0);}
 const app=setup({storage:[],languages:['fr','ja-JP','en']});assert.equal(app.run('lang'),'ja');assert.equal(app.writes.length,0);
});
test('storage failure retains text, QR and saved time until successful retry and reload',()=>{
 const app=setup();app.input(app.el('messageInput'),'New message');const before=app.storage.get('signal-screen:v1'),time=app.run('lastSavedAt');
 app.storageControl.writeFails=true;app.input(app.el('qrInput'),'draft QR');assert.equal(app.run('saveStatus'),'error');assert.equal(app.run('lastSavedAt'),time);assert.equal(app.storage.get('signal-screen:v1'),before);assert.equal(app.el('saveRetry').hidden,false);
 app.storageControl.writeFails=false;app.el('saveRetry').click();assert.equal(app.run('saveStatus'),'saved');const reload=setup({storage:[...app.storage]});assert.equal(reload.el('qrInput').value,'draft QR');assert.equal(reload.el('messageInput').value,'New message');
});
test('explicit language changes preserve input and app bytes; denied preference remains screen-only',()=>{
 const app=setup();app.el('messageInput').value='Uncommitted';app.el('qrInput').value='Uncommitted QR';const before=app.storage.get('signal-screen:v1');
 app.el('languageButton').click();assert.equal(app.run('lang'),'ja');assert.equal(app.el('messageInput').value,'Uncommitted');assert.equal(app.el('qrInput').value,'Uncommitted QR');assert.equal(app.storage.get('signal-screen:v1'),before);assert.equal(app.storage.get('browser-kitty:ui-language:v1'),'ja');
 app.storageControl.writeFails=true;app.el('languageButton').click();assert.match(app.el('languageNotice').textContent,/screen|session/i);assert.equal(app.document.documentElement.lang,'en');
});
test('invalid stored data blocks automatic replacement and requires Cancel-first recovery confirmation',()=>{
 const app=setup({storage:[['signal-screen:v1','broken']]});app.input(app.el('messageInput'),'Current');assert.equal(app.storage.get('signal-screen:v1'),'broken');assert.equal(app.run('saveStatus'),'error');
 app.el('saveRetry').click();assert.equal(app.el('storageRecoveryDialog').open,true);assert.equal(app.document.activeElement.id,'storageRecoveryCancel');app.el('storageRecoveryCancel').click();assert.equal(app.storage.get('signal-screen:v1'),'broken');
 app.el('saveRetry').click();app.el('storageRecoveryConfirm').click();assert.equal(JSON.parse(app.storage.get('signal-screen:v1')).message,'Current');assert.equal(app.run('saveStatus'),'saved');
});
test('persistent save error survives transient runtime messages and translates while reset is open',()=>{
 const app=setup({writeFails:true});app.input(app.el('messageInput'),'Keep');app.run("showStatus(t('statusWakeUnavailable'),'warn')");app.el('resetButton').click();assert.equal(app.document.activeElement.getAttribute('data-i18n'),'cancel');app.el('languageButton').click();app.flushTimers();assert.match(app.el('saveStatus').textContent,/保存できません/);assert.match(app.el('resetDialog').textContent,/QR/);assert.equal(app.run('state.message'),'Keep');
});

test('pending fullscreen requests use one native call and expose a busy action',async()=>{
 const app=setup();app.el('showButton').click();await app.settle();let resolve,calls=0;app.document.documentElement.requestFullscreen=()=>{calls++;return new Promise(done=>resolve=done);};
 const first=app.run('requestFullscreen()'),second=app.run('requestFullscreen()');assert.equal(calls,1);assert.equal(app.el('stageFullscreenButton').disabled,true);assert.equal(app.el('stageFullscreenButton').getAttribute('aria-busy'),'true');resolve();await Promise.all([first,second]);assert.equal(app.el('stageFullscreenButton').disabled,false);
});
