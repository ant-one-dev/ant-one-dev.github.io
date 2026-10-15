// Lightweight 2D visuals: automaton (SVG), neural net (canvas), Marauder Map (canvas).
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isFr = () => document.documentElement.lang === 'fr';

// Run `frame(dt, t)` on rAF only while the element is on screen.
function animateWhenVisible(el, frame) {
  let visible = false, last = 0, t = 0, raf = 0;
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    t += dt;
    frame(dt, t);
    if (visible) raf = requestAnimationFrame(loop);
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && reduceMotion) frame(0, 1.5);
    if (visible && !reduceMotion) { last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
  }, { rootMargin: '80px' }).observe(el);
  frame(0, 0);
}

// Keep a canvas' backing store in sync with its CSS size.
function fitCanvas(canvas, onResize) {
  const ctx = canvas.getContext('2d');
  const ro = new ResizeObserver(() => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    onResize?.(w, h);
  });
  ro.observe(canvas);
  return ctx;
}

/* ═════════════════════════ Finite automaton ═════════════════════════ */
export function initAutomata(svg, onState) {
  const S = {
    q0: [70, 175], q1: [200, 175], q2: [330, 175],
  };
  const E = {
    'q0,a': { to: 'q1', d: 'M 90 163 Q 135 120 180 163', lx: 135, ly: 128 },
    'q1,b': { to: 'q1', d: 'M 188 155 C 160 85, 240 85, 212 155', lx: 200, ly: 98 },
    'q1,a': { to: 'q2', d: 'M 220 163 Q 265 120 310 163', lx: 265, ly: 128 },
    'q2,b': { to: 'q0', d: 'M 318 195 Q 200 290 82 195', lx: 200, ly: 258 },
  };
  svg.innerHTML = `
    <defs>
      <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10z" fill="#5b6779"/>
      </marker>
      <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <g id="tape" font-family="JetBrains Mono, monospace" font-size="16" text-anchor="middle"></g>
    <path d="M 18 175 L 46 175" stroke="#5b6779" stroke-width="2" marker-end="url(#arr)"/>
    <text x="18" y="165" fill="#5b6779" font-family="JetBrains Mono" font-size="10">start</text>
    ${Object.entries(E).map(([k, e]) => `
      <path id="e-${k.replace(',', '')}" d="${e.d}" fill="none" stroke="#2f3a4a" stroke-width="2" marker-end="url(#arr)"/>
      <text x="${e.lx}" y="${e.ly}" fill="#8d9aae" font-family="JetBrains Mono" font-size="15" text-anchor="middle">${k.split(',')[1]}</text>`).join('')}
    ${Object.entries(S).map(([q, [x, y]]) => `
      <g id="s-${q}">
        <circle cx="${x}" cy="${y}" r="22" fill="#0d131d" stroke="#5b6779" stroke-width="2"/>
        ${q === 'q2' ? `<circle cx="${x}" cy="${y}" r="17" fill="none" stroke="#5b6779" stroke-width="1.5"/>` : ''}
        <text x="${x}" y="${y + 5}" fill="#e6edf6" font-family="JetBrains Mono" font-size="14" text-anchor="middle">${q}</text>
      </g>`).join('')}
    <circle id="tok" r="7" fill="#3ee6ff" filter="url(#glow)" opacity="0"/>
    <text id="verdict" x="200" y="290" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-weight="700" font-size="18" opacity="0"></text>
  `;
  const tape = svg.querySelector('#tape');
  const tok = svg.querySelector('#tok');
  const verdict = svg.querySelector('#verdict');
  const setState = (q, color) => {
    Object.keys(S).forEach((k) => {
      svg.querySelectorAll(`#s-${k} circle`).forEach((c) => c.setAttribute('stroke', k === q ? color : '#5b6779'));
    });
  };
  const drawTape = (word, head) => {
    const w = 30, x0 = 200 - (word.length * w) / 2;
    tape.innerHTML = [...word].map((ch, i) => `
      <rect x="${x0 + i * w}" y="28" width="${w - 4}" height="30" rx="5" fill="${i === head ? 'rgba(62,230,255,.15)' : '#0d131d'}" stroke="${i === head ? '#3ee6ff' : i < head ? '#2f3a4a' : '#5b6779'}"/>
      <text x="${x0 + i * w + (w - 4) / 2}" y="49" fill="${i < head ? '#5b6779' : '#e6edf6'}">${ch}</text>`).join('');
  };
  const move = (pathEl) => new Promise((res) => {
    const L = pathEl.getTotalLength();
    const t0 = performance.now(), dur = 650;
    pathEl.setAttribute('stroke', '#3ee6ff');
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const p = pathEl.getPointAtLength(e * L);
      tok.setAttribute('cx', p.x); tok.setAttribute('cy', p.y);
      if (k < 1) requestAnimationFrame(step);
      else { pathEl.setAttribute('stroke', '#2f3a4a'); res(); }
    };
    requestAnimationFrame(step);
  });

  const words = ['abba', 'ab', 'abbba', 'ba', 'abab', 'aba'];
  if (reduceMotion) {
    drawTape('abba', 4); setState('q2', '#4ade80');
    onState({ word: 'abba', state: 'q2', result: 'ACCEPTED' });
    return;
  }
  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(svg);

  (async () => {
    for (let wi = 0; ; wi = (wi + 1) % words.length) {
      while (!visible) await sleep(300);
      const word = words[wi];
      let q = 'q0';
      verdict.setAttribute('opacity', 0);
      tok.setAttribute('opacity', 1);
      tok.setAttribute('cx', S.q0[0]); tok.setAttribute('cy', S.q0[1]);
      setState(q, '#3ee6ff');
      drawTape(word, 0);
      onState({ word, state: q, result: null });
      await sleep(600);
      let dead = false, deadAt = 0;
      for (let i = 0; i < word.length; i++) {
        drawTape(word, i);
        const e = E[`${q},${word[i]}`];
        if (!e) { dead = true; deadAt = i; break; }
        await move(svg.querySelector(`#e-${q}${word[i]}`));
        q = e.to;
        setState(q, '#3ee6ff');
        onState({ word, state: q, result: null });
        await sleep(180);
      }
      drawTape(word, dead ? deadAt : word.length);
      const ok = !dead && q === 'q2';
      const col = ok ? '#4ade80' : '#ff5c8a';
      setState(q, col);
      tok.setAttribute('opacity', 0);
      verdict.textContent = isFr()
        ? (ok ? 'ACCEPTÉ ✓' : dead ? 'REJETÉ : pas de transition' : 'REJETÉ : état non final')
        : (ok ? 'ACCEPTED ✓' : dead ? 'REJECTED: no transition' : 'REJECTED: not final');
      verdict.setAttribute('fill', col);
      verdict.setAttribute('opacity', 1);
      onState({ word, state: dead ? `${q} ⟶ ∅` : q, result: ok ? 'ACCEPTED' : 'REJECTED' });
      await sleep(1700);
    }
  })();
}

/* ═════════════════════════ Neural network ═════════════════════════ */
// The 15 PlantVillage classes of the model, in LabelBinarizer order.
const PLANT_CLASSES = [
  ['Pepper__bell___Bacterial_spot', 'Pepper · Bacterial spot'],
  ['Pepper__bell___healthy', 'Pepper · healthy'],
  ['Potato___Early_blight', 'Potato · Early blight'],
  ['Potato___Late_blight', 'Potato · Late blight'],
  ['Potato___healthy', 'Potato · healthy'],
  ['Tomato_Bacterial_spot', 'Tomato · Bacterial spot'],
  ['Tomato_Early_blight', 'Tomato · Early blight'],
  ['Tomato_Late_blight', 'Tomato · Late blight'],
  ['Tomato_Leaf_Mold', 'Tomato · Leaf Mold'],
  ['Tomato_Septoria_leaf_spot', 'Tomato · Septoria leaf spot'],
  ['Tomato_Spider_mites_Two_spotted_spider_mite', 'Tomato · Spider mites'],
  ['Tomato__Target_Spot', 'Tomato · Target Spot'],
  ['Tomato__Tomato_YellowLeaf__Curl_Virus', 'Tomato · Yellow Leaf Curl'],
  ['Tomato__Tomato_mosaic_virus', 'Tomato · Mosaic virus'],
  ['Tomato_healthy', 'Tomato · healthy'],
];

export function initNN(canvas, onState) {
  const N_OUT = PLANT_CLASSES.length;
  const layers = [6, 8, 8, N_OUT];
  let W = 0, H = 0, nodes = [], weights = [], narrow = false;
  const ctx = fitCanvas(canvas, (w, h) => { W = w; H = h; build(); });
  function build() {
    narrow = W < 460;
    const xs = narrow ? [0.15, 0.27, 0.39, 0.5] : [0.12, 0.27, 0.42, 0.56];
    // keep everything between the window bar (top) and the HUD (bottom-left)
    const top = Math.max(64, H * 0.14);
    const bottom = narrow ? H - 92 : H * 0.81;
    const mid = (top + bottom) / 2, hidden = (bottom - top) * 0.72;
    nodes = layers.map((n, l) => {
      const isOut = l === layers.length - 1;
      const y0 = isOut ? top : mid - hidden / 2, span = isOut ? bottom - top : hidden;
      return Array.from({ length: n }, (_, i) => ({ x: W * xs[l], y: y0 + ((i + 0.5) / n) * span }));
    });
    weights = layers.slice(0, -1).map((n, l) => Array.from({ length: n }, () => Array.from({ length: layers[l + 1] }, () => Math.random() * 2 - 1)));
  }
  let sample = 1, out = 0, probs = new Array(N_OUT).fill(0);
  const PERIOD = 4;
  let lastCycle = -1;

  animateWhenVisible(canvas, (dt, t) => {
    if (!W) return;
    const cycle = Math.floor(t / PERIOD);
    const ph = (t % PERIOD) / PERIOD; // 0..1
    if (cycle !== lastCycle) {
      lastCycle = cycle;
      sample = 100 + ((Math.random() * 900) | 0);
      out = (Math.random() * N_OUT) | 0;
      // softmax-like output: one confident class, the rest shares what is left
      const conf = 0.86 + Math.random() * 0.13;
      const rest = Array.from({ length: N_OUT }, (_, i) => (i === out ? 0 : Math.pow(Math.random(), 3)));
      const sum = rest.reduce((a, b) => a + b, 0);
      probs = rest.map((r, i) => (i === out ? conf : ((1 - conf) * r) / sum));
      nodes[0].forEach((n) => (n.v = Math.random()));
      onState({ sample, label: '…', conf: 0, healthy: false });
    }
    const front = ph * (layers.length + 0.8); // signal front position in "layers"
    ctx.clearRect(0, 0, W, H);

    // edges + pulses
    for (let l = 0; l < layers.length - 1; l++) {
      for (let i = 0; i < nodes[l].length; i++) {
        for (let j = 0; j < nodes[l + 1].length; j++) {
          const a = nodes[l][i], b = nodes[l + 1][j], w = weights[l][i][j];
          ctx.strokeStyle = w > 0 ? `rgba(62,230,255,${0.04 + Math.abs(w) * 0.1})` : `rgba(139,123,255,${0.03 + Math.abs(w) * 0.08})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          const k = front - l;
          if (k > 0 && k < 1 && Math.abs(w) > 0.5) {
            ctx.fillStyle = w > 0 ? '#3ee6ff' : '#8b7bff';
            ctx.globalAlpha = Math.sin(k * Math.PI);
            ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, 2, 0, 7); ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      }
    }
    // nodes
    const last = layers.length - 1;
    const rowH = nodes[last].length > 1 ? nodes[last][1].y - nodes[last][0].y : 20;
    const fontPx = Math.max(8, Math.min(11.5, rowH * 0.78, narrow ? 9.5 : 11.5));
    nodes.forEach((layer, l) => layer.forEach((n, i) => {
      const lit = Math.max(0, Math.min(1, front - l + 0.2));
      const isOut = l === last;
      let act = l === 0 ? n.v ?? 0.5 : lit * (0.3 + 0.7 * Math.abs(Math.sin(i * 1.7 + l + lastCycle)));
      if (isOut) act = lit * probs[i];
      const r = isOut ? Math.min(5.5, rowH * 0.36) : 6;
      const winner = isOut && i === out;
      const healthy = PLANT_CLASSES[i][0].endsWith('healthy');
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7);
      ctx.fillStyle = '#0d131d'; ctx.fill();
      ctx.lineWidth = 1.3;
      ctx.strokeStyle = '#3a4657'; ctx.stroke();
      const glow = isOut ? (winner ? lit : Math.min(1, act * 6)) : act;
      if (glow > 0.02) {
        ctx.globalAlpha = glow;
        ctx.fillStyle = isOut ? (winner ? (healthy ? '#4ade80' : '#ffd166') : '#3ee6ff') : '#3ee6ff';
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = winner ? 16 : 10;
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.fill();
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      }
      if (l === 0) { // input bars
        ctx.fillStyle = '#1b2431'; ctx.fillRect(n.x - 44, n.y - 3, 28, 6);
        ctx.fillStyle = '#8692a6'; ctx.fillRect(n.x - 44, n.y - 3, 28 * (n.v ?? 0), 6);
      }
      if (isOut) {
        let x = n.x + r + (narrow ? 5 : 8);
        if (!narrow) { // probability bar
          ctx.fillStyle = '#1b2431'; ctx.fillRect(x, n.y - 2, 34, 4);
          ctx.fillStyle = winner ? (healthy ? '#4ade80' : '#ffd166') : '#3ee6ff';
          ctx.globalAlpha = winner ? 1 : 0.6;
          ctx.fillRect(x, n.y - 2, 34 * Math.min(1, lit * probs[i]), 4);
          ctx.globalAlpha = 1;
          x += 42;
        }
        ctx.font = `${winner && lit > 0.9 ? 700 : 500} ${fontPx}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = winner && lit > 0.9 ? '#e6edf6' : '#8692a6';
        const pct = winner && lit > 0.9 ? `  ${(probs[i] * 100).toFixed(narrow ? 0 : 1)}%` : '';
        ctx.fillText(PLANT_CLASSES[i][1] + pct, x, n.y + fontPx * 0.36);
      }
    }));
    ctx.font = `500 ${narrow ? 8.5 : 10}px "JetBrains Mono", monospace`;
    ctx.fillStyle = '#8692a6';
    ctx.textAlign = 'center';
    [isFr() ? (narrow ? 'feuille' : 'feuille 256²') : (narrow ? 'leaf' : 'leaf 256²'), 'conv', 'dense', narrow ? 'softmax' : `softmax·${N_OUT}`]
      .forEach((s, l) => ctx.fillText(s, nodes[l][0].x, Math.max(56, H * 0.14) - 14));
    ctx.textAlign = 'start';

    if (front > layers.length && !canvas._sent) {
      canvas._sent = true;
      onState({ sample, label: PLANT_CLASSES[out][0], conf: probs[out], healthy: PLANT_CLASSES[out][0].endsWith('healthy') });
    } else if (front < 1) canvas._sent = false;
  });
}

/* ═════════════════════════ Marauder Map ═════════════════════════ */
export function initMarauder(canvas) {
  let W = 0, H = 0;
  let graph = null;
  const ctx = fitCanvas(canvas, (w, h) => { W = w; H = h; graph = buildCity(w, h); });

  function buildCity(w, h) {
    const cols = Math.max(4, Math.round(w / 62)), rows = Math.max(4, Math.round(h / 46));
    const nodes = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const jx = (Math.sin(r * 3.1 + c * 1.7) * 0.5) * (w / cols) * 0.35;
      const jy = (Math.cos(c * 2.3 + r * 0.9) * 0.5) * (h / rows) * 0.35;
      nodes.push({ x: ((c + 0.5) / cols) * w + jx, y: ((r + 0.5) / rows) * h + jy, nb: [] });
    }
    const id = (r, c) => r * cols + c;
    const edges = [];
    const link = (a, b, major) => { nodes[a].nb.push(b); nodes[b].nb.push(a); edges.push([a, b, major]); };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (c < cols - 1 && (r * 7 + c * 3) % 9 !== 0) link(id(r, c), id(r, c + 1), r % 3 === 1);
      if (r < rows - 1 && (r * 5 + c * 11) % 8 !== 0) link(id(r, c), id(r + 1, c), c === 2);
      if (r < rows - 1 && c < cols - 1 && (r + c) % 5 === 0) link(id(r, c), id(r + 1, c + 1), true); // diagonal avenue
    }
    const at = (fr, fc) => id(Math.min(rows - 1, Math.floor(fr * rows)), Math.min(cols - 1, Math.floor(fc * cols)));
    const meet = [at(0.2, 0.2), at(0.55, 0.75), at(0.85, 0.4)];
    const donate = [at(0.3, 0.6), at(0.75, 0.05)];
    const names = ['Léa', 'Hugo', 'Sami', 'Inès', 'Tom', 'Nora'];
    const walkers = names.map((name, i) => {
      let at = (i * 17 + 5) % nodes.length;
      while (!nodes[at].nb.length) at = (at + 1) % nodes.length;
      return { name, from: at, to: nodes[at].nb[0], k: Math.random(), speed: 26 + Math.random() * 14, foot: 0, side: 1 };
    });
    return { nodes, edges, meet, donate, walkers, prints: [], bursts: [] };
  }


  animateWhenVisible(canvas, (dt, t) => {
    if (!graph) return;
    const { nodes, edges, meet, donate, walkers, prints, bursts } = graph;

    // background
    ctx.fillStyle = '#10141d';
    ctx.fillRect(0, 0, W, H);
    // park
    ctx.fillStyle = 'rgba(74,222,128,.06)';
    ctx.fillRect(W * 0.05, H * 0.62, W * 0.22, H * 0.2);
    // river (the Seine, loosely)
    ctx.strokeStyle = 'rgba(80,140,220,.16)';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(-20, H * 0.32);
    ctx.bezierCurveTo(W * 0.35, H * 0.22, W * 0.55, H * 0.5, W + 20, H * 0.42);
    ctx.stroke();
    // streets
    ctx.lineCap = 'round';
    for (const [a, b, major] of edges) {
      ctx.strokeStyle = major ? '#2a3242' : '#1d2431';
      ctx.lineWidth = major ? 6 : 4;
      ctx.beginPath(); ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y); ctx.stroke();
    }
    // donation zones
    donate.forEach((i) => {
      const n = nodes[i];
      ctx.fillStyle = 'rgba(74,222,128,.12)';
      ctx.strokeStyle = 'rgba(74,222,128,.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(n.x, n.y, 22, 0, 7); ctx.fill(); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#4ade80';
      ctx.font = '600 9px "JetBrains Mono", monospace';
      ctx.fillText('DON', n.x - 9, n.y + 3);
    });
    // meeting points
    meet.forEach((i, k) => {
      const n = nodes[i];
      const p = (t * 0.8 + k * 0.33) % 1;
      ctx.strokeStyle = `rgba(255,92,138,${1 - p})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(n.x, n.y, 6 + p * 16, 0, 7); ctx.stroke();
      ctx.fillStyle = '#ff5c8a';
      ctx.beginPath(); ctx.arc(n.x, n.y, 5, 0, 7); ctx.fill();
    });

    // walkers
    for (const w of walkers) {
      const A = nodes[w.from], B = nodes[w.to];
      const len = Math.hypot(B.x - A.x, B.y - A.y) || 1;
      w.k += (w.speed * dt) / len;
      if (w.k >= 1) {
        // arrived
        if (meet.includes(w.to)) {
          bursts.push({ x: B.x, y: B.y, t: 0 });
        }
        const choices = nodes[w.to].nb.filter((x) => x !== w.from);
        const next = choices.length ? choices[(Math.random() * choices.length) | 0] : w.from;
        w.from = w.to; w.to = next; w.k = 0;
        continue;
      }
      const x = A.x + (B.x - A.x) * w.k, y = A.y + (B.y - A.y) * w.k;
      const ang = Math.atan2(B.y - A.y, B.x - A.x);
      w.foot += w.speed * dt;
      if (w.foot > 7) {
        w.foot = 0; w.side *= -1;
        prints.push({ x: x + Math.cos(ang + Math.PI / 2) * 2.6 * w.side, y: y + Math.sin(ang + Math.PI / 2) * 2.6 * w.side, a: ang, t: 0 });
      }
      w.x = x; w.y = y;
    }
    // footprints
    for (let i = prints.length - 1; i >= 0; i--) {
      const p = prints[i];
      p.t += dt;
      if (p.t > 3) { prints.splice(i, 1); continue; }
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.a);
      ctx.fillStyle = `rgba(255,209,102,${0.75 * (1 - p.t / 3)})`;
      ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 1.4, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(2.8, 0, 1, 1.1, 0, 0, 7); ctx.fill();
      ctx.restore();
    }
    for (const w of walkers) {
      if (w.x == null) continue;
      ctx.fillStyle = '#ffd166';
      ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(w.x, w.y, 4, 0, 7); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = 'italic 600 10px "Space Grotesk", sans-serif';
      const tw = ctx.measureText(w.name).width;
      ctx.fillStyle = 'rgba(16,20,29,.85)';
      ctx.fillRect(w.x + 7, w.y - 15, tw + 8, 13);
      ctx.fillStyle = '#ffd166';
      ctx.fillText(w.name, w.x + 11, w.y - 5);
    }
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.t += dt;
      if (b.t > 1) { bursts.splice(i, 1); continue; }
      ctx.strokeStyle = `rgba(74,222,128,${1 - b.t})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(b.x, b.y, 8 + b.t * 26, 0, 7); ctx.stroke();
      ctx.fillStyle = `rgba(74,222,128,${1 - b.t})`;
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.fillText('+1', b.x + 8, b.y - 8 - b.t * 14);
    }
  });
}
