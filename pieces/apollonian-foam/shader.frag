// ABOUTME: Apollonian Foam — ray-marched recursive sphere-inversion fractal,
// ABOUTME: shaded with orbit-trap bands through a single warm-spectrum palette.
#version 300 es
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;

out vec4 fragColor;

const int   FRACTAL_STEPS = 6;
const int   MARCH_STEPS   = 48;
const float HIT_EPS       = 0.0025;
const float FAR           = 10.0;

// Returns .x = signed distance, .y = log2(accumulated scale), .z = orbit trap.
vec3 apollonian(vec3 p) {
    float s    = 1.0;
    float t    = 1.10 + 0.06 * sin(u_time * 0.08);
    float trap = 1e20;
    for (int i = 0; i < FRACTAL_STEPS; i++) {
        p        = -1.0 + 2.0 * fract(0.5 * p + 0.5);
        float r2 = dot(p, p);
        trap     = min(trap, r2);
        float k  = t / r2;
        p       *= k;
        s       *= k;
    }
    return vec3(0.25 * abs(p.y) / s, log2(s), trap);
}

float dist(vec3 p) { return apollonian(p).x; }

vec3 calcNormal(vec3 p) {
    const vec2 e = vec2(0.0009, 0.0);
    return normalize(vec3(
        dist(p + e.xyy) - dist(p - e.xyy),
        dist(p + e.yxy) - dist(p - e.yxy),
        dist(p + e.yyx) - dist(p - e.yyx)
    ));
}

// Cohesive warm palette — cream / amber / ember / wine / near-black violet.
// Anchors interpolate through analogous hues so bands shift mostly in luminance.
vec3 warmPalette(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.030, 0.015, 0.035);   // near-black warm violet
    vec3 c1 = vec3(0.32,  0.07,  0.12);    // wine
    vec3 c2 = vec3(0.85,  0.32,  0.18);    // ember orange
    vec3 c3 = vec3(1.00,  0.75,  0.48);    // warm cream
    // Three-segment smooth interpolation.
    vec3 a = mix(c0, c1, smoothstep(0.00, 0.35, t));
    vec3 b = mix(c1, c2, smoothstep(0.25, 0.70, t));
    vec3 c = mix(c2, c3, smoothstep(0.55, 1.00, t));
    return mix(mix(a, b, smoothstep(0.2, 0.5, t)),
               c,              smoothstep(0.5, 0.9, t));
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

    // Camera — stays high enough to avoid drifting into the fractal body, and
    // far enough out that the orbit skirts the dense core rather than piercing
    // neighboring cells.
    float tc = u_time * 0.07;
    vec3  ro = vec3(3.2 * cos(tc),
                    1.70 + 0.15 * sin(tc * 0.5),
                    3.2 * sin(tc));
    vec3  ta = vec3(0.0, 0.20, 0.0);

    vec3  cw = normalize(ta - ro);
    vec3  cu = normalize(cross(cw, vec3(0.0, 1.0, 0.0)));
    vec3  cv = cross(cu, cw);
    vec3  rd = normalize(uv.x * cu + uv.y * cv + 1.6 * cw);

    // March.
    float td = 0.0;
    bool  hit = false;
    for (int i = 0; i < MARCH_STEPS; i++) {
        vec3 p  = ro + td * rd;
        float d = dist(p);
        if (d < HIT_EPS * max(td, 1.0)) { hit = true; break; }
        if (td > FAR) break;
        td += d * 0.88;
    }

    vec3 col;
    if (hit) {
        vec3 p    = ro + td * rd;
        vec3 n    = calcNormal(p);
        vec3 aux  = apollonian(p);
        float trap = aux.z;
        float logS = aux.y;

        // Single palette value drives both base and core glow — same hue
        // family throughout, bands differ by luminance not chroma.
        float band = smoothstep(0.02, 0.38, trap) * 0.75
                   + fract(logS * 0.16 + u_time * 0.03) * 0.25;
        vec3  base = warmPalette(band);

        // Two-light shading.
        vec3  key   = normalize(vec3( 0.50,  0.75,  0.45));
        vec3  rim   = normalize(vec3(-0.35,  0.10, -0.85));
        float diff  = max(dot(n, key), 0.0);
        float back  = max(dot(n, rim), 0.0);
        float fres  = pow(1.0 - max(dot(n, -rd), 0.0), 2.6);

        col  = base * (0.18 + 1.00 * diff);
        // Rim kept warm so it doesn't introduce a cool accent.
        col += vec3(1.00, 0.55, 0.35) * 0.22 * back;
        // Fresnel picks up the palette's bright end for coherent edge light.
        col += warmPalette(min(band + 0.20, 1.0)) * 0.55 * fres;

        // Tightest recursion cores glow in the same palette.
        float coreGlow = exp(-9.0 * trap);
        col += warmPalette(min(band + 0.30, 1.0)) * coreGlow * 0.35;
    } else {
        col = vec3(0.008, 0.006, 0.020);
    }

    // Warm-to-dark fog, subtle vignette, gentle gamma.
    col  = mix(col, vec3(0.010, 0.008, 0.022), smoothstep(3.5, FAR, td));
    col *= 1.0 - 0.30 * dot(uv, uv);

    fragColor = vec4(pow(max(col, 0.0), vec3(0.82)), 1.0);
}
