# Guidance: the principles every repository should follow

Status: being written on 2026-11-16, from a read-only study of the team's repositories and the SGit Newsroom. Each principle will carry its source and an example.

## Gates

A gate that can be passed by accident is not a gate. Each gate runs as its own command, its exit code stops the release, and it is never piped, chained with `&&` under `set -e`, skipped or weakened to get a release out. Source: the [template review](../reviews/2026-11-16__AgentiCCells__AgentiCCells__Site__Template.md), finding 1.
