// ABOUTME: glass-figure — fivefold quasicrystalline interference in response to
// ABOUTME: Philip Glass's Metamorphosis Two. Cursor pans + zooms + stirs the field.
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
    vec2 pBase = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
               / min(u_resolution.x, u_resolution.y);
    pBase *= 2.0;   // ~4 full wavelengths across the short axis at baseK=12

    float t = u_time;

    // ---------- mouse as two-axis instrument ----------
    // horizontal → pan; vertical → exponential zoom (up = zoom in).
    // Off-screen idle: no interaction, piece plays itself.
    bool mouseIdle = (u_mouse.x == 0.0 && u_mouse.y == 0.0);
    vec2 mRaw = (u_mouse - 0.5 * u_resolution.xy)
              / min(u_resolution.x, u_resolution.y) * 2.0;
    if (mouseIdle) mRaw = vec2(0.0);

    // Zoom factor: exp(mRaw.y * 0.7) gives zoom ∈ [~0.5, ~2.0] across the frame.
    // Divide p by zoom so a larger factor reveals more detail (zooms in).
    float zoom = exp(mRaw.y * 0.7);
    vec2  p    = pBase / zoom;

    // Horizontal pan — vertical is already claimed by zoom.
    p -= vec2(0.55 * mRaw.x, 0.0);

    // ---------- uniform drift (sped up ~3× from v1) ----------
    // The quasicrystal pattern is already quasiperiodic, but without this
    // nudge it reads as frozen. Two incommensurate sinusoids so the drift
    // path never retraces. Periods now ~10–25 s instead of 60–90 s.
    vec2 drift = 0.22 * vec2(sin(t * 0.055) + 0.55 * sin(t * 0.123 + 1.1),
                             cos(t * 0.043) + 0.55 * cos(t * 0.101 + 2.4));
    p += drift;

    // ---------- chaos: fbm domain warp ----------
    // Turns the interference from crystalline-clean into liquid/organic.
    // Kept modest (0.28) so fivefold character still reads through the warp.
    // Fast time coefficients — the warp itself visibly churns.
    vec2 warp = vec2(fbm(p * 0.9 + vec2(0.0,  t * 0.22)) - 0.5,
                     fbm(p * 0.9 + vec2(4.7, -t * 0.18 + 2.1)) - 0.5);
    p += 0.28 * warp;

    // ---------- cursor as turbulence source ----------
    // Near the cursor, add a rotating displacement that swirls the field.
    // Falls off quickly (gaussian, half-width ~0.6 world units) so it acts
    // as a local instrument, not a global mood change. When the mouse is
    // idle we push it to infinity so the shipped clip shows the pure
    // quasicrystal without an always-centred swirl artifact.
    vec2 mWorld = mouseIdle ? vec2(1e4) : vec2(0.55 * mRaw.x, mRaw.y);
    vec2 rm     = pBase - mWorld;
    float d2    = dot(rm, rm);
    float heat  = exp(-2.6 * d2);
    float swirl = t * 1.8 + length(rm) * 7.0;
    p += heat * 0.38 * vec2(cos(swirl), sin(swirl));

    // ---------- five voice envelopes ----------
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
    float tot  = amps[0] + amps[1] + amps[2] + amps[3] + amps[4];
    float invT = 1.0 / max(tot, 1e-3);
    amps[0] *= invT;
    amps[1] *= invT;
    amps[2] *= invT;
    amps[3] *= invT;
    amps[4] *= invT;

    // ---------- coarse quasicrystal sum (faster phase drift) ----------
    // omega base lifted from 0.18 → 0.55, per-voice spread widened. Phase
    // wander rate tripled. Wavenumber drift rate tripled. Result: visible
    // motion frame-to-frame, not just slow morph.
    float fCoarse = 0.0;
    for (int i = 0; i < 5; i++) {
        float fi    = float(i);
        float ang   = fi * (TAU / 5.0) + 0.40;                          // star rotated off-axis
        vec2  dir   = vec2(cos(ang), sin(ang));
        float km    = 12.0 * (1.0 + 0.005 * sin(t * 0.035 + fi * 2.3)); // wavenumber drift
        float omega = 0.55 + 0.07 * fi;                                 // per-voice phase drift
        float phi   = fi * 1.3 + 0.9 * sin(t * 0.025 + fi);             // phase wander
        fCoarse += amps[i] * cos(km * dot(dir, p) - omega * t + phi);
    }

    // ---------- fine detail sum ----------
    // Second five-wave bank at higher k with its own time offset.
    // Detail-within-detail without fbm on the wave sum itself.
    float tF = t * 0.83 + 47.0;
    float fFine = 0.0;
    for (int i = 0; i < 5; i++) {
        float fi    = float(i);
        float ang   = fi * (TAU / 5.0) + 0.40;
        vec2  dir   = vec2(cos(ang), sin(ang));
        float km    = 28.0 * (1.0 + 0.005 * sin(tF * 0.035 + fi * 2.3));
        float omega = 0.55 + 0.07 * fi;
        float phi   = fi * 1.3 + 0.9 * sin(tF * 0.025 + fi);
        fFine += amps[i] * cos(km * dot(dir, p) - omega * tF + phi);
    }

    float f = fCoarse + 0.32 * fFine;

    // Tiny spatial dither to break palette banding from the smooth cos field.
    float grain = (hash21(gl_FragCoord.xy * 0.37 + vec2(0.0, floor(t * 30.0))) - 0.5) * 0.018;

    // Signed f is roughly in [-1.3, 1.3] after normalisation. Remap to [0,1].
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

    // Global arc exposure — 20s open-fade, slight end crush before flash.
    float openFade = smoothstep(0.0, 20.0, t);
    float endTaper = 1.0 - 0.30 * smoothstep(380.0, 415.0, t);
    col *= (0.78 * endTaper + 0.22) * openFade;

    // Soft radial falloff — never a hard vignette, ~10% at corners.
    float r2 = dot(pBase * 0.50, pBase * 0.50);
    col *= 1.0 - 0.10 * r2;

    // Reinhard on an over-exposed input so peaks roll off asymptotically
    // to warm cream rather than clipping.
    col = reinhard(col * 1.45);

    // Arrival flash and final fade — the resolved chord lands.
    float endFade  = 1.0 - smoothstep(DURATION - 1.2, DURATION, t);
    float endFlash = smoothstep(DURATION - 2.0, DURATION - 1.3, t)
                   * (1.0 - smoothstep(DURATION - 1.3, DURATION - 0.6, t));
    col = col * endFade + vec3(1.0, 0.78, 0.44) * endFlash * 0.82;

    fragColor = vec4(pow(max(col, 0.0), vec3(0.90)), 1.0);
}
