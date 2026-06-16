#version 300 es
// ABOUTME: Sun-glint layer — Blinn-Phong sparkle off the published wave
// ABOUTME: normal, gated to steep crests, with always-on tremolo twinkle.
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform sampler2D u_wave;     // consumed: rg=grad dir, b=height level, a=slope
uniform float u_audio_high;
uniform float u_audio_playing;

out vec4 fragColor;

void main() {
    vec2 res = u_resolution;
    vec2 uv  = gl_FragCoord.xy / res;

    vec4 w = texture(u_wave, uv);
    vec2  dir   = w.rg * 2.0 - 1.0;
    float level = w.b  * 2.0 - 1.0;
    float slope = w.a;
    float gradMag = slope / max(1.0 - slope, 1e-3);

    // surface normal from the gradient
    vec3 N = normalize(vec3(-dir * gradMag * 0.9, 1.0));
    // low golden sun + head-on view
    vec3 L = normalize(vec3(0.18, 0.55, 0.82));
    vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
    float spec = pow(max(dot(N, H), 0.0), 110.0);

    // clump sparkle onto crest faces (gate tuned for the gentle gradients)
    float mask = smoothstep(0.12, 0.45, slope) * smoothstep(-0.05, 0.50, level);

    // always-on tremolo twinkle, per-cluster phase so it shimmers
    float ph = hash21(floor(gl_FragCoord.xy / 3.0)) * TAU;
    float twinkle = 0.55 + 0.45 * sin(u_time * 54.0 + ph);

    float hi = mix(0.45 + 0.20 * sin(u_time * 0.8), u_audio_high, u_audio_playing);
    float intensity = spec * mask * twinkle * (0.7 + 1.1 * hi) * 4.2;

    // cursor brightens nearby sparkle
    vec2 worldP = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y) * 2.0;
    float heat = vjCursorHeat(worldP, vjMouseWorld(u_mouse, res), 0.5);
    intensity *= 1.0 + 1.6 * heat;

    vec3 spark = mix(vec3(1.0, 0.78, 0.42), vec3(1.0, 0.97, 0.88), spec);
    fragColor = vec4(spark * intensity, 1.0);
}
