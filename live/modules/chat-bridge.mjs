import { timingSafeEqual } from 'node:crypto';
export function validToken(input,token) {
  return typeof input==='string' && Buffer.byteLength(input)===Buffer.byteLength(token) && timingSafeEqual(Buffer.from(input),Buffer.from(token));
}
export function bridgeMessage(m, video) {
  if(m?.video!==video || typeof m.eventId!=='string' || !m.eventId || m.eventId.length>300 || typeof m.authorId!=='string' || !m.authorId || m.authorId.length>300) return null;
  return {eventId:m.eventId,id:`youtube:${m.authorId}`,name:String(m.name||'Phật tử').slice(0,80),text:String(m.text||'').slice(0,500),avatar:'',paid:!!m.paid,amount:String(m.amount||'').slice(0,80)};
}
// Executed by the user as a bookmark on the visible YouTube live-chat page.
export function bookmarklet({base,token,video}) {
  function run(config) {
    if(location.hostname!=='www.youtube.com' || location.pathname!=='/live_chat' || new URL(location.href).searchParams.get('v')!==config.video) { alert('Hãy mở đúng cửa sổ chat rời của video đã chọn rồi bấm dấu trang này.'); return; }
    if(window.__thienAnBridge)window.__thienAnBridge();
    const receiver=window.open(config.base+'/live/bridge.html#'+config.token,'thienAnBridge','width=480,height=400');
    if(!receiver){alert('Cho phép mở cửa sổ bật lên để dùng cầu nối.');return;}
    let ready=false; const pending=[], seen=new Set();
    const types='yt-live-chat-text-message-renderer,yt-live-chat-paid-message-renderer,yt-live-chat-paid-sticker-renderer';
    document.querySelectorAll(types).forEach(el=>{if(el.id)seen.add(el.id);});
    const send=el=>{
      if(!el.id||seen.has(el.id))return; seen.add(el.id); if(seen.size>20000)seen.delete(seen.values().next().value);
      const authorId=el.getAttribute('author-external-channel-id') || el.data?.authorExternalChannelId; if(!authorId)return;
      const text=el.querySelector('#message')?.textContent||'';
      const m={video:config.video,eventId:el.id,authorId,name:el.querySelector('#author-name')?.textContent||'Phật tử',text,paid:el.tagName!=='YT-LIVE-CHAT-TEXT-MESSAGE-RENDERER',amount:el.querySelector('#purchase-amount')?.textContent||''};
      if(ready)receiver.postMessage({type:'thienan-chat',token:config.token,message:m},config.base);else if(pending.length<1000)pending.push(m);
    };
    const observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes){if(node.nodeType!==1)continue;if(node.matches(types))send(node);node.querySelectorAll(types).forEach(send);}});
    observer.observe(document.body,{childList:true,subtree:true});
    const handshake=e=>{if(e.source!==receiver||e.origin!==config.base||e.data?.type!=='thienan-ready'||e.data?.token!==config.token)return;ready=true;for(const message of pending.splice(0))receiver.postMessage({type:'thienan-chat',token:config.token,message},config.base);};
    window.addEventListener('message',handshake);
    window.__thienAnBridge=()=>{observer.disconnect();window.removeEventListener('message',handshake);delete window.__thienAnBridge;};
  }
  return 'javascript:'+encodeURIComponent(`(${run.toString()})(${JSON.stringify({base,token,video})})`);
}
