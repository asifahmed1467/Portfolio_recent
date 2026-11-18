// Resume viewer + real PDF download (generated in the browser, no libraries).
import { data } from '../data';
import { h } from '../util';
import { buildPDF, Line } from '../pdf';
import type { OS } from '../shell';
import type { Win } from '../wm';

function lines(): Line[] {
  const L: Line[] = [{ t: data.name, size: 22, bold: true, gap: 2 }, { t: data.role, size: 12, gap: 2 }, { t: `${data.email}  |  ${data.github.replace('https://', '')}  |  ${data.linkedin.replace('https://www.', '')}`, size: 9.5, gap: 8 }];
  const sec = (t: string) => L.push({ t: t.toUpperCase(), size: 11.5, bold: true, gap: 6 });
  sec('Summary'); data.bio.forEach(b => L.push({ t: b }));
  sec('Experience'); data.experience.forEach(e => { L.push({ t: `${e.title}  (${e.when})`, bold: true }); e.points.forEach(p => L.push({ t: '- ' + p })); });
  sec('Education'); data.education.forEach(e => { L.push({ t: `${e.title}  (${e.when})`, bold: true }); e.points.forEach(p => L.push({ t: '- ' + p })); });
  sec('Projects'); data.projects.forEach(p => { L.push({ t: `${p.title}  [${p.stack.join(', ')}]`, bold: true }); L.push({ t: p.description }); });
  sec('Skills'); [...new Set(data.skills.map(s => s.group))].forEach(g => L.push({ t: `${g}: ${data.skills.filter(s => s.group === g).map(s => s.name).join(', ')}` }));
  sec('Publications'); data.publications.forEach(p => L.push({ t: '- ' + p })); sec('Certifications'); data.certifications.forEach(p => L.push({ t: '- ' + p })); return L;
}
/** Returns true if the browser started the download (sandboxed previews may block it). */
export function download(): boolean { try { const a = document.createElement('a'); a.href = URL.createObjectURL(buildPDF(lines())); a.download = `${data.name.replace(/\s+/g, '_')}_Resume.pdf`; document.body.append(a); a.click(); a.remove(); return true; } catch { return false; } }

export function build(body: HTMLElement, _win: Win, os: OS) {
  const sec = (t: string, ...k: any[]) => h('section', {}, h('h4', {}, t), ...k); const ul = (a: string[]) => h('ul', {}, a.map(x => h('li', {}, x)));
  body.append(h('div', { class: 'rv' }, h('div', { class: 'rv-bar' }, h('span', {}, 'Resume.pdf'), h('button', { class: 'abtn', onclick: () => { if (!download()) os.notify('Resume', 'Download is blocked in this preview. It works on the hosted site.', '⚠️'); } }, '⬇ Download PDF')),
    h('div', { class: 'rv-page' }, h('h1', {}, data.name), h('p', { class: 'rv-r' }, data.role), h('p', { class: 'rv-c' }, `${data.email} · ${data.github.replace('https://', '')} · ${data.linkedin.replace('https://www.', '')}`),
      sec('Summary', ...data.bio.map(b => h('p', {}, b))), sec('Experience', ...data.experience.map(e => h('div', {}, h('b', {}, e.title), h('small', {}, ' · ' + e.when), ul(e.points)))), sec('Education', ...data.education.map(e => h('div', {}, h('b', {}, e.title), h('small', {}, ' · ' + e.when), ul(e.points)))),
      sec('Projects', ...data.projects.map(p => h('p', {}, h('b', {}, p.title), ` (${p.stack.join(', ')}): ${p.description}`))), sec('Skills', h('p', {}, data.skills.map(s => s.name).join(' · '))), sec('Publications & certifications', ul([...data.publications, ...data.certifications])))));
  return {};
}
