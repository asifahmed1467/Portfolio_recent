/**
 * BlobHero: photo inside a morphing blob mask (SVG clipPath, `d` animated between shapes with SMIL),
 * a rotating conic-gradient border, and a floating tech-badge orbit. Used at the top of the Classic view.
 * Reduced motion: static blob, no rotation, no orbit movement.
 */
import { data } from '../data';
import { h } from '../util';
import { best, photoEl } from '../img';

/** Smooth closed blob in unit space: n points, radii r[i], Catmull-Rom -> cubic Bezier. Same command structure for every shape so SMIL can interpolate. */
function blob(r: number[]): string {
  const n = r.length, P = r.map((v, i) => { const a = i / n * Math.PI * 2; return [0.5 + Math.cos(a) * v, 0.5 + Math.sin(a) * v]; });
  let d = `M${P[0][0].toFixed(3)},${P[0][1].toFixed(3)}`;
  for (let i = 0; i < n; i++) { const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n]; d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(3)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(3)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(3)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(3)} ${p2[0].toFixed(3)},${p2[1].toFixed(3)}`; }
  return d + 'Z';
}
const SHAPES = [[.47, .43, .48, .44, .46, .42, .47], [.43, .48, .44, .47, .42, .47, .45], [.46, .45, .42, .48, .45, .44, .48], [.44, .47, .46, .42, .48, .46, .43]].map(blob);

export function BlobHero(reduced: boolean): HTMLElement {
  const id = 'bhc' + Math.floor(Math.random() * 1e6), p = best();
  const svg = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><clipPath id="${id}" clipPathUnits="objectBoundingBox"><path d="${SHAPES[0]}">${reduced ? '' : `<animate attributeName="d" dur="16s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.25;.5;.75;1" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1;.45 0 .55 1" values="${[...SHAPES, SHAPES[0]].join(';')}"/>`}</path></clipPath></defs></svg>`;
  const clip = { clipPath: `url(#${id})`, webkitClipPath: `url(#${id})` } as any;
  const badges = data.heroBadges; const orbit = h('div', { class: 'bh-orbit', 'aria-hidden': 'true' }, badges.map((b, i) => h('span', { class: 'bh-badge', style: { '--a': (i / badges.length * 360) + 'deg' } }, h('i', {}, b))));
  const photo = h('div', { class: 'bh-photo', style: clip }, p ? photoEl(p, { cls: 'bh-pic', eager: true, sizes: '380px' }) : h('span', { class: 'ini' }, data.name[0]));
  return h('div', { class: 'bh' + (reduced ? ' still' : ''), html: svg }, orbit, h('div', { class: 'bh-ring', style: clip }, h('div', { class: 'bh-spin' })), photo, h('div', { class: 'fxg' }));
}

/** Horizontal scroll-snap gallery; each image drifts slightly against the scroll (parallax, transform only). */
export function PhotoGallery(reduced: boolean): HTMLElement {
  const track = h('div', { class: 'pg', role: 'list', tabindex: '0', 'aria-label': 'Photo gallery, scroll horizontally' });
  const cards = data.photos.map(p => { const c = h('figure', { class: 'pg-c', role: 'listitem' }, photoEl(p, { cls: 'pg-pic', sizes: '320px' }), h('figcaption', {}, p.caption)); track.append(c); return c; });
  let raf = 0; const upd = () => { raf = 0; const r = track.getBoundingClientRect(), mid = r.left + r.width / 2; cards.forEach(c => { const cr = c.getBoundingClientRect(), off = (cr.left + cr.width / 2 - mid) / r.width; (c.querySelector('img') as HTMLElement | null)?.style.setProperty('transform', `translate3d(${(-off * 36).toFixed(1)}px,0,0) scale(1.18)`); }); };
  if (!reduced) { track.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true }); setTimeout(upd, 120); }
  return track;
}
