#version 300 es
// ABOUTME: Burning-sky — dark smoky top, deep wine mid, ember-orange horizon.
// ABOUTME: Slow smoke drift, audio-bass swells the horizon, section progress
// ABOUTME: tilts the smoke direction.
precision highp float;

float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0,0.0));
    float c = hash21(i + vec2(0.0,1.0));
    float d = hash21(i + vec2(1.0,1.0));
    return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}
float fbm(vec2 p) {
    float v = 0.0, a = 0.55;
    for (int i = 0; i < 5; i++) {
        v += a * vnoise(p);
        p *= 2.0;
        a *= 0.55;
    }
    return v;
}

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_playing;
uniform float u_audio_bass;
uniform float u_audio_kick;
uniform float u_audio_mid;
uniform float u_song_progress;
uniform float u_section_progress;
uniform float u_to_section_change;
uniform float u_energy_smooth;
uniform float u_downbeat;

out vec4 fragColor;

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p  = (uv - 0.5) * vec2(aspect, 1.0);

    float playing = u_audio_playing;
    float bass = mix(0.30 + 0.18 * sin(u_time * 0.61), u_audio_bass, playing);
    float mid  = mix(0.20 + 0.15 * sin(u_time * 1.2 + 0.7), u_audio_mid, playing);
    float kick = mix(0.0, u_audio_kick, playing);

    // Vertical palette: very dark top → deep wine middle → ember horizon at
    // y ~ 0.20. Below the horizon: hot orange ground glow.
    float horizonY = 0.22 + 0.04 * sin(u_song_progress * 6.28 + 1.7);
    float yt       = uv.y;

    vec3 cTop    = vec3(0.020, 0.012, 0.018);   // smoky black
    vec3 cMidA   = vec3(0.085, 0.025, 0.018);   // wine-ash
    vec3 cMidB   = vec3(0.190, 0.055, 0.020);   // wine-ember
    vec3 cHor    = vec3(0.95,  0.40,  0.10);    // ember-orange peak at horizon
    vec3 cGround = vec3(0.55,  0.18,  0.04);    // hot ground glow

    // Build the gradient piecewise.
    vec3 col;
    if (yt > horizonY) {
        float t = (yt - horizonY) / (1.0 - horizonY);
        // horizon → mid → top
        col = mix(cHor, cMidB, smoothstep(0.0, 0.18, t));
        col = mix(col, cMidA, smoothstep(0.18, 0.55, t));
        col = mix(col, cTop,  smoothstep(0.55, 0.95, t));
    } else {
        float t = yt / max(horizonY, 1e-4);  // 0..1 from bottom up to horizon
        col = mix(cGround, cHor, smoothstep(0.4, 1.0, t));
    }

    // Smoke layer drifting slowly across the upper half. Streaky; horizontally
    // stretched fbm.
    vec2 smokeUv = vec2(p.x * 1.6 + u_time * 0.05,
                        p.y * 4.0 - u_time * 0.10 + u_song_progress * 0.4);
    float smoke = fbm(smokeUv);
    smoke *= smoothstep(horizonY - 0.05, 1.0, yt);
    col *= mix(1.0, 0.55, smoke * 0.85);

    // Pre-tension: as a section change approaches, the horizon brightens and
    // the smoke goes ash-orange.
    float preTension = 1.0 - smoothstep(0.0, 4.0, max(u_to_section_change, 0.0));
    float horizonBand = smoothstep(0.05, 0.0, abs(yt - horizonY));
    col += vec3(0.55, 0.22, 0.05) * horizonBand * (0.20 + 0.55 * preTension + 0.30 * bass);

    // Bass swell — the horizon pulses slightly. Limited gain so it doesn't
    // become the only audio cue.
    col += vec3(0.18, 0.07, 0.02) * horizonBand * bass * 0.55;

    // Downbeat: brief horizon flash at the kick.
    col += vec3(0.30, 0.12, 0.04) * horizonBand * u_downbeat * 0.55;

    // Bottom-corner glow — feels like fire is on the ground out of frame.
    float groundGlow = smoothstep(0.18, 0.0, yt) * (0.9 + 0.5 * bass);
    col += vec3(0.50, 0.16, 0.04) * groundGlow * 0.35;

    // Vignette — pull edges down so eye lands on the horizon.
    float vig = smoothstep(0.95, 0.40, length(p));
    col *= mix(0.55, 1.0, vig);

    fragColor = vec4(col, 1.0);
}
