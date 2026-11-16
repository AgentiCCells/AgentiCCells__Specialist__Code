// Tests that each gate fails when it should. A gate that silently stops failing is the worst kind.
// For each case: copy the committed tree (git archive HEAD) into a temporary git repository,
// plant one known problem, run the gate there, and expect exit code 1. The clean copy must pass.
// Usage: node scripts/test-gates.mjs   (prints OK or lists the cases that did not fail; exit 1)
// Written by specialist.code@AgentiCCells.dinis, 2026-11-16. Apache-2.0. Node built-ins only.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, appendFileSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const run = (cwd, cmd, args) => spawnSync(cmd, args, { cwd, encoding: 'utf8', env: { ...process.env, SITE_VERSION: '' } });
const gitc = (cwd, ...a) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...a], { cwd, encoding: 'utf8' });

function fresh() {
  const d = mkdtempSync(join(tmpdir(), 'gates-'));
  execFileSync('sh', ['-c', `git -C "${root}" archive HEAD | tar -x -C "${d}"`]);
  gitc(d, 'init', '-q');
  gitc(d, 'add', '-A');
  gitc(d, 'commit', '-qm', 'base\n\nAgent: test@agenticcells.t');
  return d;
}
const gate = (d, script, ...args) => {
  const b = run(d, 'node', ['scripts/build.mjs']);
  if (b.status !== 0) return b.status;
  return run(d, 'node', [`scripts/${script}`, ...args]).status;
};
// Built from parts so this file does not match the leak scan's own patterns.
const fakeKey = 'gh' + 'p_' + 'A1b2C3d4E5f6G7h8I9'.repeat(2);
const dash = String.fromCharCode(0x2014);

const cases = [
  ['clean tree passes validate', 0, (d) => gate(d, 'validate.mjs')],
  ['clean tree passes the leak scan', 0, (d) => gate(d, 'leak-scan.mjs')],
  ['em dash fails validate', 1, (d) => { appendFileSync(join(d, 'src/index.html'), `<!-- a ${dash} b -->\n`); return gate(d, 'validate.mjs'); }],
  ['hype word fails validate', 1, (d) => { appendFileSync(join(d, 'src/index.html'), '<!-- a revolutionary page -->\n'); return gate(d, 'validate.mjs'); }],
  ['broken link fails validate', 1, (d) => { appendFileSync(join(d, 'src/index.html'), '<a href="/nowhere.html">x</a>\n'); return gate(d, 'validate.mjs'); }],
  ['third-party script fails validate', 1, (d) => { appendFileSync(join(d, 'src/index.html'), '<script src="https://example.com/x.js"></script>\n'); return gate(d, 'validate.mjs'); }],
  ['relative version_from fails validate', 1, (d) => { const f = join(d, 'hub.json'); writeFileSync(f, readFileSync(f, 'utf8').replace(/"version_from": "[^"]*"/, '"version_from": "/version.json"')); return gate(d, 'validate.mjs'); }],
  ['token shape fails the leak scan', 1, (d) => { writeFileSync(join(d, 'notes.txt'), `token ${fakeKey}\n`); return gate(d, 'leak-scan.mjs'); }],
  ['commit without Agent trailer fails the commit check', 1, (d) => {
    const base = gitc(d, 'rev-parse', 'HEAD').trim();
    appendFileSync(join(d, 'README.md'), '\nx\n'); gitc(d, 'commit', '-qam', 'no trailer');
    return run(d, 'node', ['scripts/check-commits.mjs', base, 'HEAD']).status;
  }],
  ['dotted agent name passes the commit check', 0, (d) => {
    const base = gitc(d, 'rev-parse', 'HEAD').trim();
    appendFileSync(join(d, 'README.md'), '\nx\n'); gitc(d, 'commit', '-qam', 'ok\n\nAgent: specialist.code@AgentiCCells.dinis');
    return run(d, 'node', ['scripts/check-commits.mjs', base, 'HEAD']).status;
  }],
  ['trailing dash in an agent role fails the commit check', 1, (d) => {
    const base = gitc(d, 'rev-parse', 'HEAD').trim();
    appendFileSync(join(d, 'README.md'), '\nx\n'); gitc(d, 'commit', '-qam', 'bad\n\nAgent: dev-@AgentiCCells.dinis');
    return run(d, 'node', ['scripts/check-commits.mjs', base, 'HEAD']).status;
  }],
  ['Agent line outside the final trailer block fails the commit check', 1, (d) => {
    const base = gitc(d, 'rev-parse', 'HEAD').trim();
    appendFileSync(join(d, 'README.md'), '\nx\n'); gitc(d, 'commit', '-qam', 'msg\n\nAgent: dev@AgentiCCells.dinis\n\nCo-Authored-By: x <x@x>');
    return run(d, 'node', ['scripts/check-commits.mjs', base, 'HEAD']).status;
  }],
  ['an exempted commit passes, a malformed exemption fails', 0, (d) => {
    const base = gitc(d, 'rev-parse', 'HEAD').trim();
    appendFileSync(join(d, 'README.md'), '\nx\n'); gitc(d, 'commit', '-qam', 'no trailer');
    const bad = gitc(d, 'rev-parse', 'HEAD').trim();
    writeFileSync(join(d, 'scripts/commit-exemptions.json'), JSON.stringify([{ commit: bad.slice(0, 7), reason: 'r', approved_by: 'p', date: '2026-11-16' }]));
    if (run(d, 'node', ['scripts/check-commits.mjs', base, 'HEAD']).status !== 1) return 'short sha accepted';
    writeFileSync(join(d, 'scripts/commit-exemptions.json'), JSON.stringify([{ commit: bad, reason: 'trailer outside the final block', approved_by: 'Dinis Cruz', date: '2026-11-16' }]));
    return run(d, 'node', ['scripts/check-commits.mjs', base, 'HEAD']).status;
  }],
  ['release.sh refuses during a hold', 1, (d) => {
    execFileSync('mkdir', ['-p', join(d, 'board')]); writeFileSync(join(d, 'board/HOLD.md'), 'hold\n');
    return run(d, 'bash', ['scripts/release.sh']).status;
  }],
  ['release.sh source runs each gate on its own line', 0, (d) => {
    const s = readFileSync(join(d, 'scripts/release.sh'), 'utf8');
    return /node scripts\/\S+[^\n]*&&[^\n]*node scripts\//.test(s) || /node scripts\/[^\n]*\|/.test(s) ? 1 : 0;
  }],
];

const failures = [];
for (const [name, want, fn] of cases) {
  const d = fresh();
  try { const got = fn(d); if (got !== want) failures.push(`${name}: expected exit ${want}, got ${got}`); }
  catch (e) { failures.push(`${name}: ${e.message.split('\n')[0]}`); }
  finally { rmSync(d, { recursive: true, force: true }); }
}
if (failures.length) { console.error(failures.join('\n')); console.error(`FAILED (${failures.length} of ${cases.length})`); process.exit(1); }
console.log(`OK (${cases.length} gate tests)`);
