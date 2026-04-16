// ABOUTME: Lodestone — a complex-plane phase field whose structure bends toward
// ABOUTME: the cursor. Cursor is a movable pole in the rational function plotted.
#version 300 es
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;

out vec4 fragColor;

const float PI  = 3.14159265359;
const float TAU = 6.28318530718;

// Complex multiplication (a+bi)·(c+di) = (ac-bd) + (ad+bc)i.
vec2 cmul(vec2 a, vec2 b) {
    return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

// Cohesive warm-only cyclic palette — gold → orange → red → wine → mauve → gold.
vec3 warmCycle(float t) {
    t = fract(t);
    vec3 c0 = vec3(1.00, 0.80, 0.50);
    vec3 c1 = vec3(1.00, 0.55, 0.30);
    vec3 c2 = vec3(0.85, 0.25, 0.25);
    vec3 c3 = vec3(0.55, 0.18, 0.40);
    vec3 c4 = vec3(0.42, 0.22, 0.48);
    if (t < 0.20) return mix(c0, c1, t * 5.0);
    if (t < 0.40) return mix(c1, c2, (t - 0.20) * 5.0);
    if (t < 0.60) return mix(c2, c3, (t - 0.40) * 5.0);
    if (t < 0.80) return mix(c3, c4, (t - 0.60) * 5.0);
    return                mix(c4, c0, (t - 0.80) * 5.0);
}

void main() {
    // Coordinates in world space — origin at canvas center, scale invariant
    // of aspect ratio, y up.
    vec2 z = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y) * 2.2;

    // Cursor mapped into the same world space; u_mouse has origin bottom-left
    // in pixels. If it's at the sentinel (0,0) — never moved — sit it gently
    // off-axis so the piece isn't a static bullseye on load.
    vec2 mpx = u_mouse;
    bool mouseIdle = (mpx.x == 0.0 && mpx.y == 0.0);
    vec2 m = mouseIdle
           ? vec2(0.55 * cos(u_time * 0.12), 0.40 * sin(u_time * 0.17))
           : (mpx - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y) * 2.2;

    // The function being plotted:
    //   f(z) = z³  +  a(t)·z   +   s · (1 / (z - m))
    // A cubic base gives a slow three-fold phase rotation; the movable pole
    // at m(ouse) introduces a singularity whose phase radiates outward. The
    // linear term a(t) slowly rotates so something's always moving.
    float t    = u_time * 0.25;
    vec2  a    = 0.65 * vec2(cos(t), sin(t));
    vec2  zz   = cmul(z, z);
    vec2  zzz  = cmul(zz, z);

    vec2  diff = z - m;
    float r2   = dot(diff, diff) + 1e-4;
    vec2  pole = diff / r2;               // 1 / (z - m), complex inverse
    float poleStrength = 0.35;

    vec2  f    = zzz + cmul(a, z) + poleStrength * pole;

    float phase = atan(f.y, f.x);         // [-π, π]
    float mag   = length(f);

    // Palette by phase + slow hue drift.
    float hue  = phase / TAU + 0.5 + 0.04 * u_time * 0.1;
    vec3  col  = warmCycle(hue);

    // Log-magnitude contours — subtle dark bands where |f| doubles.
    float l    = log(mag + 1e-4);
    float band = fract(l * 1.2);
    float line = smoothstep(0.10, 0.00, abs(band - 0.5));
    col       *= mix(1.0, 0.55, line * 0.8);

    // Gentle brightness falloff with |z| so the frame stays composed.
    float vignette = 1.0 - 0.42 * dot(z, z) * 0.25;
    col *= clamp(vignette, 0.35, 1.0);

    // Bright halo right at the cursor pole — a warm eye drawing you in.
    float halo = exp(-24.0 * r2) * 0.8
               + exp(-90.0 * r2) * 1.2;
    col += warmCycle(hue + 0.15) * halo * 0.45;

    // A soft translucent ring at a fixed radius marks the "lens".
    float ring = smoothstep(0.045, 0.000, abs(length(diff) - 0.22));
    col += vec3(1.00, 0.85, 0.60) * ring * 0.15;

    fragColor = vec4(pow(max(col, 0.0), vec3(0.90)), 1.0);
}
