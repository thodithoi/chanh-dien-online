import {test} from 'node:test';
import assert from 'node:assert/strict';
import {videoId, YouTubeChat} from '../modules/youtube.mjs';
test('accepts only YouTube video links or IDs', () => {
  assert.equal(videoId('https://www.youtube.com/watch?v=abcdefghijk'), 'abcdefghijk');
  assert.equal(videoId('https://youtu.be/abcdefghijk'), 'abcdefghijk');
  assert.equal(videoId('https://youtube.com/live/abcdefghijk'), 'abcdefghijk');
  assert.equal(videoId('https://youtube.com.evil.test/watch?v=abcdefghijk'), null);
  assert.equal(videoId('http://youtube.com/watch?v=abcdefghijk'), null);
});
test('skips initial history, handles new chat and deduplicates', () => {
  const messages=[]; const c=new YouTubeChat({apiKey:'test',video:'abcdefghijk',onMessage:m=>messages.push(m),onStatus:()=>{}});
  const item=(id,text)=>({id, snippet:{type:'textMessageEvent',textMessageDetails:{messageText:text}},authorDetails:{channelId:'abc',displayName:'An'}});
  c.processPage({items:[item('old','NAM MO')]});
  c.processPage({items:[item('old','NAM MO'),item('new','NAM MO')]});
  c.processPage({items:[item('new','NAM MO')]});
  assert.equal(messages.length,1); assert.equal(messages[0].id,'youtube:abc'); assert.equal(messages[0].text,'NAM MO');
});
test('uses only Google API and does not process history on initial connect', async () => {
  const urls=[], msgs=[], states=[];
  const fake=async u=>{urls.push(u);return {ok:true,json:async()=>urls.length===1?{items:[{liveStreamingDetails:{activeLiveChatId:'chat'}}]}:{items:[],offlineAt:'now'}}};
  const c=new YouTubeChat({apiKey:'key',video:'abcdefghijk',onMessage:m=>msgs.push(m),onStatus:(s)=>states.push(s),fetchImpl:fake});
  await c.start(); assert.deepEqual(states,['connecting','connected','ended']); assert.equal(msgs.length,0); assert.ok(urls.every(u=>u.hostname==='www.googleapis.com'));
});
test('temporary polling failure retries then dispatches only fresh chat', async () => {
  const seen=[], statuses=[], waits=[]; let n=0;
  const item=(id)=>({id,snippet:{type:'textMessageEvent',textMessageDetails:{messageText:'NAM MO'}},authorDetails:{channelId:'viewer',displayName:'An'}});
  const fetchImpl=async()=>{ n++; if(n===1)return {ok:true,json:async()=>({items:[{liveStreamingDetails:{activeLiveChatId:'c'}}]})}; if(n===2)return {ok:true,json:async()=>({items:[item('history')],nextPageToken:'p',pollingIntervalMillis:500})}; if(n===3)throw new Error('network'); return {ok:true,json:async()=>({items:[item('new')],offlineAt:'end'})}; };
  const c=new YouTubeChat({apiKey:'x',video:'abcdefghijk',onMessage:m=>seen.push(m),onStatus:s=>statuses.push(s),fetchImpl,wait:async ms=>waits.push(ms)});
  await c.start(); assert.equal(seen.length,1); assert.deepEqual(waits,[15000,5000]); assert.deepEqual(statuses,['connecting','connected','connecting','connected','ended']);
});
test('authorization failures are reported without exposing credentials', async () => {
  const statuses=[]; const c=new YouTubeChat({apiKey:'private-secret',video:'abcdefghijk',onMessage:()=>{},onStatus:(status,message)=>statuses.push({status,message}),fetchImpl:async()=>({ok:false,status:403})});
  await c.start(); assert.equal(statuses.at(-1).status,'error'); assert.equal(JSON.stringify(statuses).includes('private-secret'),false);
});
test('new YouTube comment goes through the real bead cooldown', async () => {
  const {Session}=await import('../modules/session.mjs'); let clock=1000; const s=new Session({},()=>clock);
  const c=new YouTubeChat({apiKey:'x',video:'abcdefghijk',onMessage:m=>s.chat(m.id,m.text),onStatus:()=>{}});
  const item=(id)=>({id,snippet:{type:'textMessageEvent',textMessageDetails:{messageText:'NAM MO'}},authorDetails:{channelId:'u',displayName:'An'}});
  c.processPage({items:[]}); c.processPage({items:[item('1'),item('2')]});
  assert.equal(s.beads,1); clock+=10000; c.processPage({items:[item('3')]}); assert.equal(s.beads,2);
});
