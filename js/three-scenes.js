// Three.js scenes: hero chip, FPGA board (reflex game), Vigibot robot.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const speed = reduceMotion ? 0 : 1;

/* ───────── shared loop & pointer ───────── */
const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  pointer.tx = (e.clientX / innerWidth) * 2 - 1;
  pointer.ty = (e.clientY / innerHeight) * 2 - 1;
}, { passive: true });

const stages = new Set();
const clock = new THREE.Clock();
let looping = false;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05) * speed;
  pointer.x += (pointer.tx - pointer.x) * 0.05;
  pointer.y += (pointer.ty - pointer.y) * 0.05;
  for (const s of stages) {
    if (!s.visible) continue;
    s.time += dt;
    s.tick(dt, s.time);
    s.renderer.render(s.scene, s.camera);
  }
}

function makeStage(canvas, { fov = 35, maxDpr = 2 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, maxDpr));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 200);
  const stage = { renderer, scene, camera, visible: false, time: 0, tick: () => {}, onResize: null };

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    stage.onResize?.(w, h);
    camera.updateProjectionMatrix();
    if (!stage.visible) renderer.render(scene, camera);
  };
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => {
    stage.visible = e.isIntersecting;
    // hidden canvases are skipped by the compositor
    canvas.style.visibility = e.isIntersecting ? '' : 'hidden';
  }, { rootMargin: '100px' }).observe(canvas);
  stages.add(stage);
  if (!looping) { looping = true; loop(); }
  requestAnimationFrame(resize);
  return stage;
}

/* ───────── helpers ───────── */
function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

let _glow;
function glowTexture() {
  if (_glow) return _glow;
  _glow = canvasTexture(128, 128, (g) => {
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.18, 'rgba(255,255,255,.85)');
    grd.addColorStop(0.45, 'rgba(255,255,255,.18)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  });
  return _glow;
}
function glowSprite(color, scale = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(), color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
  }));
  s.scale.setScalar(scale);
  return s;
}
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1, ...o });
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const rbox = (w, h, d, r, m) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, r), m);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const rand = (a, b) => a + Math.random() * (b - a);
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0);

/* ═════════════════════════ HERO: microcontroller on a PCB (photoreal) ═════════════════════════ */
function noiseTexture(size = 256, lo = 0.35, hi = 0.65, repeat = 1) {
  const tex = canvasTexture(size, size, (g, w, h) => {
    const img = g.createImageData(w, h);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.round((lo + Math.random() * (hi - lo)) * 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  return tex;
}

export function initHero(canvas) {
  const st = makeStage(canvas, { fov: 30, maxDpr: 1.5 });
  const { scene, camera, renderer } = st;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // the scene never moves (only the camera does), so shadows are rendered once
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.toneMappingExposure = 1.15;
  scene.fog = new THREE.Fog(0x06090f, 16, 36);

  const root = new THREE.Group();
  scene.add(root);

  // lighting: warm key with soft shadows, cool rim, dim fill
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x0a0806, 0.35));
  const key = new THREE.DirectionalLight(0xfff3e6, 2.6);
  key.position.set(5, 11, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 30 });
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9db8ff, 1.1);
  rim.position.set(-8, 5, -7);
  scene.add(rim);

  const S = 4, H = 0.4, BASE = 0.1; // chip size, thickness, stand-off
  const N = 14, PITCH = 0.26;

  // ── board: black soldermask over FR4, glossy lacquer ──
  const maskRough = noiseTexture(256, 0.45, 0.62, 18);
  const maskMat = new THREE.MeshStandardMaterial({
    color: 0x0c110f, roughness: 0.42, roughnessMap: maskRough, metalness: 0.05,
  });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), maskMat);
  board.rotation.x = -Math.PI / 2;
  board.receiveShadow = true;
  root.add(board);

  // copper under the mask shows as slightly raised, lighter ridges
  const traceMat = new THREE.MeshStandardMaterial({ color: 0x1a221e, roughness: 0.3, metalness: 0.2 });
  const enig = mat(0xd9ad55, { metalness: 1, roughness: 0.28 }); // gold-finish pads
  const tin = mat(0xc9cdd2, { metalness: 1, roughness: 0.32 });
  const solder = mat(0xb9bec4, { metalness: 1, roughness: 0.18 });

  const traceGeos = [], padGeos = [], viaGeos = [], holeGeos = [];
  const P = (o, d, off, y = 0.004) => new THREE.Vector3(o.nx * d + o.tx * off, y, o.nz * d + o.tz * off);
  const pins = [];
  for (let side = 0; side < 4; side++) {
    const a = side * Math.PI / 2;
    const o = { nx: Math.cos(a), nz: Math.sin(a), tx: -Math.sin(a), tz: Math.cos(a), a };
    for (let i = 0; i < N; i++) {
      const off = (i - (N - 1) / 2) * PITCH;
      pins.push({ ...o, off });
      // pad under the pin foot
      const pad = P(o, S / 2 + 0.47, off, 0.006);
      padGeos.push(new THREE.BoxGeometry(0.42, 0.012, 0.15).rotateY(-a).translate(pad.x, pad.y, pad.z));
      // trace: out, 45° fan-out, then straight to a via
      const d0 = S / 2 + 0.68, run = 0.3, spread = 1.65;
      const offOut = off * spread, dd = Math.abs(offOut - off);
      const L = d0 + run + dd + 2.2 + ((i * 7 + side * 3) % 5) * 1.6;
      const pts = [P(o, S / 2 + 0.47, off), P(o, d0 + run, off), P(o, d0 + run + dd, offOut), P(o, L, offOut)];
      for (let k = 1; k < pts.length; k++) {
        const A = pts[k - 1], B = pts[k], len = A.distanceTo(B);
        if (len < 1e-4) continue;
        traceGeos.push(new THREE.BoxGeometry(len + 0.06, 0.008, 0.06)
          .rotateY(-Math.atan2(B.z - A.z, B.x - A.x)).translate((A.x + B.x) / 2, 0.004, (A.z + B.z) / 2));
      }
      const end = pts[pts.length - 1];
      viaGeos.push(new THREE.RingGeometry(0.045, 0.11, 20).rotateX(-Math.PI / 2).translate(end.x, 0.009, end.z));
      holeGeos.push(new THREE.CircleGeometry(0.045, 16).rotateX(-Math.PI / 2).translate(end.x, 0.008, end.z));
    }
  }
  const traces = new THREE.Mesh(mergeGeometries(traceGeos), traceMat);
  traces.receiveShadow = true;
  root.add(traces);
  const pads = new THREE.Mesh(mergeGeometries(padGeos), enig);
  pads.receiveShadow = true;
  root.add(pads);
  root.add(new THREE.Mesh(mergeGeometries(viaGeos), enig));
  root.add(new THREE.Mesh(mergeGeometries(holeGeos), new THREE.MeshBasicMaterial({ color: 0x020303 })));

  // silkscreen: chip outline, pin-1 mark, reference designators
  const silk = canvasTexture(2048, 2048, (g, w, h) => {
    const u = w / 16; // 16×16 board units
    const X = (x) => w / 2 + x * u, Z = (z) => h / 2 + z * u;
    g.clearRect(0, 0, w, h);
    g.strokeStyle = g.fillStyle = 'rgba(236,238,232,.92)';
    g.lineWidth = 0.035 * u;
    const c = S / 2 + 0.95;
    g.beginPath();
    g.moveTo(X(-c + 0.5), Z(-c)); g.lineTo(X(-c), Z(-c)); g.lineTo(X(-c), Z(-c + 0.5));
    [[1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => {
      g.moveTo(X(sx * c - sx * 0.5), Z(sz * c)); g.lineTo(X(sx * c), Z(sz * c)); g.lineTo(X(sx * c), Z(sz * c - sz * 0.5));
    });
    g.stroke();
    g.beginPath(); g.arc(X(-c - 0.25), Z(-c - 0.25), 0.09 * u, 0, 7); g.fill();
    g.font = `600 ${0.36 * u}px "JetBrains Mono", monospace`;
    g.fillText('U1', X(c - 0.6), Z(-c - 0.2));
    const label = (txt, x, z, rot = 0) => { g.save(); g.translate(X(x), Z(z)); g.rotate(rot); g.fillText(txt, 0, 0); g.restore(); };
    label('Y1', 4.5, 3.2); label('C3', 3.0, 4.6); label('C4', 4.7, 2.3);
    label('U2', -5.3, -3.0); label('C1', -3.3, -4.7); label('C2', -4.8, -3.9);
    label('D1', -4.6, 3.4); label('R1', -3.2, 4.6);
    label('C5', 3.4, -4.2); label('C6', 4.6, -3.3);
    g.font = `500 ${0.3 * u}px "JetBrains Mono", monospace`;
    label('AM-CORE  REV B', -6.8, 7.2);
    label('MADE IN PARIS', 3.6, 7.2);
  });
  const silkMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 16),
    new THREE.MeshStandardMaterial({ map: silk, transparent: true, roughness: 0.8, depthWrite: false }));
  silkMesh.rotation.x = -Math.PI / 2;
  silkMesh.position.y = 0.011;
  silkMesh.receiveShadow = true;
  root.add(silkMesh);

  // ── the QFP package ──
  const chip = new THREE.Group();
  root.add(chip);
  const epoxyBump = noiseTexture(256, 0.3, 0.7, 3);
  const epoxy = new THREE.MeshStandardMaterial({
    color: 0x18191b, roughness: 0.78, metalness: 0, bumpMap: epoxyBump, bumpScale: 0.6,
  });
  const body = new THREE.Mesh(new RoundedBoxGeometry(S, H, S, 3, 0.05), epoxy);
  body.position.y = BASE + H / 2;
  body.castShadow = body.receiveShadow = true;
  chip.add(body);

  // laser-etched marking: low-contrast grey, slightly smoother than the epoxy
  const marking = canvasTexture(1024, 1024, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(160,164,170,.55)';
    g.beginPath(); g.arc(120, 120, 46, 0, 7); g.fill();          // pin-1 dimple
    g.fillStyle = 'rgba(176,180,186,.82)';
    g.textAlign = 'center';
    g.font = '600 168px "Space Grotesk", sans-serif';
    g.fillText('AM', w / 2, h * 0.43);
    g.font = '500 78px "JetBrains Mono", monospace';
    g.fillText('AM32-M1', w / 2, h * 0.58);
    g.font = '500 54px "JetBrains Mono", monospace';
    g.fillText('EMB·ROBOTICS·DRONES', w / 2, h * 0.68);
    g.fillText('2611  EFR  FRANCE', w / 2, h * 0.77);
  });
  const top = new THREE.Mesh(new THREE.PlaneGeometry(S * 0.92, S * 0.92),
    new THREE.MeshStandardMaterial({ map: marking, transparent: true, roughness: 0.55, metalness: 0, depthWrite: false }));
  top.rotation.x = -Math.PI / 2;
  top.position.y = BASE + H + 0.002;
  chip.add(top);

  // gull-wing leads (instanced) + solder fillets
  const leadGeo = mergeGeometries([
    new THREE.BoxGeometry(0.2, 0.045, 0.1).translate(0.1, BASE + 0.16, 0),
    new THREE.BoxGeometry(0.05, 0.18, 0.1).rotateZ(-0.35).translate(0.23, BASE + 0.075, 0),
    new THREE.BoxGeometry(0.24, 0.04, 0.1).translate(0.4, 0.03, 0),
  ]);
  const leads = new THREE.InstancedMesh(leadGeo, tin, pins.length);
  const fillets = new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 16, 8), solder, pins.length);
  pins.forEach((p, k) => {
    q.setFromAxisAngle(up, -p.a);
    m4.compose(new THREE.Vector3(p.nx * S / 2 + p.tx * p.off, 0, p.nz * S / 2 + p.tz * p.off), q, one);
    leads.setMatrixAt(k, m4);
    m4.compose(new THREE.Vector3(p.nx * (S / 2 + 0.42) + p.tx * p.off, 0.012, p.nz * (S / 2 + 0.42) + p.tz * p.off), q, new THREE.Vector3(0.36, 0.05, 0.12));
    fillets.setMatrixAt(k, m4);
  });
  leads.castShadow = true;
  chip.add(leads, fillets);

  // ── soldered SMD parts in the free corners ──
  const parts = new THREE.Group();
  root.add(parts);
  const place = (mesh, x, z, rot = 0) => {
    mesh.position.set(x, 0, z);
    mesh.rotation.y = rot;
    mesh.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    parts.add(mesh);
    return mesh;
  };
  const chipCap = (w, d, color) => {
    const g = new THREE.Group();
    const h = d * 0.9;
    const b = new THREE.Mesh(new RoundedBoxGeometry(w * 0.62, h, d, 2, 0.02), mat(color, { roughness: 0.6 }));
    b.position.y = h / 2 + 0.012;
    g.add(b);
    for (const sx of [-1, 1]) {
      const e = new THREE.Mesh(new RoundedBoxGeometry(w * 0.2, h * 1.02, d * 1.02, 2, 0.02), tin);
      e.position.set(sx * w * 0.4, h / 2 + 0.012, 0);
      g.add(e);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(w * 0.32, 0.012, d * 1.25), enig);
      pad.position.set(sx * w * 0.42, 0.006, 0);
      g.add(pad);
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 6), solder);
      f.scale.set(w * 0.22, 0.05, d * 1.05);
      f.position.set(sx * w * 0.5, 0.014, 0);
      g.add(f);
    }
    return g;
  };
  // crystal oscillator (metal can)
  const xtal = new THREE.Group();
  const can = new THREE.Mesh(new RoundedBoxGeometry(1.15, 0.36, 0.48, 3, 0.16), mat(0xd4d8dd, { metalness: 1, roughness: 0.22 }));
  can.position.y = 0.2;
  xtal.add(can);
  const xtalMark = canvasTexture(256, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(40,44,50,.75)'; g.textAlign = 'center';
    g.font = '600 46px "JetBrains Mono", monospace'; g.fillText('16.000', w / 2, h * 0.62);
  });
  const xm = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), new THREE.MeshStandardMaterial({ map: xtalMark, transparent: true, roughness: 0.4, depthWrite: false }));
  xm.rotation.x = -Math.PI / 2; xm.position.y = 0.381;
  xtal.add(xm);
  place(xtal, 3.9, 3.9, -Math.PI / 4);
  place(chipCap(0.36, 0.18, 0xb48a5a), 3.1, 4.3, Math.PI / 2);
  place(chipCap(0.36, 0.18, 0xb48a5a), 4.3, 3.1, 0);
  // voltage regulator (SOT-223)
  const reg = new THREE.Group();
  const rb = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.22, 0.66, 2, 0.03), epoxy);
  rb.position.y = 0.14; reg.add(rb);
  const tab = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.42), tin);
  tab.position.set(0, 0.03, -0.5); reg.add(tab);
  for (let i = -1; i <= 1; i++) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.36), tin);
    l.position.set(i * 0.3, 0.03, 0.48); reg.add(l);
  }
  place(reg, -4.2, -4.2, Math.PI / 4);
  place(chipCap(0.5, 0.26, 0x9a7a52), -3.0, -4.5, Math.PI / 2);
  place(chipCap(0.5, 0.26, 0x9a7a52), -4.6, -3.1, 0);
  // status LED + resistor
  const led = chipCap(0.34, 0.17, 0xe8eef0);
  const ledLens = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.15),
    new THREE.MeshPhysicalMaterial({ color: 0x9dffb0, emissive: 0x39ff6a, emissiveIntensity: 0, roughness: 0.1, transmission: 0.3 }));
  ledLens.position.y = 0.19;
  led.add(ledLens);
  place(led, -3.9, 3.6, 0.6);
  const ledGlow = glowSprite(0x39ff6a, 0.9);
  ledGlow.position.set(-3.9, 0.3, 3.6);
  ledGlow.material.opacity = 0;
  root.add(ledGlow);
  place(chipCap(0.36, 0.18, 0x1a1a1a), -3.2, 4.25, 0.6);
  place(chipCap(0.36, 0.18, 0xb48a5a), 3.4, -4.1, -Math.PI / 4);
  place(chipCap(0.36, 0.18, 0xb48a5a), 4.2, -3.4, -Math.PI / 4);

  // layout: chip right on desktop, chip high on mobile
  let dist = 13, wide = true;
  st.onResize = (w, h) => {
    wide = w / h > 1.05;
    dist = wide ? 14 : 25;
    if (wide) camera.setViewOffset(w, h, -w * 0.24, 0, w, h);
    else camera.setViewOffset(w, h, 0, h * 0.34, w, h);
  };

  const clk = document.getElementById('clk');
  let clkT = 0;

  st.tick = (dt, t) => {
    const intro = 1 - Math.pow(1 - clamp01(t / 2.4), 3);
    const sp = clamp01(scrollY / innerHeight);
    const d = lerp(dist + 8, dist, intro) - sp * 3;
    const elev = lerp(0.6, 0.95, sp);
    const az = 0.65 + pointer.x * 0.2 + t * 0.03;
    camera.position.set(Math.sin(az) * Math.cos(elev) * d, Math.sin(elev) * d, Math.cos(az) * Math.cos(elev) * d);
    camera.lookAt(0, 0.2 - pointer.y * 0.3, 0);

    // heartbeat on the status LED
    const beat = (t % 1.6) < 0.08 || ((t % 1.6) > 0.2 && (t % 1.6) < 0.28) ? 1 : 0;
    ledLens.material.emissiveIntensity = beat * 2.5;
    ledGlow.material.opacity = beat * 0.9;

    if (clk && (clkT += dt) > 0.4) {
      clkT = 0;
      clk.textContent = (100 + Math.sin(t * 3.1) * 0.02).toFixed(2);
    }
  };
  return st;
}

/* ═════════════════════════ FPGA board + reflex game ═════════════════════════ */
export function initFPGA(canvas, onEvent = () => {}) {
  const st = makeStage(canvas, { fov: 30 });
  const { scene, camera } = st;

  scene.add(new THREE.HemisphereLight(0xbfdfff, 0x0a0a14, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 2);
  key.position.set(4, 10, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x3ee6ff, 1.2);
  rim.position.set(-6, 3, -5);
  scene.add(rim);

  const board = new THREE.Group();
  scene.add(board);
  const W = 7.2, D = 4.8, T = 0.12;
  const pcb = rbox(W, T, D, 0.05, mat(0x0c2f2c, { roughness: 0.55, metalness: 0.15 }));
  board.add(pcb);

  // board coords → texture pixels
  const TW = 2048, TH = Math.round(2048 * D / W);
  const px = (x) => (x / W + 0.5) * TW, pz = (z) => (z / D + 0.5) * TH;

  // layout (x: right, z: towards viewer)
  const ledX = [1.15, 1.75, 2.35, 2.95];
  const ledZ = 1.0, btnZ = 1.8;
  const swX = [-2.9, -2.4, -1.9, -1.4];
  const rgbX = [-0.6, -0.15, 0.3];
  const pmodNames = ['JA', 'JB', 'JC', 'JD'];
  const pmodXs = [-0.4, 0.75, 1.9, 3.05];

  const silk = canvasTexture(TW, TH, (g) => {
    g.clearRect(0, 0, TW, TH);
    // decorative traces
    g.strokeStyle = 'rgba(80,190,160,.22)';
    g.lineWidth = 5;
    for (let i = 0; i < 26; i++) {
      const x0 = px(-0.6 + rand(-0.6, 0.6)), z0 = pz(-0.2 + rand(-0.6, 0.6));
      const x1 = px(rand(-3.3, 3.3)), z1 = pz(rand(-2.1, 2.1));
      g.beginPath(); g.moveTo(x0, z0); g.lineTo(x0, (z0 + z1) / 2); g.lineTo(x1, (z0 + z1) / 2 + Math.abs(x1 - x0) * 0.2); g.lineTo(x1, z1); g.stroke();
    }
    g.fillStyle = '#e8f1f2';
    g.textAlign = 'center';
    g.font = '600 46px "JetBrains Mono", monospace';
    ledX.forEach((x, i) => g.fillText('LD' + (4 + i), px(x), pz(ledZ - 0.28)));
    ledX.forEach((x, i) => g.fillText('BTN' + i, px(x), pz(btnZ + 0.42)));
    swX.forEach((x, i) => g.fillText('SW' + i, px(x), pz(btnZ + 0.5)));
    rgbX.forEach((x, i) => g.fillText('LD' + i, px(x), pz(ledZ - 0.28)));
    pmodXs.forEach((x, i) => g.fillText(pmodNames[i], px(x), pz(-1.75)));
    g.font = '600 34px "JetBrains Mono", monospace';
    g.fillText('5V', px(-1.3), pz(-1.8)); g.fillText('GND', px(-1.1), pz(-1.8));
    g.font = '700 84px "Space Grotesk", sans-serif';
    g.textAlign = 'left';
    g.fillText('ARTY A7', px(-3.35), pz(-1.6));
    g.font = '500 40px "JetBrains Mono", monospace';
    g.fillStyle = 'rgba(232,241,242,.7)';
    g.fillText('REFLEX.vhd · rev B', px(-3.35), pz(-1.38));
    // board outline
    g.strokeStyle = 'rgba(232,241,242,.5)';
    g.lineWidth = 4;
    g.strokeRect(px(0.75), pz(0.65), px(3.3) - px(0.75), pz(2.25) - pz(0.65));
  });
  const silkMesh = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: silk, transparent: true, roughness: 0.6 }));
  silkMesh.rotation.x = -Math.PI / 2;
  silkMesh.position.y = T / 2 + 0.002;
  board.add(silkMesh);

  const y0 = T / 2;
  const place = (m, x, z, h) => { m.position.set(x, y0 + h / 2, z); board.add(m); return m; };
  const silver = mat(0xd5dae1, { metalness: 1, roughness: 0.25 });
  const black = mat(0x111317, { roughness: 0.5 });
  const gold = mat(0xe8b84a, { metalness: 1, roughness: 0.3 });

  // FPGA
  const fpgaLabel = canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#16191f'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c9d3df'; g.textAlign = 'center';
    g.font = '700 70px "Space Grotesk", sans-serif'; g.fillText('ARTIX-7', w / 2, h * 0.45);
    g.font = '500 40px "JetBrains Mono", monospace'; g.fillStyle = '#8d9aae';
    g.fillText('XC7A35T', w / 2, h * 0.6); g.fillText('CSG324', w / 2, h * 0.72);
    g.beginPath(); g.arc(60, 60, 16, 0, 7); g.fillStyle = '#2a2f38'; g.fill();
  });
  const fpga = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.16, 1.5, 2, 0.03), [
    black, black, mat(0xffffff, { map: fpgaLabel, roughness: 0.45 }), black, black, black,
  ]);
  place(fpga, -0.6, -0.25, 0.16);
  const fpgaGlow = glowSprite(0x3ee6ff, 3.2);
  fpgaGlow.material.opacity = 0.15;
  fpgaGlow.position.set(-0.6, 0.1, -0.25);
  board.add(fpgaGlow);

  place(rbox(1.0, 0.1, 0.55, 0.02, black), 1.1, -0.65, 0.1);        // DDR3
  place(rbox(0.5, 0.08, 0.5, 0.02, black), -2.55, -0.9, 0.08);       // USB-JTAG
  place(rbox(0.4, 0.07, 0.4, 0.02, black), 2.6, -0.5, 0.07);         // flash
  place(rbox(0.55, 0.22, 0.6, 0.04, silver), -W / 2 + 0.3, -1.75, 0.22); // micro USB
  place(rbox(0.95, 0.78, 0.85, 0.04, silver), -W / 2 + 0.5, 0.45, 0.78); // RJ45
  place(rbox(0.6, 0.5, 0.5, 0.05, black), -W / 2 + 0.35, 1.7, 0.5);    // barrel jack

  // scattered passives
  const passGeo = new THREE.BoxGeometry(0.12, 0.05, 0.07);
  const passives = new THREE.InstancedMesh(passGeo, mat(0x2a2620, { roughness: 0.6 }), 60);
  for (let i = 0; i < 60; i++) {
    let x, z;
    do { x = rand(-3.3, 3.3); z = rand(-2.0, 0.55); } while (Math.abs(x + 0.6) < 1 && Math.abs(z + 0.25) < 1 || x < -2.6);
    m4.compose(new THREE.Vector3(x, y0 + 0.025, z), q.setFromAxisAngle(up, Math.random() < 0.5 ? 0 : Math.PI / 2), one);
    passives.setMatrixAt(i, m4);
  }
  board.add(passives);

  // PMOD headers (2×6)
  const pinGeo = new THREE.BoxGeometry(0.035, 0.32, 0.035);
  const hdrPins = new THREE.InstancedMesh(pinGeo, gold, 48);
  let hp = 0;
  pmodXs.forEach((x) => {
    place(box(0.95, 0.16, 0.32, black), x, -2.05, 0.16);
    for (let c = 0; c < 6; c++) for (let r = 0; r < 2; r++) {
      m4.compose(new THREE.Vector3(x - 0.375 + c * 0.15, y0 + 0.2, -2.12 + r * 0.14), q.identity(), one);
      hdrPins.setMatrixAt(hp++, m4);
    }
  });
  board.add(hdrPins);

  // buzzer circuit: PMOD JC drives a transistor that switches 5 V to the buzzer,
  // the buzzer's ground goes back to the board
  const PWR = [-1.3, -1.12]; // 5V / GND power header
  PWR.forEach((x) => {
    place(box(0.14, 0.16, 0.16, black), x, -2.1, 0.16);
    const pin = box(0.035, 0.32, 0.035, gold);
    pin.position.set(x, y0 + 0.2, -2.1);
    board.add(pin);
  });
  const bb = new THREE.Group();                       // mini breadboard
  bb.add(new THREE.Mesh(new RoundedBoxGeometry(2.3, 0.14, 0.9, 2, 0.03), mat(0xe9e6df, { roughness: 0.7 })));
  const holes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 0.01, 0.035), mat(0x2a2a2a), 120);
  for (let i = 0; i < 120; i++) {
    m4.compose(new THREE.Vector3(-1.05 + (i % 30) * 0.072, 0.072, -0.3 + Math.floor(i / 30) * 0.2), q.identity(), one);
    holes.setMatrixAt(i, m4);
  }
  bb.add(holes);
  bb.position.set(1.4, -0.05, -3.35);
  board.add(bb);
  const bbTop = 0.02;
  // transistor (TO-92) + base resistor
  const trans = new THREE.Group();
  const tBody = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.24, 24, 1, false, 0, Math.PI), mat(0x101215, { roughness: 0.45 }));
  tBody.position.y = 0.32;
  trans.add(tBody);
  const tFlat = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.24), mat(0x101215, { roughness: 0.45, side: THREE.DoubleSide }));
  tFlat.position.y = 0.32; tFlat.rotation.y = Math.PI / 2;
  trans.add(tFlat);
  [-0.06, 0, 0.06].forEach((dz) => {
    const leg = box(0.015, 0.2, 0.015, mat(0xc9cdd2, { metalness: 1, roughness: 0.3 }));
    leg.position.set(0, 0.1, dz);
    trans.add(leg);
  });
  trans.position.set(1.0, bbTop, -3.35);
  board.add(trans);
  const res = new THREE.Group();
  const rb2 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 12), mat(0xc9a77a, { roughness: 0.6 }));
  rb2.rotation.z = Math.PI / 2; rb2.position.y = 0.1;
  res.add(rb2);
  res.position.set(0.62, bbTop, -3.45);
  board.add(res);
  const tGlow = glowSprite(0xffd166, 0.7);
  tGlow.position.set(1.0, 0.35, -3.35);
  tGlow.material.opacity = 0;
  board.add(tGlow);
  // buzzer
  const buzzer = new THREE.Group();
  const bz = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.3, 32), mat(0x0d0f12, { roughness: 0.4 }));
  bz.position.y = 0.15;
  buzzer.add(bz);
  const bzTop = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 16), mat(0x333840));
  bzTop.position.y = 0.31;
  buzzer.add(bzTop);
  buzzer.position.set(2.05, bbTop, -3.35);
  board.add(buzzer);
  // wires
  const wire = (pts, color) => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    board.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.022, 8), mat(color, { roughness: 0.4 })));
    return curve;
  };
  const top = y0 + 0.36;
  wire([[1.525, top, -2.12], [1.3, 0.75, -2.5], [0.75, 0.45, -3.2], [0.72, 0.12, -3.45]], 0xffd23f);          // JC signal → resistor
  wire([[0.52, 0.12, -3.45], [0.5, 0.25, -3.4], [0.94, 0.2, -3.35]], 0x3b82f6);                               // resistor → base
  const vccCurve = wire([[PWR[0], top, -2.1], [-0.6, 0.9, -2.6], [0.6, 0.5, -3.1], [1.0, 0.25, -3.29]], 0xff4d5e); // 5V → transistor
  const outCurve = wire([[1.0, 0.25, -3.41], [1.4, 0.45, -3.6], [1.95, 0.25, -3.5], [2.0, 0.1, -3.42]], 0xff4d5e); // transistor → buzzer +
  wire([[2.15, 0.1, -3.2], [1.6, 0.8, -2.8], [-0.3, 1.0, -2.5], [PWR[1], top, -2.1]], 0x16181c);              // buzzer − → GND
  // current pulses on the 5 V path while the buzzer sounds
  const sparks = [0, 1, 2, 3, 4, 5].map((i) => {
    const sp = glowSprite(0xff8a5c, 0.28);
    sp.material.opacity = 0;
    board.add(sp);
    return { sp, k: i / 6 };
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.4, 48), new THREE.MeshBasicMaterial({ color: 0x3ee6ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(2.05, 0.45, -3.35);
  board.add(ring);

  // LEDs LD4–LD7 (game), with glow sprites
  const leds = ledX.map((x) => {
    const m = mat(0x1a3320, { emissive: 0x39ff6a, emissiveIntensity: 0, roughness: 0.3 });
    const led = place(box(0.16, 0.07, 0.1, m), x, ledZ, 0.07);
    const g = glowSprite(0x39ff6a, 1.1);
    g.position.set(x, 0.2, ledZ);
    g.material.opacity = 0;
    board.add(g);
    return { m, g, level: 0 };
  });
  // RGB status LEDs
  const rgbs = rgbX.map((x) => {
    const m = mat(0x222222, { emissive: 0x3ee6ff, emissiveIntensity: 0.3 });
    place(box(0.18, 0.08, 0.18, m), x, ledZ, 0.08);
    const g = glowSprite(0x3ee6ff, 0.9);
    g.position.set(x, 0.22, ledZ);
    g.material.opacity = 0.2;
    board.add(g);
    return { m, g };
  });
  const setRGB = (hex, k) => rgbs.forEach((r) => {
    r.m.emissive.setHex(hex); r.m.emissiveIntensity = 1.4 * k;
    r.g.material.color.setHex(hex); r.g.material.opacity = 0.8 * k;
  });

  // push buttons
  const buttons = ledX.map((x) => {
    place(box(0.4, 0.14, 0.4, silver), x, btnZ, 0.14);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.12, 20), black);
    cap.position.set(x, y0 + 0.2, btnZ);
    board.add(cap);
    return { cap, press: 0 };
  });
  // slide switches
  swX.forEach((x, i) => {
    place(box(0.28, 0.1, 0.42, black), x, btnZ, 0.1);
    const nub = box(0.12, 0.1, 0.14, mat(0xe8eef4));
    nub.position.set(x, y0 + 0.14, btnZ + (i % 2 ? -0.08 : 0.08));
    board.add(nub);
  });

  // mounting holes
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.15, 20), gold);
    r.rotation.x = -Math.PI / 2;
    r.position.set(sx * (W / 2 - 0.22), y0 + 0.003, sz * (D / 2 - 0.22));
    board.add(r);
  });

  camera.position.set(0, 8, 9.6);
  camera.lookAt(0, -0.2, 0.1);
  st.onResize = (w, h) => {
    const d = (w / h < 1.15 ? 1.4 : 1.12);
    camera.position.set(0, 7.2 * d, 8.6 * d);
    camera.lookAt(0, -0.2, 0.1);
  };

  // game state machine (mirrors the VHDL FSM: IDLE → WAIT → GO → RESULT)
  let state = 'idle', timer = 1.2, target = -1, react = 0, best = Infinity, beep = 0, round = 0;
  onEvent({ state: 'IDLE' });

  st.tick = (dt, t) => {
    board.rotation.y = Math.sin(t * 0.3) * 0.22 + pointer.x * 0.2;
    board.rotation.x = pointer.y * 0.06;
    board.position.y = Math.sin(t * 0.9) * 0.05;

    timer -= dt;
    if (state === 'idle' && timer <= 0) {
      state = 'go';
      target = (Math.random() * 4) | 0;
      react = rand(0.2, 0.55);
      timer = react;
      beep = 1;
      onEvent({ state: 'GO', led: target });
    } else if (state === 'go' && timer <= 0) {
      round++;
      const hit = round % 5 !== 0; // every 5th round: wrong button
      const pressed = hit ? target : (target + 1 + ((Math.random() * 3) | 0)) % 4;
      buttons[pressed].press = 1;
      const ms = Math.round(react * 1000 + rand(-12, 12));
      if (hit) best = Math.min(best, ms);
      state = 'result';
      timer = 1.1;
      setRGB(hit ? 0x39ff6a : 0xff3355, 1);
      onEvent({ state: hit ? 'HIT' : 'MISS', ms, best: best === Infinity ? null : best });
    } else if (state === 'result' && timer <= 0) {
      state = 'idle';
      target = -1;
      timer = rand(0.7, 1.6);
      setRGB(0x3ee6ff, 0.25);
      onEvent({ state: 'WAIT' });
    }

    leds.forEach((l, i) => {
      let want = 0;
      if (state === 'go' && i === target) want = 1;
      if (state === 'result' && i === target) want = Math.sin(t * 30) > 0 ? 1 : 0.2;
      if (state === 'idle') want = 0.06 * (0.5 + 0.5 * Math.sin(t * 3 + i)); // breathing
      l.level += (want - l.level) * Math.min(1, dt * 25);
      l.m.emissiveIntensity = l.level * 3;
      l.g.material.opacity = l.level;
    });
    buttons.forEach((b) => {
      b.press = Math.max(0, b.press - dt * 5);
      b.cap.position.y = y0 + 0.2 - Math.sin(b.press * Math.PI) * 0.07;
    });
    if (state === 'idle') setRGB(0x3ee6ff, 0.2 + 0.1 * Math.sin(t * 2));
    beep = Math.max(0, beep - dt * 2.2);
    ring.material.opacity = beep * 0.8;
    ring.scale.setScalar(1 + (1 - beep) * 2.2);
    // transistor switching at the tone frequency, current flowing to the buzzer
    const on = beep > 0.05 && Math.sin(t * 60) > 0 ? 1 : 0;
    tGlow.material.opacity = on * beep;
    sparks.forEach((sp) => {
      sp.k = (sp.k + dt * 0.9) % 1;
      const pt = sp.k < 0.6 ? vccCurve.getPoint(sp.k / 0.6) : outCurve.getPoint((sp.k - 0.6) / 0.4);
      sp.sp.position.copy(pt);
      sp.sp.material.opacity = beep > 0.05 ? Math.min(1, beep * 1.5) * (sp.k < 0.6 ? 1 : on) : 0;
    });
    fpgaGlow.material.opacity = 0.12 + 0.06 * Math.sin(t * 4);
  };
  return st;
}

/* ═════════════════════════ Vigibot robot ═════════════════════════ */
export function initRobot(canvas, onEvent = () => {}) {
  const st = makeStage(canvas, { fov: 34 });
  const { scene, camera } = st;
  scene.fog = new THREE.Fog(0x070b12, 14, 30);

  scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x0b0b12, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 2);
  key.position.set(5, 10, 4);
  scene.add(key);

  // floor
  const grid = canvasTexture(128, 128, (g, w, h) => {
    g.fillStyle = '#0b1019'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,170,220,.16)'; g.lineWidth = 2;
    g.strokeRect(0, 0, w, h);
  });
  grid.wrapS = grid.wrapT = THREE.RepeatWrapping;
  grid.repeat.set(30, 30);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), mat(0xffffff, { map: grid, roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // course: one closed loop split into the 4 zones of the brief
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4.2, 0, -1.6), new THREE.Vector3(-1.5, 0, -3.0), new THREE.Vector3(1.8, 0, -2.7),
    new THREE.Vector3(4.3, 0, -1.0), new THREE.Vector3(3.6, 0, 1.9), new THREE.Vector3(0.6, 0, 2.6),
    new THREE.Vector3(-1.8, 0, 1.4), new THREE.Vector3(-4.3, 0, 1.3),
  ], true, 'centripetal');
  const ZONES = [
    { name: 'IR LINE', start: 0.0, color: 0xdfe5ee, sensors: 'IR ×3 · black line' },
    { name: 'OBSTACLES', start: 0.25, color: 0x4b5566, sensors: 'ultrasonic ranging' },
    { name: 'CAMERA LINE', start: 0.5, color: 0xff3b4e, sensors: 'Pi camera · HSV red, 2 ROI' },
    { name: 'LABYRINTH', start: 0.75, color: 0x4b5566, sensors: 'Pi camera · arrows + YOLO' },
  ];
  const zoneAt = (uu) => ZONES.reduce((z, cur) => (uu >= cur.start ? cur : z), ZONES[0]);
  const SEG = 400, half = 0.09;
  const pos = [], col = [], idx = [];
  const c3 = new THREE.Color();
  for (let i = 0; i <= SEG; i++) {
    const u = i / SEG;
    const p = curve.getPointAt(u % 1), tg = curve.getTangentAt(u % 1);
    const nx = tg.z, nz = -tg.x;
    pos.push(p.x + nx * half, 0.01, p.z + nz * half, p.x - nx * half, 0.01, p.z - nz * half);
    c3.setHex(zoneAt(Math.min(u, 0.9999)).color);
    col.push(c3.r, c3.g, c3.b, c3.r, c3.g, c3.b);
    if (i < SEG) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const tapeGeo = new THREE.BufferGeometry();
  tapeGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  tapeGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  tapeGeo.setIndex(idx);
  scene.add(new THREE.Mesh(tapeGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));

  // zone markers painted on the floor
  ZONES.forEach((z, i) => {
    const tex = canvasTexture(512, 128, (g, w, h) => {
      g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, w, h);
      g.font = '700 58px "JetBrains Mono", monospace'; g.fillStyle = 'rgba(230,237,246,.55)';
      g.fillText(`Z${i + 1} · ${z.name}`, 8, 80);
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    const p = curve.getPointAt(z.start + 0.03), tg = curve.getTangentAt(z.start + 0.03);
    m.position.set(p.x + tg.z * 1.1, 0.02, p.z - tg.x * 1.1);
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = Math.atan2(-tg.z, tg.x);
    scene.add(m);
  });

  // robot
  const robot = new THREE.Group();
  robot.scale.setScalar(1.15);
  scene.add(robot);
  const dark = mat(0x2a303a, { metalness: 0.45, roughness: 0.4 });
  const chassis = rbox(1.1, 0.22, 1.5, 0.06, dark);
  chassis.position.y = 0.32;
  robot.add(chassis);
  const battery = box(0.7, 0.16, 0.5, mat(0x2f5fd0, { roughness: 0.4 }));
  battery.position.set(0, 0.51, -0.25);
  robot.add(battery);
  const deck = box(1.04, 0.03, 1.36, new THREE.MeshPhysicalMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.28, roughness: 0.1, metalness: 0 }));
  deck.position.y = 0.66;
  robot.add(deck);
  const brass = mat(0xc9a14a, { metalness: 1, roughness: 0.3 });
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.24, 8), brass);
    s.position.set(sx * 0.44, 0.54, sz * 0.58);
    robot.add(s);
  });
  // Raspberry Pi
  const pi = box(0.56, 0.03, 0.85, mat(0x1d6b3c, { roughness: 0.5 }));
  pi.position.set(0, 0.695, -0.1);
  robot.add(pi);
  const piParts = [[0.2, 0.06, 0.2, 0.05, -0.05, 0xc0c6ce], [0.16, 0.13, 0.2, -0.15, -0.42, 0xc0c6ce], [0.16, 0.13, 0.2, 0.15, -0.42, 0xc0c6ce], [0.08, 0.08, 0.5, -0.24, 0.0, 0x111111]];
  piParts.forEach(([w, h, d, x, z, c]) => {
    const p = box(w, h, d, mat(c, { metalness: c === 0x111111 ? 0 : 0.9, roughness: 0.3 }));
    p.position.set(x, 0.71 + h / 2, z);
    robot.add(p);
  });
  // wheels
  const wheels = [];
  for (const sx of [-1, 1]) {
    const w = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.16, 28), mat(0x101114, { roughness: 0.9 }));
    tire.rotation.z = Math.PI / 2;
    w.add(tire);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.17, 6), mat(0xffb259, { roughness: 0.4 }));
    hub.rotation.z = Math.PI / 2;
    w.add(hub);
    w.position.set(sx * 0.66, 0.3, -0.25);
    robot.add(w);
    wheels.push(w);
  }
  const caster = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), mat(0xcfd6de, { metalness: 1, roughness: 0.2 }));
  caster.position.set(0, 0.1, 0.55);
  robot.add(caster);
  // HC-SR04 ultrasonic sensor
  const us = new THREE.Group();
  us.add(box(0.7, 0.3, 0.04, mat(0x1f4fa8, { roughness: 0.5 })));
  for (const sx of [-0.2, 0.2]) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.14, 24), mat(0xd5dae1, { metalness: 1, roughness: 0.3 }));
    c.rotation.x = Math.PI / 2;
    c.position.set(sx, 0, 0.08);
    us.add(c);
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), mat(0x1a1a1a));
    mesh.position.set(sx, 0, 0.152);
    us.add(mesh);
  }
  us.position.set(0, 0.48, 0.79);
  robot.add(us);
  // camera mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8), dark);
  mast.position.set(0, 0.93, 0.4);
  robot.add(mast);
  const cam = box(0.22, 0.16, 0.14, mat(0x111111));
  cam.position.set(0, 1.2, 0.42);
  cam.rotation.x = 0.35;
  robot.add(cam);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 16), mat(0x0a2a33, { emissive: 0x3ee6ff, emissiveIntensity: 0.8 }));
  lens.rotation.x = Math.PI / 2 + 0.35;
  lens.position.set(0, 1.17, 0.5);
  robot.add(lens);
  // vision cone
  const coneGeo = new THREE.ConeGeometry(1.2, 2.4, 32, 1, true).translate(0, -1.2, 0).rotateX(-Math.PI / 2 + 0.5);
  const cone = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: 0x3ee6ff, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  cone.position.set(0, 1.18, 0.48);
  robot.add(cone);
  // IR sensors (underside)
  for (const sx of [-0.18, 0, 0.18]) {
    const ir = glowSprite(0xff3355, 0.22);
    ir.position.set(sx, 0.08, 0.68);
    robot.add(ir);
  }
  const status = glowSprite(0x3ee6ff, 0.35);
  status.position.set(0.22, 0.78, 0.25);
  robot.add(status);
  // ultrasonic ping ring
  const ping = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.36, 40, 1, -0.8, 1.6), new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
  ping.rotation.x = -Math.PI / 2;
  ping.rotation.z = Math.PI / 2;
  ping.position.set(0, 0.3, 0.85);
  robot.add(ping);

  // labyrinth arrow sign and the obstacle crate
  const labelSprite = (text, bg) => {
    const tex = canvasTexture(512, 96, (g, w, h) => {
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.fillStyle = '#06090f'; g.font = '700 50px "JetBrains Mono", monospace'; g.textBaseline = 'middle';
      g.fillText(text, 18, h / 2 + 3);
    });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, opacity: 0 }));
    s.scale.set(1.5, 0.28, 1);
    return s;
  };
  const marks = [];
  const addMark = (u, side, mesh, size, text, bg) => {
    const p = curve.getPointAt(u), tg = curve.getTangentAt(u);
    const g = new THREE.Group();
    g.position.set(p.x + tg.z * side, 0, p.z - tg.x * side);
    g.add(mesh);
    const bb = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(size.x + 0.15, size.y + 0.15, size.z + 0.15)),
      new THREE.LineBasicMaterial({ color: new THREE.Color(bg), transparent: true, opacity: 0, depthTest: false }));
    bb.position.y = size.y / 2;
    g.add(bb);
    const lab = labelSprite(text, bg);
    lab.position.y = size.y + 0.35;
    g.add(lab);
    scene.add(g);
    marks.push({ g, bb, lab, show: 0 });
    return g;
  };

  const arrowTex = canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#f2f4f7'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1b4fd1';
    g.beginPath(); g.moveTo(40, 110); g.lineTo(150, 110); g.lineTo(150, 60); g.lineTo(220, 128); g.lineTo(150, 196); g.lineTo(150, 146); g.lineTo(40, 146); g.fill();
  });
  const sign = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), dark);
  post.position.y = 0.3; sign.add(post);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), mat(0xffffff, { map: arrowTex, side: THREE.DoubleSide }));
  panel.position.y = 0.8; sign.add(panel);
  const SIGN_U = 0.86;
  const signG = addMark(SIGN_U, -1.0, sign, new THREE.Vector3(0.55, 1.08, 0.1), 'arrow: RIGHT', '#3ee6ff');
  { const p = curve.getPointAt(SIGN_U); signG.lookAt(p.x, 0, p.z); }

  const crate = rbox(0.6, 0.5, 0.6, 0.04, mat(0x8a6a3a, { roughness: 0.8 }));
  crate.position.y = 0.25;
  const OBST_U = 0.37;
  addMark(OBST_U, 0, crate, new THREE.Vector3(0.6, 0.5, 0.6), 'US: 18 cm', '#ffd166');

  // camera + layout
  let camDist = 12.5;
  st.onResize = (w, h) => { camDist = w / h < 1.15 ? 11.5 : 9.5; };

  const len = curve.getLength();
  const SIGMA = 0.9 / len, LAT = 1.1;
  let u = 0.02, zone = null, calib = 0, lastKey = '', pingT = 0;
  const p = new THREE.Vector3(), p2 = new THREE.Vector3(), tg = new THREE.Vector3(), fwd = new THREE.Vector3(), toObj = new THREE.Vector3();
  const wrapDist = (a, b) => { let d = a - b; d -= Math.round(d); return d; };
  // point on the track, shifted sideways around the obstacle
  const pathAt = (uu, out) => {
    uu = ((uu % 1) + 1) % 1;
    curve.getPointAt(uu, out);
    curve.getTangentAt(uu, tg);
    const lat = LAT * Math.exp(-Math.pow(wrapDist(uu, OBST_U) / SIGMA, 2));
    return out.set(out.x + tg.z * lat, 0, out.z - tg.x * lat);
  };
  const camTilt = { 'IR LINE': 0.15, OBSTACLES: 0.1, 'CAMERA LINE': 0.6, LABYRINTH: 0.25 };

  st.tick = (dt, t) => {
    const ang = t * 0.07 + pointer.x * 0.35;
    camera.position.set(Math.sin(ang) * camDist, camDist * 0.62 - pointer.y, Math.cos(ang) * camDist);
    camera.lookAt(0, 0, 0);

    // state machine: entering a new zone triggers a short calibration stop
    const z = zoneAt(u);
    if (z !== zone) { if (zone) calib = 1.1; zone = z; }
    calib = Math.max(0, calib - dt);
    const dObs = wrapDist(u, OBST_U);
    const slow = calib > 0 ? 0 : 1 - 0.4 * Math.exp(-Math.pow(dObs / SIGMA, 2));
    u = (u + (dt * 1.0 * slow) / len) % 1;
    pathAt(u, p);
    pathAt(u + 0.004, p2);
    const heading = Math.atan2(p2.x - p.x, p2.z - p.z);
    robot.position.set(p.x, slow ? Math.abs(Math.sin(t * 9)) * 0.01 : 0, p.z);
    robot.rotation.y = heading;
    wheels.forEach((w) => (w.rotation.x += dt * 3.3 * slow));
    // camera head tilts towards the floor for the camera zones
    const tilt = camTilt[zone.name];
    cam.rotation.x += (tilt - cam.rotation.x) * Math.min(1, dt * 4);
    lens.rotation.x = Math.PI / 2 + cam.rotation.x;

    fwd.set(Math.sin(heading), 0, Math.cos(heading));
    for (const o of marks) {
      toObj.subVectors(o.g.position, robot.position);
      const d = toObj.length();
      const want = d < 3 && toObj.normalize().dot(fwd) > 0.35 ? 1 : 0;
      o.show += (want - o.show) * Math.min(1, dt * 8);
      o.bb.material.opacity = o.show;
      o.lab.material.opacity = o.show;
      o.bb.scale.setScalar(1 + (1 - o.show) * 0.3);
    }

    let state = 'RUNNING';
    if (calib > 0) state = 'CALIBRATING';
    else if (Math.abs(dObs) < SIGMA * 1.8) state = 'AVOIDING';
    const key = zone.name + state;
    if (key !== lastKey) {
      lastKey = key;
      onEvent({ zone: zone.name, mode: state, sensors: zone.sensors });
    }

    // ultrasonic ping in the obstacle zone, vision cone in the camera zones
    const near = zone.name === 'OBSTACLES';
    pingT += dt * (Math.abs(dObs) < SIGMA * 2.5 ? 2.5 : 0.8);
    const ph = pingT % 1;
    ping.material.opacity = near ? (1 - ph) * 0.9 : 0;
    ping.scale.setScalar(1 + ph * 4);
    status.material.opacity = calib > 0 ? 1 : Math.sin(t * 6) > 0 ? 1 : 0.2;
    status.material.color.setHex(calib > 0 ? 0xffd166 : 0x3ee6ff);
    const camZone = zone.name === 'CAMERA LINE' || zone.name === 'LABYRINTH';
    cone.material.opacity += ((camZone ? 0.09 : 0.015) - cone.material.opacity) * Math.min(1, dt * 3);
  };
  return st;
}
