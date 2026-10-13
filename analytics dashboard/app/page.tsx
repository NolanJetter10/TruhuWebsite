import { Dashboard } from "@/components/Dashboard";
import { isRange } from "@/lib/aggregate";
import { authMode } from "@/lib/auth";
import { BACKEND } from "@/lib/store";

/** The proxy has already checked the cookie by the time this renders. */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; campaign?: string }>;
}) {
  const { range, campaign } = await searchParams;
  return (
    <Dashboard
      backend={BACKEND}
      openAccess={authMode === "open"}
      initialRange={range && isRange(range) ? range : "7d"}
      initialCampaign={campaign ?? ""}
      siteUrl={process.env.SITE_URL ?? "https://truhu.ai"}
    />
  );
}
