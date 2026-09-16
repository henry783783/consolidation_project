/*
  Wordle-style game
  Stage 10: Dynamic word-length foundation

  This file controls:
  - Dynamic board creation.
  - Physical keyboard input.
  - On-screen keyboard input.
  - Backspace.
  - Guess validation.
  - Wordle-style letter evaluation.
  - Accessible descriptions for evaluated tiles.
  - Win/loss detection.
  - New-game/reset behaviour.

  IMPORTANT:
  The game currently remains a five-letter game with CRANE as the
  fixed development target.

  WORD_LENGTH is now the single source of truth for the number of
  letters in a word. Future stages can change this value or make it
  selectable without rebuilding the board HTML manually.
*/

"use strict";

/* ------------------------------
   Game constants
   ------------------------------ */

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
const targetWord = "CRANE";

/*
  Small development dictionary.
  Only five-letter words are accepted as guesses at this stage.
*/
const allowedWords = new Set([
  "ABOUT", "ABOVE", "AFTER", "AGAIN", "ALONE", "APPLE",
  "BEACH", "BEGIN", "BLACK", "BLAME", "BLIND", "BLOCK",
  "BRAIN", "BRAVE", "BREAD", "BREAK", "BRING", "BROWN",
  "BUILD", "CARRY", "CAUSE", "CHAIN", "CHAIR", "CHART",
  "CHASE", "CHEAP", "CHECK", "CHEST", "CHILD", "CLEAN",
  "CLEAR", "CLIMB", "CLOCK", "CLOSE", "CLOUD", "COACH",
  "COAST", "COLOR", "COUNT", "COURT", "COVER", "CRANE",
  "CRAZY", "CREAM", "CROSS", "CROWD", "CROWN", "DANCE",
  "DEATH", "DEPTH", "DOUBT", "DOZEN", "DREAM", "DRINK",
  "DRIVE", "EARTH", "EMPTY", "ENJOY", "ENTER", "EQUAL",
  "ERROR", "EVENT", "EVERY", "FAITH", "FALSE", "FIELD",
  "FIGHT", "FINAL", "FIRST", "FLOOR", "FOCUS", "FORCE",
  "FOUND", "FRAME", "FRONT", "FRUIT", "FUNNY", "GIANT",
  "GIVEN", "GLASS", "GOING", "GRANT", "GRASS", "GREAT",
  "GREEN", "GROUP", "GUESS", "HAPPY", "HEART", "HEAVY",
  "HOUSE", "HUMAN", "IDEAL", "IMAGE", "INDEX", "INNER",
  "ISSUE", "JOINT", "JUDGE", "KNOWN", "LARGE", "LEARN",
  "LEAST", "LEAVE", "LIGHT", "LIMIT", "LOCAL", "LOGIC",
  "LUCKY", "MAGIC", "MAJOR", "MATCH", "MAYBE", "METAL",
  "MIGHT", "MINOR", "MONEY", "MONTH", "MOUSE", "MOUTH",
  "MOVIE", "MUSIC", "NEVER", "NIGHT", "NORTH", "NOVEL",
  "OCEAN", "OFFER", "ORDER", "OTHER", "PAINT", "PAPER",
  "PARTY", "PEACE", "PHONE", "PIECE", "PILOT", "PLACE",
  "PLAIN", "PLANE", "PLANT", "POINT", "POWER", "PRESS",
  "PRICE", "PRIDE", "PRIME", "PRINT", "PRIOR", "PROUD",
  "QUEEN", "QUICK", "QUIET", "RADIO", "RAISE", "RANGE",
  "REACH", "READY", "RIGHT", "RIVER", "ROUND", "ROYAL",
  "SCALE", "SCENE", "SCORE", "SENSE", "SERVE", "SEVEN",
  "SHARE", "SHARP", "SHEEP", "SHEET", "SHIFT", "SHINE",
  "SHORT", "SHOUT", "SIGHT", "SINCE", "SIXTH", "SMALL",
  "SMART", "SMILE", "SOUTH", "SPACE", "SPEAK", "SPEED",
  "SPEND", "SPINE", "SPLIT", "SPORT", "STAGE", "STAIR",
  "STAND", "START", "STATE", "STEAM", "STEEL", "STICK",
  "STILL", "STOCK", "STONE", "STORE", "STORM", "STORY",
  "SUGAR", "TABLE", "TEACH", "THANK", "THEIR", "THERE",
  "THESE", "THING", "THINK", "THIRD", "THOSE", "THREE",
  "THROW", "TIGHT", "TIMES", "TITLE", "TODAY", "TOTAL",
  "TOUCH", "TOWER", "TRACK", "TRADE", "TRAIN", "TREAT",
  "TRIAL", "TRUST", "TRUTH", "UNCLE", "UNDER", "UNION",
  "UNTIL", "UPPER", "USUAL", "VALUE", "VIDEO", "VISIT",
  "VOICE", "WASTE", "WATCH", "WATER", "WHEEL", "WHERE",
  "WHILE", "WHITE", "WHOLE", "WHOSE", "WOMAN", "WORLD",
  "WORRY", "WORTH", "WOULD", "WRITE", "WRONG", "YOUNG",
  "YOUTH"
]);

/* ------------------------------
   Page elements and game state
   ------------------------------ */

const board = document.querySelector(".board");
const statusMessage = document.querySelector(".stage-status");
const newGameButton = document.querySelector("#new-game");

let rows = [];
let currentRow = 0;
let currentTile = 0;
let gameOver = false;

/* ------------------------------
   Board creation
   ------------------------------ */

/*
  Create the board from WORD_LENGTH instead of relying on hard-coded
  tile elements in index.html.

  This is deliberately kept as a small function so future stages can
  change WORD_LENGTH without needing to redesign the rest of the game.
*/
function createBoard() {
  if (!board) {
    return;
  }

  board.innerHTML = "";

  for (let rowIndex = 0; rowIndex < MAX_GUESSES; rowIndex += 1) {
    const row = document.createElement("div");

    row.className = "row";
    row.setAttribute("aria-label", `Guess ${rowIndex + 1}`);
    row.style.setProperty("--word-length", WORD_LENGTH);

    for (let tileIndex = 0; tileIndex < WORD_LENGTH; tileIndex += 1) {
      const tile = document.createElement("div");

      tile.className = "tile";
      tile.setAttribute(
        "aria-label",
        `Guess ${rowIndex + 1}, position ${tileIndex + 1}: empty`
      );

      row.appendChild(tile);
    }

    board.appendChild(row);
  }

  rows = Array.from(board.querySelectorAll(".row"));
}

/*
  Build the board before any input can occur.
*/
createBoard();

/*
  Establish the initial UI state explicitly.

  This ensures the New Game button starts hidden even if a browser
  has retained an older stylesheet or page state.
*/
if (newGameButton) {
  newGameButton.hidden = true;
}

/* ------------------------------
   Board helpers
   ------------------------------ */

function getCurrentRowTiles() {
  if (!rows[currentRow]) {
    return [];
  }

  return Array.from(
    rows[currentRow].querySelectorAll(".tile")
  ).slice(0, WORD_LENGTH);
}

function getCurrentGuess() {
  const tiles = getCurrentRowTiles();

  return tiles
    .slice(0, currentTile)
    .map((tile) => tile.textContent.trim().toUpperCase())
    .join("");
}

function showMessage(message) {
  if (statusMessage) {
    statusMessage.textContent = message;
  }
}

/*
  Give a tile a useful accessible description.

  The visible letter remains unchanged. The aria-label gives
  assistive technology enough information to understand the
  active guess as it is being entered.
*/
function updateTileInputLabel(tile, letter, rowIndex, tileIndex) {
  if (!tile) {
    return;
  }

  tile.setAttribute(
    "aria-label",
    `Guess ${rowIndex + 1}, position ${tileIndex + 1}: ${letter}`
  );
}

/* ------------------------------
   Letter input
   ------------------------------ */

function addLetter(letter) {
  if (gameOver || currentTile >= WORD_LENGTH) {
    return;
  }

  const tiles = getCurrentRowTiles();

  if (!tiles[currentTile]) {
    return;
  }

  const upperLetter = letter.toUpperCase();

  tiles[currentTile].textContent = upperLetter;

  updateTileInputLabel(
    tiles[currentTile],
    upperLetter,
    currentRow,
    currentTile
  );

  currentTile += 1;
}

function removeLetter() {
  if (gameOver || currentTile <= 0) {
    return;
  }

  currentTile -= 1;

  const tiles = getCurrentRowTiles();

  if (tiles[currentTile]) {
    tiles[currentTile].textContent = "";
    tiles[currentTile].removeAttribute("aria-label");
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

function evaluateGuess(guess) {
  const results = Array(WORD_LENGTH).fill("absent");
  const remainingTargetLetters = targetWord.split("");

  /*
    First pass:
    exact matches are marked correct and consumed.
  */
  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (guess[index] === targetWord[index]) {
      results[index] = "correct";
      remainingTargetLetters[index] = null;
    }
  }

  /*
    Second pass:
    remaining letters are checked for wrong-position matches.
  */
  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (results[index] === "correct") {
      continue;
    }

    const matchingIndex = remainingTargetLetters.indexOf(guess[index]);

    if (matchingIndex !== -1) {
      results[index] = "present";
      remainingTargetLetters[matchingIndex] = null;
    }
  }

  return results;
}

function getResultDescription(result) {
  if (result === "correct") {
    return "correct position";
  }

  if (result === "present") {
    return "correct letter, wrong position";
  }

  return "letter not present";
}

function displayEvaluation(results, rowIndex) {
  if (!rows[rowIndex]) {
    return;
  }

  const tiles = Array.from(
    rows[rowIndex].querySelectorAll(".tile")
  ).slice(0, WORD_LENGTH);

  results.forEach((result, index) => {
    if (!tiles[index]) {
      return;
    }

    const letter = tiles[index].textContent.trim();

    tiles[index].classList.add(result);

    /*
      The visual colour communicates the result to sighted users.
      The aria-label communicates the same result to users who
      cannot rely on colour.
    */
    tiles[index].setAttribute(
      "aria-label",
      `Guess ${rowIndex + 1}, position ${index + 1}: ${letter}, ${getResultDescription(result)}`
    );
  });
}

/* ------------------------------
   Win/loss handling
   ------------------------------ */

function endGame(won) {
  gameOver = true;

  if (won) {
    showMessage("You win!");
  } else {
    showMessage(`Game over — the word was ${targetWord}.`);
  }

  if (newGameButton) {
    newGameButton.hidden = false;
  }
}

/* ------------------------------
   Guess submission
   ------------------------------ */

function submitGuess() {
  if (gameOver) {
    return;
  }

  if (currentTile !== WORD_LENGTH) {
    showMessage("Not enough letters");
    return;
  }

  const guess = getCurrentGuess();

  if (guess.length !== WORD_LENGTH) {
    showMessage("Not enough letters");
    return;
  }

  if (!allowedWords.has(guess)) {
    showMessage("Word not in list");
    return;
  }

  const results = evaluateGuess(guess);
  displayEvaluation(results, currentRow);

  if (guess === targetWord) {
    endGame(true);
    return;
  }

  if (currentRow === MAX_GUESSES - 1) {
    endGame(false);
    return;
  }

  showMessage("Guess evaluated");

  currentRow += 1;
  currentTile = 0;
}

/* ------------------------------
   New game
   ------------------------------ */

function startNewGame() {
  /*
    Rebuild the board so the reset behaviour is also compatible
    with future word-length changes.
  */
  createBoard();

  currentRow = 0;
  currentTile = 0;
  gameOver = false;

  showMessage("Stage 10: Dynamic word-length foundation");

  if (newGameButton) {
    newGameButton.hidden = true;
  }
}

/* ------------------------------
   Shared actions
   ------------------------------ */

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

/* ------------------------------
   New Game button
   ------------------------------ */

if (newGameButton) {
  newGameButton.addEventListener("click", startNewGame);
}
