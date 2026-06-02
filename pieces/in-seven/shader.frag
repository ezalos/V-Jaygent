// ABOUTME: In Seven — audio-reactive piece set to Pink Floyd's "Money" (7/4).
// ABOUTME: 7-fold lattice with drifting centre, breathing zoom, bar-level
// ABOUTME: rotation variation, fbm void-fill, sparse glitches, gentle flashes.
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

const float PI       = 3.14159265359;
const float TAU      = 6.28318530718;
const float BPM      = 120.0;
const float BEAT_DUR = 60.0 / BPM;
const float BAR_DUR  = BEAT_DUR * 7.0;
const float SECTOR   = TAU / 7.0;

const float T_INTRO  =  30.0;
const float T_SAX    = 110.0;
const float T_GUITAR = 160.0;
const float T_RETURN = 240.0;
const float T_OUTRO  = 265.0;
const float T_END    = 283.0;

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

vec3 saturateCol(vec3 c, float amt) {
    float lum = dot(c, vec3(0.299, 0.587, 0.114));
    return mix(vec3(lum), c, amt);
}

// ---------- noise ----------

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i),             hash(i + vec2(1,0)), u.x),
               mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
               u.y);
}

float fbmGrid(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.03; p += 1.7; a *= 0.55; }
    return v;
}

// ---------- helpers ----------

float rampIn (float t, float at, float fade) { return smoothstep(at - fade, at + fade, t); }
float between(float t, float a, float b, float fade) {
    return smoothstep(a - fade, a + fade, t) * (1.0 - smoothstep(b - fade, b + fade, t));
}

float beatRotation(float t, float snapStart) {
    float beat = t / BEAT_DUR;
    float idx  = floor(beat);
    float frac = beat - idx;
    float snap = smoothstep(snapStart, 1.0, frac);
    return (idx + snap) * SECTOR;
}

float beatPulse(float t, float bass) {
    float beat = t / BEAT_DUR;
    float frac = fract(beat);
    float env  = exp(-9.0 * frac);
    return env * (0.35 + 2.2 * bass);
}

// Slow, compound drift for the kaleido centre. Two octaves so it never lands
// on a fixed Lissajous — motion feels organic, not mechanical.
vec2 driftCentre(float t, float amplitude) {
    vec2 a = vec2(sin(t * 0.071), cos(t * 0.113));
    vec2 b = vec2(sin(t * 0.043 + 1.7), sin(t * 0.037 + 4.2));
    return amplitude * (0.6 * a + 0.4 * b);
}

// ---------- void-fill nebula ----------

vec3 voidNebula(vec2 p, float t, float level, float wVerse, float wSax, float wGuitar) {
    vec2 w = vec2(fbmGrid(p * 1.4 + vec2(0.0, t * 0.04)),
                  fbmGrid(p * 1.4 + vec2(5.2, 1.3) - t * 0.02));
    float n = fbmGrid(p * 1.6 + 2.6 * w);
    float density = smoothstep(0.30, 0.95, n);
    float amp = 0.25 * level + 0.10 * wVerse + 0.55 * wSax + 0.25 * wGuitar;
    vec3  c = warmCycle(n * 0.55 + t * 0.025);
    return c * density * amp;
}

// ---------- main field ----------

vec3 field(vec2 p, float t, float bass, float mid, float high, float level,
           float wIntro, float wVerse, float wSax, float wGuitar, float wOutro,
           float rot, float logScale, vec2 centre)
{
    // Move the symmetry centre.
    p = p - centre;

    float cr = cos(rot), sr = sin(rot);
    vec2  q  = vec2(cr * p.x - sr * p.y, sr * p.x + cr * p.y);

    // Sax / guitar: the lattice flexes via domain-warped noise.
    float flex = wSax * 0.12 + wGuitar * 0.28;
    if (flex > 0.0) {
        vec2 w = vec2(fbmGrid(q * 2.4 + t * 0.35), fbmGrid(q * 2.4 - t * 0.30 + 7.0));
        q     += (w - 0.5) * flex;
    }

    float r  = length(q);
    float th = atan(q.y, q.x);
    float th7 = mod(th + PI / 7.0, SECTOR) - PI / 7.0;

    float rc    = clamp(r, 0.0, 0.999);
    float depth = -log(1.0 - rc) * 0.5 + t * 0.02;
    float ring  = floor(depth * logScale * 0.5);
    float ringF = fract(depth * logScale * 0.5);

    vec2  tc   = vec2(ring, floor(th7 * 7.0 * pow(2.0, ring) / SECTOR + 0.5));
    float grain = vnoise(tc * 2.3 + vec2(0.0, ringF * 4.0)) * 0.22 - 0.11;

    float hueSeed = 0.09 * tc.x + 0.045 * tc.y
                  + 0.18 * (mid + 0.5 * high)
                  + t * 0.018
                  + wGuitar * t * 0.22;
    vec3  base = warmCycle(hueSeed + grain);

    float edge = smoothstep(0.00, 0.035, abs(th7) - (SECTOR * 0.5 - 0.03))
               + smoothstep(0.00, 0.035, 0.04 - abs(ringF - 0.5) * 2.0);
    edge       = clamp(edge, 0.0, 1.0);
    vec3  col  = base * (1.0 - 0.50 * edge);

    float coreGlow = exp(-pow(r * (3.4 - 1.6 * bass), 2.0));
    col           += warmCycle(hueSeed + 0.18) * coreGlow * (0.35 + 1.1 * bass);

    // Void-fill: add nebula where the lattice is dim.
    vec3 neb = voidNebula(p * 1.25, t, level, wVerse, wSax, wGuitar);
    col      = max(col, neb);

    // Intro: glyph points + impact shockwaves.
    if (wIntro > 0.01) {
        float glyph = 0.0;
        float wave  = 0.0;
        for (int k = 0; k < 7; k++) {
            float ang = float(k) * SECTOR + 0.3;
            vec2  pt  = 0.42 * vec2(cos(ang), sin(ang));
            float d2  = dot(p - pt, p - pt);
            glyph    += exp(-42.0 * d2);
            float rd  = length(p - pt);
            float tri = fract(t * 0.6 + float(k) * 0.13);
            float sw  = exp(-36.0 * pow(rd - tri * 0.9, 2.0)) * (1.0 - tri);
            wave     += sw * (0.3 + 1.2 * bass);
        }
        vec3 introCol = warmCycle(0.08 + t * 0.03) * (glyph * 0.9 + wave * 0.55);
        col = mix(col * (0.05 + 0.08 * level), introCol * 1.6, wIntro);
    }

    // Sax: two radial bands, both mid-modulated.
    if (wSax > 0.01) {
        float bandR1 = 0.55 + 0.08 * sin(t * 0.35);
        float bandR2 = 0.30 + 0.05 * sin(t * 0.18 + 1.3);
        float b1 = exp(-pow((r - bandR1) / 0.09, 2.0));
        float b2 = exp(-pow((r - bandR2) / 0.14, 2.0));
        vec3  sax = vec3(1.00, 0.62, 0.22) * (b1 + 0.55 * b2)
                  * (0.55 + 1.4 * mid);
        col += sax * wSax;
        col  = mix(col, saturateCol(col, 1.35), wSax * 0.6);
    }

    // Guitar: boundary sparkles keyed to highs.
    if (wGuitar > 0.01) {
        float rim   = smoothstep(0.35, 0.95, r);
        float spark = step(0.82, vnoise(tc * 5.7 + t * 0.7))
                    * (0.35 + 2.0 * high) * rim;
        vec3  scol  = warmCycle(hueSeed + 0.33 + t * 0.4) * spark;
        col        += scol * wGuitar * 1.3;
    }

    return col;
}

// ---------- main ----------

void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
           / min(u_resolution.x, u_resolution.y) * 2.0;

    float t     = u_time;
    float audio = max(u_audio_playing, 0.0);
    float bass  = u_audio_bass  * audio;
    float mid   = u_audio_mid   * audio;
    float high  = u_audio_high  * audio;
    float level = u_audio_level * audio;

    // Section weights.
    float wIntro  = 1.0 - rampIn(t, T_INTRO,  2.0);
    float wVerse  = between(t, T_INTRO,  T_SAX,    2.0);
    float wSax    = between(t, T_SAX,    T_GUITAR, 2.0);
    float wGuitar = between(t, T_GUITAR, T_RETURN, 2.0);
    float wReturn = between(t, T_RETURN, T_OUTRO,  2.0);
    float wOutro  = rampIn(t, T_OUTRO, 2.0);

    // --- sparse glitch: displace horizontal bands on rare hi peaks ---
    float glitchGate = step(0.82, high)
                     * step(0.90, hash(vec2(floor(t * 12.0), 7.0)))
                     * (1.0 - wIntro) * (1.0 - wOutro);
    if (glitchGate > 0.0) {
        float rowId    = floor(gl_FragCoord.y * 0.03);
        float rowRand  = hash(vec2(rowId, floor(t * 28.0)));
        float rowShift = (rowRand - 0.5) * 0.35 * glitchGate;
        // Apply to p in the same world-space units.
        p.x += rowShift;
    }

    // --- rotation: discrete snap when rigid, continuous during guitar ---
    float rotRigid  = beatRotation(t, 0.82);
    float rotSmooth = t * (SECTOR / BEAT_DUR);
    float rigidness = 1.0 - wGuitar;
    // Bar-level wobble so the rotation doesn't tick at a perfectly constant
    // rate across the verse/return. Period = 2 bars.
    float rotWobble = 0.12 * sin(t * TAU / (BAR_DUR * 2.0))
                    * (wVerse + wReturn);
    float rot       = mix(rotSmooth, rotRigid, rigidness) + rotWobble;

    // --- packing + breathing zoom across sections ---
    float logScale = mix(4.2, 2.0, wGuitar);
    logScale       = mix(logScale, 5.5, wOutro);

    // Verse: slow zoom-in (1.00 → 1.15). Sax: pulls back. Guitar: big wide
    // first, closer-in on the solo's second half. Outro: contract.
    float verseZoom  = 1.0 + 0.15 * clamp((t - T_INTRO) / (T_SAX - T_INTRO), 0.0, 1.0);
    float saxZoom    = 0.90 + 0.06 * sin(t * 0.20);
    float gpos       = clamp((t - T_GUITAR) / (T_RETURN - T_GUITAR), 0.0, 1.0);
    float guitarZoom = mix(0.80, 1.35, smoothstep(0.30, 0.85, gpos));
    float returnZoom = 1.10 - 0.08 * cos(t * 0.11);

    float zoom = 1.0;
    zoom = mix(zoom, verseZoom,  wVerse);
    zoom = mix(zoom, saxZoom,    wSax);
    zoom = mix(zoom, guitarZoom, wGuitar);
    zoom = mix(zoom, returnZoom, wReturn);
    zoom = mix(zoom, 0.70,       wOutro);

    // Beat squeeze — slight outward yank on each kick.
    float bp    = beatPulse(t, bass) * (1.0 - wGuitar * 0.6);
    float scale = zoom * (1.0 - 0.07 * bp);
    vec2  pS    = p / scale;

    // Outro: accelerating pull-in.
    float outroPull = smoothstep(T_OUTRO, T_END, t);
    pS /= (1.0 + outroPull * 3.5);

    // --- drifting kaleido centre ---
    float driftAmp = 0.05 * wIntro
                   + 0.14 * wVerse
                   + 0.22 * wSax
                   + 0.26 * wGuitar
                   + 0.10 * wReturn
                   + 0.04 * wOutro;
    vec2  centre = driftCentre(t, driftAmp);

    // Chromatic aberration proportional to bass (softened overall).
    float ca = (0.005 + 0.014 * bass + 0.008 * pow(level, 2.0)) * (1.0 - wIntro * 0.6);
    vec2  cn = normalize(pS + 1e-5) * ca;
    vec3 cR = field(pS + cn, t, bass, mid, high, level,
                    wIntro, wVerse, wSax, wGuitar, wOutro, rot, logScale, centre);
    vec3 cG = field(pS,      t, bass, mid, high, level,
                    wIntro, wVerse, wSax, wGuitar, wOutro, rot, logScale, centre);
    vec3 cB = field(pS - cn, t, bass, mid, high, level,
                    wIntro, wVerse, wSax, wGuitar, wOutro, rot, logScale, centre);
    vec3 col = vec3(cR.r, cG.g, cB.b);

    // Global beat slam — gentler than before.
    col *= 0.90 + 0.90 * bp;

    // Saturation punch that stays in the warm arc.
    col = saturateCol(col, 1.0 + 0.35 * bass + 0.15 * wSax);

    // Soft screen flash: multiplicative, warm-cream, short decay.
    float flashEnv = exp(-15.0 * fract(t / BEAT_DUR));
    float flash    = smoothstep(0.72, 0.95, bass) * 0.28 * flashEnv;
    col *= 1.0 + flash * vec3(0.95, 0.85, 0.70);

    // Guitar hue wash (unchanged).
    col = mix(col, col * warmCycle(0.3 + t * 0.12), wGuitar * 0.30);

    // Outro fade + final flash then black.
    float outroFade = 1.0 - smoothstep(T_OUTRO + 4.0, T_END, t);
    col *= outroFade;
    float finalFlash = exp(-3.0 * (t - (T_END - 1.2)) * (t - (T_END - 1.2)))
                     * smoothstep(T_OUTRO + 10.0, T_END - 0.5, t) * 1.0;
    col += vec3(1.0, 0.9, 0.7) * finalFlash;

    // Vignette + rim fade + gamma.
    float r = length(p);
    col *= 1.0 - smoothstep(1.05, 1.35, r);
    col *= 1.0 - 0.18 * dot(p, p);
    fragColor = vec4(pow(max(col, 0.0), vec3(0.88)), 1.0);
}
