#version 300 es
// ABOUTME: Rising-motes layer — sparse suspended particles drift upward as the
// ABOUTME: piece descends; parallax depth bands, warm near surface -> cool deep.
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "interaction.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_high;
uniform float u_audio_playing;
uniform float u_song_progress;
uniform float u_keys[15];

out vec4 fragColor;

// One parallax band of rising motes. Returns coverage in [0,1].
float moteBand(vec2 p, float scale, float speed, float seed, float t) {
    vec2 g = p * scale;
    g.y -= t * speed;                       // rise
    g.x += 0.18 * sin(t * 0.6 + g.y * 0.7); // gentle sway
    vec2 cell = floor(g);
    vec2 f = fract(g);
    if (hash21(cell + seed) < 0.62) return 0.0;   // sparse: most cells empty
    vec2 rnd = hash22(cell + seed * 3.0);
    vec2 c = vec2(0.25 + 0.5 * rnd.x, 0.25 + 0.5 * rnd.y);
    float d = length(f - c);
    float dot = smoothstep(0.13, 0.0, d);
    dot *= 0.55 + 0.45 * sin(t * 1.8 + rnd.x * TAU);   // slow flicker
    return dot;
}

void main() {
    vec2 res = u_resolution;
    vec2 uv  = gl_FragCoord.xy / res;
    float aspect = res.x / res.y;
    vec2 p = vec2(uv.x * aspect, uv.y);

    float t = u_time;
    float descent = clamp(u_song_progress, 0.0, 1.0);

    // motes emerge as we sink — sparse near the surface, a drifting field deep
    float vis = 0.12 + 0.88 * smoothstep(0.18, 0.65, descent);
    float anyKey = 0.0;
    for (int i = 0; i < 15; i++) anyKey = max(anyKey, u_keys[i]);
    vis += 0.25 * anyKey;                           // a held key stirs up more

    // three parallax bands: near (big/fast) -> far (small/slow)
    float m = 0.0;
    m += 1.00 * moteBand(p,  7.0, 0.045, 11.3, t);  // near
    m += 0.70 * moteBand(p, 12.0, 0.030, 27.1, t);  // mid
    m += 0.45 * moteBand(p, 20.0, 0.020, 53.7, t);  // far
    m *= vis;

    // shimmer with the high band (and a little when idle)
    float hi = mix(0.5 + 0.2 * sin(t * 0.9), u_audio_high, u_audio_playing);
    m *= 0.7 + 0.6 * hi;

    // cursor brightens nearby motes
    vec2 worldP = (gl_FragCoord.xy - 0.5 * res) / min(res.x, res.y) * 2.0;
    float heat = vjCursorHeat(worldP, vjMouseWorld(u_mouse, res), 0.5);
    m *= 1.0 + 1.4 * heat;

    // warm last-light near the surface -> cool pale violet in the deep
    vec3 warm = vec3(1.0, 0.80, 0.45);
    vec3 cool = vec3(0.72, 0.74, 1.0);
    vec3 col = mix(warm, cool, smoothstep(0.30, 0.75, descent)) * m * 0.9;

    fragColor = vec4(col, 1.0);
}
