// ABOUTME: Keyboard-as-MIDI synth — a..l = white keys C4..D5, ADSR sawtooth+sine
// ABOUTME: voicing routed through a convolver reverb. Exposes per-key envelope
// ABOUTME: state and just-pressed pulses for shader uniforms (u_keys, u_key_event).

const KEY_ORDER = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
const KEY_TO_MIDI = {
    a: 60,   // C4
    s: 62,   // D4
    d: 64,   // E4
    f: 65,   // F4
    g: 67,   // G4
    h: 69,   // A4
    j: 71,   // B4
    k: 72,   // C5
    l: 74,   // D5
};

function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

function makeReverbImpulse(audioCtx, durationSec = 2.4, decay = 2.0) {
    const sr = audioCtx.sampleRate;
    const len = Math.floor(sr * durationSec);
    const buf = audioCtx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
        const data = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) {
            // White noise tail with exponential decay; a touch of stereo
            // decorrelation between channels gives the reverb a width.
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
                    * (ch === 0 ? 1.0 : 0.92);
        }
    }
    return buf;
}

export function createKeyboardSynth(audioCtx) {
    // Master output chain: per-note voices feed both a dry path and a reverb
    // send. The reverb's convolver impulse is synthesised noise (no asset
    // file required), ~2.4s tail.
    const masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.55;
    masterGain.connect(audioCtx.destination);

    const dryGain = audioCtx.createGain();
    dryGain.gain.value = 0.62;
    dryGain.connect(masterGain);

    const reverbSend = audioCtx.createGain();
    reverbSend.gain.value = 0.55;
    const convolver = audioCtx.createConvolver();
    convolver.buffer = makeReverbImpulse(audioCtx, 2.4, 2.0);
    reverbSend.connect(convolver);
    const wetGain = audioCtx.createGain();
    wetGain.gain.value = 0.85;
    convolver.connect(wetGain);
    wetGain.connect(masterGain);

    const activeVoices = new Map();   // key → { osc1, osc2, env, filter, releaseT }
    const envelopes = new Float32Array(KEY_ORDER.length);  // 0..1 per key
    const events    = new Float32Array(KEY_ORDER.length);  // pulse on press, decays
    let lastTickT = audioCtx.currentTime;

    function startNote(key) {
        const midi = KEY_TO_MIDI[key];
        if (midi === undefined) return;
        if (activeVoices.has(key)) return;  // ignore retrigger while held

        const freq = midiToFreq(midi);
        const now = audioCtx.currentTime;

        // Two oscillators slightly detuned for body. Saw is the primary
        // tone; sine adds warmth + low-end without aliasing.
        const osc1 = audioCtx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.value = freq;
        osc1.detune.value = -3;
        const osc2 = audioCtx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = freq;
        osc2.detune.value = +3;

        // Lowpass for warmth — closer to a Rhodes than a synth lead.
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2400;
        filter.Q.value = 0.6;

        const env = audioCtx.createGain();
        env.gain.value = 0;
        env.gain.cancelScheduledValues(now);
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(0.32, now + 0.012);   // attack
        env.gain.linearRampToValueAtTime(0.18, now + 0.16);    // decay → sustain

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(env);
        env.connect(dryGain);
        env.connect(reverbSend);

        osc1.start(now);
        osc2.start(now);

        activeVoices.set(key, { osc1, osc2, env, filter });

        const idx = KEY_ORDER.indexOf(key);
        if (idx >= 0) events[idx] = 1.0;
    }

    function releaseNote(key) {
        const v = activeVoices.get(key);
        if (!v) return;
        const now = audioCtx.currentTime;
        v.env.gain.cancelScheduledValues(now);
        // Hold whatever the env is at, then ramp to 0 over ~0.45s. Stop
        // oscillators a little after the ramp ends so the reverb tail can
        // ring out without clicking.
        v.env.gain.setValueAtTime(v.env.gain.value || 0.18, now);
        v.env.gain.linearRampToValueAtTime(0.0, now + 0.45);
        v.osc1.stop(now + 0.55);
        v.osc2.stop(now + 0.55);
        activeVoices.delete(key);
    }

    function update() {
        // JS-side envelope mirror — used purely for shader uniforms. Tracks
        // the perceived loudness rather than reading from Web Audio (whose
        // `gain.value` lags during automation ramps).
        const now = audioCtx.currentTime;
        const dt = Math.max(0, Math.min(0.1, now - lastTickT));
        lastTickT = now;
        for (let i = 0; i < KEY_ORDER.length; i++) {
            const key = KEY_ORDER[i];
            const stillActive = activeVoices.has(key);
            if (stillActive) {
                envelopes[i] = Math.min(1.0, envelopes[i] + dt * 7);  // ~140ms to full
            } else {
                envelopes[i] *= Math.pow(0.001, dt / 0.55);  // ~half-life decay
                if (envelopes[i] < 1e-4) envelopes[i] = 0;
            }
            events[i] *= 0.86;
            if (events[i] < 1e-3) events[i] = 0;
        }
    }

    function releaseAll() {
        for (const key of [...activeVoices.keys()]) releaseNote(key);
    }

    return {
        keyOrder: KEY_ORDER,
        keyToMidi: KEY_TO_MIDI,
        envelopes,
        events,
        startNote,
        releaseNote,
        releaseAll,
        update,
    };
}
