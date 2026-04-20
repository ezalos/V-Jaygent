// ABOUTME: Chamber — techno piece. Carved stone chamber lit by a pinpoint core;
// ABOUTME: kick pulses propagate outward and slam into relief columns.
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
const float DURATION = 375.0;

// ---------- palette: deep ember ramp, monotone warm ----------

vec3 ember(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.012, 0.005, 0.010);    // near-black warm
    vec3 c1 = vec3(0.120, 0.030, 0.030);    // deep burgundy
    vec3 c2 = vec3(0.420, 0.110, 0.045);    // rust
    vec3 c3 = vec3(0.880, 0.330, 0.110);    // ember orange
    vec3 c4 = vec3(1.000, 0.720, 0.320);    // warm amber, peaks only
    if (t < 0.25) return mix(c0, c1,  t          * 4.0);
    if (t < 0.55) return mix(c1, c2, (t - 0.25)  * 3.3333);
    if (t < 0.85) return mix(c2, c3, (t - 0.55)  * 3.3333);
    return                mix(c3, c4, (t - 0.85) * 6.6666);
}

// ---------- noise ----------

float hash(vec2 p)  { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float hash1(float n){ return fract(sin(n * 91.345) * 47453.731); }

float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i),             hash(i + vec2(1,0)), u.x),
               mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
               u.y);
}

float fbm2(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.03; p += 1.7; a *= 0.55; }
    return v;
}

// Angular noise — wraps around TAU so rim relief is seamless.
float nangleWrap(float a, float octaves) {
    float s = a * octaves / TAU;
    float i = floor(s), f = fract(s);
    f = f * f * (3.0 - 2.0 * f);
    float h0 = hash1(mod(i,         octaves));
    float h1 = hash1(mod(i + 1.0,   octaves));
    return mix(h0, h1, f);
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

    // Mouse: x = yaw (pan), y = exponential zoom into the chamber.
    // Idle = brisk drift so the frames don't look static.
    bool  mouseIdle = (u_mouse.x == 0.0 && u_mouse.y == 0.0);
    float mouseYaw, zoom;
    if (mouseIdle) {
        mouseYaw = t * 0.060;
        zoom     = 1.0 + 0.12 * sin(t * TAU / 29.0);
    } else {
        mouseYaw = ((u_mouse.x / u_resolution.x) - 0.5) * TAU * 1.2
                 + t * 0.006;
        float my = (u_mouse.y / u_resolution.y) - 0.5;
        zoom     = exp(my * 1.7);                 // ~[0.43, 2.33]
    }

    // Bass lurches the camera forward on each kick — small amplitude,
    // large effect. Geometry (not brightness) responds to the beat.
    zoom *= 1.0 - 0.06 * bass;

    // Slow radial breath — chamber expands/contracts on a 29s period.
    float breath = 1.0 + 0.055 * sin(t * TAU / 29.0);

    float r  = length(p) / (breath * zoom);
    float th = atan(p.y, p.x) + mouseYaw;

    // --- Arc exposure across 375s:
    //   0..30s    : 0.25 -> 1.0  (emerge from black)
    //   30..300s  : 1.0
    //   300..370s : 1.0 -> 1.35  (peak illumination)
    //   endgame handled at the bottom with flash + crush.
    float arc = smoothstep(0.0, 30.0, t) * 0.75 + 0.25;
    arc      *= 1.0 + 0.35 * smoothstep(300.0, 370.0, t);

    // --- Relief field. Multi-octave, seamless over TAU. relief ∈ [0,1].
    // High relief = column protrudes inward (close); low = deep recess (far).
    // A slow fbm-driven angle warp makes the columns breathe and twist —
    // louder audio twists harder, so the stone feels liquid under pressure.
    float warpAmt  = 0.08 + 0.28 * level;
    float warpedTh = th + (fbm2(vec2(th * 1.3, t * 0.22)) - 0.5) * warpAmt;

    float relief = nangleWrap(warpedTh, 11.0) * 0.55
                 + nangleWrap(warpedTh, 23.0) * 0.30
                 + nangleWrap(warpedTh, 47.0) * 0.15;

    // Wall radius at this angle. Columns at ~0.50, recesses at ~1.05.
    // Bass amplifies the relief depth — kicks physically push the
    // columns inward, so the chamber closes on the beat.
    float rimR = 1.05 - (0.55 + 0.22 * bass) * relief;

    // --- Haze density: loud mids pack the air with smoke; quiet = clear.
    float sigma    = 1.1 + 5.2 * mid;
    float transmit = exp(-sigma * r);

    // --- Core: a tight distant pinpoint. Not a sun.
    float coreEnv  = 0.30 + 1.20 * bass;
    float coreGlow = exp(-r * 22.0) * coreEnv * 1.40
                   + exp(-r *  5.2) * coreEnv * 0.10;

    // --- Outward pulse. A Gaussian ring whose propagation speed rides
    // the bass — kicks accelerate the ring outward so the attack reads
    // as motion, not only brightness. Continuous phase (so there's
    // always something moving) with bass-driven velocity on top.
    float pulseSpeed = 0.70 + 0.55 * bass;
    float pulseR     = fract(r * 0.78 - t * pulseSpeed);
    float pulseA     = exp(-pow((pulseR - 0.5) * 5.0, 2.0));
    float pulseAmp   = 0.10 + 1.70 * bass;

    // --- Air luminance: core + pulse in the haze, plus faint grain.
    float airLum = coreGlow + pulseA * pulseAmp * transmit
                             * (1.0 - smoothstep(1.00, 1.15, r));

    float airGrain = fbm2(vec2(th * 1.4, r * 3.2) + t * 0.07);
    airLum        += (0.05 + 0.35 * mid) * airGrain * transmit * 0.28;

    // --- Wall lighting. Light reached the wall at this angle, attenuated by
    // the haze it travelled through. Close columns get more, recesses less.
    float reachedLight = exp(-sigma * rimR);
    float wallLight    = reachedLight
                       * (0.95 + 0.50 * level + 1.20 * bass);

    // Chiaroscuro: columns (high relief) read bright, recesses fall to black.
    float reliefShade = mix(0.08, 1.0, relief);

    // Bass pulse at the rim: when the pulse radius lands on rimR, the wall
    // briefly takes an extra kick of light. Geometry (pulse arrival) now
    // varies with bass via pulseSpeed + rimR above; this is the luminance
    // overlay on top of that geometric event.
    float pulseAtRim_r  = fract(rimR * 0.78 - t * pulseSpeed);
    float pulseAtRim    = exp(-pow((pulseAtRim_r - 0.5) * 5.0, 2.0));
    float rimKick       = pulseAtRim * (0.25 + 1.90 * bass);

    // Stone texture on the wall surface — multi-scale fbm in (angle, depth).
    float stone = fbm2(vec2(th * 8.5, r * 16.0)) * 0.45 + 0.65;
    stone      *= 0.80 + 0.35 * fbm2(vec2(th * 33.0, r * 60.0));  // fine grain

    // Column glints: highs fire off individual columns at random.
    float bucket   = floor(t * 12.0);
    float columnId = floor(th / TAU * 13.0 + 100.0);
    float glint    = step(0.78 - 0.32 * high,
                          hash1(columnId + bucket * 0.37))
                   * (0.30 + 1.6 * high);

    // Wall presence: 0 inside the chamber, ramps up through the surface,
    // solid dark further in (rock behind the first surface).
    float onWall   = smoothstep(rimR - 0.015, rimR + 0.008, r);
    float intoRock = smoothstep(rimR + 0.008, rimR + 0.14, r);

    float wallLum = wallLight * reliefShade * stone
                  * (1.0 + rimKick + glint);
    wallLum      *= (1.0 - intoRock * 0.90);    // fall into deep rock
    wallLum      *= onWall;

    // --- Compose: air shows where the wall isn't, wall shows where it is.
    float lum = airLum * (1.0 - onWall) + wallLum;

    // A trace of ambient emission so pure silence isn't dead-black.
    lum += 0.012 * exp(-r * 1.4) * (1.0 - step(DURATION - 1.5, t));

    // Apply arc exposure.
    lum *= arc;

    // --- Palette lookup. Audio level compresses the curve so peaks reach hot
    // amber and the quiet passages stay in deep burgundy / black.
    float expose = 0.85 + 0.55 * level;
    vec3  col    = ember(clamp(lum * expose, 0.0, 1.0));

    // --- End: ember flash + crush to black.
    float endFade  = 1.0 - smoothstep(DURATION - 1.2, DURATION, t);
    col           *= endFade;
    float endFlash = smoothstep(DURATION - 1.5, DURATION - 1.2, t)
                   * (1.0 - smoothstep(DURATION - 1.2, DURATION - 0.8, t));
    col += vec3(1.0, 0.72, 0.38) * endFlash * 1.4;

    // Vignette deepens the chamber feel.
    col *= 1.0 - 0.28 * dot(p, p);

    // Gentle gamma — the piece lives at low luminance already.
    fragColor = vec4(pow(max(col, 0.0), vec3(0.85)), 1.0);
}
