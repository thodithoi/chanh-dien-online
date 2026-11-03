import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {videoId,YouTubeChat,ChatLedger,normalizeItem} from '../modules/youtube.mjs';
import {bridgeMessage,validToken,bookmarklet} from '../modules/chat-bridge.mjs';
import {Session} from '../modules/session.mjs';
const item=(id,type='LiveChatTextMessage')=>({id,type,author:{id:'channel',name:'An',thumbnails:[{url:'https://yt3.ggpht.com/a'}]},message:'NAM MO',purchase_amount:'₫20,000'});
function setup(extra={}){const chat=new EventEmitter();chat.start=()=>chat.emit('start',{});chat.stop=()=>{};const messages=[],states=[];const client=new YouTubeChat({video:'abcdefghijk',onMessage:m=>messages.push(m),onStatus:s=>states.push(s),create:async()=>({getInfo:async()=>({basic_info:{is_live:true},getLiveChat:()=>chat})}),...extra});return {chat,messages,states,client};}
test('accepts only YouTube video links or IDs',()=>{assert.equal(videoId('https://youtu.be/abcdefghijk'),'abcdefghijk');assert.equal(videoId('https://youtube.com/live/abcdefghijk'),'abcdefghijk');assert.equal(videoId('https://youtube.com.evil.test/watch?v=abcdefghijk'),null);assert.equal(videoId('http://youtube.com/watch?v=abcdefghijk'),null);});
test('initial history ignored, text and paid events accepted once; stopped client cannot emit',async()=>{const {client,chat,messages,states}=setup();await client.start();chat.emit('start',{actions:[{item:item('history')}]});for(const id of ['one','one'])chat.emit('chat-update',{type:'AddChatItemAction',item:item(id)});chat.emit('chat-update',{type:'AddChatItemAction',item:item('paid','LiveChatPaidMessage')});assert.equal(messages.length,2);assert.equal(messages[1].paid,true);client.stop();chat.emit('chat-update',{type:'AddChatItemAction',item:item('late')});assert.equal(messages.length,2);assert.equal(states[1],'connected');});
test('network failure retries and stop cancels reconnect',async()=>{let count=0;const {client}=setup({retryMs:5,create:async()=>{count++;throw Error('offline');}});await client.start();await new Promise(r=>setTimeout(r,20));assert.ok(count>1);client.stop();const stopped=count;await new Promise(r=>setTimeout(r,40));assert.equal(count,stopped);});
test('stop during pending lookup does not start an orphan chat',async()=>{let release,started=0;const chat={start:()=>started++};const {client}=setup({create:async()=>({getInfo:()=>new Promise(r=>release=r)})});const pending=client.start();await new Promise(r=>setImmediate(r));client.stop();release({basic_info:{is_live:true},getLiveChat:()=>chat});await pending;assert.equal(started,0);});
test('replay and not-live video do not import old chat',async()=>{const {client,states}=setup({create:async()=>({getInfo:async()=>({basic_info:{is_live:false}})})});await client.start();assert.equal(states.at(-1),'ended');client.stop();});
test('shared bridge/direct ledger and bead cooldown',()=>{let clock=1000;const session=new Session({},()=>clock),ledger=new ChatLedger();const direct=normalizeItem(item('1'));const bridge=bridgeMessage({video:'abcdefghijk',eventId:'1',authorId:'channel',name:'An',text:'NAM MO'},'abcdefghijk');for(const m of [direct,bridge,normalizeItem(item('2'))])if(ledger.accept(m.eventId))session.chat(m.id,m.text);assert.equal(session.beads,1);clock+=10000;const m=normalizeItem(item('3'));if(ledger.accept(m.eventId))session.chat(m.id,m.text);assert.equal(session.beads,2);});
test('bridge rejects incorrect video, missing identity and malformed tokens',()=>{assert.equal(bridgeMessage({video:'wrong',eventId:'a',authorId:'u'},'abcdefghijk'),null);assert.equal(bridgeMessage({video:'abcdefghijk',eventId:'a'},'abcdefghijk'),null);assert.equal(validToken('éé','abcd'),false);assert.equal(validToken(null,'abcd'),false);assert.equal(validToken('abcd','abcd'),true);const code=decodeURIComponent(bookmarklet({base:'http://127.0.0.1:3481',video:'abcdefghijk',token:'secret'}).slice(11));assert.doesNotThrow(()=>new Function(code));});
test('bookmark bridge observes only new messages, uses renderer channel identity and validates handshake',async()=>{
 const {runInNewContext}=await import('node:vm');let mutate,handshake;const sent=[];
 const receiver={postMessage:(m,origin)=>sent.push({m,origin})};
 const window={open:()=>receiver,addEventListener:(_,fn)=>handshake=fn,removeEventListener:()=>{}};
 const document={body:{},querySelectorAll:()=>[{id:'history'}]};
 class Observer{constructor(fn){mutate=fn;}observe(){}disconnect(){}}
 const code=decodeURIComponent(bookmarklet({base:'http://127.0.0.1:3481',video:'abcdefghijk',token:'secret'}).slice(11));
 runInNewContext(code,{window,document,MutationObserver:Observer,URL,location:{hostname:'www.youtube.com',pathname:'/live_chat',href:'https://www.youtube.com/live_chat?v=abcdefghijk'},alert:()=>assert.fail('unexpected alert')});
 const node={id:'new',nodeType:1,tagName:'YT-LIVE-CHAT-TEXT-MESSAGE-RENDERER',data:{authorExternalChannelId:'UC-bridge'},getAttribute:()=>null,matches:()=>true,querySelectorAll:()=>[],querySelector:s=>({textContent:s==='#message'?'NAM MO':'An'})};
 mutate([{addedNodes:[node,node]}]);assert.equal(sent.length,0);
 handshake({source:receiver,origin:'https://evil.test',data:{type:'thienan-ready',token:'secret'}});assert.equal(sent.length,0);
 handshake({source:receiver,origin:'http://127.0.0.1:3481',data:{type:'thienan-ready',token:'secret'}});assert.equal(sent.length,1);assert.equal(sent[0].m.message.authorId,'UC-bridge');assert.equal(sent[0].m.message.text,'NAM MO');
});
