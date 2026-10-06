import Image, { type StaticImageData } from "next/image";
import { BROKERS } from "@/lib/content";
import acrisure from "@/public/images/brokers/acrisure.png";
import aleraGroup from "@/public/images/brokers/alera-group.png";
import arthurJGallagher from "@/public/images/brokers/arthur-j-gallagher.png";
import brownBrown from "@/public/images/brokers/brown-brown.png";
import epicInsuranceBrokers from "@/public/images/brokers/epic-insurance-brokers.png";
import gisBenefits from "@/public/images/brokers/gis-benefits.png";
import hilbGroup from "@/public/images/brokers/hilb-group.png";
import holmesMurphy from "@/public/images/brokers/holmes-murphy.png";
import hubInternational from "@/public/images/brokers/hub-international.png";
import imaFinancialGroup from "@/public/images/brokers/ima-financial-group.png";
import insurica from "@/public/images/brokers/insurica.png";
import leavittGroup from "@/public/images/brokers/leavitt-group.png";
import marshMclennan from "@/public/images/brokers/marsh-mclennan.png";
import mcgriff from "@/public/images/brokers/mcgriff.png";
import onedigital from "@/public/images/brokers/onedigital.png";
import patriotGrowth from "@/public/images/brokers/patriot-growth-insurance.png";
import professionalGroupPlans from "@/public/images/brokers/professional-group-plans.png";
import seubertAssociates from "@/public/images/brokers/seubert-associates.png";
import theMahoneyGroup from "@/public/images/brokers/the-mahoney-group.png";

/** The artwork carried over from truhu.ai, keyed by `BROKERS[].file`. */
const ARTWORK: Record<(typeof BROKERS)[number]["file"], StaticImageData> = {
  acrisure,
  "alera-group": aleraGroup,
  "arthur-j-gallagher": arthurJGallagher,
  "brown-brown": brownBrown,
  "epic-insurance-brokers": epicInsuranceBrokers,
  "gis-benefits": gisBenefits,
  "hilb-group": hilbGroup,
  "holmes-murphy": holmesMurphy,
  "hub-international": hubInternational,
  "ima-financial-group": imaFinancialGroup,
  insurica,
  "leavitt-group": leavittGroup,
  "marsh-mclennan": marshMclennan,
  mcgriff,
  onedigital,
  "patriot-growth-insurance": patriotGrowth,
  "professional-group-plans": professionalGroupPlans,
  "seubert-associates": seubertAssociates,
  "the-mahoney-group": theMahoneyGroup,
};

/**
 * The trust rail. Two identical runs sit in one track; translating the track by
 * exactly -50% loops it with an invisible seam, and the mask keeps logos from
 * appearing or vanishing at a hard edge. It pauses on hover so a name can
 * actually be read.
 */
export function LogoMarquee() {
  return (
    <div className="marquee w-full overflow-hidden">
      <div className="marquee-track" aria-hidden>
        {[0, 1].map((run) => (
          <ul key={run} className="flex shrink-0 items-center">
            {BROKERS.map((broker) => (
              <li key={broker.file} className="px-8">
                <Image
                  src={ARTWORK[broker.file]}
                  alt={run === 0 ? broker.name : ""}
                  className="h-9 w-auto max-w-none opacity-80 grayscale-25 transition-[opacity,filter] duration-300 hover:opacity-100 hover:grayscale-0"
                  sizes="180px"
                />
              </li>
            ))}
          </ul>
        ))}
      </div>
      <p className="sr-only">
        Brokerages using TruHu include{" "}
        {BROKERS.map((broker) => broker.name).join(", ")}.
      </p>
    </div>
  );
}
