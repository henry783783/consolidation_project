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

  Guess dictionaries:
    data/words-4.json
    data/words-5.json
    data/words-6.json
    data/words-7.json

  Target dictionaries:
    data/targets-4.json
    data/targets-5.json
    data/targets-6.json
    data/targets-7.json

  Stage 17:
  - Any valid word in words-*.json may be submitted as a guess.
  - Only words in targets-*.json may be selected as targets.
*/

"use strict";

/* =========================================================
   Game constants
   ========================================================= */

const SUPPORTED_WORD_LENGTHS = [
  4,
  5,
  6,
  7
];

const DEFAULT_WORD_LENGTH = 5;
const RANDOM_WORD_LENGTH = "random";
const MAX_GUESSES = 6;

/* =========================================================
   DOM elements
   ========================================================= */

/*
  These are deliberately assigned inside startApplication()
  rather than immediately when the script is parsed.

  This makes the game safe whether game.js is loaded:
  - in <head>
  - at the end of <body>
  - with defer
  - or without defer
*/

let board = null;
let statusMessage = null;
let newGameButton = null;
let wordLengthSelect = null;

/* =========================================================
   Game state
   ========================================================= */

let WORD_LENGTH =
  DEFAULT_WORD_LENGTH;

let targetWord = "";

let rows = [];
let currentRow = 0;
let currentTile = 0;
let gameOver = false;

/* =========================================================
   Dictionary state
   ========================================================= */

/*
  General guess dictionaries.
*/
const wordCollections = {
  4: new Set(),
  5: new Set(),
  6: new Set(),
  7: new Set()
};

/*
  Curated target dictionaries.
*/
const targetCollections = {
  4: new Set(),
  5: new Set(),
  6: new Set(),
  7: new Set()
};

let dictionariesLoaded = false;

/* =========================================================
   Dictionary filenames
   ========================================================= */

const WORD_DATA_FILES = {
  4: "words-4.json",
  5: "words-5.json",
  6: "words-6.json",
  7: "words-7.json"
};

const TARGET_DATA_FILES = {
  4: "targets-4.json",
  5: "targets-5.json",
  6: "targets-6.json",
  7: "targets-7.json"
};

/* =========================================================
   Status helpers
   ========================================================= */

function showMessage(message) {
  if (statusMessage) {
    statusMessage.textContent =
      message;
  }

  console.log(
    `[Wordle] ${message}`
  );
}

/* =========================================================
   Randomness
   ========================================================= */

/*
  Return a random integer from 0 up to length - 1.

  crypto.getRandomValues() is used when available.

  This avoids relying exclusively on Math.random()
  when selecting target words for newly loaded games.
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

    const maximum =
      Math.floor(
        0x100000000 / length
      ) * length;

    do {
      window.crypto.getRandomValues(
        randomValues
      );
    } while (
      randomValues[0] >= maximum
    );

    return (
      randomValues[0] % length
    );
  }

  return Math.floor(
    Math.random() * length
  );
}

/* =========================================================
   URL helpers
   ========================================================= */

/*
  Resolve a data filename from the current page URL.

  Your GitHub Pages page is effectively:

    /consolidation_project/

  Therefore:

    data/words-5.json

  becomes:

    /consolidation_project/data/words-5.json

  We deliberately use document.baseURI here rather than
  trying to infer the location of game.js.
*/
function getDataFileUrl(filename) {
  return new URL(
    `data/${filename}`,
    document.baseURI
  );
}

/* =========================================================
   Board creation
   ========================================================= */

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
    `Board created: ${MAX_GUESSES} rows × ${WORD_LENGTH} tiles.`
  );
}

/* =========================================================
   Dictionary loading
   ========================================================= */

/*
  Load one JSON file.

  The function gives very explicit diagnostics so that
  future loading problems can be identified immediately.
*/
async function loadWordCollection(
  length,
  filename,
  collectionType
) {
  const fileUrl =
    getDataFileUrl(
      filename
    );

  console.log(
    `Loading ${collectionType} dictionary:`,
    fileUrl.href
  );

  let response;

  try {
    response =
      await fetch(
        fileUrl.href,
        {
          cache: "no-store"
        }
      );
  } catch (error) {
    throw new Error(
      `Network error loading ${fileUrl.href}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} while loading ${fileUrl.href}`
    );
  }

  let data;

  try {
    data =
      await response.json();
  } catch (error) {
    throw new Error(
      `${fileUrl.href} did not contain valid JSON.`
    );
  }

  if (!Array.isArray(data)) {
    throw new Error(
      `${fileUrl.href} must contain a JSON array.`
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

  if (
    words.size === 0
  ) {
    throw new Error(
      `${fileUrl.href} loaded but contained no valid ${length}-letter words.`
    );
  }

  console.log(
    `Loaded ${words.size} ${collectionType} words from ${fileUrl.href}`
  );

  return words;
}

/*
  Load all eight JSON files.

  Four are general guess dictionaries.
  Four are curated target dictionaries.
*/
async function loadDictionaries() {
  showMessage(
    "Stage 17: Loading dictionaries…"
  );

  /*
    -------------------------------
    Load guess dictionaries
    -------------------------------
  */

  for (
    const length of
      SUPPORTED_WORD_LENGTHS
  ) {
    const filename =
      WORD_DATA_FILES[
        length
      ];

    try {
      const words =
        await loadWordCollection(
          length,
          filename,
          "guess"
        );

      wordCollections[
        length
      ] = words;
    } catch (error) {
      console.error(
        `Guess dictionary failed for ${length}-letter words:`,
        error
      );

      showMessage(
        `Guess dictionary error: ${error.message}`
      );

      dictionariesLoaded =
        false;

      return false;
    }
  }

  /*
    -------------------------------
    Load target dictionaries
    -------------------------------
  */

  for (
    const length of
      SUPPORTED_WORD_LENGTHS
  ) {
    const filename =
      TARGET_DATA_FILES[
        length
      ];

    try {
      const targets =
        await loadWordCollection(
          length,
          filename,
          "target"
        );

      targetCollections[
        length
      ] = targets;
    } catch (error) {
      console.error(
        `Target dictionary failed for ${length}-letter words:`,
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
    -------------------------------
    Validate target membership
    -------------------------------

    Every target should also exist
    in the corresponding guess list.

    Otherwise the game could select
    an answer that the player could
    never submit.
  */

  for (
    const length of
      SUPPORTED_WORD_LENGTHS
  ) {
    const guesses =
      wordCollections[
        length
      ];

    const targets =
      targetCollections[
        length
      ];

    const invalidTargets =
      Array.from(
        targets
      ).filter(
        (target) =>
          !guesses.has(
            target
          )
      );

    if (
      invalidTargets.length >
      0
    ) {
      console.error(
        `Invalid targets for ${length}-letter games:`,
        invalidTargets
      );

      showMessage(
        `Target dictionary error: ${invalidTargets.length} target word(s) are not in the guess dictionary.`
      );

      dictionariesLoaded =
        false;

      return false;
    }
  }

  dictionariesLoaded =
    true;

  console.log(
    "All Stage 17 dictionaries loaded successfully."
  );

  return true;
}

/* =========================================================
   Word-length helpers
   ========================================================= */

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
  const index =
    getSecureRandomIndex(
      SUPPORTED_WORD_LENGTHS.length
    );

  return (
    SUPPORTED_WORD_LENGTHS[
      index
    ]
  );
}

function isRandomWordLengthSelected() {
  return (
    wordLengthSelect &&
    wordLengthSelect.value ===
      RANDOM_WORD_LENGTH
  );
}

/* =========================================================
   Target selection
   ========================================================= */

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

/* =========================================================
   Instructions
   ========================================================= */

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

/* =========================================================
   Game initialisation
   ========================================================= */

function initialiseGame() {
  if (
    !dictionariesLoaded
  ) {
    showMessage(
      "Dictionaries have not finished loading."
    );

    return;
  }

  /*
    Determine word length.
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
    Select from curated targets.
  */

  selectRandomTarget();

  /*
    Build the board.
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

  if (
    newGameButton
  ) {
    newGameButton.hidden =
      true;
  }
}

/* =========================================================
   Board helpers
   ========================================================= */

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

/* =========================================================
   Letter input
   ========================================================= */

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
    addLetter(
      letter
    );
  }
}

/* =========================================================
   Guess evaluation
   ========================================================= */

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
    present but wrong position.
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

/* =========================================================
   Win/loss handling
   ========================================================= */

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

/* =========================================================
   Guess submission
   ========================================================= */

function submitGuess() {
  if (
    gameOver
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

  /*
    A guess only needs to exist in the
    general dictionary.
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
    endGame(
      true
    );

    return;
  }

  if (
    currentRow ===
    MAX_GUESSES - 1
  ) {
    endGame(
      false
    );

    return;
  }

  showMessage(
    "Guess evaluated"
  );

  currentRow += 1;
  currentTile = 0;
}

/* =========================================================
   New game
   ========================================================= */

function startNewGame() {
  initialiseGame();
}

/* =========================================================
   Word-length selection
   ========================================================= */

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

/* =========================================================
   Shared actions
   ========================================================= */

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

/* =========================================================
   Event handlers
   ========================================================= */

function setupEventListeners() {
  if (
    wordLengthSelect
  ) {
    wordLengthSelect.addEventListener(
      "change",
      handleWordLengthChange
    );
  }

  if (
    newGameButton
  ) {
    newGameButton.addEventListener(
      "click",
      startNewGame
    );
  }

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

/* =========================================================
   Application startup
   ========================================================= */

async function startApplication() {
  /*
    First obtain the DOM elements.

    This is now guaranteed to happen after
    DOMContentLoaded.
  */

  board =
    document.querySelector(
      ".board"
    );

  statusMessage =
    document.querySelector(
      ".stage-status"
    );

  newGameButton =
    document.querySelector(
      "#new-game"
    );

  wordLengthSelect =
    document.querySelector(
      "#word-length"
    );

  console.log(
    "Stage 17 application starting."
  );

  console.log(
    "Page URL:",
    document.baseURI
  );

  console.log(
    "Board element:",
    board
  );

  /*
    If the board itself cannot be found,
    report that explicitly.
  */

  if (!board) {
    console.error(
      "Could not find .board in the HTML."
    );

    showMessage(
      "Page error: .board element not found."
    );

    return;
  }

  /*
    Build an initial board immediately.

    This means dictionary loading can no
    longer cause a completely blank board.
  */

  createBoard();

  /*
    Wire up user interaction.
  */

  setupEventListeners();

  /*
    Load dictionaries.
  */

  const loaded =
    await loadDictionaries();

  if (!loaded) {
    /*
      The board remains visible so the
      exact dictionary error can be seen.
    */

    return;
  }

  /*
    Everything is ready.
  */

  initialiseGame();
}

/*
  Always wait for the document to be ready.

  This protects the game regardless of
  where the script tag appears in index.html.
*/
if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    startApplication,
    {
      once: true
    }
  );
} else {
  startApplication();
}
```
