// ABOUTME: watershed — Newton-fractal basin of attraction, single-pass.
// ABOUTME: each pixel's colour is the polynomial root it converges to (a Wada basin).
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
uniform float u_audio_level;
uniform float u_keys[15];
uniform float u_key_event[15];

out vec4 fragColor;

// Warm ramp: near-black -> wine -> ember -> amber -> gold -> cream.
// Tone carries its own luminance so adjacent basins differ in L and hue.
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

vec2 cinv(vec2 w) { return vec2(w.x, -w.y) / max(dot(w, w), 1e-9); }   // 1 / w

// warm near-black ground with a slow fbm haze — fills the deep-boundary void
vec3 substrate(vec2 p) {
    vec2 d1 = 0.20 * vec2(sin(u_time * 0.061), cos(u_time * 0.047));
    float h = fbm(p * 0.85 + d1);
    h = mix(h, fbm(p * 1.9 - d1 * 0.6 + vec2(u_time * 0.02, 0.0)), 0.4);
    float haze = smoothstep(0.35, 0.95, h) + 0.15 * u_audio_level;
    vec3 base  = vec3(0.014, 0.010, 0.018);
    vec3 ember = vec3(0.12, 0.055, 0.040);
    vec3 c = base + ember * haze * haze;
    c *= 0.82 + 0.30 * smoothstep(-1.0, 1.0, p.y + 0.4 * sin(u_time * 0.04));
    return c;
}

const int NR = 10;   // 6 orbiting + cursor + 3 keyboard

void main() {
    vec2 res = u_resolution;
    vec2 p = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y) * 2.0;

    // internal clock — theme-only, synthesised from u_time (120 BPM)
    float beats = u_time / 0.5;
    float beatPhase = fract(beats);
    float barPhase = fract(beats * 0.25);
    float downbeat = pow(1.0 - barPhase, 4.0);

    // --- up to 10 polynomial roots: 6 orbiting + cursor + 3 keyboard ---
    // Six roots spread wide to the frame edges so the seam network — the
    // fractal — weaves through the whole frame rather than a centre cluster.
    vec2 rpos[NR]; float ron[NR]; float rtone[NR];
    float beat = 1.0 + 0.06 * u_audio_bass;                  // bass breathes the orbit
    float orbX = (1.20 + 0.26 * sin(u_time * 0.066)) * beat; // macro breathing
    float orbY = (0.74 + 0.16 * sin(u_time * 0.066)) * beat;
    for (int k = 0; k < 6; k++) {
        float fk = float(k);
        float a = TAU * (fk / 6.0) + u_time * 0.12 + 0.34 * sin(u_time * 0.05 + fk * 1.7);
        rpos[k]  = vec2(orbX * cos(a), orbY * sin(a));
        ron[k]   = 1.0;
        rtone[k] = 0.30 + 0.12 * fk;                         // wine -> gold across the six
    }
    vec2 mw = vjMouseWorld(u_mouse, res);
    bool mouseOn = !vjMouseIdle(u_mouse);
    rpos[6]  = mw;
    ron[6]   = mouseOn ? 1.0 : 0.0;
    rtone[6] = 0.97;                                         // cream — the viewer's root

    int ki[3]; float kv[3];
    ki[0] = -1; ki[1] = -1; ki[2] = -1;
    kv[0] = 0.0; kv[1] = 0.0; kv[2] = 0.0;
    for (int i = 0; i < 15; i++) {
        float m = max(u_keys[i], 0.85 * u_key_event[i]);
        if (m > kv[0]) {
            kv[2] = kv[1]; ki[2] = ki[1];
            kv[1] = kv[0]; ki[1] = ki[0];
            kv[0] = m;     ki[0] = i;
        } else if (m > kv[1]) {
            kv[2] = kv[1]; ki[2] = ki[1];
            kv[1] = m;     ki[1] = i;
        } else if (m > kv[2]) {
            kv[2] = m;     ki[2] = i;
        }
    }
    for (int j = 0; j < 3; j++) {
        int idx = ki[j];
        if (idx < 0 || kv[j] < 0.06) {
            rpos[7 + j] = vec2(1e4); ron[7 + j] = 0.0; rtone[7 + j] = 0.5;
        } else {
            float a = TAU * float(idx) / 15.0 - 1.5708;
            rpos[7 + j]  = vec2(1.55 * cos(a), 0.92 * sin(a));
            ron[7 + j]   = 1.0;
            rtone[7 + j] = mix(0.22, 0.90, float(idx) / 14.0);   // wine -> gold by pitch
        }
    }

    // downbeat ring — expands from root 0 once per bar, warping the field
    float rR = barPhase * 2.0;
    float rr = length(p - rpos[0]);
    float q = (rr - rR) * 7.0;
    float ring = exp(-q * q);
    vec2 rdir = (p - rpos[0]) / (rr + 1e-4);

    // --- Newton's method:  z -= p(z)/p'(z) = z - 1 / sum( 1/(z - root_i) ).
    // The root a pixel converges to is its basin; the boundary is an
    // intrinsic crisp Wada fractal. The downbeat ring displaces the start
    // point so the fractal flexes on the beat.
    vec2 z = p + rdir * ring * 0.05;
    float iter = 0.0;
    bool conv = false;
    for (int it = 0; it < 48; it++) {
        vec2 sum = vec2(0.0);
        for (int i = 0; i < NR; i++) {
            if (ron[i] < 0.5) continue;
            sum += cinv(z - rpos[i]);
        }
        vec2 stepv = cinv(sum);
        z -= stepv;
        iter += 1.0;
        if (dot(stepv, stepv) < 3e-6) { conv = true; break; }
    }
    int hit = -1;
    float best = 1e9;
    for (int i = 0; i < NR; i++) {
        if (ron[i] < 0.5) continue;
        vec2 d = rpos[i] - z;
        float dd = dot(d, d);
        if (dd < best) { best = dd; hit = i; }
    }

    vec3 col;
    if (hit < 0 || !conv) {
        col = substrate(p);                       // deep-boundary void
    } else {
        // fast convergence = bright lake interior; slow = the dark
        // fractal filigree of the Wada boundary.
        float cap = smoothstep(0.0, 1.0, 1.0 - iter / 48.0);
        col = warmRamp(rtone[hit]) * (0.30 + 0.85 * cap);
    }

    // glow cores at each active root — tight core + soft halo, beat-pulsed
    vec3 glow = vec3(0.0);
    for (int i = 0; i < NR; i++) {
        if (ron[i] < 0.5) continue;
        vec2 d = p - rpos[i];
        float dd = dot(d, d);
        float core = exp(-dd * 300.0);
        float halo = exp(-dd * 26.0);
        float puls = 0.65 + 0.45 * exp(-beatPhase * 6.0);
        glow += warmRamp(rtone[i]) * (core * 0.90 + halo * 0.14) * puls;
    }
    glow += warmRamp(rtone[0]) * ring * 0.5 * (0.4 + 0.6 * downbeat);

    // sub-beat shimmer — fine always-on micro motion
    float sh = (vnoise(p * 36.0 + u_time * 4.3) - 0.5) * 0.06 * (0.5 + 0.8 * u_audio_high);

    col = max(col + glow + vec3(sh), vec3(0.0));
    fragColor = vec4(reinhard(col), 1.0);
}
