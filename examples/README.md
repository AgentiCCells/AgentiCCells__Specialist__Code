# Examples: the best practice we have, with links

Status: being written on 2026-11-16.

- **CI owns the version**: in the site template, a person sets `VERSION_BASE`; the workflow sets the patch number from the tags and tags the commit only after a successful deploy. See [pages.yml in the template](https://github.com/AgentiCCells/AgentiCCells__Site__Template/blob/dev/.github/workflows/pages.yml).
