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

    // Sample the field at the boid's current position.
    vec4 fieldS   = texture(u_state, pos);
    vec2 fieldVel = fieldS.gb;
    float fieldD  = fieldS.r;

    // Light coupling to the field — boids keep most of their own momentum
    // so they don't all collapse onto the same attractor streamline. The
    // field is a SUGGESTION, not a leash.
    vel = mix(vel, fieldVel, 0.18);

    // Anti-clustering: when a boid finds itself in a high-density cell, it
    // gets a sideways shove perpendicular to its motion, scaled by how
    // crowded it is. Reads as "boid felt the crowd and dodged".
    float crowd = smoothstep(0.4, 1.4, fieldD);
    vec2  perp  = vec2(-vel.y, vel.x);
    float side  = (hash21(vec2(fi, floor(u_time * 6.0))) - 0.5) * 2.0;
    vel += perp * side * crowd * 0.45;

    // Per-boid wobble — bigger than v1's so single-finger sessions don't
    // funnel every boid into one cluster around the lone attractor.
    vec2 wobble = (hash22(vec2(fi * 1.7, u_time * 1.1)) - 0.5);

    // Minimum-speed kick: a stalled boid in dead space picks a random heading
    // so the swarm keeps populating the canvas instead of pooling at edges.
    if (length(vel) < 0.05) {
        vec2 kick = (hash22(vec2(fi * 3.1, u_time * 0.7)) - 0.5);
        vel += kick * 0.4;
    }

    pos += vel * DT * 0.85 + wobble * 0.009;

    // Wrap on edges — boids never "leave"; they re-enter on the other side.
    pos = fract(pos);

    fragColor = vec4(pos, vel);
}
