import type { Metadata } from "next";
import { LibraryShell } from "@/components/resources/LibraryShell";
import { RESOURCES_PAGE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Case studies",
  description: RESOURCES_PAGE.kinds.case.lede,
  alternates: { canonical: "/resources/case-studies" },
};

export default function CaseStudiesPage() {
  return <LibraryShell kind="case" />;
}
