// ABOUTME: Display for the levitating ferrofluid sphere — sphere SDF extended
// ABOUTME: by the displacement field, sphere normals + bumps, dark warm void behind.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec4      u_touches[8];
uniform int       u_touch_count;
uniform sampler2D u_state;

#include "tonemap.glsl"

out vec4 fragColor;

const float R_BALL = 0.064;    // small core — spikes radiate several R_BALL outward
const float DISP   = 0.32;     // h → outward displacement scale (big — small ball,
                               // dramatic spikes; total reach R_BALL + DISP*h_max ≈ 0.40)

// Background — dark warm void with a subtle vertical gradient. The
// levitating ball floats in front of this, dark on dark, distinguishable
// only by its rim highlights and surface lighting. Reads as "midnight
// chamber, magnet-trap glow."
vec3 voidBg(vec2 uv) {
    vec3 top    = vec3(0.020, 0.008, 0.022);
    vec3 bottom = vec3(0.080, 0.030, 0.050);
    return mix(bottom, top, uv.y);
}

// Ferrofluid surface tone — near-black ink with a deep wine sheen on lit
// faces. ALL brightness above this comes from specular and rim highlights.
vec3 ferrofluidColor(float lit) {
    vec3 ink   = vec3(0.018, 0.010, 0.024);
    vec3 sheen = vec3(0.165, 0.060, 0.045);
    return mix(ink, sheen, lit);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 simTexel = 1.0 / vec2(textureSize(u_state, 0));
    float aspect = u_resolution.x / u_resolution.y;
    vec2  p      = (uv - 0.5) * vec2(aspect, 1.0);
    float r      = length(p);

    vec4  st = texture(u_state, uv);
    float h  = st.r;

    // ---- background --------------------------------------------------
    vec3 col = voidBg(uv);

    // ---- effective sphere radius at this angular position ------------
    // The displacement field h extends the silhouette outward where
    // magnets are pulling. Inside r < R_eff: ferrofluid sphere (with
    // possibly extended silhouette). Outside: void.
    float R_eff = R_BALL + max(h, 0.0) * DISP;
    float dist  = r - R_eff;

    // Smooth boundary so the silhouette has anti-aliased pixels.
    float inBall = smoothstep(0.005, -0.005, dist);

    if (inBall > 0.001) {
        // ---- 3D sphere normal --------------------------------------
        // Treat the visible disc as a sphere of radius R_eff. At pixel
        // p, the surface normal points outward from the sphere center.
        // For r close to R_eff (rim), the normal is nearly horizontal;
        // at the centre, it points straight at the camera.
        float r_norm = clamp(r / R_eff, 0.0, 1.0);
        float z      = sqrt(max(0.0, 1.0 - r_norm * r_norm));
        vec3  sphereN = normalize(vec3(p / R_eff, z));

        // ---- surface bumps from h gradient -------------------------
        // The displacement field has spatial structure (hex spikes
        // under each magnet). Project the gradient of h into the
        // tangent plane of the sphere, perturb the normal so spike
        // crests catch specular highlights and shadow troughs cleanly.
        float hx = texture(u_state, uv + vec2(simTexel.x, 0.0)).r
                 - texture(u_state, uv - vec2(simTexel.x, 0.0)).r;
        float hy = texture(u_state, uv + vec2(0.0, simTexel.y)).r
                 - texture(u_state, uv - vec2(0.0, simTexel.y)).r;
        vec3 bump = vec3(-hx, -hy, 0.0) * 60.0;
        vec3 N    = normalize(sphereN + bump);

        // ---- lighting ----------------------------------------------
        // Warm key from upper-left; cooler-warm fill from below; ambient
        // lifts the dark side just enough to read as a sphere.
        vec3  L     = normalize(vec3(-0.45, 0.62, 0.55));
        vec3  Fdir  = normalize(vec3( 0.30,-0.45, 0.30));
        float kKey  = max(dot(N, L), 0.0);
        float kFill = max(dot(N, Fdir), 0.0) * 0.32;
        float kAmb  = 0.16;
        float lit   = clamp(0.55 * kKey + kFill + kAmb, 0.0, 1.0);

        vec3 fluid = ferrofluidColor(lit);

        // Specular crown — tight Phong on spike crests for the
        // metallic-mirror sheen that says "ferrofluid". Gated by spike
        // height so the smooth body doesn't sparkle.
        vec3  R     = reflect(-L, N);
        float specL = pow(max(R.z, 0.0), 30.0);
        float specG = smoothstep(0.20, 0.90, h);
        fluid      += vec3(1.00, 0.85, 0.55) * specL * specG * 1.20;

        // Gradient rim — bright thin band along steep slopes (the wet
        // edge of each spike cone).
        float gradMag = length(vec2(hx, hy));
        float spikeRim = smoothstep(0.025, 0.080, gradMag);
        fluid         += vec3(1.00, 0.62, 0.28) * spikeRim * 0.55;

        col = mix(col, fluid, inBall);

        // Silhouette wet rim — thin warm band right at the boundary
        // where the sphere meets the void. Reads as the "edge of the
        // levitating drop."
        float silhouette = smoothstep(-0.012, -0.001, dist) *
                           smoothstep( 0.005, -0.001, dist);
        col += vec3(1.00, 0.55, 0.22) * silhouette * 0.70;
    }

    // ---- per-finger pinpoint glow (tactile feedback) ----------------
    // Tiny bright dot under each active finger so a phone user sees
    // their touch was registered. Fades fast.
    for (int i = 0; i < 8; i++) {
        if (i >= u_touch_count) break;
        vec4 t = u_touches[i];
        if (t.w < 0.5) continue;
        vec2  tN     = t.xy / u_resolution.xy;
        vec2  tWorld = (tN - 0.5) * vec2(aspect, 1.0);
        float rd     = length(p - tWorld);
        float pin    = exp(-rd * 65.0) * exp(-t.z * 4.0);
        col += vec3(1.00, 0.78, 0.42) * pin * 0.75;
    }

    col = reinhard(col);

    // Subtle vignette + house gamma per VISION.md.
    vec2 pv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    col   *= 1.0 - 0.20 * dot(pv, pv);
    fragColor = vec4(pow(max(col, 0.0), vec3(0.88)), 1.0);
}
