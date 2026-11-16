# Code rules to paste into CLAUDE.md

From the Code specialist's [guidance](../guidance/README.md), version 1.0.0 (2026-11-16). Paste under a heading "Code and releases".

```
## Code and releases
- Push to `dev` only. Never push to `main`; a major release is a pull request from `dev` that only Dinis merges.
- Never force-push, rewrite history, push an empty commit, or disable, skip or weaken a check.
- Release only with `scripts/release.sh`. It refuses during `board/HOLD.md`, with uncommitted changes, or with a commit lacking an `Agent:` trailer.
- Nobody types a version number. CI sets it from the tags after the push and tags the deployed commit.
- Never pipe a gate, never chain gates with `&&`, never end a gate with `|| true` or `|| echo`. Scripts start `set -euo pipefail`.
- A change to a workflow, gate or release script names its reviewer (the Code specialist, security@ or Dinis) in the commit.
- Every commit ends with `Agent: role@AgentiCCells.person` in its final trailer block and is signed with your key.
- Shipped means the live site serves the version. Check `/version.json` before saying done.
- Workers push to their own branches; one integrator releases. Never run macOS or full test suites on every push.
- Write in REALITY.md what exists, what is enforced, and what is only kept by habit.
```
