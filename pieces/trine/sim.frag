// ABOUTME: 3-body Newtonian gravity sim — softened inverse-square + cursor as 4th
// ABOUTME: pull-source. Stored as 3 texels in a tiny rgba16f ping-pong; rg = pos, ba = vel.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec2      u_mouse;
uniform int       u_frame;
uniform sampler2D u_state;

#include "math.glsl"

out vec4 fragColor;

const int   N_BODIES    = 3;
const float G           = 0.30;
const float SOFT2       = 0.04 * 0.04;     // Plummer ε² — kills singularities at close approach
const float DT          = 0.012;
const float CURSOR_MASS = 5.0;

void main() {
    int id = int(gl_FragCoord.x);

    // Texels past the body count are unused — write zeros and exit.
    if (id >= N_BODIES) { fragColor = vec4(0.0); return; }

    if (u_frame == 0) {
        // Near-equilateral triangle with tangential velocities — sets up
        // a rotation that quickly drifts into chaotic 3-body motion.
        if      (id == 0) fragColor = vec4(0.30, 0.50,  0.00,  0.20);
        else if (id == 1) fragColor = vec4(0.70, 0.50,  0.00, -0.20);
        else              fragColor = vec4(0.50, 0.78, -0.20,  0.00);
        return;
    }

    vec4 self = texelFetch(u_state, ivec2(id, 0), 0);
    vec2 pos  = self.xy;
    vec2 vel  = self.zw;

    // Pairwise gravitational acceleration. Toroidal delta — bodies that
    // wrap across the seam still pull on each other.
    vec2 acc = vec2(0.0);
    for (int j = 0; j < N_BODIES; j++) {
        if (j == id) continue;
        vec4 other = texelFetch(u_state, ivec2(j, 0), 0);
        vec2 d = other.xy - pos;
        d -= floor(d + 0.5);
        float r2    = dot(d, d) + SOFT2;
        float invR3 = inversesqrt(r2 * r2 * r2);
        acc += G * d * invR3;
    }

    // Cursor as a 4th body — when active. The runtime sets u_mouse=(0,0)
    // when idle (canvas corner sentinel); inspect leaves it near the
    // canvas centre so headless renders show the cursor effect, which is
    // good for verifying the pull works.
    if (u_mouse.x > 0.5 || u_mouse.y > 0.5) {
        vec2 cursorUv = u_mouse / u_resolution;
        vec2 d = cursorUv - pos;
        d -= floor(d + 0.5);
        float r2    = dot(d, d) + SOFT2;
        float invR3 = inversesqrt(r2 * r2 * r2);
        acc += G * CURSOR_MASS * d * invR3;
    }

    // Symplectic Euler — better than forward Euler for orbital mechanics
    // on this time scale, simpler than full leapfrog.
    vel += acc * DT;
    pos += vel * DT;
    pos  = fract(pos);   // toroidal wrap

    fragColor = vec4(pos, vel);
}
