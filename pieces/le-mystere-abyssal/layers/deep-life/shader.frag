#version 300 es
// ABOUTME: Deep-life layer for le-mystere-abyssal — marine snow (flow flips
// ABOUTME: at the reversal), dinoflagellate sparkle around the cursor (in the
// ABOUTME: abyss, touch is the only light), the lone lure-light, the diver's
// ABOUTME: dissolution into particles, and keyboard jelly-pulse rings.
precision highp float;

#include "math.glsl"
#include "noise.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_keys[15];
uniform float u_audio_playing;
out vec4 fragColor;

// ======================= NARRATIVE (keep in sync across layers) ========
// Source of truth: brainstorming/pieces/le-mystere-abyssal.md
// Stage ids: 0 A1 surface · 1 A2 legend · 2 A3 expedition · 3 B1 tip-under
// 4 B2 descent · 5 B3 twilight · 6 B4 abyss · 7 C1 reversal
// 8 C2 remembrance · 9 C3 sun-bloom · 10 D outro
void narrative(float t, out int stage, out float sp, out float dep) {
    float T[12] = float[12](0.0, 23.1, 43.2, 64.0, 83.6, 124.7,
                            142.9, 154.6, 174.5, 195.2, 215.0, 229.0);
    float D[12] = float[12](0.0, 0.0, 0.0, 0.0, 0.15, 0.55,
                            0.78, 1.0, 0.25, 0.15, 0.18, 0.02);
    int s = 0;
    for (int i = 0; i < 11; i++) if (t >= T[i]) s = i;
    float p = clamp((t - T[s]) / max(T[s + 1] - T[s], 1e-3), 0.0, 1.0);
    stage = s;
    sp = p;
    float e = p * p * (3.0 - 2.0 * p);
    dep = mix(D[s], D[s + 1], e);
}

vec3 extinction(float d) {
    float r = 1.0 - smoothstep(0.00, 0.25, d);
    float g = 1.0 - smoothstep(0.10, 0.70, d);
    float b = 1.0 - 0.90 * smoothstep(0.35, 1.00, d);
    return vec3(r, g, b);
}

float aerialAmount(int stage, float sp) {
    if (stage < 3) return 1.0;
    if (stage == 3) return 1.0 - smoothstep(0.35, 0.60, sp);
    if (stage == 10) return smoothstep(0.30, 0.85, sp);
    return 0.0;
}

float sunPresence(int stage, float sp) {
    if (stage == 5) return 0.45;
    if (stage == 9) return smoothstep(0.0, 0.5, sp);
    if (stage == 10) return 1.0 - smoothstep(0.0, 0.7, sp);
    return 0.0;
}
// ==================================================== end NARRATIVE ====

// Diver path — kept in sync with light-shaft's diverPos.
vec2 diverPos(float t) {
    float pr = smoothstep(88.7, 124.7, t);
    float slow = smoothstep(124.7, 140.0, t);
    float y = mix(0.30, -0.40, pr) - 0.10 * slow;
    float x = 0.05 * sin(t * 0.23);
    return vec2(x, y + 0.012 * sin(t * 0.9));
}

float keyX(int i, float aspect) {
    bool isBlack = (i >= 9);
    float halfPositions[6] = float[6](0.5, 1.5, 3.5, 4.5, 5.5, 7.5);
    float pos = isBlack ? halfPositions[i - 9] : float(i);
    return (-0.45 + (pos / 8.0) * 0.90) * aspect;
}

// Vertical drift of the snow field: we sink past it (snow appears to rise),
// then rise past it at the reversal (snow appears to fall) — Viola's trick.
float snowFlow(int stage, float sp) {
    if (stage == 4) return 0.022;
    if (stage == 5) return 0.030;
    if (stage == 6) return 0.040;
    if (stage == 7) return -0.060;
    return -0.006;
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p  = (uv - 0.5) * vec2(aspect, 1.0);

    bool mouseIdle = u_mouse.x < 1.0 && u_mouse.y < 1.0;
    vec2 mp = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);

    int stage; float sp, dep;
    narrative(u_time, stage, sp, dep);
    float t = u_time;

    if (aerialAmount(stage, sp) > 0.6) { fragColor = vec4(0.0); return; }

    vec3 col = vec3(0.0);

    // ---- Marine snow ----------------------------------------------------
    float snowGain = smoothstep(0.20, 0.55, dep);
    if (stage == 7) snowGain = max(snowGain, 0.8 * (1.0 - sp)); // visible while rising
    if (snowGain > 0.002) {
        float flow = snowFlow(stage, sp);
        // at the reversal the snow IS the scene — denser, larger, brighter
        float rev = (stage == 7) ? 1.0 : 0.0;
        float density = mix(0.12, 0.26, rev);
        // when streaking (reversal), a dash spans more than its own grid
        // cell — sample the y-neighbours too, or the dash clips hard at
        // the cell boundary (Louis saw the cut at ~2:38)
        int ny = (rev > 0.0) ? 1 : 0;
        for (int o = 0; o < 2; o++) {                  // two parallax sheets
            float scale = (o == 0) ? 22.0 : 38.0;
            float spd = flow * ((o == 0) ? 1.0 : 0.55);
            vec2 sPos = p + vec2(0.006 * sin(t * 0.5 + float(o)), -t * spd);
            for (int dy = -1; dy <= 1; dy++) {
                if (dy < -ny || dy > ny) continue;
                vec2 cell = floor(sPos * scale) + vec2(0.0, float(dy));
                vec2 fp = sPos * scale - cell;
                float h = hash21(cell + float(o) * 17.3);
                if (h > density) continue;
                vec2 jitter = hash22(cell * 1.7) * 0.6 + 0.2;
                // at the reversal the motes streak vertically — we are
                // RISING past them, and the eye must feel the rush
                vec2 dd = (fp - jitter) * vec2(1.0, mix(1.0, 0.38, rev));
                float d = length(dd);
                float mote = exp(-d * d * mix(42.0, 28.0, rev));
                float tw = 0.75 + 0.25 * sin(t * 1.4 + h * 40.0);
                col += vec3(0.70, 0.82, 0.90) * mote * tw * snowGain
                     * ((o == 0) ? 0.42 : 0.26) * (1.0 + 0.6 * rev);
            }
        }
    }

    // ---- Reversal: stack life onto the rising rush (stage 7) -----------
    // the streak-rain alone wasn't mesmerizing enough (Louis 2026-06-15) —
    // add swirling bioluminescent plankton we rush past + bright comet-motes
    // streaking up, so the ascent feels alive and fast.
    if (stage == 7) {
        // bioluminescent plankton on a curl-ish flow, twinkling
        for (int o = 0; o < 2; o++) {
            float fo = float(o);
            float sc = 26.0 + fo * 20.0;
            float swirl = fbmRot(p * 1.5 + vec2(0.0, t * 0.2)) * 6.2831;
            vec2 flow = vec2(cos(swirl), sin(swirl)) * 0.04;
            vec2 sp2 = (p + flow) * sc + vec2(0.0, t * (0.7 + 0.3 * fo));
            vec2 cell = floor(sp2); vec2 ff = fract(sp2);
            float h = hash21(cell + fo * 19.0);
            if (h > 0.16) continue;
            vec2 jit = hash22(cell * 2.1) * 0.7 + 0.15;
            float d = length(ff - jit);
            float blink = 0.5 + 0.5 * sin(t * (3.0 + h * 5.0) + h * 40.0);
            col += vec3(0.25, 0.85, 0.70) * exp(-d * d * 50.0) * blink * 0.5;
        }
        // bright comet-motes streaking upward with short trails
        for (int i = 0; i < 6; i++) {
            float fi = float(i);
            float seed = hash21(vec2(fi, 5.5));
            float life = fract(seed + (t - 154.6) * (0.18 + 0.10 * seed));
            vec2 cm = vec2((seed - 0.5) * 1.6 + 0.05 * sin(t + fi), -0.75 + life * 1.55);
            vec2 rel = p - cm;
            float head = exp(-dot(rel, rel) * 1600.0);
            float trail = exp(-(rel.x * rel.x) / 0.00035 - max(-rel.y, 0.0) / 0.13);
            float gone = smoothstep(0.92, 1.0, life);
            col += vec3(0.85, 0.92, 1.0) * (head + trail * 0.4) * 0.7 * (1.0 - gone);
        }
    }

    // ---- Dinoflagellate sparkle: agitation makes light ------------------
    if (!mouseIdle) {
        float prox = exp(-dot(p - mp, p - mp) * 7.0);
        // in the abyss, touch is the ONLY light
        float gainSpark = mix(0.5, 1.6, smoothstep(0.5, 0.95, dep));
        vec2 sp2 = p * 30.0;
        vec2 cell = floor(sp2);
        float h = hash21(cell);
        vec2 jitter = hash22(cell * 3.1) * 0.8 + 0.1;
        float d = length(fract(sp2) - jitter);
        float blink = step(0.5, fract(h * 13.0 + t * (0.8 + h)));
        float spark = exp(-d * d * 30.0) * step(h, 0.30) * blink;
        col += vec3(0.25, 0.95, 0.75) * spark * prox * gainSpark;
        // a soft agitation halo so the touch always answers, even mid-water
        col += vec3(0.10, 0.35, 0.35) * prox * 0.12 * gainSpark;
    }

    // ---- The lure: one pale light hanging in the black ------------------
    if (stage == 6 || (stage == 7 && sp < 0.3)) {
        vec2 lure = vec2(0.28 * sin(t * 0.071), -0.10 + 0.10 * sin(t * 0.043 + 1.2));
        float dl = length(p - lure);
        float blink = 0.55 + 0.45 * smoothstep(0.3, 0.9, sin(t * 0.45));
        float bulb = exp(-dl * dl * 600.0) * 1.3 + exp(-dl * dl * 60.0) * 0.35;
        col += vec3(0.85, 0.95, 1.00) * bulb * blink * 1.2;
    }

    // ---- Her light disperses: as her trace is lost (~100) the falling
    // light breaks apart into rising warm motes — the bubbles that become
    // her only sign of life (Louis 2026-06-15: don't show her long after).
    if (t > 99.0 && t < 110.0) {
        vec2 origin = diverPos(100.0);
        float k = (t - 99.0) / 11.0;
        for (int i = 0; i < 22; i++) {
            float hi = float(i) * 1.618;
            // mostly upward — they rise toward the surface like her bubbles
            vec2 dir = vec2(cos(hi * 6.2831) * 0.55, abs(sin(hi * 6.2831)) * 0.5 + 0.5);
            float spd = 0.05 + 0.06 * hash21(vec2(hi, 3.3));
            vec2 pt = origin + dir * spd * (t - 99.0);
            float d = length(p - pt);
            float fade = (1.0 - smoothstep(0.5, 1.0, k)) * smoothstep(0.0, 0.10, k);
            col += vec3(0.95, 0.92, 0.80) * exp(-d * d * 2000.0) * fade * 0.95;
        }
    }

    // ---- Keyboard jelly-pulses: notes ring outward in the deep ----------
    {
        float deepGain = 0.3 + 0.7 * smoothstep(0.25, 0.7, dep);
        for (int i = 0; i < 15; i++) {
            float env = u_keys[i];
            if (env < 0.01) continue;
            bool isBlack = (i >= 9);
            vec2 c = vec2(keyX(i, aspect), -0.18 + 0.08 * sin(float(i) * 2.1));
            float age = 1.0 - env;             // envelope decays from 1
            float ringR = 0.04 + age * 0.45;
            float front = smoothstep(0.035, 0.0, abs(length(p - c) - ringR));
            vec3 tint = isBlack ? vec3(0.45, 0.35, 1.00) : vec3(0.30, 0.85, 0.85);
            col += tint * front * env * env * 0.55 * deepGain;
        }
    }

    col *= max(extinction(dep * 0.5), vec3(0.15)); // deep life dims, never dies
    col = col / (1.0 + col * 0.5);
    float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
    fragColor = vec4(col, a);
}
