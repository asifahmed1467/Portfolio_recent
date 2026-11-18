// Edge-style browser: tabs, address bar, internal pages. Live projects can load in an <iframe> when data.browserUseIframe is true.
import { data } from '../data';
import { h, esc } from '../util';
import { projectArt } from '../art';
import type { OS } from '../shell';
import type { Win } from '../wm';

export function build(body: HTMLElement, win: Win, os: OS, arg?: any) {
  type Tab = { title: string; url: string; page: string };
  const tabs: Tab[] = [{ title: 'New tab', url: 'edge://newtab', page: 'new' }, { title: 'Blog', url: 'portfolio://blog', page: 'blog' }]; let cur = 0;
  const strip = h('div', { class: 'br-tabs' }), addr = h('input', { class: 'br-addr', spellcheck: 'false', 'aria-label': 'Address bar' }) as HTMLInputElement, view = h('div', { class: 'br-view' });
  const nav = (page: string, url: string, title: string) => { tabs[cur] = { page, url, title }; render(); };
  const card = (p: typeof data.projects[0]) => h('article', { class: 'br-card' }, h('img', { src: projectArt(p, 400, 240), alt: '' }), h('h4', {}, p.title), h('p', {}, p.description), h('div', { class: 'chips' }, p.stack.map(s => h('i', {}, s))), h('div', { class: 'xp-links' }, p.live ? h('button', { class: 'abtn', onclick: () => data.browserUseIframe ? nav('frame:' + p.live, p.live!, p.title) : window.open(p.live!, '_blank', 'noopener') }, 'Open live ↗') : '', p.github ? h('a', { class: 'abtn alt', href: p.github, target: '_blank', rel: 'noopener' }, 'GitHub ↗') : h('span', { class: 'xp-st' }, p.status || 'Private')));
  function page(t: Tab): HTMLElement {
    if (!os.S.wifi) return h('div', { class: 'br-off' }, h('div', {}, '📡'), h('h2', {}, "You're offline"), h('p', {}, 'Turn Wi-Fi back on from Quick settings (the tray) to browse.'), h('button', { class: 'abtn', onclick: () => { os.S.wifi = true; os.apply(); render(); } }, 'Turn on Wi-Fi'));
    if (t.page.startsWith('frame:')) return h('iframe', { class: 'br-frame', src: t.page.slice(6), title: t.title, referrerpolicy: 'no-referrer', sandbox: 'allow-scripts allow-same-origin allow-popups allow-forms' });
    if (t.page === 'blog') return h('div', { class: 'br-page' }, h('h2', {}, 'Blog'), h('p', { class: 'br-sub' }, 'Sample entries: edit data.blog in data.ts.'), data.blog.map(b => h('article', { class: 'br-post' }, h('small', {}, b.date), h('h4', {}, b.title), h('p', {}, b.summary), b.url ? h('a', { href: b.url, target: '_blank', rel: 'noopener' }, 'Read ↗') : '')));
    if (t.page === 'projects') return h('div', { class: 'br-page' }, h('h2', {}, 'Projects'), h('div', { class: 'br-grid' }, data.projects.map(card)));
    return h('div', { class: 'br-page center' }, h('h1', {}, `${data.name}`), h('p', { class: 'br-sub' }, data.tagline), h('input', { class: 'br-search', placeholder: 'Search projects, or type a URL', 'aria-label': 'Search', onkeydown: (e: KeyboardEvent) => { e.stopPropagation(); if (e.key === 'Enter') { const v = (e.target as HTMLInputElement).value.trim(); if (/^https?:\/\//.test(v)) window.open(v, '_blank', 'noopener'); else nav('projects', 'portfolio://projects?q=' + encodeURIComponent(v), 'Projects'); } } }),
      h('div', { class: 'br-fav' }, [['📁', 'Projects', () => nav('projects', 'portfolio://projects', 'Projects')], ['✍️', 'Blog', () => nav('blog', 'portfolio://blog', 'Blog')], ['🐙', 'GitHub', () => window.open(data.github, '_blank', 'noopener')], ['💼', 'LinkedIn', () => window.open(data.linkedin, '_blank', 'noopener')]].map(([e, l, f]: any) => h('button', { onclick: f }, h('span', {}, e), l))));
  }
  function render() {
    strip.innerHTML = ''; tabs.forEach((t, i) => strip.append(h('button', { class: 'br-tab' + (i === cur ? ' on' : ''), onclick: () => { cur = i; render(); } }, h('span', {}, esc(t.title)), h('i', { 'aria-label': 'Close tab', onclick: (e: Event) => { e.stopPropagation(); if (tabs.length > 1) { tabs.splice(i, 1); cur = Math.min(cur, tabs.length - 1); render(); } } }, '✕'))));
    strip.append(h('button', { class: 'br-plus', 'aria-label': 'New tab', onclick: () => { tabs.push({ title: 'New tab', url: 'edge://newtab', page: 'new' }); cur = tabs.length - 1; render(); } }, '＋'));
    const t = tabs[cur]; addr.value = t.url; view.innerHTML = ''; view.append(page(t)); win.titleEl.textContent = t.title + ' - Edge';
  }
  addr.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { const v = addr.value.trim(); if (/^https?:\/\//.test(v)) { if (data.browserUseIframe) nav('frame:' + v, v, v); else window.open(v, '_blank', 'noopener'); } else if (/projects/.test(v)) nav('projects', 'portfolio://projects', 'Projects'); else if (/blog/.test(v)) nav('blog', 'portfolio://blog', 'Blog'); else nav('new', 'edge://newtab', 'New tab'); } });
  body.append(h('div', { class: 'br' }, strip, h('div', { class: 'br-bar' }, h('button', { 'aria-label': 'Back', onclick: () => nav('new', 'edge://newtab', 'New tab') }, '◀'), h('button', { 'aria-label': 'Refresh', onclick: render }, '⟳'), addr, h('button', { 'aria-label': 'Home', onclick: () => nav('projects', 'portfolio://projects', 'Projects') }, '🏠')), view));
  render(); void arg; return {};
}
