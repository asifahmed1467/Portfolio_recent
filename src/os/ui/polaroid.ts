/**
 * PolaroidStack: tilted photos with white borders, handwritten captions and a drop shadow.
 * Hover (or keyboard focus) fans the stack out; click / Enter brings a photo to the front; clicking the front photo calls onOpen.
 */
import { data, Photo } from '../data';
import { h } from '../util';
import { photoEl } from '../img';

export function PolaroidStack(o: { onOpen?: (p: Photo) => void; reduced: () => boolean }) {
  const photos = data.photos; let order = photos.map((_, i) => i); const n = photos.length; const base = [-5, 4, -2, 6, -4]; let fan = false;
  const el = h('div', { class: 'pols', role: 'group', 'aria-label': 'Photo collage' });
  const cards = photos.map((p, i) => {
    const c = h('button', { class: 'pol', 'aria-label': `${p.caption}. Press Enter to bring to front.`, onclick: () => click(i) }, h('div', { class: 'pol-img' }, photoEl(p, { sizes: '220px' })), h('span', { class: 'pol-cap' }, p.caption));
    el.append(c); return c;
  });
  function layout() {
    order.forEach((idx, z) => {
      const c = cards[idx], top = z === n - 1; const k = z - (n - 1) / 2;
      const x = fan ? k * 50 : (idx % 2 ? 10 : -10) * (top ? 0 : 1), y = fan ? Math.abs(k) * 8 - 14 : (top ? 0 : 4 * (n - 1 - z)), r = fan ? k * 7 : (top ? base[idx % 5] * 0.4 : base[idx % 5]);
      c.style.setProperty('--x', x + 'px'); c.style.setProperty('--y', y + 'px'); c.style.setProperty('--r', r + 'deg'); c.style.zIndex = String(z + 1); c.classList.toggle('top', top);
    });
  }
  function click(i: number) { if (order[n - 1] === i) { o.onOpen?.(photos[i]); return; } order = [...order.filter(x => x !== i), i]; layout(); if (!o.reduced()) cards[i].animate([{ transform: 'translate(var(--x),var(--y)) rotate(var(--r)) scale(1.07)' }, { transform: 'translate(var(--x),var(--y)) rotate(var(--r)) scale(1)' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
  const setFan = (v: boolean) => { fan = v; layout(); };
  el.addEventListener('pointerenter', () => setFan(true)); el.addEventListener('pointerleave', () => setFan(false)); el.addEventListener('focusin', () => setFan(true)); el.addEventListener('focusout', e => { if (!el.contains((e as FocusEvent).relatedTarget as Node)) setFan(false); });
  layout(); return el;
}
