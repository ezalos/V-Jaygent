#version 300 es
// ABOUTME: grain-tone — final post: Reinhard tonemap, warm film-grain shimmer
// ABOUTME: (always-on sub-beat floor), gentle vignette + gamma.
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "tonemap.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform int   u_frame;
uniform float u_audio_playing;
uniform float u_audio_high;
uniform float u_song_progress;
uniform sampler2D u_below;
uniform sampler2D u_history;

out vec4 fragColor;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec3 col = texture(u_below, uv).rgb;

    // gentle peak chroma push toward the fiebre's hot end on the loud highs.
    col = mix(col, col * vec3(1.05, 0.92, 0.85), 0.18 * u_audio_high);

    // motion blur — a stable EMA toward last frame's final image. Smooths the
    // optical flow so fast comet-heads stay trackable (prediction_continuity)
    // and leaves a faint warm trail. mix (not add) → no runaway, no grey pump.
    float blur = 0.65 * smoothstep(0.0, 1.0, float(u_frame) / 20.0);
    col = mix(col, texture(u_history, uv).rgb, blur);

    // Reinhard roll-off so peaks compress to warm near-white, never clip cyan.
    col = reinhardPartial(col, 1.6);

    // warm film grain — fine, monochrome-ish luminance jitter (NOT chromatic
    // separation). Kept small: per-frame grain spikes optical-flow jerk, so
    // this is a whisper, just enough for a sub-beat sheen.
    float g = hash21(gl_FragCoord.xy + vec2(float(u_frame) * 1.37, u_time * 60.0));
    float amp = 0.007 + 0.006 * u_audio_high;
    col *= 1.0 + (g - 0.5) * amp;

    // gentle vignette — frames the field, leaves a rest area at the edges
    // without doing the composition's job.
    float vig = smoothstep(1.25, 0.35, length((uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0)));
    col *= 0.78 + 0.22 * vig;

    col = max(col, 0.0);
    col = pow(col, vec3(0.88));         // gentle gamma

    fragColor = vec4(col, 1.0);
}
