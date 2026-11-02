export class Session {
  constructor(state = {}, now = Date.now) {
    this.now = now;
    this.bows = Number(state.bows) || 0;
    this.beads = Number(state.beads) || 0;
    this.personal = state.personal || {};
    this.cooldowns = state.cooldowns || {};
    this.roses = Number(state.roses) || 0;
    this.queue = Array.isArray(state.queue) ? state.queue.slice(0, 30) : [];
  }
  like(id, count) {
    const n = Math.max(0, Math.min(100000, Math.floor(Number(count) || 0)));
    this.bows += n;
    return n;
  }
  chat(id, text) {
    const normalized = String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (!/(^|[^a-z])nam\s+mo([^a-z]|$)/.test(normalized)) return false;
    const now = this.now();
    if (this.cooldowns[id] !== undefined && now - this.cooldowns[id] < 10000) return false;
    this.cooldowns[id] = now;
    this.beads++;
    this.personal[id] = (this.personal[id] || 0) + 1;
    return true;
  }
  rose(id, name, count) {
    this.roses += count;
    const found = this.queue.find(x => x.id === id);
    if (found) found.count += count;
    else if (this.queue.length < 30) this.queue.push({ id, name, count });
    else { const last = this.queue[this.queue.length - 1]; last.id = ''; last.name = 'quý Phật tử'; last.count += count; }
  }
  snapshot() { return { bows: this.bows, beads: this.beads, personal: this.personal, cooldowns: this.cooldowns, roses: this.roses, queue: this.queue }; }
}
