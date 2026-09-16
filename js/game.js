/*
  Wordle-style game
  Stage 17: Try Lazy-loading game data

  This file controls:
  - Fixed and random word-length selection.
  - Lazy loading of only the selected word length.
  - Browser-cache-friendly JSON loading.
  - Target-list validation.
  - Immediate board creation before data loading.
  - Responsive board sizing.
  - Physical keyboard input.
  - On-screen keyboard input.
  - Backspace.
  - Guess validation.
  - Wordle-style letter evaluation.
  - Accessible descriptions for evaluated tiles.
  - Win/loss detection.
  - New-game/reset behaviour.

  Supported lengths:
  4, 5, 6 and 7 letters.

  Repository structure:

  /
  ├── index.html
  ├── css/
  │   └── style.css
  ├── js/
  │   └── game.js
  └── data/
      ├── words-4.json
      ├── words-5.json
      ├── words-6.json
      ├── words-7.json
      ├── targets-4.json
      ├── targets-5.json
      ├── targets-6.json
      └── targets-7.json

  Stage 18 data model:

  words-X.json
    = words that may be entered as guesses.

  targets-X.json
    = words that may be selected as answers.

  Important performance change:

  Only the currently selected word length is loaded.
  The board is created before any JSON request begins.
*/

"use strict";

/* --------------------------------
   Game constants
   -------------------------------- */

const SUPPORTED_WORD_LENGTHS = [
  4,
  5,
  6,
  7
];

const DEFAULT_WORD_LENGTH = 5;
const RANDOM_WORD_LENGTH = "random";
const MAX_GUESSES = 6;

const BOARD_MAX_TILE_SIZE = 62;
const BOARD_GAP_FALLBACK = 5;

const WORD_DATA_FILES = {
  4: "./data/words-4.json",
  5: "./data/words-5.json",
  6: "./data/words-6.json",
  7: "./data/words-7.json"
};

const TARGET_DATA_FILES = {
  4: "./data/targets-4.json",
  5: "./data/targets-5.json",
  6: "./data/targets-6.json",
  7: "./data/targets-7.json"
};

/* --------------------------------
   Page elements
   -------------------------------- */

let board = null;
let statusMessage = null;
let newGameButton = null;
let wordLengthSelect = null;
let instructions = null;

/* --------------------------------
   Game state
   -------------------------------- */

let WORD_LENGTH = DEFAULT_WORD_LENGTH;
let targetWord = "";

let rows = [];
let currentRow = 0;
let currentTile = 0;

let gameOver = false;
let gameReady = false;
let dataLoading = false;

/*
  Every time a new game/data request begins,
  this number increases.

  If an older asynchronous request finishes after
  the user has selected another word length, its
  result is ignored.
*/
let gameRequestId = 0;

/*
  Word and target collections are cached by length.

  This means:

  First 5-letter game:
    download words-5.json
    download targets-5.json

  Second 5-letter game:
    use the already loaded Sets.

  Switching to 6 letters:
    download only the two 6-letter files.
*/
const wordCollections = new Map();
const targetCollections = new Map();

/*
  Prevent duplicate network requests if the same
  word length is requested more than once before
  the first request has completed.
*/
const dataLoadPromises = new Map();

/*
  ResizeObserver lets the board react to changes
  in the available width.
*/
let boardResizeObserver = null;

/* --------------------------------
   Page element initialisation
   -------------------------------- */

function cachePageElements() {
  board = document.querySelector(".board");
  statusMessage = document.querySelector(".stage-status");
  newGameButton = document.querySelector("#new-game");
  wordLengthSelect = document.querySelector("#word-length");
  instructions = document.querySelector(".instructions");

  if (!board) {
    console.error(
      "Stage 18: .board element was not found."
    );
  }
}

/* --------------------------------
   Status helpers
   -------------------------------- */

function showMessage(message) {
  if (statusMessage) {
    statusMessage.textContent = message;
  }
}

/* --------------------------------
   Word-length helpers
   -------------------------------- */

function isSupportedWordLength(length) {
  return SUPPORTED_WORD_LENGTHS.includes(length);
}

function isRandomWordLengthSelected() {
  return (
    wordLengthSelect &&
    wordLengthSelect.value === RANDOM_WORD_LENGTH
  );
}

function getSelectedWordLength() {
  if (isRandomWordLengthSelected()) {
    return getRandomWordLength();
  }

  const selectedLength = Number(
    wordLengthSelect
      ? wordLengthSelect.value
      : DEFAULT_WORD_LENGTH
  );

  if (isSupportedWordLength(selectedLength)) {
    return selectedLength;
  }

  if (wordLengthSelect) {
    wordLengthSelect.value = String(
      DEFAULT_WORD_LENGTH
    );
  }

  return DEFAULT_WORD_LENGTH;
}

/* --------------------------------
   Randomness
   -------------------------------- */

/*
  Uses Web Crypto where available.

  Rejection sampling prevents modulo bias.
*/
function getSecureRandomIndex(length) {
  if (length <= 0) {
    return -1;
  }

  if (
    window.crypto &&
    typeof window.crypto.getRandomValues === "function"
  ) {
    const range = 0x100000000;

    const limit =
      range - (range % length);

    const randomValues = new Uint32Array(1);

    let randomValue;

    do {
      window.crypto.getRandomValues(randomValues);
      randomValue = randomValues[0];
    } while (randomValue >= limit);

    return randomValue % length;
  }

  return Math.floor(
    Math.random() * length
  );
}

function getRandomWordLength() {
  const randomIndex = getSecureRandomIndex(
    SUPPORTED_WORD_LENGTHS.length
  );

  return SUPPORTED_WORD_LENGTHS[randomIndex];
}

/* --------------------------------
   Data helpers
   -------------------------------- */

function getWordCollection(length = WORD_LENGTH) {
  return wordCollections.get(length) || new Set();
}

function getTargetCollection(length = WORD_LENGTH) {
  return targetCollections.get(length) || new Set();
}

/* --------------------------------
   JSON loading
   -------------------------------- */

/*
  Load and validate one JSON word list.

  Important:
  We intentionally do NOT use:

    cache: "no-store"

  Static GitHub Pages data should be allowed to use
  normal browser/CDN caching.
*/
async function loadWordList(
  filePath,
  length,
  listName
) {
  let response;

  try {
    response = await fetch(filePath);
  } catch (error) {
    console.error(
      `Stage 18: Fetch failed for ${filePath}:`,
      error
    );

    throw new Error(
      `Network error while loading ${filePath}.`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Could not load ${filePath} — HTTP ${response.status}.`
    );
  }

  let data;

  try {
    data = await response.json();
  } catch (error) {
    console.error(
      `Stage 18: Invalid JSON in ${filePath}:`,
      error
    );

    throw new Error(
      `${filePath} is not valid JSON.`
    );
  }

  if (!Array.isArray(data)) {
    throw new Error(
      `${filePath} must contain a JSON array of words.`
    );
  }

  const words = new Set();

  for (const word of data) {
    if (typeof word !== "string") {
      continue;
    }

    const normalisedWord = word
      .trim()
      .toUpperCase();

    /*
      Only alphabetic words of the expected length
      are accepted.
    */
    if (
      normalisedWord.length === length &&
      /^[A-Z]+$/.test(normalisedWord)
    ) {
      words.add(normalisedWord);
    }
  }

  if (words.size === 0) {
    throw new Error(
      `${filePath} contained no valid ${length}-letter words.`
    );
  }

  console.log(
    `Stage 18: Loaded ${words.size} ${length}-letter ${listName}.`
  );

  return words;
}

/* --------------------------------
   Target validation
   -------------------------------- */

/*
  A target must also be an accepted guess.

  Invalid targets are removed rather than preventing
  the whole game from starting.
*/
function validateTargets(
  targets,
  words,
  length
) {
  const validTargets = new Set();

  let removedCount = 0;

  for (const target of targets) {
    if (words.has(target)) {
      validTargets.add(target);
    } else {
      removedCount += 1;
    }
  }

  if (removedCount > 0) {
    console.warn(
      `Stage 18: Removed ${removedCount} invalid ` +
      `${length}-letter target(s) because they are ` +
      `not present in words-${length}.json.`
    );
  }

  if (validTargets.size === 0) {
    throw new Error(
      `No usable ${length}-letter target words remain ` +
      `after validation.`
    );
  }

  return validTargets;
}

/* --------------------------------
   Lazy data loading
   -------------------------------- */

/*
  Load exactly one word length.

  The two files are requested in parallel.
*/
async function loadLengthData(length) {
  if (!isSupportedWordLength(length)) {
    throw new Error(
      `Unsupported word length: ${length}.`
    );
  }

  /*
    Return cached data immediately.
  */
  if (
    wordCollections.has(length) &&
    targetCollections.has(length)
  ) {
    return {
      words: wordCollections.get(length),
      targets: targetCollections.get(length)
    };
  }

  /*
    If this length is already being loaded,
    reuse that Promise.
  */
  if (dataLoadPromises.has(length)) {
    return dataLoadPromises.get(length);
  }

  const loadPromise = (async () => {
    showMessage(
      `Loading ${length}-letter game data…`
    );

    /*
      Fetch guess and target data simultaneously.
    */
    const [words, rawTargets] = await Promise.all([
      loadWordList(
        WORD_DATA_FILES[length],
        length,
        "guess words"
      ),
      loadWordList(
        TARGET_DATA_FILES[length],
        length,
        "target words"
      )
    ]);

    /*
      Validate the target list against the guess list.
    */
    const validTargets = validateTargets(
      rawTargets,
      words,
      length
    );

    wordCollections.set(
      length,
      words
    );

    targetCollections.set(
      length,
      validTargets
    );

    console.log(
      `Stage 18: ${validTargets.size} valid ` +
      `${length}-letter targets available.`
    );

    return {
      words,
      targets: validTargets
    };
  })();

  dataLoadPromises.set(
    length,
    loadPromise
  );

  try {
    return await loadPromise;
  } catch (error) {
    /*
      Remove the failed Promise so a later attempt
      can retry the request.
    */
    dataLoadPromises.delete(length);

    throw error;
  }
}

/* --------------------------------
   Board sizing
   -------------------------------- */

/*
  The existing CSS uses:

    --tile-size
    --word-length

  We update --tile-size directly on the board.

  This solves the narrow-screen problem for 6- and
  7-letter boards without requiring fixed mobile
  breakpoints.
*/
function resizeBoard() {
  if (!board || rows.length === 0) {
    return;
  }

  const firstRow = rows[0];

  if (!firstRow) {
    return;
  }

  const computedStyle =
    window.getComputedStyle(firstRow);

  const gap =
    parseFloat(computedStyle.columnGap) ||
    parseFloat(computedStyle.gap) ||
    BOARD_GAP_FALLBACK;

  const availableWidth =
    board.clientWidth ||
    board.parentElement?.clientWidth ||
    window.innerWidth;

  const totalGap =
    gap * Math.max(0, WORD_LENGTH - 1);

  const calculatedTileSize =
    Math.floor(
      (availableWidth - totalGap) /
      WORD_LENGTH
    );

  const tileSize = Math.max(
    30,
    Math.min(
      BOARD_MAX_TILE_SIZE,
      calculatedTileSize
    )
  );

  board.style.setProperty(
    "--tile-size",
    `${tileSize}px`
  );
}

function setupBoardResizeHandling() {
  if (!board) {
    return;
  }

  if (
    typeof ResizeObserver === "function"
  ) {
    if (!boardResizeObserver) {
      boardResizeObserver =
        new ResizeObserver(() => {
          resizeBoard();
        });
    }

    boardResizeObserver.observe(board);
  }

  window.addEventListener(
    "resize",
    resizeBoard
  );

  resizeBoard();
}

/* --------------------------------
   Instructions
   -------------------------------- */

function updateInstructions() {
  if (!instructions) {
    return;
  }

  instructions.textContent =
    `Guess the ${WORD_LENGTH}-letter word in six tries.`;
}

/* --------------------------------
   Board creation
   -------------------------------- */

/*
  The board is deliberately independent of JSON.

  This function must remain synchronous.

  It is called before any data loading so the user
  immediately sees the game board.
*/
function createBoard() {
  if (!board) {
    console.error(
      "Stage 18: Cannot create board because .board was not found."
    );

    return false;
  }

  board.innerHTML = "";

  rows = [];

  for (
    let rowIndex = 0;
    rowIndex < MAX_GUESSES;
    rowIndex += 1
  ) {
    const row =
      document.createElement("div");

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
      const tile =
        document.createElement("div");

      tile.className = "tile";

      tile.setAttribute(
        "aria-label",
        `Guess ${rowIndex + 1}, ` +
        `position ${tileIndex + 1}: empty`
      );

      row.appendChild(tile);
    }

    board.appendChild(row);
    rows.push(row);
  }

  resizeBoard();

  return true;
}

/* --------------------------------
   Target selection
   -------------------------------- */

function getRandomTargetWord(length = WORD_LENGTH) {
  const targets = Array.from(
    getTargetCollection(length)
  );

  if (targets.length === 0) {
    return "";
  }

  const randomIndex =
    getSecureRandomIndex(
      targets.length
    );

  return targets[randomIndex];
}

function selectRandomTarget() {
  targetWord =
    getRandomTargetWord();

  if (!targetWord) {
    throw new Error(
      `No target words are available for ` +
      `${WORD_LENGTH}-letter games.`
    );
  }

  /*
    Deliberately do not log targetWord here.

    Logging the answer to the console made the target
    immediately visible through browser DevTools.
  */
}

/* --------------------------------
   Game state reset
   -------------------------------- */

function resetGameState() {
  currentRow = 0;
  currentTile = 0;
  gameOver = false;
}

/* --------------------------------
   Game initialisation
   -------------------------------- */

/*
  Start a playable game for the currently selected
  word length.

  This function:
  1. Determines the length.
  2. Creates the board immediately.
  3. Loads only that length's data.
  4. Selects a target.
  5. Enables input.
*/
async function initialiseGame() {
  const requestId =
    ++gameRequestId;

  gameReady = false;
  dataLoading = true;
  gameOver = false;

  /*
    Determine the requested length before loading data.
  */
  WORD_LENGTH =
    getSelectedWordLength();

  /*
    Create the board FIRST.

    This is the critical fix for the board loading issue.
  */
  resetGameState();
  createBoard();
  updateInstructions();

  if (newGameButton) {
    newGameButton.hidden = true;
  }

  showMessage(
    `Loading ${WORD_LENGTH}-letter game…`
  );

  try {
    const { words, targets } =
      await loadLengthData(
        WORD_LENGTH
      );

    /*
      The user may have changed the word length while
      the request was running.

      Ignore this old request if it is no longer current.
    */
    if (
      requestId !== gameRequestId
    ) {
      return;
    }

    if (
      !words ||
      !targets ||
      words.size === 0 ||
      targets.size === 0
    ) {
      throw new Error(
        `No usable data is available for ` +
        `${WORD_LENGTH}-letter games.`
      );
    }

    /*
      Select the target only after the correct data
      has loaded.
    */
    selectRandomTarget();

    resetGameState();

    gameReady = true;
    dataLoading = false;

    updateInstructions();
    resizeBoard();

    if (
      isRandomWordLengthSelected()
    ) {
      showMessage(
        `Random ${WORD_LENGTH}-letter game`
      );
    } else {
      showMessage(
        `${WORD_LENGTH}-letter game`
      );
    }

    if (newGameButton) {
      newGameButton.hidden = true;
    }
  } catch (error) {
    /*
      Ignore failures from an obsolete request.
    */
    if (
      requestId !== gameRequestId
    ) {
      return;
    }

    gameReady = false;
    dataLoading = false;
    gameOver = true;

    console.error(
      "Stage 18: Game initialisation failed:",
      error
    );

    showMessage(
      `Game data error: ${error.message}`
    );

    if (newGameButton) {
      newGameButton.hidden = false;
    }
  }
}

/* --------------------------------
   Board helpers
   -------------------------------- */

function getCurrentRowTiles() {
  if (!rows[currentRow]) {
    return [];
  }

  return Array.from(
    rows[currentRow].querySelectorAll(
      ".tile"
    )
  ).slice(
    0,
    WORD_LENGTH
  );
}

function getCurrentGuess() {
  return getCurrentRowTiles()
    .slice(0, currentTile)
    .map((tile) =>
      tile.textContent
        .trim()
        .toUpperCase()
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
    `Guess ${rowIndex + 1}, ` +
    `position ${tileIndex + 1}: ${letter}`
  );
}

/* --------------------------------
   Letter input
   -------------------------------- */

function addLetter(letter) {
  if (
    !gameReady ||
    gameOver ||
    currentTile >= WORD_LENGTH
  ) {
    return;
  }

  const tiles =
    getCurrentRowTiles();

  if (!tiles[currentTile]) {
    return;
  }

  const upperLetter =
    letter.toUpperCase();

  if (!/^[A-Z]$/.test(upperLetter)) {
    return;
  }

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
    !gameReady ||
    gameOver ||
    currentTile <= 0
  ) {
    return;
  }

  currentTile -= 1;

  const tiles =
    getCurrentRowTiles();

  if (tiles[currentTile]) {
    tiles[currentTile].textContent = "";

    tiles[currentTile].setAttribute(
      "aria-label",
      `Guess ${currentRow + 1}, ` +
      `position ${currentTile + 1}: empty`
    );
  }
}

function handleLetter(letter) {
  if (
    /^[a-zA-Z]$/.test(letter)
  ) {
    addLetter(letter);
  }
}

/* --------------------------------
   Guess evaluation
   -------------------------------- */

/*
  Wordle-style duplicate-letter handling.

  Pass 1:
    Mark exact matches.

  Pass 2:
    Match remaining letters as present.

  This prevents a repeated guess letter from being
  incorrectly marked present more times than it exists
  in the target.
*/
function evaluateGuess(guess) {
  const results =
    Array(WORD_LENGTH).fill(
      "absent"
    );

  const remainingTargetLetters =
    targetWord.split("");

  /*
    First pass:
    exact matches.
  */
  for (
    let index = 0;
    index < WORD_LENGTH;
    index += 1
  ) {
    if (
      guess[index] ===
      targetWord[index]
    ) {
      results[index] =
        "correct";

      remainingTargetLetters[index] =
        null;
    }
  }

  /*
    Second pass:
    present but incorrectly positioned.
  */
  for (
    let index = 0;
    index < WORD_LENGTH;
    index += 1
  ) {
    if (
      results[index] ===
      "correct"
    ) {
      continue;
    }

    const matchingIndex =
      remainingTargetLetters.indexOf(
        guess[index]
      );

    if (
      matchingIndex !== -1
    ) {
      results[index] =
        "present";

      remainingTargetLetters[
        matchingIndex
      ] = null;
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

  const tiles =
    Array.from(
      rows[rowIndex].querySelectorAll(
        ".tile"
      )
    ).slice(
      0,
      WORD_LENGTH
    );

  results.forEach(
    (result, index) => {
      if (!tiles[index]) {
        return;
      }

      const letter =
        tiles[index]
          .textContent
          .trim();

      /*
        Clear any previous result classes before
        applying the current one.
      */
      tiles[index].classList.remove(
        "correct",
        "present",
        "absent"
      );

      tiles[index].classList.add(
        result
      );

      tiles[index].setAttribute(
        "aria-label",
        `Guess ${rowIndex + 1}, ` +
        `position ${index + 1}: ` +
        `${letter}, ` +
        `${getResultDescription(result)}`
      );
    }
  );
}

/* --------------------------------
   Win/loss handling
   -------------------------------- */

function endGame(won) {
  gameOver = true;
  gameReady = false;

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

/* --------------------------------
   Guess submission
   -------------------------------- */

function submitGuess() {
  if (!gameReady || gameOver) {
    return;
  }

  if (
    currentTile !== WORD_LENGTH
  ) {
    showMessage(
      "Not enough letters"
    );

    return;
  }

  const guess =
    getCurrentGuess();

  if (
    guess.length !== WORD_LENGTH
  ) {
    showMessage(
      "Not enough letters"
    );

    return;
  }

  /*
    Guesses use the complete dictionary.

    The target list is NOT used here.
  */
  if (
    !getWordCollection().has(guess)
  ) {
    showMessage(
      "Word not in list"
    );

    return;
  }

  const results =
    evaluateGuess(guess);

  displayEvaluation(
    results,
    currentRow
  );

  if (
    guess === targetWord
  ) {
    endGame(true);
    return;
  }

  if (
    currentRow ===
    MAX_GUESSES - 1
  ) {
    endGame(false);
    return;
  }

  currentRow += 1;
  currentTile = 0;

  showMessage(
    "Guess evaluated"
  );
}

/* --------------------------------
   New game
   -------------------------------- */

function startNewGame() {
  initialiseGame();
}

/* --------------------------------
   Word-length selection
   -------------------------------- */

function handleWordLengthChange() {
  /*
    The board should change immediately when the user
    changes the requested length, even if the new JSON
    data takes time to download.
  */
  WORD_LENGTH =
    getSelectedWordLength();

  initialiseGame();
}

/* --------------------------------
   Shared actions
   -------------------------------- */

function handleAction(action) {
  if (action === "backspace") {
    removeLetter();
    return;
  }

  if (action === "enter") {
    submitGuess();
  }
}

/* --------------------------------
   Physical keyboard
   -------------------------------- */

function handlePhysicalKeyboard() {
  document.addEventListener(
    "keydown",
    (event) => {
      /*
        Do not interfere with browser/application
        shortcuts.
      */
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }

      /*
        Do not capture keyboard input while the user
        is operating the word-length select.
      */
      if (
        event.target === wordLengthSelect
      ) {
        return;
      }

      if (
        event.key === "Backspace"
      ) {
        event.preventDefault();

        handleAction(
          "backspace"
        );

        return;
      }

      if (
        event.key === "Enter"
      ) {
        event.preventDefault();

        handleAction(
          "enter"
        );

        return;
      }

      if (
        /^[a-zA-Z]$/.test(
          event.key
        )
      ) {
        event.preventDefault();

        handleLetter(
          event.key
        );
      }
    }
  );
}

/* --------------------------------
   On-screen keyboard
   -------------------------------- */

function handleOnScreenKeyboard() {
  document.addEventListener(
    "click",
    (event) => {
      const target =
        event.target;

      if (
        !target ||
        typeof target.closest !== "function"
      ) {
        return;
      }

      const button =
        target.closest(
          "button[data-key]"
        );

      if (!button) {
        return;
      }

      const key =
        button.dataset.key;

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
}

/* --------------------------------
   Application startup
   -------------------------------- */

function startApplication() {
  /*
    Cache DOM references before doing anything else.
  */
  cachePageElements();

  if (!board) {
    showMessage(
      "Game board could not be initialised."
    );

    return;
  }

  /*
    Determine the initial length.
  */
  WORD_LENGTH =
    getSelectedWordLength();

  /*
    CRITICAL:

    Build the board synchronously before starting
    ANY asynchronous JSON request.

    The user therefore sees the six-row board
    immediately.
  */
  createBoard();

  updateInstructions();

  setupBoardResizeHandling();

  /*
    Attach controls immediately.
  */
  if (wordLengthSelect) {
    wordLengthSelect.addEventListener(
      "change",
      handleWordLengthChange
    );
  }

  if (newGameButton) {
    newGameButton.addEventListener(
      "click",
      startNewGame
    );
  }

  handlePhysicalKeyboard();
  handleOnScreenKeyboard();

  /*
    The board is already visible here.
    Now load only the selected length.
  */
  initialiseGame();
}

/* --------------------------------
   Start application safely
   -------------------------------- */

if (
  document.readyState === "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    startApplication
  );
} else {
  startApplication();
}
