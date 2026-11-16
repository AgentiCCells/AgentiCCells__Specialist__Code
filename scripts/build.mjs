// Build: copy src/ to _site/, stamp the version, write version.json.
// SITE_VERSION is set by CI only (v0.1.N); a local build says "dev".
import { cpSync, rmSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import { render, firstSentence } from './md.mjs';
const version = process.env.SITE_VERSION || 'dev';
rmSync('_site', { recursive: true, force: true });
cpSync('src', '_site', { recursive: true });
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
for (const f of walk('_site')) {
  if (!/\.(html|js|css|json|md|txt)$/.test(f)) continue;
  const s = readFileSync(f, 'utf8');
  if (s.includes('__VERSION__')) writeFileSync(f, s.replaceAll('__VERSION__', version));
}
// The specialist's own Markdown (specialist.code@, 2026-11-16): each .md under these folders
// is published twice, as <name>.html (rendered) and <name>.md (the twin). README.md becomes index.html.
const MD_DIRS = ['abp', 'guidance', 'examples', 'mistakes', 'pack', 'reviews'];
const page = (title, desc, body, mdPath) => `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · Specialist: Code</title>
<meta name="description" content="${desc.replace(/"/g, '&quot;')}">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<main>
<p class="muted"><a href="/">Specialist: Code</a> · <a href="/guidance/">Guidance</a> · <a href="/pack/">Pack</a> · <a href="/mistakes/">Mistakes</a> · <a href="/examples/">Examples</a> · <a href="/reviews/">Reviews</a> · <a href="/abp/specialist-code.html">Policy</a></p>
${body}
<footer>
<p class="muted">Markdown twin: <a href="/${mdPath}">/${mdPath}</a> · Version ${version} · Source: <a href="https://github.com/AgentiCCells/AgentiCCells__Specialist__Code/blob/dev/${mdPath}">${mdPath}</a> · Text CC BY 4.0, code Apache-2.0.</p>
</footer>
</main>
</body>
</html>
`;
for (const d of MD_DIRS) {
  if (!existsSync(d)) continue;
  for (const f of walk(d)) {
    if (!f.endsWith('.md')) continue;
    const md = readFileSync(f, 'utf8').replaceAll('__VERSION__', version);
    const { title, html } = render(md);
    const outHtml = join('_site', f.replace(/README\.md$/, 'index.md').replace(/\.md$/, '.html'));
    mkdirSync(dirname(outHtml), { recursive: true });
    writeFileSync(join('_site', f), md);
    writeFileSync(outHtml, page(title || f, firstSentence(md) || title || f, html, f));
  }
}
writeFileSync('_site/version.json', JSON.stringify({ version, commit: process.env.GITHUB_SHA || 'local', built: new Date().toISOString() }, null, 2) + '\n');
writeFileSync('_site/.nojekyll', '');
console.log(`built _site/ (${version})`);
