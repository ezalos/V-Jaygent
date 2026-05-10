// ABOUTME: 100 Lagrangian boids swimming in the Eulerian velocity field. Stored as
// ABOUTME: a 10x10 region of an rgba16f ping-pong texture; (rg) = pos uv, (ba) = vel.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform int       u_frame;
uniform sampler2D u_state;   // sim field — read .gb for velocity, .a for affinity
uniform sampler2D u_boids;   // self ping-pong

#include "math.glsl"
#include "noise.glsl"

out vec4 fragColor;

const int   NUM_BOIDS  = 100;
const float DT         = 0.04;

void main() {
    ivec2 myCoord = ivec2(gl_FragCoord.xy);
    int   id      = myCoord.y * 10 + myCoord.x;

    // Outside the 10x10 boid grid: write zero (those texels are unused).
    if (myCoord.x >= 10 || myCoord.y >= 10 || id >= NUM_BOIDS) {
        fragColor = vec4(0.0);
        return;
    }

    float fi = float(id);

    if (u_frame == 0) {
        // Scatter initial positions across the canvas.
        vec2 hp = hash22(vec2(fi * 0.137 + 1.7, fi * 0.273 + 5.3));
        fragColor = vec4(hp, 0.0, 0.0);
        return;
    }

    // Read previous (pos.xy, vel.xy)
    vec4 self = texelFetch(u_boids, myCoord, 0);
    vec2 pos  = self.xy;
    vec2 vel  = self.zw;

    // Sample the velocity field at the boid's current position. The field
    // already encodes finger attractors + flocking-style alignment, so the
    // boid inherits all of that for free by drifting with it.
    vec2 fieldVel = texture(u_state, pos).gb;

    // Mix our own momentum with the field — gives the boid a short memory
    // (won't snap-stop when the field dies under it) without wandering off.
    vel = mix(vel, fieldVel, 0.45);

    // Per-boid wobble — small jitter so identical-velocity boids still look
    // like distinct individuals instead of a rigid herd.
    vec2 wobble = (hash22(vec2(fi * 1.7, u_time * 1.1)) - 0.5);

    pos += vel * DT * 0.85 + wobble * 0.0035;

    // Wrap on edges — boids never "leave"; they re-enter on the other side.
    pos = fract(pos);

    fragColor = vec4(pos, vel);
}
