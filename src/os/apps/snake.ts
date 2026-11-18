// Snake (bonus app). Arrow keys / WASD. Pauses when the window loses focus.
import { h } from '../util';
import type { OS } from '../shell';
import type { Win } from '../wm';

export function build(body: HTMLElement, _win: Win, os: OS) {
  const N = 20, S = 22; const cv = h('canvas', { class: 'sn-c', width: N * S, height: N * S, tabindex: '0' }) as HTMLCanvasElement; const g = cv.getContext('2d')!; const sc = h('div', { class: 'sn-s' }, 'Score 0'); body.append(h('div', { class: 'sn' }, sc, cv, h('small', {}, 'Arrow keys or WASD · Space to start')));
  let snake: { x: number; y: number }[], dir: { x: number; y: number }, next: { x: number; y: number }, food: { x: number; y: number }, score = 0, state = 'ready', timer = 0, active = true;
  const reset = () => { snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]; dir = next = { x: 1, y: 0 }; score = 0; spawn(); sc.textContent = 'Score 0'; };
  const spawn = () => { do { food = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) }; } while (snake.some(s => s.x === food.x && s.y === food.y)); };
  const draw = () => { g.fillStyle = '#0b1020'; g.fillRect(0, 0, N * S, N * S); g.fillStyle = '#ef4444'; g.beginPath(); g.arc(food.x * S + S / 2, food.y * S + S / 2, S / 2 - 3, 0, 7); g.fill(); snake.forEach((s, i) => { g.fillStyle = i ? '#22c55e' : '#86efac'; g.beginPath(); g.roundRect(s.x * S + 1, s.y * S + 1, S - 2, S - 2, 5); g.fill(); }); if (state !== 'play') { g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 0, N * S, N * S); g.fillStyle = '#fff'; g.font = '700 22px Inter, sans-serif'; g.textAlign = 'center'; g.fillText(state === 'over' ? `Game over: ${score}` : state === 'pause' ? 'Paused' : 'Press Space', N * S / 2, N * S / 2); } };
  const step = () => { if (state !== 'play') return; dir = next; const hd = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }; if (hd.x < 0 || hd.y < 0 || hd.x >= N || hd.y >= N || snake.some(s => s.x === hd.x && s.y === hd.y)) { state = 'over'; os.notify('Snake', `Game over. Score: ${score}`, '🐍'); draw(); return; } snake.unshift(hd); if (hd.x === food.x && hd.y === food.y) { score += 10; sc.textContent = 'Score ' + score; spawn(); } else snake.pop(); draw(); };
  cv.addEventListener('keydown', e => { const m: Record<string, [number, number]> = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] }; const d = m[e.key] || m[e.key.toLowerCase()]; if (d) { e.preventDefault(); if (d[0] !== -dir.x || d[1] !== -dir.y) next = { x: d[0], y: d[1] }; } if (e.key === ' ') { e.preventDefault(); if (state !== 'play') { if (state !== 'pause') reset(); state = 'play'; } else state = 'pause'; draw(); } });
  reset(); draw(); timer = window.setInterval(() => active && step(), 110);
  return { onFocus: () => { active = true; cv.focus(); }, onBlur: () => { active = false; if (state === 'play') { state = 'pause'; draw(); } }, onClose: () => clearInterval(timer) };
}
