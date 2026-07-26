# VoiceOver acceptance

This is the final manual accessibility check. The automated gates verify the tree that a
screen reader receives; they cannot prove the resulting speech is understandable or that
a lesson is tolerable to finish by ear.

Do not mark this checklist as passed from an automated browser run.

## Test setup

- Use current macOS, Safari, and VoiceOver. Record their exact versions, the voice, and
  whether Quick Nav is enabled.
- Use the production site and a fresh Safari profile or clear the site's local storage
  before the first-visit checks.
- Keep the display available for note-taking, but perform the journey from the keyboard
  and VoiceOver speech rather than by visually locating controls.

## Journey

- Open the homepage. Use the rotor to list landmarks and headings. Confirm there is one
  clear main landmark, one page heading, and useful section headings in a sensible order.
- Open `/learn/ai-python/embeddings` as a first-time visitor. Confirm the interface tour
  is announced as a dialog, focus starts inside it, Tab and Shift+Tab stay inside, and
  Escape dismisses it.
- Navigate the lesson by heading. Confirm theory, examples, challenges, cheatsheet, and
  tool sections are understandable without reading surrounding visual layout.
- Open Challenges from the keyboard. Enter the editor and confirm VoiceOver announces
  the instruction for leaving it. Verify Escape then Tab moves forward out and Escape
  then Shift+Tab moves backward out.
- Run `print("voiceover result")` with Control+Enter. Confirm loading/running state and
  the result are announced once, in a useful order, without moving focus unexpectedly.
- Run `print(undefined_voiceover_name)`. Confirm the error and `NameError` are announced
  and can be reviewed without VoiceOver reading the entire page again.
- Open the AI tutor. Confirm its name and dialog role are announced, focus stays inside,
  Escape closes it, and focus returns to the opener.
- Complete one challenge and confirm success is conveyed in speech rather than only by
  color. Continue to the next lesson using only keyboard and VoiceOver.
- Open `/projects/ai-doc-assistant`. Reach and leave its editor in both directions, run a
  step, review the output, and confirm project progress is announced.

## Pass criteria and report

Pass only if the lesson and project journeys can be completed without guessing from
visual position, encountering silent state changes, or losing focus.

Record:

- Date, production URL, deployment commit, macOS/Safari/VoiceOver versions, and voice.
- Pass or fail for each journey item.
- The exact spoken phrase and focused control for every failure.
- Whether the issue blocks completion or is confusing but recoverable.
- A short overall judgment: whether finishing a lesson by ear is practical.
