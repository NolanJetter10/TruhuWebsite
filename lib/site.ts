export const SITE = {
  name: "TruHu",
  legalName: "Truly Human Technologies, Inc.",
  url: "https://truhu.ai",
  tagline:
    "Better guidance. Smarter enrollment. Cover your whole book. The AI benefits communication platform brokers trust most.",
} as const;

/** The nav mirrors truhu.ai: Products, Resources, Contact, then the two CTAs. */
export const NAV = [
  { href: "/#advisor", label: "Products" },
  { href: "/#resources", label: "Resources" },
  { href: "/contact", label: "Contact" },
] as const;

export const FOOTER_NAV = [
  {
    heading: "Product",
    links: [
      { href: "/#advisor", label: "TruHu Advisor" },
      { href: "/#workforce", label: "TruHu Workforce" },
      { href: "/#results", label: "Results" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/#resources", label: "Resources" },
    ],
  },
] as const;
