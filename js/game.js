/*
  Wordle-style game
  Stage 5: Word validation and guess submission

  Responsibilities in this stage:
  - Track the active row and tile.
  - Accept physical A-Z keyboard input.
  - Accept on-screen keyboard input.
  - Handle Backspace.
  - Validate five-letter guesses.
  - Submit valid guesses with Enter.
  - Move to the next row after a valid guess.
  - Reject guesses that are too short or not in the allowed word list.

  Deliberately NOT implemented yet:
  - Letter colouring/evaluation.
  - Correct/wrong-position/not-present states.
  - Win/loss detection.
  - On-screen keyboard colour states.
  - New-game functionality.

  The target word and allowed words are intentionally kept in this file
  at this stage. This avoids introducing another file while the game's
  basic submission flow is being tested.
*/

"use strict";

/* ------------------------------
   Word data
   ------------------------------ */

/*
  The target word is deliberately fixed during development.

  This makes Stage 5 deterministic and easy to test. Random target
  selection can be introduced later without changing the validation
  rules.
*/
const targetWord = "CRANE";

/*
  Self-contained list of words accepted as guesses.

  All entries are exactly five letters and uppercase so comparison is
  straightforward.

  This is intentionally a small development dictionary for Stage 5.
  A larger word list can be introduced as a separate, reviewed change
  once the complete game flow has been proven.
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
  "OCCUR",
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
  "STRONG",
  "STUDY",
  "STYLE",
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
  "TOGETHER",
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

/*
  Some entries above are longer than five letters.

  Filter them out when constructing the actual validation set.
  This also demonstrates that the validation rule itself, rather than
  the data source, is responsible for enforcing the five-letter rule.
*/
const validWords = new Set(
  [...allowedWords].filter((word) => word.length === 5)
);

/* ------------------------------
   Game state
   ------------------------------ */

const rows = document.querySelectorAll(".row");
const statusMessage = document.querySelector(".stage-status");

let currentRow = 0;
let currentTile = 0;

/*
  Return all tiles belonging to a particular row.
*/
function getTiles(rowIndex) {
  return rows[rowIndex].querySelectorAll(".tile");
}

/*
  Read the current row as a complete word.
*/
function getCurrentGuess() {
  const tiles = getTiles(currentRow);

  return [...tiles]
    .map((tile) => tile.textContent)
    .join("");
}

/*
  Display a short status message to the player.

  This reuses the existing status element rather than adding another
  HTML element solely for validation messages.
*/
function showMessage(message) {
  statusMessage.textContent = message;
}

/* ------------------------------
   Letter input
   ------------------------------ */

function addLetter(letter) {
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
   Guess validation and submission
   ------------------------------ */

/*
  Submit the current row.

  A submission must:
  1. Contain exactly five letters.
  2. Exist in the allowed word set.

  If either condition fails, the player stays on the same row so the
  guess can be corrected.
*/
function submitGuess() {
  const guess = getCurrentGuess();

  if (guess.length < 5) {
    showMessage("Not enough letters");
    return;
  }

  if (!validWords.has(guess)) {
    showMessage("Word not in list");
    return;
  }

  /*
    The guess is valid.

    Stage 5 does not evaluate the letters yet, so the row is simply
    accepted and the next row becomes active.
  */
  showMessage("Guess accepted");

  moveToNextRow();
}

/*
  Move to the next row after a valid guess.

  Once the sixth row has been submitted, we keep the state on the
  final row. Win/loss handling belongs to Stage 7.
*/
function moveToNextRow() {
  if (currentRow >= rows.length - 1) {
    currentTile = 5;
    showMessage("All guesses used");
    return;
  }

  currentRow += 1;
  currentTile = 0;
}

/*
  Handle an action shared by both input methods.
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
