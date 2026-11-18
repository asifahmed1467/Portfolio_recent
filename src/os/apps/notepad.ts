// Notepad: opens About Me.txt (or any text file), editable, with save to localStorage and word-wrap toggle.
import { h, store } from '../util';
import { ABOUT_TXT } from '../fs';
import type { OS } from '../shell';
import type { Win } from '../wm';

export function build(body: HTMLElement, win: Win, os: OS, arg?: { name?: string; text?: string; file?: string }) {
  const name = arg?.name || arg?.file || 'Untitled.txt'; const key = 'note:' + name;
  const ta = h('textarea', { class: 'np-ta', spellcheck: 'false', 'aria-label': 'Text editor' }) as HTMLTextAreaElement; ta.value = store.get(key, arg?.text ?? (name === 'About Me.txt' ? ABOUT_TXT() : ''));
  const st = h('div', { class: 'np-st' }); let dirty = false;
  const upd = () => { const pre = ta.value.slice(0, ta.selectionStart).split('\n'); st.textContent = `Ln ${pre.length}, Col ${pre[pre.length - 1].length + 1}    ${ta.value.length} characters`; win.titleEl.textContent = (dirty ? '*' : '') + name + ' - Notepad'; };
  const save = () => { store.set(key, ta.value); dirty = false; upd(); os.notify('Notepad', `Saved ${name} in this browser.`, '💾'); };
  const menu = (label: string, items: [string, () => void][]) => { const m = h('div', { class: 'np-m' }, h('button', {}, label), h('div', { class: 'np-dd' }, items.map(([l, f]) => h('button', { onclick: f }, l)))); return m; };
  body.append(h('div', { class: 'np' }, h('div', { class: 'np-bar' }, menu('File', [['New', () => { ta.value = ''; dirty = true; upd(); }], ['Save', save], ['Download .txt', () => { try { const a = h('a', { href: URL.createObjectURL(new Blob([ta.value])), download: name }); a.click(); } catch { os.notify('Notepad', 'Download is blocked in this preview.', '⚠️'); } }]]), menu('Edit', [['Select all', () => { ta.select(); }], ['Time/Date', () => { ta.setRangeText(new Date().toLocaleString(), ta.selectionStart, ta.selectionEnd, 'end'); dirty = true; upd(); }]]), menu('Format', [['Toggle word wrap', () => { ta.style.whiteSpace = ta.style.whiteSpace === 'pre' ? '' : 'pre'; }]])), ta, st));
  ta.addEventListener('input', () => { dirty = true; upd(); }); ta.addEventListener('keyup', upd); ta.addEventListener('click', upd); ta.addEventListener('keydown', e => { e.stopPropagation(); if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); save(); } });
  upd(); return { onFocus: () => ta.focus() };
}
