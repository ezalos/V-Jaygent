// ABOUTME: Plasma-lamp discharge field — N branching filaments radiate from a
// ABOUTME: central electrode through polar-warped noise. Strobe flicker, dark
// ABOUTME: violet ambient, magenta core / cyan-white tips. Self-plays.
#version 300 es
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;

out vec4 fragColor;

#define TAU 6.28318530718
#define N_ARCS 5.0

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

    // Stepped time — AC arc discharge looks stepped, not smooth. 60Hz
    // matches a real Tesla coil's discharge cadence; the eye reads each
    // step as a distinct "zap" rather than smooth animation.
    float tStep = floor(u_time * 60.0) / 60.0;
    float tCont = u_time;

    // Polar-domain angular warp. Five octaves so filaments fork and
    // branch into chaos. The inner sin terms couple radius and angle so
    // a filament's path twists both along its length and laterally.
    // Pushed amplitudes ×1.5 vs. v1 — Louis wanted more chaos.
    float a_warp = a;
    a_warp += sin(r *  4.5 + tCont * 1.7
                + sin(a * 3.0 + tStep * 4.0) * 2.0) * 0.85;
    a_warp += sin(r *  9.0 + tCont * 2.3
                + sin(a * 5.0 + tStep * 6.7) * 2.6) * 0.50;
    a_warp += sin(r * 17.0 + tCont * 3.1
                + sin(a * 7.0 + tStep * 9.1) * 3.0) * 0.30;
    a_warp += sin(r * 31.0 - tCont * 4.7
                + sin(a * 11.0 + tStep * 13.0) * 3.4) * 0.18;

    // Quantize warped angle to N filament slots. Distance to nearest slot
    // boundary = how close this fragment is to a filament centerline.
    float aSlot = a_warp * (N_ARCS / TAU);
    float dSlot = abs(fract(aSlot) - 0.5) * (TAU / N_ARCS);

    // Per-filament stochastic flicker — pick a random brightness per
    // (filament-index, time-step). Fast hash step rate so individual
    // arcs blink wildly even within a single visible frame.
    float arcId = floor(aSlot);
    float flicker = 0.30 + 0.95 * hash21(vec2(arcId, floor(tStep * 95.0)));

    // Glow profile: angular falloff thickened ×3 vs first version (38→13)
    // so each filament reads as a fat plasma channel, not a hairline.
    // Radial fade keeps the rim of the bulb dim.
    float radialFade = smoothstep(1.6, 0.05, r);
    float arc = exp(-dSlot * 13.0) * radialFade * flicker;

    // Per-fragment crackle — fine grain noise on top so arcs look like
    // real ionised gas, not a clean line. Higher contrast (0.55..1.45)
    // reads as more frantic crackle, the "real plasma" signature.
    float crackle = hash21(gl_FragCoord.xy + tStep * 200.0);
    arc *= 0.55 + 0.90 * crackle;

    // Central electrode — bright nucleus where all filaments originate.
    // Inner spike + outer halo; the spike pulses at line frequency
    // (32Hz, double-rectified mains feel).
    float pulse   = 0.80 + 0.20 * sin(u_time * 32.0);
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
