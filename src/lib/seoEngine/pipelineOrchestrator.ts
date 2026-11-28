import { prisma } from "@/lib/prisma";
import { GroundedCatalogSummary, loadGroundedCatalog } from "./catalogGrounder";
import { generateWithBestLlm } from "./llmRouter";
import { buildSchemaJsonLd } from "./guideReader";
import { countWords, scoreSeoPost, slugifySeo } from "./complianceScorer";
import {
  LlmRuntimeConfig,
  SeoClusterRole,
  SeoFaqItem,
  SeoGeoTarget,
  SeoIntentType,
  SeoSectionBlock,
} from "./types";

interface BlueprintSectionSpec {
  id: string;
  heading: string;
  focus: string;
  category:
    | "INTRO"
    | "QUICK_TABLE"
    | "METHODOLOGY"
    | "VENDOR_PROFILES"
    | "NEED_ROUTER"
    | "COST"
    | "PRODUCTS"
    | "PLANNING"
    | "SPECIALISTS"
    | "COMPARISONS"
    | "ELIGIBILITY"
    | "PROBLEMS"
    | "SEGMENTS"
    | "FINANCING"
    | "MAINTENANCE"
    | "GEO_HUBS"
    | "CHECKLIST"
    | "SCENARIOS"
    | "DECISION"
    | "VERDICT";
}

const GEO_LABELS: Record<SeoGeoTarget, { name: string; currencyNote: string; permitBody: string }> = {
  GLOBAL: {
    name: "Global (US, UK, Europe, Australia, UAE & India)",
    currencyNote: "US ($), UK (£), Australia (A$), and India (₹)",
    permitBody: "IRC Appendix AQ (US), UK Class E Permitted Development, ABCB NCC (AU), and BIS IS 800 / NBC (India)",
  },
  US: {
    name: "United States & Canada",
    currencyNote: "USD ($18,000–$65,000 turnkey backyard ADU / studio ranges)",
    permitBody: "IRC Appendix AQ, local municipal setbacks, HOA covenants, and Title 24 / IECC R-values",
  },
  UK: {
    name: "United Kingdom & Ireland",
    currencyNote: "GBP (£14,500–£42,000 insulated garden room / studio ranges incl. VAT)",
    permitBody: "UK Planning Portal Class E Permitted Development (2.5m boundary eaves rule, Part P electrical, Part L insulation)",
  },
  AU: {
    name: "Australia & New Zealand",
    currencyNote: "AUD (A$24,000–A$72,000 backyard studio / granny flat ranges)",
    permitBody: "ABCB National Construction Code (NCC), Complying Development Certificate (CDC), BAL bushfire & wind ratings",
  },
  IN: {
    name: "India",
    currencyNote: "INR (₹3.1L–₹7.8L turnkey portacabin, plus 18% GST HSN 9406 and Hydra crane charges)",
    permitBody: "Municipal rooftop load / NOC clearance, IS 800 steel framing, BIS seismic Zone II–V anchoring",
  },
};

function buildAuthorityBlueprint20(keyword: string, geo: SeoGeoTarget): BlueprintSectionSpec[] {
  const geoInfo = GEO_LABELS[geo];
  const kwTitle = keyword.replace(/\b\w/g, (c) => c.toUpperCase());
  return [
    {
      id: "sec-01-intro",
      heading: `Introduction: Finding & Planning ${kwTitle} (${new Date().getFullYear()} Authority Guide)`,
      focus: "Informational overview, consumer shift to backyard/rooftop prefabricated rooms, why pre-planning prevents hidden crane/permit costs, core qualification basics.",
      category: "INTRO",
    },
    {
      id: "sec-02-quick-comparison",
      heading: `Quick Comparison: Verified Prefab Room Makers & Fleet Hubs (${geoInfo.name})`,
      focus: "Commercial comparison table of verified partner manufacturers from live database with city, best use-case, lead days, warranty, and items buyers must verify.",
      category: "QUICK_TABLE",
    },
    {
      id: "sec-03-methodology",
      heading: "How We Evaluate & Verify Prefab Manufacturers (Methodology & Disclosures)",
      focus: "Transparent 10-criteria grading rubric (chassis steel gauge, GST/business verification, PUF density, flat-pack engineering, aftercare), paid/sponsored placement disclosure.",
      category: "METHODOLOGY",
    },
    {
      id: "sec-04-vendor-profiles",
      heading: "Detailed Capabilities Profiles of Verified Modular Manufacturers",
      focus: "Identical structured review template per verified factory: overview, 20ft/40ft baseline rate, flat-pack capability, refurb stock, warranty, limitations, ideal buyer.",
      category: "VENDOR_PROFILES",
    },
    {
      id: "sec-05-best-for-need",
      heading: "Which Prefab Spec or Manufacturer Matches Your Specific Need?",
      focus: "Need-based router covering WFH office pods, rooftop terrace rooms, narrow-lane knock-down kits, used budget cabins, off-grid solar rooms, and commercial cafe pods.",
      category: "NEED_ROUTER",
    },
    {
      id: "sec-06-costs",
      heading: `Complete ${new Date().getFullYear()} Cost Breakdown Across ${geoInfo.currencyNote}`,
      focus: "Itemized factory vs insulated upgrade vs freight vs crane vs tax breakdown plus 9-row Hidden Costs Checklist before signing.",
      category: "COST",
    },
    {
      id: "sec-07-products-guide",
      heading: "Complete Guide to Prefab Structural Modules, Glass & Off-Grid Add-Ons",
      focus: "Deep standardized breakdown (what it is, ideal candidate, timeline, lifespan, price impact, limits) for 20ft/40ft hulls, PUF-75 canopy, split inverter AC, rooftop solar, bathroom pods, and decks.",
      category: "PRODUCTS",
    },
    {
      id: "sec-08-smile-room-planning",
      heading: "Complete Prefab Space Planning, Digital 3D Previews & Floorplan Proportions",
      focus: "Translating room acoustics, daylight cross-ventilation, ceiling height, and 3D digital twin previews into factory build drawings without unrealistic expectations.",
      category: "PLANNING",
    },
    {
      id: "sec-09-specialists",
      heading: "Who Should Build & Approve Your Project? Fabricator vs Civil Engineer vs Rigger Matrix",
      focus: "Comparison table clarifying factory manufacturer vs licensed structural engineer vs municipal planner vs Part-P/licensed electrician vs crane contractor roles.",
      category: "SPECIALISTS",
    },
    {
      id: "sec-10-comparisons",
      heading: "Head-to-Head System Comparisons: Veneer-Clad Steel vs PUF vs Used Containers vs Masonry",
      focus: "Structured vs-comparisons: Brand New vs Refurbished vs Used WWT, 75mm Canopy vs 50mm PUF, Ready-Built Crane vs Knock-Down Kit, Prefab Cabin vs Brick-and-Mortar.",
      category: "COMPARISONS",
    },
    {
      id: "sec-11-eligibility-risks",
      heading: "Site Eligibility, Structural Load Risks, Drainage & Engineering Limitations (YMYL)",
      focus: "Who should avoid heavy rooftop lifts without I-beams, RCC 2.0 kN/m² limits, waterproofing damage, condensation risk, damp coastal corrosion, crane street width caps.",
      category: "ELIGIBILITY",
    },
    {
      id: "sec-12-specific-problems",
      heading: "Solving Specific Property Constraints: Tight Lanes, Heatwaves, Monsoons & Rentals",
      focus: "Repeatable Problem->Solution matrix covering 12+ concrete homeowner issues (narrow <12ft lane, HT overhead wires, extreme summer heat, urgent 14-day setup, zero permanent foundation).",
      category: "PROBLEMS",
    },
    {
      id: "sec-13-segments",
      heading: "Custom Prefab Solutions by Buyer Lifestyle: Remote Workers, Seniors, Families & Businesses",
      focus: "WFH acoustic pods, multigenerational accessible granny-flat ADUs with grab rails, wedding/guest overflow suites, retail kiosks & boutique backyard clinics.",
      category: "SEGMENTS",
    },
    {
      id: "sec-14-financing-tax",
      heading: "Permits, Construction Loans, Home Equity, Tax Classification & Rental Payback ROI",
      focus: `Zoning rules (${geoInfo.permitBody}), HELOC/personal loan APR vs turnkey ROI, Airbnb/office rental payback math, India GST HSN 9406 & solar clean energy incentives.`,
      category: "FINANCING",
    },
    {
      id: "sec-15-maintenance",
      heading: "How Long Prefab Rooms Last: 10-Year Sealant, Rust & Component Maintenance Schedule",
      focus: "20-30 year structural lifespan, year-by-year waterproofing/sealant/gasket care, AC drain pitch, split-roof recoating, crane-relocation resale liquidity.",
      category: "MAINTENANCE",
    },
    {
      id: "sec-16-geo-hubs",
      heading: `Regional & Neighborhood Deployment Guide Across ${geoInfo.name}`,
      focus: "Location-specific freight distance economics, coastal humid waterproofing vs desert thermal shielding, municipal inspection expectations across major cities & suburbs.",
      category: "GEO_HUBS",
    },
    {
      id: "sec-17-checklist",
      heading: "How to Choose & Verify a Prefab Fabricator: 6-Category Consultation Checklist & Red Flags",
      focus: "Exact questions across Credentials, Design/Engineering, Materials, Itemized Quotes, Structural Safety, and Aftercare + 9 Contract Red Flags.",
      category: "CHECKLIST",
    },
    {
      id: "sec-18-scenarios",
      heading: "Real-World Hypothetical Budget & Deployment Scenarios (Transparent Benchmarks)",
      focus: "Three detailed non-fabricated deployment blueprints comparing Ground Backyard Office, Rooftop PUF-75 Terrace Room, and Factory-Refurbished Shop Pod.",
      category: "SCENARIOS",
    },
    {
      id: "sec-19-decision-matrix",
      heading: "Interactive Buying Matrix: Picking Your Module Spec Before Calling Makers",
      focus: "Structured step-by-step triage helping readers finalize 20ft vs 40ft, ready vs knock-down, and insulation specs before requesting quotes.",
      category: "DECISION",
    },
    {
      id: "sec-20-verdict",
      heading: `Final Verdict: Selecting the Safe, Cost-Transparent Setup for ${kwTitle}`,
      focus: "Actionable closing roadmap connecting interactive 3D modeling, GPS distance costing, and multi-maker quote comparison.",
      category: "VERDICT",
    },
  ];
}

function buildClusteredAeoFaqs(keyword: string, catalog: GroundedCatalogSummary): SeoFaqItem[] {
  const c20 = catalog.cabin20CostInr.toLocaleString("en-IN");
  const c40 = catalog.cabin40CostInr.toLocaleString("en-IN");
  const canopy = catalog.canopy75CostInr.toLocaleString("en-IN");
  const kdFee = catalog.knockDownAssemblyInr.toLocaleString("en-IN");

  return [
    // Cluster A — General Basics
    { cluster: "A. General Basics", question: `What is ${keyword} and how is it built?`, answer: "A prefabricated modular room is fabricated inside a climate-controlled factory using welded hollow structural steel frames, insulated sandwich wall panels, double-glazed windows, and pre-wired electrical conduits before delivery by trailer or flat-pack assembly." },
    { cluster: "A. General Basics", question: "How fast can a prefab room be installed compared to brick construction?", answer: `Verified factory partners dispatch finished 20ft and 40ft modules in ${catalog.minLeadDays}–21 days, with on-site placement completed in 2–4 hours by crane or 1–2 days via flat-pack bolting—versus 3–6 months for conventional masonry.` },
    { cluster: "A. General Basics", question: "Are prefabricated rooms durable enough for permanent daily living?", answer: "Yes, when built with >=2.0mm structural steel corner posts, marine-grade epoxy primers, fiber-cement/marine plywood floors, and high-density PUF/Rockwool insulation—delivering 20–30+ year service life." },
    { cluster: "A. General Basics", question: "Can a prefabricated cabin be relocated if I move houses?", answer: "Single-module 20ft and 40ft units include ISO-grade corner lift points engineered for crane re-lifting onto a flatbed truck, retaining substantial secondary resale liquidity." },
    { cluster: "A. General Basics", question: "What is the standard floor area of a 20ft and 40ft prefab module?", answer: "A 20ft unit measures 6.06m × 2.44m (approx. 160 sq ft / 14.8 m² exterior envelope), while a 40ft unit measures 12.19m × 2.44m (320 sq ft / 29.7 m²). Multi-module joins double or triple usable space." },

    // Cluster B — Manufacturer Selection & E-E-A-T
    { cluster: "B. Selecting Verified Makers", question: "How do I verify whether a portacabin manufacturer is trustworthy?", answer: "Verify valid business tax registration (GSTIN in India, contractor/modular manufacturer registration in US/UK/AU), factory workshop address, steel frame thickness specs in writing, itemized crane exclusions, and documented weld/leak warranties." },
    { cluster: "B. Selecting Verified Makers", question: "Should I pick a local yard or an out-of-state fabricator?", answer: `Because 20ft trailer transport costs ~₹${catalog.transportPerKm20ftInr}/km ($4–$8/mile), ordering within 50–150 km often beats slightly cheaper out-of-state factory quotes once round-trip crane mobilization is added.` },
    { cluster: "B. Selecting Verified Makers", question: "Do sponsored manufacturers pay to override safety or quality criteria?", answer: "No. On MyPrefabRoom, sponsored placement flags paid promotional visibility transparently while technical scores remain strictly tied to warranty length, flat-pack capability, verified delivery options, and transparent rate cards." },
    { cluster: "B. Selecting Verified Makers", question: "In-house factory assembly vs local welding crew: which is safer?", answer: "Controlled factory welding jigs ensure square door plumbness, uniform anti-corrosion coatings, and hidden conduit safety tested before dispatch, reducing on-site rain delays and sloppy site welds." },
    { cluster: "B. Selecting Verified Makers", question: "What questions must I ask before paying any factory deposit?", answer: "Ask in writing: exact steel RHS tube wall thickness, PUF panel density (kg/m³), floor board thickness, included/excluded crane tonnage, wire capacity ratings, and written water-leak warranty terms." },

    // Cluster C — Pricing & Hidden Fees
    { cluster: "C. Costs & Hidden Fees", question: `How much does a 20ft prefab room cost in ${new Date().getFullYear()}?`, answer: `Base India ex-factory 20ft shells start around ₹${c20} (turnkey insulated + crane + 18% GST typically ₹3.1L–₹5.5L). Global residential ADU-code builds range $18,000–$35,000 USD, £14,500–£28,000 GBP, or A$24,000–A$45,000 AUD.` },
    { cluster: "C. Costs & Hidden Fees", question: "How much does a larger 40ft studio or 1-BHK modular unit cost?", answer: `India ex-factory 40ft modules begin near ₹${c40} pre-tax (turnkey with bath/kitchen ₹5.8L–₹9.5L+), while US/UK/AU plumbed 40ft ADUs typically range $42,000–$65,000 USD / £32,000–£48,000 GBP.` },
    { cluster: "C. Costs & Hidden Fees", question: "What hidden costs commonly surprise first-time prefab buyers?", answer: "Five hidden costs cause most surprises: high-reach terrace crane hire, narrow-street manual flat-pack labor, concrete plinth footings or roof steel I-beam skids, utility trenching/earthing pits, and regional tax/GST." },
    { cluster: "C. Costs & Hidden Fees", question: "Can I arrange my own transport (Self-Pickup) to lower the quote?", answer: "Yes. If you operate your own flatbed or local Hydra crane, choosing Self-Pickup eliminates platform freight and rigging margins (₹0 delivery surcharge)." },
    { cluster: "C. Costs & Hidden Fees", question: "Are cheap uninsulated container shells safe for home offices?", answer: "Cheap single-sheet boxes trap extreme radiant solar heat above 45–50°C indoors, suffer condensation drip on laptops, and lack proper MCB/RCCB earthing—costing more to retrofit later than buying 50mm–75mm PUF upfront." },

    // Cluster D — Rooftop Terraces & Foundations
    { cluster: "D. Terraces & Foundations", question: "Can I install a prefab portacabin safely on my house terrace roof?", answer: "Yes, provided a structural civil engineer verifies column capacity and places longitudinal steel I-beam load-transfer runners across primary RCC beam/column grids rather than loading mid-span slabs directly." },
    { cluster: "D. Terraces & Foundations", question: "How much does a 20ft prefabricated room weigh?", answer: "An outfitted 20ft insulated steel room with vitrified/vinyl flooring, AC, and partitioned glazing typically weighs 1,600–2,400 kg (approx. 1.6–2.4 metric tons) spread across corner pads." },
    { cluster: "D. Terraces & Foundations", question: "Will placing a cabin on a terrace damage waterproof roof tiles?", answer: "Never set metal runners flat onto roof waterproofing. Elevate the chassis 150–200mm on rubber-cushioned RCC plinth blocks or welded steel pedestals so rainwater flows freely and waterproofing stays inspectable." },
    { cluster: "D. Terraces & Foundations", question: "What ground foundation is cheapest for a lawn or backyard office pod?", answer: "Compact level ground pods generally require 6 precast PCC plinth blocks or concrete pier pads over compacted gravel rather than a full expensive continuous RCC raft slab." },
    { cluster: "D. Terraces & Foundations", question: "How much extra does terrace crane rigging cost vs ground placement?", answer: `Ground crane unloading averages ~₹${catalog.craneGroundInr.toLocaleString("en-IN")}, whereas lifting over 1st–3rd floor roofs uses heavier telescopic cranes (~₹${catalog.craneTerraceInr.toLocaleString("en-IN")}+ depending on setback).` },

    // Cluster E — Permits, Zoning & Compliance (YMYL)
    { cluster: "E. Permits & Zoning Codes", question: "Do US homeowners need a building permit for a backyard office pod?", answer: "Many US counties exempt detached single-story non-habitable office/sheds under 100–120 sq ft from building permits (subject to yard setbacks), while plumbed ADUs or electric service subpanels always require permitting." },
    { cluster: "E. Permits & Zoning Codes", question: "When is a UK garden room exempt under Class E Permitted Development?", answer: "Under UK Class E rules, detached rear garden outbuildings not used for overnight sleeping generally need no planning permission if kept single-story, <=2.5m high within 2m of boundaries, covering <50% of garden land." },
    { cluster: "E. Permits & Zoning Codes", question: "What permits apply in India for farmhouses vs urban terraces?", answer: "Portable non-permanent units on private agricultural/industrial land typically avoid heavy permanent masonry FSI penalties, whereas urban apartment terraces require Housing Society NOCs and municipal structural safety adherence." },
    { cluster: "E. Permits & Zoning Codes", question: "Can I legally rent out a backyard prefab pod on Airbnb?", answer: "Short-term rental legality depends strictly on municipal ADU zoning, fire egress windows, hardwired smoke alarms, and local short-term rental registration—verify city code before investing for rental ROI." },
    { cluster: "E. Permits & Zoning Codes", question: "Do I need a certified electrician to hook up mains power?", answer: "Always yes. Even factory pre-wired pods require licensed on-site mains armored trenching, dedicated RCCB earth-leakage protection, and dual earth pits for human safety." },

    // Cluster F — New vs Refurbished vs 2nd-Hand
    { cluster: "F. New vs 2nd-Hand Units", question: "How much cheaper is a factory-refurbished portacabin than brand new?", answer: `Factory-refurbished units typically save around ${catalog.refurbDiscountPct}% off new build prices while providing new interior cladding, re-sealed roofs, fresh paint, and serviced wiring.` },
    { cluster: "F. New vs 2nd-Hand Units", question: "What does Used Wind & Water Tight (WWT) mean and what are its risks?", answer: `Used As-Is WWT units cost roughly ${catalog.usedWwtDiscountPct}% less than new builds and guarantee no open roof holes during transit, but carry cosmetic dents, older insulation, and zero extended cosmetic warranty.` },
    { cluster: "F. New vs 2nd-Hand Units", question: "What red flags must I check before buying a second-hand cabin?", answer: "Crawl underneath to inspect floor channel rust/pitting, press floor corners for soft water-damaged ply, hose-test roof weld corners, and verify genuine seller GST ownership bills before lifting." },
    { cluster: "F. New vs 2nd-Hand Units", question: "Do refurbished units qualify for manufacturer leak warranties?", answer: "Established fabricators routinely offer 1–3 year seam leak warranties on refurbished re-sealed hulls (versus 5–7 years on brand-new custom steel fabrications)." },

    // Cluster G — Insulation, Canopies & Comfort
    { cluster: "G. Thermal & Acoustic Comfort", question: "PUF vs Rockwool vs EPS insulation: which is best for living?", answer: "High-density PUF (Polyurethane Foam) leads thermal resistance per mm for thin walls; Rockwool (mineral wool) excels at soundproofing offices & fire resistance; EPS should be restricted to budget temperate zones." },
    { cluster: "G. Thermal & Acoustic Comfort", question: "How effective is adding a 75mm PUF wall + sloped Fly-Roof Canopy?", answer: `Combining 75mm PUF panels with an air-gapped elevated sloped Fly-Roof Canopy (+₹${canopy}) blocks direct solar radiation on the ceiling plate, trimming peak afternoon interior heat by 6–9°C.` },
    { cluster: "G. Thermal & Acoustic Comfort", question: "What glass type keeps summer glare out of a glass-front pod?", answer: "Specify Double-Glazed Toughened (DGU) units or Bronze Reflective heat-control safety glass rather than thin single-pane clear glass to slash AC cooling load and traffic noise." },
    { cluster: "G. Thermal & Acoustic Comfort", question: "How do I prevent damp condensation inside metal modular rooms?", answer: "Ensure continuous insulated vapor barrier panels, sealed cold steel thermal bridges, perimeter EPDM window gaskets, and cross-ventilation or split inverter dehumidification." },

    // Cluster H — Crane, Narrow Lanes & Flat-Pack Delivery
    { cluster: "H. Crane & Narrow-Lane Delivery", question: "What if my home lane is under 12 ft wide or blocked by trees?", answer: `Do not book a fully welded unit if trailers cannot turn into your gate. Order a Knock-Down Flat-Pack Kit (₹${kdFee} assembly) so technicians carry individual wall panels inside and bolt them weather-tight on site.` },
    { cluster: "H. Crane & Narrow-Lane Delivery", question: "How do overhead high-tension electrical wires affect crane installation?", answer: "Hydraulic crane booms require strict 3–5 meter safe clearance from live overhead distribution cables; if wires span across the facade, request power-line shutdown permit or switch to flat-pack assembly." },
    { cluster: "H. Crane & Narrow-Lane Delivery", question: "Is a knock-down flat-pack cabin as waterproof as a welded cabin?", answer: "Quality bolted flat-pack frames use recessed EPDM compression channels, interlocking rain-drip gutter rails, and neutral-cure silicone/PU perimeter caulking tested under flood spray before handover." },

    // Cluster I — Solar, Off-Grid & Utilities
    { cluster: "I. Solar & Utility Sizing", question: "What solar size powers a 160 sq ft prefab office with air conditioning?", answer: "A 2.5kW–3.0kW rooftop monocrystalline solar kit paired with a 5kWh–7.5kWh LiFePO4 battery inverter comfortably runs an inverter 1.5T AC, LED lighting, monitors, and Wi-Fi router." },
    { cluster: "I. Solar & Utility Sizing", question: "Can a prefabricated cabin include an attached bathroom & kitchen?", answer: "Yes. Prefab bathroom pods install seamlessly along one side wall with waterproof FRP/tile liners, overhead 500L–1000L water tank, exhaust fan, and stubbed greywater/septic drain outlets." },

    // Cluster J — Financing, Taxes & ROI
    { cluster: "J. Financing, Taxes & ROI", question: "What GST / tax applies to prefabricated modular cabins in India?", answer: "Prefabricated buildings generally classify under HSN Chapter 9406 attracting standard 18% GST on invoice (eligible for input tax credit when billed to registered commercial businesses)." },
    { cluster: "J. Financing, Taxes & ROI", question: "Can US/UK/AU buyers finance prefab pods via HELOC or home improvement loans?", answer: "Yes—while unattached non-permitted sheds rarely qualify for primary 30-year mortgages, homeowners routinely finance backyard office pods via HELOCs, unsecured home improvement loans, or maker installment plans." },
    { cluster: "J. Financing, Taxes & ROI", question: "What payback timeline do Airbnb glamping or backyard rental pods achieve?", answer: "In high-tourism or urban university markets, well-insulated studio pods costing $28k–$45k installed (or ₹4.5L–₹7L in India hill stations/farms) commonly break even in 18–36 months of active occupancy." },
  ];
}

function renderSectionBodyDeterministically(
  spec: BlueprintSectionSpec,
  keyword: string,
  geo: SeoGeoTarget,
  catalog: GroundedCatalogSummary
): string {
  const geoInfo = GEO_LABELS[geo];
  const shell20 = catalog.cabin20CostInr.toLocaleString("en-IN");
  const shell40 = catalog.cabin40CostInr.toLocaleString("en-IN");
  const puf50 = catalog.puf50CostInr.toLocaleString("en-IN");
  const canopy = catalog.canopy75CostInr.toLocaleString("en-IN");
  const craneG = catalog.craneGroundInr.toLocaleString("en-IN");
  const craneT = catalog.craneTerraceInr.toLocaleString("en-IN");
  const kdFee = catalog.knockDownAssemblyInr.toLocaleString("en-IN");

  switch (spec.category) {
    case "INTRO":
      return `Choosing the right solution for **${keyword}** across ${geoInfo.name} has evolved rapidly over the last three years. Instead of committing 4–8 months to noisy brick masonry, cement curing delays, and spiraling contractor quotes, homeowners, remote professionals, and boutique entrepreneurs increasingly turn to factory-engineered modular rooms. Modern prefabricated steel and PUF-insulated units arrive ready for crane placement in days—or assemble cleanly via knock-down panels on rooftops and tight city lots.\n\nYet searching online exposes a major consumer blind spot: most generic supplier ads quote an artificial "starting shell price" while hiding **crane hire, flat-pack assembly, municipal permit checks, slab load beams, heavy-summer insulation, and tax (GST/VAT)**. Making an informed decision requires understanding both sides of the equation: **which structural specification fits your site** AND **which verified manufacturer delivers transparently to your exact GPS coordinates**.\n\nBefore selecting any vendor or paying a deposit, every buyer should evaluate six essential pillars:\n\n1. **Verified Structural Steel Framing & Cladding:** Confirm hollow-section steel gauge (minimum 2.0mm RHS posts), continuous epoxy anti-rust primer, and sealed polyurethane roof seams rather than flimsy thin backyard sheds.\n2. **True Climate Insulation Envelope:** Bare metal sheets turn unbearable in sun and drip condensation in cold climates; 50mm–75mm high-density PUF + double-glazed toughened glass transforms a metal box into a quiet year-round room.\n3. **Delivery Geometry & Crane Clearances:** A 20ft module requires a flatbed truck turning radius and crane boom overhead freedom; narrow lanes under 12ft or overhanging HT electrical lines require flat-pack knock-down fabrication.\n4. **Structural Roof vs Ground Support:** Setting 1.8 tons on an existing building roof slab without I-beam load spreaders over RCC structural columns risks cracking waterproofing and slabs.\n5. **Regional Zoning & Permit Adherence (${geoInfo.permitBody}):** Knowing permit-exempt footprint limits versus full secondary dwelling approvals avoids costly municipal removal orders.\n6. **Post-Handover Warranty & Repair Terms:** Distinguish between 5–7 year brand-new structural leak warranties versus 1–3 year refurbished coverage.\n\nExplore real-time sizes, finishes, thermal comfort ratings, and live localized pricing inside the [MyPrefabRoom Interactive 3D Configurator](/).`;

    case "QUICK_TABLE": {
      const hasLiveVendors = catalog.vendors.length > 0;
      const rows = hasLiveVendors
        ? catalog.vendors.map((v, i) => {
            const modes = [
              "Ready-Built Crane",
              v.knockDownSupported ? "Knock-Down Kit" : null,
              "Self-Pickup",
            ]
              .filter(Boolean)
              .join(", ");
            const promoTag = v.isSponsored ? " (Sponsored Partner)" : "";
            return `| **${i + 1}. ${v.companyName}**${promoTag} | ${v.city} | ${v.bestSuitedFor} | ${modes} | ₹${v.cabin20PriceInr.toLocaleString("en-IN")} | ${v.warrantyYears} yrs (${v.leadDays}d lead) |`;
          })
        : [
            `| **Tier A: Full-Turnkey Residential Studio Makers** | Regional Metro Hubs | Insulated WFH pods, ADUs & garden studios | Ready-Built Crane + Flat-Pack | From ₹${shell20} / $18k+ US | Verify 5–7 yr leak warranty |`,
            `| **Tier B: Knock-Down / Rooftop Terrace Specialists** | Dense Urban Belts | <12ft streets & multi-story RCC terraces | On-Site Bolted Flat-Pack Kits | Base + ₹${kdFee} assembly | Verify structural I-beam skids |`,
            `| **Tier C: Refurbished & Fleet Conversion Yards** | Port & Industrial Zones | Cafes, retail pods & cost-capped cabins | Crane or Self-Pickup | -${catalog.refurbDiscountPct}% to -${catalog.usedWwtDiscountPct}% off new | Inspect floor rust & seals |`,
            `| **Tier D: Off-Grid Solar & Bath Pod Integrators** | Highway / Farm Corridors | Farmhouse stays & Airbnb rentals | Flatbed Trailer Delivery | Add ₹75k–₹1.4L utilities | Confirm 32A MCB & bio-septic |`,
          ];
      return `The comparison matrix below reflects **${
        hasLiveVendors
          ? `live audited rate cards and logistics capabilities across ${catalog.vendors.length} approved MyPrefabRoom manufacturers`
          : "verified modular manufacturing categories & baseline catalog benchmarks"
      }** as of **${catalog.verifiedDate}**. Rather than ranking blindly on promotional ads, options are benchmarked by delivery geometry, entry 20ft chassis pricing, dispatch speed, and structural leak protection.\n\n| Partner / Manufacturer Tier | Hub / Corridor | Best Suited For | Delivery Modes | Base 20ft Benchmark | Warranty / Verification |\n| --- | --- | --- | --- | --- | --- |\n${rows.join("\n")}\n\n### Quick Category Leaders Summary\n\n- **Best for Urban Rooftops & Narrow Lanes (<12ft):** Choose **Knock-Down Kit** capable fabricators so insulated wall cassettes carry cleanly through apartment staircases or narrow garden alleys without heavy boom cranes.\n- **Best for Lowest Turnkey Budget (Used / Refurbished Stock):** Look for yards stocking inspected **Refurbished Stock** offering **${catalog.refurbDiscountPct}%–${catalog.usedWwtDiscountPct}% capital savings** versus custom fabrication.\n- **Best for Long-Term Daily Living & Extended Protection:** Prioritize partners offering **5–7 year leak & structural steel warranties** paired with 75mm PUF + sloped canopy packages.\n\nVerify live partner pricing near your home's GPS pin inside the [Live Multi-Maker Quote Engine](/).`;
    }

    case "METHODOLOGY":
      return `Generic directory articles routinely invent arbitrary "Top 10" badges without inspecting whether listed workshops build insulated living spaces or merely tack-weld basic tin guard booths. To protect buyers under strict **E-E-A-T and YMYL transparency standards**, MyPrefabRoom audits partner manufacturers across ten verifiable criteria.\n\n| Evaluation Dimension | What Our Audit Verifies | Why It Protects Buyers |\n| --- | --- | --- |
| **1. Business & Tax Registry** | Active GSTIN / legal registration & physical fabrication yard city | Eliminates unverified middleman brokers inflating quotes 20–35% |\n| **2. Structural Chassis Specs** | Minimum RHS hollow steel section sizes, weld continuity & corner castings | Ensures unit survives road vibration and crane lifting cleanly |\n| **3. Thermal Envelope Options** | Availability of 50mm / 75mm PUF & reflective DGU glass upgrades | Prevents unusable indoor greenhouse heat in summer & damp winters |\n| **4. Itemized Rate Transparency** | Published per-km transport, crane ground/terrace & flat-pack assembly rates | Stops surprise 30% dispatch surcharges on delivery morning |\n| **5. Delivery Mode Versatility** | Ready-Built crane lift, Knock-Down flat-pack assembly, & Ex-Yard Self-Pickup | Solves narrow-road residential delivery bottlenecks |\n| **6. Second-Hand Disclosure** | Strict separation between Brand New, Factory Refurbished & As-Is WWT stock | Prevents shady repainting of rusted old boxes as "new" |\n| **7. Utility Integration** | Pre-routed MCB/RCCB electrical boards, inverter AC sleeves & bath pods | Avoids unsafe exposed site wiring or leak-prone plumbing joints |\n| **8. Warranty Commitments** | Written leak-proof roof seam & structural weld warranty duration | Guarantees post-monsoon or post-winter service support |\n| **9. Factory Dispatch Speed** | Realistic production lead days (10–21 days standard) | Aligns crane & civil site prep accurately |\n| **10. Sponsorship Separation** | Clear separation of paid bid visibility vs objective spec scoring | Keeps technical comparisons unbiased for buyers |\n\n### Mandatory Commercial & Sponsorship Disclosure\n\nManufacturers operating active ad bids inside MyPrefabRoom are clearly marked with a **Sponsored** badge in comparison tables and vendor drawers. Paid promotional bids affect showcase card ordering where noted, **never structural safety warnings, permit disclaimers, or verified pricing calculations**.`;

    case "VENDOR_PROFILES":
      if (catalog.vendors.length === 0) {
        return `When shortlisting individual prefabricated room workshops across ${geoInfo.name}, compare every candidate using an identical standardized profile template so quotes stay apples-to-apples (fabricators apply via [Maker Registration](/auth/signin?tab=vendor)):\n\n### 1. Custom Insulated Living & Backyard Office Workshops\n- **Core Capabilities:** Welded >=2.0mm RHS frames, 50mm–75mm PUF wall insulation, DGU toughened glass sliders, concealed MCB/RCCB electrical wiring.\n- **Pricing Benchmark:** India ex-works from **₹${shell20}** (20ft); turnkey US/UK/AU studio-code builds from **$18,000+ USD / £14,500+ GBP**.\n- **Pre-Booking Verification:** Demand physical workshop GPS address, PUF panel density proof (kg/m³), and written 5-year roof seam leak coverage.\n\n### 2. Rooftop Knock-Down Flat-Pack Fabricators\n- **Core Capabilities:** Factory-jibbed bolt-together structural mullions, EPDM compression seals, manual-carry panel sizing for apartment lifts and staircases.\n- **Assembly Cost Impact:** Site assembly averages ~₹${kdFee} in India while avoiding ₹${craneT}+ high-reach terrace crane mobilization.\n- **Pre-Booking Verification:** Require flood-hose leak test before final 10% milestone payout and confirm longitudinal RCC column I-beam skids.\n\n### 3. Second-Hand & Factory-Refurbished Fleet Yards\n- **Core Capabilities:** Re-sealed marine or modular steel shells with replaced interior ACP cladding and serviced AC/electrical fixtures.\n- **Savings Potential:** Typically **${catalog.refurbDiscountPct}% off** (Factory Refurbished) up to **${catalog.usedWwtDiscountPct}% off** (As-Is WWT).\n- **Pre-Booking Verification:** Inspect subfloor cross-channels for pitting rust and verify GST ownership invoice prior to pickup.`;
      }
      return catalog.vendors
        .map((v, idx) => {
          return `### ${idx + 1}. ${v.companyName} — ${v.city} Hub\n\n- **Verified Service Profile:** Operates from the **${v.city}** manufacturing hub with an audited baseline lead time of **${v.leadDays} days** and **${v.warrantyYears}-year structural & seam warranty**.\n- **Published Catalog Base Rates (${catalog.verifiedDate}):** Standard 20ft (160 sq ft) module rate begins at **₹${v.cabin20PriceInr.toLocaleString("en-IN")}** ex-works; extended 40ft (320 sq ft) footprint begins at **₹${v.cabin40PriceInr.toLocaleString("en-IN")}** pre-tax.\n- **Supported Delivery Architecture:** Ready-Built trailer crane placement${v.knockDownSupported ? ", **On-Site Knock-Down Flat-Pack Assembly** (ideal for terraces & <12ft streets)" : ""}, plus **Ex-Factory Self-Pickup** (₹0 freight).\n- **Second-Hand & Budget Inventory:** ${v.sellsRefurbished ? `Stocks inspected **Factory-Refurbished** units (${v.refurbStockCount} ready stock noted) at roughly ${catalog.refurbDiscountPct}% lower capital cost.` : "Focuses strictly on new custom-fabricated builds to client layout."}\n- **Best Suited Buyer Profile:** ${v.bestSuitedFor}.\n- **Pre-Booking Questions to Confirm:** Confirm written steel wall gauge, PUF insulation density, exact distance haulage rate from ${v.city}, and written monsoon leak warranty inclusions prior to advance payment.\n`;
        })
        .join("\n");

    case "NEED_ROUTER":
      return `No single factory or structural package wins for every plot. Match your exact homeowner constraint to the recommended configuration below before requesting itemized quotes:\n\n| Buyer Priority / Site Need | Recommended Module Spec | Delivery Mode | Critical Spec Not to Skip |\n| --- | --- | --- | --- |\n| **Quiet Backyard WFH Studio** | 20ft (160 sq ft) + Acoustic DGU Glass + 1.5T AC | Ready-Built Crane Lift | Min 50mm PUF + dark thermal curtain blackout framing |\n| **Urban Rooftop Extra Bedroom** | 20ft Lightweight + Load-Spread I-Beams | Knock-Down Flat-Pack | **75mm PUF + Sloped Fly-Roof Canopy** (-6 to 9°C drop) |\n| **Narrow Street (<12ft Lane) Plot** | Any 20ft / Joined Multi-Module Kit | Knock-Down Bolted Panels | Check stairwell / alley diagonal width >= 4 ft |\n| **Budget Startup Cafe / Retail Pod** | 20ft Refurbished (-${catalog.refurbDiscountPct}%) + Glass Front | Self-Pickup or Crane | 32A commercial load wiring & grease/water trap plumbing |\n| **Off-Grid Farmhouse / Airbnb Pod** | 40ft or 20ft + Bath Pod + 3kW Solar | Ready-Built Flatbed | Bio-septic tank + 1000L overhead insulated water tank |\n\nYou can click through each layout interactively inside our [3D Modular Studio](/).`;

    case "COST":
      return `Accurate budgeting for **${keyword}** across ${geoInfo.name} requires inspecting every layer between base metal shell pricing and final keys-in-hand installation. Notice how raw India ex-works pricing (**₹${shell20}** for 20ft / **₹${shell40}** for 40ft) compares against North American, UK, and Australian turnkey residential codes where electrical UL/CE compliance, snow/wind engineering stamps, and site concrete footings apply:\n\n| Budget Component | India Grounded Benchmark | US / UK / AU Residential Range | Notes for Buyers |\n| --- | --- | --- | --- |\n| **20ft Insulated Chassis (160 sq ft)** | ₹${shell20} base + ₹${puf50} PUF-50 | $18,000–$32,000 / £14,500–£26,000 / A$24k–A$42k | Code-certified walls, floor & dual-glazed openings |\n| **40ft Studio Module (320 sq ft)** | ₹${shell40} base + finish upgrades | $38,000–$65,000 / £30,000–£48,000 / A$48k–A$72k | Full 1-BHK / ADU plumbing & kitchenette capable |\n| **Heat-Shield 75mm + Sloped Canopy** | ₹${canopy} upgrade | $2,200–$4,200 solar-shade roof | Crucial for top roofs, desert sun & heavy rain drainage |\n| **Transport & Rigging Crane** | ₹${catalog.transportPerKm20ftInr}/km + ₹${craneG} (Ground) / ₹${craneT} (Roof) | $1,200–$4,500 flatbed + boom | Flat-pack assembly saves heavy terrace crane fees (₹${kdFee}) |\n| **Taxes & Compliance Permits** | ${catalog.gstPct}% GST (HSN 9406) | Sales Tax / VAT + municipal permit fee | Ask for full tax invoice + engineer drawing package |\n\n### 9-Point Hidden Costs Audit Before Paying Deposit\n\n| Item | Confirm in Written Quote |\n| --- | --- |\n| **1. Civil Plinth / RCC Pads** | Are 6 precast pedestals or rooftop steel I-beam skids included? |\n| **2. Hydra / Boom Crane Hours** | Who pays overtime if street traffic or power wires delay lifting? |\n| **3. Pilot Vehicle / Night Transit** | Are oversized 40ft width permits included across state borders? |\n| **4. Electrical Mains Trenching** | Does manufacturer include armored cable from main meter + earth pit? |\n| **5. Plumbing Stub-Outs** | Are greywater/septic pipes extended beyond chassis to connect to house drain? |\n| **6. GST / VAT Inclusion** | Are comparison table figures pre-tax or final tax-paid landed estimates? |\n| **7. Waterproof Sealant Warranty** | Written 3–7 year guarantee covering roof perimeter joints & window sill flashing? |\n| **8. Narrow-Gate Knock-Down Labor** | Boarding & local crew food/lodging during 1–2 day on-site bolted assembly? |\n| **9. Return Freight Clause** | Site survey checklist signed before dispatch so crane isn't turned back? |`;

    case "PRODUCTS":
      return `Understanding each physical module and utility upgrade lets you balance upfront budget against daily comfort inside your prefabricated structure. Live catalog equipment currently integrated in the [MyPrefabRoom 3D Designer](/) includes:\n\n${catalog.elementsList
        .slice(0, 10)
        .map(
          (e) =>
            `### ${e.name} (\`${e.code}\`)\n- **Mount Location & Role:** Engineered for \`${e.mountZone}\` placement.\n- **Grounded Reference Cost:** Approx. **₹${e.baseCostInr.toLocaleString("en-IN")}** base hardware/installation tier (scaled globally per UL/CE certification & regional labor).\n- **Buyer Limitation & Alternative:** Always verify structural load clearance on \`ROOF_TOP\` add-ons (solar arrays, 1000L overhead tanks) and confirm electrical MCB sizing inside the main distribution panel before adding split ACs.\n`
        )
        .join("\n")}`;

    case "PLANNING":
      return `Unlike rigid single-layout sheds, modern modular planning prioritizes human proportions, ergonomic daylighting, and clear structural sightlines. Inside a standard 2.44m (8ft) wide cabin, placing furniture thoughtfully decides whether the space feels spacious or claustrophobic.\n\n### Core Spatial & 3D Preview Guidelines\n\n- **Daylight Cross-Ventilation:** Anchor large sliding glass patio doors on the shaded north or garden-facing elevation while offsetting dual panoramic casement windows on adjacent walls for passive cross-breeze without afternoon solar glare.\n- **360° Interior Walkthrough Validation:** Never approve a layout strictly from an exterior isometric render. Switch into **Look Inside (First-Person 360° Mode)** inside the [3D Configurator](/) to inspect desk depth, wardrobe swing clearance, ceiling LED light spread, and split-AC airflow height before fabrication.\n- **Important Digital Preview Caveat (YMYL):** Architectural 3D visualizations demonstrate layout proportions, solar glare angles, and hardware placement—they are **design tools, not stamped permit blueprints**. Final structural member dimensions and electrical wiring schematics must always be issued on your chosen manufacturer's signed shop drawings.`;

    case "SPECIALISTS":
      return `Knowing which licensed specialist handles each stage prevents dangerous compliance mistakes—especially on urban terraces, plumbed ADUs, and off-grid builds.\n\n| Professional Role | Primary Responsibility | When Mandatory |\n| --- | --- | --- |\n| **Modular Factory Fabricator** | Chassis fabrication, PUF cladding, glazed openings, pre-wiring, leak test | Every build — produces structural module |\n| **Structural / Civil Engineer** | Evaluates RCC slab live-load limits (2.0 kN/m²), column I-beam skids & wind anchoring | Mandatory for rooftop terraces, 2-story stacked pods & high-wind coastal/seismic zones |\n| **Licensed Electrician** | Armored mains trenching, earthing pits, RCCB protection & Part P / NEC sign-off | Mandatory for ALL powered offices, AC installations & commercial shops |\n| **Municipal / Planning Consultant** | Verifies setbacks, Class E / ADU rules & utility sewer hookup filings | Whenever unit exceeds permit-exempt area or includes kitchen/bath plumbing |\n| **Certified Crane Rigger** | Sweeps street width, assesses overhead HT wires & lifts with spreader bars | Mandatory for crane-set Ready-Built placements over fences or buildings |`;

    case "COMPARISONS":
      return `Comparing structural options side-by-side prevents overpaying for features you do not need—or cheaping out on components that fail in year two.\n\n| Feature Comparison | Option A | Option B | Clear Buyer Winner |\n| --- | --- | --- | --- |\n| **Build Condition** | **Brand New Custom** (100% base price, 5–7 yr warranty) | **Factory Refurbished (-${catalog.refurbDiscountPct}%)** vs **Used WWT (-${catalog.usedWwtDiscountPct}%)** | New for permanent home offices/living; Refurbished for budget studios; Used WWT for short site offices |\n| **Roof Insulation** | **50mm PUF Standard** (+₹${puf50}) | **75mm PUF + Sloped Fly-Roof Canopy** (+₹${canopy}) | 75mm Canopy wins hands down on sunny rooftops & hot climates (6–9°C cooler + shed standing water) |\n| **Delivery Method** | **Ready-Built Trailer + Crane** (Fast 2–4 hr placement) | **Flat-Pack Knock-Down** (+₹${kdFee} assembly) | Ready-Built if road >=14ft clear; Knock-Down mandatory for <12ft lanes & tight rear gardens |\n| **Prefab vs Brick Masonry** | **Modular Prefab** (14–21 days, zero wet rubble, relocatable) | **Brick & RCC** (4–6 months dust/noise, immovable) | Prefab wins on speed, urban terraces (weight limit), rental ROI & relocatability |`;

    case "ELIGIBILITY":
      return `For **YMYL structural and financial safety**, not every site or roof qualifies automatically for prefabricated placement without remedial engineering.\n\n### Critical Eligibility & Disqualification Checks\n\n- **Roof Slab Age & Load Capacity:** Older non-engineered masonry homes without column-beam RCC framing should **never** receive a 2-ton portacabin on top. Even modern RCC slabs require structural I-beam load spreaders aligned cleanly over bearing columns so point loads do not crack the slab or crush parapet waterproofing.\n- **Active Roof Leaks or Termites:** Resolve existing terrace seepage or plot white-ant soil issues before covering ground footprint with plinth pads.\n- **High-Tension Electrical Overhead Lines:** Cranes cannot swing heavy booms near uninsulated overhead distribution cables; non-compliant sites must relocate placement zone or use flat-pack manual carry kits.\n- **Flood-Prone Ground Sites:** Low-lying farm plots or coastal sites require elevated 300mm–600mm galvanized piers and marine zinc-rich epoxy chassis coats.`;

    case "PROBLEMS":
      return `Use this rapid problem-solver matrix to eliminate installation headaches before your build enters fabrication:\n\n| Site or Buyer Problem | Root Technical Cause | Recommended Engineering Solution |\n| --- | --- | --- |\n| **1. Narrow Residential Lane (<12ft)** | 20ft trailer cannot swing into narrow turn radius | Order **Knock-Down Flat-Pack** cassettes & bolt airtight on site |\n| **2. Extreme Noon Oven Heat (>42°C)** | Single-skin steel absorbs radiant roof heat | Upgrade to **75mm PUF + Sloped Canopy** + reflective DGU glass |\n| **3. Heavy Monsoon / Snow Roof Leaks** | Flat roof ponding over unsealed lap screws | Demand **welded roof perimeter channels + sloped fly canopy** |\n| **4. Apartment Society Rejects Heavy Crane** | Driveway slab over basement parking cannot handle 15T crane | Use **Knock-Down Flat-Pack** carried cleanly up service lift/stairs |\n| **5. Urgent Business Launch (<15 Days)** | Brick build misses seasonal retail/rental revenue | Pick in-stock Refurbished unit or verified fast-dispatch yard |\n| **6. Tight Initial Budget** | Custom 40ft builds exceed starter cash | Start with **20ft Refurbished (-${catalog.refurbDiscountPct}%)** or Self-Pickup |\n| **7. Road Traffic / Street Echo Inside Office** | Thin aluminum & single glass pass 50+ dB noise | Upgrade to **DGU Laminated Glass + Rockwool/PUF Wall Core** |\n| **8. Rental Landlord / Lease Plot** | Cannot lose permanent concrete investment on lease expiry | Bolt steel modular cabin on dry RCC plinths -> **take it with you** |`;

    case "SEGMENTS":
      return `Prefab modular demand spans diverse residential and commercial buyer segments worldwide—yet layout ergonomics change dramatically depending on who occupies the room daily:\n\n- **Remote Professionals & Creators (Ages 25–55):** Prioritize acoustic isolation during Zoom calls, anti-glare monitor wall orientation (facing away from west sun), recessed task lighting, and wired Cat6 ethernet conduit inside wall channels.\n- **Multigenerational Families & Seniors (Backyard ADUs):** Require wider 950mm+ clear door thresholds, subtle entry ramp options over plinth steps, anti-slip textured vinyl plank floors, accessible grab-bar wall reinforcement inside bathroom pods, and reliable winter thermal insulation.\n- **Rooftop Urban Households:** Benefit most from lightweight construction, sloped heat-deflecting cool-roof canopies, child-safe railing setbacks along terrace edges, and flat-pack stairwell delivery.\n- **Boutique Retail, Clinics & Cafes:** Require high-visibility tempered showcase storefront glazing, heavy 32A commercial load wiring for espresso/medical equipment, dedicated fresh/greywater plumbing cleanouts, and removable exterior signage fascias.`;

    case "FINANCING":
      return `Understanding financing mechanics, indirect tax rules, and payback ROI transforms a modular structure from an emotional expense into a measurable property asset.\n\n### Financing, Tax & Payback Channels\n\n1. **Home Equity & Construction Financing (US/UK/AU):** Because standalone prefabricated pods below ADU thresholds are frequently classified as chattel or non-permanent outbuildings, standard 30-year purchase mortgages rarely apply unless permanently anchored on engineered foundations as an inspected ADU. Homeowners typically compare HELOCs, personal renovation loans, or manufacturer monthly financing schedules by checking **total APR, origination fees, and prepayment terms**.\n2. **India GST Classification (HSN 9406) & Commercial Depreciation:** Modular prefabricated buildings generally attract **18% GST**. Commercial entities—cafes, site clinics, coworking pods, farmstays—can claim GST Input Tax Credit (ITC) and depreciate modular assets on business balance sheets under tax compliance rules.\n3. **Solar Clean-Energy Credits & Net Metering:** Paired solar arrays on modular ADUs may qualify separately under regional renewable energy incentives (such as US Section 25D residential credits or MNRE solar net-metering rules where grid-connected—always verify tax eligibility with a CPA/CA).\n4. **Airbnb & Rental Yield Math:** Turning a ~₹5.5L ($32,000 US) turnkey outfitted guest pod into a bookable WFH retreat or studio ADU frequently yields **18–36 month capital payback** in suburban commuter corridors and tourist belts once utilities and cleaning ops are budgeted.`;

    case "MAINTENANCE":
      return `Treat a modular steel room with light predictable maintenance and it routinely outlasts conventional timber garden outbuildings by decades.\n\n| Service Interval | Inspection & Maintenance Action | Estimated Annual Effort |\n| --- | --- | --- |\n| **Every 6 Months (Pre/Post Rain/Snow)** | Clear leaf debris along roof gutters & sloped canopy air-gap channels; clear AC condensate line | 20 minutes DIY |\n| **Every 12 Months** | Lubricate sliding glass tracks, door hinges & EPDM rubber weatherstrips; inspect plinth drainage clearance | 45 minutes DIY |\n| **Every 3–4 Years** | Inspect external polyurethane window perimeter beads; re-seal hairline UV cracks on roof flashings | Minimal sealant tube cost |\n| **Every 5 Years** | Touch up exterior marine epoxy primer along bottom corner castings & salt-air exposed frame joints | Low-cost paint touch-up |\n| **Relocation / Resale** | Disconnect mains isolator plug cleanly; book Hydra crane lift on corner ISO pads | Retains strong resale value |`;

    case "GEO_HUBS":
      return `Regional geography shapes both **transportation line-item pricing** and **climate engineering priorities** across ${geoInfo.name}:\n\n- **Dense Metro Cores (Mumbai, Delhi NCR, Bengaluru, London, NYC Metro):** Narrow residential lanes, apartment parking limits, and municipal daylight-right / Class E height bounds make **Knock-Down Flat-Pack kits (<2.5m height near boundary)** and **acoustic double-glazed glass** top priorities.\n- **High-Heat / Arid Zones (Rajasthan, Pune/Deccan, Texas, Arizona, UAE, Outback AU):** Daytime radiant roof loads dominate utility bills—**75mm PUF + elevated Sloped Cool Canopy** plus north-facing sliding glass cuts cooling consumption cleanly.\n- **Coastal Humid Zones (Kerala, Goa, Florida, Sydney, Auckland):** High salt-spray corrosion accelerates mild steel pitting—insist on hot-dip galvanized or epoxy zinc-rich marine coatings + sealed stainless fasteners.\n- **Suburban Sprawls & Regional Hub Yards:** Ordering within **50–150 km** of verified manufacturer yards (${catalog.vendors.map((v) => v.city).join(", ") || "major industrial hubs"}) minimizes per-km flatbed haulage while enabling pre-dispatch factory walkthrough inspections.`;

    case "CHECKLIST":
      return `Bring this 6-category checklist to every phone call or factory visit before transferring an advance:\n\n1. **Credentials:** Valid business GSTIN/license, factory yard street address, verified sample photos of *this workshop's* actual past work.\n2. **Treatment & Layout Planning:** Exact interior clear height, door clearance vs sofa/bed sizes, pre-cut AC drain sleeves, 3D model check.\n3. **Materials & Insulation:** Written steel RHS section thickness (mm), PUF foam thickness & density, floor board water-resistance spec.\n4. **Financial Breakdown:** Written quote separating ex-works shell, insulation add-on, taxes/GST, transport per km, and crane/flat-pack assembly.\n5. **Site Safety & Loads:** Confirmation of rooftop slab I-beam spreaders or level plinth count + dedicated RCCB electrical trip safety.\n6. **Aftercare & Repairs:** Explicit warranty certificate covering weld/roof leaks & response timeline if a seal needs touch-up.\n\n### 9 Red Flags That Mean Walk Away Immediately\n\n- Guaranteeing "no permit needed anywhere" without checking lot setbacks or terrace structural load.\n- Refusing to disclose steel section gauge (mm) or insulation core type in writing.\n- Quoting suspiciously cheap lump sums without inspecting gate road width or overhead power wires.\n- Pressuring 80% upfront cash payment without milestone weld/factory inspection photos.\n- Passing off repainted rusted second-hand marine containers as brand-new living modules.`;

    case "SCENARIOS":
      return `Below are three **hypothetical transparent planning blueprints** demonstrating how identical core hardware adapts across distinct buyer budgets (not fabricated testimonials):\n\n- **Scenario A — Urban Backyard WFH Office (Ground Lawn, Wide Access):** 20ft new module (` + "₹" + `${shell20}) + 50mm PUF (₹${puf50}) + acoustic sliding glass + ground crane unload (₹${craneG}) within 60km yard radius = fast 1-morning crane install ready for work same evening.\n- **Scenario B — Hot-Climate Terrace Guest Room (3rd Floor Roof, Narrow <12ft Lane):** Because cranes cannot reach over live overhead cables, buyer picks **Knock-Down Flat-Pack Kit** (₹${kdFee} crew carry + assembly) paired with longitudinal column I-beams and **PUF-75mm + Sloped Canopy** (₹${canopy}) so noon indoor heat drops 6–9°C.\n- **Scenario C — Budget Boutique Garden Cafe (Commercial Launch):** Founder chooses a **Factory-Refurbished 20ft unit (-${catalog.refurbDiscountPct}%)** with fresh food-grade interior cladding and Self-Pickup trailer arrangement (` + "₹0" + ` marketplace freight), redirecting savings into espresso bar plumbing and solar battery backup.`;

    case "DECISION":
      return `If you are undecided between configurations right now, follow this 3-step decision rule:\n\n1. **Pick Footprint First:** Solo desk + guest sofa = **20ft (160 sq ft)**; Separate bedroom + attached bath + kitchenette = **40ft (320 sq ft)** or dual joined 20ft modules.\n2. **Match Delivery Mode to Your Street:** Clear >=14ft street & ground/low-reach roof = **Ready-Built Crane Lift**; Narrow street (<12ft), garden alley, or multi-floor terrace w/ wires = **Knock-Down Flat-Pack**; Own truck/crane = **Self-Pickup**.\n3. **Match Insulation to Climate:** Temperate shade = **PUF 50mm**; Open rooftop, summer heat >38°C, or freezing winters = **PUF 75mm + Sloped Fly-Roof Canopy**.`;

    case "VERDICT":
    default:
      return `The smartest way to buy **${keyword}** today is to verify engineering, site access, and itemized landed costs **before** calling multiple salespeople. Generic brochures hide freight, crane reach, thermal comfort, and structural load limits until after you pay a booking fee.\n\nBy configuring your layout in the [MyPrefabRoom Interactive 3D Designer](/), running the **Inline Site Decision Guide** on this page, tagging your exact **GPS Location Pin**, and comparing transparent multi-maker rate cards side-by-side, you lock down realistic pricing from verified regional workshops—saving 15–35% on hidden logistics mistakes while building a durable space made to last decades.`;
  }
}

export async function generateFullSeoArticle(params: {
  keyword: string;
  slug?: string;
  targetGeo?: SeoGeoTarget;
  intent?: SeoIntentType;
  clusterRole?: SeoClusterRole;
  parentPillarSlug?: string | null;
  linkedPresetCode?: string | null;
  minWords?: number;
  authorName?: string;
  authorRole?: string;
  llmConfig?: LlmRuntimeConfig;
}): Promise<{ postId: string; slug: string; wordCount: number; engineUsed: string; scoreTotal: number }> {
  const keyword = params.keyword.trim();
  const targetGeo: SeoGeoTarget = params.targetGeo || "GLOBAL";
  const intent: SeoIntentType = params.intent || "COST";
  const clusterRole: SeoClusterRole = params.clusterRole || "PILLAR";
  const parentPillarSlug = params.parentPillarSlug || null;
  const minWords = Math.max(5000, Number(params.minWords) || 8500);
  const slug = slugifySeo(params.slug || keyword) || `prefab-guide-${Date.now()}`;
  const authorName = params.authorName || "Arjun Mehta";
  const authorRole = params.authorRole || "Lead Modular Architecture & Cost Analyst";

  const catalog = await loadGroundedCatalog(targetGeo);
  const geoInfo = GEO_LABELS[targetGeo];
  const blueprint = buildAuthorityBlueprint20(keyword, targetGeo);

  const groundFactBlock = [
    `VERIFIED CATALOG & PARTNER BENCHMARKS (${catalog.verifiedDate} — DO NOT INVENT FAKE VENDORS OR FAKE RATINGS):`,
    `- Verified Partner Count: ${catalog.vendorCount} (${catalog.vendors.map((v) => `${v.companyName} in ${v.city} ₹${v.cabin20PriceInr}/20ft ${v.warrantyYears}yr`).join("; ")})`,
    `- Base Units: 20ft (160 sq ft) ex-works ₹${catalog.cabin20CostInr.toLocaleString("en-IN")} | 40ft (320 sq ft) ₹${catalog.cabin40CostInr.toLocaleString("en-IN")}`,
    `- ${catalog.currencyGuide}`,
    `- Upgrades: PUF-50mm ₹${catalog.puf50CostInr} | PUF-75mm + Sloped Canopy ₹${catalog.canopy75CostInr} (6-9°C drop)`,
    `- Logistics: Crane Ground ₹${catalog.craneGroundInr} | Terrace ₹${catalog.craneTerraceInr} | Per-km ₹${catalog.transportPerKm20ftInr} | Knock-Down assembly ₹${catalog.knockDownAssemblyInr}`,
    `- Used Stock: Factory Refurbished -${catalog.refurbDiscountPct}% | Used WWT -${catalog.usedWwtDiscountPct}%`,
  ].join("\n");

  const enginesUsed = new Set<string>();

  // Pass 1: Title, Meta & AEO Direct Answer Box
  const archRes = await generateWithBestLlm(
    `You are a senior modular building architect & AEO/GEO strategist for MyPrefabRoom (${geoInfo.name}). Return valid JSON ONLY: {"title":"...","metaTitle":"<=62 char","metaDesc":"135-158 char","tldrAnswer":"50-75 word crisp direct answer box with real numbers"}`,
    `Keyword: "${keyword}". Cluster Role: ${clusterRole}. Intent: ${intent}.\n${groundFactBlock}`,
    params.llmConfig,
    { jsonMode: true }
  );
  enginesUsed.add(archRes.engineUsed);

  let title = `${keyword.replace(/\b\w/g, (c) => c.toUpperCase())} (${new Date().getFullYear()} Authority Guide)`;
  let metaTitle = title.slice(0, 62);
  let metaDesc = `Compare verified prefab makers, turnkey prices, permits, terrace structural rules, crane vs flat-pack costs for ${keyword}. Design live in 3D.`.slice(0, 158);
  let tldrAnswer = `${keyword.replace(/^\w/, (c) => c.toUpperCase())} starts around ₹${(catalog.cabin20CostInr + 65000).toLocaleString("en-IN")} turnkey in India ($18,000–$32,000 US, £14,500–£26,000 UK, A$24,000–A$42,000 AU) for an insulated 160 sq ft room. Final cost depends on verified fabricator location, rooftop structural I-beams, 75mm PUF cool canopy, crane vs flat-pack access, and local municipal permits.`;

  if (archRes.ok) {
    try {
      const parsed = JSON.parse(archRes.text.replace(/```json/g, "").replace(/```/g, "").trim());
      if (parsed.title) title = String(parsed.title).trim();
      if (parsed.metaTitle) metaTitle = String(parsed.metaTitle).trim().slice(0, 65);
      if (parsed.metaDesc) metaDesc = String(parsed.metaDesc).trim().slice(0, 160);
      if (parsed.tldrAnswer && countWords(parsed.tldrAnswer) >= 35) tldrAnswer = String(parsed.tldrAnswer).trim();
    } catch {
      // Keep clean grounded defaults
    }
  }

  // Pass 2: Iterative 20-Chapter Deep Authority Generation (Zero Modulo Loop!)
  const sections: SeoSectionBlock[] = [];
  const priorHeadings: string[] = [];

  for (let i = 0; i < blueprint.length; i++) {
    const spec = blueprint[i];
    const deterministicCore = renderSectionBodyDeterministically(spec, keyword, targetGeo, catalog);

    let secBody = "";
    // For data-exact tables/disclosures (Quick Comparison, Methodology, Vendor Profiles), anchor with deterministic truth + optional LLM narrative enrichment
    if (
      params.llmConfig?.provider !== "deterministic" &&
      spec.category !== "QUICK_TABLE" &&
      spec.category !== "VENDOR_PROFILES"
    ) {
      const secRes = await generateWithBestLlm(
        `You are a licensed modular construction engineer writing Chapter ${i + 1}/20 of an authoritative E-E-A-T/YMYL buyer guide for MyPrefabRoom (${geoInfo.name}).
Write 450-650 words in clean Markdown (H3s + concrete comparison bullets/tables + internal link to [Interactive 3D Configurator](/)), zero clichés, never fabricate fake vendor ratings or awards.`,
        `Topic: "${keyword}". Chapter Heading: "${spec.heading}". Focus: ${spec.focus}.\nAlready covered: ${priorHeadings.slice(-5).join(" | ") || "Intro"}\n\n${groundFactBlock}`,
        params.llmConfig
      );
      enginesUsed.add(secRes.engineUsed);
      if (secRes.ok) {
        const cleaned = secRes.text.replace(/^##\s+.*\n+/, "").trim();
        secBody = countWords(cleaned) >= 380 ? `${cleaned}\n\n${deterministicCore}` : deterministicCore;
      }
    }

    if (!secBody) {
      secBody = deterministicCore;
    }

    sections.push({
      id: spec.id,
      heading: spec.heading,
      markdown: secBody,
      wordCount: countWords(secBody),
    });
    priorHeadings.push(spec.heading);
  }

  // Build 40+ Clustered AEO/GEO Questions
  const faqs = buildClusteredAeoFaqs(keyword, catalog);

  // If custom minWords was set super high (e.g. 12,000+), allow distinct regional expansion appendix cleanly without repeating identical prose
  const getRunningWords = (secs: SeoSectionBlock[]) =>
    countWords(tldrAnswer) +
    secs.reduce((s, x) => s + x.wordCount + countWords(x.heading), 0) +
    faqs.reduce((s, f) => s + countWords(f.question) + countWords(f.answer), 0);

  let appendixNum = 1;
  while (getRunningWords(sections) < minWords && appendixNum <= 5) {
    const appendixHeading = `Deep Appendix ${appendixNum}: Extended Field Inspection & Cost-Control Protocols for ${keyword}`;
    const appSpec: BlueprintSectionSpec = {
      id: `sec-app-${appendixNum}`,
      heading: appendixHeading,
      focus: "Step-by-step factory sign-off test, seam flood testing, electrical load balancing, and regional compliance checklist.",
      category: appendixNum % 2 === 0 ? "MAINTENANCE" : "ELIGIBILITY",
    };
    const res = await generateWithBestLlm(
      "Write 700-900 words of technical construction inspection protocols, waterproofing verification tests, and electrical safety standards in clean Markdown.",
      `Topic: "${keyword}" (${targetGeo}). Focus: ${appendixHeading}. Grounded 20ft shell ₹${catalog.cabin20CostInr}.`,
      params.llmConfig
    );
    enginesUsed.add(res.engineUsed);
    const det = renderSectionBodyDeterministically(appSpec, keyword, targetGeo, catalog);
    const body = res.ok && countWords(res.text) >= 400 ? `${res.text.trim()}\n\n${det}` : `${det}\n\n${renderSectionBodyDeterministically({ ...appSpec, category: "CHECKLIST" }, keyword, targetGeo, catalog)}`;

    sections.push({
      id: appSpec.id,
      heading: appendixHeading,
      markdown: body,
      wordCount: countWords(body),
    });
    appendixNum++;
  }

  const ymylDisclaimer =
    "YMYL Engineering, Zoning & Financial Disclaimer: Costs (USD/GBP/AUD/INR), thermal metrics, municipal permit summaries, and loan estimates on MyPrefabRoom are informational benchmarks audited against partner rate cards and public codes. Rooftop load engineering, concrete slab piers, utility trenching, municipal approvals, and financing commitments must be reviewed and signed off by licensed local civil engineers, electricians, and qualified financial/tax advisors prior to construction.";

  const sponsorshipDisclosure =
    "Editorial & Ranking Disclosure: Manufacturers are evaluated objectively across warranty length, verified physical workshop city, flat-pack assembly, refurbishment inventory, and rate card transparency. Partners running active sponsored promotional bids are explicitly labeled 'Sponsored Partner' and cannot override safety disclosures or verified rate math.";

  const compiledMarkdown = [
    `> **Direct Answer (${targetGeo}):** ${tldrAnswer}\n\nDesign your layout in the [MyPrefabRoom Interactive 3D Configurator](/) or compare regional guides in the [Guides Library](/guides).`,
    ...sections.map((s) => `## ${s.heading}\n\n${s.markdown}`),
    `## Methodology & Verified Citations\n\nAll base prices, freight formulas, crane fees, thermal drops, and warranties were last benchmarked on **${catalog.verifiedDate}** across ${catalog.vendorCount} active fabricators alongside ICC, UK Planning Portal, ABCB NCC, U.S. DOE, and BIS IS 800 standards.`,
  ].join("\n\n");

  const finalScore = scoreSeoPost({
    title,
    slug,
    metaTitle,
    metaDesc,
    keyword,
    tldrAnswer,
    contentMarkdown: compiledMarkdown,
    faqs,
    keyStats: catalog.keyStats,
    citations: catalog.authoritativeCitations,
    vendors: catalog.vendors,
    ymylDisclaimer,
    sponsorshipDisclosure,
    authorName,
    reviewerName: null,
  });

  const readingMinutes = Math.max(20, Math.round(finalScore.wordCount / 220));
  const schema = buildSchemaJsonLd({
    slug,
    title,
    metaDesc,
    keyword,
    authorName,
    authorRole,
    reviewerName: null,
    reviewerCreds: null,
    reviewedAt: null,
    faqs,
    vendors: catalog.vendors,
    wordCount: finalScore.wordCount,
  });

  const saved = await prisma.seoPost.upsert({
    where: { slug },
    update: {
      title,
      metaTitle,
      metaDesc,
      targetGeo,
      keyword,
      intent,
      clusterRole,
      parentPillarSlug,
      status: "HITL_REVIEW",
      tldrAnswer,
      sectionsJson: JSON.stringify(sections),
      contentMarkdown: compiledMarkdown,
      wordCount: finalScore.wordCount,
      readingMinutes,
      faqJson: JSON.stringify(faqs),
      keyStatsJson: JSON.stringify(catalog.keyStats),
      citationsJson: JSON.stringify(catalog.authoritativeCitations),
      vendorSnapshotJson: JSON.stringify(catalog.vendors),
      ymylDisclaimer,
      sponsorshipDisclosure,
      priceVerifiedDate: catalog.verifiedDate,
      authorName,
      authorRole,
      reviewerName: null,
      reviewerCreds: null,
      reviewedAt: null,
      scoreJson: JSON.stringify(finalScore),
      linkedPresetCode: params.linkedPresetCode || "terrace-room",
      pushTarget: JSON.stringify({ engines: Array.from(enginesUsed), sections: sections.length }),
    },
    create: {
      slug,
      title,
      metaTitle,
      metaDesc,
      targetGeo,
      keyword,
      intent,
      clusterRole,
      parentPillarSlug,
      status: "HITL_REVIEW",
      tldrAnswer,
      sectionsJson: JSON.stringify(sections),
      contentMarkdown: compiledMarkdown,
      wordCount: finalScore.wordCount,
      readingMinutes,
      faqJson: JSON.stringify(faqs),
      keyStatsJson: JSON.stringify(catalog.keyStats),
      citationsJson: JSON.stringify(catalog.authoritativeCitations),
      vendorSnapshotJson: JSON.stringify(catalog.vendors),
      ymylDisclaimer,
      sponsorshipDisclosure,
      priceVerifiedDate: catalog.verifiedDate,
      authorName,
      authorRole,
      scoreJson: JSON.stringify(finalScore),
      linkedPresetCode: params.linkedPresetCode || "terrace-room",
      pushTarget: JSON.stringify({ engines: Array.from(enginesUsed), schemaGraphCount: schema["@graph"].length }),
    },
  });

  return {
    postId: saved.id,
    slug: saved.slug,
    wordCount: saved.wordCount,
    engineUsed: Array.from(enginesUsed).join(", "),
    scoreTotal: finalScore.total,
  };
}

export async function appendDeepSectionToPost(
  postId: string,
  customHeading?: string,
  llmConfig?: LlmRuntimeConfig
): Promise<{ wordCount: number; scoreTotal: number }> {
  const row = await prisma.seoPost.findUnique({ where: { id: postId } });
  if (!row) throw new Error("Post not found");

  const sections: SeoSectionBlock[] = JSON.parse(row.sectionsJson || "[]");
  const faqs: SeoFaqItem[] = JSON.parse(row.faqJson || "[]");
  const keyStats = JSON.parse(row.keyStatsJson || "[]");
  const citations = JSON.parse(row.citationsJson || "[]");
  const vendors = JSON.parse(row.vendorSnapshotJson || "[]");
  const catalog = await loadGroundedCatalog((row.targetGeo as SeoGeoTarget) || "GLOBAL");

  const nextHeading =
    (customHeading || "").trim() ||
    `Extended Engineering & Procurement Appendix ${sections.length + 1}: Field Audits & Quotes for ${row.keyword}`;
  const spec: BlueprintSectionSpec = {
    id: `sec-extra-${Date.now()}`,
    heading: nextHeading,
    focus: "Deep structural specifications, insurance, depreciation, and step-by-step vendor verification.",
    category: "CHECKLIST",
  };

  const res = await generateWithBestLlm(
    "Write an exhaustive 700-900 word deep technical & buyer verification guide chapter in Markdown with realistic tables and bullet checklists. Zero AI filler.",
    `Article Topic: "${row.keyword}" (${row.targetGeo}). Chapter: "${nextHeading}". Include grounded costs: 20ft ₹${catalog.cabin20CostInr}, Canopy ₹${catalog.canopy75CostInr}.`,
    llmConfig
  );
  const det = renderSectionBodyDeterministically(spec, row.keyword, (row.targetGeo as SeoGeoTarget) || "GLOBAL", catalog);
  const body = res.ok && countWords(res.text) >= 400 ? `${res.text.trim()}\n\n${det}` : `${det}\n\n${renderSectionBodyDeterministically({ ...spec, category: "SCENARIOS" }, row.keyword, (row.targetGeo as SeoGeoTarget) || "GLOBAL", catalog)}`;

  sections.push({
    id: spec.id,
    heading: nextHeading,
    markdown: body,
    wordCount: countWords(body),
  });

  const compiledMarkdown = [
    `> **Direct Answer (${row.targetGeo}):** ${row.tldrAnswer}\n\nExplore layouts in [MyPrefabRoom 3D](/) or [Guides Library](/guides).`,
    ...sections.map((s) => `## ${s.heading}\n\n${s.markdown}`),
    `## Methodology & Verified Citations\n\nBenchmarked ${catalog.verifiedDate} across ${catalog.vendorCount} active fabricators.`,
  ].join("\n\n");

  const score = scoreSeoPost({
    title: row.title,
    slug: row.slug,
    metaTitle: row.metaTitle,
    metaDesc: row.metaDesc,
    keyword: row.keyword,
    tldrAnswer: row.tldrAnswer,
    contentMarkdown: compiledMarkdown,
    faqs,
    keyStats,
    citations,
    vendors,
    ymylDisclaimer: row.ymylDisclaimer,
    sponsorshipDisclosure: row.sponsorshipDisclosure,
    authorName: row.authorName,
    reviewerName: row.reviewerName,
  });

  await prisma.seoPost.update({
    where: { id: row.id },
    data: {
      sectionsJson: JSON.stringify(sections),
      contentMarkdown: compiledMarkdown,
      wordCount: score.wordCount,
      readingMinutes: Math.max(20, Math.round(score.wordCount / 220)),
      scoreJson: JSON.stringify(score),
    },
  });

  return { wordCount: score.wordCount, scoreTotal: score.total };
}
