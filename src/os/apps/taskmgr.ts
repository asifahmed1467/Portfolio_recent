// Task Manager: skills & tools as "processes" with animated CPU/RAM usage bars.
import { data } from '../data';
import { h, rnd, clamp } from '../util';
import { Avatar } from '../img';
import type { OS } from '../shell';
import type { Win } from '../wm';

export function build(body: HTMLElement, _win: Win, os: OS) {
  const rows = data.skills.map(s => ({ s, cpu: s.level / 4, mem: s.level * 6 + 40, pid: Math.floor(rnd(1000, 9999)) }));
  const cv = h('canvas', { class: 'tm-g', width: 720, height: 90 }) as HTMLCanvasElement; const g = cv.getContext('2d')!; const hist: number[] = Array(60).fill(20);
  const tbody = h('tbody', {}); const total = h('b', {}, '');
  body.append(h('div', { class: 'tm' }, h('div', { class: 'tm-top' }, h('div', {}, h('small', {}, 'CPU (curiosity)'), total), cv), h('table', { class: 'tm-t' }, h('thead', {}, h('tr', {}, ['Name', 'PID', 'Status', 'CPU', 'Memory', ''].map(t => h('th', {}, t)))), tbody)));
  const trs = rows.map(r => { const bar = h('i', {}), mb = h('i', {}); const tr = h('tr', {}, h('td', {}, r.s.name, h('small', {}, ' · ' + r.s.group)), h('td', {}, String(r.pid)), h('td', {}, 'Running'), h('td', {}, h('div', { class: 'tm-b' }, bar), h('span', {})), h('td', {}, h('div', { class: 'tm-b m' }, mb), h('span', {})), h('td', {}, h('button', { class: 'tm-end', onclick: () => os.notify('Task Manager', `Access denied: ${r.s.name} cannot be ended. It is part of the core system.`, '🛡️') }, 'End task'))); tbody.append(tr); return { r, bar, mb, tr }; });
  const tick = () => { let sum = 0; trs.forEach(({ r, bar, mb, tr }) => { r.cpu = clamp(r.cpu + rnd(-5, 5), 2, r.s.level); r.mem = clamp(r.mem + rnd(-20, 20), 60, r.s.level * 8 + 80); sum += r.cpu; bar.style.width = r.cpu + '%'; mb.style.width = r.mem / 8 + '%'; (tr.children[3].lastChild as HTMLElement).textContent = r.cpu.toFixed(1) + '%'; (tr.children[4].lastChild as HTMLElement).textContent = Math.round(r.mem) + ' MB'; });
    trs.sort((a, b) => b.r.cpu - a.r.cpu).forEach(t => tbody.append(t.tr)); const avg = sum / trs.length; total.textContent = avg.toFixed(0) + '%'; hist.push(avg * 2); hist.shift(); g.clearRect(0, 0, 720, 90); g.strokeStyle = 'rgba(0,120,212,.9)'; g.fillStyle = 'rgba(0,120,212,.18)'; g.lineWidth = 2; g.beginPath(); hist.forEach((v, i) => { const x = i / 59 * 720, y = 90 - clamp(v, 0, 100) * 0.9; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.lineTo(720, 90); g.lineTo(0, 90); g.fill(); };
  // ---- Users tab: your photo is the user icon ----
  const tm = body.querySelector('.tm') as HTMLElement, procViews = [tm.children[0] as HTMLElement, tm.children[1] as HTMLElement];
  const uCpu = h('td', {}, '0%'), uMem = h('td', {}, '0 MB');
  const users = h('div', { class: 'tm-users', style: { display: 'none' } }, h('table', { class: 'tm-t tm-ut' }, h('thead', {}, h('tr', {}, ['User', 'Status', 'CPU', 'Memory', 'Processes'].map(t => h('th', {}, t)))), h('tbody', {},
    h('tr', {}, h('td', {}, h('div', { class: 'tm-user' }, Avatar(36, { glow: true }), h('div', {}, h('b', {}, `${data.user} (Guest)`), h('small', {}, data.name)))), h('td', {}, 'Active'), uCpu, uMem, h('td', {}, String(rows.length) + ' skills')),
    h('tr', {}, h('td', {}, h('div', { class: 'tm-user' }, h('span', { class: 'avatar sys' }, '⚙️'), h('div', {}, h('b', {}, 'SYSTEM'), h('small', {}, 'Portfolio OS')))), h('td', {}, 'Running'), h('td', {}, '1.2%'), h('td', {}, '312 MB'), h('td', {}, '14'))))); tm.append(users);
  const tabs = h('div', { class: 'tm-tabs', role: 'tablist' }, ['Processes', 'Users'].map((t, i) => h('button', { role: 'tab', class: i ? '' : 'on', onclick: (e: Event) => { [...tabs.children].forEach((b, k) => b.classList.toggle('on', k === i)); procViews.forEach(v => v.style.display = i ? 'none' : ''); users.style.display = i ? '' : 'none'; void e; } }, t))); tm.prepend(tabs);
  tick(); const iv = setInterval(() => { tick(); uCpu.textContent = total.textContent || ''; uMem.textContent = Math.round(rows.reduce((a, r) => a + r.mem, 0) / 4) + ' MB'; }, 900); return { onClose: () => clearInterval(iv) };
}
