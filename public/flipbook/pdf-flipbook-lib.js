/*
 * Pure, framework-free helpers for the published PDF flipbook viewer.
 *
 * Split out of pdf-flipbook.js so the navigation/download decision logic can be unit-tested in
 * Node (no browser, no pdf.js) — see pdf-flipbook-lib.test.ts. pdf-flipbook.js imports these; the
 * server serves this file next to it (/public/pdf-flipbook-lib.js).
 */

/**
 * Keep a reader's mode choice local to one published guide (and language). A single global key
 * lets a mode chosen on one guide override every other guide author's configured default.
 * @param {string} pdfUrl
 * @returns {string}
 */
export function displayModeStorageKey(pdfUrl) {
  const url = new URL(pdfUrl, 'https://published.invalid');
  return `bg-flipbook-displaymode:${url.pathname}${url.search}`;
}

const PUBLISHED_DISPLAY_MODES = ['slides', 'flipbook', 'scroll'];

/**
 * Resolve the mode for one published link. Storage access stays inside the try because some browser
 * privacy modes throw while reading the localStorage property itself.
 * @param {{ localStorage?: { getItem(key: string): string | null } }} browser
 * @param {string} pdfUrl
 * @param {unknown} configuredMode
 * @returns {'slides' | 'flipbook' | 'scroll'}
 */
export function resolveInitialDisplayMode(browser, pdfUrl, configuredMode) {
  try {
    const stored = browser.localStorage?.getItem(displayModeStorageKey(pdfUrl));
    if (PUBLISHED_DISPLAY_MODES.includes(stored)) return stored;
  } catch {
    // The viewer still follows the published default when storage is unavailable.
  }
  return PUBLISHED_DISPLAY_MODES.includes(configuredMode) ? configuredMode : 'slides';
}

/**
 * Remember a reader's explicit mode for this published link without making storage availability a
 * requirement for using the viewer.
 * @param {{ localStorage?: { setItem(key: string, value: string): void } }} browser
 * @param {string} pdfUrl
 * @param {'slides' | 'flipbook' | 'scroll'} mode
 */
export function storeDisplayModePreference(browser, pdfUrl, mode) {
  try {
    browser.localStorage?.setItem(displayModeStorageKey(pdfUrl), mode);
  } catch {
    // Ignore — the live in-memory selection still works.
  }
}

/**
 * The spread layout for a document.
 *  - twoUp=false (landscape, or a narrow stage): one page per spread — [[1],[2],[3],…].
 *  - twoUp=true  (portrait, wide stage): a book spread — the cover sits alone, then facing
 *    pairs — [[1],[2,3],[4,5],…], with a lone trailing page when the count is even+1.
 * @param {number} pageCount
 * @param {boolean} twoUp
 * @returns {number[][]}
 */
export function bookSpreads(pageCount, twoUp) {
  const spreads = [];
  if (!Number.isFinite(pageCount) || pageCount <= 0) return spreads;
  if (!twoUp) {
    for (let p = 1; p <= pageCount; p++) spreads.push([p]);
    return spreads;
  }
  spreads.push([1]);
  for (let p = 2; p <= pageCount; p += 2) {
    const pair = [p];
    if (p + 1 <= pageCount) pair.push(p + 1);
    spreads.push(pair);
  }
  return spreads;
}

/** Index of the spread that contains `page`, or 0 when not found. */
export function spreadIndexForPage(spreads, page) {
  for (let i = 0; i < spreads.length; i++) {
    if (spreads[i].includes(page)) return i;
  }
  return 0;
}

/** Round + clamp a (possibly user-typed) page number into [1, pageCount]; 1 for non-numbers. */
export function clampPage(page, pageCount) {
  if (!Number.isFinite(Number(page))) return 1;
  return Math.max(1, Math.min(pageCount, Math.round(Number(page))));
}

/**
 * The page to move to when stepping `delta` (±1) from `current` in continuous-scroll mode,
 * clamped to the document. Keeps the Previous/Next buttons page-accurate in scroll mode, where
 * navigation is by page rather than by spread.
 */
export function stepScrollPage(current, delta, pageCount) {
  return clampPage(current + delta, pageCount);
}

/**
 * Pick the page whose vertical midpoint is closest to `center` (the viewport's centre-y). Used to
 * decide the current page in continuous-scroll mode: unlike an intersection-ratio threshold, this
 * always names exactly one page at every scroll position — a page taller than the viewport (a
 * width-fitted portrait page, or any page after zooming) never reaches a >50% ratio, which would
 * otherwise leave the page indicator stuck. Ties resolve to the earliest page (document order).
 * @param {{ page: number; top: number; bottom: number }[]} pages
 * @param {number} center
 * @returns {number | null}
 */
export function nearestPageToCenter(pages, center) {
  let best = null;
  let bestDist = Infinity;
  for (const p of pages) {
    const dist = Math.abs((p.top + p.bottom) / 2 - center);
    if (dist < bestDist) {
      bestDist = dist;
      best = p.page;
    }
  }
  return best;
}

/**
 * The base scale that fits a WHOLE page inside the stage — the smaller of the width and height
 * ratios — so the entire page is visible at 100% zoom with room on the other axis: a portrait page
 * is bounded by height and leaves margins on its sides, a landscape page is bounded by width. Zoom
 * multiplies this. Returns 0 for a non-positive page dimension so a caller never divides by it.
 * @param {number} availW usable stage width (px)
 * @param {number} availH usable stage height (px)
 * @param {number} pageW page width (pdf units)
 * @param {number} pageH page height (pdf units)
 * @returns {number}
 */
export function fitPageScale(availW, availH, pageW, pageH) {
  if (!(pageW > 0) || !(pageH > 0)) return 0;
  return Math.min(availW / pageW, availH / pageH);
}

/**
 * Whether a fetch Response for the PDF should be treated as the real file. A non-ok response
 * (the documented 404/502 error bodies) must NOT be saved as `guide.pdf` — the caller takes its
 * fallback path instead.
 */
export function isSuccessfulPdfResponse(res) {
  return Boolean(res && res.ok);
}

/**
 * Classify a pdf.js annotation into a navigable link target for the clickable overlay, or null to
 * skip it. External links carry a `url`; internal links carry a `dest` (a named destination string or
 * an explicit destination array). Anything else — a non-Link annotation, or a Link with neither — is
 * not navigable. Pure so the overlay's link-vs-skip decision is unit-tested without a browser.
 */
export function linkAnnotationTarget(annotation) {
  if (!annotation || annotation.subtype !== 'Link') return null;
  if (typeof annotation.url === 'string' && annotation.url.length > 0) {
    return { kind: 'external', url: annotation.url };
  }
  if (annotation.dest != null) {
    return { kind: 'internal', dest: annotation.dest };
  }
  return null;
}

/**
 * Convert a link rectangle (already mapped into viewport pixels by pdf.js's
 * `convertToViewportRectangle`, so any corner order / y-flip is possible) into percentages of the
 * page box. Percentages keep the overlay aligned as the page canvas scales under zoom and the scroll
 * view's max-width shrink. Returns null when the page box is degenerate. Pure and browser-free.
 */
export function linkRectPercents(viewportRect, baseWidth, baseHeight) {
  if (!Array.isArray(viewportRect) || viewportRect.length < 4) return null;
  if (!(baseWidth > 0) || !(baseHeight > 0)) return null;
  const [x1, y1, x2, y2] = viewportRect;
  return {
    left: (Math.min(x1, x2) / baseWidth) * 100,
    top: (Math.min(y1, y2) / baseHeight) * 100,
    width: (Math.abs(x2 - x1) / baseWidth) * 100,
    height: (Math.abs(y2 - y1) / baseHeight) * 100,
  };
}

// ── Page-curl geometry (book-style turn) ─────────────────────────────────────────
//
// The turning leaf is a chain of thin vertical strips hinged one on the next, so the sheet bends
// like paper instead of pivoting as a flat pane. Everything below is pure arithmetic on that
// chain — the DOM side in pdf-flipbook.js only places elements from these numbers — so the bend
// distribution, the painter's-order invariant, the shading and the slice bookkeeping can all be
// unit-tested in Node.

/** Strips per leaf: ~12px each, never fewer than 24 (a smooth curve) nor more than 40 (layer count). */
export function curlStripCount(pageWidth) {
  if (!(pageWidth > 0)) return 24;
  return Math.max(24, Math.min(40, Math.round(pageWidth / 12)));
}

/** Smootherstep — a soft start, a soft landing, no overshoot. */
export function turnEase(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/**
 * The bend at moment t ∈ [0,1] of a turn, for a leaf of `count` strips.
 *
 * Total bend is 180° × eased progress. Where the bend lives is a Gaussian across the sheet: it
 * starts far out near the free edge (the corner lifts first), rolls back toward the spine as the
 * page swings, and tightens from a soft roll into a single hinge centred on the root strip — so at
 * t=1 the root carries the whole 180° and every other strip is flat. `curl` (0..1) softens the
 * roll. At t ≥ 1 the geometry snaps exactly flat so the landed leaf matches the resting page.
 *
 * Returns per-strip numbers indexed from the spine outward:
 *   share  — each strip's own rotation (deg) about its hinge
 *   angle  — accumulated rotation (deg) of the strip's surface, 0 = flat on the page
 *   posIn  — the strip's hinge distance from the spine, projected onto the page (page-width units)
 *   height — the strip's hinge height above the page plane (page-width units)
 * posIn and height are in fractions of the page width, so shading can be resolution-independent.
 */
export function curlGeometry(count, t, curl) {
  const n = Math.max(1, Math.floor(count));
  const eased = t >= 1 ? 1 : turnEase(t);
  const share = new Array(n).fill(0);
  const angle = new Array(n).fill(0);
  if (t >= 1) {
    share[0] = 180;
    angle.fill(180);
  } else {
    const total = 180 * eased;
    const softness = 0.35 + 0.65 * Math.max(0, Math.min(1, Number.isFinite(curl) ? curl : 1));
    const c = 0.82 * (1 - eased) + (0.5 / n) * eased;
    const sigma = 0.012 + (0.24 * softness - 0.012) * (1 - eased);
    const g = new Array(n);
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) / n;
      g[i] = Math.exp(-((x - c) ** 2) / (2 * sigma * sigma));
      sum += g[i];
    }
    let net = 0;
    for (let i = 0; i < n; i++) {
      share[i] = (total * g[i]) / sum;
      net += share[i];
      angle[i] = net;
    }
  }
  const w = 1 / n;
  const posIn = new Array(n);
  const height = new Array(n);
  let pos = 0;
  let z = 0;
  for (let i = 0; i < n; i++) {
    posIn[i] = pos;
    height[i] = z;
    const r = (angle[i] * Math.PI) / 180;
    pos += w * Math.cos(r);
    z += w * Math.sin(r);
  }
  return { eased, share, angle, posIn, height };
}

/**
 * The resting gutter valley: how dark the page is at `distFrac` page-widths from the spine. It
 * must match the CSS gutter overlay on the resting spread exactly, because the turning leaf sits
 * above that overlay and carries its own copy — otherwise its spine edge would snap from shaded
 * to bare the instant a turn starts, and back again as it lands.
 */
export function gutterValleyAlpha(distFrac) {
  const pts = [
    [0, 0.5],
    [0.032, 0.24],
    [0.104, 0.06],
    [0.2, 0],
  ];
  const d = Math.abs(distFrac);
  if (!(d < 0.2)) return 0;
  for (let j = 0; j < pts.length - 1; j++) {
    const [x0, y0] = pts[j];
    const [x1, y1] = pts[j + 1];
    if (d <= x1) return (y0 + ((y1 - y0) * (d - x0)) / (x1 - x0)) * 0.95;
  }
  return 0;
}

/**
 * Shade (0..1 black alpha) for a point on the leaf whose surface is at `angleDeg` (0 flat, 90
 * edge-on, 180 landed), `distFrac` page-widths from the spine along the page, and `heightFrac`
 * page-widths above the page plane. Two stacked tints:
 *   - edge shade — the crease catches shadow by how edge-on it is (sin), capped at half so the fold
 *     is never darker than the resting seam;
 *   - gutter valley — the resting seam's darkness, for paper lying IN the fold only: flat (|cos|)
 *     AND close to the page plane. A sheet passing well above the spine mid-turn must not pick it
 *     up (that read as the gutter showing through the flying page). Fully in by ~1% of the page
 *     width up, gone by ~7%. `gutter` false (a single-page spread has no spine) drops it entirely.
 */
export function curlShadeAlpha(angleDeg, distFrac, heightFrac, shadow, gutter) {
  const k = 0.5 * Math.max(0, Math.min(1, Number.isFinite(shadow) ? shadow : 1));
  const r = (angleDeg * Math.PI) / 180;
  const edge = k * Math.sin(r);
  if (gutter === false) return edge;
  const inFold = Math.max(0, Math.min(1, (14 / 210 - heightFrac) / (12 / 210)));
  const valley = gutterValleyAlpha(distFrac) * Math.abs(Math.cos(r)) * inFold;
  return 1 - (1 - edge) * (1 - valley);
}

/**
 * Which slice of each page strip `i` (0 at the spine) carries, for a leaf `count` strips wide over
 * a page `pageWidth` px wide. Faces reach 1px past their strip at every join, both ways:
 *   - INWARD over the parent (toward the hinge): adjacent strips are hinged at an angle, so this
 *     reach tilts away from the page behind the parent. It is hidden while the sheet's front faces
 *     the reader, and covers the join once the sheet has turned past edge-on;
 *   - OUTWARD under the child (past the hinge, in the strip's own plane): lies just under the
 *     child's rising inner edge, so it covers the join while the front faces the reader.
 * Strips paint in order, so a child's antialiased inner edge lands on solid paper either way — two
 * soft edges meeting never add up to full coverage, which reads as a light hairline at every join.
 * The root reaches only outward (inward would cross the spine onto the other page) and the last
 * strip only inward (outward would hang past the page's free edge).
 *
 *   faceLeft / faceWidth — the face box in strip-local px (the strip itself is `stripWidth` wide,
 *                          x=0 at its hinge side for a forward turn, at its outer side backward)
 *   hingeInset           — how far the hinge sits in from the face's hinge-side edge (the inward
 *                          reach), where the shading gradient's spine-side stop belongs
 *   frontStart           — page x (px) of the first column the front face shows
 *   backStart            — page x (px) of the first column the back face shows, in the face's own
 *                          (unmirrored) coordinates; the back face is mirrored on screen so the
 *                          landing page reads correctly once the sheet has turned over
 */
export function leafSlice(i, count, pageWidth, forward) {
  const n = Math.max(1, Math.floor(count));
  const w = pageWidth / n;
  const reachIn = i === 0 ? 0 : 1;
  const reachOut = i === n - 1 ? 0 : 1;
  const faceWidth = w + reachIn + reachOut;
  // Forward strips extend right of their hinge (hinge at local 0); backward ones extend left of
  // it (hinge at local w), so "inward" is the opposite direction.
  const faceLeft = forward ? -reachIn : -reachOut;
  const fOff = forward ? i * w : pageWidth - (i + 1) * w; // slice of the page turning away
  const bOff = forward ? pageWidth - (i + 1) * w : i * w; // slice of the page that lands
  return {
    stripWidth: w,
    faceLeft: faceLeft === 0 ? 0 : faceLeft,
    faceWidth,
    hingeInset: reachIn,
    frontStart: fOff + faceLeft,
    backStart: bOff + w - faceWidth - faceLeft,
  };
}

/**
 * The one page box every two-up book slot uses: the widest and the tallest page in the document.
 * Every spread is laid out and scaled in these fixed slots, so a differently sized cover or an
 * inserted source page never re-fits or shifts the book as the reader turns to it. Null for an
 * empty document.
 * @param {{ width: number; height: number }[]} sizes page sizes (pdf units)
 * @returns {{ width: number; height: number } | null}
 */
export function bookSlotSize(sizes) {
  let width = 0;
  let height = 0;
  for (const size of sizes || []) {
    if (size && size.width > width) width = size.width;
    if (size && size.height > height) height = size.height;
  }
  return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * Which page plays which part in a turn, and which way the geometry runs. Pure, so the direction
 * logic — the part that decides whether the reader sees the right page at the start and the end of
 * a turn — is pinned by unit tests rather than by watching the animation.
 *
 * Two-up: the leaf is the page on the turning side (right for forward, left for backward), hinged
 * at the spine, and its back is the page landing on the far side. The geometry itself runs the way
 * the page moves (`geomForward` false for a backward turn) and is never run in reverse. The far
 * slot shows its new page under the leaf from the start; the near slot keeps its old page until
 * the leaf lands.
 *
 * Single page: the leaf is always hinged at the page's left edge with plain paper on its back
 * (`back` null). A forward turn peels the current page away over the next one; a backward turn is
 * the same forward geometry run backwards in time (`reverse` true) — the previous page unfolding
 * back over the current one — so its leaf carries the INCOMING page on its front.
 *
 * `front`, `back` and `during` name slots by list (`outgoing` = on screen now, `incoming` = freshly
 * rendered) and index; `during` is the spread's slot order while the leaf is up, and `far` indexes
 * into it the slot the sheet sweeps over (where the contact shadow falls).
 * @param {boolean} twoUp
 * @param {boolean} forward
 */
export function planTurn(twoUp, forward) {
  const out = (index) => ({ from: 'outgoing', index });
  const inc = (index) => ({ from: 'incoming', index });
  if (twoUp) {
    return forward
      ? { geomForward: true, reverse: false, front: out(1), back: inc(0), during: [out(0), inc(1)], far: 0 }
      : { geomForward: false, reverse: false, front: out(0), back: inc(1), during: [inc(0), out(1)], far: 1 };
  }
  return forward
    ? { geomForward: true, reverse: false, front: out(0), back: null, during: [inc(0)], far: 0 }
    : { geomForward: true, reverse: true, front: inc(0), back: null, during: [out(0)], far: 0 };
}

/**
 * Which side of the leaf the reader sees at moment t of a turn planned by planTurn(): 'front' (the
 * page it carries on its face) or 'back' (the page it lands as, or plain paper), judged at the
 * sheet's root strip, which is flat on the near page at the start and flat on the far page at the
 * end. This is the observable a turn must get right at both ends.
 * @param {{ reverse: boolean }} plan
 * @param {number} t
 */
export function turnFaceAt(plan, t) {
  const tt = plan.reverse ? 1 - t : t;
  const { angle } = curlGeometry(24, tt, 1);
  return angle[0] > 90 ? 'back' : 'front';
}
