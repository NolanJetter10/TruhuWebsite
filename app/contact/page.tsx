import { permanentRedirect } from "next/navigation";

/** The old contact route now lives at /demo; keep inbound links working. */
export default function ContactPage() {
  permanentRedirect("/demo");
}
