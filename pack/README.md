<!-- description: The day-one pack a new team copies: the release script, the gates and their tests, the workflow, rules for CLAUDE.md, and a checklist. -->
# The day-one pack for a new team

What a new team copies on its first day so that it starts from the team's best practice on code, gates and releases, not from scratch. Version 1.0.0, 2026-11-16, kept by specialist.code@AgentiCCells.dinis. Status: first version; not yet used by a new team.

A site made by the AgentiCCells site factory already has most of this from [AgentiCCells__Site__Template](https://github.com/AgentiCCells/AgentiCCells__Site__Template). Until the factory applies the [template review](../reviews/2026-11-16__AgentiCCells__AgentiCCells__Site__Template.md), apply step 2 by hand.

## 1. Read first (30 minutes)

1. [Guidance](../guidance/README.md): twenty principles, each with a source.
2. [Mistakes](../mistakes/README.md): what went wrong before and why.
3. [CI owns the version](https://newsroom.sgit.ai/articles/ci-owns-the-version.html) and [Where assist becomes execute](https://newsroom.sgit.ai/articles/where-assist-becomes-execute.html).

## 2. Copy these files

From [AgentiCCells__Specialist__Code](https://github.com/AgentiCCells/AgentiCCells__Specialist__Code), branch `dev`. Record the source commit in your first commit message.

| File | What it gives you |
|---|---|
| `scripts/release.sh` | The only way to release: refuses during a hold, with a dirty tree, or with a commit lacking an `Agent:` trailer; runs every gate on its own line; bounded retry |
| `scripts/check-commits.mjs` | Every commit carries `Agent: role@AgentiCCells.person` (dots allowed) |
| `scripts/test-gates.mjs` | Proves each gate fails when it should; adapt the cases to your gates |
| `scripts/validate.mjs` | The site gate: wording (em dash, hype words), title, description, lang, no third-party scripts, links resolve, `hub.json` |
| `scripts/leak-scan.mjs` | Secret shapes over tracked files and the build; never prints a match (patterns owned by security@) |
| `.github/workflows/pages.yml` | Hold check, commit check from the last release tag, gate tests, gates, deploy, tag; CI owns the version |
| [`claude-md-code-rules.md`](claude-md-code-rules.md) | The code section to paste into your `CLAUDE.md` |
| [`reality-template.md`](reality-template.md) | A `REALITY.md` that separates enforced, kept by habit, and proposed |

For an app repository (iOS, Android), copy the rules and the release script's refusals, and read the app examples in [examples](../examples/README.md#workflows) before writing a macOS workflow: macOS runners are shared by every team.

## 3. Check on day one

- [ ] `bash scripts/release.sh` refuses when `board/HOLD.md` exists (try it).
- [ ] `node scripts/test-gates.mjs` prints OK.
- [ ] Your first push to `dev` produces a green run, a `vX.Y.0` tag and a live `/version.json` with that version.
- [ ] Nobody types a version number anywhere.
- [ ] Every workflow step that can fail has no `|| true`, `|| echo` or pipe after it.
- [ ] `main` is untouched; if you need a major release, ask Dinis for a pull request from `dev`.
- [ ] `REALITY.md` says which of your rules are enforced and which are kept by habit.
- [ ] Your agents' names are written `role@AgentiCCells.person` and in every commit trailer.

## 4. Ask for a review before your first public release

File a request as described in [reviews](../reviews/README.md). The specialist reads a pinned commit and answers with findings and a proposed patch; your team applies it.
