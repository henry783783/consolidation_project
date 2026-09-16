/*
  Wordle-style game
  Stage 16: Expanded dictionary

  This version restores the simpler dictionary-loading
  approach that previously worked on GitHub Pages.

  It controls:
  - Fixed and random word-length selection.
  - Random target selection from the dictionary.
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

  IMPORTANT:
  Dictionary paths are relative to index.html:

      ./data/words-4.json
      ./data/words-5.json
      ./data/words-6.json
      ./data/words-7.json
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
  IMPORTANT:
  These paths are relative to index.html,
  not game.js.

  Repository structure:

  consolidation_project/
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
  4: "./data/words-4.json",
  5: "./data/words-5.json",
  6: "./data/words-6.json",
  7: "./data/words-7.json"
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
  Dictionary collections.

  Each collection becomes a Set containing
  uppercase words after loading.
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
    wordLengthSelect.value ===
      RANDOM_WORD_LENGTH
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
   Dictionary loading
   ------------------------------ */

/*
  Load one dictionary.

  The URL is intentionally simple:

      ./data/words-X.json

  Because fetch() resolves this against the page URL,
  GitHub Pages correctly resolves it to:

      /consolidation_project/data/words-X.json
*/
async function loadWordCollection(length) {
  const filePath =
    WORD_DATA_FILES[length];

  if (!filePath) {
    throw new Error(
      `No dictionary file configured for ${length}-letter words.`
    );
  }

  console.log(
    `Loading ${length}-letter dictionary from: ${filePath}`
  );

  let response;

  try {
    response =
      await fetch(filePath, {
        cache: "no-store"
      });
  } catch (error) {
    console.error(
      `Fetch failed for ${filePath}:`,
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
    data =
      await response.json();
  } catch (error) {
    console.error(
      `Invalid JSON in ${filePath}:`,
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

  const words =
    new Set();

  data.forEach((word) => {
    if (
      typeof word !== "string"
    ) {
      return;
    }

    const normalisedWord =
      word
        .trim()
        .toUpperCase();

    if (
      normalisedWord.length === length &&
      /^[A-Z]+$/.test(
        normalisedWord
      )
    ) {
      words.add(
        normalisedWord
      );
    }
  });

  if (words.size === 0) {
    throw new Error(
      `${filePath} contained no valid ${length}-letter words.`
    );
  }

  console.log(
    `Loaded ${words.size} valid ${length}-letter words.`
  );

  return words;
}

/*
  Load all dictionaries.

  They are loaded in parallel rather than one after
  another. This is faster and also makes it easier to
  identify a problem with one particular file.
*/
async function loadDictionaries() {
  showMessage(
    "Stage 16: Loading dictionary…"
  );

  const results =
    await Promise.allSettled(
      SUPPORTED_WORD_LENGTHS.map(
        (length) =>
          loadWordCollection(length)
      )
    );

  for (
    let index = 0;
    index <
      SUPPORTED_WORD_LENGTHS.length;
    index += 1
  ) {
    const length =
      SUPPORTED_WORD_LENGTHS[index];

    const result =
      results[index];

    if (
      result.status === "fulfilled"
    ) {
      wordCollections[length] =
        result.value;
    } else {
      console.error(
        `Dictionary loading failed for ${length}-letter words:`,
        result.reason
      );

      dictionariesLoaded = false;

      showMessage(
        `Dictionary error for ${length}-letter words: ${result.reason.message}`
      );

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
      "Could not find .board element."
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

    row.className =
      "row";

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

      tile.className =
        "tile";

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
      board.querySelectorAll(
        ".row"
      )
    );
}

/* ------------------------------
   Game initialisation
   ------------------------------ */

function determineWordLength() {
  if (
    isRandomWordLengthSelected()
  ) {
    WORD_LENGTH =
      getRandomWordLength();

    return;
  }

  const selectedLength =
    Number(
      wordLengthSelect
        ? wordLengthSelect.value
        : DEFAULT_WORD_LENGTH
    );

  if (
    isSupportedWordLength(
      selectedLength
    )
  ) {
    WORD_LENGTH =
      selectedLength;

    return;
  }

  WORD_LENGTH =
    DEFAULT_WORD_LENGTH;

  if (wordLengthSelect) {
    wordLengthSelect.value =
      String(
        DEFAULT_WORD_LENGTH
      );
  }
}

/*
  Reset the game after dictionaries have
  successfully loaded.
*/
function initialiseGame() {
  if (!dictionariesLoaded) {
    showMessage(
      "Dictionary has not finished loading."
    );

    return;
  }

  determineWordLength();

  try {
    selectRandomTarget();
  } catch (error) {
    console.error(
      "Target selection failed:",
      error
    );

    showMessage(
      error.message
    );

    return;
  }

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
    newGameButton.hidden =
      true;
  }
}

/* ------------------------------
   Board helpers
   ------------------------------ */

function getCurrentRowTiles() {
  if (
    !rows[currentRow]
  ) {
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
    .map(
      (tile) =>
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

  if (
    !tiles[currentTile]
  ) {
    return;
  }

  const upperLetter =
    letter.toUpperCase();

  tiles[currentTile]
    .textContent =
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

  if (
    tiles[currentTile]
  ) {
    tiles[currentTile]
      .textContent = "";

    tiles[currentTile]
      .setAttribute(
        "aria-label",
        `Guess ${currentRow + 1}, position ${currentTile + 1}: empty`
      );
  }
}

function handleLetter(letter) {
  if (
    /^[a-zA-Z]$/.test(
      letter
    )
  ) {
    addLetter(letter);
  }
}

/* ------------------------------
   Guess evaluation
   ------------------------------ */

function evaluateGuess(guess) {
  const results =
    Array(
      WORD_LENGTH
    ).fill(
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

function getResultDescription(
  result
) {
  if (
    result === "correct"
  ) {
    return "correct position";
  }

  if (
    result === "present"
  ) {
    return "correct letter, wrong position";
  }

  return "letter not present";
}

function displayEvaluation(
  results,
  rowIndex
) {
  if (
    !rows[rowIndex]
  ) {
    return;
  }

  const tiles =
    Array.from(
      rows[rowIndex]
        .querySelectorAll(
          ".tile"
        )
    ).slice(
      0,
      WORD_LENGTH
    );

  results.forEach(
    (result, index) => {
      if (
        !tiles[index]
      ) {
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
    evaluateGuess(
      guess
    );

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
    Number(
      selectedValue
    );

  if (
    !isSupportedWordLength(
      selectedLength
    )
  ) {
    wordLengthSelect.value =
      String(
        DEFAULT_WORD_LENGTH
      );

    WORD_LENGTH =
      DEFAULT_WORD_LENGTH;
  } else {
    WORD_LENGTH =
      selectedLength;
  }

  initialiseGame();
}

if (wordLengthSelect) {
  wordLengthSelect
    .addEventListener(
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
      event.key ===
      "Backspace"
    ) {
      event.preventDefault();

      handleAction(
        "backspace"
      );

      return;
    }

    if (
      event.key ===
      "Enter"
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
  Create the initial board immediately.

  This is deliberately done before the asynchronous
  dictionary loading. It means a dictionary problem
  cannot make the board itself disappear.
*/
determineWordLength();
createBoard();
updateInstructions();

async function startApplication() {
  const loaded =
    await loadDictionaries();

  if (!loaded) {
    return;
  }

  initialiseGame();
}

startApplication();
