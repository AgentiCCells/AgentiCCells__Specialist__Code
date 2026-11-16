// A small Markdown renderer for this site's own pages (guidance, pack, reviews...).
// Node built-ins only. Handles: headings, paragraphs, lists (one level, ordered or not),
// fenced code, block quotes, tables, inline code, bold, italic and links.
// Relative links to .md files are rewritten to .html; the .md twin is published beside it.
// Written by specialist.code@AgentiCCells.dinis, 2026-11-16. Apache-2.0.

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(s) {
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => {
    if (!/^[a-z]+:|^\/\/|^#/.test(u)) u = u.replace(/(^|\/)README\.md(#|$)/, '$1index.md$2').replace(/\.md(#|$)/, '.html$1');
    return `<a href="${u}">${t}</a>`;
  });
  s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+[^\s<).,;:])/g, (_, p, u) => `${p}<a href="${u}">${u}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[i])}</code>`);
  return s;
}

const slug = (t) => t.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function render(md) {
  const lines = md.replace(/\r/g, '').split('\n');
  const out = [];
  let title = '';
  let i = 0;
  const para = [];
  const flush = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para.length = 0; } };
  while (i < lines.length) {
    const l = lines[i];
    if (/^```/.test(l)) {
      flush();
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`);
      continue;
    }
    const h = l.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flush();
      const n = h[1].length, t = inline(h[2]);
      if (n === 1 && !title) title = h[2].replace(/[`*]/g, '');
      out.push(`<h${n} id="${slug(t)}">${t}</h${n}>`);
      i++; continue;
    }
    if (/^\s*$/.test(l)) { flush(); i++; continue; }
    if (/^>\s?/.test(l)) {
      flush();
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote><p>${inline(buf.join(' '))}</p></blockquote>`);
      continue;
    }
    if (/^\|/.test(l) && i + 1 < lines.length && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      flush();
      const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim()));
      const head = cells(l);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(cells(lines[i++]));
      out.push(`<table><thead><tr>${head.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      continue;
    }
    const li = l.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
    if (li) {
      flush();
      const ordered = /\d/.test(li[2]);
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
        if (m) { items.push(m[3]); i++; continue; }
        if (/^\s{2,}\S/.test(lines[i]) && items.length) { items[items.length - 1] += ' ' + lines[i].trim(); i++; continue; }
        break;
      }
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${items.map((t) => `<li>${inline(t)}</li>`).join('')}</${tag}>`);
      continue;
    }
    para.push(l.trim());
    i++;
  }
  flush();
  return { title, html: out.join('\n') };
}

export function firstSentence(md) {
  const body = md.replace(/^#.*$/m, '').replace(/```[\s\S]*?```/g, '').split('\n').map((s) => s.trim()).filter((s) => s && !/^[#|>`]/.test(s));
  const t = (body[0] || '').replace(/^[-*]\s+/, '').replace(/[`*]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  return t.length > 200 ? t.slice(0, 197) + '...' : t;
}
