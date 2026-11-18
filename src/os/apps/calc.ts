// Calculator (bonus app). Click or use the keyboard.
import { h } from '../util';
import type { OS } from '../shell';
import type { Win } from '../wm';

export function build(body: HTMLElement, _win: Win, _os: OS) {
  let cur = '0', prev: number | null = null, op: string | null = null, fresh = true; const disp = h('div', { class: 'ca-d', 'aria-live': 'polite' }, '0'), hist = h('div', { class: 'ca-h' });
  const fmt = (n: number) => String(parseFloat(n.toPrecision(12)));
  const calc = (a: number, b: number, o: string) => o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : b === 0 ? NaN : a / b;
  function press(k: string) {
    if (/\d/.test(k)) { cur = fresh || cur === '0' ? k : cur + k; fresh = false; }
    else if (k === '.') { if (fresh) { cur = '0.'; fresh = false; } else if (!cur.includes('.')) cur += '.'; }
    else if (k === 'C') { cur = '0'; prev = null; op = null; fresh = true; hist.textContent = ''; }
    else if (k === '⌫') { cur = cur.length > 1 ? cur.slice(0, -1) : '0'; }
    else if (k === '±') { cur = cur.startsWith('-') ? cur.slice(1) : cur === '0' ? cur : '-' + cur; }
    else if (k === '%') { cur = fmt(parseFloat(cur) / 100); }
    else if (k === '=') { if (op && prev !== null) { const r = calc(prev, parseFloat(cur), op); hist.textContent = `${fmt(prev)} ${op} ${cur} =`; cur = isNaN(r) ? 'Cannot divide by zero' : fmt(r); prev = null; op = null; fresh = true; } }
    else { if (op && prev !== null && !fresh) { const r = calc(prev, parseFloat(cur), op); prev = r; cur = fmt(r); } else prev = parseFloat(cur); op = k; fresh = true; hist.textContent = `${fmt(prev!)} ${op}`; }
    disp.textContent = cur;
  }
  const keys = ['%', 'C', '⌫', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '±', '0', '.', '='];
  const root = h('div', { class: 'ca', tabindex: '0', onkeydown: (e: KeyboardEvent) => { const m: Record<string, string> = { '*': '×', '/': '÷', '-': '−', Enter: '=', Backspace: '⌫', Escape: 'C' }; const k = m[e.key] || e.key; if (keys.includes(k)) { e.preventDefault(); press(k); } } }, hist, disp, h('div', { class: 'ca-g' }, keys.map(k => h('button', { class: /\d|\./.test(k) ? 'n' : k === '=' ? 'eq' : 'o', onclick: () => press(k) }, k)))); body.append(root);
  return { onFocus: () => root.focus() };
}
