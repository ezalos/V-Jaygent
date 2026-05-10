// ABOUTME: Ferrofluid display — embossed shading of the simulated height
// ABOUTME: field. Gradient → normal, Lambertian + specular, ember palette.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec2      u_mouse;
uniform sampler2D u_state;

#include "tonemap.glsl"

out vec4 fragColor;

// Per-piece warm palette — copied from the ember snippet and pulled
// further into mauve/violet at the bottom so the troughs read as deep
// shadow rather than just dim amber. Five-stop, near-black at t=0 to
// pale gold at t=1.
vec3 ferroPalette(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.018, 0.008, 0.018);   // near-black violet
    vec3 c1 = vec3(0.180, 0.040, 0.040);   // wine
    vec3 c2 = vec3(0.520, 0.140, 0.045);   // ember
    vec3 c3 = vec3(0.940, 0.500, 0.140);   // amber
    vec3 c4 = vec3(1.000, 0.890, 0.620);   // pale gold
    if (t < 0.30) return mix(c0, c1, t * 3.3333);
    if (t < 0.55) return mix(c1, c2, (t - 0.30) * 4.0);
    if (t < 0.80) return mix(c2, c3, (t - 0.55) * 4.0);
    return                mix(c3, c4, (t - 0.80) * 5.0);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    // Sample the gradient at the SIM texture's native texel size — the
    // display upsamples, and stepping by a display-texel reads less
    // than one source-texel into the sim, which the bilinear filter
    // smears into mush.
    vec2 simTexel = 1.0 / vec2(textureSize(u_state, 0));

    vec4  st = texture(u_state, uv);
    float h  = st.r;
    float sH = st.g;

    // Surface gradient via central differences. The factor of 80 turns
    // h-units (which are roughly [-0.5, 1.5]) into a normal slope that
    // gives recognisable embossing — bigger means sharper relief, with
    // peaks that catch specular at the rim.
    float hx = texture(u_state, uv + vec2(simTexel.x, 0.0)).r
             - texture(u_state, uv - vec2(simTexel.x, 0.0)).r;
    float hy = texture(u_state, uv + vec2(0.0, simTexel.y)).r
             - texture(u_state, uv - vec2(0.0, simTexel.y)).r;
    vec3  N  = normalize(vec3(-hx * 80.0, -hy * 80.0, 1.0));

    // Two-light setup: warm key from upper-left at low angle so peaks
    // throw long shadows; cooler-warm fill from below-right at low
    // intensity so troughs aren't dead black.
    vec3  L     = normalize(vec3(-0.45, 0.65, 0.62));
    vec3  Fdir  = normalize(vec3( 0.20,-0.40, 0.30));
    float kKey  = max(dot(N, L), 0.0);
    float kFill = max(dot(N, Fdir), 0.0) * 0.25;

    // Palette mapping: combine current height with slow-tension echo so
    // the trail of the cursor's recent path glows even after the
    // surface relaxes. Pull baseline up to 0.30 so the substrate isn't
    // pure black across a quiet screen.
    float pal  = clamp(h * 0.55 + 0.30 + sH * 0.20, 0.0, 1.0);
    vec3  body = ferroPalette(pal);

    // Rim highlight where the surface gradient is steep — the spike
    // edges catch a brighter band of the palette, reading as glowing
    // crests rather than flat hills. Same trick ferment uses on its
    // RD spots, tuned for a sharper roll-on.
    float gradMag = length(vec2(hx, hy));
    float rim     = smoothstep(0.020, 0.085, gradMag);
    body         += ferroPalette(min(pal + 0.18, 0.99)) * rim * 0.55;

    vec3 col = body * (0.55 * kKey + kFill + 0.20);

    // Specular sheen — the metallic-mirror sheen that distinguishes
    // ferrofluid from ordinary inky liquid. Tight Phong lobe over the
    // peak normals, gated by h so flat regions don't sparkle.
    vec3  R    = reflect(-L, N);
    float spec = pow(max(R.z, 0.0), 36.0);
    col       += vec3(1.0, 0.95, 0.78) * spec * 0.45 * smoothstep(0.05, 0.40, h);

    col = reinhard(col);

    // Vignette + house gamma per VISION.md (pow 0.85..0.92 not raw RGB).
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    col   *= 1.0 - 0.30 * dot(p, p);
    fragColor = vec4(pow(max(col, 0.0), vec3(0.90)), 1.0);
}
