// Fake virtual file system shared by the terminal and File Explorer.
import { data } from './data';
import type { AppId } from './data';

export type Kind = 'txt' | 'md' | 'pdf' | 'link' | 'img' | 'exe';
export interface FNode { name: string; dir: boolean; children?: Record<string, FNode>; kind?: Kind; content?: string; app?: AppId; project?: string; url?: string; }

const dir = (name: string, children: FNode[] = [], project?: string): FNode => ({ name, dir: true, children: Object.fromEntries(children.map(c => [c.name.toLowerCase(), c])), project });
const file = (name: string, kind: Kind, content = '', extra: Partial<FNode> = {}): FNode => ({ name, dir: false, kind, content, ...extra });

export const ABOUT_TXT = () => [`${data.name}`, `${data.role}`, '', ...data.bio, '', `Email   : ${data.email}`, `GitHub  : ${data.github}`, `LinkedIn: ${data.linkedin}`].join('\n');

export function buildFS(): FNode {
  const projects = data.projects.map(p => dir(p.slug, [
    file('README.md', 'md', `# ${p.title}\n\n${p.description}\n\n${p.readme.join('\n\n')}\n\nStack: ${p.stack.join(', ')}`),
    file('stack.txt', 'txt', p.stack.join('\n')),
    file('links.txt', 'txt', [p.github ? 'GitHub: ' + p.github : '', p.live ? 'Live: ' + p.live : '', p.status ? 'Status: ' + p.status : ''].filter(Boolean).join('\n') || 'No public links yet.'),
    dir('screenshots', [file('preview.png', 'img', p.slug, { project: p.slug })])
  ], p.slug));
  const guest = dir('Guest', [
    dir('Desktop', [file('About Me.txt', 'txt', ABOUT_TXT()), file('Resume.pdf', 'pdf'), file('Terminal.lnk', 'link', '', { app: 'terminal' }), file('Contact.lnk', 'link', '', { app: 'mail' })]),
    dir('Documents', [file('About Me.txt', 'txt', ABOUT_TXT()), file('Resume.pdf', 'pdf'), file('thesis.md', 'md', '# Thesis\n\nAssessing Script Integrity, Performance Degradation, and Energy Efficiency in Quantized Bangla Large Language Models.\n\nSupervisor: Dr. Nazib Abdun Nasir (AIUB)\nStatus: in progress'), file('awards.txt', 'txt', ["5x consecutive Dean's Award (AIUB)", 'CGPA 3.86 / 4.00', ...data.certifications].join('\n')), file('publications.txt', 'txt', data.publications.join('\n\n'))]),
    dir('Projects', projects),
    dir('Downloads', [file('coffee.txt', 'txt', 'Empty. Please refill. ☕')]),
    dir('Pictures', data.projects.map(p => file(p.slug + '.png', 'img', p.slug, { project: p.slug })))
  ]);
  return dir('C:', [dir('Users', [guest]), dir('Windows', [file('system32.dll', 'exe', 'Access is denied.')]), dir('Program Files', [file('Quant Invaders.exe', 'exe', '', { app: 'invaders' }), file('AI Lab.exe', 'exe', '', { app: 'ailab' }), file('Snake.exe', 'exe', '', { app: 'snake' })])]);
}
export const ROOT = buildFS();
export const HOME = 'C:\\Users\\Guest';

export function normalize(cwd: string, p: string): string[] {
  let parts = /^[a-z]:/i.test(p) ? [] : cwd.split('\\').filter(Boolean); if (p === '\\' || p === '/') parts = ['C:'];
  for (const seg of p.split(/[\\/]/).filter(Boolean)) { if (seg === '.') continue; if (seg === '..') { if (parts.length > 1) parts.pop(); } else parts.push(seg); }
  if (!parts.length) parts = ['C:']; parts[0] = parts[0].toUpperCase(); return parts;
}
export function get(parts: string[]): FNode | null {
  let n: FNode = ROOT; if (parts[0].toUpperCase() !== 'C:') return null;
  for (const seg of parts.slice(1)) { const c: FNode | undefined = n.children?.[seg.toLowerCase()]; if (!c) return null; n = c; } return n;
}
export const resolve = (cwd: string, p: string) => { const parts = normalize(cwd, p); return { parts, path: parts.join('\\') + (parts.length === 1 ? '\\' : ''), node: get(parts) }; };
export const list = (n: FNode) => Object.values(n.children || {}).sort((a, b) => (+b.dir - +a.dir) || a.name.localeCompare(b.name));
export function tree(n: FNode, prefix = ''): string[] {
  const out: string[] = []; const kids = list(n);
  kids.forEach((k, i) => { const last = i === kids.length - 1; out.push(prefix + (last ? '└───' : '├───') + k.name); if (k.dir) out.push(...tree(k, prefix + (last ? '    ' : '│   '))); }); return out;
}
