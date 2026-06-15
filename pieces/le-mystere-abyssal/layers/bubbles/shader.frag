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

// Curated cyclic palette for the sun-bloom bubbles — harmonised warm hope
// tones (gold / coral / rose / soft violet / a teal accent) instead of the
// random full rainbow (Louis 2026-06-15: rethink the colour palette).
vec3 hopePal(float x) {
    x = fract(x);
    vec3 c0 = vec3(1.00, 0.82, 0.38);  // warm gold
    vec3 c1 = vec3(1.00, 0.52, 0.42);  // coral
    vec3 c2 = vec3(0.96, 0.46, 0.66);  // rose
    vec3 c3 = vec3(0.66, 0.48, 0.92);  // soft violet
    vec3 c4 = vec3(0.42, 0.82, 0.86);  // teal accent
    float f = x * 5.0;
    int i = int(f);
    float fr = smoothstep(0.0, 1.0, fract(f));
    vec3 a = i == 0 ? c0 : i == 1 ? c1 : i == 2 ? c2 : i == 3 ? c3 : c4;
    vec3 b = i == 0 ? c1 : i == 1 ? c2 : i == 2 ? c3 : i == 3 ? c4 : c0;
    return mix(a, b, fr);
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

// #12 POINTILLIST FIZZ — her voice as a CRAZY COLOURFUL field of sparks
// rising from the bottom and filling the screen (Louis 2026-06-15: the
// mesmerizing colourful effect). Three parallax sheets scroll continuously
// upward (no mid-screen pop), density rises with the vocal stem, keyboard
// vents brighten and densify their column.
vec3 voiceFizz(vec2 p, float aspect, float t, int stage, float sp,
               float dep, float voc) {
    float emission = emissionBase(stage, sp, t, voc);
    // keyboard vents: a bright column at each pressed key
    float vent = 0.0;
    for (int k = 0; k < 15; k++) {
        float env = u_keys[k];
        if (env < 0.01) continue;
        float dx = p.x - keyX(k, aspect);
        vent = max(vent, exp(-dx * dx / 0.004) * env);
    }
    vec3 col = vec3(0.0);
    for (int o = 0; o < 3; o++) {
        float fo = float(o);
        float scale = 16.0 + fo * 12.0;
        float speed = 0.11 + 0.04 * fo;
        vec2 sPos = p + vec2(0.0, -t * speed);   // continuous rise, no pop
        vec2 cell = floor(sPos * scale);
        vec2 ff = fract(sPos * scale);
        // wrap the scrolled axis for HASHING ONLY — keeps hash inputs bounded
        // so the field never degenerates to a grid at large t (precision)
        vec2 hcell = vec2(cell.x, mod(cell.y, 512.0));
        float h = hash21(hcell + fo * 13.1);
        float wave = 0.5 + 0.5 * sin(p.y * 3.0 - t * 0.8 + fo * 2.0);
        float dens = clamp(emission * (0.55 + 0.45 * wave) + vent * 0.6, 0.0, 0.95);
        if (h > dens) continue;
        vec2 jit = hash22(hcell * 1.9) * 0.7 + 0.15;
        float d = length(ff - jit);
        float r = 0.16 + 0.10 * h;
        float tw = 0.6 + 0.4 * sin(t * (2.0 + h * 4.0) + h * 40.0);
        vec3 hue = iqPal(h * 1.3 + fo * 0.3 + t * 0.02, vec3(0.0, 0.33, 0.67));
        vec3 dotCol = hue * max(extinction(dep * 0.55), vec3(0.34));
        col += dotCol * exp(-d * d / (r * r)) * (0.55 + 0.45 * voc) * (tw + vent * 0.9);
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
    vec2 lightP = vec2(0.42 * sin(t * 0.22), -0.18 + 0.26 * sin(t * 0.17));
    vec3 lightDir = normalize(vec3(lightP * 0.7, 0.85));
    for (int i = 0; i < 44; i++) {
        float fi = float(i);
        float seed  = hash21(vec2(fi, 1.7));
        float seed2 = hash21(vec2(fi, 9.3));
        float z     = hash21(vec2(fi, 4.2));   // depth: 0 far, 1 near
        float chr   = hash21(vec2(fi, 7.9));   // film character / curve
        // bottom-to-top life: each bubble ENTERS below the bottom and EXITS
        // above the top, fully visible between — fading only at the very
        // edges, so none pop in/out mid-screen (Louis 2026-06-15).
        float rate = mix(0.04, 0.10, z);
        float life = fract(t * rate + seed);
        float y = mix(-0.72, 0.72, life);
        float x = (seed - 0.5) * 1.85
                + mix(0.03, 0.09, z) * sin(y * 6.0 + seed * 40.0 + t * (0.6 + seed));
        vec2 c = vec2(x, y);
        float edgeFade = smoothstep(-0.66, -0.50, y) * smoothstep(0.66, 0.50, y)
                       * mix(0.55, 1.0, z);
        if (dream < 0.5 && seed2 > 0.5) continue;   // descent carries fewer

        // PRISM RAY from THIS bubble: a soft, CURVED rainbow streak pointing
        // away from the moving light, brightest AT the bubble and tapering to
        // nothing — and its length GROWS gradually as the bubble rises in (so
        // the light appears from nothing -> short -> full, never instant).
        if (dream > 0.01) {
            vec2 toL = c - lightP;
            vec2 rd = normalize(toL + 1e-4);
            vec2 pd = vec2(-rd.y, rd.x);
            float bend = (chr - 0.5) * 2.2;              // per-bubble curve
            float fullLen = mix(0.10, 0.26, seed);       // per-bubble length
            float grow = smoothstep(0.0, 0.22, life) * smoothstep(1.0, 0.82, life);
            float rayLen = fullLen * grow;
            vec2 rel = p - c;
            float along = dot(rel, rd);
            float perp  = dot(rel, pd);
            float curveOff = bend * along * along;        // soft parabolic curve
            float dist = abs(perp - curveOff);
            float width = 0.003 + 0.020 * (max(along, 0.0) / max(fullLen, 1e-3));
            float core = exp(-dist * dist / max(width * width, 1e-6));
            float lenProf = smoothstep(-0.006, 0.012, along)                    // soft start at bubble
                          * exp(-max(along, 0.0) / max(rayLen * 0.5, 1e-3))     // brightest at bubble
                          * smoothstep(rayLen * 1.25, rayLen * 0.7, along);     // soft far cap
            float spec = fract(along * 4.0 / max(fullLen, 1e-3) + chr * 3.0 + t * 0.3);
            vec3 rayCol = iqPal(spec, vec3(0.0, 0.33, 0.67));
            float nearSun = exp(-dot(toL, toL) * 1.4);
            col += rayCol * core * lenProf * nearSun * dream * edgeFade
                 * 2.0 * (0.6 + 0.5 * voc);
        }

        // the bubble itself: ~4x smaller pearls (descent) / tiny (dream)
        float R = mix(mix(0.007, 0.016, z), mix(0.005, 0.012, z), dream);
        vec2 q = (p - c) / R;
        float r2 = dot(q, q);
        if (r2 > 1.0) continue;
        vec3 N = vec3(q, sqrt(max(1.0 - r2, 0.0)));
        float cosL = max(dot(N, lightDir), 0.0);
        float ringFreq = mix(1.6, 4.2, chr);
        // animated film — never static, every bubble a different dominant hue
        float thickness = (0.55 + 0.45 * sin(life * 6.2831 + seed * 6.2831))
                        * (0.72 - 0.40 * q.y);
        float opd = seed2 * 3.0 + thickness * ringFreq + (1.0 - N.z) * 1.6
                  + (1.0 - cosL) * 1.4 + t * (0.15 + 0.5 * chr);
        vec3 film = iqPal(opd, vec3(0.0, 0.33, 0.67));
        float F = 0.04 + 0.96 * pow(1.0 - N.z, 5.0);
        vec3 bub = film * (0.55 + 0.85 * F);
        // keep one u_below sample alive (descent pearls catch the scene tint)
        if (dream < 0.5) {
            vec3 seen = texture(u_below, uv).rgb;
            bub += seen * 0.25 * smoothstep(1.0, 0.4, r2);
        }
        bub += vec3(1.0) * pow(cosL, 40.0) * 0.7 * smoothstep(1.0, 0.9, r2);
        float cover = smoothstep(1.0, 0.80, r2) * edgeFade * (0.75 + 0.35 * voc);
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
        vec3 hue = hopePal(seed * 1.3 + fi * 0.09);
        fieldCol += hue * w;
    }
    fieldCol /= max(field, 1e-3);
    float surfD = field - 1.0;
    float blob = smoothstep(0.0, 0.30, surfD);
    vec3 N = normalize(vec3(grad, 2.2));
    float F = 0.04 + 0.96 * pow(1.0 - N.z, 5.0);
    vec3 sheen = hopePal((1.0 - N.z) * 0.5 + 0.1);
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

    // The bubble vocabulary lands with the music moment, CROSSFADED on soft
    // time-windows so nothing snaps on/off mid-movement (Louis 2026-06-15):
    //   descent fizz (vibrant)  : 98.9 -> ~114
    //   descent soap pearls     : ~113 -> ~125
    //   narcosis prism dream    : ~124 -> ~145  (tail past the 142.9 boundary
    //                                            so the bubbles rise off-screen)
    //   sun-bloom metaballs     : stage 9
    //   reversal/remembrance/outro fizz : the remainder
    float gPearl = smoothstep(111.0, 114.0, t) * (1.0 - smoothstep(123.0, 125.5, t));
    float gDream = smoothstep(123.5, 126.0, t) * (1.0 - smoothstep(141.0, 145.0, t));
    float gJoy   = (stage == 9)
                 ? smoothstep(0.0, 0.18, sp) * (1.0 - smoothstep(0.88, 1.0, sp))
                 : 0.0;
    float gFizz  = clamp(1.0 - gPearl - gDream - gJoy, 0.0, 1.0);

    vec3 col = vec3(0.0);
    if (gFizz  > 0.001) col += voiceFizz(p, aspect, t, stage, sp, dep, voc) * gFizz;
    if (gPearl > 0.001) col += dreamBubbles(p, uv, aspect, t, voc, 0.0) * gPearl;
    if (gDream > 0.001) col += dreamBubbles(p, uv, aspect, t, voc, 1.0) * gDream;
    if (gJoy   > 0.001) col += joyBubbles(p, t, sp, voc) * gJoy;

    float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
    fragColor = vec4(col, a);
}
