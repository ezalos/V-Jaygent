// ABOUTME: Multi-touch ferrofluid sim — up to 8 finger dipoles drive the height
// ABOUTME: field h(x,y), Laplacian smoothing + cubic damping cap Rosensweig spikes.
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
#include "dipole.glsl"

out vec4 fragColor;

// Tuned constants. Same family as pieces/ferrofluid (single-cursor) — with
// 8 dipoles summing into E we keep ALPHA modest, lean on E_CAP to bound
// the singular cores, and let BETA*h³ cap the peaks. DT small enough that
// the substrate is stable under a five-finger chord.
const float D       = 0.20;   // surface tension diffusion
const float G       = 0.05;   // gravity (linear restoring force)
const float ALPHA   = 1.45;   // dipole energy → height coupling
const float BETA    = 4.50;   // cubic damping (peak ceiling)
const float DT      = 0.18;   // sub-step
const float TAU_INV = 0.030;  // slow-tension follow rate
const float E_CAP   = 7.0;    // |B|² cap near singular dipole cores
const float H_HI    = 1.40;
const float H_LO    = -0.20;

// Hex-lattice spike-spacing factor. Real ferrofluid Rosensweig pattern has a
// capillary length λ = 2π√(σ/ρg) — spikes lock to a hex lattice with that
// pitch. Our reduced PDE has no critical wavenumber on its own, so we INJECT
// the length scale by modulating the magnetic forcing with a hex pattern.
// HEX_PERIOD in world units (frame is [-aspect/2, aspect/2] × [-0.5, 0.5]).
// 0.045 → ~22 cells across a 16:9 frame — visible-discrete spike clusters
// without aliasing at half-resolution sim. HEX_FLOOR keeps the inter-spike
// substrate from dying entirely (real ferrofluid still has surface texture
// between cones).
const float HEX_PERIOD = 0.045;
const float HEX_FLOOR  = 0.18;

// Hex lattice value at p — sum of three cosines along axes 60° apart. Peaks
// (=1) at lattice nodes, troughs (=0) between them. Returns [HEX_FLOOR, 1].
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

// Per-finger dipole strength. Fresh touches (age < 0.4s) get a kick so a
// quick tap registers as a discrete spike-burst; settles to a baseline so a
// held finger maintains a stable spike. Age comes from u_touches[i].z.
float fingerStrength(float age) {
    float kick = exp(-age * 6.0) * 0.045;   // <~0.5s burst
    return 0.075 + kick;                     // baseline 0.075
}

// Per-finger moment-vector angle. Each finger's anisotropy rotates at a
// slightly different rate (offset by index phase) so adjacent fingers
// don't spike in lockstep — a five-finger chord shows visible polyrhythm
// in spike orientation.
vec2 fingerMoment(float fi, float t) {
    float ang = t * (0.35 + 0.07 * fi) + fi * 1.7 + 0.5 * sin(t * 0.21 + fi);
    return vec2(cos(ang), sin(ang));
}

void main() {
    vec2 uv    = gl_FragCoord.xy / u_resolution.xy;
    vec2 texel = 1.0 / u_resolution.xy;

    // Cold start — flat surface, no slow-tension memory.
    if (u_frame == 0) {
        fragColor = vec4(0.0);
        return;
    }

    vec4  state = texture(u_state, uv);
    float h     = state.r;
    float slowH = state.g;

    // Aspect-corrected centred frame. Dipole positions live in [-aspect/2,
    // aspect/2] × [-0.5, 0.5] so field math is geometric, independent of
    // simulation resolution.
    float aspect = u_resolution.x / u_resolution.y;
    vec2  p      = (uv - 0.5) * vec2(aspect, 1.0);

    // ---- accumulate field-energy from all active touches -------------
    float E = 0.0;
    for (int i = 0; i < 8; i++) {
        if (i >= u_touch_count) break;
        vec4 t = u_touches[i];
        if (t.w < 0.5) continue;

        // touch xy is in target pixel space (sim target is half-res, so
        // u_resolution here matches the touch space exactly).
        vec2 tN     = t.xy / u_resolution.xy;
        vec2 mWorld = (tN - 0.5) * vec2(aspect, 1.0);

        float fi = float(i);
        vec2  n  = fingerMoment(fi, u_time);
        float q  = fingerStrength(t.z);
        E += dipoleEnergy(p, mWorld, n, q);
    }

    // ---- headless / no-touch fallback --------------------------------
    // When u_touch_count == 0 (e.g. inspect.mjs, idle desktop), self-play
    // with three Lissajous-orbit dipoles. Coprime rates so the trajectory
    // never repeats; tightly-spaced sources lift ambient field high enough
    // for ferrofluid action to stay visible.
    if (u_touch_count == 0) {
        float t = u_time;
        vec2  m1 = 0.32 * vec2(cos(t * 0.19),       sin(t * 0.27 + 1.1));
        vec2  m2 = 0.27 * vec2(cos(t * 0.13 + 2.4), sin(t * 0.21 - 0.5));
        vec2  m3 = 0.21 * vec2(cos(t * 0.31 + 4.7), sin(t * 0.17 + 3.0));
        vec2  n1 = vec2(cos(t * 0.31 + 2.3), sin(t * 0.31 + 2.3));
        vec2  n2 = vec2(cos(t * 0.23 - 1.7), sin(t * 0.23 - 1.7));
        vec2  n3 = vec2(cos(t * 0.41 + 0.8), sin(t * 0.41 + 0.8));
        float qIdle = 0.022;
        E += dipoleEnergy(p, m1, n1, qIdle)
           + dipoleEnergy(p, m2, n2, qIdle * 0.85)
           + dipoleEnergy(p, m3, n3, qIdle * 0.70);
    }

    E = min(E, E_CAP);

    // Inject the missing capillary length scale, AND model the supercritical-
    // pitchfork bifurcation Cowley-Rosensweig actually predicts: smooth
    // flat-fluid phase below the critical field strength, hex-modulated
    // spike phase above. The smoothstep gives a clean threshold without a
    // hard discontinuity (which would alias). Below E_CRIT the substrate
    // stays smooth; above, the hex lattice pins spike formation at the
    // capillary-length pitch.
    const float E_CRIT = 0.32;
    float spikePhase = smoothstep(E_CRIT, E_CRIT * 1.7, E);
    E = mix(E, E * hexLattice(p), spikePhase);

    // ---- Cowley-Rosensweig height-field update -----------------------
    //   dh/dt = D*lap(h)  -  G*h  +  alpha*|B|^2  -  beta*h^3
    float lap = laplacian(u_state, uv, texel, 0);
    float dh  = D * lap - G * h + ALPHA * E - BETA * h * h * h;
    h = clamp(h + DT * dh, H_LO, H_HI);

    // Slow-tension memory — display uses this to brighten "spike trails"
    // so the path of a moving finger leaves a glowing residue (~2s).
    slowH += TAU_INV * (h - slowH);

    fragColor = vec4(h, slowH, E, 1.0);
}
