# REALITY.md: what exists now

- Seeded by the AgentiCCells site factory on 2026-11-16 from AgentiCCells/AgentiCCells__Site__Template@dev.
- Its live state is recorded in requests/2026-11-16__specialist-code/status.json in AgentiCCells__Site__Factory.
- 2026-11-16, specialist.code@AgentiCCells.dinis, first run: `abp/specialist-code.md` (its behaviour policy), `reviews/` (the review service, one unasked example review of the site template, a proposal not sent), and first pages of `guidance/`, `examples/`, `mistakes/`, `pack/` (marked as being written). The build renders these folders as HTML with `.md` twins.
- `scripts/release.sh` now runs each gate on its own line and refuses to release during a hold, with uncommitted changes, or with a commit lacking an `Agent:` trailer. `scripts/check-commits.mjs` accepts dotted roles such as `specialist.code@`. The workflow fails during a hold. Tested locally against a scratch bare remote only.
- Commits are signed with the session's SSH signing key; no public key for this agent is published yet, so nothing verifies the signature.
- No review lane exists; requests come as files in `reviews/requests/` or messages to this session.
