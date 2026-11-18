// Small DOM + storage helpers shared by every module.
export const $ = (s: string, r: ParentNode = document) => r.querySelector(s) as HTMLElement;
export const $$ = (s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as HTMLElement[];
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const rnd = (a: number, b: number) => a + Math.random() * (b - a);
export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/** Tiny hyperscript: h('div', {class:'x', onclick:fn, style:{...}}, child, 'text') */
export function h(tag: string, props: any = {}, ...kids: any[]): HTMLElement {
  const el = document.createElement(tag);
  for (const k in props || {}) {
    const v = props[k]; if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style') { if (typeof v === 'string') el.setAttribute('style', v); else for (const sk in v) { if (sk.startsWith('--')) el.style.setProperty(sk, String(v[sk])); else (el.style as any)[sk] = v[sk]; } }
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  const add = (c: any) => { if (c == null || c === false) return; if (Array.isArray(c)) c.forEach(add); else el.append(c.nodeType ? c : document.createTextNode(String(c))); };
  kids.forEach(add); return el;
}

export const store = {
  get<T>(k: string, d: T): T { try { const v = localStorage.getItem('os.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k: string, v: any) { try { localStorage.setItem('os.' + k, JSON.stringify(v)); } catch { /* storage may be unavailable */ } }
};

/** Sound shim: the 3D scene exposes window.__sfx (synth sounds, no assets). */
export const sfx = {
  click: () => (window as any).__sfx?.uiClick?.(), chime: () => (window as any).__sfx?.chime?.(), notify: () => (window as any).__sfx?.notify?.(), error: () => (window as any).__sfx?.error?.(),
  toggle: () => (window as any).__sfx?.toggle?.() ?? true, setVolume: (v: number) => (window as any).__sfx?.setVolume?.(v)
};

/** Colorful app/file tile: emoji on a gradient square, Windows-11-ish. */
export function tile(emoji: string, c1 = '#3b82f6', c2 = '#1d4ed8', size = 40): HTMLElement {
  return h('div', { class: 'tile', style: { width: size + 'px', height: size + 'px', fontSize: size * 0.55 + 'px', background: `linear-gradient(135deg,${c1},${c2})` } }, emoji);
}
export const pad = (n: number) => String(n).padStart(2, '0');
