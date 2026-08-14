"use client";

import { useState } from "react";
import { ArrowLeft, ArrowsClockwise } from "@phosphor-icons/react/ssr";
import { CTAButton } from "@/components/ui/CTAButton";
import { Card, SourceNote, cx } from "@/components/ui/primitives";

/**
 * The Fit Test is the most differentiated conversion mechanism this company
 * has: four questions, two minutes, no login and no email gate, with a
 * personalised breakdown at the end. It sat below the fold on one product page
 * and pointed at a separate domain. It belongs here, on-domain, with a
 * broker-side sibling. (File 02 §9.)
 *
 * It gives an honest "probably not" as one of its three answers. A test that
 * always says yes is a form with extra steps.
 */

type Option = { label: string; points: number; note: string };
type Question = { id: string; category: string; prompt: string; options: Option[] };

const BROKER: Question[] = [
  {
    id: "book",
    category: "Book size",
    prompt: "How many client groups does your brokerage serve?",
    options: [
      { label: "Fewer than 50", points: 1, note: "A smaller book can still be served by hand, so the economics matter less than the quality of the deliverable." },
      { label: "50 to 150", points: 2, note: "Big enough that the top-accounts-only pattern has already started, whether or not anybody decided it." },
      { label: "150 to 400", points: 3, note: "This is where hand production stops scaling and the gap between your best accounts and the rest becomes visible to clients." },
      { label: "More than 400", points: 3, note: "At this size the constraint is never talent. It is hours, and hours do not scale." },
    ],
  },
  {
    id: "coverage",
    category: "Coverage",
    prompt: "What share of those groups gets a custom benefit guide today?",
    options: [
      { label: "Nearly all of them", points: 1, note: "You have already solved this somehow. The open question is what it currently costs you." },
      { label: "Roughly the top 20%", points: 3, note: "The classic pattern, and the other 80% is where the value is." },
      { label: "A handful of the largest", points: 3, note: "The widest gap in the set, and the fastest one to close." },
      { label: "No custom guides today", points: 2, note: "Starting from zero is easier than replacing an incumbent, though it is a bigger internal change." },
    ],
  },
  {
    id: "production",
    category: "Production",
    prompt: "How does a guide actually get made right now?",
    options: [
      { label: "An account manager builds it", points: 3, note: "That is production work paid at account-management rates, in the busiest eight weeks of your year." },
      { label: "An in-house design or marketing team", points: 3, note: "Better quality, same bottleneck, and the bottleneck is one team for the whole book." },
      { label: "An outside vendor or agency", points: 3, note: "Priced and paced like a services engagement, which works for twenty accounts and cannot work for three hundred." },
      { label: "We do not produce guides", points: 2, note: "Then the real question is whether producing them wins business. That is a fair conversation and a different one." },
    ],
  },
  {
    id: "reach",
    category: "Reach",
    prompt: "Do your clients have employees with no work email address?",
    options: [
      { label: "Most of our clients do", points: 3, note: "Then distribution is the harder half of the problem, and Workforce is probably the more urgent product." },
      { label: "Some do", points: 2, note: "Worth splitting the book: the deskless groups have a different problem from the office ones." },
      { label: "Very few", points: 1, note: "Advisor on its own may be the whole answer for you." },
      { label: "I genuinely do not know", points: 2, note: "Almost nobody does, which is itself informative. It is the first thing a rollout finds out." },
    ],
  },
];

const EMPLOYER: Question[] = [
  {
    id: "channel",
    category: "Channel",
    prompt: "How do most of your employees receive company communication?",
    options: [
      { label: "Work email, everyone has one", points: 1, note: "You have a channel that reaches people. Whether it is read is a different problem and a smaller one." },
      { label: "Supervisors passing it on", points: 3, note: "Consistent messaging is impossible through a phone tree, and none of it is evidenced." },
      { label: "A notice board or break room", points: 3, note: "The classic case. Nobody has ever been able to prove that anyone read a notice board." },
      { label: "A mix, depending on the site", points: 3, note: "Mixed workforces are the hardest to serve and by far the most common." },
    ],
  },
  {
    id: "roster",
    category: "Roster",
    prompt: "Do you have a current mobile number for everybody?",
    options: [
      { label: "Yes, and it is clean", points: 3, note: "Then you could be reaching everyone next week rather than next quarter." },
      { label: "Mostly, with gaps", points: 3, note: "The gaps are the point. The first campaign hands you the list of exactly who is missing." },
      { label: "Patchy, it varies by site", points: 2, note: "Expect the first run to be as much a roster clean-up as a communication. That is worth doing anyway." },
      { label: "No", points: 2, note: "A smaller job than it sounds, once there is a reason to do it." },
    ],
  },
  {
    id: "proof",
    category: "Proof",
    prompt: "Could you show who received your last policy update?",
    options: [
      { label: "Yes, per named person", points: 1, note: "You already have what most employers are trying to buy." },
      { label: "Only who we emailed it to", points: 3, note: "Sent is not received, and an email log is a weak record on the day it matters." },
      { label: "No", points: 3, note: "This is the gap that turns a communication problem into an exposure problem." },
      { label: "I would have to go and find out", points: 3, note: "In our experience that answer is usually a no with extra steps." },
    ],
  },
  {
    id: "languages",
    category: "Languages",
    prompt: "How many languages does your workforce actually need?",
    options: [
      { label: "One", points: 1, note: "Simplest case. Translation is not what you would be buying." },
      { label: "Two", points: 2, note: "Manageable by hand, right up until the deadline moves." },
      { label: "Three to five", points: 3, note: "This is where hand translation stops being viable inside an enrollment window." },
      { label: "Six or more", points: 3, note: "Translation at generation is the difference between doing this and quietly not doing it." },
    ],
  },
];

type Audience = "broker" | "employer";

const VERDICTS = [
  {
    min: 10,
    title: "Strong fit",
    body: "On your answers, this is the problem TruHu was built for. The useful next step is a demo on one of your own groups rather than a generic walkthrough, you will know inside twenty minutes.",
  },
  {
    min: 6,
    title: "Likely fit, with one caveat",
    body: "Most of the pattern is here. Read the breakdown for the answer that gives us pause; it is worth raising on a first call rather than discovering in month three.",
  },
  {
    min: 0,
    title: "Probably not, and here is why",
    body: "On your answers, the pain this solves may not be your pain yet. We would rather say so now than sell you something you do not need. If the breakdown reads wrong to you, we have probably asked the wrong questions, tell us which ones.",
  },
];

export function FitTest() {
  const [audience, setAudience] = useState<Audience | null>(null);
  /** Stores the chosen option INDEX per question, so read-back is exact. */
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [step, setStep] = useState(0);

  const questions = audience === "broker" ? BROKER : EMPLOYER;
  const done = audience !== null && step >= questions.length;

  const total = questions.reduce((sum, question) => {
    const index = answers[question.id];
    return sum + (index === undefined ? 0 : question.options[index].points);
  }, 0);

  const verdict = VERDICTS.find((v) => total >= v.min) ?? VERDICTS[2];

  const restart = () => {
    setAudience(null);
    setAnswers({});
    setStep(0);
  };

  /* ---- Audience picker ------------------------------------------------- */
  if (!audience) {
    return (
      <Card className="p-7 sm:p-9">
        <p className="t-caption font-semibold text-blue-500 uppercase">
          Step 1 of 5
        </p>
        <h2 className="t-h2 mt-3 text-[clamp(1.5rem,1.3rem+0.9vw,2rem)]">
          Which side of the table are you on?
        </h2>
        <p className="measure mt-3 text-[0.9375rem] text-grey-700">
          The questions are different, because the problems are.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            {
              key: "broker" as const,
              title: "I am at a brokerage",
              body: "You serve a book of client groups and you produce work for them.",
            },
            {
              key: "employer" as const,
              title: "I am at an employer",
              body: "You have employees to reach and something you need them to see.",
            },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setAudience(option.key)}
              className="card-shape border border-border-200 bg-white p-5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-navy-900/25 hover:shadow-[0_10px_30px_-12px_rgba(15,42,68,0.18)]"
            >
              <span className="t-h4 block">{option.title}</span>
              <span className="mt-2 block text-[0.9375rem] leading-relaxed text-grey-700">
                {option.body}
              </span>
            </button>
          ))}
        </div>
      </Card>
    );
  }

  /* ---- Result ---------------------------------------------------------- */
  if (done) {
    return (
      <div className="space-y-5">
        <Card className="p-7 sm:p-9">
          <p className="t-caption font-semibold text-blue-500 uppercase">
            Your result
          </p>
          <div className="mt-4 flex flex-wrap items-baseline gap-4">
            <h2 className="t-h2 text-[clamp(1.75rem,1.4rem+1.2vw,2.5rem)]">
              {verdict.title}
            </h2>
            <span className="text-[0.9375rem] font-semibold text-grey-500 tabular">
              {total} / 12
            </span>
          </div>
          <div
            className="mt-5 h-2 w-full overflow-hidden rounded-full bg-tint-100"
            role="img"
            aria-label={`Score ${total} out of 12`}
          >
            <div
              className="h-full rounded-full bg-green-500"
              style={{ width: `${(total / 12) * 100}%` }}
            />
          </div>
          <p className="measure mt-6 t-lede text-grey-700">{verdict.body}</p>
        </Card>

        <Card className="p-7 sm:p-9">
          <h3 className="t-h3">The breakdown</h3>
          <ul className="mt-6 space-y-5">
            {questions.map((question) => {
              const index = answers[question.id];
              if (index === undefined) return null;
              const option = question.options[index];
              return (
                <li
                  key={question.id}
                  className="border-b border-border-200 pb-5 last:border-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <p className="t-caption font-semibold text-grey-500 uppercase">
                      {question.category}
                    </p>
                    <span
                      className={cx(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                        option.points >= 3
                          ? "bg-green-100 text-green-600"
                          : option.points === 2
                            ? "bg-tint-100 text-navy-700"
                            : "bg-section text-grey-500",
                      )}
                    >
                      {option.points >= 3
                        ? "Strong signal"
                        : option.points === 2
                          ? "Partial"
                          : "Weak signal"}
                    </span>
                  </div>
                  <p className="mt-2 text-[0.9375rem] font-medium text-ink-900">
                    {option.label}
                  </p>
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-grey-700">
                    {option.note}
                  </p>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <CTAButton href="/contact">Book a demo</CTAButton>
            <CTAButton
              href={audience === "broker" ? "/advisor" : "/workforce"}
              variant="secondary"
            >
              {audience === "broker" ? "Explore Advisor" : "Explore Workforce"}
            </CTAButton>
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-1.5 px-2 py-2 text-[0.8125rem] font-medium text-grey-700 underline-offset-4 hover:underline"
            >
              <ArrowsClockwise className="size-3.5" aria-hidden />
              Start again
            </button>
          </div>

          <SourceNote className="mt-6">
            Nothing here was sent anywhere. The Fit Test runs entirely in your
            browser, and we did not ask for your email address.
          </SourceNote>
        </Card>
      </div>
    );
  }

  /* ---- Question -------------------------------------------------------- */
  const question = questions[step];

  return (
    <Card className="p-7 sm:p-9">
      <div className="flex items-center justify-between gap-4">
        <p className="t-caption font-semibold text-blue-500 uppercase">
          Step {step + 2} of 5 · {question.category}
        </p>
        <button
          type="button"
          onClick={() => (step === 0 ? restart() : setStep(step - 1))}
          className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-grey-500 underline-offset-4 hover:text-navy-900 hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back
        </button>
      </div>

      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-tint-100">
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-300"
          style={{ width: `${((step + 1) / (questions.length + 1)) * 100}%` }}
        />
      </div>

      <h2 className="t-h2 mt-6 text-[clamp(1.5rem,1.3rem+0.9vw,2rem)]">
        {question.prompt}
      </h2>

      <ul className="mt-7 grid gap-3 sm:grid-cols-2">
        {question.options.map((option, i) => (
          <li key={option.label}>
            <button
              type="button"
              onClick={() => {
                setAnswers((prev) => ({ ...prev, [question.id]: i }));
                setStep(step + 1);
              }}
              className="card-shape h-full w-full border border-border-200 bg-white px-5 py-4 text-left text-[0.9375rem] font-medium text-ink-900 transition-all duration-150 hover:-translate-y-0.5 hover:border-navy-900/25 hover:shadow-[0_10px_30px_-12px_rgba(15,42,68,0.18)]"
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
