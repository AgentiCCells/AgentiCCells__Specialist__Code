<!-- description: How to ask the Code specialist for a review, what a review looks like, how fast it comes back, and the rules the reviewer keeps. -->
# Reviews: how to ask the Code specialist for one

The Code specialist reviews a repository's procedures, gates, release flow and tests, and answers with a written review and, where useful, a proposed patch. It does not apply the patch: the team that owns the repository decides and applies it.

## How to ask

For now there are two ways. A lane will replace them once it is wired.

1. **A file in this repository**: add `reviews/requests/YYYY-MM-DD__<team>__<repo>.md` on a branch of your own and ask Dinis Cruz (or the conductor) to merge it, or ask this session to add it for you. Use the template below.
2. **A message to this session** (`specialist.code@AgentiCCells.dinis`), from your conductor or from Dinis, with the same fields.

```
# Review request
- From: dev@<team>.<person>            (who asks)
- Repository: <owner>/<repo>
- Branch and commit: dev @ <sha>        (what to read; default: dev at the time of the review)
- Scope: release flow | gates | tests | CI cost | everything
- Why now: first release / incident / new pipeline / periodic
- Deadline: <date> or "none"
- Can the specialist comment on the pull request? no (default) | yes, PR #<n>
```

## What a review looks like

Each review is one file, `reviews/YYYY-MM-DD__<owner>__<repo>.md`, with:

- **Header**: who asked, when, the commit read, the reviewer, and whether it was asked for or is an unasked example.
- **Verdict**: one of *ready to release*, *release after the must-fix items*, *do not release*.
- **Findings**, most severe first, each with: the file and line, what is wrong, what could go wrong (a concrete scenario), the principle it breaks (a link into [guidance](../guidance/README.md)), and a proposed fix.
- **Severity**: *must fix* (a gate can be bypassed, a secret can leak, a release can go out without checks, CI can be flooded), *should fix* (a check is weaker than our guidance), *note* (style, clarity).
- **What is good**: what the team should keep, and anything worth copying into [examples](../examples/README.md).
- **Proposed patch**: a diff the team can apply, when the fix is mechanical.

## Turnaround

- Acknowledged within the session in which the request arrives.
- A review of one repository: same working day for a site repository; up to two working days for a repository with apps, multiple workflows or a build for iOS or Android.
- These are targets, not measurements: the service started on 2026-11-16 and has no record yet.

## Rules the reviewer keeps

- Reads a pinned commit and says which.
- Never pushes to the reviewed repository, never opens issues or pull requests there, and comments on a pull request only when Dinis has allowed it for that repository (see the [policy](../abp/specialist-code.md)).
- Never advises skipping, disabling or weakening a check to get a release out.
- Never quotes a secret; reports its location only.

## Reviews so far

- [2026-11-16: AgentiCCells__Site__Template](2026-11-16__AgentiCCells__AgentiCCells__Site__Template.md), unasked example, written as a proposal.
