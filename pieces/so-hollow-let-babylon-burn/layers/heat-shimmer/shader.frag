#version 300 es
// ABOUTME: Heat-shimmer — top-of-stack u_below distortion via curl noise +
// ABOUTME: audio-high vertical wobble. Real heat-haze refraction; mass scales
// ABOUTME: with energy + bass; cursor adds local turbulence near it.
precision highp float;

float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
    float v = 0.0, a = 0.55;
    for (int i = 0; i < 4; i++) {
        v += a * vnoise(p);
        p *= 2.0;
        a *= 0.55;
    }
    return v;
}

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform sampler2D u_below;

uniform float u_audio_playing;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;

uniform float u_bar_phase;
uniform float u_beat_phase;

uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_energy_smooth;

out vec4 fragColor;

void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2  uv     = gl_FragCoord.xy / u_resolution;
    vec2  p      = (uv - 0.5) * vec2(aspect, 1.0);

    bool  mIdle  = u_mouse.x < 1.0 && u_mouse.y < 1.0;
    vec2  mp     = (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0);

    float playing = u_audio_playing;
    float bass    = mix(0.30 + 0.18 * sin(u_time * 0.61),    u_audio_bass, playing);
    float mid     = mix(0.20 + 0.15 * sin(u_time * 1.27 + 1.7), u_audio_mid,  playing);
    float high    = mix(0.0,                                 u_audio_high, playing);

    // Per-section shimmer mass — tier-based. Vortex sections (2, 4, 5)
    // tremble hard; intimate / architectural sections stay still so the
    // pillars and embers can be read clearly. Section 4 (apocalypse) is
    // the only one that pushes past 0.5.
    float secMass[8] = float[8](0.10, 0.10, 0.50, 0.08, 0.85, 0.45, 0.10, 0.05);
    int   sid        = clamp(u_section_id, 0, 7);
    int   nid        = clamp(sid + 1, 0, 7);
    // Late-ramp transition (matches fire-core / fire-eyes) so intimate
    // sections stay still until they're about to flip into vortex.
    float mass       = mix(secMass[sid], secMass[nid], smoothstep(0.70, 0.95, u_section_progress));
    mass            *= 0.55 + 0.30 * u_energy_smooth + 0.20 * bass;

    // ----- Curl-noise displacement -----
    // Two fbm fields at different scales; their gradient gives a curl-like
    // displacement so pixels are pulled along streamlines, not pushed
    // randomly.
    float t = u_time * 0.45;
    vec2  q  = uv * 4.0 + vec2(0.0, t * 0.3);
    float n1 = fbm(q);
    float n2 = fbm(q + vec2(13.7, 0.0) + vec2(-t * 0.3, 0.0));
    vec2  baseDisp = vec2(n2 - 0.5, n1 - 0.5);

    // Higher-frequency wobble driven by audio_high — ripple lines along y
    float hfWobX = high * 0.5 * sin(uv.y * 60.0 + u_time * 9.0)
                 + bass * 0.2 * sin(uv.y * 18.0 + u_time * 2.5);
    vec2  hfDisp = vec2(hfWobX, 0.0);

    // Cursor-local turbulence — near the cursor, shimmer is much stronger
    float cursorTurb = 0.0;
    vec2  cursorDisp = vec2(0.0);
    if (!mIdle) {
        float cd = length(p - mp);
        cursorTurb = exp(-cd * cd * 6.0);
        cursorDisp = vec2(sin(u_time * 4.0 + cd * 30.0),
                          cos(u_time * 4.7 + cd * 30.0)) * 0.022 * cursorTurb;
    }

    // ----- Mask -----
    // Apply the displacement everywhere but stronger above the horizon — the
    // hot air rises. Quiet near top edges so the frame doesn't crawl.
    float skyMask  = 0.5 + 0.5 * smoothstep(-0.20, 0.30, p.y);
    float topGuard = 1.0 - smoothstep(0.40, 0.50, p.y);
    float maskV    = skyMask * topGuard;

    // ----- Beat snap — every beat the displacement contracts briefly, like
    // the air gasping
    float beatSnap = smoothstep(0.0, 0.18, 1.0 - u_beat_phase);
    float dispScale = mass * (0.010 + 0.012 * beatSnap);

    vec2 disp = (baseDisp * dispScale + hfDisp * 0.006 * mass) * maskV
              + cursorDisp * 0.5;

    // ----- Sample u_below at displaced UV -----
    // Pure UV displacement only (no chromatic dispersion) so we stay in the
    // warm-only palette family. The shimmer is in the SHAPE distortion,
    // not in colour separation.
    vec3 base = texture(u_below, uv + disp).rgb;

    fragColor = vec4(base, 1.0);
}
