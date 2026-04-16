// ABOUTME: Lodestone — two opposite-polarity poles orbit a cubic complex field;
// ABOUTME: cursor drags a third pole (x) and zooms the view (y). Click-free instrument.
#version 300 es
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;

#include "math.glsl"
#include "tonemap.glsl"

out vec4 fragColor;

const float DURATION = 15.0;

// Warm cyclic palette — gold → orange → ember → wine → mauve → gold.
// Driven by arg(f), so neighbouring phase bands get neighbouring warm hues.
vec3 warmCycle(float t) {
    t = fract(t);
    vec3 c0 = vec3(1.00, 0.82, 0.52);
    vec3 c1 = vec3(1.00, 0.58, 0.32);
    vec3 c2 = vec3(0.86, 0.27, 0.24);
    vec3 c3 = vec3(0.56, 0.18, 0.40);
    vec3 c4 = vec3(0.40, 0.22, 0.48);
    if (t < 0.20) return mix(c0, c1,  t         * 5.0);
    if (t < 0.40) return mix(c1, c2, (t - 0.20) * 5.0);
    if (t < 0.60) return mix(c2, c3, (t - 0.40) * 5.0);
    if (t < 0.80) return mix(c3, c4, (t - 0.60) * 5.0);
    return                mix(c4, c0, (t - 0.80) * 5.0);
}

// Separation r(s) between the two lodestones over the 15-second arc.
// 1.00 at s=0 → 0.14 at perihelion (s=0.65) → 0.55 at s=1. Composed:
// approach, collide, slingshot, settle wider than they started.
float sepCurve(float s) {
    float a = smoothstep(0.00, 0.65, s);
    float b = smoothstep(0.65, 1.00, s);
    return s < 0.65 ? mix(1.00, 0.14, a) : mix(0.14, 0.55, b);
}

// Monotone orbital angle. Base rate + extra rotation concentrated through
// the perihelion window — Keplerian: sweep fastest when closest.
float angleCurve(float s) {
    float fast = smoothstep(0.40, 0.90, s);
    return TAU * 0.9 * s + TAU * 1.1 * fast;
}

void main() {
    // Cursor mapping. u_mouse is pixels, origin bottom-left; sentinel (0,0)
    // means "never moved". mN is normalised to the screen, zoom and drag are
    // decoupled: vertical axis = exponential zoom, horizontal = drag the
    // third pole. Idle → zoom 1 and p₃ wanders on its own. Two independent
    // axes of real control, per the studio-as-instrument policy.
    bool mouseIdle = (u_mouse.x == 0.0 && u_mouse.y == 0.0);
    vec2 mN   = u_mouse / u_resolution;                        // [0,1]²
    float zoom = mouseIdle ? 1.0 : exp((0.5 - mN.y) * 1.2);    // ~[0.55, 1.82]

    // World space — y up, canvas-centred, aspect-safe, scaled by 1/zoom so
    // pulling the cursor toward the bottom of the frame dives into the
    // contour detail near the poles.
    float worldScale = 2.2 / zoom;
    vec2 z = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
           / min(u_resolution.x, u_resolution.y) * worldScale;

    float s   = clamp(u_time / DURATION, 0.0, 1.0);
    float r   = sepCurve(s);
    float phi = angleCurve(s);

    // The two lodestones straddle a slowly-drifting centre of mass so the
    // pair wanders across the frame rather than pinning to origin.
    vec2 com = 0.35 * vec2(cos(u_time * 0.18), sin(u_time * 0.22));
    vec2 dir = vec2(cos(phi), sin(phi));
    vec2 p1  = com + 0.5 * r * dir;
    vec2 p2  = com - 0.5 * r * dir;

    // Small incommensurate wobble on each pole — keeps visible change
    // between 1-second frames even during the slow approach. Amplitude
    // stays well below r so the orbital shape still reads.
    p1 += 0.035 * vec2(sin(u_time * 2.10), cos(u_time * 1.73));
    p2 += 0.035 * vec2(cos(u_time * 2.29), sin(u_time * 1.91));

    // Third pole p₃. When the cursor is active, the viewer drags it
    // horizontally (mouse.x → world-x); the vertical coordinate keeps
    // wandering on its own so the drag axis is independent of the zoom
    // axis. Charge bumped to 0.18 so its pull is visibly felt on the
    // phase field — a real instrument, not a garnish.
    float p3y_auto = 0.55 * sin(u_time * 0.33);
    float p3x_auto = mix(1.55, -0.55, s);
    float p3x_drag = (mN.x - 0.5) * 2.0 * worldScale * 0.45;    // ~[-0.5,0.5] × scale
    vec2  p3 = mouseIdle
             ? vec2(p3x_auto, p3y_auto)
             : vec2(p3x_drag, p3y_auto);
    float q3 = 0.18;

    // f(z) = z³ + a(t)·z + q/(z−p₁) − q/(z−p₂) + q₃/(z−p₃)
    // The cubic plants three rotating zeros at |z| ≈ √|a|. The dipole
    // creates a stagnation point between p₁ and p₂ where |f|→0 at
    // closest approach, which we harvest for the perihelion flash.
    float ta  = u_time * 0.32;
    vec2  a   = 0.55 * vec2(cos(ta), sin(ta));
    vec2  zz  = cmul(z, z);
    vec2  zzz = cmul(zz, z);

    float q   = 0.32;
    vec2  d1  = z - p1; float r1_2 = dot(d1, d1) + 1e-5;
    vec2  d2  = z - p2; float r2_2 = dot(d2, d2) + 1e-5;
    vec2  d3  = z - p3; float r3_2 = dot(d3, d3) + 1e-5;
    vec2  residues = q  * d1 / r1_2
                   - q  * d2 / r2_2
                   + q3 * d3 / r3_2;

    vec2  f     = zzz + cmul(a, z) + residues;
    float phase = atan(f.y, f.x);
    float mag   = length(f);

    // Phase → warm cycle with a steady hue creep so the banding never
    // settles into a static rosette.
    float hue = phase / TAU + 0.5 + 0.045 * u_time;
    vec3  col = warmCycle(hue);

    // Two scales of log-magnitude contour — the subtlety is what to plot.
    // Raw log|f| is dominated by the cubic's |z|³ far-field growth, which
    // paints perfect concentric circles centred on origin and drowns the
    // actual phase structure. Subtract 3·log|z+ε| to cancel the cubic
    // base so bands appear only where the residues, linear term, and
    // dipole structure actually deviate from z³. That's the honest
    // contour map of the dance.
    float lExcess = log(mag + 1e-4) - 3.0 * log(length(z) + 0.30);
    float fineFreq = mix(2.4, 4.6, smoothstep(1.0, 1.8, zoom));
    float coarse   = smoothstep(0.10, 0.00, abs(fract(lExcess * 1.6)      - 0.5));
    float fine     = smoothstep(0.06, 0.00, abs(fract(lExcess * fineFreq) - 0.5));
    col *= mix(1.0, 0.50, coarse * 0.70);
    col *= mix(1.0, 0.75, fine   * 0.55);

    // Each lodestone wears a fixed-hue halo — the + pole gold, the − pole
    // ember — so the dipole reads as a dipole rather than two identical
    // lights. Both halos bloom at perihelion when r1_2, r2_2 collapse.
    vec3  goldHalo  = vec3(1.00, 0.82, 0.45);
    vec3  emberHalo = vec3(0.95, 0.34, 0.22);
    vec3  amberHalo = vec3(1.00, 0.68, 0.30);
    float h1 = exp(-30.0 * r1_2) * 0.55 + exp(-150.0 * r1_2) * 1.2;
    float h2 = exp(-30.0 * r2_2) * 0.55 + exp(-150.0 * r2_2) * 1.2;
    float h3 = exp(-45.0 * r3_2) * 0.28 + exp(-220.0 * r3_2) * 0.55;
    col += goldHalo  * h1 * 0.55;
    col += emberHalo * h2 * 0.55;
    col += amberHalo * h3 * 0.35;

    // Perihelion flash. At near-collision the residues nearly cancel and
    // |f| goes small between the poles. Gated on r being close to r_min
    // and the fragment being near com, so the flash registers as an event
    // between the poles — not a continuous glow hiding the arc. Window
    // widened so the flash reads for ~2 seconds rather than a single frame.
    float nearPeri = exp(-12.0 * max(r - 0.18, 0.0));
    float midGlow  = exp(-22.0 * dot(z - com, z - com))
                   + exp(-80.0 * dot(z - com, z - com)) * 0.8;
    col += vec3(1.00, 0.90, 0.62) * nearPeri * midGlow * 2.4;

    // Expanding shockwave — a warm ring radiating outward from com
    // through the recoil window. Engages at perihelion, reaches full
    // radius by s=0.95, fades by end. Reads as "the dance left a wake"
    // without competing with the main dipole.
    float shockT    = smoothstep(0.65, 0.95, s);
    float shockR    = 0.05 + 1.5 * shockT;
    float shockW    = 0.040 + 0.10 * shockT;
    float shockRing = smoothstep(shockW, 0.0, abs(length(z - com) - shockR));
    float shockEnv  = shockT * (1.0 - smoothstep(0.92, 1.00, s));
    col += vec3(1.00, 0.75, 0.40) * shockRing * shockEnv * 1.0;

    // Brightness envelope — genuinely quiet at the start, peaks at
    // perihelion, settles dimmer than the middle. Silence as form.
    float envApproach = smoothstep(0.00, 0.55, s);         // 0 → 1
    float envRelease  = smoothstep(0.65, 1.00, s);         // 0 → 1 after peri
    float env = mix(0.28, 1.00, envApproach)
              * mix(1.00, 0.55, envRelease);
    col *= env;

    // Soft composition vignette — pulls attention toward the dance
    // without hard-framing.
    float vg = 1.0 - 0.42 * dot(z, z) * 0.25;
    col *= clamp(vg, 0.35, 1.0);

    // Reinhard with a whitepoint so peaks roll off to warm cream
    // instead of clipping, and midtones keep their punch.
    col = reinhardPartial(col, 3.5);

    fragColor = vec4(pow(max(col, 0.0), vec3(0.90)), 1.0);
}
