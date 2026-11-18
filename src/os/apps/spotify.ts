// Music window: the SEM DEMORA track through SoundCloud's free embedded player (full song, no login needed).
// If one upload is removed or blocked, "Try another version" switches to the next one.
import { h } from '../util';
import type { OS } from '../shell';
import type { Win } from '../wm';

export const TRACK = '6xZjmppXQnbOitaW3V684B';
export const TRACK_URL = 'https://open.spotify.com/track/' + TRACK;
export const SPOTIFY_LOGO = '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1ed760"/><path d="M5.6 9.2c4.2-1.2 9-.9 12.8 1.3M6.3 12.5c3.5-1 7.5-.7 10.6 1.1M7 15.6c2.8-.8 5.8-.5 8.3.9" stroke="#000" stroke-width="1.7" stroke-linecap="round" fill="none"/></svg>';
const VERSIONS: [string, string][] = [
  ['All versions (normal first)', 'https://soundcloud.com/carolina-goncalves-421870318/sem-demora-all-versions-normal'],
  ['Slowed + reverb', 'https://soundcloud.com/glxck19-975769850/sem-demora'],
  ['Ultra slowed', 'https://soundcloud.com/hazzard-arck/sem-demora-ultra-slowed'],
  ['Heavenly slowed', 'https://soundcloud.com/anos-voldigoad-710606728/sem-demora-heavenly-slowed'],
  ['Super slowed', 'https://soundcloud.com/slitzworld/sem-demora-super-slowed']
];

export function build(body: HTMLElement, _win: Win, os: OS) {
  body.classList.add('sp-body'); let i = 0;
  const frame = h('iframe', { class: 'sp-frame', title: 'SEM DEMORA full song player', allow: 'autoplay', scrolling: 'no', frameborder: '0' }) as HTMLIFrameElement;
  const label = h('small', {}, '');
  const load = () => { frame.src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(VERSIONS[i][1]) + '&color=%231ed760&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=false'; label.textContent = 'Version: ' + VERSIONS[i][0]; };
  load();
  body.append(
    h('div', { class: 'sp-head' }, h('span', { html: SPOTIFY_LOGO }), h('div', {}, h('b', {}, 'Now playing: SEM DEMORA'), h('small', {}, 'Dj Samir, MXXNAVRA, SIXTINAGER'))),
    frame,
    h('p', { class: 'sp-note' }, 'Full song, no login needed. Press ▶ if it does not start by itself.'), label,
    h('div', { class: 'sp-row' }, h('button', { class: 'sp-btn', onclick: () => { i = (i + 1) % VERSIONS.length; load(); os.notify('Music', 'Switched to: ' + VERSIONS[i][0], '🎧'); } }, 'Try another version'), h('a', { class: 'sp-btn alt', href: TRACK_URL, target: '_blank', rel: 'noopener' }, 'Open in Spotify ↗')));
  return { onClose: () => { frame.src = 'about:blank'; } };
}
