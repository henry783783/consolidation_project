```javascript
/*
  Wordle-style game
  Stage 17: Curated target-word selection

  This file controls:
  - Fixed and random word-length selection.
  - Random target selection.
  - Separate guess and target word collections.
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

  Stage 17 uses two sets of JSON files:

  Guess dictionaries:
    data/words-4.json
    data/words-5.json
    data/words-6.json
    data/words-7.json

  Curated target dictionaries:
    data/targets-4.json
    data/targets-5.json
    data/targets-6.json
    data/targets-7.json

  Guess dictionaries determine which guesses are accepted.

  Target dictionaries determine which words can actually
  be selected as the answer.
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
  Capture the actual URL of this game.js file while the
  script is executing.

  This is deliberately done here rather than trying to
  reconstruct the script location later.

  On GitHub Pages, if game.js is:

    /consolidation_project/js/game.js

  then:

    ../data/words-5.json

  correctly resolves to:

    /consolidation_project/data/words-5.json
*/
const GAME_SCRIPT_URL =
  document.currentScript
    ? document.currentScript.src
    : new URL(
        "js/game.js",
        document.baseURI
      ).href;

/*
  Dictionary filenames.

  These paths are resolved relative to the actual
  game.js file URL above.
*/
const WORD_DATA_FILES = {
  4: "../data/words-4.json",
  5: "../data/words-5.json",
  6: "../data/words-6.json",
  7: "../data/words-7.json"
};

const TARGET_DATA_FILES = {
  4: "../data/targets-4.json",
  5: "../data/targets-5.json",
  6: "../data/targets-6.json",
  7: "../data/targets-7.json"
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

  These contain all words that the player is allowed
  to submit as guesses.
*/
const wordCollections = {
  4: new Set(),
  5: new Set(),
  6: new Set(),
  7: new Set()
};

/*
  Target dictionaries.

  These contain only the curated words that may be
  selected as answers.
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
    statusMessage.textContent =
      message;
  }
}

/* ------------------------------
   Randomness
   ------------------------------ */

/*
  Return a cryptographically stronger random integer.

  crypto.getRandomValues() is preferable to Math.random()
  for selecting the initial target because separate users
  loading the page at roughly the same time should not
  receive the same deterministic-looking sequence.

  Math.random() remains as a compatibility fallback.
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
    const randomValues =
      new Uint32Array(1);

    window.crypto.getRandomValues(
      randomValues
    );

    /*
      Rejection sampling avoids introducing a small
      modulo bias when the collection size does not
      divide evenly into the uint32 range.
    */
    const maximum =
      Math.floor(
        0x100000000 / length
      ) * length;

    let randomValue =
      randomValues[0];

    while (randomValue >= maximum) {
      window.crypto.getRandomValues(
        randomValues
      );

      randomValue =
        randomValues[0];
    }

    return randomValue % length;
  }

  return Math.floor(
    Math.random() * length
  );
}

/* ------------------------------
   Dictionary URL helpers
   ------------------------------ */

/*
  Build a JSON URL relative to the actual game.js file.

  This is the important Stage 16/17 loading fix.

  It does not depend on:
  - the current page URL
  - the GitHub Pages repository name
  - a hard-coded domain
  - the browser's current directory
*/
function getDataFileUrl(relativePath) {
  if (!GAME_SCRIPT_URL) {
    throw new Error(
      "Could not determine the location of game.js."
    );
  }

  return new URL(
    relativePath,
    GAME_SCRIPT_URL
  );
}

/* ------------------------------
   Dictionary loading
   ------------------------------ */

/*
  Load and validate one JSON word collection.

  The same loader is used for both:
  - the full guess dictionary
  - the curated target dictionary
*/
async function loadWordCollection(
  length,
  relativePath,
  collectionType
) {
  if (!relativePath) {
    throw new Error(
      `No ${collectionType} file configured for ${length}-letter words.`
    );
  }

  let fileUrl;

  try {
    fileUrl =
      getDataFileUrl(relativePath);
  } catch (error) {
    throw new Error(
      `Could not determine the URL for the ${collectionType} dictionary.`
    );
  }

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
  });

  if (words.size === 0) {
    throw new Error(
      `${fileUrl.pathname} loaded successfully but contained no valid ${length}-letter words.`
    );
  }

  return words;
}

/*
  Load all guess dictionaries and all target dictionaries.

  Each file is loaded separately so that any failure
  identifies the exact file involved.
*/
async function loadDictionaries() {
  showMessage(
    "Stage 17: Loading dictionaries…"
  );

  /*
    Load the general guess dictionaries.
  */
  for (
    const length of
      SUPPORTED_WORD_LENGTHS
  ) {
    try {
      const words =
        await loadWordCollection(
          length,
          WORD_DATA_FILES[length],
          "guess"
        );

      wordCollections[length] =
        words;

      console.log(
        `Loaded ${words.size} valid guess words for ${length}-letter games.`
      );
    } catch (error) {
      console.error(
        `Guess dictionary loading failed for ${length}-letter words:`,
        error
      );

      showMessage(
        `Dictionary error: ${error.message}`
      );

      dictionariesLoaded =
        false;

      return false;
    }
  }

  /*
    Load the curated target dictionaries.
  */
  for (
    const length of
      SUPPORTED_WORD_LENGTHS
  ) {
    try {
      const targets =
        await loadWordCollection(
          length,
          TARGET_DATA_FILES[length],
          "target"
        );

      targetCollections[length] =
        targets;

      console.log(
        `Loaded ${targets.size} curated target words for ${length}-letter games.`
      );
    } catch (error) {
      console.error(
        `Target dictionary loading failed for ${length}-letter words:`,
        error
      );

      showMessage(
        `Target dictionary error: ${error.message}`
      );

      dictionariesLoaded =
        false;

      return false;
    }
  }

  /*
    Final safety check:
    every target must also be an accepted guess.

    This prevents a target file from accidentally
    containing a word that the player could never
    submit successfully.
  */
  for (
    const length of
      SUPPORTED_WORD_LENGTHS
  ) {
    const guesses =
      wordCollections[length];

    const targets =
      targetCollections[length];

    const invalidTargets =
      Array.from(
        targets
      ).filter(
        (target) =>
          !guesses.has(target)
      );

    if (
      invalidTargets.length > 0
    ) {
      console.error(
        `Target validation failed for ${length}-letter words:`,
        invalidTargets
      );

      showMessage(
        `Target dictionary error: ${invalidTargets.length} target word(s) are missing from the guess dictionary.`
      );

      dictionariesLoaded =
        false;

      return false;
    }
  }

  dictionariesLoaded =
    true;

  console.log(
    "All Stage 17 guess and target dictionaries loaded successfully."
  );

  return true;
}

/* ------------------------------
   Word-length helpers
   ------------------------------ */

function isSupportedWordLength(
  length
) {
  return SUPPORTED_WORD_LENGTHS.includes(
    length
  );
}

function getWordLengthWords() {
  return (
    wordCollections[
      WORD_LENGTH
    ] ||
    new Set()
  );
}

function getTargetWords() {
  return (
    targetCollections[
      WORD_LENGTH
    ] ||
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
   Target-word helpers
   ------------------------------ */

function getRandomTargetWord() {
  const words =
    Array.from(
      getTargetWords()
    );

  if (
    words.length === 0
  ) {
    return "";
  }

  const randomIndex =
    getSecureRandomIndex(
      words.length
    );

  if (
    randomIndex < 0
  ) {
    return "";
  }

  return words[
    randomIndex
  ];
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
    return;
  }

  board.innerHTML = "";

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

function initialiseGame() {
  if (!dictionariesLoaded) {
    showMessage(
      "Dictionaries have not finished loading."
    );

    return;
  }

  /*
    Determine the word length for
    this game.
  */
  if (
    isRandomWordLengthSelected()
  ) {
    WORD_LENGTH =
      getRandomWordLength();
  } else {
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
    } else {
      WORD_LENGTH =
        DEFAULT_WORD_LENGTH;

      if (
        wordLengthSelect
      ) {
        wordLengthSelect.value =
          String(
            DEFAULT_WORD_LENGTH
          );
      }
    }
  }

  /*
    Stage 17:
    Select the target only from the
    curated target collection.
  */
  selectRandomTarget();

  /*
    Create the board only after the
    dictionaries and target are ready.
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
      .textContent = "";

    tiles[currentTile]
      .removeAttribute(
        "aria-label"
      );
  }
}

function handleLetter(
  letter
) {
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

function evaluateGuess(
  guess
) {
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

      remainingTargetLetters[
        index
      ] = null;
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

function endGame(
  won
) {
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

  if (
    newGameButton
  ) {
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
    Guesses are checked against the
    comprehensive guess dictionary,
    not the smaller target collection.
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
  if (
    !wordLengthSelect
  ) {
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

if (
  wordLengthSelect
) {
  wordLengthSelect.addEventListener(
    "change",
    handleWordLengthChange
  );
}

/* ------------------------------
   Shared actions
   ------------------------------ */

function handleAction(
  action
) {
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

if (
  newGameButton
) {
  newGameButton.addEventListener(
    "click",
    startNewGame
  );
}

/* ------------------------------
   Application startup
   ------------------------------ */

/*
  Stage 17 starts by loading all
  eight JSON collections.

  The board is not created until:
  1. all guess dictionaries load;
  2. all target dictionaries load;
  3. every target is also present
     in its corresponding guess dictionary.
*/
async function startApplication() {
  try {
    const loaded =
      await loadDictionaries();

    if (!loaded) {
      return;
    }

    initialiseGame();
  } catch (error) {
    console.error(
      "Stage 17 application startup failed:",
      error
    );

    showMessage(
      `Startup error: ${error.message}`
    );
  }
}

startApplication();
```
