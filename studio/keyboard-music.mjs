// ABOUTME: Keyboard-as-MIDI synth — a..l = white keys C4..D5, ADSR sawtooth+sine
// ABOUTME: voicing routed through a convolver reverb. Exposes per-key envelope
// ABOUTME: state and just-pressed pulses for shader uniforms (u_keys, u_key_event).

// Indices 0-8: white keys a..l (C4..D5).
// Indices 9-14: black keys w e t y u o (C#4, D#4, F#4, G#4, A#4, C#5),
// each sitting between its two white neighbours on the QWERTY row.
// Black keys are appended after the whites so existing 9-uniform shader
// loops still address the white set as the bottom of the array; new
// shaders that want black keys iterate the full 15.
const KEY_ORDER = [
    'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l',
    'w', 'e', 't', 'y', 'u', 'o',
];
const KEY_TO_MIDI = {
    // White keys
    a: 60,   // C4
    s: 62,   // D4
    d: 64,   // E4
    f: 65,   // F4
    g: 67,   // G4
    h: 69,   // A4
    j: 71,   // B4
    k: 72,   // C5
    l: 74,   // D5
    // Black keys (sharps/flats)
    w: 61,   // C#4 — between a (C4) and s (D4)
    e: 63,   // D#4 — between s (D4) and d (E4)
    t: 66,   // F#4 — between f (F4) and g (G4)
    y: 68,   // G#4 — between g (G4) and h (A4)
    u: 70,   // A#4 — between h (A4) and j (B4)
    o: 73,   // C#5 — between k (C5) and l (D5)
};

function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

// Four instrument presets selectable via 1/2/3/4. Each defines voicing
// (oscillator types + detune), filter, ADSR shape, and reverb send.
const INSTRUMENTS = {
    organ: {
        name: 'organ',
        types: ['sawtooth', 'sine'],
        detune: [-3, +3],
        filterFreq: 2400, filterQ: 0.6,
        attack: 0.012, decayTo: 0.18, decayT: 0.16, releaseT: 0.45,
        peak: 0.32, reverbAmt: 0.55,
    },
    pluck: {
        name: 'pluck',
        types: ['triangle', 'sawtooth'],
        detune: [0, +7],
        filterFreq: 3600, filterQ: 1.4,
        attack: 0.002, decayTo: 0.04, decayT: 0.18, releaseT: 0.20,
        peak: 0.45, reverbAmt: 0.30,
    },
    pad: {
        name: 'pad',
        types: ['sawtooth', 'sawtooth'],
        detune: [-7, +7],
        filterFreq: 1700, filterQ: 0.7,
        attack: 0.40,  decayTo: 0.22, decayT: 0.50, releaseT: 1.00,
        peak: 0.30, reverbAmt: 0.85,
    },
    bell: {
        name: 'bell',
        types: ['triangle', 'sine'],
        detune: [0, +1200],   // an octave up — bell-like upper partial
        filterFreq: 5200, filterQ: 0.5,
        attack: 0.001, decayTo: 0.0, decayT: 0.50, releaseT: 0.35,
        peak: 0.40, reverbAmt: 0.65,
    },
};
const INSTRUMENT_ORDER = ['organ', 'pluck', 'pad', 'bell'];

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

    const activeVoices = new Map();   // key → { osc1, osc2, env, filter }
    const envelopes = new Float32Array(KEY_ORDER.length);  // 0..1 per key, 15 entries
    const events    = new Float32Array(KEY_ORDER.length);  // pulse on press, decays
    let lastTickT = audioCtx.currentTime;
    let octaveOffset = 0;
    let currentInstrument = 'organ';

    // Per-instrument reverb-send gain. The send node itself feeds the
    // shared convolver; the reverbSend amount per instrument is applied
    // when patching each new voice (so a switch of instrument doesn't
    // affect already-held notes' wetness).
    function reverbAmount() { return INSTRUMENTS[currentInstrument].reverbAmt; }

    // Looper state. ['empty', 'recording', 'overdubbing', 'playing'] cycle
    // via the `[` key. Events stored as { tBar, type: 'down'|'up', key }
    // where tBar is seconds-since-record-start. Playback re-fires events
    // each loop cycle. Loop length set by first record's duration.
    const looper = {
        state: 'empty',
        events: [],                 // recorded events
        recordStart: 0,
        loopLen: 0,
        playStart: 0,
        playIdx: 0,
        markedKeys: new Set(),      // keys triggered by playback (vs human)
    };

    function startNote(key, opts = {}) {
        const midi = KEY_TO_MIDI[key];
        if (midi === undefined) return;
        if (activeVoices.has(key)) return;  // ignore retrigger while held

        const inst = INSTRUMENTS[currentInstrument] ?? INSTRUMENTS.organ;
        const freq = midiToFreq(midi + octaveOffset);
        const now = audioCtx.currentTime;

        // Two oscillators with per-instrument types and detune.
        const osc1 = audioCtx.createOscillator();
        osc1.type = inst.types[0];
        osc1.frequency.value = freq;
        osc1.detune.value = inst.detune[0];
        const osc2 = audioCtx.createOscillator();
        osc2.type = inst.types[1];
        osc2.frequency.value = freq;
        osc2.detune.value = inst.detune[1];

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = inst.filterFreq;
        filter.Q.value = inst.filterQ;

        const env = audioCtx.createGain();
        env.gain.value = 0;
        env.gain.cancelScheduledValues(now);
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(inst.peak,    now + inst.attack);
        env.gain.linearRampToValueAtTime(inst.decayTo, now + inst.attack + inst.decayT);

        // Per-voice reverb-send fan-out so changing instrument later doesn't
        // retroactively alter wetness on held notes.
        const wetTap = audioCtx.createGain();
        wetTap.gain.value = inst.reverbAmt;

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(env);
        env.connect(dryGain);
        env.connect(wetTap);
        wetTap.connect(reverbSend);

        osc1.start(now);
        osc2.start(now);

        activeVoices.set(key, { osc1, osc2, env, filter, wetTap, releaseT: inst.releaseT });

        const idx = KEY_ORDER.indexOf(key);
        if (idx >= 0) events[idx] = 1.0;

        // Recorder taps every keypress — only HUMAN events (not playback)
        // get recorded so playback isn't doubled.
        if ((looper.state === 'recording' || looper.state === 'overdubbing') && !opts.fromLoop) {
            const tBar = (now - looper.recordStart);
            looper.events.push({ t: tBar, type: 'down', key });
        }
    }

    function releaseNote(key, opts = {}) {
        const v = activeVoices.get(key);
        if (!v) return;
        const now = audioCtx.currentTime;
        const releaseT = v.releaseT ?? 0.45;
        v.env.gain.cancelScheduledValues(now);
        v.env.gain.setValueAtTime(v.env.gain.value || 0.18, now);
        v.env.gain.linearRampToValueAtTime(0.0, now + releaseT);
        v.osc1.stop(now + releaseT + 0.10);
        v.osc2.stop(now + releaseT + 0.10);
        activeVoices.delete(key);

        if ((looper.state === 'recording' || looper.state === 'overdubbing') && !opts.fromLoop) {
            const tBar = (now - looper.recordStart);
            looper.events.push({ t: tBar, type: 'up', key });
        }
    }

    function update() {
        const now = audioCtx.currentTime;
        const dt = Math.max(0, Math.min(0.1, now - lastTickT));
        lastTickT = now;

        // Looper tick — drive playback events that are due THIS frame.
        if (looper.state === 'playing' || looper.state === 'overdubbing') {
            const elapsed = now - looper.playStart;
            const cycle = (looper.loopLen > 0) ? Math.floor(elapsed / looper.loopLen) : 0;
            const phase = (looper.loopLen > 0) ? (elapsed - cycle * looper.loopLen) : 0;
            // On wrap, reset playIdx
            if (cycle !== looper._lastCycle) {
                looper._lastCycle = cycle;
                looper.playIdx = 0;
                // Force-release any keys still held by playback so the next
                // cycle's note-downs aren't ignored as duplicate triggers.
                for (const k of [...looper.markedKeys]) {
                    releaseNote(k, { fromLoop: true });
                    looper.markedKeys.delete(k);
                }
            }
            while (looper.playIdx < looper.events.length
                   && looper.events[looper.playIdx].t <= phase) {
                const ev = looper.events[looper.playIdx];
                if (ev.type === 'down') { startNote(ev.key, { fromLoop: true }); looper.markedKeys.add(ev.key); }
                else                    { releaseNote(ev.key, { fromLoop: true }); looper.markedKeys.delete(ev.key); }
                looper.playIdx++;
            }
        }

        // Envelope mirror for shader uniforms.
        for (let i = 0; i < KEY_ORDER.length; i++) {
            const key = KEY_ORDER[i];
            const stillActive = activeVoices.has(key);
            if (stillActive) {
                envelopes[i] = Math.min(1.0, envelopes[i] + dt * 7);
            } else {
                envelopes[i] *= Math.pow(0.001, dt / 0.55);
                if (envelopes[i] < 1e-4) envelopes[i] = 0;
            }
            events[i] *= 0.86;
            if (events[i] < 1e-3) events[i] = 0;
        }
    }

    function setInstrument(name) {
        if (!INSTRUMENTS[name]) return;
        currentInstrument = name;
    }

    function cycleInstrument(delta = 1) {
        const idx = INSTRUMENT_ORDER.indexOf(currentInstrument);
        const nextIdx = (idx + delta + INSTRUMENT_ORDER.length) % INSTRUMENT_ORDER.length;
        setInstrument(INSTRUMENT_ORDER[nextIdx]);
    }

    function getInstrument() { return currentInstrument; }
    function getLooperState() { return looper.state; }
    function getLooperLength() { return looper.loopLen; }

    // Looper control — single key cycles the state machine:
    //   empty → recording → playing → overdubbing → playing → ...
    function toggleLooper() {
        const now = audioCtx.currentTime;
        if (looper.state === 'empty') {
            looper.events = [];
            looper.recordStart = now;
            looper.state = 'recording';
        } else if (looper.state === 'recording') {
            // First time we close recording — set the loop length.
            looper.loopLen = Math.max(0.5, now - looper.recordStart);
            looper.playStart = now;
            looper.playIdx = 0;
            looper._lastCycle = 0;
            looper.state = 'playing';
        } else if (looper.state === 'playing') {
            // Begin overdubbing — keep the loop length, just start
            // accepting new events into the same buffer at the current
            // cycle phase.
            looper.recordStart = now - ((now - looper.playStart) % looper.loopLen);
            looper.state = 'overdubbing';
        } else if (looper.state === 'overdubbing') {
            looper.state = 'playing';
            // Sort events by time so playback order stays right after
            // overdubs that wrapped past the loop end.
            looper.events.sort((a, b) => a.t - b.t);
        }
    }

    function clearLooper() {
        // Release any playback-held notes immediately.
        for (const k of [...looper.markedKeys]) {
            releaseNote(k, { fromLoop: true });
        }
        looper.markedKeys.clear();
        looper.events = [];
        looper.loopLen = 0;
        looper.state = 'empty';
    }

    function releaseAll() {
        for (const key of [...activeVoices.keys()]) releaseNote(key);
    }

    function shiftOctave(deltaSemitones) {
        // ±2 octaves cap so we don't drift into sub-bass mud or
        // ear-piercing aliased highs.
        const next = Math.max(-24, Math.min(24, octaveOffset + deltaSemitones));
        if (next === octaveOffset) return;
        // Release any held notes at the old octave so they don't stick at
        // the previous frequency forever.
        releaseAll();
        octaveOffset = next;
    }

    function getOctaveOffset() { return octaveOffset; }

    return {
        keyOrder: KEY_ORDER,
        keyToMidi: KEY_TO_MIDI,
        instrumentOrder: INSTRUMENT_ORDER,
        envelopes,
        events,
        startNote,
        releaseNote,
        releaseAll,
        shiftOctave,
        getOctaveOffset,
        setInstrument,
        cycleInstrument,
        getInstrument,
        toggleLooper,
        clearLooper,
        getLooperState,
        getLooperLength,
        update,
    };
}
