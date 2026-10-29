export const SITE = {
  name: "TruHu",
  legalName: "Truly Human Technologies, Inc.",
  url: "https://truhu.ai",
  tagline:
    "TruHu turns the plan documents brokers already have into personalized enrollment guides and benefits sites — and reaches the employees who never log in to anything.",
  /** The one-line identity under the footer wordmark, as it runs on truhu.ai. */
  footerTagline: "Responsible AI built for the employee benefits industry.",
} as const;

/** The footer's closing ask, carried over from the live site's bumper. */
export const FOOTER_CTA = {
  title: "Ready to reach every employee?",
  cta: { href: "/BryanKleppe", label: "Get Started" },
} as const;

/**
 * The two products under one Products menu, then how it is built, the library
 * (with the FAQ inside it), and the pages a buyer checks before a call. An item
 * with `children` renders as a menu rather than a link — see `NavMenu`.
 *
 * /how-it-works is deliberately not here: it is still published and still
 * linked from the footer and from the Workforce problem section, but it does
 * not earn a slot in the top nav. /for-brokerages is archived under
 * `app/_archive/` and no longer routed.
 */
export type NavLink = {
  href: string;
  label: string;
  /** Shown only inside a menu panel. */
  blurb?: string;
};

export type NavItem = NavLink | { label: string; children: readonly NavLink[] };

export const NAV: readonly NavItem[] = [
  {
    label: "Products",
    children: [
      {
        href: "/advisor",
        label: "TruHu Advisor",
        blurb:
          "Personalized enrollment guides and benefits sites, built from the plan documents you already have.",
      },
      {
        href: "/workforce",
        label: "TruHu Workforce",
        blurb:
          "Easy communication for hard-to-reach employees, by text and email. No app and no login.",
      },
    ],
  },
  { href: "/technology", label: "Technology" },
  {
    label: "Resources",
    children: [
      {
        href: "/resources/blog",
        label: "Blog",
        blurb:
          "Writing on open enrollment, compliance, and reaching a frontline workforce.",
      },
      {
        href: "/resources/case-studies",
        label: "Case studies",
        blurb:
          "What the production line looks like inside a brokerage and its clients.",
      },
      {
        href: "/faq",
        label: "FAQ",
        blurb:
          "Straight answers on pricing, the AI, client data and rollout, for both products.",
      },
    ],
  },
  { href: "/security", label: "Security" },
  { href: "/about", label: "About" },
];

export function isNavMenu(
  item: NavItem,
): item is { label: string; children: readonly NavLink[] } {
  return "children" in item;
}

export const FOOTER_NAV = [
  {
    heading: "Product",
    links: [
      { href: "/advisor", label: "TruHu Advisor" },
      { href: "/workforce", label: "TruHu Workforce" },
      { href: "/technology", label: "Technology" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/resources/blog", label: "Blog" },
      { href: "/resources/case-studies", label: "Case studies" },
      { href: "/faq", label: "FAQ" },
      { href: "/security", label: "Security" },
      { href: "/demo", label: "Book a demo" },
    ],
  },
] as const;
