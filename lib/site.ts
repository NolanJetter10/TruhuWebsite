export const SITE = {
  name: "TruHu",
  legalName: "Truly Human Technologies, Inc.",
  url: "https://truhu.ai",
  tagline:
    "TruHu turns the plan documents brokers already have into personalized enrollment guides and benefits sites — and reaches the employees who never log in to anything.",
} as const;

/**
 * The nav follows the content spec: the two products under one Products menu,
 * then the mechanics, the library, and the buyer pages. An item with `children`
 * renders as a menu rather than a link — see `NavMenu`.
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
          "Reach the employees who never log in to anything — on the channels they already read.",
      },
    ],
  },
  { href: "/how-it-works", label: "How it works" },
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
    ],
  },
  { href: "/for-brokerages", label: "For brokerages" },
  { href: "/security", label: "Security" },
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
      { href: "/how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/for-brokerages", label: "For brokerages" },
      { href: "/resources/blog", label: "Blog" },
      { href: "/resources/case-studies", label: "Case studies" },
      { href: "/security", label: "Security" },
      { href: "/demo", label: "Book a demo" },
    ],
  },
] as const;
