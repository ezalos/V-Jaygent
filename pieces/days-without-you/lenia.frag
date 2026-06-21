// ABOUTME: Lenia continuous cellular automata (Bert Chan 2018) — one ping-pong sim pass.
// ABOUTME: A(t+dt)=clamp(A+dt*G(K*A)); ring kernel + gaussian growth; beat-fed living ecosystem.
#version 300 es
precision highp float;

uniform vec2      u_resolution;
uniform float     u_time;
uniform vec2      u_mouse;
uniform int       u_frame;
uniform sampler2D u_state;     // A in .r

uniform float u_audio_kick;
uniform float u_audio_bass_stem;
uniform float u_audio_drums_stem;
uniform float u_audio_vocals_stem;
uniform float u_audio_other_stem;
uniform float u_audio_playing;
uniform int   u_section_id;
uniform float u_downbeat;
uniform int   u_bar_index;
uniform float u_keys[15];
uniform float u_key_event[15];

#include "noise.glsl"

out vec4 fragColor;

#define R 16               // kernel radius in sim pixels (creatures ~2R wide)
const float KW    = 0.15;  // kernel ring width
const float KPEAK = 0.5;   // kernel ring peak radius (fraction of R)

vec2 worldQ(vec2 fc) { return (fc - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y); }

// Gaussian growth mapping, range [-1,1].
float growth(float u, float mu, float sig) {
    float d = u - mu;
    return 2.0 * exp(-(d * d) / (2.0 * sig * sig)) - 1.0;
}

// Per-section regime: vec4(mu, sig, dt, feed). High dt/feed = turbulent, frantic
// life; low = sparse, settling. This is the section VOCABULARY, not re-shading.
// mu near 0.15 (Orbium regime) = sparse drifting blobs on dark; higher = denser.
vec4 regime(int s) {
    if (s <= 0) return vec4(0.150, 0.020, 0.10, 0.05);  // intro — sparse, slow
    if (s == 1) return vec4(0.160, 0.022, 0.12, 0.07);  // verse — gliders + small colonies
    if (s == 2) return vec4(0.185, 0.028, 0.17, 0.12);  // drop — turbulent bloom
    if (s == 3) return vec4(0.175, 0.024, 0.13, 0.09);  // vocal — lush colony
    if (s == 4) return vec4(0.170, 0.024, 0.14, 0.08);  // build — migrate + merge
    if (s == 5) return vec4(0.190, 0.030, 0.19, 0.12);  // climax — frantic/chaotic
    if (s == 6) return vec4(0.140, 0.019, 0.09, 0.04);  // outro — die-off
    return                vec4(0.130, 0.018, 0.07, 0.02);// fade — near-empty
}

// Section ENERGY drives a mortality rate so density actually varies across the
// song: low energy -> high mortality -> sparse scattered organisms; high energy
// -> teeming colony. (Feed alone can't thin a self-sustaining colony.)
float secEnergy(int s) {
    if (s <= 0) return 0.15;   // intro — sparse, structured masses
    if (s == 1) return 0.40;   // verse
    if (s == 2) return 0.70;   // drop — bloom
    if (s == 3) return 0.55;   // vocal — lush
    if (s == 4) return 0.62;   // build
    if (s == 5) return 0.92;   // climax — teeming
    if (s == 6) return 0.22;   // outro — die-off
    return 0.03;               // fade — near-empty
}

void main() {
    vec2 uv    = gl_FragCoord.xy / u_resolution.xy;
    vec2 texel = 1.0 / u_resolution.xy;

    // Frame 0: sparse seed blobs (sized to the kernel so they survive as life).
    if (u_frame == 0) {
        float n  = vnoise(gl_FragCoord.xy * 0.020);
        float a0 = smoothstep(0.82, 1.0, n) * (0.6 + 0.4 * hash21(gl_FragCoord.xy));
        fragColor = vec4(clamp(a0, 0.0, 1.0), 0.0, 0.0, 1.0);
        return;
    }

    // Kernel convolution: neighbourhood potential U = (K * A) / sum(K).
    float U = 0.0, kSum = 0.0;
    for (int dj = -R; dj <= R; dj++) {
        for (int di = -R; di <= R; di++) {
            float rr = length(vec2(float(di), float(dj))) / float(R);
            if (rr > 1.0 || rr < 1e-3) continue;
            float k = exp(-(rr - KPEAK) * (rr - KPEAK) / (2.0 * KW * KW));
            float a = texture(u_state, uv + vec2(float(di), float(dj)) * texel).r;
            U += k * a;
            kSum += k;
        }
    }
    U /= max(kSum, 1e-5);

    float A = texture(u_state, uv).r;

    // Regime params: idle baseline (slow drift) blended to the section/audio drive.
    vec4  rg   = regime(u_section_id);
    float p    = clamp(u_audio_playing, 0.0, 1.0);
    float tau  = u_time;
    float muI  = 0.165 + 0.020 * sin(tau * 0.07);
    float sgI  = 0.024 + 0.006 * sin(tau * 0.043);
    float dtI  = 0.12  + 0.03  * sin(tau * 0.11);
    float fdI  = 0.07;
    float mu   = mix(muI, rg.x + 0.010 * u_audio_vocals_stem, p);
    float sig  = mix(sgI, rg.y + 0.012 * u_audio_other_stem,  p);
    float dt   = mix(dtI, rg.z + 0.10  * u_audio_drums_stem,  p);
    float feed = mix(fdI, rg.w, p);
    // energy -> mortality (the section density arc). Drums add life; idle ~ medium.
    float energy = mix(0.50, clamp(secEnergy(u_section_id) + 0.25 * u_audio_drums_stem, 0.0, 1.0), p);
    float mort   = (1.0 - energy) * 0.105;

    // Macro-composition envelope: a slow DRIFTING low-frequency field creates 1-2
    // wandering hot-zones where colonies thrive (higher mu + feed) and thin
    // elsewhere — so the squint sees light/dark structure and the layout drifts
    // over tens of seconds (long-window divergence), not a uniform carpet.
    vec2  qm  = worldQ(gl_FragCoord.xy);
    float env = vnoise(qm * 1.25 + vec2(u_time * 0.020, u_time * 0.014))
              + 0.5 * vnoise(qm * 2.7 - vec2(u_time * 0.011, u_time * 0.017));
    env = clamp((env / 1.5 - 0.35) * 1.8, 0.0, 1.0);   // 0 in cold zones, 1 in hot
    mu   += (env - 0.5) * 0.045;
    feed *= 0.15 + 1.5 * env;

    float Anew = A + dt * growth(U, mu, sig) - mort * A;

    // All spawns inject BLOB-sized patches (low-freq noise / gaussians), never
    // per-pixel speckle — a lone bright pixel has U~0 and dies; only kernel-sized
    // patches survive as organisms.

    // Beat bloom: kick births fresh blobs in emptyish regions (the field spawns
    // on the groove). Blob field reseeds per bar so blooms land in new places.
    float beat = max(u_audio_kick, 0.7 * u_audio_bass_stem) * p;
    float spawnF = vnoise(gl_FragCoord.xy * 0.024 + vec2(float(u_bar_index) * 7.3, 11.0));
    Anew += beat * 0.55 * smoothstep(0.74, 0.93, spawnF) * (1.0 - smoothstep(0.15, 0.4, A));

    // Primordial-soup feed (gated): low-freq fertile patches ONLY where the field
    // is empty, so dead regions keep birthing life while colonies evolve cleanly.
    if (U < 0.045) {
        float feedF = vnoise(gl_FragCoord.xy * 0.018 + floor(u_time * 0.6) * vec2(3.1, 5.7));
        Anew += feed * smoothstep(0.88, 0.99, feedF) * 0.45;
    }

    // Cursor: a fertile zone — inject a living blob + local growth boost.
    if (!(u_mouse.x == 0.0 && u_mouse.y == 0.0)) {
        vec2 d = worldQ(gl_FragCoord.xy) - worldQ(u_mouse);
        Anew += exp(-dot(d, d) / 0.012) * 0.5;
    }

    // Keyboard: each key plants a seed blob at its mapped position.
    for (int kk = 0; kk < 15; kk++) {
        if (u_key_event[kk] > 0.001) {
            vec2 kc = vec2((float(kk) / 14.0 - 0.5) * 1.4, 0.0);
            vec2 d  = worldQ(gl_FragCoord.xy) - kc;
            Anew += u_key_event[kk] * exp(-dot(d, d) / 0.008) * 0.7;
        }
    }

    fragColor = vec4(clamp(Anew, 0.0, 1.0), 0.0, 0.0, 1.0);
}
