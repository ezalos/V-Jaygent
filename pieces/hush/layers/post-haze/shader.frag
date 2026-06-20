#version 300 es
// ABOUTME: post-haze — final grade for the whole stack. reinhardPartial keeps
// ABOUTME: warm highlights, film grain breaks up the dust, a vignette pulls the
// ABOUTME: edges to near-black so the dark negative space survives.
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "tonemap.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform sampler2D u_below;
out vec4 fragColor;

void main() {
    vec2  uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2  p = (uv - 0.5) * vec2(aspect, 1.0);

    vec3 c = texture(u_below, uv).rgb;

    // Warm highlight compression — peaks roll toward cream, never to cyan.
    c = reinhardPartial(c, 3.5);

    // Static film-stock grain (spatial only — no per-frame re-randomization,
    // which would spike temporal jerk and read as flicker, wrong for a hush).
    float gr = (hash21(gl_FragCoord.xy * 1.7) - 0.5) * 0.018;
    c += gr * smoothstep(0.0, 0.25, dot(c, vec3(0.33)));  // grain only where there's light

    // Vignette — carry the dark edges.
    float vig = smoothstep(1.25, 0.30, length(p));
    c *= mix(0.55, 1.0, vig);

    fragColor = vec4(saturate3(c), 1.0);
}
