# Bryan's AI hears "Brian" and "TrueView": a plan

2026-11-02 · Waiting on Nolan's OK.

## The problem

The call's speech-to-text writes down what it thinks it heard, and Bryan's AI takes that text literally.

- **Brian.** A visitor says "Bryan", it's written "Brian", and the agent answers "my name's not Brian, it's Bryan".
- **TrueView.** Nolan's call at 17:25 today, from the call history:

  > VISITOR: What is TrueView do?
  > BRYAN: I'm not finding anything about TrueView in what I have available. Are you asking about a TruHu product, or something else?
  > VISITOR: I'm not asking about TrueView, I'm asking about TrueView, the company that you work for.

  The visitor can't fix this by repeating themselves, because every repeat is misheard the same way.

## Why it can't be fixed in the speech-to-text

Anam does the speech-to-text. Its session API takes a provider (`voiceDetectionOptions.sttProvider`: anam, deepgram, cartesia_ink_2, inworld_stt_1) and a `languageCode`, but no custom vocabulary or keyword boosting. The `pronunciationDictionaryId` setting only changes how Bryan says words, not how the visitor's words are heard. So the fix belongs after transcription, before the words reach the agent. As a side task, ask Anam support whether keyterm boosting is coming; it would be the cleanest fix.

## The fix, in two layers

### 1. Correct the words before the agent sees them (this repo, no agent change)

One function, `heardAs(text)` in `lib/heard.ts`, rewrites near-misses to the names they almost certainly are on this page:

| Heard | Becomes |
|---|---|
| Brian, Bryon, Brion | Bryan |
| TrueView, Truview, TruHu, Truehu, Truehue, Truehew (one word, any case) | TruHu |
| True Hu, True Hue, True Who, True Hugh, Tru Who (two words) | TruHu |
| True View, capitalised (as a brand name is written) | TruHu |
| Kleppy, Klepper, Klepp, Clappy | Kleppe |
| Kindle Rye, Kindle Ray, Kindlerye | Kindlerye |

A trailing `'s` or `s` is kept: "TrueView's" becomes "TruHu's".

It deliberately leaves alone:
- **Ordinary phrases:** "true view" in lower case ("a true view of the costs"), "through you" and "brain".
- **Distant names:** "Ryan" and anything else outside the list.

The list stays narrow on purpose: a wrong rewrite is worse than a miss.

**Where it runs:** in the Ensemble pass-through (`app/api/ensemble/[...path]/route.ts`), on the visitor's message in every chat request. Both the call and the typed chat go through it, so it's one place and covers both. A typed "Brian" is corrected too.

**What isn't rewritten:**
- The call history keeps the raw speech-to-text, so new mishearings show up in the transcripts on the dashboard and can be added to the table.
- The chat bubble keeps exactly what the visitor typed.

### 2. Tell the agent its input is speech (the Ensemble agent; needs your OK to publish)

This catches mishearings the table doesn't list yet. Proposed new section for the agent's prompt:

> ## 7. Misheard words
>
> In a call, the visitor's words reach you through speech-to-text, which often mishears names. Read anything that sounds like TruHu (TrueView, True Hue, True Who) as TruHu, anything like Bryan (Brian, Bryon) as Bryan, and anything like Kindlerye as Kindlerye. Never correct how someone said or spelled a name, never mention transcription, and never say you can't find something because of how a name came through: answer as if they said it right.

Per the Oct 28 rule, it's saved as a draft, tested on the dev server, and published only with your OK.

Layer 1 alone fixes both cases you hit, because the agent never sees "Brian" or "TrueView". Layer 2 covers the variants nobody has hit yet.

## How it's checked

- **Table test.** A small script runs `heardAs` over every row above and the negatives, plus your three TrueView lines from the call history.
- **Through the real agent.** Fresh threads on the dev pass-through: "What does TrueView do?", "Hi Brian, who are you?", "Show me the True Hue guide for Kindle Rye". Pass: Bryan answers about TruHu, never corrects a name, and never says he can't find it.
- **One real call from you:** say "Bryan" and "TruHu" a few times, then read the call's transcript on the dashboard.

## Effort

- Layer 1: about 30 minutes, including the checks.
- Layer 2: about 15 minutes, plus your OK to publish.
