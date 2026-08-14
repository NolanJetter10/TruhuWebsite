import { redirect } from "next/navigation";

/**
 * The library has no combined landing any more — the nav offers the two halves
 * directly. This keeps `/resources` working for anything already pointing at
 * it rather than leaving a 404 behind.
 */
export default function ResourcesIndexPage() {
  redirect("/resources/blog");
}
