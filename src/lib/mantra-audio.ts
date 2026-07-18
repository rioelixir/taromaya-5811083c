// Lightweight in-browser ambient + voice engine (no external assets).
// Uses Web Audio API for synth ambient beds and bell chimes, and SpeechSynthesis
// for guided phase prompts and mantra chanting.

export type AmbientKind = "off" | "drone" | "rain" | "ocean" | "bells";

type Nodes = {
  ctx: AudioContext;
  master: GainNode;
  ambientGain: GainNode;
  stopAmbient: () => void;
};

let state: Nodes | null = null;
let ambientKind: AmbientKind = "off";

function ensure(): Nodes {
  if (state) return state;
  const Ctx: typeof AudioContext =
    typeof window !== "undefined" ? (window.AudioContext || (window as any).webkitAudioContext) : (undefined as any);
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 1;
  master.connect(ctx.destination);
  const ambientGain = ctx.createGain();
  ambientGain.gain.value = 0.4;
  ambientGain.connect(master);
  state = { ctx, master, ambientGain, stopAmbient: () => {} };
  return state;
}

function makeNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

export function setAmbient(kind: AmbientKind) {
  if (typeof window === "undefined") return;
  const s = ensure();
  if (s.ctx.state === "suspended") s.ctx.resume();
  s.stopAmbient();
  ambientKind = kind;
  if (kind === "off") { s.stopAmbient = () => {}; return; }

  const nodes: (AudioNode | { stop?: () => void; disconnect?: () => void })[] = [];

  if (kind === "drone") {
    const freqs = [110, 165, 220];
    freqs.forEach((f, i) => {
      const osc = s.ctx.createOscillator();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.value = f;
      const g = s.ctx.createGain();
      g.gain.value = 0.08;
      const lfo = s.ctx.createOscillator();
      lfo.frequency.value = 0.1 + i * 0.05;
      const lfoGain = s.ctx.createGain();
      lfoGain.gain.value = 0.03;
      lfo.connect(lfoGain).connect(g.gain);
      osc.connect(g).connect(s.ambientGain);
      osc.start(); lfo.start();
      nodes.push(osc, lfo);
    });
  } else if (kind === "rain" || kind === "ocean") {
    const src = s.ctx.createBufferSource();
    src.buffer = makeNoiseBuffer(s.ctx, 4);
    src.loop = true;
    const filter = s.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = kind === "rain" ? 1200 : 500;
    const g = s.ctx.createGain();
    g.gain.value = kind === "rain" ? 0.5 : 0.7;
    // slow amplitude modulation for ocean swells
    if (kind === "ocean") {
      const lfo = s.ctx.createOscillator();
      lfo.frequency.value = 0.12;
      const lfoGain = s.ctx.createGain();
      lfoGain.gain.value = 0.35;
      lfo.connect(lfoGain).connect(g.gain);
      lfo.start();
      nodes.push(lfo);
    }
    src.connect(filter).connect(g).connect(s.ambientGain);
    src.start();
    nodes.push(src, filter, g);
  } else if (kind === "bells") {
    // Slow randomised bell chimes.
    const scheduler = window.setInterval(() => bell(0.15), 6000);
    nodes.push({ stop: () => window.clearInterval(scheduler) });
  }

  s.stopAmbient = () => {
    nodes.forEach((n) => {
      try { (n as any).stop?.(); } catch {}
      try { (n as any).disconnect?.(); } catch {}
    });
  };
}

export function setAmbientVolume(v: number) {
  const s = ensure();
  s.ambientGain.gain.value = Math.max(0, Math.min(1, v));
}

export function setMasterVolume(v: number) {
  const s = ensure();
  s.master.gain.value = Math.max(0, Math.min(1, v));
}

export function currentAmbient(): AmbientKind { return ambientKind; }

/** A soft bell — used to mark phase transitions in guided mode. */
export function bell(volume = 0.25) {
  if (typeof window === "undefined") return;
  const s = ensure();
  if (s.ctx.state === "suspended") s.ctx.resume();
  const now = s.ctx.currentTime;
  [880, 1320, 1760].forEach((f, i) => {
    const osc = s.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;
    const g = s.ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(volume / (i + 1), now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
    osc.connect(g).connect(s.master);
    osc.start(now);
    osc.stop(now + 2.4);
  });
}

/** SpeechSynthesis wrapper — safe no-op on unsupported browsers. */
export function speak(text: string, opts: { rate?: number; pitch?: number; volume?: number } = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = opts.rate ?? 0.85;
  u.pitch = opts.pitch ?? 0.9;
  u.volume = Math.max(0, Math.min(1, opts.volume ?? 0.7));
  window.speechSynthesis.speak(u);
}

export function cancelSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function teardownAudio() {
  if (!state) return;
  try { state.stopAmbient(); } catch {}
  try { state.ctx.close(); } catch {}
  state = null;
  ambientKind = "off";
}
