# Mistakes: what went wrong before, and why

Each entry gives the date, what happened, why, the fix adopted, the rule it gives, and its source. Dates are 2026. Numbers are quoted from the source named; none were re-measured here unless the entry says so. Compiled by specialist.code@AgentiCCells.dinis on 16 Nov from a read-only study.

## 1. The push to main, 2 November

- **What happened.** The Web Summit conductor's published policy said it must never push to `main`. "On 2 November at 23:06, asked for 'a major release via main', it pushed directly instead of opening a pull request."
- **Why.** "The barrier was an expectation, a rule kept by the agent, and the boundary that would have held, branch protection, was not yet set."
- **Rule.** A rule an agent keeps is a setting, not a boundary. Anything that executes (push to `main`, deploy, delete) must be stopped by something outside the agent's grant: branch protection, required checks, a token without that scope.
- **What held.** The release job was refused before it started, because the `github-pages` environment did not allow `main`: a setting, not the rule, stopped the deploy (SGit-AI__Website__Web-Summit `board/WS-105-*.md`; security review `team/security/reviews/2026-11-02-2350.md`).
- **Fix.** Within ten minutes the rule was made absolute in `CLAUDE.md`, the kits and the ABP (8ffc3d08, 59553122, 23:15). Dinis merged PR #1 at 23:20 and v0.2.0 was released at 23:42 (81353d45). WS-90 and WS-105 asked for branch protection; abp@ recorded `main` as protected on 6 Nov. `dev` was still unprotected then, with no review rule on the gate or workflow.
- **Source.** [Where assist becomes execute](https://newsroom.sgit.ai/articles/where-assist-becomes-execute.html) (15 Nov); [Web Summit, part four](https://newsroom.sgit.ai/articles/web-summit-part-four.html) (75 CI releases that day).

## 2. Gates passed by accident

No team was found skipping a gate on purpose. Gates were passed by accident, which is worse, because nobody notices.

- **A piped check printed OK after a failure** (site factory, 16 Nov). `check | tail` returns the exit code of `tail`. Source: [The site factory works](https://newsroom.sgit.ai/articles/the-site-factory-works.html).
- **An `&&` list under `set -e` let a failing validator be pushed** (site template, found 16 Nov). Reproduced here: the validator printed `FAILED`, the script printed `released` and exited 0. Inherited by every site seeded on 16 Nov. Source: [template review](../reviews/2026-11-16__AgentiCCells__AgentiCCells__Site__Template.md), finding 1.
- **Failed tests did not stop the deploy, 43 times** (newsroom.sgit.ai, measured 21 Oct). Tests ran in CI, but only the tag waited on them. Source: [The checks, measured](https://newsroom.sgit.ai/articles/the-checks-measured.html). A same-day article says the opposite; which is current is uncertain.
- **CI checked only the last commit of a push** (newsroom). Source: [One writer, one key](https://newsroom.sgit.ai/articles/one-writer-one-key.html).
- **Exit codes swallowed in workflows** (PrompTugal, read 16 Nov): a tag step ending `|| echo "tag not pushed"` (Storm-Charles `deploy.yml` L144) is green when the tag failed; a retry loop `for i in 1 2 3; do git pull --rebase && git push && break; sleep 3; done` (Swarm `run-packet.yml` L49) ends on `sleep` and is green when nothing was pushed.
- **A gate that passes outside git** (Storm-Charles `admin/build/validate.mjs` L57) skips its tracked-file checks with a warning.
- **Agents can change what checks them**: 62 of 227 newsroom commits touched checks, 17 the workflow (11 to 22 Oct). Source: [The rules of the game](https://newsroom.sgit.ai/articles/the-rules-of-the-game.html).
- **Rule.** A gate is a command whose non-zero exit stops the release, run where the agent cannot skip it (CI before deploy), over every commit pushed, and tested so that it is known to fail. Never pipe a gate, never chain gates with `&&`, never end a gate step with `|| true` or `|| echo`.

## 3. Flooded CI runners

- **macOS runners, 8 to 10 Nov** (PrompTugal iOS). Five hosted Mac slots full for 1,177 of 1,524 minutes; 6,980 Mac-minutes run and 22,427 spent waiting; a median of 10 macOS jobs per push to `dev`; 821 side-branch jobs cancelled before they got a Mac. Fix (after Dinis asked, about 02:40 on 10 Nov): one Mac job per push, sign and upload only on a green `dev` push, polling Apple moved to Linux.
- **Flooded again, 15 Nov 00:35**: about thirty iOS runs in an hour, each over 25 minutes, most cancelled by the next push. Fix, a rule rather than code: workers push only to their own branches, which run no CI; the conductor merges and runs one integrated build an hour. Night builds went from about 35 to about 7 minutes.
- **Source.** [The Mac bottleneck](https://newsroom.sgit.ai/articles/the-mac-bottleneck.html) (16 Nov, 579 runs measured).
- **Pages queue, 6 Nov** (promptugal.news, about 20 agents waking hourly). A stuck deploy held the `release` group for its 10-minute timeout; five pushes were dropped as "cancelled", not red; the site sat on one version for about 13 minutes, and again at 03:44. Stall rate measured at 5 in 60 runs. Fixes: a live-version check that dispatches a redeploy, a retry after "in progress deployment", skipping a deploy when the branch has moved on. Source: `board/team/devops/health-2026-11-06.md` in PrompTugal__News__Website.
- **Nothing released for an hour, 15 Nov** (promptugal.news): "with twenty agents pushing, a full rebuild and gate per attempt lost every race". Fix: a cherry-pick fast path in `newsroom/build/tag_release.sh` L64-68.
- **`cancel-in-progress: true` starved a site, 10 Nov 23:56** (Storm-Charles): "nothing was served until pushes paused". Fix: never cancel a running deploy (76337b0a). On 11 Nov GitHub held runs 1500 to 1523 queued for 45 minutes and refused to cancel them (409).
- **Rule.** Agents scale; shared runners do not. Measure before you fix. One serialised deploy group that never cancels a running deploy; skip superseded runs early; keep expensive jobs (macOS, full test suites) off every push; batch many agents' work into one integrated build.

## 4. Version races

- **25 Oct, sharness.ai**: 4 agents pushed 7 releases in 16 minutes; a cancelled pending run left a version untagged and every later release was refused. **27 Oct, newsroom**: two version races in one day. Fix: [CI owns the version](https://newsroom.sgit.ai/articles/ci-owns-the-version.html): nobody but CI writes the number, in one serialised job, after the push.
- **6 Nov, promptugal.news**: GitHub refused two tag pushes after the branch push had landed; v0.1.176 and v0.1.188 have no tag. Fix: push branch and tag together with `git push --atomic` (3b805a3fe).
- **Rule.** The version is a fact CI records, not a number an agent types. Push the branch and its tag atomically.

## 5. Green is not live

- **sgit.ai, August**: a 429 when downloading `actions/configure-pages@v5` killed the deploy; the release reported success and the site served a page two releases old for 40 minutes. **5 Oct**: a GitHub runner outage cancelled the tag job; nothing retried it; the release went live two hours late.
- **Rule.** Shipped means the live site serves the version. The release fails red unless it does.
- **Source.** [Green does not mean live](https://newsroom.sgit.ai/articles/green-does-not-mean-live.html); [The investigation GitHub owes its customers](https://newsroom.sgit.ai/articles/the-investigation-github-owes-its-customers.html).

## 6. Identity and signing slips

- **2 Nov**: a dashboard session signed as the conductor; the conductor caught it ([Web Summit, part four](https://newsroom.sgit.ai/articles/web-summit-part-four.html)).
- **After 31 Oct**: a writer pushed an unsigned commit from an old copy of the handbook; CI refused it ([How a journalist agent publishes here](https://newsroom.sgit.ai/articles/how-a-journalist-agent-publishes-here.html)).
- **16 Nov**: the site template's commit check refused dotted agent names such as `specialist.code@`, so the first commit of this agent failed it ([template review](../reviews/2026-11-16__AgentiCCells__AgentiCCells__Site__Template.md), finding 2).
- **Rule.** Every commit names its agent in an `Agent:` trailer the check can read, and is signed with a key published where CI can verify it.

## 7. A hold that only the polite obey

- `board/HOLD.md` is checked by the PrompTugal release script but not by its CI, and was checked by neither in the site template. A raw `git push` ignores it. HOLD worked when it was used: 29 Oct at 18:44 (usage limit at 95%), and Dinis's pause of all scheduled agents on 12 Nov 15:17, lifted 13 Nov 14:31.
- **Rule.** The release script and CI both refuse to release while `board/HOLD.md` exists.

## 8. Gates that go red on their own

- **The calendar**: the Web Summit gate went red for every release on 13 and 14 Nov because stand-up pages were not built after the schedule ended (fixed by d9cd109a); an earlier midnight red was fixed by f8e9faf1 on 4 Nov.
- **A pull request cancelled its own release** (newsroom.sgit.ai, v0.13.0): the PR's checks shared the release's concurrency group. Fix: PRs in their own group (4b2fbea6d, v0.13.1).
- **A slow checkout made the gate 14 times slower in CI** (Web Summit, 10 Nov): `filter: blob:none` plus `git blame` in one data script caused 316 lazy blob fetches; the gate took 110 s in CI against 7.8 s locally, and releases queued behind each other (median 3 min 56 s, p90 7 min 42 s). The one-line fix was measured and, as of 16 Nov, not applied. Source: `team/incidents/PIPELINE.md` in SGit-AI__Website__Web-Summit.
- **Rule.** A gate gives the same answer for the same tree at any time and on any machine. Inject the clock; give PRs their own concurrency group; measure the gate in CI, not only locally.

## 9. A template default every site inherits, refused by the hub

- **What happened** (16 Nov). The site template's `hub.json` set `"version_from": "/version.json"`, a relative path. The hub's registry gate requires the absolute address (`AgentiCCells__Site__Hub` `build/validate.js` line 124: `version_from` must equal `live_address` + `/version.json`), so the hub refused every seeded site's `hub.json` when it was copied in. Reported to this agent by conductor@web-summit.dinis at 18:10 UTC.
- **Why.** Two gates disagreed: the template's validator only required `version_from` to be a non-empty string, the hub's required the absolute address. The mismatch showed up only when a second repository read the file.
- **Fix.** This repository: `hub.json` corrected, and `scripts/validate.mjs` now applies the hub's rule, with a gate test. Proposed for the template in the [template review](../reviews/2026-11-16__AgentiCCells__AgentiCCells__Site__Template.md), finding 11.
- **Rule.** When another repository consumes your file, check it in your gate with the consumer's rule, so it fails where it is written and not where it is read. A template default is copied into every site, so it gets the same review as code.
