// Track cumulative streak updates; persist the tracker alongside session state.
// A missing group ID cannot reliably distinguish consecutive streaks: require
// a stable event ID for non-streak gifts and retain ended streaks for replays.
export class GiftProcessor {
  constructor(saved = {}, { now = Date.now, ttl = 24 * 60 * 60 * 1000 } = {}) {
    this.records = new Map(saved.records || []);
    this.now = now;
    this.ttl = ttl;
  }
  process(event) {
    const now = this.now();
    for (const [key, value] of this.records) if (now - value.at > this.ttl) this.records.delete(key);
    const user = String(event.userId || '');
    const gift = String(event.giftId || '');
    const group = String(event.groupId || '');
    const eventId = String(event.eventId || '');
    if (!user || !gift) return { delta: 0, reason: 'missing_identity' };
    const count = Number(event.repeatCount);
    if (!Number.isSafeInteger(count) || count < 1) return { delta: 0, reason: 'invalid_count' };
    // Without a stable group, an event ID deduplicates individual messages but
    // cannot safely infer cumulative streak deltas across distinct messages.
    if (!group) {
      if (!eventId || event.isStreak !== false) return { delta: 0, reason: 'ambiguous_streak' };
      const key = `event:${eventId}`;
      if (this.records.has(key)) return { delta: 0, reason: 'duplicate' };
      this.records.set(key, { count, at: now });
      return { delta: count, reason: 'unverified_group' };
    }
    const key = JSON.stringify([user, gift, group]);
    const prev = this.records.get(key);
    const delta = Math.max(0, count - (prev?.count || 0));
    this.records.set(key, { count: Math.max(count, prev?.count || 0), at: now, ended: !!event.repeatEnd || !!prev?.ended });
    return { delta, reason: delta ? 'counted' : 'duplicate' };
  }
  snapshot() { return { records: [...this.records] }; }
}
