```javascript
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
    = words that may be selected as the answer.
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
  IMPORTANT:
  These paths are relative to index.html.

  Do not change these to ../data/... .

  GitHub Pages serves the game from:

  /consolidation_project/

  so:

  ./data/words-4.json

  correctly resolves to:

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

let WORD_LENGTH =
  DEFAULT_WORD_LENGTH;

let targetWord = "";

let rows = [];

let currentRow = 0;

let currentTile = 0;

let gameOver = false;

/*
  Guess dictionaries.

  These contain all words that are legal
  guesses for each supported length.
*/
const wordCollections = {
  4: new Set(),
  5: new Set(),
  6: new Set(),
  7: new Set()
};

/*
  Target collections.

  These contain only words that are eligible
  to be selected as answers.
*/
const targetCollections = {
  4: new Set(),
  5: new Set(),
  6: new Set(),
  7: new Set()
};

let dictionariesLoaded = false;
let targetListsLoaded = false;

/* ------------------------------
   Status helpers
   ------------------------------ */

function showMessage(message) {
  if (statusMessage) {
    statusMessage.textContent =
      message;
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

function getRandomWordLength() {
  const randomIndex =
    getSecureRandomIndex(
      SUPPORTED_WORD_LENGTHS.length
    );

  return SUPPORTED_WORD_LENGTHS[
    randomIndex
  ];
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
  Return a cryptographically stronger random
  array index where the browser provides
  crypto.getRandomValues().

  Rejection sampling is used so that the
  range maps evenly onto the number of
  available choices.

  Math.random() remains as a fallback for
  environments without Web Crypto.
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
   JSON word-file loading
   ------------------------------ */

/*
  Load one JSON word list.

  This deliberately uses simple page-relative
  paths because that approach is known to work
  correctly on the GitHub Pages deployment.
*/
async function loadWordList(
  filePath,
  length,
  listName
) {
  console.log(
    `Loading ${listName} from ${filePath}`
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
    `Loaded ${words.size} ${length}-letter ${listName}.`
  );

  return words;
}

/* ------------------------------
   Dictionary loading
   ------------------------------ */

async function loadDictionaries() {
  const results =
    await Promise.allSettled(
      SUPPORTED_WORD_LENGTHS.map(
        (length) =>
          loadWordList(
            WORD_DATA_FILES[length],
            length,
            "guess words"
          )
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
      result.status ===
      "fulfilled"
    ) {
      wordCollections[length] =
        result.value;
    } else {
      console.error(
        `Dictionary loading failed for ${length}-letter words:`,
        result.reason
      );

      dictionariesLoaded =
        false;

      showMessage(
        `Dictionary error for ${length}-letter words: ${result.reason.message}`
      );

      return false;
    }
  }

  dictionariesLoaded =
    true;

  console.log(
    "All Stage 17 guess dictionaries loaded successfully."
  );

  return true;
}

/* ------------------------------
   Target-list loading
   ------------------------------ */

async function loadTargetLists() {
  const results =
    await Promise.allSettled(
      SUPPORTED_WORD_LENGTHS.map(
        (length) =>
          loadWordList(
            TARGET_DATA_FILES[length],
            length,
            "target words"
          )
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
      result.status ===
      "fulfilled"
    ) {
      targetCollections[length] =
        result.value;
    } else {
      console.error(
        `Target loading failed for ${length}-letter targets:`,
        result.reason
      );

      targetListsLoaded =
        false;

      showMessage(
        `Target-list error for ${length}-letter words: ${result.reason.message}`
      );

      return false;
    }
  }

  targetListsLoaded =
    true;

  console.log(
    "All Stage 17 target lists loaded successfully."
  );

  return true;
}

/* ------------------------------
   Target validation
   ------------------------------ */

/*
  A target should also be present in the
  corresponding guess dictionary.

  Otherwise the player could be given an
  answer that the game refuses to accept
  as a guess.
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

    for (
      const target of targets
    ) {
      if (
        !words.has(target)
      ) {
        throw new Error(
          `Target "${target}" from targets-${length}.json is not present in words-${length}.json.`
        );
      }
    }
  }

  console.log(
    "Stage 17 target lists passed dictionary cross-check."
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
      "Could not find .board element."
    );

    return;
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
    IMPORTANT:
    Guesses are checked against the
    general dictionary, NOT the target list.

    This allows the player to guess valid
    words that are not eligible answers.
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
  Create the board immediately.

  This is intentionally done before the
  asynchronous JSON loading.

  Therefore a JSON-loading problem cannot
  cause the board itself to disappear.
*/
determineWordLength();

createBoard();

updateInstructions();

/*
  Load both the general dictionaries and
  the dedicated target lists.

  The game only starts once all eight
  JSON files have loaded successfully.
*/
async function startApplication() {
  showMessage(
    "Stage 17: Loading game data…"
  );

  const dictionariesOk =
    await loadDictionaries();

  if (!dictionariesOk) {
    return;
  }

  const targetsOk =
    await loadTargetLists();

  if (!targetsOk) {
    return;
  }

  try {
    validateTargetListsAgainstDictionaries();
  } catch (error) {
    console.error(
      "Target-list validation failed:",
      error
    );

    showMessage(
      `Target-list error: ${error.message}`
    );

    return;
  }

  initialiseGame();
}

startApplication();
```
