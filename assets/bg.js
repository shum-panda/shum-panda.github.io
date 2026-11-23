/* Hintergrund: ein paar Pixel-Seelöwen schwimmen, manche balancieren einen Ball, Blasen steigen auf.
   Leise, hinter dem Inhalt, pausiert im Hintergrund-Tab und steht still bei "weniger Bewegung". */
(() => {
  "use strict";
  const canvas = document.getElementById("sea");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const dark = matchMedia("(prefers-color-scheme: dark)");

  // 16 x 11 Pixel, nach rechts schauend. b = Körper, s = Bauch, d = Auge/Schnurrhaare, n = Nase, o = Ball
  const SEALION = [
    "..........oo....",
    "..........oo....",
    ".........bbbb...",
    "........bbbdbn..",
    "........bbbbbnn.",
    ".......bbbbd....",
    "......bbbbb.....",
    "..bbbbbbbsb.....",
    ".bbbbbbbsss.....",
    "bb.bbbbbbb......",
    "b...bb...bb.....",
  ];
  const W = 16, H = SEALION.length;

  function palette() {
    const forced = document.documentElement.dataset.theme;
    const isDark = forced ? forced === "dark" : dark.matches;
    return isDark
      ? { b: "#8a7563", s: "#b39b83", d: "#0e1b30", n: "#0e1b30", o: "#ff8a2b", bubble: "rgba(150,210,230,.35)", water: "rgba(76,195,195,.10)", crest: "rgba(76,195,195,.28)", alpha: 0.7 }
      : { b: "#6a5446", s: "#9c8370", d: "#2b2620", n: "#2b2620", o: "#f26a1b", bubble: "rgba(26,138,143,.30)", water: "rgba(26,138,143,.10)", crest: "rgba(26,138,143,.30)", alpha: 0.6 };
  }

  let px = 3, vw = 0, vh = 0, band = 120, lions = [], bubbles = [], last = 0, raf = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    vw = innerWidth; vh = innerHeight;
    canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    px = vw < 600 ? 3 : 4;
    band = vw < 600 ? 80 : Math.round(Math.min(150, Math.max(90, vh * 0.18)));
    const count = vw < 600 ? 2 : vw < 1100 ? 3 : 5;
    while (lions.length < count) lions.push(newLion(true));
    lions.length = count;
  }

  function newLion(anywhere) {
    const dir = Math.random() < 0.5 ? 1 : -1;
    const w = W * px;
    return {
      x: anywhere ? Math.random() * vw : dir > 0 ? -w - Math.random() * 200 : vw + Math.random() * 200,
      y: vh - band + 18 + Math.random() * Math.max(10, band - H * px - 30),
      dir, speed: 10 + Math.random() * 14, phase: Math.random() * Math.PI * 2,
      ball: Math.random() < 0.35, hop: 0, nextHop: 4 + Math.random() * 10,
    };
  }

  function drawLion(l, pal, t) {
    const bob = Math.round(Math.sin(t * 1.6 + l.phase) * 2) * px;
    const hopY = l.hop > 0 ? -Math.round(Math.sin((1 - l.hop) * Math.PI) * 6) * px : 0;
    const ox = Math.round(l.x), oy = Math.round(l.y + bob + hopY);
    ctx.globalAlpha = pal.alpha;
    for (let r = 0; r < H; r++) {
      const row = SEALION[r];
      for (let c = 0; c < W; c++) {
        const ch = row[c];
        if (ch === "." || (ch === "o" && !l.ball)) continue;
        const cx = l.dir > 0 ? c : W - 1 - c;
        ctx.fillStyle = pal[ch];
        ctx.fillRect(ox + cx * px, oy + r * px, px, px);
      }
    }
    ctx.globalAlpha = 1;
  }

  function step(dt, t) {
    for (let i = 0; i < lions.length; i++) {
      const l = lions[i];
      l.x += l.dir * l.speed * dt;
      l.nextHop -= dt;
      if (l.hop > 0) l.hop = Math.max(0, l.hop - dt * 1.4);
      else if (l.nextHop <= 0) { l.hop = 1; l.nextHop = 6 + Math.random() * 12; }
      if (Math.random() < dt * 0.5) bubbles.push({ x: l.x + (l.dir > 0 ? W * px : 0), y: l.y + 3 * px, r: px, v: 12 + Math.random() * 10 });
      if ((l.dir > 0 && l.x > vw + 40) || (l.dir < 0 && l.x < -W * px - 40)) lions[i] = newLion(false);
    }
    for (const b of bubbles) { b.y -= b.v * dt; b.x += Math.sin(t * 3 + b.y * 0.05) * 0.3; }
    bubbles = bubbles.filter((b) => b.y > vh - band).slice(-60);
  }

  function draw(t) {
    const pal = palette();
    ctx.clearRect(0, 0, vw, vh);
    // Wasserstreifen mit Pixel-Wellenkante
    const top = vh - band;
    ctx.fillStyle = pal.water;
    ctx.fillRect(0, top, vw, band);
    ctx.fillStyle = pal.crest;
    const s = px * 2;
    for (let x = 0; x < vw; x += s) {
      const off = Math.round(Math.sin(x * 0.02 + t * 1.2) * 1.5) * px;
      ctx.fillRect(x, top - px + off, s, px);
    }
    ctx.fillStyle = pal.bubble;
    for (const b of bubbles) ctx.fillRect(Math.round(b.x), Math.round(b.y), b.r * 2, b.r * 2);
    for (const l of lions) drawLion(l, pal, t);
  }

  function frame(now) {
    const t = now / 1000;
    const dt = Math.min(0.05, last ? t - last : 0);
    last = t;
    step(dt, t);
    draw(t);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    cancelAnimationFrame(raf); last = 0;
    if (still.matches) { draw(0); return; }
    raf = requestAnimationFrame(frame);
  }

  resize();
  addEventListener("resize", () => { resize(); if (still.matches) draw(0); });
  document.addEventListener("visibilitychange", () => (document.hidden ? cancelAnimationFrame(raf) : start()));
  still.addEventListener?.("change", start);
  dark.addEventListener?.("change", () => still.matches && draw(0));
  start();
})();
