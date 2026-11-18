/**
 * Memories: auto-playing, Instagram-story-style slideshow. Caption typed letter by letter, Ken Burns on every photo,
 * segmented progress bar, tap left/right to navigate, hold to pause, soft background music (muted by default).
 * Reduced motion: no Ken Burns, caption appears at once, photos simply cross-fade.
 */
import { data } from '../data';
import { h } from '../util';
import { photoEl, fp } from '../img';
import { Ambient } from './ambient';

export function Memories(reduced: () => boolean) {
  const photos = data.photos, music = Ambient(); let i = 0, t = 0, dur = 6000, paused = false, hold = false, typeTimer = 0, timer = 0, running = false;
  const el = h('div', { class: 'mem', tabindex: '0', role: 'region', 'aria-label': 'Memories slideshow' });
  const layers = [h('div', { class: 'mem-l' }), h('div', { class: 'mem-l' })]; let cur = 0;
  const segs = photos.map(() => h('i', {}, h('b', {}))), prog = h('div', { class: 'mem-prog', 'aria-hidden': 'true' }, segs);
  const title = h('h3', { class: 'mem-title' }), text = h('p', { class: 'mem-text', 'aria-live': 'off' }), cap = h('div', { class: 'mem-cap' }, title, text);
  const pbtn = h('button', { class: 'lb-btn', 'aria-label': 'Pause', onclick: (e: Event) => { e.stopPropagation(); paused = !paused; pbtn.textContent = paused ? '▶' : '⏸'; pbtn.setAttribute('aria-label', paused ? 'Play' : 'Pause'); } }, '⏸');
  const mbtn = h('button', { class: 'lb-btn', 'aria-label': 'Turn music on', title: 'Soft background music (off by default)', onclick: (e: Event) => { e.stopPropagation(); const on = music.toggle(); mbtn.textContent = on ? '🔊' : '🔇'; mbtn.setAttribute('aria-label', on ? 'Turn music off' : 'Turn music on'); } }, '🔇');
  const zl = h('button', { class: 'mem-z l', 'aria-label': 'Previous memory', onclick: () => jump(i - 1) }), zr = h('button', { class: 'mem-z r', 'aria-label': 'Next memory', onclick: () => jump(i + 1) });
  el.append(...layers, h('div', { class: 'ss-shade' }), prog, h('div', { class: 'mem-top' }, h('span', { class: 'mem-chip' }, '✨ Memories'), h('span', { class: 'lb-sp' }), pbtn, mbtn), zl, zr, cap, h('div', { class: 'fxg' }));
  el.addEventListener('pointerdown', () => { hold = true; }); window.addEventListener('pointerup', () => { hold = false; });
  el.addEventListener('keydown', e => { if (e.key === 'ArrowRight') jump(i + 1); else if (e.key === 'ArrowLeft') jump(i - 1); else if (e.key === ' ') { e.preventDefault(); pbtn.click(); } });
  function type(s: string) {
    clearInterval(typeTimer); text.textContent = ''; if (reduced()) { text.textContent = s; return; } let n = 0; text.classList.add('typing');
    typeTimer = window.setInterval(() => { n++; text.textContent = s.slice(0, n); if (n >= s.length) { clearInterval(typeTimer); text.classList.remove('typing'); } }, 38);
  }
  function show(n: number) {
    i = (n + photos.length) % photos.length; const p = photos[i], next = layers[cur ^ 1], old = layers[cur]; cur ^= 1;
    next.classList.remove('on', 'go'); next.replaceChildren(photoEl(p, { cls: 'ss-pic', eager: true, sizes: '100vw' })); next.style.setProperty('--o', fp(p)); next.style.setProperty('--z', '1.14'); next.style.setProperty('--dx', (i % 2 ? 1.6 : -1.6) + '%'); next.style.setProperty('--dy', '-1%'); next.style.setProperty('--kb', '9s'); void next.offsetWidth;
    if (!reduced()) next.classList.add('go'); next.classList.add('on'); old.classList.remove('on');
    title.textContent = p.caption; title.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: reduced() ? 200 : 500, fill: 'backwards' });
    const story = p.story || p.alt; type(story); dur = Math.max(5500, story.length * 38 + 2600); t = 0;
    segs.forEach((s, k) => { (s.firstChild as HTMLElement).style.transform = `scaleX(${k < i ? 1 : 0})`; });
  }
  const jump = (n: number) => show(n);
  function tick() { if (!running) return; if (!paused && !hold && document.visibilityState === 'visible') { t += 60; (segs[i].firstChild as HTMLElement).style.transform = `scaleX(${Math.min(1, t / dur)})`; if (t >= dur) show(i + 1); } }
  return { el, start() { if (running || !photos.length) return; running = true; show(0); timer = window.setInterval(tick, 60); }, stop() { running = false; clearInterval(timer); clearInterval(typeTimer); music.off(); mbtn.textContent = '🔇'; el.querySelectorAll('.mem-l').forEach(l => l.classList.remove('go')); } };
}
