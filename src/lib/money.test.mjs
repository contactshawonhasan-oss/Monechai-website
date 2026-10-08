import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { bdtToMinor, addMinor, multiplyMinor, formatBdt } from './money.ts';

test('whole taka converts exactly into poisha', () => {
  assert.equal(bdtToMinor(30), 3000);
  assert.equal(bdtToMinor(4880), 488000);
  for (const value of [-1, 1.25, NaN, 21474837]) assert.throws(() => bdtToMinor(value), RangeError);
});

test('integer-only totals with overflow checks', () => {
  assert.equal(addMinor(3000, 488000), 491000);
  assert.equal(multiplyMinor(3000, 10), 30000);
  assert.throws(() => multiplyMinor(100, 0), RangeError);
  assert.throws(() => addMinor(1.1), RangeError);
  assert.throws(() => multiplyMinor(Number.MAX_SAFE_INTEGER, 2), RangeError);
});

test('formats BDT with fractional minor units', () => {
  const display = formatBdt(3050);
  assert.match(display, /30[.,]50/);
  assert.match(display, /৳|BDT/);
  assert.throws(() => formatBdt(-1), RangeError);
});
