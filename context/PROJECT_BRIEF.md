# Project Brief

## Project

A Wordle-style word-guessing game designed for static hosting on GitHub Pages.

## Core game concept

The player attempts to guess a hidden five-letter word within a limited number of attempts.

For each submitted guess, letters will eventually be evaluated as:

- **Correct position** — the letter is in the target word and in the correct position.
- **Wrong position** — the letter is in the target word but in a different position.
- **Not present** — the letter does not occur in the target word, subject to normal Wordle duplicate-letter rules.

The game provides both physical keyboard and on-screen keyboard input.

## Current stage

Stage 5 adds actual guess submission and validation.

The development target is currently the fixed word `CRANE`. A small self-contained list of five-letter words is used to determine whether a submitted guess is accepted.

A valid five-letter word advances the player to the next row. An incomplete or unrecognised word remains on the current row and displays a validation message.

Letter evaluation and win/loss behaviour are deliberately deferred to later stages.

## Scope boundaries

The project should remain:

- A client-side static web application.
- Deployable directly through GitHub Pages.
- Usable without a server or database.
- Beginner-readable and maintainable.
- Mobile-friendly.
- Built with vanilla HTML, CSS, and JavaScript unless a documented decision explicitly changes this.

## Planned core gameplay

The eventual game should include:

1. A five-column guess board.
2. A finite number of guesses.
3. A hidden target word.
4. Guess validation.
5. Correct/wrong-position/not-present feedback.
6. Physical keyboard input.
7. On-screen keyboard input.
8. Win and loss states.
9. A way to start a new game.
10. Responsive presentation for desktop and mobile.

Features outside the core game should only be added when explicitly approved as a later stage.
