// ABOUTME: Per-touch ripple displacement of u_below + tactile halo. Mobile +
// ABOUTME: desktop click+drag both feed u_touches[8]; mouse-hover does NOT.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec4      u_touches[8];
uniform int       u_touch_count;
uniform float     u_keys[15];
uniform sampler2D u_below;

out vec4 fragColor;

void main() {
    vec2 uv     = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;

    // Aspect-corrected coords for radial math (so a touch radiates a
    // round ripple regardless of portrait/landscape — important for
    // mobile orientation flips).
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    // Per-layer-interactivity contract: touch is primary, but held keys
    // also amplify the ripple so the cursor and keyboard cross-couple
    // here instead of staying in separate layers. Sum envelopes across
    // 15 keys, soft-clamped so a chord doesn't make the field explode.
    float keyAmp = 0.0;
    for (int k = 0; k < 15; k++) keyAmp += u_keys[k];
    keyAmp = 1.0 + 0.6 * (keyAmp / (1.0 + keyAmp));   // 1.0 .. 1.6

    vec2 displace = vec2(0.0);
    vec3 halo     = vec3(0.0);

    for (int i = 0; i < 8; i++) {
        if (i >= u_touch_count) break;
        vec4 t = u_touches[i];
        if (t.w < 0.5) continue;

        vec2 tUv = t.xy / u_resolution.xy;
        vec2 tP  = (tUv - 0.5) * vec2(aspect, 1.0);

        vec2  d   = p - tP;
        float r   = length(d);
        vec2  dir = d / max(r, 1e-5);

        // Fresh touches push hardest; after release `t.z` (age in
        // seconds) climbs and exp-decays the displacement. The 0.06
        // reach is empirical — at 720p this is ~10% of the short axis,
        // big enough to read but doesn't dominate.
        float fresh = exp(-t.z * 1.4);
        float reach = 0.06 * fresh;

        // Ripple = travelling sin wave centred on the touch. The
        // negative sign on `u_time` makes the wave radiate outward.
        float wave = sin(r * 28.0 - u_time * 5.5);

        // Falloff so the displacement stays inside a finite annulus and
        // doesn't perturb the whole frame for every touch.
        float falloff = exp(-r * 8.0);

        displace += dir * reach * wave * falloff * keyAmp;

        // Tactile halo — bright 0.04-radius ring at the contact point
        // so the viewer sees the touch was registered before the
        // ripple visibly builds (~3 frames of latency otherwise).
        float ring = smoothstep(0.10, 0.04, r) * (0.30 + 0.70 * fresh);
        halo += vec3(1.00, 0.85, 0.55) * ring;
    }

    // Sample u_below at displaced uv. Bottom-layer-fallback contract
    // (layers/README.md §"Required behaviours" rule 2): if u_below is
    // empty (this layer rendered standalone), fall back to a sane
    // colour so smoke tests don't see garbage.
    vec3 below = texture(u_below, uv + displace).rgb;
    if (dot(below, vec3(1.0)) < 0.01) {
        below = vec3(0.20, 0.10, 0.30);
    }

    vec3 col = below + halo * 0.6;

    fragColor = vec4(col, 1.0);
}
