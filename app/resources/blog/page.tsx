import type { Metadata } from "next";
import { LibraryShell } from "@/components/resources/LibraryShell";
import { RESOURCES_PAGE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Blog",
  description: RESOURCES_PAGE.kinds.blog.lede,
  alternates: { canonical: "/resources/blog" },
};

export default function BlogPage() {
  return <LibraryShell kind="blog" />;
}
