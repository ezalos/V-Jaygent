// ABOUTME: Maps an audio.analysis.json + current playback time to the song-level
// ABOUTME: uniforms (u_bpm, u_beat_phase, u_section_id, u_*_stem, u_key_*, etc).
// ABOUTME: Schema in brainstorming/techniques/using-lib.md §"audio analysis JSON contract".

const SECTION_LABEL_TO_ID = {
    unknown: 0, intro: 1, verse: 2, chorus: 3,
    breakdown: 4, build: 5, drop: 6, outro: 7,
};

const PITCH_CLASS_TO_ID = {
    C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4,
    F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9,
    'A#': 10, Bb: 10, B: 11,
};

// Default zero-state when no analysis is loaded.
export const DEFAULT_SAMPLE = {
    u_bpm: 0,
    u_beat_phase: 0,
    u_bar_phase: 0,
    u_beat_index: 0,
    u_bar_index: 0,
    u_downbeat: 0,
    u_section_id: -1,
    u_section_label: 0,           // unknown
    u_section_progress: 0,
    u_to_section_change: 0,
    u_song_progress: 0,
    u_energy_smooth: 0,
    u_audio_bass_stem: 0,
    u_audio_drums_stem: 0,
    u_audio_other_stem: 0,
    u_audio_vocals_stem: 0,
    u_key_tonic: -1,              // -1 = no key info
    u_key_mode: 0,
};

// Validate + normalize an analysis JSON. Returns null if invalid.
export function parse(json) {
    if (!json || typeof json !== 'object') return null;
    if (json.version !== 1) return null;
    if (typeof json.duration_sec !== 'number' || json.duration_sec <= 0) return null;
    if (typeof json.bpm !== 'number' || json.bpm <= 0) return null;
    if (!Array.isArray(json.beats)) return null;
    if (!Array.isArray(json.downbeats)) return null;
    if (!Array.isArray(json.sections)) return null;
    if (!json.energy_envelope || typeof json.energy_envelope.hz !== 'number'
        || !Array.isArray(json.energy_envelope.values)) return null;

    return {
        version: json.version,
        durationSec: json.duration_sec,
        bpm: json.bpm,
        beats: json.beats,
        downbeats: json.downbeats,
        sections: json.sections.map((s) => ({
            start: Number(s.start),
            end: Number(s.end),
            label: String(s.label ?? 'unknown').toLowerCase(),
            energy: Number(s.energy ?? 0),
        })),
        envelope: {
            hz: json.energy_envelope.hz,
            values: json.energy_envelope.values,
        },
        stems: json.stems ?? {},
        key: json.key ?? null,
    };
}

// Binary search for the largest index i such that arr[i] <= t.
// Returns -1 if t < arr[0]. Linear fallback for short arrays (~< 8 entries).
function lowerBound(arr, t) {
    if (arr.length === 0 || t < arr[0]) return -1;
    let lo = 0, hi = arr.length - 1;
    while (lo < hi) {
        const mid = (lo + hi + 1) >>> 1;
        if (arr[mid] <= t) lo = mid;
        else hi = mid - 1;
    }
    return lo;
}

// Sample the smoothed envelope at a continuous time. Linear interpolation.
function sampleEnvelope(env, t) {
    if (!env.values.length) return 0;
    const idxF = t * env.hz;
    const i = Math.floor(idxF);
    if (i < 0) return env.values[0];
    if (i >= env.values.length - 1) return env.values[env.values.length - 1];
    const frac = idxF - i;
    return env.values[i] * (1 - frac) + env.values[i + 1] * frac;
}

function sampleStem(stem, t) {
    if (!stem || !Array.isArray(stem.rms) || stem.rms.length === 0) return 0;
    const idxF = t * (stem.hz ?? 100);
    const i = Math.floor(idxF);
    if (i < 0) return stem.rms[0];
    if (i >= stem.rms.length - 1) return stem.rms[stem.rms.length - 1];
    const frac = idxF - i;
    return stem.rms[i] * (1 - frac) + stem.rms[i + 1] * frac;
}

// Track downbeat pulse decay across frames. Caller maintains the state.
// Returns a new pulse value given the previous value, dt, and whether a
// downbeat was crossed since the last sample.
export function decayPulse(prev, dt, hit, decayPerFrame = 0.85) {
    let p = prev * Math.pow(decayPerFrame, dt * 60);  // normalize to ~60fps decay
    if (hit) p = 1.0;
    return Math.max(0, Math.min(1, p));
}

// Sample all song-level uniforms for the given playback time.
// `state` is caller-maintained (carries downbeat pulse decay across frames):
//   { lastDownbeatIndex: -1, downbeatPulse: 0 }
export function sample(analysis, t, state, dt) {
    const out = { ...DEFAULT_SAMPLE };
    if (!analysis) return out;

    out.u_bpm = analysis.bpm;
    out.u_song_progress = Math.max(0, Math.min(1, t / Math.max(1e-6, analysis.durationSec)));
    out.u_energy_smooth = sampleEnvelope(analysis.envelope, t);

    // beats / bars
    const beatIdx = lowerBound(analysis.beats, t);
    if (beatIdx >= 0) {
        const beatStart = analysis.beats[beatIdx];
        const beatEnd = analysis.beats[beatIdx + 1] ?? (beatStart + 60 / Math.max(1, analysis.bpm));
        const beatLen = Math.max(1e-6, beatEnd - beatStart);
        out.u_beat_phase = Math.max(0, Math.min(1, (t - beatStart) / beatLen));
        out.u_beat_index = beatIdx;
    }

    // downbeats
    const dbIdx = lowerBound(analysis.downbeats, t);
    let dbHit = false;
    if (dbIdx >= 0) {
        const dbStart = analysis.downbeats[dbIdx];
        const dbEnd = analysis.downbeats[dbIdx + 1] ?? analysis.durationSec;
        const dbLen = Math.max(1e-6, dbEnd - dbStart);
        out.u_bar_phase = Math.max(0, Math.min(1, (t - dbStart) / dbLen));
        out.u_bar_index = dbIdx;
        if (state.lastDownbeatIndex !== dbIdx) {
            dbHit = true;
            state.lastDownbeatIndex = dbIdx;
        }
    }
    state.downbeatPulse = decayPulse(state.downbeatPulse, dt, dbHit);
    out.u_downbeat = state.downbeatPulse;

    // sections
    const sectionIdx = analysis.sections.findIndex((s) => t >= s.start && t < s.end);
    if (sectionIdx >= 0) {
        const s = analysis.sections[sectionIdx];
        const len = Math.max(1e-6, s.end - s.start);
        out.u_section_id = sectionIdx;
        out.u_section_label = SECTION_LABEL_TO_ID[s.label] ?? 0;
        out.u_section_progress = Math.max(0, Math.min(1, (t - s.start) / len));
        out.u_to_section_change = Math.max(0, s.end - t);
    }

    // stems
    if (analysis.stems) {
        out.u_audio_bass_stem = sampleStem(analysis.stems.bass, t);
        out.u_audio_drums_stem = sampleStem(analysis.stems.drums, t);
        out.u_audio_other_stem = sampleStem(analysis.stems.other, t);
        out.u_audio_vocals_stem = sampleStem(analysis.stems.vocals, t);
    }

    // key
    if (analysis.key && typeof analysis.key.tonic === 'string') {
        const tonicId = PITCH_CLASS_TO_ID[analysis.key.tonic];
        if (typeof tonicId === 'number') out.u_key_tonic = tonicId;
        out.u_key_mode = analysis.key.mode === 'minor' ? 1 : 0;
    }

    return out;
}

// Caller-side state factory.
export function createSampleState() {
    return { lastDownbeatIndex: -1, downbeatPulse: 0 };
}
