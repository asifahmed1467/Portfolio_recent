// Copies the jpg + generated webp files into the output folder (default: dist/images).
import fs from 'node:fs'; const out = process.argv[2] || 'dist/images'; fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync('public/images')) if (/\.(jpe?g|webp)$/i.test(f)) fs.copyFileSync('public/images/' + f, out + '/' + f);
