// ABOUTME: Display — reads RD species + wave height, paints psychedelic palette
// ABOUTME: with kaleido / chromatic dispersion / motes / key-rays strata of grain.
#version 300 es
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "tonemap.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_audio_cymbal;
uniform float u_audio_kick;
uniform float u_audio_snare;
uniform float u_audio_flash;
uniform float u_audio_playing;
uniform float u_downbeat;
uniform float u_bar_phase;
uniform float u_beat_phase;
uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_song_progress;
uniform float u_keys[15];
uniform float u_keys_visual[15];
uniform float u_key_event[15];
uniform sampler2D u_rd_state;
uniform sampler2D u_wave_state;

out vec4 fragColor;

// === PSYCHEDELIC TWO-POLE PALETTE ===
// v-pole (activator): magenta → violet → cyan
// u-pole (substrate): gold → ember → cream
// Palette anchors shift slowly with song progress so colour is never static.

vec3 vPole(float t, float shift) {
    float a = mod(t + shift, 1.0);
    vec3 magenta = vec3(0.86, 0.18, 0.50);
    vec3 violet  = vec3(0.36, 0.16, 0.74);
    vec3 cyan    = vec3(0.10, 0.78, 1.05);
    return (a < 0.5) ? mix(magenta, violet, a * 2.0)
                     : mix(violet, cyan, (a - 0.5) * 2.0);
}

vec3 uPole(float t, float shift) {
    float a = mod(t + shift, 1.0);
    // Saturated warms — gold → ember → amber. NO cream/white anchor (the
    // earlier (1.02, 0.94, 0.78) anchor was milking the whole frame to
    // pastel; replaced with a deeper amber so substrate stays warm-saturated.
    vec3 gold  = vec3(0.92, 0.62, 0.14);
    vec3 ember = vec3(0.78, 0.28, 0.06);
    vec3 amber = vec3(0.95, 0.50, 0.18);
    return (a < 0.5) ? mix(gold, ember, a * 2.0)
                     : mix(ember, amber, (a - 0.5) * 2.0);
}

// n-fold mirror around `axis`. Strength=0 leaves p unchanged.
vec2 kaleido(vec2 p, vec2 axis, float folds, float strength) {
    if (strength < 0.001 || folds < 1.5) return p;
    vec2 q = p - axis;
    float a = atan(q.y, q.x);
    float r = length(q);
    float seg = TAU / folds;
    a = mod(a, seg);
    a = abs(a - seg * 0.5);
    vec2 mirrored = axis + r * vec2(cos(a), sin(a));
    return mix(p, mirrored, strength);
}

vec2 keyXY(int i) {
    float halfPositions[6] = float[6](0.5, 1.5, 3.5, 4.5, 5.5, 7.5);
    bool isBlack = (i >= 9);
    float pos = isBlack ? halfPositions[i - 9] : float(i);
    float kx = (pos / 8.0 - 0.5) * 1.2;
    float ky = isBlack ? 0.18 : -0.18;
    return vec2(kx, ky);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    // === STRATUM 0: kaleido folding ===
    // Section 0/1 → no folds. Sections 2/3/4/5/6 → 8/6/12/6/6 folds.
    // Strength ramps with section_progress so transitions are smooth.
    float folds;
    if      (u_section_id <= 1) folds = 1.0;
    else if (u_section_id == 2) folds = 8.0;
    else if (u_section_id == 3) folds = 6.0;
    else if (u_section_id == 4) folds = 12.0;
    else if (u_section_id == 5) folds = 6.0;
    else                        folds = 6.0;
    float kStrength = (folds > 1.5)
        ? smoothstep(0.0, 0.5, u_section_progress)
          * (1.0 - smoothstep(0.85, 1.0, u_section_progress))
          * mix(0.65, 1.0, u_audio_mid)
        : 0.0;

    bool mouseIdle = (u_mouse.x == 0.0 && u_mouse.y == 0.0);
    vec2 axis = mouseIdle
        ? vec2(0.30 * cos(u_time * 0.13), 0.22 * sin(u_time * 0.21))
        : (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);

    vec2 pK = kaleido(p, axis, folds, kStrength);
    vec2 uvK = pK / vec2(aspect, 1.0) + 0.5;
    uvK = clamp(uvK, vec2(0.001), vec2(0.999));

    // === Wave-driven UV displacement + chromatic dispersion ===
    // Sample wave height + finite-diff gradient. The gradient becomes
    // refraction direction → "the membrane breathes & disperses light".
    vec2 wTexel = 1.0 / vec2(u_resolution.x * 0.5, u_resolution.y * 0.5);
    float h    = texture(u_wave_state, uvK).r;
    float hN   = texture(u_wave_state, uvK + vec2(0.0,  wTexel.y)).r;
    float hS   = texture(u_wave_state, uvK + vec2(0.0, -wTexel.y)).r;
    float hE   = texture(u_wave_state, uvK + vec2( wTexel.x, 0.0)).r;
    float hW   = texture(u_wave_state, uvK + vec2(-wTexel.x, 0.0)).r;
    vec2 waveGrad = vec2(hE - hW, hN - hS);
    float gradMag = length(waveGrad);

    vec2 uvDisp = uvK + waveGrad * 0.16;

    // Single sample for species — keeps RD spot detail crisp. (The previous
    // 3-tap chromatic average smeared every spot into pastel mush.)
    float u_sp = texture(u_rd_state, uvDisp).r;
    float v_sp = texture(u_rd_state, uvDisp).g;

    // === STRATUM 1: psychedelic palette from species ===
    // Boost activator scaling so v_sp ∈ [0, 0.3] sweeps the FULL magenta →
    // violet → cyan arc. Without this, v never reaches cyan and the "other
    // side" colour was unreachable.
    float shift = u_song_progress + 0.04 * u_bar_phase;
    vec3 v_col = vPole(v_sp * 3.2, shift);
    vec3 u_col = uPole(u_sp * 0.85, shift + 0.5);

    // Punch threshold lower + heavier v weighting → activator-rich regions
    // dominate as cyan/violet; substrate regions get suppressed harder.
    float w = smoothstep(0.012, 0.25, v_sp);
    vec3 col = u_col * (1.0 - w * 0.85) + v_col * w * 1.95;

    // Per-channel chromatic dispersion only at strong wave fronts. Sample
    // species at offset positions and re-evaluate the palette per channel
    // — preserves shape (no averaging blur), adds prismatic fringing.
    float dispGate = smoothstep(0.04, 0.16, gradMag);
    if (dispGate > 0.001) {
        float disp = 0.020 * gradMag + 0.006;
        float vR = texture(u_rd_state, uvDisp + waveGrad * disp).g;
        float vB = texture(u_rd_state, uvDisp - waveGrad * disp).g;
        col.r = mix(col.r, vPole(vR * 3.2, shift).r * 1.95 * w
                          + uPole(texture(u_rd_state, uvDisp + waveGrad * disp).r * 0.85, shift + 0.5).r * (1.0 - w * 0.85),
                    dispGate * 0.7);
        col.b = mix(col.b, vPole(vB * 3.2, shift).b * 1.95 * w
                          + uPole(texture(u_rd_state, uvDisp - waveGrad * disp).r * 0.85, shift + 0.5).b * (1.0 - w * 0.85),
                    dispGate * 0.7);
    }

    // === Section 6 polarity flip — palette inverts twice during the outro ===
    // Two pulses centred at 25% and 70% of the section so the "other side"
    // colour beat lands at musical peaks.
    if (u_section_id == 6) {
        float t = u_section_progress;
        float pulseA = exp(-pow((t - 0.25) * 7.0, 2.0));
        float pulseB = exp(-pow((t - 0.70) * 7.0, 2.0));
        float flip = max(pulseA, pulseB);
        col = mix(col, 1.0 - col, flip * 0.55);
    }

    // === Wave height tints crests / shadows troughs ===
    col += vec3(0.45, 0.32, 0.62) * max(h, 0.0) * 0.85;
    col -= vec3(0.20, 0.10, 0.28) * max(-h, 0.0) * 0.50;

    // === Cursor heat halo — warm spot where the user is dripping ===
    if (!mouseIdle) {
        vec2 mP = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);
        float d = length(p - mP);
        col += vec3(1.4, 0.78, 0.42) * exp(-d * d * 60.0) * 0.42;
    }

    // === STRATUM 2: motes — sparse luminous points ===
    // Hash-jittered cell centres; cell grid drifts so motes "flow". Density
    // scales with high freq + cymbal so they bloom on hi-hats & noise.
    float motesGate = 0.978 - 0.022 * u_audio_high - 0.040 * u_audio_cymbal;
    vec2 mGridP = p * 26.0 + vec2(u_time * 0.45, -u_time * 0.30);
    vec2 mCell  = floor(mGridP);
    float mh    = hash21(mCell);
    if (mh > motesGate) {
        vec2 jitter = (hash22(mCell + 1.7) - 0.5) * 0.8;
        vec2 mLocal = fract(mGridP) - 0.5 - jitter;
        float md = length(mLocal);
        float intensity = smoothstep(0.16, 0.0, md) * (0.5 + 0.5 * mh);
        col += vec3(1.30, 1.05, 0.85) * intensity;
    }

    // Downbeat: expanding ring of motes from centre — "break through" tell.
    {
        float burstR = 0.04 + (1.0 - u_downbeat) * 0.34;
        float d = abs(length(p) - burstR);
        col += vec3(1.45, 0.90, 0.55) * smoothstep(0.020, 0.0, d) * u_downbeat * 0.85;
    }

    // === Key glow rays — visible light wherever a key is held/pressed ===
    for (int i = 0; i < 15; i++) {
        bool isBlack = (i >= 9);
        vec2 kp = keyXY(i);
        float d = length(p - kp);
        float halo = exp(-d * d * 70.0);
        vec3 kColor = isBlack
            ? vec3(0.65, 0.40, 1.10)   // violet for sharps
            : vec3(1.20, 0.72, 0.32);  // amber for naturals
        col += kColor * halo * (0.58 * u_key_event[i] + 0.18 * u_keys_visual[i]);
    }

    // === Tonemap + vignette + slight gamma ===
    // Pre-tonemap exposure boost so saturated mids survive Reinhard. Stronger
    // gamma (0.86) for contrast — makes magenta/cyan pop without crushing.
    col *= 1.18;
    col = reinhard(col);
    float vig = smoothstep(1.4, 0.45, length(p));
    col *= mix(0.72, 1.0, vig);
    col = pow(col, vec3(0.86));

    fragColor = vec4(col, 1.0);
}
