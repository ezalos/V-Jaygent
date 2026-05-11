// ABOUTME: Plasma-lamp discharge field — N branching filaments radiate from a
// ABOUTME: central electrode through polar-warped noise. Strobe flicker, dark
// ABOUTME: violet ambient, magenta core / cyan-white tips. Self-plays.
#version 300 es
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;

out vec4 fragColor;

#define TAU 6.28318530718
#define N_ARCS 7.0

// Cheap hash for per-fragment flicker grain — plasma lamps strobe at line
// frequency, individual filaments crackle stochastically on top.
float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
           / min(u_resolution.x, u_resolution.y);
    p *= 2.0;                                  // p in roughly [-aspect, aspect] x [-1, 1]

    float r = length(p);
    float a = atan(p.y, p.x);

    // Stepped time — AC arc discharge looks stepped, not smooth. 28Hz
    // matches a 60Hz mains rectified ×2 plus harmonic jitter; fast enough
    // to read as "alive electricity", slow enough to actually see.
    float tStep = floor(u_time * 28.0) / 28.0;
    float tCont = u_time;

    // Polar-domain angular warp. Multi-octave so filaments forking and
    // branching falls out naturally. The inner sin terms make the
    // filament path jitter both with radius (along-arc wobble) and angle
    // (cross-arc fork). Higher amplitudes = more chaos.
    float a_warp = a;
    a_warp += sin(r * 4.5 + tCont * 1.7
                + sin(a * 3.0 + tStep * 4.0) * 1.4) * 0.55;
    a_warp += sin(r * 9.0 + tCont * 2.3
                + sin(a * 5.0 + tStep * 6.7) * 1.8) * 0.30;
    a_warp += sin(r * 17.0 + tCont * 3.1
                + sin(a * 7.0 + tStep * 9.1) * 2.0) * 0.16;
    a_warp += sin(r * 31.0 - tCont * 4.7) * 0.08;

    // Quantize warped angle to N filament slots. Distance to nearest slot
    // boundary = how close this fragment is to a filament centerline.
    float aSlot = a_warp * (N_ARCS / TAU);
    float dSlot = abs(fract(aSlot) - 0.5) * (TAU / N_ARCS);

    // Per-filament stochastic flicker — pick a random brightness per
    // (filament-index, time-step). This makes individual arcs blink
    // independently rather than the whole field flashing in unison.
    float arcId = floor(aSlot);
    float flicker = 0.35 + 0.85 * hash21(vec2(arcId, floor(tStep * 47.0)));

    // Glow profile: tight angular falloff, smooth radial fade so
    // filaments thin out toward the glass. The exp(-d * 38.0) gives a
    // hot core with a soft halo.
    float radialFade = smoothstep(1.6, 0.05, r);
    float arc = exp(-dSlot * 38.0) * radialFade * flicker;

    // Per-fragment crackle — fine grain noise on top so arcs look like
    // real ionised gas, not a clean line.
    float crackle = hash21(gl_FragCoord.xy + tStep * 200.0);
    arc *= 0.75 + 0.5 * crackle;

    // Central electrode — bright nucleus where all filaments originate.
    // Inner spike + outer halo; the spike pulses at line frequency.
    float pulse   = 0.85 + 0.15 * sin(u_time * 18.0);
    float nucleus = exp(-r * 16.0) * 1.6 * pulse
                  + exp(-r * 5.0)  * 0.30;

    // Plasma-lamp palette: deep cool violet ambient (the inert-gas tint
    // before discharge), magenta along arc bodies, cyan-white at hot
    // peaks (where ionisation is densest).
    vec3 ambient = vec3(0.025, 0.010, 0.055);
    vec3 body    = vec3(0.95, 0.30, 1.00);          // magenta filament
    vec3 tip     = vec3(0.70, 0.90, 1.00);          // cyan-white peak
    vec3 core    = vec3(1.00, 0.70, 1.00);          // electrode

    vec3 col = ambient;
    col += body * arc * 0.85;
    col += tip  * pow(arc, 3.0) * 1.20;
    col += core * nucleus;

    // Subtle bloom-ish boost on bright fragments — the strongest arcs
    // bleed into surrounding pixels because real plasma is bright
    // enough to saturate the eye locally.
    col += vec3(0.55, 0.30, 0.70) * smoothstep(0.55, 1.6, arc) * 0.55;

    // Vignette + house gamma per VISION.md.
    vec2 pv = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
            / min(u_resolution.x, u_resolution.y);
    col *= 1.0 - 0.45 * dot(pv, pv);

    fragColor = vec4(pow(max(col, 0.0), vec3(0.88)), 1.0);
}
