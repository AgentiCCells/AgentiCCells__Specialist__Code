<!-- description: Review of the AgentiCCells site template: a gate bypass in release.sh, an unenforced hold, a dropped CI run, and the status of each fix. -->
# Review: AgentiCCells__Site__Template (proposal)

- Repository: [AgentiCCells/AgentiCCells__Site__Template](https://github.com/AgentiCCells/AgentiCCells__Site__Template), owned by factory@AgentiCCells.dinis.
- Commit read: `dev` at `3bec20b031ac1d679d798808d5f1107dd9b01e82` (2026-11-16 01:43 UTC). The same scripts are, byte for byte, in every site seeded from it on 16 Nov, including this repository's first commit.
- Reviewer: specialist.code@AgentiCCells.dinis, 2026-11-16.
- Asked by: nobody. This is an **unasked example**, written as a proposal. It has not been sent to the factory team, and nothing was pushed to their repository. Dinis decides whether it goes to them.
- Scope: release flow, gates, CI workflow, tests.

## Status of the findings (updated 2026-11-16, 18:40 UTC)

On Dinis's word (about 18:15 UTC, relayed by conductor@web-summit.dinis: "we definitely should allow dots because that's our terminology. So change that rule. We can't use dashes. Fix the template directly."), conductor.web-summit@ changed the template. Each commit below was read by this agent before being marked.

| Finding | Status in the template |
|---|---|
| 1. `release.sh` pushes after a failed gate | **Fixed** in [104760a](https://github.com/AgentiCCells/AgentiCCells__Site__Template/commit/104760a) (one gate per line) |
| 2. Dotted roles | **Fixed** in [f7438ad](https://github.com/AgentiCCells/AgentiCCells__Site__Template/commit/f7438ad), with a stricter rule than this agent first proposed; this repository now uses the template's rule |
| 11. Relative `version_from` | **Fixed**: default in f7438ad, validator check in 104760a |
| 3 (hold), 3b (dropped run unchecked), 3c (`persist-credentials`), 4 (dirty tree), 5 (commit check before push) | **Patch ready**, tested against 104760a: [the patch](https://github.com/AgentiCCells/AgentiCCells__Specialist__Code/blob/dev/reviews/patches/2026-11-16__AgentiCCells__Site__Template__findings-3-3b-3c-4-5.patch). Sent to conductor@web-summit.dinis, to apply at Dinis's word. |
| 6 to 10 | Open (signatures need published keys; wording scope; SHA pinning; gate tests; CI cost note) |

About 3b: checking from the last release tag means one commit that fails the check would block every later release, because tags come only from green runs and history is never rewritten. The patch therefore also lets a person exempt exactly one commit in `scripts/commit-exemptions.json` (full SHA, reason, approver, date), the same shape as the leak scan's narrow allowlist. Applying it now is safe: tag v0.1.4 sits on 104760a, after f7438ad (whose `Agent:` line is unreadable), so no exemption is needed today. Tested: without an exemption the range from `f7438ad^` fails; with one it passes; a short SHA is refused.

## Verdict

**Release after the must-fix items.** The design is good (CI owns the version, gates run both locally and in CI, a narrow leak scan, a commit check). Two defects let a commit that fails a gate reach `dev`, one lets a push skip the commit check, one blocks agents with dotted names, and the hold is not enforced. Because the factory seeds every new site from this template, each fix here fixes every future site.

## Findings

### 1. Must fix: `release.sh` pushes even when the validator fails after the rebase

- Where: `scripts/release.sh:11`
  `node scripts/build.mjs >/dev/null && node scripts/validate.mjs >/dev/null && node scripts/leak-scan.mjs >/dev/null`
- What is wrong: under `set -e`, bash does not stop for a failing command inside an `&&` list unless it is the last one. If `build` or `validate` fails after the rebase, the list fails, the script carries on, and line 12 pushes.
- Scenario (reproduced on 2026-11-16 in a scratch clone with a local bare remote, with this repository's identical copy of the script): someone else's commit on `dev` adds an em dash; the local branch passes the gates before the rebase; after the rebase the validator prints `FAILED: 1 problem(s)`, then the script prints `released 7c1364e to dev` and exits 0.
- Impact: CI runs the validator again, so the site is not deployed, but the failing commit is on `dev`, CI is red for the next agent, and the script's "Stops at the first failure" comment is false.
- Principle: [a gate that can be passed by accident is not a gate](../guidance/README.md#gates).
- Fix: run each gate as its own command (a function works; `set -e` applies inside it when it is called as a simple command). See the patch below. Never `a && b && c` for gates, never pipe a gate.

### 2. Fixed in f7438ad: the commit check rejected agent names with a dot in the role

- Where: `scripts/check-commits.mjs`, the line `const agentShape = /^[a-z0-9][a-z0-9-]*@agenticcells\.[a-z0-9][a-z0-9.-]*$/i;`
- What is wrong: the role part allows no dot, but agents are named with dots (`specialist.code@AgentiCCells.dinis`, given by Dinis on 16 Nov; the dotted dev workers across the teams).
- Scenario: the first commit of this repository's own agent failed the check locally with "Agent: trailer is not role@agenticcells.person (specialist.code@AgentiCCells.dinis)". In CI this fails every push from such an agent, and the tempting fix is to rename the agent or skip the check.
- Fix (as applied in f7438ad): `/^[a-z0-9]+(?:[.-][a-z0-9]+)*@agenticcells\.[a-z0-9][a-z0-9.-]*$/i`: parts of letters and digits joined by single dots or dashes. This agent's first proposal also allowed a trailing or doubled dash; the template's rule is better and is now used here.

### 3. Must fix: nothing enforces `board/HOLD.md`

- Where: `scripts/release.sh`, `.github/workflows/pages.yml`.
- What is wrong: `CLAUDE.md` says never to work while `board/HOLD.md` exists, but neither the release script nor CI checks for it. A hold depends on every agent remembering it.
- Fix: `release.sh` refuses to run while the file exists (patch below); the workflow's build job fails early with the same test, so a push made some other way does not deploy during a hold.

### 3b. Must fix: a dropped CI run leaves a push's commits unchecked

- Where: `.github/workflows/pages.yml:40-45` (`check-commits.mjs "$BEFORE" "$AFTER"` with `BEFORE: ${{ github.event.before }}`) together with `concurrency: { group: pages, cancel-in-progress: false }`.
- What is wrong: GitHub keeps one running and one pending run per group; a newer pending run cancels the older pending one. With three quick pushes A, B, C, the run for B is dropped, and C's run checks only `B..C`. B's commits are never checked for an `Agent:` trailer. (Found by reading the workflow and GitHub's documented concurrency behaviour, not reproduced on GitHub.)
- Fix: check from the last release tag, which only a successful run creates: `last=$(git describe --tags --abbrev=0 --match "v${VERSION_BASE}.*" "$AFTER" || true)`, then `check-commits.mjs "${last:-$BEFORE}" "$AFTER"`. Now in this repository's `pages.yml`.

### 3c. Should fix: the build job keeps the push credential in the checkout

- Where: `.github/workflows/pages.yml:25` (`actions/checkout@v4` without `persist-credentials: false`). AgentiCCells__Website has it (its `pages.yml` line 24); the template dropped it.
- What is wrong: the build job runs repository code (`build.mjs`, `validate.mjs`) with the token left in `.git/config`. Its permission is `contents: read`, so the harm is small today, but it grows with any later permission.
- Fix: `persist-credentials: false` on the build job's checkout. The tag job, which pushes, keeps its own checkout.

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

### 11. Half fixed in f7438ad: `hub.json` shipped a relative `version_from` that the hub refuses

- Where: `hub.json` (`"version_from": "/version.json"`) and `scripts/validate.mjs` (which accepts any non-empty string).
- What is wrong: AgentiCCells__Site__Hub `build/validate.js:124` requires `version_from` to equal `live_address` + `/version.json`. Every seeded site inherits the relative value and is refused when the hub copies its `hub.json`. Reported by conductor@web-summit.dinis on 16 Nov, 18:10 UTC; checked against the hub's code.
- Fix: have the factory write `version_from` from the site's live address when it seeds the site, as it does for `live_address`, and add the hub's rule to `validate.mjs`: `if (h.version_from !== `${h.live_address}/version.json`) fail(...)`. Done in this repository, with a gate test.

## What is good, and worth copying

- **CI owns the version**: `VERSION_BASE` is set by a person, the patch number only by the workflow from the tags, and the tag is made only after a successful deploy (`pages.yml`, jobs `build` and `tag`). Local builds say `dev`. Listed in [examples](../examples/README.md).
- **The leak scan never prints what it found**, only the file, line and kind, and builds its own patterns from parts so it does not match itself.
- **The commit check reads trailers the way git does** (`%(trailers:key=Agent,valueonly)`), skips history older than the check instead of rewriting it, and handles a forced push or manual run with no usable `before`.
- **Template mode** (`.factory-template`): the template builds and checks but never deploys, and a seeded site fails if any `__SITE_*__` placeholder is left.

## Context

- ACC-012 (AgentiCCells__Website `board/`): Dinis, 15 Nov: "Branch protection, no, everybody can push to dev." So the gates on `dev` are the only barrier there, which is why findings 1, 3, 3b and 5 matter.
- Boundaries with sibling specialists: the leak scan's patterns belong to security@ and the word list of the wording check to the Writing specialist; this review only asks that both run, unpiped, locally and in CI.

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
+const agentShape = /^[a-z0-9]+(?:[.-][a-z0-9]+)*@agenticcells\.[a-z0-9][a-z0-9.-]*$/i;
```

`.github/workflows/pages.yml` (findings 3, 3b, 3c): see this repository's [pages.yml](https://github.com/AgentiCCells/AgentiCCells__Specialist__Code/blob/dev/.github/workflows/pages.yml). The hold check, as the first step of the `build` job after checkout:

```yaml
      - name: No release during a hold
        run: if [ -e board/HOLD.md ]; then echo "board/HOLD.md exists" >&2; exit 1; fi
```

## Next step

For Dinis: send this to factory@AgentiCCells.dinis as a proposal, or tell the specialist to. The factory applies it to the template; sites already seeded (16 Nov) need the same patch, which each site's own agent applies.
