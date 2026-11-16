# Guidance: the principles every repository should follow

The compression of what the AgentiCCells, SGit-AI and PrompTugal teams have learnt about procedures, gates, release flow and tests, up to 16 Nov 2026. Each principle has its source and an example. Where a principle comes from a mistake, the [mistakes page](../mistakes/README.md) tells the story. Kept by specialist.code@AgentiCCells.dinis; changes need the skill owner's word (Dinis Cruz).

Version 1.0.0, 2026-11-16. Status: first version, from a read-only study; not yet reviewed by Dinis.

## Branches and who may push

### 1. `dev` is the release branch; nobody but Dinis puts anything on `main`

Agents push to `dev` only. A major release is a pull request from `dev` to `main` that only Dinis merges; the merge is the release. Never force-push, rewrite history, or push an empty commit.

- Source: SGit-AI__Website__Web-Summit `CLAUDE.md` line 7: "No agent ever pushes to `main`, for any reason, even when asked for a major release."
- Example: Web Summit PR #1 (d94d368a), merged by Dinis on 2 Nov at 23:20, released v0.2.0.

### 2. A rule an agent keeps is a setting; a boundary is enforced from outside

Back every "never" with something the agent cannot change: branch protection on `main`, the Pages environment limited to `dev`, a token without the scope. Until the setting exists, write in `REALITY.md` that the rule is kept, not enforced.

- Source: [Where assist becomes execute](https://newsroom.sgit.ai/articles/where-assist-becomes-execute.html): "a control bounds a grant only if it is enforced by something the grant does not include."
- Example: on 2 Nov the `github-pages` environment, not the conductor's policy, stopped the deploy from `main` ([mistake 1](../mistakes/README.md#1-the-push-to-main-2-november)).

### 3. Many workers, one integrator

When many agents work on one repository, dotted workers push to their own branches (`work/<role>.<speciality>`), which run cheap checks or none; one agent merges ready work and releases. CI is shared; agents are not the bottleneck, runners are.

- Source: [The Mac bottleneck](https://newsroom.sgit.ai/articles/the-mac-bottleneck.html): "One integrated build an hour, run by the conductor, did more on the night than any pipeline change." PrompTugal__News__Website `CLAUDE.md` line 31.
- Example: the PrompTugal workflow gates a worker branch on a test merge with `dev` that is never pushed (`deploy-pages.yml` lines 56 to 67).

## Versions

### 4. CI owns the version

Nobody who pushes writes a release number. A person sets the major and minor; one serialised CI job picks the patch number from the tags after the push, records it, tags it and deploys exactly that commit. The commit subject carries no number. A guard fails the run if anyone else changed the version file.

- Source: [CI owns the version](https://newsroom.sgit.ai/articles/ci-owns-the-version.html): "The rule is one sentence: nobody but CI writes the number."
- Examples: the site template's `pages.yml` (`VERSION_BASE` set by a person, tag only after a successful deploy); newsroom.sgit.ai's workflow, which fails if a non-CI commit sets `version.txt` and deploys only the stamped SHA; Storm-Charles, whose version is never committed at all.

### 5. Push the branch and its tag atomically

`git push --atomic origin HEAD:dev "$TAG"`. Two separate pushes lose tags when the second is refused.

- Source: PrompTugal__News__Website `newsroom/build/tag_release.sh` lines 10 to 14 and 63; two releases of 6 Nov have no tag.

## Gates

### 6. A gate is a command whose failure stops the release, and nothing else is

A check that prints a warning, runs only in the agent's session, or does not stop the deploy is a setting. A gate exits non-zero, runs in CI before the deploy, and the deploy `needs` it. Tests that matter are gates; tests that call live services or the clock run in a separate, non-blocking job.

- Source: [Where a check runs](https://newsroom.sgit.ai/articles/where-a-check-runs.html); [The checks, measured](https://newsroom.sgit.ai/articles/the-checks-measured.html): "A failed test run does not stop the deploy: it happened 43 times."
- Example: newsroom.sgit.ai's `release` job `needs: [validate, reader-tests]`; `wire-live` is `continue-on-error` on purpose.

### 7. A gate that can be passed by accident is not a gate

- Each gate is its own command. Never pipe a gate (`gate | tail` returns `tail`'s code), never chain gates as `a && b && c` under `set -e` (only the last failure stops the script), never end a gate with `|| true` or `|| echo`.
- Shell scripts start `set -euo pipefail`. Workflow steps that pipe set `shell: bash` with `-o pipefail`.
- A retry loop must fail when every attempt fails: end it with `exit 1`, not with `sleep`.
- Source: [mistake 2](../mistakes/README.md#2-gates-passed-by-accident); the [template review](../reviews/2026-11-16__AgentiCCells__AgentiCCells__Site__Template.md), finding 1 (reproduced).
- Example: this repository's [`scripts/release.sh`](https://github.com/AgentiCCells/AgentiCCells__Specialist__Code/blob/dev/scripts/release.sh).

### 8. Gates run on what is pushed, over every commit pushed

Refuse to release with uncommitted changes. In CI, check the whole pushed range (`before..after`), not only the last commit. The gate builds the site itself and fails if the build changed a tracked file.

- Source: [One writer, one key](https://newsroom.sgit.ai/articles/one-writer-one-key.html): "in a push of several, only the last is checked there"; Web Summit `validate.js` check 9.
- Example: the template's `check-commits.mjs` checks every non-merge commit in the pushed range.

### 9. Test the gates

Every gate has a test that feeds it one known problem and asserts it fails. Secret scanners build their fixtures at run time so they do not match themselves.

- Example: `admin/build/secrets.cjs` in SGit-AI__Website__Web-Summit and PrompTugal__News__Website self-tests against fixtures; newsroom.sgit.ai's `run_tests.sh` counts a SKIP as a failure.

### 10. Gates are deterministic and fast

Same tree, same answer, any day, any machine: inject the clock. Measure the gate's time in CI; give it a budget (Storm-Charles: 8 s). Do not use blobless clones for jobs that read many blobs.

- Source: [mistake 8](../mistakes/README.md#8-gates-that-go-red-on-their-own).

### 11. Changing a gate needs a second key

An agent may change content freely, may change what checks its work only with a second key (a review by this specialist or security@, or Dinis), and may never change its own rules. Until CODEOWNERS or a sidecar enforces this, every change to a workflow, gate or release script names its reviewer in the commit.

- Source: [The rules of the game](https://newsroom.sgit.ai/articles/the-rules-of-the-game.html): 62 of 227 commits touched checks.

## Releases

### 12. One release script, in the repository, that refuses before it pushes

`scripts/release.sh` (or `admin/tools/release.sh`): refuses while `board/HOLD.md` exists, off `dev`, with a dirty tree, with a hand-edited version file, or with a commit lacking an `Agent:` trailer; rebases; runs every gate; pushes with a bounded retry; waits for the live site. Tools live in the repository, not the session.

- Source: [How a memo becomes a release](https://newsroom.sgit.ai/articles/how-a-memo-becomes-a-release.html): moving the tools into the repository "is the next step".
- Examples: PrompTugal__News__Website `newsroom/tools/release.sh`; this repository's `scripts/release.sh`.

### 13. Shipped means live

The release is done when the live site serves its version, checked from outside. A deploy that reports success but serves an older version fails red.

- Source: [Green does not mean live](https://newsroom.sgit.ai/articles/green-does-not-mean-live.html).
- Example: Storm-Charles `deploy.yml` lines 112 to 127 poll `version.json` and fail unless it serves this version or newer.

### 14. A hold stops releases in the script and in CI

`board/HOLD.md` is checked first in every wake, by the release script, and by the workflow. Anyone may write it; only a person removes it.

- Source: [The ultimate insider case study](https://newsroom.sgit.ai/articles/the-ultimate-insider-case-study.html); [mistake 7](../mistakes/README.md#7-a-hold-that-only-the-polite-obey).

## CI shape and cost

### 15. One deploy queue that never cancels a running deploy

`concurrency: { group: release, cancel-in-progress: false }` on the release or deploy job; pull requests in their own group; skip superseded runs early ("is this still the branch head?"). Know that GitHub keeps only the newest pending run, so the release script must not assume its own run will deploy.

- Source: [mistake 3](../mistakes/README.md#3-flooded-ci-runners); Storm-Charles 76337b0a.
- Example: Storm-Charles `deploy.yml`.

### 16. Least privilege per job

Split jobs by permission: the build job reads only (`contents: read`, `persist-credentials: false`); the deploy and tag jobs run no repository code. Pin actions by commit SHA. Never interpolate `${{ github.event.inputs.* }}` into a shell line; pass it through `env:`.

- Example: Storm-Charles `deploy.yml` (build, deploy and tag split; tag through the API with no checkout).

### 17. Expensive runners are a shared budget

macOS jobs, full browser suites and long builds run once per integrated build, not per push or per step. Measure queue time as well as run time.

- Source: [The Mac bottleneck](https://newsroom.sgit.ai/articles/the-mac-bottleneck.html): 22,427 Mac-minutes waiting against 6,980 run (8 to 10 Nov).

## Identity and records

### 18. Every commit names its agent and is signed

`Agent: role@AgentiCCells.person` in the final trailer block (dots allowed in the role), signed with the agent's own key, the public key published where CI can verify it. Model ids only in the trailers.

- Source: [Identity for agents, layer by layer](https://newsroom.sgit.ai/articles/identity-for-agents-layer-by-layer.html); `CLAUDE.md`.

### 19. `REALITY.md` says what exists, and the release keeps it true

Write what exists, what is only kept by habit, and what is only proposed. Web Summit's `tag_release.sh` writes the version into `REALITY.md` on every release.

- Source: [The team's operating system](https://newsroom.sgit.ai/articles/the-teams-operating-system.html): REALITY "fell behind in the busiest days".

### 20. Incidents get a write-up with numbers and a way to know the fix worked

Sources, measurements, the fix, and "how we will know it worked". Some fixes are rules, not code.

- Example: PrompTugal__News__Website `board/team/devops/health-2026-11-06.md`; Storm-Charles `ci/patches/README.md` (CI changes proposed as patches with before and after measurements).
