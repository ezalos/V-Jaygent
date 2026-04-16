// ABOUTME: CPU-side elastic-disk simulation for shader pieces. Integrates
// ABOUTME: position/velocity, handles wall + pairwise collisions, packs flat
// ABOUTME: uniform arrays for upload. Shader side lives in lib/billiards.glsl.

/**
 * Create a billiard-ball simulator.
 *
 * @param {Object}   opts
 * @param {number}   [opts.radius=0.26]       Collision + render radius in world units.
 *                                            MUST match the shader-side disk radius.
 * @param {number}   [opts.boundsMargin=0.96] Half-frame margin for walls; balls bounce
 *                                            inside the rectangle [-aspect*m, +aspect*m]
 *                                            × [-m, +m].
 * @param {number}   [opts.maxDt=0.05]        Integration time-step cap in seconds.
 *                                            Protects against paused-tab teleport.
 * @param {number}   [opts.hitDecay=4.0]      Exp-decay rate of the per-ball hit pulse;
 *                                            higher = shorter flash.
 * @param {Array}    [opts.initial]           Initial balls: `[{pos:[x,y], vel:[x,y]}, ...]`.
 *                                            Defaults to 4 balls with varied velocities.
 *
 * @returns {{
 *   step(nowSec:number, aspect:number): void,
 *   readonly posArray: Float32Array,
 *   readonly hitArray: Float32Array,
 *   readonly count: number,
 *   readonly radius: number,
 *   readonly balls: Array<{pos:number[], vel:number[], lastHit:number}>,
 * }}
 */
export function createBilliards({
  radius       = 0.26,
  boundsMargin = 0.96,
  maxDt        = 0.05,
  hitDecay     = 4.0,
  initial      = null,
} = {}) {
  const defaults = [
    { pos: [-0.85, -0.42], vel: [ 0.43,  0.31] },
    { pos: [ 0.60,  0.55], vel: [-0.38,  0.27] },
    { pos: [-0.30,  0.70], vel: [ 0.52, -0.40] },
    { pos: [ 0.90, -0.60], vel: [-0.27, -0.47] },
  ];
  const src = initial ?? defaults;
  const balls = src.map((b) => ({
    pos: [b.pos[0], b.pos[1]],
    vel: [b.vel[0], b.vel[1]],
    lastHit:    -10,
    // Position at the moment of the most-recent wall or ball-ball contact.
    // Snapshotted separately from pos so pieces that draw shockwaves can
    // anchor them where the collision happened, not follow the ball afterwards.
    lastHitPos: [b.pos[0], b.pos[1]],
  }));
  const n           = balls.length;
  const posFlat     = new Float32Array(n * 2);
  const hitFlat     = new Float32Array(n);
  const hitPosFlat  = new Float32Array(n * 2);
  let lastStepMs    = performance.now();

  // Record the collision point for ball i (called from inside step on each
  // wall hit and ball-ball impact).
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

    const boundsX = aspect * boundsMargin - radius;
    const boundsY = 1.0    * boundsMargin - radius;

    // 1. Integrate + wall collisions.
    for (let i = 0; i < n; i++) {
      const b = balls[i];
      b.pos[0] += b.vel[0] * dt;
      b.pos[1] += b.vel[1] * dt;
      if (b.pos[0] >  boundsX) { b.pos[0] =  boundsX; b.vel[0] = -Math.abs(b.vel[0]); recordHit(i, nowSec); }
      if (b.pos[0] < -boundsX) { b.pos[0] = -boundsX; b.vel[0] =  Math.abs(b.vel[0]); recordHit(i, nowSec); }
      if (b.pos[1] >  boundsY) { b.pos[1] =  boundsY; b.vel[1] = -Math.abs(b.vel[1]); recordHit(i, nowSec); }
      if (b.pos[1] < -boundsY) { b.pos[1] = -boundsY; b.vel[1] =  Math.abs(b.vel[1]); recordHit(i, nowSec); }
    }

    // 2. Ball-ball elastic collisions, equal mass, naive O(n²) — n is small.
    const rr = (radius * 2) * (radius * 2);
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = balls[i], bb = balls[j];
        const dx = bb.pos[0] - a.pos[0];
        const dy = bb.pos[1] - a.pos[1];
        const d2 = dx * dx + dy * dy;
        if (d2 < rr && d2 > 1e-8) {
          const d  = Math.sqrt(d2);
          const nx = dx / d, ny = dy / d;
          const overlap = radius * 2 - d;
          // Separate so they're exactly touching.
          a.pos[0]  -= nx * overlap * 0.5;
          a.pos[1]  -= ny * overlap * 0.5;
          bb.pos[0] += nx * overlap * 0.5;
          bb.pos[1] += ny * overlap * 0.5;
          // Swap normal-component velocity (elastic, equal mass).
          const va = a.vel[0] * nx + a.vel[1] * ny;
          const vb = bb.vel[0] * nx + bb.vel[1] * ny;
          const dv = vb - va;
          a.vel[0]  += dv * nx;  a.vel[1]  += dv * ny;
          bb.vel[0] -= dv * nx;  bb.vel[1] -= dv * ny;
          recordHit(i, nowSec);
          recordHit(j, nowSec);
        }
      }
    }

    // 3. Pack flat uniform arrays; hit pulse decays exponentially.
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
    get posArray()    { return posFlat; },
    get hitArray()    { return hitFlat; },
    get hitPosArray() { return hitPosFlat; },
    get count()       { return n; },
    get radius()      { return radius; },
    get balls()       { return balls; },
  };
}
