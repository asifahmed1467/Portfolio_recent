// QUANT INVADERS: each hit "quantizes" an enemy (FP32 -> FP16 -> INT8 -> INT4 -> gone).
// FIX: the old formation re-flipped direction every frame at a wall (nudge < overshoot) and plunged down. Now the formation
// is clamped back inside and flips exactly once; the loop also uses a fixed time step so slow frames don't change the physics.
import { h } from '../util';
import type { OS } from '../shell';
import type { Win } from '../wm';

export function build(body: HTMLElement, _win: Win, os: OS) {
  const W = 880, H = 500; const cvs = h('canvas', { class: 'iv-c', width: W, height: H, tabindex: '0' }) as HTMLCanvasElement; const g = cvs.getContext('2d')!; body.append(h('div', { class: 'iv' }, cvs, h('small', {}, '← → / A D move · Space shoot · catch LoRA for triple shot · dodge NaN')));
  const LV: [string, string, number][] = [['FP32', '#ff3d9a', 34], ['FP16', '#fb923c', 30], ['INT8', '#22d3ee', 26], ['INT4', '#4ade80', 22]];
  const MONO = '700 14px "JetBrains Mono", Consolas, monospace';
  let state = 'ready', keys: Record<string, boolean> = {}, active = false, raf = 0, last = 0, acc = 0, hs = 0; try { hs = +(localStorage.getItem('qi_hs') || 0); } catch { /* storage unavailable */ }
  let P = { x: W / 2, y: H - 40 }, bullets: any[] = [], enemies: any[] = [], bombs: any[] = [], pups: any[] = [], parts: any[] = [], score = 0, lives = 3, wave = 1, dir = 1, speed = 40, fireT = 0, bombT = 1.5, lora = 0, inv = 0, flash = 0, msgT = 0;
  const stars = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 0.3 + Math.random() * 1.4 }));
  function spawnWave() { enemies = []; const rows = Math.min(5, 3 + (wave >> 1)); for (let r = 0; r < rows; r++) for (let c = 0; c < 8; c++) enemies.push({ x: 150 + c * 76, y: 70 + r * 52, lvl: r === 0 ? 0 : r === 1 ? 1 : 2 }); dir = 1; speed = 36 + wave * 8; msgT = 1.6; }
  function reset() { P = { x: W / 2, y: H - 40 }; bullets = []; bombs = []; pups = []; parts = []; score = 0; lives = 3; wave = 1; fireT = 0; bombT = 1.5; lora = 0; inv = 0; flash = 0; spawnWave(); }
  const end = () => { state = 'over'; try { if (score > hs) { hs = score; localStorage.setItem('qi_hs', String(hs)); } } catch { /* ignore */ } };
  const burst = (x: number, y: number, c: string, n = 14) => { for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - .5) * 260, vy: (Math.random() - .5) * 260, t: .5 + Math.random() * .4, c }); };
  reset();
  function update(dt: number) {
    stars.forEach(s => { s.y += s.s * 30 * dt; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } }); parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt; }); parts = parts.filter(p => p.t > 0);
    if (state !== 'play') return; msgT -= dt; inv = Math.max(0, inv - dt); lora = Math.max(0, lora - dt); flash = Math.max(0, flash - dt);
    const mv = (keys.ArrowLeft || keys.a ? -1 : 0) + (keys.ArrowRight || keys.d ? 1 : 0); P.x = Math.max(24, Math.min(W - 24, P.x + mv * 400 * dt));
    fireT -= dt; if ((keys[' '] || keys.ArrowUp || keys.w) && fireT <= 0) { fireT = .2; bullets.push({ x: P.x, y: P.y - 16, vx: 0 }); if (lora > 0) { bullets.push({ x: P.x - 10, y: P.y - 12, vx: -90 }, { x: P.x + 10, y: P.y - 12, vx: 90 }); } (window as any).__sfx?.click?.(.05); }
    bullets.forEach(b => { b.y -= 600 * dt; b.x += b.vx * dt; }); bullets = bullets.filter(b => b.y > -10);
    const sp = speed * (1 + (40 - enemies.length) / 40 * 1.2); let minX = 1e9, maxX = -1e9; enemies.forEach(e => { e.x += dir * sp * dt; minX = Math.min(minX, e.x); maxX = Math.max(maxX, e.x); });
    if ((dir > 0 && maxX > W - 40) || (dir < 0 && minX < 40)) { const over = dir > 0 ? maxX - (W - 40) : 40 - minX; enemies.forEach(e => { e.x -= dir * over; e.y += 16; }); dir *= -1; }
    bombT -= dt; if (bombT <= 0 && enemies.length) { bombT = Math.max(.35, 1.3 - wave * .1) * (.6 + Math.random() * .8); const e = enemies[(Math.random() * enemies.length) | 0]; bombs.push({ x: e.x, y: e.y + 12 }); }
    bombs.forEach(b => b.y += (170 + wave * 12) * dt); pups.forEach(p => p.y += 110 * dt);
    for (const b of bullets) for (const e of enemies) if (!b.dead && Math.abs(b.x - e.x) < LV[Math.min(3, e.lvl)][2] * .55 + 4 && Math.abs(b.y - e.y) < 18) { b.dead = true; e.lvl++; burst(e.x, e.y, LV[Math.min(3, e.lvl)][1], 6); if (e.lvl > 3) { e.dead = true; score += 30; burst(e.x, e.y, '#fff', 16); if (Math.random() < .13) pups.push({ x: e.x, y: e.y }); } else score += 5; }
    bullets = bullets.filter(b => !b.dead); enemies = enemies.filter(e => !e.dead);
    const hit = (o: any, r: number) => Math.abs(o.x - P.x) < r && Math.abs(o.y - P.y) < 18;
    bombs = bombs.filter(b => { if (inv <= 0 && hit(b, 18)) { lives--; inv = 1.4; flash = .3; burst(P.x, P.y, '#ff4d4d', 22); if (lives <= 0) end(); return false; } return b.y < H + 10; });
    pups = pups.filter(p => { if (hit(p, 24)) { lora = 9; score += 50; burst(p.x, p.y, '#a855f7', 14); return false; } return p.y < H + 10; });
    if (enemies.some(e => e.y > H - 90)) { lives = 0; end(); } if (!enemies.length) { wave++; score += 100; spawnWave(); }
  }
  const txt = (t: string, x: number, y: number, sz: number, col: string, al: CanvasTextAlign = 'center', w = '800') => { g.font = `${w} ${sz}px Inter, sans-serif`; g.textAlign = al; g.fillStyle = col; g.fillText(t, x, y); };
  function draw() {
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0a0620'); bg.addColorStop(1, '#05121c'); g.fillStyle = bg; g.fillRect(0, 0, W, H); stars.forEach(s => { g.fillStyle = `rgba(200,190,255,${.2 + s.s * .3})`; g.fillRect(s.x, s.y, s.s + .5, s.s + .5); });
    enemies.forEach(e => { const [lab, col, w] = LV[Math.min(3, e.lvl)]; g.shadowColor = col; g.shadowBlur = 14; g.fillStyle = col + '33'; g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.roundRect(e.x - w / 2 - 6, e.y - 14, w + 12, 28, 6); g.fill(); g.stroke(); g.shadowBlur = 0; g.font = MONO; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(lab, e.x, e.y + 5); });
    g.shadowBlur = 10; bullets.forEach(b => { g.shadowColor = '#22d3ee'; g.fillStyle = '#a5f3fc'; g.fillRect(b.x - 2, b.y - 8, 4, 14); }); g.shadowBlur = 0;
    bombs.forEach(b => { g.font = MONO; g.textAlign = 'center'; g.fillStyle = '#ff5c5c'; g.fillText('NaN', b.x, b.y); });
    pups.forEach(p => { g.fillStyle = '#7c3aed'; g.shadowColor = '#a855f7'; g.shadowBlur = 16; g.beginPath(); g.roundRect(p.x - 22, p.y - 11, 44, 22, 11); g.fill(); g.shadowBlur = 0; txt('LoRA', p.x, p.y + 4, 12, '#fff', 'center', '700'); });
    if (state !== 'over' && (inv <= 0 || ((inv * 10) | 0) % 2)) { g.shadowColor = '#22d3ee'; g.shadowBlur = 18; g.fillStyle = '#22d3ee'; g.beginPath(); g.moveTo(P.x, P.y - 18); g.lineTo(P.x + 18, P.y + 14); g.lineTo(P.x, P.y + 7); g.lineTo(P.x - 18, P.y + 14); g.closePath(); g.fill(); g.shadowBlur = 0; }
    parts.forEach(p => { g.globalAlpha = Math.max(0, p.t * 1.6); g.fillStyle = p.c; g.fillRect(p.x, p.y, 3, 3); }); g.globalAlpha = 1; if (flash > 0) { g.fillStyle = `rgba(255,60,60,${flash})`; g.fillRect(0, 0, W, H); }
    g.fillStyle = 'rgba(10,6,30,.65)'; g.fillRect(0, 0, W, 34); txt('SCORE ' + String(score).padStart(5, '0'), 14, 23, 15, '#fff', 'left'); txt('WAVE ' + wave, W / 2, 23, 15, '#22d3ee'); txt('♥'.repeat(Math.max(0, lives)) + '   BEST ' + hs, W - 14, 23, 15, '#ff3d9a', 'right');
    if (lora > 0) { g.fillStyle = '#a855f7'; g.fillRect(0, 34, W * lora / 9, 3); }
    if (state === 'play' && msgT > 0) txt('WAVE ' + wave, W / 2, H / 2, 40, `rgba(255,255,255,${Math.min(1, msgT)})`);
    if (state === 'ready') { g.fillStyle = 'rgba(5,3,15,.72)'; g.fillRect(0, 34, W, H); txt('QUANT INVADERS', W / 2, 170, 46, '#fff'); txt('Shoot the weights. Every hit quantizes them: FP32 → FP16 → INT8 → INT4 → gone.', W / 2, 215, 15, '#c4b5fd', 'center', '500'); txt('← → / A D move · SPACE shoot · catch LoRA for triple shot · dodge NaN', W / 2, 245, 14, '#9a93c4', 'center', '500'); txt(((Date.now() / 500) | 0) % 2 ? '▶ PRESS SPACE TO START' : '', W / 2, 320, 22, '#22d3ee'); }
    if (state === 'over') { g.fillStyle = 'rgba(20,3,10,.78)'; g.fillRect(0, 34, W, H); txt('MODEL DIVERGED', W / 2, 180, 44, '#ff3d9a'); txt('loss = NaN', W / 2, 220, 18, '#fca5a5', 'center', '500'); txt('SCORE ' + score + '   ·   BEST ' + hs, W / 2, 270, 22, '#fff'); txt(((Date.now() / 500) | 0) % 2 ? 'SPACE TO RETRAIN' : '', W / 2, 330, 20, '#22d3ee'); }
  }
  const STEP = 1 / 60;
  function loop(ts: number) { if (!active) return; const dt = Math.min(0.25, (ts - last) / 1000 || 0); last = ts; acc += dt; let n = 0; while (acc >= STEP && n++ < 8) { update(STEP); acc -= STEP; } draw(); raf = requestAnimationFrame(loop); }
  const gk = (down: boolean) => (e: KeyboardEvent) => { if (!active) return; const t = e.target as HTMLElement; if (t && /^(INPUT|TEXTAREA)$/.test(t.tagName)) return; key(e, down); }; const gd = gk(true), gu = gk(false);
  const setActive = (a: boolean) => { if (a === active) return; active = a; keys = {}; if (a) { window.addEventListener('keydown', gd); window.addEventListener('keyup', gu); } else { window.removeEventListener('keydown', gd); window.removeEventListener('keyup', gu); } if (a) { last = performance.now(); acc = 0; raf = requestAnimationFrame(loop); } else { cancelAnimationFrame(raf); draw(); } };
  const key = (e: KeyboardEvent, down: boolean) => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(k)) e.preventDefault(); keys[k] = down; if (down && k === ' ' && state !== 'play') { reset(); state = 'play'; } };
  cvs.addEventListener('keydown', e => { e.stopPropagation(); e.stopImmediatePropagation(); key(e, true); }); cvs.addEventListener('keyup', e => key(e, false)); cvs.addEventListener('blur', () => { keys = {}; }); cvs.addEventListener('pointerdown', () => { cvs.focus(); if (state !== 'play') { reset(); state = 'play'; } });
  draw(); void os; return { onFocus: () => { setActive(true); cvs.focus(); }, onBlur: () => setActive(false), onClose: () => setActive(false) };
}
