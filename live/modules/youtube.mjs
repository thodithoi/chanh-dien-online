// YouTube Data API: read-only access to an active video's live chat.
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

export class YouTubeChat {
  constructor({ apiKey, video, onMessage, onStatus, fetchImpl = fetch, wait = defaultWait }) {
    this.key = String(apiKey || '').trim(); this.video = videoId(video);
    this.onMessage = onMessage; this.onStatus = onStatus;
    this.fetch = fetchImpl; this.wait = wait; this.controller = new AbortController();
    this.page = ''; this.initial = true; this.seen = new Set();
  }
  async request(path, params) {
    const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
    for (const [key, value] of Object.entries({...params, key:this.key})) if (value) url.searchParams.set(key, value);
    const res = await this.fetch(url, {signal:this.controller.signal});
    if (!res.ok) { const e = new Error('youtube_http'); e.status = res.status; throw e; }
    return res.json();
  }
  async start() {
    if (!this.key || !this.video) { this.onStatus('error', 'Cần API key và đường dẫn video YouTube hợp lệ.'); return; }
    this.onStatus('connecting', 'Đang tìm phiên LIVE.');
    try {
      const data = await this.request('videos', {part:'liveStreamingDetails', id:this.video});
      const chat = data.items?.[0]?.liveStreamingDetails?.activeLiveChatId;
      if (!chat) { this.onStatus('error', 'Không tìm thấy live chat đang hoạt động. Kiểm tra video, quyền truy cập và trạng thái LIVE.'); return; }
      this.onStatus('connected', 'Đã kết nối live chat.');
      let failures = 0;
      while (!this.controller.signal.aborted) {
        let page;
        try {
          page = await this.request('liveChat/messages', {part:'id,snippet,authorDetails', liveChatId:chat, pageToken:this.page, maxResults:'200'});
          if (failures) this.onStatus('connected', 'Đã kết nối lại live chat.');
          failures = 0;
        } catch (e) {
          if (this.controller.signal.aborted) return;
          if (e.status === 401 || e.status === 403 || ++failures > 5) throw e;
          this.onStatus('connecting', 'Mất kết nối tạm thời, đang thử lại.');
          await this.wait(Math.min(60000, 5000 * 2 ** (failures - 1)), this.controller.signal);
          continue;
        }
        this.processPage(page);
        if (page.offlineAt) { this.onStatus('ended', 'LIVE đã kết thúc.'); return; }
        if (!page.nextPageToken) { this.onStatus('error', 'YouTube không trả mã trang tiếp theo; hãy kết nối lại.'); return; }
        this.page = page.nextPageToken;
        await this.wait(Math.max(15000, Number(page.pollingIntervalMillis) || 15000), this.controller.signal);
      }
    } catch (e) {
      if (this.controller.signal.aborted) return;
      const message = e.status === 403 ? 'YouTube từ chối truy cập hoặc đã hết hạn mức API. Kiểm tra API key và quyền API.' : e.status === 401 ? 'API key hoặc quyền truy cập không hợp lệ.' : 'Không kết nối được YouTube. Kiểm tra mạng và thử kết nối lại.';
      this.onStatus('error', message);
    }
  }
  processPage(page) {
    for (const item of page.items || []) {
      const id = item.id;
      if (!id || this.seen.has(id)) continue;
      this.seen.add(id); if (this.seen.size > 5000) this.seen.delete(this.seen.values().next().value);
      const author = item.authorDetails;
      const text = item.snippet?.textMessageDetails?.messageText;
      if (!this.initial && item.snippet?.type === 'textMessageEvent' && author?.channelId && typeof text === 'string') {
        this.onMessage({ id:`youtube:${author.channelId}`, name:author.displayName || 'Phật tử', text, avatar:author.profileImageUrl || '' });
      }
    }
    this.initial = false;
  }
  stop() { this.controller.abort(); this.onStatus('idle', 'Đã ngắt kết nối.'); }
}
function defaultWait(ms, signal) { return new Promise(resolve => { if(signal.aborted) return resolve(); const timer=setTimeout(done,ms); function done(){clearTimeout(timer);signal.removeEventListener('abort',done);resolve();} signal.addEventListener('abort',done,{once:true}); }); }
