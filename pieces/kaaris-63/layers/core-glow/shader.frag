#version 300 es
// ABOUTME: core-glow — the vanishing-point ember pull at the throat centre.
// ABOUTME: pulses with bass, brightens with vocals, slow swirling tendrils. add blend.
precision highp float;

#include "math.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_playing;
uniform float u_audio_kick;
uniform float u_audio_bass_stem;
uniform float u_audio_vocals_stem;
uniform float u_downbeat;
uniform sampler2D u_below;

out vec4 fragColor;

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec3 below = texture(u_below, uv).rgb;
    float playing = u_audio_playing;

    float bass = mix(0.16 + 0.12 * sin(u_time * 1.30), u_audio_bass_stem, playing);
    float kick = mix(0.12 + 0.12 * pow(0.5 + 0.5*sin(u_time*2.05), 6.0), u_audio_kick, playing);
    float voc  = mix(0.20 + 0.10 * sin(u_time * 0.55 + 1.0), u_audio_vocals_stem, playing);

    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
    vec2 mw = vjMouseWorldOrZero(u_mouse, u_resolution);
    p -= clamp(mw, vec2(-0.45), vec2(0.45)) * 0.32;

    float r = length(p);
    float a = atan(p.y, p.x);

    // glow radius breathes with the bass but stays COMPACT — a hot ember at the
    // vanishing point, never a frame-filling disc (the drop's intensity comes from
    // the clench + flares + wall cracks, not a bigger central blob)
    float sigma = 0.010 + 0.020 * bass + 0.013 * kick + 0.010 * u_downbeat;
    float glow = exp(-(r * r) / sigma);

    // slow swirling hot tendrils so the core is alive, not a static blob
    float arms = 0.5 + 0.5 * sin(a * 3.0 - 6.5 / max(r + 0.04, 0.04) + u_time * 1.4);
    arms = pow(arms, 3.0);
    float tendril = arms * exp(-(r * r) / (sigma * 2.2)) * 0.5;

    float core = glow + tendril;

    // colour: deep ember body, climbs to amber on energy, cream only on true peaks
    vec3 ember = vec3(0.55, 0.13, 0.04);
    vec3 amber = vec3(0.98, 0.50, 0.16);
    vec3 cream = vec3(1.00, 0.90, 0.66);
    float hot = clamp(0.25 * bass + 0.45 * voc + 0.55 * kick, 0.0, 1.0);
    vec3 col = mix(ember, amber, smoothstep(0.0, 0.65, hot));
    col = mix(col, cream, smoothstep(0.70, 1.0, hot));

    col *= core * (0.55 + 0.85 * (0.4 * bass + 0.6 * voc) + 0.70 * kick);

    fragColor = vec4(col, 1.0);
}
