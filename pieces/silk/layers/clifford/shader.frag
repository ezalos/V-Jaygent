#version 300 es
// ABOUTME: Clifford strange-attractor warped field — each pixel iterates the
// ABOUTME: 2D Clifford map from its UV and colors itself by the orbit's
// ABOUTME: endpoint position. The attractor's filament shape emerges from
// ABOUTME: the continuous map; audio modulates the (a,b,c,d) parameters.
precision highp float;

#include "math.glsl"
#include "noise.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform int   u_frame;
uniform vec2  u_mouse;
uniform sampler2D u_history;
uniform sampler2D u_below;

uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_audio_level;
uniform float u_audio_playing;
uniform float u_audio_bass_stem;
uniform float u_audio_other_stem;

uniform float iter_count;
uniform float decay;
uniform float zoom;
uniform float morph_a;
uniform float morph_b;
uniform float morph_c;
uniform float morph_d;
uniform float cursor_grab;

out vec4 fragColor;

vec2 cliffordStep(vec2 p, vec4 P) {
    return vec2(
        sin(P.x * p.y) + P.z * cos(P.x * p.x),
        sin(P.y * p.x) + P.w * cos(P.y * p.y)
    );
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p_screen = (uv - 0.5) * vec2(aspect, 1.0);
    float h_ramp = smoothstep(0.0, 1.0, float(u_frame) / 30.0);

    float p_bass = mix(0.30 + 0.18*sin(u_time*0.61), max(u_audio_bass, u_audio_bass_stem), u_audio_playing);
    float p_mid  = mix(0.30 + 0.18*sin(u_time*0.83 + 1.0), u_audio_mid, u_audio_playing);
    float p_high = mix(0.30 + 0.18*sin(u_time*0.97 + 2.0), u_audio_high, u_audio_playing);
    float p_oth  = mix(0.30 + 0.18*sin(u_time*0.71 + 3.0), u_audio_other_stem, u_audio_playing);

    vec4 P_web  = vec4(-1.25, -1.25, -1.82, -1.91);
    vec4 P_lace = vec4(-1.20, -1.90,  1.80, -1.60);
    vec4 P_fold = vec4(-1.70,  1.80, -1.90, -0.40);
    vec4 P_curl = vec4( 1.70,  1.70,  0.60,  1.20);

    float ta = clamp(morph_a + 0.35 * p_bass + 0.10 * sin(u_time*0.041),       0.0, 1.0);
    float tc = clamp(morph_c + 0.35 * p_high + 0.10 * sin(u_time*0.067 + 2.2), 0.0, 1.0);
    float td = clamp(morph_d + 0.35 * p_oth  + 0.10 * sin(u_time*0.073 + 3.3), 0.0, 1.0);

    vec4 P = mix(mix(P_web, P_lace, ta), mix(P_curl, P_fold, tc), td);
    P += 0.08 * vec4(sin(u_time*0.131), cos(u_time*0.117), sin(u_time*0.149+1.7), cos(u_time*0.107+2.3));

    vec2 center = u_resolution * 0.5;
    vec2 cursor_norm = (u_mouse - center) / center;
    float cursor_active = step(20.0, length(u_mouse));
    vec2 cursor_shift = cursor_norm * 0.3 * cursor_active * cursor_grab;

    int K = int(iter_count);

    // Per-pixel orbit — keep iteration count modest so the Jacobian doesn't
    // explode (chaos amplifies gradients exponentially in K).
    vec2 p = (p_screen + cursor_shift) * 3.6 * zoom;
    for (int i = 0; i < 32; i++) {
        if (i >= K) break;
        p = cliffordStep(p, P);
    }

    // Orbit endpoint → warm palette. Every pixel gets a value so the
    // attractor's geometry shows as a continuous warm field.
    float a = 0.5 + 0.5 * cos(p.x * 1.8);
    float b = 0.5 + 0.5 * sin(p.y * 2.1 + p.x * 0.5);
    float t = a * b;

    // Ridge: brightness rises sharply at level-set transitions.
    float ridge = pow(t, 1.5);

    // Bounded mask cuts pixels whose orbits flew off.
    float rho = length(p);
    float bounded = 1.0 - smoothstep(2.6, 4.2, rho);

    // Audio boost.
    float boost = 0.7 + 0.7 * p_bass;

    // Warm palette: near-black → wine → rust → amber → cream.
    vec3 c0 = vec3(0.02, 0.005, 0.005); // near-black
    vec3 c1 = vec3(0.20, 0.05, 0.04);   // wine
    vec3 c2 = vec3(0.62, 0.24, 0.07);   // rust
    vec3 c3 = vec3(1.05, 0.62, 0.20);   // amber
    vec3 c4 = vec3(1.15, 0.85, 0.50);   // cream
    float u_t = ridge * bounded;
    vec3 col;
    if (u_t < 0.25)      col = mix(c0, c1, u_t / 0.25);
    else if (u_t < 0.5)  col = mix(c1, c2, (u_t - 0.25) / 0.25);
    else if (u_t < 0.75) col = mix(c2, c3, (u_t - 0.5) / 0.25);
    else                 col = mix(c3, c4, (u_t - 0.75) / 0.25);
    col *= boost;

    // u_history feedback for temporal smoothness; use MAX so attractor
    // structure persists, dims over decay.
    vec3 prev = texture(u_history, uv).rgb * decay * h_ramp;
    vec3 final = max(prev, col);
    final = final / (1.0 + 0.35 * final);

    fragColor = vec4(final, 1.0);
}
