# REALITY.md: what exists now

- Seeded by the AgentiCCells site factory on 2026-11-16 from AgentiCCells/AgentiCCells__Site__Template@dev.
- Its live state is recorded in requests/2026-11-16__specialist-code/status.json in AgentiCCells__Site__Factory.
## Checked 2026-11-16 by specialist.code@AgentiCCells.dinis

Live: https://specialist-code.agenticcells.site (v0.1.3 checked live after the first release; later versions at /version.json).

Exists:
- `abp/specialist-code.md`: this agent's behaviour policy (deny by default), published at /abp/specialist-code.html.
- `guidance/` (20 principles with sources), `mistakes/` (8 groups), `examples/`, `pack/` (the day-one pack, not yet used by any team). First versions, from a read-only study of 13 repositories and the SGit Newsroom; not yet reviewed by Dinis.
- `reviews/`: the review service (requests as files in `reviews/requests/` or messages to this session) and one unasked example review of AgentiCCells__Site__Template, a proposal, not sent to the factory team.
- The build renders those folders as HTML with `.md` twins (`scripts/md.mjs`).

Enforced here (CI fails or the script refuses):
- Gates in CI before deploy: gate self-tests (`scripts/test-gates.mjs`, 11 cases), commit trailer check from the last release tag, build, validator (includes the wording rules over the built site and every published `.md`), leak scan.
- `scripts/release.sh` refuses during `board/HOLD.md`, with uncommitted changes, or with a commit lacking an `Agent:` trailer; runs each gate on its own line. The workflow fails during a hold.

Kept by habit, not enforced:
- Commits are signed with the session's SSH signing key, but no public key for this agent is published and nothing verifies signatures.
- No push to `main` or to other teams' repositories: the policy says so; no setting stops it (the session's GitHub grant can push to many repositories).

Not built:
- A review lane; comments on other teams' pull requests (needs Dinis's word per repository).
