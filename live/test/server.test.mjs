import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import WebSocket from 'ws';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
test('HTTP, bridge authorization, real WebSocket bead flow and state restoration',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'thienan-test-'));const port=3497,base=`http://127.0.0.1:${port}`;let server,ws;
 const boot=async()=>{server=spawn(process.execPath,['server.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,PORT:String(port),STATE_FILE:join(dir,'state.json'),TTS_DISABLED:'1'},stdio:'ignore'});for(let i=0;i<60;i++){try{const r=await fetch(base+'/health');if(r.ok)return;}catch{}await wait(100);}throw Error('server did not start');};
 try {
 await boot();assert.equal((await (await fetch(base+'/health')).json()).app,'thien-an');
 const html=await (await fetch(base+'/live/control.html')).text();assert.ok(!html.includes('ytKey'));for(const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>new Function(script[1]));
 for(const path of ['/live/overlay.html','/assets/audio/bell-neptun.wav','/assets/music/meditation-custom.mp3']){const r=await fetch(base+path,{method:'HEAD'});assert.equal(r.status,200);}
 assert.equal((await fetch(base+'/live/server.mjs')).status,404);
 assert.equal((await fetch(base+'/api/bridge?video=abcdefghijk',{method:'POST',headers:{Origin:'https://evil.test'}})).status,403);
 const data=await (await fetch(base+'/api/bridge?video=abcdefghijk',{method:'POST',headers:{Origin:base}})).json();
 const source=decodeURIComponent(data.bookmark.slice(11));const token=source.match(/"token":"([a-f0-9]+)"/)[1];
 const bad=new WebSocket(`ws://127.0.0.1:${port}/ws?role=bridge&token=wrong`,{origin:base});bad.on('error',()=>{});await new Promise(r=>bad.once('close',r));assert.equal(bad.readyState,WebSocket.CLOSED);
 ws=new WebSocket(`ws://127.0.0.1:${port}/ws?role=bridge&token=${token}`,{origin:base});const events=[];ws.on('message',b=>events.push(JSON.parse(b)));await once(ws,'open');
 const m={t:'bridge_chat',video:'abcdefghijk',eventId:'one',authorId:'UC-test',name:'An',text:'NAM MO'};ws.send(JSON.stringify(m));ws.send(JSON.stringify(m));ws.send(JSON.stringify({...m,eventId:'two',video:'wrong'}));
 await wait(350);assert.equal(events.filter(e=>e.t==='bead').length,1);assert.equal(events.filter(e=>e.t==='join').length,1);
 ws.close();await once(ws,'close');server.kill();await once(server,'exit');await boot();
 const control=new WebSocket(`ws://127.0.0.1:${port}/ws?role=control`,{origin:base});const [raw]=await once(control,'message');const restored=JSON.parse(raw);assert.equal(restored.progress.beads,1);assert.equal(restored.viewers[0].id,'youtube:UC-test');control.close();
 }finally{ws?.terminate();if(server?.exitCode===null){server.kill();await once(server,'exit');}await rm(dir,{recursive:true,force:true});}
});
