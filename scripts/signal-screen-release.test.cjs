'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadHtml } = require('./signal-screen-harness.cjs');
const root = path.join(__dirname, '..');
const readable = fs.readFileSync(path.join(root, 'dist/index.html'));
assert.deepEqual(fs.readFileSync(path.join(root, 'signal-screen.html')), readable, 'root download must match the built readable app');
assert.equal(loadHtml(path.join(root, 'dist/index.self-extract.html')), readable.toString('utf8'), 'self-extract payload must restore exact readable bytes');
const source = fs.readFileSync(path.join(root, 'src/index.template.html'), 'utf8');
const appScript = html => [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('const translations ='));
assert.equal(appScript(readable.toString('utf8')), appScript(source), 'distribution application logic must match source');
assert.match(readable.toString('utf8'), /connect-src 'none'/);
console.log('ok - readable, self-extract, root, and source application parity');

const crypto=require('node:crypto'),cp=require('node:child_process');
const lock=JSON.parse(fs.readFileSync(path.join(root,'components/ui-conventions.lock.json'),'utf8'));
assert.equal(lock.version,'1.0.0');
for(const [name,hash] of Object.entries(lock.files)){const bytes=fs.readFileSync(path.join(root,'components',name));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),hash);assert.ok(readable.toString('utf8').includes(bytes.toString('utf8')),'exact embedded '+name);}
const scripts=[...readable.toString('utf8').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(match=>!/application\/json/.test(match[1]));
const combined=scripts.filter(match=>!/type="module"/.test(match[1])).map(match=>match[2]).join('\n');
const parsed=cp.spawnSync(process.execPath,['--input-type=commonjs','--check'],{input:combined,encoding:'utf8'});assert.equal(parsed.status,0,parsed.stderr);
for(const match of scripts.filter(match=>/type="module"/.test(match[1]))){const result=cp.spawnSync(process.execPath,['--input-type=module','--check'],{input:match[2],encoding:'utf8'});assert.equal(result.status,0,result.stderr);}
console.log('ok - exact shared hashes/embeds and native combined script syntax');
