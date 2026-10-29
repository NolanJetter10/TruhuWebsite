# Bryan's call: stop the start-and-restart

Proposed 2026-10-29 by Claude Code, waiting on Nolan's OK. Nothing in this plan has been built yet.

## In short

The code shows five ways Bryan can start an answer and then cut himself off for another one. One of them is a confirmed bug with a two-line fix (step 0). For the other four we don't yet know which one you're hearing most, so step 1 records a timeline of a few real calls, and the fixes after that go in order of what it shows. The two I'm most sure of:

- Send each answer to Anam as one queued stream, so his sentences stop cutting each other off (step 2).
- Stop treating every sound or half-sentence from the visitor as a new question (step 3).

## How a call works today

Each time Anam hears the visitor finish speaking, the page sends their words to the Ensemble agent, and Bryan says the reply a sentence at a time as it streams in (`components/get-started/BryanCall.tsx`). Three things cut him off:

- **The visitor starts speaking.** Anam's `USER_SPEECH_STARTED` makes the page drop the rest of the answer.
- **A new visitor message arrives.** `MESSAGE_HISTORY_UPDATED` makes the page drop the current answer and ask the agent again with the new words.
- **His next line is ready.** Each line goes out as an Anam `talk()` command, and a new one cuts off whatever is playing. So the page waits for Anam's "end of speech" before sending the next line, with a timer as a backstop.

## The confirmed cause

0. **Talking over him makes him talk faster, not stop.** The page forgets the current answer as soon as the agent has finished writing it, which is usually well before Bryan has finished saying it. When the visitor starts speaking after that point, there's no answer left to drop. Instead, the code that waits for each line to finish lets go at once, so his next queued line goes out right over the visitor. Then their words arrive and he cuts off again for a new answer. What you'd hear: he talks over you, then stops and starts something else. This is in the code as it stands (`answer()` clears `turnRef` in its `finally`; `USER_SPEECH_STARTED` aborts `turnRef.current`, by then null, and releases the waiters). The button agent found it today.

## Likely causes, most likely first

1. **He cuts himself off.** While his first sentence plays, the rest of the answer piles up and goes out as one `talk()`. If Anam reports "end of speech" per sentence rather than per command, the page reads the end of that batch's first sentence as the end of the whole batch and sends the next line, which cuts off the rest. The backstop timer (2 s plus 0.45 s a word) does the same when his speech starts late. What you'd hear: he stops mid-answer and jumps ahead.
2. **Half a sentence counts as a whole question.** Anam ends the visitor's turn at a short pause, so "Can you show me… a flyer?" can arrive as two messages. Bryan starts answering "Can you show me", then the rest lands and he starts over with a different answer. What you'd hear: exactly a start and a restart.
3. **Noise and echo count as speech.** A cough, a keyboard, or Bryan's own voice coming out of laptop speakers into the mic can register as the visitor speaking, which stops him. It can even be transcribed as a short message ("Okay.") that sends him into a new answer. Anam's engine also stops him by itself when it hears a voice.
4. **Popup lines cut off the agent's preamble.** When the agent writes "Let me get that upload box open for you." before opening a popup, Bryan starts saying it, then the page cuts him off for the popup's fixed line. In the L-009 tests the published agent wrote words next to the widget in 46 of 59 replies; a draft with tighter instructions brought that to 25 of 62, and that draft isn't published.

One more to check in step 1: the page answers only the last piece of the visitor's turn (`messages.at(-1)`). If Anam delivers one turn in several pieces, Bryan answers a fragment of what was said.

## The plan

### Step 0. Fix the confirmed bug now (cause 0)

The "Talk to the real Bryan" button already added a counter that the page bumps to stop the rest of Bryan's current answer, whether or not the agent is still writing. When the visitor starts speaking, the page bumps the same counter, so everything still queued is dropped instead of sent. Hanging up bumps it too: the call-mode agent saw a queued line still sent after End call (Anam answered 401). A few lines in `BryanCall.tsx`, checked with a scripted call that talks over him and one that hangs up mid-answer. Step 3 later refines *when* speech should stop him; this step makes sure that when it does, he actually stops.

### Step 1. Record what happens in real calls (dev server only)

A call trace with a timestamp on every event: what Anam heard (each visitor message, its id and text), when the visitor started and stopped speaking, each line sent to Anam, each utterance Bryan started, finished or had cut off, and every time the page dropped an answer and why. It's written to `.call-trace.log` in the repo (git-ignored) through a route that exists only on the dev server, so I can read it as soon as you hang up. Production never sees it.

Then you make three short calls on http://localhost:3000/BryanKleppe, about five minutes in all:

- with headphones, talking normally, natural pauses included
- on laptop speakers
- talking over him on purpose

The trace says which of the four causes are real and how often each happens.

Alongside it, a scripted visitor. Chrome can use a WAV file as its microphone, so a headless call can play a visitor who pauses mid-sentence, coughs, or says "yeah" while Bryan talks, using Windows' built-in speech voice to make the files. That lets every later step be tested without you on a call.

### Step 2. One queued stream per answer (cause 1)

Bryan's avatar is a Cara 4 model (`cara-4.1-express`), and the Anam SDK we have (4.29.1) can take a whole answer as one talk stream, each sentence its own utterance. Anam plays the utterances in order, so a new sentence never cuts off the one playing and the page stops guessing when he's finished. An interruption then stops the whole stream (`TALK_STREAM_INTERRUPTED`), not just one line.

Our first try at streaming (L-011) produced no speech ("no open ChatMessageStreams"). The SDK's docs now say to wait for the session to be ready before the first chunk, and per-utterance ids are newer than that try, so a short probe comes first.

If the probe fails: keep `talk()`, but count a line as finished only once his audio has actually gone quiet (about half a second of silence on the call mode's volume meter, which is being built now), and give the backstop timer more room.

### Step 3. Only real interruptions stop him (causes 2 and 3)

- **Turn detection.** Anam has an `endOfSpeechSensitivity` setting (0 to 1) for how quickly it decides the visitor has finished. Turn it down a notch so a pause mid-sentence doesn't end the turn, tuned from the trace.
- **Merge fragments.** If a second visitor message arrives before Bryan has said a word of his answer, the page asks again with both pieces as one question. Nothing audible restarts, because he hadn't started.
- **Ignore backchannels.** While he's talking, "yeah", "okay", "mm-hmm", a single word or noise doesn't stop him. A real interruption (several words, or a question) still does, and he answers it.
- **Wait for words, not sound.** The page stops dropping the answer on the speech-start signal alone and decides once it has the transcript. If the trace shows Anam's engine stops him on any sound by itself, I'll look for a setting in Anam Lab or ask Anam. If there's none, noise can still pause him, but it won't send him into a new answer.
- **Echo.** Confirm the microphone runs with the browser's echo cancellation on.

### Step 4. Popups without the false start (cause 4)

- **The agent.** Tighten its instructions in Ensemble so it writes nothing before a popup widget. Tested on the dev server first and published only with your OK, as decided in L-009.
- **The page, as a backstop.** Hold Bryan's first sentence until the second one starts or the text ends, so a widget that follows a one-line preamble arrives before he speaks. The cost is roughly a quarter to half a second more before his first word, so this goes in only if the agent change isn't enough.

### Step 5. Check

The scripted calls from step 1 run before and after each step, and you make one real call at the end. Done means, in the scripted set:

- no answer starts and then restarts
- a pause mid-sentence doesn't split a question
- "yeah" and a cough don't stop him
- talking over him with a real question still does, and he answers it

## Files

- `components/get-started/BryanCall.tsx`: the answer, speak and Anam listener code (steps 2 to 4)
- `components/get-started/callTurns.ts` (new): the rules for which visitor messages interrupt, as plain functions the scripted tests can check
- `app/api/dev/call-trace/route.ts` (new, dev only) and `.gitignore` (step 1)
- the call mode's volume meter, reused for the silence check (step 2 fallback)
- the Ensemble agent's instructions (step 4, with your OK)

Related work already under way: the "Talk to the real Bryan" button makes the page's own lines (the popup lines, the guide upload's lines) stop the rest of his current answer. Step 2 builds on that rather than replacing it.

## How it runs

Step 0 goes in first, on its own. Step 1 and the step 2 probe run in parallel, one agent each. Steps 2 and 3 start once the trace is in and can also run side by side, since they touch different parts of `BryanCall.tsx`. Step 4 follows. Each step gets its own log entry.

## Your calls

0. OK to put in step 0 straight away? It's small, and it fixes something that's wrong whatever the trace shows.
1. Should Bryan keep talking through "yeah", "okay" and "mm-hmm"? Recommended: yes, that's how people talk on calls.
2. Is a quarter to half a second more before his first word worth it to remove the popup false starts (the page-side hold in step 4)? Recommended: change the agent's instructions first and add the hold only if the preamble still shows up.
3. OK to change the Ensemble agent's instructions on dev, then publish them once you've tried them (step 4)?
4. Once step 1 is in, can you make the three test calls?
