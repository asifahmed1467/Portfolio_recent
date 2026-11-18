/** Ambient: tiny generative "soft background music" (no audio files). Off by default; toggle() must be called from a user gesture. */
export function Ambient() {
  let ctx: AudioContext | null = null, master: GainNode | null = null, timer = 0, step = 0, on = false;
  const CH = [[261.6, 329.6, 392, 493.9], [220, 261.6, 329.6, 392], [174.6, 261.6, 329.6, 440], [196, 246.9, 293.7, 392]]; // Cmaj7, Am7, Fmaj7, G6
  function chord() {
    if (!ctx || !master) return; const t = ctx.currentTime, notes = CH[step++ % CH.length];
    notes.forEach((f, k) => {
      const o = ctx!.createOscillator(), g = ctx!.createGain(), lp = ctx!.createBiquadFilter(); o.type = k % 2 ? 'triangle' : 'sine'; o.frequency.value = f / (k === 0 ? 2 : 1); lp.type = 'lowpass'; lp.frequency.value = 900;
      g.gain.setValueAtTime(0, t + k * 0.12); g.gain.linearRampToValueAtTime(0.05, t + 1.8 + k * 0.12); g.gain.linearRampToValueAtTime(0, t + 6.2); o.connect(lp); lp.connect(g); g.connect(master!); o.start(t); o.stop(t + 6.4);
    });
  }
  return {
    get on() { return on; },
    toggle(): boolean {
      on = !on;
      if (on) { try { ctx = ctx || new AudioContext(); master = master || ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination); ctx.resume(); chord(); timer = window.setInterval(chord, 6000); } catch { on = false; } }
      else { clearInterval(timer); master?.gain.setTargetAtTime(0, ctx?.currentTime || 0, 0.3); setTimeout(() => { try { master?.disconnect(); } catch { /* */ } }, 900); }
      return on;
    },
    off() { if (on) this.toggle(); }
  };
}
