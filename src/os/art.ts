// Generates "screenshots" for projects on a canvas (replace with real images by setting project.image in data.ts).
import type { Project } from './data';
const cache = new Map<string, string>();
export function projectArt(p: Project | { title: string; accent: string; stack: string[] }, w = 640, hgt = 400): string {
  const key = p.title + w; if (cache.has(key)) return cache.get(key)!;
  const c = document.createElement('canvas'); c.width = w; c.height = hgt; const g = c.getContext('2d')!;
  const gr = g.createLinearGradient(0, 0, w, hgt); gr.addColorStop(0, '#0b1020'); gr.addColorStop(1, p.accent); g.fillStyle = gr; g.fillRect(0, 0, w, hgt);
  g.strokeStyle = 'rgba(255,255,255,.08)'; for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, hgt); g.stroke(); } for (let y = 0; y < hgt; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(24, 24, w - 48, 30); [0, 1, 2].forEach(i => { g.fillStyle = ['#ff5f57', '#febc2e', '#28c840'][i]; g.beginPath(); g.arc(44 + i * 20, 39, 6, 0, 7); g.fill(); });
  g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3; g.beginPath(); for (let x = 24; x <= w - 24; x += 4) { const y = hgt * 0.62 + Math.sin(x * 0.03 + p.title.length) * 36 * Math.sin(x * 0.007 + 1); x === 24 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
  g.fillStyle = '#fff'; g.font = `800 ${Math.round(w / 15)}px Inter, Arial, sans-serif`; g.textAlign = 'left'; const words = p.title.split(' '); let line = '', yy = hgt * 0.3; const max = w - 60; words.forEach(wd => { if (g.measureText(line + wd).width > max) { g.fillText(line, 30, yy); line = ''; yy += w / 13; } line += wd + ' '; }); g.fillText(line, 30, yy);
  g.font = `600 ${Math.round(w / 32)}px Inter, Arial, sans-serif`; g.fillStyle = 'rgba(255,255,255,.8)'; g.fillText(p.stack.join('  ·  '), 30, hgt - 28);
  const u = c.toDataURL('image/jpeg', 0.85); cache.set(key, u); return u;
}
