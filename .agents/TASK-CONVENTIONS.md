# They Are Frogs task conventions

This file is the local, agent-readable mirror of the task-writing conventions maintained in Confluence. Use it when creating or updating Jira work items so agents do not need to look up the template first.

The canonical templates are maintained in the team's private documentation workspace. This local mirror intentionally contains the rules without private workspace URLs, so it can be safely committed to a public repository.

If the private templates change, update this file to keep the local conventions current.

## General rules

- Search Jira and Confluence for an existing ticket before creating a new one.
- Choose the smallest appropriate issue type: Task, Story, Bug, Design, Test, or Performance.
- Write the ticket in clear English, matching the existing TAF project style.
- Use a concise title in the form `verb + object + outcome`; an emoji prefix is fine when it matches nearby project tickets.
- Describe user or product value before implementation details.
- Keep each acceptance criterion independently testable and use one behavior per checkbox.
- State authentication, authorization, empty, loading, error, and success states when they affect the behavior.
- Explicitly exclude adjacent work to prevent scope creep.
- Link directly to design references, related Jira tickets, Confluence pages, code paths, and test files.
- After creating or editing a ticket, fetch it again and verify that all required sections and links rendered correctly.

## UI feature ticket

Use this for a screen, component, modal, control, or new state of an existing UI.

Required structure:

```markdown
## Summary
<what UI is being built or changed and why>

## Scope

Included:
- <specific behavior or UI change>

Explicitly out of scope:
- <adjacent behavior or system not changed by this ticket>

## Acceptance criteria

- [ ] <observable behavior>
- [ ] <observable behavior>
- [ ] <validation or test outcome>

## Design reference
<design ticket, Confluence design page, Claude Design project, or an explicit statement that no visual design change is required>

## References

- Parent feature: <TAF-X or None — standalone>
- Related docs: <direct Confluence link>
- Implementation: <relevant repository paths>
```

For authenticated UI, specify both signed-out and signed-in behavior. If a control is hidden rather than disabled, say so explicitly.

## Bug ticket

Use this structure:

```markdown
## Summary
<what is broken and user impact>

## Environment
- URL/build:
- Browser/device:
- Account state:

## Steps to reproduce
1. ...
2. ...

## Expected result
<what should happen>

## Actual result
<what happens instead>

## Scope
Included:
- <fix boundary>

Explicitly out of scope:
- <related issue not fixed here>

## Acceptance criteria
- [ ] <regression is fixed>
- [ ] <relevant regression test exists>

## References
- Related ticket or documentation links
```

Include a reliable reproduction path and distinguish the expected result from the actual result. Do not describe a suspected cause as fact unless it has been verified.

## Design ticket

Document the problem, target user, design goals, affected screens, states, responsive behavior, and the source design reference. Acceptance criteria should cover the delivered states and design-system usage, not just the existence of a mockup.

## Test ticket

Document the layer (unit, API, integration, or E2E), target behavior, setup/data requirements, and the scenarios that must be covered. State which external dependencies or secrets can block execution.

## Performance ticket

Record the baseline, target, measurement method, constraints, and what must remain unchanged. Acceptance criteria must include a reproducible before/after measurement and a quality check where applicable.

## Acceptance-criteria style

Prefer:

- `[ ] A signed-out visitor does not see favorite stars on frog cards.`
- `[ ] The Clear button is visible only when the query contains non-whitespace text.`
- `[ ] The relevant unit test and production build pass.`

Avoid:

- `[ ] Implement the new component.`
- `[ ] Make it user-friendly.`
- `[ ] Handle edge cases.`

The preferred form describes an observable result, not an internal implementation task or a vague quality claim.
