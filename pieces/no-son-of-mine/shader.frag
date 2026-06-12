// ABOUTME: Display pass for "No Son Of Mine" — renders the Cahn-Hilliard phase
// ABOUTME: field: wine vs cream domains, ember walls fed by the voice, rupture rings.
#version 300 es
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "interaction.glsl"
#include "tonemap.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform sampler2D u_state;

uniform float u_audio_playing;
uniform float u_audio_drums_stem;
uniform float u_audio_vocals_stem;
uniform float u_audio_bass_stem;
uniform float u_downbeat;
uniform float u_bar_phase;
uniform int   u_bar_index;
uniform float u_song_progress;
uniform float u_zoom;
uniform vec2  u_pan;
uniform float u_tap_pulse;
uniform float u_keys[15];
uniform float u_key_event[15];

out vec4 fragColor;

// Same key layout as sim.frag — display echoes each injection site.
vec2 keyPos(int i) {
    float halfPositions[6] = float[6](0.5, 1.5, 3.5, 4.5, 5.5, 7.5);
    bool isBlack = (i >= 9);
    float pos = isBlack ? halfPositions[i - 9] : float(i);
    float kx = (pos / 8.0 - 0.5) * 1.2;
    float ky = isBlack ? 0.18 : -0.18;
    return vec2(kx, ky);
}

// Warm cycle, this piece's dialect: near-black wine → wine → ember → amber → cream.
const vec3 WINE_DEEP = vec3(0.050, 0.014, 0.022);
const vec3 WINE      = vec3(0.165, 0.042, 0.070);
const vec3 EMBER     = vec3(0.950, 0.340, 0.100);
const vec3 AMBER     = vec3(1.000, 0.620, 0.220);
const vec3 CREAM_LO  = vec3(0.800, 0.690, 0.520);
const vec3 CREAM_HI  = vec3(0.965, 0.890, 0.730);
const vec3 HOT       = vec3(1.050, 0.940, 0.800);

vec2 worldOf(vec2 uv) {
    return (uv * u_resolution - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y) * 2.0;
}

void main() {
    vec2 uvRaw = gl_FragCoord.xy / u_resolution;
    // pinch-zoom / two-finger-pan act on the sampling frame
    vec2 uv = (uvRaw - 0.5) / max(u_zoom, 0.25) + 0.5
            + u_pan * min(u_resolution.x, u_resolution.y) / u_resolution;
    vec2 p  = worldOf(uv);
    float aspect = u_resolution.x / u_resolution.y;
    bool playing = u_audio_playing > 0.5;

    // ---- Rupture ring: expanding refraction shock on the bar grid, from a
    // per-bar wandering epicenter. Geometry displacement, not a flash.
    vec2 pp = p;
    float ringGlow = 0.0;
    {
        float clk   = playing ? u_bar_phase : fract(u_time / 9.0);
        float seedF = playing ? float(u_bar_index) : floor(u_time / 9.0);
        vec2 epi = (hash22(vec2(seedF * 0.731 + 3.1, 17.9)) - 0.5) * vec2(1.5 * aspect, 1.5);
        // Amplitudes sized against the labyrinth: displacement must exceed
        // half a stripe period inside the band or the ring vanishes into
        // the pattern (v0.3 peak-clip burst: 0.045 was invisible).
        float ringR   = clk * 2.2;
        float ringAmp = exp(-2.2 * clk) * (playing ? (0.50 + 0.80 * u_audio_drums_stem) : 0.40);
        float d = length(p - epi);
        float band = exp(-(d - ringR) * (d - ringR) / 0.012);
        pp += (d > 1e-4 ? (p - epi) / d : vec2(0.0)) * band * ringAmp * 0.09;
        ringGlow = band * ringAmp;
    }

    // tap pulse: a small shock ring around the cursor (mobile pokes count)
    {
        vec2 mw = vjMouseWorldOrZero(u_mouse, u_resolution);
        float r = (1.0 - u_tap_pulse) * 0.9;
        float d = length(p - mw);
        float band = exp(-(d - r) * (d - r) / 0.004) * u_tap_pulse;
        pp += (d > 1e-4 ? (p - mw) / d : vec2(0.0)) * band * 0.03;
        ringGlow += band * 0.6;
    }

    // ---- Cursor swirl: display-space twist matching the sim's stir vortex,
    // so what you see twisting is what the equation feels.
    {
        vec2 mw = vjMouseWorld(u_mouse, u_resolution);
        vec2 r = pp - mw;
        float g = exp(-dot(r, r) / 0.045);
        if (g > 1e-3) {
            pp = mw + rot2d(0.9 * g) * r;
        }
    }

    // back to uv for state sampling
    vec2 sampleUv = clamp(pp / 2.0 * min(u_resolution.x, u_resolution.y) / u_resolution + 0.5,
                          vec2(0.001), vec2(0.999));

    vec4 st = texture(u_state, sampleUv);
    float h    = st.r;
    float heat = st.g;

    // gradient for wall mask + rim lighting (display-res central diff)
    vec2 texel = 1.5 / u_resolution;
    float hE = texture(u_state, clamp(sampleUv + vec2(texel.x, 0.0), 0.001, 0.999)).r;
    float hW = texture(u_state, clamp(sampleUv - vec2(texel.x, 0.0), 0.001, 0.999)).r;
    float hN = texture(u_state, clamp(sampleUv + vec2(0.0, texel.y), 0.001, 0.999)).r;
    float hS = texture(u_state, clamp(sampleUv - vec2(0.0, texel.y), 0.001, 0.999)).r;
    vec2 grad = vec2(hE - hW, hN - hS);

    // ---- Domain bodies: dark wine vs pale cream, each with its own grain.
    // Drums-stem jitters the grain sampling (sub-beat shimmer, grain only —
    // the domain geometry itself stays smooth and trackable).
    // ~1.4 Hz, just under the 1.7 Hz beat — sub-beat breathing, not pixel
    // jitter (5 Hz aliased into untrackable noise at headless 17 fps and
    // tripped the trackability metric on 5/6 clips).
    float drums = playing ? u_audio_drums_stem : 0.0;
    vec2 gJit = drums * 0.008 * vec2(sin(u_time * 9.0), cos(u_time * 7.6));
    float grainD = fbmRot(pp * 5.0 + gJit + vec2(0.0, u_time * 0.02));
    float grainL = fbmRot(pp * 7.0 - gJit + vec2(u_time * 0.015, 0.0));

    vec3 darkCol  = mix(WINE_DEEP, WINE, grainD);
    vec3 lightCol = mix(CREAM_LO, CREAM_HI, grainL);
    float phase = smoothstep(-0.28, 0.28, h);
    vec3 col = mix(darkCol, lightCol, phase);

    // ---- The wall: always-on ember band (lead-layer rule: the silhouette
    // exists at 0.5 even cold), heat lifts it ember → amber → white-hot.
    float wall = smoothstep(0.80, 0.35, abs(h)) * saturate(length(grad) * 6.0);
    vec3 wallCol = mix(EMBER, AMBER, saturate(heat));
    wallCol = mix(wallCol, HOT, smoothstep(0.9, 1.8, heat));
    col = col * (1.0 - 0.45 * wall) + wallCol * wall * (0.50 + 0.95 * heat);

    // ring luminous so the phase-lock is legible even over hot walls
    col += vec3(1.05, 0.62, 0.28) * ringGlow * 0.55;

    // ---- Macro envelope: two wandering hot zones so the squint reads
    // light/dark structure, never flat texture.
    {
        vec2 z1 = vec2(0.7 * aspect * sin(u_time * 0.017 + 0.8), 0.55 * sin(u_time * 0.013 + 2.0));
        vec2 z2 = vec2(0.6 * aspect * sin(u_time * 0.011 + 4.1), 0.60 * cos(u_time * 0.019));
        float env = 0.70
                  + 0.38 * exp(-dot(p - z1, p - z1) / 0.55)
                  + 0.26 * exp(-dot(p - z2, p - z2) / 0.40);
        col *= env;
    }

    // ---- Key echoes: cream flares for whites, wine-red rims for blacks.
    for (int i = 0; i < 15; i++) {
        vec2 d = p - keyPos(i);
        float g = exp(-dot(d, d) * 90.0);
        float k = 0.8 * u_key_event[i] + 0.22 * u_keys[i];
        vec3 kc = (i >= 9) ? vec3(0.75, 0.10, 0.16) : vec3(1.0, 0.88, 0.62);
        col += kc * g * k;
    }

    // ---- Cursor halo (subtle — the swirl is the real tell)
    {
        vec2 mw = vjMouseWorld(u_mouse, u_resolution);
        col += AMBER * vjCursorHeat(p, mw, 0.30) * 0.05;
    }

    // ---- Ending: the field froze in the sim; here the light goes out.
    float fade = 1.0 - smoothstep(0.960, 0.998, u_song_progress);
    col *= playing ? fade : 1.0;

    // vignette + tonemap + gamma
    vec2 vq = uvRaw - 0.5;
    col *= 1.0 - 0.38 * dot(vq, vq) * 2.2;
    col = reinhardPartial(max(col, vec3(0.0)), 1.45);
    col = pow(col, vec3(0.88));

    fragColor = vec4(col, 1.0);
}
