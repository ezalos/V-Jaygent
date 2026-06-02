// ABOUTME: Aurora sim pass — Stam advection of a scalar dye field through a
// ABOUTME: curl-noise velocity field. Cursor injects rotational velocity (swirl).
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec2      u_mouse;
uniform int       u_frame;
uniform sampler2D u_state;

#include "noise.glsl"

out vec4 fragColor;

// ------- velocity field -------

// Streamfunction psi(p, t): 2-octave fbm with slow time drift.
// Curl-noise: v = (dpsi/dy, -dpsi/dx). Sampled by finite difference so we don't
// need analytic derivatives. Divergence-free by construction (Bridson 2007).
float streamfn(vec2 p, float t) {
    return fbmGrid(p * 1.5 + vec2(0.0, 0.13 * t)) + 0.45 * fbmGrid(p * 3.7 - vec2(0.07 * t, 0.0));
}

vec2 curlVelocity(vec2 p, float t) {
    float h = 0.02;
    float dpsi_dx = (streamfn(p + vec2(h, 0.0), t) - streamfn(p - vec2(h, 0.0), t)) / (2.0 * h);
    float dpsi_dy = (streamfn(p + vec2(0.0, h), t) - streamfn(p - vec2(0.0, h), t)) / (2.0 * h);
    // v = (dpsi/dy, -dpsi/dx) — curl in 2D
    vec2 v = vec2(dpsi_dy, -dpsi_dx);
    // Slight downward bias so dye from the top source band advects DOWN
    // across the frame (otherwise it pools at the top, failing composition
    // probe). Magnitude small relative to curl velocity so the curling
    // motion still dominates the look.
    v.y -= 0.18;
    return v;
}

// Cursor swirl: rotational velocity field around the mouse, Gaussian falloff.
// Returns added velocity contribution. When mouse is idle (0,0), the caller
// avoids invoking this entirely.
vec2 cursorSwirl(vec2 worldP, vec2 mouseWorld) {
    vec2 d = worldP - mouseWorld;
    float r2 = dot(d, d);
    float sigma = 0.18;
    float falloff = exp(-r2 / (sigma * sigma));
    // perpendicular to d, magnitude scaled by falloff. Sign = counterclockwise.
    vec2 perp = vec2(-d.y, d.x);
    return 2.4 * perp * falloff;
}

bool mouseIdle(vec2 mp) {
    return mp.x == 0.0 && mp.y == 0.0;
}

// Aspect-corrected world coords from a fragment uv in [0,1].
vec2 toWorld(vec2 uv01) {
    return (uv01 - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0) * 2.0;
}

void main() {
    vec2 uv    = gl_FragCoord.xy / u_resolution.xy;

    // ----- frame-0 seed -----
    // Seed with a soft horizontal band of density near the top of the frame.
    // This is the "dusk-sky source band" — the field re-injects here each
    // frame anyway, but a frame-0 seed avoids a black flash.
    if (u_frame == 0) {
        vec2 p = toWorld(uv);
        // Top band centred at y ~ 0.55, width ~0.35
        float band = exp(-pow((p.y - 0.55) / 0.35, 2.0));
        // Modulated by low-freq noise so it's not a flat stripe
        float mod_ = 0.5 + 0.5 * vnoise(p * 1.8);
        float seed = band * mod_ * 0.7;
        fragColor = vec4(seed, 0.0, 0.0, 1.0);
        return;
    }

    // ----- Stam advection step -----
    // Velocity at this fragment in world coords:
    vec2 worldP = toWorld(uv);
    vec2 vel    = curlVelocity(worldP, u_time);

    // Cursor swirl additive velocity (only when cursor is active).
    if (!mouseIdle(u_mouse)) {
        vec2 mouseUV    = u_mouse / u_resolution.xy;
        vec2 mouseWorld = toWorld(mouseUV);
        vel += cursorSwirl(worldP, mouseWorld);
    }

    // Backward-trace lookup: sample density at (uv - vel·dt) and copy here.
    // dt scaled to a fraction of the canvas — too high gives crawling
    // artifacts, too low gives no motion. World vel has scale ~1 (fbm domain),
    // so converting back to uv-space divides by aspect.
    float dt   = 0.012;
    vec2 trace = vec2(vel.x / (u_resolution.x / u_resolution.y), vel.y);
    vec2 srcUV = uv - trace * dt;
    // Wrap edges so ribbons drifting off the side reappear (no hard boundary).
    srcUV = fract(srcUV);

    float prev = texture(u_state, srcUV).r;

    // ----- source: top band + roaming mid-frame patches -----
    // Continuously inject dye in two source zones. Without this, decay drains
    // the field; with a single top band, composition pools at the top.
    vec2  p     = toWorld(uv);
    // Top band centred at y ~ 0.45 (slightly lower than seed) so combined
    // with the downward bias dye reaches mid-frame.
    float bandTop = exp(-pow((p.y - 0.45) / 0.30, 2.0));
    float plumeTop = smoothstep(0.45, 0.85, vnoise(p * 1.4 + vec2(0.18 * u_time, 0.0)));
    // A second roaming source patch — wider in y, gated by a 3D-ish noise
    // so it appears/disappears at random locations across the frame. This
    // is what gives the lower half visible ribbon activity.
    // Sparse roaming patches: high threshold so only the brightest 15-20% of
    // noise samples produce a source. This is what makes ribbons APPEAR in
    // localized regions and drift, instead of injecting density everywhere.
    float roam = smoothstep(0.74, 0.96, vnoise(p * 1.05 + vec2(0.11 * u_time, -0.07 * u_time)));
    // Source amplitudes tuned for "few visible ribbons", not marbled fog.
    // Higher roam threshold + lower amplitudes mean dye injects in localized
    // patches, advects, decays. Sparse density = visible empty sky between
    // ribbons.
    float source = bandTop * plumeTop * 0.012 + roam * 0.014;

    // ----- decay -----
    // 0.985/frame — half-life ~46 frames ~0.77s at 60fps. Stronger decay so
    // dye doesn't accumulate into a filled-frame haze. Ribbons live long
    // enough to advect visibly but old density clears before pooling.
    float decay = 0.985;

    float density = prev * decay + source;
    density = clamp(density, 0.0, 1.0);

    fragColor = vec4(density, 0.0, 0.0, 1.0);
}
