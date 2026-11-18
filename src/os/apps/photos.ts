/**
 * PhotosApp: Windows 11 Photos-style window with four tabs.
 *   Gallery  : bento grid, staggered fade-and-rise (60ms), hover lift/zoom/caption, click -> shared-element Lightbox
 *   Memories : auto-playing story slideshow with typed captions and optional soft music
 *   About me : split layout, cursor-following 3D tilt on the best photo + bio revealed line by line
 *   Work     : generated project art (open with `explorer` project links)
 */
import { data } from '../data';
import { h } from '../util';
import { projectArt } from '../art';
import { photoEl, ratio, best, Avatar } from '../img';
import { Lightbox, LbItem } from '../ui/lightbox';
import { Memories } from '../ui/memories';
import type { OS } from '../shell';
import type { Win } from '../wm';

type Tab = 'gallery' | 'memories' | 'about' | 'work';

export function TiltCard(reduced: () => boolean): HTMLElement {
  const p = best(); const card = h('div', { class: 'tilt' }, h('div', { class: 'tilt-in' }, p ? photoEl(p, { cls: 'tilt-pic', eager: true, sizes: '420px' }) : Avatar(200), h('div', { class: 'tilt-glare' }), h('div', { class: 'tilt-cap' }, p?.caption || data.name)));
  const inner = card.firstChild as HTMLElement, glare = card.querySelector('.tilt-glare') as HTMLElement; let raf = 0;
  card.addEventListener('pointermove', e => { if (reduced()) return; const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { inner.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 18}deg) scale3d(1.03,1.03,1.03)`; glare.style.transform = `translate3d(${x * 80}%,${y * 80}%,0)`; glare.style.opacity = '1'; }); });
  card.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); inner.style.transform = ''; glare.style.opacity = '0'; });
  return card;
}

export function bioReveal(extra?: HTMLElement[]): HTMLElement {
  const box = h('div', { class: 'bio' }, h('h2', { class: 'rv-line', style: { '--i': 0 } }, data.name), h('p', { class: 'bio-role rv-line', style: { '--i': 1 } }, data.role + ' · ' + data.location));
  data.bio.forEach((b, i) => box.append(h('p', { class: 'rv-line', style: { '--i': i + 2 } }, b)));
  box.append(h('div', { class: 'chips rv-line', style: { '--i': data.bio.length + 2 } }, [data.stats.cgpa + ' CGPA', data.stats.deans].map(t => h('i', {}, t))), ...(extra || [])); return box;
}

export function build(body: HTMLElement, win: Win, os: OS, arg?: { project?: string; photo?: number }) {
  const reduced = () => os.S.reduced; const mem = Memories(reduced); let tab: Tab = 'gallery';
  const personal: LbItem[] = data.photos.map(p => ({ id: p.id, caption: p.caption, alt: p.alt, photo: p }));
  const work = data.projects.map(p => ({ t: p.title, slug: p.slug, src: projectArt(p, 800, 500) as any as string })); work.push({ t: "Dean's Awards x5", slug: '', src: projectArt({ title: "5x Dean's Award", accent: '#d97706', stack: ['AIUB', 'CGPA 3.86'] } as any, 800, 500) as any }, { t: 'Thesis: Quantized Bangla LLMs', slug: '', src: projectArt({ title: 'Quantized Bangla LLMs', accent: '#6d28d9', stack: ['Thesis', 'AIUB'] } as any, 800, 500) as any });
  const workItems: LbItem[] = work.map((w, i) => ({ id: 'w' + i, caption: w.t, alt: w.t + ' project preview', url: w.src, w: 800, h: 500 }));
  const root = h('div', { class: 'ph', tabindex: '-1' }), content = h('div', { class: 'ph-content' });
  const tabs = h('div', { class: 'ph-tabs', role: 'tablist' }); const defs: [Tab, string][] = [['gallery', '🖼️ Gallery'], ['memories', '✨ Memories'], ['about', '🙋 About me'], ['work', '💼 Work']];
  const tbtn: Record<string, HTMLElement> = {}; defs.forEach(([k, l]) => { tbtn[k] = h('button', { class: 'ph-tab', role: 'tab', onclick: () => setTab(k) }, l); tabs.append(tbtn[k]); });
  root.append(tabs, content); body.append(root);
  let grid: HTMLElement; let lb: ReturnType<typeof Lightbox> | null = null;
  const thumbs: HTMLElement[] = [];
  function tile(it: LbItem, i: number, list: LbItem[], set: 'p' | 'w') {
    const r = it.photo ? ratio(it.photo) : 1.6; const cls = r < 0.95 ? 'tall' : r > 1.2 ? 'wide' : 'sq';
    const media = it.photo ? photoEl(it.photo, { sizes: '(max-width:700px) 90vw, 360px' }) : h('div', { class: 'pic ready' }, h('img', { loading: 'lazy', src: it.url, alt: it.alt }));
    const b = h('button', { class: 'ph-t ' + cls, style: { '--d': i * 60 + 'ms' }, 'aria-label': 'Open ' + it.caption, onclick: () => { lb = Lightbox(root, list, { getThumb: k => thumbs[k] || null, reduced }); lb.open(i); } }, media, h('span', { class: 'ph-cap' }, it.caption)); thumbs[i] = b; return b;
  }
  function grid_(list: LbItem[], set: 'p' | 'w') { thumbs.length = 0; return h('div', { class: 'ph-grid bento' }, list.map((it, i) => tile(it, i, list, set))); }
  function setTab(t: Tab) {
    tab = t; mem.stop(); Object.entries(tbtn).forEach(([k, b]) => { b.classList.toggle('on', k === t); b.setAttribute('aria-selected', String(k === t)); }); content.replaceChildren();
    const page = h('div', { class: 'ph-page' });
    if (t === 'gallery') { page.append(h('div', { class: 'ph-hd' }, h('h3', {}, 'Photos'), h('small', {}, `${personal.length} photos · click one to open`)), grid_(personal, 'p')); }
    else if (t === 'work') page.append(h('div', { class: 'ph-hd' }, h('h3', {}, 'Work'), h('small', {}, 'Project previews')), grid_(workItems, 'w'));
    else if (t === 'memories') { page.classList.add('full'); page.append(mem.el); mem.start(); }
    else { page.classList.add('abt'); page.append(TiltCard(reduced), bioReveal([h('div', { class: 'abt-btns rv-line', style: { '--i': data.bio.length + 3 } }, h('a', { class: 'abtn', href: data.github, target: '_blank', rel: 'noopener' }, 'GitHub'), h('a', { class: 'abtn alt', href: 'mailto:' + data.email }, 'Email me'))])); }
    content.append(page);
  }
  setTab(arg?.project ? 'work' : 'gallery');
  if (arg?.project) { const i = work.findIndex(x => x.slug === arg.project); if (i >= 0) setTimeout(() => { lb = Lightbox(root, workItems, { getThumb: k => thumbs[k] || null, reduced }); lb.open(i); }, 250); }
  else if (typeof arg?.photo === 'number') setTimeout(() => { lb = Lightbox(root, personal, { getThumb: k => thumbs[k] || null, reduced }); lb.open(arg.photo!); }, 250);
  void win;
  return { onFocus: () => { root.focus({ preventScroll: true }); if (tab === 'memories') mem.start(); }, onBlur: () => mem.stop(), onClose: () => mem.stop(), onArg: (a: any) => { if (typeof a?.photo === 'number') { setTab('gallery'); setTimeout(() => { lb = Lightbox(root, personal, { getThumb: k => thumbs[k] || null, reduced }); lb.open(a.photo); }, 150); } } };
}
