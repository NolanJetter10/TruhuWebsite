/*
 * Benefits Guide — published PDF flipbook viewer.
 *
 * Self-contained ES module served from /public/pdf-flipbook.js, booted by the small shell that
 * GET /p/:slug returns for GUIDE templates. It replaces the old native <embed> PDF plugin with a
 * paged "flipbook" reader:
 *   - portrait guides read two pages at a time as a book spread (cover alone, then 2-3, 4-5, …);
 *   - landscape guides read one page at a time (mirrors "View Presentation" orientation handling);
 *   - forward/back paging via on-stage arrows, the keyboard, AND scroll/swipe ("flip" mode) — with
 *     a topbar switch between three reading modes: Slides, Flipbook, and Pages (the internal
 *     'scroll' mode — the reader-facing label is "Pages");
 *   - the standard reader controls stay: zoom, download, and jump-to/select-page;
 *   - a two-mode side menu: Table of Contents (the effective guide TOC) and Pages (thumbnails);
 *   - in "Flipbook" mode, pages turn as a curling sheet of paper with a page-turn sound, in a fixed
 *     two-slot book layout (cover alone on the right, a lone last page on the left) — see
 *     "Book-style page turn" below. "Slides" is the same flip reader without that animation.
 *
 * The three topbar modes map onto two internal axes — viewMode ('flip' | 'scroll') and a bookStyle
 * flag (the old author-only "flip book style"): Slides = flip + plain, Flipbook = flip + bookStyle,
 * Pages ('scroll') = continuous scroll. The mode is now the reader's live choice, not an author-only setting;
 * the server only supplies which of the three a first-time visitor lands in (cfg.defaultViewMode).
 *
 * The AI assistant, Share button and language switcher are injected separately by the server
 * (buildPublishedWidgets) exactly as on every other published page, so this file never touches
 * them — it only leaves their fixed corners clear.
 *
 * Config arrives on window.__BG_FLIPBOOK__:
 *   { pdfUrl, pdfjsUrl, pdfjsWorkerUrl, outlineUrl, title, defaultViewMode, pageTurnSound }
 *   defaultViewMode → 'slides' | 'flipbook' | 'scroll' (the first-visit mode; missing → 'slides').
 *   pageTurnSound → false turns off Flipbook mode's page-turn sound (missing → on).
 * outlineUrl → GET /p/:slug/outline → { sections: [{ label, page, group }] } (page is 1-based).
 */

/** @typedef {{ pdfUrl: string; pdfjsUrl: string; pdfjsWorkerUrl: string; outlineUrl: string; title?: string; defaultViewMode?: 'slides' | 'flipbook' | 'scroll'; pageTurnSound?: boolean }} FlipbookConfig */
/** @typedef {{ label: string; page: number; group: string | null }} OutlineSection */

import {
  bookSpreads,
  spreadIndexForPage as spreadIndexOf,
  clampPage,
  stepScrollPage,
  nearestPageToCenter,
  fitPageScale,
  isSuccessfulPdfResponse,
  linkAnnotationTarget,
  linkRectPercents,
  bookSlotSize,
  planTurn,
  curlStripCount,
  curlGeometry,
  curlShadeAlpha,
  leafSlice,
  resolveInitialDisplayMode,
  storeDisplayModePreference,
} from './pdf-flipbook-lib.js';

(() => {
  'use strict';

  const cfg = /** @type {FlipbookConfig | undefined} */ (window.__BG_FLIPBOOK__);
  if (!cfg || !cfg.pdfUrl) {
    // Nothing to boot against — leave the page as-is rather than throwing.
    return;
  }

  const DISPLAY_MODES = ['slides', 'flipbook', 'scroll'];
  const MIN_ZOOM = 0.4;
  const MAX_ZOOM = 4;
  const ZOOM_STEP = 1.2;
  // How long a programmatic smooth scroll (goToPage) is allowed to keep currentPage pinned to its
  // target before the scroll tracker takes over again — a backstop for a scroll that never settles
  // exactly on the target (e.g. a short final page). Comfortably longer than a smooth-scroll takes.
  const SCROLL_SETTLE_MS = 1500;
  // Below this stage width a portrait guide drops from a 2-up spread to a single page so each
  // page stays legible on phones/narrow windows.
  const TWO_UP_MIN_WIDTH = 760;
  // Scroll/wheel distance that counts as one page flip, and the swipe distance on touch.
  const WHEEL_FLIP_THRESHOLD = 90;
  const SWIPE_FLIP_THRESHOLD = 60;
  // Structural section groups that carry no reader-facing content — hidden from the table of
  // contents (they still exist as pages in the Pages thumbnails). Mirrors the server's
  // EXCLUDED_NAV_GROUPS in pdf-nav-links.ts.
  const STRUCTURAL_GROUPS = new Set(['cover_options', 'toc', 'back_cover']);

  // Inline SVG toolbar icons. Drawn with currentColor so each inherits its button's text colour,
  // and sized by the shared .bg-fb-icon class. These replace the old single-glyph controls (⭳, ⇅/⇄):
  // those Unicode symbols are absent from many mobile system fonts, so a phone rendered them as
  // meaningless tofu/box glyphs — the "stacked lines" the download button showed. An SVG renders
  // identically on every device.
  const ICON_DOWNLOAD =
    '<svg class="bg-fb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3v11"/><path d="M8 11l4 4 4-4"/><path d="M5 20h14"/></svg>';
  // Slides = read one page (spread) at a time: a single framed page. The plain flip reader.
  const ICON_SLIDES =
    '<svg class="bg-fb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="4" y="5" width="16" height="12" rx="1.5"/><path d="M9 20h6"/></svg>';
  // Flipbook = read as a book: an open two-page spread with a centre spine (the page-turn animation).
  const ICON_FLIP =
    '<svg class="bg-fb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 6C10.3 4.9 7.8 4.3 5 4.3V17c2.8 0 5.3.6 7 1.7 1.7-1.1 4.2-1.7 7-1.7V4.3c-2.8 0-5.3.6-7 1.7z"/><path d="M12 6v12.7"/></svg>';
  // Scroll = read as a continuous vertical scroll: a page with a downward direction cue.
  const ICON_SCROLL =
    '<svg class="bg-fb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 4v16"/><path d="M7 9l5-5 5 5"/><path d="M7 15l5 5 5-5"/></svg>';

  /** Coerce anything to one of the three reader modes, defaulting to Slides. */
  function normalizeDisplayMode(value) {
    return DISPLAY_MODES.indexOf(value) !== -1 ? value : 'slides';
  }
  /** The topbar mode the current internal state represents. */
  function currentDisplayMode() {
    if (state.viewMode === 'scroll') return 'scroll';
    return state.bookStyle ? 'flipbook' : 'slides';
  }
  /**
   * The mode the reader lands in, in priority order:
   *   1. their own last pick for this published guide link;
   *   2. the author's default (cfg.defaultViewMode), else Slides.
   *
   * Global keys from older viewers are deliberately ignored: carrying one forward would recreate
   * the bug where visiting another guide prevents this guide's selected default from taking effect.
   */
  const initialDisplayMode = resolveInitialDisplayMode(window, cfg.pdfUrl, cfg.defaultViewMode);

  /** De-slugify a section key into a fallback label ("dental_ppo" → "Dental Ppo"). */
  function humanizeKey(key) {
    return String(key)
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /**
   * Index of the TOC row active for the visible page(s). A two-up spread is represented by both
   * page numbers, so an entry beginning on the right-hand page is selected immediately.
   * @param {{ page: number }[]} entries
   * @param {number[]} visiblePages
   */
  function activeTocIndex(entries, visiblePages) {
    const page = Math.max(...visiblePages.filter(Number.isFinite));
    if (!Number.isFinite(page)) return -1;
    let active = -1;
    for (let i = 0; i < entries.length; i++) {
      if (Number(entries[i].page) <= page) active = i;
    }
    return active;
  }

  // ── Viewer state ──────────────────────────────────────────────────────────────
  const state = {
    /** @type {import('pdfjs-dist').PDFDocumentProxy | null} */
    pdf: null,
    pageCount: 0,
    /** true when the first page is wider than tall. */
    landscape: false,
    /** number of pages shown side by side in flip mode (1 or 2), after the width check. */
    pagesPerSpread: 1,
    /** @type {number[][]} each entry is the 1-based page numbers on that spread. */
    spreads: [],
    /** index into `spreads` — the flip-mode unit of navigation. */
    spreadIndex: 0,
    /**
     * The authoritative current page (1-based). In flip mode it tracks the lead page of the
     * visible spread; in scroll mode it tracks the page actually centred in the viewport. The page
     * input, the active thumbnail, and the active section all read this — so on a wide portrait
     * guide, scrolling to page 3 reports 3, not the spread's leading page 2.
     */
    currentPage: 1,
    /** 'flip' | 'scroll' — the paging axis of the topbar mode (Slides/Flipbook flip, Scroll scrolls). */
    viewMode: initialDisplayMode === 'scroll' ? 'scroll' : 'flip',
    /** The old "flip book style": true adds the curling page-turn animation + two-slot book layout. */
    bookStyle: initialDisplayMode === 'flipbook',
    /** zoom multiplier applied on top of the fit-to-stage base scale. */
    zoom: 1,
    /** @type {OutlineSection[]} */
    outline: [],
    sidebarOpen: false,
    sidebarTab: 'sections', // 'sections' | 'pages'
    /** monotonically increasing token so a slow render can tell it was superseded. */
    renderToken: 0,
    /** cache of base viewport width/height (pdf units) per page number. */
    pageSize: new Map(),
    /**
     * The document-wide page box every two-up book slot uses (pdf units) — the widest and tallest
     * page in the document, resolved once. Null until first needed. See bookSlot().
     * @type {{ width: number; height: number } | null}
     */
    bookSlot: null,
    /** In-flight GET /outline promise, started at boot so its server render overlaps the PDF's. */
    outlineFetch: null,
    /** Direction used only for the next opt-in page-turn animation. */
    turnDirection: null,
    /**
     * In scroll mode, the page a programmatic goToPage() is smooth-scrolling toward, or null when
     * the reader is in control. While it is set, the scroll-position tracker keeps currentPage
     * pinned to this target instead of reporting the pages the animation passes over — otherwise
     * driving the view (e.g. the narration widget auto-advancing) would emit a page event naming
     * the page being scrolled AWAY from, which a consumer reads as the reader navigating by hand.
     * Cleared the moment the target is reached, or by scrollSettleTimer as a backstop.
     * @type {number | null}
     */
    scrollTargetPage: null,
  };
  /** Backstop that clears state.scrollTargetPage if a programmatic scroll never settles on it. */
  let scrollSettleTimer = 0;

  /**
   * The page-turn sound: a real recording — "Page Turn" by yatoimtop on freesound.org, released
   * CC0 (https://freesound.org/people/yatoimtop/sounds/346835/) — served next to this module as
   * pdf-flipbook-page-turn.mp3. It replaced a synthesized noise burst that read as a puff of air.
   * One element, created at boot so the clip is already fetched by the first turn, and restarted
   * from the top on every turn.
   * @type {HTMLAudioElement | null}
   */
  let pageTurnAudio = null;

  /**
   * The OS "reduce motion" preference. The curling page-turn is motion, and so is its sound: they
   * are one affordance, gated by ONE predicate so they can never drift apart. Without this, a
   * reduced-motion reader heard the page-turn sound (played from goToSpread) while the animation
   * was skipped (renderFlip) — a disembodied thunk with an instant page swap. Read live rather
   * than cached so a reader toggling the OS setting mid-session is honoured.
   */
  function prefersReducedMotion() {
    return typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function preparePageTurnSound() {
    // The author can turn the sound off when publishing; only an explicit false does.
    if (cfg.pageTurnSound === false || !state.bookStyle || pageTurnAudio) return;
    try {
      const audio = new Audio(new URL('./pdf-flipbook-page-turn.mp3', import.meta.url).href);
      audio.preload = 'auto';
      audio.volume = 0.7;
      pageTurnAudio = audio;
    } catch {
      // No Audio support — the viewer simply turns pages silently.
    }
  }

  /** Started from the reader's interaction (autoplay policies), never awaited, never fatal. */
  function playPageTurnSound() {
    // No sound when the turn itself is suppressed for reduced motion — see prefersReducedMotion.
    if (!pageTurnAudio || prefersReducedMotion()) return;
    try {
      pageTurnAudio.currentTime = 0;
      void pageTurnAudio.play().catch(() => {});
    } catch {
      // Audio is an enhancement; a blocked or unsupported player must never interrupt paging.
    }
  }

  // ── DOM refs (filled by buildChrome) ────────────────────────────────────────────
  /** @type {Record<string, HTMLElement>} */
  const el = {};

  // ── PDF.js bootstrap ────────────────────────────────────────────────────────────
  /** @type {typeof import('pdfjs-dist')} */
  let pdfjsLib;

  async function boot() {
    buildChrome();
    preparePageTurnSound();
    setStatus('Loading…');
    // Kick the outline request off NOW, before the pdf.js import and the PDF load below. The server
    // computes the section→page map with a render as costly as the PDF's, and each render launches
    // its own Chromium, so starting it here overlaps the two instead of paying them back to back —
    // the Sections list then lands with the first page, not long after it. Fire-and-store; the
    // sidebar is rendered from it once the PDF (and page count) are ready. See loadOutline.
    startOutlineFetch();
    try {
      pdfjsLib = await import(cfg.pdfjsUrl);
      pdfjsLib.GlobalWorkerOptions.workerSrc = cfg.pdfjsWorkerUrl;
    } catch (err) {
      return fail('This guide viewer could not start.', err);
    }

    try {
      const task = pdfjsLib.getDocument({ url: cfg.pdfUrl });
      state.pdf = await task.promise;
      state.pageCount = state.pdf.numPages;
    } catch (err) {
      return fail('This guide could not be loaded.', err);
    }

    // Orientation from the first page (matches the presentation deck's per-document decision).
    const firstViewport = (await state.pdf.getPage(1)).getViewport({ scale: 1 });
    state.landscape = firstViewport.width > firstViewport.height;
    state.pageSize.set(1, { width: firstViewport.width, height: firstViewport.height });

    clearStatus();
    void loadOutline();
    recomputeSpreads();
    render();
    renderPagesSidebar();
  }

  function fail(message, err) {
    // No second viewer to fall back to (product decision), but never strand the reader on a blank
    // page — show the message and a direct download so the guide is still reachable.
    if (err) console.error('[bg-flipbook]', err);
    setStatus(
      `${message} <a href="${escapeAttr(cfg.pdfUrl)}" download>Download the PDF</a> instead.`,
      true,
    );
  }

  // ── Spread computation ──────────────────────────────────────────────────────────
  /** Effective 2-up only for portrait guides on a wide-enough stage. */
  function effectiveTwoUp() {
    if (state.landscape) return false;
    const stageWidth = el.stage ? el.stage.clientWidth : window.innerWidth;
    return stageWidth >= TWO_UP_MIN_WIDTH;
  }

  function recomputeSpreads() {
    const twoUp = effectiveTwoUp();
    state.pagesPerSpread = twoUp ? 2 : 1;
    state.spreads = bookSpreads(state.pageCount, twoUp);
    if (state.spreadIndex >= state.spreads.length) {
      state.spreadIndex = Math.max(0, state.spreads.length - 1);
    }
  }

  function spreadIndexForPage(pageNum) {
    return spreadIndexOf(state.spreads, pageNum);
  }

  // ── Navigation ──────────────────────────────────────────────────────────────────
  function goToSpread(index) {
    const clamped = Math.max(0, Math.min(state.spreads.length - 1, index));
    const spread = state.spreads[clamped];
    // The lead page of the spread is the "current page" while flipping.
    state.currentPage = spread ? spread[0] : 1;
    if (clamped === state.spreadIndex) {
      // Same spread (e.g. re-selecting the current one): nothing to re-render, but keep the
      // controls/highlights in sync with currentPage.
      syncControls();
      highlightActive();
      return;
    }
    state.turnDirection = clamped > state.spreadIndex ? 'forward' : 'backward';
    state.spreadIndex = clamped;
    playPageTurnSound();
    render();
  }
  function nextSpread() {
    goToSpread(state.spreadIndex + 1);
  }
  function prevSpread() {
    goToSpread(state.spreadIndex - 1);
  }

  /** Previous/Next in the toolbar: a spread in flip mode, a single page in scroll mode. */
  function stepBackward() {
    if (state.viewMode === 'scroll') goToPage(stepScrollPage(state.currentPage, -1, state.pageCount));
    else prevSpread();
  }
  function stepForward() {
    if (state.viewMode === 'scroll') goToPage(stepScrollPage(state.currentPage, 1, state.pageCount));
    else nextSpread();
  }

  function goToPage(pageNum) {
    const clamped = clampPage(pageNum, state.pageCount);
    if (state.viewMode === 'scroll') {
      state.currentPage = clamped;
      state.spreadIndex = spreadIndexForPage(clamped);
      const target = el.scrollPages && el.scrollPages.querySelector(`[data-scroll-page="${clamped}"]`);
      if (target) {
        // Pin currentPage to this page while the smooth scroll runs, so the scroll tracker does
        // not briefly report the page we are leaving (which a driver like the narration widget
        // would mistake for the reader taking over). Cleared on arrival or by the backstop timer.
        state.scrollTargetPage = clamped;
        window.clearTimeout(scrollSettleTimer);
        // Backstop: if the scroll never settles exactly on the target (e.g. a short final page),
        // release the pin AND reconcile to the page actually in view, so a consumer is never left
        // hearing about the target while the reader sees another page.
        scrollSettleTimer = window.setTimeout(() => {
          state.scrollTargetPage = null;
          updateScrollCurrentPage();
        }, SCROLL_SETTLE_MS);
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      syncControls();
      highlightActive();
    } else {
      goToSpread(spreadIndexForPage(clamped));
    }
  }

  // ── Zoom ──────────────────────────────────────────────────────────────────────
  function setZoom(next) {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
    if (Math.abs(clamped - state.zoom) < 0.001) return;
    state.zoom = clamped;
    render();
  }
  function zoomIn() {
    setZoom(state.zoom * ZOOM_STEP);
  }
  function zoomOut() {
    setZoom(state.zoom / ZOOM_STEP);
  }
  function zoomReset() {
    setZoom(1);
  }

  // ── Rendering ───────────────────────────────────────────────────────────────────
  function render() {
    if (!state.pdf) return;
    // A re-render replaces the spread wholesale, so a turn still in flight lands now.
    cancelActiveTurn();
    // A stable class (not a :has() selector) drives scroll-mode styling like hiding the flip arrows,
    // so it holds on browsers that run pdf.js but don't support :has().
    el.root.classList.toggle('bg-fb-mode-scroll', state.viewMode === 'scroll');
    // Book-style gutter/shadow styling tracks the live bookStyle flag (Slides ⇄ Flipbook toggles it).
    el.root.classList.toggle('bg-fb-book-style', state.bookStyle);
    if (state.viewMode === 'scroll') renderScroll();
    else renderFlip();
    syncControls();
    highlightActive();
  }

  async function pageViewportSize(pageNum) {
    if (state.pageSize.has(pageNum)) return state.pageSize.get(pageNum);
    const vp = (await state.pdf.getPage(pageNum)).getViewport({ scale: 1 });
    const size = { width: vp.width, height: vp.height };
    state.pageSize.set(pageNum, size);
    return size;
  }

  /**
   * The fixed slot box for the two-up book layout: the largest page box across the WHOLE document,
   * so every spread shares one scale and geometry — a smaller cover or an inserted source page sits
   * inside the same slot rather than re-fitting the book when the reader reaches it. Resolved from
   * page metadata only (no rendering) and cached.
   */
  async function bookSlot() {
    if (state.bookSlot) return state.bookSlot;
    const pages = Array.from({ length: state.pageCount }, (_, i) => i + 1);
    const sizes = await Promise.all(pages.map((p) => pageViewportSize(p)));
    state.bookSlot = bookSlotSize(sizes) || sizes[0] || { width: 1, height: 1 };
    return state.bookSlot;
  }

  /**
   * Navigate to a PDF link destination (an internal GoTo). `dest` is either a named destination
   * (string) or an explicit destination array whose first entry is the target page's ref. Resolves
   * to a 1-based page and drives the flipbook there. Best-effort — a dest we can't resolve is ignored.
   */
  async function goToDest(dest) {
    try {
      const explicit = typeof dest === 'string' ? await state.pdf.getDestination(dest) : dest;
      if (!Array.isArray(explicit) || explicit.length === 0) return;
      const pageIndex = await state.pdf.getPageIndex(explicit[0]);
      goToPage(pageIndex + 1);
    } catch {
      /* unresolvable destination — leave the reader where it is */
    }
  }

  /**
   * Build a clickable overlay of the page's Link annotations so links work WHILE VIEWING, not only in
   * the downloaded PDF. Positions are percentages of the page box (from the unscaled viewport), so the
   * overlay scales exactly with the canvas under zoom and the scroll view's max-width shrink without a
   * re-layout. External links open in a new tab; internal links jump the flipbook. Entirely
   * best-effort: any failure returns an empty layer and the page still renders as before.
   */
  async function buildLinkLayer(page, pageNum) {
    const layer = document.createElement('div');
    layer.className = 'bg-fb-link-layer';
    try {
      const annotations = await page.getAnnotations({ intent: 'display' });
      const base = page.getViewport({ scale: 1 });
      for (const a of annotations) {
        const target = linkAnnotationTarget(a);
        if (!target || !Array.isArray(a.rect)) continue;
        // pdf.js 6 removed PageViewport.convertToViewportRectangle from the modern build. Apply
        // the viewport's public transform directly so the same annotation rectangle works on both
        // older deployments and the current viewer dependency instead of silently dropping every
        // link inside this function's best-effort catch.
        const viewportRect = typeof base.convertToViewportRectangle === 'function'
          ? base.convertToViewportRectangle(a.rect)
          : [
              a.rect[0] * base.transform[0] + a.rect[1] * base.transform[2] + base.transform[4],
              a.rect[0] * base.transform[1] + a.rect[1] * base.transform[3] + base.transform[5],
              a.rect[2] * base.transform[0] + a.rect[3] * base.transform[2] + base.transform[4],
              a.rect[2] * base.transform[1] + a.rect[3] * base.transform[3] + base.transform[5],
            ];
        const pct = linkRectPercents(viewportRect, base.width, base.height);
        if (!pct) continue;
        const link = document.createElement('a');
        link.style.left = `${pct.left}%`;
        link.style.top = `${pct.top}%`;
        link.style.width = `${pct.width}%`;
        link.style.height = `${pct.height}%`;
        if (target.kind === 'external') {
          link.href = target.url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.setAttribute('aria-label', 'Open link');
        } else {
          link.href = '#';
          link.setAttribute('aria-label', `Go to page ${pageNum} link`);
          link.addEventListener('click', (e) => {
            e.preventDefault();
            void goToDest(target.dest);
          });
        }
        layer.appendChild(link);
      }
    } catch {
      /* annotations unavailable — the page still renders, just without an overlay */
    }
    return layer;
  }

  /**
   * Render one page into a fresh <canvas> (wrapped so a clickable link overlay can sit over it) sized
   * so a whole spread fits the stage (times the zoom multiplier). `token` guards against a superseded
   * render: a fast reader can flip past a page whose render is still in flight, and the stale result
   * must not paint. Returns the wrapper element (canvas + link layer), or null if superseded.
   */
  async function renderPageCanvas(pageNum, baseScale, token) {
    const page = await state.pdf.getPage(pageNum);
    if (token !== state.renderToken) return null;
    const dpr = window.devicePixelRatio || 1;
    const cssViewport = page.getViewport({ scale: baseScale * state.zoom });
    const canvas = document.createElement('canvas');
    canvas.className = 'bg-fb-page';
    canvas.width = Math.floor(cssViewport.width * dpr);
    canvas.height = Math.floor(cssViewport.height * dpr);
    canvas.style.width = `${Math.floor(cssViewport.width)}px`;
    canvas.style.height = `${Math.floor(cssViewport.height)}px`;
    canvas.setAttribute('aria-label', `Page ${pageNum}`);
    const ctx = canvas.getContext('2d');
    const renderViewport = page.getViewport({ scale: baseScale * state.zoom * dpr });
    await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;
    if (token !== state.renderToken) return null;
    // Wrap the canvas so an absolutely-positioned link overlay can sit over it. The wrapper
    // shrink-wraps the canvas (inline-block), so the scroll view's `max-width` shrink still applies
    // and the percentage-positioned links scale with it.
    const wrap = document.createElement('div');
    wrap.className = 'bg-fb-page-wrap';
    wrap.appendChild(canvas);
    wrap.appendChild(await buildLinkLayer(page, pageNum));
    if (token !== state.renderToken) return null;
    return wrap;
  }

  async function renderFlip() {
    const token = ++state.renderToken;
    el.scrollWrap.hidden = true;
    el.flipWrap.hidden = false;
    const spread = state.spreads[state.spreadIndex];
    if (!spread) return;
    // The lead page of the visible spread is the current page while flipping (kept in sync here so
    // a resize/zoom re-render, which goes through render() rather than goToSpread(), stays correct).
    state.currentPage = spread[0];

    // Fit. Plain reader: the tallest page on the spread fills the height and both pages fit the
    // width. Book style two-up: a fixed pair of document-wide slots (see bookSlot) — the cover sits
    // alone in the right slot, a lone last page in the left, and every page hugs the spine inside
    // its slot — so every spread shares one scale and one geometry, and a turn to or from the cover
    // or a differently sized page never jolts the pages sideways or re-sizes the book.
    const bookSlots = state.bookStyle && state.pagesPerSpread === 2;
    const sizes = await Promise.all(spread.map((p) => pageViewportSize(p)));
    const slot = bookSlots ? await bookSlot() : null;
    if (token !== state.renderToken) return;
    const gap = spread.length > 1 && !state.bookStyle ? 16 : 0;
    const availW = Math.max(120, el.stage.clientWidth - 48);
    const availH = Math.max(120, el.stage.clientHeight - 48);
    const fitW = slot ? 2 * slot.width : sizes.reduce((s, z) => s + z.width, 0) + gap;
    const fitH = slot ? slot.height : Math.max(...sizes.map((z) => z.height));
    const baseScale = Math.min(availW / fitW, availH / fitH);

    const canvases = await Promise.all(spread.map((p) => renderPageCanvas(p, baseScale, token)));
    if (token !== state.renderToken) return;
    let incoming = canvases.filter(Boolean);
    if (slot) {
      const slotW = Math.floor(slot.width * baseScale * state.zoom);
      const slotH = Math.floor(slot.height * baseScale * state.zoom);
      incoming = incoming.map((wrap) => pageSlot(wrap, slotW, slotH));
      if (incoming.length === 1) {
        // Odd pages are right-hand pages (the cover is page 1); an even lone page is a left-hand
        // one. The other half is the closed edge of the book — nothing there — both left of the
        // cover and right of a lone last page. (A paper "inside back cover" leaf used to sit beside
        // the last page; it read as a stray blank final page and was removed by product decision.)
        incoming = spread[0] % 2 === 1
          ? [blankSlot(slotW, slotH), incoming[0]]
          : [incoming[0], blankSlot(slotW, slotH)];
      }
    }
    // A turn still running lands first, so the outgoing spread below is what the reader sees.
    cancelActiveTurn();
    const outgoing = Array.from(el.spread.querySelectorAll(':scope > .bg-fb-slot, :scope > .bg-fb-page-wrap'));
    el.spread.classList.toggle('bg-fb-two-up', bookSlots || spread.length > 1);
    const direction = state.turnDirection;
    state.turnDirection = null;
    const animate = state.bookStyle
      && direction !== null
      && !turnUnavailable
      && !prefersReducedMotion();
    let turning = false;
    if (animate) {
      try {
        turning = beginTurn(outgoing, incoming, direction === 'forward', bookSlots);
      } catch (err) {
        // The animation is an enhancement: a browser without, say, DOMMatrix still pages — and
        // is not asked to build a leaf again on every later turn.
        console.warn('[bg-flipbook] page turn unavailable', err);
        turnUnavailable = true;
        turning = false;
      }
    }
    if (!turning) el.spread.replaceChildren(...incoming);
    // Prefetch the neighbouring spreads' first pages so a flip feels instant (best effort).
    void warmNeighbours(baseScale);
  }

  /** A book slot holding a rendered page; the slot box is fixed, the page hugs the spine inside it. */
  function pageSlot(wrap, width, height) {
    const slot = document.createElement('div');
    slot.className = 'bg-fb-slot';
    slot.style.width = `${width}px`;
    slot.style.height = `${height}px`;
    slot.appendChild(wrap);
    return slot;
  }

  /**
   * An empty book slot: the closed edge of the book, transparent, shown beside a lone cover or a
   * lone last page so the spread always fills its two fixed slots.
   */
  function blankSlot(width, height) {
    const slot = document.createElement('div');
    slot.className = 'bg-fb-slot bg-fb-slot-blank';
    slot.style.width = `${width}px`;
    slot.style.height = `${height}px`;
    return slot;
  }

  // ── Book-style page turn: a sliced curl ────────────────────────────────────────────
  //
  // The turning leaf is a chain of thin vertical strips hinged one on the next, each rotated a few
  // degrees, so the sheet bends like paper instead of pivoting as a flat pane: the free corner
  // lifts first, the bend rolls back to the spine as the page swings, and it lands flat. Every
  // strip carries a front face (a slice of the page turning away) and a back face (the matching
  // slice of the page that lands, mirrored), plus a shade that darkens it by how edge-on it is and
  // paints the resting gutter's darkness onto whatever paper lies in the fold — so the leaf shades
  // exactly like the page it was and the page it becomes, and neither end of the turn pops.
  //
  // The strips are flat siblings placed by absolute matrices, inside a container that only supplies
  // the camera (perspective). Nothing is depth-sorted by the browser: strips paint in DOM order,
  // which is depth order, because a curl only ever rises from the spine outward (curlGeometry keeps
  // height non-decreasing — see its test). Chromium's plane-splitting sorter for nested 3D layers
  // dropped whole strips mid-turn (a bar of bare page showing through the sheet) and flickered
  // hairlines where planes met; painter's order has neither problem.
  //
  // The geometry, shading and slice bookkeeping are the pure helpers in pdf-flipbook-lib.js.
  const TURN_DURATION_MS = 1300;
  const TURN_CURL = 1;
  const TURN_SHADOW = 1;
  /** Camera distance in page widths (tuned at 2800px on a 210px page). */
  const TURN_PERSPECTIVE = 2800 / 210;

  /** @type {null | { finish: () => void }} */
  let activeTurn = null;
  /** Set once a turn failed to build (an engine API this browser lacks); later turns swap outright. */
  let turnUnavailable = false;

  /** Land the turn in flight, if any: final spread in place, leaf gone. */
  function cancelActiveTurn() {
    if (activeTurn) activeTurn.finish();
  }

  function pageCanvasOf(wrap) {
    return wrap ? wrap.querySelector('canvas.bg-fb-page') : null;
  }

  /**
   * A canvas showing `width` CSS px of `source` (a rendered page canvas of `pageW` CSS px) starting
   * at page x `startX`, at the source's own resolution. Faces are built from these rather than from
   * one shared image so each strip is its own small layer with no clipping of a larger picture.
   */
  function sliceCanvas(source, pageW, startX, width, cssHeight) {
    const scale = source.width / pageW;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = source.height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${cssHeight}px`;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(source, startX * scale, 0, width * scale, source.height, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  /**
   * Start a turn from the `outgoing` spread (the wrappers on screen now) to `incoming` (the freshly
   * rendered ones), or return false when it can't be animated — the spread is then swapped outright.
   *
   * Two-up: the leaf is the page on the turning side (right for forward, left for backward), hinged
   * at the spine; its back is the page landing on the far side. The far slot shows its new page
   * under the leaf from the start; the near slot keeps its old page until the leaf lands. Single
   * page: the leaf is hinged at the page's left edge with plain paper on its back; a forward turn
   * peels the page away over the next one, and a backward turn is the same motion in reverse — the
   * previous page unfolding back over the current one.
   */
  function beginTurn(outgoing, incoming, forward, twoUp) {
    if (outgoing.length !== incoming.length || incoming.length === 0) return false;
    // Who plays what, and which way the geometry runs: see planTurn() (pure, unit-tested — a
    // two-up backward turn runs its own left-to-right geometry and is never run in reverse; only
    // a single-page backward turn replays the forward geometry backwards).
    const plan = planTurn(twoUp, forward);
    const slotOf = (ref) => (ref.from === 'outgoing' ? outgoing : incoming)[ref.index];
    const front = pageCanvasOf(slotOf(plan.front));
    const back = plan.back ? pageCanvasOf(slotOf(plan.back)) : null;
    const during = plan.during.map(slotOf);
    const { geomForward, reverse } = plan;
    if (!front) return false;
    const pageW = parseFloat(front.style.width);
    const pageH = parseFloat(front.style.height);
    if (!(pageW > 0) || !(pageH > 0)) return false;
    // The leaf is modelled as a sheet the size of the slot, hinged at the spine. A page that does
    // not fill its slot (a smaller cover, an inserted source page of another size) is swapped
    // outright rather than animated as if it were slot-sized; the fixed slots still hold the layout.
    const fills = (canvas) => {
      if (!canvas) return false;
      const box = twoUp ? outgoing[0] : canvas;
      return Math.abs(parseFloat(canvas.style.width) - parseFloat(box.style.width)) <= 1
        && Math.abs(parseFloat(canvas.style.height) - parseFloat(box.style.height)) <= 1;
    };
    if (!fills(front) || (back && !fills(back))) return false;

    const hingeX = twoUp ? pageW : 0;
    const count = curlStripCount(pageW);
    const leaf = document.createElement('div');
    leaf.className = 'bg-fb-leaf';
    leaf.style.perspective = `${Math.round(TURN_PERSPECTIVE * pageW)}px`;
    const cast = document.createElement('div');
    cast.className = 'bg-fb-cast';
    cast.style.width = `${pageW}px`;
    // The contact shadow falls on the page the sheet sweeps over: the far slot. Left of the cover
    // there is no page to catch it, so a turn to or from the cover casts nothing there.
    cast.style.left = `${twoUp && !forward ? pageW : 0}px`;
    const farSlot = during[plan.far];
    // A blank far slot is the closed edge of the book (no page to catch the sheet's shadow), so a
    // turn to or from the cover or a lone last page casts nothing there.
    if (farSlot.classList.contains('bg-fb-slot-blank')) {
      cast.hidden = true;
    }
    leaf.appendChild(cast);
    const strips = [];
    const faces = [];
    const shades = [];
    const hingeInsets = [];
    for (let i = 0; i < count; i++) {
      const slice = leafSlice(i, count, pageW, geomForward);
      hingeInsets.push(slice.hingeInset);
      const strip = document.createElement('div');
      strip.className = 'bg-fb-strip';
      strip.style.width = `${slice.stripWidth}px`;
      strip.style.height = `${pageH}px`;
      const makeFace = (kind, source, startX) => {
        const face = document.createElement('div');
        face.className = `bg-fb-face bg-fb-face-${kind}${source ? '' : ' is-paper'}`;
        face.style.left = `${slice.faceLeft}px`;
        face.style.width = `${slice.faceWidth}px`;
        if (source) face.appendChild(sliceCanvas(source, pageW, startX, slice.faceWidth, pageH));
        const shade = document.createElement('div');
        shade.className = 'bg-fb-face-shade';
        face.appendChild(shade);
        strip.appendChild(face);
        return [face, shade];
      };
      const [frontFace, frontShade] = makeFace('front', front, slice.frontStart);
      const [backFace, backShade] = makeFace('back', back, slice.backStart);
      faces.push([frontFace, backFace]);
      shades.push([frontShade, backShade]);
      strips.push(strip);
      leaf.appendChild(strip); // DOM order = paint order = depth order along the curl
    }

    const turn = {
      count,
      pageW,
      pageH,
      hingeX,
      sign: geomForward ? -1 : 1,
      geomForward,
      twoUp,
      reverse,
      strips,
      faces,
      shades,
      hingeInsets,
      cast,
      raf: 0,
      finish: () => {},
    };
    turn.finish = () => {
      window.cancelAnimationFrame(turn.raf);
      leaf.remove();
      el.spread.replaceChildren(...incoming);
      if (activeTurn === turn) activeTurn = null;
    };
    // First frame before anything is on screen or registered: if the engine throws here, the
    // spread is untouched and no half-built turn is left for cancelActiveTurn to land.
    paintTurn(turn, 0);
    el.spread.replaceChildren(...during, leaf);
    activeTurn = turn;
    const startedAt = performance.now();
    const frame = (now) => {
      const t = Math.min(1, (now - startedAt) / TURN_DURATION_MS);
      const eased = paintTurn(turn, t);
      // Hand off as soon as the sheet is flat (the remaining frames are visually static).
      const flat = turn.reverse ? eased <= 0.003 : eased >= 0.997;
      if (t < 1 && !flat) {
        turn.raf = window.requestAnimationFrame(frame);
        return;
      }
      // Land on the next frame: the leaf is then removed in the same paint as the final spread
      // appears, so the swap is invisible.
      turn.raf = window.requestAnimationFrame(() => turn.finish());
    };
    turn.raf = window.requestAnimationFrame(frame);
    return true;
  }

  /** Paint the turn at moment t ∈ [0,1]. A pure function of t. Returns the eased progress. */
  function paintTurn(turn, t) {
    const { count, pageW, sign, geomForward, twoUp, strips, faces, shades, cast } = turn;
    const tt = turn.reverse ? 1 - t : t;
    const g = curlGeometry(count, tt, TURN_CURL);
    const w = pageW / count;
    const hw = w / 2;
    const fw = 1 / count; // strip width in page-width units (what curlGeometry works in)
    let M = new DOMMatrix().translate(turn.hingeX, 0, 0);
    for (let i = 0; i < count; i++) {
      // Place the strip: hinge on the previous strip's outer edge, rotated by its own share.
      // Forward strips extend right of their hinge, backward strips extend left of theirs.
      M = M.rotateAxisAngle(0, 1, 0, sign * g.share[i]);
      const Mi = geomForward ? M : M.translate(-w, 0, 0);
      strips[i].style.transform = Mi.toString();
      M = geomForward ? M.translate(w, 0, 0) : Mi;
      // Past edge-on the sheet shows its other side.
      const showBack = g.angle[i] > 90;
      faces[i][0].style.visibility = showBack ? 'hidden' : 'visible';
      faces[i][1].style.visibility = showBack ? 'visible' : 'hidden';
      // Shade by the strip's own surface angle, blending at the hinges so neighbours meet
      // smoothly. Distance from the spine and height above the page are read at the strip's hinge,
      // middle and outer edge.
      const ang = g.angle[i];
      const aIn = i === 0 ? ang : (g.angle[i - 1] + ang) / 2;
      const aOut = i === count - 1 ? ang : (ang + g.angle[i + 1]) / 2;
      const r = (ang * Math.PI) / 180;
      const cosA = Math.cos(r);
      const sinA = Math.sin(r);
      const at = (deg, along) => curlShadeAlpha(
        deg,
        g.posIn[i] + along * fw * cosA,
        g.height[i] + along * fw * sinA,
        TURN_SHADOW,
        twoUp,
      );
      const a0 = at(aIn, 0).toFixed(3);
      const am = at(ang, 0.5).toFixed(3);
      const a1 = at(aOut, 1).toFixed(3);
      // The spine-side stop sits where the hinge is (past the face's inward reach); the outward
      // overhang past the last stop keeps the outer-edge value. The gradient direction and the
      // back face's mirroring keep the hinge side at the start.
      const o = turn.hingeInsets[i];
      const grad = (deg) => `linear-gradient(${deg}deg, rgba(0,0,0,${a0}) ${o}px, rgba(0,0,0,${am}) ${hw + o}px, rgba(0,0,0,${a1}) ${w + o}px, rgba(0,0,0,${a1}) 100%)`;
      shades[i][0].style.background = grad(geomForward ? 90 : 270);
      shades[i][1].style.background = grad(geomForward ? 270 : 90);
    }
    // Contact shadow on the page the sheet sweeps over, tracking the sheet across it. Built as a
    // whole string (not a CSS variable inside the gradient, which WebKit rejects).
    const castX = geomForward ? 100 - 72 * g.eased : 72 * g.eased;
    cast.style.background = `radial-gradient(130% 90% at ${castX.toFixed(1)}% 50%, rgba(0,0,0,${(0.42 * TURN_SHADOW).toFixed(2)}), rgba(0,0,0,0) 70%)`;
    cast.style.opacity = (0.5 * Math.sin(Math.PI * tt)).toFixed(3);
    return g.eased;
  }

  function warmNeighbours(baseScale) {
    const around = [state.spreadIndex - 1, state.spreadIndex + 1];
    around.forEach((idx) => {
      const spread = state.spreads[idx];
      if (!spread) return;
      spread.forEach((p) => {
        state.pdf
          .getPage(p)
          .then((page) => page.getViewport({ scale: baseScale }))
          .catch(() => {});
      });
    });
  }

  async function renderScroll() {
    const token = ++state.renderToken;
    el.flipWrap.hidden = true;
    el.scrollWrap.hidden = false;
    el.scrollPages.innerHTML = '';

    const availW = Math.max(120, el.stage.clientWidth - 48);
    const availH = Math.max(120, el.stage.clientHeight - 48);
    for (let p = 1; p <= state.pageCount; p++) {
      const size = await pageViewportSize(p);
      if (token !== state.renderToken) return;
      // Fit the WHOLE page in the stage at 100% zoom (like flip mode) rather than filling the
      // width: a portrait page then reads top-to-bottom in view with room on the sides, and the
      // reader zooms in when they want it bigger. Height bounds a portrait page, width a landscape.
      const baseScale = fitPageScale(availW, availH, size.width, size.height);
      const slot = document.createElement('div');
      slot.className = 'bg-fb-scroll-slot';
      slot.setAttribute('data-scroll-page', String(p));
      slot.style.minHeight = `${Math.floor(size.height * baseScale * state.zoom)}px`;
      el.scrollPages.appendChild(slot);
      observeScrollSlot(slot, p, baseScale);
    }
    if (token !== state.renderToken) return;
    // Preserve reading position across a flip→scroll toggle (or a zoom re-layout): jump the
    // continuous view to the page that was current, without a smooth animation.
    const anchor = el.scrollPages.querySelector(`[data-scroll-page="${state.currentPage}"]`);
    if (anchor) anchor.scrollIntoView({ block: 'start' });
  }

  let scrollObserver = null;
  function observeScrollSlot(slot, pageNum, baseScale) {
    if (!scrollObserver) {
      scrollObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const node = /** @type {HTMLElement} */ (entry.target);
            if (entry.isIntersecting && !node.dataset.rendered) {
              node.dataset.rendered = '1';
              const p = Number(node.dataset.scrollPage);
              const bs = Number(node.dataset.baseScale);
              renderPageCanvas(p, bs, state.renderToken).then((c) => {
                if (c) {
                  node.innerHTML = '';
                  node.appendChild(c);
                }
              });
            }
          });
        },
        // rootMargin pre-renders slots just before they scroll in. Current-page tracking is NOT
        // done here: an intersection-ratio threshold can never be met by a page taller than the
        // viewport (a width-fitted portrait page, more so when zoomed), so the page indicator would
        // stick. updateScrollCurrentPage() picks the page nearest the viewport centre instead.
        { root: el.stage, rootMargin: '200px 0px' },
      );
    }
    slot.dataset.baseScale = String(baseScale);
    scrollObserver.observe(slot);
  }

  /** In scroll mode, the current page is the one whose centre is nearest the viewport centre. */
  function updateScrollCurrentPage() {
    if (state.viewMode !== 'scroll' || !el.scrollPages) return;
    const stageRect = el.stage.getBoundingClientRect();
    const center = stageRect.top + stageRect.height / 2;
    const pages = [];
    el.scrollPages.querySelectorAll('[data-scroll-page]').forEach((node) => {
      const r = node.getBoundingClientRect();
      pages.push({ page: Number(node.getAttribute('data-scroll-page')), top: r.top, bottom: r.bottom });
    });
    const page = nearestPageToCenter(pages, center);
    if (page === null) return;
    // A programmatic goToPage() is still animating toward its target: keep currentPage pinned to
    // the target and emit nothing until the scroll arrives there. Reporting an intermediate page
    // now would look like the reader navigating away and stop a driver mid-walkthrough.
    if (state.scrollTargetPage !== null) {
      if (page !== state.scrollTargetPage) return;
      window.clearTimeout(scrollSettleTimer);
      state.scrollTargetPage = null;
    }
    if (page !== state.currentPage) {
      state.currentPage = page;
      state.spreadIndex = spreadIndexForPage(page);
      syncControls();
      highlightActive();
    }
  }

  // ── Sidebar: Sections (table of contents) ─────────────────────────────────────────
  /**
   * Start GET /outline immediately (see boot) and store a promise loadOutline awaits. It always
   * SETTLES to `{ ok, body?, err? }` rather than rejecting, so if the PDF fails to load and
   * loadOutline is never reached, the in-flight request can't surface as an unhandled rejection.
   */
  function startOutlineFetch() {
    state.outlineFetch = fetch(cfg.outlineUrl, { credentials: 'omit' })
      .then((res) => {
        if (!res.ok) throw new Error(`outline ${res.status}`);
        return res.json();
      })
      .then(
        (body) => ({ ok: true, body }),
        (err) => ({ ok: false, err }),
      );
  }

  async function loadOutline() {
    const result = await state.outlineFetch;
    if (result && result.ok) {
      const body = result.body;
      state.outline = Array.isArray(body && body.sections) ? body.sections : [];
    } else {
      console.warn('[bg-flipbook] outline unavailable', result && result.err);
      state.outline = [];
    }
    renderSectionsSidebar();
  }

  function renderSectionsSidebar() {
    // Drop structural cover/TOC/back-cover entries — they're noise in a table of contents.
    const sections = state.outline.filter((s) => !(s.group && STRUCTURAL_GROUPS.has(s.group)));
    const hasOutline = sections.length > 0;
    // Without a usable table of contents the TOC tab is pointless — hide it and fall to Pages.
    el.tabSections.hidden = !hasOutline;
    if (!hasOutline && state.sidebarTab === 'sections') {
      state.sidebarTab = 'pages';
      syncTabs();
    }
    el.sectionsList.innerHTML = '';
    sections.forEach((section) => {
      const label = section.label && section.label.trim() ? section.label : humanizeKey(section.group || 'Section');
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'bg-fb-toc-item';
      item.setAttribute('data-page', String(section.page));
      item.innerHTML = `<span class="bg-fb-toc-label"></span><span class="bg-fb-toc-page"></span>`;
      item.querySelector('.bg-fb-toc-label').textContent = label;
      item.querySelector('.bg-fb-toc-page').textContent = String(section.page);
      item.addEventListener('click', () => {
        goToPage(section.page);
        maybeCloseSidebarOnMobile();
      });
      el.sectionsList.appendChild(item);
    });
  }

  // ── Sidebar: Pages (thumbnails) ─────────────────────────────────────────────────
  let thumbObserver = null;
  function renderPagesSidebar() {
    el.pagesList.innerHTML = '';
    if (!thumbObserver) {
      thumbObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const holder = /** @type {HTMLElement} */ (entry.target);
            if (holder.dataset.rendered) return;
            holder.dataset.rendered = '1';
            renderThumb(Number(holder.dataset.page), holder);
          });
        },
        { root: el.pagesList, rootMargin: '200px' },
      );
    }
    for (let p = 1; p <= state.pageCount; p++) {
      const holder = document.createElement('button');
      holder.type = 'button';
      holder.className = 'bg-fb-thumb';
      holder.setAttribute('data-page', String(p));
      holder.innerHTML = `<div class="bg-fb-thumb-canvas"></div><span class="bg-fb-thumb-num">${p}</span>`;
      holder.addEventListener('click', () => {
        goToPage(p);
        maybeCloseSidebarOnMobile();
      });
      el.pagesList.appendChild(holder);
      thumbObserver.observe(holder);
    }
  }

  async function renderThumb(pageNum, holder) {
    try {
      const page = await state.pdf.getPage(pageNum);
      const size = await pageViewportSize(pageNum);
      const scale = 150 / size.width;
      const dpr = window.devicePixelRatio || 1;
      const vp = page.getViewport({ scale: scale * dpr });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
      const target = holder.querySelector('.bg-fb-thumb-canvas');
      if (target) {
        target.innerHTML = '';
        target.appendChild(canvas);
      }
    } catch {
      /* a single thumbnail failing must not break the list */
    }
  }

  // ── Active-item highlighting ─────────────────────────────────────────────────────
  function highlightActive() {
    // Flip mode highlights both pages of the visible spread; scroll mode highlights exactly the
    // one page centred in the viewport.
    const active = state.viewMode === 'scroll'
      ? new Set([state.currentPage])
      : new Set(state.spreads[state.spreadIndex] || [state.currentPage]);
    el.pagesList.querySelectorAll('.bg-fb-thumb').forEach((node) => {
      node.classList.toggle('is-active', active.has(Number(node.getAttribute('data-page'))));
    });
    // Treat both pages in a book spread as visible. This selects a TOC entry beginning on the
    // right-hand page immediately, instead of skipping it because currentPage names the left page.
    const tocItems = Array.from(el.sectionsList.querySelectorAll('.bg-fb-toc-item'));
    const activeIndex = activeTocIndex(
      tocItems.map((node) => ({ page: Number(node.getAttribute('data-page')) })),
      Array.from(active),
    );
    tocItems.forEach((node, index) => {
      node.classList.remove('is-active');
      if (index === activeIndex) node.classList.add('is-active');
    });
  }

  // ── Page broadcast (for the narration widget) ──────────────────────────────────────
  /**
   * The ONLY channel the viewer exposes to an injected widget: a window CustomEvent naming the
   * current page, the pages actually visible (a two-up spread shows two), and the page count.
   * Kept an event rather than a global object so the widget can never reach into viewer state —
   * and so the viewer stays usable with no widget on the page at all. Emitted from syncControls,
   * which every navigation, re-render and scroll-tracking update already funnels through.
   */
  function emitPageEvent() {
    var pages = state.viewMode === 'scroll'
      ? [state.currentPage]
      : (state.spreads[state.spreadIndex] || [state.currentPage]).slice();
    try {
      window.dispatchEvent(new CustomEvent('bg-flipbook:page', {
        detail: { page: state.currentPage, pages: pages, pageCount: state.pageCount },
      }));
    } catch (_err) { /* a browser without CustomEvent just gets no narration widget */ }
  }

  // ── Control bar sync ──────────────────────────────────────────────────────────────
  function syncControls() {
    el.pageInput.value = String(state.currentPage);
    el.pageTotal.textContent = `/ ${state.pageCount}`;
    el.zoomLabel.textContent = `${Math.round(state.zoom * 100)}%`;
    // Previous/Next bound to the current page in scroll mode, the current spread in flip mode.
    el.prevBtn.disabled = state.viewMode === 'scroll' ? state.currentPage <= 1 : state.spreadIndex <= 0;
    el.nextBtn.disabled = state.viewMode === 'scroll'
      ? state.currentPage >= state.pageCount
      : state.spreadIndex >= state.spreads.length - 1;
    // Reading-mode switch: the active segment is aria-pressed and highlighted (CSS), the others not.
    const active = currentDisplayMode();
    el.modeSlides.setAttribute('aria-pressed', active === 'slides' ? 'true' : 'false');
    el.modeFlipbook.setAttribute('aria-pressed', active === 'flipbook' ? 'true' : 'false');
    el.modeScroll.setAttribute('aria-pressed', active === 'scroll' ? 'true' : 'false');
    emitPageEvent();
  }

  function syncTabs() {
    const onSections = state.sidebarTab === 'sections';
    el.tabSections.classList.toggle('is-active', onSections);
    el.tabPages.classList.toggle('is-active', !onSections);
    el.sectionsPane.hidden = !onSections;
    el.pagesPane.hidden = onSections;
  }

  // ── View-mode switch ────────────────────────────────────────────────────────────
  /**
   * Select one of the three topbar modes. Slides and Flipbook both page in flip mode and differ only
   * in bookStyle (the curling page-turn animation + two-slot book layout); Scroll is continuous. The
   * choice is remembered per visitor. Switching Slides ⇄ Flipbook keeps viewMode 'flip' but re-renders
   * so the spread re-lays-out into (or out of) the book slots.
   */
  function setDisplayMode(mode) {
    const next = normalizeDisplayMode(mode);
    if (next === currentDisplayMode()) return; // already selected — nothing to do.
    state.viewMode = next === 'scroll' ? 'scroll' : 'flip';
    state.bookStyle = next === 'flipbook';
    if (state.bookStyle) preparePageTurnSound(); // fetch the page-turn clip the first time it's needed.
    storeDisplayModePreference(window, cfg.pdfUrl, next);
    // Keep the reader on the same page across the switch: entering flip mode, land on the spread
    // that holds the current page (renderScroll re-anchors to currentPage on the way in).
    if (state.viewMode === 'flip') state.spreadIndex = spreadIndexForPage(state.currentPage);
    render();
  }

  function setSidebarOpen(open) {
    state.sidebarOpen = open;
    el.root.classList.toggle('bg-fb-sidebar-open', open);
    el.menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function maybeCloseSidebarOnMobile() {
    if (window.matchMedia('(max-width: 760px)').matches) setSidebarOpen(false);
  }

  // ── Input handling: keyboard, wheel, swipe, resize ─────────────────────────────────
  function attachInputHandlers() {
    document.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          if (state.viewMode === 'flip') {
            nextSpread();
            e.preventDefault();
          }
          break;
        case 'ArrowLeft':
        case 'PageUp':
          if (state.viewMode === 'flip') {
            prevSpread();
            e.preventDefault();
          }
          break;
        case 'Home':
          goToPage(1);
          e.preventDefault();
          break;
        case 'End':
          goToPage(state.pageCount);
          e.preventDefault();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        default:
          break;
      }
    });

    // Wheel: in flip mode a scroll gesture flips pages (the requested behaviour). Ctrl/⌘+wheel
    // zooms in both modes. In scroll mode a bare wheel scrolls natively (no interception).
    let wheelAccum = 0;
    let wheelResetTimer = 0;
    el.stage.addEventListener(
      'wheel',
      (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (e.deltaY < 0) zoomIn();
          else zoomOut();
          return;
        }
        if (state.viewMode !== 'flip') return;
        e.preventDefault();
        wheelAccum += e.deltaY;
        window.clearTimeout(wheelResetTimer);
        wheelResetTimer = window.setTimeout(() => {
          wheelAccum = 0;
        }, 200);
        if (wheelAccum <= -WHEEL_FLIP_THRESHOLD) {
          prevSpread();
          wheelAccum = 0;
        } else if (wheelAccum >= WHEEL_FLIP_THRESHOLD) {
          nextSpread();
          wheelAccum = 0;
        }
      },
      { passive: false },
    );

    // Touch swipe → flip (flip mode only).
    let touchX = 0;
    let touchY = 0;
    el.stage.addEventListener(
      'touchstart',
      (e) => {
        touchX = e.changedTouches[0].clientX;
        touchY = e.changedTouches[0].clientY;
      },
      { passive: true },
    );
    el.stage.addEventListener(
      'touchend',
      (e) => {
        if (state.viewMode !== 'flip') return;
        const dx = e.changedTouches[0].clientX - touchX;
        const dy = e.changedTouches[0].clientY - touchY;
        if (Math.abs(dx) < SWIPE_FLIP_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
        if (dx < 0) nextSpread();
        else prevSpread();
      },
      { passive: true },
    );

    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const priorPage = state.currentPage;
        recomputeSpreads();
        state.spreadIndex = spreadIndexForPage(priorPage);
        render();
      }, 150);
    });

    // Continuous-scroll current-page tracking (rAF-throttled). See updateScrollCurrentPage.
    let scrollRaf = 0;
    el.stage.addEventListener(
      'scroll',
      () => {
        if (state.viewMode !== 'scroll' || scrollRaf) return;
        scrollRaf = window.requestAnimationFrame(() => {
          scrollRaf = 0;
          updateScrollCurrentPage();
        });
      },
      { passive: true },
    );

    // A trusted reader scroll gesture breaks any programmatic-scroll pin at once, so the reader can
    // always take over — even mid-animation. Once released, the scroll tracker reports their actual
    // page (which a driver like the narration widget reads as "the reader navigated" and stops).
    // A programmatic scrollIntoView never dispatches these events, so an auto-advance is untouched.
    const releaseScrollPin = () => {
      if (state.scrollTargetPage === null) return;
      window.clearTimeout(scrollSettleTimer);
      state.scrollTargetPage = null;
    };
    el.stage.addEventListener('wheel', releaseScrollPin, { passive: true });
    el.stage.addEventListener('touchstart', releaseScrollPin, { passive: true });
    el.stage.addEventListener('pointerdown', releaseScrollPin, { passive: true });
    // The stage is focusable and keeps native keyboard scrolling in scroll mode (Arrow Up/Down,
    // Page Up/Down, Space) — that is the reader taking over too, so release the pin for those keys.
    // Home/End are not here: they go through goToPage(), which sets its own pin toward the target.
    el.stage.addEventListener('keydown', (e) => {
      if (state.scrollTargetPage === null) return;
      const k = e.key;
      if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'PageDown' || k === 'PageUp'
          || k === ' ' || k === 'Spacebar') {
        releaseScrollPin();
      }
    }, { passive: true });
  }

  // ── Chrome construction ────────────────────────────────────────────────────────────
  function buildChrome() {
    const root = document.getElementById('bg-flipbook-root') || document.body;
    root.classList.add('bg-fb-root');
    // The bg-fb-book-style class is applied by render() so it tracks the live Slides ⇄ Flipbook state.
    // Reserve toolbar space on the right only when the server injected the language <select>.
    if (cfg.hasLanguageSwitcher) root.classList.add('bg-fb-has-lang');
    root.innerHTML = `
      <div class="bg-fb-toolbar" role="toolbar" aria-label="Guide controls">
        <div class="bg-fb-toolbar-left">
          <button type="button" class="bg-fb-btn bg-fb-menu" aria-label="Toggle menu" aria-expanded="false" title="Menu">☰</button>
        </div>
        <div class="bg-fb-toolbar-center">
          <button type="button" class="bg-fb-btn bg-fb-prev" aria-label="Previous">‹</button>
          <span class="bg-fb-pagebox">
            <input class="bg-fb-page-input" type="text" inputmode="numeric" aria-label="Page number" value="1" />
            <span class="bg-fb-page-total">/ 0</span>
          </span>
          <button type="button" class="bg-fb-btn bg-fb-next" aria-label="Next">›</button>
        </div>
        <div class="bg-fb-toolbar-right">
          <button type="button" class="bg-fb-btn bg-fb-zoom-out" aria-label="Zoom out" title="Zoom out">−</button>
          <button type="button" class="bg-fb-btn bg-fb-zoom-label" aria-label="Reset zoom" title="Reset zoom">100%</button>
          <button type="button" class="bg-fb-btn bg-fb-zoom-in" aria-label="Zoom in" title="Zoom in">+</button>
          <div class="bg-fb-mode" role="group" aria-label="Reading mode">
            <button type="button" class="bg-fb-mode-opt bg-fb-mode-slides" data-testid="bg-fb-mode-slides" aria-pressed="true" aria-label="Read one page at a time — slides" title="Slides">${ICON_SLIDES}<span class="bg-fb-mode-label">Slides</span></button>
            <button type="button" class="bg-fb-mode-opt bg-fb-mode-flipbook" data-testid="bg-fb-mode-flipbook" aria-pressed="false" aria-label="Read as a book with page-turn animation — flipbook" title="Flipbook">${ICON_FLIP}<span class="bg-fb-mode-label">Flipbook</span></button>
            <button type="button" class="bg-fb-mode-opt bg-fb-mode-scroll" data-testid="bg-fb-mode-scroll" aria-pressed="false" aria-label="Read as one continuous scroll of every page" title="Pages">${ICON_SCROLL}<span class="bg-fb-mode-label">Pages</span></button>
          </div>
          <button type="button" class="bg-fb-btn bg-fb-download" aria-label="Download PDF" title="Download PDF">${ICON_DOWNLOAD}<span class="bg-fb-download-label">Download</span></button>
        </div>
      </div>
      <div class="bg-fb-body">
        <aside class="bg-fb-sidebar" aria-label="Guide navigation">
          <div class="bg-fb-tabs" role="tablist">
            <button type="button" class="bg-fb-tab bg-fb-tab-sections is-active" role="tab">Table of Contents</button>
            <button type="button" class="bg-fb-tab bg-fb-tab-pages" role="tab">Pages</button>
          </div>
          <div class="bg-fb-pane bg-fb-sections-pane">
            <div class="bg-fb-sections-list"></div>
          </div>
          <div class="bg-fb-pane bg-fb-pages-pane" hidden>
            <div class="bg-fb-pages-list"></div>
          </div>
        </aside>
        <div class="bg-fb-stage" tabindex="0">
          <button type="button" class="bg-fb-nav bg-fb-nav-prev" aria-label="Previous page">‹</button>
          <div class="bg-fb-flip-wrap">
            <div class="bg-fb-spread"></div>
          </div>
          <div class="bg-fb-scroll-wrap" hidden>
            <div class="bg-fb-scroll-pages"></div>
          </div>
          <button type="button" class="bg-fb-nav bg-fb-nav-next" aria-label="Next page">›</button>
          <div class="bg-fb-status" hidden></div>
        </div>
      </div>`;

    el.root = root;
    el.menuBtn = root.querySelector('.bg-fb-menu');
    el.prevBtn = root.querySelector('.bg-fb-prev');
    el.nextBtn = root.querySelector('.bg-fb-next');
    el.pageInput = root.querySelector('.bg-fb-page-input');
    el.pageTotal = root.querySelector('.bg-fb-page-total');
    el.zoomOut = root.querySelector('.bg-fb-zoom-out');
    el.zoomIn = root.querySelector('.bg-fb-zoom-in');
    el.zoomLabel = root.querySelector('.bg-fb-zoom-label');
    el.modeSlides = root.querySelector('.bg-fb-mode-slides');
    el.modeFlipbook = root.querySelector('.bg-fb-mode-flipbook');
    el.modeScroll = root.querySelector('.bg-fb-mode-scroll');
    el.downloadBtn = root.querySelector('.bg-fb-download');
    el.tabSections = root.querySelector('.bg-fb-tab-sections');
    el.tabPages = root.querySelector('.bg-fb-tab-pages');
    el.sectionsPane = root.querySelector('.bg-fb-sections-pane');
    el.pagesPane = root.querySelector('.bg-fb-pages-pane');
    el.sectionsList = root.querySelector('.bg-fb-sections-list');
    el.pagesList = root.querySelector('.bg-fb-pages-list');
    el.stage = root.querySelector('.bg-fb-stage');
    el.flipWrap = root.querySelector('.bg-fb-flip-wrap');
    el.spread = root.querySelector('.bg-fb-spread');
    el.scrollWrap = root.querySelector('.bg-fb-scroll-wrap');
    el.scrollPages = root.querySelector('.bg-fb-scroll-pages');
    el.navPrev = root.querySelector('.bg-fb-nav-prev');
    el.navNext = root.querySelector('.bg-fb-nav-next');
    el.status = root.querySelector('.bg-fb-status');

    el.menuBtn.addEventListener('click', () => setSidebarOpen(!state.sidebarOpen));
    // Prev/Next steps a page in scroll mode, a spread in flip mode. The on-stage arrows are hidden
    // in scroll mode by CSS, but they use the SAME mode-aware handlers so that even if a browser
    // leaves them visible, a click still steps one page (never a spread) in scroll mode.
    el.prevBtn.addEventListener('click', stepBackward);
    el.nextBtn.addEventListener('click', stepForward);
    el.navPrev.addEventListener('click', stepBackward);
    el.navNext.addEventListener('click', stepForward);
    el.zoomOut.addEventListener('click', zoomOut);
    el.zoomIn.addEventListener('click', zoomIn);
    el.zoomLabel.addEventListener('click', zoomReset);
    // Each segment selects its mode directly (not a toggle), so the switch always shows all three
    // options with the active one highlighted — clicking the one you're already in is a no-op.
    el.modeSlides.addEventListener('click', () => setDisplayMode('slides'));
    el.modeFlipbook.addEventListener('click', () => setDisplayMode('flipbook'));
    el.modeScroll.addEventListener('click', () => setDisplayMode('scroll'));
    el.downloadBtn.addEventListener('click', downloadPdf);
    el.tabSections.addEventListener('click', () => {
      state.sidebarTab = 'sections';
      syncTabs();
    });
    el.tabPages.addEventListener('click', () => {
      state.sidebarTab = 'pages';
      syncTabs();
    });
    el.pageInput.addEventListener('change', () => {
      const n = parseInt(el.pageInput.value, 10);
      if (Number.isFinite(n)) goToPage(n);
      else syncControls();
    });
    el.pageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') el.pageInput.blur();
    });

    // The narration widget drives the reader with this event; it never calls into the viewer.
    window.addEventListener('bg-flipbook:goto', (e) => {
      const page = e && e.detail && Number(e.detail.page);
      if (Number.isFinite(page)) goToPage(page);
    });

    // Default the sidebar open on wide screens, collapsed on narrow ones.
    setSidebarOpen(!window.matchMedia('(max-width: 760px)').matches);
    syncTabs();
    attachInputHandlers();
  }

  async function downloadPdf() {
    // A sales demo's draft hands the download to the demo page, which asks a signed-out visitor
    // to sign in first. The viewer runs in that page's frame, so it navigates the top window.
    if (cfg.downloadHref) {
      window.open(cfg.downloadHref, '_top');
      return;
    }
    try {
      // `cache: 'no-store'` forces a fresh 200 rather than a conditional request the server can
      // answer with a 304 — a 304 carries the CACHED response's Content-Disposition, so after an
      // account rename filenameFromResponse() below would read the stale name off the revalidated
      // cache entry. A fresh 200 always carries the live filename.
      const res = await fetch(cfg.pdfUrl, { credentials: 'omit', cache: 'no-store' });
      // /p/:slug/pdf returns a JSON/HTML error body on 404/502 — saving that as guide.pdf would
      // hand the reader a broken file. Only blob-download a successful response; otherwise fall
      // back to a plain navigation so the browser surfaces the real error (or a later success).
      if (!isSuccessfulPdfResponse(res)) {
        window.open(cfg.pdfUrl, '_blank', 'noopener');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Save name comes from the PDF RESPONSE's Content-Disposition (the standardized
      // <account-slug>-guide-<MM-DD-YYYY>.pdf), read at click time — so it always reflects the LIVE
      // account name and today's date, even in a reader tab left open across a rename or a day
      // rollover. Falls back to the title only if the header is somehow absent.
      a.download = filenameFromResponse(res) || filenameFromTitle();
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      // Network error: fall back to a plain navigation the browser can still turn into a download.
      window.open(cfg.pdfUrl, '_blank', 'noopener');
    }
  }

  function filenameFromTitle() {
    const base = (cfg.title || 'benefits-guide').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
    return `${base || 'benefits-guide'}.pdf`;
  }

  // Parse the download name out of the PDF response's Content-Disposition header, honoring both
  // quoted (filename="x.pdf") and bare (filename=x.pdf) forms. Returns null when the header is
  // absent or carries no name, so the caller can fall back to the title.
  function filenameFromResponse(res) {
    const disposition = (res && res.headers && res.headers.get('content-disposition')) || '';
    const match = /filename[^;=\n]*=(?:(\\?['"])(.*?)\1|([^;\n]*))/i.exec(disposition);
    const name = ((match && (match[2] || match[3])) || '').trim();
    return name || null;
  }

  // ── Status / helpers ────────────────────────────────────────────────────────────
  function setStatus(html, isError) {
    if (!el.status) return;
    el.status.innerHTML = html;
    el.status.hidden = false;
    el.status.classList.toggle('is-error', Boolean(isError));
  }
  function clearStatus() {
    if (el.status) el.status.hidden = true;
  }
  function escapeAttr(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
