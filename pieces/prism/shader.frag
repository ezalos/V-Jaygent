// ABOUTME: Prism — a dihedral kaleidoscope folding a living warm source.
// ABOUTME: Mouse y picks the fold count (D4..D12); mouse x spins the mirror axis.
#version 300 es
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_level;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_audio_playing;
uniform float u_audio_time;

out vec4 fragColor;

const float PI  = 3.14159265359;
const float TAU = 6.28318530718;

// ---------- palette ----------

vec3 warmCycle(float t) {
    t = fract(t);
    vec3 c0 = vec3(1.00, 0.80, 0.50);
    vec3 c1 = vec3(1.00, 0.55, 0.30);
    vec3 c2 = vec3(0.85, 0.25, 0.25);
    vec3 c3 = vec3(0.55, 0.18, 0.40);
    vec3 c4 = vec3(0.42, 0.22, 0.48);
    if (t < 0.20) return mix(c0, c1,  t          * 5.0);
    if (t < 0.40) return mix(c1, c2, (t - 0.20)  * 5.0);
    if (t < 0.60) return mix(c2, c3, (t - 0.40)  * 5.0);
    if (t < 0.80) return mix(c3, c4, (t - 0.60)  * 5.0);
    return                mix(c4, c0, (t - 0.80) * 5.0);
}

// ---------- noise ----------

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i),             hash(i + vec2(1,0)), u.x),
               mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
               u.y);
}

float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.03; p += 1.7; a *= 0.55; }
    return v;
}

// ---------- helpers ----------

vec2 rot(vec2 p, float a) { float c = cos(a), s = sin(a); return mat2(c,-s,s,c) * p; }

// ---------- the kaleidoscope fold ----------
// Cn rotation + the crucial abs() reflection = Dn dihedral symmetry.
vec2 kaleidoFold(vec2 p, float n, float axisAngle) {
    p = rot(p, -axisAngle);
    float r  = length(p);
    float a  = atan(p.y, p.x);
    float sector = TAU / n;
    a = mod(a, sector);
    a = abs(a - sector * 0.5);
    return vec2(cos(a), sin(a)) * r;
}

// ---------- the SOURCE material ----------
// Written as if it's a simple 2D image — no symmetry logic here. The kaleido
// fold above does the symmetry. Keep this function "what's between the
// mirrors": beads, streaks, drifting colour, a few bright accents.
vec3 source(vec2 q, float t, float bass, float mid, float high, float level) {
    // 1. A slow warm fbm "fluid" that drifts. This is the backdrop inside
    //    the tube. Domain-warped, so it folds on itself organically.
    vec2 w1 = vec2(fbm(q * 1.2 + vec2(0.0, t * 0.09)),
                   fbm(q * 1.2 + vec2(5.2, 1.3) - t * 0.07));
    vec2 w2 = vec2(fbm(q * 1.5 + 2.8 * w1 + vec2(1.7, 9.2)),
                   fbm(q * 1.5 + 2.8 * w1 + vec2(8.3, 2.8) - t * 0.06));
    float fluid = fbm(q * 1.7 + 2.4 * w2 + 0.6 * bass);

    float hue   = 0.20 + 0.25 * fluid + t * 0.018
                + 0.14 * mid;
    vec3  col   = warmCycle(hue) * (0.18 + 0.8 * fluid);
    col        *= 0.55 + 0.9 * level;

    // 2. Moving bright "beads" — Lissajous paths with coprime rates so they
    //    never revisit the same alignment. Each bead gets folded N times by
    //    the kaleido, so 3 beads in the source => 6N reflected highlights.
    for (int k = 0; k < 3; k++) {
        float kf = float(k);
        float rate = (3.0 + 2.0 * kf);             // 3, 5, 7
        float phase = kf * 2.1;
        vec2 beadC = 0.55 * vec2(cos(t * 0.12 * rate + phase),
                                 sin(t * 0.09 * rate * 0.83 + phase * 1.3));
        float d = length(q - beadC);
        float bright = exp(-90.0 * d * d) * 1.4
                     + exp(-16.0 * d * d) * 0.35;
        col += warmCycle(0.05 + kf * 0.18 + t * 0.03) * bright * (0.7 + 1.6 * mid);
    }

    // 3. Fine sparkles driven by highs — tiny, hash-gated points.
    float gridS = 22.0;
    vec2  gid   = floor(q * gridS);
    float bucket = floor(t * 4.0);
    float spark  = step(0.87 - 0.3 * high, hash(gid + bucket));
    vec2  cell   = fract(q * gridS) - 0.5;
    col += warmCycle(0.02 + t * 0.02)
         * spark * exp(-26.0 * dot(cell, cell))
         * (0.5 + 1.5 * high);

    return col;
}

// ---------- main ----------

void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
           / min(u_resolution.x, u_resolution.y) * 2.0;

    float t     = u_time;
    float audio = max(u_audio_playing, 0.0);

    // Pseudo-audio fallback so the piece lives without a track.
    float bass  = mix(0.28 + 0.18 * sin(t * 0.61),
                      u_audio_bass,  audio);
    float mid   = mix(0.25 + 0.14 * sin(t * 0.47 + 1.1),
                      u_audio_mid,   audio);
    float high  = mix(0.22 + 0.17 * sin(t * 1.23 + 2.7) * 0.5 + 0.11,
                      u_audio_high,  audio);
    float level = mix(0.33, u_audio_level, audio);

    // Mouse in normalized [-1, +1] across each axis. Idle = default pose.
    bool mouseIdle = (u_mouse.x == 0.0 && u_mouse.y == 0.0);
    vec2 m = mouseIdle
           ? vec2(0.0, 0.2)
           : ((u_mouse / u_resolution) * 2.0 - 1.0);

    // Fold count — mouse.y maps to integer n in [4, 12]. Snap to int so the
    // symmetry is always exact; smooth the axis angle so motion stays fluid.
    float nTarget = 4.0 + floor(clamp((m.y * 0.5 + 0.5), 0.0, 1.0) * 9.0);  // 4..12
    // A tiny breathing on the fold count via bass — shifts between two integer
    // neighbours without creating seams if we keep it at exact integers.
    float n = nTarget;

    // Axis angle — mouse.x rotates the whole mirror frame; plus a slow
    // autonomous drift so the piece keeps moving on its own.
    float axisAngle = m.x * PI + t * 0.08
                    + bass * 0.35;                    // kicks nudge the axis

    // Inside zoom — bass gently pulls the source "deeper" into the tube.
    float zoom = 1.0 + 0.10 * sin(t * 0.15) + 0.22 * bass;
    vec2  pZoomed = p / zoom;

    // --- the kaleidoscope ---
    vec2 src = kaleidoFold(pZoomed, n, axisAngle);

    // A second, slower kaleido layer at different n for depth. Blended under.
    float n2 = 3.0 + floor(clamp(m.y * 0.5 + 0.5, 0.0, 1.0) * 4.0);  // 3..7
    vec2  src2 = kaleidoFold(pZoomed * 1.4, n2, axisAngle * -0.7);

    vec3 col  = source(src,  t, bass, mid, high, level);
    vec3 col2 = source(src2, t * 0.8, bass * 0.7, mid, high * 0.6, level);
    // Max-blend so the harder-edged second layer reads under the first.
    col = max(col, col2 * 0.55);

    // Per-fold audio flash — each mirror wedge glows on the kick.
    float wedgeFlash = exp(-pow(length(pZoomed) - 0.7, 2.0) * 16.0)
                    * (0.2 + 1.1 * bass);
    col += warmCycle(0.08 + t * 0.04) * wedgeFlash * 0.25;

    // Vignette + gamma.
    col *= 1.0 - 0.24 * dot(p, p);
    col  = pow(max(col, 0.0), vec3(0.88));

    fragColor = vec4(col, 1.0);
}
