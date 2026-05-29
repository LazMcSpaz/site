// Single source of truth for homepage copy across all three design directions.
// Edits here propagate to /, /editorial, /sport.

export const business = {
  name: "Mory's Auto Parts and Glass",
  shortName: "Mory's",
  phone: "305-835-2777",
  phoneHref: "tel:+13058352777",
  email: "mory7373@gmail.com",
  address: {
    line1: "151 E 10th Ave",
    line2: "Hialeah, FL 33010",
  },
  hours: "Mon–Fri · 9am – 5pm",
  mapsUrl:
    "https://www.google.com/maps/place/Mory's+Auto+Parts+and+glass/@25.8245067,-80.263543,17z",
};

export const hero = {
  eyebrow: "Hialeah · Miami-Dade · Broward",
  headlineLead: "Need a car part in",
  headlineHighlight: "South Florida",
  headlineTail: "We find it. Fair price. Fast.",
  subhead:
    "New, used, and aftermarket parts — sourced from a network we've built over years on the ground in Hialeah. Hard-to-find is our specialty. Hablamos español.",
  ctaPrimary: "Call",
  ctaSecondary: "Or send us your part request",
  trustItems: [
    "Google Reviews",
    "Open Mon–Fri · 9am–5pm",
    "Bilingual · English & Español",
  ],
};

export const reviews = [
  {
    quote:
      "Called Mory's looking for a part three other shops couldn't find. They had it priced and ready by the next day. These are the people you call when you actually need it solved.",
    name: "Carlos R.",
    location: "Hialeah",
  },
  {
    quote:
      "Honest pricing and no run-around. Alex told me straight what was a good deal and what wasn't worth it. That's rare.",
    name: "Marisol P.",
    location: "Miami",
  },
  {
    quote:
      "Got me an aftermarket fender at half what the dealer quoted. Picked it up same week. I've been sending family here ever since.",
    name: "Devon T.",
    location: "Opa-Locka",
  },
];

export const howItWorks = [
  {
    n: "01",
    title: "Call us with what you need",
    body: "Tell us the year, make, model, and the part. New, used, or aftermarket — whatever fits your budget.",
    icon: "phone",
  },
  {
    n: "02",
    title: "We hit the network",
    body: "We work our suppliers, salvage contacts, and warehouses across South Florida to track it down.",
    icon: "search",
  },
  {
    n: "03",
    title: "You get options and a price",
    body: "We call you back with what we found, what each one costs, and which one we'd actually buy ourselves.",
    icon: "tag",
  },
  {
    n: "04",
    title: "Pick up or get it delivered",
    body: "Stop by the shop in Hialeah, or — depending on the order — we'll bring it to you across Miami-Dade and Broward.",
    icon: "truck",
  },
];

export const categories = [
  {
    title: "New parts",
    blurb:
      "OEM and quality replacements ordered direct from our supplier network — at prices the dealership can't match.",
    icon: "package",
  },
  {
    title: "Used parts",
    blurb:
      "Verified salvage and pull-and-go pieces that pass our quality check. Real savings without the gamble.",
    icon: "recycle",
  },
  {
    title: "Aftermarket",
    blurb:
      "Bumpers, fenders, lights, mirrors — body and trim parts at a fraction of OEM, ready when you need them.",
    icon: "wrench",
  },
  {
    title: "Auto glass",
    blurb:
      "Windshields, side glass, and back glass for most makes and models. Sourced fast, installed clean.",
    icon: "window",
  },
];

export const serviceCities = [
  "Hialeah",
  "Miami",
  "Hialeah Gardens",
  "Opa-Locka",
  "Doral",
  "North Miami",
  "Fontainebleau",
  "Kendall",
];

export const stats = [
  { value: "South FL", label: "Where we serve" },
  { value: "EN / ES", label: "Spoken at the counter" },
  { value: "Mon–Fri", label: "Open 9 to 5" },
  { value: "Same week", label: "Typical sourcing time" },
];
