// Minimal text-only PDF builder (no libraries): Helvetica, multiple pages, ASCII output.
const clean = (s: string) => s.replace(/[→]/g, '->').replace(/[·•]/g, '-').replace(/[×]/g, 'x').replace(/[–—]/g, '-').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\x7e]/g, '?');
const pdfEsc = (s: string) => clean(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
export interface Line { t: string; size?: number; bold?: boolean; gap?: number; }

export function buildPDF(lines: Line[]): Blob {
  const W = 595, H = 842, M = 50, pages: string[] = []; let cur = '', y = H - M;
  const flush = () => { pages.push(cur); cur = ''; y = H - M; };
  for (const l of lines) {
    const size = l.size || 10.5, lead = size * 1.45 + (l.gap || 0);
    const max = Math.floor((W - 2 * M) / (size * 0.5)); const words = clean(l.t).split(' '); const wrapped: string[] = []; let line = '';
    for (const w of words) { if ((line + ' ' + w).trim().length > max) { wrapped.push(line); line = w; } else line = (line + ' ' + w).trim(); } wrapped.push(line);
    for (const w of wrapped) { if (y - lead < M) flush(); y -= lead; cur += `BT /${l.bold ? 'F2' : 'F1'} ${size} Tf ${M} ${y.toFixed(1)} Td (${pdfEsc(w)}) Tj ET\n`; }
  }
  flush();
  const objs: string[] = []; const n = pages.length;
  objs.push('<< /Type /Catalog /Pages 2 0 R >>');
  objs.push(`<< /Type /Pages /Kids [${pages.map((_, i) => `${5 + i * 2} 0 R`).join(' ')}] /Count ${n} >>`);
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  pages.forEach((c, i) => { objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents ${6 + i * 2} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>`); objs.push(`<< /Length ${c.length} >>\nstream\n${c}endstream`); });
  let out = '%PDF-1.4\n'; const off: number[] = [];
  objs.forEach((o, i) => { off.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xr = out.length; out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + off.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`;
  return new Blob([out], { type: 'application/pdf' });
}
