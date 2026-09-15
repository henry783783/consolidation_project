/*
  Wordle-style game
  Stage 5: Word validation and guess submission

  IMPORTANT:
  A Wordle guess is always exactly five letters.

  This file deliberately enforces that rule in JavaScript rather than
  relying on the number of tile elements present in the HTML. That makes
  the game safer if the board markup is accidentally changed later.

  Not yet implemented:
  - Letter colours/evaluation.
  - Duplicate-letter evaluation.
  - Win/loss detection.
  - New game/reset functionality.
*/

"use strict";

/* ------------------------------
   Game constants
   ------------------------------ */

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

/*
  Fixed development target.

  Keeping this fixed makes testing predictable. Random target selection
  will be introduced separately later.
*/
const targetWord = "CRANE";

/*
  Small development dictionary.

  Only five-letter words are accepted.
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
   Page elements
   ------------------------------ */

const rows = document.querySelectorAll(".row");
const statusMessage = document.querySelector(".stage-status");

/*
  Game state.

  currentRow:
    The row currently being edited, starting at 0.

  currentTile:
    The number of letters currently entered into that row.
*/
let currentRow = 0;
let currentTile = 0;

/* ------------------------------
   Board helpers
   ------------------------------ */

/*
  Get the tiles for the current row.

  We deliberately take only the first five tiles. The game itself
  must always operate on exactly five positions.
*/
function getCurrentRowTiles() {
  if (!rows[currentRow]) {
    return [];
  }

  return Array.from(
    rows[currentRow].querySelectorAll(".tile")
  ).slice(0, WORD_LENGTH);
}

/*
  Read exactly the letters the player has entered.

  currentTile is the authoritative count, rather than the number
  of elements in the row.
*/
function getCurrentGuess() {
  const tiles = getCurrentRowTiles();

  return tiles
    .slice(0, currentTile)
    .map((tile) => tile.textContent.trim().toUpperCase())
    .join("");
}

/*
  Display a message beneath the keyboard.
*/
function showMessage(message) {
  if (statusMessage) {
    statusMessage.textContent = message;
  }
}

/* ------------------------------
   Letter input
   ------------------------------ */

/*
  Add one letter.

  The WORD_LENGTH check is the important protection here:
  no input source can ever put more than five letters into a guess.
*/
function addLetter(letter) {
  if (currentTile >= WORD_LENGTH) {
    return;
  }

  const tiles = getCurrentRowTiles();

  /*
    Safety check in case the board does not contain enough tiles.
  */
  if (!tiles[currentTile]) {
    return;
  }

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

  const tiles = getCurrentRowTiles();

  if (tiles[currentTile]) {
    tiles[currentTile].textContent = "";
  }
}

/*
  Accept only one alphabetic character.
*/
function handleLetter(letter) {
  if (/^[a-zA-Z]$/.test(letter)) {
    addLetter(letter);
  }
}

/* ------------------------------
   Guess submission
   ------------------------------ */

function submitGuess() {
  /*
    Use currentTile as the authoritative number of letters entered.
  */
  if (currentTile !== WORD_LENGTH) {
    showMessage("Not enough letters");
    return;
  }

  const guess = getCurrentGuess();

  /*
    A second safety check ensures the actual text also contains
    exactly five letters.
  */
  if (guess.length !== WORD_LENGTH) {
    showMessage("Not enough letters");
    return;
  }

  /*
    The word must exist in the allowed list.
  */
  if (!allowedWords.has(guess)) {
    showMessage("Word not in list");
    return;
  }

  /*
    The guess is valid.

    Letter evaluation is intentionally deferred to Stage 6.
  */
  showMessage("Guess accepted");

  /*
    Move to the next row unless this was the final row.
  */
  if (currentRow < MAX_GUESSES - 1) {
    currentRow += 1;
    currentTile = 0;
  }
}

/*
  Handle actions shared by both physical and on-screen input.
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
    Do not interfere with browser shortcuts such as Ctrl+R.
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
  One click handler is used for the on-screen keyboard.

  Looking for data-key means the handler does not depend on the
  exact internal structure of the keyboard HTML.
*/
document.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-key]");

  if (!button) {
    return;
  }

  const key = button.dataset.key;

  if (key === "enter" || key === "backspace") {
    handleAction(key);
    return;
  }

  handleLetter(key);
});
