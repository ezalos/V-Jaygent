// ABOUTME: Pure gesture-tracker module — maps a stream of pointer add/move/remove
// ABOUTME: events to single-tap / swipe classifications and sticky zoom/pan state.

const DEFAULTS = {
  tapMs:      200,
  tapPx:      10,
  swipeMs:    400,
  swipePx:    80,
  swipeRatio: 3,
  zoomMin:    0.25,
  zoomMax:    4.0,
  refSize:    1,
};

export function createGestureTracker(opts = {}) {
  const cfg = { ...DEFAULTS, ...opts };

  const pointers = new Map();
  let zoom = 1.0;
  let pan  = [0, 0];
  let pinch = null;

  function addPointer(id, x, y, t) {
    pointers.set(id, { x, y, startX: x, startY: y, startT: t });
    if (pointers.size === 2) beginPinch();
  }

  function movePointer(id, x, y) {
    const p = pointers.get(id);
    if (!p) return;
    p.x = x; p.y = y;
    if (pointers.size >= 2 && pinch) updatePinch();
  }

  function removePointer(id, x, y, t) {
    const p = pointers.get(id);
    if (!p) return null;

    p.x = x; p.y = y;

    const dt = t - p.startT;
    const dx = x - p.startX;
    const dy = y - p.startY;
    const travel = Math.hypot(dx, dy);

    pointers.delete(id);

    if (pointers.size === 1) {
      pinch = null;
      return null;
    }
    if (pointers.size > 0) {
      return null;
    }
    pinch = null;

    if (dt <= cfg.tapMs && travel <= cfg.tapPx) {
      return { kind: 'tap' };
    }
    if (dt <= cfg.swipeMs
        && Math.abs(dx) >= cfg.swipePx
        && Math.abs(dx) >= cfg.swipeRatio * Math.abs(dy)) {
      return { kind: 'swipe', dir: dx < 0 ? +1 : -1 };
    }
    return null;
  }

  function beginPinch() {
    const [a, b] = [...pointers.values()];
    pinch = {
      startDistance:  Math.hypot(a.x - b.x, a.y - b.y) || 1,
      startCentroid:  [(a.x + b.x) * 0.5, (a.y + b.y) * 0.5],
      zoomAtStart:    zoom,
      panAtStart:     [pan[0], pan[1]],
    };
  }

  function updatePinch() {
    const [a, b] = [...pointers.values()];
    const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    const centroid = [(a.x + b.x) * 0.5, (a.y + b.y) * 0.5];
    const ratio    = distance / pinch.startDistance;
    zoom = clamp(pinch.zoomAtStart * ratio, cfg.zoomMin, cfg.zoomMax);
    pan  = [
      pinch.panAtStart[0] + (centroid[0] - pinch.startCentroid[0]) / cfg.refSize,
      pinch.panAtStart[1] + (centroid[1] - pinch.startCentroid[1]) / cfg.refSize,
    ];
  }

  function getPrimary() {
    if (pointers.size === 0) return null;
    const p = pointers.values().next().value;
    return { x: p.x, y: p.y };
  }

  // Snapshot of every live pointer — used to feed multi-touch uniforms.
  // Order is insertion order (Map iteration). Caller treats `t` as the
  // start timestamp so it can derive an "age" uniform.
  function getPointers() {
    const out = [];
    for (const [id, p] of pointers) {
      out.push({ id, x: p.x, y: p.y, startT: p.startT });
    }
    return out;
  }

  function reset() {
    pointers.clear();
    pinch = null;
    zoom = 1.0;
    pan  = [0, 0];
  }

  return {
    addPointer,
    movePointer,
    removePointer,
    getPrimary,
    getPointers,
    getZoom: () => zoom,
    getPan:  () => [pan[0], pan[1]],
    setRefSize(n) { cfg.refSize = Math.max(1, n); },
    setZoom(v) { zoom = clamp(v, cfg.zoomMin, cfg.zoomMax); },
    setPan(x, y) { pan = [x, y]; },
    reset,
  };
}

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
