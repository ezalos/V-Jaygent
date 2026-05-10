// ABOUTME: 1000 Reynolds boids — separation, alignment, cohesion. Stored in a 32x32
// ABOUTME: region of an rgba16f ping-pong texture; rg = pos uv, ba = vel.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform int       u_frame;
uniform sampler2D u_boids;   // self ping-pong

uniform vec4 u_touches[8];   // xy = px (target space), z = age, w = active
uniform int  u_touch_count;

#include "math.glsl"
#include "noise.glsl"

out vec4 fragColor;

const int   GRID       = 32;       // 32 x 32 = 1024 slots; first NUM are alive
const int   NUM_BOIDS  = 1000;
const float DT         = 0.016;

// Reynolds rule weights. Tuned for fluid flocking on a toroidal world with
// the boid density (1000 in [0,1]²).
const float PERCEPT_R   = 0.075;
const float SEPARATE_R  = 0.009;     // tight — barely larger than the triangle
const float W_SEPARATE  = 0.85;      // strong but only inside the small radius
const float W_ALIGN     = 0.035;     // gentle heading lock
const float W_COHESION  = 0.028;     // gentle pull toward neighbours
const float MAX_SPEED   = 0.21;
const float MIN_SPEED   = 0.05;
const float DAMPING     = 0.985;     // smooth per-frame inertia decay

void main() {
    ivec2 myCoord = ivec2(gl_FragCoord.xy);
    int   id      = myCoord.y * GRID + myCoord.x;

    // Texels outside the 32x32 grid (and the unused tail past NUM_BOIDS) are zeros.
    if (myCoord.x >= GRID || myCoord.y >= GRID || id >= NUM_BOIDS) {
        fragColor = vec4(0.0);
        return;
    }

    float fi = float(id);

    if (u_frame == 0) {
        vec2 hp  = hash22(vec2(fi * 0.137 + 1.7, fi * 0.273 + 5.3));
        vec2 hv  = hash22(vec2(fi * 0.711 + 9.1, fi * 0.493 + 3.7)) - 0.5;
        vec2 v0  = normalize(hv + 1e-3) * (MIN_SPEED + 0.2 * fract(sin(fi * 4.7)));
        fragColor = vec4(hp, v0);
        return;
    }

    vec4 self = texelFetch(u_boids, myCoord, 0);
    vec2 pos  = self.xy;
    vec2 vel  = self.zw;

    vec2 sepSum   = vec2(0.0);
    vec2 alignSum = vec2(0.0);
    vec2 cohDelta = vec2(0.0);   // sum of (neighbour - self) using toroidal nearest copy
    int  alignN   = 0;
    int  cohN     = 0;

    const float P2 = PERCEPT_R  * PERCEPT_R;
    const float S2 = SEPARATE_R * SEPARATE_R;

    for (int j = 0; j < NUM_BOIDS; j++) {
        if (j == id) continue;
        ivec2 jc    = ivec2(j % GRID, j / GRID);
        vec4  other = texelFetch(u_boids, jc, 0);
        vec2  op    = other.xy;
        vec2  ov    = other.zw;

        // Toroidal delta — d points from neighbour's nearest copy to self.
        vec2 d = pos - op;
        d -= floor(d + 0.5);
        float r2 = dot(d, d);
        if (r2 > P2) continue;

        // Cohesion: accumulate (neighbour_near - self) = -d. Average is the
        // direction to steer toward. This is the only formulation that
        // wraps correctly across the torus seam — the previous code
        // averaged op + d, which collapsed to ~zero unless the neighbour
        // distribution was asymmetric across the wrap.
        cohDelta -= d;
        cohN     += 1;
        alignSum += ov;
        alignN   += 1;

        // Separation: smooth quadratic falloff inside the tight radius.
        if (r2 < S2) {
            float t = 1.0 - r2 / S2;
            float r = sqrt(r2 + 1e-6);
            sepSum += (d / r) * t * t;
        }
    }

    if (cohN > 0) {
        vec2 toward = cohDelta / float(cohN);
        vel += toward * W_COHESION;
    }
    if (alignN > 0) {
        vec2 avgVel = alignSum / float(alignN);
        vel += (avgVel - vel) * W_ALIGN;
    }
    vel += sepSum * W_SEPARATE;

    // ---- Finger attractors. Each touch pulls nearby boids toward it.
    // The pull is local (capped at FINGER_R) and one-directional — fingers
    // affect boids; boids don't affect fingers. Toroidal delta so a finger
    // near the edge pulls boids on the other side of the wrap.
    const float FINGER_R   = 0.18;
    const float W_FINGER   = 0.085;
    for (int i = 0; i < 8; i++) {
        if (i >= u_touch_count) break;
        vec4 t = u_touches[i];
        if (t.w < 0.5) continue;
        vec2 fp = t.xy / u_resolution;
        vec2 fd = fp - pos;
        fd -= floor(fd + 0.5);
        float fr2 = dot(fd, fd);
        if (fr2 > FINGER_R * FINGER_R) continue;
        float fr      = sqrt(fr2 + 1e-6);
        float falloff = 1.0 - fr / FINGER_R;
        vel += (fd / fr) * falloff * falloff * W_FINGER;
    }

    // Soft inertia damping — keeps changes smooth across frames instead of
    // jumping when forces flip sign.
    vel *= DAMPING;

    // Soft speed clamp: tanh-style saturation rather than a hard cap.
    float speed = length(vel);
    if (speed > 1e-5) {
        float softMax = MAX_SPEED * tanh(speed / MAX_SPEED);
        vel *= softMax / speed;
    }
    if (speed < MIN_SPEED && speed > 1e-5) vel *= MIN_SPEED / speed;
    if (speed < 1e-5) {
        vec2 k = hash22(vec2(fi, u_time * 1.3)) - 0.5;
        vel = normalize(k + 1e-3) * MIN_SPEED;
    }

    pos += vel * DT;
    pos  = fract(pos);   // torus wrap

    fragColor = vec4(pos, vel);
}
