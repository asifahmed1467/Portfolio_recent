// Window manager: drag, resize, minimize/maximize/close, snap layouts, focus & MRU order.
import { h, clamp } from './util';

export interface Hooks { onFocus?(): void; onBlur?(): void; onClose?(): void; onResize?(): void; }
export interface Win {
  id: number; app: string; title: string; icon: HTMLElement; el: HTMLElement; body: HTMLElement; titleEl: HTMLElement;
  x: number; y: number; w: number; h: number; prev?: { x: number; y: number; w: number; h: number };
  max: boolean; min: boolean; hooks: Hooks; minW: number; minH: number; snapped?: string;
}
export interface OpenOpts { app: string; title: string; icon: HTMLElement; w?: number; h?: number; x?: number; y?: number; minW?: number; minH?: number; build: (body: HTMLElement, win: Win) => Hooks | void; }

type Zone = [number, number, number, number];
const LAYOUTS: Zone[][] = [
  [[0, 0, .5, 1], [.5, 0, .5, 1]], [[0, 0, .66, 1], [.66, 0, .34, 1]], [[0, 0, .34, 1], [.34, 0, .66, 1]],
  [[0, 0, .5, .5], [.5, 0, .5, .5], [0, .5, .5, .5], [.5, .5, .5, .5]], [[0, 0, .5, 1], [.5, 0, .5, .5], [.5, .5, .5, .5]]
];

export class WM {
  wins: Win[] = []; mru: Win[] = []; active: Win | null = null; private zc = 10; private nid = 1;
  tablet = false; reduced = false; onChange: () => void = () => {}; taskbarRect: (w: Win) => DOMRect | null = () => null;
  private preview: HTMLElement; private snapMenu: HTMLElement | null = null; private snapTimer = 0;
  constructor(public desk: HTMLElement, public layer: HTMLElement) {
    this.preview = h('div', { class: 'snap-prev' }); desk.append(this.preview);
    document.addEventListener('pointerdown', e => { if (this.snapMenu && !(e.target as HTMLElement).closest('.snap-menu')) this.hideSnap(); }, true);
  }
  get size() { return { w: this.desk.offsetWidth, h: this.desk.offsetHeight }; }
  private loc(e: PointerEvent) { const r = this.desk.getBoundingClientRect(); const s = r.width / this.desk.offsetWidth || 1; return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s, s }; }
  private apply(w: Win, anim = false) {
    const s = w.el.style; if (anim && !this.reduced) { w.el.classList.add('anim'); setTimeout(() => w.el.classList.remove('anim'), 230); }
    s.left = w.x + 'px'; s.top = w.y + 'px'; s.width = w.w + 'px'; s.height = w.h + 'px'; w.hooks.onResize?.();
  }

  open(o: OpenOpts): Win {
    const { w: W, h: H } = this.size; const n = this.wins.length;
    const ww = Math.min(o.w || 760, W - 20), hh = Math.min(o.h || 480, H - 20);
    const x = o.x ?? clamp((W > 1000 ? 236 : 40) + (n % 6) * 30 + Math.random() * 16, 0, Math.max(0, W - ww)), y = o.y ?? clamp(24 + (n % 6) * 28, 0, Math.max(0, H - hh));
    const titleEl = h('span', { class: 'tt' }, o.title); const body = h('div', { class: 'wb' });
    const btn = (cls: string, label: string, glyph: string, fn: (e: Event) => void) => h('button', { class: 'cb ' + cls, 'aria-label': label, title: label, onclick: (e: Event) => { e.stopPropagation(); fn(e); } }, glyph);
    let win!: Win;
    const maxBtn = btn('max', 'Maximize', '▢', () => this.toggleMax(win));
    maxBtn.addEventListener('pointerenter', () => { if (!this.tablet) this.snapTimer = window.setTimeout(() => this.showSnap(win, maxBtn), 450); });
    maxBtn.addEventListener('pointerleave', () => clearTimeout(this.snapTimer));
    const tb = h('div', { class: 'tb' }, h('div', { class: 'ti' }, o.icon.cloneNode(true), titleEl), h('div', { class: 'ctl' }, btn('mn', 'Minimize', '—', () => this.minimize(win)), maxBtn, btn('cl', 'Close', '✕', () => this.close(win))));
    const el = h('div', { class: 'win opening', tabindex: '-1', role: 'dialog', 'aria-label': o.title }, tb, body);
    win = { id: this.nid++, app: o.app, title: o.title, icon: o.icon, el, body, titleEl, x, y, w: ww, h: hh, max: false, min: false, hooks: {}, minW: o.minW || 340, minH: o.minH || 220 };
    this.desk.append(el); this.apply(win); this.wins.push(win);
    ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].forEach(d => { const r = h('div', { class: 'rs ' + d }); r.addEventListener('pointerdown', e => this.startResize(e, win, d)); el.append(r); });
    tb.addEventListener('pointerdown', e => this.startDrag(e, win)); tb.addEventListener('dblclick', e => { if (!(e.target as HTMLElement).closest('.cb')) this.toggleMax(win); });
    el.addEventListener('pointerdown', () => this.focus(win), true);
    win.hooks = o.build(body, win) || {};
    if (this.tablet) { win.max = true; win.prev = { x, y, w: ww, h: hh }; this.fit(win); }
    setTimeout(() => el.classList.remove('opening'), 260);
    this.focus(win); this.onChange(); return win;
  }

  private fit(w: Win) { const { w: W, h: H } = this.size; w.x = 0; w.y = 0; w.w = W; w.h = H; w.el.classList.add('max'); this.apply(w); }
  focus(w: Win) {
    if (w.min) { w.min = false; w.el.classList.remove('minimized'); }
    if (this.active && this.active !== w) { this.active.el.classList.remove('active'); this.active.hooks.onBlur?.(); }
    w.el.style.zIndex = String(++this.zc); w.el.classList.add('active'); this.mru = [w, ...this.mru.filter(m => m !== w)];
    if (this.active !== w) { this.active = w; w.hooks.onFocus?.(); } this.onChange();
  }
  minimize(w: Win) {
    const r = this.taskbarRect(w), d = this.desk.getBoundingClientRect(), s = d.width / this.desk.offsetWidth || 1;
    const cx = r ? (r.left + r.width / 2 - d.left) / s : this.size.w / 2, cy = r ? (r.top - d.top) / s : this.size.h + 20;
    w.el.style.setProperty('--tx', (cx - (w.x + w.w / 2)) + 'px'); w.el.style.setProperty('--ty', (cy - (w.y + w.h / 2)) + 'px');
    w.min = true; w.el.classList.add('minimized'); w.el.classList.remove('active'); w.hooks.onBlur?.();
    if (this.active === w) { this.active = null; const next = this.mru.find(m => m !== w && !m.min); if (next) this.focus(next); }
    this.onChange();
  }
  toggleMax(w: Win) {
    if (this.tablet) return;
    if (w.max) { const p = w.prev!; w.max = false; w.snapped = undefined; w.el.classList.remove('max'); Object.assign(w, p); this.apply(w, true); }
    else { w.prev = { x: w.x, y: w.y, w: w.w, h: w.h }; w.max = true; w.el.classList.add('max'); this.fit(w); this.apply(w, true); }
    const mb = w.el.querySelector('.cb.max'); if (mb) mb.textContent = w.max ? '❐' : '▢'; this.hideSnap();
  }
  close(w: Win) {
    w.hooks.onClose?.(); w.el.classList.add('closing'); this.wins = this.wins.filter(x => x !== w); this.mru = this.mru.filter(x => x !== w);
    if (this.active === w) { this.active = null; const n = this.mru.find(m => !m.min); if (n) this.focus(n); }
    setTimeout(() => w.el.remove(), this.reduced ? 0 : 170); this.onChange();
  }
  /** Place a window into a fractional zone of the desktop. */
  snapTo(w: Win, z: Zone, name = 'snap') {
    const { w: W, h: H } = this.size; if (!w.max && !w.snapped) w.prev = { x: w.x, y: w.y, w: w.w, h: w.h };
    w.max = false; w.el.classList.remove('max'); w.snapped = name; w.x = Math.round(z[0] * W); w.y = Math.round(z[1] * H); w.w = Math.round(z[2] * W); w.h = Math.round(z[3] * H); this.apply(w, true); this.focus(w); this.hideSnap();
  }
  private showSnap(w: Win, anchor: HTMLElement) {
    this.hideSnap(); const r = anchor.getBoundingClientRect(), L = this.layer.getBoundingClientRect(), s = L.width / this.layer.offsetWidth || 1;
    const m = h('div', { class: 'snap-menu', style: { left: Math.max(4, (r.left - L.left) / s - 90) + 'px', top: (r.bottom - L.top) / s + 6 + 'px' } });
    LAYOUTS.forEach(lay => { const g = h('div', { class: 'snap-lay' }); lay.forEach(z => g.append(h('button', { class: 'snap-zone', 'aria-label': 'Snap window', style: { left: z[0] * 100 + '%', top: z[1] * 100 + '%', width: z[2] * 100 + '%', height: z[3] * 100 + '%' }, onclick: () => this.snapTo(w, z) }))); m.append(g); });
    this.layer.append(m); this.snapMenu = m;
  }
  hideSnap() { clearTimeout(this.snapTimer); this.snapMenu?.remove(); this.snapMenu = null; }

  private startDrag(e: PointerEvent, w: Win) {
    if (e.button !== 0 || (e.target as HTMLElement).closest('.cb') || this.tablet) return; const tbEl = e.currentTarget as HTMLElement;
    const p0 = this.loc(e); let ox = p0.x - w.x, oy = p0.y - w.y, moved = false; let zone: string | null = null; tbEl.setPointerCapture(e.pointerId);
    const mv = (ev: PointerEvent) => {
      const p = this.loc(ev); if (!moved && Math.hypot(ev.movementX, ev.movementY) < 1 && Math.abs(p.x - p0.x) < 3 && Math.abs(p.y - p0.y) < 3) return; moved = true;
      if (w.max || w.snapped) { const prev = w.prev || { w: 700, h: 440, x: 0, y: 0 }; const fx = (p.x - w.x) / Math.max(1, w.w); w.max = false; w.snapped = undefined; w.el.classList.remove('max'); w.w = prev.w; w.h = prev.h; ox = prev.w * fx; oy = 16; this.apply(w); const mb = w.el.querySelector('.cb.max'); if (mb) mb.textContent = '▢'; }
      const { w: W, h: H } = this.size; w.x = p.x - ox; w.y = clamp(p.y - oy, 0, H - 30); w.el.style.left = w.x + 'px'; w.el.style.top = w.y + 'px';
      zone = p.y < 6 ? 'max' : p.x < 6 ? 'left' : p.x > W - 6 ? 'right' : null;
      const pv = this.preview.style; if (zone) { pv.display = 'block'; const z = zone === 'max' ? [0, 0, 1, 1] : zone === 'left' ? [0, 0, .5, 1] : [.5, 0, .5, 1]; pv.left = z[0] * W + 6 + 'px'; pv.top = z[1] * H + 6 + 'px'; pv.width = z[2] * W - 12 + 'px'; pv.height = z[3] * H - 12 + 'px'; } else pv.display = 'none';
    };
    const up = () => { tbEl.removeEventListener('pointermove', mv); tbEl.removeEventListener('pointerup', up); this.preview.style.display = 'none'; if (moved && zone) { if (zone === 'max') { w.prev = w.prev || { x: w.x, y: w.y, w: w.w, h: w.h }; this.toggleMax(w); } else this.snapTo(w, zone === 'left' ? [0, 0, .5, 1] : [.5, 0, .5, 1], zone); } };
    tbEl.addEventListener('pointermove', mv); tbEl.addEventListener('pointerup', up);
  }
  private startResize(e: PointerEvent, w: Win, dir: string) {
    if (w.max || this.tablet) return; e.preventDefault(); e.stopPropagation(); this.focus(w); const t = e.currentTarget as HTMLElement; t.setPointerCapture(e.pointerId);
    const p0 = this.loc(e), r0 = { x: w.x, y: w.y, w: w.w, h: w.h }; const { w: W, h: H } = this.size;
    const mv = (ev: PointerEvent) => { const p = this.loc(ev), dx = p.x - p0.x, dy = p.y - p0.y; w.snapped = undefined;
      if (dir.includes('e')) w.w = Math.max(w.minW, r0.w + dx); if (dir.includes('s')) w.h = Math.max(w.minH, r0.h + dy);
      if (dir.includes('w')) { const nw = Math.max(w.minW, r0.w - dx); w.x = r0.x + (r0.w - nw); w.w = nw; } if (dir.includes('n')) { const nh = Math.max(w.minH, r0.h - dy); w.y = clamp(r0.y + (r0.h - nh), 0, H); w.h = nh; }
      this.apply(w); };
    const up = () => { t.removeEventListener('pointermove', mv); t.removeEventListener('pointerup', up); }; t.addEventListener('pointermove', mv); t.addEventListener('pointerup', up);
  }
  /** Re-fit maximized windows after the desktop size changes (resize / tablet toggle). */
  refit() { this.wins.forEach(w => { if (w.max) this.fit(w); else { const { w: W, h: H } = this.size; w.x = clamp(w.x, 0, Math.max(0, W - w.w)); w.y = clamp(w.y, 0, Math.max(0, H - 40)); this.apply(w); } }); }
}
