/*
  Wordle-style game
  Stage 3: Keyboard input and game state

  Responsibilities in this stage:
  - Track which row is currently being edited.
  - Track which tile is currently being edited.
  - Accept physical A-Z keyboard input.
  - Display letters in the active row.
  - Remove the most recently entered letter with Backspace.

  Deliberately NOT implemented yet:
  - Guess submission.
  - Enter-key submission.
  - Word-list validation.
  - Correct/wrong-position/not-present evaluation.
  - On-screen keyboard.
  - Win/loss handling.

  Keeping these responsibilities separate makes it easier for a future
  contributor to add and test each piece without changing unrelated code.
*/

"use strict";

/*
  The board already exists in index.html, so JavaScript only needs to
  find the existing rows and tiles rather than generating new markup.
*/
const rows = document.querySelectorAll(".row");

/*
  Game state

  currentRow:
    Zero-based index of the row currently being edited.

  currentTile:
    Zero-based index of the next empty tile in that row.

  Example:
    currentRow = 0
    currentTile = 2

  means the player has entered two letters in the first row and the
  third tile is the next place a letter will be displayed.
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

  The regular expression restricts input to English alphabetic
  characters. The game displays letters in uppercase regardless
  of whether the physical key produces lowercase or uppercase.
*/
function addLetter(letter) {
  // A row can contain no more than five letters.
  if (currentTile >= 5) {
    return;
  }

  const tiles = getTiles(currentRow);

  tiles[currentTile].textContent = letter.toUpperCase();

  currentTile += 1;
}

/*
  Remove the most recently entered letter.

  If the current row is empty, Backspace has nothing to remove.
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

  This function is included now so the game state has a clear place
  for row advancement when guess submission is introduced.

  Stage 3 does not call it because Enter/submission is intentionally
  not implemented yet.
*/
function moveToNextRow() {
  if (currentRow >= rows.length - 1) {
    return;
  }

  currentRow += 1;
  currentTile = 0;
}

/*
  Handle physical keyboard input.

  We listen on the document so the player does not need to focus a
  particular element before typing.
*/
document.addEventListener("keydown", (event) => {
  /*
    Do not interfere with browser/system shortcuts such as:
    - Ctrl + key
    - Command + key
    - Alt + key
  */
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  /*
    Backspace removes the previous letter.
  */
  if (event.key === "Backspace") {
    event.preventDefault();
    removeLetter();
    return;
  }

  /*
    Enter is intentionally ignored at this stage.

    Guess submission will be added after word validation exists.
  */
  if (event.key === "Enter") {
    event.preventDefault();
    return;
  }

  /*
    Accept only single alphabetic characters.

    event.key.length === 1 prevents special keys such as Shift,
    ArrowLeft, Tab, etc. from being treated as letters.
  */
  if (/^[a-zA-Z]$/.test(event.key)) {
    event.preventDefault();
    addLetter(event.key);
  }
});
