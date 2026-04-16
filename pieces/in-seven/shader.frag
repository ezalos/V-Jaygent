// ABOUTME: In Seven — audio-reactive piece set to Pink Floyd's "Money" (7/4).
// ABOUTME: A 7-fold kaleidoscopic lattice with hyperbolic-feeling radial depth,
// ABOUTME: rotation locked to the 7/4 meter, sections driven by track time.
#version 300 es
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_level;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_audio_playing;
uniform float u_audio_time;

out vec4 fragColor;

const float PI  = 3.14159265359;
const float TAU = 6.28318530718;

const float BPM        = 120.0;
const float BEAT_DUR   = 60.0 / BPM;          // seconds per beat
const float BAR_BEATS  = 7.0;                 // 7/4
const float SECTOR     = TAU / 7.0;

// Track section boundaries (4:43 music-video edit — refined by eye).
const float T_INTRO_IN   =   0.0;
const float T_VERSE_IN   =  30.0;
const float T_SAX_IN     = 110.0;
const float T_GUITAR_IN  = 160.0;
const float T_RETURN_IN  = 240.0;
const float T_OUTRO_IN   = 265.0;
const float T_END        = 283.0;

// ---------- palette ----------

vec3 warmCycle(float t) {
    t = fract(t);
    vec3 c0 = vec3(1.00, 0.80, 0.50);
    vec3 c1 = vec3(1.00, 0.55, 0.30);
    vec3 c2 = vec3(0.85, 0.25, 0.25);
    vec3 c3 = vec3(0.55, 0.18, 0.40);
    vec3 c4 = vec3(0.42, 0.22, 0.48);
    if (t < 0.20) return mix(c0, c1,  t          * 5.0);
    if (t < 0.40) return mix(c1, c2, (t - 0.20)  * 5.0);
    if (t < 0.60) return mix(c2, c3, (t - 0.40)  * 5.0);
    if (t < 0.80) return mix(c3, c4, (t - 0.60)  * 5.0);
    return                mix(c4, c0, (t - 0.80) * 5.0);
}

// ---------- noise (for interior tile grain) ----------

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i),              hash(i + vec2(1,0)), u.x),
               mix(hash(i + vec2(0,1)),  hash(i + vec2(1,1)), u.x),
               u.y);
}

// ---------- section helpers ----------

float rampIn (float t, float at, float fade) { return smoothstep(at - fade, at + fade, t); }
float between(float t, float a, float b, float fade) {
    return smoothstep(a - fade, a + fade, t) * (1.0 - smoothstep(b - fade, b + fade, t));
}

// ---------- rhythm ----------

// 7/4 rotation — discrete beat snaps with a quick slide at the end of each beat.
float beatRotation(float t) {
    float beat    = t / BEAT_DUR;
    float idx     = floor(beat);
    float frac    = beat - idx;
    float snap    = smoothstep(0.72, 0.98, frac);
    return (idx + snap) * SECTOR;
}

// ---------- main ----------

void main() {
    // World space — origin at center, unit roughly = short-edge half.
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
           / min(u_resolution.x, u_resolution.y) * 2.0;

    float t     = u_time;                              // fed from audio clock
    float audio = max(u_audio_playing, 0.0);           // 0 or 1
    float bass  = u_audio_bass;
    float mid   = u_audio_mid;
    float high  = u_audio_high;
    float level = u_audio_level;

    // Section-weight modulation — how much each section "owns" the current frame.
    float wIntro  = 1.0 - rampIn(t, T_VERSE_IN,   2.0);
    float wVerse  = between(t, T_VERSE_IN,  T_SAX_IN,    2.0);
    float wSax    = between(t, T_SAX_IN,    T_GUITAR_IN, 2.0);
    float wGuitar = between(t, T_GUITAR_IN, T_RETURN_IN, 2.0);
    float wReturn = between(t, T_RETURN_IN, T_OUTRO_IN,  2.0);
    float wOutro  = rampIn(t, T_OUTRO_IN, 2.0);

    // --- rotation: discrete 7-step during rigid sections, smooth during guitar ---
    float rotRigid  = beatRotation(t);
    float rotSmooth = t * (SECTOR / BEAT_DUR);          // continuous at same avg rate
    float rigidness = 1.0 - wGuitar;                     // guitar section loosens
    float rot       = mix(rotSmooth, rotRigid, rigidness);

    // --- curvature: during guitar, the hyperbolic "depth" relaxes (disk opens) ---
    // logScale controls how many rings pack into the visible disk.
    float logScale  = mix(mix(3.2, 4.2, wVerse + wReturn) , 1.8, wGuitar);
    logScale        = mix(logScale, 4.6, wOutro);        // outro contracts

    // Apply rotation around origin to pixel.
    float cr = cos(rot), sr = sin(rot);
    vec2  q  = vec2(cr * p.x - sr * p.y, sr * p.x + cr * p.y);

    // Polar + 7-fold kaleido fold.
    float r   = length(q);
    float th  = atan(q.y, q.x);
    float th7 = mod(th + PI / 7.0, SECTOR) - PI / 7.0;   // fold to wedge centred on 0

    // Radial "hyperbolic" depth: ring index + fractional position within ring.
    // Rings pack toward r=1, each thinner than the last.
    float rClamp = clamp(r, 0.0, 0.999);
    float depth  = -log(1.0 - rClamp) * 0.50 + t * 0.02;
    float ring   = floor(depth * logScale * 0.5);
    float ringF  = fract(depth * logScale * 0.5);

    // Tile coordinate: (ring, wedge-angle).
    vec2  tc = vec2(ring, floor(th7 * 7.0 * pow(2.0, ring) / SECTOR + 0.5));

    // Interior noise — little grain inside each tile so adjacent tiles read
    // as facets rather than flat colour.
    float grain = vnoise(tc * 2.3 + vec2(0.0, ringF * 4.0)) * 0.20 - 0.10;

    // Base hue per tile, narrow spread so everything feels prismatic, not rainbow.
    float hueSeed = 0.08 * tc.x + 0.035 * tc.y
                  + 0.10 * (mid + 0.5 * high)
                  + t * 0.015;
    vec3  base    = warmCycle(hueSeed + grain);

    // Cell geometry — we draw the edges slightly dark so tiles read separated.
    float edge  = smoothstep(0.00, 0.04, abs(th7) - (SECTOR * 0.5 - 0.035))
                + smoothstep(0.00, 0.04, 0.05 - abs(ringF - 0.5) * 2.0);  // mid-ring line
    edge        = clamp(edge, 0.0, 1.0);
    vec3  col   = base * (1.0 - 0.45 * edge);

    // Ring/soft glow centred on origin that pulses with bass — the heartbeat.
    float pulse = 0.35 + 0.55 * bass * audio;
    float core  = exp(-pow(r * (3.6 - 1.2 * bass * audio), 2.0));
    col        += warmCycle(hueSeed + 0.15) * core * pulse;

    // --- INTRO: only a sparse 7-pointed glyph visible ---
    float glyph = 0.0;
    for (int k = 0; k < 7; k++) {
        float ang = float(k) * SECTOR;
        vec2  pt  = 0.42 * vec2(cos(ang), sin(ang));
        glyph    += exp(-42.0 * dot(p - pt, p - pt));
    }
    glyph *= 0.9;
    vec3 introCol = warmCycle(0.08 + t * 0.02) * glyph;

    // --- SAX: a radial band floods amber-gold ---
    float bandR = 0.55 + 0.08 * sin(t * 0.35);
    float saxBand = exp(-pow((r - bandR) / 0.09, 2.0));
    vec3  saxCol  = vec3(1.00, 0.62, 0.22) * saxBand
                  * (0.55 + 0.8 * mid * audio);

    // --- GUITAR: boundary cells sparkle with highs ---
    float rim    = smoothstep(0.55, 0.95, r);
    float spark  = step(0.85, vnoise(tc * 4.7 + t * 0.3))
                 * (0.4 + high * 1.4 * audio) * rim;
    vec3  sparkCol = warmCycle(hueSeed + 0.30) * spark;

    // --- OUTRO: contract toward the 7-pointed glyph, fade to black ---
    float outroFade = 1.0 - smoothstep(T_OUTRO_IN, T_END, t);
    float contract  = mix(1.0, 1.0, wOutro);  // (placeholder — collapse handled via mix weight)

    // Compose with section weights.
    col = mix(col * (0.10 + 0.15 * level * audio), col, wVerse + wReturn);
    col = mix(col, col * (0.70 + 1.10 * level * audio), wVerse + wReturn);
    col = mix(col, col + saxCol,                   wSax);
    col = mix(col, col + sparkCol * 1.2,           wGuitar);
    col = mix(col, introCol * 1.5,                 wIntro);
    col = mix(col, introCol * outroFade * 1.5,     wOutro);

    // Global bass bump on every beat.
    col *= 0.85 + 0.45 * bass * audio;

    // Vignette + hyperbolic rim fade toward the disk boundary.
    col *= 1.0 - smoothstep(0.95, 1.25, r);
    col *= 1.0 - 0.18 * dot(p, p);

    // Gamma.
    fragColor = vec4(pow(max(col, 0.0), vec3(0.90)), 1.0);
}
