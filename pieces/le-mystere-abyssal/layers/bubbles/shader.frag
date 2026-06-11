#version 300 es
// ABOUTME: Bubbles layer for le-mystere-abyssal — rising bubble columns with
// ABOUTME: wobble, rim + glint rendering. Emission follows the vocal stem from
// ABOUTME: the dive on (her voice = the bubbles). Keyboard keys vent bursts at
// ABOUTME: their column; the cursor deflects bubbles around itself.
precision highp float;

#include "math.glsl"
#include "noise.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_keys[15];
uniform float u_audio_vocals_stem;
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

// 15-key x positions, mirroring the piano layout used by other pieces.
float keyX(int i, float aspect) {
    bool isBlack = (i >= 9);
    float halfPositions[6] = float[6](0.5, 1.5, 3.5, 4.5, 5.5, 7.5);
    float pos = isBlack ? halfPositions[i - 9] : float(i);
    return (-0.45 + (pos / 8.0) * 0.90) * aspect;
}

// Stage-shaped baseline emission (fraction of columns alive).
float emissionBase(int stage, float sp, float t, float voc) {
    if (stage < 4) return 0.0;
    if (stage == 4) {
        // her breath only at first; the bubbles become the message at
        // "les seuls signes de vie..." (98.9)
        return t < 98.9 ? 0.0 : 0.25 + 0.55 * voc;
    }
    if (stage == 5) return 0.20 + 0.50 * voc;
    if (stage == 6) return 0.12 + 0.35 * voc;
    if (stage == 7) return 0.15;
    if (stage == 8) return t < 189.2 ? 0.10 : 0.30 + 0.50 * voc;
    if (stage == 9) return 0.25 + 0.45 * voc;
    return 0.20 * (1.0 - sp * 0.7);
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

    float voc = mix(0.40 + 0.30 * sin(t * 0.47), u_audio_vocals_stem, u_audio_playing);
    float emission = emissionBase(stage, sp, t, voc);

    // chorus warmth: bubble rims catch gold when the myth is sung
    float goldAmt = (stage == 5 || stage == 9) ? 0.85 : 0.0;

    // Cursor deflection: bubbles bow away from the hand.
    vec2 defl = vec2(0.0);
    if (!mouseIdle) {
        vec2 away = p - mp;
        defl = normalize(away + 1e-4) * exp(-dot(away, away) * 9.0) * 0.07;
    }
    vec2 ps = p - defl;

    const float STRIP = 0.075;   // column spacing in p-space x
    vec3 col = vec3(0.0);

    // her breath: a focused stream above the diver while she's visible
    float diverPlume = (t > 90.0 && t < 143.0) ? 1.0 : 0.0;
    vec2 dvr = diverPos(t);

    for (int s = -1; s <= 1; s++) {
        float strip = floor(ps.x / STRIP) + float(s);
        float h = hash21(vec2(strip, 13.7));
        float xCol = (strip + 0.5 + (h - 0.5) * 0.55) * STRIP;

        // density: center-weighted plume where she went, plus key vents
        float wCenter = mix(1.0, 1.0 + 2.5 * exp(-xCol * xCol * 7.0),
                            (stage >= 4 && stage <= 6) ? 1.0 : 0.0);
        // bubbles arrive in trains, not as constant wallpaper — each column
        // breathes on its own slow clock
        float train = 0.35 + 0.65 * smoothstep(0.25, 0.85,
                          0.5 + 0.5 * sin(t * 0.35 + h * 6.2831));
        float alive = step(1.0 - clamp(emission * wCenter * train, 0.0, 0.92), h);

        // keyboard vent: a pressed key force-activates its column
        float vent = 0.0;
        bool ventBlack = false;
        for (int k = 0; k < 15; k++) {
            float env = u_keys[k];
            if (env < 0.01) continue;
            if (abs(keyX(k, aspect) - xCol) < STRIP * 0.75) {
                vent = max(vent, env);
                ventBlack = ventBlack || (k >= 9);
            }
        }
        alive = max(alive, step(0.05, vent));

        // diver breath column
        float breath = diverPlume * step(abs(xCol - dvr.x), STRIP * 0.8);
        alive = max(alive, breath);
        if (alive < 0.5) continue;

        float speed   = (0.085 + 0.10 * hash21(vec2(strip, 3.1))) * (1.0 + vent * 0.9);
        float spacing = 0.15 + 0.12 * hash21(vec2(strip, 5.9));
        float yFlow = ps.y + 0.55 - t * speed;
        float cell = floor(yFlow / spacing);
        float hb = hash21(vec2(strip * 7.7, cell));

        // not every slot holds a bubble; vents are denser
        if (hb < mix(0.35, 0.05, clamp(vent + breath, 0.0, 1.0))) continue;

        float yC = (cell + 0.5) * spacing - 0.55 + t * speed;
        // breath bubbles only exist above the diver
        if (breath > 0.5 && vent < 0.05 && yC < dvr.y) continue;

        float wob = sin(yC * (9.0 + 6.0 * hb) + hb * 6.2831 + t * 2.3) * 0.012;
        vec2 bPos = vec2(xCol + wob, fract((yC + 0.55) / 1.1) * 1.1 - 0.55);

        // size grows as it rises (pressure falls)
        float r = (0.006 + 0.012 * hb) * (1.0 + 0.6 * (bPos.y + 0.5));

        vec2 d = (ps - bPos) * vec2(1.0, 0.88);     // slight rise-stretch
        float dist = length(d);
        float ring = smoothstep(r * 0.50, r * 0.85, dist)
                   * smoothstep(r * 1.18, r * 0.95, dist);
        vec2 gOff = bPos + r * 0.40 * vec2(0.30, 0.75);
        float gd = length(ps - gOff);
        float glint = exp(-gd * gd / (r * r * 0.10)) * 0.9;

        float bright = (ring * 0.45 + glint)
                     * (mix(0.55, 0.80, goldAmt) + 0.45 * voc)
                     * (1.0 + 0.9 * goldAmt);
        // during the myth choruses the whole bubble catches gold — the one
        // warmth allowed to bypass extinction
        vec3 rim = mix(vec3(0.62, 0.88, 1.00) * extinction(dep * 0.85),
                       vec3(1.00, 0.72, 0.28), goldAmt);
        if (ventBlack && vent > 0.05) rim = mix(rim, vec3(0.55, 0.40, 1.00), 0.6);

        col += rim * bright;
    }

    col = col / (1.0 + col * 0.4);
    float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
    fragColor = vec4(col, a);
}
