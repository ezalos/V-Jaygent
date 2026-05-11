// ABOUTME: Ferrohands sim — central ferrofluid drop, fingers act as magnets that
// ABOUTME: bulge the drop toward them and erupt Rosensweig spike protrusions.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec4      u_touches[8];   // xy = px in target space, z = age_s, w = active
uniform int       u_touch_count;
uniform int       u_frame;
uniform sampler2D u_state;

#include "diffusion.glsl"
#include "math.glsl"

out vec4 fragColor;

// Surface tension + gravity tuning. The drop's BODY is held at reservoir(p)
// by a strong gravity-toward-rest term; cubic damping only caps SPIKES
// (the part of h that protrudes above the body), so the body itself can
// settle at reservoir without the cubic ceiling fighting it.
const float D       = 0.18;   // surface tension diffusion
const float G       = 0.55;   // gravity-toward-rest (strong, snaps body to reservoir)
const float ALPHA   = 1.20;   // forcing → height coupling
const float BETA    = 3.50;   // cubic damping on (h - rest), caps spike protrusions
const float DT      = 0.18;
const float TAU_INV = 0.030;
const float E_CAP   = 4.0;
const float H_HI    = 1.80;
const float H_LO    = -0.10;

// Hex-lattice spike-spacing factor (capillary length scale). Same trick as
// the previous version, but now only the SPIKE PROTRUSION layer is
// modulated — the puddle body stays smooth (real ferrofluid drops are
// smooth except where the magnetic field pulls spikes out of them).
const float HEX_PERIOD = 0.040;
const float HEX_FLOOR  = 0.20;

float hexLattice(vec2 p) {
    float k  = TAU / HEX_PERIOD;
    vec2  a1 = vec2(1.0, 0.0);
    vec2  a2 = vec2(0.5,  0.86602540);
    vec2  a3 = vec2(-0.5, 0.86602540);
    float s  = (cos(k * dot(p, a1))
              + cos(k * dot(p, a2))
              + cos(k * dot(p, a3))) / 3.0;
    return mix(HEX_FLOOR, 1.0, 0.5 + 0.5 * s);
}

// Central reservoir — defines the drop's REST SHAPE (where h wants to sit
// when no fingers are pulling). Used in the gravity term: h relaxes
// toward reservoir(p) instead of toward zero. Soft bowl strong in the
// middle, falls smoothly to zero at the rim.
//
// Critical: reservoir is the BODY of the drop, not part of the magnetic
// forcing. Magnetic forcing only comes from fingers — that way spikes
// fire only where a finger is, not everywhere on the drop.
float reservoir(vec2 p) {
    float r = length(p);
    float bowl = smoothstep(0.30, 0.06, r);
    return bowl * 0.85;   // baseline drop thickness
}

// Per-source magnetic pull — a tight Gaussian, NOT 1/r². Real magnets'
// field decays as 1/r³ and the relevant pattern-forming forcing decays
// even faster, so a Gaussian gives the "spike cluster directly under
// each finger" look without the body dragging across the whole canvas.
// Width scaled so a finger lifts h dramatically within ~0.06 world units
// and is essentially zero past 0.15.
float magnetPull(vec2 p, vec2 src, float strength) {
    vec2  d = p - src;
    float r2 = dot(d, d);
    return strength * exp(-r2 * 110.0);
}

void main() {
    vec2 uv    = gl_FragCoord.xy / u_resolution.xy;
    vec2 texel = 1.0 / u_resolution.xy;

    if (u_frame == 0) {
        fragColor = vec4(0.0);
        return;
    }

    vec4  state = texture(u_state, uv);
    float h     = state.r;
    float slowH = state.g;

    float aspect = u_resolution.x / u_resolution.y;
    vec2  p      = (uv - 0.5) * vec2(aspect, 1.0);

    // ---- magnetic pull from each touch -------------------------------
    // Each finger is a magnet held above the petri dish. The pull is
    // radial (Coulomb 1/r²), reaching across the drop to deform its
    // boundary. The closest-finger distance is tracked separately —
    // it's what gates the SPIKE phase below (spikes erupt directly
    // under each finger, not everywhere the pull-field reaches).
    float E       = 0.0;
    float minDist = 99.0;   // distance to nearest active finger

    for (int i = 0; i < 8; i++) {
        if (i >= u_touch_count) break;
        vec4 t = u_touches[i];
        if (t.w < 0.5) continue;

        vec2 tN   = t.xy / u_resolution.xy;
        vec2 srcW = (tN - 0.5) * vec2(aspect, 1.0);

        float fresh = exp(-t.z * 5.0);
        float q     = 1.40 + 0.80 * fresh;   // big — Gaussian peak is now ~q
        E      += magnetPull(p, srcW, q);
        minDist = min(minDist, length(p - srcW));
    }

    // ---- headless / no-touch fallback --------------------------------
    if (u_touch_count == 0) {
        // Orbiters trace tight paths INSIDE the drop body (reservoir bowl
        // extends to r≈0.30) so the spike clusters form on top of the
        // visible puddle, not in empty sky.
        float t = u_time;
        vec2 m1 = 0.16 * vec2(cos(t * 0.21),       sin(t * 0.27 + 1.2));
        vec2 m2 = 0.13 * vec2(cos(t * 0.17 + 2.4), sin(t * 0.19 - 0.5));
        E      += magnetPull(p, m1, 1.20);
        E      += magnetPull(p, m2, 1.00);
        minDist = min(minDist, length(p - m1));
        minDist = min(minDist, length(p - m2));
    }

    E = min(E, E_CAP);

    // ---- supercritical pitchfork: hex spikes only DIRECTLY UNDER
    // each finger. Real Rosensweig spikes form where the held magnet
    // is, not everywhere its field reaches. spikeProximity falls off
    // sharply with distance to the nearest finger — at minDist > 0.10
    // (world units) the spike modulation is essentially off, so the
    // drop body stays smooth and only the area immediately under each
    // finger erupts in hex cones.
    float spikeProximity = exp(-minDist * 16.0);
    const float E_CRIT   = 0.55;
    float spikePhase     = smoothstep(E_CRIT, E_CRIT * 1.6, E) * spikeProximity;
    E = mix(E, E * hexLattice(p), spikePhase);

    // ---- height-field PDE: gravity pulls h toward the RESERVOIR shape,
    // and cubic damping only acts on the SPIKE portion (h above rest).
    // This way the drop body sits at reservoir without the cubic
    // ceiling fighting gravity, and spikes erupting above the body
    // still get capped.
    //   dh/dt = D·lap(h) − G·(h − rest) + α·E − β·max(h−rest, 0)³
    float rest  = reservoir(p);
    float spike = max(h - rest, 0.0);
    float lap   = laplacian(u_state, uv, texel, 0);
    float dh    = D * lap - G * (h - rest) + ALPHA * E - BETA * spike * spike * spike;
    h = clamp(h + DT * dh, H_LO, H_HI);

    slowH += TAU_INV * (h - slowH);

    fragColor = vec4(h, slowH, E, 1.0);
}
