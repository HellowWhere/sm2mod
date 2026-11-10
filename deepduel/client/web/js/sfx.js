/* Synthesised sound effects (WebAudio), no audio files needed. */
window.DD = window.DD || {};
(function () {
  let ctx = null, master = null, noiseBuf = null, ambient = null;
  const S = {
    enabled: true,
    init() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = 0.55;
        master.connect(ctx.destination);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      } catch (e) { ctx = null; }
    },
    play(name, vol = 1, pan = 0) {
      if (!S.enabled || !ctx) return;
      const f = SOUNDS[name];
      if (!f) return;
      try {
        const out = ctx.createGain();
        out.gain.value = vol;
        let node = out;
        if (ctx.createStereoPanner && pan) {
          const p = ctx.createStereoPanner();
          p.pan.value = Math.max(-1, Math.min(1, pan));
          out.connect(p); p.connect(master);
        } else out.connect(master);
        f(ctx.currentTime, node);
      } catch (e) { /* ignore */ }
    },
    ambientOn() {
      if (!S.enabled || !ctx || ambient) return;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf; src.loop = true;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180;
      const g = ctx.createGain(); g.gain.value = 0.0;
      g.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 2);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.12;
      const lg = ctx.createGain(); lg.gain.value = 70;
      lfo.connect(lg); lg.connect(lp.frequency);
      src.connect(lp); lp.connect(g); g.connect(master);
      src.start(); lfo.start();
      ambient = { src, lfo, g };
    },
    ambientOff() {
      if (!ambient || !ctx) return;
      const a = ambient; ambient = null;
      try {
        a.g.gain.cancelScheduledValues(ctx.currentTime);
        a.g.gain.setValueAtTime(a.g.gain.value, ctx.currentTime);
        a.g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
        setTimeout(() => { try { a.src.stop(); a.lfo.stop(); } catch (e) {} }, 900);
      } catch (e) {}
    },
  };

  function env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  function osc(t, out, type, f0, f1, dur, peak = 0.5, a = 0.005) {
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    const g = ctx.createGain(); env(g, t, a, peak, dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + a + dur + 0.05);
  }
  function noise(t, out, ftype, f0, f1, dur, peak = 0.5, q = 1, a = 0.004) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = ftype; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = ctx.createGain(); env(g, t, a, peak, dur);
    src.connect(f); f.connect(g); g.connect(out);
    src.start(t, Math.random()); src.stop(t + a + dur + 0.05);
  }

  const SOUNDS = {
    click: (t, o) => osc(t, o, 'triangle', 900, 600, 0.06, 0.25),
    tab: (t, o) => osc(t, o, 'sine', 520, 700, 0.07, 0.2),
    shot: (t, o) => { noise(t, o, 'lowpass', 2400, 300, 0.16, 0.5); osc(t, o, 'sine', 160, 50, 0.14, 0.45); },
    rapid: (t, o) => { noise(t, o, 'bandpass', 2200, 900, 0.06, 0.35, 2); },
    heavyshot: (t, o) => { noise(t, o, 'lowpass', 1800, 120, 0.35, 0.6); osc(t, o, 'sawtooth', 220, 40, 0.3, 0.25); },
    zap: (t, o) => { osc(t, o, 'sawtooth', 1800, 200, 0.18, 0.22); osc(t, o, 'square', 900, 2400, 0.12, 0.1); },
    torp: (t, o) => { noise(t, o, 'bandpass', 300, 1400, 0.5, 0.45, 3, 0.05); osc(t, o, 'sine', 90, 60, 0.4, 0.3); },
    boom: (t, o) => { noise(t, o, 'lowpass', 900, 60, 1.1, 0.9, 0.7, 0.01); osc(t, o, 'sine', 90, 28, 0.9, 0.8, 0.01); },
    smallboom: (t, o) => { noise(t, o, 'lowpass', 1400, 120, 0.4, 0.5, 0.7); },
    hit: (t, o) => { osc(t, o, 'square', 220, 140, 0.12, 0.18); noise(t, o, 'highpass', 3000, 1500, 0.08, 0.2); },
    hurt: (t, o) => { osc(t, o, 'sawtooth', 140, 60, 0.25, 0.3); noise(t, o, 'lowpass', 600, 100, 0.3, 0.5); },
    ping: (t, o) => {
      osc(t, o, 'sine', 1320, 1300, 1.6, 0.45, 0.004);
      osc(t + 0.42, o, 'sine', 1320, 1300, 1.1, 0.14, 0.004);
      osc(t + 0.84, o, 'sine', 1320, 1300, 0.8, 0.05, 0.004);
    },
    alarm: (t, o) => { osc(t, o, 'square', 880, 880, 0.12, 0.12); osc(t + 0.16, o, 'square', 660, 660, 0.12, 0.12); },
    boost: (t, o) => noise(t, o, 'bandpass', 400, 1800, 0.4, 0.3, 2, 0.05),
    coin: (t, o) => { osc(t, o, 'triangle', 1320, 1320, 0.08, 0.25); osc(t + 0.07, o, 'triangle', 1760, 1760, 0.18, 0.25); },
    upgrade: (t, o) => [523, 659, 784, 1046].forEach((f, i) => osc(t + i * 0.07, o, 'triangle', f, f, 0.22, 0.25)),
    open: (t, o) => { noise(t, o, 'lowpass', 3000, 200, 0.5, 0.5); [392, 523, 659, 784, 1046].forEach((f, i) => osc(t + 0.1 + i * 0.06, o, 'triangle', f, f, 0.3, 0.22)); },
    reveal: (t, o) => { osc(t, o, 'sine', 600, 1400, 0.25, 0.25); },
    legendary: (t, o) => [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => osc(t + i * 0.08, o, 'triangle', f, f, 0.5, 0.25)),
    win: (t, o) => [523, 659, 784, 1046, 784, 1046].forEach((f, i) => osc(t + i * 0.12, o, 'triangle', f, f, 0.35, 0.3)),
    lose: (t, o) => [392, 349, 311, 262].forEach((f, i) => osc(t + i * 0.2, o, 'triangle', f, f * 0.98, 0.45, 0.28)),
    count: (t, o) => osc(t, o, 'sine', 660, 660, 0.18, 0.35),
    go: (t, o) => { osc(t, o, 'sawtooth', 523, 1046, 0.35, 0.25); osc(t, o, 'sine', 1046, 1046, 0.5, 0.3); },
    error: (t, o) => { osc(t, o, 'square', 200, 160, 0.15, 0.15); },
    found: (t, o) => [660, 880, 1320].forEach((f, i) => osc(t + i * 0.09, o, 'triangle', f, f, 0.25, 0.3)),
  };

  DD.sfx = S;
})();
