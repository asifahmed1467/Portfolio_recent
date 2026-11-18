// File Explorer: sidebar, breadcrumbs, grid/list view. Project folders show README, screenshots, stack and links.
import { data } from '../data';
import { h, esc, tile } from '../util';
import * as FS from '../fs';
import { projectArt } from '../art';
import type { OS } from '../shell';
import type { Win } from '../wm';

const QUICK: [string, string, string][] = [['Desktop', '🖥️', 'C:\\Users\\Guest\\Desktop'], ['Documents', '📄', 'C:\\Users\\Guest\\Documents'], ['Projects', '📁', 'C:\\Users\\Guest\\Projects'], ['Downloads', '⬇️', 'C:\\Users\\Guest\\Downloads'], ['Pictures', '🖼️', 'C:\\Users\\Guest\\Pictures']];
const BIN = [['old_bugs.log', '📃'], ['TODO_sleep.txt', '📃'], ['final_final_v2_REAL.docx', '📃'], ['stack_overflow_copy.py', '🐍']];

export function build(body: HTMLElement, win: Win, os: OS, arg?: { path?: string }) {
  let q = ''; let path = arg?.path || 'C:\\Users\\Guest'; let view: 'grid' | 'list' = 'grid'; const back: string[] = [], fwd: string[] = [];
  const crumbs = h('div', { class: 'xp-crumbs' }), main = h('div', { class: 'xp-main' }), status = h('div', { class: 'xp-status' });
  const btn = (t: string, label: string, fn: () => void) => h('button', { class: 'xp-btn', 'aria-label': label, title: label, onclick: fn }, t);
  const side = h('nav', { class: 'xp-side', 'aria-label': 'Folders' }, h('h6', {}, 'Folders'), h('button', { class: 'xp-link', onclick: () => go('C:\\Users\\Guest') }, h('span', {}, '🏠'), 'Home'), QUICK.map(([n, e, p]) => h('button', { class: 'xp-link', onclick: () => go(p) }, h('span', {}, e), n)), h('h6', {}, 'This PC'), h('button', { class: 'xp-link', onclick: () => go('This PC') }, h('span', {}, '💻'), 'This PC'), h('button', { class: 'xp-link', onclick: () => go('Recycle Bin') }, h('span', {}, '🗑️'), 'Recycle Bin'));
  const viewBtn = btn('▦', 'Switch view', () => { view = view === 'grid' ? 'list' : 'grid'; render(); });
  body.append(h('div', { class: 'xp' }, h('div', { class: 'xp-bar' }, btn('◀', 'Back', () => { if (back.length) { fwd.push(path); path = back.pop()!; render(); } }), btn('▶', 'Forward', () => { if (fwd.length) { back.push(path); path = fwd.pop()!; render(); } }), btn('▲', 'Up', () => { if (path !== 'This PC' && path !== 'Recycle Bin') go(FS.normalize('C:\\', path).slice(0, -1).join('\\') || 'This PC'); }), crumbs, h('input', { class: 'xp-search', type: 'search', placeholder: 'Search this folder', 'aria-label': 'Search this folder', oninput: (e: Event) => { q = (e.target as HTMLInputElement).value; render(); } }), viewBtn), h('div', { class: 'xp-body' }, side, main), status));
  function go(p: string) { if (p === path) return; back.push(path); fwd.length = 0; path = p; render(); }
  function openNode(n: FS.FNode, full: string) {
    if (n.dir) return go(full);
    if (n.kind === 'txt' || n.kind === 'md') os.openApp('notepad', { name: n.name, text: n.content }); else if (n.kind === 'pdf') os.openApp('resume'); else if (n.kind === 'img') os.openApp('photos', { project: n.project }); else if (n.app) os.openApp(n.app); else os.notify(n.name, 'Access is denied. (Nice try!)', '🔒');
  }
  const icon = (n: FS.FNode, big = 44) => n.dir ? tile(n.project ? '📂' : '📁', '#fcd34d', '#d97706', big) : n.kind === 'img' ? h('img', { class: 'xp-thumb', src: projectArt(data.projects.find(p => p.slug === n.project) || data.projects[0], 160, 100), alt: '', style: { width: big + 'px', height: big * 0.65 + 'px' } }) : tile(n.kind === 'pdf' ? '📄' : n.kind === 'md' ? '📘' : n.kind === 'link' || n.kind === 'exe' ? '🚀' : '📝', n.kind === 'pdf' ? '#f87171' : '#7dd3fc', n.kind === 'pdf' ? '#b91c1c' : '#0369a1', big);
  function projectHeader(p: typeof data.projects[0]) {
    return h('div', { class: 'xp-proj' }, h('img', { src: projectArt(p, 480, 300), alt: p.title + ' preview' }), h('div', {}, h('h3', {}, p.title), h('p', {}, p.description), h('div', { class: 'chips' }, p.stack.map(s => h('i', {}, s))), h('div', { class: 'xp-links' }, p.github ? h('a', { href: p.github, target: '_blank', rel: 'noopener', class: 'abtn' }, 'GitHub ↗') : '', p.live ? h('a', { href: p.live, target: '_blank', rel: 'noopener', class: 'abtn alt' }, 'Live demo ↗') : '', p.status ? h('span', { class: 'xp-st' }, p.status) : ''), h('div', { class: 'xp-readme' }, p.readme.map(r => h('p', {}, r)))));
  }
  function render() {
    main.innerHTML = ''; crumbs.innerHTML = ''; let count = 0;
    const set = (parts: string[]) => parts.forEach((c, i) => { crumbs.append(h('button', { onclick: () => go(i === 0 && c === 'This PC' ? c : parts.slice(0, i + 1).join('\\') || 'This PC') }, c), i < parts.length - 1 ? h('span', {}, '›') : ''); });
    if (path === 'This PC') { set(['This PC']); main.append(h('div', { class: 'xp-drives' }, [['Local Disk (C:)', 62, '420 GB free of 1.0 TB', 'C:\\'], ['Skills (D:)', 86, '3.86 CGPA used of 4.00', ''], ['Dreams (E:)', 12, '88% free', '']].map(([n, pc, d, p]) => h('div', { class: 'xp-drive', ondblclick: () => p && go(p as string) }, tile('💽', '#94a3b8', '#475569', 44), h('div', {}, h('b', {}, n as string), h('div', { class: 'bar' }, h('i', { style: { width: pc + '%' } })), h('small', {}, d as string)))))); count = 3; }
    else if (path === 'Recycle Bin') { set(['Recycle Bin']); main.append(h('div', { class: 'xp-grid' }, BIN.map(([n, e]) => h('div', { class: 'xp-item', tabindex: '0', ondblclick: () => os.notify(n, 'This file is in the Recycle Bin. Restore it first.', '🗑️') }, tile(e, '#cbd5e1', '#64748b', 44), h('span', {}, n))))); count = BIN.length; }
    else {
      const r = FS.resolve('C:\\', path); if (!r.node || !r.node.dir) { main.append(h('p', { class: 'xp-none' }, 'This folder is empty or does not exist.')); set(['This PC']); return; }
      set(r.parts); if (r.node.project) { const p = data.projects.find(x => x.slug === r.node!.project); if (p) main.append(projectHeader(p)); }
      const kids = FS.list(r.node).filter(n => n.name.toLowerCase().includes(q.toLowerCase())); count = kids.length; const wrap = h('div', { class: view === 'grid' ? 'xp-grid' : 'xp-list' });
      kids.forEach(n => wrap.append(h('div', { class: 'xp-item', tabindex: '0', role: 'button', onclick: () => openNode(n, r.parts.join('\\') + '\\' + n.name), onkeydown: (e: KeyboardEvent) => { if (e.key === 'Enter') openNode(n, r.parts.join('\\') + '\\' + n.name); }}, icon(n, view === 'grid' ? 44 : 22), h('span', {}, n.name), view === 'list' ? h('em', {}, n.dir ? 'File folder' : (n.kind || 'file').toUpperCase() + ' file') : '')));
      main.append(wrap);
    }
    status.textContent = count + ' item' + (count === 1 ? '' : 's') + '  ·  Click any item to open it'; win.titleEl.textContent = (path.split('\\').pop() || path) + ' - File Explorer';
  }
  render(); return { onArg: (a: any) => { if (a?.path) go(a.path); } };
}
