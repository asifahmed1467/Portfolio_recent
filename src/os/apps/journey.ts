/** Journey: work, education, publications and certificates on one easy timeline. */
import { data } from '../data';
import { h } from '../util';
import type { OS } from '../shell';
import type { Win } from '../wm';

export function build(body: HTMLElement, _win: Win, os: OS) {
  const item = (e: string, t: string, when: string, pts: string[]) => h('div', { class: 'jn-item' }, h('span', { class: 'jn-dot' }, e), h('div', { class: 'jn-card' }, h('div', { class: 'jn-t' }, h('b', {}, t), when ? h('small', {}, when) : ''), pts.length ? h('ul', {}, pts.map(p => h('li', {}, p))) : ''));
  const sec = (title: string, ...k: HTMLElement[]) => h('section', { class: 'jn-sec' }, h('h3', {}, title), h('div', { class: 'jn-line' }, k));
  body.append(h('div', { class: 'jn' }, h('div', { class: 'jn-top' }, h('div', {}, h('h2', {}, 'My journey'), h('small', {}, `${data.stats.cgpa} CGPA · ${data.stats.deans}`)), h('button', { class: 'abtn', onclick: () => os.openApp('resume') }, '📄 Open resume')),
    sec('💼 Work', ...data.experience.map(e => item('💼', e.title, e.when, e.points))),
    sec('🎓 Education', ...data.education.map(e => item('🎓', e.title, e.when, e.points))),
    sec('📚 Research', ...data.publications.map(p => item('📚', p, '', []))),
    sec('🏅 Certificates', ...data.certifications.map(c => item('🏅', c, '', [])))));
}
