
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

- [x] **Stage 3 — Keyboard input and game state**
  - Add JavaScript game state.
  - Accept physical keyboard input.
  - Render typed letters into the active row.
  - Add backspace handling.
  - Keep submission and validation deferred.

- [x] **Stage 4 — On-screen keyboard**
  - Add an interactive on-screen keyboard.
  - Connect it to the same input functions used by the physical keyboard.
  - Keep Enter non-submitting until validation exists.

- [x] **Stage 5 — Word validation**
  - Add the target word.
  - Add a self-contained allowed-word list.
  - Implement Enter-based guess submission.
  - Reject incomplete guesses.
  - Reject words outside the allowed list.
  - Advance to the next row after a valid guess.
  - Keep letter evaluation and win/loss handling deferred.

- [x] **Stage 6 — Guess evaluation**
  - Evaluate exact letter/position matches.
  - Evaluate letters present in the target but in the wrong position.
  - Mark absent letters.
  - Correctly handle duplicate letters.
  - Apply visual states to submitted tiles.
  - Keep win/loss handling deferred.

- [x] **Stage 7 — Win/loss flow**
  - Detect a correct target-word guess.
  - Detect when all six guesses have been used.
  - Display appropriate win/loss messages.
  - Prevent further input after the game ends.
  - Add a New Game action.

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

After each completed stage, the developer must test the live GitHub Pages deployment and explicitly approve the next stage before implementation continues.

## File-change principle

Minimise repository churn.

Future stages should preferentially extend existing files rather than creating additional files. A new file should only be introduced when it provides a clear separation of responsibility or is otherwise essential to maintainability.
