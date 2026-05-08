// ABOUTME: Atoll — pixel-art tropical beach. Sky/sea/sand bands quantised to a
// ABOUTME: ~220×130 grid with Bayer dither; cursor pans the horizon; the
// ABOUTME: keyboard a..l + w e t y u o is the ecosystem dial: each white key
// ABOUTME: hatches birds in its column of sky, each black key spawns crabs on
// ABOUTME: the sand and fish in the shallows. Total envelope = wildlife density.
#version 300 es
precision highp float;

#include "math.glsl"
#include "noise.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_zoom;
uniform vec2  u_pan;
uniform float u_keys[15];          // fast envelope (mirrors voice)
uniform float u_keys_visual[15];   // slow envelope — fauna fades on a longer tail
uniform float u_key_event[15];

out vec4 fragColor;

// Pixel-art canvas size. Larger = finer detail; this lands in classic
// 8/16-bit territory and stays legible at any output resolution.
const float PX_W = 220.0;
const float PX_H = 132.0;

// 4×4 Bayer ordered-dither matrix — scaled to [-0.5, 0.5]. Used to break up
// the smooth sky and sea gradients into the banded look pixel art is built on.
float bayer4(vec2 p) {
    float M[16] = float[16](
         0.0,  8.0,  2.0, 10.0,
        12.0,  4.0, 14.0,  6.0,
         3.0, 11.0,  1.0,  9.0,
        15.0,  7.0, 13.0,  5.0
    );
    int x = int(mod(p.x, 4.0));
    int y = int(mod(p.y, 4.0));
    return M[x + y * 4] / 16.0 - 0.5;
}

float h11(float n) { return fract(sin(n * 12.9898) * 43758.5453); }
float h21(vec2 p)  { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// Surf line — superposed sines so the shore breathes irregularly.
float waveY(float x, float t) {
    float w = 0.0;
    w += 0.014 * sin(x *  9.0 + t * 1.3);
    w += 0.008 * sin(x * 17.0 + t * 0.9 + 1.4);
    w += 0.005 * sin(x * 31.0 - t * 1.7);
    return w;
}

bool box(vec2 d, float w, float h) {
    return abs(d.x) <= w && abs(d.y) <= h;
}

// Seagull — 7-wide silhouette with body, head bump, and three-segment
// wings whose tips lift/drop with the flap phase. Returns:
//   0 = miss, 1 = wing/body (dark), 2 = head pixel (slightly lighter).
int drawBird(vec2 d, float flap) {
    float wy1 = flap > 0.0 ?  1.0 : -1.0;
    float wy2 = flap > 0.0 ?  2.0 : -2.0;
    // Body — two stacked pixels.
    if (box(d, 0.5, 0.5))                       return 1;
    if (box(d - vec2( 0.0, -1.0), 0.5, 0.5))    return 1;
    // Inner wings — level with body.
    if (box(d - vec2( 1.0, 0.0), 0.5, 0.5))     return 1;
    if (box(d - vec2(-1.0, 0.0), 0.5, 0.5))     return 1;
    // Mid wings.
    if (box(d - vec2( 2.0, wy1), 0.5, 0.5))     return 1;
    if (box(d - vec2(-2.0, wy1), 0.5, 0.5))     return 1;
    // Tip wings — splayed further up/down for the seagull "M" arc.
    if (box(d - vec2( 3.0, wy2), 0.5, 0.5))     return 1;
    if (box(d - vec2(-3.0, wy2), 0.5, 0.5))     return 1;
    // Head — 1 pixel above body, gives directional silhouette.
    if (box(d - vec2( 0.0, 1.0), 0.5, 0.5))     return 2;
    return 0;
}

// Fiddler crab — proper 5×3 sprite with shell, eye dots, asymmetric
// claws, side legs. Returns: 0 miss, 1 shell, 2 eye, 3 claw, 4 leg.
int drawCrab(vec2 d) {
    // Shell — 5-wide × 2-tall body.
    if (box(d, 2.0, 0.5))                       return 1;   // belly row
    if (box(d - vec2( 0.0, 1.0), 1.5, 0.5))     return 1;   // shell crown
    // Eyes — two white dots on top of the shell.
    if (box(d - vec2(-1.0, 2.0), 0.4, 0.4))     return 2;
    if (box(d - vec2( 1.0, 2.0), 0.4, 0.4))     return 2;
    // Big claw on the right (raised — fiddler signature).
    if (box(d - vec2( 3.0, 0.0), 0.5, 0.5))     return 3;
    if (box(d - vec2( 3.0, 1.0), 0.5, 0.5))     return 3;
    if (box(d - vec2( 4.0, 1.0), 0.5, 0.5))     return 3;
    // Small claw on the left.
    if (box(d - vec2(-3.0, 0.0), 0.5, 0.5))     return 3;
    // Side legs (lower).
    if (box(d - vec2( 2.0, -1.0), 0.5, 0.5))    return 4;
    if (box(d - vec2(-2.0, -1.0), 0.5, 0.5))    return 4;
    return 0;
}

// Tropical fish — 5-wide body + V-tail + eye. dir = +1 swims right.
// Returns: 0 miss, 1 body, 2 eye.
int drawFish(vec2 d, float dir) {
    // Body — three horizontal pixels tapering toward the tail.
    if (box(d, 0.5, 0.5))                       return 1;
    if (box(d - vec2(-dir,        0.0), 0.5, 0.5)) return 1;
    if (box(d - vec2(-dir * 2.0,  0.0), 0.5, 0.5)) return 1;
    // V-tail — two pixels splayed above and below at the rear.
    if (box(d - vec2(-dir * 3.0,  1.0), 0.5, 0.5)) return 1;
    if (box(d - vec2(-dir * 3.0, -1.0), 0.5, 0.5)) return 1;
    // Eye on the head (front, tiny).
    if (box(d - vec2( dir, 0.5), 0.35, 0.35))   return 2;
    return 0;
}

// Palm tree at base (bx, baseY) in 0..1 scene coords. Returns:
//   0 = outside, 1 = trunk, 2 = frond. `curl` is the trunk lean amount —
//   it controls the maximum trunk-top offset in pixels (typical ±0.8..1.2),
//   not raw px²/h coefficient. Higher baseY = palm planted further back on
//   the beach (smaller, atmospheric depth).
int drawPalm(vec2 px, vec2 puv, float bx, float baseY, float pxH, float curl) {
    float yPix = (puv.y - baseY) * PX_H;
    if (yPix < -2.0 || yPix > pxH + 16.0) return 0;

    float baseX = bx * PX_W;
    float n = clamp(yPix / max(pxH, 1.0), 0.0, 2.0);
    // Quadratic curl tops out at 6*curl pixels at the trunk crown — a gentle
    // coconut-palm bend, not a fishing rod.
    float trunkX = baseX + curl * 6.0 * n * n;
    vec2  crown  = vec2(baseX + curl * 6.0, baseY * PX_H + pxH);

    // Trunk segment with ring carve every 5 pixels.
    if (yPix >= 0.0 && yPix <= pxH) {
        float dx = px.x - trunkX;
        if (abs(dx) < 1.0) {
            if (mod(yPix, 5.0) < 1.0) return 0;
            return 1;
        }
    }

    // Frond cluster — six radial walks from the crown with quadratic sag.
    vec2 r = px - crown;
    if (dot(r, r) > 256.0) return 0;     // 16-pixel bounding circle
    for (int k = 0; k < 6; k++) {
        float ang = (float(k) / 6.0) * TAU + 0.4;
        float L = 11.0 + 3.0 * sin(float(k) * 1.7 + bx * 7.0);
        for (float s = 1.0; s <= 14.0; s += 1.0) {
            if (s > L) break;
            // Sag pulls every frond gently downward as it gets longer.
            vec2 fp = vec2(cos(ang) * s, sin(ang) * s - 0.07 * s * s);
            if (length(r - fp) < 0.9) return 2;
        }
    }
    return 0;
}

// Coconut — small dark ball clustered at the crown.
bool drawCoconut(vec2 px, float bx, float baseY, float pxH, float curl, float seed) {
    vec2 crown = vec2(bx * PX_W + curl * 6.0, baseY * PX_H + pxH);
    float a = seed * TAU;
    vec2 c = crown + vec2(cos(a) * 3.0, sin(a) * 1.2 - 1.8);
    return length(px - c) < 1.4;
}

void main() {
    // Quantise to pixel-art grid.
    vec2 uvF = gl_FragCoord.xy / u_resolution;
    vec2 px  = floor(uvF * vec2(PX_W, PX_H));
    vec2 puv = (px + 0.5) / vec2(PX_W, PX_H);

    // Cursor → camera. Pan the horizon horizontally; tilt vertically.
    vec2 mN = u_mouse / u_resolution - 0.5;
    float pan  = u_pan.x * 0.6 + mN.x * 0.18;
    float tilt = u_pan.y * 0.4 + mN.y * 0.08;
    float t    = u_time;

    float horizonY = clamp(0.62 + tilt, 0.50, 0.74);

    // Keyboard energy — the ecosystem dial. Use the long-tail visual
    // envelope so fauna fades over ~2.5s after release rather than
    // popping out instantly with the audio voice.
    float EWhite = 0.0;
    float EBlack = 0.0;
    for (int i = 0; i <  9; i++) EWhite += u_keys_visual[i];
    for (int i = 9; i < 15; i++) EBlack += u_keys_visual[i];
    float pulse = 0.0;
    for (int i = 0; i < 15; i++) pulse = max(pulse, u_key_event[i]);

    // Black-key column positions (semitone gaps mean no black between E-F or B-C).
    float BLACK_POS[6] = float[6](0.5, 1.5, 3.5, 4.5, 5.5, 7.5);

    vec3 col = vec3(0.0);

    // ===== SKY =====
    if (puv.y >= horizonY) {
        float skyT = (puv.y - horizonY) / (1.0 - horizonY);
        float d = bayer4(px) * 0.10;
        float tQ = clamp(skyT + d, 0.0, 1.0);
        tQ = floor(tQ * 5.0) / 4.0;
        vec3 skyLow = vec3(1.00, 0.78, 0.46);
        vec3 skyMid = vec3(0.42, 0.72, 0.92);
        vec3 skyTop = vec3(0.16, 0.36, 0.78);
        col = (tQ < 0.5)
            ? mix(skyLow, skyMid, tQ * 2.0)
            : mix(skyMid, skyTop, (tQ - 0.5) * 2.0);

        // Sun — flat disc with a 1-pixel halo. Drifts slowly with pan.
        vec2 sunC = vec2(0.74 - pan * 0.4, horizonY + 0.20);
        vec2 dSun = (puv - sunC) * vec2(PX_W / PX_H, 1.0);
        float sd = length(dSun);
        if (sd < 0.060) col = vec3(1.00, 0.96, 0.62);
        else if (sd < 0.072) col = mix(col, vec3(1.00, 0.86, 0.50), 0.55);

        // Clouds — long horizontal value-noise puffs that drift.
        float cn = vnoise(vec2(puv.x * 6.0 + t * 0.020, puv.y * 12.0));
        cn = floor(cn * 5.0) / 5.0;
        if (cn > 0.78 && puv.y > horizonY + 0.10 && puv.y < horizonY + 0.32) {
            col = mix(col, vec3(0.98, 0.95, 0.92), 0.75);
        }

        // Birds — each white key (a..l) owns a column of sky.
        for (int i = 0; i < 9; i++) {
            float env = u_keys_visual[i];
            if (env < 0.04) continue;
            float colX = (float(i) + 0.5) / 9.0;
            int birdN = int(floor(env * 4.0 + 0.4)) + 1;
            for (int b = 0; b < 5; b++) {
                if (b >= birdN) break;
                float seed = float(i) * 7.13 + float(b) * 3.11;
                float speed = 0.020 + 0.012 * h11(seed);
                float bx = fract(colX + h11(seed + 0.7) + t * speed);
                float by = horizonY + 0.10 + 0.20 * h11(seed + 1.4)
                         + 0.020 * sin(t * 1.4 + seed);
                vec2 d = px - vec2(bx * PX_W, by * PX_H);
                float flap = sin(t * 9.0 + seed);
                int hit = drawBird(d, flap);
                if (hit == 1) col = vec3(0.06, 0.07, 0.12);     // wing/body
                if (hit == 2) col = vec3(0.20, 0.18, 0.22);     // head, slightly lifted
            }
            // Press flash at column.
            float ev = u_key_event[i];
            if (ev > 0.4) {
                vec2 fp = vec2(colX * PX_W, (horizonY + 0.05) * PX_H);
                if (length(px - fp) < 1.2 + 2.0 * ev) {
                    col = mix(col, vec3(1.00, 0.95, 0.55), ev);
                }
            }
        }
    }
    // ===== SEA & SAND =====
    else {
        float surf     = horizonY * 0.62 + 0.04 + waveY(puv.x, t);
        float waveline = surf + 0.018;

        if (puv.y > waveline) {
            // Open water — band-quantised teal that brightens toward shore.
            float depthT = (puv.y - waveline) / (horizonY - waveline + 1e-3);
            float d = bayer4(px) * 0.10;
            float tQ = clamp(depthT + d, 0.0, 1.0);
            tQ = floor(tQ * 5.0) / 4.0;
            vec3 seaShallow = vec3(0.32, 0.78, 0.78);
            vec3 seaMid     = vec3(0.10, 0.50, 0.66);
            vec3 seaDeep    = vec3(0.04, 0.20, 0.42);
            col = (tQ < 0.5)
                ? mix(seaShallow, seaMid, tQ * 2.0)
                : mix(seaMid, seaDeep, (tQ - 0.5) * 2.0);

            // Sun glitter — flickering whites under the sun.
            float glit = h21(px + floor(t * 6.0));
            if (glit > 0.985 && abs(puv.x - (0.74 - pan * 0.4)) < 0.18
                && puv.y > waveline + 0.04 && puv.y < horizonY - 0.04) {
                col = vec3(1.00, 0.98, 0.85);
            }

            // Wave crest highlights.
            float crest = sin(puv.x * 24.0 + t * 1.6) + sin(puv.x * 47.0 - t * 0.9);
            if (crest > 1.7 && puv.y < waveline + 0.05) {
                col = mix(col, vec3(1.00, 0.98, 0.90), 0.6);
            }

            // Fish schools — black keys.
            for (int i = 0; i < 6; i++) {
                float env = u_keys_visual[9 + i];
                if (env < 0.06) continue;
                int fishN = int(floor(env * 3.0 + 0.4)) + 1;
                for (int f = 0; f < 4; f++) {
                    if (f >= fishN) break;
                    float seed = BLACK_POS[i] * 11.7 + float(f) * 4.1;
                    float dir  = (h11(seed) > 0.5) ? 1.0 : -1.0;
                    float fx = fract(h11(seed + 0.4) + t * 0.06 * dir);
                    float fy = waveline + 0.02 + 0.08 * h11(seed + 0.8);
                    vec2 d = px - vec2(fx * PX_W, fy * PX_H);
                    int hit = drawFish(d, dir);
                    // Three tropical hues cycled by seed — orange / yellow / cyan.
                    vec3 fishCol = (mod(seed, 3.0) < 1.0) ? vec3(0.96, 0.62, 0.18)
                                 : (mod(seed, 3.0) < 2.0) ? vec3(1.00, 0.90, 0.30)
                                                          : vec3(0.30, 0.85, 0.92);
                    if (hit == 1) col = fishCol;
                    if (hit == 2) col = vec3(0.05, 0.05, 0.08);  // dark eye dot
                }
            }
        }
        else if (puv.y > surf) {
            // Foam — bright cream with a serrated noise edge.
            float foam = h21(px + floor(t * 4.0));
            col = (foam > 0.35) ? vec3(1.00, 0.98, 0.92) : vec3(0.85, 0.92, 0.92);
        }
        else {
            // Wet → dry sand.
            float sandT = (surf - puv.y) / max(surf, 1e-3);
            float d = bayer4(px) * 0.12;
            float tQ = clamp(sandT + d, 0.0, 1.0);
            tQ = floor(tQ * 4.0) / 3.0;
            vec3 wet = vec3(0.78, 0.62, 0.40);
            vec3 dry = vec3(0.98, 0.86, 0.58);
            col = mix(wet, dry, tQ);

            // Scattered shells / pebbles — fixed positions, never animate.
            float shell = h21(px);
            if (shell > 0.992) col = vec3(1.00, 0.92, 0.78);
            else if (shell > 0.985) col = vec3(0.55, 0.34, 0.22);

            // Crabs — black keys spawn them by column, scuttling.
            for (int i = 0; i < 6; i++) {
                float env = u_keys_visual[9 + i];
                if (env < 0.05) continue;
                int crabN = int(floor(env * 3.0 + 0.4)) + 1;
                for (int c = 0; c < 4; c++) {
                    if (c >= crabN) break;
                    float seed = BLACK_POS[i] * 13.1 + float(c) * 2.7;
                    float baseX = (BLACK_POS[i] + 0.5) / 9.0;
                    float pace = sin(t * 2.0 + seed);
                    float cx = clamp(baseX + (h11(seed) - 0.5) * 0.3 + pace * 0.04, 0.02, 0.98);
                    float cy = 0.06 + 0.20 * h11(seed + 0.6) * (1.0 - tQ * 0.5);
                    vec2 dPix = px - vec2(cx * PX_W, cy * PX_H);
                    int hit = drawCrab(dPix);
                    if (hit == 1) col = vec3(0.92, 0.20, 0.14);   // shell
                    if (hit == 2) col = vec3(0.98, 0.96, 0.92);   // eye dot
                    if (hit == 3) col = vec3(0.72, 0.12, 0.08);   // claw (darker)
                    if (hit == 4) col = vec3(0.62, 0.10, 0.06);   // legs (darkest)
                }
            }
        }
    }

    // ===== PALMS — three background palms (further back, smaller, cooler
    // tints for atmospheric depth) then two foreground palms with coconuts.
    {
        int hit;
        // Background palms drift very subtly with pan to reinforce parallax;
        // foreground palms get more pan offset since they're "closer".
        float panBg = pan * 0.04;
        float panFg = pan * 0.10;

        // Background palm A — left-of-centre, leans right.
        float bx1 = 0.28 + panBg;
        hit = drawPalm(px, puv, bx1, 0.30, 44.0, +0.6);
        if (hit == 1) col = vec3(0.18, 0.12, 0.09);
        if (hit == 2) col = vec3(0.08, 0.30, 0.16);

        // Background palm B — centre, leans slightly left.
        float bx2 = 0.50 + panBg;
        hit = drawPalm(px, puv, bx2, 0.32, 50.0, -0.5);
        if (hit == 1) col = vec3(0.18, 0.12, 0.09);
        if (hit == 2) col = vec3(0.10, 0.32, 0.18);

        // Background palm C — right-of-centre, leans right.
        float bx3 = 0.68 + panBg;
        hit = drawPalm(px, puv, bx3, 0.31, 40.0, +0.7);
        if (hit == 1) col = vec3(0.18, 0.12, 0.09);
        if (hit == 2) col = vec3(0.08, 0.30, 0.16);

        // Foreground left palm — closer, taller, leans toward open sky.
        float lx = 0.10 + panFg;
        hit = drawPalm(px, puv, lx, 0.20, 70.0, +0.9);
        if (hit == 1) col = vec3(0.22, 0.14, 0.08);
        if (hit == 2) col = vec3(0.10, 0.42, 0.20);
        if (hit == 0) {
            if (drawCoconut(px, lx, 0.20, 70.0, +0.9, 0.10)) col = vec3(0.18, 0.10, 0.06);
            if (drawCoconut(px, lx, 0.20, 70.0, +0.9, 0.55)) col = vec3(0.18, 0.10, 0.06);
        }

        // Foreground right palm — closer, tallest, leans the other way.
        float rx = 0.88 + panFg;
        hit = drawPalm(px, puv, rx, 0.20, 80.0, -1.0);
        if (hit == 1) col = vec3(0.22, 0.14, 0.08);
        if (hit == 2) col = vec3(0.08, 0.38, 0.18);
        if (hit == 0) {
            if (drawCoconut(px, rx, 0.20, 80.0, -1.0, 0.30)) col = vec3(0.18, 0.10, 0.06);
        }
    }

    // Subtle full-frame brightening on any press, decays fast — gives the
    // chiptune note a visible "thunk" without overpowering the scene.
    col += vec3(0.08, 0.06, 0.04) * pulse * 0.5;

    // Small vignette so the pixel canvas reads as framed.
    float vg = 1.0 - 0.18 * length((uvF - 0.5) * vec2(0.85, 1.0));
    col *= vg;

    fragColor = vec4(col, 1.0);
}
