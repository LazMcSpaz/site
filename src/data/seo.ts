// SEO helpers + location data for the service-area pages.
// English only for now; Spanish keywords/copy come in a later pass.

import { business } from "./content.ts";

const SITE = "https://morysautoparts.com";
const GEO = { lat: 25.8245019, lng: -80.2609681 };

/** AutoPartsStore LocalBusiness schema for the homepage. */
export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "AutoPartsStore",
    "@id": `${SITE}/#business`,
    name: business.name,
    image: `${SITE}/og-image.jpg`,
    url: SITE,
    telephone: "+1-305-835-2777",
    email: business.email,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address.line1,
      addressLocality: "Hialeah",
      addressRegion: "FL",
      postalCode: "33010",
      addressCountry: "US",
    },
    geo: { "@type": "GeoCoordinates", latitude: GEO.lat, longitude: GEO.lng },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "17:00",
      },
    ],
    areaServed: locations.map((l) => ({ "@type": "City", name: l.name })),
  };
}

/** Per-location schema referencing the main business, for /service-area/[city]. */
export function locationSchema(loc: Location) {
  return {
    "@context": "https://schema.org",
    "@type": "AutoPartsStore",
    name: `${business.name} — serving ${loc.name}, FL`,
    parentOrganization: { "@type": "Organization", name: business.name, "@id": `${SITE}/#business` },
    url: `${SITE}/service-area/${loc.slug}`,
    telephone: "+1-305-835-2777",
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address.line1,
      addressLocality: "Hialeah",
      addressRegion: "FL",
      postalCode: "33010",
      addressCountry: "US",
    },
    areaServed: { "@type": "City", name: `${loc.name}, FL` },
  };
}

export interface Location {
  slug: string;
  name: string;
  county: string;
  /** Short distance/relationship note to the Hialeah shop */
  proximity: string;
  /** Unique 2–3 sentence intro — NOT boilerplate */
  intro: string;
  /** Neighborhoods / landmarks for local relevance */
  nearby: string[];
  /** Target English search phrases for this page */
  keywords: string[];
}

export const locations: Location[] = [
  {
    slug: "hialeah",
    name: "Hialeah",
    county: "Miami-Dade County",
    proximity: "This is home — our shop sits right on E 10th Ave.",
    intro:
      "Mory's has been Hialeah's go-to for hard-to-find car parts for years. Walk in off E 10th Ave, call ahead, or send a part request — new, used, or aftermarket, we'll track it down and quote you straight. Bilingual service, fair pricing, no run-around.",
    nearby: ["Westland", "Palm Springs", "Hialeah Acres", "Leisure City", "East Hialeah"],
    keywords: [
      "auto parts hialeah",
      "used auto parts hialeah",
      "car parts hialeah fl",
      "aftermarket parts hialeah",
      "auto glass hialeah",
    ],
  },
  {
    slug: "miami",
    name: "Miami",
    county: "Miami-Dade County",
    proximity: "A short hop south from our Hialeah shop.",
    intro:
      "Sourcing parts for a car in Miami? We pull from a supplier and salvage network across the metro and have most parts ready the same week. New, used, and aftermarket — plus auto glass — at prices that beat the dealership. Hablamos español.",
    nearby: ["Allapattah", "Wynwood", "Little Havana", "Brownsville", "Liberty City"],
    keywords: [
      "auto parts miami",
      "car parts miami",
      "cheap auto parts miami",
      "aftermarket car parts miami",
      "used car parts miami",
    ],
  },
  {
    slug: "hialeah-gardens",
    name: "Hialeah Gardens",
    county: "Miami-Dade County",
    proximity: "Just west of our shop — a quick drive on W 49th.",
    intro:
      "Hialeah Gardens drivers get the same deal our Hialeah neighbors do: call with the year, make, model, and the part, and we'll work the network to find it fast at a fair price. New, used, aftermarket, and glass — bilingual every step.",
    nearby: ["Country Club", "Palm Springs North", "Miami Lakes (border)"],
    keywords: [
      "auto parts hialeah gardens",
      "used parts hialeah gardens",
      "car parts hialeah gardens fl",
    ],
  },
  {
    slug: "opa-locka",
    name: "Opa-Locka",
    county: "Miami-Dade County",
    proximity: "A few minutes north of the shop.",
    intro:
      "From a single tail light to a full front-end rebuild, Opa-Locka drivers can lean on Mory's to find the part for less. We quote real options — what each one costs and which we'd buy ourselves — and can deliver depending on the order.",
    nearby: ["Bunche Park", "Lake Lucerne", "Magnolia North", "Ali Baba"],
    keywords: [
      "auto parts opa-locka",
      "used auto parts opa locka",
      "car parts opa-locka fl",
    ],
  },
  {
    slug: "doral",
    name: "Doral",
    county: "Miami-Dade County",
    proximity: "A straight shot southwest from Hialeah.",
    intro:
      "Doral is one call away from a better price on parts. Whether it's OEM, a verified used piece, or aftermarket body and trim, we source it through our network and lay out your options. Delivery available across the area depending on the order total.",
    nearby: ["Downtown Doral", "Sabal Palm", "Doral Isles", "Morgan Levy Park"],
    keywords: [
      "auto parts doral",
      "car parts doral fl",
      "aftermarket parts doral",
    ],
  },
  {
    slug: "north-miami",
    name: "North Miami",
    county: "Miami-Dade County",
    proximity: "East of the shop, an easy drive.",
    intro:
      "North Miami drivers don't have to settle for dealership markups. Mory's finds new, used, and aftermarket parts — and auto glass — through a network built over years on the ground in Miami-Dade. Fair pricing, straight answers, English and Spanish.",
    nearby: ["Keystone Point", "Sunkist Grove", "Griffing", "Cagni Park"],
    keywords: [
      "auto parts north miami",
      "used car parts north miami",
      "car parts north miami fl",
    ],
  },
  {
    slug: "fontainebleau",
    name: "Fontainebleau",
    county: "Miami-Dade County",
    proximity: "Just south of the shop near the Palmetto.",
    intro:
      "Need a part in Fontainebleau? Call Mory's with what your car needs and we'll do the legwork — sourcing options across our supplier and salvage contacts, then calling you back with prices. New, used, aftermarket, and glass.",
    nearby: ["Tamiami", "Westchester (border)", "FIU area", "Blue Lagoon"],
    keywords: [
      "auto parts fontainebleau",
      "car parts fontainebleau miami",
      "used auto parts fontainebleau",
    ],
  },
  {
    slug: "kendall",
    name: "Kendall",
    county: "Miami-Dade County",
    proximity: "Further southwest — delivery available on qualifying orders.",
    intro:
      "Kendall is a bit of a drive, so we make it easy: call or send a request and, depending on the order, we'll get the part to you. New, used, and aftermarket parts plus auto glass, all at the fair pricing Mory's is known for. Hablamos español.",
    nearby: ["Pinecrest (border)", "The Hammocks", "Sunset", "Dadeland"],
    keywords: [
      "auto parts kendall",
      "car parts kendall fl",
      "used auto parts kendall miami",
    ],
  },
];

export function getLocation(slug: string): Location | undefined {
  return locations.find((l) => l.slug === slug);
}
