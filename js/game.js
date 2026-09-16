/*
Wordle-style game
Stage 17: Dictionary validation and target-word data

This file controls:

* Fixed and random word-length selection.
* Random target selection.
* Loading word and target JSON data.
* Dictionary and target-data validation.
* Dynamic board creation.
* Physical keyboard input.
* On-screen keyboard input.
* Backspace.
* Guess validation.
* Wordle-style letter evaluation.
* Accessible descriptions for evaluated tiles.
* Win/loss detection.
* New-game/reset behaviour.

Supported lengths:
4, 5, 6 and 7 letters.

Stage 17 data model:

* words-X.json contains acceptable guesses.
* targets-X.json contains possible target words.

A target must also exist in the corresponding guess dictionary.
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
JSON data files.

Relative paths are used so the application continues to work
correctly when hosted from the repository's GitHub Pages path.
*/
const DATA_DIRECTORY = "data";

const wordFilePaths = {
4: `${DATA_DIRECTORY}/words-4.json`,
5: `${DATA_DIRECTORY}/words-5.json`,
6: `${DATA_DIRECTORY}/words-6.json`,
7: `${DATA_DIRECTORY}/words-7.json`
};

const targetFilePaths = {
4: `${DATA_DIRECTORY}/targets-4.json`,
5: `${DATA_DIRECTORY}/targets-5.json`,
6: `${DATA_DIRECTORY}/targets-6.json`,
7: `${DATA_DIRECTORY}/targets-7.json`
};

/*
Stage 17 target-pool requirements.
*/
const TARGET_COUNTS = {
4: 300,
5: 1000,
6: 750,
7: 600
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

let wordCollections = {};
let targetCollections = {};

let dictionariesLoaded = false;
let dataLoadError = false;

/* ------------------------------
Data validation helpers
------------------------------ */

/*
Convert loaded JSON data into a Set after validating its
basic structure.

The expected JSON format is:

[
"WORD",
"WORD",
"WORD"
]
*/
function validateWordCollection(
data,
expectedLength,
collectionName
) {
if (!Array.isArray(data)) {
throw new Error(
`${collectionName} must contain a JSON array.`
);
}

const words = data.map((word) => {
if (typeof word !== "string") {
throw new Error(
`${collectionName} contains a non-string entry.`
);
}

```
return word.trim().toUpperCase();
```

});

for (const word of words) {
if (word.length !== expectedLength) {
throw new Error(
`${collectionName} contains "${word}" with the wrong length.`
);
}

```
if (!/^[A-Z]+$/.test(word)) {
  throw new Error(
    `${collectionName} contains invalid word "${word}".`
  );
}
```

}

const uniqueWords = new Set(words);

if (uniqueWords.size !== words.length) {
throw new Error(
`${collectionName} contains duplicate words.`
);
}

return uniqueWords;
}

/*
Validate a target collection against the corresponding
guess dictionary.

Every possible answer must be a valid guess.
*/
function validateTargetCollection(
targets,
words,
expectedLength,
collectionName
) {
if (targets.size !== TARGET_COUNTS[expectedLength]) {
throw new Error(
`${collectionName} contains ${targets.size} words; ` +
`expected ${TARGET_COUNTS[expectedLength]}.`
);
}

for (const target of targets) {
if (!words.has(target)) {
throw new Error(
`${collectionName} contains "${target}" ` +
"which is missing from its guess dictionary."
);
}
}
}

/* ------------------------------
Data loading
------------------------------ */

async function loadJsonFile(path) {
const response = await fetch(path, {
cache: "no-store"
});

if (!response.ok) {
throw new Error(
`Unable to load ${path}: HTTP ${response.status}.`
);
}

return response.json();
}

async function loadGameData() {
const loadedWords = {};
const loadedTargets = {};

for (const length of SUPPORTED_WORD_LENGTHS) {
const wordsData =
await loadJsonFile(wordFilePaths[length]);

```
const targetsData =
  await loadJsonFile(targetFilePaths[length]);

const words =
  validateWordCollection(
    wordsData,
    length,
    `words-${length}.json`
  );

const targets =
  validateWordCollection(
    targetsData,
    length,
    `targets-${length}.json`
  );

validateTargetCollection(
  targets,
  words,
  length,
  `targets-${length}.json`
);

loadedWords[length] = words;
loadedTargets[length] = targets;
```

}

wordCollections = loadedWords;
targetCollections = loadedTargets;

dictionariesLoaded = true;
}

/* ------------------------------
Word-length helpers
------------------------------ */

function isSupportedWordLength(length) {
return SUPPORTED_WORD_LENGTHS.includes(length);
}

function getWordLengthWords() {
return wordCollections[WORD_LENGTH] || new Set();
}

function getWordLengthTargets() {
return targetCollections[WORD_LENGTH] || new Set();
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
const targets =
Array.from(getWordLengthTargets());

if (targets.length === 0) {
throw new Error(
`No target words are available for ${WORD_LENGTH} letters.`
);
}

const randomIndex = Math.floor(
Math.random() * targets.length
);

return targets[randomIndex];
}

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

```
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
```

}

rows = Array.from(
board.querySelectorAll(".row")
);
}

/* ------------------------------
Game initialisation
------------------------------ */

function initialiseGame() {
if (!dictionariesLoaded) {
return;
}

/*
Random mode selects a supported length for every new game.
*/
if (isRandomWordLengthSelected()) {
WORD_LENGTH = getRandomWordLength();
} else {
const selectedLength =
Number(wordLengthSelect.value);

```
if (isSupportedWordLength(selectedLength)) {
  WORD_LENGTH = selectedLength;
} else {
  WORD_LENGTH = DEFAULT_WORD_LENGTH;

  if (wordLengthSelect) {
    wordLengthSelect.value =
      String(DEFAULT_WORD_LENGTH);
  }
}
```

}

/*
Select a target only from the curated target collection
for the selected length.
*/
selectRandomTarget();

createBoard();
updateInstructions();

currentRow = 0;
currentTile = 0;
gameOver = false;

if (isRandomWordLengthSelected()) {
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
Data-loading initialisation
------------------------------ */

async function startApplication() {
try {
showMessage("Loading word data…");

```
await loadGameData();

startInitialGame();
```

} catch (error) {
dataLoadError = true;

```
console.error(
  "Stage 17 data-loading error:",
  error
);

showMessage(
  "Unable to load the game's word data."
);

if (board) {
  board.innerHTML = "";
}

if (newGameButton) {
  newGameButton.hidden = true;
}
```

}
}

function startInitialGame() {
initialiseGame();
}

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
dataLoadError ||
!dictionariesLoaded ||
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
dataLoadError ||
!dictionariesLoaded ||
gameOver ||
currentTile <= 0
) {
return;
}

currentTile -= 1;

const tiles = getCurrentRowTiles();

if (tiles[currentTile]) {
tiles[currentTile].textContent = "";

```
tiles[currentTile]
  .setAttribute(
    "aria-label",
    `Guess ${currentRow + 1}, position ${currentTile + 1}: empty`
  );
```

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

```
  remainingTargetLetters[index] =
    null;
}
```

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

```
const matchingIndex =
  remainingTargetLetters.indexOf(
    guess[index]
  );

if (matchingIndex !== -1) {
  results[index] = "present";

  remainingTargetLetters[matchingIndex] =
    null;
}
```

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

```
const letter =
  tiles[index].textContent.trim();

tiles[index].classList.add(result);

tiles[index].setAttribute(
  "aria-label",
  `Guess ${rowIndex + 1}, position ${index + 1}: ${letter}, ${getResultDescription(result)}`
);
```

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
if (
dataLoadError ||
!dictionariesLoaded ||
gameOver
) {
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
if (
dataLoadError ||
!dictionariesLoaded
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
dataLoadError ||
!dictionariesLoaded
) {
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

```
WORD_LENGTH = DEFAULT_WORD_LENGTH;
```

} else {
WORD_LENGTH = selectedLength;
}

/*
Changing word length starts a fresh game.
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

```
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
```

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

```
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
```

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
Start application
------------------------------ */

startApplication();
