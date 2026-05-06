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
uniform vec2  u_mouse;
uniform float u_audio_playing;
uniform float u_audio_bass;
uniform float u_audio_kick;
uniform float u_audio_mid;
uniform float u_song_progress;
uniform float u_section_progress;
uniform int   u_section_id;
uniform float u_to_section_change;
uniform float u_energy_smooth;
uniform float u_downbeat;
uniform float u_keys[15];

out vec4 fragColor;

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 p  = (uv - 0.5) * vec2(aspect, 1.0);

    float playing = u_audio_playing;
    float bass = mix(0.30 + 0.18 * sin(u_time * 0.61), u_audio_bass, playing);
    float mid  = mix(0.20 + 0.15 * sin(u_time * 1.2 + 0.7), u_audio_mid, playing);
    float kick = mix(0.0, u_audio_kick, playing);

    bool  mIdle  = u_mouse.x < 1.0 && u_mouse.y < 1.0;
    vec2  mp     = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);

    // Sum of held keys — broadens horizon when the player is sustaining heat.
    float keysSum = 0.0;
    for (int i = 0; i < 15; i++) keysSum += u_keys[i];
    keysSum = clamp(keysSum * 0.35, 0.0, 1.5);

    // Per-section horizon Y: drops at peaks (we're closer to the fire), rises
    // at low-energy sections (we pull back).
    float horizonAnchors[8] = float[8](0.30, 0.26, 0.22, 0.28, 0.18, 0.24, 0.30, 0.34);
    int   sid    = clamp(u_section_id, 0, 7);
    int   nid    = clamp(sid + 1, 0, 7);
    float hY0    = horizonAnchors[sid];
    float hY1    = horizonAnchors[nid];
    float horizonY = mix(hY0, hY1, smoothstep(0.0, 1.0, u_section_progress));

    // Cursor X tilts the horizon (uneven ground); cursor Y pushes it up/down.
    float horizonTilt = mIdle ? 0.0 : (mp.x / max(aspect, 1e-3)) * 0.08;
    float horizonShift = mIdle ? 0.0 : -mp.y * 0.05;
    horizonY += horizonShift;

    // Local horizon (per-x): tilted by cursor + slow noise wave so it's not flat.
    float xN = (uv.x - 0.5) * 2.0;
    float horizonLocal = horizonY + xN * horizonTilt
                       + 0.012 * sin(uv.x * 14.0 + u_time * 0.3) * (1.0 + bass * 0.6);

    float yt = uv.y;

    vec3 cTop    = vec3(0.020, 0.012, 0.018);   // smoky black
    vec3 cMidA   = vec3(0.085, 0.025, 0.018);   // wine-ash
    vec3 cMidB   = vec3(0.190, 0.055, 0.020);   // wine-ember
    vec3 cHor    = vec3(0.95,  0.40,  0.10);    // ember-orange peak at horizon
    vec3 cGround = vec3(0.55,  0.18,  0.04);    // hot ground glow

    // Build the gradient piecewise around the LOCAL (per-x) horizon — gives
    // the horizon a slight tilt + wave so it never reads as a hard flat line.
    vec3 col;
    if (yt > horizonLocal) {
        float t = (yt - horizonLocal) / max(1.0 - horizonLocal, 1e-3);
        col = mix(cHor, cMidB, smoothstep(0.0, 0.18, t));
        col = mix(col, cMidA, smoothstep(0.18, 0.55, t));
        col = mix(col, cTop,  smoothstep(0.55, 0.95, t));
    } else {
        float t = yt / max(horizonLocal, 1e-4);
        col = mix(cGround, cHor, smoothstep(0.4, 1.0, t));
    }

    // Smoke layer drifting slowly across the upper half. Streaky; horizontally
    // stretched fbm. Cursor Y modulates smoke density (drag the cursor up to
    // make smoke heavier; down to thin it out).
    float smokeMul = 1.0 + (mIdle ? 0.0 : mp.y * 0.6);
    vec2 smokeUv = vec2(p.x * 1.6 + u_time * 0.05,
                        p.y * 4.0 - u_time * 0.10 + u_song_progress * 0.4);
    float smoke = fbm(smokeUv);
    smoke *= smoothstep(horizonLocal - 0.05, 1.0, yt) * smokeMul;
    col *= mix(1.0, 0.50, clamp(smoke * 0.85, 0.0, 1.2));

    // Pre-tension: as a section change approaches, the horizon brightens.
    float preTension = 1.0 - smoothstep(0.0, 4.0, max(u_to_section_change, 0.0));
    float horizonBand = smoothstep(0.05, 0.0, abs(yt - horizonLocal));
    col += vec3(0.55, 0.22, 0.05) * horizonBand
                                  * (0.20 + 0.55 * preTension + 0.30 * bass + 0.30 * keysSum);

    // Bass swell — the horizon pulses slightly.
    col += vec3(0.18, 0.07, 0.02) * horizonBand * bass * 0.55;

    // Downbeat: brief horizon flash at the kick.
    col += vec3(0.30, 0.12, 0.04) * horizonBand * u_downbeat * 0.55;

    // Bottom-corner glow — feels like fire is on the ground out of frame.
    // Held keys broaden the glow (the fire is hotter when the player sustains).
    float groundGlow = smoothstep(0.18, 0.0, yt) * (0.9 + 0.5 * bass + 0.5 * keysSum);
    col += vec3(0.50, 0.16, 0.04) * groundGlow * 0.35;

    // Vignette — pull edges down so eye lands on the horizon.
    float vig = smoothstep(0.95, 0.40, length(p));
    col *= mix(0.55, 1.0, vig);

    fragColor = vec4(col, 1.0);
}
