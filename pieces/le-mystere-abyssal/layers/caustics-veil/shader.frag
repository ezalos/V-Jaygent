#version 300 es
// ABOUTME: Caustics veil for le-mystere-abyssal — animated worley filament
// ABOUTME: dapple. Aerial stages: sun glitter on the lagoon (masked off the
// ABOUTME: hole). Underwater: caustic webs fading with depth, axis locked to
// ABOUTME: the bar grid, agitated locally by the cursor.
precision highp float;

#include "math.glsl"
#include "noise.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_mid;
uniform float u_audio_playing;
uniform float u_bar_phase;
uniform int   u_bar_index;
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

float discRadius(int stage, float sp) {
    if (stage == 0) return 0.105;
    if (stage == 1) return mix(0.105, 0.13, sp);
    if (stage == 2) return mix(0.13, 0.34, sp * sp);
    if (stage == 3) return mix(0.34, 2.0, smoothstep(0.0, 0.35, sp));
    if (stage == 10) return mix(0.40, 0.12, smoothstep(0.30, 0.90, sp));
    return 2.0;
}

float sunPresence(int stage, float sp) {
    if (stage == 5) return 0.45;
    if (stage == 9) return smoothstep(0.0, 0.5, sp);
    if (stage == 10) return 1.0 - smoothstep(0.0, 0.7, sp);
    return 0.0;
}

vec2 snellCenter(float dep) {
    return vec2(0.0, mix(0.55, 0.30, smoothstep(0.10, 0.90, dep)));
}
const vec2 DISC_C = vec2(0.0, -0.10);
// ==================================================== end NARRATIVE ====

// Animated worley F1: feature points orbit their cells so the web never
// settles.
float worley(vec2 p, float t) {
    vec2 ip = floor(p), fp = fract(p);
    float d = 8.0;
    for (int j = -1; j <= 1; j++)
    for (int i = -1; i <= 1; i++) {
        vec2 g = vec2(float(i), float(j));
        vec2 o = hash22(ip + g);
        o = 0.5 + 0.45 * sin(t + 6.2831 * o);
        vec2 diff = g + o - fp;
        d = min(d, dot(diff, diff));
    }
    return sqrt(d);
}

// Two interleaved worley fields, sharpened into bright filaments.
float caustic(vec2 p, float t) {
    float v1 = worley(p * 5.0, t * 0.8);
    float v2 = worley(p * 5.0 * rot2d(0.43) + 7.31, t * 0.8 + 2.0);
    float c = pow(clamp(1.0 - v1, 0.0, 1.0), 5.0) * 1.35
            + pow(clamp(1.0 - v2, 0.0, 1.0), 5.0) * 0.65;
    return c;
}

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p  = (uv - 0.5) * vec2(aspect, 1.0);

    bool mouseIdle = u_mouse.x < 1.0 && u_mouse.y < 1.0;
    vec2 mp = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);

    int stage; float sp, dep;
    narrative(u_time, stage, sp, dep);
    float aer = aerialAmount(stage, sp);

    float midDrive = mix(0.35 + 0.25 * sin(u_time * 0.83 + 0.7), u_audio_mid, u_audio_playing);

    // Cursor agitation: stirred water sparkles harder and the web jitters.
    float agit = 0.0;
    if (!mouseIdle) agit = exp(-dot(p - mp, p - mp) * 8.0);

    // Axis phase-locked to the bar grid: a slow continuous rotation that
    // advances bar by bar (visible receipt of the meter).
    float barAngle = (float(u_bar_index) + u_bar_phase) * 0.13;

    vec3 col = vec3(0.0);

    // ---- Aerial glitter on the lagoon ----------------------------------
    if (aer > 0.001) {
        // accretion: the glitter wakes with the waves (~6.5s in)
        float gGlit = smoothstep(6.5, 10.0, u_time);
        // the hole's pressure pulse warps the sparkle as it passes —
        // ground-projected, identical math to water-column's groundPulse
        vec2 warp = vec2(0.0);
        float front = 0.0;
        float H = 0.80;
        if ((stage == 1 || stage == 2) && uv.y < H - 0.005) {
            float ph = (stage == 1)
                ? fract((u_time - 23.1) / 8.0)
                : mix(fract(u_time / 2.5), u_bar_phase, u_audio_playing);
            float amp = (stage == 1) ? 0.45 : 1.0;
            const float F = 0.22;
            float z  = F / (H - uv.y);
            float xw = p.x * z / F;
            float zc = F / (H - 0.40);
            vec2  w  = vec2(xw, z - zc);
            float rw = max(length(w), 1e-4);
            float rho = 0.35 + ph * 4.5;
            float band = exp(-pow((rw - rho) / 0.55, 2.0));
            front = band * exp(-ph * 2.4) * amp;
            vec2 dirS = normalize(vec2(w.x / rw, -(w.y / rw) * 0.5) + 1e-5);
            warp = dirS * front * 0.05 * clamp(1.0 / z, 0.05, 1.0);
        }
        // finer toward the horizon so the sparkle sits on the sea plane;
        // drift vector matches the water-column wave drift exactly so the
        // hole's surroundings and the floating lights move as one water
        float persp = mix(2.6, 5.5, smoothstep(0.0, 0.80, uv.y));
        vec2 gp = (p + warp) * persp + vec2(u_time * 0.060, u_time * 0.018);
        float g = caustic(gp, u_time * 1.6);
        // only on the sea, fading at the horizon. The hole mask is scaled
        // by the SAME accretion gate that births the hole (pre-12.8s there
        // is no hole, so no void in the glitter — Louis's bug), and the
        // dots stay gradually visible across the hole's outer 15%, where
        // the water is still blue.
        float seaMask = smoothstep(H, H - 0.05, uv.y);
        float gHole = smoothstep(12.8, 16.3, u_time);
        float R = discRadius(stage, sp) * gHole;
        float r = length((p - DISC_C) * vec2(1.0, 2.0));
        float outside = (R < 1e-4) ? 1.0 : smoothstep(R * 0.85, R * 1.02, r);
        col += vec3(0.95, 0.98, 0.92) * g * 0.45 * seaMask * outside * gGlit
             * (0.7 + 0.5 * midDrive) * (1.0 + 1.6 * agit) * (1.0 + 0.9 * front);
        col *= aer;
    }

    // ---- Underwater caustic webs ----------------------------------------
    float uw = 1.0 - aer;
    if (uw > 0.001) {
        vec2 cp = p * rot2d(barAngle);
        // (cursor warp jitter deactivated 2026-06-11 — agitation now only
        // brightens, it no longer displaces)
        float c = caustic(cp + vec2(0.0, u_time * 0.015), u_time);
        // strongest near the surface light, dead by depth ~0.75
        float depthGain = 1.0 - smoothstep(0.15, 0.75, dep);
        // eyes adjusting after the tip-under: dapple blooms with the window
        if (stage == 3) depthGain *= smoothstep(0.45, 0.95, sp);
        float upper = smoothstep(0.0, 0.62, uv.y);
        vec3 tint = vec3(0.75, 0.95, 1.00) * extinction(dep);
        col += tint * c * 0.34 * depthGain * upper
             * (0.75 + 0.45 * midDrive) * (1.0 + 1.8 * agit) * uw;
    }

    float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
    fragColor = vec4(col, a);
}
