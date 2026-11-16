# Review: AgentiCCells__Site__Template (proposal)

- Repository: [AgentiCCells/AgentiCCells__Site__Template](https://github.com/AgentiCCells/AgentiCCells__Site__Template), owned by factory@AgentiCCells.dinis.
- Commit read: `dev` at `3bec20b031ac1d679d798808d5f1107dd9b01e82` (2026-11-16 01:43 UTC). The same scripts are, byte for byte, in every site seeded from it on 16 Nov, including this repository's first commit.
- Reviewer: specialist.code@AgentiCCells.dinis, 2026-11-16.
- Asked by: nobody. This is an **unasked example**, written as a proposal. It has not been sent to the factory team, and nothing was pushed to their repository. Dinis decides whether it goes to them.
- Scope: release flow, gates, CI workflow, tests.

## Verdict

**Release after the must-fix items.** The design is good (CI owns the version, gates run both locally and in CI, a narrow leak scan, a commit check). Two defects let a commit that fails a gate reach `dev`, and one blocks agents with dotted names. Because the factory seeds every new site from this template, each fix here fixes every future site.

## Findings

### 1. Must fix: `release.sh` pushes even when the validator fails after the rebase

- Where: `scripts/release.sh:11`
  `node scripts/build.mjs >/dev/null && node scripts/validate.mjs >/dev/null && node scripts/leak-scan.mjs >/dev/null`
- What is wrong: under `set -e`, bash does not stop for a failing command inside an `&&` list unless it is the last one. If `build` or `validate` fails after the rebase, the list fails, the script carries on, and line 12 pushes.
- Scenario (reproduced on 2026-11-16 in a scratch clone with a local bare remote, with this repository's identical copy of the script): someone else's commit on `dev` adds an em dash; the local branch passes the gates before the rebase; after the rebase the validator prints `FAILED: 1 problem(s)`, then the script prints `released 7c1364e to dev` and exits 0.
- Impact: CI runs the validator again, so the site is not deployed, but the failing commit is on `dev`, CI is red for the next agent, and the script's "Stops at the first failure" comment is false.
- Principle: [a gate that can be passed by accident is not a gate](../guidance/README.md#gates).
- Fix: run each gate as its own command (a function works; `set -e` applies inside it when it is called as a simple command). See the patch below. Never `a && b && c` for gates, never pipe a gate.

### 2. Must fix: the commit check rejects agent names with a dot in the role

- Where: `scripts/check-commits.mjs`, the line `const agentShape = /^[a-z0-9][a-z0-9-]*@agenticcells\.[a-z0-9][a-z0-9.-]*$/i;`
- What is wrong: the role part allows no dot, but agents are named with dots (`specialist.code@AgentiCCells.dinis`, given by Dinis on 16 Nov; the dotted dev workers across the teams).
- Scenario: the first commit of this repository's own agent failed the check locally with "Agent: trailer is not role@agenticcells.person (specialist.code@AgentiCCells.dinis)". In CI this fails every push from such an agent, and the tempting fix is to rename the agent or skip the check.
- Fix: allow single dots between characters in the role: `/^[a-z0-9](?:[a-z0-9-]|\.(?=[a-z0-9]))*@agenticcells\.[a-z0-9][a-z0-9.-]*$/i`. It still rejects a leading dot, a trailing dot, two dots in a row, spaces and other domains (tested).

### 3. Must fix: nothing enforces `board/HOLD.md`

- Where: `scripts/release.sh`, `.github/workflows/pages.yml`.
- What is wrong: `CLAUDE.md` says never to work while `board/HOLD.md` exists, but neither the release script nor CI checks for it. A hold depends on every agent remembering it.
- Fix: `release.sh` refuses to run while the file exists (patch below); the workflow's build job fails early with the same test, so a push made some other way does not deploy during a hold.

### 4. Should fix: the gates check the working tree, but the push sends `HEAD`

- Where: `scripts/release.sh:5-7` and `:11-12`.
- What is wrong: `build.mjs` copies `src/` as it is on disk, including uncommitted and untracked files. A page that exists only locally passes the link check, then the commit is pushed without it and CI fails (or, worse, a local fix to a gate failure is never committed).
- Fix: refuse to release with uncommitted changes (`git status --porcelain` must be empty).

### 5. Should fix: the commit check runs only after the push

- Where: `.github/workflows/pages.yml:40-45`; not called from `release.sh`.
- What is wrong: a commit without a readable `Agent:` trailer is found only once it is on `dev`, and history is not rewritten (ACC-015), so it stays there.
- Fix: run `node scripts/check-commits.mjs origin/dev HEAD` in `release.sh` before pushing.

### 6. Should fix: `CLAUDE.md` asks for signed commits; no check verifies a signature

- Where: `CLAUDE.md` (Releases: "a commit signed by the releasing agent"); no script reads `%G?`.
- Fix (proposal, for the factory and security@ to decide): add a CI step that lists `git log --format='%h %G? %(trailers:key=Agent,valueonly)' before..after` and fails on `N` (no signature), once each agent's public key is published in `team/keys/` so that GitHub or `git verify-commit` can check it. Until the keys are published, report unsigned commits as a warning, and say so in `REALITY.md`.

### 7. Should fix: the wording check covers the built site, `hub.json` and `README.md` only

- Where: `scripts/validate.mjs:14`.
- What is wrong: `CLAUDE.md`, `REALITY.md`, briefs and hand-overs are not checked for em dashes or hype words, although `CLAUDE.md` lists a "wording check" as a release condition separate from the validator.
- Fix: run the wording rules over every tracked `*.md` file as well, or split them into `scripts/wording.mjs` so the release condition names a real script.

### 8. Should fix: actions are pinned by tag, not by commit

- Where: `.github/workflows/pages.yml:25,38,53,55,70,78` (`actions/checkout@v4`, `actions/setup-node@v4`, `configure-pages@v5`, `upload-pages-artifact@v3`, `deploy-pages@v4`).
- What is wrong: a moved tag changes the code that runs with `pages: write` and `id-token: write` without a commit here. The leak scan already allows 40-character hex for "pinned actions", so the intent exists.
- Fix: pin each to a full commit SHA with the tag in a comment; let one agent (devops@ or this specialist, through a review) bump them.

### 9. Note: no tests of the gates themselves

- A gate that silently stops failing is the worst kind of failure. Add `scripts/test-gates.mjs`: build a temporary `_site/` with one known problem at a time (an em dash, a broken link, a third-party script, a fake key shape built from parts, a commit without a trailer) and assert that each gate exits 1. Run it in CI before the gates.

### 10. Note: CI cost and queueing

- `concurrency: { group: pages, cancel-in-progress: false }` is right for deploys: one run at a time, and GitHub keeps only the newest pending run, so a burst of pushes does not queue dozens of deploys. Keep it. Every push to `dev` runs the full workflow, including documentation-only pushes; that is acceptable for a small static site and gives each push a version. If a site gets many agents pushing, batch their work into fewer pushes rather than adding `paths-ignore`, so the version still matches what was deployed.

## What is good, and worth copying

- **CI owns the version**: `VERSION_BASE` is set by a person, the patch number only by the workflow from the tags, and the tag is made only after a successful deploy (`pages.yml`, jobs `build` and `tag`). Local builds say `dev`. Listed in [examples](../examples/README.md).
- **The leak scan never prints what it found**, only the file, line and kind, and builds its own patterns from parts so it does not match itself.
- **The commit check reads trailers the way git does** (`%(trailers:key=Agent,valueonly)`), skips history older than the check instead of rewriting it, and handles a forced push or manual run with no usable `before`.
- **Template mode** (`.factory-template`): the template builds and checks but never deploys, and a seeded site fails if any `__SITE_*__` placeholder is left.

## Proposed patch

`scripts/release.sh` (findings 1, 3, 4, 5). This is the version now running in AgentiCCells__Specialist__Code, tested on 2026-11-16 against a local bare remote: a commit that passes before the rebase and fails the validator after it is refused, and the remote is unchanged.

```bash
#!/usr/bin/env bash
# Run every gate, then rebase on dev and push. Stops at the first failure. Never pipe a gate.
set -euo pipefail
cd "$(dirname "$0")/.."

gates() {
  node scripts/build.mjs
  node scripts/validate.mjs
  node scripts/leak-scan.mjs
  node scripts/check-commits.mjs origin/dev HEAD
}

[ -e board/HOLD.md ] && { echo "board/HOLD.md exists: no release while it does" >&2; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "uncommitted changes: commit or stash them, so the gates check what is pushed" >&2; exit 1; }
git fetch -q origin dev
gates
for i in 1 2 3 4 5; do
  git fetch -q origin dev
  git rebase -q origin/dev
  gates >/dev/null
  if git -c push.negotiate=true push -q origin HEAD:dev; then echo "released $(git rev-parse --short HEAD) to dev"; exit 0; fi
  sleep $((i * 3))
done
echo "release failed after 5 attempts" >&2; exit 1
```

`scripts/check-commits.mjs` (finding 2):

```diff
-const agentShape = /^[a-z0-9][a-z0-9-]*@agenticcells\.[a-z0-9][a-z0-9.-]*$/i;
+const agentShape = /^[a-z0-9](?:[a-z0-9-]|\.(?=[a-z0-9]))*@agenticcells\.[a-z0-9][a-z0-9.-]*$/i;
```

`.github/workflows/pages.yml` (finding 3), as the first step of the `build` job after checkout:

```yaml
      - name: No release during a hold
        run: if [ -e board/HOLD.md ]; then echo "board/HOLD.md exists" >&2; exit 1; fi
```

## Next step

For Dinis: send this to factory@AgentiCCells.dinis as a proposal, or tell the specialist to. The factory applies it to the template; sites already seeded (16 Nov) need the same patch, which each site's own agent applies.
