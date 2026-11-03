import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GiftProcessor } from '../modules/gift-processor.mjs';

test('cumulative updates, replays and restoration do not double count', () => {
  const input = { userId: 'u', giftId: 'g', groupId: '1' };
  const p = new GiftProcessor();
  assert.equal(p.process({ ...input, repeatCount: 1 }).delta, 1);
  assert.equal(p.process({ ...input, repeatCount: 4 }).delta, 3);
  const restored = new GiftProcessor(p.snapshot());
  assert.equal(restored.process({ ...input, repeatCount: 4, repeatEnd: true }).delta, 0);
  assert.equal(restored.process({ ...input, repeatCount: 2 }).delta, 0);
  assert.equal(restored.process({ ...input, groupId: '2', repeatCount: 1 }).delta, 1);
});
test('rejects unidentified events and deduplicates event IDs', () => {
  const p = new GiftProcessor();
  assert.equal(p.process({ userId: 'u', giftId: 'g', repeatCount: 1 }).reason, 'ambiguous_streak');
  const e = { userId: 'u', giftId: 'g', repeatCount: 1, eventId: 'x', isStreak: false };
  assert.equal(p.process(e).delta, 1);
  assert.equal(p.process(e).delta, 0);
});
