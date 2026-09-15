/*
  Wordle-style game
  Stage 4: On-screen keyboard

  Responsibilities in this stage:
  - Track the active row and tile.
  - Accept physical A-Z keyboard input.
  - Accept matching input from the on-screen keyboard.
  - Display letters in the active row.
  - Remove the most recently entered letter with Backspace.

  Deliberately NOT implemented yet:
  - Guess submission.
  - Word-list validation.
  - Guess evaluation.
  - Win/loss handling.

  Physical and on-screen input both call the same functions.
  This prevents the two input methods from developing different behaviour.
*/

"use strict";

const rows = document.querySelectorAll(".row");

/*
  Game state

  currentRow:
    Zero-based index of the row currently being edited.

  currentTile:
    Zero-based index of the next empty tile in that row.
*/
let currentRow = 0;
let currentTile = 0;

/*
  Return all tiles belonging to a particular row.
*/
function getTiles(rowIndex) {
  return rows[rowIndex].querySelectorAll(".tile");
}

/*
  Add a letter to the current position.
*/
function addLetter(letter) {
  // A Wordle guess contains no more than five letters.
  if (currentTile >= 5) {
    return;
  }

  const tiles = getTiles(currentRow);

  tiles[currentTile].textContent = letter.toUpperCase();

  currentTile += 1;
}

/*
  Remove the most recently entered letter.
*/
function removeLetter() {
  if (currentTile <= 0) {
    return;
  }

  currentTile -= 1;

  const tiles = getTiles(currentRow);

  tiles[currentTile].textContent = "";
}

/*
  Move to the next row.

  This remains unused in Stage 4 because Enter does not submit
  guesses until validation is implemented in a later stage.
*/
function moveToNextRow() {
  if (currentRow >= rows.length - 1) {
    return;
  }

  currentRow += 1;
  currentTile = 0;
}

/*
  Handle a letter from either input source.

  Both the physical keyboard and the on-screen keyboard use this
  same function, so their behaviour stays consistent.
*/
function handleLetter(letter) {
  if (/^[a-zA-Z]$/.test(letter)) {
    addLetter(letter);
  }
}

/*
  Handle an action from either input source.

  "backspace" removes a letter.
  "enter" is intentionally ignored until Stage 5.
*/
function handleAction(action) {
  if (action === "backspace") {
    removeLetter();
    return;
  }

  if (action === "enter") {
    // Guess submission is intentionally not implemented yet.
  }
}

/* ------------------------------
   Physical keyboard
   ------------------------------ */

document.addEventListener("keydown", (event) => {
  /*
    Do not interfere with browser/system shortcuts.
  */
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  if (event.key === "Backspace") {
    event.preventDefault();
    handleAction("backspace");
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    handleAction("enter");
    return;
  }

  if (/^[a-zA-Z]$/.test(event.key)) {
    event.preventDefault();
    handleLetter(event.key);
  }
});

/* ------------------------------
   On-screen keyboard
   ------------------------------ */

/*
  Find every on-screen keyboard button directly.

  Direct listeners are deliberately used here instead of event
  delegation. There are only 28 buttons, so this is easy to understand
  and makes each button's connection to the input system explicit.
*/
const keyboardButtons = document.querySelectorAll(".keyboard button");

keyboardButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.key;

    if (!key) {
      return;
    }

    if (key === "backspace" || key === "enter") {
      handleAction(key);
      return;
    }

    handleLetter(key);
  });
});
