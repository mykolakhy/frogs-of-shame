---
name: jira-task-conventions
description: Create, review, format, and update Jira work items using the They Are Frogs project conventions. Use when a user asks to create or edit a Jira task, story, bug, design ticket, test ticket, performance ticket, acceptance criteria, scope, or ticket description, or asks whether a Jira ticket follows the project style.
---

# Jira Task Conventions

Before any Jira ticket work, read `../TASK-CONVENTIONS.md` from this skill directory. It is the shared local mirror of the project's Confluence ticket conventions and is the source of truth for the detailed templates.

Use the Atlassian connector for Jira and Confluence operations. Keep ticket content clear, testable, and aligned with the project templates. Do not create a duplicate ticket when an existing issue already covers the request.

## Workflow

1. Read `../TASK-CONVENTIONS.md` completely before drafting, reviewing, or changing a ticket.
2. Identify the requested operation: create, update, review, split, link, or explain.
3. Identify the smallest suitable issue type: Task, Story, Bug, Design, Test, or Performance.
4. Search Jira and Confluence for duplicates, parent features, related tickets, and relevant design or technical documentation.
5. Draft or review the ticket using the required structure for its issue type.
6. Make acceptance criteria observable and independently testable. Include authentication and state variations when they affect the UI.
7. Include explicit scope boundaries. For UI tickets, always separate `Included` and `Explicitly out of scope`.
8. Add a `Design reference` section even when no visual design change is needed; state that clearly and link the behavior or technical documentation.
9. Add direct links to parent/related Jira issues, Confluence pages, implementation paths, and tests where applicable.
10. After a Jira or Confluence write, fetch the updated resource and verify the title, sections, links, and acceptance criteria rendered as intended.

## UI feature ticket minimum

For a UI feature or behavior ticket, require these sections:

```markdown
## Summary
<what is changing and why>

## Scope

Included:
- <specific behavior>

Explicitly out of scope:
- <adjacent behavior or system not changed>

## Acceptance criteria
- [ ] <observable, testable outcome>
- [ ] <observable, testable outcome>

## Design reference
<direct design link, or state that no visual design change is required and link the relevant documentation>

## References
- Parent feature: <TAF-X or None — standalone>
- Related docs: <direct links>
- Implementation/tests: <repository paths>
```

For authenticated UI, state signed-out and signed-in behavior explicitly. Say whether controls are hidden, disabled, or prompt for login; do not leave that behavior implicit.

## Quality checks

- Prefer a concise title in the form `verb + object + outcome`; use an emoji only when it matches the surrounding TAF project style.
- Write user/product value before implementation details.
- Keep one behavior per acceptance-criteria checkbox.
- Avoid vague criteria such as “make it user-friendly” or “handle edge cases.”
- Record baseline and measurement method for performance work.
- For bugs, separate reproduction steps, expected result, actual result, environment, and verified cause.
- If a required detail is unknown and cannot be safely inferred, leave a clear placeholder or ask the user instead of inventing it.

## Write boundaries

- A request to explain or review a ticket is read-only; do not create or edit Jira issues.
- Creating or updating a ticket is an external write; perform it only when the user explicitly requests that action.
- Preserve existing ticket content outside the requested change and re-fetch after editing.
- Do not silently change status, assignee, priority, or labels unless the user asks for it or the ticket workflow requires it.
