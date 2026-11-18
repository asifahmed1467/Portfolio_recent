/** "Start Here": the friendly front door. Big, plain-language buttons for everything a visitor wants. */
import { data, AppId } from '../data';
import { h, store } from '../util';
import { Avatar } from '../img';
import type { OS } from '../shell';
import type { Win } from '../wm';

const TILES: [string, string, string, AppId, string][] = [
  ['👤', 'About me', 'Who I am and what I do', 'about', '#fb923c'],
  ['💼', 'Projects', 'Things I have built', 'projects', '#3b82f6'],
  ['🛠️', 'Skills', 'What I am good at', 'skills', '#10b981'],
  ['🎓', 'Journey', 'Work and education', 'journey', '#8b5cf6'],
  ['🖼️', 'Photos', 'Pictures and memories', 'photos', '#ec4899'],
  ['📄', 'Resume', 'Read it or download it', 'resume', '#ef4444'],
  ['✉️', 'Contact me', 'Send me a message', 'mail', '#0ea5e9'],
  ['🕹️', 'Play a game', 'Take a quick break', 'invaders', '#a855f7'],
  ['⌨️', 'Terminal', 'For the curious', 'terminal', '#475569']
];

export function build(body: HTMLElement, win: Win, os: OS) {
  const off = h('input', { type: 'checkbox', id: 'wl-off', checked: store.get('welcomeOff', false) ? 'checked' : null, onchange: (e: Event) => store.set('welcomeOff', (e.target as HTMLInputElement).checked) }) as HTMLInputElement;
  body.append(h('div', { class: 'wl' },
    h('div', { class: 'wl-hero' }, Avatar(76, { glow: true }), h('div', {}, h('h2', {}, `Hi, I'm ${data.name.split(' ')[0]} 👋`), h('p', {}, data.role + ' · ' + data.location), h('small', {}, 'Click anything below to get started. Nothing here can break.'))),
    h('div', { class: 'wl-grid' }, TILES.map(([e, t, d, app, c], i) => h('button', { class: 'wl-tile', style: { '--c': c, '--i': i }, onclick: () => os.openApp(app) }, h('span', { class: 'wl-ic' }, e), h('b', {}, t), h('small', {}, d)))),
    h('div', { class: 'wl-foot' }, h('span', {}, '💡 Tip: the ', h('b', {}, 'Start'), ' button (or the Windows key) opens everything, and the ✕ in a window corner closes it.'), h('label', {}, off, ' Don\'t show this at startup'))));
  void win;
}
