/**
 * Every string the marketing site renders, in one file.
 *
 * Copy is taken from truhu.ai as it stands today. Where a number appears it is
 * the number the live site publishes; nothing here is invented. Keeping the
 * content in one module is what lets the page components stay purely about
 * layout and motion.
 */

export const HERO = {
  eyebrow: "Responsible AI for employee benefits",
  /** Split for the word-by-word mask reveal in the hero. */
  titleLead: "The AI Benefits Communication Platform",
  titleAccent: "Brokers Trust Most",
  lede: "Better guidance. Smarter enrollment. Cover your whole book.",
  primaryCta: { href: "/contact", label: "See TruHu Advisor" },
  secondaryCta: { href: "/#advisor", label: "How it works" },
  note: "SOC 2 Type II · 100+ languages · No employee login",
} as const;

/** Brokerages named on the truhu.ai logo wall. */
export const BROKERS = [
  "Acrisure",
  "Marsh McLennan",
  "HUB International",
  "Brown & Brown",
  "Alliant",
  "Gallagher",
  "USI",
  "NFP",
  "Lockton",
  "OneDigital",
] as const;

export const ADVISOR = {
  eyebrow: "TruHu Advisor",
  title: "Premium open enrollment service for every client.",
  lede: "TruHu Advisor helps benefits teams deliver a more personalized employee experience without adding more manual work.",
  cta: { href: "/contact", label: "Get started with TruHu" },
} as const;

export type FeatureKey = "guides" | "comms" | "microsites" | "decision";

export const FEATURES: {
  key: FeatureKey;
  name: string;
  blurb: string;
}[] = [
  {
    key: "guides",
    name: "Benefit Guides",
    blurb:
      "AI-generated, easy-to-read benefit guides delivered to every employee, in their language.",
  },
  {
    key: "comms",
    name: "Year-Round Comms",
    blurb:
      "Automated text and email campaigns that keep enrollment moving, then keep running long after it closes.",
  },
  {
    key: "microsites",
    name: "Microsites",
    blurb:
      "Each client gets their own benefit hub built under their brand: their logo, their colors, their plan details.",
  },
  {
    key: "decision",
    name: "Decision Support",
    blurb:
      "Employees compare plans against their own situation and reach a choice they can actually explain.",
  },
];

export const RESULTS = {
  eyebrow: "Proven results",
  titleLead: "Designed to improve utilization and overall",
  titleAccent: "return on investment.",
  lede: "Higher benefits participation, better reach across a distributed workforce, and engagement that holds up between enrollment periods.",
  /** The three headline percentages published on truhu.ai. */
  stats: [
    {
      value: 15,
      suffix: "%",
      label: "Higher engagement",
      note: "During open enrollment",
    },
    {
      value: 75,
      suffix: "%",
      label: "Lower comms costs",
      note: "Using one tool instead of many",
    },
    {
      value: 85,
      suffix: "%",
      label: "Higher view rates",
      note: "Versus email alone",
    },
  ],
  /** Secondary proof points from the Advisor page. */
  facts: [
    { value: "124", label: "Clients deployed" },
    { value: "85%", label: "Average enrollment rate" },
    { value: "100+", label: "Languages auto-translated" },
    { value: "SOC 2", label: "Type II compliant" },
  ],
} as const;

export const QUOTE = {
  text: "I have another group that I just put on TruHu that they were so pumped about it.",
  name: "Emily F.",
  role: "Account Executive",
} as const;

export const WORKFORCE = {
  eyebrow: "TruHu Workforce",
  title: "Extend your client partnership with TruHu Workforce",
  lede: "Employee communications, compliance, company updates and culture initiatives — reaching the employees other tools miss. No app. No login. No work email.",
  points: [
    {
      name: "Proof of Delivery",
      blurb:
        "Every message is trackable. Real-time read receipts per employee who received, opened, and clicked.",
    },
    {
      name: "Automated Follow-Up",
      blurb: "Set it and forget it. Unopened messages get re-sent automatically.",
    },
    {
      name: "Shift-Aware Scheduling",
      blurb:
        "Send when they're actually reading. First shift at 6am, third shift at 10pm.",
    },
    {
      name: "Built for Frontline",
      blurb:
        "No app. No desk. No problem. Hourly and shift workers get messages on personal phones.",
    },
  ],
  cta: { href: "/contact", label: "Explore TruHu Workforce" },
} as const;

/** The campaign the delivery demo plays back. Figures from the Workforce page. */
export const CAMPAIGN = {
  audience: 847,
  delivered: 847,
  opened: 723,
  clicked: 612,
} as const;

export const RESOURCES = {
  eyebrow: "Latest from TruHu",
  title: "Product updates, industry insights, and lessons from customers.",
  items: [
    {
      kind: "Blog",
      title:
        "California Labor Code § 2802 and what it means for BYOD employee texting",
      blurb:
        "Reimbursement rules catch out employers who text staff on personal phones. Here is the compliant way to do it.",
    },
    {
      kind: "Case study",
      title: "Lake Medical Imaging reaches a 78% average click rate",
      blurb:
        "How a multi-site imaging group replaced break-room posters with messages employees actually open.",
    },
    {
      kind: "Case study",
      title: "Securatech connects a fully mobile workforce",
      blurb:
        "A security firm with no shared office, no company email, and a roster that turns over fast.",
    },
  ],
} as const;

export const CLOSING = {
  titleLead: "Better guidance. Smarter enrollment.",
  titleAccent: "Cover your whole book.",
  lede: "See what your clients' employees would receive, built from your own plan documents.",
  primaryCta: { href: "/contact", label: "Get Started" },
} as const;
