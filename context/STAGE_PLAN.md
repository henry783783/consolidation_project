# Stage Plan

## Status legend

- `[x]` Completed and tested on the live GitHub Pages site.
- `[~]` Implemented and currently awaiting live testing.
- `[ ]` Pending.

## Completed stages

- [x] Stage 1 — Project foundation
  - Created the static GitHub Pages application structure.
  - Established the initial HTML, CSS and JavaScript separation.

- [x] Stage 2 — Game board
  - Added the six-row, five-column guessing board.
  - Added responsive board sizing.

- [x] Stage 3 — Letter input
  - Added physical keyboard input.
  - Added on-screen keyboard input.
  - Added letter entry and backspace handling.

- [x] Stage 4 — Input validation
  - Added five-letter guess validation.
  - Added handling for incomplete guesses.
  - Added handling for words outside the development word list.

- [x] Stage 5 — Guess progression
  - Added row progression after valid guesses.
  - Prevented invalid guesses from consuming rows.
  - Added six-guess game limit.

- [x] Stage 6 — Word evaluation
  - Added correct-position, wrong-position and absent-letter evaluation.
  - Added the fixed development target word `CRANE`.

- [x] Stage 7 — Win/loss and reset flow
  - Added win detection.
  - Added loss detection after six valid guesses.
  - Added New Game reset behaviour.
  - Confirmed that New Game is hidden during play and appears after game end.

- [x] Stage 8 — Polish and accessibility
  - Added an evaluation key so colour is not the only source of result information.
  - Added accessible status messaging.
  - Added accessible descriptions for evaluated tiles.
  - Added visible keyboard focus states.
  - Improved mobile touch targets.
  - Added reduced-motion support.
  - Kept the existing three-file application structure.

## Final stage

- [x] Stage 9 — Final QA and documentation
  - Confirmed that the project remains compatible with static GitHub Pages hosting.
  - Confirmed that the application uses only HTML, CSS and vanilla JavaScript.
  - Confirmed that no build tools, packages or backend services were introduced.
  - Confirmed that the repository documentation describes the final architecture and constraints.
  - Completed the final live-site regression test.
