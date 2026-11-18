/**
 * LockScreenSlideshow: Windows-Spotlight-style background that slowly cycles the photos in data.photos.
 * Ken Burns (slow zoom + pan, ~12s) with a 1.2s cross-fade. A dark gradient overlay keeps the clock readable.
 * Used by the lock screen AND the "Slideshow of my photos" wallpaper (pass cls:'ss-wall').
 * Animates only transform + opacity. When reduced motion is on, Ken Burns is skipped and photos simply fade.
 */
import { data } from '../data';
import { h, rnd } from '../util';
import { photoEl, fp, ratio, imgSrc } from '../img';

export interface SlideshowOpts { kb?: number; fade?: number; cls?: string; reduced: () => boolean; start?: number }
export function LockScreenSlideshow(o: SlideshowOpts) {
  const kb = o.kb ?? 12, fade = o.fade ?? 1.2, photos = data.photos;
  const el = h('div', { class: 'ss ' + (o.cls || '') });
  el.style.setProperty('--fade', fade + 's'); el.style.setProperty('--kb', kb + 's');
  const L = [h('div', { class: 'ss-l' }), h('div', { class: 'ss-l' })]; el.append(...L, h('div', { class: 'ss-duo' }), h('div', { class: 'ss-shade' }), h('div', { class: 'fxg' }));
  let cur = -1, i = o.start ?? 0, timer = 0;
  function show() {
    if (!photos.length) return; const p = photos[i % photos.length]; const next = L[(cur + 1) & 1], prev = L[cur & 1] && cur >= 0 ? L[cur & 1] : null;
    next.classList.remove('on', 'go', 'fit'); next.replaceChildren(photoEl(p, { cls: 'ss-pic', eager: true, sizes: '100vw' }));
    // narrow (portrait / square) photo on a wide screen: show it whole on the right over a blurred copy, so the face is never cropped or hidden by the clock
    if (ratio(p) < 1.2) { next.classList.add('fit'); next.style.setProperty('--ar', String(ratio(p))); next.prepend(h('div', { class: 'ss-bg', style: { backgroundImage: `url(${imgSrc(p)})` } })); }
    next.style.setProperty('--o', fp(p)); next.style.setProperty('--dx', rnd(-2.2, 2.2).toFixed(2) + '%'); next.style.setProperty('--dy', rnd(-1.6, 1.6).toFixed(2) + '%'); next.style.setProperty('--z', rnd(1.1, 1.18).toFixed(3));
    void next.offsetWidth; // restart the Ken Burns animation
    if (!o.reduced()) next.classList.add('go'); next.classList.add('on'); prev?.classList.remove('on'); cur++; i++;
  }
  const step = () => (kb + fade * 0.5) * 1000;
  return {
    el, start() { if (timer) return; show(); timer = window.setInterval(show, o.reduced() ? 7000 : step()); },
    stop() { clearInterval(timer); timer = 0; }
  };
}
