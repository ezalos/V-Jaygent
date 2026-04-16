// ABOUTME: Aperture — a cubic Julia set whose parameter c tracks your cursor.
// ABOUTME: Every mouse position is a different fractal; motion is exploration.
#version 300 es
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;

out vec4 fragColor;

const int   MAX_ITERS  = 80;
const float ESC_R2     = 16.0;  // escape |z|² threshold

// Warm cyclic palette — gold → orange → red → wine → mauve → gold.
vec3 warmCycle(float t) {
    t = fract(t);
    vec3 c0 = vec3(1.00, 0.80, 0.50);
    vec3 c1 = vec3(1.00, 0.55, 0.30);
    vec3 c2 = vec3(0.85, 0.25, 0.25);
    vec3 c3 = vec3(0.55, 0.18, 0.40);
    vec3 c4 = vec3(0.42, 0.22, 0.48);
    if (t < 0.20) return mix(c0, c1,  t          * 5.0);
    if (t < 0.40) return mix(c1, c2, (t - 0.20)  * 5.0);
    if (t < 0.60) return mix(c2, c3, (t - 0.40)  * 5.0);
    if (t < 0.80) return mix(c3, c4, (t - 0.60)  * 5.0);
    return                mix(c4, c0, (t - 0.80) * 5.0);
}

// Complex cube: (a+bi)³ = a(a²−3b²) + i·b(3a²−b²)
vec2 ccube(vec2 z) {
    return vec2(z.x * (z.x*z.x - 3.0*z.y*z.y),
                z.y * (3.0*z.x*z.x -     z.y*z.y));
}

void main() {
    // World space — origin at center, ~±1.5 across the short edge.
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
           / min(u_resolution.x, u_resolution.y) * 3.0;

    // Parameter c — mouse in same world space, dialed into the "interesting"
    // region of the cubic Mandelbrot. If the mouse hasn't moved yet, drift
    // c on a small orbit so the fractal still breathes.
    bool mouseIdle = (u_mouse.x == 0.0 && u_mouse.y == 0.0);
    vec2 mWorld = (u_mouse - 0.5 * u_resolution.xy)
                / min(u_resolution.x, u_resolution.y) * 3.0;
    vec2 c = mouseIdle
           ? vec2(0.52 * cos(u_time * 0.18), 0.52 * sin(u_time * 0.11))
           : mWorld * 0.42;

    // Iterate z_{n+1} = z_n³ + c.
    vec2  z    = p;
    float trap = 1e20;
    int   iterEsc = -1;
    for (int i = 0; i < MAX_ITERS; i++) {
        z    = ccube(z) + c;
        float r2 = dot(z, z);
        trap = min(trap, r2);
        if (r2 > ESC_R2) { iterEsc = i; break; }
    }

    vec3 col;
    if (iterEsc >= 0) {
        // Outside the set — smooth escape-time coloring (works for z^n + c
        // with exponent 3 using log base 3).
        float nu = float(iterEsc)
                 + 1.0 - log2(0.5 * log(dot(z, z))) / log2(3.0);

        float t = nu * 0.045
                + u_time * 0.010;
        col = warmCycle(t);

        // Fine contour at each iteration boundary makes the filaments crisp.
        float band = fract(nu);
        float line = smoothstep(0.12, 0.00, min(band, 1.0 - band));
        col *= mix(1.0, 0.55, line * 0.65);
    } else {
        // Interior — orbit-trap banding, dimmer so the exterior pops.
        float t = log(trap + 1e-4) * 0.18
                + u_time * 0.012
                + 0.60;
        col = warmCycle(t) * 0.50;
        col = mix(col, vec3(0.02, 0.015, 0.03), 0.35);
    }

    // Eye at the cursor — a warm halo so your lens feels present.
    if (!mouseIdle) {
        float d2 = dot(p - mWorld, p - mWorld);
        col += warmCycle(0.06 + u_time * 0.02)
             * (exp(-45.0 * d2) * 0.35 + exp(-220.0 * d2) * 0.60);
    }

    // Subtle vignette + gentle gamma.
    col *= 1.0 - 0.06 * dot(p, p);
    fragColor = vec4(pow(max(col, 0.0), vec3(0.90)), 1.0);
}
