
- `context/STAGE_PLAN.md` (modified)

```markdown
# Stage Plan

This roadmap is the working plan for the Wordle-style game.

Status values:

- `[x]` completed
- `[ ]` pending
- `[~]` in review

## Stages

- [x] **Stage 1 — Repository foundation**
  - Establish project documentation.
  - Establish guardrails.
  - Establish architecture.
  - Add a minimal GitHub Pages entry point.
  - Verify static deployment.

- [x] **Stage 2 — Board and visual layout**
  - Add the five-column guess board.
  - Add the six guess rows.
  - Add responsive styling.
  - Keep the board non-interactive.

- [ ] **Stage 3 — Keyboard input and game state**
  - Add JavaScript game state.
  - Accept physical keyboard input.
  - Render typed letters into the active row.
  - Add backspace handling.

- [ ] **Stage 4 — On-screen keyboard**
  - Add an interactive on-screen keyboard.
  - Connect it to the same input logic used by the physical keyboard.

- [ ] **Stage 5 — Word validation**
  - Add the target word.
  - Add an allowed-word list or documented validation strategy.
  - Prevent invalid submissions.

- [ ] **Stage 6 — Guess evaluation**
  - Implement Wordle-compatible letter evaluation.
  - Correctly handle duplicate letters.
  - Display result colours/states.

- [ ] **Stage 7 — Win/loss flow**
  - Detect wins and losses.
  - Display an appropriate end-of-game message.
  - Add a new-game action.

- [ ] **Stage 8 — Polish and accessibility**
  - Improve mobile presentation.
  - Add accessible labels and interaction states.
  - Review colour contrast and keyboard usability.
  - Add restrained visual feedback.

- [ ] **Stage 9 — Final QA and documentation**
  - Test the complete game on GitHub Pages.
  - Check documented architecture against the actual repository.
  - Record final technical decisions and known limitations.

## Process rule

Only one stage is implemented at a time.

After each completed stage, the developer must test the live GitHub Pages deployment and explicitly approve the next stage before implementation continues.tage before implementation continues.
