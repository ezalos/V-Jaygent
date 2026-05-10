// ABOUTME: Ferrohands display — gradient-to-normal embossing of the simulated
// ABOUTME: height field, ember palette, per-finger fresnel halo for tactile feedback.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec4      u_touches[8];
uniform int       u_touch_count;
uniform sampler2D u_state;

#include "tonemap.glsl"

out vec4 fragColor;

// Per-piece warm palette — same family as pieces/ferrofluid (cream / amber /
// ember / wine / mauve, near-black violet at the floor) but with a slightly
// hotter mid-band so peaks under fingertips read as "molten" rather than
// merely lit. Five-stop, near-black at t=0 to pale gold at t=1.
vec3 ferroPalette(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(0.014, 0.006, 0.020);   // near-black violet
    vec3 c1 = vec3(0.180, 0.040, 0.045);   // wine
    vec3 c2 = vec3(0.580, 0.155, 0.045);   // ember (hotter)
    vec3 c3 = vec3(0.965, 0.520, 0.150);   // amber
    vec3 c4 = vec3(1.000, 0.890, 0.620);   // pale gold
    if (t < 0.30) return mix(c0, c1, t * 3.3333);
    if (t < 0.55) return mix(c1, c2, (t - 0.30) * 4.0);
    if (t < 0.80) return mix(c2, c3, (t - 0.55) * 4.0);
    return                mix(c3, c4, (t - 0.80) * 5.0);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    // Sample the gradient at the SIM texture's native texel size — the
    // display upsamples, so stepping by a display-texel reads less than
    // one source-texel into the sim and the bilinear filter smears it
    // into mush.
    vec2 simTexel = 1.0 / vec2(textureSize(u_state, 0));

    vec4  st = texture(u_state, uv);
    float h  = st.r;
    float sH = st.g;

    // Surface gradient via central differences. Factor of 80 turns
    // h-units (~[-0.2, 1.4]) into a normal slope that gives recognisable
    // embossing — bigger means sharper relief, peaks catch specular at
    // the rim.
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
    // recently-touched regions glow even after the surface relaxes.
    // Baseline 0.16 puts quiet substrate near the wine/violet floor of
    // the 5-stop ramp; mesas push up through ember/amber to gold under
    // active fingers.
    float pal  = clamp(h * 0.65 + 0.16 + sH * 0.22, 0.0, 1.0);
    vec3  body = ferroPalette(pal);

    // Rim highlight where surface gradient is steep — spike edges catch
    // a brighter palette band, reading as glowing crests rather than
    // flat hills.
    float gradMag = length(vec2(hx, hy));
    float rim     = smoothstep(0.020, 0.085, gradMag);
    body         += ferroPalette(min(pal + 0.18, 0.99)) * rim * 0.55;

    vec3 col = body * (0.55 * kKey + kFill + 0.20);

    // Specular sheen — ferrofluid's metallic-mirror signature. Tight
    // Phong lobe over peak normals, gated by h so flat regions don't
    // sparkle.
    vec3  R    = reflect(-L, N);
    float spec = pow(max(R.z, 0.0), 36.0);
    col       += vec3(1.0, 0.95, 0.78) * spec * 0.45 * smoothstep(0.05, 0.40, h);

    // ---- Per-finger fresnel halo --------------------------------------
    // Tactile feedback: under each active finger, add a small bright halo
    // so the viewer sees "yes, the system saw my touch" before the spike
    // physics catches up (~3 frames). The halo is gated by spike height
    // so it only fires where the field is actually building — not a
    // pure cursor-decoration overlay. Closed brief: this is the ONE
    // affordance for the touch interaction model.
    float aspect = u_resolution.x / u_resolution.y;
    vec2  pWorld = (uv - 0.5) * vec2(aspect, 1.0);
    vec3  halo   = vec3(0.0);
    for (int i = 0; i < 8; i++) {
        if (i >= u_touch_count) break;
        vec4 t = u_touches[i];
        if (t.w < 0.5) continue;
        vec2  tN     = t.xy / u_resolution.xy;
        vec2  tWorld = (tN - 0.5) * vec2(aspect, 1.0);
        float r      = length(pWorld - tWorld);
        // Tight 0.04-radius halo, fades over 0.10. Stronger for fresh
        // touches (matches the strength-kick in the sim).
        float fresh = exp(-t.z * 6.0);
        float ring  = smoothstep(0.10, 0.04, r) * (0.35 + 0.65 * fresh);
        halo += vec3(1.00, 0.78, 0.42) * ring;
    }
    // Gate by local height so the halo lights actual rising fluid, not
    // empty space — preserves the "structure honesty" claim.
    col += halo * smoothstep(0.0, 0.18, h) * 0.55;

    col = reinhard(col);

    // Vignette + house gamma per VISION.md (pow 0.85..0.92, never raw RGB).
    vec2 pv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    col   *= 1.0 - 0.30 * dot(pv, pv);
    fragColor = vec4(pow(max(col, 0.0), vec3(0.90)), 1.0);
}
