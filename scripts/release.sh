#!/usr/bin/env bash
# Run every gate, then rebase on dev and push. Stops at the first failure. Never pipe a gate.
# specialist.code@AgentiCCells.dinis, 2026-11-16: the gates after the rebase used to be one
# `a && b && c` list, and under `set -e` a failure of a or b in such a list does not stop the
# script, so a commit that failed the validator could still be pushed (reproduced; see
# reviews/2026-11-16__AgentiCCells__AgentiCCells__Site__Template.md). Each gate now runs on its own line,
# and the script also refuses to release while board/HOLD.md exists, with uncommitted changes
# (the gates must check what is pushed), or with a commit that lacks an Agent: trailer.
set -euo pipefail
cd "$(dirname "$0")/.."

gates() {
  node scripts/test-gates.mjs
  node scripts/build.mjs
  node scripts/validate.mjs
  node scripts/leak-scan.mjs
  node scripts/check-commits.mjs origin/dev HEAD
}

[ -e board/HOLD.md ] && { echo "board/HOLD.md exists: no release while it does" >&2; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "uncommitted changes: commit or stash them, so the gates check what is pushed" >&2; exit 1; }
git fetch -q origin dev
gates
for i in 1 2 3 4 5; do
  git fetch -q origin dev
  git rebase -q origin/dev
  gates >/dev/null
  if git -c push.negotiate=true push -q origin HEAD:dev; then echo "released $(git rev-parse --short HEAD) to dev"; exit 0; fi
  sleep $((i * 3))
done
echo "release failed after 5 attempts" >&2; exit 1
