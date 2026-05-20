#version 300 es
// ABOUTME: fracture-plates layer — Voronoi tessellation of tempered iron plates
// ABOUTME: floating on a hidden molten substrate, struck white-hot on the downbeat.
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform sampler2D u_below;
uniform float u_audio_playing;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_downbeat;
uniform float u_bar_phase;
uniform float u_beat_phase;
uniform int   u_beat_index;
uniform float u_to_section_change;
uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_song_progress;
uniform float u_energy_smooth;
out vec4 fragColor;

const float PI = 3.14159265;

float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2  hash22(vec2 p){
    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)),
                          dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}
float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i), b = hash21(i + vec2(1, 0));
    float c = hash21(i + vec2(0, 1)), d = hash21(i + vec2(1, 1));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p){
    float v = 0.0, a = 0.55;
    mat2 r = mat2(0.80, 0.60, -0.60, 0.80);
    for (int i = 0; i < 5; i++){ v += a * vnoise(p); p = r * p * 2.0 + vec2(1.7, 9.2); a *= 0.55; }
    return v;
}
vec3 forgeColor(float t){
    t = clamp(t, 0.0, 1.0);
    vec3 c = mix(vec3(0.030, 0.018, 0.012), vec3(0.34, 0.075, 0.060), smoothstep(0.00, 0.34, t));
    c = mix(c, vec3(0.86, 0.255, 0.050), smoothstep(0.34, 0.62, t));
    c = mix(c, vec3(1.00, 0.62, 0.18),   smoothstep(0.62, 0.86, t));
    c = mix(c, vec3(1.00, 0.93, 0.80),   smoothstep(0.86, 1.00, t));
    return c;
}
float lum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }

// cell-point offset within its cell — idle Lloyd-ish drift + per-cell hammer jolt
vec2 cellOffset(vec2 id, float driftT, float jolt){
    vec2 o = hash22(id);
    o += 0.15 * sin(driftT * 0.5 + 6.2831 * hash22(id + 7.0));
    o += jolt * (hash22(id + 19.3) * 2.0 - 1.0);
    return clamp(o, 0.07, 0.93);
}

// Voronoi F1 + edge distance. Returns (F1, edgeDist, cellId.x, cellId.y).
// Caches the 3x3 cell offsets so both passes share one set of hashes.
vec4 voronoi(vec2 q, float driftT, float jolt){
    vec2 ip = floor(q), fp = fract(q);
    vec2 cells[9];
    for (int j = -1; j <= 1; j++)
        for (int i = -1; i <= 1; i++)
            cells[(j + 1) * 3 + (i + 1)] = cellOffset(ip + vec2(i, j), driftT, jolt);

    vec2 mr = vec2(0.0), midId = vec2(0.0);
    float md = 8.0;
    for (int j = -1; j <= 1; j++)
        for (int i = -1; i <= 1; i++){
            vec2 g = vec2(float(i), float(j));
            vec2 r = g + cells[(j + 1) * 3 + (i + 1)] - fp;
            float d = dot(r, r);
            if (d < md){ md = d; mr = r; midId = ip + g; }
        }
    float medge = 8.0;
    for (int j = -1; j <= 1; j++)
        for (int i = -1; i <= 1; i++){
            vec2 g = vec2(float(i), float(j));
            vec2 r = g + cells[(j + 1) * 3 + (i + 1)] - fp;
            vec2 diff = r - mr;
            if (dot(diff, diff) > 1e-4)
                medge = min(medge, dot(0.5 * (mr + r), normalize(diff)));
        }
    return vec4(sqrt(md), medge, midId);
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    float playing = u_audio_playing;

    // ---- inputs: real audio when playing, synthetic drivers when idle ----
    float bass  = mix(0.30 + 0.26 * sin(u_time * 1.6),       u_audio_bass,  playing);
    float mid   = mix(0.24 + 0.18 * sin(u_time * 0.9 + 1.0), u_audio_mid,   playing);
    float high  = mix(0.18 + 0.14 * sin(u_time * 2.7 + 2.0), u_audio_high,  playing);
    float barPh = mix(fract(u_time * 0.30),                  u_bar_phase,   playing);
    float beatPh= mix(fract(u_time * 1.20),                  u_beat_phase,  playing);
    float energy= mix(0.34 + 0.16 * sin(u_time * 0.55),      u_energy_smooth, playing);
    float beatDir = mod(float(u_beat_index), 2.0) * 2.0 - 1.0;
    float intro = smoothstep(0.0, 0.055, u_song_progress);   // first ~15s ramps up from cold

    // screen-space position — the composition reference, stable under the warp
    vec2 sp = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);

    // ---- macro composition: two drifting forge-hearts + a hot floor ----
    // turns a uniform tessellation into a composed field — bright hearts,
    // cold-iron periphery — so the squint reads a macro light/dark structure.
    // each section re-seeds the heart configuration, so sections read distinct
    float secSeed = float(u_section_id) * 1.7;
    vec2 h1 = vec2(0.42 * sin(u_time * 0.124 + secSeed), -0.06 + 0.20 * sin(u_time * 0.167 + secSeed));
    vec2 h2 = vec2(0.40 * sin(u_time * 0.091 + 2.4 + secSeed), 0.10 + 0.18 * cos(u_time * 0.143 + secSeed));
    float g1 = exp(-dot(sp - h1, sp - h1) * 3.1);
    float g2 = exp(-dot(sp - h2, sp - h2) * 4.2);
    float floorGlow = smoothstep(0.62, -0.5, sp.y);          // forge is fiercest low
    float macro = clamp(max(max(g1, 0.74 * g2), 0.40 * floorGlow), 0.0, 1.0);

    // ---- coordinate field ----
    vec2 p = sp;
    // heat-refraction: bend the cell field along the hearth-glow gradient below
    vec3 below = texture(u_below, uv).rgb;
    float e = 2.0 / u_resolution.y;
    float hgx = lum(texture(u_below, uv + vec2(e, 0)).rgb) - lum(texture(u_below, uv - vec2(e, 0)).rgb);
    float hgy = lum(texture(u_below, uv + vec2(0, e)).rgb) - lum(texture(u_below, uv - vec2(0, e)).rgb);
    p += vec2(hgx, hgy) * 0.50;

    // melodic-lead domain warp
    float warpAmt = 0.08 + 0.34 * mid;
    p += warpAmt * (vec2(fbm(p * 1.3 + u_time * 0.12),
                         fbm(p * 1.3 + u_time * 0.12 + 11.0)) - 0.5);

    // per-beat lattice rock (visible phase-lock)
    float rock = 0.055 * sin(beatPh * PI) * beatDir;
    float cs = cos(rock), sn = sin(rock);
    p = mat2(cs, -sn, sn, cs) * p;

    // pre-tension: lattice squeezes in the last 6s of a section
    float pretension = smoothstep(6.0, 0.0, u_to_section_change);
    float scale = 2.55 * (1.0 - 0.12 * bass) * (1.0 + 0.11 * pretension);
    vec2 q = p * scale;

    // ---- cursor: the hammer ----
    vec2 mw = (u_mouse.x == 0.0 && u_mouse.y == 0.0) ? vec2(1e4)
              : (u_mouse - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y) * 2.0;
    vec2 worldP = sp * 2.0;
    float crater = exp(-dot(worldP - mw, worldP - mw) / (0.36 * 0.36));

    // ---- hammer-jolt magnitude (per-cell direction lives in cellOffset) ----
    float jolt = exp(-3.6 * barPh) * (0.075 + 0.05 * bass);
    jolt += 0.045 * u_downbeat;
    jolt += 0.11 * crater;                  // the cursor re-fractures locally

    // ---- the iron plates: macro Voronoi ----
    vec4 vMacro = voronoi(q, u_time, jolt);
    float F1 = vMacro.x;
    float medge = vMacro.y;
    vec2  midId = vMacro.zw;
    float cellH = hash21(midId * 1.31 + 4.7);

    // ---- hidden molten substrate: a finer Voronoi the plates float on ----
    // glimpsed through the open cracks; its sub-seams reward a close look.
    vec2 qSub = p * (scale * 2.7) + 31.0;
    vec4 vSub = voronoi(qSub, u_time * 0.62 + 17.0, jolt * 0.35);
    float subCore  = 1.0 - smoothstep(0.0, 0.90, vSub.x);
    float subSeam  = smoothstep(0.060, 0.0, vSub.y);
    float subGrain = smoothstep(0.130, 0.0, vSub.y);    // faint fracture grain inside plates

    // ---- temperature: macro envelope x per-plate spread x core gradient ----
    // master heat — energy arc, intro ramp, and a within-section creep
    float master = clamp(0.12 + 1.00 * energy, 0.0, 0.92) * intro
                   * (0.90 + 0.18 * u_section_progress);
    float core  = 1.0 - smoothstep(0.0, 0.92, F1);          // hotter toward cell centre
    float micro = fbm(q * 2.3 + midId) - 0.5;               // hammered-metal grain
    float hearth = lum(below);
    float plateTemp = master
        * (0.10 + 1.05 * macro)                             // WHERE it is hot
        * (0.30 + 1.05 * cellH)                             // plate-to-plate cold..white-hot
        * (0.45 + 0.60 * core)                              // domed-plate core gradient
        + 0.16 * hearth + 0.10 * micro;
    plateTemp += 0.08 * subGrain * macro * master;          // the iron's own grain — look closer
    plateTemp = clamp(plateTemp, 0.0, 1.0);

    // ---- seams: bright in the hot zones, dark cracks in cold iron ----
    float seamW = 0.034 + 0.05 * high * hash21(midId + 1.0);
    float seam  = smoothstep(seamW, 0.0, medge);
    float seamHeat = clamp(0.16 + 1.15 * macro, 0.0, 1.2) * intro;
    // flare brightens on the strike, then cools as jolt decays over the bar
    float flare = seam * seamHeat * (0.30 + 3.0 * jolt + 1.6 * u_downbeat + 0.7 * crater);

    // ---- molten substrate seen through the open cracks ----
    // the molten cools WITH the forge — master gates it so the breakdown stays dark
    float crackOpen = smoothstep(0.085, 0.0, medge);        // wider than the seam thread
    float moltenTemp = clamp(master * (0.62 + 0.55 * subCore) * (0.50 + 0.80 * macro), 0.0, 1.0);
    vec3 moltenCol = forgeColor(moltenTemp);
    moltenCol += forgeColor(clamp(0.58 + 0.40 * subSeam, 0.0, 1.0)) * subSeam * 0.40 * macro * master;

    // ---- compose: plates over molten, lead always-on band, strike flare on top ----
    vec3 col = forgeColor(plateTemp * 0.82 + 0.06);
    col *= 0.30 + 0.70 * core + 0.28 * cellH;               // interior shading -> depth
    col = max(col, below * 0.55);                           // hearth glows through cold plates
    // the plates float on the molten core — it glows out through the cracks
    col = mix(col, moltenCol, crackOpen * (0.32 + 0.50 * macro));
    // the white-hot strike flare rides on top of the open crack
    vec3 seamCol = forgeColor(clamp(0.58 + flare, 0.0, 1.0));
    col += seamCol * seam * (0.32 + flare) * (0.22 + macro);

    fragColor = vec4(col, 1.0);
}
