// ABOUTME: Display pass for trine — paints the 3-body trail buffer through three
// ABOUTME: warm tints (one per body), then adds bright pinpoints at each live body.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform sampler2D u_state;   // bodies (3 texels in row 0)
uniform sampler2D u_trail;   // accumulated trail (rgb = per-body channel)

#include "math.glsl"
#include "tonemap.glsl"

out vec4 fragColor;

// Three warm tints. Distinct enough to read three separate trajectories,
// close enough to feel like one palette family — no green/cyan.
const vec3 C0 = vec3(1.00, 0.78, 0.40);  // gold
const vec3 C1 = vec3(1.00, 0.50, 0.18);  // ember
const vec3 C2 = vec3(0.85, 0.45, 0.55);  // mauve-rose

void main() {
    vec2  uv     = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;

    vec4 t = texture(u_trail, uv);

    // Near-black ground — never absolutely zero so the warmth carries
    // into shadow.
    vec3 col = vec3(0.04, 0.025, 0.02);

    // Trail painting. pow(_, 0.7) lifts mid-tones so the long tail of a
    // recent passage stays visible without the bright peak overwhelming.
    col += C0 * pow(max(t.r, 0.0), 0.7) * 1.4;
    col += C1 * pow(max(t.g, 0.0), 0.7) * 1.4;
    col += C2 * pow(max(t.b, 0.0), 0.7) * 1.4;

    // Live-body pinpoints — bright core + soft halo so the eye always
    // knows which point is currently emitting.
    for (int i = 0; i < 3; i++) {
        vec4 body = texelFetch(u_state, ivec2(i, 0), 0);
        vec2 d = uv - body.xy;
        d -= floor(d + 0.5);
        d *= vec2(aspect, 1.0);
        float r2 = dot(d, d);

        float core = exp(-r2 / (0.0022 * 0.0022));
        float halo = exp(-r2 / (0.014  * 0.014 ));

        vec3 tint = (i == 0) ? C0 : ((i == 1) ? C1 : C2);
        col += tint * (core * 2.4 + halo * 0.45);
    }

    col = reinhardPartial(col, 4.0);
    col = pow(max(col, 0.0), vec3(0.92));
    fragColor = vec4(col, 1.0);
}
