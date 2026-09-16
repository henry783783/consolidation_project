```javascript
/*
  Wordle-style game
  Stage 17: Curated target words

  This file controls:
  - Fixed and random word-length selection.
  - Random target selection.
  - Separate guess and target dictionaries.
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

  Stage 16:
  - words-4.json
  - words-5.json
  - words-6.json
  - words-7.json

  Stage 17:
  - target-4.json
  - target-5.json
  - target-6.json
  - target-7.json

  Important:
  The JSON files are resolved relative to the HTML page,
  not relative to game.js. This makes the application work
  correctly when hosted in a GitHub Pages repository such as:

  https://henry783783.github.io/consolidation_project/
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
  JSON files live in /data/ at the repository root.

  These paths deliberately use ./data rather than ../data.

  They are resolved against document.baseURI, which is the
  URL of the current HTML page.

  Therefore:

  https://henry783783.github.io/consolidation_project/

  correctly becomes:

  https://henry783783.github.io/consolidation_project/data/words-5.json
*/
const WORD_DATA_FILES = {
  4: "./data/words-4.json",
  5: "./data/words-5.json",
  6: "./data/words-6.json",
  7: "./data/words-7.json"
};

const TARGET_DATA_FILES = {
  4: "./data/target-4.json",
  5: "./data/target-5.json",
  6: "./data/target-6.json",
  7: "./data/target-7.json"
};

/* ------------------------------
   Page elements
   ------------------------------ */

const board =
  document.querySelector(".board");

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
  Stage 16 guess dictionaries.

  These contain all words that are accepted as guesses.
*/
const wordCollections = {
  4: new Set(),
  5: new Set(),
  6: new Set(),
  7: new Set()
};

/*
  Stage 17 target dictionaries.

  These contain only words that are permitted
  to be selected as the hidden target.
*/
const targetCollections = {
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
   JSON path helper
   ------------------------------ */

/*
  Resolve a data file from the HTML page.

  document.baseURI is important here.

  On GitHub Pages this is something like:

  https://henry783783.github.io/consolidation_project/

  Therefore "./data/words-5.json" becomes:

  https://henry783783.github.io/consolidation_project/data/words-5.json
*/
function getDataFileUrl(relativePath) {
  return new URL(
    relativePath,
    document.baseURI
  );
}

/* ------------------------------
   JSON loading
   ------------------------------ */

/*
  Load a JSON array and convert it into
  a validated Set of uppercase words.

  This function is shared by both:
  - the large guess dictionaries
  - the curated target dictionaries
*/
async function loadWordFile(
  relativePath,
  length,
  description
) {
  const fileUrl =
    getDataFileUrl(relativePath);

  let response;

  try {
    response = await fetch(
      fileUrl.href,
      {
        cache: "no-store"
      }
    );
  } catch (error) {
    throw new Error(
      `Network error while loading ${description}: ${fileUrl.href}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Could not load ${description}: HTTP ${response.status}`
    );
  }

  let data;

  try {
    data = await response.json();
  } catch (error) {
    throw new Error(
      `${description} is not valid JSON.`
    );
  }

  if (!Array.isArray(data)) {
    throw new Error(
      `${description} must contain a JSON array.`
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
      `${description} contained no valid ${length}-letter words.`
    );
  }

  return words;
}

/* ------------------------------
   Dictionary loading
   ------------------------------ */

/*
  Load one guess dictionary.
*/
async function loadGuessDictionary(length) {
  const relativePath =
    WORD_DATA_FILES[length];

  return loadWordFile(
    relativePath,
    length,
    `guess dictionary ${relativePath}`
  );
}

/*
  Load one target dictionary.
*/
async function loadTargetDictionary(length) {
  const relativePath =
    TARGET_DATA_FILES[length];

  return loadWordFile(
    relativePath,
    length,
    `target dictionary ${relativePath}`
  );
}

/*
  Load every Stage 16 guess dictionary and
  every Stage 17 target dictionary.

  The board is not created until all eight
  files have loaded successfully.
*/
async function loadDictionaries() {
  showMessage(
    "Stage 17: Loading dictionaries…"
  );

  console.log(
    "Stage 17: starting dictionary load."
  );

  /*
    Load guess dictionaries.
  */
  for (
    const length of SUPPORTED_WORD_LENGTHS
  ) {
    try {
      const words =
        await loadGuessDictionary(length);

      wordCollections[length] = words;

      console.log(
        `Loaded ${words.size} guess words for length ${length}.`
      );
    } catch (error) {
      console.error(error);

      showMessage(
        `Dictionary error: ${error.message}`
      );

      dictionariesLoaded = false;

      return false;
    }
  }

  /*
    Load target dictionaries.
  */
  for (
    const length of SUPPORTED_WORD_LENGTHS
  ) {
    try {
      const targets =
        await loadTargetDictionary(length);

      targetCollections[length] = targets;

      console.log(
        `Loaded ${targets.size} target words for length ${length}.`
      );
    } catch (error) {
      console.error(error);

      showMessage(
        `Target dictionary error: ${error.message}`
      );

      dictionariesLoaded = false;

      return false;
    }
  }

  dictionariesLoaded = true;

  console.log(
    "Stage 17: all guess and target dictionaries loaded successfully."
  );

  return true;
}

/* ------------------------------
   Word-length helpers
   ------------------------------ */

function isSupportedWordLength(length) {
  return SUPPORTED_WORD_LENGTHS.includes(
    length
  );
}

function getWordLengthWords() {
  return (
    wordCollections[WORD_LENGTH] ||
    new Set()
  );
}

function getTargetWords() {
  return (
    targetCollections[WORD_LENGTH] ||
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
    wordLengthSelect.value ===
      RANDOM_WORD_LENGTH
  );
}

/* ------------------------------
   Random target selection
   ------------------------------ */

/*
  Select a random word ONLY from the curated
  Stage 17 target collection.

  The larger Stage 16 dictionary is deliberately
  not used here.
*/
function getRandomTargetWord() {
  const words =
    Array.from(getTargetWords());

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
    `Stage 17 target selected (${WORD_LENGTH} letters): ${targetWord}`
  );
}

/* ------------------------------
   Instructions
   ------------------------------ */

function updateInstructions() {
  const instructions =
    document.querySelector(
      ".instructions"
    );

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
    console.error(
      "Board element .board was not found."
    );

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

  console.log(
    `Created board: ${MAX_GUESSES} rows × ${WORD_LENGTH} tiles.`
  );
}

/* ------------------------------
   Game initialisation
   ------------------------------ */

function initialiseGame() {
  if (!dictionariesLoaded) {
    showMessage(
      "Dictionaries have not finished loading."
    );

    return;
  }

  /*
    Determine the word length.
  */
  if (
    isRandomWordLengthSelected()
  ) {
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
          String(
            DEFAULT_WORD_LENGTH
          );
      }
    }
  }

  /*
    Select target from the Stage 17
    curated target collection.
  */
  selectRandomTarget();

  /*
    Reset game state before creating
    the new board.
  */
  currentRow = 0;
  currentTile = 0;
  gameOver = false;

  createBoard();
  updateInstructions();

  if (
    isRandomWordLengthSelected()
  ) {
    showMessage(
      `Stage 17: Random ${WORD_LENGTH}-letter game`
    );
  } else {
    showMessage(
      `Stage 17: ${WORD_LENGTH}-letter game`
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
```
