// ABOUTME: Unit tests for the pointer gesture classifier — taps, swipes, pinch,
// ABOUTME: two-finger pan. Pure module, no DOM.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGestureTracker } from '../studio/gestures.mjs';

test('single quick tap classifies as tap', () => {
  const g = createGestureTracker();
  g.addPointer('a', 100, 100, 0);
  const result = g.removePointer('a', 100, 100, 120);
  assert.deepEqual(result, { kind: 'tap' });
});

test('tap with small jitter still tap', () => {
  const g = createGestureTracker();
  g.addPointer('a', 100, 100, 0);
  g.movePointer('a', 104, 103, 50);
  const result = g.removePointer('a', 104, 103, 150);
  assert.deepEqual(result, { kind: 'tap' });
});

test('slow drag is NOT a tap and NOT a swipe', () => {
  const g = createGestureTracker();
  g.addPointer('a', 100, 100, 0);
  g.movePointer('a', 300, 110, 800);
  const result = g.removePointer('a', 300, 110, 1000);
  assert.equal(result, null);
});

test('fast horizontal leftward swipe returns swipe +1', () => {
  const g = createGestureTracker();
  g.addPointer('a', 400, 200, 0);
  g.movePointer('a', 200, 210, 200);
  const result = g.removePointer('a', 200, 210, 250);
  assert.deepEqual(result, { kind: 'swipe', dir: +1 });
});

test('fast horizontal rightward swipe returns swipe -1', () => {
  const g = createGestureTracker();
  g.addPointer('a', 100, 200, 0);
  g.movePointer('a', 300, 210, 200);
  const result = g.removePointer('a', 300, 210, 250);
  assert.deepEqual(result, { kind: 'swipe', dir: -1 });
});

test('mostly-vertical fast gesture is NOT a swipe', () => {
  const g = createGestureTracker();
  g.addPointer('a', 100, 100, 0);
  g.movePointer('a', 130, 300, 200);
  const result = g.removePointer('a', 130, 300, 250);
  assert.equal(result, null);
});

test('primary pointer position tracks single finger', () => {
  const g = createGestureTracker();
  g.addPointer('a', 50, 60, 0);
  assert.deepEqual(g.getPrimary(), { x: 50, y: 60 });
  g.movePointer('a', 70, 80, 10);
  assert.deepEqual(g.getPrimary(), { x: 70, y: 80 });
});

test('primary becomes null when all pointers released', () => {
  const g = createGestureTracker();
  g.addPointer('a', 50, 60, 0);
  g.removePointer('a', 50, 60, 100);
  assert.equal(g.getPrimary(), null);
});

test('two-finger pinch-out zooms in (zoom > 1)', () => {
  const g = createGestureTracker({ refSize: 1000 });
  g.addPointer('a', 400, 500, 0);
  g.addPointer('b', 600, 500, 0);
  g.movePointer('a', 300, 500, 100);
  g.movePointer('b', 700, 500, 100);
  assert.ok(g.getZoom() > 1.9 && g.getZoom() < 2.1,
    `expected zoom ≈ 2, got ${g.getZoom()}`);
});

test('two-finger pinch-in zooms out (zoom < 1)', () => {
  const g = createGestureTracker({ refSize: 1000 });
  g.addPointer('a', 300, 500, 0);
  g.addPointer('b', 700, 500, 0);
  g.movePointer('a', 400, 500, 100);
  g.movePointer('b', 600, 500, 100);
  assert.ok(g.getZoom() > 0.45 && g.getZoom() < 0.55,
    `expected zoom ≈ 0.5, got ${g.getZoom()}`);
});

test('zoom compounds across gestures', () => {
  const g = createGestureTracker({ refSize: 1000 });
  g.addPointer('a', 400, 500, 0);
  g.addPointer('b', 600, 500, 0);
  g.movePointer('a', 300, 500, 50);
  g.movePointer('b', 700, 500, 50);
  g.removePointer('a', 300, 500, 100);
  g.removePointer('b', 700, 500, 100);
  g.addPointer('c', 400, 500, 200);
  g.addPointer('d', 600, 500, 200);
  g.movePointer('c', 300, 500, 250);
  g.movePointer('d', 700, 500, 250);
  assert.ok(g.getZoom() > 3.8 && g.getZoom() < 4.2,
    `expected zoom ≈ 4, got ${g.getZoom()}`);
});

test('zoom is clamped to [0.25, 4.0]', () => {
  const g = createGestureTracker({ refSize: 1000 });
  g.addPointer('a', 499, 500, 0);
  g.addPointer('b', 501, 500, 0);
  g.movePointer('a', 0, 500, 100);
  g.movePointer('b', 1000, 500, 100);
  assert.equal(g.getZoom(), 4.0);
});

test('two-finger translation pans without zooming', () => {
  const g = createGestureTracker({ refSize: 1000 });
  g.addPointer('a', 400, 500, 0);
  g.addPointer('b', 600, 500, 0);
  g.movePointer('a', 500, 500, 100);
  g.movePointer('b', 700, 500, 100);
  const pan = g.getPan();
  assert.ok(Math.abs(pan[0] - 0.1) < 0.001, `pan.x expected 0.1, got ${pan[0]}`);
  assert.ok(Math.abs(pan[1] - 0) < 0.001,   `pan.y expected 0, got ${pan[1]}`);
  assert.ok(Math.abs(g.getZoom() - 1.0) < 0.001, `zoom should stay 1, got ${g.getZoom()}`);
});

test('reset restores zoom=1 and pan=[0,0]', () => {
  const g = createGestureTracker({ refSize: 1000 });
  g.addPointer('a', 400, 500, 0);
  g.addPointer('b', 600, 500, 0);
  g.movePointer('a', 300, 500, 50);
  g.movePointer('b', 700, 500, 50);
  g.reset();
  assert.equal(g.getZoom(), 1.0);
  assert.deepEqual(g.getPan(), [0, 0]);
});
