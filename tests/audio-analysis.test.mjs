// ABOUTME: Unit tests for studio/audio-analysis.mjs — JSON parsing, time→uniform
// ABOUTME: sampling, downbeat-pulse decay, default zero-state.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as audioAnalysis from '../studio/audio-analysis.mjs';

const FIXTURE = {
    version: 1,
    duration_sec: 6.0,
    bpm: 120.0,
    beats: [0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5],
    downbeats: [0.0, 2.0, 4.0],
    sections: [
        { start: 0.0, end: 2.0, label: 'intro', energy: 0.2 },
        { start: 2.0, end: 6.0, label: 'drop', energy: 0.9 },
    ],
    energy_envelope: { hz: 100, values: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6] },
    stems: {
        bass: { hz: 100, rms: [1.0, 0.5, 0.0, 0.0, 0.0, 0.0] },
    },
    key: { tonic: 'A', mode: 'minor', confidence: 0.75 },
};

test('parse accepts valid JSON', () => {
    const a = audioAnalysis.parse(FIXTURE);
    assert.ok(a);
    assert.equal(a.bpm, 120);
    assert.equal(a.sections.length, 2);
});

test('parse rejects wrong version', () => {
    assert.equal(audioAnalysis.parse({ ...FIXTURE, version: 2 }), null);
});

test('parse rejects missing required fields', () => {
    assert.equal(audioAnalysis.parse({ version: 1 }), null);
    assert.equal(audioAnalysis.parse(null), null);
});

test('sample at t=0 returns first-section + first-beat state', () => {
    const a = audioAnalysis.parse(FIXTURE);
    const state = audioAnalysis.createSampleState();
    const s = audioAnalysis.sample(a, 0.0, state, 1 / 60);
    assert.equal(s.u_section_id, 0);
    assert.equal(s.u_section_label, 1);  // intro
    assert.equal(s.u_beat_index, 0);
    assert.equal(s.u_bar_index, 0);
    assert.ok(s.u_beat_phase < 0.05);
    assert.ok(s.u_song_progress < 0.05);
    assert.equal(s.u_bpm, 120);
});

test('sample at t in mid-beat returns u_beat_phase ~ 0.5', () => {
    const a = audioAnalysis.parse(FIXTURE);
    const state = audioAnalysis.createSampleState();
    const s = audioAnalysis.sample(a, 0.25, state, 1 / 60);  // halfway between beat 0 and 1
    assert.ok(Math.abs(s.u_beat_phase - 0.5) < 0.05, `expected ~0.5, got ${s.u_beat_phase}`);
});

test('sample at t in second section returns drop label', () => {
    const a = audioAnalysis.parse(FIXTURE);
    const state = audioAnalysis.createSampleState();
    const s = audioAnalysis.sample(a, 3.0, state, 1 / 60);
    assert.equal(s.u_section_id, 1);
    assert.equal(s.u_section_label, 6);  // drop
    assert.equal(s.u_to_section_change, 3.0);  // 6.0 - 3.0
    assert.ok(Math.abs(s.u_section_progress - 0.25) < 0.01);  // (3-2)/(6-2) = 0.25
});

test('downbeat pulse fires at 1.0 when crossing a new downbeat', () => {
    const a = audioAnalysis.parse(FIXTURE);
    const state = audioAnalysis.createSampleState();
    // First sample at t=0.5 fires downbeat at index 0 (t=0.0).
    const s1 = audioAnalysis.sample(a, 0.5, state, 1 / 60);
    assert.equal(s1.u_downbeat, 1.0);
    assert.equal(state.lastDownbeatIndex, 0);
    // Many frames later still in same bar — decays.
    for (let i = 0; i < 30; i++) audioAnalysis.sample(a, 0.5 + i * 0.01, state, 1 / 60);
    assert.ok(state.downbeatPulse < 0.9);
    // Crossing into the next bar (downbeat index 1 at t=2.0) fires again.
    const s2 = audioAnalysis.sample(a, 2.01, state, 1 / 60);
    assert.equal(s2.u_downbeat, 1.0);
    assert.equal(state.lastDownbeatIndex, 1);
});

test('downbeat pulse decays over multiple frames', () => {
    const a = audioAnalysis.parse(FIXTURE);
    const state = audioAnalysis.createSampleState();
    audioAnalysis.sample(a, 0.5, state, 1 / 60);
    const fresh = state.downbeatPulse;
    // 5 more frames at 1/60s, no new downbeat
    for (let i = 0; i < 5; i++) audioAnalysis.sample(a, 0.5 + i * 0.01, state, 1 / 60);
    assert.ok(state.downbeatPulse < fresh, `expected decay, got ${fresh} → ${state.downbeatPulse}`);
});

test('null analysis returns DEFAULT_SAMPLE (all zeros / -1)', () => {
    const state = audioAnalysis.createSampleState();
    const s = audioAnalysis.sample(null, 1.5, state, 1 / 60);
    assert.equal(s.u_bpm, 0);
    assert.equal(s.u_section_id, -1);
    assert.equal(s.u_key_tonic, -1);
    assert.equal(s.u_song_progress, 0);
});

test('key tonic and mode map correctly', () => {
    const a = audioAnalysis.parse(FIXTURE);
    const state = audioAnalysis.createSampleState();
    const s = audioAnalysis.sample(a, 0.0, state, 1 / 60);
    assert.equal(s.u_key_tonic, 9);   // A
    assert.equal(s.u_key_mode, 1);    // minor
});

test('per-stem RMS samples interpolated correctly', () => {
    const a = audioAnalysis.parse(FIXTURE);
    const state = audioAnalysis.createSampleState();
    // bass: [1.0, 0.5, 0.0, ...] at 100Hz; t=0.005 (mid-bin) should be ~0.75
    const s = audioAnalysis.sample(a, 0.005, state, 1 / 60);
    assert.ok(Math.abs(s.u_audio_bass_stem - 0.75) < 0.01,
              `expected interpolation ~0.75, got ${s.u_audio_bass_stem}`);
});

test('u_song_progress reaches ~1.0 near track end', () => {
    const a = audioAnalysis.parse(FIXTURE);
    const state = audioAnalysis.createSampleState();
    const s = audioAnalysis.sample(a, 5.99, state, 1 / 60);
    assert.ok(s.u_song_progress > 0.99);
});
