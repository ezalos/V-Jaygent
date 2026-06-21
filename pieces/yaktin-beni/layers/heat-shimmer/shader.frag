#version 300 es
// ABOUTME: yaktin-beni heat-shimmer — domain-warped fbmRot refraction of u_below;
// ABOUTME: the chaos layer that breaks the mandala's symmetry and re-seeds per section.
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "palette.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_frame;
uniform float u_audio_playing;
uniform float u_audio_other_stem;
uniform float u_audio_level;
uniform float u_section_id;
uniform sampler2D u_below;

out vec4 fragColor;

void main() {
    vec2 res = u_resolution;
    vec2 uv  = gl_FragCoord.xy / res;
    vec2 p   = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y) * 2.0;

    float playing = 1.0;   // force REAL uniforms: stems+section are frozen-VALID when paused, so paused==playing. (u_audio_playing=0 on pause flipped to synthetic = the bug). Idle falls back to the section floor + wallclock u_time.
    float other = mix(0.30 + 0.25 * sin(u_time * 1.3 + 2.0), u_audio_other_stem, playing);
    float level = 0.35 + 0.20 * sin(u_time * 0.9);   // time-based (not live FFT, consistent paused/playing)
    float sidF  = mix(floor(mod(u_time * 0.066, 7.0)), u_section_id, playing);

    // re-seed the warp domain per section so boundaries bring new texture
    // (different event vocabulary, not a re-shaded same field).
    vec2 seed = vec2(sidF * 13.3, sidF * 7.1);
    float t = u_time * 0.16;

    // domain-warped carrier: warp = fbm(p + fbm(p)) — the heat-haze ridge.
    vec2 w1 = vec2(fbmRot(p * 2.3 + seed + t),
                   fbmRot(p * 2.3 + seed.yx + 4.7 - t));
    vec2 warp = vec2(fbmRot(p * 3.1 + w1 + seed - t * 0.7),
                     fbmRot(p * 3.1 + w1.yx + seed + 9.0 + t * 0.7)) - 0.5;

    // breakdown (section 4) shimmers harder — the symmetry visibly dissolves.
    float fracture = (int(sidF + 0.5) == 4) ? 1.0 : 0.0;
    float depth = (0.004 + 0.011 * other + 0.010 * fracture) * (0.6 + 0.4 * level);

    vec3 below = texture(u_below, uv).rgb;
    if (dot(below, vec3(1.0)) < 0.01) below = warmShadow(0.6) * 0.5;   // bottom fallback

    vec3 refr = texture(u_below, uv + warp * depth).rgb;

    // faint warm "burning air" lift in the hottest warp ridges.
    float ridge = smoothstep(0.55, 0.95, length(warp) + 0.3);
    refr += warmCycle(0.05) * ridge * (0.05 + 0.10 * other) * (0.6 + 0.4 * exp(-dot(p, p) * 0.6));

    // ramp in from frame 0 so a cold start doesn't snap.
    float ramp = smoothstep(0.0, 1.0, u_frame / 20.0);
    fragColor = vec4(mix(below, refr, ramp), 1.0);
}
