// ABOUTME: Display pass — renders 1000 pointy-triangle boids on a near-black ground.
// ABOUTME: Reads u_bins for a 32x32 spatial-hash lookup; only checks ~9 cells per pixel.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform sampler2D u_boids;
uniform sampler2D u_bins;

uniform vec4 u_touches[8];
uniform int  u_touch_count;

#include "math.glsl"
#include "tonemap.glsl"

out vec4 fragColor;

const int   GRID     = 32;       // boids texture grid
const int   BIN_GRID = 32;       // bins texture grid (must match bins.frag)

const float TRI_LEN  = 0.0036;
const float TRI_BACK = 0.0015;
const float TRI_HW   = 0.00126;
const float AA       = 0.00054;

float sdPointyTri(vec2 p) {
    vec2  e_up = vec2(TRI_LEN + TRI_BACK, -TRI_HW);
    vec2  n_up = normalize(vec2(-e_up.y, e_up.x));
    float d_up = dot(p - vec2(TRI_LEN, 0.0), n_up);

    vec2  e_dn = vec2(TRI_LEN + TRI_BACK,  TRI_HW);
    vec2  n_dn = normalize(vec2( e_dn.y, -e_dn.x));
    float d_dn = dot(p - vec2(TRI_LEN, 0.0), n_dn);

    float d_rear = -(p.x + TRI_BACK);
    return max(max(d_up, d_dn), d_rear);
}

// Render one boid into accumulated `col`. Pulled out so the inner cell loops
// stay tight.
void renderBoid(int id, vec2 uv, float aspect, vec3 bodyCol, vec3 tipCol,
                inout vec3 col) {
    ivec2 bc = ivec2(id % GRID, id / GRID);
    vec4  b  = texelFetch(u_boids, bc, 0);
    vec2  bp = b.xy;
    vec2  bv = b.zw;

    vec2 d = uv - bp;
    d -= floor(d + 0.5);
    d *= vec2(aspect, 1.0);

    float r2 = dot(d, d);
    if (r2 > (TRI_LEN + AA) * (TRI_LEN + AA)) return;

    float speed = length(bv);
    if (speed < 1e-5) return;
    vec2 fwd  = bv / speed;
    vec2 side = vec2(-fwd.y, fwd.x);
    vec2 lp   = vec2(dot(d, fwd), dot(d, side));

    float sd   = sdPointyTri(lp);
    float fill = smoothstep(AA, -AA, sd);
    if (fill <= 0.0) return;

    float tip = smoothstep(0.0, TRI_LEN, lp.x);
    col += mix(bodyCol, tipCol, tip) * fill;
}

void main() {
    vec2  uv     = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;

    vec3 col = vec3(0.04, 0.025, 0.02);

    float drift   = 0.08 * sin(u_time * 0.07);
    vec3  bodyCol = vec3(1.00, 0.78, 0.40) * (1.0 + drift);
    vec3  tipCol  = vec3(1.00, 0.95, 0.78);

    // Which bin cell does this pixel fall into?
    ivec2 myCell = ivec2(uv * float(BIN_GRID));

    // Walk the 3x3 neighbourhood with toroidal wrap so flocks crossing the
    // edge still draw correctly. Each cell's texel holds up to 4 boid IDs
    // packed in rgba — sentinel −1 = empty slot.
    for (int dy = -1; dy <= 1; dy++) {
        for (int dx = -1; dx <= 1; dx++) {
            ivec2 cell = ivec2(
                (myCell.x + dx + BIN_GRID) % BIN_GRID,
                (myCell.y + dy + BIN_GRID) % BIN_GRID
            );
            vec4 ids = texelFetch(u_bins, cell, 0);
            for (int s = 0; s < 4; s++) {
                float idF = ids[s];
                if (idF < 0.0) continue;
                renderBoid(int(idF + 0.5), uv, aspect, bodyCol, tipCol, col);
            }
        }
    }

    // ---- Finger glyphs. A faint ring at every active touch — same hue as
    // the boids so it reads as part of the swarm's UI rather than a HUD.
    for (int i = 0; i < 8; i++) {
        if (i >= u_touch_count) break;
        vec4 t = u_touches[i];
        if (t.w < 0.5) continue;
        vec2 fp = t.xy / u_resolution;
        vec2 fd = uv - fp;
        fd -= floor(fd + 0.5);
        fd *= vec2(aspect, 1.0);
        float r = length(fd);
        // Outer ring marks the influence radius (FINGER_R = 0.18 in sim
        // uv; aspect-corrected here to roughly match what the user sees).
        float ring = exp(-pow((r - 0.024) / 0.0028, 2.0));
        float core = exp(-r * r / (0.008 * 0.008));
        col += tipCol * (ring * 0.55 + core * 0.9);
    }

    col = reinhardPartial(col, 4.0);
    col = pow(max(col, 0.0), vec3(0.92));
    fragColor = vec4(col, 1.0);
}
