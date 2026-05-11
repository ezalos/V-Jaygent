// ABOUTME: Sim for a levitating ferrofluid sphere — h(p) is outward displacement
// ABOUTME: of the sphere's silhouette; fingers act as magnets pulling spikes out.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec4      u_touches[8];
uniform int       u_touch_count;
uniform int       u_frame;
uniform sampler2D u_state;

#include "diffusion.glsl"
#include "math.glsl"

out vec4 fragColor;

// PDE constants. h represents outward radial displacement of the sphere
// surface; finger magnets pull h up locally; surface tension diffuses;
// gravity (toward zero) makes the surface relax back to a smooth sphere
// when no finger is pulling.
const float D       = 0.16;   // surface tension
const float G       = 0.32;   // restoring force toward smooth sphere
const float ALPHA   = 1.10;   // forcing → displacement coupling
const float BETA    = 3.20;   // cubic damping on spike protrusions
const float DT      = 0.20;
const float TAU_INV = 0.030;
const float E_CAP   = 4.0;
const float H_HI    = 1.20;
const float H_LO    = -0.05;

// The levitating sphere's resting radius, in world units (frame is
// [-aspect/2, aspect/2] × [-0.5, 0.5]). 0.064 = small core; the
// ferrofluid spikes radiate outward several times the core radius
// when magnets are pulling, like an iron-filing sea urchin.
const float R_BALL  = 0.064;

// Hex-lattice spike-spacing factor — tighter than the larger-ball
// version so the small spikes still resolve as a discrete hex pattern.
const float HEX_PERIOD = 0.022;
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

// Tight Gaussian magnet pull — fingers create a localized field. With a
// 5x smaller ball, the Gaussian sigma is also tighter so the pull
// resolves on the small core without smearing across the whole canvas.
float magnetPull(vec2 p, vec2 src, float strength) {
    vec2  d  = p - src;
    float r2 = dot(d, d);
    return strength * exp(-r2 * 280.0);
}

// Rim activity factor — concentrates forcing on the thin annulus around
// the small ball, so spike protrusions grow from the surface (not deep
// inside the core or far in empty space). Annulus thickness scales with
// the new R_BALL.
float rimBand(float r) {
    float inner = smoothstep(R_BALL - 0.04, R_BALL - 0.005, r);
    float outer = 1.0 - smoothstep(R_BALL + 0.03, R_BALL + 0.16, r);
    return inner * outer;
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
    float r      = length(p);

    // ---- finger magnets --------------------------------------------
    // Each finger is a magnet held NEAR the ball; pulls a spike out of
    // the surface in the finger's direction. We track the closest
    // finger distance to gate the hex spike modulation under each
    // magnet specifically (canonical Rosensweig).
    float E       = 0.0;
    float minDist = 99.0;

    for (int i = 0; i < 8; i++) {
        if (i >= u_touch_count) break;
        vec4 t = u_touches[i];
        if (t.w < 0.5) continue;

        vec2  tN    = t.xy / u_resolution.xy;
        vec2  srcW  = (tN - 0.5) * vec2(aspect, 1.0);
        float fresh = exp(-t.z * 5.0);
        float q     = 1.50 + 0.80 * fresh;

        E      += magnetPull(p, srcW, q);
        minDist = min(minDist, length(p - srcW));
    }

    // ---- headless / no-touch fallback --------------------------------
    // FOUR evenly-distributed orbiters travel just outside the sphere
    // boundary at slightly different angular rates. With the small core
    // and four phases, every inspect frame shows spikes on multiple
    // sides simultaneously — the iconic iron-filing-around-magnet look.
    // The slow phase mismatch means the orbiters bunch and spread over
    // time so the spike pattern is never static.
    if (u_touch_count == 0) {
        float t  = u_time;
        float Ro = R_BALL + 0.05;
        // Base phases evenly spaced (0, π/2, π, 3π/2) plus slight rate
        // mismatch per orbiter so they drift relative to each other.
        vec2 m1 = Ro * vec2(cos(t * 0.38 + 0.000), sin(t * 0.38 + 0.000));
        vec2 m2 = Ro * vec2(cos(t * 0.31 + 1.571), sin(t * 0.31 + 1.571));
        vec2 m3 = Ro * vec2(cos(t * 0.45 + 3.142), sin(t * 0.45 + 3.142));
        vec2 m4 = Ro * vec2(cos(t * 0.27 + 4.712), sin(t * 0.27 + 4.712));
        E      += magnetPull(p, m1, 1.20);
        E      += magnetPull(p, m2, 1.10);
        E      += magnetPull(p, m3, 1.00);
        E      += magnetPull(p, m4, 0.95);
        minDist = min(minDist, length(p - m1));
        minDist = min(minDist, length(p - m2));
        minDist = min(minDist, length(p - m3));
        minDist = min(minDist, length(p - m4));
    }

    // Concentrate forcing on the rim band — h doesn't grow deep inside
    // the ball or far away in empty space.
    E *= rimBand(r);
    E  = min(E, E_CAP);

    // Supercritical pitchfork — hex spike modulation only fires under a
    // magnet (by minDist) AND above critical field strength. Tighter
    // proximity gate than the larger-ball version so each magnet's
    // spike cluster stays compact at the small scale.
    float spikeProximity = exp(-minDist * 28.0);
    const float E_CRIT   = 0.55;
    float spikePhase     = smoothstep(E_CRIT, E_CRIT * 1.5, E) * spikeProximity;
    E = mix(E, E * hexLattice(p), spikePhase);

    // ---- height-field PDE -------------------------------------------
    // Same Cowley-Rosensweig reduced model. h relaxes to zero (smooth
    // sphere) when no magnet is pulling; cubic damping on positive-h
    // caps spike heights.
    float spike = max(h, 0.0);
    float lap   = laplacian(u_state, uv, texel, 0);
    float dh    = D * lap - G * h + ALPHA * E - BETA * spike * spike * spike;
    h = clamp(h + DT * dh, H_LO, H_HI);

    slowH += TAU_INV * (h - slowH);

    fragColor = vec4(h, slowH, E, 1.0);
}
