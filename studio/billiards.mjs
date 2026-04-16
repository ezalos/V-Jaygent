// ABOUTME: CPU-side elastic-disk simulation for shader pieces. Integrates
// ABOUTME: position/velocity, handles wall + pairwise collisions, packs flat
// ABOUTME: uniform arrays for upload. Shader side lives in lib/billiards.glsl.

/**
 * Create a billiard-ball simulator.
 *
 * @param {Object}   opts
 * @param {number}   [opts.radius=0.26]       Default ball radius (world units). Used
 *                                            when a ball entry doesn't specify its own.
 * @param {number}   [opts.boundsMargin=0.96] Half-frame margin for walls; balls bounce
 *                                            inside the rectangle [-aspect*m, +aspect*m]
 *                                            × [-m, +m] minus each ball's own radius.
 * @param {number}   [opts.maxDt=0.05]        Integration time-step cap in seconds.
 * @param {number}   [opts.hitDecay=4.0]      Exp-decay rate of the per-ball hit pulse.
 * @param {Array}    [opts.initial]           Initial balls. Each entry may carry
 *                                            `pos:[x,y]`, `vel:[x,y]`, `radius?:number`,
 *                                            `mass?:number`. Radius / mass default to
 *                                            `opts.radius` / 1.0 when omitted.
 *
 * @returns {{
 *   step(nowSec:number, aspect:number): void,
 *   reset(initial:Array, opts?:Object): void,
 *   readonly posArray: Float32Array,
 *   readonly hitArray: Float32Array,
 *   readonly hitPosArray: Float32Array,
 *   readonly radiusArray: Float32Array,
 *   readonly count: number,
 *   readonly balls: Array<{pos:number[], vel:number[], radius:number, mass:number, lastHit:number, lastHitPos:number[]}>,
 * }}
 */
export function createBilliards(opts = {}) {
  let radius       = opts.radius       ?? 0.26;
  let boundsMargin = opts.boundsMargin ?? 0.96;
  let maxDt        = opts.maxDt        ?? 0.05;
  let hitDecay     = opts.hitDecay     ?? 4.0;

  let balls;
  let posFlat, hitFlat, hitPosFlat, radiusFlat;
  let lastStepMs = performance.now();

  const defaults = [
    { pos: [-0.85, -0.42], vel: [ 0.43,  0.31] },
    { pos: [ 0.60,  0.55], vel: [-0.38,  0.27] },
    { pos: [-0.30,  0.70], vel: [ 0.52, -0.40] },
    { pos: [ 0.90, -0.60], vel: [-0.27, -0.47] },
  ];

  function reset(newInitial, newOpts) {
    if (newOpts) {
      if (newOpts.radius       !== undefined) radius       = newOpts.radius;
      if (newOpts.boundsMargin !== undefined) boundsMargin = newOpts.boundsMargin;
      if (newOpts.maxDt        !== undefined) maxDt        = newOpts.maxDt;
      if (newOpts.hitDecay     !== undefined) hitDecay     = newOpts.hitDecay;
    }
    const src = newInitial ?? defaults;
    balls = src.map((b) => ({
      pos:        [b.pos[0], b.pos[1]],
      vel:        [b.vel[0], b.vel[1]],
      radius:     (b.radius !== undefined) ? b.radius : radius,
      mass:       (b.mass   !== undefined) ? b.mass   : 1.0,
      lastHit:    -10,
      lastHitPos: [b.pos[0], b.pos[1]],
    }));
    const n = balls.length;
    posFlat    = new Float32Array(n * 2);
    hitFlat    = new Float32Array(n);
    hitPosFlat = new Float32Array(n * 2);
    radiusFlat = new Float32Array(n);
    for (let i = 0; i < n; i++) radiusFlat[i] = balls[i].radius;
    lastStepMs = performance.now();
  }

  reset(opts.initial ?? null);

  function recordHit(i, nowSec) {
    balls[i].lastHit       = nowSec;
    balls[i].lastHitPos[0] = balls[i].pos[0];
    balls[i].lastHitPos[1] = balls[i].pos[1];
  }

  function step(nowSec, aspect) {
    const nowMs = performance.now();
    const dtRaw = (nowMs - lastStepMs) / 1000;
    lastStepMs  = nowMs;
    const dt = Math.min(Math.max(dtRaw, 0), maxDt);

    const n = balls.length;

    // 1. Integrate + wall collisions. Bounds are per-ball (subtract own radius).
    for (let i = 0; i < n; i++) {
      const b = balls[i];
      const bx = aspect * boundsMargin - b.radius;
      const by = 1.0    * boundsMargin - b.radius;
      b.pos[0] += b.vel[0] * dt;
      b.pos[1] += b.vel[1] * dt;
      if (b.pos[0] >  bx) { b.pos[0] =  bx; b.vel[0] = -Math.abs(b.vel[0]); recordHit(i, nowSec); }
      if (b.pos[0] < -bx) { b.pos[0] = -bx; b.vel[0] =  Math.abs(b.vel[0]); recordHit(i, nowSec); }
      if (b.pos[1] >  by) { b.pos[1] =  by; b.vel[1] = -Math.abs(b.vel[1]); recordHit(i, nowSec); }
      if (b.pos[1] < -by) { b.pos[1] = -by; b.vel[1] =  Math.abs(b.vel[1]); recordHit(i, nowSec); }
    }

    // 2. Ball-ball elastic collisions. Uses sum of radii and per-ball masses.
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = balls[i], bb = balls[j];
        const dx = bb.pos[0] - a.pos[0];
        const dy = bb.pos[1] - a.pos[1];
        const d2 = dx * dx + dy * dy;
        const rSum = a.radius + bb.radius;
        const rr   = rSum * rSum;
        if (d2 < rr && d2 > 1e-8) {
          const d  = Math.sqrt(d2);
          const nx = dx / d, ny = dy / d;
          const overlap = rSum - d;

          // Separate along the normal, weighted inversely by mass — heavier
          // ball barely moves, lighter ball gets shoved back.
          const totalM  = a.mass + bb.mass;
          const shareA  = bb.mass / totalM;     // how much ball a moves
          const shareB  = a.mass  / totalM;     // how much ball b moves
          a.pos[0]  -= nx * overlap * shareA;
          a.pos[1]  -= ny * overlap * shareA;
          bb.pos[0] += nx * overlap * shareB;
          bb.pos[1] += ny * overlap * shareB;

          // 1D elastic collision along the normal, two unequal masses.
          // v1' = ((m1-m2)·v1 + 2·m2·v2) / (m1+m2)
          // v2' = ((m2-m1)·v2 + 2·m1·v1) / (m1+m2)
          const va = a.vel[0] * nx + a.vel[1] * ny;
          const vb = bb.vel[0] * nx + bb.vel[1] * ny;
          const vaNew = ((a.mass - bb.mass) * va + 2 * bb.mass * vb) / totalM;
          const vbNew = ((bb.mass - a.mass) * vb + 2 * a.mass  * va) / totalM;
          const dva   = vaNew - va;
          const dvb   = vbNew - vb;
          a.vel[0]  += dva * nx;  a.vel[1]  += dva * ny;
          bb.vel[0] += dvb * nx;  bb.vel[1] += dvb * ny;

          recordHit(i, nowSec);
          recordHit(j, nowSec);
        }
      }
    }

    // 3. Pack flat uniform arrays.
    for (let i = 0; i < n; i++) {
      posFlat[i * 2]     = balls[i].pos[0];
      posFlat[i * 2 + 1] = balls[i].pos[1];
      hitPosFlat[i * 2]     = balls[i].lastHitPos[0];
      hitPosFlat[i * 2 + 1] = balls[i].lastHitPos[1];
      const age = Math.max(0, nowSec - balls[i].lastHit);
      hitFlat[i] = Math.exp(-age * hitDecay);
    }
  }

  return {
    step,
    reset,
    get posArray()    { return posFlat; },
    get hitArray()    { return hitFlat; },
    get hitPosArray() { return hitPosFlat; },
    get radiusArray() { return radiusFlat; },
    get count()       { return balls.length; },
    get balls()       { return balls; },
  };
}
