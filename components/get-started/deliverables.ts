/**
 * Kindlerye's reworked deliverables, page by page, for the viewer in the
 * /BryanKleppe popup (DeliverableViewer). Kindlerye Baking Co. is a made-up
 * demo employer (lib/kindlerye.ts), so every name and number on these pages is
 * invented.
 *
 * The pages are the Oct 26 upgrade previews (Documents\Truhu\Video Production\
 * Marketing Assets\02 Kindlerye Demo Company\Oct 26 Upgrade Previews), exported
 * from PNG to WebP into public/kindlerye/. Their file numbers skip (the guide
 * has no p17, p22, p26 or p30), so the order here is the file order, and the
 * viewer counts the pages it has rather than the numbers printed on them.
 */

export type DeliverableKind = "sampleGuide" | "flyer";

export type DeliverablePage = {
  src: string;
  width: number;
  height: number;
  /** The page's subject. Also its name in the page picker. */
  alt: string;
};

export type Deliverable = {
  /** The document's own title, as printed on its cover. */
  title: string;
  pages: readonly DeliverablePage[];
};

/** Every page is US letter, exported at 918 × 1188. */
const page = (folder: string, file: string, alt: string): DeliverablePage => ({
  src: `/kindlerye/${folder}/${file}.webp`,
  width: 918,
  height: 1188,
  alt,
});

const guide = (file: string, alt: string) => page("guide", file, alt);
const flyer = (file: string, alt: string) => page("flyer", file, alt);

export const DELIVERABLES: Record<DeliverableKind, Deliverable> = {
  sampleGuide: {
    title: "Kindlerye Baking Co. 2027 Employee Benefits Guide",
    pages: [
      guide("p01-cover", "Cover"),
      guide("p02-toc", "Table of contents"),
      guide("p03-welcome", "Welcome to your benefits"),
      guide("p04-eligibility", "Eligibility and enrollment"),
      guide("p05-eligibility-cont1", "Eligibility and enrollment, continued"),
      guide("p06-eligibility-cont2", "Eligibility and enrollment, continued"),
      guide("p07-eligibility-cont3", "Eligibility and enrollment, continued"),
      guide("p08-medical", "Medical plans"),
      guide("p09-where-to-go", "Where to go for care"),
      guide("p10-family-path", "Family Path fertility coverage"),
      guide("p11-dental", "Dental"),
      guide("p12-vision", "Vision"),
      guide("p13-hsa-fsa", "HSA and FSA"),
      guide("p14-life-disability", "Life and disability"),
      guide("p15-wellness", "Wellness program"),
      guide("p16-eap", "Employee Assistance Program"),
      guide("p18-leave", "Leaves of absence"),
      guide("p19-cobra", "COBRA continuation"),
      guide("p20-additional-benefits", "Additional benefits"),
      guide("p21-contacts", "Key contacts"),
      guide("p23-back-cover", "Back cover"),
      guide("p24-fmla", "FMLA notice"),
      guide("p25-fmla-2", "FMLA notice, continued"),
      guide("p27-ada-wellness-notice", "ADA wellness program notice"),
      guide("p28-chip", "Medicaid and CHIP premium assistance"),
      guide("p29-chip-2", "Medicaid and CHIP premium assistance, continued"),
      guide("p31-chip-4", "Medicaid and CHIP premium assistance, continued"),
      guide("p32-chip-5", "Paperwork Reduction Act statement"),
      guide("p33-you-choose-harborline", "Smart ways to save on care"),
      guide("p34-you-choose-harborline-2", "Smart ways to save on care, continued"),
    ],
  },
  flyer: {
    title: "Kindlerye Baking Co. 2027 Benefits Open Enrollment Flyer",
    pages: [
      flyer("p01-cover", "Cover"),
      flyer("p02-how-open-enrollment-works", "How open enrollment works"),
      flyer("p03-medical-plans", "Medical plans"),
    ],
  },
};
