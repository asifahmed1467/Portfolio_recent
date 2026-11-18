/** Skills: plain cards grouped by category, with a search box and a clear level label (Expert / Advanced / ...). */
import { data } from '../data';
import { h } from '../util';
import type { OS } from '../shell';
import type { Win } from '../wm';

const label = (n: number) => n >= 90 ? ['Expert', '#16a34a'] : n >= 75 ? ['Advanced', '#2563eb'] : n >= 60 ? ['Comfortable', '#d97706'] : ['Learning', '#7c3aed'];

export function build(body: HTMLElement, _win: Win, _os: OS) {
  let q = '', g = 'All'; const groups = ['All', ...new Set(data.skills.map(s => s.group))]; const root = h('div', { class: 'sk' }), out = h('div', { class: 'sk-out' }); body.append(root);
  const search = h('input', { class: 'pj-search', type: 'search', placeholder: '🔍  Search skills…', 'aria-label': 'Search skills', oninput: (e: Event) => { q = (e.target as HTMLInputElement).value; draw(); } });
  const tabs = h('div', { class: 'pj-tags' }, groups.map(x => h('button', { class: 'pj-tag' + (x === g ? ' on' : ''), onclick: (e: Event) => { g = x; [...tabs.children].forEach(c => c.classList.toggle('on', c === e.currentTarget)); draw(); } }, x)));
  root.append(h('div', { class: 'pj-top' }, search, tabs), h('div', { class: 'sk-legend' }, ['Expert', 'Advanced', 'Comfortable', 'Learning'].map((l, i) => h('span', {}, h('i', { style: { background: ['#16a34a', '#2563eb', '#d97706', '#7c3aed'][i] } }), l))), out);
  function draw() {
    out.replaceChildren(); const L = data.skills.filter(s => (g === 'All' || s.group === g) && (s.name + s.group).toLowerCase().includes(q.toLowerCase()));
    if (!L.length) { out.append(h('p', { class: 'pj-none' }, 'No skills match your search.')); return; }
    [...new Set(L.map(s => s.group))].forEach(gr => {
      out.append(h('h4', { class: 'sk-h' }, gr)); const grid = h('div', { class: 'sk-grid' });
      L.filter(s => s.group === gr).forEach((s, i) => { const [l, c] = label(s.level); const bar = h('i', { style: { background: c } }); grid.append(h('div', { class: 'sk-card', style: { '--i': i } }, h('div', { class: 'sk-row' }, h('b', {}, s.name), h('span', { style: { color: c } }, l)), h('div', { class: 'sk-bar', role: 'img', 'aria-label': `${s.name}: ${l}` }, bar))); requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = s.level + '%'; })); });
      out.append(grid);
    });
  }
  draw(); out.after(h('p', { class: 'sk-note' }, 'Levels are my own honest self-rating.'));
}
