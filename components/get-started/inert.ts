/**
 * Makes the rest of /BryanKleppe inert while an overlay is open (FlowPanel,
 * FlipbookOverlay), except Bryan's box. While a flow is open his call or chat
 * floats in a corner above every overlay (`[data-bryan-pip]`), and the
 * visitor still has to reach it to mute, end the call or type.
 *
 * Inert is inherited, so the box's ancestors can't be made inert. Instead
 * this walks up from the box, and from the overlay, to <body> and makes inert
 * only the siblings at each level. With no box on the page, that's every
 * child of <body> but the overlay.
 *
 * Bryan's box can mount or move after the overlay opens, so the set is
 * worked out again whenever the page's elements change. Each element counts
 * the overlays that hold it, so two overlays crossing (one closing as the
 * other opens) never wake the page early. An element that was inert before
 * any overlay opened is left as it was.
 */

const PIP = "[data-bryan-pip]";

/** How many open overlays hold each element inert. */
const holds = new Map<HTMLElement, number>();

function hold(el: HTMLElement) {
  const count = holds.get(el) ?? 0;
  if (count === 0 && el.inert) return false;
  holds.set(el, count + 1);
  el.inert = true;
  return true;
}

function release(el: HTMLElement) {
  const count = holds.get(el) ?? 0;
  if (count <= 1) {
    holds.delete(el);
    el.inert = false;
  } else {
    holds.set(el, count - 1);
  }
}

/** The elements to make inert so that only `keep` (and their insides) stay live. */
function outside(keep: Element[]) {
  const body = document.body;
  // Every ancestor of a kept element, up to <body>, has to stay live.
  const live = new Set<Element>();
  for (const el of keep) {
    if (!body.contains(el)) continue;
    for (let at: Element | null = el; at && at !== body; at = at.parentElement) live.add(at);
  }
  const kept = new Set(keep);
  const parents = new Set<Element>([body]);
  for (const el of live) {
    if (el.parentElement && !kept.has(el.parentElement)) parents.add(el.parentElement);
  }
  const out = new Set<HTMLElement>();
  for (const parent of parents) {
    for (const child of Array.from(parent.children)) {
      if (!live.has(child) && child instanceof HTMLElement) out.add(child);
    }
  }
  return out;
}

/** Whether focus is in Bryan's box, which an overlay shouldn't take it from. */
export function inBryanBox(el: Element | null) {
  return Boolean(el?.closest(PIP));
}

/**
 * Makes everything but `overlay` and Bryan's box inert. Returns a function
 * that undoes it.
 */
export function stillPageAround(overlay: HTMLElement) {
  let held = new Set<HTMLElement>();

  const apply = () => {
    const pip = document.querySelector(PIP);
    const next = outside(pip ? [overlay, pip] : [overlay]);
    for (const el of held) if (!next.has(el)) release(el);
    const now = new Set<HTMLElement>();
    for (const el of next) {
      if (held.has(el) || hold(el)) now.add(el);
    }
    held = now;
  };

  apply();
  const watch = new MutationObserver(apply);
  watch.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-bryan-pip"],
  });

  return () => {
    watch.disconnect();
    for (const el of held) release(el);
    held = new Set();
  };
}
