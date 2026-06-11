#version 300 es
// ABOUTME: Narcosis layer for le-mystere-abyssal — l'ivresse des profondeurs.
// ABOUTME: During chorus 2 (twilight, 124.7-142.9s) the water itself begins
// ABOUTME: to dream: a five-fold quasicrystalline interference field breathes
// ABOUTME: through the deep blue, its crests seamed with the myth's gold.
precision highp float;

#include "math.glsl"
#include "noise.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_other_stem;
uniform float u_audio_bass;
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
// ==================================================== end NARRATIVE ====

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p  = (uv - 0.5) * vec2(aspect, 1.0);

    int stage; float sp, dep;
    narrative(u_time, stage, sp, dep);
    float t = u_time;

    // The dream exists only in the twilight chorus, breathing in and out
    // at its edges.
    float gate = (stage == 5)
        ? smoothstep(0.0, 0.16, sp) * (1.0 - smoothstep(0.82, 1.0, sp))
        : 0.0;
    if (gate < 0.001) { fragColor = vec4(0.0); return; }

    bool mouseIdle = u_mouse.x < 1.0 && u_mouse.y < 1.0;
    vec2 mp = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);

    float bandDrive = mix(0.45 + 0.30 * sin(t * 0.43), u_audio_other_stem, u_audio_playing);
    float bassDrive = mix(0.40 + 0.25 * sin(t * 0.61), u_audio_bass, u_audio_playing);

    // the dream bends around a touch — pressure warps the wavefield
    vec2 pw = p;
    if (!mouseIdle) {
        vec2 away = p - mp;
        pw += normalize(away + 1e-4) * exp(-dot(away, away) * 5.0) * 0.06;
    }

    // Five plane waves at 72° (glass-figure lineage), amplitudes breathing
    // on incommensurate periods so the moiré never repeats.
    float k = 8.0 * (1.0 + 0.02 * bassDrive);
    float field = 0.0;
    for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float ang = fi * (TAU / 5.0) + 0.35 + 0.05 * sin(t * 0.021 + fi);
        vec2 dir = vec2(cos(ang), sin(ang));
        float amp = 0.40 + 0.60 * (0.5 + 0.5 * sin(TAU * t / (41.0 + 16.0 * fi) + fi * 1.7));
        float phi = fi * 1.3 + 0.9 * sin(t * 0.025 + fi);
        field += amp * cos(k * dot(dir, pw) - t * 0.55 + phi);
    }
    field /= 2.6;                       // roughly [-1, 1]

    // Body: deep dream-blue troughs. Crests: pale gold seams — the myth
    // leaking into the water's geometry.
    float crest = smoothstep(0.45, 0.95, field);
    float trough = smoothstep(-0.45, -0.95, field);
    vec3 col = vec3(0.04, 0.13, 0.30) * trough * 0.55
             + vec3(1.00, 0.78, 0.40) * crest * (0.28 + 0.22 * bandDrive);

    // depth vignette: the dream is strongest mid-frame, fading at the edges
    col *= 1.0 - 0.45 * smoothstep(0.55, 1.0, length(p));
    col *= gate;

    float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
    fragColor = vec4(col, a);
}
