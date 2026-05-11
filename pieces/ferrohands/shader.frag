// ABOUTME: Ferrohands display — dark ferrofluid drop on a warm sunset background,
// ABOUTME: silhouette rim catches highlights, spike protrusions throw specular.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec4      u_touches[8];
uniform int       u_touch_count;
uniform sampler2D u_state;

#include "tonemap.glsl"

out vec4 fragColor;

// Background palette — warm sunset behind the drop. Pre-Reinhard values
// pushed high (>1.0) so after tonemap + gamma the sky lands at a clearly
// readable warm orange/amber, giving the dark drop a real silhouette to
// pop against.
vec3 skyPalette(vec2 uv) {
    vec3 top     = vec3(0.620, 0.180, 0.220);   // wine — visible, not near-black
    vec3 horizon = vec3(1.700, 0.620, 0.180);   // hot orange (clipped by Reinhard)
    vec3 bottom  = vec3(2.400, 1.250, 0.480);   // bright amber
    float t = uv.y;
    if (t > 0.55) return mix(horizon, top, (t - 0.55) / 0.45);
    return mix(bottom, horizon, t / 0.55);
}

// Ferrofluid fluid colour — real ferrofluid is iron-oxide-black with a
// subtle metallic sheen. Near-black body, slightly warmer in the spike
// peaks where specular catches the light.
vec3 fluidBody(float h, float specHint) {
    vec3 ink   = vec3(0.012, 0.008, 0.018);   // near-black violet
    vec3 sheen = vec3(0.180, 0.080, 0.045);   // dim wine sheen on peaks
    return mix(ink, sheen, smoothstep(0.20, 0.80, h)) + vec3(specHint);
}

// Drop-presence threshold. Below this h, no fluid — just sky. Sharp
// boundary so the drop reads as a discrete object.
const float H_FLUID = 0.16;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 simTexel = 1.0 / vec2(textureSize(u_state, 0));

    vec4  st = texture(u_state, uv);
    float h  = st.r;

    // ---- background --------------------------------------------------
    vec3 sky = skyPalette(uv);

    // ---- surface gradient (for normal + spike rims) ------------------
    float hx = texture(u_state, uv + vec2(simTexel.x, 0.0)).r
             - texture(u_state, uv - vec2(simTexel.x, 0.0)).r;
    float hy = texture(u_state, uv + vec2(0.0, simTexel.y)).r
             - texture(u_state, uv - vec2(0.0, simTexel.y)).r;
    vec3  N  = normalize(vec3(-hx * 70.0, -hy * 70.0, 1.0));

    // ---- lighting ---------------------------------------------------
    // Warm key from upper-left (matches the sunset). Cool fill from
    // below to keep underside of spikes from going pure black.
    vec3  L     = normalize(vec3(-0.40, 0.70, 0.55));
    vec3  Fdir  = normalize(vec3( 0.20,-0.40, 0.30));
    float kKey  = max(dot(N, L), 0.0);
    float kFill = max(dot(N, Fdir), 0.0) * 0.20;

    // Specular — the metallic-mirror sheen that distinguishes ferrofluid
    // from any other dark inky liquid. Tight Phong lobe over peaked
    // regions; gated by h so the smooth puddle body doesn't sparkle, only
    // the spike crests do.
    vec3  R      = reflect(-L, N);
    float specL  = pow(max(R.z, 0.0), 28.0);
    float specG  = smoothstep(0.40, 0.95, h);
    float specHint = specL * specG * 0.55;

    vec3 fluid = fluidBody(h, specHint);
    fluid *= (0.50 * kKey + kFill + 0.18);
    fluid += vec3(1.00, 0.85, 0.55) * specL * specG * 0.90;

    // ---- silhouette mask + rim --------------------------------------
    // Smoothstep around H_FLUID gives a clean drop boundary. The rim is
    // a thin band ON the boundary that catches a warm highlight — this
    // is the bright "wet edge" you see on real ferrofluid drops.
    float drop = smoothstep(H_FLUID - 0.04, H_FLUID + 0.04, h);

    // Rim: peak just at the silhouette, falling off both ways. The rim
    // is what makes the drop's outline glow against the warm sky.
    float rim    = exp(-pow((h - H_FLUID) / 0.05, 2.0)) * length(vec2(hx, hy));
    vec3  rimCol = vec3(1.00, 0.65, 0.30);

    // Composite: sky behind the drop, fluid where the drop is, plus the
    // rim along the boundary.
    vec3 col = mix(sky, fluid, drop);
    col += rimCol * rim * 6.0;

    // ---- per-finger pinpoint glow (tactile feedback) ----------------
    // Tiny bright dot under each active finger so the viewer sees that
    // their touch was registered before the spike physics catches up
    // (~3 frames). Fades fast so it's a poke, not a permanent overlay.
    float aspect = u_resolution.x / u_resolution.y;
    vec2  pWorld = (uv - 0.5) * vec2(aspect, 1.0);
    for (int i = 0; i < 8; i++) {
        if (i >= u_touch_count) break;
        vec4 t = u_touches[i];
        if (t.w < 0.5) continue;
        vec2 tN     = t.xy / u_resolution.xy;
        vec2 tWorld = (tN - 0.5) * vec2(aspect, 1.0);
        float r     = length(pWorld - tWorld);
        float dot   = exp(-r * 80.0) * exp(-t.z * 4.0);
        col += vec3(1.00, 0.78, 0.42) * dot * 0.65;
    }

    col = reinhard(col);

    // Subtle vignette + house gamma per VISION.md. Lighter than usual so
    // the warm sky stays warm to the corners.
    vec2 pv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    col   *= 1.0 - 0.15 * dot(pv, pv);
    fragColor = vec4(pow(max(col, 0.0), vec3(0.88)), 1.0);
}
