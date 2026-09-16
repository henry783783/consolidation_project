```javascript
/*
  Wordle-style game
  Stage 16: Expanded dictionary

  This file controls:
  - Fixed and random word-length selection.
  - Random target selection.
  - Loading the expanded word dictionaries.
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

  Dictionary data is stored separately in:
  - data/words-4.json
  - data/words-5.json
  - data/words-6.json
  - data/words-7.json

  Stage 17 will validate and curate the expanded dictionary data.
*/

"use strict";

/* ------------------------------
   Game constants
   ------------------------------ */

const SUPPORTED_WORD_LENGTHS = [4, 5, 6, 7];
const DEFAULT_WORD_LENGTH = 5;
const RANDOM_WORD_LENGTH = "random";
const MAX_GUESSES = 6;

const WORD_DATA_PATHS = {
  4: "data/words-4.json",
  5: "data/words-5.json",
  6: "data/words-6.json",
  7: "data/words-7.json"
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

let dictionaries = {};
let dictionariesLoaded = false;
let dictionaryLoadFailed = false;

/* ------------------------------
   Word-length helpers
   ------------------------------ */

function isSupportedWordLength(length) {
  return SUPPORTED_WORD_LENGTHS.includes(length);
}

function getWordLengthWords() {
  return dictionaries[WORD_LENGTH] || new Set();
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
   Status messages
   ------------------------------ */

function showMessage(message) {
  if (statusMessage) {
    statusMessage.textContent = message;
  }
}

/* ------------------------------
   Dictionary loading
   ------------------------------ */

function normaliseDictionaryWords(words) {
  if (!Array.isArray(words)) {
    return [];
  }

  return words
    .filter(
      (word) =>
        typeof word === "string"
    )
    .map((word) =>
      word.trim().toUpperCase()
    )
    .filter((word) =>
      /^[A-Z]+$/.test(word)
    );
}

async function loadDictionary(length) {
  const path =
    WORD_DATA_PATHS[length];

  if (!path) {
    throw new Error(
      `No dictionary path configured for ${length} letters.`
    );
  }

  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(
      `Unable to load ${path}: ${response.status} ${response.statusText}`
    );
  }

  const data =
    await response.json();

  const words =
    normaliseDictionaryWords(data);

  const correctlySizedWords =
    words.filter(
      (word) =>
        word.length === length
    );

  if (
    correctlySizedWords.length === 0
  ) {
    throw new Error(
      `Dictionary ${path} contains no valid ${length}-letter words.`
    );
  }

  return new Set(
    correctlySizedWords
  );
}

async function loadDictionaries() {
  const results =
    await Promise.all(
      SUPPORTED_WORD_LENGTHS.map(
        async (length) => {
          const dictionary =
            await loadDictionary(length);

          return [
            length,
            dictionary
          ];
        }
      )
    );

  dictionaries =
    Object.fromEntries(results);

  dictionariesLoaded = true;
}

function handleDictionaryLoadFailure(
  error
) {
  console.error(
    "Stage 16 dictionary loading failed:",
    error
  );

  dictionaryLoadFailed = true;

  showMessage(
    "Unable to load the word dictionary. Please reload the page."
  );

  if (wordLengthSelect) {
    wordLengthSelect.disabled = true;
  }

  if (newGameButton) {
    newGameButton.disabled = true;
  }
}

/* ------------------------------
   Target-word helpers
   ------------------------------ */

function getRandomTargetWord() {
  const words =
    Array.from(
      getWordLengthWords()
    );

  if (words.length === 0) {
    return "";
  }

  const randomIndex =
    Math.floor(
      Math.random() *
        words.length
    );

  return words[randomIndex];
}

function selectRandomTarget() {
  targetWord =
    getRandomTargetWord();
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
        document.createElement(
          "div"
        );

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
      board.querySelectorAll(
        ".row"
      )
    );
}

/* ------------------------------
   Game initialisation
   ------------------------------ */

function initialiseGame() {
  if (
    !dictionariesLoaded ||
    dictionaryLoadFailed
  ) {
    return;
  }

  /*
    Random mode selects a new supported
    length whenever a new game begins.
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
    Every new game gets a new
    random target from the selected
    length's dictionary.
  */
  selectRandomTarget();

  if (!targetWord) {
    showMessage(
      `No playable ${WORD_LENGTH}-letter words are available.`
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

  if (tiles[currentTile]) {
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

      remainingTargetLetters[
        index
      ] = null;
    }
  }

  /*
    Second pass:
    wrong-position matches.
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
      remainingTargetLetters
        .indexOf(
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
  if (!rows[rowIndex]) {
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
  if (
    gameOver ||
    !dictionariesLoaded ||
    dictionaryLoadFailed
  ) {
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
  if (
    !dictionariesLoaded ||
    dictionaryLoadFailed
  ) {
    return;
  }

  initialiseGame();
}

/* ------------------------------
   Word-length selection
   ------------------------------ */

function handleWordLengthChange() {
  if (
    !wordLengthSelect ||
    !dictionariesLoaded ||
    dictionaryLoadFailed
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
    Number(selectedValue);

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

async function startApplication() {
  showMessage(
    "Loading word dictionary…"
  );

  if (wordLengthSelect) {
    wordLengthSelect.disabled =
      true;
  }

  try {
    await loadDictionaries();

    if (wordLengthSelect) {
      wordLengthSelect.disabled =
        false;
    }

    initialiseGame();
  } catch (error) {
    handleDictionaryLoadFailure(
      error
    );
  }
}

startApplication();
```
