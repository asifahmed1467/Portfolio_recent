// Inlines the CSS + JS bundle into src/template.html. Usage: node scripts/assemble.mjs <outfile>
import fs from 'node:fs';
const out = process.argv[2] || 'dist/index.html'; const t = fs.readFileSync('src/template.html', 'utf8');
const b = fs.readFileSync('dist/bundle.js', 'utf8').replace(/<\/script/g, '<\\/script'), c = fs.readFileSync('src/os/os.css', 'utf8');
fs.mkdirSync(out.replace(/[^/]+$/, '') || '.', { recursive: true }); fs.writeFileSync(out, t.replace('/*OSCSS*/', () => c).replace('/*BUNDLE*/', () => b));
