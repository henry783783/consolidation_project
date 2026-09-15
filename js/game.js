 /*
  Wordle-style game
  Stage 6: Guess evaluation

  This file controls:
  - Physical keyboard input.
  - On-screen keyboard input.
  - Backspace.
  - Five-letter guess validation.
  - Guess submission.
  - Wordle-style letter evaluation.
  - Correct / wrong-position / not-present tile states.
  - Movement to the next row after a valid guess.

  Not yet implemented:
  - Win/loss detection.
  - New game/reset functionality.
  - Random target selection.

  The target word remains fixed as CRANE during development so the
  evaluation can be tested predictably.
*/

"use strict";

/* ------------------------------
   Game constants
   ------------------------------ */

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

/*
  Fixed development target.

  This is intentionally unchanged from Stage 5.
*/
const targetWord = "CRANE";

/*
  Small development dictionary.

  Only five-letter words are accepted as guesses.
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

/* ------------------------------
   Board helpers
   ------------------------------ */

/*
  Return exactly the five tiles used by the game in the active row.
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
  Read the letters currently entered in the active row.
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

function addLetter(letter) {
  /*
    A guess can never contain more than five letters.
  */
  if (currentTile >= WORD_LENGTH) {
    return;
  }

  const tiles = getCurrentRowTiles();

  if (!tiles[currentTile]) {
    return;
  }

  tiles[currentTile].textContent = letter.toUpperCase();

  currentTile += 1;
}

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

function handleLetter(letter) {
  if (/^[a-zA-Z]$/.test(letter)) {
    addLetter(letter);
  }
}

/* ------------------------------
   Guess evaluation
   ------------------------------ */

/*
  Evaluate a valid guess against the target.

  Possible results for each position:

  "correct"
    The letter is correct and in the correct position.

  "present"
    The letter occurs in the target but belongs in another position.

  "absent"
    The letter does not have an unused occurrence in the target.

  The evaluation uses two passes.

  Pass 1:
    Mark exact matches as "correct" and remove those target letters
    from the pool available for matching.

  Pass 2:
    For the remaining letters, find unused occurrences elsewhere in
    the target. This is what makes duplicate-letter behaviour work
    correctly.
*/
function evaluateGuess(guess) {
  const results = Array(WORD_LENGTH).fill("absent");

  /*
    Convert the target into an array so individual occurrences can
    be marked as already used.
  */
  const remainingTargetLetters = targetWord.split("");

  /* ------------------------------
     Pass 1: exact matches
     ------------------------------ */

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (guess[index] === targetWord[index]) {
      results[index] = "correct";

      /*
        Remove this exact occurrence from the pool so a duplicate
        in the guess cannot reuse it later.
      */
      remainingTargetLetters[index] = null;
    }
  }

  /* ------------------------------
     Pass 2: wrong-position matches
     ------------------------------ */

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    /*
      Exact matches have already been dealt with.
    */
    if (results[index] === "correct") {
      continue;
    }

    const matchingIndex = remainingTargetLetters.indexOf(guess[index]);

    if (matchingIndex !== -1) {
      results[index] = "present";

      /*
        Consume the matched target occurrence.
      */
      remainingTargetLetters[matchingIndex] = null;
    }
  }

  return results;
}

/*
  Apply evaluation results to the five tiles in the submitted row.
*/
function displayEvaluation(results) {
  const tiles = getCurrentRowTiles();

  results.forEach((result, index) => {
    if (tiles[index]) {
      tiles[index].classList.add(result);
    }
  });
}

/* ------------------------------
   Guess submission
   ------------------------------ */

function submitGuess() {
  /*
    The player must enter exactly five letters.
  */
  if (currentTile !== WORD_LENGTH) {
    showMessage("Not enough letters");
    return;
  }

  const guess = getCurrentGuess();

  /*
    Safety check: the actual text must also be exactly five letters.
  */
  if (guess.length !== WORD_LENGTH) {
    showMessage("Not enough letters");
    return;
  }

  /*
    Reject words that are not in the allowed dictionary.
  */
  if (!allowedWords.has(guess)) {
    showMessage("Word not in list");
    return;
  }

  /*
    The guess is valid, so evaluate it before moving to the next row.
  */
  const results = evaluateGuess(guess);

  displayEvaluation(results);

  /*
    Stage 7 will determine whether the player has won or lost.
    For now, every valid guess simply advances to the next row.
  */
  showMessage("Guess evaluated");

  if (currentRow < MAX_GUESSES - 1) {
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
    Do not interfere with browser shortcuts.
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
