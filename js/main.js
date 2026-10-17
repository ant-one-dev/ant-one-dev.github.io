import { profile, featured, projects, stack, timeline, logos, logoStrip } from './data.js?v=20261017b';
import { UI } from './i18n.js?v=20261017b';
import { initAutomata, initNN, initMarauder } from './visuals2d.js?v=20261017b';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ───────── language ───────── */
const LANGS = ['fr', 'en'];
const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };
let lang = new URLSearchParams(location.search).get('lang');
if (!LANGS.includes(lang)) lang = store.get('lang');
if (!LANGS.includes(lang)) lang = 'fr';
// pick the current language from a {fr, en} value; other values pass through
const nbsp = (s) => (lang === 'fr' && typeof s === 'string' ? s.replace(/ ([:;?!])/g, '\u00a0$1') : s);
const deep = (v) => (Array.isArray(v) ? v.map(deep) : nbsp(v));
const t = (v) => deep(v && typeof v === 'object' && !Array.isArray(v) && 'fr' in v ? v[lang] : v);
const tr = (key) => nbsp(UI[lang][key] ?? UI.fr[key] ?? key);
const onLang = [];

function applyStatic() {
  document.documentElement.lang = lang;
  document.title = tr('meta.title');
  $('meta[name="description"]')?.setAttribute('content', tr('meta.desc'));
  $$('[data-i18n]').forEach((el) => { el.textContent = tr(el.dataset.i18n); });
  $$('[data-i18n-html]').forEach((el) => { el.innerHTML = tr(el.dataset.i18nHtml); });
  $$('[data-i18n-alt]').forEach((el) => { el.alt = tr(el.dataset.i18nAlt); });
  $$('[data-i18n-title]').forEach((el) => { el.title = tr(el.dataset.i18nTitle); el.setAttribute('aria-label', tr(el.dataset.i18nTitle)); });
  $$('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', tr(el.dataset.i18nAria)); });
  $$('#lang-toggle [data-l]').forEach((s) => s.classList.toggle('on', s.dataset.l === lang));
}
function setLang(next) {
  lang = next;
  store.set('lang', lang);
  const url = new URL(location.href);
  if (lang === 'fr') url.searchParams.delete('lang'); else url.searchParams.set('lang', lang);
  history.replaceState(null, '', url);
  applyStatic();
  onLang.forEach((fn) => fn());
}
$('#lang-toggle').addEventListener('click', () => setLang(lang === 'fr' ? 'en' : 'fr'));

/* ───────── icons ───────── */
const ic = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const ICONS = {
  github: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"/></svg>`,
  mail: ic('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  music: ic('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
  run: ic('<circle cx="14" cy="4" r="2"/><path d="m6 22 3-6 3 2v4M9 16l1-5 4 1 2 3h4M10 11 7 9l-3 3"/>'),
  cube: ic('<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="m3 7 9 5 9-5M12 12v10"/>'),
  plane: ic('<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>'),
  ext: ic('<path d="M7 17 17 7M8 7h9v9"/>', 'width="14" height="14"'),
  lock: ic('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', 'width="14" height="14"'),
};
$$('[data-icon]').forEach((el) => { el.innerHTML = ICONS[el.dataset.icon] || ''; });

/* ───────── nav ───────── */
const nav = $('#nav');
const toggle = $('#nav-toggle');
const links = $('#nav-links');
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', open);
  links.classList.toggle('open', open);
});
links.addEventListener('click', (e) => {
  if (e.target.closest('a')) { toggle.setAttribute('aria-expanded', 'false'); links.classList.remove('open'); }
});

const progress = $('.scroll-progress span');
const onScroll = () => {
  const y = scrollY;
  nav.classList.toggle('scrolled', y > 20);
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  updateTimelineSignal();
};
addEventListener('scroll', onScroll, { passive: true });

// highlight current section in nav
const navMap = new Map($$('.nav-links a').map((a) => [a.getAttribute('href').slice(1), a]));
const secObs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    navMap.forEach((a) => a.classList.remove('active'));
    navMap.get(e.target.id)?.classList.add('active');
  });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main > section[id]').forEach((s) => secObs.observe(s));

/* ───────── hero typing ───────── */
(function typing() {
  const el = $('#typed');
  let r = 0, i = 0, dir = 1, timer = 0;
  const roles = () => t(profile.roles);
  if (reduceMotion) {
    const show = () => { el.textContent = roles()[0]; };
    show(); onLang.push(show);
    return;
  }
  const step = () => {
    const word = roles()[r % roles().length];
    i += dir;
    el.textContent = word.slice(0, i);
    let delay = dir > 0 ? 55 + Math.random() * 50 : 28;
    if (dir > 0 && i >= word.length) { dir = -1; delay = 1800; }
    else if (dir < 0 && i <= 0) { dir = 1; r = (r + 1) % roles().length; delay = 350; }
    timer = setTimeout(step, delay);
  };
  timer = setTimeout(step, 900);
  onLang.push(() => { clearTimeout(timer); i = 0; dir = 1; el.textContent = ''; timer = setTimeout(step, 250); });
})();

/* ───────── skills stack ───────── */
const stack3d = $('#stack-3d');
const stackList = $('#stack-list');
const n = stack.length;
stack3d.innerHTML = `<div class="plates">${stack.map((l, i) =>
  `<div class="plate" data-i="${i}" style="--c:${l.color};--i:${n - 1 - i}"><span class="plate-label"></span></div>`).join('')}</div>`;
stackList.innerHTML = stack.map((l, i) => `
  <li class="stack-item" data-i="${i}" style="--c:${l.color}">
    <span class="stack-code">${l.code}</span>
    <div><h3></h3><div class="chips"></div></div>
  </li>`).join('');
const plates = $$('.plate', stack3d);
function renderStack() {
  stack.forEach((l, i) => {
    plates[i].querySelector('.plate-label').textContent = `${l.code} · ${t(l.layer).toUpperCase()}`;
    const li = stackList.children[i];
    li.querySelector('h3').textContent = t(l.layer);
    li.querySelector('.chips').innerHTML = l.items.map((s) => `<span>${esc(t(s))}</span>`).join('');
  });
}
onLang.push(renderStack);
const setHot = (i) => {
  stack3d.classList.toggle('exploded', i !== null);
  plates.forEach((p) => {
    const me = +p.dataset.i === i;
    p.classList.toggle('hot', me);
    p.classList.toggle('dim', i !== null && !me);
  });
  $$('.stack-item').forEach((li) => li.classList.toggle('hot', +li.dataset.i === i));
};
[...$$('.stack-item'), ...plates].forEach((el) => {
  el.addEventListener('mouseenter', () => setHot(+el.dataset.i));
  el.addEventListener('mouseleave', () => setHot(null));
});
// explode once when it scrolls into view
new IntersectionObserver(([e], o) => {
  if (!e.isIntersecting) return;
  stack3d.classList.add('exploded');
  setTimeout(() => { if (!stack3d.querySelector('.hot')) stack3d.classList.remove('exploded'); }, 1600);
  o.disconnect();
}, { threshold: 0.5 }).observe(stack3d);

/* ───────── featured projects ───────── */
const VIZ_TITLE = { robot: 'vigibot://sim · 4 zones', fpga: 'arty-a7 · reflex_top.vhd', automata: 'automata · recognise(word)', nn: 'leaf_cnn.keras · /predict', audio: 'esp32-fx · a2dp → i2s' };
$('#featured').innerHTML = featured.map((p) => `
  <article class="feat ${featured.indexOf(p) % 2 ? 'reverse' : ''}" id="p-${p.id}">
    <div class="feat-visual reveal" data-visual="${p.visual}">
      <div class="viz-bar"><span class="dots"><i></i><i></i><i></i></span><span>${VIZ_TITLE[p.visual] || ''}</span></div>
      ${p.gif ? `<img class="viz-gif" src="${p.gif}" alt="${esc(t(p.title))}" loading="lazy">`
        : p.visual === 'automata' ? '<svg class="viz" viewBox="0 0 400 300"></svg>' : '<canvas></canvas>'}
      ${p.gif ? '' : '<div class="viz-hud"></div>'}
      ${p.visual === 'robot' || p.visual === 'fpga' ? '<span class="viz-hint" data-i18n="projects.live3d"></span>' : ''}
    </div>
    <div class="feat-text reveal"></div>
  </article>`).join('');
function renderFeatured() {
  featured.forEach((p, i) => {
    $(`#p-${p.id} .feat-text`).innerHTML = `
      <span class="feat-year">${esc(p.year)} · ${String(i + 1).padStart(2, '0')}</span>
      <h3>${esc(t(p.title))}</h3>
      <p class="feat-sub">${esc(t(p.subtitle))}</p>
      <p class="feat-summary">${esc(t(p.summary))}</p>
      ${p.role ? `<p class="feat-role">${esc(t(p.role))}</p>` : ''}
      <ul class="feat-bullets">${t(p.bullets).map(([b, d]) => `<li><span><b>${esc(b)}${lang === 'fr' ? '\u00a0:' : ':'}</b> ${esc(d)}</span></li>`).join('')}</ul>
      <div class="tags">${p.tags.map((s) => `<span>${esc(s)}</span>`).join('')}</div>
      <div class="feat-links">
        ${p.repo
          ? `<a class="btn btn-ghost" href="${esc(p.repo)}" target="_blank" rel="noopener">${tr('projects.github')} ${ICONS.ext}</a>`
          : `<span class="badge-private">${ICONS.lock} ${tr('projects.privateLong')}</span>`}
      </div>`;
  });
}
onLang.push(renderFeatured);

/* ───────── project cards ───────── */
const SVG = (inner) => `<svg viewBox="0 0 400 170" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${inner}</svg>`;
const ART = {
  spectrum: SVG(`<rect width="400" height="170" fill="#0b0d16"/>
    <defs><linearGradient id="spg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#3ee6ff"/><stop offset=".6" stop-color="#8b7bff"/><stop offset="1" stop-color="#ff5c8a"/></linearGradient></defs>
    ${Array.from({ length: 28 }, (_, i) => {
      const x = 22 + i * 13, base = 20 + 70 * Math.exp(-Math.pow((i - 6) / 7, 2)) + 25 * Math.exp(-Math.pow((i - 18) / 4, 2));
      const vals = [0, 1, 2, 3].map((k) => Math.max(8, base * (0.55 + 0.45 * Math.abs(Math.sin(i * 1.7 + k * 1.3))))).map((h) => (150 - h).toFixed(0));
      return `<rect x="${x}" width="9" rx="2" fill="url(#spg)" y="${vals[0]}" height="${150 - vals[0]}"><animate attributeName="y" values="${vals.join(';')};${vals[0]}" dur="${(1.2 + (i % 5) * 0.15).toFixed(2)}s" repeatCount="indefinite"/><animate attributeName="height" values="${vals.map((v) => 150 - v).join(';')};${150 - vals[0]}" dur="${(1.2 + (i % 5) * 0.15).toFixed(2)}s" repeatCount="indefinite"/></rect>`;
    }).join('')}
    <path d="M18 150 H382" stroke="#2a3443"/>
    <text x="30" y="24" fill="#8d9aae" font-family="JetBrains Mono" font-size="11">BT ▸ LPF ▸ REVERB ▸ DAC</text>`),
  morse: (() => {
    // "·– ––" = "AM" in Morse, as a key signal
    const seq = [1, 0, 3, 0, 0, 0, 3, 0, 3];
    let x = 40, wave = 'M 20 135 L 40 135';
    seq.forEach((s) => { const w = s === 0 ? 10 : s * 14; if (s) wave += ` L ${x} 108 L ${x + w} 108 L ${x + w} 135`; x += w + 6; wave += ` L ${x} 135`; });
    wave += ' L 380 135';
    return SVG(`<rect width="400" height="170" fill="#0a1018"/>
      <path d="${wave}" stroke="#3ee6ff" stroke-width="2" fill="none" opacity=".85"/>
      <rect x="196" y="22" width="170" height="70" rx="6" fill="#0f2a55" stroke="#2a3443"/>
      <text x="206" y="40" fill="#a3e635" font-family="JetBrains Mono" font-size="10">MORSE TRANSLATOR</text>
      <text x="206" y="66" fill="#e6edf6" font-family="JetBrains Mono" font-size="22" font-weight="700">·– ––</text>
      <text x="300" y="66" fill="#ffd166" font-family="JetBrains Mono" font-size="16" font-weight="700">AM</text>
      <circle cx="150" cy="56" r="9" fill="#ff5c8a"><animate attributeName="opacity" values="1;0.15;1;1;0.15;1;1;1;0.15" dur="2.4s" repeatCount="indefinite"/></circle>
      <rect x="40" y="36" width="80" height="40" rx="6" fill="none" stroke="#2a3443"/><text x="56" y="61" fill="#8d9aae" font-family="JetBrains Mono" font-size="12">ESP32</text>`);
  })(),
  graph: SVG(`<rect width="400" height="170" fill="#080c13"/>
      <g stroke="#2a3443" stroke-width="2" fill="none"><path d="M70 50 L170 40 L270 70 L340 120 M70 50 L120 120 L230 125 L340 120 M170 40 L230 125"/></g>
      <path d="M70 50 L170 40 L230 125 L340 120" stroke="#3ee6ff" stroke-width="3" fill="none" stroke-dasharray="400" stroke-dashoffset="400"><animate attributeName="stroke-dashoffset" values="400;0;0" dur="3s" repeatCount="indefinite"/></path>
      ${[[70, 50], [170, 40], [270, 70], [340, 120], [120, 120], [230, 125]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="11" fill="#0d131d" stroke="${i % 5 === 0 || i === 3 ? '#3ee6ff' : '#5b6779'}" stroke-width="2"/><text x="${x}" y="${y + 4}" text-anchor="middle" fill="#e6edf6" font-family="JetBrains Mono" font-size="11">${i}</text>`).join('')}
      <text x="150" y="90" fill="#8b7bff" font-family="JetBrains Mono" font-size="11">-3</text>`),
  image: SVG(`<defs><linearGradient id="ig" x1="0" x2="1"><stop offset="0" stop-color="#3ee6ff"/><stop offset=".5" stop-color="#8b7bff"/><stop offset="1" stop-color="#ff5c8a"/></linearGradient>
      <clipPath id="half"><rect x="0" y="0" width="200" height="170"><animate attributeName="width" values="120;280;120" dur="5s" repeatCount="indefinite"/></rect></clipPath></defs>
      <rect width="400" height="170" fill="#0d131d"/>
      <path d="M0 140 L80 80 L140 120 L220 60 L300 115 L400 70 L400 170 L0 170Z" fill="#2a3443"/>
      <circle cx="320" cy="50" r="16" fill="#5b6779"/>
      <g clip-path="url(#half)"><rect width="400" height="170" fill="url(#ig)" opacity=".85"/><path d="M0 140 L80 80 L140 120 L220 60 L300 115 L400 70 L400 170 L0 170Z" fill="#06090f" opacity=".55"/></g>
      <text x="30" y="28" fill="#e6edf6" font-family="JetBrains Mono" font-size="12">fn apply_filter()</text>`),
  scope: SVG(`<rect width="400" height="170" fill="#07120e"/>
    <g stroke="rgba(74,222,128,.12)">${Array.from({ length: 9 }, (_, i) => `<path d="M${40 + i * 40} 0V170"/>`).join('')}${Array.from({ length: 5 }, (_, i) => `<path d="M0 ${25 + i * 30}H400"/>`).join('')}</g>
    <path d="M200 40 C 245 40 270 70 270 85 C 270 120 225 135 200 135 C 160 135 130 110 130 85 C 130 60 160 40 200 40 M175 75 a8 8 0 1 0 1 0 M225 75 a8 8 0 1 0 1 0 M170 105 Q200 125 230 105" stroke="#4ade80" stroke-width="2.2" fill="none" filter="drop-shadow(0 0 4px #4ade80)" stroke-dasharray="520" stroke-dashoffset="520"><animate attributeName="stroke-dashoffset" values="520;0;0;520" dur="5s" repeatCount="indefinite"/></path>
    <text x="30" y="24" fill="#4ade80" font-family="JetBrains Mono" font-size="11">CH1 → X  CH2 → Y</text>`),
  eye: SVG(`<rect width="400" height="170" fill="#0b0f17"/>
    <path d="M120 85 Q200 25 280 85 Q200 145 120 85Z" fill="none" stroke="#8b7bff" stroke-width="2"/>
    <circle cx="200" cy="85" r="24" fill="none" stroke="#3ee6ff" stroke-width="2"><animate attributeName="cx" values="185;215;200;185" dur="4s" repeatCount="indefinite"/></circle>
    <circle cx="200" cy="85" r="9" fill="#3ee6ff"><animate attributeName="cx" values="185;215;200;185" dur="4s" repeatCount="indefinite"/></circle>
    ${[[60, 40], [340, 40], [200, 150], [60, 140], [340, 140]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#ffd166"/>`).join('')}
    <text x="30" y="24" fill="#8d9aae" font-family="JetBrains Mono" font-size="11">homography · 5-pt calib</text>`),
  wave: SVG(`<rect width="400" height="170" fill="#0d0b14"/>
    <path d="${Array.from({ length: 81 }, (_, i) => `${i ? 'L' : 'M'}${i * 5} ${95 - Math.sin(i / 6) * 55}`).join(' ')}" stroke="#3a4657" stroke-width="2" fill="none"/>
    <path d="${Array.from({ length: 81 }, (_, i) => { let y = Math.sin(i / 6) * 55; if (y > 30) y = 60 - y; return `${i ? 'L' : 'M'}${i * 5} ${95 - y}`; }).join(' ')}" stroke="#ff5c8a" stroke-width="2.5" fill="none"/>
    <path d="M0 65 H400" stroke="#ffd166" stroke-dasharray="4 5" opacity=".6"/>
    <text x="30" y="24" fill="#8d9aae" font-family="JetBrains Mono" font-size="11">wavefold @ threshold</text>`),
  rover: SVG(`<rect width="400" height="170" fill="#140d0a"/>
    ${Array.from({ length: 7 }, (_, r) => Array.from({ length: 12 }, (_, c) => `<rect x="${12 + c * 32}" y="${12 + r * 22}" width="28" height="18" rx="3" fill="rgba(226,160,82,${((r * 7 + c * 3) % 5) * 0.05 + 0.04})"/>`).join('')).join('')}
    <path d="M44 143 H140 V77 H268 V33 H364" stroke="#e2a052" stroke-width="3" fill="none" stroke-dasharray="460" stroke-dashoffset="460"><animate attributeName="stroke-dashoffset" values="460;0;0" dur="4s" repeatCount="indefinite"/></path>
    <circle cx="364" cy="33" r="7" fill="#4ade80"/><text x="30" y="164" fill="#8d9aae" font-family="JetBrains Mono" font-size="10">cost map → base</text>`),
  table: SVG(`<rect width="400" height="170" fill="#0b0f17"/>
    ${['id', 'name', 'age', 'city'].map((h, i) => `<text x="${40 + i * 85}" y="40" fill="#3ee6ff" font-family="JetBrains Mono" font-size="12">${h}</text>`).join('')}
    <path d="M30 50 H370" stroke="#2a3443"/>
    ${[[1, 'Ada', 36, 'London'], [2, 'Linus', 54, 'Helsinki'], [3, 'Grace', 85, 'NYC'], [4, 'Alan', 41, 'Bletchley']].map((r, j) => r.map((v, i) => `<text x="${40 + i * 85}" y="${72 + j * 22}" fill="${j === 1 ? '#e6edf6' : '#8d9aae'}" font-family="JetBrains Mono" font-size="12">${v}</text>`).join('')).join('')}
    <rect x="30" y="81" width="340" height="20" rx="4" fill="rgba(62,230,255,.08)"/>`),
  marauder: '<canvas class="art-canvas" aria-hidden="true"></canvas>',
  erd: SVG(`<rect width="400" height="170" fill="#0b0f17"/>
    ${[['Artist', 40, 46, ['id', 'name', 'bio']], ['Artwork', 160, 84, ['id', 'title', 'artist_id']], ['Exhibition', 280, 46, ['id', 'gallery_id', 'date']]].map(([t, x, y, cols]) => `<rect x="${x}" y="${y}" width="96" height="${22 + cols.length * 16}" rx="6" fill="#121a26" stroke="#2a3443"/><rect x="${x}" y="${y}" width="96" height="20" rx="6" fill="#1e3a5f"/><text x="${x + 8}" y="${y + 14}" fill="#e6edf6" font-family="JetBrains Mono" font-size="10" font-weight="700">${t}</text>${cols.map((c, i) => `<text x="${x + 8}" y="${y + 34 + i * 16}" fill="${c.endsWith('id') ? '#ffd166' : '#8d9aae'}" font-family="JetBrains Mono" font-size="9.5">${c}</text>`).join('')}`).join('')}
    <path d="M136 80 C150 80 145 132 160 132" stroke="#3ee6ff" stroke-width="1.5" fill="none" stroke-dasharray="4 3"><animate attributeName="stroke-dashoffset" values="14;0" dur="1s" repeatCount="indefinite"/></path>
    <path d="M256 116 C270 116 266 80 280 80" stroke="#3ee6ff" stroke-width="1.5" fill="none" stroke-dasharray="4 3"><animate attributeName="stroke-dashoffset" values="14;0" dur="1s" repeatCount="indefinite"/></path>
    <text x="30" y="24" fill="#8d9aae" font-family="JetBrains Mono" font-size="11">JavaFX · JDBC · MySQL</text>`),
  hanoi: SVG(`<rect width="400" height="170" fill="#0b0f17"/>
    <path d="M30 140 H370" stroke="#2a3443" stroke-width="4" stroke-linecap="round"/>
    ${[90, 200, 310].map((x, i) => `<path d="M${x} 140 V62" stroke="#3a4657" stroke-width="5" stroke-linecap="round"/><text x="${x}" y="160" text-anchor="middle" fill="#8d9aae" font-family="JetBrains Mono" font-size="10">${'ABC'[i]}</text>`).join('')}
    <rect x="54" y="122" width="72" height="16" rx="5" fill="#8b7bff"/>
    <rect x="64" y="104" width="52" height="16" rx="5" fill="#3ee6ff"/>
    <rect x="282" y="122" width="56" height="16" rx="5" fill="#4ade80" opacity=".35"/>
    <g><rect x="-16" y="-8" width="32" height="16" rx="5" fill="#ff5c8a"/>
      <animateMotion dur="3.2s" repeatCount="indefinite" keyPoints="0;0;1;1" keyTimes="0;.15;.85;1" calcMode="linear" path="M90 94 V40 H310 V112"/></g>
    <text x="200" y="44" text-anchor="middle" fill="#ffd166" font-family="JetBrains Mono" font-size="10">state AAB → AAC</text>`),
  kanban: SVG(`<rect width="400" height="170" fill="#0b0f17"/>
    ${[['TODO', '#8d9aae', 40], ['DOING', '#ffd166', 160], ['DONE', '#4ade80', 280]].map(([h, c, x]) => `<text x="${x}" y="44" fill="${c}" font-family="JetBrains Mono" font-size="11" font-weight="700">${h}</text><rect x="${x - 8}" y="52" width="104" height="106" rx="8" fill="rgba(255,255,255,.025)" stroke="#1f2836"/>`).join('')}
    <rect x="40" y="62" width="88" height="26" rx="5" fill="#141c28" stroke="#2a3443"/><rect x="40" y="96" width="88" height="26" rx="5" fill="#141c28" stroke="#2a3443"/>
    <rect x="280" y="62" width="88" height="26" rx="5" fill="#122019" stroke="#235a3a"/>
    <rect x="40" y="128" width="88" height="26" rx="5" fill="#1a1630" stroke="#8b7bff"><animate attributeName="x" values="40;40;160;160;280;280;40" keyTimes="0;.15;.35;.5;.7;.9;1" dur="6s" repeatCount="indefinite"/><animate attributeName="y" values="128;128;62;62;96;96;128" keyTimes="0;.15;.35;.5;.7;.9;1" dur="6s" repeatCount="indefinite"/></rect>
    <text x="30" y="24" fill="#8d9aae" font-family="JetBrains Mono" font-size="11">Vue · Express · Sequelize</text>`),
  robot: SVG(`<rect width="400" height="170" fill="#0b1019"/>
    <path d="M40 120 C 40 40, 180 30, 220 70 S 360 140, 360 70" stroke="#dfe5ee" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M220 70 C 260 110, 320 140, 360 70" stroke="#ff3b4e" stroke-width="5" fill="none" stroke-linecap="round"/>
    <g><animateMotion dur="6s" repeatCount="indefinite" rotate="auto" path="M40 120 C 40 40, 180 30, 220 70 S 360 140, 360 70"/>
      <rect x="-16" y="-11" width="32" height="22" rx="4" fill="#2a303a" stroke="#3ee6ff"/><rect x="-6" y="-8" width="12" height="16" fill="#1d6b3c"/>
      <path d="M16 0 L60 -22 L60 22Z" fill="#3ee6ff" opacity=".12"/></g>
    <rect x="282" y="112" width="62" height="40" rx="3" fill="none" stroke="#ff5c8a"/><text x="282" y="107" fill="#ff5c8a" font-family="JetBrains Mono" font-size="10">yolo 0.93</text>
    <text x="30" y="24" fill="#8d9aae" font-family="JetBrains Mono" font-size="11">4 zones · state machine</text>`),
  fpga: SVG(`<rect width="400" height="170" fill="#08130f"/>
    <rect x="60" y="30" width="280" height="120" rx="8" fill="#0c2f2c" stroke="#1d4b45"/>
    <rect x="90" y="55" width="60" height="60" rx="4" fill="#16191f"/><text x="120" y="90" text-anchor="middle" fill="#8d9aae" font-family="JetBrains Mono" font-size="9">ARTIX-7</text>
    ${[0, 1, 2, 3].map((i) => `<rect x="${200 + i * 30}" y="70" width="14" height="8" rx="2" fill="#39ff6a" opacity=".15"><animate attributeName="opacity" values="${[0, 1, 2, 3].map((k) => (k === i ? 1 : 0.15)).join(';')}" dur="2.4s" repeatCount="indefinite"/></rect><rect x="${198 + i * 30}" y="100" width="18" height="18" rx="3" fill="#cfd6de"/><circle cx="${207 + i * 30}" cy="109" r="5" fill="#111317"/>`).join('')}
    <text x="30" y="24" fill="#8d9aae" font-family="JetBrains Mono" font-size="11">reflex_top.vhd · FSM · PRNG</text>`),
  automata: SVG(`<rect width="400" height="170" fill="#0b0f17"/>
    ${[[80, 'q0'], [200, 'q1'], [320, 'q2']].map(([x, q]) => `<circle cx="${x}" cy="95" r="22" fill="#0d131d" stroke="${q === 'q2' ? '#4ade80' : '#5b6779'}" stroke-width="2"/>${q === 'q2' ? `<circle cx="${x}" cy="95" r="17" fill="none" stroke="#4ade80"/>` : ''}<text x="${x}" y="100" text-anchor="middle" fill="#e6edf6" font-family="JetBrains Mono" font-size="13">${q}</text>`).join('')}
    <path d="M102 88 Q140 60 178 88 M222 88 Q260 60 298 88" stroke="#3ee6ff" stroke-width="2" fill="none"/>
    <circle r="5" fill="#3ee6ff"><animateMotion dur="2.5s" repeatCount="indefinite" path="M102 88 Q140 60 178 88 M222 88 Q260 60 298 88"/></circle>
    <text x="30" y="24" fill="#8d9aae" font-family="JetBrains Mono" font-size="11">Java · Swing · Graphviz</text>`),
  nn: SVG(`<rect width="400" height="170" fill="#0b0f17"/>
    ${[[90, 4], [180, 5], [270, 5], [340, 3]].map(([x, n], l, arr) => Array.from({ length: n }, (_, i) => {
      const y = 95 + (i - (n - 1) / 2) * 26;
      const next = arr[l + 1];
      const lines = next ? Array.from({ length: next[1] }, (_, j) => `<path d="M${x} ${y} L${next[0]} ${95 + (j - (next[1] - 1) / 2) * 26}" stroke="#3ee6ff" opacity=".12"/>`).join('') : '';
      return `${lines}<circle cx="${x}" cy="${y}" r="7" fill="${l === 3 && i === 0 ? '#4ade80' : '#0d131d'}" stroke="#3ee6ff" stroke-width="1.5"><animate attributeName="opacity" values="1;.45;1" dur="${1.5 + l * 0.3}s" repeatCount="indefinite"/></circle>`;
    }).join('')).join('')}
    <text x="30" y="24" fill="#8d9aae" font-family="JetBrains Mono" font-size="11">CNN · PlantVillage · ~98 %</text>`),
};
// pull the corner caption out of each illustration (rendered as HTML instead)
const ART_LABEL = {};
for (const [k, svg] of Object.entries(ART)) {
  const m = svg.match(/<text x="(?:30|60)" y="(?:24|28|164)"[^>]*>([^<]*)<\/text>/);
  if (m) { ART_LABEL[k] = m[1]; ART[k] = svg.replace(m[0], ''); }
}
const artLabel = (k) => (ART_LABEL[k] ? `<span class="card-art-label mono">${ART_LABEL[k]}</span>` : '');
const grid = $('#project-grid');
grid.innerHTML = featured.map((p) => `
  <article class="card feat-card reveal" data-cats="${p.cats.join(' ')}" data-feat="${p.id}">
    <div class="card-art">${p.gif ? `<img class="card-gif" src="${p.gif}" alt="" loading="lazy">` : ART[p.visual] || ''}${artLabel(p.visual)}<span class="card-badge featured"></span></div>
    <div class="card-body"></div>
  </article>`).join('') + projects.map((p, i) => `
  <article class="card reveal" data-cats="${p.cats.join(' ')}" data-i="${i}">
    <div class="card-art"${p.imgBg ? ` style="background:${p.imgBg}"` : ''}>${p.img
      ? `<img class="card-img" src="${p.img}" alt="" loading="lazy">`
      : ART[p.art] || ''}${artLabel(p.art)}<span class="card-badge" hidden></span></div>
    <div class="card-body"></div>
  </article>`).join('') + `
  <article class="card more reveal" data-cats="all">
    <h3 data-i18n="projects.moreTitle"></h3>
    <p data-i18n="projects.moreDesc"></p>
    <a class="btn btn-ghost" href="${profile.github}" target="_blank" rel="noopener">${ICONS.github.replace('<svg', '<svg width="18" height="18"')} ant-one-dev</a>
  </article>`;
function renderCards() {
  featured.forEach((p) => {
    const card = grid.querySelector(`.card[data-feat="${p.id}"]`);
    card.querySelector('.card-badge').textContent = tr('projects.featured');
    card.querySelector('.card-body').innerHTML = `
      <div class="card-top"><h3>${esc(t(p.title))}</h3><span>${esc(p.year)}</span></div>
      <p>${esc(t(p.summary))}</p>
      <div class="tags">${p.tags.slice(0, 6).map((s) => `<span>${esc(s)}</span>`).join('')}</div>
      <div class="card-links">
        <a class="card-link" href="#p-${p.id}">${tr('projects.details')}</a>
        ${p.repo ? `<a class="card-link" href="${esc(p.repo)}" target="_blank" rel="noopener">GitHub ${ICONS.ext}</a>` : ''}
      </div>`;
  });
  projects.forEach((p, i) => {
    const card = grid.querySelector(`.card[data-i="${i}"]`);
    const badge = card.querySelector('.card-badge');
    badge.hidden = !p.status;
    if (p.status) {
      badge.textContent = tr(p.status === 'wip' ? 'projects.wip' : 'projects.side');
      badge.className = `card-badge ${p.status}`;
    }
    card.querySelector('.card-body').innerHTML = `
      <div class="card-top"><h3>${esc(t(p.title))}</h3><span>${esc(p.year)}</span></div>
      <p>${esc(t(p.desc))}</p>
      <div class="tags">${p.tags.map((s) => `<span>${esc(s)}</span>`).join('')}</div>
      ${p.repo
        ? `<a class="card-link" href="${esc(p.repo)}" target="_blank" rel="noopener">${tr('projects.source')} ${ICONS.ext}</a>`
        : p.status === 'wip' ? '' : `<span class="card-lock">${ICONS.lock} ${tr('projects.private')}</span>`}`;
  });
}
onLang.push(renderCards);

// card spotlight + tilt
if (matchMedia('(pointer: fine)').matches && !reduceMotion) {
  $$('.card').forEach((c) => {
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--mx', `${x * 100}%`);
      c.style.setProperty('--my', `${y * 100}%`);
      c.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 6}deg) rotateY(${(x - 0.5) * 8}deg) translateY(-4px)`;
    });
    c.addEventListener('pointerleave', () => { c.style.transform = ''; });
  });
}

/* ───────── filters ───────── */
const bindFilters = (bar, apply) => {
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $$('button', bar).forEach((x) => x.classList.toggle('active', x === b));
    apply(b.dataset.filter);
  });
};
// filter the cards; featured projects also show up as cards when a specific filter is on
function applyProjectFilter(f) {
  const match = (el) => el.dataset.cats === 'all' || f === 'all' || el.dataset.cats.split(' ').includes(f);
  let shown = 0;
  $$('#project-grid .card').forEach((el) => {
    const ok = el.dataset.feat ? f !== 'all' && match(el) : match(el);
    el.classList.toggle('hide', !ok);
    if (ok) { el.classList.add('in'); if (el.dataset.cats !== 'all') shown++; }
  });
  $('#filter-empty').hidden = shown > 0;
}
bindFilters($('#project-filters'), applyProjectFilter);
applyProjectFilter('all');

/* ───────── timeline ───────── */
// logo band (rendered twice so the marquee loops seamlessly)
const logoTile = (k) => `<span class="logo-tile" title="${esc(logos[k].name)}"><img src="${logos[k].src}" alt="${esc(logos[k].name)}" loading="lazy"${logos[k].light ? ' class="light"' : ''}></span>`;
$('#logo-marquee').innerHTML = `<div class="logo-track">${logoStrip.map(logoTile).join('')}</div><div class="logo-track" aria-hidden="true">${logoStrip.map(logoTile).join('')}</div>`;

// icons for timeline steps without an official logo
const TL_ICONS = {
  next: ic('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/>'),
  chip: ic('<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 7V4M14 7V4M10 20v-3M14 20v-3M7 10H4M7 14H4M20 10h-3M20 14h-3"/>'),
  trophy: ic('<path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M8 20h8M9 17h6"/>'),
};
const tlList = $('#timeline-list');
tlList.insertAdjacentHTML('beforeend', timeline.map((e, i) => `
  <div class="tl-item reveal" data-type="${e.type}" data-i="${i}">
    <span class="tl-node"></span>
    <div class="tl-card">
      <span class="tl-logo ${e.logo ? '' : 'is-icon'}">${e.logo
        ? `<img src="${logos[e.logo].src}" alt="${esc(logos[e.logo].name)}" loading="lazy">`
        : TL_ICONS[e.icon] || ''}</span>
      <div class="tl-body"></div>
    </div>
  </div>`).join(''));
function renderTimeline() {
  timeline.forEach((e, i) => {
    tlList.querySelector(`.tl-item[data-i="${i}"] .tl-body`).innerHTML = `
      <div class="tl-meta"><span class="tl-date">${esc(t(e.date))}</span><span class="tl-type">${tr(`tl.${e.type}`)}</span></div>
      <h3>${esc(t(e.title))}</h3>
      <div class="tl-org">${esc(t(e.org))}</div>
      <p>${esc(t(e.desc))}</p>`;
  });
}
onLang.push(renderTimeline);
bindFilters($('#timeline-filters'), (f) => {
  $$('.tl-item').forEach((el) => {
    // the "next step" card stays visible in every view
    el.classList.toggle('hide', !(f === 'all' || el.dataset.type === f || el.dataset.type === 'next'));
    el.classList.add('in');
  });
  updateTimelineSignal();
});
const tlSignal = $('#tl-signal');
function updateTimelineSignal() {
  const r = tlList.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
  tlSignal.style.height = `${p * 100}%`;
  const head = r.top + p * r.height;
  $$('.tl-item:not(.hide)', tlList).forEach((it) => {
    const node = it.querySelector('.tl-node').getBoundingClientRect();
    const lit = node.top + node.height / 2 <= head + 2;
    if (lit !== it.classList.contains('lit')) it.classList.toggle('lit', lit);
  });
  tlSignal.classList.toggle('moving', p > 0 && p < 1);
}

/* ───────── about counters ───────── */
const countObs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    countObs.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, pre = el.dataset.prefix || '';
    if (reduceMotion || to < 2) return;
    const t0 = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / 1200);
      el.textContent = pre + Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}, { threshold: 0.6 });
$$('[data-count]').forEach((el) => countObs.observe(el));

/* ───────── copy email ───────── */
const copyBtn = $('#copy-email');
copyBtn.addEventListener('click', async () => {
  const hint = $('.copy-hint', copyBtn);
  try {
    await navigator.clipboard.writeText(copyBtn.dataset.email);
    hint.textContent = tr('contact.copied');
  } catch {
    location.href = `mailto:${copyBtn.dataset.email}`;
  }
  setTimeout(() => { hint.textContent = tr('contact.copy'); }, 2000);
});
$('#year').textContent = new Date().getFullYear();

/* ───────── first render ───────── */
applyStatic();
onLang.forEach((fn) => fn());

/* ───────── reveal on scroll ───────── */
const revObs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); revObs.unobserve(e.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
$$('.reveal').forEach((el) => revObs.observe(el));

/* ───────── visuals ───────── */
const hud = (el, rows) => {
  el.innerHTML = rows.map(([k, v, cls = 'v']) => `<div><span class="k">${k}</span> <span class="${cls}">${v}</span></div>`).join('');
};
const visual = (name) => $(`.feat-visual[data-visual="${name}"]`);

// 2D visuals (no dependencies)
{
  const v = visual('automata');
  if (v) initAutomata($('svg', v), (s) => hud($('.viz-hud', v), [
    ['word', `"${s.word}"`], ['state', s.state],
    ['result', s.result ?? '…', s.result === 'ACCEPTED' ? 'ok' : s.result === 'REJECTED' ? 'bad' : 'v'],
  ]));
}
{
  const v = visual('nn');
  if (v) initNN($('canvas', v), (s) => hud($('.viz-hud', v), [
    ['input', `leaf_${s.sample}.jpg`], ['prediction', s.label, s.healthy ? 'ok' : 'warn'], ['confidence', `${(s.conf * 100).toFixed(1)}%`],
  ]));
}
const mapCanvas = $('#project-grid .art-canvas');
if (mapCanvas) initMarauder(mapCanvas);

// 3D scenes (Three.js from CDN). Wait for fonts so canvas labels render correctly.
const fontsReady = Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1500))]);
fontsReady.then(() => import('./three-scenes.js?v=20261017b')).then((m) => {
  const safe = (fn) => { try { fn(); } catch (err) { console.warn('[3D]', err); } };
  safe(() => m.initHero($('#hero-canvas')));
  const fv = visual('fpga');
  if (fv) {
    const h = $('.viz-hud', fv);
    const game = {};
    safe(() => m.initFPGA($('canvas', fv), (ev) => {
      const s = Object.assign(game, ev);
      const cls = s.state === 'HIT' ? 'ok' : s.state === 'MISS' ? 'bad' : s.state === 'GO' ? 'warn' : 'v';
      hud(h, [
        ['fsm', s.state, cls],
        ['reaction', s.ms ? `${s.ms} ms` : '—'],
        ['best', s.best ? `${s.best} ms` : '—'],
      ]);
    }));
  }
  const rv = visual('robot');
  if (rv) {
    safe(() => m.initRobot($('canvas', rv), (s) => hud($('.viz-hud', rv), [
      ['zone', s.zone, 'ok'],
      ['state', s.mode, s.mode === 'RUNNING' ? 'v' : 'warn'],
      ['sensors', s.sensors],
    ])));
  }
}).catch((err) => {
  console.warn('3D disabled:', err);
  document.documentElement.classList.add('no-webgl');
});

onScroll();
