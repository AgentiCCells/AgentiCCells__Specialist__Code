// Gate: fails the build on any problem. Never weaken a check to get a release out.
// From scripts/validate.mjs in the site repositories made by sites@AgentiCCells.dinis
// (2026-11-16); factory@ added the hub.json fields, the description check and the
// placeholder check (a seeded site must hold no __SITE_*__ placeholder).
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const problems = [];
const fail = m => problems.push(m);
const hype = /\b(revolutionary|cutting[- ]edge|seamless(?:ly)?|world[- ]class|game[- ]changing)\b/i;
const isTemplate = existsSync('.factory-template');
const SITE_URL = (() => { try { return JSON.parse(readFileSync('hub.json', 'utf8')).live_address.replace(/\/$/, ''); } catch { return ''; } })();
const cards = new Map();
function sharePage(f, s) {
  const dec = (t) => t.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const meta = (n) => { const m = s.match(new RegExp(`<meta (?:property|name)="${n}" content="([^"]*)"`)); return m ? dec(m[1]) : undefined; };
  const canon = (s.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
  const need = ['og:type', 'og:site_name', 'og:locale', 'og:url', 'og:title', 'og:description', 'og:image', 'og:image:type', 'og:image:width', 'og:image:height', 'og:image:alt', 'twitter:card'];
  for (const n of need) if (!meta(n)) fail(`${f}: no ${n} (link previews)`);
  if (!canon) fail(`${f}: no canonical link (link previews)`);
  const own = SITE_URL && SITE_URL + '/' + f.slice('_site/'.length).replace(/(^|\/)index\.html$/, '$1');
  for (const [n, u] of [['canonical', canon], ['og:url', meta('og:url')], ['og:image', meta('og:image')]]) {
    if (!u) continue;
    if (!/^https:\/\//.test(u)) { fail(`${f}: ${n} must be an absolute https URL`); continue; }
    if (SITE_URL && new URL(u).host !== new URL(SITE_URL).host) fail(`${f}: ${n} must be on ${SITE_URL}`);
  }
  if (canon && meta('og:url') && canon !== meta('og:url')) fail(`${f}: canonical and og:url differ`);
  if (own && meta('og:url') && meta('og:url') !== own) fail(`${f}: og:url must be this page's own address, ${own}`);
  const d = meta('og:description');
  if (d && (d.length < 110 || d.length > 150)) fail(`${f}: og:description is ${d.length} characters; keep it 110 to 150`);
  if (meta('twitter:card') && meta('twitter:card') !== 'summary_large_image') fail(`${f}: twitter:card must be summary_large_image`);
  if (meta('og:image:type') && meta('og:image:type') !== 'image/jpeg') fail(`${f}: og:image:type must be image/jpeg`);
  if (meta('og:image:width') && meta('og:image:width') !== '1200') fail(`${f}: og:image:width must be 1200`);
  if (meta('og:image:height') && meta('og:image:height') !== '630') fail(`${f}: og:image:height must be 630`);
  const img = meta('og:image');
  if (img && /^https:\/\//.test(img)) {
    const local = join('_site', decodeURIComponent(new URL(img).pathname));
    if (!cards.has(local)) {
      let why = '';
      if (!existsSync(local)) why = 'is not in the site';
      else {
        const buf = readFileSync(local), dim = jpegSize(buf);
        if (buf.length > 300 * 1024) why = `is ${Math.round(buf.length / 1024)} KB; keep it at most 300 KB`;
        else if (!dim) why = 'is not a JPEG';
        else if (dim.w !== 1200 || dim.h !== 630) why = `is ${dim.w}x${dim.h}; it must be 1200x630`;
      }
      cards.set(local, why);
    }
    if (cards.get(local)) fail(`${f}: share card ${img} ${cards.get(local)}`);
  }
}
if (!existsSync('_site')) { console.error('FAILED: _site/ is not built: run node scripts/build.mjs'); process.exit(1); }
const files = walk('_site');
for (const f of [...files, 'hub.json', 'README.md']) {
  if (!existsSync(f) || !/\.(html|js|css|json|md)$/.test(f)) continue;
  const s = readFileSync(f, 'utf8');
  s.split('\n').forEach((line, i) => {
    if (line.includes('—')) fail(`${f}:${i + 1}: em dash`);
    const m = line.match(hype); if (m) fail(`${f}:${i + 1}: hype word "${m[0]}"`);
    if (!isTemplate && /__SITE_[A-Z]+__/.test(line)) fail(`${f}:${i + 1}: template placeholder left in a seeded site`);
  });
  if (f.endsWith('.html')) {
    if (!/<title>[^<]+<\/title>/.test(s)) fail(`${f}: no <title>`);
    if (!/<meta name="description" content="[^"]+"/.test(s)) fail(`${f}: no description`);
    if (!/<html lang="/.test(s)) fail(`${f}: no lang on <html>`);
    for (const m of s.matchAll(/<script[^>]+src="([^"]+)"/g)) if (/^(https?:)?\/\//.test(m[1])) fail(`${f}: third-party script ${m[1]}`);
    for (const m of s.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)) if (/^(https?:)?\/\//.test(m[1])) fail(`${f}: third-party stylesheet ${m[1]}`);
    sharePage(f, s);
    for (const m of s.matchAll(/(?:href|src)="([^"#?]+)/g)) {
      const u = m[1]; if (/^(https?:|mailto:|data:|\/\/)/.test(u)) continue;
      const target = u.startsWith('/') ? join('_site', u) : join(dirname(f), u);
      if (!existsSync(target) && !existsSync(join(target, 'index.html'))) fail(`${f}: broken link ${u}`);
    }
  }
}
if (!existsSync('_site/version.json')) fail('no version.json');
// Link previews (specialist.code@, 2026-11-17; the roll-out cells@ asked for at Dinis's word, reference
// AgentiCCells__Site__Gabriel-DaCruz 16fb163): every page needs canonical, og:* and twitter:card tags with
// absolute https URLs on this site, a description of 110 to 150 characters, and a share card served here
// that is a 1200x630 JPEG of at most 300 KB (WhatsApp drops larger images).
function jpegSize(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null;
    const m = buf[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}
if (!existsSync('_site/index.html')) fail('no index.html');
try {
  const h = JSON.parse(readFileSync('hub.json', 'utf8'));
  for (const k of ['name', 'what_it_does', 'owner', 'repository', 'live_address', 'version_from']) if (typeof h[k] !== 'string' || !h[k].trim()) fail(`hub.json: ${k} must be a non-empty string`);
  if (h.owner !== 'AgentiCCells') fail('hub.json: owner must be AgentiCCells');
  // specialist.code@ (2026-11-16): the hub's registry gate (AgentiCCells__Site__Hub build/validate.js:124)
  // refuses any version_from other than the absolute live address; the template's default "/version.json" failed it.
  if (typeof h.live_address === 'string' && h.version_from !== `${h.live_address}/version.json`) fail(`hub.json: version_from must be ${h.live_address}/version.json`);
  if (!h.licence || h.licence.code !== 'Apache-2.0' || h.licence.text !== 'CC BY 4.0') fail('hub.json: licence must be code Apache-2.0, text CC BY 4.0');
} catch (e) { fail(`hub.json is missing or not JSON (${e.message})`); }
if (problems.length) { console.error(problems.join('\n')); console.error(`FAILED: ${problems.length} problem(s)`); process.exit(1); }
console.log(`OK${isTemplate ? ' (template)' : ''}`);
