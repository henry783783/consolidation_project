Stage 3 Test checklist:

 The page loads normally with no 404.
 The six-by-five board still looks the same as Stage 2.
 Press a letter key, such as W; W appears in the first tile.
 Press four more letters; they appear in the remaining four tiles.
 Press another letter after five letters have been entered; nothing changes.
 Press Backspace; the fifth letter disappears.
 Press Backspace repeatedly; letters disappear one at a time until the row is empty.
 Type lowercase letters; they appear as uppercase.
 Press Enter with letters entered; nothing is submitted and the row does not change. This is intentional.
 Press arrow keys, Tab, Escape, Shift, etc.; they do not enter characters.
 After filling the first row, typing additional letters does not start row 2. This is intentional until submission/validation is implemented.
 The other five rows remain empty.
 The page remains usable at a narrow/mobile width.
 The status text says “Stage 3 — Keyboard input ready”.

===============================

Stage 4 Test checklist:

 The existing six-by-five board still appears correctly.
 A three-row on-screen keyboard appears underneath the board.
 The keyboard contains all 26 letters.
 An Enter button and Backspace (←) button are visible.
 Click/tap a letter such as T; T appears in the first board tile.
 Click/tap four more letters; they fill the first row.
 Click another letter after five letters; nothing changes.
 Click Backspace; the last letter disappears.
 Click Backspace repeatedly; letters disappear one at a time.
 Type using the physical keyboard; letters still appear exactly as in Stage 3.
 Mix physical and on-screen keyboard input; both methods update the same row correctly.
 Click Enter; nothing is submitted and the row does not advance. This is intentional.
 Resize to a narrow/mobile browser width; the keyboard remains within the page without horizontal scrolling.
 Keyboard buttons show a visible response when clicked/tapped.
 The status reads “Stage 4 — On-screen keyboard ready”.
 No additional JavaScript or CSS files have been introduced.

=============================================

Stage 5 Test checklist:

 The board and on-screen keyboard still appear.
 Enter fewer than five letters, then press physical Enter. The message says “Not enough letters” and the player remains on row 1.
 Clear the row with Backspace.
 Enter five letters that are not in the supplied list, for example XXXXX, then press Enter. The message says “Word not in list” and the player remains on row 1.
 Clear the row.
 Enter a valid five-letter word such as HOUSE, then press Enter. The message says “Guess accepted” and the next row becomes active.
 Verify the accepted guess remains visible in row 1.
 Enter another valid word in row 2 and press Enter. It should remain in row 2 and activate row 3.
 Repeat with a mixture of physical keyboard and on-screen keyboard input.
 Click the on-screen Enter button and confirm it performs the same validation/submission as physical Enter.
 Confirm an invalid guess does not advance the row.
 Confirm a valid guess does advance the row.
 Enter the target word CRANE. It should currently be accepted as a valid guess and advance to the next row. Do not expect a win message yet; target-word evaluation is Stage 6/7 work.
 Confirm the board remains usable on mobile.
 Confirm there is no need for a server, build process, or external dictionary.

==================================


Test checklist:

 Enter CRANE using the physical keyboard and press Enter. All five tiles should become green.
 Reload the page.
 Enter HOUSE and press Enter. H should be grey/absent, O should be yellow/present, and the remaining letters should be grey/absent.
 Reload the page.
 Enter CROWN and press Enter. C should be green, R should be green, O should be yellow, and W and N should be grey.
 Reload the page.
 Enter ABOUT and press Enter. A should be yellow/present, while letters not occurring in CRANE should be grey/absent.
 Confirm that an evaluated row keeps its letters after evaluation.
 Confirm that the next row becomes available after a valid guess.
 Submit several valid guesses and confirm each row is evaluated independently.
 Test with both the physical keyboard and the on-screen keyboard.
 Confirm an invalid word still says “Word not in list” and receives no colour evaluation.
 Confirm an incomplete guess still says “Not enough letters”.
 Confirm a sixth letter cannot be entered.
 Confirm Backspace still works before submission.
 Confirm the three evaluation colours are visually distinguishable.
 Confirm the layout remains usable on a narrow/mobile screen.
 Duplicate-letter check: use CROSS as a valid guess. Because CRANE contains only one R, only one of the two R tiles should receive a positive match; the other should be grey/absent. This specifically checks that duplicate letters are handled correctly.
 Confirm that reaching six evaluated guesses does not yet display a loss message. This is intentional and belongs to Stage 7.

===================================

Stage 10 Test checklist:

 The page loads without a JavaScript error or broken layout.
 The board displays six rows of five tiles, exactly as before.
 The heading still says Wordle.
 The instructions still say “Guess the five-letter word in six tries.”
 The on-screen keyboard appears and clicking its letters puts letters into the board.
 Physical keyboard letters still work.
 Backspace works.
 Enter with fewer than five letters still says “Not enough letters”.
 A valid five-letter guess is evaluated correctly.
 CRANE still produces the expected win.
 After winning, New Game appears.
 Clicking New Game clears the board and hides the button again.
 The board remains correctly aligned on a desktop browser.
 The board remains correctly aligned on a mobile/narrow browser.
 The status at the bottom says “Stage 10: Dynamic word-length foundation”.

=====================================

Stage 13 test checklist

Please test these specifically:

 Page still initially opens in 5-letter mode.
 4-letter mode still works.
 5-letter mode still works.
 6-letter mode still works.
 7-letter mode still works.
 A Random option is visible in the word-length selector.
 Selecting Random starts a fresh game.
 The resulting board has 4, 5, 6 or 7 tiles per row.
 The instructions clearly state the actual selected length.
 The stage/status message clearly states the actual selected length.
 The selected Random option remains displayed in the selector after the random length is chosen.
 A valid guess can be entered and submitted in Random mode.
 An invalid/incomplete guess is still handled correctly in Random mode.
 If the game ends in Random mode, New Game appears.
 Clicking New Game while Random is selected starts a fresh game.
 New Game in Random mode can select any supported length.
 New Game in a fixed-length mode keeps that fixed length.
 Switching from Random to a fixed length starts a fresh game at that fixed length.
 Switching from a fixed length to Random starts a fresh randomly sized game.
 No existing evaluation, win/loss, keyboard or accessibility behaviour has regressed.
 No files other than index.html, js/game.js and context/STAGE_PLAN.md were changed.

====================================

