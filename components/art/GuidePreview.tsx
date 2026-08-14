"use client";

import { useState } from "react";
import { PhoneFrame, SampleDataTag } from "./frames";
import { cx } from "@/components/ui/primitives";

/**
 * The deliverable at full size, in a phone frame, with a language toggle.
 * Every competitor shows the builder; nobody shows the thing the broker hands
 * their client. (File 02 §11.)
 *
 * The content below is a realistic sample, not a customer's guide. Publishing a
 * real one is gated on customer permission, see the asset inventory.
 */

const COPY = {
  en: {
    lang: "English",
    employer: "RIDGELINE MANUFACTURING",
    kicker: "2026 Benefits",
    title: "Everything you need to enroll",
    window: "Enrollment is open Oct 20 to Nov 7",
    plansHeading: "Your medical plans",
    plans: [
      {
        name: "PPO 1500",
        rows: [
          ["Deductible", "$1,500"],
          ["Primary care", "$25"],
          ["Per paycheck", "$62.40"],
        ],
      },
      {
        name: "HDHP 3200 + HSA",
        rows: [
          ["Deductible", "$3,200"],
          ["Employer HSA", "$750"],
          ["Per paycheck", "$28.10"],
        ],
      },
    ],
    changedHeading: "What changed this year",
    changed: [
      "The PPO deductible went up by $200.",
      "The employer HSA contribution went up by $250.",
      "Dental now covers one extra cleaning a year.",
    ],
    cta: "Start my enrollment",
    help: "Text a question to this number and a person answers.",
  },
  es: {
    lang: "Español",
    employer: "RIDGELINE MANUFACTURING",
    kicker: "Beneficios 2026",
    title: "Todo lo que necesita para inscribirse",
    window: "La inscripción está abierta del 20 de oct. al 7 de nov.",
    plansHeading: "Sus planes médicos",
    plans: [
      {
        name: "PPO 1500",
        rows: [
          ["Deducible", "$1,500"],
          ["Médico de cabecera", "$25"],
          ["Por cheque", "$62.40"],
        ],
      },
      {
        name: "HDHP 3200 + HSA",
        rows: [
          ["Deducible", "$3,200"],
          ["HSA del empleador", "$750"],
          ["Por cheque", "$28.10"],
        ],
      },
    ],
    changedHeading: "Qué cambió este año",
    changed: [
      "El deducible del PPO subió $200.",
      "La aportación del empleador a la HSA subió $250.",
      "El plan dental ahora cubre una limpieza adicional al año.",
    ],
    cta: "Comenzar mi inscripción",
    help: "Envíe su pregunta por mensaje de texto y una persona le responde.",
  },
} as const;

type Lang = keyof typeof COPY;

export function GuidePreview({ caption }: { caption?: string }) {
  const [lang, setLang] = useState<Lang>("en");
  const t = COPY[lang];

  return (
    <div className="flex flex-col items-center">
      <div
        className="mb-6 inline-flex items-center gap-1 rounded-full border border-border-200 bg-white p-1"
        role="group"
        aria-label="Guide language"
      >
        {(Object.keys(COPY) as Lang[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setLang(key)}
            aria-pressed={lang === key}
            className={cx(
              "rounded-full px-3.5 py-1.5 text-[0.8125rem] font-semibold transition-colors duration-150",
              lang === key
                ? "bg-navy-900 text-white"
                : "text-grey-700 hover:bg-section",
            )}
          >
            {COPY[key].lang}
          </button>
        ))}
      </div>

      <div className="relative">
        <PhoneFrame caption={caption}>
          <div className="h-[498px] overflow-hidden" lang={lang}>
            <div className="bg-[#2b3a55] px-5 pt-3 pb-4 text-white">
              <p className="text-[9px] font-bold tracking-[0.12em]">
                {t.employer}
              </p>
              <p className="mt-2 text-[10px] font-semibold text-white/70 uppercase">
                {t.kicker}
              </p>
              <p className="mt-1 text-[1.0625rem] leading-tight font-bold">
                {t.title}
              </p>
              <p className="mt-2 inline-flex rounded-full bg-[#8c2f39] px-2.5 py-1 text-[10px] font-semibold">
                {t.window}
              </p>
            </div>

            <div className="space-y-3 px-4 py-4">
              <p className="text-[11px] font-bold tracking-wide text-[#2b3a55] uppercase">
                {t.plansHeading}
              </p>

              {t.plans.map((plan) => (
                <div
                  key={plan.name}
                  className="card-shape-sm border border-border-200 p-3"
                >
                  <p className="text-[0.8125rem] font-bold text-ink-900">
                    {plan.name}
                  </p>
                  <dl className="mt-2 space-y-1">
                    {plan.rows.map(([k, v]) => (
                      <div
                        key={k}
                        className="flex items-baseline justify-between gap-2 text-[11px]"
                      >
                        <dt className="text-grey-500">{k}</dt>
                        <dd className="font-semibold text-ink-900 tabular">
                          {v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}

              <div className="card-shape-sm bg-[#f4f0e8] p-3">
                <p className="text-[11px] font-bold text-[#2b3a55]">
                  {t.changedHeading}
                </p>
                <ul className="mt-1.5 space-y-1">
                  {t.changed.map((line) => (
                    <li
                      key={line}
                      className="flex gap-1.5 text-[11px] leading-snug text-ink-900/80"
                    >
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[#8c2f39]" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className="w-full rounded-lg bg-[#8c2f39] py-2.5 text-[0.8125rem] font-semibold text-white"
              >
                {t.cta}
              </button>
              <p className="text-center text-[10px] leading-snug text-grey-500">
                {t.help}
              </p>
            </div>
          </div>
        </PhoneFrame>

        <SampleDataTag className="absolute -top-2 -right-2 sm:-right-6">
          Sample guide
        </SampleDataTag>
      </div>
    </div>
  );
}
