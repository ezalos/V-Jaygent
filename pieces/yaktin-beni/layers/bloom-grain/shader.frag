#version 300 es
// ABOUTME: yaktin-beni grade — HDR bloom of the bright antinodes/filament, kick
// ABOUTME: shockwave ring, snare ember sparks, Reinhard tonemap + warm grain + vignette.
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "palette.glsl"
#include "tonemap.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_audio_playing;
uniform float u_audio_kick;
uniform float u_audio_snare;
uniform float u_audio_cymbal;
uniform float u_audio_drums_stem;
uniform float u_audio_level;
uniform float u_beat_phase;
uniform float u_downbeat;
uniform sampler2D u_below;

out vec4 fragColor;

// luminance of the warm residual to bloom.
float luma(vec3 c) { return dot(c, vec3(0.30, 0.59, 0.11)); }

void main() {
    vec2 res = u_resolution;
    vec2 uv  = gl_FragCoord.xy / res;
    vec2 p   = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y) * 2.0;

    float playing = u_audio_playing;
    float kick   = mix(0.5 * pow(max(0.0, sin(u_time * 3.1416)), 8.0), u_audio_kick, playing);
    float snare  = mix(0.0, u_audio_snare, playing);
    float cymbal = mix(0.0, u_audio_cymbal, playing);
    float beatPh = mix(fract(u_time * 1.02), u_beat_phase, playing);

    vec3 below = texture(u_below, uv).rgb;

    // --- HDR bloom: ring of taps, keep only the bright residual ------------
    vec3 bloom = vec3(0.0);
    float thr = 0.55;
    for (int i = 0; i < 8; i++) {
        float a = float(i) / 8.0 * TAU;
        vec2 dir = vec2(cos(a), sin(a));
        for (int s = 0; s < 2; s++) {
            float rr = (float(s) + 1.0) * 0.012;
            vec3 t = texture(u_below, uv + dir * rr).rgb;
            bloom += max(t - thr, 0.0);
        }
    }
    bloom /= 16.0;
    vec3 col = below + bloom * 1.7;

    // --- kick shockwave: a ring expanding once per beat, lit by the kick ---
    float r = length(p);
    float ringR = beatPh * 1.25;
    float ring = exp(-pow((r - ringR) / 0.055, 2.0)) * (1.0 - beatPh);
    col += warmCycle(0.02) * ring * (0.25 + 1.3 * kick);
    col += warmCycle(0.10) * exp(-r * r * 8.0) * u_downbeat * 0.4;   // downbeat core flash

    // --- ember sparks on snare / cymbal transients ------------------------
    float spark = max(snare, 0.7 * cymbal);
    if (spark > 0.02) {
        vec2 g = p * 7.0;
        vec2 cell = floor(g);
        vec2 h = hash22(cell + floor(u_time * 6.0));
        vec2 sp = cell + h;                       // spark position in cell space
        float d = length(g - sp);
        float tw = step(0.82, h.x) * (0.5 + 0.5 * sin(u_time * 30.0 + h.y * 40.0));
        col += vec3(1.0, 0.85, 0.6) * exp(-d * d * 9.0) * tw * spark * 1.4;
    }

    // --- grade: Reinhard tonemap, warm grain, vignette --------------------
    col = reinhard(col * (1.0 + 0.15 * u_audio_level));
    float grain = (hash21(uv * res + fract(u_time) * 311.0) - 0.5) * 0.04;
    col += grain;
    col *= 0.55 + 0.45 * pow(1.0 - r * 0.5, 1.5);   // vignette to near-black edges
    col = pow(max(col, 0.0), vec3(0.92));           // mild lift

    fragColor = vec4(col, 1.0);
}
