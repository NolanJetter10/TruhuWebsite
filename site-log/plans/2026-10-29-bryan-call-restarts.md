# Bryan's call: stop the start-and-restart

Revised 2026-10-29 after Nolan's notes on the first draft, and approved for building ("get the plan aligned with these notes and then get a sonnet subagent to go implement"). The first draft is in the L-014 commit. Built the same day: see L-017 for what was measured, what was built and how it was checked. Still to do: Nolan's real call.

## What you're hearing

Bryan starts an ordinary answer, and partway through he cuts himself off and starts one of the fixed popup lines ("Great, I'll expand the calendar so you can pick.", "Sure, drop in the files here…").

## Why it happens

The agent's reply streams in as text, and the page has Bryan say each sentence as soon as it's written, so he starts talking quickly. The popup comes in the same reply as a widget, but only after whatever words the agent chose to write first. By the time the widget arrives, Bryan is already saying those words, so the page cuts him off and says the popup's fixed line instead.

The agent writes words before the widget often. In the L-009 tests the published agent wrote words next to the widget in 46 of 59 replies. A draft with tighter instructions brought that to 25 of 62, and that draft isn't published. The page can't tell from the words alone that a widget is coming: it only knows once the agent's block of text ends and the widget follows it.

## Two more in this round

- **Half a question counts as a whole one.** Anam ends the visitor's turn at a short pause, so "Can you show me… a flyer?" can arrive as two messages. Bryan starts answering "Can you show me", then the rest lands and he starts over.
- **Talking over him doesn't stop the rest of his answer** (a bug in the code, though not one you've noticed). The page forgets an answer as soon as the agent has finished writing it, usually before Bryan has finished saying it. When the visitor starts talking after that, there's nothing left to drop, and his next queued line goes out over them instead. Hanging up mid-answer has the same gap: a queued line is still sent after End call, and Anam answers 401.

## Not in this round

- **Bryan cutting off his own lines** (cause 1 in the first draft). You're not hearing it, so it stays as it is.
- **Noise and echo stopping him.** Only if it shows up.
- **The agent's instructions.** Once the page holds his words (step 2), what the agent writes before a widget is never heard. Tightening the instructions would still open popups a little sooner. That's for later: a draft, tested on dev, published only with your OK (the L-009 rule).

## The fix

### 1. Measure the replies (no call needed)

Through the dev server's Ensemble pass-through, in spoken mode with widgets on, send about 20 popup asks and 10 ordinary questions, each on a fresh thread, and record every event in each reply with its time:

- when the first words arrive
- when each block of text ends, and what comes straight after it
- when the widget arrives

This shows how long the words before a widget run and what holding them would cost. It's the same route the L-009 and L-010 intent tests used.

### 2. Hold Bryan's first words when the question might open a popup

A short list of words drawn from the six popups goes in `flows.ts`: book, schedule, calendar, a time or a call with Bryan, upload, documents, files, build, sample, example, show me, guide, flyer, microsite, website, flipbook. A question counts as a possible popup ask when it uses one of these words, or when it's a short reply of up to four words ("yes", "sure, let's do it"), since a yes to Bryan's offer to book is one of the agent's popup triggers.

For those questions the page holds Bryan's speech until the agent's first block of text ends and the page can see what comes next:

- **A widget:** the held words are dropped and Bryan says only the popup's fixed line. Nothing restarts, because he never started.
- **Anything else:** he says the held words at once and the rest streams as it does now. That includes the reply ending, or a knowledge-base lookup ("Let me check what we have on that.").

Every other question streams exactly as today, with no added wait. The cost falls on popup-sounding questions that turn out not to be popup asks ("how does booking work?"): Bryan's first word waits for the agent's first block of text, and step 1 measures how long that is. If the measurements show first blocks can run long, the hold gets a ceiling picked from the data, and the log says what that trades away.

A widget that arrives later in a reply, after the hold has let go (say after a lookup), still cuts in as it does now. That's rarer, and step 1 shows how rare.

### 3. Join half a question to the rest

If a new visitor message arrives before Bryan has said a word of his answer, the page asks the agent again with both pieces as one question, and nothing audible restarts. Step 2 lengthens that window for popup questions, which is where a split question hurts most.

Anam's `endOfSpeechSensitivity` (0 to 1, how quickly it decides the visitor has finished) changes only if a scripted test shows a mid-sentence pause splitting the turn and the setting fixes it without making every turn slower. For that test, Chrome can use a WAV file as the microphone, and Windows' built-in voice makes the file: "Can you show me" with a pause, then "a flyer?".

### 4. Talking over him and hanging up stop the rest of his answer

The "Talk to the real Bryan" button already added a counter that ends Bryan's current answer whether or not the agent is still writing it. The visitor starting to speak and the call ending bump the same counter, so everything still queued is dropped, not sent.

## Done means

- In scripted calls (the dev hook `window.__bryanAsk`), every popup ask from step 1 has Bryan say only the fixed line, never the agent's words first.
- Ordinary questions get Bryan's first word as fast as before, measured before and after.
- The split-question WAV gets one answer, not two.
- Talking over him stops his queued lines, and hanging up mid-answer leaves no 401 in `.dev-server.log`.
- Then you make one real call.

## Files

- `components/get-started/BryanCall.tsx`: `answer()` (the hold, the join) and the speech-start and hang-up handling
- `components/get-started/flows.ts`: the popup word list
