import { WORKFLOWS } from "./workflows";

export const SITE = {
  name: "TruHu",
  legalName: "Truly Human Technologies",
  domain: "truhu.ai",
  url: "https://truhu.ai",
  tagline:
    "Two products for benefits brokers: Advisor produces the client-facing work, Workforce reaches every employee.",
} as const;

export type NavLink = {
  href: string;
  label: string;
  description?: string;
  status?: "live" | "early-access" | "roadmap";
  statusLabel?: string;
};

export type NavGroup = {
  label: string;
  /** Grouped columns inside the dropdown. */
  columns: { heading?: string; links: NavLink[]; footer?: NavLink }[];
};

export const NAV: NavGroup[] = [
  {
    label: "Products",
    columns: [
      {
        heading: "Two products, one broker platform",
        links: [
          {
            href: "/advisor",
            label: "TruHu Advisor",
            description:
              "The client-facing work your brokerage already produces, built across your whole book.",
          },
          {
            href: "/workforce",
            label: "TruHu Workforce",
            description:
              "The communication platform your clients keep you for, including the employees with no email.",
          },
          {
            href: "/platform",
            label: "Platform",
            description:
              "The shared foundation: how content is generated, grounded and controlled.",
          },
        ],
      },
    ],
  },
  {
    label: "Workflows",
    columns: [
      {
        heading: "Every client-facing document, one workflow at a time",
        links: WORKFLOWS.map((w) => ({
          href: w.slug ? `/advisor/${w.slug}` : "/advisor/workflows",
          label: w.name,
          description: w.tagline,
          status: w.status,
          statusLabel: w.statusLabel,
        })),
        footer: {
          href: "/advisor/workflows",
          label: "See the whole workflow map",
        },
      },
    ],
  },
  {
    label: "Company",
    columns: [
      {
        links: [
          {
            href: "/customers",
            label: "Customers",
            description: "Case studies with named organisations and real numbers.",
          },
          {
            href: "/security",
            label: "Security",
            description: "Data handling, SOC 2, subprocessors, and what our AI does with your documents.",
          },
          {
            href: "/implementation",
            label: "Implementation",
            description: "What the first 30 days look like, week by week.",
          },
          {
            href: "/integrations",
            label: "Integrations",
            description: "Ben-admin, HRIS, payroll and AMS. What is live and what is planned.",
          },
          {
            href: "/about",
            label: "About",
            description: "Who we are and why the company is built this way.",
          },
        ],
      },
    ],
  },
];

export const NAV_FLAT: NavLink[] = [{ href: "/resources", label: "Resources" }];

export const FOOTER_NAV: { heading: string; links: NavLink[] }[] = [
  {
    heading: "Products",
    links: [
      { href: "/advisor", label: "TruHu Advisor" },
      { href: "/workforce", label: "TruHu Workforce" },
      { href: "/workforce/compliance", label: "Acknowledgement & proof of delivery" },
      { href: "/workforce/frontline", label: "Deskless & no-email reach" },
      { href: "/platform", label: "Platform" },
    ],
  },
  {
    heading: "Workflows",
    links: [
      { href: "/advisor/workflows", label: "The workflow map" },
      ...WORKFLOWS.filter((w) => w.slug).map((w) => ({
        href: `/advisor/${w.slug}`,
        label: w.name,
      })),
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/customers", label: "Customers" },
      { href: "/resources", label: "Resources" },
      { href: "/about", label: "About" },
      { href: "/fit-test", label: "Fit Test" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    heading: "Trust",
    links: [
      { href: "/security", label: "Security & privacy" },
      { href: "/implementation", label: "Implementation" },
      { href: "/integrations", label: "Integrations" },
      { href: "/security#subprocessors", label: "Subprocessors" },
      { href: "/security#responsible-ai", label: "How our AI handles your data" },
    ],
  },
];
