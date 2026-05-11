#version 300 es
// ABOUTME: Five concentric wheels at coprime tooth counts (5,7,11,13,17).
// ABOUTME: Each ring on its own clock; cursor wind bows the rings; keys add
// ABOUTME: momentary glowing teeth. Refracts u_below at tooth lines.
precision highp float;

#include "math.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_audio_playing;
uniform float u_beat_phase;
uniform float u_bar_phase;
uniform float u_section_progress;
uniform float u_song_progress;
uniform int   u_section_id;
uniform sampler2D u_below;
uniform float u_keys[15];
uniform float u_key_event[15];

out vec4 fragColor;

const float TEETH[5]  = float[5](5.0, 7.0, 11.0, 13.0, 17.0);
const float RADII[5]  = float[5](0.12, 0.20, 0.28, 0.36, 0.44);
const float WIDTHS[5] = float[5](0.034, 0.030, 0.026, 0.024, 0.022);

vec3 warmRamp(float t) {
    // 5-stop warm cycle, cream → amber → ember → wine → mauve, wraps.
    t = fract(t) * 5.0;
    int i = int(floor(t));
    float f = t - float(i);
    vec3 c0 = vec3(1.00, 0.85, 0.55);
    vec3 c1 = vec3(1.00, 0.55, 0.20);
    vec3 c2 = vec3(0.90, 0.30, 0.20);
    vec3 c3 = vec3(0.60, 0.18, 0.30);
    vec3 c4 = vec3(0.45, 0.15, 0.40);
    vec3 a = (i==0)?c0:(i==1)?c1:(i==2)?c2:(i==3)?c3:c4;
    vec3 b = (i==0)?c1:(i==1)?c2:(i==2)?c3:(i==3)?c4:c0;
    return mix(a, b, f);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 c  = (gl_FragCoord.xy - 0.5 * u_resolution)
            / min(u_resolution.x, u_resolution.y);

    // Synthetic drivers when silent + idle
    float playing = u_audio_playing;
    float bp   = mix(fract(u_time * 1.0),  u_beat_phase,       playing);
    float ba   = mix(fract(u_time * 0.25), u_bar_phase,        playing);
    float sp   = mix(fract(u_time * 0.05), u_section_progress, playing);
    float gprog= mix(fract(u_time * 0.01), u_song_progress,    playing);
    float mid  = mix(0.4 + 0.3 * sin(u_time * 0.7), u_audio_mid, playing);
    float hi   = mix(0.3 + 0.2 * sin(u_time * 1.7), u_audio_high, playing);

    // Cursor wind: azimuth + magnitude. Idle ⇒ no wind.
    vec2 mouse = vjMouseWorldOrZero(u_mouse, u_resolution);
    float windMag = clamp(length(mouse), 0.0, 1.5);
    float windAng = (windMag > 0.0) ? atan(mouse.y, mouse.x) : 0.0;

    // Section-driven ring-centre drift — during the final ~35% of each section
    // (pre-peak build), ring centres orbit away from the origin, destabilising
    // the locked-mandala geometry. Rings snap back at the section flip
    // (sp resets near 0 on downbeat). This is the per-section macro motion
    // that the v2-i1 critique flagged as missing.
    float buildIntensity = smoothstep(0.65, 1.0, sp);
    float driftPhase = ba * TAU;
    vec2 driftCentre = vec2(cos(driftPhase), sin(driftPhase)) * 0.040 * buildIntensity;
    c -= driftCentre * 2.0;

    // Peak-section per-beat radial wobble — section 4 is Cirrus's 65-second
    // climax; the rings pulse their radii on each beat so the peak reads as
    // alive, not as the most-locked moment. v2-i2 fix.
    float isPeak = (u_section_id == 4) ? 1.0 : 0.0;
    float beatWobble = isPeak * 0.030 * cos(bp * TAU);

    // Always-on per-beat angular jitter — small phase noise fired every beat
    // song-wide so even calm section centres show continuous subtle rotation
    // instability. Keeps the mandala alive even at intro / verse-mid / outro-
    // mid frames. Drift + peak wobble layer on top during punctuated moments.
    // v2-i3 fix (Louis: "too static, not chaos enough").
    float jitterPhase = sin(bp * TAU * 2.0 + sp * 0.5) * 0.025
                      + cos(bp * TAU * 3.0 + ba * 1.7) * 0.012;

    float r = length(c);
    float ang = atan(c.y, c.x);

    // Per-ring rotation rates (geometric — audio drives speed not brightness)
    float omega[5];
    omega[0] = ba * TAU;
    omega[1] = sp * TAU * 1.0;
    omega[2] = bp * TAU * 2.0;
    omega[3] = u_time * (0.3 + 1.6 * mid);
    omega[4] = u_time * 0.9 + hi * 4.0;

    // Accumulate ring presence (always-on band) and tooth peaks separately.
    // Ring presence makes the geometry visible even between teeth; tooth
    // peaks are the alignment hooks.
    float ring_presence = 0.0;
    float tooth_peak    = 0.0;
    float align_axis    = 0.0;

    for (int i = 0; i < 5; i++) {
        float P  = TEETH[i];
        float Ri = RADII[i];
        float Wi = WIDTHS[i];

        // Bow ring radius in wind direction; faster rings bow more
        float bow = windMag * 0.030 * (float(i) + 1.0) / 5.0;
        float radialDelta = bow * cos(ang - windAng);
        // Section build also inflates ring radii — adds to the scatter.
        // Peak-section wobble pulses every beat (v2-i2 fix).
        float Ri_eff = Ri + radialDelta + length(driftCentre) + beatWobble;

        // Soft annulus mask
        float dr = abs(r - Ri_eff);
        float ringMask = smoothstep(Wi * 1.6, 0.0, dr);

        // Tooth phase: cosine softened so each tooth occupies more of the ring.
        // Per-beat angular jitter (v2-i3) adds always-on liveness.
        float toothPhase = ang * P + omega[i] + jitterPhase;
        float tc = max(cos(toothPhase), 0.0);
        float toothShape = pow(tc, 2.5);

        // Always-on ring presence — the ring is always visible as a thin
        // warm band; teeth brighten it
        float ringBase = 0.55 + 0.08 * float(i);
        ring_presence = max(ring_presence, ringMask * 0.30 * ringBase);

        // Tooth peak — accumulated separately for max-blend
        tooth_peak = max(tooth_peak, ringMask * toothShape * (0.85 + 0.06 * float(i)));

        // On-tooth indicator for radial-axis alignment glow
        align_axis += tc * ringMask;
    }

    // Keyboard: each held/pressed key adds a tooth on ring (k % 5) at fixed
    // azimuth.
    float halfPositions[6] = float[6](0.5, 1.5, 3.5, 4.5, 5.5, 7.5);
    for (int k = 0; k < 15; k++) {
        float env = u_keys[k] + u_key_event[k] * 0.6;
        if (env < 0.001) continue;
        bool isBlack = (k >= 9);
        float pos = isBlack ? halfPositions[k - 9] : float(k);
        int ring = int(mod(float(k), 5.0));
        float Ri = RADII[ring];
        float Wi = WIDTHS[ring] * 1.8;
        float keyAng = -PI + (pos + 0.5) / 9.0 * TAU;
        float dAng = atan(sin(ang - keyAng), cos(ang - keyAng));
        float angMask = smoothstep(0.20, 0.0, abs(dAng));
        float dr = abs(r - Ri);
        float radMask = smoothstep(Wi * 2.5, 0.0, dr);
        tooth_peak = max(tooth_peak, env * angMask * radMask * 1.3);
    }

    // Refract u_below toward radial axis at tooth-bright zones
    vec2 radialDir = (r > 1e-3) ? c / r : vec2(0.0);
    float refrAmt = 0.020 + 0.008 * windMag;
    float total_lum = max(ring_presence, tooth_peak);
    vec3 below = texture(u_below, uv - radialDir * refrAmt * total_lum).rgb;
    if (dot(below, vec3(1.0)) < 0.01) below = vec3(0.04, 0.02, 0.0);

    // Per-frame palette tinting per song progress
    vec3 wheelCol = warmRamp(gprog + 0.35);

    // Compose: wheels actively brighten; teeth dominate via max
    vec3 wheelContrib = wheelCol * total_lum;
    vec3 col = max(below + wheelContrib * 1.0, wheelContrib * 1.6);

    // Alignment-axis glow: brighten where many rings have a tooth at this angle
    float ax = pow(align_axis * 0.22, 2.0);
    col += vec3(0.22, 0.13, 0.06) * ax;

    // Soft Reinhard-style roll-off so peak luminance stays in palette
    col = col / (1.0 + col * 0.45);

    fragColor = vec4(col, 1.0);
}
