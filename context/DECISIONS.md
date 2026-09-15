# Technical Decisions

Short record of notable technical decisions and the reason for each decision.

## 2026-09-15 — Vanilla static web application

**Decision:** Use plain HTML, CSS, and JavaScript.

**Reason:** The application must be deployable through GitHub Pages without a build process, terminal, package manager, or server. Vanilla web technologies also keep the project easy for a future contributor or AI tool to inspect and continue.

## 2026-09-15 — Staged implementation

**Decision:** Build the game through independently deployable stages.

**Reason:** The developer tests exclusively through the live GitHub Pages deployment. Small stages reduce the chance of leaving a broken intermediate deployment and make regressions easier to identify.

## 2026-09-15 — Documentation as project memory

**Decision:** Maintain project context inside the repository.

**Reason:** A future contributor or AI tool may not have access to this conversation. The repository documentation therefore needs to explain the current architecture, constraints, roadmap, and important decisions.
