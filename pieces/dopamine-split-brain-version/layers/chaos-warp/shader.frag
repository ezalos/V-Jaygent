#version 300 es
// ABOUTME: Chaos-warp layer — samples u_below through a curl-noise displacement
// ABOUTME: field with stochastic tear events at unpredictable times, plus
// ABOUTME: u_history feedback for smearing trails. Breaks the 20-second-window
// ABOUTME: predictability failure of the underlying oscillator lattices.
precision highp float;

#include "math.glsl"
#include "noise.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform int   u_frame;
uniform vec2  u_mouse;
uniform sampler2D u_below;
uniform sampler2D u_history;
uniform float u_audio_bass;
uniform float u_audio_level;
uniform float u_audio_playing;
uniform float u_downbeat;
uniform float u_beat_phase;
uniform int   u_section_id;
uniform float u_section_progress;

uniform float base_strength;
uniform float tear_strength;
uniform float smear_decay;

out vec4 fragColor;

// Curl of a 2D fbm scalar field — divergence-free, swirly. Two fbm samples
// offset by epsilon give an approximate gradient; rotating 90° turns the
// gradient into the curl. Result is a flow field that swirls instead of
// merely drifting, the visual signature of fluid turbulence.
vec2 curlNoise(vec2 p, float t) {
    float eps = 0.012;
    float n0 = fbm(p + vec2(0.0, t * 0.32));
    float n1 = fbm(p + vec2(eps, t * 0.32));
    float n2 = fbm(p + vec2(0.0, t * 0.32 + eps));
    float dx = (n1 - n0) / eps;
    float dy = (n2 - n0) / eps;
    return vec2(dy, -dx);
}

// Stochastic tear-event envelope. The piece needs surprise: pick "tear
// buckets" of ~5 seconds and roll a hash to decide if a tear fires inside
// that bucket. When it does, the envelope ramps up over ~0.4s and decays
// over ~1.8s. The viewer can't predict WHICH bucket fires until it does —
// that's the whole point.
struct Tear { float env; vec2 centre; float angle; };

Tear sampleTear(float t) {
    float bucket = floor(t / 4.7);
    float fire = step(0.55, hash21(vec2(bucket * 7.31, 13.0)));   // ~45% of buckets fire
    float tFireOffset = hash21(vec2(bucket, 91.7)) * 3.8;          // when inside the bucket
    float tFire = bucket * 4.7 + tFireOffset;
    float dt = t - tFire;
    // Asymmetric: 0.35s ramp, ~1.6s exponential decay.
    float ramp  = smoothstep(0.0, 0.35, dt);
    float decay = exp(-max(dt - 0.35, 0.0) * 1.6);
    float env = ramp * decay * fire;

    // Centre + angle for this tear — also hash-derived so it lands somewhere
    // the viewer didn't predict.
    vec2 centre = vec2(hash21(vec2(bucket, 19.7)),
                       hash21(vec2(bucket, 53.1)));
    float angle = hash21(vec2(bucket, 71.3)) * TAU;
    return Tear(env, centre, angle);
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 pAspect = vec2((uv.x - 0.5) * aspect + 0.5, uv.y);

    // u_below sample — the two hemispheres + seam already composited beneath.
    // Defensive fallback for the smoke-test bottom-layer case.
    vec3 belowSample0 = texture(u_below, uv).rgb;
    bool belowEmpty = dot(belowSample0, vec3(1.0)) < 0.005;

    // === Two-scale chaotic warp field ===
    // Coarse swirly flow + fine turbulence at a much higher spatial frequency.
    // Time evolves both, but at incommensurate rates so the field never
    // re-aligns into a recognisable loop.
    vec2 flowCoarse = curlNoise(pAspect * 1.6, u_time * 0.45);
    vec2 flowFine   = curlNoise(pAspect * 5.3, u_time * 0.83);

    // Headless / silent fallback: synthesize a slow breathing chaos level so
    // the piece is alive even with u_audio_playing == 0.
    float synthChaos = 0.5 + 0.4 * sin(u_time * 0.31);
    float chaosLevel = mix(synthChaos,
                           0.30 + 1.20 * u_audio_bass + 0.60 * u_audio_level,
                           u_audio_playing);

    // Section-state shapes the chaos budget:
    //   0 (intro)    minimal warp — the piece introduces itself cleanly
    //   1-2          slowly rising base warp
    //   3 (pre-peak) high turbulence, frequent tears
    //   4 (climax)   MAXIMUM turbulence — fusion is chaotic, not orderly
    //   5 (outro)    dies down with the music
    float sectionChaos = 0.20;
    if (u_section_id == 0)      sectionChaos = 0.10;
    else if (u_section_id == 1) sectionChaos = 0.45;
    else if (u_section_id == 2) sectionChaos = 0.75;
    else if (u_section_id == 3) sectionChaos = 1.05;
    else if (u_section_id == 4) sectionChaos = 1.45;
    else if (u_section_id == 5) sectionChaos = 0.55 * (1.0 - u_section_progress);

    // === Stochastic tear ===
    // Tears land at hash-unpredictable times and centres. Each tear adds a
    // strong radial+rotational displacement around its centre — like the
    // composition briefly being grabbed and twisted.
    Tear tear = sampleTear(u_time);
    vec2 tearDelta = pAspect - tear.centre;
    float tearDist = length(tearDelta * vec2(aspect, 1.0));
    float tearFalloff = exp(-tearDist * tearDist * 3.2);
    // Twist + radial pull, rotated by the tear's hash-picked angle.
    vec2 tearRadial = rot2d(tear.angle) * tearDelta;
    vec2 tearDir = normalize(tearRadial + vec2(0.0001));
    vec2 tearPush = (tearDir * 0.9 + vec2(-tearDir.y, tearDir.x) * 1.2) * tearFalloff * tear.env;

    // Downbeat micro-tear — deterministic but small. Adds rhythm-coupled
    // micro-chaos so the viewer feels a kick coupled with a visual jolt
    // (different from a flash; this *moves* the composition).
    vec2 dbCentre = vec2(0.5 + 0.4 * sin(u_time * 0.21),
                         0.4 + 0.4 * cos(u_time * 0.17));
    vec2 dbDir = normalize((pAspect - dbCentre) + 0.0001);
    float dbDist = length((pAspect - dbCentre) * vec2(aspect, 1.0));
    vec2 dbPush = vec2(-dbDir.y, dbDir.x) * exp(-dbDist * 2.4) * u_downbeat * 0.05;

    // Cursor-anchored chaos: when cursor is non-idle, it locally suppresses
    // the warp (the viewer's touch calms the field). Lets the viewer carve
    // out a coherent zone inside the chaos.
    vec2 mouseUv = u_mouse / u_resolution;
    float cursorIdle = step(0.5, length(u_mouse));  // 0 if idle, 1 otherwise
    float cursorDist = length((uv - mouseUv) * vec2(aspect, 1.0));
    float cursorCalm = cursorIdle * exp(-cursorDist * 4.5) * 0.85;

    // Assemble the displacement vector field.
    vec2 warp = (flowCoarse * 0.6 + flowFine * 0.25) * base_strength * sectionChaos * (0.6 + 0.9 * chaosLevel)
              + tearPush * tear_strength
              + dbPush;
    warp *= (1.0 - cursorCalm);

    // Sample u_below at the warped UV. Aspect-correct the displacement so
    // x and y read at the same physical magnitude.
    vec2 warpUv = uv + vec2(warp.x / aspect, warp.y);
    vec3 below = texture(u_below, warpUv).rgb;
    if (belowEmpty) below = vec3(0.04, 0.02, 0.01);

    // === u_history feedback for trails ===
    // Sample history at a slightly drifted UV so the trails advect along the
    // dominant flow direction. This is what makes chaos look like a fluid,
    // not just a per-frame noise.
    vec2 histShift = -(flowCoarse * 0.6) * base_strength * sectionChaos * 0.8;
    vec3 hist = texture(u_history, uv + vec2(histShift.x / aspect, histShift.y)).rgb;
    // Frame-0 fallback: ramp in history over the first 30 frames.
    float histRamp = smoothstep(0.0, 30.0, float(u_frame));
    float decay = smear_decay * (0.85 + 0.20 * sectionChaos * 0.6);
    hist *= decay * histRamp;

    // Compose: the warped below is the "current" image; history smears it.
    // max blend per channel keeps the brightest oscillator peaks intact
    // while letting trails wash beneath them.
    vec3 col = max(below, hist);

    // Section-4 turbulence intensifier — add a touch of high-frequency
    // chromatic separation during the climax so the fusion really tears.
    if (u_section_id == 4) {
        float sep = 0.0035 * u_section_progress;
        vec2 sepUv = uv + vec2(warp.x / aspect, warp.y);
        col.r = texture(u_below, sepUv + vec2(sep, 0.0)).r;
        col.b = texture(u_below, sepUv - vec2(sep, 0.0)).b;
        col = max(col, hist);
    }

    fragColor = vec4(col, 1.0);
}
