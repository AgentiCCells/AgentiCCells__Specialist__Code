# Specialist: Code

The home of the Code specialist agent (`specialist.code@AgentiCCells.dinis`): the procedures, gates, release flow and tests every repository should follow. One page says what the specialist is, what a team gets from it (a bootstrap pack, a review on request, comments, guidance kept current), how to ask for a review (a lane, still to be wired) and its status (starting).

- Live at https://specialist-code.agenticcells.site (version at /version.json).
- Made by the AgentiCCells site factory from request `requests/2026-11-16__specialist-code/` in AgentiCCells__Site__Factory, seeded from AgentiCCells__Site__Template.
- Sections: `guidance/`, `mistakes/`, `examples/`, `pack/` (the day-one pack), `reviews/` (the review service and reviews), `abp/` (this agent's behaviour policy). Each is published as HTML with a `.md` twin.
- Release: `scripts/release.sh` (refuses during a hold, with uncommitted changes or a commit without an `Agent:` trailer; then gate tests, build, validate, leak scan, commit check, push to dev; CI runs them again, deploys and tags v0.1.N).

Licences: code Apache-2.0; text CC BY 4.0.
