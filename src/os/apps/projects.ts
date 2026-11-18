/** Projects: searchable cards with simple tag filters. Click a card for the full story and links. */
import { data } from '../data';
import { h } from '../util';
import { projectArt } from '../art';
import type { OS } from '../shell';
import type { Win } from '../wm';

export function build(body: HTMLElement, win: Win, os: OS, arg?: { slug?: string }) {
  let q = '', tag = 'All'; const root = h('div', { class: 'pj' }); body.append(root);
  const tags = ['All', ...Object.entries(data.projects.flatMap(p => p.stack).reduce((m: Record<string, number>, s) => (m[s] = (m[s] || 0) + 1, m), {})).sort((a, b) => b[1] - a[1]).slice(0, 7).map(e => e[0])];
  function list() {
    root.replaceChildren(); const search = h('input', { class: 'pj-search', type: 'search', placeholder: '🔍  Search projects…', value: q, 'aria-label': 'Search projects', oninput: (e: Event) => { q = (e.target as HTMLInputElement).value; draw(); } }) as HTMLInputElement;
    const chips = h('div', { class: 'pj-tags' }, tags.map(t => h('button', { class: 'pj-tag' + (t === tag ? ' on' : ''), onclick: () => { tag = t; list(); search.focus(); } }, t)));
    const grid = h('div', { class: 'pj-grid' }); root.append(h('div', { class: 'pj-top' }, search, chips), grid);
    function draw() {
      grid.replaceChildren(); const L = data.projects.filter(p => (tag === 'All' || p.stack.includes(tag)) && (p.title + p.description + p.stack.join(' ')).toLowerCase().includes(q.toLowerCase()));
      if (!L.length) grid.append(h('p', { class: 'pj-none' }, 'No projects match. Try a different word or choose "All".'));
      L.forEach((p, i) => grid.append(h('button', { class: 'pj-card', style: { '--i': i }, onclick: () => detail(p.slug) }, h('img', { src: projectArt(p, 480, 300), alt: '' }), h('div', { class: 'pj-b' }, h('b', {}, p.title), h('p', {}, p.description), h('div', { class: 'chips' }, p.stack.slice(0, 3).map(s => h('i', {}, s)))), h('span', { class: 'pj-more' }, 'View details ›'))));
    }
    draw();
  }
  function detail(slug: string) {
    const p = data.projects.find(x => x.slug === slug); if (!p) return list(); root.replaceChildren();
    root.append(h('button', { class: 'pj-back', onclick: list }, '← All projects'), h('div', { class: 'pj-det' }, h('img', { src: projectArt(p, 640, 400), alt: p.title + ' preview' }), h('div', {}, h('h2', {}, p.title), p.status ? h('span', { class: 'pj-status' }, p.status) : '', h('p', { class: 'pj-lead' }, p.description), h('h4', {}, 'Built with'), h('div', { class: 'chips' }, p.stack.map(s => h('i', {}, s))), h('h4', {}, 'More about it'), h('ul', {}, p.readme.map(r => h('li', {}, r))),
      h('div', { class: 'pj-actions' }, p.github ? h('a', { class: 'abtn', href: p.github, target: '_blank', rel: 'noopener' }, '🔗 See the code on GitHub') : h('span', { class: 'pj-priv' }, '🔒 Code is private (ask me for a demo)'), p.live ? h('a', { class: 'abtn alt', href: p.live, target: '_blank', rel: 'noopener' }, '▶ Live demo') : '', h('button', { class: 'abtn alt', onclick: () => os.openApp('mail') }, '✉️ Ask me about it')))));
    win.titleEl.textContent = p.title + ' - Projects';
  }
  if (arg?.slug) detail(arg.slug); else list();
  return { onArg: (a: any) => { if (a?.slug) detail(a.slug); else list(); } };
}
