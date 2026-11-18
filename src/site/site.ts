/**
 * The normal portfolio: a clean scrolling page (hero, about, skills, projects, experience, gallery, contact).
 * All words come from src/os/data.ts. Design: dark/light theme, gradient accent, scroll-reveal animations.
 * Every animation is disabled under prefers-reduced-motion (see site.css).
 */
import { data } from '../os/data';
import { h } from '../os/util';
import { BlobHero } from '../os/ui/blobhero';
import { photoEl, Avatar } from '../os/img';
import { Lightbox } from '../os/ui/lightbox';
import { projectArt } from '../os/art';
import { download } from '../os/apps/resume';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const sec = (id: string, kicker: string, title: string, ...kids: any[]) => h('section', { id, class: 's-sec' }, h('div', { class: 's-wrap' }, h('p', { class: 's-kick rvl' }, kicker), h('h2', { class: 's-h rvl' }, title), ...kids));
const LEVEL = (n: number) => n >= 90 ? 'Expert' : n >= 75 ? 'Advanced' : n >= 60 ? 'Comfortable' : 'Learning';

export function renderSite(host: HTMLElement, launchDesk: () => void) {
  host.className = 'site'; const saved = localStorage.getItem('site.theme'); const theme = saved || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'); host.dataset.theme = theme;
  const first = data.name.split(' ')[0];
  // ---------- nav ----------
  const links: [string, string][] = [['about', 'About'], ['skills', 'Skills'], ['projects', 'Projects'], ['journey', 'Experience'], ['gallery', 'Photos'], ['contact', 'Contact']];
  const nav = h('nav', { class: 's-nav', 'aria-label': 'Main' }, h('div', { class: 's-wrap s-navin' }, h('a', { class: 's-logo', href: '#home' }, h('b', {}, data.name.split(' ').map(w => w[0]).join('')), h('span', {}, data.name)),
    h('div', { class: 's-links', id: 's-links' }, links.map(([id, l]) => h('a', { href: '#' + id, 'data-id': id, onclick: () => host.classList.remove('menu') }, l))),
    h('button', { class: 's-ico', 'aria-label': 'Switch light or dark theme', onclick: () => { const t = host.dataset.theme === 'dark' ? 'light' : 'dark'; host.dataset.theme = t; localStorage.setItem('site.theme', t); } }, '◐'),
    h('button', { class: 's-ico s-burger', 'aria-label': 'Menu', onclick: () => host.classList.toggle('menu') }, '☰')));
  // ---------- hero ----------
  const role = h('span', { class: 's-type' }, data.role);
  const phrases = [data.role, 'NLP Researcher', 'Bangla LLM Quantization', 'Voice Bot Builder']; let pi = 0;
  const hero = h('header', { id: 'home', class: 's-hero' }, h('div', { class: 's-wrap s-herogrid' },
    h('div', { class: 's-herotxt' }, h('p', { class: 's-pill rvl' }, h('i', {}), 'R&D Intern at Reve Systems'), h('h1', { class: 'rvl' }, 'Hi, I\'m ', h('span', { class: 's-grad' }, data.name), '.'), h('p', { class: 's-role rvl' }, role), h('p', { class: 's-lead rvl' }, data.bio[0]),
      h('div', { class: 's-cta rvl' }, h('a', { class: 's-btn', href: '#projects' }, 'View my projects'), h('button', { class: 's-btn alt', onclick: () => download() }, '⬇ Download resume'), h('a', { class: 's-btn ghost', href: '#contact' }, 'Contact me')),
      h('div', { class: 's-soc rvl' }, h('a', { href: data.github, target: '_blank', rel: 'noopener' }, 'GitHub'), h('a', { href: data.linkedin, target: '_blank', rel: 'noopener' }, 'LinkedIn'), h('a', { href: 'mailto:' + data.email }, 'Email'))),
    h('div', { class: 's-heroimg rvl' }, BlobHero(reduced()))),
    h('div', { class: 's-wrap s-stats' }, [[data.stats.cgpa.split(' ')[0], 'CGPA'], ['5×', "Dean's Award"], [String(data.projects.length), 'Projects'], ['2', 'Papers submitted']].map(([n, l]) => h('div', { class: 's-stat rvl' }, h('b', {}, n), h('span', {}, l)))));
  if (!reduced()) setInterval(() => { pi = (pi + 1) % phrases.length; role.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: 220, fill: 'forwards' }).finished.then(() => { role.textContent = phrases[pi]; role.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 260, fill: 'forwards' }); }); }, 2600);
  // ---------- about ----------
  const best = data.photos.find(p => p.best) || data.photos[0];
  const about = sec('about', 'About', 'A bit about me', h('div', { class: 's-about' }, h('div', { class: 's-aboutimg rvl' }, best ? photoEl(best, { cls: 's-pic', sizes: '420px' }) : Avatar(200)), h('div', { class: 's-abouttxt' }, data.bio.map(b => h('p', { class: 'rvl' }, b)), h('div', { class: 's-chips rvl' }, [data.stats.deans, data.stats.cgpa + ' CGPA', data.location].map(t => h('i', {}, t))))));
  // ---------- skills ----------
  const groups = [...new Set(data.skills.map(s => s.group))];
  const skills = sec('skills', 'Skills', 'What I work with', h('div', { class: 's-skills' }, groups.map(g => h('div', { class: 's-card rvl' }, h('h3', {}, g), data.skills.filter(s => s.group === g).map(s => { const bar = h('i', {}); bar.dataset.w = String(s.level); return h('div', { class: 's-skill' }, h('div', {}, h('span', {}, s.name), h('small', {}, LEVEL(s.level))), h('div', { class: 's-bar' }, bar)); })))));
  // ---------- projects ----------
  const projects = sec('projects', 'Projects', 'Things I have built', h('div', { class: 's-grid' }, data.projects.map(p => h('article', { class: 's-proj rvl' }, h('img', { loading: 'lazy', alt: p.title + ' preview', src: projectArt(p, 640, 400) as any }), h('div', { class: 's-projb' }, h('h3', {}, p.title), h('p', {}, p.description), h('div', { class: 's-chips' }, p.stack.slice(0, 4).map(t => h('i', {}, t))), h('div', { class: 's-links2' }, p.github ? h('a', { href: p.github, target: '_blank', rel: 'noopener' }, 'Code ↗') : h('span', {}, '🔒 Private'), p.live ? h('a', { href: p.live, target: '_blank', rel: 'noopener' }, 'Live ↗') : ''))))));
  // ---------- experience / education ----------
  const item = (t: string, when: string, pts: string[]) => h('div', { class: 's-tl rvl' }, h('i', {}), h('div', {}, h('div', { class: 's-tlh' }, h('b', {}, t), when ? h('small', {}, when) : ''), pts.length ? h('ul', {}, pts.map(p => h('li', {}, p))) : ''));
  const journey = sec('journey', 'Experience', 'Work, study and research', h('div', { class: 's-two' }, h('div', {}, h('h3', { class: 's-sub rvl' }, 'Experience'), ...data.experience.map(e => item(e.title, e.when, e.points)), h('h3', { class: 's-sub rvl' }, 'Research'), ...data.publications.map(p => item(p, '', []))), h('div', {}, h('h3', { class: 's-sub rvl' }, 'Education'), ...data.education.map(e => item(e.title, e.when, e.points)), h('h3', { class: 's-sub rvl' }, 'Certificates'), ...data.certifications.map(c => item(c, '', [])))));
  // ---------- gallery ----------
  const thumbs: HTMLElement[] = []; const items = data.photos.map(p => ({ id: p.id, caption: p.caption, alt: p.alt, photo: p }));
  const lb = Lightbox(document.body, items, { getThumb: i => thumbs[i] || null, reduced });
  const gallery = sec('gallery', 'Photos', 'Moments', h('div', { class: 's-gal' }, data.photos.map((p, i) => { const b = h('button', { class: 's-gi rvl', 'aria-label': 'Open photo: ' + p.caption, onclick: () => lb.open(i) }, photoEl(p, { cls: 's-gpic', sizes: '360px' }), h('span', {}, p.caption)); thumbs[i] = b; return b; })));
  // ---------- contact ----------
  const msg = h('p', { class: 's-msg', role: 'status' }); const f = (n: string, l: string, area = false) => h('label', {}, l, area ? h('textarea', { name: n, rows: '5', required: 'required' }) : h('input', { name: n, type: n === 'email' ? 'email' : 'text', required: 'required' }));
  const form = h('form', { class: 's-form rvl', onsubmit: async (e: Event) => { e.preventDefault(); const fd = new FormData(form as HTMLFormElement); const n = String(fd.get('name')), em = String(fd.get('email')), m = String(fd.get('message'));
    if (data.formspree) { try { const r = await fetch(data.formspree, { method: 'POST', body: fd, headers: { Accept: 'application/json' } }); if (r.ok) { msg.textContent = '✅ Thanks! Your message was sent.'; (form as HTMLFormElement).reset(); return; } } catch { /* fall through to email app */ } }
    location.href = `mailto:${data.email}?subject=${encodeURIComponent('Portfolio message from ' + n)}&body=${encodeURIComponent(m + '\n\n' + n + ' (' + em + ')')}`; msg.textContent = 'Opening your email app…'; } }, f('name', 'Your name'), f('email', 'Your email'), f('message', 'Message', true), h('button', { class: 's-btn', type: 'submit' }, 'Send message'), msg);
  const contact = sec('contact', 'Contact', "Let's talk", h('div', { class: 's-two' }, h('div', { class: 'rvl' }, h('p', { class: 's-lead' }, 'Open to internships, research collaboration and interesting voice AI problems. The quickest way to reach me:'), h('ul', { class: 's-cl' }, h('li', {}, '✉️ ', h('a', { href: 'mailto:' + data.email }, data.email)), h('li', {}, '💻 ', h('a', { href: data.github, target: '_blank', rel: 'noopener' }, 'github.com/asifahmed1467')), h('li', {}, '🔗 ', h('a', { href: data.linkedin, target: '_blank', rel: 'noopener' }, 'LinkedIn')), h('li', {}, '📍 ' + data.location))), form));
  const foot = h('footer', { class: 's-foot' }, h('div', { class: 's-wrap' }, h('span', {}, `© ${new Date().getFullYear()} ${data.name}`), h('button', { class: 's-btn ghost small', onclick: launchDesk }, '🎮 Explore the interactive 3D desk')));
  host.append(nav, hero, about, skills, projects, journey, gallery, contact, foot);
  // ---------- behaviour: reveal on scroll, skill bars, scroll spy ----------
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const el = e.target as HTMLElement; el.classList.add('in'); el.querySelectorAll<HTMLElement>('[data-w]').forEach(b => { b.style.width = b.dataset.w + '%'; }); io.unobserve(el); } }), { threshold: 0.12 });
  host.querySelectorAll('.rvl').forEach((el, i) => { (el as HTMLElement).style.setProperty('--d', (i % 4) * 70 + 'ms'); io.observe(el); });
  const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) nav.querySelectorAll('a[data-id]').forEach(a => a.classList.toggle('on', a.getAttribute('data-id') === e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
  host.querySelectorAll('section[id]').forEach(s => spy.observe(s));
  addEventListener('scroll', () => nav.classList.toggle('stuck', scrollY > 10), { passive: true });
  void first;
}
