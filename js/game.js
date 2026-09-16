/*
  Wordle-style game
  Stage 17: Separate target-word lists

  This file controls:
  - Fixed and random word-length selection.
  - Random target selection from dedicated target lists.
  - Dictionary loading from JSON files.
  - Target-list loading from JSON files.
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

  Stage 17 distinction:

  words-X.json
    = words that may be entered as guesses.

  targets-X.json
    = words that may be selected as answers.
*/

"use strict";

/* ------------------------------
   Game constants
   ------------------------------ */

const SUPPORTED_WORD_LENGTHS = [
  4,
  5,
  6,
  7
];

const DEFAULT_WORD_LENGTH = 5;
const RANDOM_WORD_LENGTH = "random";
const MAX_GUESSES = 6;

/*
  These paths are relative to index.html.

  GitHub Pages:

  https://henry783783.github.io/consolidation_project/

  therefore:

  ./data/words-4.json

  resolves to:

  /consolidation_project/data/words-4.json
*/
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

/* ------------------------------
   Game state
   ------------------------------ */

let board = null;
let statusMessage = null;
let newGameButton = null;
let wordLengthSelect = null;

let WORD_LENGTH = DEFAULT_WORD_LENGTH;
let targetWord = "";

let rows = [];
let currentRow = 0;
let currentTile = 0;
let gameOver = false;

const wordCollections = {
  4: new Set(),
  5: new Set(),
  6: new Set(),
  7: new Set()
};

const targetCollections = {
  4: new Set(),
  5: new Set(),
  6: new Set(),
  7: new Set()
};

let dictionariesLoaded = false;
let targetListsLoaded = false;

/* ------------------------------
   Page element initialisation
   ------------------------------ */

function cachePageElements() {
  board =
    document.querySelector(".board");

  statusMessage =
    document.querySelector(".stage-status");

  newGameButton =
    document.querySelector("#new-game");

  wordLengthSelect =
    document.querySelector("#word-length");

  if (!board) {
    console.error(
      "Stage 17: .board element was not found."
    );
  }
}

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

function getWordLengthTargets() {
  return (
    targetCollections[WORD_LENGTH] ||
    new Set()
  );
}

function isRandomWordLengthSelected() {
  return (
    wordLengthSelect &&
    wordLengthSelect.value ===
      RANDOM_WORD_LENGTH
  );
}

/* ------------------------------
   Randomness
   ------------------------------ */

/*
  Uses Web Crypto where available.

  Rejection sampling prevents bias when
  the number of choices does not divide
  evenly into the 32-bit random range.

  Math.random() is retained only as a
  fallback for older environments.
*/
function getSecureRandomIndex(length) {
  if (length <= 0) {
    return -1;
  }

  if (
    window.crypto &&
    typeof window.crypto.getRandomValues ===
      "function"
  ) {
    const range = 0x100000000;

    const limit =
      range -
      (range % length);

    const randomValues =
      new Uint32Array(1);

    let randomValue;

    do {
      window.crypto.getRandomValues(
        randomValues
      );

      randomValue =
        randomValues[0];
    } while (
      randomValue >= limit
    );

    return (
      randomValue % length
    );
  }

  return Math.floor(
    Math.random() * length
  );
}

function getRandomWordLength() {
  const randomIndex =
    getSecureRandomIndex(
      SUPPORTED_WORD_LENGTHS.length
    );

  return SUPPORTED_WORD_LENGTHS[
    randomIndex
  ];
}

/* ------------------------------
   Target-word helpers
   ------------------------------ */

function getRandomTargetWord() {
  const targets =
    Array.from(
      getWordLengthTargets()
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
      `No target words are available for ${WORD_LENGTH}-letter games.`
    );
  }

  console.log(
    `Selected ${WORD_LENGTH}-letter target: ${targetWord}`
  );
}

/* ------------------------------
   JSON loading
   ------------------------------ */

/*
  Load one JSON list.

  The function intentionally uses the
  simple page-relative paths that worked
  correctly on the GitHub Pages deployment.
*/
async function loadWordList(
  filePath,
  length,
  listName
) {
  console.log(
    `Stage 17: Loading ${listName} from ${filePath}`
  );

  let response;

  try {
    response =
      await fetch(
        filePath,
        {
          cache: "no-store"
        }
      );
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

  data.forEach(
    (word) => {
      if (
        typeof word !==
        "string"
      ) {
        return;
      }

      const normalisedWord =
        word
          .trim()
          .toUpperCase();

      if (
        normalisedWord.length ===
          length &&
        /^[A-Z]+$/.test(
          normalisedWord
        )
      ) {
        words.add(
          normalisedWord
        );
      }
    }
  );

  if (words.size === 0) {
    throw new Error(
      `${filePath} contained no valid ${length}-letter words.`
    );
  }

  console.log(
    `Stage 17: Loaded ${words.size} ${length}-letter ${listName}.`
  );

  return words;
}

/* ------------------------------
   Dictionary loading
   ------------------------------ */

async function loadDictionaries() {
  for (
    const length of
      SUPPORTED_WORD_LENGTHS
  ) {
    try {
      const words =
        await loadWordList(
          WORD_DATA_FILES[length],
          length,
          "guess words"
        );

      wordCollections[length] =
        words;
    } catch (error) {
      dictionariesLoaded =
        false;

      console.error(
        `Dictionary loading failed for ${length}-letter words:`,
        error
      );

      showMessage(
        `Dictionary error: ${error.message}`
      );

      return false;
    }
  }

  dictionariesLoaded =
    true;

  console.log(
    "Stage 17: All guess dictionaries loaded successfully."
  );

  return true;
}

/* ------------------------------
   Target-list loading
   ------------------------------ */

async function loadTargetLists() {
  for (
    const length of
      SUPPORTED_WORD_LENGTHS
  ) {
    try {
      const targets =
        await loadWordList(
          TARGET_DATA_FILES[length],
          length,
          "target words"
        );

      targetCollections[length] =
        targets;
    } catch (error) {
      targetListsLoaded =
        false;

      console.error(
        `Target loading failed for ${length}-letter targets:`,
        error
      );

      showMessage(
        `Target-list error: ${error.message}`
      );

      return false;
    }
  }

  targetListsLoaded =
    true;

  console.log(
    "Stage 17: All target lists loaded successfully."
  );

  return true;
}

/* ------------------------------
   Target-list validation
   ------------------------------ */

/*
  Target words must also exist in the
  corresponding guess dictionary.

  Instead of stopping the entire game when
  one target is missing from the dictionary,
  invalid cross-list targets are removed.

  This means one bad entry cannot prevent
  the board or game from loading.
*/
function validateTargetListsAgainstDictionaries() {
  for (
    const length of
      SUPPORTED_WORD_LENGTHS
  ) {
    const targets =
      targetCollections[length];

    const words =
      wordCollections[length];

    const validTargets =
      new Set();

    let removedCount = 0;

    for (
      const target of targets
    ) {
      if (
        words.has(target)
      ) {
        validTargets.add(
          target
        );
      } else {
        removedCount += 1;

        console.warn(
          `Stage 17: Target "${target}" from targets-${length}.json is not present in words-${length}.json and will not be used.`
        );
      }
    }

    targetCollections[length] =
      validTargets;

    console.log(
      `Stage 17: ${validTargets.size} valid ${length}-letter targets available.`
    );

    if (
      removedCount > 0
    ) {
      console.warn(
        `Stage 17: Removed ${removedCount} invalid ${length}-letter target(s).`
      );
    }

    if (
      validTargets.size === 0
    ) {
      throw new Error(
        `No usable ${length}-letter target words remain after validation.`
      );
    }
  }

  console.log(
    "Stage 17: Target-list validation completed successfully."
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
  /*
    The board is deliberately independent
    of JSON loading.
  */

  if (!board) {
    console.error(
      "Stage 17: Cannot create board because .board was not found."
    );

    return false;
  }

  board.innerHTML =
    "";

  for (
    let rowIndex = 0;
    rowIndex < MAX_GUESSES;
    rowIndex += 1
  ) {
    const row =
      document.createElement(
        "div"
      );

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
        document.createElement(
          "div"
        );

      tile.className =
        "tile";

      tile.setAttribute(
        "aria-label",
        `Guess ${rowIndex + 1}, position ${tileIndex + 1}: empty`
      );

      row.appendChild(
        tile
      );
    }

    board.appendChild(
      row
    );
  }

  rows =
    Array.from(
      board.querySelectorAll(
        ".row"
      )
    );

  console.log(
    `Stage 17: Board created with ${MAX_GUESSES} rows and ${WORD_LENGTH} tiles per row.`
  );

  return true;
}

/* ------------------------------
   Word-length determination
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

/* ------------------------------
   Game initialisation
   ------------------------------ */

function initialiseGame() {
  if (
    !dictionariesLoaded ||
    !targetListsLoaded
  ) {
    showMessage(
      "Game data has not finished loading."
    );

    return;
  }

  determineWordLength();

  try {
    selectRandomTarget();
  } catch (error) {
    console.error(
      "Stage 17: Target selection failed:",
      error
    );

    showMessage(
      error.message
    );

    return;
  }

  createBoard();

  updateInstructions();

  currentRow =
    0;

  currentTile =
    0;

  gameOver =
    false;

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
      .querySelectorAll(
        ".tile"
      )
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
    currentTile >=
      WORD_LENGTH
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
      .textContent =
      "";

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
      matchingIndex !==
      -1
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
  gameOver =
    true;

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

  /*
    Guesses use the complete dictionary.

    The target list is NOT used here.
  */

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

  currentTile =
    0;
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

/* ------------------------------
   Shared actions
   ------------------------------ */

function handleAction(action) {
  if (
    action ===
    "backspace"
  ) {
    removeLetter();

    return;
  }

  if (
    action ===
    "enter"
  ) {
    submitGuess();
  }
}

/* ------------------------------
   Physical keyboard
   ------------------------------ */

function handlePhysicalKeyboard() {
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
}

/* ------------------------------
   On-screen keyboard
   ------------------------------ */

function handleOnScreenKeyboard() {
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
        handleAction(
          key
        );

        return;
      }

      handleLetter(
        key
      );
    }
  );
}

/* ------------------------------
   Application startup
   ------------------------------ */

async function startApplication() {
  /*
    Cache the page elements first.
  */

  cachePageElements();

  /*
    Create the board immediately.

    This is the critical protection against
    JSON-loading problems hiding the board.
  */

  determineWordLength();

  createBoard();

  updateInstructions();

  /*
    Attach controls immediately as well.
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
    The board now exists regardless of whether
    the JSON files load successfully.
  */

  showMessage(
    "Stage 17: Loading game data…"
  );

  /*
    Load the general guess dictionaries.
  */

  const dictionariesOk =
    await loadDictionaries();

  if (!dictionariesOk) {
    return;
  }

  /*
    Load the dedicated target lists.
  */

  const targetsOk =
    await loadTargetLists();

  if (!targetsOk) {
    return;
  }

  /*
    Make sure every target is also a legal
    guess. Invalid target entries are removed
    rather than preventing the game loading.
  */

  try {
    validateTargetListsAgainstDictionaries();
  } catch (error) {
    console.error(
      "Stage 17 target validation failed:",
      error
    );

    showMessage(
      `Target-list error: ${error.message}`
    );

    return;
  }

  /*
    Everything required for a playable game
    is now available.
  */

  initialiseGame();
}

/* ------------------------------
   Start application safely
   ------------------------------ */

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    startApplication
  );
} else {
  startApplication();
}
