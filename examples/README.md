<!-- description: The best release scripts, workflows, gates and tests in the team's repositories, with links, what makes each good, and a few to avoid. -->
# Examples: the best we have, with links

Each example is a file to read and copy from, with what makes it good and what to watch for. Links point at the `dev` branch, read on 16 Nov 2026. When you copy, record where it came from (all are in the team's public repositories under Apache-2.0 or the repository's stated licence).

## Release scripts

| What | Where | Why it is good | Watch for |
|---|---|---|---|
| Agent-side release with refusals | [PrompTugal__News__Website `newsroom/tools/release.sh`](https://github.com/PrompTugal/PrompTugal__News__Website/blob/dev/newsroom/tools/release.sh) | Refuses off `dev`, with a dirty tree, during `board/HOLD.md`, or with a hand-edited version file; merges `board/keys.json` conflicts by id; waits for the live site | HOLD is checked here only, not in CI |
| Release script, tested against a gate bypass | [this repository's `scripts/release.sh`](https://github.com/AgentiCCells/AgentiCCells__Specialist__Code/blob/dev/scripts/release.sh) | Each gate on its own line; refuses during a hold, with a dirty tree, or with a commit lacking an `Agent:` trailer | Does not wait for the live site yet |
| CI sets the version, with a fast path under load | [PrompTugal__News__Website `newsroom/build/tag_release.sh`](https://github.com/PrompTugal/PrompTugal__News__Website/blob/dev/newsroom/build/tag_release.sh) | Version from tags; gate re-run on the exact tree; `git push --atomic` for branch and tag; cherry-pick fast path when twenty agents push | Runs repository code in a job with `contents: write` |
| The same, smaller | [SGit-AI__Website__Web-Summit `admin/build/tag_release.sh`](https://github.com/SGit-AI/SGit-AI__Website__Web-Summit/blob/dev/admin/build/tag_release.sh) | No new number when the head is already a CI release | Only warns when `version.txt` was hand-edited |

## Workflows

| What | Where | Why it is good |
|---|---|---|
| The best CI shape for a site | [PrompTugal__News__Storm-Charles `deploy.yml`](https://github.com/PrompTugal/PrompTugal__News__Storm-Charles/blob/dev/.github/workflows/deploy.yml) | Jobs split by permission; build with `persist-credentials: false`; deploy and tag run no repository code; superseded runs skip; version never committed; fails red unless the live site serves the version (watch: the tag step ends `|| echo`, so a failed tag is green) |
| Version guard and deploy of the stamped commit | [SGit-AI__Website__Newsroom `deploy-pages.yml`](https://github.com/SGit-AI/SGit-AI__Website__Newsroom/blob/dev/.github/workflows/deploy-pages.yml) | Fails if a non-CI commit set the version; deploys `needs.release.outputs.sha`, never the pushed commit; PRs in their own concurrency group; live-network tests in a non-blocking job |
| CI owns the version, minimal | [AgentiCCells__Site__Template `pages.yml`](https://github.com/AgentiCCells/AgentiCCells__Site__Template/blob/dev/.github/workflows/pages.yml) | `VERSION_BASE` set by a person, patch from tags, tag only after deploy (see the [review](../reviews/2026-11-16__AgentiCCells__AgentiCCells__Site__Template.md) for its gaps) |
| Plan on the PR, least privilege | [AgentiCCells__Site__Factory `plan.yml`](https://github.com/AgentiCCells/AgentiCCells__Site__Factory/blob/dev/.github/workflows/plan.yml) | Read-only job runs the checks; a separate job with only `pull-requests: write` posts one comment and checks nothing out |
| Credentials by environment, agent output as a patch | [AgentiCCells__Site__Factory `apply.yml`](https://github.com/AgentiCCells/AgentiCCells__Site__Factory/blob/dev/.github/workflows/apply.yml) | OIDC, no stored keys; Claude's output is a patch checked against allowed paths; gates run with `env -u GH_TOKEN`; pushes at `max-parallel: 1` |
| Promotion only with a signed approval | [PrompTugal__App__Android `promote.yml`](https://github.com/PrompTugal/PrompTugal__App__Android/blob/dev/.github/workflows/promote.yml) | Fast-forwards `main` only with a signed security PASS for the exact SHA; store secrets in an environment limited to `main` |
| SHA-pinned actions, attestation | [PrompTugal__App__Android `android.yml`](https://github.com/PrompTugal/PrompTugal__App__Android/blob/dev/.github/workflows/android.yml) | Third-party actions pinned by SHA with the tag in a comment; checks cancel, releases never do; build provenance attestation checked before upload |
| Cost-aware macOS CI | [PrompTugal__App__iOS `ios.yml`](https://github.com/PrompTugal/PrompTugal__App__iOS/blob/dev/.github/workflows/ios.yml) | Ubuntu jobs decide whether a Mac is needed; one macOS job per push; signing secrets only on `dev` pushes; one stable required-check name |

## Gates and tests

| What | Where | Why it is good |
|---|---|---|
| Gate that builds and checks the build changed nothing | [SGit-AI__Website__Web-Summit `admin/build/validate.js`](https://github.com/SGit-AI/SGit-AI__Website__Web-Summit/blob/dev/admin/build/validate.js) | Check 9 runs first; one script, numbered checks, `OK vX: N pages` |
| Secret scanner with self-tests | [SGit-AI__Website__Web-Summit `admin/build/secrets.cjs`](https://github.com/SGit-AI/SGit-AI__Website__Web-Summit/blob/dev/admin/build/secrets.cjs) | Fixtures built at run time; a NOT_SECRETS list (patterns owned by security@) |
| Leak scan that never prints the match | [AgentiCCells__Site__Template `scripts/leak-scan.mjs`](https://github.com/AgentiCCells/AgentiCCells__Site__Template/blob/dev/scripts/leak-scan.mjs) | Reports file, line and kind only; narrow allowlist |
| Commit trailer check | [AgentiCCells__Site__Template `scripts/check-commits.mjs`](https://github.com/AgentiCCells/AgentiCCells__Site__Template/blob/dev/scripts/check-commits.mjs) | Reads trailers the way git does; never rewrites history (use this repository's copy for dotted names) |
| Small, fast gate with a budget | [PrompTugal__News__Storm-Charles `admin/build/validate.mjs`](https://github.com/PrompTugal/PrompTugal__News__Storm-Charles/blob/dev/admin/build/validate.mjs) | 256 KB per file, no binaries, 8 s budget |
| Test runner where SKIP fails | [SGit-AI__Website__Newsroom `admin/build/run_tests.sh`](https://github.com/SGit-AI/SGit-AI__Website__Newsroom/blob/dev/admin/build/run_tests.sh) | Parallel, timeouts per test, a skipped test is a failure |

## Records and rules

| What | Where |
|---|---|
| Incident write-up with numbers and "how we will know" | [PrompTugal__News__Website `board/team/devops/health-2026-11-06.md`](https://github.com/PrompTugal/PrompTugal__News__Website/blob/dev/board/team/devops/health-2026-11-06.md) |
| CI changes proposed as patches, measured | [PrompTugal__News__Storm-Charles `ci/patches/README.md`](https://github.com/PrompTugal/PrompTugal__News__Storm-Charles/blob/dev/ci/patches/README.md) |
| The measured cost case for macOS | [PrompTugal__App__iOS `briefs/2026-11-10__ci-on-one-mac/`](https://github.com/PrompTugal/PrompTugal__App__iOS/tree/dev/briefs/2026-11-10__ci-on-one-mac) |
| The lesson of 2 Nov, as a board item | [SGit-AI__Website__Web-Summit `board/WS-105-...md`](https://github.com/SGit-AI/SGit-AI__Website__Web-Summit/blob/dev/board/WS-105-protect-main-pull-requests-only-merged-by-dinis.md) |
| Rules for parallel sessions in one repository | [VoiceDebrief__App__iOS `.claude/CLAUDE.md`](https://github.com/VoiceDebrief/VoiceDebrief__App__iOS/blob/dev/.claude/CLAUDE.md) |
| CI owns the version, the argument | [newsroom.sgit.ai: CI owns the version](https://newsroom.sgit.ai/articles/ci-owns-the-version.html) and [the rationale note](https://github.com/SGit-AI/SGit-AI__Website__Newsroom/blob/dev/admin/notes/2026-10-27__ci-owns-the-version.md) |

## Anti-examples (do not copy)

- `|| echo` after a tag step: Storm-Charles `deploy.yml` L144.
- A retry loop that ends on `sleep`: Swarm `run-packet.yml` L49.
- TestFlight upload before the iPad tests: [VoiceDebrief__App__iOS `ios.yml`](https://github.com/VoiceDebrief/VoiceDebrief__App__iOS/blob/dev/.github/workflows/ios.yml) lines 133 to 169.
- A gate that runs code from a person's lane and treats its crash as a warning: Web Summit `validate.js` check 21.
- `a && b && c` for gates under `set -e`: the site template's `release.sh` line 11.
