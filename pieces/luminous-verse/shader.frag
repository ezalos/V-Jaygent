#version 300 es
// ABOUTME: Composite pass for "luminous-verse" — additive bloom pyramid over
// ABOUTME: the HDR scene, exposure tonemap, gamma, vignette, dither.
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform sampler2D u_scene;
uniform sampler2D u_bloom1;
uniform sampler2D u_bloom2;
uniform sampler2D u_bloom3;

uniform float u_audio_playing;
uniform float u_audio_bass_stem;
uniform float u_audio_drums_stem;

#include "math.glsl"
#include "noise.glsl"

out vec4 fragColor;

vec3 tent(sampler2D t, vec2 uv, float r) {
    vec2 px = r / vec2(textureSize(t, 0));
    vec3 s = texture(t, uv).rgb * 4.0;
    s += texture(t, uv + vec2( px.x, 0.0)).rgb * 2.0;
    s += texture(t, uv + vec2(-px.x, 0.0)).rgb * 2.0;
    s += texture(t, uv + vec2(0.0,  px.y)).rgb * 2.0;
    s += texture(t, uv + vec2(0.0, -px.y)).rgb * 2.0;
    s += texture(t, uv + px).rgb;
    s += texture(t, uv - px).rgb;
    s += texture(t, uv + vec2(px.x, -px.y)).rgb;
    s += texture(t, uv + vec2(-px.x, px.y)).rgb;
    return s / 16.0;
}

void main() {
    vec2 uv  = gl_FragCoord.xy / u_resolution;
    vec2 asp = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 p   = uv * asp;

    // bass widens the halo — the wall of synth physically swells the light
    float r = 1.0 + 0.9 * u_audio_bass_stem;

    vec3 hdr = texture(u_scene, uv).rgb
             + tent(u_bloom1, uv, r) * 0.50
             + tent(u_bloom2, uv, r) * 0.75
             + tent(u_bloom3, uv, r) * 0.95;

    // exposure tonemap; drums pump it a breath
    float exposure = 1.05 + 0.25 * u_audio_drums_stem;
    vec3 col = 1.0 - exp(-hdr * exposure);
    col = pow(col, vec3(1.0 / 2.2));

    // vignette into warm black — the dark is what makes the light read
    vec2  vd  = p - 0.5 * asp;
    float vig = 1.0 - 0.38 * smoothstep(0.25, 0.95, dot(vd, vd));
    col *= vig;
    col = max(col, vec3(0.012, 0.010, 0.009));   // warm-black floor

    col += (hash21(gl_FragCoord.xy + fract(u_time) * 61.7) - 0.5) / 255.0;
    fragColor = vec4(saturate3(col), 1.0);
}
