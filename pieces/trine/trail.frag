// ABOUTME: Trail accumulator — long-exposure of 3 bodies, one body per RGB channel,
// ABOUTME: with slow exponential decay. Reads body state, splats Gaussians, fades self.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform sampler2D u_state;   // bodies (3 texels in row 0)
uniform sampler2D u_trail;   // self ping-pong

out vec4 fragColor;

const float DECAY        = 0.982;       // ~half-life 38 frames (~0.6s) — keeps the
                                        // canvas legible over a long session; trails
                                        // fade before the field saturates into noise.
const float SPLAT_SIGMA  = 0.0035;
const float SPLAT_SIGMA2 = SPLAT_SIGMA * SPLAT_SIGMA;
const int   SUBSPLATS    = 6;           // mini-splats along recent velocity, gives
                                        // continuous lines instead of discrete dots

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;

    vec4 trail = texture(u_trail, uv) * DECAY;

    // One channel per body. Aspect-correct the splat radius so the dots
    // are circular on screen, not stretched.
    float aspect = u_resolution.x / u_resolution.y;

    // Walk SUBSPLATS sub-positions along the recent motion vector and add
    // a fractional Gaussian at each — continuous lines instead of dots
    // when the body moves faster than its splat radius per frame. The
    // step size matches the bodies pass: DT * iterations(2). This keeps
    // the trail in sync with the actual integration.
    const float TRAIL_LOOKBACK = 0.004 * 2.0;   // matches sim DT * iterations
    const float INV_SUBS       = 1.0 / float(SUBSPLATS);

    for (int i = 0; i < 3; i++) {
        vec4 body = texelFetch(u_state, ivec2(i, 0), 0);
        vec2 bp   = body.xy;
        vec2 bv   = body.zw;

        float accum = 0.0;
        for (int k = 0; k < SUBSPLATS; k++) {
            float t  = float(k) * INV_SUBS;
            vec2  sp = bp - bv * TRAIL_LOOKBACK * t;
            vec2  d  = uv - sp;
            d -= floor(d + 0.5);
            d *= vec2(aspect, 1.0);
            accum += exp(-dot(d, d) / SPLAT_SIGMA2);
        }
        accum *= INV_SUBS;

        if      (i == 0) trail.r += accum;
        else if (i == 1) trail.g += accum;
        else             trail.b += accum;
    }

    trail.a = max(trail.r, max(trail.g, trail.b));
    fragColor = trail;
}
