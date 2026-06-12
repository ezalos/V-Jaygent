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
uniform sampler2D u_below;
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

// iq cosine palette — the "beautiful colors" the hope curve brings in.
vec3 iqPal(float t, vec3 phase) {
    return 0.5 + 0.5 * cos(6.28318 * (t + phase));
}

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

    // The hope curve: her fizz is WHITE — the beautiful colors arrive only
    // when the narrative offers hope (the star, the dream, the sun), and
    // they leave with it (Louis 2026-06-12, from the bubbles lab).
    float hope = sunPresence(stage, sp);
    if (stage == 3) hope = max(hope, 0.30 * smoothstep(68.0, 72.0, t));
    if (stage == 5) hope = max(hope, 0.55);
    if (stage == 8 && t > 189.2) hope = max(hope, 0.30);

    // Cursor deflection deactivated (Louis 2026-06-11: mouse warps add
    // nothing meaningful for now). Flip to re-enable.
    const bool MOUSE_WARP = false;
    vec2 defl = vec2(0.0);
    if (MOUSE_WARP && !mouseIdle) {
        vec2 away = p - mp;
        defl = normalize(away + 1e-4) * exp(-dot(away, away) * 9.0) * 0.07;
    }
    vec2 ps = p - defl;

    // Chorus 3: everything wheels slowly around the risen sun.
    if (stage == 9) {
        vec2 C = vec2(0.0, -0.15);
        ps = C + rot2d((t - 195.2) * 0.045) * (ps - C);
    }
    // Chorus 2 (the narcosis dream): bubbles become slow, large gold orbs.
    float dream = (stage == 5) ? 1.0 : 0.0;

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

        float speed   = (0.085 + 0.10 * hash21(vec2(strip, 3.1))) * (1.0 + vent * 0.9)
                      * mix(1.0, 0.45, dream);
        float colWob  = sin(ps.y * (7.0 + 4.0 * h) + h * 6.2831 + t * mix(2.0, 0.7, dream))
                      * mix(0.010, 0.022, dream);
        float xJit = xCol + colWob;

        // ---- pointillist fizz: her voice as a stream of white sparks ----
        // (the bubbles-lab winner: no bubble at all — dots whose density
        // breathes; white until hope colours them)
        float spacing = 0.045 + 0.030 * hash21(vec2(strip, 5.9));
        float yFlow = ps.y + 0.55 - t * speed;
        float cell = floor(yFlow / spacing);
        float hb = hash21(vec2(strip * 7.7, cell));
        float yC = (cell + 0.5) * spacing - 0.55 + t * speed;
        bool breathOk = !(breath > 0.5 && vent < 0.05 && yC < dvr.y);
        if (hb > mix(0.45, 0.10, clamp(vent + breath, 0.0, 1.0)) || !breathOk) {
            // no dot in this slot
        } else {
            vec2 dotP = vec2(xJit + (hb - 0.5) * 0.024,
                             fract((yC + 0.55) / 1.1) * 1.1 - 0.55);
            float dd = dot(ps - dotP, ps - dotP);
            float r = 0.0035 + 0.0045 * hb;
            float tw = 0.55 + 0.45 * sin(t * (2.2 + hb * 3.0) + hb * 40.0);
            vec3 white = vec3(0.90, 0.95, 1.00) * max(extinction(dep * 0.7), vec3(0.22));
            vec3 hue = iqPal(hb * 0.9 + t * 0.01 + 0.05, vec3(0.0, 0.33, 0.67));
            vec3 dotCol = mix(white, hue, hope * smoothstep(0.05, 0.65, hb));
            if (ventBlack && vent > 0.05) dotCol = mix(dotCol, vec3(0.55, 0.40, 1.00), 0.5);
            col += dotCol * exp(-dd / (r * r)) * (0.50 + 0.40 * voc) * tw;
        }

        // ---- rare soap-film accents: small iridescent bubbles ----------
        // (lab treatment 2, "if small" — larger and slower inside the dream)
        if (hash21(vec2(strip, 77.7)) < mix(0.10, 0.30, dream) && stage >= 4 && stage <= 9) {
            float fSpacing = 0.55;
            float fFlow = ps.y + 0.55 - t * speed * 0.6;
            float fCell = floor(fFlow / fSpacing);
            float fh = hash21(vec2(strip * 3.3, fCell));
            float fyC = (fCell + 0.5) * fSpacing - 0.55 + t * speed * 0.6;
            vec2 fPos = vec2(xJit, fract((fyC + 0.55) / 1.1) * 1.1 - 0.55);
            float R = (0.016 + 0.018 * fh) * mix(1.0, 1.25, dream);
            vec2 q = (ps - fPos) / R;
            float r2 = dot(q, q);
            if (r2 < 1.0) {
                vec3 N = vec3(q, sqrt(max(1.0 - r2, 0.0)));
                // the film shows the scene through itself (keeps the
                // u_below coupling) with a thin-film iridescent rim
                vec3 through = texture(u_below, uv).rgb;
                if (dot(through, vec3(1.0)) < 0.01) through = vec3(0.015, 0.045, 0.10);
                float F = 0.04 + 0.96 * pow(1.0 - N.z, 5.0);
                vec3 film = iqPal((1.0 - N.z) * 1.3 + fh + t * 0.02,
                                  vec3(0.0, 0.33, 0.67));
                film = mix(vec3(0.85, 0.92, 1.00), film, clamp(hope + 0.25, 0.0, 1.0));
                // rim-dominant: the interior stays transparent (the scene
                // through the film), the iridescence lives on the edge —
                // body-mixed films read as muddy smudges at dream scale
                vec3 bub = mix(through, film, clamp(F * 1.5, 0.0, 0.9)
                                            * smoothstep(0.35, 0.95, r2));
                bub += vec3(1.0, 0.98, 0.92)
                     * exp(-dot(q - vec2(0.3, 0.45), q - vec2(0.3, 0.45)) * 18.0) * 0.4;
                float inside = smoothstep(1.0, 0.88, r2);
                col = mix(col, max(col, bub), inside);
            }
        }
    }

    float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
    fragColor = vec4(col, a);
}
