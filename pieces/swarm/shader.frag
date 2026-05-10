// ABOUTME: Display pass for swarm — renders 1000 pointy-triangle boids on a near-black
// ABOUTME: ground. Single warm palette, no field, no fingers, no lifespan.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform sampler2D u_boids;

#include "math.glsl"
#include "tonemap.glsl"

out vec4 fragColor;

const int   GRID      = 32;
const int   NUM_BOIDS = 1000;

// Triangle dimensions in aspect-corrected uv. Pointy isoceles — long forward,
// narrow side. Tip at (TRI_LEN, 0); base from (-TRI_BACK, ±TRI_HW).
const float TRI_LEN  = 0.012;
const float TRI_BACK = 0.005;
const float TRI_HW   = 0.0042;
const float AA       = 0.0014;   // anti-alias half-width on the SDF

// Pointy-triangle SDF in local coords. Returns signed distance: <0 inside.
// Cheaper than three sdSegment calls and enough for a small AA edge.
float sdPointyTri(vec2 p) {
    // Three half-planes:
    //  - rear edge: x > -TRI_BACK    →  -(x + TRI_BACK)
    //  - upper edge: line from tip (TRI_LEN, 0) to base (-TRI_BACK, TRI_HW),
    //    interior on negative-y side.
    //  - lower edge: mirror of upper.
    vec2 e_up   = vec2(TRI_LEN + TRI_BACK, -TRI_HW);    // tip - upper-base
    vec2 n_up   = normalize(vec2(-e_up.y, e_up.x));     // outward normal (points +y/+x)
    float d_up  = dot(p - vec2(TRI_LEN, 0.0), n_up);

    vec2 e_dn   = vec2(TRI_LEN + TRI_BACK,  TRI_HW);
    vec2 n_dn   = normalize(vec2( e_dn.y, -e_dn.x));
    float d_dn  = dot(p - vec2(TRI_LEN, 0.0), n_dn);

    float d_rear = -(p.x + TRI_BACK);

    return max(max(d_up, d_dn), d_rear);
}

void main() {
    vec2  uv     = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;

    // Near-black warm ground.
    vec3 col = vec3(0.04, 0.025, 0.02);

    // Two warm tones — body and tip — with a slow global drift so the swarm
    // doesn't feel static between flocking events.
    float drift = 0.08 * sin(u_time * 0.07);
    vec3 bodyCol = vec3(1.00, 0.78, 0.40) * (1.0 + drift);
    vec3 tipCol  = vec3(1.00, 0.95, 0.78);

    for (int i = 0; i < NUM_BOIDS; i++) {
        ivec2 bc = ivec2(i % GRID, i / GRID);
        vec4  b  = texelFetch(u_boids, bc, 0);
        vec2  bp = b.xy;
        vec2  bv = b.zw;

        // Toroidal aspect-corrected delta from this pixel to the boid.
        vec2 d = uv - bp;
        d -= floor(d + 0.5);
        d *= vec2(aspect, 1.0);

        // Skip boids well outside our triangle's bounding circle. Fast cull
        // for the bulk of the loop's iterations.
        float r2 = dot(d, d);
        if (r2 > (TRI_LEN + AA) * (TRI_LEN + AA)) continue;

        // Local frame: x along velocity, y perpendicular.
        float speed = length(bv);
        if (speed < 1e-5) continue;
        vec2 fwd  = bv / speed;
        vec2 side = vec2(-fwd.y, fwd.x);
        vec2 lp   = vec2(dot(d, fwd), dot(d, side));

        // SDF, anti-aliased.
        float sd      = sdPointyTri(lp);
        float fill    = smoothstep(AA, -AA, sd);
        if (fill <= 0.0) continue;

        // Tip glow: brighter near the front of the boid.
        float tip = smoothstep(0.0, TRI_LEN, lp.x);

        col += mix(bodyCol, tipCol, tip) * fill;
    }

    col = reinhardPartial(col, 4.0);
    col = pow(max(col, 0.0), vec3(0.92));
    fragColor = vec4(col, 1.0);
}
