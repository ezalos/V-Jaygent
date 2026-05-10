// ABOUTME: Ferrofluid simulation pass — height field h(x,y) under a cursor
// ABOUTME: dipole + procedural idle dipole, Laplacian smoothing, cubic damping.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec2      u_mouse;
uniform float     u_audio_bass;
uniform float     u_audio_mid;
uniform int       u_frame;
uniform sampler2D u_state;

#include "diffusion.glsl"
#include "math.glsl"
#include "dipole.glsl"

out vec4 fragColor;

// Diffusion + relaxation constants. Tuned for visible Rosensweig spikes
// at half-resolution with 8 sub-iterations per frame. The DT is small
// enough that even with ALPHA*E_max as the drive, h doesn't overshoot
// past the BETA*h³ damping band; the explicit post-update clamp on h
// is a belt-and-braces guard against the dipole core going to infinity.
const float D       = 0.20;   // surface tension diffusion coefficient
const float G       = 0.05;   // gravity (linear restoring force)
const float ALPHA   = 1.80;   // dipole energy → height coupling
const float BETA    = 4.50;   // cubic damping (peak ceiling)
const float DT      = 0.18;   // sub-step timestep
const float TAU_INV = 0.030;  // slow-tension follow rate
const float E_CAP   = 6.0;    // |B|² ceiling near singular cores
const float H_HI    = 1.40;   // post-update clamp ceiling
const float H_LO    = -0.20;  // post-update clamp floor

void main() {
    vec2 uv    = gl_FragCoord.xy / u_resolution.xy;
    vec2 texel = 1.0 / u_resolution.xy;

    // Cold start: flat surface, no slow-tension memory. The simulate pass
    // runs all `iterations` sub-steps on frame 0 with the same
    // initial-state branch, so both ping-pong textures end up holding
    // zero — a true mirror-flat starting condition.
    if (u_frame == 0) {
        fragColor = vec4(0.0);
        return;
    }

    vec4  state = texture(u_state, uv);
    float h     = state.r;
    float slowH = state.g;

    // Aspect-corrected centred coordinate frame [-aspect/2, aspect/2] ×
    // [-0.5, 0.5]. Dipole positions live in this frame so the field math
    // is geometric — independent of the simulation resolution.
    float aspect = u_resolution.x / u_resolution.y;
    vec2  p      = (uv - 0.5) * vec2(aspect, 1.0);

    // ---- cursor dipole ------------------------------------------------
    // Mouse=(0,0) is the runtime's idle sentinel. When idle, kill the
    // cursor dipole entirely (q=0); the procedural idle dipoles below
    // handle self-play.
    bool  mouseIdle = (u_mouse.x == 0.0 && u_mouse.y == 0.0);
    vec2  mN        = u_mouse / u_resolution.xy;
    vec2  mWorld    = (mN - 0.5) * vec2(aspect, 1.0);

    // Dipole moment direction rotates on u_time. Pure radial forcing
    // would dimple a circle and read as boring; rotating n sweeps the
    // anisotropy across the surface so spikes form along a moving
    // azimuth.
    float ang     = u_time * 0.42 + 0.7 * sin(u_time * 0.21);
    vec2  nCursor = vec2(cos(ang), sin(ang));
    float qCursor = mouseIdle ? 0.0 : (0.060 + 0.030 * u_audio_bass);

    // ---- procedural idle dipoles -------------------------------------
    // Three orbits at coprime rates so the trajectory never repeats and
    // the field covers most of the screen. Without three sources, the
    // single-dipole field falls off as 1/r⁴ in energy and most of the
    // screen reads dead-flat — three tightly-spaced sources lift the
    // ambient field high enough that ferrofluid action stays visible
    // even with the cursor parked at the idle sentinel.
    float t = u_time;
    vec2  m1 = 0.32 * vec2(cos(t * 0.19),       sin(t * 0.27 + 1.1));
    vec2  m2 = 0.27 * vec2(cos(t * 0.13 + 2.4), sin(t * 0.21 - 0.5));
    vec2  m3 = 0.21 * vec2(cos(t * 0.31 + 4.7), sin(t * 0.17 + 3.0));
    vec2  n1 = vec2(cos(t * 0.31 + 2.3), sin(t * 0.31 + 2.3));
    vec2  n2 = vec2(cos(t * 0.23 - 1.7), sin(t * 0.23 - 1.7));
    vec2  n3 = vec2(cos(t * 0.41 + 0.8), sin(t * 0.41 + 0.8));
    float qIdle = 0.038 + 0.022 * u_audio_mid;

    // ---- field-energy density at this pixel --------------------------
    float E = dipoleEnergy(p, mWorld, nCursor, qCursor)
            + dipoleEnergy(p, m1, n1, qIdle)
            + dipoleEnergy(p, m2, n2, qIdle * 0.85)
            + dipoleEnergy(p, m3, n3, qIdle * 0.70);
    E = min(E, E_CAP);   // numerical clamp near singularities

    // ---- height-field update -----------------------------------------
    // Sample the Laplacian on channel 0 (.r = h). Surface tension wants
    // smoothness, gravity pulls h toward zero, dipole energy pushes h
    // up, and the cubic damping caps the peaks before they integrate to
    // infinity at the singular core.
    float lap = laplacian(u_state, uv, texel, 0);
    float dh  = D * lap - G * h + ALPHA * E - BETA * h * h * h;
    h = clamp(h + DT * dh, H_LO, H_HI);   // belt-and-braces against blowup

    // Slow-tension memory follows h on a long time constant. Display
    // uses this to brighten "spike trails" — the visual residue of the
    // cursor's recent path, fading over a couple of seconds.
    slowH += TAU_INV * (h - slowH);

    fragColor = vec4(h, slowH, E, 1.0);
}
