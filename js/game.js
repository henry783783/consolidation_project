/*
  Wordle-style game
  Stage 16: Expanded dictionary

  This file controls:
  - Fixed and random word-length selection.
  - Random target selection.
  - Dictionary loading from JSON files.
  - Dynamic board creation.
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

  Stage 16 loads the word collections from the data/
  directory rather than keeping them inside this file.
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
  Dictionary file locations.

  These paths are relative to the JavaScript file rather
  than relying on the current browser URL.

  Expected repository structure:

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
      └── words-7.json
*/
const WORD_DATA_FILES = {
  4: "../data/words-4.json",
  5: "../data/words-5.json",
  6: "../data/words-6.json",
  7: "../data/words-7.json"
};

/* ------------------------------
   Page elements
   ------------------------------ */

const board = document.querySelector(".board");
const statusMessage =
  document.querySelector(".stage-status");
const newGameButton =
  document.querySelector("#new-game");
const wordLengthSelect =
  document.querySelector("#word-length");

/* ------------------------------
   Game state
   ------------------------------ */

let WORD_LENGTH = DEFAULT_WORD_LENGTH;
let targetWord = "";

let rows = [];
let currentRow = 0;
let currentTile = 0;
let gameOver = false;

/*
  The dictionaries are populated asynchronously
  when the page loads.

  Each property will contain a Set of uppercase words.
*/
const wordCollections = {
  4: new Set(),
  5: new Set(),
  6: new Set(),
  7: new Set()
};

let dictionariesLoaded = false;

/* ------------------------------
   Status helpers
   ------------------------------ */

function showMessage(message) {
  if (statusMessage) {
    statusMessage.textContent = message;
  }
}

/* ------------------------------
   Dictionary loading
   ------------------------------ */

/*
  Get the directory containing this JavaScript file.

  This makes the data paths work correctly when the
  GitHub Pages site is hosted under a repository path
  such as:

  https://username.github.io/wordle/

  rather than only at:

  https://username.github.io/
*/
function getJavaScriptDirectory() {
  const script =
    document.querySelector('script[src$="js/game.js"]');

  if (!script) {
    return null;
  }

  return new URL(
    "./",
    new URL(script.getAttribute("src"), document.baseURI)
  );
}

/*
  Load and validate one dictionary file.
*/
async function loadWordCollection(length) {
  const relativePath =
    WORD_DATA_FILES[length];

  if (!relativePath) {
    throw new Error(
      `No dictionary file configured for ${length}-letter words.`
    );
  }

  const jsDirectory =
    getJavaScriptDirectory();

  if (!jsDirectory) {
    throw new Error(
      "Could not determine the location of game.js."
    );
  }

  const fileUrl =
    new URL(relativePath, jsDirectory);

  let response;

  try {
    response = await fetch(fileUrl.href, {
      cache: "no-store"
    });
  } catch (error) {
    throw new Error(
      `Network error while loading ${fileUrl.pathname}.`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Could not load ${fileUrl.pathname} — HTTP ${response.status}.`
    );
  }

  let data;

  try {
    data = await response.json();
  } catch (error) {
    throw new Error(
      `The file ${fileUrl.pathname} is not valid JSON.`
    );
  }

  if (!Array.isArray(data)) {
    throw new Error(
      `${fileUrl.pathname} must contain a JSON array of words.`
    );
  }

  const words = new Set();

  data.forEach((word) => {
    if (typeof word !== "string") {
      return;
    }

    const normalisedWord =
      word.trim().toUpperCase();

    if (
      normalisedWord.length === length &&
      /^[A-Z]+$/.test(normalisedWord)
    ) {
      words.add(normalisedWord);
    }
  });

  if (words.size === 0) {
    throw new Error(
      `${fileUrl.pathname} loaded successfully but contained no valid ${length}-letter words.`
    );
  }

  return words;
}

/*
  Load all four dictionaries.

  Each file is loaded separately so that an error can
  identify the exact dictionary that failed.
*/
async function loadDictionaries() {
  showMessage(
    "Stage 16: Loading dictionary…"
  );

  for (const length of SUPPORTED_WORD_LENGTHS) {
    try {
      const words =
        await loadWordCollection(length);

      wordCollections[length] = words;

      console.log(
        `Loaded ${words.size} ${length}-letter words.`
      );
    } catch (error) {
      console.error(
        `Dictionary loading failed for ${length}-letter words:`,
        error
      );

      showMessage(
        `Dictionary error: ${error.message}`
      );

      dictionariesLoaded = false;

      return false;
    }
  }

  dictionariesLoaded = true;

  console.log(
    "All Stage 16 dictionaries loaded successfully."
  );

  return true;
}

/* ------------------------------
   Word-length helpers
   ------------------------------ */

function isSupportedWordLength(length) {
  return SUPPORTED_WORD_LENGTHS.includes(length);
}

function getWordLengthWords() {
  return (
    wordCollections[WORD_LENGTH] ||
    new Set()
  );
}

function getRandomWordLength() {
  const randomIndex =
    Math.floor(
      Math.random() *
      SUPPORTED_WORD_LENGTHS.length
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
  const words =
    Array.from(getWordLengthWords());

  if (words.length === 0) {
    return "";
  }

  const randomIndex =
    Math.floor(
      Math.random() * words.length
    );

  return words[randomIndex];
}

function selectRandomTarget() {
  targetWord =
    getRandomTargetWord();

  if (!targetWord) {
    throw new Error(
      `No target words are available for ${WORD_LENGTH}-letter games.`
    );
  }

  console.log(
    `Selected ${WORD_LENGTH}-letter target: ${targetWord}`
  );
}

/* ------------------------------
   Instructions
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
        `Guess ${rowIndex + 1}, position ${tileIndex + 1}: empty`
      );

      row.appendChild(tile);
    }

    board.appendChild(row);
  }

  rows =
    Array.from(
      board.querySelectorAll(".row")
    );
}

/* ------------------------------
   Game initialisation
   ------------------------------ */

function initialiseGame() {
  if (!dictionariesLoaded) {
    showMessage(
      "Dictionary has not finished loading."
    );

    return;
  }

  /*
    Determine the word length for this game.
  */
  if (isRandomWordLengthSelected()) {
    WORD_LENGTH =
      getRandomWordLength();
  } else {
    const selectedLength =
      Number(
        wordLengthSelect.value
      );

    if (
      isSupportedWordLength(
        selectedLength
      )
    ) {
      WORD_LENGTH =
        selectedLength;
    } else {
      WORD_LENGTH =
        DEFAULT_WORD_LENGTH;

      if (wordLengthSelect) {
        wordLengthSelect.value =
          String(DEFAULT_WORD_LENGTH);
      }
    }
  }

  /*
    Select a fresh random target.
  */
  selectRandomTarget();

  /*
    Create the board only after the
    dictionary and target are ready.
  */
  createBoard();

  updateInstructions();

  currentRow = 0;
  currentTile = 0;
  gameOver = false;

  if (
    isRandomWordLengthSelected()
  ) {
    showMessage(
      `Stage 16: Random ${WORD_LENGTH}-letter game`
    );
  } else {
    showMessage(
      `Stage 16: ${WORD_LENGTH}-letter game`
    );
  }

  if (newGameButton) {
    newGameButton.hidden = true;
  }
}

/* ------------------------------
   Board helpers
   ------------------------------ */

function getCurrentRowTiles() {
  if (!rows[currentRow]) {
    return [];
  }

  return Array.from(
    rows[currentRow]
      .querySelectorAll(".tile")
  ).slice(
    0,
    WORD_LENGTH
  );
}

function getCurrentGuess() {
  const tiles =
    getCurrentRowTiles();

  return tiles
    .slice(
      0,
      currentTile
    )
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

  const tiles =
    getCurrentRowTiles();

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

  const tiles =
    getCurrentRowTiles();

  if (tiles[currentTile]) {
    tiles[currentTile].textContent =
      "";

    tiles[currentTile]
      .removeAttribute("aria-label");
  }
}

function handleLetter(letter) {
  if (
    /^[a-zA-Z]$/.test(letter)
  ) {
    addLetter(letter);
  }
}

/* ------------------------------
   Guess evaluation
   ------------------------------ */

function evaluateGuess(guess) {
  const results =
    Array(WORD_LENGTH)
      .fill("absent");

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
      rows[rowIndex]
        .querySelectorAll(".tile")
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

      tiles[index]
        .classList
        .add(result);

      tiles[index]
        .setAttribute(
          "aria-label",
          `Guess ${rowIndex + 1}, position ${index + 1}: ${letter}, ${getResultDescription(result)}`
        );
    }
  );
}

/* ------------------------------
   Win/loss handling
   ------------------------------ */

function endGame(won) {
  gameOver = true;

  if (won) {
    showMessage(
      "You win!"
    );
  } else {
    showMessage(
      `Game over — the word was ${targetWord}.`
    );
  }

  if (newGameButton) {
    newGameButton.hidden =
      false;
  }
}

/* ------------------------------
   Guess submission
   ------------------------------ */

function submitGuess() {
  if (gameOver) {
    return;
  }

  if (
    currentTile !==
    WORD_LENGTH
  ) {
    showMessage(
      "Not enough letters"
    );

    return;
  }

  const guess =
    getCurrentGuess();

  if (
    guess.length !==
    WORD_LENGTH
  ) {
    showMessage(
      "Not enough letters"
    );

    return;
  }

  if (
    !getWordLengthWords()
      .has(guess)
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

  showMessage(
    "Guess evaluated"
  );

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
    selectedValue ===
    RANDOM_WORD_LENGTH
  ) {
    initialiseGame();
    return;
  }

  const selectedLength =
    Number(selectedValue);

  if (
    !isSupportedWordLength(
      selectedLength
    )
  ) {
    wordLengthSelect.value =
      String(DEFAULT_WORD_LENGTH);

    WORD_LENGTH =
      DEFAULT_WORD_LENGTH;
  } else {
    WORD_LENGTH =
      selectedLength;
  }

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
  if (
    action === "backspace"
  ) {
    removeLetter();
    return;
  }

  if (
    action === "enter"
  ) {
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

/* ------------------------------
   New Game button
   ------------------------------ */

if (newGameButton) {
  newGameButton.addEventListener(
    "click",
    startNewGame
  );
}

/* ------------------------------
   Application startup
   ------------------------------ */

/*
  Stage 16 now starts by loading the
  dictionaries.

  The board is not created until all
  dictionaries have loaded successfully.
*/
async function startApplication() {
  const loaded =
    await loadDictionaries();

  if (!loaded) {
    return;
  }

  initialiseGame();
}

startApplication();
