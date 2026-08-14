export const SITE = {
  name: "TruHu",
  legalName: "Truly Human Technologies, Inc.",
  url: "https://truhu.ai",
  tagline:
    "TruHu builds open-enrollment guides, benefits sites, notice packets and flyers from the plan documents brokers already have — and reaches the employees who never log in to anything.",
} as const;

/** The nav follows the content spec: both products, the mechanics, the buyer pages. */
export const NAV = [
  { href: "/advisor", label: "Advisor" },
  { href: "/workforce", label: "Workforce" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/for-brokerages", label: "For brokerages" },
  { href: "/security", label: "Security" },
] as const;

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
      { href: "/security", label: "Security" },
      { href: "/demo", label: "Book a demo" },
    ],
  },
] as const;
