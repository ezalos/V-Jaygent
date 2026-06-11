#version 300 es
// ABOUTME: Events layer for le-mystere-abyssal — story one-shots: sonar pings
// ABOUTME: on downbeats (expedition), the double-six dice snap, chorus entry
// ABOUTME: rings, radio static as the trace is lost, and faint question
// ABOUTME: flickers during the unanswerable-questions verse.
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "sdf.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_bar_phase;
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

vec2 snellCenter(float dep) {
    return vec2(0.0, mix(0.55, 0.30, smoothstep(0.10, 0.90, dep)));
}
const vec2 DISC_C = vec2(0.0, -0.10);
// ==================================================== end NARRATIVE ====

// hexagon outline distance (for the dice)
float sdHexOutline(vec2 p, float r) {
    const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
    p = abs(p);
    p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
    p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
    return abs(length(p) * sign(p.y));
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p  = (uv - 0.5) * vec2(aspect, 1.0);

    int stage; float sp, dep;
    narrative(u_time, stage, sp, dep);
    float t = u_time;

    vec3 col = vec3(0.0);

    // (Sonar is no longer drawn here — it lives as a warping pressure
    // pulse inside water-column and caustics-veil, bending what exists
    // instead of adding an overlay ring.)

    // ---- The dice: double six — two hexagonal snaps. Fired on the words
    // "un double six est sorti" (~87.4s), not at the line start: v1 put
    // them at 83.61 and the link to the lyric was lost.
    for (int i = 0; i < 2; i++) {
        float t0 = 87.40 + float(i) * 0.30;
        float age = t - t0;
        if (age < 0.0 || age > 0.9) continue;
        float k = age / 0.9;
        // in the dark water below the window, where the eye has contrast
        vec2 c = vec2(float(i) * 0.26 - 0.13, -0.22);
        float r = 0.07 + k * 0.36;
        float hexd = sdHexOutline((p - c) * rot2d(0.35 * float(i) + k * 0.8), r);
        float line = smoothstep(0.020, 0.0, hexd);
        col += vec3(0.85, 0.95, 1.00) * line * exp(-k * 2.6) * 1.7;
    }

    // (Chorus-entry rings removed 2026-06-11: an expanding overlay ring
    // with no visible cause reads as a bug, not an event — Louis flagged
    // the 64.04s one live. Chorus arrivals are announced by the sun star /
    // gold instead.)

    // ---- Radio static: the signal degrades, then dies (96 - 98.4) ------
    if (t > 96.0 && t < 98.4) {
        float gate = smoothstep(96.0, 96.4, t) * (1.0 - smoothstep(97.6, 98.4, t));
        float row = floor(uv.y * 110.0);
        float flick = hash21(vec2(row, floor(t * 24.0)));
        float burst = step(0.93, flick) * step(hash21(vec2(row, 77.7)), 0.45);
        // confined to loose horizontal bands, not the full frame
        float bandMask = 0.5 + 0.5 * sin(uv.y * 21.0 + t * 3.0);
        col += vec3(0.65, 0.80, 0.95) * burst * bandMask * gate * 0.50;
    }

    // ---- The questions: faint lights that appear and go out ------------
    {
        // the friends' questions circle the place she disappeared
        float qt[5] = float[5](103.85, 107.40, 109.56, 114.81, 118.69);
        for (int i = 0; i < 5; i++) {
            float age = t - qt[i];
            if (age < 0.0 || age > 1.8) continue;
            float k = age / 1.8;
            float angQ = float(i) * 2.51 + 0.7;   // golden-ish spread
            vec2 c = vec2(0.0, -0.12) + 0.38 * vec2(cos(angQ), 0.55 * sin(angQ));
            float g = exp(-dot(p - c, p - c) * 55.0);
            float env = sin(k * 3.14159);
            col += vec3(0.55, 0.85, 0.95) * g * env * 1.3;
        }
    }

    col *= extinction(dep * 0.6);
    col = col / (1.0 + col * 0.5);
    float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
    fragColor = vec4(col, a);
}
