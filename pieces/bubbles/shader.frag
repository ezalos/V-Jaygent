#version 300 es
// ABOUTME: bubbles — a laboratory of twelve bubble-rendering treatments,
// ABOUTME: photoreal optics to pure abstraction (research 2026-06-11).
// ABOUTME: Auto-cycles 12s per treatment; HOLD a piano key to lock one
// ABOUTME: (a..l = 1-9, w/e/t = 10-12). Tick row at the bottom = index.
precision highp float;

#include "math.glsl"
#include "noise.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_keys[15];
uniform sampler2D u_state;   // (selected treatment, touch flag) from select.frag
out vec4 fragColor;

// ---------------------------------------------------------------- shared --

const float CYCLE = 12.0;

vec3 hemiN(vec2 q) {                       // fake hemisphere normal on a disc
    return vec3(q, sqrt(max(1.0 - dot(q, q), 0.0)));
}
float schlick(float c, float F0) {
    return F0 + (1.0 - F0) * pow(1.0 - clamp(c, 0.0, 1.0), 5.0);
}
vec3 iqPal(float t, vec3 phase) {
    return 0.5 + 0.5 * cos(6.28318 * (t + phase));
}
// Zigzag rise (Leonardo's paradox): lateral swing + phase-locked tilt.
vec2 risePath(float h, float seed, float t) {
    float y = fract(h + t * (0.06 + 0.05 * seed)) * 1.3 - 0.65;
    float x = (seed - 0.5) * 1.4
            + 0.05 * sin(y * 9.0 + seed * 40.0 + t * (1.1 + seed));
    return vec2(x, y);
}
// The shared deep-water backdrop every optical treatment refracts.
vec3 bgScene(vec2 p, float t) {
    vec3 col = mix(vec3(0.012, 0.05, 0.13), vec3(0.10, 0.34, 0.48),
                   smoothstep(-0.6, 0.7, p.y));
    for (int i = 0; i < 2; i++) {
        float fi = float(i);
        float x0 = -0.35 + fi * 0.62 + 0.06 * sin(t * 0.21 + fi * 2.4);
        float shaft = exp(-pow((p.x - x0 - p.y * 0.22) * 4.2, 2.0));
        col += vec3(0.32, 0.46, 0.50) * shaft * (0.30 + 0.10 * sin(t * 0.7 + fi));
    }
    col *= 0.92 + 0.12 * fbmRot(p * 3.0 + vec2(t * 0.03, -t * 0.05));
    return col;
}

// ------------------------------------------------------------ treatments --

// 1 · photoreal: diverging lens — inverted minified background, Schlick rim
// (F0 = 0.02), smeared Snell-window highlight, astroid caustic below.
vec3 tPhotoreal(vec2 p, float t) {
    vec3 col = bgScene(p, t);
    for (int i = 0; i < 3; i++) {
        float seed = fract(float(i) * 0.618 + 0.21);
        vec2 c = risePath(seed, seed, t * 0.55);
        float R = 0.10 + 0.07 * seed;
        // wobble: n=2 mode, ellipse axes in anti-phase
        float w = 0.045 * sin(t * (5.5 + 6.0 * seed) + seed * 20.0);
        vec2 q = (p - c) / R;
        q *= vec2(1.0 + w, 1.0 - w);
        float r2 = dot(q, q);
        // astroid caustic on the "floor" below the bubble
        vec2 cp = p - c + vec2(0.0, R * 1.9);
        float ca = atan(cp.y, cp.x);
        float ast = pow(abs(cos(2.0 * ca)), 6.0) + pow(abs(sin(2.0 * ca)), 6.0);
        col += vec3(0.50, 0.65, 0.68)
             * exp(-pow((length(cp) - R * 0.8) * 14.0, 2.0)) * ast * 0.35;
        if (r2 > 1.0) continue;
        vec3 N = hemiN(q);
        // diverging lens: inverted, minified background through the bubble
        vec3 through = bgScene(c + (p - c) * -0.35 * (1.0 + 0.8 * (1.0 - N.z)), t);
        float F = schlick(N.z, 0.02);
        vec3 bub = mix(through * 0.92, vec3(0.75, 0.88, 0.95), F);
        // the Snell window, smeared across the upper back hemisphere
        float win = smoothstep(0.35, 0.85, dot(N, normalize(vec3(0.35, 0.75, 0.55))));
        bub += vec3(0.95, 0.99, 1.0) * win * 0.55 * (0.4 + 0.6 * N.z);
        col = mix(col, bub, smoothstep(1.0, 0.93, r2));
    }
    return col;
}

// 2 · soap film: thin-film interference skin, OPD-driven rainbow,
// thickness draining top→bottom.
vec3 tSoapFilm(vec2 p, float t) {
    vec3 col = bgScene(p, t) * 0.55;
    vec2 c = vec2(0.12 * sin(t * 0.4), 0.10 * sin(t * 0.27));
    float R = 0.42;
    vec2 q = (p - c) / R;
    float r2 = dot(q, q);
    if (r2 < 1.0) {
        vec3 N = hemiN(q);
        // film thickness: drains downward + swirls
        float th = 0.55 - 0.35 * q.y + 0.18 * fbmRot(q * 2.5 + t * 0.10);
        vec3 film = iqPal(th * 2.2 + (1.0 - N.z) * 1.3, vec3(0.0, 0.33, 0.67));
        float F = schlick(N.z, 0.04);
        col = mix(col, col * 0.9 + film * 0.16, smoothstep(1.0, 0.96, r2));
        col += film * F * 0.85 * smoothstep(1.0, 0.80, r2);
        col += vec3(1.0) * pow(max(dot(N, normalize(vec3(0.4, 0.6, 0.6))), 0.0), 24.0) * 0.6;
    }
    return col;
}

// 3 · dispersion prism: per-channel refraction at three IORs — jewel rim.
vec3 tDispersion(vec2 p, float t) {
    vec3 col = bgScene(p, t);
    for (int i = 0; i < 2; i++) {
        float seed = fract(float(i) * 0.618 + 0.07);
        vec2 c = risePath(seed, seed, t * 0.4);
        float R = 0.16 + 0.10 * seed;
        vec2 q = (p - c) / R;
        float r2 = dot(q, q);
        if (r2 > 1.0) continue;
        vec3 N = hemiN(q);
        float bend = (1.0 - N.z) * 0.55;
        vec3 through;
        through.r = bgScene(c + (p - c) * (-0.30 - bend * 0.7), t).r;
        through.g = bgScene(c + (p - c) * (-0.38 - bend * 1.0), t).g;
        through.b = bgScene(c + (p - c) * (-0.46 - bend * 1.3), t).b;
        float F = schlick(N.z, 0.03);
        vec3 rimRGB = vec3(
            smoothstep(0.55, 0.95, r2),
            smoothstep(0.65, 1.00, r2) * 0.9,
            smoothstep(0.75, 1.00, r2) * 1.2);
        col = mix(col, through + rimRGB * F * 1.6, smoothstep(1.0, 0.94, r2));
    }
    return col;
}

// 4 · champagne: fixed nucleation seeds, R grows with height, velocity with
// R — pearl strings fanning open; collar band; gold on dark.
vec3 tChampagne(vec2 p, float t) {
    vec3 col = mix(vec3(0.05, 0.025, 0.005), vec3(0.16, 0.09, 0.02),
                   smoothstep(-0.6, 0.7, p.y));
    col *= 0.9 + 0.2 * fbmRot(p * 2.0 + t * 0.02);
    for (int s = 0; s < 5; s++) {
        float fs = float(s);
        float x0 = -0.55 + fs * 0.27 + 0.02 * sin(fs * 7.0);
        for (int b = 0; b < 7; b++) {
            float fb = float(b);
            float ph = fract(t * (0.10 + 0.013 * fs) + fb / 7.0);
            float y = -0.62 + pow(ph, 0.62) * 1.25;          // accelerating
            float R = 0.006 + 0.016 * pow(ph, 0.55);          // growing
            vec2 c = vec2(x0 + 0.012 * sin(y * 18.0 + fs * 9.0), y);
            float d = length(p - c) / R;
            if (d > 1.4) continue;
            float body = smoothstep(1.0, 0.55, d);
            float glint = exp(-dot(p - c - R * vec2(0.3, 0.45), p - c - R * vec2(0.3, 0.45))
                              / (R * R * 0.09));
            col += vec3(1.0, 0.80, 0.42) * body * 0.35 + vec3(1.0, 0.94, 0.78) * glint * 0.8;
        }
    }
    // the collar: a lacy band at the surface
    float collar = exp(-pow((p.y - 0.58) * 18.0, 2.0));
    col += vec3(1.0, 0.85, 0.55) * collar
         * (0.25 + 0.45 * fbmRot(vec2(p.x * 14.0, t * 0.6)));
    return col;
}

// 5 · guinness reverse cascade: tiny nitrogen motes — sinking at the walls,
// rising in the heart of the glass.
vec3 tGuinness(vec2 p, float t) {
    vec3 col = mix(vec3(0.02, 0.013, 0.008), vec3(0.07, 0.045, 0.025),
                   smoothstep(-0.6, 0.8, p.y));
    float wall = smoothstep(0.25, 0.75, abs(p.x));   // 1 near walls
    for (int o = 0; o < 2; o++) {
        float scale = (o == 0) ? 26.0 : 44.0;
        float dir = mix(1.0, -1.0, wall);            // up centre, down walls
        vec2 sPos = p + vec2(0.0, -t * 0.05 * dir * ((o == 0) ? 1.0 : 0.6));
        vec2 cell = floor(sPos * scale);
        vec2 fp = fract(sPos * scale);
        float h = hash21(cell + float(o) * 31.7);
        if (h > 0.30) continue;
        vec2 jit = hash22(cell * 2.3) * 0.6 + 0.2;
        float d = length(fp - jit);
        col += vec3(0.92, 0.88, 0.80) * exp(-d * d * 55.0) * 0.30;
    }
    float head = smoothstep(0.55, 0.72, p.y);
    col = mix(col, vec3(0.88, 0.82, 0.70), head * 0.85);
    return col;
}

// 6 · voronoi foam: one cell pass — every cell a bubble with rim + glint.
vec3 tFoam(vec2 p, float t) {
    vec3 col = bgScene(p, t) * 0.5;
    vec2 fp2 = p * 4.5 + vec2(0.0, -t * 0.18);
    vec2 ip = floor(fp2), ff = fract(fp2);
    float F1 = 8.0; vec2 best = vec2(0.0); vec2 bid = vec2(0.0);
    for (int j = -1; j <= 1; j++)
    for (int i = -1; i <= 1; i++) {
        vec2 g = vec2(float(i), float(j));
        vec2 o = hash22(ip + g);
        o = 0.5 + 0.4 * sin(t * 0.8 + 6.2831 * o);
        vec2 r = g + o - ff;
        float d = dot(r, r);
        if (d < F1) { F1 = d; best = r; bid = ip + g; }
    }
    float d = sqrt(F1);
    float cellR = 0.30 + 0.25 * hash21(bid);
    float rim = smoothstep(cellR * 0.55, cellR, d) * smoothstep(cellR * 1.15, cellR, d);
    float inside = smoothstep(cellR, cellR * 0.2, d);
    vec3 N = hemiN(clamp(best / max(cellR, 1e-3), -1.0, 1.0));
    col += vec3(0.55, 0.78, 0.88) * rim * 0.9;
    col += vec3(0.20, 0.38, 0.48) * inside * 0.35 * (0.5 + 0.5 * N.z);
    col += vec3(1.0) * exp(-dot(best - vec2(0.1, 0.12), best - vec2(0.1, 0.12)) * 60.0) * 0.5;
    return col;
}

// 7 · metaballs: inverse-square field — bubbles merge into peanuts, split.
vec3 tMetaballs(vec2 p, float t) {
    float field = 0.0;
    vec2 grad = vec2(0.0);
    for (int i = 0; i < 6; i++) {
        float fi = float(i);
        vec2 c = vec2(0.55 * sin(t * (0.21 + 0.05 * fi) + fi * 2.1),
                      0.40 * sin(t * (0.17 + 0.04 * fi) + fi * 4.7));
        float R = 0.05 + 0.035 * fract(fi * 0.618);
        vec2 d = p - c;
        float r2 = max(dot(d, d), 1e-4);
        field += R * R / r2;
        grad += -2.0 * R * R * d / (r2 * r2);
    }
    vec3 col = mix(vec3(0.01, 0.04, 0.10), vec3(0.05, 0.16, 0.26),
                   smoothstep(-0.6, 0.6, p.y));
    float surfD = field - 1.0;
    float blob = smoothstep(0.0, 0.25, surfD);
    vec3 N = normalize(vec3(grad, 2.2));
    float F = schlick(N.z, 0.04);
    vec3 body = mix(vec3(0.10, 0.30, 0.42), vec3(0.55, 0.85, 0.95), F);
    body += vec3(1.0) * pow(max(dot(N, normalize(vec3(0.4, 0.6, 0.55))), 0.0), 30.0);
    col = mix(col, body, blob);
    col += vec3(0.5, 0.8, 0.9) * smoothstep(0.10, 0.0, abs(surfD)) * 0.55;
    return col;
}

// 8 · manga ink: thin outline, empty interior, one broken highlight arc.
vec3 tManga(vec2 p, float t) {
    vec3 col = bgScene(p, t) * 0.85;
    for (int i = 0; i < 6; i++) {
        float seed = fract(float(i) * 0.618 + 0.33);
        vec2 c = risePath(seed * 0.9, seed, t * 0.5);
        float R = 0.05 + 0.10 * seed;
        float d = length(p - c);
        float outline = smoothstep(0.012, 0.004, abs(d - R) / max(R * 6.0, 0.4));
        col = mix(col, vec3(0.04, 0.05, 0.08), outline);
        float ang = atan(p.y - c.y, p.x - c.x);
        float arc = smoothstep(0.05, 0.02, abs(d - R * 0.7) / max(R * 6.0, 0.4))
                  * smoothstep(0.5, 0.9, sin(ang - 2.1))      // upper-left only
                  * step(0.3, sin(ang * 9.0 + seed * 20.0));  // broken strokes
        col = mix(col, vec3(0.96, 0.99, 1.0), arc);
    }
    return col;
}

// 9 · seigaiha: tiled fans of concentric half-rings — circle as water.
vec3 tSeigaiha(vec2 p, float t) {
    vec2 g = p * 3.4 + vec2(0.0, -t * 0.12);
    float row = floor(g.y);
    g.x += mod(row, 2.0) * 0.5;
    vec2 cell = vec2(floor(g.x), row);
    vec3 col = mix(vec3(0.04, 0.10, 0.22), vec3(0.08, 0.20, 0.34),
                   fract(sin(dot(cell, vec2(12.9, 78.2))) * 43758.5) * 0.4);
    // each cell: rings centred at the cell's bottom-centre
    for (int dy = 0; dy <= 1; dy++) {
        vec2 cc = vec2(floor(g.x) + 0.5, row - float(dy));
        vec2 q = vec2(g.x - cc.x - mod(row - cc.y, 2.0) * 0.0, g.y - cc.y);
        float d = length(q * vec2(1.0, 1.45));
        float ring = smoothstep(0.05, 0.02, abs(fract(d * 4.0 + t * 0.25) - 0.5) - 0.18);
        float mask = smoothstep(1.05, 0.95, d) * step(q.y, 0.55);
        col = mix(col, mix(vec3(0.85, 0.92, 0.93), vec3(0.10, 0.30, 0.45),
                           fract(d * 4.0 + t * 0.25)), ring * mask * 0.85);
    }
    return col;
}

// 10 · stained glass: flat backlit roundels in thick dark leading,
// breathing like a rose window. Cyclic palette so nothing blinks.
vec3 tStainedGlass(vec2 p, float t) {
    vec3 col = vec3(0.03, 0.03, 0.05);
    vec2 fp2 = p * 3.2;
    vec2 ip = floor(fp2), ff = fract(fp2);
    float F1 = 8.0; vec2 bid = vec2(0.0); vec2 best = vec2(0.0);
    for (int j = -1; j <= 1; j++)
    for (int i = -1; i <= 1; i++) {
        vec2 g = vec2(float(i), float(j));
        vec2 o = 0.5 + 0.35 * sin(6.2831 * hash22(ip + g) + t * 0.10);
        vec2 r = g + o - ff;
        float d = dot(r, r);
        if (d < F1) { F1 = d; bid = ip + g; best = r; }
    }
    float d = sqrt(F1);
    float idh = hash21(bid);
    // rotational-index cyclic palette (no wrap blink)
    vec3 glass = iqPal(idh + t * 0.015, vec3(0.0, 0.33, 0.67));
    glass *= 0.55 + 0.45 * sin(t * 0.7 + idh * 6.2831);   // backlight breath
    float disc = smoothstep(0.42, 0.36, d);
    float lead = smoothstep(0.50, 0.42, d) - disc;
    col = mix(col, glass, disc);
    col = mix(col, vec3(0.015, 0.015, 0.02), lead);
    col += glass * exp(-d * d * 9.0) * 0.18;
    return col;
}

// 11 · concentric targets: Delaunay/Noland bullseyes, complementary ring
// pairs vibrating, hue index rotating.
vec3 tTargets(vec2 p, float t) {
    vec3 col = vec3(0.05, 0.05, 0.06);
    for (int i = 0; i < 4; i++) {
        float fi = float(i);
        vec2 c = vec2(0.52 * sin(t * 0.13 + fi * 1.7), 0.34 * sin(t * 0.10 + fi * 3.9));
        float d = length(p - c);
        float R = 0.30 + 0.06 * sin(t * 0.4 + fi);
        if (d > R) continue;
        float ringIdx = floor(d / R * 6.0);
        float hue = fract(ringIdx * 0.5 + fi * 0.27 + t * 0.02); // complementary pairs
        vec3 ring = iqPal(hue, vec3(0.0, 0.33, 0.67));
        float edge = smoothstep(0.45, 0.55, fract(d / R * 6.0));
        col = mix(col, ring * (0.75 + 0.25 * edge), smoothstep(R, R * 0.98, d));
    }
    return col;
}

// 12 · pointillist effervescence: no bubble at all — a field of pure-hue
// dots whose density and shimmer rise like fizz.
vec3 tPointillism(vec2 p, float t) {
    vec3 col = vec3(0.04, 0.06, 0.10);
    for (int o = 0; o < 3; o++) {
        float fo = float(o);
        float scale = 18.0 + fo * 14.0;
        vec2 sPos = p + vec2(0.0, -t * (0.03 + 0.025 * fo));
        vec2 cell = floor(sPos * scale);
        vec2 ff = fract(sPos * scale);
        float h = hash21(cell + fo * 13.1);
        // density wave: fizz fronts rising through the field
        float wave = 0.5 + 0.5 * sin(p.y * 3.0 - t * 0.9 + fo * 2.0);
        if (h > 0.25 + 0.35 * wave) continue;
        vec2 jit = hash22(cell * 1.9) * 0.7 + 0.15;
        float d = length(ff - jit);
        vec3 hue = iqPal(h * 3.0 + fo * 0.33, vec3(0.0, 0.33, 0.67));
        float tw = 0.6 + 0.4 * sin(t * (2.0 + h * 4.0) + h * 40.0);
        col += hue * exp(-d * d * 42.0) * 0.45 * tw;
    }
    return col;
}

// -------------------------------------------------------------- routing --

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p  = (uv - 0.5) * vec2(aspect, 1.0);

    // Treatment select, three tiers: auto-cycle < click-lock < held key.
    // Clicks live in the select pass state (tick = lock, same tick = auto,
    // elsewhere = next); a held piano key overrides momentarily.
    float lock = texture(u_state, vec2(0.5)).x;
    bool locked = lock > -0.5;
    int sel = locked ? int(lock + 0.5) : int(mod(u_time / CYCLE, 12.0));
    float bestEnv = 0.05;
    for (int i = 0; i < 12; i++) {
        if (u_keys[i] > bestEnv) { bestEnv = u_keys[i]; sel = i; }
    }

    vec3 col =
        sel == 0  ? tPhotoreal(p, u_time) :
        sel == 1  ? tSoapFilm(p, u_time) :
        sel == 2  ? tDispersion(p, u_time) :
        sel == 3  ? tChampagne(p, u_time) :
        sel == 4  ? tGuinness(p, u_time) :
        sel == 5  ? tFoam(p, u_time) :
        sel == 6  ? tMetaballs(p, u_time) :
        sel == 7  ? tManga(p, u_time) :
        sel == 8  ? tSeigaiha(p, u_time) :
        sel == 9  ? tStainedGlass(p, u_time) :
        sel == 10 ? tTargets(p, u_time) :
                    tPointillism(p, u_time);

    // index ticks (clickable): twelve marks along the bottom. Locked =
    // steady warm with a ring; auto = the live tick pulses softly.
    for (int i = 0; i < 12; i++) {
        vec2 tick = vec2((float(i) - 5.5) * 0.05 * aspect, -0.47);
        float d = length((p - tick) * vec2(1.0, 2.2));
        bool isSel = (i == sel);
        float pulse = locked ? 1.0 : 0.7 + 0.3 * sin(u_time * 3.0);
        float on = isSel ? pulse : 0.25;
        vec3 tint = isSel ? vec3(1.0, 0.8, 0.45) : vec3(0.5, 0.65, 0.72);
        col = mix(col, tint, smoothstep(0.016, 0.009, d) * on);
        if (isSel && locked) {
            float ring = smoothstep(0.006, 0.002, abs(d - 0.024));
            col = mix(col, vec3(1.0, 0.85, 0.55), ring * 0.8);
        }
    }

    fragColor = vec4(col, 1.0);
}
