import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// ---------- sound (synth, no assets) ----------
let actx = null, soundOn = true, master = null, vol = 0.7, lastClick = -1;
const out = () => { if (!actx) return null; if (!master) { master = actx.createGain(); master.gain.value = vol; master.connect(actx.destination); } return master; };
const sfx = {
  init() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) {} },
  toggle() { soundOn = !soundOn; return soundOn; },
  setVolume(v) { vol = v; if (master) master.gain.value = v; },
  uiClick() { sfx.click(0.07); },
  notify() { return; if (!actx || !soundOn) return; [880, 1175].forEach((f, i) => { const t = actx.currentTime + i * 0.11, o = actx.createOscillator(), g = actx.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.06, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4); o.connect(g); g.connect(out()); o.start(t); o.stop(t + 0.45); }); },
  error() { return; if (!actx || !soundOn) return; const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.5); g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55); o.connect(g); g.connect(out()); o.start(t); o.stop(t + 0.6); },
  click(vol = 0.09) {
    if (!actx || !soundOn) return; const now = actx.currentTime; if (now - lastClick < 0.04) return; lastClick = now;
    const t = actx.currentTime, len = 0.03, buf = actx.createBuffer(1, actx.sampleRate * len, actx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    const s = actx.createBufferSource(); s.buffer = buf;
    const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2200 + Math.random() * 800; f.Q.value = 1.2;
    const g = actx.createGain(); g.gain.value = vol; s.connect(f); f.connect(g); g.connect(out()); s.start(t);
  },
  chime() {
    return; // only mouse-click sounds are played
    if (!actx || !soundOn) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((fr, i) => {
      const t = actx.currentTime + i * 0.09, o = actx.createOscillator(), g = actx.createGain();
      o.type = 'triangle'; o.frequency.value = fr; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g); g.connect(out()); o.start(t); o.stop(t + 0.55);
    });
  },
  whoosh() {
    return; // only mouse-click sounds are played
    if (!actx || !soundOn) return;
    const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(520, t + 0.5);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    o.connect(g); g.connect(out()); o.start(t); o.stop(t + 0.75);
  }
};
window.__sfx = sfx;
// one soft mouse-click sound for every click anywhere on the page, and nothing else makes noise
document.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; sfx.init(); sfx.click(0.09); }, true);

// ---------- helpers ----------
const mk = (geo, mat, x = 0, y = 0, z = 0, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; };
const std = (color, rough = 0.5, metal = 0.1, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
const glow = (color) => new THREE.MeshBasicMaterial({ color });
const RB = (w, h, d, r = 0.01, seg = 3) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 0.0001, h / 2 - 0.0001, d / 2 - 0.0001));
const smooth = (t) => t * t * (3 - 2 * t);
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const tex = (c, rep, srgb = true) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rep) t.repeat.set(rep[0], rep[1]); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

function woodTextures() {
  const [c, g] = cv(1024, 512); g.fillStyle = '#34231a'; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 320; i++) { const y = Math.random() * 512; g.strokeStyle = `rgba(${15 + Math.random() * 40 | 0},${8 + Math.random() * 22 | 0},${4 + Math.random() * 12 | 0},${0.12 + Math.random() * 0.35})`; g.lineWidth = 0.5 + Math.random() * 2.6; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 48) g.lineTo(x, y + Math.sin(x * 0.012 + i) * 3 + Math.random() * 1.4); g.stroke(); }
  for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(90,60,40,${0.05 + Math.random() * 0.08})`; g.lineWidth = 1 + Math.random() * 2; const y = Math.random() * 512; g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y + (Math.random() - 0.5) * 8); g.stroke(); }
  const [b, bg] = cv(512, 256); bg.drawImage(c, 0, 0, 512, 256); bg.globalCompositeOperation = 'saturation'; bg.fillStyle = '#888'; bg.fillRect(0, 0, 512, 256);
  return { map: tex(c, [1, 1]), bump: tex(b, [1, 1], false) };
}
function noiseTex(base, amt, size = 256, rep = [4, 4], blotch = false) {
  const [c, g] = cv(size, size); g.fillStyle = base; g.fillRect(0, 0, size, size); const im = g.getImageData(0, 0, size, size), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; } g.putImageData(im, 0, 0);
  if (blotch) for (let i = 0; i < 60; i++) { const x = Math.random() * size, y = Math.random() * size, r = 8 + Math.random() * 40; const gr = g.createRadialGradient(x, y, 0, x, y, r); const v = Math.random() > .5 ? '255,255,255' : '0,0,0'; gr.addColorStop(0, `rgba(${v},0.05)`); gr.addColorStop(1, `rgba(${v},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  return tex(c, rep);
}
function fabricTex(base) { const [c, g] = cv(128, 128); g.fillStyle = base; g.fillRect(0, 0, 128, 128); g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1; for (let i = 0; i < 128; i += 3) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(128, i); g.stroke(); } for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.2})`; g.fillRect(Math.random() * 128, Math.random() * 128, 1, 1); } return tex(c, [3, 3]); }
function posterTex(kind) {
  const [c, g] = cv(512, 720); const gr = g.createLinearGradient(0, 0, 512, 720);
  if (kind === 0) { gr.addColorStop(0, '#12082a'); gr.addColorStop(1, '#06222e'); g.fillStyle = gr; g.fillRect(0, 0, 512, 720);
    const L = [5, 8, 8, 5], xs = [90, 210, 330, 430]; const pts = L.map((n, li) => Array.from({ length: n }, (_, i) => [xs[li], 120 + (i + (8 - n) / 2) * 62]));
    g.lineWidth = 1; for (let l = 0; l < 3; l++) pts[l].forEach(a => pts[l + 1].forEach(b => { g.strokeStyle = 'rgba(168,85,247,.28)'; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); }));
    pts.flat().forEach((p, i) => { g.fillStyle = i % 3 ? '#22d3ee' : '#ff3d9a'; g.shadowColor = g.fillStyle; g.shadowBlur = 12; g.beginPath(); g.arc(p[0], p[1], 9, 0, 7); g.fill(); }); g.shadowBlur = 0;
    g.fillStyle = '#e9d5ff'; g.font = '800 40px Orbitron, Arial'; g.textAlign = 'center'; g.fillText('NEURAL', 256, 620); g.fillStyle = '#22d3ee'; g.font = '600 24px Arial'; g.fillText('B A N G L A   N L P', 256, 660); }
  else { gr.addColorStop(0, '#2a0a1e'); gr.addColorStop(1, '#0a0a2a'); g.fillStyle = gr; g.fillRect(0, 0, 512, 720);
    g.strokeStyle = '#ff3d9a'; g.lineWidth = 6; g.shadowColor = '#ff3d9a'; g.shadowBlur = 14; g.beginPath(); for (let x = 0; x <= 512; x += 4) { const y = 300 + Math.sin(x * 0.04) * 90 * Math.sin(x * 0.006 + 1); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.shadowBlur = 0;
    g.fillStyle = '#fff'; g.font = '800 54px Orbitron, Arial'; g.textAlign = 'center'; g.fillText('wav2vec2', 256, 560); g.fillStyle = '#a5f3fc'; g.font = '600 24px Arial'; g.fillText('S P E E C H   A I', 256, 610); }
  g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 4; g.strokeRect(8, 8, 496, 704); return tex(c, null);
}

export function startScene(canvas, hooks) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  const maxDpr = Math.min(window.devicePixelRatio || 1, 1.5); let dpr = maxDpr; renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
  RectAreaLightUniformsLib.init();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07060d);
  scene.fog = new THREE.FogExp2(0x07060d, 0.045);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.22;
  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 60);

  // ----- lights -----
  scene.add(new THREE.HemisphereLight(0x6a5cff, 0x140e22, 0.55));
  const key = new THREE.SpotLight(0xffe2c4, 55, 9, 0.62, 0.85, 1.6); key.position.set(1.2, 3.0, 1.9); key.target.position.set(0, 0.8, -0.1);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02; key.shadow.radius = 5; scene.add(key, key.target);
  const lPurple = new THREE.PointLight(0xa855f7, 6, 7, 2); lPurple.position.set(-0.3, 1.8, -0.9); scene.add(lPurple);
  const lCyan = new THREE.PointLight(0x22d3ee, 4, 6, 2); lCyan.position.set(1.6, 1.4, 0.3); scene.add(lCyan);
  const lPink = new THREE.PointLight(0xff3d9a, 3.5, 6, 2); lPink.position.set(-1.7, 1.3, 0.4); scene.add(lPink);

  // ----- room -----
  const floorM = std(0x1a1a22, 0.6, 0.1, { map: noiseTex('#26262e', 26, 256, [6, 6], true), roughnessMap: noiseTex('#999', 90, 128, [6, 6]) });
  const floor = mk(new THREE.PlaneGeometry(12, 12), floorM, 0, 0, 0, scene); floor.rotation.x = -Math.PI / 2;
  const paint = noiseTex('#1b1826', 14, 256, [6, 2], true);
  const wallM = std(0x2a2638, 0.9, 0, { map: paint });
  mk(new THREE.PlaneGeometry(6.4, 3.4), wallM, 0, 1.7, -1.3, scene);
  const wl = mk(new THREE.PlaneGeometry(5, 3.4), wallM, -3.2, 1.7, 1.2, scene); wl.rotation.y = Math.PI / 2;
  const wr = mk(new THREE.PlaneGeometry(5, 3.4), wallM, 3.2, 1.7, 1.2, scene); wr.rotation.y = -Math.PI / 2;
  const ceil = mk(new THREE.PlaneGeometry(6.4, 5), std(0x0b0a12, 1, 0), 0, 3.4, 1.2, scene); ceil.rotation.x = Math.PI / 2;
  mk(new THREE.BoxGeometry(6.4, 0.08, 0.1), std(0x0b0a12, 0.8, 0), 0, 0.04, -1.28, scene); // skirting
  const strips = []; [-2.9, 2.9].forEach(x => strips.push(mk(new THREE.BoxGeometry(0.03, 3.2, 0.03), glow(0xa855f7), x, 1.7, -1.26, scene)));
  const ceilLED = mk(new THREE.BoxGeometry(5.6, 0.025, 0.025), glow(0xa5b4fc), 0, 3.3, -1.2, scene);
  // rug
  const rugT = noiseTex('#1d1a30', 34, 256, [5, 3]); const rug = mk(new THREE.PlaneGeometry(3.2, 2.2), std(0x24203d, 1, 0, { map: rugT }), 0.1, 0.004, 0.55, scene); rug.rotation.x = -Math.PI / 2;
  const rugEdge = mk(new THREE.PlaneGeometry(3.3, 2.3), glow(0x6d28d9), 0.1, 0.002, 0.55, scene); rugEdge.rotation.x = -Math.PI / 2; rugEdge.material.opacity = 0.55; rugEdge.material.transparent = true;

  // neon sign
  const [sC, sg] = cv(1024, 256); sg.font = '900 160px Orbitron, Arial Black, sans-serif'; sg.textAlign = 'center'; sg.textBaseline = 'middle'; sg.shadowColor = '#a855f7'; sg.shadowBlur = 46; sg.fillStyle = '#efe0ff'; sg.fillText('ASIF', 512, 135);
  const signTex = tex(sC, null); const sign = mk(new THREE.PlaneGeometry(1.0, 0.25), new THREE.MeshBasicMaterial({ map: signTex, transparent: true }), 0, 2.0, -1.28, scene);
  const ring = mk(new THREE.TorusGeometry(0.55, 0.011, 12, 80), glow(0x22d3ee), 0, 2.0, -1.27, scene);

  // posters
  const frameM = std(0x0d0d12, 0.4, 0.6);
  [[1.35, 0], [2.0, 1]].forEach(([x, k]) => { const f = mk(RB(0.5, 0.7, 0.03, 0.01), frameM, x, 1.5, -1.275, scene); mk(new THREE.PlaneGeometry(0.46, 0.66), new THREE.MeshBasicMaterial({ map: posterTex(k), toneMapped: false, color: 0xcccccc }), x, 1.5, -1.258, scene); });

  // shelves + trophies
  const shelfM = std(0x1b1410, 0.55, 0.05, { map: woodTextures().map });
  const shelf1 = mk(RB(1.5, 0.04, 0.24, 0.012), shelfM, -1.45, 1.68, -1.17, scene), shelf2 = mk(RB(1.5, 0.04, 0.24, 0.012), shelfM, -1.45, 1.32, -1.17, scene);
  mk(new THREE.BoxGeometry(1.46, 0.012, 0.012), glow(0xa855f7), -1.45, 1.655, -1.05, scene); mk(new THREE.BoxGeometry(1.46, 0.012, 0.012), glow(0x22d3ee), -1.45, 1.295, -1.05, scene);
  const gold = new THREE.MeshStandardMaterial({ color: 0xf2c14e, roughness: 0.22, metalness: 1, envMapIntensity: 3 });
  const cupProf = [[0, 0], [0.05, 0], [0.055, 0.012], [0.02, 0.02], [0.012, 0.06], [0.03, 0.075], [0.05, 0.1], [0.062, 0.15], [0.055, 0.185], [0.05, 0.18], [0.045, 0.14], [0.03, 0.105], [0, 0.1]].map(([x, y]) => new THREE.Vector2(x, y));
  const trophies = [];
  for (let i = 0; i < 5; i++) { const g = new THREE.Group(); g.position.set(-1.95 + i * 0.22, 1.7, -1.16); const base = mk(RB(0.1, 0.03, 0.1, 0.006), std(0x15151b, 0.4, 0.5), 0, 0.015, 0, g);
    const cup = mk(new THREE.LatheGeometry(cupProf, 28), gold, 0, 0.03, 0, g); cup.scale.setScalar(0.85); mk(new THREE.TorusGeometry(0.052, 0.006, 8, 20, Math.PI), gold, 0.062, 0.14, 0, g).rotation.z = -Math.PI / 2; mk(new THREE.TorusGeometry(0.052, 0.006, 8, 20, Math.PI), gold, -0.062, 0.14, 0, g).rotation.z = Math.PI / 2;
    g.traverse(o => { if (o.isMesh) { o.userData.tip = `Dean's Award #${i + 1} · AIUB (5 in a row)`; trophies.push(o); } }); scene.add(g); }
  // books + small items on lower shelf
  const bookCols = [0x7c3aed, 0x0ea5e9, 0xe11d48, 0x16a34a, 0xf59e0b, 0x6366f1];
  bookCols.forEach((c, i) => { const h = 0.17 + Math.random() * 0.07; const b = mk(RB(0.032, h, 0.15, 0.004), std(c, 0.7, 0, { }), -2.05 + i * 0.036, 1.34 + h / 2, -1.17, scene); b.rotation.z = i === 5 ? 0.22 : 0; });
  const chipBox = mk(RB(0.16, 0.2, 0.11, 0.008), std(0x120d1f, 0.5, 0.3), -1.5, 1.44, -1.17, scene); mk(new THREE.PlaneGeometry(0.13, 0.17), new THREE.MeshBasicMaterial({ color: 0x8b5cf6 }), -1.5, 1.44, -1.113, scene);
  const miniLED = mk(new THREE.SphereGeometry(0.012, 10, 10), glow(0x22d3ee), -1.3, 1.36, -1.1, scene);

  // ----- desk (wood) -----
  const wood = woodTextures(); const deskM = std(0xffffff, 0.5, 0.05, { map: wood.map, bumpMap: wood.bump, bumpScale: 0.8 });
  const desk = new THREE.Group(); scene.add(desk);
  mk(RB(2.5, 0.05, 0.95, 0.014), deskM, 0, 0.75, 0, desk);
  const legM = std(0x0e0e14, 0.4, 0.7); [-1.14, 1.14].forEach(x => { mk(RB(0.05, 0.73, 0.85, 0.01), legM, x, 0.365, 0, desk); mk(RB(0.1, 0.02, 0.8, 0.006), legM, x, 0.01, 0, desk); });
  mk(RB(2.3, 0.28, 0.018, 0.006), legM, 0, 0.56, -0.4, desk);
  const edge = mk(new THREE.BoxGeometry(2.4, 0.01, 0.01), glow(0xa855f7), 0, 0.724, 0.462, desk);
  const underGlow = mk(new THREE.BoxGeometry(2.3, 0.008, 0.008), glow(0x22d3ee), 0, 0.72, -0.36, desk);
  const [mC, mg] = cv(1024, 420); const grad = mg.createLinearGradient(0, 0, 1024, 420); grad.addColorStop(0, '#15092e'); grad.addColorStop(1, '#0a1d30'); mg.fillStyle = grad; mg.fillRect(0, 0, 1024, 420);
  mg.strokeStyle = 'rgba(168,85,247,.28)'; mg.lineWidth = 2; for (let i = 0; i < 1024; i += 40) { mg.beginPath(); mg.moveTo(i, 0); mg.lineTo(i - 120, 420); mg.stroke(); }
  for (let i = 0; i < 6000; i++) { mg.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`; mg.fillRect(Math.random() * 1024, Math.random() * 420, 1, 1); }
  mg.strokeStyle = '#a855f7'; mg.lineWidth = 7; mg.strokeRect(5, 5, 1014, 410);
  const deskMat = mk(RB(1.15, 0.006, 0.47, 0.003), std(0xffffff, 0.92, 0, { map: tex(mC, null) }), 0.1, 0.7765, 0.17, desk);

  // ----- ultrawide monitor -----
  const monitor = new THREE.Group(); monitor.position.set(0.1, 0.775, -0.2); scene.add(monitor);
  const SW = 0.82, SH = 0.345; const metal = std(0x1a1a22, 0.28, 0.85);
  mk(RB(0.28, 0.012, 0.2, 0.005), metal, 0, 0.006, 0.0, monitor);
  mk(RB(0.045, 0.3, 0.03, 0.01), metal, 0, 0.16, -0.025, monitor);
  const bezel = mk(RB(SW + 0.028, SH + 0.028, 0.032, 0.008), std(0x0a0a0f, 0.35, 0.5), 0, 0.46, 0, monitor);
  mk(RB(0.2, 0.15, 0.04, 0.012), std(0x0a0a0f, 0.5, 0.4), 0, 0.455, -0.03, monitor);
  const screenCanvas = document.createElement('canvas'); screenCanvas.width = 2048; screenCanvas.height = 862;
  const scx = screenCanvas.getContext('2d'); scx.scale(2, 2); const screenTex = tex(screenCanvas, null); screenTex.anisotropy = 16;
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false });
  const screen = mk(new THREE.PlaneGeometry(SW, SH), screenMat, 0, 0.46, 0.0175, monitor);
  const mLed = mk(new THREE.BoxGeometry(0.014, 0.003, 0.003), glow(0x22d3ee), 0.35, 0.2765, 0.0165, monitor);
  const hitMeshes = [bezel, screen];
  const area = new THREE.RectAreaLight(0x7aa7ff, 3.2, SW, SH); area.position.set(0, 0.46, 0.05); monitor.add(area); area.lookAt(monitor.localToWorld(new THREE.Vector3(0, 0.0, 2)));

  // side monitor
  const side = new THREE.Group(); side.position.set(-0.7, 0.775, -0.1); side.rotation.y = 0.5; scene.add(side);
  mk(RB(0.16, 0.01, 0.14, 0.004), metal, 0, 0.005, 0, side); mk(RB(0.035, 0.22, 0.022, 0.008), metal, 0, 0.11, -0.015, side);
  mk(RB(0.235, 0.41, 0.026, 0.008), std(0x0a0a0f, 0.35, 0.5), 0, 0.36, 0, side);
  const sideC = document.createElement('canvas'); sideC.width = 512; sideC.height = 860; const sx = sideC.getContext('2d'); sx.scale(2, 2); const sideTex = tex(sideC, null); sideTex.anisotropy = 8;
  mk(new THREE.PlaneGeometry(0.205, 0.38), new THREE.MeshBasicMaterial({ map: sideTex, toneMapped: false }), 0, 0.36, 0.0145, side);

  // speakers
  [[-0.42, -0.3], [0.64, -0.3]].forEach(([x, z]) => { const sp = new THREE.Group(); sp.position.set(x, 0.775, z); scene.add(sp); mk(RB(0.1, 0.18, 0.1, 0.012), std(0x101016, 0.5, 0.3), 0, 0.09, 0, sp);
    const cone = mk(new THREE.CircleGeometry(0.03, 24), std(0x08080b, 0.9, 0), 0, 0.06, 0.051, sp); const rg = mk(new THREE.TorusGeometry(0.032, 0.004, 8, 24), glow(0x22d3ee), 0, 0.06, 0.051, sp); sp.userData.ring = rg; mk(new THREE.CircleGeometry(0.014, 16), std(0x08080b, 0.9, 0), 0, 0.13, 0.051, sp); });

  // ----- keyboard (rounded, instanced RGB) -----
  const kb = new THREE.Group(); kb.position.set(0.05, 0.78, 0.2); kb.rotation.y = -0.04; scene.add(kb);
  mk(RB(0.4, 0.018, 0.14, 0.008), std(0x0d0d12, 0.4, 0.7), 0, 0.009, 0, kb);
  const ROWS = 5, COLS = 14, N = ROWS * COLS, pitch = 0.0265;
  const caps = new THREE.InstancedMesh(RB(0.0215, 0.01, 0.0215, 0.004, 2), std(0x1b1b24, 0.45, 0.2), N), glows = new THREE.InstancedMesh(new THREE.BoxGeometry(0.0255, 0.004, 0.0255), new THREE.MeshBasicMaterial({ color: 0xffffff }), N);
  const dm = new THREE.Object3D(), kpos = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const i = r * COLS + c, x = (c - (COLS - 1) / 2) * pitch, z = (r - (ROWS - 1) / 2) * pitch; kpos.push([x, z]);
    dm.position.set(x, 0.0235, z); dm.updateMatrix(); caps.setMatrixAt(i, dm.matrix); dm.position.set(x, 0.0185, z); dm.updateMatrix(); glows.setMatrixAt(i, dm.matrix); glows.setColorAt(i, new THREE.Color()); }
  kb.add(caps, glows); const pressed = new Float32Array(N);
  const mouse = new THREE.Group(); mouse.position.set(0.58, 0.78, 0.22); mouse.rotation.y = 0.15; scene.add(mouse);
  const mBody = mk(new THREE.CapsuleGeometry(0.02, 0.045, 8, 16), std(0x16161d, 0.3, 0.55), 0, 0.016, 0, mouse); mBody.rotation.x = Math.PI / 2; mBody.scale.set(1, 1, 0.62);
  const mGlow = mk(new THREE.BoxGeometry(0.028, 0.003, 0.003), glow(0xff3d9a), 0, 0.027, 0.05, mouse);

  // ----- PC tower -----
  const pc = new THREE.Group(); pc.position.set(1.55, 0.27, 0.35); pc.rotation.y = 0.15; scene.add(pc);
  mk(RB(0.5, 0.54, 0.24, 0.012), std(0x0c0c11, 0.35, 0.65), 0, 0, 0, pc);
  mk(new THREE.BoxGeometry(0.455, 0.495, 0.01), new THREE.MeshPhysicalMaterial({ color: 0x0a0a14, transparent: true, opacity: 0.28, roughness: 0.04, metalness: 0.2, clearcoat: 1 }), 0, 0, 0.123, pc);
  mk(new THREE.PlaneGeometry(0.44, 0.48), std(0x07070a, 0.9, 0), 0, 0, 0.0, pc).position.z = -0.1;
  const fans = []; [-0.15, 0, 0.15].forEach((y) => { const f = new THREE.Group(); f.position.set(-0.13, y, 0.105); pc.add(f); mk(new THREE.TorusGeometry(0.062, 0.006, 8, 32), glow(0x22d3ee), 0, 0, 0, f);
    for (let b = 0; b < 7; b++) { const bl = mk(new THREE.BoxGeometry(0.05, 0.016, 0.003), std(0x15131f, 0.4, 0.4), 0, 0, 0, f); bl.position.set(Math.cos(b / 7 * Math.PI * 2) * 0.03, Math.sin(b / 7 * Math.PI * 2) * 0.03, 0); bl.rotation.z = b / 7 * Math.PI * 2 + 0.5; }
    fans.push(f); });
  mk(RB(0.26, 0.055, 0.1, 0.008), std(0x16161d, 0.3, 0.7), 0.08, -0.05, 0.03, pc);
  const gpuLed = mk(new THREE.BoxGeometry(0.24, 0.006, 0.004), glow(0xff3d9a), 0.08, -0.02, 0.083, pc);
  const ramLed = mk(new THREE.BoxGeometry(0.008, 0.1, 0.004), glow(0xa855f7), 0.04, 0.12, 0.05, pc), ramLed2 = mk(new THREE.BoxGeometry(0.008, 0.1, 0.004), glow(0x22d3ee), 0.065, 0.12, 0.05, pc);
  const pcLight = new THREE.PointLight(0x22d3ee, 1.4, 1.6, 2); pcLight.position.set(0, 0, 0.2); pc.add(pcLight);

  // headset
  const hs = new THREE.Group(); hs.position.set(-1.0, 0.775, -0.25); scene.add(hs);
  mk(new THREE.CylinderGeometry(0.06, 0.07, 0.012, 28), std(0x16161d, 0.3, 0.8), 0, 0.006, 0, hs); mk(new THREE.CylinderGeometry(0.008, 0.008, 0.24, 12), std(0x16161d, 0.3, 0.8), 0, 0.125, 0, hs);
  mk(new THREE.TorusGeometry(0.085, 0.009, 10, 32, Math.PI), std(0x1b1b24, 0.45, 0.4), 0, 0.23, 0, hs);
  [-0.085, 0.085].forEach(x => { mk(new THREE.CylinderGeometry(0.045, 0.045, 0.035, 28), std(0x101016, 0.55, 0.25), x, 0.23, 0, hs).rotation.z = Math.PI / 2; mk(new THREE.TorusGeometry(0.036, 0.004, 8, 24), glow(0xff3d9a), x + Math.sign(x) * 0.019, 0.23, 0, hs).rotation.y = Math.PI / 2; });

  // coffee mug + steam
  const mug = new THREE.Group(); mug.position.set(0.82, 0.775, 0.05); scene.add(mug);
  mk(new THREE.LatheGeometry([[0, 0], [0.04, 0], [0.042, 0.01], [0.042, 0.09], [0.038, 0.09], [0.036, 0.012], [0, 0.012]].map(p => new THREE.Vector2(...p)), 24), std(0x9c98ad, 0.45, 0.05), 0, 0, 0, mug);
  mk(new THREE.CircleGeometry(0.037, 24), std(0x2b1608, 0.2, 0), 0, 0.078, 0, mug).rotation.x = -Math.PI / 2; mk(new THREE.TorusGeometry(0.025, 0.006, 8, 16, Math.PI), std(0x9c98ad, 0.45, 0.05), 0.045, 0.05, 0, mug).rotation.z = -Math.PI / 2;
  const stN = 18, stP = new Float32Array(stN * 3), stS = []; for (let i = 0; i < stN; i++) { stS.push(Math.random()); }
  const stG = new THREE.BufferGeometry(); stG.setAttribute('position', new THREE.BufferAttribute(stP, 3));
  const steam = new THREE.Points(stG, new THREE.PointsMaterial({ color: 0xdddddd, size: 0.05, map: (() => { const [c, g] = cv(64, 64); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,.9)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })(), transparent: true, opacity: 0.1, depthWrite: false })); steam.position.set(0, 0.09, 0); mug.add(steam);

  // plant
  const plant = new THREE.Group(); plant.position.set(2.25, 0, -0.55); scene.add(plant);
  mk(new THREE.CylinderGeometry(0.17, 0.12, 0.3, 24), std(0x1c1a26, 0.7, 0.1), 0, 0.15, 0, plant); mk(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 24), std(0x1b110a, 1, 0), 0, 0.29, 0, plant);
  const leaves = []; const leafM = std(0x1f7a4a, 0.55, 0, { side: THREE.DoubleSide });
  for (let i = 0; i < 16; i++) { const lg = new THREE.Group(); lg.rotation.y = i * 2.4; lg.rotation.z = 0.3 + (i % 4) * 0.18; plant.add(lg); lg.position.y = 0.3;
    const l = mk(new THREE.SphereGeometry(1, 12, 8), leafM, 0, 0.18 + (i % 3) * 0.06, 0, lg); l.scale.set(0.045, 0.2 + (i % 5) * 0.04, 0.01); l.rotation.z = 0.08; leaves.push(lg); }

  // cables
  const cableM = std(0x050508, 0.8, 0); const cable = (pts, r = 0.004) => mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 40, r, 6), cableM, 0, 0, 0, scene);
  cable([[0.1, 0.78, -0.3], [0.1, 0.77, -0.42], [0.4, 0.76, -0.45], [1.2, 0.5, -0.44], [1.5, 0.3, -0.2], [1.55, 0.3, 0.2]]);
  cable([[-0.05, 0.78, -0.3], [-0.2, 0.77, -0.44], [-0.9, 0.5, -0.45], [-1.2, 0.0, -0.6]], 0.003);
  cable([[0.05, 0.78, 0.13], [0.05, 0.77, -0.1], [0.08, 0.77, -0.3]], 0.003);

  // chair
  const chair = new THREE.Group(); chair.position.set(-1.45, 0, 1.55); chair.rotation.y = Math.PI + 0.6; chair.scale.setScalar(0.92); scene.add(chair);
  const fab = fabricTex('#14141c'); const cm = std(0xffffff, 0.85, 0, { map: fab }), accent = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.5, emissive: 0x5b21b6, emissiveIntensity: 0.6 }); const cmetal = std(0x23232f, 0.3, 0.9);
  mk(RB(0.54, 0.1, 0.52, 0.04), cm, 0, 0.5, 0, chair);
  const back = mk(RB(0.5, 0.78, 0.1, 0.04), cm, 0, 0.95, -0.24, chair); back.rotation.x = -0.1; mk(RB(0.1, 0.72, 0.105, 0.02), accent, 0, 0.95, -0.243, chair).rotation.x = -0.1;
  mk(RB(0.3, 0.17, 0.09, 0.04), cm, 0, 1.4, -0.27, chair); mk(RB(0.34, 0.1, 0.09, 0.03), cm, 0, 0.7, -0.19, chair);
  [-0.3, 0.3].forEach(x => { mk(RB(0.06, 0.035, 0.32, 0.015), std(0x15151b, 0.6, 0.1), x, 0.73, 0, chair); mk(RB(0.03, 0.22, 0.03, 0.01), cmetal, x, 0.62, -0.05, chair); });
  mk(new THREE.CylinderGeometry(0.035, 0.035, 0.32, 14), cmetal, 0, 0.3, 0, chair);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const leg = mk(RB(0.34, 0.03, 0.045, 0.012), cmetal, Math.cos(a) * 0.17, 0.1, Math.sin(a) * 0.17, chair); leg.rotation.y = -a; mk(new THREE.SphereGeometry(0.03, 12, 12), std(0x0a0a0d, 0.5, 0), Math.cos(a) * 0.33, 0.04, Math.sin(a) * 0.33, chair); }

  // dust
  const dustN = 200, dp = new Float32Array(dustN * 3), dv = []; for (let i = 0; i < dustN; i++) { dp[i * 3] = (Math.random() - 0.5) * 6; dp[i * 3 + 1] = Math.random() * 3.2; dp[i * 3 + 2] = (Math.random() - 0.5) * 4; dv.push(0.01 + Math.random() * 0.02); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3)); scene.add(new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xc4b5fd, size: 0.01, transparent: true, opacity: 0.45, depthWrite: false })));

  // shadows
  scene.traverse(o => { if (o.isMesh && (o.material.isMeshStandardMaterial || o.material.isMeshPhysicalMaterial) && o !== floor) { o.castShadow = o.material.opacity === 1; o.receiveShadow = true; } });
  floor.receiveShadow = true; rug.receiveShadow = true; deskMat.castShadow = false;

  // post
  const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.5, 0.6, 0.42); composer.addPass(bloom); composer.addPass(new OutputPass());

  // ----- camera states -----
  const overviewPos = new THREE.Vector3(1.9, 1.45, 2.7), overviewLook = new THREE.Vector3(0.05, 1.05, -0.3);
  const zoomLook = new THREE.Vector3(), zoomPos = new THREE.Vector3(), introFrom = new THREE.Vector3(4.4, 2.6, 5.6);
  let mode = 'hidden', zt = 0, zTarget = 0, introT = 0; const pointer = { x: 0, y: 0 }; const look = new THREE.Vector3(); let W = 1, H = 1;
  function layoutZoom() { const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)); const dist = Math.max((SW / 0.9) / (2 * tanV * camera.aspect), (SH / 0.9) / (2 * tanV)); const c = new THREE.Vector3(); screen.getWorldPosition(c); zoomLook.copy(c); zoomPos.set(c.x, c.y, c.z + dist + 0.01); }
  function resize() { W = canvas.clientWidth || window.innerWidth; H = canvas.clientHeight || window.innerHeight; renderer.setPixelRatio(dpr); renderer.setSize(W, H, false); composer.setPixelRatio(dpr); composer.setSize(W, H); bloom.setSize(W / 2, H / 2); renderer.shadowMap.needsUpdate = true; camera.aspect = W / H; camera.updateProjectionMatrix(); monitor.updateMatrixWorld(true); layoutZoom(); }
  window.addEventListener('resize', resize); resize();
  const corners = [[-1, 1], [1, 1], [1, -1], [-1, -1]].map(([a, b]) => new THREE.Vector3(a * SW / 2, b * SH / 2, 0));
  function screenRect() { screen.updateMatrixWorld(true); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; corners.forEach(c => { const v = c.clone().applyMatrix4(screen.matrixWorld).project(camera); const px = (v.x * 0.5 + 0.5) * W, py = (-v.y * 0.5 + 0.5) * H; x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); }); return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; }

  const ray = new THREE.Raycaster(); let hover = false;
  function setRay(e) { const r = canvas.getBoundingClientRect(); ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera); }
  canvas.addEventListener('pointermove', e => { pointer.x = (e.clientX / window.innerWidth) * 2 - 1; pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    if (mode === 'overview') { setRay(e); hover = ray.intersectObjects(hitMeshes).length > 0; const th = ray.intersectObjects(trophies)[0]; hooks.onTip && hooks.onTip(th ? th.object.userData.tip : null, e.clientX, e.clientY); canvas.style.cursor = hover ? 'pointer' : 'default'; } });
  canvas.addEventListener('click', e => { if (mode === 'overview') { setRay(e); if (ray.intersectObjects(hitMeshes).length) api.enter(); } });

  // ----- live textures -----
  const codeLines = ['model.load("banglabert")', 'quantize(bits=4)', 'wav2vec2.cpu_bench()', 'asr → nlu → tts', 'lora.r = 8', 'eval: acc=0.941', 'latency 182ms', 'git push origin main', 'torch.compile()', 'FP16 → INT8', 'tokens/s: 41.7', 'homograph.resolve()', 'RAG.retrieve(k=5)', 'train: loss=0.231'];
  const logBuf = []; let logT = 0; const MONO = '600 13px "JetBrains Mono", ui-monospace, Consolas, monospace';
  function drawSide(t) { sx.fillStyle = '#06050d'; sx.fillRect(0, 0, 256, 430); sx.fillStyle = '#a855f7'; sx.font = '700 15px Inter, Arial'; sx.fillText('● LIVE TERMINAL', 12, 24); sx.font = MONO;
    logBuf.forEach((l, i) => { sx.fillStyle = i % 3 === 0 ? '#22d3ee' : (i % 3 === 1 ? '#c4b5fd' : '#ff7ab8'); sx.fillText('> ' + l, 12, 56 + i * 22); }); sx.fillStyle = '#22d3ee'; if (((t * 2) | 0) % 2) sx.fillRect(12, 56 + logBuf.length * 22 - 10, 8, 13); sideTex.needsUpdate = true; }
  function drawScreen(t) { const w = 1024, h = 431; const g = scx.createLinearGradient(0, 0, w, h); g.addColorStop(0, `hsl(${260 + Math.sin(t * .3) * 25},70%,9%)`); g.addColorStop(1, `hsl(${200 + Math.cos(t * .25) * 25},75%,11%)`); scx.fillStyle = g; scx.fillRect(0, 0, w, h);
    scx.strokeStyle = 'rgba(168,85,247,.2)'; scx.lineWidth = 1; for (let i = 0; i < 24; i++) { const y = (i * 22 + (t * 18) % 22); scx.beginPath(); scx.moveTo(0, y); scx.lineTo(w, y); scx.stroke(); }
    scx.beginPath(); scx.strokeStyle = '#22d3ee'; scx.lineWidth = 3; scx.shadowColor = '#22d3ee'; scx.shadowBlur = 14; for (let x = 0; x <= w; x += 6) { const y = 310 + Math.sin(x * 0.02 + t * 2) * 26 + Math.sin(x * 0.047 - t * 1.3) * 14; x ? scx.lineTo(x, y) : scx.moveTo(x, y); } scx.stroke(); scx.shadowBlur = 0;
    scx.textAlign = 'center'; scx.fillStyle = '#f5eeff'; scx.font = '900 70px Orbitron, Arial Black, sans-serif'; scx.fillText('ASIF AHMED', w / 2, 150); scx.fillStyle = '#a5f3fc'; scx.font = '600 26px Inter, Arial, sans-serif'; scx.fillText('VOICE AI  ·  NLP  ·  QUANTIZATION', w / 2, 200);
    scx.fillStyle = `rgba(255,255,255,${0.6 + Math.sin(t * 3) * 0.3})`; scx.font = '600 21px Inter, Arial, sans-serif'; scx.fillText(mode === 'overview' ? '▶ CLICK TO SIT DOWN' : '', w / 2, 375); scx.textAlign = 'left'; screenTex.needsUpdate = true; }

  const clock = new THREE.Clock(); let ema = 0.016, qf = 0, frames = 0, accum = 0; const tmpC = new THREE.Color();
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.12), t = clock.elapsedTime;
    ema += (dt - ema) * 0.05; if (++qf % 40 === 0) { if (ema > 0.024 && dpr > 0.7) { dpr = Math.max(0.7, dpr - 0.15); resize(); } else if (ema < 0.0145 && dpr < maxDpr) { dpr = Math.min(maxDpr, dpr + 0.1); resize(); } }
    if (mode === 'intro') { introT = Math.min(1, introT + dt / 3.4); camera.position.lerpVectors(introFrom, overviewPos, smooth(introT)); look.copy(overviewLook); if (introT >= 1) { renderer.shadowMap.needsUpdate = true; mode = 'overview'; hooks.onOverview && hooks.onOverview(); } }
    else if (mode === 'overview' || mode === 'zoom') { zt += (zTarget - zt) * Math.min(1, dt * 3.2); if (Math.abs(zTarget - zt) < 0.0005) zt = zTarget; const k = smooth(zt);
      camera.position.set(overviewPos.x + pointer.x * 0.4 + Math.sin(t * 0.3) * 0.02, overviewPos.y - pointer.y * 0.2 + Math.sin(t * 0.4) * 0.01, overviewPos.z).lerp(zoomPos, k); look.copy(overviewLook).lerp(zoomLook, k);
      if (mode === 'zoom' && zTarget === 1 && zt === 1) hooks.onZoom && hooks.onZoom(screenRect());
      if (mode === 'zoom' && zTarget === 0 && zt === 0) { mode = 'overview'; hooks.onOverview && hooks.onOverview(); } }
    camera.lookAt(look); camera.updateMatrixWorld(); if (mode === 'zoom') hooks.onRect && hooks.onRect(screenRect(), zt);
    const hue = (t * 0.07) % 1;
    if (!(mode === 'zoom' && zt === 1)) for (let i = 0; i < N; i++) { const [x, z] = kpos[i]; const h = (hue + x * 4 + z * 2 + Math.sin(t + x * 6) * 0.05 + 1) % 1; pressed[i] = Math.max(0, pressed[i] - dt * 4); glows.setColorAt(i, tmpC.setHSL(h, 0.9, 0.5 + pressed[i] * 0.4)); } if (glows.instanceColor) glows.instanceColor.needsUpdate = true;
    accum += dt; if (accum > 0.12 && Math.random() < 0.7) { accum = 0; pressed[(Math.random() * N) | 0] = 1; }
    edge.material.color.setHSL(hue, 0.9, 0.55); lPurple.color.setHSL((hue + 0.05) % 1, 0.8, 0.55); underGlow.material.color.setHSL((hue + 0.5) % 1, 0.9, 0.55); mGlow.material.color.setHSL((hue + 0.3) % 1, 1, 0.6); ring.material.color.setHSL((hue + 0.45) % 1, 0.9, 0.6); gpuLed.material.color.setHSL((hue + 0.8) % 1, 1, 0.6);
    strips.forEach((b, i) => b.material.color.setHSL((hue + i * 0.3) % 1, 0.9, 0.55)); miniLED.visible = ((t * 1.2) | 0) % 2 === 0;
    fans.forEach((f, i) => { f.rotation.z -= dt * (7 + i); f.children[0].material.color.setHSL((hue + i * 0.1) % 1, 0.9, 0.6); });
    ramLed.material.color.setHSL((hue + 0.2) % 1, 1, 0.6); ramLed2.material.color.setHSL((hue + 0.6) % 1, 1, 0.6); mLed.visible = ((t * 1.5) | 0) % 2 === 0; pcLight.color.setHSL((hue + 0.5) % 1, 0.9, 0.5);
    lCyan.intensity = 4 + Math.sin(t * 2) * 0.6; area.color.setHSL(0.62 + Math.sin(t * 0.4) * 0.05, 0.9, 0.6); screenMat.color.setScalar(hover ? 1.2 : 1);
    leaves.forEach((l, i) => { l.rotation.x = Math.sin(t * 0.8 + i) * 0.04; });
    const sp = stG.attributes.position; for (let i = 0; i < stN; i++) { stS[i] = (stS[i] + dt * 0.25) % 1; const s = stS[i]; sp.array[i * 3] = Math.sin(s * 9 + i) * 0.012 * s * 4; sp.array[i * 3 + 1] = s * 0.2; sp.array[i * 3 + 2] = Math.cos(s * 7 + i) * 0.012 * s * 4; } sp.needsUpdate = true;
    logT -= dt; if (logT <= 0) { logT = 0.7 + Math.random() * 0.6; logBuf.push(codeLines[(Math.random() * codeLines.length) | 0]); if (logBuf.length > 16) logBuf.shift(); }
    frames++; if (mode !== 'zoom' && frames % 6 === 0) { drawSide(t); drawScreen(t); }
    const p = dg.attributes.position; for (let i = 0; i < dustN; i++) { p.array[i * 3 + 1] += dv[i] * dt * 3; if (p.array[i * 3 + 1] > 3.3) p.array[i * 3 + 1] = 0; } p.needsUpdate = true;
    chair.rotation.y = Math.PI + 0.6 + Math.sin(t * 0.4) * 0.06; sign.material.opacity = 0.9 + Math.sin(t * 5.2) * 0.03 * (Math.random() > 0.97 ? 8 : 1);
    const still = mode === 'zoom' && zt === 1; if (!still || frames % 8 === 0) composer.render(); requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  const api = {
    startIntro() { if (mode === 'hidden') { mode = 'intro'; introT = 0; sfx.whoosh(); } },
    enter() { if (mode !== 'overview') return; mode = 'zoom'; zTarget = 1; hover = false; canvas.style.cursor = 'default'; hooks.onTip && hooks.onTip(null); sfx.whoosh(); hooks.onEnter && hooks.onEnter(); },
    leave() { if (mode !== 'zoom') return; zTarget = 0; hooks.onLeave && hooks.onLeave(); sfx.whoosh(); },
    get mode() { return mode; }, renderer
  };
  return api;
}
