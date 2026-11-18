/** About Me window: stacked polaroid collage (fans out on hover) beside a line-by-line bio. */
import { data } from '../data';
import { h } from '../util';
import { PolaroidStack } from '../ui/polaroid';
import { bioReveal } from './photos';
import type { OS } from '../shell';
import type { Win } from '../wm';

export function build(body: HTMLElement, _win: Win, os: OS) {
  const stack = PolaroidStack({ reduced: () => os.S.reduced, onOpen: p => os.openApp('photos', { photo: data.photos.indexOf(p) }) });
  const links = h('div', { class: 'abt-btns rv-line', style: { '--i': data.bio.length + 3 } }, h('button', { class: 'abtn', onclick: () => os.openApp('photos') }, '🖼️ Open Photos'), h('button', { class: 'abtn alt', onclick: () => os.openApp('resume') }, '📄 Resume'), h('button', { class: 'abtn alt', onclick: () => os.openApp('mail') }, '✉️ Contact'));
  body.append(h('div', { class: 'about' }, h('div', { class: 'about-l' }, stack, h('small', { class: 'about-hint' }, 'Hover to fan out · click a photo to bring it forward')), h('div', { class: 'about-r' }, bioReveal([links]))));
}
