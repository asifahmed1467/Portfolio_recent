import { startScene } from './main.js';
import { createOS } from './os/shell.ts';
const $ = s => document.querySelector(s);
const tip = $('#tip');
const ov = $('#ov'), hud = $('#hud'), top = $('#top'), snd = $('#snd'), back = $('#back'), boot = $('#boot');
const small = window.innerWidth < 800 || (window.matchMedia('(pointer:coarse)').matches && window.innerWidth < 1000);
let glOK = !small; let scene = null;
if (glOK) { try { const t = document.createElement('canvas'); if (!(t.getContext('webgl2') || t.getContext('webgl'))) glOK = false; } catch (e) { glOK = false; } }
let os = null;
function ensureOS(flat) { if (!os) os = createOS(ov, flat); return os; }
function openFlat() { ov.classList.add('flat', 'show'); $('#gl').style.display = 'none'; boot.classList.add('out'); back.style.display = 'none'; ensureOS(true).show(); }
const lines = [...document.querySelectorAll('.bl[data-d]')]; let p = 0;
lines.forEach(l => setTimeout(() => l.classList.add('on'), 250 + (+l.dataset.d) * 420));
const iv = setInterval(() => { p = Math.min(100, p + 2 + Math.random() * 5); $('#pb').style.width = p + '%'; $('#pct').textContent = 'BOOTING… ' + Math.floor(p) + '%'; if (p >= 100) { clearInterval(iv); $('#pct').textContent = 'READY'; $('#start').style.display = 'inline-block'; } }, 90);
function place(r) { const s = r.w / 1600; ov.style.transform = `translate(${r.x}px,${r.y}px) scale(${s})`; }
if (glOK) {
  try {
    scene = startScene($('#gl'), {
      onOverview() { ov.classList.remove('show'); os && os.hide(); hud.classList.add('on'); top.classList.add('on'); snd.classList.add('on'); back.style.display = 'none'; },
      onTip(t, x, y) { if (!t) { tip.style.display = 'none'; return; } tip.textContent = t; tip.style.display = 'block'; tip.style.left = (x + 14) + 'px'; tip.style.top = (y + 14) + 'px'; },
      onEnter() { hud.classList.remove('on'); top.classList.remove('on'); },
      onLeave() { ov.classList.remove('show'); os && os.hide(); back.style.display = 'none'; },
      onZoom(r) { if (!ov.classList.contains('show')) { ov.classList.add('show'); back.style.display = 'block'; ensureOS(false).show(); } place(r); },
      onRect(r) { if (ov.classList.contains('show')) place(r); }
    });
  } catch (e) { glOK = false; scene = null; }
}
function classic() { ensureOS(!glOK || !scene).classic(); }
$('#start').addEventListener('click', () => {
  if (!glOK) { openFlat(); return; }
  window.__sfx.init(); window.__sfx.chime(); boot.classList.add('out'); scene.startIntro();
});
$('#classicLink').addEventListener('click', () => { boot.classList.add('out'); classic(); });
$('#classicBtn').addEventListener('click', classic);
window.__leave = () => scene && scene.leave();
$('#enter').addEventListener('click', () => scene && scene.enter());
back.addEventListener('click', () => scene && scene.leave());
window.addEventListener('keydown', e => { if (e.key === 'Escape' && !(os && os.handleEscape()) && scene) scene.leave(); });
snd.addEventListener('click', () => { const on = window.__sfx.toggle(); snd.textContent = on ? '🔊 SOUND ON' : '🔇 SOUND OFF'; });
