/**
 * Lightbox: shared-element transition (FLIP) from the clicked grid thumbnail to a full view.
 * Equivalent of Framer Motion's layoutId, done with the Web Animations API: the figure animates from the thumbnail's
 * rectangle (scale + clip-path, so the crop morphs from "cover" to "contain" with no distortion) to its final place.
 * Features: arrow keys / swipe, wheel + pinch zoom, drag to pan, double-click zoom, thumbnail filmstrip,
 * slideshow (play/pause), Ken Burns auto-play mode, Esc to close, focus restore, aria-modal.
 * Reduced motion: every movement is replaced by a plain opacity fade.
 */
import { Photo } from '../data';
import { h, clamp } from '../util';
import { photoEl, imgSrc, ratio, fp } from '../img';

export interface LbItem { id: string; caption: string; alt: string; photo?: Photo; url?: string; w?: number; h?: number; }
export interface LbOpts { getThumb: (i: number) => HTMLElement | null; reduced: () => boolean; }
const EASE = 'cubic-bezier(.2,.8,.2,1)';

export function Lightbox(host: HTMLElement, items: LbItem[], o: LbOpts) {
  let idx = 0, z = 1, tx = 0, ty = 0, playing = false, kbMode = true, timer = 0, isOpen = false, prevFocus: Element | null = null, busy = false;
  const ptrs = new Map<number, { x: number; y: number }>(); let pinch = 0, sx = 0, sy = 0, moved = false;
  const el = h('div', { class: 'lb', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Photo viewer', tabindex: '-1' });
  const back = h('div', { class: 'lb-back' }), stage = h('div', { class: 'lb-stage' }), fig = h('div', { class: 'lb-fig' }), zoomer = h('div', { class: 'lb-zoom' }); fig.append(zoomer); stage.append(fig);
  const cap = h('div', { class: 'lb-cap', 'aria-live': 'polite' }), count = h('span', { class: 'lb-count' });
  const btn = (label: string, txt: string, fn: () => void, cls = '') => h('button', { class: 'lb-btn ' + cls, 'aria-label': label, title: label, onclick: (e: Event) => { e.stopPropagation(); fn(); } }, txt);
  const playBtn = btn('Play slideshow', '▶', () => setPlay(!playing)), kbBtn = btn('Ken Burns mode', '🎬', () => { kbMode = !kbMode; kbBtn.classList.toggle('on', kbMode); applyKB(); }, 'on');
  const bar = h('div', { class: 'lb-bar' }, count, h('span', { class: 'lb-sp' }), btn('Zoom out', '−', () => zoomTo(z / 1.4)), btn('Zoom in', '+', () => zoomTo(z * 1.4)), playBtn, kbBtn, btn('Close', '✕', () => close(), 'x'));
  const prev = btn('Previous photo', '‹', () => go(-1), 'nav l'), next = btn('Next photo', '›', () => go(1), 'nav r');
  const strip = h('div', { class: 'lb-strip', role: 'tablist', 'aria-label': 'Thumbnails' });
  const thumbs = items.map((it, i) => { const b = h('button', { class: 'lb-th', role: 'tab', 'aria-label': it.caption, onclick: (e: Event) => { e.stopPropagation(); go(i - idx); } }, h('img', { alt: '', src: it.photo ? imgSrc(it.photo) : it.url, draggable: 'false' })); strip.append(b); return b; });
  el.append(back, stage, bar, prev, next, h('div', { class: 'lb-foot' }, cap, strip), h('div', { class: 'fxg' }));

  const dims = (it: LbItem) => { const r = it.photo ? ratio(it.photo) : (it.w || 4) / (it.h || 3); const W = stage.clientWidth - 24, H = stage.clientHeight - 16; let w = Math.min(W, H * r), hh = w / r; if (hh > H) { hh = H; w = H * r; } return { w, h: hh }; };
  function fill() {
    const it = items[idx], d = dims(it); fig.style.width = d.w + 'px'; fig.style.height = d.h + 'px';
    zoomer.replaceChildren(it.photo ? photoEl(it.photo, { cls: 'lb-pic', eager: true, sizes: '960px' }) : h('div', { class: 'pic ready lb-pic' }, h('img', { src: it.url, alt: it.alt, draggable: 'false' })));
    cap.textContent = it.caption; count.textContent = `${idx + 1} / ${items.length}`; z = 1; tx = ty = 0; applyZ();
    thumbs.forEach((t, i) => { t.classList.toggle('on', i === idx); t.setAttribute('aria-selected', String(i === idx)); }); const t = thumbs[idx]; strip.scrollTo({ left: t.offsetLeft - strip.clientWidth / 2 + t.offsetWidth / 2, behavior: o.reduced() ? 'auto' : 'smooth' });
    prev.style.visibility = next.style.visibility = items.length > 1 ? '' : 'hidden'; applyKB();
  }
  const applyZ = () => { zoomer.style.transform = `translate3d(${tx}px,${ty}px,0) scale(${z})`; fig.classList.toggle('zoomed', z > 1); };
  function clampPan() { const mx = fig.clientWidth * (z - 1) / 2, my = fig.clientHeight * (z - 1) / 2; tx = clamp(tx, -mx, mx); ty = clamp(ty, -my, my); }
  function zoomTo(nz: number, cx?: number, cy?: number) { const oz = z; z = clamp(nz, 1, 5); if (cx != null && cy != null && oz !== z) { tx = cx - (cx - tx) * (z / oz); ty = cy - (cy - ty) * (z / oz); } if (z === 1) tx = ty = 0; clampPan(); applyZ(); }
  function applyKB() { fig.classList.toggle('kbx', playing && kbMode && !o.reduced()); const f = items[idx].photo; if (f) fig.style.setProperty('--o', fp(f)); }
  function setPlay(v: boolean) { playing = v; playBtn.textContent = v ? '⏸' : '▶'; playBtn.setAttribute('aria-label', v ? 'Pause slideshow' : 'Play slideshow'); clearInterval(timer); if (v) timer = window.setInterval(() => go(1), 4500); applyKB(); }
  async function go(d: number) {
    if (busy || items.length < 2) return; busy = true; const dir = d >= 0 ? 1 : -1, reduced = o.reduced();
    if (!isOpen) { busy = false; return; }
    await fig.animate(reduced ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * 36}px)` }], { duration: 150, easing: 'ease-in', fill: 'forwards' }).finished.catch(() => { });
    idx = (idx + d + items.length * 4) % items.length; fill();
    await fig.animate(reduced ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: `translateX(${dir * 36}px)` }, { opacity: 1, transform: 'none' }], { duration: 260, easing: EASE, fill: 'none' }).finished.catch(() => { });
    fig.getAnimations().forEach(a => a.cancel()); busy = false;
  }
  /** FLIP: transform + clip-path that make the figure look exactly like the thumbnail rectangle. */
  function flipFrom(thumb: HTMLElement) {
    const sc = host.getBoundingClientRect().width / host.offsetWidth || 1, f = fig.getBoundingClientRect(), t = thumb.getBoundingClientRect(); const fw = f.width / sc, fh = f.height / sc;
    const s = Math.max(t.width / f.width, t.height / f.height), dx = ((t.left + t.width / 2) - (f.left + f.width / 2)) / sc, dy = ((t.top + t.height / 2) - (f.top + f.height / 2)) / sc;
    const ix = Math.max(0, (fw - t.width / sc / s) / 2), iy = Math.max(0, (fh - t.height / sc / s) / 2); return { tr: `translate3d(${dx}px,${dy}px,0) scale(${s})`, clip: `inset(${iy}px ${ix}px round ${8 / s}px)`, ix, iy };
  }
  async function open(i: number) {
    if (isOpen) return; isOpen = true; idx = i; prevFocus = document.activeElement; host.append(el); el.classList.add('on'); fill(); el.focus({ preventScroll: true });
    const th = o.getThumb(i), reduced = o.reduced(); back.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced ? 150 : 300, fill: 'backwards' });
    [bar, prev, next, el.querySelector('.lb-foot') as HTMLElement].forEach(e => e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: reduced ? 0 : 220, fill: 'backwards' }));
    if (th && !reduced) { const f = flipFrom(th); th.style.visibility = 'hidden'; await fig.animate([{ transform: f.tr, clipPath: f.clip }, { transform: 'none', clipPath: 'inset(0px 0px 0px 0px round 8px)' }], { duration: 440, easing: EASE }).finished.catch(() => { }); th.style.visibility = ''; }
    else fig.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
  }
  async function close() {
    if (!isOpen) return; isOpen = false; setPlay(false); const th = o.getThumb(idx), reduced = o.reduced(); z = 1; tx = ty = 0; applyZ();
    if (th && !reduced) { const f = flipFrom(th); th.style.visibility = 'hidden'; back.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }); [bar, prev, next].forEach(e => e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' })); await fig.animate([{ transform: 'none', clipPath: 'inset(0px round 8px)' }, { transform: f.tr, clipPath: f.clip }], { duration: 360, easing: EASE, fill: 'forwards' }).finished.catch(() => { }); th.style.visibility = ''; }
    else await el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }).finished.catch(() => { });
    el.getAnimations({ subtree: true }).forEach(a => a.cancel()); el.remove(); el.classList.remove('on'); (prevFocus as HTMLElement | null)?.focus?.({ preventScroll: true });
  }
  // keyboard
  el.addEventListener('keydown', e => {
    const k = e.key; if (k === 'Escape') { e.stopPropagation(); close(); } else if (k === 'ArrowRight') { go(1); e.stopPropagation(); } else if (k === 'ArrowLeft') { go(-1); e.stopPropagation(); } else if (k === '+' || k === '=') zoomTo(z * 1.4); else if (k === '-') zoomTo(z / 1.4); else if (k === '0') zoomTo(1);
    else if (k === ' ') { e.preventDefault(); setPlay(!playing); } else if (k === 'Home') go(-idx); else if (k === 'End') go(items.length - 1 - idx); else if (k === 'Tab') { const f = [...el.querySelectorAll('button')] as HTMLElement[]; if (!f.length) return; const a = document.activeElement; if (e.shiftKey && a === f[0]) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && a === f[f.length - 1]) { e.preventDefault(); f[0].focus(); } }
  });
  // wheel zoom (scroll or pinch-trackpad)
  stage.addEventListener('wheel', e => { e.preventDefault(); const r = fig.getBoundingClientRect(), sc = host.getBoundingClientRect().width / host.offsetWidth || 1; zoomTo(z * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)), (e.clientX - (r.left + r.width / 2)) / sc, (e.clientY - (r.top + r.height / 2)) / sc); }, { passive: false });
  // pointer: swipe, pan, pinch
  stage.addEventListener('pointerdown', e => { stage.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); sx = e.clientX; sy = e.clientY; moved = false; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); } });
  stage.addEventListener('pointermove', e => {
    const p = ptrs.get(e.pointerId); if (!p) return; const sc = host.getBoundingClientRect().width / host.offsetWidth || 1; const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch) zoomTo(z * d / pinch); pinch = d; moved = true; } else if (z > 1) { tx += dx / sc; ty += dy / sc; clampPan(); applyZ(); moved = true; }
    if (Math.abs(e.clientX - sx) > 6 || Math.abs(e.clientY - sy) > 6) moved = true;
  });
  const up = (e: PointerEvent) => { const wasOne = ptrs.size === 1; ptrs.delete(e.pointerId); pinch = 0; if (wasOne && z === 1) { const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1); else if (dy > 110) close(); else if (!moved && (e.target === stage || e.target === back)) close(); } };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); });
  fig.addEventListener('dblclick', e => { const r = fig.getBoundingClientRect(), sc = host.getBoundingClientRect().width / host.offsetWidth || 1; zoomTo(z > 1 ? 1 : 2.5, (e.clientX - (r.left + r.width / 2)) / sc, (e.clientY - (r.top + r.height / 2)) / sc); });
  window.addEventListener('resize', () => { if (isOpen) fill(); });
  return { open, close, get isOpen() { return isOpen; }, el };
}
