import { Innertube } from 'youtubei.js';
export function videoId(input) {
  const s = String(input || '').trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.protocol !== 'https:') return null;
    const host = u.hostname.toLowerCase();
    let id = null;
    if (host === 'youtu.be') id = u.pathname.split('/')[1];
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
      if (u.pathname === '/watch') id = u.searchParams.get('v');
      else if (/^\/(live|shorts|embed)\//.test(u.pathname)) id = u.pathname.split('/')[2];
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? id : null;
  } catch { return null; }
}


// One ledger is shared by direct chat and the browser bridge.
export class ChatLedger {
  constructor(limit = 20000) { this.limit=limit; this.ids=new Set(); }
  accept(id) { if (!id || this.ids.has(id)) return false; this.ids.add(id); if(this.ids.size>this.limit)this.ids.delete(this.ids.values().next().value); return true; }
}
export function normalizeItem(item) {
  if (!['LiveChatTextMessage','LiveChatPaidMessage','LiveChatPaidSticker'].includes(item?.type)) return null;
  const author=item.author;
  if (!item.id || !author?.id) return null;
  return {eventId:String(item.id), id:`youtube:${author.id}`, name:String(author.name || 'Phật tử'),
    text:String(item.message || ''), avatar:author.thumbnails?.[0]?.url || '',
    paid:item.type!=='LiveChatTextMessage', amount:String(item.purchase_amount || ''), timestamp:item.timestamp};
}
export class YouTubeChat {
  constructor({video,onMessage,onStatus,ledger=new ChatLedger(),create=options=>Innertube.create(options),retryMs=5000}) {
    Object.assign(this,{video:videoId(video),onMessage,onStatus,ledger,create,retryMs}); this.stopped=false; this.failures=0; this.generation=0;
  }
  async start() {
    if (!this.video) { this.onStatus('error','Đường dẫn YouTube không hợp lệ.'); return; }
    const generation=++this.generation;
    this.onStatus('connecting','Đang kết nối YouTube, không cần khóa API.');
    this.abort=new AbortController();
    const abort=this.abort;
    try {
      const yt=await this.create({retrieve_player:false, fetch:(input,init={})=>fetch(input,{...init,signal:AbortSignal.any([abort.signal,AbortSignal.timeout(25000)])})});
      const info=await yt.getInfo(this.video);
      if (this.stopped || generation!==this.generation) return;
      if(info.playability_status?.status && info.playability_status.status!=='OK') { this.retry(); return; }
      if (!info.basic_info?.is_live || info.livechat?.is_replay) { this.onStatus('ended','Video chưa LIVE hoặc đã kết thúc; hãy thử lại khi LIVE bắt đầu.'); return; }
      const chat=info.getLiveChat();
      if(chat.is_replay) { this.onStatus('ended','Không đọc lại lịch sử chat của video đã kết thúc.'); return; }
      this.chat=chat;
      const active=()=>!this.stopped && generation===this.generation;
      chat.on('start',()=>{ if(active()){this.failures=0;this.onStatus('connected','Đã kết nối YouTube trực tiếp.');} });
      // Initial history from the start event is deliberately ignored.
      chat.on('chat-update',action=>{ if(!active())return; const m=normalizeItem(action.type==='AddChatItemAction'?action.item:null); if(m && this.ledger.accept(m.eventId)){this.onStatus('connected','Đang nhận bình luận YouTube.');this.onMessage(m);} });
      chat.on('error',()=>{ if(active())this.onStatus('connecting','YouTube gián đoạn; đang thử nối lại. Hình và nhạc vẫn chạy.'); });
      chat.on('end',()=>{ if(active())this.retry(); });
      chat.start();
    } catch { if(!this.stopped && generation===this.generation)this.retry(); }
  }
  retry() {
    ++this.generation; this.chat?.stop(); this.abort?.abort(); clearTimeout(this.timer);
    if(this.stopped)return;
    const delay=Math.min(60000,this.retryMs * 2 ** Math.min(this.failures++,4));
    this.onStatus('connecting',`Chưa đọc được chat; tự thử lại sau ${Math.ceil(delay/1000)} giây. Có thể dùng cầu nối dự phòng.`);
    this.timer=setTimeout(()=>this.start(),delay);
  }
  stop() { this.stopped=true; ++this.generation; clearTimeout(this.timer); this.chat?.stop(); this.abort?.abort(); }
}
