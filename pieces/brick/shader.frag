// ABOUTME: Wall of bricks builds at song tempo for Pink Floyd's "Another Brick In The
// ABOUTME: Wall, Part Two" — cursor cracks it open, a furnace blazes through the gaps.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec2      u_mouse;
uniform sampler2D u_state;

#include "math.glsl"
#include "noise.glsl"
#include "tonemap.glsl"

out vec4 fragColor;

const float BPM          = 104.0;           // Pink Floyd studio track tempo
const float BEAT         = 60.0 / BPM;      // ~0.577s
const float ROW_COUNT    = 14.0;
const float BRICK_ASPECT = 2.15;            // width / height in y-normalized units
const float BUILD_START  = 0.35;
const float ROW_TIME     = BEAT;            // one row per beat — lockstep march
const float SLOT_TIME    = 0.13;            // per-brick slot-in animation

// ----- palettes ---------------------------------------------------------------

// Furnace: menacing not cozy. Mostly near-black, crimson, deep red. Orange and
// hot amber reserved for the top of the curve so they read as spikes of heat,
// not as the ambient temperature of the piece.
vec3 firePalette(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.004, 0.001, 0.002);   // near black
    vec3 c1 = vec3(0.180, 0.015, 0.010);   // oxblood
    vec3 c2 = vec3(0.560, 0.060, 0.020);   // blood red
    vec3 c3 = vec3(0.980, 0.340, 0.070);   // orange
    vec3 c4 = vec3(1.000, 0.860, 0.520);   // hot amber
    if (t < 0.32) return mix(c0, c1,  t          / 0.32);
    if (t < 0.60) return mix(c1, c2, (t - 0.32)  / 0.28);
    if (t < 0.84) return mix(c2, c3, (t - 0.60)  / 0.24);
    return                mix(c3, c4, (t - 0.84) / 0.16);
}

// Concrete brick surface — neutral dark grey with charcoal grain, per-brick
// tint jitter, and a ghost-face hollow (Scarfe echo — faint but visible at
// brick size).
vec3 brickSurface(vec2 buv, vec2 bid) {
    float seed  = hash21(bid * vec2(37.13, 91.7) + 7.1);
    float seed2 = hash21(bid * vec2( 7.3,  13.9) + 2.7);
    mat2  r     = rot2d(seed * TAU);
    vec2  q     = r * (buv - 0.5) * 6.5;

    float grain = fbm(q) * 0.65 + 0.35;
    vec3  base  = vec3(0.050, 0.045, 0.042);   // neutral concrete
    vec3  dark  = vec3(0.022, 0.018, 0.016);   // grain shadow
    vec3  col   = mix(dark, base, grain);

    // Per-brick tint jitter — some bricks run slightly warmer/cooler so the
    // grid doesn't read as a uniform field of pixels.
    col.r += (seed  - 0.5) * 0.020;
    col.b -= (seed2 - 0.5) * 0.008;

    // Ghost face — two sunken eye-hollows and a shadowed mouth, offset per
    // brick. Amplitude dialed up so the face reads at brick size but still
    // feels like a glimpse rather than an illustration.
    vec2  centered = (buv - vec2(0.5, 0.58)) * vec2(1.0, 1.35);
    float fshift   = (seed2 - 0.5) * 0.14;
    float eyeL     = length(centered - vec2(-0.16 + fshift, 0.10));
    float eyeR     = length(centered - vec2( 0.16 + fshift, 0.10));
    float mouth    = length((centered - vec2(fshift, -0.22)) * vec2(0.85, 1.7));
    float hollow   = exp(-eyeL * 16.0) + exp(-eyeR * 16.0) + exp(-mouth * 10.0) * 0.55;
    col *= 1.0 - hollow * 0.52;

    return col;
}

// ----- main -------------------------------------------------------------------

void main() {
    vec2  res       = u_resolution;
    vec2  screenUV  = gl_FragCoord.xy / res;
    // y-normalized coords: p.y in [0,1], p.x in [0, aspectX].
    vec2  p         = gl_FragCoord.xy / res.y;

    float rowH   = 1.0 / ROW_COUNT;
    float brickW = rowH * BRICK_ASPECT;

    float rowF   = p.y / rowH;
    float row    = floor(rowF);
    float inRow  = fract(rowF);

    float colOff = mod(row, 2.0) * 0.5;
    float colF   = (p.x / brickW) + colOff;
    float col    = floor(colF);
    float inCol  = fract(colF);

    vec2 bid = vec2(col, row);

    // ----- wall-build timing --------------------------------------------------
    // Row 0 (bottom) first, rows march upward at BEAT. Within a row, a quick
    // left-to-right cascade so the row doesn't slap down all at once.
    float colPhase = 0.035 * col;
    float placeT   = BUILD_START + row * ROW_TIME + colPhase;
    float slot     = smoothstep(placeT, placeT + SLOT_TIME, u_time);

    // Brick drops from above into its cell — in-row coordinate shifts.
    float effInRow = inRow - (1.0 - slot) * 1.5;
    float mortarV  = 0.055;
    float mortarH  = 0.028;
    float shapeMask = step(mortarV, effInRow) * step(effInRow, 1.0 - mortarV)
                    * step(mortarH, inCol)    * step(inCol,    1.0 - mortarH);

    // ----- damage -------------------------------------------------------------
    float dmg     = texture(u_state, screenUV).r;
    // Per-fragment jitter for jagged shatter edge — fine-grain noise so brick
    // edges disintegrate rather than dissolve uniformly.
    float jitter  = fbm(gl_FragCoord.xy * 0.022 + bid * 3.7);
    float shatter = smoothstep(0.38, 0.88, dmg + (jitter - 0.5) * 0.55);

    float brickPresence = shapeMask * (1.0 - shatter);

    // ----- fire background ---------------------------------------------------
    // Domain-warped FBM rising upward, bottom-hot. Tuned to sit mostly in
    // the oxblood/red band — the piece's default mood is menacing, not warm.
    float flameT = u_time * 0.55;
    vec2  fp     = p * vec2(2.6, 3.2);
    float warpN  = fbm(fp * 0.9 + vec2(0.0, -flameT * 2.3));
    float flameN = fbm(fp + vec2(warpN * 1.4, -flameT * 2.6));
    float taper  = pow(1.0 - clamp(p.y, 0.0, 1.0) * 0.85, 1.8);
    float heat   = clamp(flameN * 0.55 + taper * 0.32, 0.0, 1.0);
    // Fast flicker — makes the furnace read as alive at 60fps, not painted.
    float flick  = (hash21(floor(fp * 48.0) + floor(u_time * 28.0)) - 0.5) * 0.12;
    heat = clamp(heat + flick, 0.0, 1.0);
    vec3  fireCol = firePalette(heat);

    // ----- brick color --------------------------------------------------------
    vec3 brickCol = brickSurface(vec2(inCol, clamp(effInRow, 0.0, 1.0)), bid);
    // Top-edge rim catch — a thin bright line picking up furnace light, only
    // on the brick's top face, which sells the bond pattern as 3D-ish.
    float topRim = smoothstep(0.94, 0.99, effInRow)
                 * smoothstep(mortarH, mortarH + 0.02, inCol)
                 * smoothstep(mortarH, mortarH + 0.02, 1.0 - inCol);
    brickCol += firePalette(0.55) * topRim * 0.18;

    // ----- composite ---------------------------------------------------------
    vec3 col3 = mix(fireCol, brickCol, brickPresence);

    // Spark at the shatter boundary — only inside the brick shape, only on
    // placed bricks. Gaussian in shatter-space, peak near mid-threshold.
    float edge = exp(-pow((shatter - 0.55) * 4.8, 2.0)) * shapeMask * slot;
    col3 += firePalette(0.95) * edge * 2.2;

    // Ember spray on the fire side of the seam — tiny bright pixels that drift
    // upward, intensity proportional to local damage.
    vec2  sparkCell = floor(gl_FragCoord.xy * 0.5 - vec2(0.0, u_time * 90.0));
    float sparkHash = hash21(sparkCell);
    float sparkOn   = step(0.996, sparkHash) * (1.0 - brickPresence) * (0.2 + 0.8 * dmg);
    col3 += firePalette(0.98) * sparkOn * 1.4;

    // ----- beat pulse --------------------------------------------------------
    // Furnace breathes on-beat; bricks stay stoic.
    float beatPhase = fract(u_time / BEAT);
    float pulse     = 1.0 + 0.11 * pow(1.0 - beatPhase, 3.0);
    col3 = mix(col3, col3 * pulse, 1.0 - brickPresence);

    // ----- tone + vignette ---------------------------------------------------
    col3 = reinhardPartial(col3 * 1.2, 4.0);
    vec2  vp   = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y);
    col3 *= 1.0 - 0.32 * dot(vp, vp);

    // Opening fade so the very first frame doesn't flash.
    col3 *= smoothstep(0.0, 0.35, u_time);

    fragColor = vec4(pow(max(col3, 0.0), vec3(0.92)), 1.0);
}
