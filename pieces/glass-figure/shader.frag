// ABOUTME: glass-figure — fivefold quasicrystalline interference in response to
// ABOUTME: Philip Glass's Metamorphosis Two. Five plane waves drift incommensurately.
#version 300 es
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;

#include "math.glsl"
#include "noise.glsl"
#include "tonemap.glsl"

out vec4 fragColor;

const float DURATION = 420.0;            // ~7 minutes, canonical Metamorphosis Two
const float BPM      = 72.0;             // Glass's tempo
const float BEAT     = 60.0 / BPM;       // seconds per quarter note (~0.833)

// Five incommensurate envelope periods. Distinct primes-ish so the voices
// never synchronise. The image of "looks like a repeat, isn't."
const float PERIOD_0 = 41.0;
const float PERIOD_1 = 59.0;
const float PERIOD_2 = 73.0;
const float PERIOD_3 = 89.0;
const float PERIOD_4 = 107.0;

// ---------- warm palette (per-piece, inline by VISION policy) ----------
// Near-black → burgundy → ember → amber → warm cream. Luminance only.
vec3 glassPalette(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.012, 0.006, 0.012);
    vec3 c1 = vec3(0.105, 0.036, 0.028);
    vec3 c2 = vec3(0.360, 0.122, 0.060);
    vec3 c3 = vec3(0.820, 0.340, 0.132);
    vec3 c4 = vec3(0.980, 0.720, 0.380);
    vec3 c5 = vec3(1.000, 0.930, 0.790);
    if (t < 0.20) return mix(c0, c1,  t         / 0.20);
    if (t < 0.45) return mix(c1, c2, (t - 0.20) / 0.25);
    if (t < 0.72) return mix(c2, c3, (t - 0.45) / 0.27);
    if (t < 0.90) return mix(c3, c4, (t - 0.72) / 0.18);
    return                mix(c4, c5, (t - 0.90) / 0.10);
}

// ---------- five-beat chord breath (Glass's 5-note cycle at 72 BPM) ----------
// Subtle exposure breathing; not a beat drop.
float beatAccent(int b) {
    if (b == 0) return 1.00;
    if (b == 1) return 0.92;
    if (b == 2) return 0.88;
    if (b == 3) return 0.96;
    return              0.90;
}

// ---------- main ----------

void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
           / min(u_resolution.x, u_resolution.y);
    p *= 2.0;   // ~4 full wavelengths across the short axis at baseK=12

    float t = u_time;

    // Cursor shift: slides the origin of the wave sum. Non-invasive; idle = centred.
    bool mouseIdle = (u_mouse.x == 0.0 && u_mouse.y == 0.0);
    vec2 mWorld = (u_mouse - 0.5 * u_resolution.xy)
                / min(u_resolution.x, u_resolution.y) * 2.0;
    if (mouseIdle) mWorld = vec2(0.0);
    p -= 0.35 * mWorld;

    // Very slow uniform drift. The quasicrystal pattern is already
    // quasiperiodic, but without this nudge it reads as frozen to the
    // eye. Two incommensurate sinusoids so the drift path never retraces.
    vec2 drift = 0.14 * vec2(sin(t * 0.017) + 0.55 * sin(t * 0.041 + 1.1),
                             cos(t * 0.013) + 0.55 * cos(t * 0.034 + 2.4));
    p += drift;

    // ----- five voice envelopes -----
    // Each voice has its own slow amplitude drift (incommensurate periods).
    float amps[5];
    amps[0] = 0.40 + 0.60 * (0.5 + 0.5 * sin(TAU * t / PERIOD_0 + 0.0));
    amps[1] = 0.40 + 0.60 * (0.5 + 0.5 * sin(TAU * t / PERIOD_1 + 1.7));
    amps[2] = 0.40 + 0.60 * (0.5 + 0.5 * sin(TAU * t / PERIOD_2 + 3.1));
    amps[3] = 0.40 + 0.60 * (0.5 + 0.5 * sin(TAU * t / PERIOD_3 + 4.4));
    amps[4] = 0.40 + 0.60 * (0.5 + 0.5 * sin(TAU * t / PERIOD_4 + 5.8));

    // The arc: five voices differentiate. Voice 0 grows; 1..4 decay.
    // By t=415 one voice dominates — the field becomes a near-standing
    // wave from a single direction, the visual analogue of Glass's
    // arrival on a resolved chord.
    float arc = smoothstep(280.0, 410.0, t);
    amps[0] *= mix(1.0, 3.4,  arc);
    amps[1] *= mix(1.0, 0.08, arc);
    amps[2] *= mix(1.0, 0.08, arc);
    amps[3] *= mix(1.0, 0.08, arc);
    amps[4] *= mix(1.0, 0.08, arc);

    // Normalise so peak interference amplitude stays in a known range.
    float tot = amps[0] + amps[1] + amps[2] + amps[3] + amps[4];
    float invT = 1.0 / max(tot, 1e-3);
    amps[0] *= invT;
    amps[1] *= invT;
    amps[2] *= invT;
    amps[3] *= invT;
    amps[4] *= invT;

    // ----- coarse quasicrystal sum -----
    float fCoarse = 0.0;
    for (int i = 0; i < 5; i++) {
        float fi    = float(i);
        float ang   = fi * (TAU / 5.0) + 0.40;                           // star rotated off-axis
        vec2  dir   = vec2(cos(ang), sin(ang));
        float km    = 12.0 * (1.0 + 0.004 * sin(t * 0.013 + fi * 2.3));  // wavenumber drift
        float omega = 0.18 + 0.024 * fi;                                 // per-voice phase drift
        float phi   = fi * 1.3 + 0.7 * sin(t * 0.008 + fi);              // slow phase wander
        fCoarse += amps[i] * cos(km * dot(dir, p) - omega * t + phi);
    }

    // ----- fine detail sum -----
    // Second five-wave bank at higher k with its own time offset. Detail
    // within detail — the fractal feel without fbm. Amplitudes reuse the
    // same voice envelopes so the arc propagates to both scales.
    float tF = t * 0.73 + 47.0;
    float fFine = 0.0;
    for (int i = 0; i < 5; i++) {
        float fi    = float(i);
        float ang   = fi * (TAU / 5.0) + 0.40;
        vec2  dir   = vec2(cos(ang), sin(ang));
        float km    = 28.0 * (1.0 + 0.004 * sin(tF * 0.013 + fi * 2.3));
        float omega = 0.18 + 0.024 * fi;
        float phi   = fi * 1.3 + 0.7 * sin(tF * 0.008 + fi);
        fFine += amps[i] * cos(km * dot(dir, p) - omega * tF + phi);
    }

    float f = fCoarse + 0.32 * fFine;

    // Tiny spatial dither to break palette banding from the smooth cos field.
    float grain = (hash21(gl_FragCoord.xy * 0.37 + vec2(0.0, floor(t * 30.0))) - 0.5) * 0.018;

    // Signed f is roughly in [-1.3, 1.3] after normalisation. Remap to [0,1];
    // centre (f≈0, destructive interference) sits at ember mid-tones, crests
    // push into amber/cream.
    float brightness = saturate(0.5 + 0.48 * f + grain);

    // 72 BPM chord breath — subtle exposure pulse at the chord rate.
    // Five beats per loop, gentle amplitude variation.
    float cycleT  = mod(t, 5.0 * BEAT);
    int   beatIdx = int(cycleT / BEAT);
    float beatF   = fract(cycleT / BEAT);
    float thisA   = beatAccent(beatIdx);
    float nextA   = beatAccent((beatIdx + 1) % 5);
    float breath  = mix(thisA, nextA, smoothstep(0.0, 1.0, beatF));

    vec3 col = glassPalette(brightness) * breath;

    // Global arc exposure — fades up from silence in the first ~20s
    // (roughly the first four 5-beat cycles at 72 BPM), then crushes
    // slightly in the final seconds before the flash.
    float openFade = smoothstep(0.0, 20.0, t);
    float endTaper = 1.0 - 0.30 * smoothstep(380.0, 415.0, t);
    col *= (0.78 * endTaper + 0.22) * openFade;

    // Soft radial falloff — never a hard vignette, ~10% at corners.
    float r2 = dot(p * 0.50, p * 0.50);
    col *= 1.0 - 0.10 * r2;

    // Reinhard on an over-exposed input so peaks roll off asymptotically
    // to warm cream rather than clipping.
    col = reinhard(col * 1.35);

    // Arrival flash and final fade — the resolved chord lands.
    float endFade  = 1.0 - smoothstep(DURATION - 1.2, DURATION, t);
    float endFlash = smoothstep(DURATION - 2.0, DURATION - 1.3, t)
                   * (1.0 - smoothstep(DURATION - 1.3, DURATION - 0.6, t));
    col = col * endFade + vec3(1.0, 0.78, 0.44) * endFlash * 0.82;

    fragColor = vec4(pow(max(col, 0.0), vec3(0.90)), 1.0);
}
