/*
  Wordle-style game
  Stage 5: Word validation and guess submission

  This file controls:
  - Physical keyboard input.
  - On-screen keyboard input.
  - Backspace.
  - Five-letter guess validation.
  - Guess submission with Enter.
  - Movement to the next row after a valid guess.

  Not yet implemented:
  - Letter colours/evaluation.
  - Duplicate-letter evaluation.
  - Win/loss detection.
  - New game/reset functionality.
*/

"use strict";

/* ------------------------------
   Word data
   ------------------------------ */

/*
  The target is fixed during development so that testing is predictable.

  This will eventually be replaced by a proper random target selection
  system in a later stage.
*/
const targetWord = "CRANE";

/*
  Small development dictionary.

  Only five-letter entries are accepted by the game. Keeping the list
  here avoids introducing another file at this stage.
*/
const allowedWords = new Set([
  "ABOUT",
  "ABOVE",
  "AFTER",
  "AGAIN",
  "ALONE",
  "APPLE",
  "BEACH",
  "BEGIN",
  "BLACK",
  "BLAME",
  "BLIND",
  "BLOCK",
  "BRAIN",
  "BRAVE",
  "BREAD",
  "BREAK",
  "BRING",
  "BROWN",
  "BUILD",
  "CARRY",
  "CAUSE",
  "CHAIN",
  "CHAIR",
  "CHART",
  "CHASE",
  "CHEAP",
  "CHECK",
  "CHEST",
  "CHILD",
  "CLEAN",
  "CLEAR",
  "CLIMB",
  "CLOCK",
  "CLOSE",
  "CLOUD",
  "COACH",
  "COAST",
  "COLOR",
  "COUNT",
  "COURT",
  "COVER",
  "CRANE",
  "CRAZY",
  "CREAM",
  "CROSS",
  "CROWD",
  "CROWN",
  "DANCE",
  "DEATH",
  "DEPTH",
  "DOUBT",
  "DOZEN",
  "DREAM",
  "DRINK",
  "DRIVE",
  "EARTH",
  "EMPTY",
  "ENJOY",
  "ENTER",
  "EQUAL",
  "ERROR",
  "EVENT",
  "EVERY",
  "FAITH",
  "FALSE",
  "FIELD",
  "FIGHT",
  "FINAL",
  "FIRST",
  "FLOOR",
  "FOCUS",
  "FORCE",
  "FOUND",
  "FRAME",
  "FRONT",
  "FRUIT",
  "FUNNY",
  "GIANT",
  "GIVEN",
  "GLASS",
  "GOING",
  "GRANT",
  "GRASS",
  "GREAT",
  "GREEN",
  "GROUP",
  "GUESS",
  "HAPPY",
  "HEART",
  "HEAVY",
  "HOUSE",
  "HUMAN",
  "IDEAL",
  "IMAGE",
  "INDEX",
  "INNER",
  "ISSUE",
  "JOINT",
  "JUDGE",
  "KNOWN",
  "LARGE",
  "LEARN",
  "LEAST",
  "LEAVE",
  "LIGHT",
  "LIMIT",
  "LOCAL",
  "LOGIC",
  "LUCKY",
  "MAGIC",
  "MAJOR",
  "MATCH",
  "MAYBE",
  "METAL",
  "MIGHT",
  "MINOR",
  "MONEY",
  "MONTH",
  "MOUSE",
  "MOUTH",
  "MOVIE",
  "MUSIC",
  "NEVER",
  "NIGHT",
  "NORTH",
  "NOVEL",
  "OCEAN",
  "OFFER",
  "ORDER",
  "OTHER",
  "PAINT",
  "PAPER",
  "PARTY",
  "PEACE",
  "PHONE",
  "PIECE",
  "PILOT",
  "PLACE",
  "PLAIN",
  "PLANE",
  "PLANT",
  "POINT",
  "POWER",
  "PRESS",
  "PRICE",
  "PRIDE",
  "PRIME",
  "PRINT",
  "PRIOR",
  "PROUD",
  "PROVE",
  "QUEEN",
  "QUICK",
  "QUIET",
  "RADIO",
  "RAISE",
  "RANGE",
  "REACH",
  "READY",
  "RIGHT",
  "RIVER",
  "ROUND",
  "ROYAL",
  "SCALE",
  "SCENE",
  "SCORE",
  "SENSE",
  "SERVE",
  "SEVEN",
  "SHARE",
  "SHARP",
  "SHEEP",
  "SHEET",
  "SHIFT",
  "SHINE",
  "SHORT",
  "SHOUT",
  "SIGHT",
  "SINCE",
  "SIXTH",
  "SMALL",
  "SMART",
  "SMILE",
  "SOUTH",
  "SPACE",
  "SPEAK",
  "SPEED",
  "SPEND",
  "SPINE",
  "SPLIT",
  "SPORT",
  "STAGE",
  "STAIR",
  "STAND",
  "START",
  "STATE",
  "STEAM",
  "STEEL",
  "STICK",
  "STILL",
  "STOCK",
  "STONE",
  "STORE",
  "STORM",
  "STORY",
  "SUGAR",
  "TABLE",
  "TEACH",
  "THANK",
  "THEIR",
  "THERE",
  "THESE",
  "THING",
  "THINK",
  "THIRD",
  "THOSE",
  "THREE",
  "THROW",
  "TIGHT",
  "TIMES",
  "TITLE",
  "TODAY",
  "TOTAL",
  "TOUCH",
  "TOWER",
  "TRACK",
  "TRADE",
  "TRAIN",
  "TREAT",
  "TRIAL",
  "TRUST",
  "TRUTH",
  "UNCLE",
  "UNDER",
  "UNION",
  "UNTIL",
  "UPPER",
  "USUAL",
  "VALUE",
  "VIDEO",
  "VISIT",
  "VOICE",
  "WASTE",
  "WATCH",
  "WATER",
  "WHEEL",
  "WHERE",
  "WHILE",
  "WHITE",
  "WHOLE",
  "WHOSE",
  "WOMAN",
  "WORLD",
  "WORRY",
  "WORTH",
  "WOULD",
  "WRITE",
  "WRONG",
  "YOUNG",
  "YOUTH"
]);

/* ------------------------------
   Page elements and game state
   ------------------------------ */

const rows = document.querySelectorAll(".row");
const statusMessage = document.querySelector(".stage-status");

let currentRow = 0;
let currentTile = 0;

/*
  Return the five tiles belonging to a row.
*/
function getTiles(rowIndex) {
  return rows[rowIndex].querySelectorAll(".tile");
}

/*
  Read all five tiles in the active row as one string.
*/
function getCurrentGuess() {
  const tiles = getTiles(currentRow);

  return Array.from(tiles)
    .map((tile) => tile.textContent)
    .join("");
}

/*
  Update the message below the keyboard.
*/
function showMessage(message) {
  statusMessage.textContent = message;
}

/* ------------------------------
   Letter input
   ------------------------------ */

function addLetter(letter) {
  /*
    Never allow more than five letters in a row.
  */
  if (currentTile >= 5) {
    return;
  }

  const tiles = getTiles(currentRow);

  tiles[currentTile].textContent = letter.toUpperCase();

  currentTile += 1;
}

function removeLetter() {
  if (currentTile <= 0) {
    return;
  }

  currentTile -= 1;

  const tiles = getTiles(currentRow);

  tiles[currentTile].textContent = "";
}

function handleLetter(letter) {
  if (/^[a-zA-Z]$/.test(letter)) {
    addLetter(letter);
  }
}

/* ------------------------------
   Guess submission
   ------------------------------ */

/*
  Validate and submit the current guess.

  The order is important:
  1. Check that exactly five letters have been entered.
  2. Check that the word exists in the allowed list.
  3. Only then advance to the next row.
*/
function submitGuess() {
  const guess = getCurrentGuess();

  /*
    Test 1: incomplete guess.
  */
  if (guess.length !== 5) {
    showMessage("Not enough letters");
    return;
  }

  /*
    Test 2: word is not recognised.
  */
  if (!allowedWords.has(guess)) {
    showMessage("Word not in list");
    return;
  }

  /*
    The guess is valid.

    We deliberately do not compare it with targetWord yet.
    Target-word evaluation belongs to the later evaluation stages.
  */
  showMessage("Guess accepted");

  /*
    If this is not the final row, activate the next row.
  */
  if (currentRow < rows.length - 1) {
    currentRow += 1;
    currentTile = 0;
  }
}

/*
  Handle Enter and Backspace from either input method.
*/
function handleAction(action) {
  if (action === "backspace") {
    removeLetter();
    return;
  }

  if (action === "enter") {
    submitGuess();
  }
}

/* ------------------------------
   Physical keyboard
   ------------------------------ */

document.addEventListener("keydown", (event) => {
  /*
    Leave browser shortcuts such as Ctrl+R alone.
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
  Handle clicks anywhere on the document.

  We look for the nearest button carrying a data-key attribute.
  This means the handler continues to work even if the keyboard's
  internal HTML structure changes later.

  It also avoids depending on the keyboard buttons being selected
  during initial page setup.
*/
document.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-key]");

  /*
    The click was not on one of our game buttons.
  */
  if (!button) {
    return;
  }

  const key = button.dataset.key;

  /*
    Enter and Backspace are actions rather than letters.
  */
  if (key === "enter" || key === "backspace") {
    handleAction(key);
    return;
  }

  /*
    Otherwise the button represents a letter.
  */
  handleLetter(key);
});
