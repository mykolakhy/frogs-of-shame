---
name: update-test-coverage-confluence
description: Keep the They Are Frogs Test Pyramid Confluence coverage page synchronized with the repository. Use whenever an agent adds, removes, renames, or materially changes automated tests, test fixtures, test categories, test commands, or CI test configuration, and whenever an agent is asked to report current test counts.
---

# Update Test Coverage in Confluence

Keep the existing Test Pyramid coverage page current after repository test changes.

## Source of truth

- Repository: `They Are Frogs`
- Confluence page title: `🧪 Test Pyramid — Automated Test Coverage` (the current title may include a date suffix)
- Test-count command: `npm run test:count`

Find the existing Confluence page by title in the connected workspace. Do not hardcode internal Confluence URLs, cloud IDs, space keys, or page IDs in repository files, and do not create a duplicate coverage page.

## Required workflow

1. Work from the repository root and inspect the test diff.
2. Run `npm run test:count` after all test-related file changes are complete. Treat its output as the authoritative count. Do not count test files manually.
3. Run the relevant validation available for the changed scope, such as `npm run typecheck`, `npm run test:fast`, `npm run test:contracts`, or the relevant API/integration/E2E command. Record which checks passed, failed, or were blocked by missing secrets/tools.
4. Search the connected Confluence workspace for `🧪 Test Pyramid — Automated Test Coverage`. If the title has a date suffix, select the current page whose title starts with that phrase and belongs to the They Are Frogs project space. Fetch the selected page before updating it. Preserve the current page structure and English language.
5. Update the same page with:
   - the current date as `Report date`;
   - the current test counts by category and total;
   - the number of files per category when available;
   - validation results, clearly distinguishing passed checks from credential-gated or unavailable suites;
   - a concise summary of the test-architecture changes when the structure changed;
   - the reproducible `npm run test:count` command;
   - a link to the repository only when it is already present on the fetched page or can be safely resolved through the connected tools; never hardcode private URLs into this skill.
6. Fetch the updated page again and verify that the rendered content contains the new counts and no accidental duplicate sections.
7. Verify that the page is fully English. Search the fetched page content for Cyrillic characters (`[\u0400-\u04FF]`); if any are found, translate them and fetch again before reporting completion.

## Category rules

Use the categories emitted by `scripts/count-test-cases.mjs` exactly:

- `Unit / Business Logic`
- `Component / Module`
- `API / Service`
- `Integration`
- `Contract`
- `E2E`

Remember that API describes an interface, while the test level is determined by scope and real dependencies. Keep the repository's existing primary-category mapping unless the counting script is intentionally changed.

For E2E, distinguish configured test declarations from tests actually executed. If authentication credentials are unavailable, report the configured count and explicitly mark the authenticated scenario as skipped or unexecuted.

## Confluence update rules

- Use the Atlassian Rovo Confluence search, fetch, and update tools.
- Preserve the discovered page title, parent, and space unless the user explicitly requests a move.
- Keep all page prose, labels, headings, table headers, and status text in English.
- Never silently replace a passed result with a configured count; label both when they differ.
- Do not claim API, integration, or authenticated E2E tests passed unless they were actually executed.
- If no matching page can be found, or the page cannot be fetched or updated because the Atlassian connector is unavailable, report the blocker and provide the exact count output; do not create a substitute page.

## Handoff

Report the updated page URL, the category counts, the validation status, and any blocked suites. If code changes are also being committed, keep the Confluence update and repository test-count output aligned with the same final state.
