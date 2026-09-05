// Tanzania reference data + domain vocabulary shared across all four modules.

/**
 * The USSD short code shown throughout the UI. The webhook itself ignores
 * `serviceCode`, so this is presentation only — set it to whatever channel
 * Africa's Talking assigns you.
 */
export const USSD_CODE = process.env.NEXT_PUBLIC_USSD_CODE ?? "*384*7788#";

export const REGIONS: Record<string, string[]> = {
  "Dar es Salaam": ["Kinondoni", "Ilala", "Temeke", "Ubungo", "Kigamboni"],
  Arusha: ["Arusha City", "Arumeru", "Monduli"],
  Mwanza: ["Nyamagana", "Ilemela", "Sengerema"],
  Dodoma: ["Dodoma City", "Chamwino", "Bahi"],
  Mbeya: ["Mbeya City", "Mbalali", "Kyela"],
  Tanga: ["Tanga City", "Muheza", "Korogwe"],
  Morogoro: ["Morogoro Urban", "Mvomero", "Kilosa"],
  Kilimanjaro: ["Moshi", "Hai", "Rombo"],
};

export const REGION_NAMES = Object.keys(REGIONS);

export const TECH_SKILLS = [
  "Welding",
  "Electrical",
  "Hydraulics",
  "Diesel Engines",
  "Refrigeration",
  "CNC Machining",
  "Generator Repair",
  "Conveyor Systems",
  "Boiler Maintenance",
  "PLC / Automation",
  "Pneumatics",
  "Milling & Grinding",
];

export const MACHINE_CATEGORIES = [
  "Machinery",
  "Spare Parts",
  "Tools",
  "Vehicles",
];

export const WASTE_CATEGORIES = [
  "Metal",
  "Plastic",
  "Textile",
  "Organic",
  "Wood",
  "Glass",
  "Chemical",
];

export const LABOUR_CATEGORIES = [
  "Loading",
  "Cleaning",
  "Packaging",
  "Construction",
  "Assembly",
  "Warehouse",
];

export const PAYMENT_METHODS = [
  { id: "MPESA", label: "M-Pesa", hint: "Vodacom" },
  { id: "TIGOPESA", label: "Mixx by Yas", hint: "Tigo" },
  { id: "AIRTELMONEY", label: "Airtel Money", hint: "Airtel" },
  { id: "HALOPESA", label: "HaloPesa", hint: "Halotel" },
] as const;

export const MODULES = [
  {
    slug: "fundilink",
    name: "FundiLink",
    tagline: "Technicians on demand",
    swahili: "Pata fundi haraka",
    description:
      "Describe the fault, get quotes from verified technicians nearby, and hire the right fundi the same day.",
    href: "/fundilink",
    accent: "#ff7449",
  },
  {
    slug: "machineshare",
    name: "MachineShare",
    tagline: "Rent machinery & parts",
    swahili: "Kodisha mitambo",
    description:
      "Access heavy-duty equipment and spare parts without buying them outright. List idle machines and earn.",
    href: "/machineshare",
    accent: "#3175b8",
  },
  {
    slug: "takatrade",
    name: "TakaTrade",
    tagline: "Industrial waste market",
    swahili: "Uza taka za viwanda",
    description:
      "Turn factory by-products into affordable raw material for another business instead of landfill.",
    href: "/takatrade",
    accent: "#338346",
  },
  {
    slug: "kibaruapay",
    name: "KibaruaPay",
    tagline: "Labour with secure pay",
    swahili: "Kazi na malipo salama",
    description:
      "Post short-term industrial work, hire nearby workers, and pay through mobile-money escrow.",
    href: "/kibaruapay",
    accent: "#7554b5",
  },
] as const;

export const URGENCY = [
  { id: "LOW", label: "Can wait", color: "#36834a" },
  { id: "NORMAL", label: "This week", color: "#bd8a00" },
  { id: "URGENT", label: "Production stopped", color: "#db4d30" },
] as const;

/** Normalise any Tanzanian number to E.164 so Africa's Talking accepts it. */
export function normalisePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+255")) return digits;
  if (digits.startsWith("255")) return `+${digits}`;
  if (digits.startsWith("0")) return `+255${digits.slice(1)}`;
  if (digits.length === 9) return `+255${digits}`;
  return digits;
}
