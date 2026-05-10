// ABOUTME: Display pass for swarm — reads sim density/velocity/affinity and paints
// ABOUTME: through a per-finger warm-extended palette with motion streaks + finger glyphs.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform sampler2D u_state;
uniform sampler2D u_boids;

uniform vec4 u_touches[8];
uniform int  u_touch_count;

#include "math.glsl"
#include "tonemap.glsl"

out vec4 fragColor;

// Same ghost generator as sim.frag — kept duplicated rather than promoted to
// lib because lib/ is for "one right answer" geometry; ghost orbiters are an
// aesthetic choice that may diverge per piece. The two copies must stay in
// sync; if you move them apart, the finger glyphs will desync from the
// density blooms and the piece will look broken.
bool sampleFinger(int i, out vec2 fingerUv, out float age, out float gain) {
    if (i < u_touch_count) {
        vec4 t = u_touches[i];
        if (t.w < 0.5) return false;
        fingerUv = t.xy / u_resolution;
        age      = t.z;
        gain     = 1.0;
        return true;
    }
    int g = i - u_touch_count;
    if (g >= 4 || i >= 8) return false;
    float fi = float(g);
    float fx = 0.077 + 0.029 * fi;
    float fy = 0.061 + 0.041 * fi;
    float ax = 0.34 + 0.05 * sin(u_time * 0.07 + fi * 1.7);
    float ay = 0.27 + 0.05 * cos(u_time * 0.09 + fi * 2.3);
    fingerUv = vec2(
        0.5 + ax * sin(TAU * fx * u_time + fi * PHI * 1.7),
        0.5 + ay * sin(TAU * fy * u_time + fi * PHI * 2.9)
    );
    age = mod(u_time + fi * 1.7, 6.5);
    gain = (u_touch_count > 0) ? 0.5 : 1.0;
    return true;
}

// Warm-extended spectrum: red → orange → gold → cream → mauve → wine →
// violet → magenta. Walks a curated path so cell-to-cell hue transitions
// stay readable and never land in green/cyan. Each finger claims ~one
// 8th of the wheel, so 8 fingers fill the loop without confetti.
vec3 fingerPalette(float aff) {
    // Eight key colours, evenly spaced in `aff`.
    const vec3 c0 = vec3(0.95, 0.22, 0.10);   // red
    const vec3 c1 = vec3(1.00, 0.50, 0.12);   // orange
    const vec3 c2 = vec3(1.00, 0.80, 0.32);   // gold
    const vec3 c3 = vec3(1.00, 0.95, 0.65);   // cream
    const vec3 c4 = vec3(0.92, 0.55, 0.62);   // rose
    const vec3 c5 = vec3(0.65, 0.22, 0.55);   // wine
    const vec3 c6 = vec3(0.42, 0.18, 0.62);   // violet
    const vec3 c7 = vec3(0.85, 0.20, 0.45);   // magenta (loops back to red)

    float t = fract(aff) * 8.0;
    int   k = int(floor(t));
    float f = fract(t);

    vec3 col;
    if      (k == 0) col = mix(c0, c1, f);
    else if (k == 1) col = mix(c1, c2, f);
    else if (k == 2) col = mix(c2, c3, f);
    else if (k == 3) col = mix(c3, c4, f);
    else if (k == 4) col = mix(c4, c5, f);
    else if (k == 5) col = mix(c5, c6, f);
    else if (k == 6) col = mix(c6, c7, f);
    else             col = mix(c7, c0, f);
    return col;
}

void main() {
    vec2 uv     = gl_FragCoord.xy / u_resolution.xy;
    vec2 texel  = 1.0 / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;

    // ---- Sample sim state with a small soft kernel (smooths texel edges).
    vec4 c = texture(u_state, uv);
    vec4 b = c
           + texture(u_state, uv + vec2( texel.x, 0.0))
           + texture(u_state, uv - vec2( texel.x, 0.0))
           + texture(u_state, uv + vec2(0.0,  texel.y))
           + texture(u_state, uv - vec2(0.0,  texel.y));
    b *= 0.2;

    float density = b.r;
    vec2  vel     = b.gb;
    float aff     = b.a;

    // ---- Velocity-aligned streak: integrate density along -vel for a few
    // taps. Adds motion blur without an explicit history buffer.
    float streak = 0.0;
    for (int s = 1; s <= 5; s++) {
        float k = float(s) * 0.0035;
        streak += texture(u_state, uv - vel * k).r;
    }
    streak *= 0.2;

    // ---- Palette ----
    // Slow global drift so the same affinity slot doesn't lock to one hue.
    float drift = u_time * 0.012;
    vec3  base  = fingerPalette(aff + drift);

    // ---- Compose body ----
    // Lower exponent = sharper rise on small density. Forces the swarm
    // body to pop against negative space instead of melting into a wash.
    float glow  = pow(density, 0.55);
    float speed = length(vel);
    float spark = pow(saturate(speed * 0.55), 1.7);

    // Warm baseline for non-empty cells; per-finger palette tints toward
    // unity as density grows. Empty cells stay near-black.
    vec3 col = vec3(0.0);
    col += base * glow * 1.55;
    col += base * streak * 0.55;
    // Speed sparkle in cream-white — the eye reads it as "fast", not coloured.
    col += vec3(1.0, 0.86, 0.62) * spark * (0.4 + 0.6 * glow);

    // ---- Finger glyphs ----
    // Bright ring + crosshair at every active finger so the viewer knows
    // where their input lands. Ring radius pulses with finger age.
    // ---- 100 boids (Lagrangian particles swimming in the velocity field).
    // Each boid is splatted as a small disc tinted by the sim's affinity at
    // its position. Boids fade in at birth and fade out at death (lifespan
    // 4-9s, per-boid hash) — same age formula as boids.frag.
    for (int i = 0; i < 100; i++) {
        ivec2 bc = ivec2(i % 10, i / 10);
        vec4  b  = texelFetch(u_boids, bc, 0);
        vec2  bp = b.xy;
        vec2  bv = b.zw;

        // Match boids.frag's lifespan formula exactly so visible age tracks
        // the simulation age — drift between the two desyncs the fade.
        float fi       = float(i);
        float lifespan = 4.0 + 5.0 * fract(sin(fi * 1.71) * 41.73);
        float phase    = fract(cos(fi * 2.39) * 13.71) * lifespan;
        float age      = mod(u_time + phase, lifespan);
        float lifeT    = age / lifespan;          // 0..1 across one life
        // Bell envelope: 0 at birth, 1 in the middle, 0 at death.
        float life     = sin(lifeT * PI);
        life = pow(life, 0.7);

        vec2  d  = (uv - bp) * vec2(aspect, 1.0);
        float r2 = dot(d, d);

        // Disc: tight Gaussian, slight axial stretch along velocity so
        // fast-moving boids leave a comet streak instead of a perfect blob.
        float radius = 0.0075;
        float speed  = length(bv);
        float along  = speed > 1e-4 ? abs(dot(d, bv) / speed) : 0.0;
        float r2e    = r2 + along * 0.6 * along * 0.6;
        float disc   = exp(-r2e / (radius * radius));
        // Soft halo (wider, dimmer) — boids stand out from the field.
        float halo   = exp(-r2 / (0.018 * 0.018)) * 0.35;

        float aff   = texture(u_state, bp).a;
        vec3  bcol  = fingerPalette(aff + drift);

        col += bcol * (disc * 1.8 + halo) * life * (1.0 + 0.7 * saturate(speed * 0.6));
    }

    for (int i = 0; i < 8; i++) {
        vec2  fUv;
        float fAge;
        float fGain;
        if (!sampleFinger(i, fUv, fAge, fGain)) continue;

        vec2  delta = (uv - fUv) * vec2(aspect, 1.0);
        float r     = length(delta);

        // Ring: thin annulus that slowly expands and fades out.
        float ringR    = 0.018 + 0.006 * sin(u_time * 4.0 + float(i));
        float ringW    = 0.0028;
        float ring     = exp(-pow((r - ringR) / ringW, 2.0));
        float fade     = exp(-fAge * 0.18);

        // Hot core where the finger sits.
        float core = exp(-r * r / (0.012 * 0.012));

        // Ghost glyphs are dimmed alongside their forcing — keeps real
        // fingers (gain=1.0) visually dominant when both are on screen.
        vec3 fingerCol = fingerPalette(((float(i) + 0.5) / 8.0) + drift);
        col += fingerCol * (ring * 1.5 + core * 1.6) * fade * fGain;
    }

    // ---- Tone, gamma ----
    col = reinhardPartial(col, 4.0);
    col = pow(max(col, 0.0), vec3(0.92));
    fragColor = vec4(col, 1.0);
}
