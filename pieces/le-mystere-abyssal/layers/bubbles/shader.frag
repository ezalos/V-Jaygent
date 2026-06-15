#version 300 es
// ABOUTME: Bubbles layer for le-mystere-abyssal — her voice rising, rendered
// ABOUTME: in three vocabularies chosen by the music moment (from the bubbles
// ABOUTME: lab): pointillist fizz for the literal rising bubbles, soap-film
// ABOUTME: iridescence for the narcosis dream, merging metaballs for the sun.
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

// iq cosine palette — the "beautiful colors" hope brings in.
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
    if (stage == 6) return 0.10 + 0.30 * voc;
    if (stage == 7) return 0.15;
    if (stage == 8) return t < 189.2 ? 0.10 : 0.30 + 0.50 * voc;
    return 0.20 * (1.0 - sp * 0.7);
}

// =========================================================== treatments ==

// #12 POINTILLIST FIZZ — her voice as rising white sparks; the only sign of
// life. White until hope colours them. Used for the literal rising-bubbles
// moments (descent, reversal, remembrance, outro). Keeps keyboard vents and
// her breath plume above the falling light.
vec3 voiceFizz(vec2 p, float aspect, float t, int stage, float sp,
               float dep, float voc, float hope) {
    float emission = emissionBase(stage, sp, t, voc);
    float diverPlume = (t > 90.0 && t < 106.0) ? 1.0 : 0.0;  // she is gone by ~105
    vec2 dvr = diverPos(t);
    const float STRIP = 0.075;
    vec3 col = vec3(0.0);

    for (int s = -1; s <= 1; s++) {
        float strip = floor(p.x / STRIP) + float(s);
        float h = hash21(vec2(strip, 13.7));
        float xCol = (strip + 0.5 + (h - 0.5) * 0.55) * STRIP;

        // density: centre-weighted plume where she went, plus key vents
        float wCenter = mix(1.0, 1.0 + 2.5 * exp(-xCol * xCol * 7.0),
                            (stage >= 4 && stage <= 6) ? 1.0 : 0.0);
        float train = 0.35 + 0.65 * smoothstep(0.25, 0.85,
                          0.5 + 0.5 * sin(t * 0.35 + h * 6.2831));
        float alive = step(1.0 - clamp(emission * wCenter * train, 0.0, 0.92), h);

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

        float breath = diverPlume * step(abs(xCol - dvr.x), STRIP * 0.8);
        alive = max(alive, breath);
        if (alive < 0.5) continue;

        float speed = (0.085 + 0.10 * hash21(vec2(strip, 3.1))) * (1.0 + vent * 0.9);
        float colWob = sin(p.y * (7.0 + 4.0 * h) + h * 6.2831 + t * 2.0) * 0.010;
        float xJit = xCol + colWob;

        float spacing = 0.045 + 0.030 * hash21(vec2(strip, 5.9));
        float cell = floor((p.y + 0.55 - t * speed) / spacing);
        float hb = hash21(vec2(strip * 7.7, cell));
        float yC = (cell + 0.5) * spacing - 0.55 + t * speed;
        bool breathOk = !(breath > 0.5 && vent < 0.05 && yC < dvr.y);
        if (hb > mix(0.45, 0.10, clamp(vent + breath, 0.0, 1.0)) || !breathOk) continue;

        vec2 dotP = vec2(xJit + (hb - 0.5) * 0.024,
                         fract((yC + 0.55) / 1.1) * 1.1 - 0.55);
        float dd = dot(p - dotP, p - dotP);
        float r = 0.0035 + 0.0045 * hb;
        float tw = 0.55 + 0.45 * sin(t * (2.2 + hb * 3.0) + hb * 40.0);
        vec3 white = vec3(0.90, 0.95, 1.00) * max(extinction(dep * 0.7), vec3(0.22));
        vec3 hue = iqPal(hb * 0.9 + t * 0.01 + 0.05, vec3(0.0, 0.33, 0.67));
        vec3 dotCol = mix(white, hue, hope * smoothstep(0.05, 0.65, hb));
        if (ventBlack && vent > 0.05) dotCol = mix(dotCol, vec3(0.55, 0.40, 1.00), 0.5);
        col += dotCol * exp(-dd / (r * r)) * (0.50 + 0.40 * voc) * tw;
    }
    return col;
}

// #2 SOAP-FILM IRIDESCENCE — l'ivresse des profondeurs. dream=0 (descent):
// medium parallax pearls. dream=1 (narcosis): MANY tiny bubbles, each a
// little prism that splits a slow-MOVING light into a coloured ray sweeping
// across the field — the iridescence animates and every bubble differs, for
// the "crazy" rapture effect Louis asked for (2026-06-15).
vec3 dreamBubbles(vec2 p, vec2 uv, float aspect, float t, float voc, float dream) {
    vec3 col = vec3(0.0);
    // the light moves, so the prism rays sweep as it crosses the field
    vec2 lightP = vec2(0.42 * sin(t * 0.22), -0.26 + 0.24 * sin(t * 0.17));
    vec3 lightDir = normalize(vec3(lightP * 0.7, 0.85));
    for (int i = 0; i < 40; i++) {
        float fi = float(i);
        float seed  = hash21(vec2(fi, 1.7));
        float seed2 = hash21(vec2(fi, 9.3));
        float z     = hash21(vec2(fi, 4.2));   // depth: 0 far, 1 near
        float chr   = hash21(vec2(fi, 7.9));   // film character
        float rate = mix(0.025, 0.07, z);
        float life = fract(t * rate + seed);
        float yr = life * 1.5 - 0.75;
        float xr = (seed - 0.5) * 1.85
                 + mix(0.03, 0.09, z) * sin(yr * 7.0 + seed * 40.0 + t * (0.6 + seed));
        vec2 c = vec2(xr, yr);
        float fade = smoothstep(0.0, 0.07, life) * smoothstep(1.0, 0.85, life)
                   * mix(0.55, 1.0, z);
        // skip half the field in the descent (it carries fewer, larger pearls)
        if (dream < 0.5 && seed2 > 0.55) continue;

        // PRISM RAY: the moving light refracts through the bubble into a
        // spectrally-spread beam pointing away from the light, brightest when
        // the bubble sits near it. Many of these = a sweeping rainbow fan.
        if (dream > 0.01) {
            vec2 rd = normalize(c - lightP + 1e-4);
            vec2 rel = p - c;
            float along = dot(rel, rd);
            float perp = dot(rel, vec2(-rd.y, rd.x));
            float beam = exp(-perp * perp / 0.00022) * exp(-max(along, 0.0) * 4.5)
                       * step(-0.01, along);
            float spec = fract(along * 5.0 + chr * 3.0 + t * 0.35);
            vec3 rayCol = iqPal(spec, vec3(0.0, 0.33, 0.67));
            float nearSun = exp(-dot(c - lightP, c - lightP) * 2.0);
            col += rayCol * beam * nearSun * dream * fade * 1.7 * (0.6 + 0.5 * voc);
        }

        // the bubble: medium pearls in the descent, tiny in the dream
        float R = mix(mix(0.026, 0.062, z), mix(0.006, 0.015, z), dream);
        vec2 q = (p - c) / R;
        float r2 = dot(q, q);
        if (r2 > 1.0) continue;
        vec3 N = vec3(q, sqrt(max(1.0 - r2, 0.0)));
        float cosL = max(dot(N, lightDir), 0.0);
        float ringFreq = mix(1.6, 4.2, chr);
        float thickness = (1.0 - 0.6 * life) * (0.72 - 0.40 * q.y);
        // animated: each film evolves on its OWN clock so the iridescence is
        // never static and every bubble shows a different dominant colour
        float opd = seed2 * 3.0 + thickness * ringFreq + (1.0 - N.z) * 1.6
                  + (1.0 - cosL) * 1.4 + t * (0.15 + 0.5 * chr);
        vec3 film = iqPal(opd, vec3(0.0, 0.33, 0.67));
        float F = 0.04 + 0.96 * pow(1.0 - N.z, 5.0);
        vec3 bub = film * (0.55 + 0.85 * F);
        // coupling (descent pearls only — tiny dream bubbles refract via rays)
        if (dream < 0.5) {
            vec2 lensUV = uv - (q * R / vec2(aspect, 1.0)) * 0.45 * (1.0 - N.z);
            vec3 seen = texture(u_below, lensUV).rgb;
            float seenBright = max(seen.r, max(seen.g, seen.b));
            bub += seen * smoothstep(0.45, 1.0, seenBright) * 0.7 * smoothstep(1.0, 0.4, r2);
        }
        bub += vec3(1.0) * pow(cosL, 40.0) * 0.7 * smoothstep(1.0, 0.9, r2);
        float cover = smoothstep(1.0, 0.80, r2) * fade * (0.75 + 0.35 * voc);
        col = max(col, bub * cover);
    }
    return col;
}

// #7 MERGING METABALLS — the colours of hope. MANY vibrant blobs RISE and
// cross paths, colliding and merging into peanuts as they pass (the lab look,
// Louis 2026-06-15); the interior is a pull-weighted blend of each ball's hue,
// so the colours MIX where two fuse.
vec3 joyBubbles(vec2 p, float t, float sp, float voc) {
    float tt = t - 195.2;
    float field = 0.0; vec2 grad = vec2(0.0); vec3 fieldCol = vec3(0.0);
    for (int i = 0; i < 26; i++) {
        float fi = float(i);
        float seed = hash21(vec2(fi, 3.1));
        float spd = 0.09 + 0.12 * seed;
        float life = fract(seed + tt * spd);
        float y = life * 1.8 - 0.9;                          // rises, wraps
        float x = (seed - 0.5) * 1.6
                + 0.26 * sin(tt * (0.5 + 0.7 * seed) + fi * 2.1);  // wander -> crossings
        vec2 c = vec2(x, y);
        float R = (0.040 + 0.028 * fract(fi * 0.618)) * (0.7 + 0.5 * voc)
                * smoothstep(0.0, 0.12, life) * smoothstep(1.0, 0.85, life);
        vec2 d = p - c;
        float r2 = max(dot(d, d), 1e-4);
        float w = R * R / r2;
        field += w;
        grad += -2.0 * R * R * d / (r2 * r2);
        vec3 hue = iqPal(seed * 1.7 + fi * 0.13, vec3(0.0, 0.33, 0.67));
        fieldCol += hue * w;
    }
    fieldCol /= max(field, 1e-3);
    float surfD = field - 1.0;
    float blob = smoothstep(0.0, 0.30, surfD);
    vec3 N = normalize(vec3(grad, 2.2));
    float F = 0.04 + 0.96 * pow(1.0 - N.z, 5.0);
    vec3 sheen = iqPal((1.0 - N.z) * 1.6 + 0.3, vec3(0.0, 0.33, 0.67));
    vec3 body = fieldCol * (0.45 + 0.55 * N.z) + sheen * F * 0.5;
    vec3 col = body * blob;
    col += fieldCol * smoothstep(0.12, 0.0, abs(surfD)) * 0.6;   // fusion seam glows
    return col * smoothstep(0.0, 0.22, sp);                       // fade in
}

// ================================================================= main ==

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p  = (uv - 0.5) * vec2(aspect, 1.0);

    int stage; float sp, dep;
    narrative(u_time, stage, sp, dep);
    float t = u_time;

    if (aerialAmount(stage, sp) > 0.6) { fragColor = vec4(0.0); return; }

    float voc = mix(0.40 + 0.30 * sin(t * 0.47), u_audio_vocals_stem, u_audio_playing);

    // hope curve: the colours arrive only when the narrative offers hope
    float hope = sunPresence(stage, sp);
    if (stage == 3) hope = max(hope, 0.30 * smoothstep(68.0, 72.0, t));
    if (stage == 8 && t > 189.2) hope = max(hope, 0.30);

    // The bubble vocabulary lands with the music moment:
    //   B2 descent (after trace lost ~103) -> fizz, then soap-film pearls,
    //                                          alternating across the long
    //                                          "only bubbles" stretch
    //   B3 narcosis dream                  -> tiny prismatic soap films
    //   C3 sun bloom                       -> merging metaballs
    //   everything else                    -> pointillist fizz
    vec3 col;
    if (stage == 5) {
        col = dreamBubbles(p, uv, aspect, t, voc, 1.0);
    } else if (stage == 9) {
        col = joyBubbles(p, t, sp, voc);
    } else if (stage == 4 && t > 113.0) {
        // second half of the descent: the pearls take over (a calm build
        // into the dream that follows at 124.7)
        col = dreamBubbles(p, uv, aspect, t, voc, 0.0);
    } else {
        col = voiceFizz(p, aspect, t, stage, sp, dep, voc, hope);
    }

    float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
    fragColor = vec4(col, a);
}
