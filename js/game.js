/*
  Wordle-style game
  Stage 14: Random target selection

  This file controls:
  - Fixed and random word-length selection.
  - Random target selection.
  - Dynamic board creation.
  - Physical keyboard input.
  - On-screen keyboard input.
  - Backspace.
  - Guess validation.
  - Wordle-style letter evaluation.
  - Accessible descriptions for evaluated tiles.
  - Win/loss detection.
  - New-game/reset behaviour.

  Supported lengths at this stage:
  4, 5, 6 and 7 letters.

  The word collections below remain small development
  collections. Stage 16 will replace them with the project's
  comprehensive English word dataset.

  Stage 14 makes the target word random while keeping the
  development word collections and supported word lengths
  unchanged.
*/

"use strict";

/* ------------------------------
   Game constants
   ------------------------------ */

const SUPPORTED_WORD_LENGTHS = [4, 5, 6, 7];
const DEFAULT_WORD_LENGTH = 5;
const RANDOM_WORD_LENGTH = "random";
const MAX_GUESSES = 6;

/*
  Small development word collections.

  These allow the supported lengths to be tested without
  introducing the comprehensive dictionary before its
  dedicated stages.
*/
const developmentWords = {
  4: new Set([
    "BALL",
    "BEAR",
    "BIRD",
    "BOOK",
    "COLD",
    "DARK",
    "FISH",
    "GAME",
    "GATE",
    "HAND",
    "HEAD",
    "HOME",
    "HOPE",
    "KING",
    "LIFE",
    "LION",
    "LOVE",
    "MOON",
    "RAIN",
    "ROAD",
    "STAR",
    "TREE",
    "WIND",
    "WORD"
  ]),

  5: new Set([
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
  ]),

  6: new Set([
    "ALMOST",
    "ALWAYS",
    "ANSWER",
    "AUTUMN",
    "BEFORE",
    "BETTER",
    "BORDER",
    "BRIGHT",
    "BROKEN",
    "BUTTON",
    "CHANGE",
    "CHOOSE",
    "CIRCLE",
    "CLOSED",
    "COFFEE",
    "COMMON",
    "DANGER",
    "DEGREE",
    "DESERT",
    "DOUBLE",
    "EFFECT",
    "ENOUGH",
    "FAMILY",
    "FATHER",
    "FIGURE",
    "FOLLOW",
    "FRIEND",
    "GARDEN",
    "GROUND",
    "HAPPEN",
    "HEALTH",
    "HONEST",
    "INSIDE",
    "ISLAND",
    "LETTER",
    "LITTLE",
    "MARKET",
    "MEMORY",
    "MIDDLE",
    "MORNING",
    "MOTHER",
    "NUMBER",
    "OFFICE",
    "PERSON",
    "PLANET",
    "PUBLIC",
    "REASON",
    "RESULT",
    "SCHOOL",
    "SIMPLE",
    "SISTER",
    "SOCIAL",
    "SUMMER",
    "SYSTEM",
    "TARGET",
    "TRAVEL",
    "UNIQUE",
    "WINDOW",
    "WINTER",
    "YELLOW"
  ]),

  7: new Set([
    "ANOTHER",
    "BALANCE",
    "BECAUSE",
    "BELIEVE",
    "BETWEEN",
    "CAPTAIN",
    "CENTRAL",
    "CERTAIN",
    "COUNTRY",
    "DECIDED",
    "DURING",
    "EXAMPLE",
    "EXACTLY",
    "FREEDOM",
    "FRIENDS",
    "GENERAL",
    "HISTORY",
    "HOWEVER",
    "IMAGINE",
    "IMPORTANT",
    "INCLUDE",
    "KITCHEN",
    "LANGUAGE",
    "MEETING",
    "MORNING",
    "NATURAL",
    "NOTHING",
    "PATTERN",
    "PERFECT",
    "PICTURE",
    "POPULAR",
    "PRESENT",
    "PROBLEM",
    "PROGRAM",
    "PROMISE",
    "RECEIVE",
    "RESULTS",
    "SCIENCE",
    "SEVERAL",
    "SPECIAL",
    "STATION",
    "STUDENT",
    "SUPPORT",
    "TEACHER",
    "THOUGHT",
    "TOGETHER",
    "WITHOUT"
  ])
};

/* ------------------------------
   Page elements and game state
   ------------------------------ */

const board = document.querySelector(".board");
const statusMessage =
  document.querySelector(".stage-status");
const newGameButton =
  document.querySelector("#new-game");
const wordLengthSelect =
  document.querySelector("#word-length");

let WORD_LENGTH = DEFAULT_WORD_LENGTH;
let targetWord = "";

let rows = [];
let currentRow = 0;
let currentTile = 0;
let gameOver = false;

/* ------------------------------
   Word-length helpers
   ------------------------------ */

function isSupportedWordLength(length) {
  return SUPPORTED_WORD_LENGTHS.includes(length);
}

function getWordLengthWords() {
  return developmentWords[WORD_LENGTH] || new Set();
}

function getRandomWordLength() {
  const randomIndex = Math.floor(
    Math.random() * SUPPORTED_WORD_LENGTHS.length
  );

  return SUPPORTED_WORD_LENGTHS[randomIndex];
}

function isRandomWordLengthSelected() {
  return (
    wordLengthSelect &&
    wordLengthSelect.value === RANDOM_WORD_LENGTH
  );
}

/* ------------------------------
   Target-word helpers
   ------------------------------ */

function getRandomTargetWord() {
  const words = Array.from(getWordLengthWords());

  if (words.length === 0) {
    return "";
  }

  const randomIndex = Math.floor(
    Math.random() * words.length
  );

  return words[randomIndex];
}

/*
  Select a new target from the word collection for the
  currently selected word length.

  The target is deliberately chosen independently from the
  word-length selection so that Stage 13's Random length
  mode and Stage 14's Random target mode work together.
*/
function selectRandomTarget() {
  targetWord = getRandomTargetWord();
}

/* ------------------------------
   Instructions and messages
   ------------------------------ */

function updateInstructions() {
  const instructions =
    document.querySelector(".instructions");

  if (!instructions) {
    return;
  }

  instructions.textContent =
    `Guess the ${WORD_LENGTH}-letter word in six tries.`;
}

function showMessage(message) {
  if (statusMessage) {
    statusMessage.textContent = message;
  }
}

/* ------------------------------
   Board creation
   ------------------------------ */

function createBoard() {
  if (!board) {
    return;
  }

  board.innerHTML = "";

  for (
    let rowIndex = 0;
    rowIndex < MAX_GUESSES;
    rowIndex += 1
  ) {
    const row = document.createElement("div");

    row.className = "row";

    row.setAttribute(
      "aria-label",
      `Guess ${rowIndex + 1}`
    );

    row.style.setProperty(
      "--word-length",
      WORD_LENGTH
    );

    for (
      let tileIndex = 0;
      tileIndex < WORD_LENGTH;
      tileIndex += 1
    ) {
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

  rows = Array.from(
    board.querySelectorAll(".row")
  );
}

/* ------------------------------
   Game initialisation
   ------------------------------ */

function initialiseGame() {
  /*
    In Random mode, choose a supported word length every
    time a new game begins.
  */
  if (isRandomWordLengthSelected()) {
    WORD_LENGTH = getRandomWordLength();
  } else {
    const selectedLength =
      Number(wordLengthSelect.value);

    if (isSupportedWordLength(selectedLength)) {
      WORD_LENGTH = selectedLength;
    } else {
      WORD_LENGTH = DEFAULT_WORD_LENGTH;

      if (wordLengthSelect) {
        wordLengthSelect.value =
          String(DEFAULT_WORD_LENGTH);
      }
    }
  }

  /*
    Stage 14:
    Every new game receives a fresh random target from
    the word collection for the selected length.
  */
  selectRandomTarget();

  createBoard();
  updateInstructions();

  currentRow = 0;
  currentTile = 0;
  gameOver = false;

  if (isRandomWordLengthSelected()) {
    showMessage(
      `Stage 14: Random ${WORD_LENGTH}-letter game`
    );
  } else {
    showMessage(
      `Stage 14: ${WORD_LENGTH}-letter game`
    );
  }

  if (newGameButton) {
    newGameButton.hidden = true;
  }
}

/*
  Build the initial game.

  This now selects a random target instead of always
  starting with CRANE.
*/
initialiseGame();

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
    .map((tile) =>
      tile.textContent.trim().toUpperCase()
    )
    .join("");
}

function updateTileInputLabel(
  tile,
  letter,
  rowIndex,
  tileIndex
) {
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
  if (
    gameOver ||
    currentTile >= WORD_LENGTH
  ) {
    return;
  }

  const tiles = getCurrentRowTiles();

  if (!tiles[currentTile]) {
    return;
  }

  const upperLetter =
    letter.toUpperCase();

  tiles[currentTile].textContent =
    upperLetter;

  updateTileInputLabel(
    tiles[currentTile],
    upperLetter,
    currentRow,
    currentTile
  );

  currentTile += 1;
}

function removeLetter() {
  if (
    gameOver ||
    currentTile <= 0
  ) {
    return;
  }

  currentTile -= 1;

  const tiles = getCurrentRowTiles();

  if (tiles[currentTile]) {
    tiles[currentTile].textContent = "";

    tiles[currentTile]
      .removeAttribute("aria-label");
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
  const results =
    Array(WORD_LENGTH).fill("absent");

  const remainingTargetLetters =
    targetWord.split("");

  /*
    First pass:
    exact matches are marked correct and consumed.
  */
  for (
    let index = 0;
    index < WORD_LENGTH;
    index += 1
  ) {
    if (
      guess[index] === targetWord[index]
    ) {
      results[index] = "correct";

      remainingTargetLetters[index] =
        null;
    }
  }

  /*
    Second pass:
    remaining letters are checked for
    wrong-position matches.
  */
  for (
    let index = 0;
    index < WORD_LENGTH;
    index += 1
  ) {
    if (results[index] === "correct") {
      continue;
    }

    const matchingIndex =
      remainingTargetLetters.indexOf(
        guess[index]
      );

    if (matchingIndex !== -1) {
      results[index] = "present";

      remainingTargetLetters[matchingIndex] =
        null;
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

function displayEvaluation(
  results,
  rowIndex
) {
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

    const letter =
      tiles[index].textContent.trim();

    tiles[index].classList.add(result);

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
    showMessage(
      `Game over — the word was ${targetWord}.`
    );
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

  if (!getWordLengthWords().has(guess)) {
    showMessage("Word not in list");
    return;
  }

  const results =
    evaluateGuess(guess);

  displayEvaluation(
    results,
    currentRow
  );

  if (guess === targetWord) {
    endGame(true);
    return;
  }

  if (
    currentRow === MAX_GUESSES - 1
  ) {
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
  initialiseGame();
}

/* ------------------------------
   Word-length selection
   ------------------------------ */

function handleWordLengthChange() {
  if (!wordLengthSelect) {
    return;
  }

  const selectedValue =
    wordLengthSelect.value;

  if (
    selectedValue === RANDOM_WORD_LENGTH
  ) {
    initialiseGame();
    return;
  }

  const selectedLength =
    Number(selectedValue);

  if (!isSupportedWordLength(selectedLength)) {
    wordLengthSelect.value =
      String(DEFAULT_WORD_LENGTH);

    WORD_LENGTH = DEFAULT_WORD_LENGTH;
  } else {
    WORD_LENGTH = selectedLength;
  }

  /*
    Changing word length starts a fresh game so
    an old partially completed guess cannot be
    mixed with the new length.

    initialiseGame() also selects a new random target.
  */
  initialiseGame();
}

if (wordLengthSelect) {
  wordLengthSelect.addEventListener(
    "change",
    handleWordLengthChange
  );
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

document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) {
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
  }
);

/* ------------------------------
   On-screen keyboard
   ------------------------------ */

document.addEventListener(
  "click",
  (event) => {
    const button =
      event.target.closest(
        "button[data-key]"
      );

    if (!button) {
      return;
    }

    const key = button.dataset.key;

    if (
      key === "enter" ||
      key === "backspace"
    ) {
      handleAction(key);
      return;
    }

    handleLetter(key);
  }
);

/* ------------------------------
   New Game button
   ------------------------------ */

if (newGameButton) {
  newGameButton.addEventListener(
    "click",
    startNewGame
  );
}
