// ABOUTME: Strata — the VJ-layered thesis in one shader. Five independent
// ABOUTME: layers at coprime rates (3,5,7,11) composited via screen/max.
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

out vec4 fragColor;

const float PI  = 3.14159265359;
const float TAU = 6.28318530718;

// Coprime time-rate multipliers, one per layer.
const float R1 = 3.0;
const float R2 = 5.0;
const float R3 = 7.0;
const float R4 = 11.0;

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

// ---------- blend modes ----------

vec3 blendScreen(vec3 a, vec3 b) { return a + b - a * b; }
vec3 blendMax   (vec3 a, vec3 b) { return max(a, b); }
vec3 blendAddSat(vec3 a, vec3 b) { return min(a + b, vec3(1.0)); }

// ---------- noise ----------

float hash(vec2 p)  { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float hash1(float n){ return fract(sin(n * 91.345) * 47453.731); }

float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i),             hash(i + vec2(1,0)), u.x),
               mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
               u.y);
}

float fbmGrid(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.03; p += 1.7; a *= 0.55; }
    return v;
}

// ---------- SDF primitives (for per-layer masks) ----------

float sdRoundBox(vec2 p, vec2 b, float r) {
    vec2 d = abs(p) - b + vec2(r);
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}

float sdTriangle(vec2 p, float s) {
    const float k = 1.7320508;                   // sqrt(3)
    p.x = abs(p.x) - s;
    p.y = p.y + s / k;
    if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) * 0.5;
    p.x -= clamp(p.x, -2.0 * s, 0.0);
    return -length(p) * sign(p.y);
}

float sdCircle(vec2 p, float r) { return length(p) - r; }

vec2 rot(vec2 p, float a) { float c = cos(a), s = sin(a); return mat2(c,-s,s,c) * p; }

// Soft edge mask from SDF: 1 inside, 0 outside, softened by `edge`.
float softMask(float d, float edge) {
    return smoothstep(edge, -edge, d);
}

// ---------- LAYER 0: warm fbm ground ----------

vec3 layerGround(vec2 p, float t, float level, float bass) {
    // Two domain-warp passes for depth; drifts at its own rate.
    vec2 w1 = vec2(fbmGrid(p * 1.1 + vec2(0.0, t * 0.07)),
                   fbmGrid(p * 1.1 + vec2(5.2, 1.3) - t * 0.05));
    vec2 w2 = vec2(fbmGrid(p * 1.4 + 3.2 * w1 + vec2(1.7, 9.2)),
                   fbmGrid(p * 1.4 + 3.2 * w1 + vec2(8.3, 2.8) - t * 0.04));
    float density = fbmGrid(p * 1.6 + 2.4 * w2);
    float hue     = 0.30 + 0.12 * density + t * 0.010;

    vec3  col = warmCycle(hue) * smoothstep(0.20, 0.85, density);
    col      *= 0.18 + 0.55 * level + 0.40 * bass;          // bass-lifted
    col      *= 0.65;                                        // kept dim; it's the ground
    return col;
}

// ---------- LAYER 1: moiré rings in a rounded-rect, rate 3 ----------

vec3 layerRings(vec2 p, float t, float bass, vec2 mouseShift) {
    // Rate-3 Lissajous centre, plus mouse drag.
    float th = t * 0.1 * R1;
    vec2 centre = 0.32 * vec2(cos(th), sin(th * 0.7)) + mouseShift * 0.35;
    float angle = th * 0.4;

    vec2 q = rot(p - centre, -angle);
    float mask = softMask(sdRoundBox(q, vec2(0.55, 0.32), 0.08), 0.015);
    if (mask < 0.01) return vec3(0.0);

    // Two concentric ring gratings at slightly different pitches → moiré.
    float r   = length(q);
    float f1  = 38.0 + 4.5 * bass;
    float f2  = 38.4 + 4.5 * bass;
    float g1  = 0.5 + 0.5 * cos(r * f1 - t * 1.4);
    float g2  = 0.5 + 0.5 * cos(r * f2 - t * 1.4 + 0.15);
    float beat = g1 * g2;

    vec3 col = warmCycle(0.10 + 0.25 * beat) * (0.35 + 1.3 * beat);
    return col * mask;
}

// ---------- LAYER 2: Truchet tiles in a triangle mask, rate 5 ----------

vec3 layerTruchet(vec2 p, float t, float mid, vec2 mouseShift) {
    float th = t * 0.07 * R2;
    vec2 centre = 0.30 * vec2(sin(th), cos(th * 1.1)) + mouseShift * 0.55;
    float angle = t * 0.25 * (1.0 + 1.8 * mid);

    vec2 q = rot(p - centre, -angle);
    float mask = softMask(sdTriangle(q * 1.3, 0.55), 0.02);
    if (mask < 0.01) return vec3(0.0);

    // Truchet: each unit cell picks a quarter-arc orientation from a hash.
    vec2 cell = q * 6.0;
    vec2 id   = floor(cell);
    vec2 f    = fract(cell) - 0.5;
    float h   = hash(id);
    // Flip the cell on the anti-diagonal for half the tiles → opposing arcs.
    if (h > 0.5) f.x = -f.x;

    // Two arcs from opposite corners, radius 0.5.
    float arc1 = abs(length(f - vec2(0.5, 0.5)) - 0.5);
    float arc2 = abs(length(f - vec2(-0.5, -0.5)) - 0.5);
    float line = min(arc1, arc2);
    float edge = smoothstep(0.08, 0.00, line);

    vec3 col = warmCycle(0.20 + 0.08 * hash(id) + t * 0.015) * edge * (0.55 + 0.8 * mid);
    return col * mask;
}

// ---------- LAYER 3: de Jong attractor in a circle mask, rate 7 ----------

vec3 layerAttractor(vec2 p, float t, float mid, float high, vec2 mouseShift) {
    float th = t * 0.06 * R3;
    vec2 centre = 0.28 * vec2(cos(th * 1.3 + 1.0), sin(th * 0.9)) + mouseShift * 0.20;

    vec2 q = p - centre;
    float mask = softMask(sdCircle(q, 0.42), 0.02);
    if (mask < 0.01) return vec3(0.0);

    // Drifting parameters — bounded so the attractor stays interesting.
    float a = 1.80 + 0.50 * sin(t * 0.09);
    float b = 1.60 + 0.35 * cos(t * 0.13 + 1.3);
    float c = 1.95 + 0.40 * sin(t * 0.11 + 2.1 + 0.5 * mid);
    float d = 1.70 + 0.30 * cos(t * 0.07 + 3.7);

    vec2 z = q * 2.0 + vec2(t * 0.05, -t * 0.03);
    for (int i = 0; i < 24; i++) {
        z = vec2(sin(a * z.y) - cos(b * z.x),
                 sin(c * z.x) - cos(d * z.y));
    }
    float lum = 1.0 - smoothstep(0.2, 1.8, length(z - q));

    vec3 col = warmCycle(0.50 + 0.15 * lum + t * 0.02) * pow(lum, 1.6) * (0.55 + 1.0 * high);
    return col * mask;
}

// ---------- LAYER 4: sparks at angular slots, rate 11 ----------

vec3 layerSparks(vec2 p, float t, float high) {
    float r   = length(p);
    float ang = atan(p.y, p.x);
    float rim = smoothstep(0.45, 0.80, r) * (1.0 - smoothstep(0.95, 1.20, r));
    if (rim < 0.01) return vec3(0.0);

    // 17 angular slots, time-bucketed stutter driven by highs.
    float bucket = floor(t * R4 * 1.6);
    float sum    = 0.0;
    for (int k = 0; k < 17; k++) {
        float slot = float(k) / 17.0 * TAU + 0.17;
        float dTh  = ang - slot;
        dTh        = dTh - TAU * floor((dTh + PI) / TAU);
        float gate = step(0.85 - 0.35 * high, hash1(float(k) * 31.7 + bucket));
        sum       += exp(-pow(dTh / 0.014, 2.0)) * gate;
    }
    vec3 col = warmCycle(0.02 + t * 0.03) * sum * rim * (0.7 + 1.5 * high);
    return col;
}

// ---------- main ----------

void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
           / min(u_resolution.x, u_resolution.y) * 2.0;

    float t     = u_time;
    float audio = max(u_audio_playing, 0.0);
    // Fall back to mild pseudo-audio when nothing is playing, so the piece
    // reads as VJ-alive even with no track. Gentle, never peaky.
    float bass  = mix(0.28 + 0.15 * sin(t * 0.73),
                      u_audio_bass, audio);
    float mid   = mix(0.25 + 0.12 * sin(t * 0.41 + 1.7),
                      u_audio_mid,  audio);
    float high  = mix(0.22 + 0.18 * sin(t * 1.13 + 3.0) * 0.5 + 0.11,
                      u_audio_high, audio);
    float level = mix(0.30, u_audio_level, audio);

    // Mouse shift: each layer gets its own weight so the cursor pulls them
    // apart, not together. If the mouse hasn't moved, no shift.
    bool mouseIdle = (u_mouse.x == 0.0 && u_mouse.y == 0.0);
    vec2 mShift    = mouseIdle
                   ? vec2(0.0)
                   : ((u_mouse - 0.5 * u_resolution.xy)
                      / min(u_resolution.x, u_resolution.y) * 2.0);

    // --- composite the deck ---
    vec3 col = layerGround   (p, t, level, bass);
    col = blendScreen(col, layerRings    (p, t, bass, mShift * 0.8));
    col = blendMax   (col, layerTruchet  (p, t, mid,  mShift * -0.6));
    col = blendScreen(col, layerAttractor(p, t, mid, high, mShift * 0.4));
    col = blendAddSat(col, layerSparks   (p, t, high));

    // Global exposure tied to audio level so silent → darker, loud → brighter.
    col *= 0.85 + 0.35 * level;

    // Soft vignette to settle the eye.
    col *= 1.0 - 0.22 * dot(p, p);

    fragColor = vec4(pow(max(col, 0.0), vec3(0.90)), 1.0);
}
