// Spotify player window: the official Spotify embed for "SEM DEMORA". Sign in inside the player for the full track.
import { h } from '../util';
import type { OS } from '../shell';
import type { Win } from '../wm';

// Uploads of the song, tried in order; if YouTube refuses to embed one, the player moves on to the next.
export const YT_IDS = ['Ru7NDwZ-PsI', 'iBQ5asSQIL4', '81tFTCioD8M', '1Ue_hFgiIog', 'GrMOk54lcNs', '0bzYj7SdewA'];
export const TRACK = '6xZjmppXQnbOitaW3V684B';
export const TRACK_URL = 'https://open.spotify.com/track/' + TRACK;
export const SPOTIFY_LOGO = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1ed760"/><path d="M5.6 9.2c4.2-1.2 9-.9 12.8 1.3M6.3 12.5c3.5-1 7.5-.7 10.6 1.1M7 15.6c2.8-.8 5.8-.5 8.3.9" stroke="#000" stroke-width="1.7" stroke-linecap="round" fill="none"/></svg>';

export function build(body: HTMLElement, win: Win, os: OS) {
  body.classList.add('sp-body'); const holder = h('div', { class: 'sp-frame sp-yt' }, h('div', { id: 'spyt' + Date.now() })); const target = holder.firstChild as HTMLElement; let idx = 0, player: any = null;
  const status = h('p', { class: 'sp-note' }, 'Loading the song…');
  const load = () => (window as any).YT && (window as any).YT.Player ? Promise.resolve() : new Promise<void>(res => { const prev = (window as any).onYouTubeIframeAPIReady; (window as any).onYouTubeIframeAPIReady = () => { prev && prev(); res(); }; if (!document.querySelector('script[data-yt]')) { const sc = document.createElement('script'); sc.src = 'https://www.youtube.com/iframe_api'; sc.dataset.yt = '1'; sc.onerror = () => { status.textContent = 'Could not reach YouTube. Use the Open in Spotify button.'; }; document.head.append(sc); } });
  load().then(() => { player = new (window as any).YT.Player(target.id, { width: '100%', height: '100%', videoId: YT_IDS[0], playerVars: { autoplay: 1, rel: 0, playsinline: 1, modestbranding: 1, origin: location.origin }, events: { onReady: (e: any) => { status.textContent = 'Full song, no login needed. Press ▶ if it does not start by itself.'; try { e.target.playVideo(); } catch { /* needs a click */ } }, onStateChange: (e: any) => { if (e.data === 0) { try { e.target.seekTo(0); e.target.playVideo(); } catch { /* ignore */ } } }, onError: () => { idx++; if (idx < YT_IDS.length) player.loadVideoById(YT_IDS[idx]); else status.textContent = 'This song could not be embedded. Use Open in Spotify.'; } } }); });
  body.append(
    h('div', { class: 'sp-head' }, h('span', { html: SPOTIFY_LOGO.replace('18', '28').replace('18', '28') }), h('div', {}, h('b', {}, 'Now playing'), h('small', {}, 'SEM DEMORA · Dj Samir, MXXNAVRA, SIXTINAGER'))),
    holder,
    status,
    h('div', { class: 'sp-row' }, h('a', { class: 'sp-btn', href: TRACK_URL, target: '_blank', rel: 'noopener' }, 'Open in Spotify ↗'), h('button', { class: 'sp-btn alt', onclick: () => os.notify('Spotify', 'Tip: keep this window open while you explore. 🎧', '🎧') }, 'Tip')));
  return { onClose: () => { try { player && player.destroy(); } catch { /* ignore */ } } };
}
