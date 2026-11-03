import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Session } from '../modules/session.mjs';
test('likes and beads count, cooldown and restoration', () => {
  let now = 1000; const s = new Session({}, () => now);
  s.like('a', 109); assert.equal(s.bows % 108, 1);
  assert.equal(s.chat('a', 'Nam mô A Di Đà Phật'), true);
  assert.equal(s.chat('a', 'NAM MO'), false);
  assert.equal(s.chat('b', 'nam mo'), true);
  now += 10000; assert.equal(s.chat('a', 'nam mo'), true);
  assert.equal(new Session(s.snapshot()).personal.a, 2);
});
test('rose queue remains bounded and records every rose', () => {
  const s = new Session(); for (let i = 0; i < 100; i++) s.rose(String(i), 'Khách', 2);
  assert.equal(s.roses, 200); assert.equal(s.queue.length, 30);
  assert.equal(s.queue.reduce((a, v) => a + v.count, 0), 200);
});
