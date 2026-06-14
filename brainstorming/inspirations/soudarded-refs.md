# soudarded — inspirations & references

Track: **"Ar soudarded zo gwisket e ruz"** ("The soldiers are dressed in
red") — traditional Breton song, this arrangement 161.5 BPM, C minor,
3:23. A fast Breton chain-dance feel (an dro / gavotte) with kan-ha-diskan
call-and-response vocals. Research compiled 2026-06-14 (URLs marked
"verify later" — sandbox web access is flaky).

## Kuramoto math (the canonical algorithm)

Coupled phase oscillators: `dθ_i/dt = ω_i + (K/N) Σ_j sin(θ_j − θ_i)`.
Order parameter `r·e^{iψ} = (1/N) Σ_j e^{iθ_j}` measures coherence
(r∈[0,1]: 0 = chaos, 1 = locked). The incoherence→sync transition is a
phase transition (ferromagnetic analogue); critical coupling `K_c`
depends on the ω distribution, not a universal constant.

**Kuramoto–Sakaguchi** adds a phase lag α: `... sin(θ_j − θ_i − α)`.
α near 0 → smooth synchronization / target waves; α near π/2 →
persistent spiral-wave turbulence and **chimera states** (a coherent
domain coexisting with an incoherent one, the coherent region wandering
chaotically). On a 2D lattice with local coupling this produces
spiral vortices, target waves, and defect turbulence — the visual
vocabulary of oscillatory media (Belousov–Zhabotinsky, cardiac waves,
complex Ginzburg–Landau).

Steal: state = oscillator PHASE on a ping-pong texture (ferment's
architecture, phase instead of chemical concentration). Drive α down +
K up to synchronize (the communal lock-in); drive α up + K down for
turbulent desync (the quiet). r drives a central communal bloom.

## Shader refs

- **Kuramoto Oscillator Visualization — Temple of Two**
  (thetempleoftwo.com/kuramoto-oscillators, verify later). 128×128 =
  16k oscillators on a texture; traveling waves and spiral vortices
  emerge from coupling, not explicit animation. Pixel-ocean variant
  (640k oscillators) proves shader-side coupling is performant at scale
  and supports touch-drag forcing fields. Steal: phase→hue, coherence→
  brightness; ping-pong `θ_new = θ_old + (ω + K·Σ sin(θ_nbr − θ_old))·dt`.
- **ferment** (this repo) — the architecture sibling: Gray-Scott RD on
  rgba16f ping-pong, 8 substeps/frame, cursor feeds state. Steal the
  whole multi-pass + frame-0 seed + cursor-injection skeleton.

## Breton dance structure

- **An dro** — open chain/circle, dancers linked by pinky fingers,
  counter-clockwise side-step, a lead dancer adds variations. Visual:
  rotational, linked, communal. → ring topology / circular composition
  nod; the lead = a pacemaker (cursor).
- **Kan-ha-diskan** ("song and counter-song") — kaner (lead) sings a
  phrase; diskaner (second) overlaps the final lines, then repeats;
  kaner re-enters at the end. NOT clean antiphony — *interlaced*, with
  flexible timing. → the vocal stem nucleates coherence (the lead voice
  pulling the chain into sync); a weak global pull echoes the overlap.

## Artists

- **Memo Akten** — synchronization + emergence + interaction as
  meditative resonance; oscillation/phase dynamics in kinetic light
  work. Steal: tie bloom/saturation to audio bands, let interaction be
  a forcing field that propagates through the medium.

## One concrete steal per item

1. **Kuramoto eq** → global order parameter r as a central glow bloom
   that blazes when the crowd "locks in"; quantifies sync in real time.
2. **Sakaguchi α** → section/energy drives α: verse = turbulent spirals
   (α↑, K↓), peak = synchronized domains (α↓, K↑), outro = breakup.
3. **An-dro ring** → cursor is the lead dancer / pacemaker: a high-ω
   site emitting target waves; drag = a moving wave source.
4. **Kan-ha-diskan** → vocals stem grows coherence; drums = a global
   downbeat phase-kick (the communal step); bass = coupling K; other
   (melody) = medium rotation speed. Four stems, four distinct roles.

Sources (verify later): EmergentMind "Kuramoto Model for
Synchronization"; arXiv:1011.3878 (critical coupling); Wikipedia
"Kan ha diskan", "An dro"; memo.tv.
