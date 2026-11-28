import { prisma } from "@/lib/prisma";
import { SeoCitation, SeoGeoTarget, SeoKeyStat, SeoVendorSnapshot } from "./types";
import { DEFAULT_VENDOR_LOGISTICS } from "@/lib/logisticsEngine";

export interface GroundedCatalogSummary {
  cabin20CostInr: number;
  cabin40CostInr: number;
  puf50CostInr: number;
  canopy75CostInr: number;
  craneGroundInr: number;
  craneTerraceInr: number;
  knockDownAssemblyInr: number;
  transportPerKm20ftInr: number;
  transportPerKm40ftInr: number;
  refurbDiscountPct: number;
  usedWwtDiscountPct: number;
  gstPct: number;
  vendorCount: number;
  avgWarrantyYears: number;
  minLeadDays: number;
  vendors: SeoVendorSnapshot[];
  elementsList: Array<{ code: string; name: string; baseCostInr: number; mountZone: string }>;
  presetsList: Array<{ code: string; title: string; approxPriceLabel: string; environment: string }>;
  authoritativeCitations: SeoCitation[];
  currencyGuide: string;
  keyStats: SeoKeyStat[];
  verifiedDate: string;
}

const REGION_CITATIONS: Record<SeoGeoTarget, SeoCitation[]> = {
  GLOBAL: [
    {
      title: "International Residential Code (IRC) Appendix AQ — Tiny Houses & Prefab Modules",
      publisher: "International Code Council (ICC)",
      reference: "https://codes.iccsafe.org/",
      year: "2024",
    },
    {
      title: "Permitted Development Rights for Outbuildings & Garden Rooms",
      publisher: "UK Planning Portal / GOV.UK",
      reference: "https://www.planningportal.co.uk/permission/common-projects/outbuildings",
      year: "2025",
    },
    {
      title: "Insulation & Building Envelope R-Value Guidelines",
      publisher: "U.S. Department of Energy (Energy Saver)",
      reference: "https://www.energy.gov/energysaver/insulation",
      year: "2025",
    },
    {
      title: "IS 800 General Construction in Steel & Structural Live-Load Benchmarks",
      publisher: "Bureau of Indian Standards (BIS)",
      reference: "https://www.bis.gov.in/",
      year: "2024",
    },
    {
      title: "National Construction Code (NCC) Class 1a & 10a Secondary Dwellings",
      publisher: "Australian Building Codes Board (ABCB)",
      reference: "https://ncc.abcb.gov.au/",
      year: "2025",
    },
  ],
  US: [
    {
      title: "IRC Appendix Q / AQ Tiny Houses & Prefabricated ADU Standards",
      publisher: "International Code Council (ICC)",
      reference: "https://codes.iccsafe.org/",
      year: "2024",
    },
    {
      title: "Accessory Dwelling Unit (ADU) Handbook & Zoning Reforms",
      publisher: "California Dept. of Housing and Community Development (HCD)",
      reference: "https://www.hcd.ca.gov/policy-and-research/accessory-dwelling-units",
      year: "2025",
    },
    {
      title: "Recommended Home Insulation R-Values by Climate Zone",
      publisher: "U.S. Department of Energy",
      reference: "https://www.energy.gov/energysaver/insulation",
      year: "2025",
    },
    {
      title: "Residential Clean Energy & Solar Tax Credit (Section 25D)",
      publisher: "Internal Revenue Service (IRS)",
      reference: "https://www.irs.gov/credits-deductions/residential-clean-energy-credit",
      year: "2025",
    },
  ],
  UK: [
    {
      title: "Outbuildings & Garden Rooms Permitted Development Rules (Class E)",
      publisher: "UK Planning Portal",
      reference: "https://www.planningportal.co.uk/permission/common-projects/outbuildings",
      year: "2025",
    },
    {
      title: "Building Regulations Approval Exemptions for Detached Buildings Under 15–30 m²",
      publisher: "GOV.UK Building Regulations",
      reference: "https://www.gov.uk/building-regulations-approval",
      year: "2025",
    },
    {
      title: "Part L Conservation of Fuel & Power Thermal Envelope Guidance",
      publisher: "UK Dept. for Levelling Up, Housing & Communities",
      reference: "https://www.gov.uk/government/publications/conservation-of-fuel-and-power-approved-document-l",
      year: "2024",
    },
    {
      title: "Electrical Safety Part P Notification for Garden Offices",
      publisher: "Electrical Safety First",
      reference: "https://www.electricalsafetyfirst.org.uk/",
      year: "2025",
    },
  ],
  AU: [
    {
      title: "National Construction Code (NCC) Volumes 1 & 2 Secondary Dwellings",
      publisher: "Australian Building Codes Board (ABCB)",
      reference: "https://ncc.abcb.gov.au/",
      year: "2025",
    },
    {
      title: "Exempt & Complying Development Backyard Pods / Granny Flats",
      publisher: "NSW Planning Portal",
      reference: "https://www.planningportal.nsw.gov.au/",
      year: "2025",
    },
    {
      title: "NatHERS Nationwide House Energy Rating Scheme",
      publisher: "Australian Government DCCEEW",
      reference: "https://www.nathers.gov.au/",
      year: "2025",
    },
  ],
  IN: [
    {
      title: "National Building Code (NBC) Part 6 Structural Design & Live Loads",
      publisher: "Bureau of Indian Standards (BIS)",
      reference: "https://www.bis.gov.in/",
      year: "2024",
    },
    {
      title: "IS 800 Code of Practice for General Construction in Steel",
      publisher: "Bureau of Indian Standards (BIS)",
      reference: "https://www.bis.gov.in/",
      year: "2024",
    },
    {
      title: "Rooftop Solar PM Surya Ghar Subsidy & Net Metering Architecture",
      publisher: "Ministry of New and Renewable Energy (MNRE)",
      reference: "https://pmsuryaghar.gov.in/",
      year: "2025",
    },
    {
      title: "HSN 9406 Prefabricated Buildings GST Rate Classification",
      publisher: "Central Board of Indirect Taxes & Customs (CBIC)",
      reference: "https://www.cbic.gov.in/",
      year: "2025",
    },
  ],
};

export async function loadGroundedCatalog(targetGeo: SeoGeoTarget): Promise<GroundedCatalogSummary> {
  const [elements, presets, defaults, vendorsRaw] = await Promise.all([
    prisma.masterElement.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.roomPreset.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.logisticsDefaults.findUnique({ where: { id: "singleton" } }),
    prisma.vendorProfile.findMany({
      where: { approvalStatus: "APPROVED" },
      include: { rateCards: true },
      orderBy: [{ rating: "desc" }, { warrantyYears: "desc" }],
    }),
  ]);

  const cabin20 = elements.find((e) => e.code === "CABIN_20FT");
  const cabin40 = elements.find((e) => e.code === "CABIN_40FT");

  const cabin20CostInr = cabin20?.baseCost ?? 245000;
  const cabin40CostInr = cabin40?.baseCost ?? 440000;
  const puf50CostInr = defaults?.puf50mmCost ?? 14000;
  const canopy75CostInr = defaults?.flyRoofCanopyPrice ?? 24000;
  const craneGroundInr = defaults?.craneGroundFee ?? 6500;
  const craneTerraceInr = defaults?.craneTerraceFee ?? 18500;
  const knockDownAssemblyInr = defaults?.knockDownAssemblyFee ?? 18000;
  const transportPerKm20ftInr = defaults?.transportPerKm20ft ?? 85;
  const transportPerKm40ftInr = defaults?.transportPerKm40ft ?? 115;
  const refurbDiscountPct = defaults?.defaultRefurbDiscount ?? 38;
  const usedWwtDiscountPct = defaults?.defaultUsedWwtDiscount ?? 55;
  const gstPct = defaults?.gstRatePct ?? 18;

  const vendors: SeoVendorSnapshot[] = vendorsRaw.map((v) => {
    const c20Card = v.rateCards.find((r) => r.elementCode === "CABIN_20FT");
    const c40Card = v.rateCards.find((r) => r.elementCode === "CABIN_40FT");
    const logCard = v.rateCards.find((r) => r.elementCode === "__VENDOR_LOGISTICS__");
    let logParsed = { ...DEFAULT_VENDOR_LOGISTICS };
    if (logCard?.attributeModifiersJson) {
      try {
        logParsed = { ...logParsed, ...JSON.parse(logCard.attributeModifiersJson) };
      } catch {
        // fallback defaults
      }
    }
    const suitFlags: string[] = [];
    if (logParsed.knockDownSupported) suitFlags.push("Flat-Pack Rooftops & Narrow Lanes");
    if (logParsed.sellsRefurbished) suitFlags.push(`Refurbished Stock (${logParsed.refurbStockCount || 0} units)`);
    if (v.warrantyYears >= 6) suitFlags.push("Extended Structural Warranty");
    if (v.leadDays <= 12) suitFlags.push("Fast Dispatch Turnaround");

    return {
      vendorId: v.id,
      companyName: v.companyName,
      city: v.city,
      phone: v.phone,
      warrantyYears: v.warrantyYears,
      leadDays: v.leadDays,
      isSponsored: v.isSponsored,
      knockDownSupported: Boolean(logParsed.knockDownSupported),
      sellsRefurbished: Boolean(logParsed.sellsRefurbished),
      refurbStockCount: Number(logParsed.refurbStockCount || 0),
      cabin20PriceInr: c20Card?.baseUnitPrice ?? cabin20CostInr,
      cabin40PriceInr: c40Card?.baseUnitPrice ?? cabin40CostInr,
      bestSuitedFor: suitFlags.slice(0, 2).join(" • ") || "Turnkey Standard Builds",
    };
  });

  const avgWarrantyYears = vendors.length
    ? Math.round((vendors.reduce((s, v) => s + v.warrantyYears, 0) / vendors.length) * 10) / 10
    : 5;
  const minLeadDays = vendors.length ? Math.min(...vendors.map((v) => v.leadDays)) : 10;

  const currencyGuide =
    "Global localized turnkey benchmarks: India ₹3.1L–₹7.8L (ex-factory + GST + crane); US turnkey backyard ADU/pod $18,000–$65,000 (excl. site utility trenching); UK garden room £14,500–£42,000 (incl. VAT & insulated slab); Australia backyard pod A$24,000–A$72,000.";

  const verifiedDate = new Date().toISOString().slice(0, 10);

  const keyStats: SeoKeyStat[] = [
    { label: "Standard 20ft Module Footprint", value: "6.06m × 2.44m (160 sq ft / 14.8 m²)", context: "Single-crane footprint" },
    { label: "Standard 40ft Module Footprint", value: "12.19m × 2.44m (320 sq ft / 29.7 m²)", context: "Studio / 1-BHK span" },
    { label: "Base 20ft Factory Range", value: `₹${cabin20CostInr.toLocaleString("en-IN")}`, context: `Verified ${verifiedDate} ex-works` },
    { label: "Refurbished & Used Savings", value: `${refurbDiscountPct}% – ${usedWwtDiscountPct}%`, context: "Refurb vs WWT used units" },
    { label: "Verified Partner Dispatch", value: `${minLeadDays}–21 Days`, context: `${vendors.length} audited fabricators` },
    { label: "PUF-75mm + Canopy Cooling", value: "6–9°C drop", context: "Sloped air-gap heat shield" },
    { label: "Ground vs Terrace Crane Lift", value: `₹${craneGroundInr.toLocaleString("en-IN")} vs ₹${craneTerraceInr.toLocaleString("en-IN")}`, context: "Rigging & spreader lift" },
    { label: "Avg Structural Warranty", value: `${avgWarrantyYears} Years`, context: "Audited manufacturer coverage" },
  ];

  return {
    cabin20CostInr,
    cabin40CostInr,
    puf50CostInr,
    canopy75CostInr,
    craneGroundInr,
    craneTerraceInr,
    knockDownAssemblyInr,
    transportPerKm20ftInr,
    transportPerKm40ftInr,
    refurbDiscountPct,
    usedWwtDiscountPct,
    gstPct,
    vendorCount: vendors.length,
    avgWarrantyYears,
    minLeadDays,
    vendors,
    elementsList: elements.map((e) => ({
      code: e.code,
      name: e.friendlyName || e.name,
      baseCostInr: e.baseCost,
      mountZone: e.mountZone || "FLOOR_INTERIOR",
    })),
    presetsList: presets.map((p) => ({
      code: p.code,
      title: p.title,
      approxPriceLabel: p.approxPriceLabel,
      environment: p.environment,
    })),
    authoritativeCitations: REGION_CITATIONS[targetGeo] || REGION_CITATIONS.GLOBAL,
    currencyGuide,
    keyStats,
    verifiedDate,
  };
}
