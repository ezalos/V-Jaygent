# breath — inspirations

Track: **Aphex Twin — "aisatsana [102]"** (Syro, 2014). Solo piano, 5:22.
The piece that answers VISION's open question on dynamic range downward.

## Shader references

**"expansive reaction-diffusion"** — https://www.shadertoy.com/view/4dcGW2 —
Two-pass Gaussian diffusion with morphological expansion. **The steal:**
ping-pong feedback for temporal decay; gradient lookup spawns growth only
at existing edges, creating low-contrast blooms from silence.

**Gray-Scott reaction-diffusion** — https://pierre-couy.dev/simulations/2024/09/gray-scott-shader.html —
Reference Gray-Scott implementation. **The steal:** seed each audio band
(bass / mid / high) at a different feed rate so they bloom with different
persistence. Low feed = sparse islands that glow and fade. Silence = no
seed = black field waiting. *(breath uses pure diffusion, not full
Gray-Scott, because reaction would over-structure what should feel
radiative.)*

**Phosphor decay** — CRT phosphor lifetime curves (red ~150 µs, green
~10-15 ms). **The steal:** tune the ping-pong decay constant to match
phosphor persistence so the field goes white-hot back to black in that
window. Heat equation does this naturally when each pass's contribution
is weighted by `exp(-dt/τ)`.

## VJ & visual artists

**Ryoji Ikeda** — data-verse, datamatics. Sparse mathematical aesthetics;
the liminal space between silence and noise. **The move to learn:**
mathematical precision in sparse aesthetics. Restraint in palette, field
sparsity, silence as compositional material. breath is deliberately in
this lineage.

**Tarik Barri** — Versum, Videosync. 3D audiovisual sequencer where every
sound is visual and vice versa. **The move to learn:** vertical position
in the visual field mirrors pitch / band. breath's vertical band mapping
(bass low, high up) is a direct borrow.

**Memo Akten** — Learning to See, Deep Meditations. Neural-net generative
art trained on curated concepts. **Less directly applicable here**, but
the philosophy matches: organic "learned" blooms rather than geometric
stamps. breath's non-deterministic seed position (noise-perturbed)
echoes this.

## Physical phenomena

**Heat equation on a 2D field.** Laplacian diffusion: each pixel
equilibrates toward its neighbours each step. Discretised:
`u_new = u_old + dt * k * ∇²u_old`. With a global decay multiplier
(~0.98/step), silence pulls the field to genuine black. breath's physics.

**Green's functions / impulse response.** The diffusion of a point source
blooms as a 2D Gaussian with variance growing linearly in time.
**The steal:** each audio attack is a Dirac delta seeded into the field;
the visible bloom is the Green's function. No code is needed for this —
diffusion alone evaluates it.

**Schlieren photography.** Reveals density gradients in transparent
flow. **The optional steal:** in the display pass, add a gradient-magnitude
term so field edges catch extra palette band — amber contours against
black, makes radiation legible without adding structure. (ferment uses
exactly this move for its rim highlight.)

**CRT phosphor afterglow.** Exponential decay after impulse. breath's
ping-pong buffer IS a phosphor. Attack → bloom → fade. Built-in breathing.

## The one move to steal

**Inverse audio dynamics on visual decay.** Instead of *brightening* on
peaks, *seed more sharply* on peaks; let diffusion + decay do the
animation. When audio goes quiet, the field isn't dimmed — it stops
receiving seed and dies on its own time-constant. Silence answers itself
through physics. This is the whole thesis, and it's free once the
multipass is wired up.
