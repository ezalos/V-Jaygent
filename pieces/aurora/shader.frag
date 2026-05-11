// ABOUTME: Aurora display pass — reads dye density from sim, shapes it into
// ABOUTME: warm ribbon contours with rim highlights from the density gradient.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec2      u_mouse;
uniform sampler2D u_state;

#include "palette.glsl"
#include "tonemap.glsl"
#include "noise.glsl"
#include "interaction.glsl"

out vec4 fragColor;

// Dusk-sky substrate: warm gradient from deep wine at the bottom up to
// dusty amber at the top. Painted ALWAYS so frame is never empty.
vec3 duskSky(vec2 uv) {
    // uv.y in [0,1]; 0 = bottom (warm-dark), 1 = top (slightly brighter dusk).
    vec3 horizon = vec3(0.090, 0.030, 0.045);   // deep wine
    vec3 zenith  = vec3(0.200, 0.090, 0.080);   // dusty rust
    float t = smoothstep(0.0, 1.0, uv.y);
    vec3 base = mix(horizon, zenith, t);
    // Subtle low-freq variation so the sky isn't a flat gradient.
    base *= 0.85 + 0.30 * vnoise(uv * 1.7 + vec2(0.03 * u_time, 0.0));
    return base;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    // Sample density at sim-native step so gradient reads correctly.
    vec2 simTexel = 1.0 / vec2(textureSize(u_state, 0));
    float rho = texture(u_state, uv).r;

    // Ribbon contour shaping: density in [0, ~0.30] after the lowered source
    // amplitude. Narrow smoothstep so ribbons read as DISTINCT filaments
    // against dusk-sky rather than as a marbled fog filling the frame.
    float ribbon = smoothstep(0.09, 0.24, rho);

    // Density gradient (Sobel-ish) — ribbon edges catch a warm rim.
    float gx = texture(u_state, uv + vec2(simTexel.x, 0.0)).r
             - texture(u_state, uv - vec2(simTexel.x, 0.0)).r;
    float gy = texture(u_state, uv + vec2(0.0, simTexel.y)).r
             - texture(u_state, uv - vec2(0.0, simTexel.y)).r;
    float grad = length(vec2(gx, gy));
    float rim  = smoothstep(0.010, 0.060, grad);

    // ---- compose ----
    // Substrate dusk sky always visible.
    vec3 col = duskSky(uv);

    // Ribbon body: warmCycle keyed on a slow drift + density. Constrain hue
    // to the GOLD→EMBER band (0.0..0.4 in cycle space) by oscillating in
    // a narrow range. warmCycle stops: 0=gold, 0.2=amber, 0.4=ember,
    // 0.6=wine, 0.8=mauve. Staying ≤0.4 keeps the piece bright-warm.
    float rawHue = 0.06 * u_time + 0.30 * rho + 0.10 * vnoise(uv * 2.0);
    float hue    = 0.20 + 0.18 * sin(rawHue * 6.2831);  // oscillates in [0.02, 0.38]
    vec3  bodyC = warmCycle(hue);
    col = mix(col, bodyC, ribbon * 0.92);

    // Rim highlight along the gradient: brighter warm-amber, like the
    // bright edge of a real aurora ribbon. Gentler weight so it pops on
    // the ribbon edges without dominating the body. Hue shifted toward
    // gold so the brightest band is amber-gold, not pink.
    vec3 rimC = warmCycle(0.05) * 1.30;  // close to pure gold
    col += rimC * rim * ribbon * 0.35;

    // Cursor mark — faint cool-warm vignette where the user is dragging so
    // the swirl effect is visually anchored (not the dominant brightness).
    if (!vjMouseIdle(u_mouse)) {
        vec2 mw = vjMouseWorld(u_mouse, u_resolution);
        vec2 wp = (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0) * 2.0;
        float heat = vjCursorHeat(wp, mw, 0.10);
        col += warmCycle(0.0) * heat * 0.18;
    }

    // Subtle vignette — keeps eye on the centre.
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    col *= 1.0 - 0.22 * dot(p, p);

    col = reinhard(col);
    fragColor = vec4(pow(max(col, 0.0), vec3(0.92)), 1.0);
}
