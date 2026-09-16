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

[ ] Stage 10 — Dynamic word-length foundation
Remove hard-coded board dimensions and establish WORD_LENGTH
as the game's single source of truth while retaining the
existing five-letter CRANE development configuration.

[ ] Stage 11 — Supported word-length selection
Add an accessible player control for choosing from the
supported word lengths.

[ ] Stage 12 — Multi-length gameplay
Make target handling, guess validation, evaluation, reset
behaviour and user-facing instructions work correctly for
every supported word length.

[ ] Stage 13 — Random word-length mode
Add a Random option that selects one of the supported lengths
whenever a new game begins and clearly tells the player which
length was selected.

[ ] Stage 14 — Random target selection
Replace the fixed CRANE target with random selection from the
appropriate word collection. A new target must be selected
whenever a new game begins, including when using New Game.

[ ] Stage 15 — Dictionary/data design
Establish the definition of an acceptable English word,
identify a suitable legally redistributable English word
dataset, and decide how target words and accepted guesses
should be represented.

[ ] Stage 16 — Expanded dictionary
Replace the small development dictionary with the selected
comprehensive word data, filtered and organised for the
supported word lengths.

[ ] Stage 17 — Dictionary validation and edge cases
Thoroughly test the expanded word data, including word-length
filtering, duplicate letters, unusual valid words, invalid
guesses, target selection and data-loading/error behaviour.

[ ] Stage 18 — Final responsive and accessibility pass
Review the completed multi-length game across desktop and
mobile layouts and improve keyboard navigation, focus states,
screen-reader information, status messages and other
accessibility issues discovered during testing.

[ ] Stage 19 — Final game-flow and polish pass
Review the complete game experience end-to-end, including
starting a game, selecting a length, randomising length,
making guesses, winning, losing, starting a new game and
handling unexpected states. Fix only issues identified by
this review.

[ ] Stage 20 — Optional enhancements
Review possible additional features such as statistics,
sharing/results summaries, daily puzzles, hard mode, themes
and other quality-of-life improvements. Implement only those
explicitly approved after the core game is complete.
