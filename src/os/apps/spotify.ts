// Spotify player window: the official Spotify embed for "SEM DEMORA". Sign in inside the player for the full track.
import { h } from '../util';
import type { OS } from '../shell';
import type { Win } from '../wm';

export const TRACK = '6xZjmppXQnbOitaW3V684B';
export const TRACK_URL = 'https://open.spotify.com/track/' + TRACK;
export const SPOTIFY_LOGO = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1ed760"/><path d="M5.6 9.2c4.2-1.2 9-.9 12.8 1.3M6.3 12.5c3.5-1 7.5-.7 10.6 1.1M7 15.6c2.8-.8 5.8-.5 8.3.9" stroke="#000" stroke-width="1.7" stroke-linecap="round" fill="none"/></svg>';

export function build(body: HTMLElement, _win: Win, os: OS) {
  body.classList.add('sp-body');
  body.append(
    h('div', { class: 'sp-head' }, h('span', { html: SPOTIFY_LOGO.replace('18', '28').replace('18', '28') }), h('div', {}, h('b', {}, 'Now playing'), h('small', {}, 'SEM DEMORA · Dj Samir, MXXNAVRA, SIXTINAGER'))),
    h('iframe', { class: 'sp-frame', title: 'Spotify player: SEM DEMORA', src: 'https://open.spotify.com/embed/track/' + TRACK + '?utm_source=generator&theme=0', allow: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture', loading: 'lazy' }),
    h('p', { class: 'sp-note' }, 'Press ▶ to play. Log in to Spotify inside the player to hear the full song (guests get a 30-second preview).'),
    h('div', { class: 'sp-row' }, h('a', { class: 'sp-btn', href: TRACK_URL, target: '_blank', rel: 'noopener' }, 'Open in Spotify ↗'), h('button', { class: 'sp-btn alt', onclick: () => os.notify('Spotify', 'Tip: keep this window open while you explore. 🎧', '🎧') }, 'Tip')));
}
