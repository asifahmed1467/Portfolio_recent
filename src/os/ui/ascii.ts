/**
 * AsciiPhoto: converts a photo to ASCII art (canvas sampling, focal-point aware crop).
 *  asciiLines(photo, cols, rows) -> string[]   (used by the terminal: neofetch + `photo ascii`)
 *  AsciiPhoto(photo, cols)       -> <pre> element that fades in once rendered.
 * Pixel reads need a same-origin or data: image, which is the case for /images/* and the inlined build.
 */
import { Photo } from '../data';
import { h } from '../util';
import { imgSrc, fp } from '../img';

const RAMP = ' .\'`^",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
const cache = new Map<string, Promise<HTMLImageElement>>();
const load = (p: Photo) => { let c = cache.get(p.id); if (!c) { c = new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = imgSrc(p, true); }); cache.set(p.id, c); } return c; };

export async function asciiLines(p: Photo, cols: number, rows: number): Promise<string[]> {
  const im = await load(p); const cv = document.createElement('canvas'); cv.width = cols; cv.height = rows; const g = cv.getContext('2d', { willReadFrequently: true })!;
  // crop the source to the target aspect (chars are ~2x taller than wide), centred on the focal point
  const aspect = (cols / rows) / 2, sw = im.naturalWidth, sh = im.naturalHeight; let cw = sw, ch = sw / aspect; if (ch > sh) { ch = sh; cw = sh * aspect; }
  const [fx, fy] = fp(p).split(' ').map(v => parseFloat(v) / 100); const cx = Math.max(0, Math.min(sw - cw, fx * sw - cw / 2)), cy = Math.max(0, Math.min(sh - ch, fy * sh - ch / 2));
  g.drawImage(im, cx, cy, cw, ch, 0, 0, cols, rows); const d = g.getImageData(0, 0, cols, rows).data; const lines: string[] = [];
  let lo = 255, hi = 0; const L: number[] = []; for (let i = 0; i < d.length; i += 4) { const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; L.push(v); lo = Math.min(lo, v); hi = Math.max(hi, v); }
  for (let y = 0; y < rows; y++) { let s = ''; for (let x = 0; x < cols; x++) { const v = (L[y * cols + x] - lo) / (hi - lo || 1); s += RAMP[Math.min(RAMP.length - 1, Math.floor(Math.pow(v, 0.9) * RAMP.length))]; } lines.push(s); }
  return lines;
}

export function AsciiPhoto(p: Photo, cols = 60): HTMLElement {
  const rows = Math.round(cols * 0.5 * 1.1); const pre = h('pre', { class: 'ascii', role: 'img', 'aria-label': p.alt }); asciiLines(p, cols, rows).then(l => { pre.textContent = l.join('\n'); pre.classList.add('ready'); }).catch(() => { pre.textContent = '[ photo unavailable ]'; }); return pre;
}
