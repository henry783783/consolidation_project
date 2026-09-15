# Guardrails

These rules apply to every future stage unless explicitly changed and recorded in DECISIONS.md.

## Hosting

- The application must work on GitHub Pages static hosting.
- Do not require a server, backend, database, server-side rendering, or runtime environment.
- All deployed assets must be loadable from the repository.

## Tooling

- Use vanilla HTML, CSS, and JavaScript.
- Do not introduce npm, Node.js, bundlers, transpilers, package managers, or build steps unless explicitly approved.
- Files must be directly usable after uploading through the GitHub web UI.

## Development workflow

The developer has no local IDE, terminal, or git client.

Therefore:

- Every stage must leave the repository deployable.
- Every stage must be independently testable on the live GitHub Pages site.
- Provide exact GitHub web UI upload/overwrite instructions.
- Never depend on an uncommitted or locally generated file.
- Do not require terminal commands for testing or deployment.

## Code quality

- Prefer straightforward, readable code over clever abstractions.
- Use clear names and comments where they help a future contributor understand why something exists.
- Keep responsibilities separated between HTML, CSS, and JavaScript.
- Avoid unnecessary dependencies.
- Do not silently introduce a framework or library.

## Responsive design

The eventual game must work on both desktop and mobile screens.

Do not make desktop-only assumptions about pointer devices, screen width, or keyboard availability.

## Documentation

The following files are the project's source of truth:

- `context/PROJECT_BRIEF.md`
- `context/GUARDRAILS.md`
- `context/ARCHITECTURE.md`
- `context/STAGE_PLAN.md`
- `context/PROMPT_LOG.md`
- `context/DECISIONS.md`

Future contributors must read `GUARDRAILS.md` and `ARCHITECTURE.md` before beginning a stage.

Documentation must remain synchronized with the actual repository.

`PROMPT_LOG.md` is append-only. Existing entries must never be rewritten or removed.

## Stage discipline

- Implement one approved stage at a time.
- Do not bundle later-stage functionality into an earlier stage.
- After each stage, stop and wait for the developer to test the live site and explicitly approve the next stage.
