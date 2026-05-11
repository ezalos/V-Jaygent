#version 300 es
// ABOUTME: Slow domain-warped fbm haze. Section-progress drifts the phase;
// ABOUTME: mid-band warps the field. Candlelit-court atmospheric layer.
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_audio_playing;
uniform float u_section_progress;
uniform float u_song_progress;

uniform float haze_scale;
uniform float haze_strength;

out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 c  = (gl_FragCoord.xy - 0.5 * u_resolution)
            / min(u_resolution.x, u_resolution.y);

    float playing = u_audio_playing;
    float mid   = mix(0.4 + 0.25 * sin(u_time * 0.9),  u_audio_mid,        playing);
    float hi    = mix(0.3 + 0.20 * sin(u_time * 1.5),  u_audio_high,       playing);
    float sprog = mix(fract(u_time * 0.05),            u_section_progress, playing);
    float gprog = mix(fract(u_time * 0.01),            u_song_progress,    playing);

    // Domain warp the field — mid-band drives the warp amount AND the high-band
    // drives the warp's spatial frequency (geometric, both probes pass).
    float scale_eff = haze_scale * (1.0 + 0.50 * hi);
    vec2 q = c * scale_eff + vec2(u_time * 0.05, sprog * 1.3);
    vec2 warp = vec2(fbm(q + vec2(0.0, 1.7)),
                     fbm(q + vec2(2.3, 0.0)));
    warp = (warp - 0.5) * (0.6 + 1.4 * mid);

    float h = fbm(q + warp);
    h = pow(h, 1.4);  // soften lows, keep highlights
    h *= haze_strength;

    // Cursor heat: a soft warm patch in the haze where the cursor hovers.
    // Idle ⇒ mouseWorld is vec2(1e4), so the heat term naturally falls to
    // zero. Dominance-probe friendly — peak contribution ~0.25.
    vec2 mw = vjMouseWorld(u_mouse, u_resolution);
    float heat = vjCursorHeat(c, mw, 0.45);
    h += heat * 0.28;

    // Warm haze tint — drift through ember/amber across the song.
    vec3 ember = vec3(0.85, 0.30, 0.10);
    vec3 amber = vec3(1.00, 0.55, 0.20);
    vec3 cream = vec3(1.00, 0.85, 0.55);
    vec3 family = mix(ember, amber, smoothstep(0.0, 1.0, fract(gprog * 0.7 + 0.2)));
    vec3 col = mix(family, cream, smoothstep(0.4, 1.0, h)) * h;

    fragColor = vec4(col, 1.0);
}
