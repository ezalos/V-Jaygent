// ABOUTME: Display — single ferrofluid blob with procedural Rosensweig hex profile,
// ABOUTME: Kajiya-Kay anisotropic spec, apex kill, Kodama palette discipline, attention anchor.
#version 300 es
precision highp float;

#include "math.glsl"
#include "noise.glsl"
#include "sdf.glsl"
#include "tonemap.glsl"

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_high;
uniform float u_audio_kick;
uniform float u_audio_playing;
uniform float u_downbeat;
uniform float u_bar_phase;
uniform float u_beat_phase;
uniform int   u_section_id;
uniform float u_section_progress;
uniform float u_song_progress;
uniform float u_keys[15];
uniform float u_keys_visual[15];
uniform float u_key_event[15];
uniform sampler2D u_field_state;

out vec4 fragColor;

// 1/f modulation (4-octave low-freq sum) — breaks the VU-meter feel.
// Mesmerism rule: parameters should not feel metronomic.
float oneOverF(float t) {
    return 0.5 + 0.5 * (
        0.45 * sin(t * 0.21 + 0.7)
      + 0.30 * sin(t * 0.43 + 1.3)
      + 0.18 * sin(t * 0.91 + 2.1)
      + 0.10 * sin(t * 1.83 + 3.7)
    ) * 0.5;
}

// Kodama section vocabulary. Returns (R_base, spike_count, spike_amp) so
// each section is qualitatively different — not just "more amplitude".
//   0 soft fluid → 1 moss → 2 shark teeth → 3 break → 4 drop → 5 iron →
//   6 cooling → 7 glassy.
vec3 kodamaState(int sec, float prog) {
    if (sec == 0) return vec3(0.20 + 0.04 * prog, 14.0,               0.018 + 0.020 * prog);
    if (sec == 1) return vec3(0.24,               18.0,               0.045);
    if (sec == 2) return vec3(0.27,               14.0,               0.105);
    if (sec == 3) return vec3(0.27 - 0.12 * prog, 14.0,               0.060 * (1.0 - prog * 0.5));
    if (sec == 4) return vec3(0.18 + 0.13 * prog, 14.0,               0.080 + 0.110 * prog);
    if (sec == 5) return vec3(0.31,                7.0,               0.190);  // iron — tower
    if (sec == 6) return vec3(0.31 - 0.05 * prog, 14.0,               0.150 * (1.0 - prog * 0.7));
    return vec3(0.26, 6.0, 0.020);                                              // glassy still has whisper
}

// Procedural spike rim — pow-sharpened sin lattice in θ-space with multi-
// scale chaos that BREATHES with the bar. Lattice snaps to perfect hex on
// downbeat (lattice_order = 1) and drifts into chaos across the bar
// (lattice_order → 0 → max chaos). This is the visible phase-lock — the
// reason the hypnotic rhythm is the BPM, not the random fbm.
float spikeProfile(float theta, float spikePhase, float spikeCount,
                   vec2 worldP, float jitterAmt, float latticeOrder) {
    // Chaos amplitude inversely modulated by lattice_order — snaps clean,
    // breathes into chaos.
    float chaosAmp = 1.0 - latticeOrder;
    float phasePerturb = (1.60 * fbm(vec2(theta * 0.55 + u_time * 0.17, 1.7))
                       +  0.45 * fbm(vec2(theta * 1.40 + u_time * 0.41, 8.7))) * chaosAmp;
    float jit = (hash21(worldP * 6.0 + vec2(u_time * 0.3, 0.0)) - 0.5) * jitterAmt;
    float lattice = sin(theta * spikeCount + spikePhase + phasePerturb + jit * 2.0);
    lattice = max(0.0, lattice);
    lattice = pow(lattice, 3.5);
    // Height jitter also gated by chaos amp — uniform on downbeat, wild
    // by end of bar. Range 0.05..2.30 at full chaos, 0.85..1.15 at snap.
    float jitRaw = 0.05 + 2.25 * fbm(vec2(theta * 2.1 + u_time * 0.37, 4.3));
    float heightJit = mix(1.0, jitRaw, chaosAmp);
    return lattice * heightJit;
}

// Drumhead wobble — radial damped sine wave from a kick site. Fires on
// kick or downbeat only. Synthetic idle trigger removed — repeated rings
// were reading as visual noise rather than rhythm.
float drumhead(vec2 dC, float r) {
    float trigger = max(u_audio_kick * 1.2, u_downbeat * 0.5);
    if (trigger < 0.01) return 0.0;
    float phase = r * 18.0 - u_time * 7.0;
    float damp  = exp(-r * 6.0);
    return 0.014 * trigger * cos(phase) * damp;
}

// Pinch-off proto-droplets — bumps at random θ positions on the rim that
// grow and shrink, simulating spikes about to detach. Three independent
// drops with phase-shifted lifetimes.
float dropletBumps(float theta, float r, float Rasym, float t) {
    float bumps = 0.0;
    for (int i = 0; i < 3; i++) {
        float seed = float(i);
        // Drop's θ wanders slowly.
        float dropTheta = TAU * (0.13 + 0.5 * sin(t * 0.21 + seed * 1.7));
        // Drop's life cycle — grow then shrink.
        float lifePhase = mod(t * 0.6 + seed * 2.7, 4.5) / 4.5;  // 0..1 cycle
        float lifeAmp   = sin(lifePhase * PI);                    // 0..1..0
        if (lifeAmp < 0.05) continue;
        // Angular distance from drop center.
        float dth = mod(theta - dropTheta + PI, TAU) - PI;
        // Bump height as gaussian in θ around drop position.
        float bumpAng = exp(-dth * dth * 80.0) * lifeAmp * 0.07;
        // Radial: bump extends outward from rim.
        float bumpRad = exp(-pow((r - Rasym) * 35.0 - lifeAmp * 1.5, 2.0));
        bumps += bumpAng * bumpRad;
    }
    return bumps;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    float t = u_time;

    // === Body anchor — drifts on a slow Perlin path, plus cursor pull ===
    vec4 fS_c = texture(u_field_state, vec2(0.5));
    vec2 fGrad_c = fS_c.gb;
    bool mouseActive = !(u_mouse.x == 0.0 && u_mouse.y == 0.0);
    vec2 cw = mouseActive
            ? (u_mouse / u_resolution - 0.5) * vec2(aspect, 1.0)
            : vec2(0.0);
    // Slow Perlin-style drift so the body wanders even when idle. Range
    // ~0.10 world units — visible motion across 6-second cycles, breaks
    // the "stationary at center" reading.
    vec2 wander = vec2(
        0.10 * (fbm(vec2(t * 0.13, 3.7)) - 0.5),
        0.08 * (fbm(vec2(t * 0.17, 9.1)) - 0.5)
    );
    vec2 bodyC = wander + cw * 0.22;

    // === Kodama state for this section ===
    vec3 ks = kodamaState(u_section_id, u_section_progress);
    float R_base    = ks.x;
    float spikeCount = ks.y;
    float spikeAmp   = ks.z;

    // Polyrhythmic timescales: slow drift (1/f noise) + body breathe (bass)
    // + spike erupt (kick) + capillary chop (high).
    float oneF       = oneOverF(t);                 // 0.3 Hz
    float bodyBreath = 0.020 * sin(TAU * t / 4.5)  // 2 Hz breath
                     * (0.4 + 0.6 * u_audio_bass);
    float erupt      = 0.018 * pow(u_audio_kick, 2.0);
    float capChop    = 0.005 * u_audio_high;

    // BASS as the primary visual. Body radius pulses BIG (~55% of base R)
    // on bass envelope. Smooth, not metronomic — the music IS the body.
    float bassPulse = R_base * 0.55 * u_audio_bass;

    // Effective body radius, modulated by all timescales.
    // Beat-throb dropped: it fired every 0.49s and over 8 minutes that
    // reads as aggressive. Bass envelope replaces it as the breath driver.
    float R = R_base
            + bodyBreath
            + erupt
            + bassPulse
            + 0.018 * (oneF - 0.5);   // very slow 1/f drift, no audio

    // Spike amplitude is bass-dominant. Loud bass = tall spikes. Hi-hat
    // and downbeat are accents on top, not co-equal drivers.
    float ampBoost = 0.40 + 1.50 * u_audio_bass
                          + 0.25 * u_downbeat
                          + 0.18 * u_audio_high;
    float ampNow = spikeAmp * ampBoost * (0.6 + 0.7 * oneF);

    // === Cursor leans the lattice + bar-phase rotates it ===
    // BPM-locked rotation: the lattice rotates 2*PI per 16 bars (≈ 31s
    // at 123 BPM = the song's natural 16-bar period). Visible rotation
    // synced to music — half the "BPM is part of the art" promise.
    float barRot = TAU * u_song_progress * 0.0;  // anchor; song_progress is
                                                   // a smooth ramp 0..1
    float cursorPhase = mouseActive ? atan(cw.y - bodyC.y, cw.x - bodyC.x)
                                    : 0.0;
    float spikePhase  = cursorPhase
                      + TAU * 0.10 * sin(u_bar_phase * TAU)  // bar-locked wobble
                      + 0.30 * t * 0.05;                      // slow continuous

    // Pole bias toward cursor — spikes grow taller on the side facing it.
    vec2 dipoleAxis = mouseActive ? normalize(cw - bodyC + vec2(1e-6))
                                  : vec2(cos(t * 0.13 + u_bar_phase * TAU * 0.25),
                                         sin(t * 0.17 + u_bar_phase * TAU * 0.25));

    // === Lattice order — snaps to 1 on downbeat, decays across the bar ===
    // This is THE phase-lock. Chaos respects rhythm. Bar starts crisp,
    // ends melted, snap restores clean lattice for one frame.
    float latticeOrder = pow(max(0.0, 1.0 - u_bar_phase), 1.6) * 0.85
                       + 0.15 * u_downbeat;

    // === Body SDF — asymmetric body + procedural spike profile in θ-space ===
    vec2 dC = p - bodyC;
    float r = length(dC);
    float theta = atan(dC.y, dC.x);

    // Asymmetric body lobes — multi-octave fbm so the silhouette has BIG
    // lobes (±28%) plus smaller bulges. Reads as "fluid being pulled by an
    // inhomogeneous field", not "circle".
    float bodyLobe = 0.28 * (fbm(vec2(theta * 1.3 + t * 0.09, 7.7)) - 0.5)
                   + 0.10 * (fbm(vec2(theta * 3.1 + t * 0.27, 2.3)) - 0.5);
    float Rasym = R * (1.0 + bodyLobe);

    float profile = spikeProfile(theta, spikePhase, spikeCount, p, ampNow * 6.0,
                                 latticeOrder);
    vec2 rimDir = vec2(cos(theta), sin(theta));
    float poleBias = 0.45 + 1.10 * pow(max(0.0, dot(rimDir, dipoleAxis)), 2.0);
    profile *= poleBias;

    // Capillary chop on rim — pixel-scale jitter that intensifies with
    // hi-hat. Hi-hat hits → scintillation, not bumps. Always-on minimum.
    float chopAmp = 0.010 + 0.020 * u_audio_high;
    float chop = chopAmp * (fbm(vec2(theta * 26.0 + t * 6.0, 11.3)) - 0.5);

    // Drumhead wobble — kicks fire a damped radial wave; idle synthetic
    // pulses keep the body breathing.
    float dh = drumhead(dC, r);

    // Pinch-off proto-droplets — three roving bumps that grow/shrink on
    // the rim, simulating spikes about to detach.
    float drops = dropletBumps(theta, r, R, t);

    // Effective rim displacement and SDF.
    float Reff = Rasym + profile * ampNow + capChop * sin(theta * 22.0 + t * 6.0)
                 + chop + drops;
    float d    = r - Reff + dh;

    // Section-3 special: body collapses toward a small droplet then reforms
    // (handled implicitly via R_base shrinkage in kodamaState).

    // === COLOR ===
    vec3 col = vec3(0.0);

    // ----- ATTENTION ANCHOR — always-on warm dim core. Eye's home base. -----
    {
        float anchorR = 0.030 + 0.006 * sin(t * 0.30);
        float dr = length(p - bodyC);
        col += vec3(0.32, 0.16, 0.06) * exp(-pow(dr / anchorR, 2.0)) * 0.45;
    }

    // ----- OUTSIDE BODY — substrate + faint warm field bloom -----
    if (d > 0.0) {
        // Substrate: dark warm graphite. Never pure black. Slight radial
        // gradient so the piece doesn't feel like a black void.
        float distC = length(p - bodyC);
        col += vec3(0.022, 0.014, 0.010) * (1.0 - 0.6 * smoothstep(0.30, 1.0, distC));
        // Faint warm bloom keyed to local field magnitude.
        vec4 fHere = texture(u_field_state, uv);
        float phiHere = fHere.r;
        col += vec3(0.42, 0.20, 0.07)
             * pow(saturate(abs(phiHere) * 0.55), 1.6)
             * 0.34
             * smoothstep(0.40, 0.18, distC);

        // Substrate field streamers — fbm-warped warm streaks in the band
        // just outside the body, oriented loosely along the field gradient.
        // Reads as "the magnetic field has texture, you're seeing it leak".
        // Gated to a narrow halo band and to active-field regions only so
        // it never overwhelms the body silhouette.
        if (distC < 0.55 && distC > Rasym * 0.95) {
            vec2 fGrad = fHere.gb;
            float gAng = atan(fGrad.y, fGrad.x + 1e-6);
            vec2 along = rot2d(-gAng) * ((p - bodyC) * 5.0);
            float streamer = fbm(along + vec2(t * 0.18, 0.0));
            streamer = pow(saturate(streamer * 1.5 - 0.55), 1.8);
            float bandFade = smoothstep(0.55, Rasym * 0.95, distC)
                           * (1.0 - smoothstep(0.60, 0.95, distC / 0.55));
            float fStr = pow(saturate(abs(phiHere) * 0.7), 1.4);
            col += vec3(0.85, 0.45, 0.16) * streamer * fStr * bandFade * 0.55;
        }
    } else {
        // ----- INSIDE BODY — Kodama discipline -----
        // Body base: matte black with hint of warm bias. NO fire, NO inner
        // glow, NO chrome. Load-bearing visual contract.
        vec3 body = vec3(0.012, 0.008, 0.006);
        col = body;

        // Surface depth tint: deeper into the body fades to slightly warmer.
        float depth = saturate(-d / R);  // 0 at rim, 1 deep in
        col += vec3(0.040, 0.022, 0.014) * pow(depth, 0.6) * 0.7;

        // Reconstruct a 2.5D surface normal from the rim's local spike
        // geometry. dProfile/dtheta gives the tangential slope along the
        // rim. We also add a small radial component proportional to the
        // local profile height (so spike *shafts* tilt outward → flanks
        // catch light differently from the apex).
        float dProfile_dtheta = (
            spikeProfile(theta + 0.02, spikePhase, spikeCount, p, ampNow * 6.0)
          - spikeProfile(theta - 0.02, spikePhase, spikeCount, p, ampNow * 6.0)
        ) / 0.04;
        float dh_dtheta = dProfile_dtheta * ampNow;
        // Tangential slope contribution: tilts N around the rim.
        // Radial slope contribution: at peak profile, N points slightly
        // outward — but ONLY near the rim, otherwise the constant-along-
        // theta term creates visible radial "spokes" across the body
        // interior. Depth falloff: slope only fires when within ~25% of
        // the rim from outside.
        float rimBand    = smoothstep(R * 0.65, R, r);   // 1 near rim, 0 deep
        float radialSlope = profile * ampNow * 7.0 * rimBand;
        // Tangential slope also fades with depth — same reason.
        float tangSlope  = dh_dtheta * rimBand;
        vec3 N = normalize(vec3(
            -tangSlope * (-sin(theta)) + radialSlope * cos(theta),
            -tangSlope * ( cos(theta)) + radialSlope * sin(theta),
             1.0
        ) + vec3(1e-6));

        // Axial tangent T — projection of +z onto tangent plane (Kajiya-Kay).
        vec3 T = normalize(vec3(-N.z * N.x, -N.z * N.y, 1.0 - N.z * N.z) + vec3(1e-6));

        // Light direction — warm sodium key.
        vec3 L = normalize(vec3(0.45, 0.30, 0.84));
        vec3 V = vec3(0.0, 0.0, 1.0);

        // Kajiya-Kay primary line highlight along axial tangent.
        float TdotL = dot(T, L);
        float TdotV = dot(T, V);
        float sinTL = sqrt(max(1.0 - TdotL * TdotL, 0.0));
        float sinTV = sqrt(max(1.0 - TdotV * TdotV, 0.0));
        float kkPrimary = pow(max(sinTL * sinTV - TdotL * TdotV, 0.0), 80.0);

        // Marschner cuticle-tilt secondary highlight (5° toward N, weight 0.5).
        vec3 Tshift = normalize(T + 0.09 * N);
        float TsdotL = dot(Tshift, L);
        float TsdotV = dot(Tshift, V);
        float sinTsL = sqrt(max(1.0 - TsdotL * TsdotL, 0.0));
        float sinTsV = sqrt(max(1.0 - TsdotV * TsdotV, 0.0));
        float kkSecondary = pow(max(sinTsL * sinTsV - TsdotL * TsdotV, 0.0), 30.0);

        // Apex kill — real spikes are MATTE BLACK at the very tip; specular
        // peaks 30° off-axis on the FLANK. The single move that defeats the
        // CGI fire-sun tell. Use n.z as a flatness proxy: high n.z = apex
        // (or smooth area) = kill spec.
        float flankMask = 1.0 - smoothstep(0.92, 0.99, N.z);

        // Tip boost — flanks of taller spikes catch more light.
        float tipBoost = 0.6 + 1.4 * smoothstep(0.0, 0.5, profile);

        // Schlick Fresnel against warm sodium-orange env.
        float ndv = max(dot(N, V), 0.0);
        float F0 = 0.04;
        float F  = F0 + (1.0 - F0) * pow(1.0 - ndv, 5.0);

        vec3 envWarm = vec3(1.85, 0.95, 0.34);
        vec3 envFill = vec3(0.32, 0.16, 0.07);
        vec3 env = mix(envFill, envWarm,
                       smoothstep(0.0, 1.0, reflect(-V, N).y * 0.5 + 0.5));

        // Compose: Kajiya-Kay primary + Marschner secondary, gated by
        // flank mask and tip boost, modulated by Fresnel against env.
        // Cranked amplitudes — body needed more presence than v4-initial gave.
        vec3 spec = (3.6 * kkPrimary + 1.4 * kkSecondary) * tipBoost * flankMask
                  * env * F;
        col += spec;

        // Soft Fresnel sheen across the whole body — adds a bit of warm
        // presence so the interior reads as "wet metal" instead of "matte
        // void". Stays inside Kodama discipline because amplitude is low
        // and color comes from env (not the fluid). Wider falloff (1.5)
        // so the sheen reaches into the interior, not just the rim.
        float sheen = pow(1.0 - ndv, 1.5);
        col += env * sheen * 0.32 * F;
        // Plus a tiny constant warm "fluid is wet" tone — vanishingly
        // small, just enough to lift the body off pure black.
        col += vec3(0.040, 0.018, 0.008) * (1.0 - depth * 0.4);

        // BASS-DRIVEN INTERIOR WARMTH — body interior brightens with bass.
        // The music's loudness IS the body's heat. Caps modestly so the
        // dark-interior contract holds at silent moments.
        col += vec3(0.55, 0.26, 0.10) * u_audio_bass * 0.22 * (1.0 - depth * 0.5);

        // ----- IRIDESCENCE — warm-only, ridge-only, low amplitude -----
        // Cosmetic-toy oil-film effect. Blue knocked down 60%.
        if (profile > 0.20) {
            float curvatureMask = smoothstep(0.20, 0.55, profile);
            float opd = 2.0 * 1.30 * (180.0 + 340.0 * profile) * ndv;
            vec3 k = vec3(6.2832 / 620.0, 6.2832 / 580.0, 6.2832 / 540.0);
            vec3 iri = 0.5 + 0.5 * cos(k * opd + vec3(0.0, 0.6, 1.2));
            iri = pow(iri, vec3(2.0));
            iri.b *= 0.4;  // warm-bias enforcement
            col += spec * iri * curvatureMask * 0.50;
        }
    }

    // ----- BODY-RIM EMBER — narrow warm tell INSIDE silhouette edge -----
    if (d <= 0.0 && d > -0.014) {
        float rim = exp(-pow((d + 0.006) / 0.006, 2.0));
        col += vec3(0.95, 0.45, 0.16) * rim * 0.85;
    }

    // ----- BASS GLOW — soft warm halo that breathes with bass envelope -----
    // Single smooth field that scales with bass — not a beat-locked pulse.
    // The music PRESENT in the visuals: louder bass = bigger warm glow
    // around the body, quieter bass = it recedes.
    {
        float distC = length(p - bodyC);
        float reach = R * 1.4 + 0.45 * u_audio_bass;
        float bassGlow = u_audio_bass * exp(-pow(distC / reach, 1.8));
        col += vec3(0.42, 0.20, 0.07) * bassGlow * 0.70;
    }

    // ----- DOWNBEAT RING — once per bar (1.95s @ 123 BPM), the only
    // metronomic-on-purpose element. Anchors rhythm without aggression. -----
    {
        float ringR = R + 0.018 + (1.0 - u_downbeat) * 0.55;
        float dr = abs(length(p - bodyC) - ringR);
        col += vec3(1.10, 0.55, 0.18) * smoothstep(0.010, 0.0, dr) * u_downbeat * 0.75;
    }

    // ----- CURSOR HALO — warm spot when cursor active -----
    if (mouseActive) {
        vec2 dM = p - cw;
        float halo = exp(-dot(dM, dM) * 38.0);
        col += vec3(0.95, 0.50, 0.22) * halo * 0.32;
    }

    // ----- KEYBOARD GLOW — single accumulated warm halo at body -----
    float keyAccum = 0.0;
    for (int i = 0; i < 15; i++) {
        keyAccum += 0.55 * u_key_event[i] + 0.16 * u_keys_visual[i];
    }
    if (keyAccum > 0.001) {
        float halo = exp(-dot(p - bodyC, p - bodyC) * 18.0);
        col += vec3(0.92, 0.50, 0.20) * halo * keyAccum * 0.32;
    }

    // ----- SECTION-3 HUSH — desaturate during the 5s breakdown -----
    if (u_section_id == 3) {
        float lum = dot(col, vec3(0.30, 0.59, 0.11));
        col = mix(col, vec3(lum), 0.40 * (0.7 - 0.5 * abs(u_section_progress - 0.5)));
    }

    // ----- TONE + FINISH -----
    col = reinhardPartial(col, 4.5);
    float vig = smoothstep(1.55, 0.40, length(p));
    col *= mix(0.62, 1.0, vig);
    col = pow(col, vec3(0.92));

    // Song-progress warmth nudge — peak section reads slightly warmer overall.
    col.r *= mix(0.97, 1.05, u_song_progress);
    col.b *= mix(1.03, 0.95, u_song_progress);

    fragColor = vec4(col, 1.0);
}
