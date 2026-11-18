// The "OS" shell: boot → lock → sign-in → desktop, taskbar, start menu, tray flyouts, toasts, shortcuts.
import { data, AppId } from './data';
import { h, $, $$, clamp, pad, store, tile, sfx, esc } from './util';
import { WM, Win } from './wm';
import qrcode from 'qrcode-generator';
import { Avatar, photoEl, srcset, best } from './img';
import { LockScreenSlideshow } from './ui/slideshow';
import { BlobHero, PhotoGallery } from './ui/blobhero';

export interface Settings { theme: 'dark' | 'light'; accent: string; wall: number; brightness: number; volume: number; muted: boolean; wifi: boolean; bluetooth: boolean; saver: boolean; reduced: boolean; skipIntro: boolean; singleClick: boolean; slideshow: boolean; wallFx: 'duotone' | 'blur' | 'none'; parallax: boolean; grain: boolean; }
export interface OS { openApp(id: AppId, arg?: any): void; notify(title: string, msg: string, emoji?: string): void; S: Settings; apply(): void; wm: WM; lock(): void; restart(): void; classic(): void; bsod(): void; tablet: boolean; root: HTMLElement; closeApp(id: AppId): void; }

export const WALLS = [
  { name: 'Bloom', dark: 'radial-gradient(900px 600px at 20% 20%,#2563eb 0,transparent 60%),radial-gradient(800px 600px at 85% 30%,#7c3aed 0,transparent 55%),radial-gradient(900px 600px at 55% 100%,#0ea5e9 0,transparent 55%),#070b1f', light: 'radial-gradient(900px 600px at 20% 20%,#93c5fd 0,transparent 60%),radial-gradient(800px 600px at 85% 30%,#c4b5fd 0,transparent 55%),radial-gradient(900px 600px at 55% 100%,#7dd3fc 0,transparent 55%),#e8eefc' },
  { name: 'Sunrise', dark: 'radial-gradient(800px 600px at 80% 80%,#f97316 0,transparent 55%),radial-gradient(800px 500px at 15% 25%,#db2777 0,transparent 55%),#1a0b1f', light: 'radial-gradient(800px 600px at 80% 80%,#fdba74 0,transparent 55%),radial-gradient(800px 500px at 15% 25%,#f9a8d4 0,transparent 55%),#fff1e8' },
  { name: 'Aurora', dark: 'radial-gradient(900px 500px at 25% 70%,#10b981 0,transparent 55%),radial-gradient(800px 500px at 80% 20%,#06b6d4 0,transparent 55%),#03121a', light: 'radial-gradient(900px 500px at 25% 70%,#6ee7b7 0,transparent 55%),radial-gradient(800px 500px at 80% 20%,#67e8f9 0,transparent 55%),#ecfdf5' },
  { name: 'Midnight', dark: 'radial-gradient(700px 500px at 50% 0,#4338ca 0,transparent 60%),linear-gradient(#05060f,#0b0d24)', light: 'radial-gradient(700px 500px at 50% 0,#a5b4fc 0,transparent 60%),linear-gradient(#eef0ff,#dfe3ff)' }
];
export const ACCENTS = ['#0067C0', '#7c3aed', '#db2777', '#e11d48', '#ea580c', '#16a34a', '#0d9488', '#4f46e5'];

interface AppDef { title: string; emoji: string; c1: string; c2: string; w: number; h: number; single?: boolean; pin?: boolean; load: () => Promise<any>; }
export const APPS: Record<AppId, AppDef> = {
  welcome: { title: 'Start Here', emoji: '🏠', c1: '#38bdf8', c2: '#2563eb', w: 780, h: 590, single: true, pin: true, load: () => import('./apps/welcome') },
  projects: { title: 'Projects', emoji: '💼', c1: '#60a5fa', c2: '#1d4ed8', w: 900, h: 560, single: true, pin: true, load: () => import('./apps/projects') },
  skills: { title: 'Skills', emoji: '🛠️', c1: '#34d399', c2: '#047857', w: 820, h: 540, single: true, pin: true, load: () => import('./apps/skills') },
  journey: { title: 'Journey', emoji: '🎓', c1: '#a78bfa', c2: '#6d28d9', w: 760, h: 560, single: true, pin: true, load: () => import('./apps/journey') },
  spotify: { title: 'Spotify', emoji: '🎧', c1: '#1ed760', c2: '#0b6b30', w: 440, h: 470, single: true, pin: true, load: () => import('./apps/spotify') },
  explorer: { title: 'File Explorer', emoji: '📁', c1: '#fbbf24', c2: '#d97706', w: 860, h: 500, pin: true, load: () => import('./apps/explorer') },
  browser: { title: 'Edge Browser', emoji: '🌐', c1: '#38bdf8', c2: '#0f766e', w: 900, h: 520, single: true, pin: true, load: () => import('./apps/browser') },
  terminal: { title: 'Terminal', emoji: '⌨️', c1: '#374151', c2: '#111827', w: 860, h: 480, pin: true, load: () => import('./apps/terminal') },
  mail: { title: 'Mail', emoji: '✉️', c1: '#60a5fa', c2: '#2563eb', w: 700, h: 520, single: true, pin: true, load: () => import('./apps/mail') },
  settings: { title: 'Settings', emoji: '⚙️', c1: '#94a3b8', c2: '#475569', w: 860, h: 520, single: true, pin: true, load: () => import('./apps/settings') },
  taskmgr: { title: 'Task Manager', emoji: '📊', c1: '#34d399', c2: '#047857', w: 780, h: 500, single: true, pin: true, load: () => import('./apps/taskmgr') },
  photos: { title: 'Photos', emoji: '🖼️', c1: '#f472b6', c2: '#7c3aed', w: 920, h: 580, single: true, pin: true, load: () => import('./apps/photos') },
  notepad: { title: 'Notepad', emoji: '📝', c1: '#7dd3fc', c2: '#0369a1', w: 620, h: 440, load: () => import('./apps/notepad') },
  calc: { title: 'Calculator', emoji: '🧮', c1: '#a3a3a3', c2: '#404040', w: 330, h: 470, single: true, load: () => import('./apps/calc') },
  snake: { title: 'Snake', emoji: '🐍', c1: '#4ade80', c2: '#15803d', w: 520, h: 500, single: true, load: () => import('./apps/snake') },
  invaders: { title: 'Quant Invaders', emoji: '👾', c1: '#a855f7', c2: '#be185d', w: 940, h: 560, single: true, load: () => import('./apps/invaders') },
  ailab: { title: 'AI Lab', emoji: '🧪', c1: '#22d3ee', c2: '#6366f1', w: 860, h: 520, single: true, load: () => import('./apps/ailab') },
  about: { title: 'About Me', emoji: '🙋', c1: '#fb923c', c2: '#db2777', w: 860, h: 500, single: true, pin: true, load: () => import('./apps/about') },
  resume: { title: 'Resume.pdf', emoji: '📄', c1: '#f87171', c2: '#b91c1c', w: 720, h: 540, single: true, load: () => import('./apps/resume') }
};
const PINNED: AppId[] = ['spotify', 'welcome', 'projects', 'skills', 'journey', 'photos', 'explorer', 'terminal', 'mail', 'settings'];
const SVG = (p: string, fill = 'none') => `<svg viewBox="0 0 24 24" width="18" height="18" fill="${fill}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const IC = {
  wifi: SVG('<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/>'), nowifi: SVG('<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M3 3l18 18"/>'),
  vol: SVG('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/>'), mute: SVG('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/>'),
  bat: SVG('<rect x="2" y="7" width="17" height="10" rx="2"/><path d="M21 10v4"/><rect x="4" y="9" width="9" height="6" fill="currentColor" stroke="none"/>'), bell: SVG('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2zM10 21h4"/>'),
  search: SVG('<circle cx="11" cy="11" r="6"/><path d="M16 16l5 5"/>'), tv: SVG('<rect x="3" y="5" width="14" height="10" rx="2"/><path d="M7 19h14V9"/>'),
  start: `<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="7" cy="7" r="4.2" fill="var(--accent)"/><circle cx="17" cy="7" r="4.2" fill="#a78bfa" opacity=".9"/><circle cx="7" cy="17" r="4.2" fill="#38bdf8" opacity=".9"/><circle cx="17" cy="17" r="4.2" fill="#f0abfc" opacity=".85"/></svg>`,
  power: SVG('<path d="M12 3v9M6.5 6.5a8 8 0 1 0 11 0"/>')
};
const LOGO = `<svg viewBox="0 0 96 96" width="96" height="96"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#60a5fa"/><stop offset="1" stop-color="#a78bfa"/></linearGradient></defs><circle cx="30" cy="30" r="24" fill="url(#lg)"/><circle cx="66" cy="30" r="24" fill="#a78bfa" opacity=".85"/><circle cx="30" cy="66" r="24" fill="#38bdf8" opacity=".85"/><circle cx="66" cy="66" r="24" fill="#f0abfc" opacity=".8"/></svg>`;

export function createOS(host: HTMLElement, flat: boolean): OS & { show(): void; hide(): void; handleEscape(): boolean; visible: boolean } {
  // ---------- settings ----------
  const S: Settings = Object.assign({ theme: 'dark' as const, accent: '#0067C0', wall: 0, brightness: 100, volume: 70, muted: false, wifi: true, bluetooth: true, saver: false, reduced: false, skipIntro: false, singleClick: true, slideshow: false, wallFx: 'none' as const, parallax: true, grain: false }, store.get('settings', {}));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches && store.get('settings', null as any) == null) S.reduced = true;
  S.skipIntro = store.get('skipIntro', S.skipIntro);
  if (!store.get('fxReset', false)) { S.wallFx = 'none' as any; S.grain = false; store.set('fxReset', true); }

  // ---------- DOM skeleton ----------
  const root = h('div', { class: 'os', id: 'os' });
  const wallBg = h('div', { class: 'wall-bg' }), wall = h('div', { class: 'wall' }, wallBg), desk = h('div', { class: 'desk' }), icons = h('div', { class: 'icons' }), wins = desk, layer = h('div', { class: 'layer' });
  const taskbar = h('div', { class: 'taskbar', role: 'toolbar', 'aria-label': 'Taskbar' }), launcher = h('div', { class: 'launcher' }), navbar = h('div', { class: 'navbar' });
  const boot = h('div', { class: 'bootl' }), bsodEl = h('div', { class: 'bsod' });
  desk.append(icons); root.append(wall, desk, launcher, taskbar, navbar, layer, boot, bsodEl); host.append(root);
  const wm = new WM(desk, layer); let tablet = flat;
  const os: any = { S, wm, root, get tablet() { return tablet; } };

  // ---------- apply settings ----------
  function apply() {
    root.dataset.theme = S.theme; root.style.setProperty('--accent', S.accent); root.classList.toggle('reduced', S.reduced); wm.reduced = S.reduced;
    wallBg.style.background = WALLS[S.wall % WALLS.length][S.theme]; wall.className = 'wall fx-' + S.wallFx; root.classList.toggle('grain', S.grain); document.body.classList.toggle('grain', S.grain); syncWallSS(); desk.style.filter = launcher.style.filter = taskbar.style.filter = `brightness(${S.brightness / 100})`;
    sfx.setVolume(S.muted ? 0 : S.volume / 100); store.set('settings', S); renderTray();
  }
  os.apply = apply;
  // ---- photo wallpaper (slideshow) + parallax ----
  let wallSS: ReturnType<typeof LockScreenSlideshow> | null = null;
  function syncWallSS() {
    const want = S.slideshow && data.photos.length > 0;
    if (want && !wallSS) { wallSS = LockScreenSlideshow({ cls: 'ss-wall', kb: 20, fade: 1.6, reduced: () => S.reduced }); wallBg.append(wallSS.el); wallSS.start(); }
    else if (!want && wallSS) { wallSS.stop(); wallSS.el.remove(); wallSS = null; }
  }
  // parallax: the wallpaper drifts a few px opposite the pointer (or device tilt on mobile). transform only, eased in rAF.
  let pxT = [0, 0], pxC = [0, 0], pxRaf = 0;
  const pxLoop = () => { pxC[0] += (pxT[0] - pxC[0]) * 0.08; pxC[1] += (pxT[1] - pxC[1]) * 0.08; wallBg.style.transform = `translate3d(${pxC[0].toFixed(2)}px,${pxC[1].toFixed(2)}px,0)`; pxRaf = (Math.abs(pxT[0] - pxC[0]) > 0.05 || Math.abs(pxT[1] - pxC[1]) > 0.05) ? requestAnimationFrame(pxLoop) : 0; };
  const pxSet = (nx: number, ny: number) => { if (!S.parallax || S.reduced) { pxT = [0, 0]; } else pxT = [-nx * 18, -ny * 12]; if (!pxRaf) pxRaf = requestAnimationFrame(pxLoop); };
  root.addEventListener('pointermove', e => { const r = root.getBoundingClientRect(); pxSet((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5); });
  window.addEventListener('deviceorientation', e => { if (e.gamma == null || e.beta == null) return; pxSet(clamp(e.gamma / 40, -0.5, 0.5), clamp((e.beta - 45) / 60, -0.5, 0.5)); });
  root.addEventListener('touchstart', () => { const D = (window as any).DeviceOrientationEvent; if (D && typeof D.requestPermission === 'function') D.requestPermission().catch(() => { }); }, { once: true });

  // ---------- toasts & notifications ----------
  const toasts = h('div', { class: 'toasts' }); layer.append(toasts); const history: { t: string; m: string; e: string; time: Date }[] = [];
  function notify(title: string, msg: string, emoji = '🔔') {
    history.unshift({ t: title, m: msg, e: emoji, time: new Date() }); sfx.notify(); renderBell();
    const t = h('div', { class: 'toast', role: 'status' }, h('div', { class: 'te' }, emoji), h('div', { class: 'tx' }, h('b', {}, title), h('span', {}, msg)), h('button', { class: 'tc', 'aria-label': 'Dismiss', onclick: () => gone() }, '✕'));
    const gone = () => { t.classList.add('out'); setTimeout(() => t.remove(), 220); }; toasts.append(t); setTimeout(gone, 6500);
  }
  os.notify = notify;

  // ---------- context menu ----------
  interface MI { label?: string; icon?: string; sep?: boolean; action?: () => void; sub?: MI[]; disabled?: boolean; }
  let menuEl: HTMLElement | null = null;
  const closeMenu = () => { menuEl?.remove(); menuEl = null; };
  function loc(e: MouseEvent) { const r = root.getBoundingClientRect(); const s = r.width / root.offsetWidth || 1; return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s }; }
  function buildMenu(items: MI[]): HTMLElement {
    const m = h('div', { class: 'menu', role: 'menu' });
    items.forEach(it => {
      if (it.sep) { m.append(h('div', { class: 'msep' })); return; }
      const row = h('div', { class: 'mi' + (it.disabled ? ' dis' : ''), role: 'menuitem', tabindex: '0', onclick: (e: Event) => { if (it.sub || it.disabled) return; e.stopPropagation(); closeMenu(); it.action?.(); } }, h('span', { class: 'mic' }, it.icon || ''), h('span', { class: 'ml' }, it.label || ''), it.sub ? h('span', { class: 'ma' }, '›') : '');
      if (it.sub) { const sub = buildMenu(it.sub); sub.classList.add('sub'); row.append(sub); }
      m.append(row);
    }); return m;
  }
  function showMenu(x: number, y: number, items: MI[]) {
    closeMenu(); const m = buildMenu(items); layer.append(m); menuEl = m; const W = root.offsetWidth, H = root.offsetHeight;
    m.style.left = clamp(x, 4, W - m.offsetWidth - 4) + 'px'; m.style.top = clamp(y, 4, H - m.offsetHeight - 52) + 'px';
  }

  // ---------- app launching ----------
  const apps = new Map<AppId, Promise<any>>();
  function openApp(id: AppId, arg?: any) {
    const def = APPS[id]; closeFlyouts(); if (!def) return;
    if (def.single) { const ex = wm.wins.find(w => w.app === id); if (ex) { wm.focus(ex); (ex as any).hooks.onArg?.(arg); return; } }
    if (!apps.has(id)) apps.set(id, def.load()); sfx.click();
    apps.get(id)!.then(mod => { const w = wm.open({ app: id, title: def.title, icon: tile(def.emoji, def.c1, def.c2, 18), w: ['invaders', 'snake', 'calc'].includes(id) ? def.w : Math.round(def.w * 1.15), h: ['invaders', 'snake', 'calc'].includes(id) ? def.h : Math.round(def.h * 1.14), x: arg?.x, y: arg?.y, build: (body, win) => mod.build(body, win, os, arg) }); void w; }).catch(err => notify('App failed to start', String(err), '⚠️'));
  }
  os.openApp = openApp; os.closeApp = (id: AppId) => wm.wins.filter(w => w.app === id).forEach(w => wm.close(w));

  // ---------- left menu (animated sidebar; every item opens inside a window) ----------
  const MENU: { id: AppId; label: string; emoji: string; c1: string; c2: string }[] = [
    { id: 'welcome', label: 'Home', emoji: '🏠', c1: '#38bdf8', c2: '#2563eb' }, { id: 'about', label: 'About', emoji: '🙋', c1: '#fb923c', c2: '#db2777' },
    { id: 'skills', label: 'Skills', emoji: '🛠️', c1: '#34d399', c2: '#047857' }, { id: 'projects', label: 'Projects', emoji: '💼', c1: '#60a5fa', c2: '#1d4ed8' },
    { id: 'journey', label: 'Journey', emoji: '🎓', c1: '#a78bfa', c2: '#6d28d9' }, { id: 'photos', label: 'Photos', emoji: '🖼️', c1: '#f472b6', c2: '#7c3aed' },
    { id: 'resume', label: 'Resume', emoji: '📄', c1: '#f87171', c2: '#b91c1c' }, { id: 'mail', label: 'Contact', emoji: '✉️', c1: '#60a5fa', c2: '#2563eb' },
    { id: 'terminal', label: 'Terminal', emoji: '⌨️', c1: '#4b5563', c2: '#111827' }, { id: 'invaders', label: 'Play a game', emoji: '🎮', c1: '#a855f7', c2: '#be185d' }
  ];
  const sideBtns = new Map<AppId, HTMLElement>();
  function renderIcons() {
    icons.innerHTML = ''; sideBtns.clear();
    const list = h('div', { class: 'sd-list' }, MENU.map((m, i) => { const b = h('button', { class: 'sd-i', style: { '--i': String(i) }, 'aria-label': m.label, onclick: () => { sfx.click(); const ex = wm.wins.find(w => w.app === m.id); if (ex && !ex.min && wm.active === ex) return wm.focus(ex); openApp(m.id); } }, tile(m.emoji, m.c1, m.c2, 28), h('span', {}, m.label), h('i', { class: 'sd-dot' })); sideBtns.set(m.id, b); return b; }));
    const np = h('button', { class: 'sd-np', style: { '--i': String(MENU.length) }, 'aria-label': 'Open Spotify: SEM DEMORA', onclick: () => openApp('spotify') }, h('span', { html: SPOTIFY_LOGO_S }), h('div', {}, h('b', {}, 'SEM DEMORA'), h('small', {}, 'Spotify · tap to play')), h('div', { class: 'sd-eq' }, h('i'), h('i'), h('i'), h('i')));
    icons.append(h('aside', { class: 'sd', 'aria-label': 'Portfolio menu' }, h('div', { class: 'sd-me', style: { '--i': '0' } }, Avatar(38), h('div', {}, h('b', {}, data.name), h('small', {}, data.role))), list, np)); syncSide();
  }
  const SPOTIFY_LOGO_S = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1ed760"/><path d="M5.6 9.2c4.2-1.2 9-.9 12.8 1.3M6.3 12.5c3.5-1 7.5-.7 10.6 1.1M7 15.6c2.8-.8 5.8-.5 8.3.9" stroke="#000" stroke-width="1.7" stroke-linecap="round" fill="none"/></svg>';
  function syncSide() { sideBtns.forEach((b, id) => { const ws = wm.wins.filter(w => w.app === id); b.classList.toggle('run', ws.length > 0); b.classList.toggle('act', ws.some(w => w === wm.active && !w.min)); }); }
  desk.addEventListener('contextmenu', e => {
    if ((e.target as HTMLElement).closest('.win')) return; e.preventDefault(); const p = loc(e); sfx.click();
    showMenu(p.x, p.y, [
      { label: 'Refresh', icon: '⟳', action: () => { icons.style.opacity = '0'; setTimeout(() => icons.style.opacity = '1', 160); } },
      { sep: true }, { label: 'New', icon: '＋', sub: [{ label: 'Folder', icon: '📁', action: () => newItem('New folder', '📁', '#fbbf24', '#d97706') }, { label: 'Text Document', icon: '📝', action: () => newItem('New Text Document.txt', '📝', '#7dd3fc', '#0369a1') }] },
      { label: 'Change wallpaper', icon: '🖼️', action: () => { S.wall = (S.wall + 1) % WALLS.length; apply(); } },
      { label: 'Display settings', icon: '🖥️', action: () => openApp('settings', { page: 'display' }) },
      { sep: true }, { label: 'Open Terminal here', icon: '⌨️', action: () => openApp('terminal', { cwd: 'C:\\Users\\Guest\\Desktop' }) }, { label: 'Classic view', icon: '📃', action: () => classic() }
    ]);
  });
  function newItem(label: string, emoji: string, _c1: string, _c2: string) { notify(label, 'Created! (This is a demo, so it is not saved.)', emoji); }

  // ---------- taskbar ----------
  const clockEl = h('button', { class: 'tray-btn clock', 'aria-label': 'Date and time' }); const trayIcons = h('button', { class: 'tray-btn tray-ic', 'aria-label': 'Quick settings' }); const bellBtn = h('button', { class: 'tray-btn', 'aria-label': 'Notifications' });
  const appBtns = h('div', { class: 'tbapps' }); const preview = h('div', { class: 'tbprev' }); layer.append(preview); let prevTimer = 0;
  const btnFor = new Map<string, HTMLElement>();
  function tbButton(app: AppId) {
    const def = APPS[app]; const b = h('button', { class: 'tbb', 'aria-label': def.title, title: def.title }, tile(def.emoji, def.c1, def.c2, 26), h('i', { class: 'dot' })); btnFor.set(app, b);
    b.addEventListener('click', () => { hidePrev(); const ws = wm.wins.filter(w => w.app === app); if (!ws.length) return openApp(app);
      if (ws.length === 1) { const w = ws[0]; if (w.min) wm.focus(w); else if (wm.active === w) wm.minimize(w); else wm.focus(w); } else { const i = ws.indexOf(wm.active as Win); wm.focus(ws[(i + 1) % ws.length]); } });
    b.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); const p = loc(e); const ws = wm.wins.filter(w => w.app === app); showMenu(p.x - 50, p.y - 90, [{ label: def.title, icon: def.emoji, action: () => openApp(app) }, ...(ws.length ? [{ label: 'Close window', icon: '✕', action: () => ws.forEach(w => wm.close(w)) }] : [])]); });
    b.addEventListener('pointerenter', () => { clearTimeout(prevTimer); prevTimer = window.setTimeout(() => showPrev(app, b), 380); }); b.addEventListener('pointerleave', () => { clearTimeout(prevTimer); prevTimer = window.setTimeout(hidePrev, 200); });
    return b;
  }
  function showPrev(app: AppId, b: HTMLElement) {
    const ws = wm.wins.filter(w => w.app === app); if (!ws.length) return hidePrev(); preview.innerHTML = '';
    ws.forEach(w => preview.append(h('div', { class: 'pv', onclick: () => { wm.focus(w); hidePrev(); } }, h('div', { class: 'pvh' }, w.icon.cloneNode(true), h('span', {}, w.title), h('button', { 'aria-label': 'Close', onclick: (e: Event) => { e.stopPropagation(); wm.close(w); hidePrev(); } }, '✕')), h('div', { class: 'pvb' }, h('div', { class: 'pvt' }), h('div', { class: 'pvl' }), h('div', { class: 'pvl s' })))));
    const r = b.getBoundingClientRect(), L = root.getBoundingClientRect(), s = L.width / root.offsetWidth || 1; preview.style.display = 'flex'; preview.style.left = clamp((r.left + r.width / 2 - L.left) / s - preview.offsetWidth / 2, 6, root.offsetWidth - preview.offsetWidth - 6) + 'px'; preview.style.bottom = '58px';
  }
  const hidePrev = () => { preview.style.display = 'none'; }; preview.addEventListener('pointerenter', () => clearTimeout(prevTimer)); preview.addEventListener('pointerleave', hidePrev);
  const startBtn = h('button', { class: 'tbb startb', 'aria-label': 'Start', html: IC.start, onclick: (e: Event) => { e.stopPropagation(); toggleFly('start'); } });
  const searchBtn = h('button', { class: 'tbb', 'aria-label': 'Search', html: IC.search, onclick: (e: Event) => { e.stopPropagation(); toggleFly('start', true); } });
  const tvBtn = h('button', { class: 'tbb', 'aria-label': 'Task view', html: IC.tv, onclick: (e: Event) => { e.stopPropagation(); taskView(); } });
  const showDesk = h('button', { class: 'showdesk', 'aria-label': 'Show desktop', onclick: () => { const any = wm.wins.some(w => !w.min); wm.wins.forEach(w => any ? (!w.min && wm.minimize(w)) : wm.focus(w)); } });
  taskbar.append(h('div', { class: 'tbc' }, startBtn, searchBtn, tvBtn, h('i', { class: 'tbsep' }), appBtns), h('div', { class: 'tray' }, trayIcons, clockEl, bellBtn, showDesk));
  PINNED.forEach(a => appBtns.append(tbButton(a)));
  wm.taskbarRect = w => (btnFor.get(w.app) || startBtn).getBoundingClientRect();
  function syncTaskbar() {
    const running = new Set(wm.wins.map(w => w.app as AppId));
    running.forEach(a => { if (!btnFor.has(a)) appBtns.append(tbButton(a)); });
    btnFor.forEach((b, a) => { const ws = wm.wins.filter(w => w.app === a); b.classList.toggle('run', ws.length > 0); b.classList.toggle('act', ws.some(w => w === wm.active && !w.min)); if (!ws.length && !PINNED.includes(a as AppId)) { b.remove(); btnFor.delete(a); } });
    syncSide();
    launcher.classList.toggle('on', tablet && !wm.wins.some(w => !w.min) && !booting);
  }
  wm.onChange = syncTaskbar;
  function renderTray() { trayIcons.innerHTML = `${S.wifi ? IC.wifi : IC.nowifi}${S.muted || S.volume === 0 ? IC.mute : IC.vol}${IC.bat}`; }
  function renderBell() { bellBtn.innerHTML = IC.bell + (history.length ? '<i class="bdot"></i>' : ''); }
  setInterval(() => { const d = new Date(); clockEl.innerHTML = `<span>${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span><span>${d.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' })}</span>`; lockClock?.(); }, 1000);

  // ---------- flyouts: start / quick settings / calendar / notifications ----------
  let fly: HTMLElement | null = null, flyName = '';
  function closeFlyouts() { fly?.remove(); fly = null; flyName = ''; closeMenu(); startBtn.classList.remove('on'); }
  function toggleFly(name: string, focusSearch = false) { if (flyName === name && !focusSearch) { closeFlyouts(); return; } closeFlyouts(); flyName = name; sfx.click();
    fly = name === 'start' ? startMenu(focusSearch) : name === 'quick' ? quickSettings() : name === 'cal' ? calendar() : notifCenter(); layer.append(fly); fly.classList.add('flyin'); if (name === 'start') startBtn.classList.add('on'); if (focusSearch) (fly.querySelector('input') as HTMLElement)?.focus(); }
  trayIcons.addEventListener('click', e => { e.stopPropagation(); toggleFly('quick'); }); clockEl.addEventListener('click', e => { e.stopPropagation(); toggleFly('cal'); }); bellBtn.addEventListener('click', e => { e.stopPropagation(); toggleFly('notif'); });
  document.addEventListener('pointerdown', e => { const t = e.target as HTMLElement; if (fly && !t.closest('.flyout') && !t.closest('.taskbar') && !t.closest('.menu')) closeFlyouts(); else if (menuEl && !t.closest('.menu')) closeMenu(); }, true);

  function startMenu(focus: boolean): HTMLElement {
    const list = h('div', { class: 'sm-body' }); const input = h('input', { class: 'sm-search', placeholder: 'Search for apps, projects, and files', 'aria-label': 'Search', type: 'search' }) as HTMLInputElement;
    const appCell = (id: AppId) => { const d = APPS[id]; return h('button', { class: 'sm-app', onclick: () => openApp(id) }, tile(d.emoji, d.c1, d.c2, 34), h('span', {}, d.title)); };
    function render(q = '') {
      list.innerHTML = ''; q = q.trim().toLowerCase();
      if (q) { const a = (Object.keys(APPS) as AppId[]).filter(id => APPS[id].title.toLowerCase().includes(q)); const p = data.projects.filter(x => (x.title + x.stack.join(' ')).toLowerCase().includes(q));
        list.append(h('h5', {}, 'Best match'), ...a.map(id => h('button', { class: 'sm-row', onclick: () => openApp(id) }, tile(APPS[id].emoji, APPS[id].c1, APPS[id].c2, 28), h('span', {}, APPS[id].title), h('em', {}, 'App'))), ...p.map(x => h('button', { class: 'sm-row', onclick: () => openApp('projects', { slug: x.slug }) }, tile('📁', '#fbbf24', '#d97706', 28), h('span', {}, x.title), h('em', {}, 'Project'))));
        if (!a.length && !p.length) list.append(h('p', { class: 'sm-none' }, `No results for "${q}"`)); return; }
      list.append(h('div', { class: 'sm-h' }, h('h5', {}, 'Pinned')), h('div', { class: 'sm-grid' }, (Object.keys(APPS) as AppId[]).map(appCell)), h('div', { class: 'sm-h' }, h('h5', {}, 'Recommended')),
        h('div', { class: 'sm-rec' }, data.projects.slice(0, 4).map(x => h('button', { class: 'sm-row', onclick: () => openApp('explorer', { path: 'C:\\Users\\Guest\\Projects\\' + x.slug }) }, tile('📁', '#fbbf24', '#d97706', 28), h('span', {}, x.title), h('em', {}, 'Recently updated')))));
    }
    input.addEventListener('input', () => render(input.value)); render(); if (focus) setTimeout(() => input.focus(), 30);
    const powerMenu = (e: Event) => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(), L = root.getBoundingClientRect(), s = L.width / root.offsetWidth || 1; showMenu((r.left - L.left) / s - 60, (r.top - L.top) / s - 150, [{ label: 'Lock', icon: '🔒', action: () => lock() }, { label: 'Sign out', icon: '🚪', action: () => signOut() }, { label: 'Restart', icon: '🔄', action: () => restart() }, { label: 'Classic view', icon: '📃', action: () => classic() }]); };
    return h('div', { class: 'flyout startmenu', role: 'dialog', 'aria-label': 'Start' }, h('div', { class: 'sm-head' }, h('button', { class: 'sm-user', 'aria-label': 'About me', onclick: () => { closeFlyouts(); openApp('about'); } }, Avatar(40, { glow: true }), h('span', {}, h('b', {}, data.name), h('small', {}, data.role))), h('button', { class: 'sm-pw', 'aria-label': 'Power', html: IC.power, onclick: powerMenu })), input, list);
  }
  function quickSettings(): HTMLElement {
    const tg = (label: string, icon: string, key: keyof Settings, extra?: () => void) => {
      const isOn = () => key === 'theme' ? S.theme === 'dark' : !!S[key];
      const b = h('button', { class: 'qs-t' + (isOn() ? ' on' : ''), 'aria-pressed': String(isOn()) }, h('span', {}, icon), h('b', {}, label));
      b.addEventListener('click', () => {
        if (key === 'theme') S.theme = S.theme === 'dark' ? 'light' : 'dark'; else (S as any)[key] = !S[key];
        if (key === 'saver') { S.brightness = S.saver ? 60 : 100; (br as HTMLInputElement).value = String(S.brightness); }
        extra?.(); apply(); b.classList.toggle('on', isOn()); b.setAttribute('aria-pressed', String(isOn())); sfx.click();
      }); return b;
    };
    const sl = (label: string, icon: string, val: number, min: number, fn: (v: number) => void) => { const i = h('input', { type: 'range', min, max: 100, value: val, 'aria-label': label }) as HTMLInputElement; i.addEventListener('input', () => fn(+i.value)); return [h('div', { class: 'qs-s' }, h('span', {}, icon), i), i] as const; };
    const [volRow] = sl('Volume', '🔊', S.volume, 0, v => { S.volume = v; S.muted = v === 0; apply(); }); const [brRow, br] = sl('Brightness', '☀️', S.brightness, 20, v => { S.brightness = v; apply(); });
    return h('div', { class: 'flyout quick', role: 'dialog', 'aria-label': 'Quick settings' }, h('div', { class: 'qs-grid' }, tg('Wi-Fi', '📶', 'wifi'), tg('Bluetooth', '🔷', 'bluetooth'), tg('Battery saver', '🔋', 'saver'), tg('Dark mode', '🌙', 'theme'), tg('Sound off', '🔇', 'muted'), tg('Reduce motion', '🎞️', 'reduced')), volRow, brRow, h('div', { class: 'qs-f' }, h('span', {}, '🔋 ' + battery + '%'), h('button', { onclick: () => { closeFlyouts(); openApp('settings'); } }, '⚙️ Settings')));
  }
  let battery = 87; setInterval(() => { battery = S.saver ? battery : Math.max(5, battery - (Math.random() < 0.15 ? 1 : 0)); }, 20000);
  function calendar(): HTMLElement {
    let ref = new Date(); const wrap = h('div', { class: 'flyout cal', role: 'dialog', 'aria-label': 'Calendar' }); const today = new Date();
    const draw = () => { wrap.innerHTML = ''; const y = ref.getFullYear(), m = ref.getMonth(); const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
      wrap.append(h('div', { class: 'cal-t' }, h('b', {}, today.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })), h('span', {}, today.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }))), h('div', { class: 'cal-n' }, h('b', {}, ref.toLocaleDateString([], { month: 'long', year: 'numeric' })), h('span', {}, h('button', { 'aria-label': 'Previous month', onclick: () => { ref = new Date(y, m - 1, 1); draw(); } }, '▲'), h('button', { 'aria-label': 'Next month', onclick: () => { ref = new Date(y, m + 1, 1); draw(); } }, '▼'))));
      const g = h('div', { class: 'cal-g' }); ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(d => g.append(h('i', { class: 'hd' }, d))); for (let i = 0; i < first; i++) g.append(h('i', {})); for (let d = 1; d <= days; d++) g.append(h('i', { class: (d === today.getDate() && m === today.getMonth() && y === today.getFullYear()) ? 'today' : '' }, String(d))); wrap.append(g); };
    draw(); return wrap;
  }
  function notifCenter(): HTMLElement {
    return h('div', { class: 'flyout notif', role: 'dialog', 'aria-label': 'Notifications' }, h('div', { class: 'nf-h' }, h('b', {}, 'Notifications'), h('button', { onclick: () => { history.length = 0; renderBell(); closeFlyouts(); } }, 'Clear all')),
      history.length ? history.map(n => h('div', { class: 'nf' }, h('span', {}, n.e), h('div', {}, h('b', {}, n.t), h('p', {}, n.m), h('small', {}, n.time.toLocaleTimeString()))))
        : h('p', { class: 'nf-none' }, 'No new notifications'));
  }

  // ---------- task view & alt-tab ----------
  function taskView() {
    closeFlyouts(); sfx.click(); const ov = h('div', { class: 'tv', onclick: () => ov.remove() }); const live = wm.wins; if (!live.length) ov.append(h('p', {}, 'No open windows. Open an app to see it here.'));
    live.forEach(w => ov.append(h('div', { class: 'tvc', tabindex: '0', onclick: (e: Event) => { e.stopPropagation(); ov.remove(); wm.focus(w); } }, h('div', { class: 'tvh' }, w.icon.cloneNode(true), h('span', {}, w.title)), h('div', { class: 'tvb' }, h('div', { class: 'pvt' }), h('div', { class: 'pvl' }), h('div', { class: 'pvl s' })))));
    layer.append(ov);
  }
  let alt: HTMLElement | null = null, altIdx = 0;
  function altTab(dir = 1) {
    const list = wm.mru.length ? wm.mru : []; if (list.length < 1) return; if (!alt) { alt = h('div', { class: 'alttab' }); layer.append(alt); altIdx = 0; }
    altIdx = (altIdx + dir + list.length) % list.length; alt.innerHTML = ''; list.forEach((w, i) => alt!.append(h('div', { class: 'at' + (i === altIdx ? ' on' : '') }, w.icon.cloneNode(true), h('span', {}, w.title))));
  }
  function altCommit() { if (!alt) return; const w = wm.mru[altIdx]; alt.remove(); alt = null; if (w) wm.focus(w); }

  // ---------- lock / sign-in / boot ----------
  let booting = false, lockClock: (() => void) | null = null;
  const timeStr = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/ ?[AP]M/i, ''); const dateStr = () => new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  function skipBtn() { return h('button', { class: 'skip', onclick: (e: Event) => { e.stopPropagation(); store.set('skipIntro', true); S.skipIntro = true; unlock(true); } }, 'Skip intro'); }
  let bootSS: ReturnType<typeof LockScreenSlideshow> | null = null; const stopSS = () => { bootSS?.stop(); bootSS = null; };
  function bootAnim(next: () => void) {
    stopSS(); booting = true; boot.className = 'bootl on'; boot.innerHTML = ''; boot.style.background = '#000';
    boot.append(h('div', { class: 'bootc', html: LOGO }), h('div', { class: 'spin' }, [0, 1, 2, 3, 4].map(i => h('i', { style: { animationDelay: i * 0.15 + 's' } }))), skipBtn());
    const t = setTimeout(() => { if (booting) next(); }, S.reduced ? 800 : 2600); (boot as any)._t = t;
  }
  function lockScreen() {
    stopSS(); boot.className = 'bootl on lockscr'; boot.style.background = ''; boot.innerHTML = ''; bootSS = LockScreenSlideshow({ cls: 'ss-lock', reduced: () => S.reduced, kb: 12, fade: 1.2 }); const bg = bootSS.el; if (!data.photos.length) { bg.className = 'lbg'; bg.style.background = WALLS[S.wall][S.theme]; } else bootSS.start();
    const clk = h('div', { class: 'lclk' }), dte = h('div', { class: 'ldate' }); lockClock = () => { clk.textContent = timeStr(); dte.textContent = dateStr(); }; lockClock();
    boot.append(bg, h('div', { class: 'lmain', onclick: () => signIn() }, clk, dte, h('div', { class: 'lavatar' }, Avatar(120, { glow: true, breathe: true }), h('b', {}, data.name)), h('div', { class: 'lhint' }, 'Click to sign in')), skipBtn(), h('button', { class: 'skip classicb', onclick: (e: Event) => { e.stopPropagation(); classic(); } }, '📃 Classic view'));
    (boot.querySelector('.lmain') as HTMLElement).tabIndex = 0; (boot.querySelector('.lmain') as HTMLElement).focus({ preventScroll: true }); boot.addEventListener('keydown', k => { if (k.key === 'Enter' || k.key === ' ') signIn(); }, { once: true });
  }
  function signIn() {
    lockClock = null; stopSS(); boot.innerHTML = ''; boot.className = 'bootl on lockscr signin'; bootSS = LockScreenSlideshow({ cls: 'ss-lock ss-blur', reduced: () => S.reduced, kb: 14, fade: 1.2, start: 1 }); const bg = bootSS.el; if (!data.photos.length) { bg.className = 'lbg blur'; bg.style.background = WALLS[S.wall][S.theme]; } else bootSS.start();
    const btn = h('button', { class: 'sibtn', onclick: () => unlock(false) }, 'Sign in'); boot.append(bg, h('div', { class: 'sic' }, h('div', { class: 'siav' }, Avatar(120, { glow: true, breathe: true })), h('h2', {}, data.name), h('p', {}, 'Guest session · no password needed'), btn), skipBtn()); setTimeout(() => btn.focus(), 60);
  }
  function unlock(silent: boolean) {
    booting = false; clearTimeout((boot as any)._t); lockClock = null; boot.classList.add('fade'); setTimeout(stopSS, 600); if (!silent) sfx.chime(); setTimeout(() => { boot.className = 'bootl'; boot.innerHTML = ''; welcome(); syncTaskbar(); }, S.reduced ? 0 : 520);
  }
  let welcomed = false;
  function welcome() {
    if (welcomed) return; welcomed = true; setTimeout(() => { if (store.get('welcomeOff', false)) notify('Welcome! 👋', 'Open Start Here on the desktop to look around.', '👋'); else openApp('welcome'); setTimeout(() => { openApp('spotify', { x: Math.max(240, desk.offsetWidth - 470), y: Math.max(10, desk.offsetHeight - 490) }); notify('Spotify', 'Press ▶ to play SEM DEMORA. Log in inside the player for the full song. 🎧', '🎧'); }, 2600); }, 900);
    setTimeout(() => notify('Windows Defender', 'No threats found. Your portfolio is looking secure. 🛡️', '🛡️'), 24000); setTimeout(() => notify('Battery saver', 'Battery saver turns on at 20%. (This is a demo; you are fine.)', '🔋'), 52000);
  }
  function lock() { closeFlyouts(); lockScreen(); }
  function signOut() { closeFlyouts(); [...wm.wins].forEach(w => wm.close(w)); signIn(); }
  function restart() { closeFlyouts(); [...wm.wins].forEach(w => wm.close(w)); bootAnim(() => lockScreen()); }
  os.lock = lock; os.restart = restart;
  function startFlow() { if (S.skipIntro) { boot.className = 'bootl'; boot.innerHTML = ''; welcome(); } else bootAnim(() => lockScreen()); }

  // ---------- BSOD easter egg ----------
  function bsod() {
    closeFlyouts(); const qr = qrcode(0, 'M'); qr.addData(data.contactPage); qr.make();
    bsodEl.innerHTML = `<div class="bs"><div class="bs-s">:(</div><h2>Your portfolio ran into a problem and needs to restart.</h2><p>We're just collecting some error info, and then we'll restart for you.</p><div class="bs-p" id="bsp">0% complete</div><div class="bs-q"><div class="qr">${qr.createSvgTag({ cellSize: 4, margin: 2 })}</div><div><p>Scan the QR code to reach ${esc(data.name)} directly.</p><p class="bs-m">Stop code: HIRE_ME_ASAP<br>What failed: recruiter.exe (not enough offers)</p></div></div><p class="bs-m">Press any key to restart</p></div>`;
    bsodEl.classList.add('on'); let p = 0; const iv = setInterval(() => { p = Math.min(100, p + 7); const e = $('#bsp', bsodEl); if (e) e.textContent = p + '% complete'; if (p >= 100) clearInterval(iv); }, 160); sfx.error();
    const done = () => { clearInterval(iv); bsodEl.classList.remove('on'); bsodEl.innerHTML = ''; window.removeEventListener('keydown', done, true); bsodEl.removeEventListener('click', done); notify('Recovered', 'Windows recovered from an unexpected error. Just kidding. 😄', '🛠️'); };
    setTimeout(() => { window.addEventListener('keydown', done, true); bsodEl.addEventListener('click', done); }, 1400);
  }
  os.bsod = bsod;

  // ---------- classic (plain scrolling) view ----------
  function classic() {
    closeFlyouts(); document.getElementById('classic-view')?.remove();
    const sec = (t: string, ...k: any[]) => h('section', {}, h('h2', {}, t), ...k); const ul = (a: string[]) => h('ul', {}, a.map(x => h('li', {}, x)));
    const v = h('div', { id: 'classic-view', class: 'classic', role: 'document' }, h('button', { class: 'cl-back', onclick: () => v.remove() }, '← Back to desktop'),
      h('header', { class: 'cl-hero' }, BlobHero(S.reduced), h('div', {}, h('h1', {}, data.name), h('p', {}, data.role), h('p', { class: 'cl-s' }, data.tagline), h('p', {}, h('a', { href: 'mailto:' + data.email }, data.email), ' · ', h('a', { href: data.github, target: '_blank', rel: 'noopener' }, 'GitHub'), ' · ', h('a', { href: data.linkedin, target: '_blank', rel: 'noopener' }, 'LinkedIn')))),
      sec('Gallery', PhotoGallery(S.reduced)), sec('About', ...data.bio.map(b => h('p', {}, b))), sec('Experience', ...data.experience.map(e => h('div', {}, h('h3', {}, e.title, h('small', {}, ' · ' + e.when)), ul(e.points)))),
      sec('Education', ...data.education.map(e => h('div', {}, h('h3', {}, e.title, h('small', {}, ' · ' + e.when)), ul(e.points)))),
      sec('Projects', h('div', { class: 'cl-g' }, data.projects.map(p => h('article', {}, h('h3', {}, p.github ? h('a', { href: p.github, target: '_blank', rel: 'noopener' }, p.title) : p.title), h('p', {}, p.description), h('p', { class: 'cl-t' }, p.stack.join(' · ')))))),
      sec('Skills', h('p', {}, data.skills.map(s => s.name).join(' · '))), sec('Publications & certifications', ul([...data.publications, ...data.certifications])));
    document.body.append(v); v.focus();
  }
  os.classic = classic;

  // ---------- keyboard shortcuts ----------
  let metaDown = false, metaCombo = false;
  window.addEventListener('keydown', e => {
    if (!os.visible) return;
    if (e.key === 'Meta') { metaDown = true; metaCombo = false; return; } if (metaDown) metaCombo = true;
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') { e.preventDefault(); openApp('terminal'); }
    else if (e.ctrlKey && e.altKey && e.shiftKey && e.key.toLowerCase() === 'b') { e.preventDefault(); bsod(); }
    else if (e.ctrlKey && e.key === 'Escape') { e.preventDefault(); toggleFly('start'); }
    else if (e.metaKey && e.key.toLowerCase() === 'e') { e.preventDefault(); openApp('explorer'); }
    else if (e.altKey && (e.key === 'Tab' || e.key.toLowerCase() === 'w')) { e.preventDefault(); altTab(e.shiftKey ? -1 : 1); }
  }, true);
  window.addEventListener('keyup', e => { if (!os.visible) return; if (e.key === 'Meta') { if (metaDown && !metaCombo) toggleFly('start'); metaDown = false; } if (e.key === 'Alt') altCommit(); }, true);

  // ---------- tablet mode (mobile / flat) ----------
  function buildLauncher() {
    launcher.innerHTML = ''; launcher.append(h('div', { class: 'lh' }, Avatar(56, { glow: true }), h('div', {}, h('b', {}, data.name), h('span', {}, data.role))),
      h('div', { class: 'lg' }, [...(Object.keys(APPS) as AppId[]).map(id => h('button', { class: 'la', onclick: () => openApp(id) }, tile(APPS[id].emoji, APPS[id].c1, APPS[id].c2, 52), h('span', {}, APPS[id].title))), h('button', { class: 'la', onclick: () => classic() }, tile('📃', '#a78bfa', '#6d28d9', 52), h('span', {}, 'Classic view'))]));
    navbar.innerHTML = ''; navbar.append(h('button', { 'aria-label': 'Back', onclick: () => { const a = wm.active; if (a && !a.min) wm.close(a); } }, '◀'), h('button', { 'aria-label': 'Home', onclick: () => wm.wins.forEach(w => !w.min && wm.minimize(w)) }, '●'), h('button', { 'aria-label': 'Recent apps', onclick: () => taskView() }, '▣'));
  }
  function setTablet(t: boolean) { tablet = t; root.classList.toggle('tablet', t); wm.tablet = t; if (t) buildLauncher(); wm.refit(); syncTaskbar(); }
  if (flat) { const ro = new ResizeObserver(() => { const t = host.offsetWidth < 820; if (t !== tablet) setTablet(t); wm.refit(); }); ro.observe(host); }

  renderIcons(); renderTray(); renderBell(); apply(); setTablet(flat && host.offsetWidth < 820);
  if (!flat) setTablet(false);
  const api: any = Object.assign(os, {
    visible: false,
    show() { api.visible = true; wm.active?.hooks.onFocus?.(); if (!(api as any)._started) { (api as any)._started = true; startFlow(); } },
    hide() { api.visible = false; wm.active?.hooks.onBlur?.(); },
    handleEscape(): boolean { if (alt) { alt.remove(); alt = null; return true; } if (bsodEl.classList.contains('on')) return true; if (document.getElementById('classic-view')) { document.getElementById('classic-view')!.remove(); return true; } if (fly || menuEl) { closeFlyouts(); return true; } return false; }
  });
  return api;
}
