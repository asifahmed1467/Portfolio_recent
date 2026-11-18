// Windows-Terminal-style app: tabs, fake file system, typewriter output, history, Tab completion, Ctrl+C, easter eggs.
import { data, AppId } from '../data';
import { h, esc, sleep, rnd, pad } from '../util';
import * as FS from '../fs';
import { asciiLines } from '../ui/ascii';
import { best } from '../img';
import type { OS } from '../shell';
import type { Win } from '../wm';

const VER = 'Portfolio OS 11 [Version 11.0.2026.1118]';
const COLORS = ['#0c0c0c', '#0037da', '#13a10e', '#3a96dd', '#c50f1f', '#881798', '#c19c00', '#cccccc', '#767676', '#3b78ff', '#16c60c', '#61d6d6', '#e74856', '#b4009e', '#f9f1a5', '#f2f2f2'];
const k = (c: string, t: string) => `<span class="${c}">${t}</span>`;
const link = (u: string, t = u) => `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t)}</a>`;

class Sess {
  cwd = FS.HOME; hist: string[] = []; hi = 0; busy = false; abort = false; started = Date.now();
  el = h('div', { class: 'tsess' }); out = h('div', { class: 'tout' }); psEl = h('span', { class: 'tps' }); inp = h('input', { class: 'tin', spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off', 'aria-label': 'Terminal input' }) as HTMLInputElement;
  constructor(cwd?: string) { if (cwd) this.cwd = cwd; this.el.append(this.out, h('div', { class: 'tline' }, this.psEl, this.inp)); this.prompt(); this.el.addEventListener('mousedown', () => setTimeout(() => { if (!getSelection()?.toString()) this.inp.focus(); }, 0)); }
  prompt() { this.psEl.textContent = this.cwd + '>'; }
  line(html: string) { const d = h('div', { class: 'tl' }); d.innerHTML = html || '&nbsp;'; this.out.append(d); this.scroll(); return d; }
  scroll() { this.el.scrollTop = this.el.scrollHeight; }
  /** Print lines. Plain-text lines are "typed" char by char when `type` is true (Ctrl+C aborts). */
  async print(lines: string | string[], type = false, delay = 9) {
    for (const l of Array.isArray(lines) ? lines : [lines]) {
      if (this.abort) return;
      if (type && l && !/[<&]/.test(l)) { const d = this.line(''); d.textContent = ''; for (let i = 0; i < l.length && !this.abort; i += 3) { d.textContent = l.slice(0, i + 3); this.scroll(); await sleep(7); } d.textContent = l; }
      else { this.line(l); if (delay) await sleep(delay); }
    }
  }
}

export function build(body: HTMLElement, win: Win, os: OS, arg?: { cwd?: string; cmd?: string }) {
  const root = h('div', { class: 'term' }); const tabbar = h('div', { class: 'ttabs' }); const area = h('div', { class: 'tarea' }); root.append(tabbar, area); body.append(root);
  const sessions: Sess[] = []; let cur!: Sess; let tabN = 0;

  function newTab(cwd?: string, banner = true) {
    const s = new Sess(cwd); sessions.push(s); area.append(s.el); const btn = h('button', { class: 'ttab', role: 'tab' }); const label = h('span', {}, `Terminal ${++tabN}`); const x = h('i', { 'aria-label': 'Close tab', onclick: (e: Event) => { e.stopPropagation(); closeTab(s); } }, '✕'); btn.append(label, x); (s as any).btn = btn; (s as any).label = label;
    btn.addEventListener('click', () => select(s)); tabbar.insertBefore(btn, plus); select(s); wire(s);
    if (banner) s.print([VER, `(c) ${data.name}. Type 'help' to see what I can do.`, ''], true); return s;
  }
  function select(s: Sess) { cur = s; sessions.forEach(x => { x.el.style.display = x === s ? '' : 'none'; (x as any).btn.classList.toggle('on', x === s); }); s.inp.focus(); s.scroll(); }
  function closeTab(s: Sess) { if (sessions.length === 1) { os.wm.close(win); return; } const i = sessions.indexOf(s); sessions.splice(i, 1); s.el.remove(); (s as any).btn.remove(); if (cur === s) select(sessions[Math.max(0, i - 1)]); }
  const plus = h('button', { class: 'ttab plus', 'aria-label': 'New tab', onclick: () => newTab(cur.cwd) }, '＋'); tabbar.append(plus, h('span', { class: 'tgrow' }));

  // ----- command table -----
  type Cmd = (a: string[], s: Sess, raw: string) => Promise<void> | void;
  const HELP: [string, string][] = [['help', 'Lists all commands'], ['about', 'Prints my bio'], ['skills', 'Skill bars as ASCII'], ['projects', 'Lists projects (open <project> opens it)'], ['experience', 'Where I work'], ['education', 'Degrees & grades'], ['contact', 'Email, GitHub, LinkedIn'], ['resume', 'Downloads my CV (also: download resume)'],
    ['dir / ls', 'List files'], ['cd <dir>', 'Change directory'], ['type / cat <file>', 'Show file contents'], ['tree', 'Directory tree'], ['echo <text>', 'Print text'], ['cls / clear', 'Clear screen'], ['date · time', 'Current date / time'], ['whoami · hostname · ver', 'System identity'], ['ipconfig · ping <host>', 'Network (fake)'], ['color <bf>', 'Change terminal colors (color alone resets)'],
    ['neofetch', 'System info with my photo as ASCII art'], ['photo [ascii [1-' + data.photos.length + ']]', 'Open the Photos app, or print a photo as ASCII art'], ['theme dark|light', 'Switch the desktop theme'], ['start <app>', 'Launch an app (explorer, browser, mail, settings, taskmgr, photos, notepad, calc, snake, invaders, ailab)'], ['quantize <fp16|int8|int4|int2>', 'Memory for a 7B model'], ['exit', 'Close this tab'], ['…', 'There are a few secrets. Try sudo, hack, matrix, coffee…']];
  const cmds: Record<string, Cmd> = {
    help: async (_a, s) => { await s.print(['For more info on a command, just ask. Available commands:', '', ...HELP.map(([c, d]) => '  ' + k('c1', c.padEnd(32)) + k('dim', d))], false, 14); },
    about: (_a, s) => s.print(data.bio, true),
    skills: async (_a, s) => { const groups = [...new Set(data.skills.map(x => x.group))]; const out: string[] = []; groups.forEach(g => { out.push(k('c2', g)); data.skills.filter(x => x.group === g).forEach(x => { const f = Math.round(x.level / 5); out.push('  ' + x.name.padEnd(26) + k('c3', '[' + '█'.repeat(f)) + k('dim', '░'.repeat(20 - f)) + k('c3', ']') + ' ' + x.level + '%'); }); out.push(''); }); await s.print(out, false, 14); },
    projects: async (_a, s) => { await s.print([k('c2', 'Projects') + k('dim', '   (type: open <project>)'), '', ...data.projects.map((p, i) => `  ${k('c1', String(i + 1).padStart(2))}. ${k('c3', p.slug.padEnd(36))} ${k('dim', p.stack.join(', '))}`)], false, 22); },
    open: async (a, s) => { const q = a.join(' ').toLowerCase(); if (!q) { await s.print('Usage: open <project>   (try: projects)'); return; } const p = data.projects.find(x => x.slug === q || x.title.toLowerCase().includes(q) || x.slug.includes(q) || String(data.projects.indexOf(x) + 1) === q); if (!p) { await s.print(k('err', `Project '${esc(q)}' not found.`) + ' Type projects to list them.'); return; } await s.print(`Opening ${p.title}...`); os.openApp('explorer', { path: 'C:\\Users\\Guest\\Projects\\' + p.slug }); },
    experience: async (_a, s) => { for (const e of data.experience) await s.print([k('c2', e.title) + k('dim', '  (' + e.when + ')'), ...e.points.map(p => '  • ' + p), ''], false, 20); },
    education: async (_a, s) => { for (const e of data.education) await s.print([k('c2', e.title) + k('dim', '  (' + e.when + ')'), ...e.points.map(p => '  • ' + p), ''], false, 20); },
    contact: async (_a, s) => { await s.print([k('c2', 'Contact'), `  Email    : ${link('mailto:' + data.email, data.email)}`, `  GitHub   : ${link(data.github)}`, `  LinkedIn : ${link(data.linkedin)}`, `  Location : ${esc(data.location)}`], false, 40); },
    resume: async (_a, s) => { await s.print(['Preparing Resume.pdf ...']); const bar = s.line(''); for (let i = 0; i <= 10; i++) { bar.textContent = `[${'█'.repeat(i)}${'░'.repeat(10 - i)}] ${i * 10}%`; await sleep(60); } const mod = await import('./resume'); const ok = mod.download(); os.openApp('resume'); await s.print(ok ? k('ok', 'Download started: Resume.pdf') : k('dim', 'Download is blocked in this preview (it works on the hosted site). Opened the viewer instead.')); },
    download: async (a, s, raw) => { if ((a[0] || '').toLowerCase() === 'resume') return cmds.resume([], s, raw); await s.print('Usage: download resume'); },
    dir: async (a, s) => { const r = FS.resolve(s.cwd, a[0] || '.'); if (!r.node || !r.node.dir) { await s.print(k('err', 'File Not Found')); return; } const kids = FS.list(r.node); const now = new Date(); const d = `${pad(now.getMonth() + 1)}/${pad(now.getDate())}/${now.getFullYear()}  ${pad(now.getHours() % 12 || 12)}:${pad(now.getMinutes())} ${now.getHours() < 12 ? 'AM' : 'PM'}`; let files = 0, dirs = 0, bytes = 0;
      const rows = kids.map(c => { if (c.dir) { dirs++; return `${d}    ${k('c2', '&lt;DIR&gt;').padEnd(0)}          ${k('c2', esc(c.name))}`; } files++; const sz = (c.content || '').length || 1024; bytes += sz; return `${d}    ${String(sz.toLocaleString()).padStart(14)} ${esc(c.name)}`; });
      await s.print([' Volume in drive C is ASIF-RIG', ` Directory of ${r.path}`, '', `${d}    ${k('c2', '&lt;DIR&gt;')}          .`, `${d}    ${k('c2', '&lt;DIR&gt;')}          ..`, ...rows, `${String(files).padStart(15)} File(s) ${bytes.toLocaleString().padStart(12)} bytes`, `${String(dirs + 2).padStart(15)} Dir(s)  42,000,000,000 bytes free`], false, 8); },
    cd: async (a, s) => { if (!a.length) { await s.print(s.cwd); return; } const r = FS.resolve(s.cwd, a.join(' ')); if (!r.node || !r.node.dir) { await s.print('The system cannot find the path specified.'); return; } s.cwd = r.parts.length === 1 ? 'C:\\' : r.parts.join('\\'); s.prompt(); },
    type: async (a, s) => { const r = FS.resolve(s.cwd, a.join(' ')); if (!a.length) { await s.print('The syntax of the command is incorrect.'); return; } if (!r.node) { await s.print(`The system cannot find the file specified: ${esc(a.join(' '))}`); return; } if (r.node.dir) { await s.print('Access is denied.'); return; } const n = r.node; if (n.kind === 'pdf') await s.print(['This is a PDF. Run ' + k('c1', 'resume') + ' to open it.']); else if (n.kind === 'img' || n.kind === 'exe') await s.print(n.kind === 'exe' ? (n.content || 'This is a program. Try: start ' + (n.app || '')) : '[binary image data. Open it in File Explorer]'); else await s.print((n.content || '').split('\n').map(esc), false, 10); },
    echo: (a, s) => s.print(esc(a.join(' ') || 'ECHO is on.')),
    cls: (_a, s) => { s.out.innerHTML = ''; }, date: (_a, s) => s.print('The current date is: ' + new Date().toLocaleDateString([], { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' })), time: (_a, s) => s.print('The current time is: ' + new Date().toLocaleTimeString()),
    whoami: (_a, s) => s.print('asif-rig\\guest'), hostname: (_a, s) => s.print(data.specs.device), ver: (_a, s) => s.print(['', VER, '']),
    ipconfig: async (_a, s) => { await s.print(['', 'Portfolio OS IP Configuration', '', 'Wireless LAN adapter Wi-Fi:', '', '   Connection-specific DNS Suffix  . : local', '   IPv4 Address. . . . . . . . . . . : 192.168.0.42', '   Subnet Mask . . . . . . . . . . . : 255.255.255.0', '   Default Gateway . . . . . . . . . : 192.168.0.1', ''], false, 25); },
    ping: async (a, s) => { const host = a[0] || ''; if (!host) { await s.print('Usage: ping <host>'); return; } const ip = host === 'localhost' ? '127.0.0.1' : '142.250.' + Math.floor(rnd(1, 254)) + '.' + Math.floor(rnd(1, 254)); await s.print(`Pinging ${esc(host)} [${ip}] with 32 bytes of data:`); for (let i = 0; i < 4 && !s.abort; i++) { await sleep(450); await s.print(`Reply from ${ip}: bytes=32 time=${Math.floor(rnd(8, 40))}ms TTL=${host === 'localhost' ? 128 : 57}`, false, 0); } await s.print(['', `Ping statistics for ${ip}:`, '    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)']); },
    tree: async (_a, s) => { const r = FS.resolve(s.cwd, '.'); await s.print(['Folder PATH listing', r.path, ...FS.tree(r.node!).map(esc)], false, 6); },
    color: (a, s) => { const v = (a[0] || '').toLowerCase(); if (!v) { s.el.style.removeProperty('--tbg'); s.el.style.removeProperty('--tfg'); return; } if (!/^[0-9a-f]{1,2}$/.test(v)) return s.print('Invalid argument. Usage: color bf  (bg digit, fg digit; 0-9, a-f)'); const bg = v.length === 2 ? parseInt(v[0], 16) : 0, fg = parseInt(v[v.length - 1], 16); if (bg === fg) return s.print('Background and foreground cannot be the same.'); s.el.style.setProperty('--tbg', COLORS[bg]); s.el.style.setProperty('--tfg', COLORS[fg]); },
    neofetch: async (_a, s) => { const sp = data.specs; const up = Math.floor((Date.now() - s.started) / 1000); const p = best(); let L: string[];
      try { if (!p) throw 0; L = (await asciiLines(p, 30, 15)).map(l => k('c3', esc(l))); } catch { L = ['      ┌──────────────────┐', '      │ ░  A S I F  R I G ░ │', '      └──────────────────┘'].map(l => k('c3', esc(l))); }
      const I = [k('c2', 'asif') + '@' + k('c2', sp.device), '-------------------------', k('c1', 'OS') + ': ' + sp.os, k('c1', 'Host') + ': ' + data.name + ' (' + data.role + ')', k('c1', 'CPU') + ': ' + sp.cpu, k('c1', 'GPU') + ': ' + sp.gpu, k('c1', 'RAM') + ': ' + sp.ram, k('c1', 'Disk') + ': ' + sp.storage, k('c1', 'Uptime') + ': ' + Math.floor(up / 60) + ' min ' + (up % 60) + ' s', k('c1', 'Shell') + ': portfolio-terminal', '', k('dim', 'Tip: type `photo ascii` for a bigger portrait')];
      await s.print(Array.from({ length: Math.max(L.length, I.length) }, (_, i) => (L[i] || ' '.repeat(30)) + '  ' + (I[i] || '')).concat(['', COLORS.slice(0, 8).map(c => `<span style="background:${c}">   </span>`).join('') + COLORS.slice(8).map(c => `<span style="background:${c}">   </span>`).join('')]), false, 30); },
    photo: async (a, s) => {
      if ((a[0] || '').toLowerCase() === 'ascii') { const n = Math.max(1, Math.min(data.photos.length, parseInt(a[1] || '') || data.photos.findIndex(p => p.best) + 1 || 1)); const p = data.photos[n - 1]; await s.print(k('dim', `Rendering ${p.file} as ASCII...`)); try { const L = await asciiLines(p, 72, Math.round(72 * 0.5 * 1.15)); await s.print(L.map(l => k('c3', esc(l))), false, 12); await s.print(['', k('c1', p.caption) + k('dim', `  (photo ${n}/${data.photos.length}; try: photo ascii 1..${data.photos.length})`)]); } catch { await s.print(k('err', 'Could not read the image pixels.')); } return; }
      await s.print('Opening Photos...'); os.openApp('photos'); },
    theme: async (a, s) => { const t = (a[0] || '').toLowerCase(); if (t !== 'dark' && t !== 'light') { await s.print('Usage: theme dark|light'); return; } os.S.theme = t; os.apply(); await s.print('Theme set to ' + t + '.'); },
    start: async (a, s) => { const alias: Record<string, AppId> = { explorer: 'explorer', files: 'explorer', browser: 'browser', edge: 'browser', notepad: 'notepad', settings: 'settings', taskmgr: 'taskmgr', taskmanager: 'taskmgr', photos: 'photos', about: 'about', me: 'about', mail: 'mail', calc: 'calc', calculator: 'calc', snake: 'snake', invaders: 'invaders', game: 'invaders', ailab: 'ailab', lab: 'ailab', terminal: 'terminal', resume: 'resume' }; const id = alias[(a[0] || '').toLowerCase()]; if (!id) { await s.print('Usage: start <app>   (' + Object.keys(alias).join(', ') + ')'); return; } await s.print('Starting ' + id + '...'); os.openApp(id); },
    quantize: async (a, s) => { const b = ({ fp16: 16, int8: 8, int4: 4, int2: 2 } as any)[(a[0] || '').toLowerCase()]; if (!b) { await s.print('Usage: quantize <fp16|int8|int4|int2>'); return; } await s.print(`Quantizing a 7B model to ${a[0].toUpperCase()}...`); await s.print([`  weights: ${(7 * 2).toFixed(1)} GB -> ${k('ok', (7 * b / 8).toFixed(1) + ' GB')}  (${Math.round((1 - b / 16) * 100)}% smaller)`, k('dim', '  (weights only; my thesis studies what this does to Bangla script)')]); },
    exit: (_a, s) => closeTab(s),
    // ----- easter eggs -----
    sudo: async (a, s) => { if (a.join(' ') === 'hire-me') await s.print(['[sudo] password for recruiter: ********', k('ok', 'permission granted'), `Best path: ${link('mailto:' + data.email, data.email)} 😄`]); else await s.print(k('err', 'asif is not in the sudoers file. This incident will be reported.')); },
    hack: async (_a, s) => { await s.print([k('ok', 'Initializing hack sequence...')]); const hex = () => Array.from({ length: 8 }, () => Math.floor(Math.random() * 65536).toString(16).padStart(4, '0')).join(' '); for (let i = 0; i < 14 && !s.abort; i++) { await s.print(k('ok', hex()), false, 70); } await s.print([k('ok', 'ACCESS GRANTED'), 'Just kidding. I am a portfolio. The only thing you broke into is my skills list. 😎']); },
    matrix: async (_a, s) => { const c = h('canvas', { class: 'tmx' }) as HTMLCanvasElement; area.append(c); c.width = area.clientWidth; c.height = area.clientHeight; const g = c.getContext('2d')!; const cols = Math.floor(c.width / 14), drops = Array.from({ length: cols }, () => Math.random() * -30); const t0 = performance.now(); let done = false; const stop = () => { done = true; }; c.addEventListener('click', stop); s.inp.addEventListener('keydown', stop, { once: true });
      await new Promise<void>(res => { const f = () => { g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#22ff66'; g.font = '14px monospace'; drops.forEach((y, i) => { g.fillText(String.fromCharCode(0x30a0 + Math.random() * 90), i * 14, y * 14); drops[i] = y * 14 > c.height && Math.random() > 0.975 ? 0 : y + 1; }); if (!done && performance.now() - t0 < 5000 && !s.abort) requestAnimationFrame(f); else res(); }; f(); }); c.remove(); await s.print('Wake up, ' + data.user + '...'); },
    rm: async (a, s) => { if (a.join(' ').includes('-rf') && a.includes('/')) { await s.print([k('err', 'Access is denied.'), 'Nice try. 🛡️ Windows Defender has been notified (and so has my coffee).']); os.notify('Windows Defender', 'Blocked a destructive command: rm -rf /', '🛡️'); } else await s.print(`'rm' is not recognized... but I like your style. Try: rm -rf /`); },
    coffee: async (_a, s) => { await s.print(['', k('c3', '      ( (  '), k('c3', '       ) ) '), k('c1', '    ........ '), k('c1', '    |      |]'), k('c1', '    \\      / '), k('c1', "     `----'  "), '', 'Brewing... ' + k('dim', 'HTTP 418: I am a teapot, but fine, here is a coffee. ☕')], false, 90); },
    bsod: () => os.bsod(), crash: () => os.bsod()
  };
  const aliases: Record<string, string> = { ls: 'dir', cat: 'type', clear: 'cls', '?': 'help' };

  async function run(s: Sess, raw: string) {
    s.line(k('tps', esc(s.cwd + '>')) + ' ' + esc(raw)); const cmd = raw.trim(); if (!cmd) return; s.hist.push(cmd); s.hi = s.hist.length;
    const [n0, ...args] = cmd.split(/\s+/); let name = n0.toLowerCase(); name = aliases[name] || name; const f = cmds[name]; s.busy = true; s.abort = false; s.inp.disabled = true;
    try { if (f) await f(args, s, cmd); else await s.print(`'${esc(n0)}' is not recognized as an internal or external command, operable program or batch file.`); } catch (e: any) { await s.print(k('err', 'Error: ' + esc(String(e && e.message || e)))); }
    s.busy = false; s.inp.disabled = false; s.prompt(); s.inp.focus(); s.line(''); (s as any).label.textContent = s.cwd.split('\\').pop() || 'C:'; s.scroll();
  }
  function complete(s: Sess) {
    const v = s.inp.value; const parts = v.split(/\s+/); const last = parts[parts.length - 1]; let pool: string[];
    if (parts.length === 1) pool = [...Object.keys(cmds), ...Object.keys(aliases)]; else { const i = Math.max(last.lastIndexOf('\\'), last.lastIndexOf('/')); const base = i >= 0 ? last.slice(0, i + 1) : ''; const r = FS.resolve(s.cwd, base || '.'); pool = r.node?.dir ? FS.list(r.node).map(c => base + c.name + (c.dir ? '\\' : '')) : []; if (parts[0] === 'open') pool = data.projects.map(p => p.slug); if (parts[0] === 'start') pool = ['explorer', 'browser', 'notepad', 'settings', 'taskmgr', 'photos', 'mail', 'calc', 'snake', 'invaders', 'ailab']; }
    const m = pool.filter(c => c.toLowerCase().startsWith(last.toLowerCase())); if (m.length === 1) { parts[parts.length - 1] = m[0]; s.inp.value = parts.join(' ') + (m[0].endsWith('\\') ? '' : ' '); } else if (m.length > 1) { s.line(k('dim', m.map(esc).join('   '))); let p = m[0]; m.forEach(x => { while (!x.toLowerCase().startsWith(p.toLowerCase())) p = p.slice(0, -1); }); if (p.length > last.length) { parts[parts.length - 1] = p; s.inp.value = parts.join(' '); } }
  }
  function wire(s: Sess) {
    s.inp.addEventListener('keydown', e => {
      e.stopPropagation(); (window as any).__sfx?.click?.(0.03);
      if (e.key === 'Enter') { const v = s.inp.value; s.inp.value = ''; run(s, v); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (s.hi > 0) s.inp.value = s.hist[--s.hi]; }
      else if (e.key === 'ArrowDown') { e.preventDefault(); if (s.hi < s.hist.length - 1) s.inp.value = s.hist[++s.hi]; else { s.hi = s.hist.length; s.inp.value = ''; } }
      else if (e.key === 'Tab') { e.preventDefault(); complete(s); }
      else if (e.key.toLowerCase() === 'l' && e.ctrlKey) { e.preventDefault(); s.out.innerHTML = ''; }
      else if (e.key.toLowerCase() === 'c' && e.ctrlKey && !getSelection()?.toString()) { e.preventDefault(); s.abort = true; s.line(k('dim', esc(s.cwd + '> ') + s.inp.value + '^C')); s.inp.value = ''; }
    });
    // Ctrl+C must also work while a command is running (input is disabled then)
    s.el.addEventListener('keydown', e => { if (s.busy && e.ctrlKey && e.key.toLowerCase() === 'c') { s.abort = true; s.line(k('dim', '^C')); } });
    s.el.tabIndex = -1;
  }

  const first = newTab(arg?.cwd); if (arg?.cmd) setTimeout(() => run(first, arg.cmd!), 400);
  return { onFocus: () => cur?.inp.focus(), onArg: (a: any) => { if (a?.cmd) run(cur, a.cmd); } };
}
