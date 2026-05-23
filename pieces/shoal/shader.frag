// ABOUTME: shoal — Lyapunov chaos map of the double pendulum, single-pass.
// ABOUTME: each pixel is an initial (θ1, θ2); brightness = log-divergence of a twin.
#version 300 es
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "interaction.glsl"
#include "tonemap.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_bass;
uniform float u_audio_high;
uniform float u_keys[15];
uniform float u_key_event[15];

out vec4 fragColor;

// Warm ramp: near-black → wine → ember → amber → gold → cream.
vec3 warmRamp(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.020, 0.012, 0.022);
    vec3 c1 = vec3(0.34, 0.07, 0.12);
    vec3 c2 = vec3(0.78, 0.21, 0.08);
    vec3 c3 = vec3(0.97, 0.46, 0.13);
    vec3 c4 = vec3(1.00, 0.76, 0.34);
    vec3 c5 = vec3(1.00, 0.96, 0.86);
    float s = t * 5.0;
    if (s < 1.0) return mix(c0, c1, s);
    if (s < 2.0) return mix(c1, c2, s - 1.0);
    if (s < 3.0) return mix(c2, c3, s - 2.0);
    if (s < 4.0) return mix(c3, c4, s - 3.0);
    return mix(c4, c5, s - 4.0);
}

// Canonical Hamiltonian double pendulum (m = l = 1, gravity g).
// state = (θ1, θ2, p1, p2). See basins-of-attraction.md Recipe 4.
vec4 deriv(vec4 s, float g) {
    float d  = s.x - s.y;
    float cd = cos(d);
    float sd = sin(d);
    float k  = 6.0 / (16.0 - 9.0 * cd * cd);
    float dt1 = k * (2.0 * s.z - 3.0 * cd * s.w);
    float dt2 = k * (8.0 * s.w - 3.0 * cd * s.z);
    float eb  = dt1 * dt2 * sd;
    return vec4(dt1, dt2,
                -0.5 * (3.0 * g * sin(s.x) + eb),
                -0.5 * (      g * sin(s.y) - eb));
}

vec4 rk4(vec4 s, float dt, float g) {
    vec4 k1 = deriv(s, g);
    vec4 k2 = deriv(s + 0.5 * dt * k1, g);
    vec4 k3 = deriv(s + 0.5 * dt * k2, g);
    vec4 k4 = deriv(s + dt * k3, g);
    return s + (dt / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4);
}

void main() {
    vec2 res = u_resolution;
    vec2 uv  = gl_FragCoord.xy / res;

    // Phase-space pan + zoom drift — the pixel-to-state map evolves
    // with u_time so the basin field visibly reorganises between
    // frames. Without this the map is frozen (the v1 failure mode).
    // Pan period ~100s, zoom period ~150s; both slow enough to read
    // as drift, fast enough that inspect frames differ meaningfully.
    float zoom = 1.0 + 0.35 * sin(u_time * 0.040);
    vec2  pan  = vec2(1.2 * sin(u_time * 0.060),
                      0.7 * cos(u_time * 0.050));
    float t1 = (uv.x - 0.5) * PI * 1.78 * zoom + pan.x;
    float t2 = (uv.y - 0.5) * PI        * zoom + pan.y;

    // --- inputs: parameters from cursor / keys / audio ---
    vec2 mw = vjMouseWorldOrZero(u_mouse, res);   // (0,0) when idle
    // Strong gravity oscillation — the KAM island grows under low g
    // and shrinks under high g, so the basin structure itself breathes
    // (not just the pixel hue). Period ~70s; the field is unrecognisable
    // between the low-g and high-g extrema.
    float gOsc = 0.5 + 0.5 * sin(u_time * 0.090);
    float gravity = mix(4.0, 16.0, gOsc) + 4.0 * mw.y + 3.0 * u_audio_bass;
    gravity = clamp(gravity, 1.0, 22.0);
    float p1_kick = 0.60 * mw.x;

    // keyboard: each of 15 keys adds a distinct signed initial-momentum
    // impulse. Per-key distinct (key index drives both magnitude and sign).
    float p1_extra = 0.0;
    float p2_extra = 0.0;
    for (int i = 0; i < 15; i++) {
        float w = u_keys[i] + 0.55 * u_key_event[i];
        p1_extra += w * (float(i) / 14.0 - 0.5) * 1.10;
        p2_extra += w * sin(float(i) * 1.7)    * 0.55;
    }

    // --- twin-trajectory Lyapunov: integrate two nearby states; the log
    // of their final separation, normalised by integration time, is the
    // (fixed-horizon) Lyapunov exponent estimate. KAM-stable: ≈ 0.
    // Chaotic: 1 – 3 / s. Cheap-out: no re-normalisation; the short
    // horizon prevents saturation.
    vec4 sA = vec4(t1, t2, p1_kick + p1_extra, p2_extra);
    vec4 sB = sA + vec4(0.7e-4, 0.7e-4, 0.0, 0.0);   // perturb both angles
    const float dt = 0.065;
    const int   N  = 30;
    for (int i = 0; i < N; i++) {
        sA = rk4(sA, dt, gravity);
        sB = rk4(sB, dt, gravity);
    }
    float sep   = length(sB - sA);
    float lyap  = log(max(sep, 1.0e-12) / 1.0e-4) / (float(N) * dt);
    float chaos = smoothstep(0.3, 2.0, lyap);   // 0 stable → 1 chaotic (sharper)

    // State hue from initial (θ1, θ2). cos(t1) is L/R-symmetric so the
    // hue carries no horizontal brightness bias (chaos vortices on left
    // and right read at the same baseline L); sin(t2 + phase) breaks
    // vertical mirror so top/bottom differ.
    float hueT = 0.5 + 0.20 * cos(t1 * 0.7) + 0.20 * sin(t2 * 0.7 + 0.3);
    hueT = clamp(hueT, 0.0, 1.0);
    hueT = mix(0.40, 0.90, hueT);

    // 0.30 floor keeps stable KAM islands visible as soft colour, while
    // chaotic regions overshoot toward cream — the lead-always-on rule
    // (max(silhouette*0.30, accent)) applied to a full-frame field.
    vec3 col = warmRamp(hueT) * (0.30 + 0.80 * chaos);

    // sub-beat shimmer — always-on micro motion
    float sh = (vnoise(uv * 38.0 + u_time * 4.0) - 0.5)
             * 0.05 * (0.5 + 0.8 * u_audio_high);

    // slow composition envelope so the frame is never literally static
    col *= 0.85 + 0.15 * sin(u_time * 0.08 + (uv.x - 0.5) * 1.2);

    col = max(col + vec3(sh), vec3(0.0));
    fragColor = vec4(reinhard(col), 1.0);
}
