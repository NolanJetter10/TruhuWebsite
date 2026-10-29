"use client";

import { ArrowSquareOut, Info, MouseScroll } from "@phosphor-icons/react";
import Image, { type StaticImageData } from "next/image";
import { useRef, useState } from "react";
import { cx } from "@/components/ui/primitives";
import { track } from "@/lib/analytics/tracker";
import { KINDLERYE } from "@/lib/kindlerye";
import dentalDesktop from "@/public/kindlerye/microsite/dental-desktop.webp";
import dentalPhone from "@/public/kindlerye/microsite/dental-phone.webp";
import dentalThumb from "@/public/kindlerye/microsite/dental-thumb.webp";
import homeDesktop from "@/public/kindlerye/microsite/home-desktop.webp";
import homePhone from "@/public/kindlerye/microsite/home-phone.webp";
import homeThumb from "@/public/kindlerye/microsite/home-thumb.webp";
import medicalDesktop from "@/public/kindlerye/microsite/medical-desktop.webp";
import medicalPhone from "@/public/kindlerye/microsite/medical-phone.webp";
import medicalThumb from "@/public/kindlerye/microsite/medical-thumb.webp";
import visionDesktop from "@/public/kindlerye/microsite/vision-desktop.webp";
import visionPhone from "@/public/kindlerye/microsite/vision-phone.webp";
import visionThumb from "@/public/kindlerye/microsite/vision-thumb.webp";
import { useFlows } from "./FlowProvider";

/**
 * Kindlerye's sample benefits microsite inside the popup (FlowPanel): one of
 * its pages in a browser frame that scrolls, a picker that swaps the page,
 * and a button that opens the live site in a new tab.
 *
 * The captures are the reworked Oct 26 draft and the live link is the
 * version published Oct 19–20 (lib/kindlerye.ts), so nothing on the card
 * says the two match. A phone gets the phone capture and anything wider the
 * desktop one. Each was sized once into public/kindlerye/microsite/ and is
 * served as it is, so a tall page doesn't wait on the image optimizer the
 * first time the popup opens.
 */

type PageKey = "home" | "medical" | "dental" | "vision";

type Page = {
  key: PageKey;
  desktop: StaticImageData;
  phone: StaticImageData;
  thumb: StaticImageData;
};

const PAGES: Page[] = [
  { key: "home", desktop: homeDesktop, phone: homePhone, thumb: homeThumb },
  { key: "medical", desktop: medicalDesktop, phone: medicalPhone, thumb: medicalThumb },
  { key: "dental", desktop: dentalDesktop, phone: dentalPhone, thumb: dentalThumb },
  { key: "vision", desktop: visionDesktop, phone: visionPhone, thumb: visionThumb },
];

/** Where the phone capture gives way to the desktop one: Tailwind's `sm`. */
const WIDE = "(min-width: 40rem)";

export function MicrositeCard() {
  const flows = useFlows();
  const [current, setCurrent] = useState<PageKey>("home");
  const viewport = useRef<HTMLDivElement>(null);

  if (!flows) return null;
  const { copy: all, log } = flows;
  const copy = all.microsite;
  const page = PAGES.find((p) => p.key === current) ?? PAGES[0];
  const name = copy.pages[page.key];

  function show(key: PageKey) {
    if (key === current) return;
    setCurrent(key);
    viewport.current?.scrollTo({ top: 0 });
  }

  /** Fetches a page's capture ahead of the click, so the swap is instant. */
  function warm(key: PageKey) {
    const next = PAGES.find((p) => p.key === key);
    if (!next || key === current) return;
    const img = new window.Image();
    img.src = window.matchMedia(WIDE).matches ? next.desktop.src : next.phone.src;
  }

  return (
    <div
      data-section="flow-microsite"
      data-track-ignore
      className="card-shape-lg relative flex h-full flex-col overflow-hidden border border-white/10 bg-white px-4 py-4 text-ink shadow-[0_40px_90px_-40px_rgba(2,8,18,0.85)] sm:px-5 sm:py-5"
    >
      <div className="card-shape-sm flex min-h-[14rem] flex-1 flex-col overflow-hidden border border-line bg-white shadow-[0_18px_40px_-28px_rgba(5,14,26,0.55)]">
        <div className="flex items-center gap-2 border-b border-line bg-paper px-3 py-2">
          <span aria-hidden className="flex shrink-0 gap-1.5">
            <span className="size-2 rounded-full bg-red-600/35" />
            <span className="size-2 rounded-full bg-amber-500/35" />
            <span className="size-2 rounded-full bg-green-500/40" />
          </span>
          <span className="ml-1.5 min-w-0 flex-1 truncate rounded-md bg-white px-2.5 py-1 font-mono text-[11px] tracking-tight text-slate-400 ring-1 ring-line">
            <span className="hidden sm:inline">{copy.site} · </span>
            {name}
          </span>
          <span aria-hidden className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-slate-400">
            <MouseScroll className="size-3.5" />
            {copy.scroll}
          </span>
        </div>
        <div
          ref={viewport}
          role="region"
          aria-label={copy.preview}
          tabIndex={0}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-paper outline-none [scrollbar-color:var(--color-line)_transparent] [scrollbar-width:thin] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
        >
          {/* Keyed, so a swap starts on a blank frame rather than stretching
              the last page to the new one's size while it loads. */}
          <picture key={page.key}>
            <source
              media={WIDE}
              srcSet={page.desktop.src}
              width={page.desktop.width}
              height={page.desktop.height}
            />
            <img
              src={page.phone.src}
              width={page.phone.width}
              height={page.phone.height}
              alt={copy.alt.replace("{page}", name)}
              decoding="async"
              className="block h-auto w-full"
            />
          </picture>
        </div>
      </div>

      <div
        role="group"
        aria-label={copy.pagesLabel}
        className="mt-2.5 flex flex-wrap gap-1.5 sm:mt-3 sm:grid sm:grid-cols-4 sm:gap-2"
      >
        {PAGES.map((p) => {
          const on = p.key === page.key;
          return (
            <button
              key={p.key}
              type="button"
              aria-pressed={on}
              onClick={() => show(p.key)}
              onPointerEnter={() => warm(p.key)}
              onFocus={() => warm(p.key)}
              className={cx(
                "rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold ring-1 transition-[color,box-shadow,background-color] duration-200 sm:rounded-[10px] sm:p-1 sm:pb-1.5 sm:text-[0.75rem]",
                on
                  ? "bg-blue-500/10 text-blue-700 ring-blue-500 sm:ring-2"
                  : "text-slate-600 ring-line hover:text-ink hover:ring-blue-500/45",
              )}
            >
              <Image
                src={p.thumb}
                alt=""
                unoptimized
                className="hidden aspect-[2/1] w-full rounded-md object-cover object-top sm:block"
              />
              <span className="block sm:mt-1">{copy.pages[p.key]}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3.5 flex flex-col gap-3 sm:mt-4 sm:flex-row sm:items-center sm:gap-5">
        <p className="text-[0.875rem] leading-snug text-slate-600 sm:flex-1">{copy.body}</p>
        <a
          href={KINDLERYE.micrositeUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            track("microsite_open");
            log("The visitor opened Kindlerye's live microsite in a new tab.");
          }}
          className="sheen flex shrink-0 items-center justify-center gap-2 rounded-full bg-green-500 px-5 py-2.5 text-[0.9375rem] font-semibold text-ink-950 shadow-[0_10px_28px_-12px_rgba(56,176,0,0.75)] transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-green-400"
        >
          <span className="relative z-[2]">{copy.open}</span>
          <ArrowSquareOut aria-hidden weight="bold" className="relative z-[2] size-[1.125rem]" />
          <span className="sr-only">{copy.newTab}</span>
        </a>
      </div>

      <p className="mt-3 flex items-start gap-2 text-[0.8125rem] sm:mt-3.5 sm:border-t sm:border-line sm:pt-3.5 leading-snug text-slate-600">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-blue-700" />
        {copy.note}
      </p>
    </div>
  );
}
