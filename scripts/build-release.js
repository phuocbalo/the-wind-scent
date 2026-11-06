// Builds the release version into dist/ with all testing tools removed (N13).
// Anything marked with data-dev-only in index.html is stripped.
import { cpSync, rmSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const OUT = 'dist';
const COPY = ['index.html', 'styles.css', 'manifest.webmanifest', 'sw.js', 'src', 'text', 'data', 'icons'];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
for (const p of COPY) cpSync(p, `${OUT}/${p}`, { recursive: true });

const html = readFileSync(`${OUT}/index.html`, 'utf8');
const stripped = html
  .replace(/\s*<!-- Testing tools[^>]*-->/g, '')
  .replace(/\s*<section[^>]*data-dev-only[\s\S]*?<\/section>/g, '');
if (/data-dev-only/.test(stripped)) throw new Error('testing tools still in release build');
writeFileSync(`${OUT}/index.html`, stripped);
console.log('Release build written to dist/ (testing tools removed)');
