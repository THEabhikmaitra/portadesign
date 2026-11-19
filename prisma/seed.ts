import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Portadesign Database...");

  // Clean existing data
  await prisma.quoteRequest.deleteMany();
  await prisma.designVersion.deleteMany();
  await prisma.design.deleteMany();
  await prisma.vendorRateCard.deleteMany();
  await prisma.masterAttribute.deleteMany();
  await prisma.masterElement.deleteMany();
  await prisma.vendorProfile.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const buyerPass = await bcrypt.hash("buyer123", salt);
  const vendorPass = await bcrypt.hash("vendor123", salt);
  const adminPass = await bcrypt.hash("admin123", salt);

  // 1. Users
  const buyerUser = await prisma.user.create({
    data: {
      email: "buyer@porta.local",
      name: "Arun Sharma (Lead Architect)",
      password: buyerPass,
      role: "BUYER",
      xp: 450,
      badgesJson: JSON.stringify([
        { id: "FOUNDATION_BUILDER", name: "Foundation Master", icon: "🏗️", earnedAt: new Date().toISOString() },
        { id: "SOLAR_PIONEER", name: "Solar Pioneer", icon: "☀️", earnedAt: new Date().toISOString() },
      ]),
    },
  });

  const vendor1User = await prisma.user.create({
    data: {
      email: "vendor1@quickcabin.in",
      name: "Rajesh Patil (QuickCabin CEO)",
      password: vendorPass,
      role: "VENDOR",
      xp: 850,
      badgesJson: JSON.stringify([
        { id: "VERIFIED_FABRICATOR", name: "Verified Fabricator", icon: "⭐", earnedAt: new Date().toISOString() }
      ]),
    },
  });

  const vendor2User = await prisma.user.create({
    data: {
      email: "vendor2@ecosteel.in",
      name: "Meera Sen (EcoSteel Director)",
      password: vendorPass,
      role: "VENDOR",
      xp: 620,
    },
  });

  const vendor3User = await prisma.user.create({
    data: {
      email: "vendor3@zenithpods.in",
      name: "Vikram Malhotra (Zenith Smart)",
      password: vendorPass,
      role: "VENDOR",
      xp: 790,
    },
  });

  const vendor4User = await prisma.user.create({
    data: {
      email: "vendor4@bharatmod.in",
      name: "Anand Verma (Bharat Modular)",
      password: vendorPass,
      role: "VENDOR",
      xp: 500,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@porta.local",
      name: "System Admin (Chief Architect)",
      password: adminPass,
      role: "ADMIN",
      xp: 2400,
      badgesJson: JSON.stringify([
        { id: "MASTER_ARCHITECT", name: "Master Architect", icon: "👑", earnedAt: new Date().toISOString() },
        { id: "AI_OPERATOR", name: "AI Operator", icon: "🤖", earnedAt: new Date().toISOString() },
      ]),
    },
  });

  // 2. Vendor Profiles
  const vendor1Profile = await prisma.vendorProfile.create({
    data: {
      userId: vendor1User.id,
      companyName: "QuickCabin Modular Systems",
      contactEmail: "sales@quickcabin.in",
      phone: "+91 98230 11223",
      city: "Pune / Mumbai Hub",
      leadDays: 10,
      warrantyYears: 5,
      rating: 4.9,
      isSponsored: true,
      sponsoredBidAmt: 45.0,
    },
  });

  const vendor2Profile = await prisma.vendorProfile.create({
    data: {
      userId: vendor2User.id,
      companyName: "EcoSteel Prefab Works",
      contactEmail: "orders@ecosteel.in",
      phone: "+91 97129 44556",
      city: "Ahmedabad, Gujarat",
      leadDays: 14,
      warrantyYears: 7,
      rating: 4.8,
      isSponsored: false,
      sponsoredBidAmt: 20.0,
    },
  });

  const vendor3Profile = await prisma.vendorProfile.create({
    data: {
      userId: vendor3User.id,
      companyName: "Zenith Smart Pods & Living",
      contactEmail: "hello@zenithpods.in",
      phone: "+91 98801 77889",
      city: "Bengaluru Tech Park",
      leadDays: 12,
      warrantyYears: 5,
      rating: 4.7,
      isSponsored: true,
      sponsoredBidAmt: 35.0,
    },
  });

  const vendor4Profile = await prisma.vendorProfile.create({
    data: {
      userId: vendor4User.id,
      companyName: "Bharat Modular Infra",
      contactEmail: "info@bharatmod.in",
      phone: "+91 98110 33445",
      city: "Gurugram / NCR",
      leadDays: 18,
      warrantyYears: 3,
      rating: 4.6,
      isSponsored: false,
      sponsoredBidAmt: 10.0,
    },
  });

  // 3. Master Elements
  const elements = [
    {
      category: "CABIN",
      code: "CABIN_20FT",
      name: "20ft Insulated Container Module",
      description: "Standard 20x8x8.5ft ISO marine-grade corten steel module with rockwool insulation & vinyl flooring",
      mountZone: "FLOOR_INTERIOR",
      dimensionsJson: JSON.stringify({ width: 2.44, height: 2.59, length: 6.06, weightKg: 2200 }),
      baseCost: 185000,
      threeConfigJson: JSON.stringify({ type: "container", size: 20, length: 6.06, width: 2.44, height: 2.59 }),
    },
    {
      category: "CABIN",
      code: "CABIN_40FT",
      name: "40ft High Cube Container Module",
      description: "Spacious 40x8x9.5ft High Cube container with premium soundproofing & heavy structural corner posts",
      mountZone: "FLOOR_INTERIOR",
      dimensionsJson: JSON.stringify({ width: 2.44, height: 2.90, length: 12.19, weightKg: 3800 }),
      baseCost: 325000,
      threeConfigJson: JSON.stringify({ type: "container", size: 40, length: 12.19, width: 2.44, height: 2.90 }),
    },
    {
      category: "DOOR",
      code: "DOOR_SLIDING_GLASS",
      name: "Panoramic Sliding Glass Door (2.2m x 2.1m)",
      description: "Dual-track architectural sliding patio door with heavy thermal break frame",
      mountZone: "WALL_EXTERIOR",
      dimensionsJson: JSON.stringify({ width: 2.2, height: 2.1, depth: 0.12 }),
      baseCost: 28000,
      threeConfigJson: JSON.stringify({ type: "slidingDoor", width: 2.2, height: 2.1 }),
    },
    {
      category: "DOOR",
      code: "DOOR_STEEL_PANEL",
      name: "Heavy-Duty Corten Steel Access Door",
      description: "Commercial insulated security door with multi-point locking system & weatherproof gasket",
      mountZone: "WALL_EXTERIOR",
      dimensionsJson: JSON.stringify({ width: 0.95, height: 2.05, depth: 0.08 }),
      baseCost: 16500,
      threeConfigJson: JSON.stringify({ type: "steelDoor", width: 0.95, height: 2.05 }),
    },
    {
      category: "WINDOW",
      code: "WINDOW_PANORAMIC",
      name: "Architectural Panoramic Viewport (2.4m x 1.4m)",
      description: "Floor-to-ceiling picture window with reinforced aluminum framing and argon fill",
      mountZone: "WALL_EXTERIOR",
      dimensionsJson: JSON.stringify({ width: 2.4, height: 1.4, depth: 0.1 }),
      baseCost: 21000,
      threeConfigJson: JSON.stringify({ type: "window", width: 2.4, height: 1.4 }),
    },
    {
      category: "WINDOW",
      code: "WINDOW_STANDARD",
      name: "Standard Awning Window (1.2m x 1.0m)",
      description: "Dual glazed awning ventilation window with insect mesh",
      mountZone: "WALL_EXTERIOR",
      dimensionsJson: JSON.stringify({ width: 1.2, height: 1.0, depth: 0.08 }),
      baseCost: 11500,
      threeConfigJson: JSON.stringify({ type: "window", width: 1.2, height: 1.0 }),
    },
    {
      category: "STAIRS",
      code: "STAIRS_EXTERNAL",
      name: "Galvanized Modular Steel Staircase with Landing",
      description: "OSHA-compliant outdoor access staircase with anti-slip checker plate steps & safety balustrade",
      mountZone: "PERIMETER_EDGE",
      dimensionsJson: JSON.stringify({ width: 1.2, height: 2.8, length: 3.6 }),
      baseCost: 48000,
      threeConfigJson: JSON.stringify({ type: "stairs", height: 2.8, length: 3.6 }),
    },
    {
      category: "EQUIPMENT",
      code: "AC_SPLIT_INVERTER",
      name: "Daikin / Voltas 1.5T 5-Star Inverter AC System",
      description: "Paired indoor high-wall blower unit + weather-proof outdoor condenser with vibration dampers",
      mountZone: "WALL_INTERIOR",
      dimensionsJson: JSON.stringify({ indoorW: 0.9, indoorH: 0.3, outdoorW: 0.8, outdoorH: 0.6 }),
      baseCost: 38500,
      threeConfigJson: JSON.stringify({ type: "splitAc" }),
    },
    {
      category: "EQUIPMENT",
      code: "SOLAR_ARRAY_ROOF",
      name: "3.2kW Monocrystalline Solar Rooftop Array",
      description: "6x high-efficiency 540W bifacial solar PV panels with pre-welded anodized aluminum rack",
      mountZone: "ROOF_TOP",
      dimensionsJson: JSON.stringify({ width: 3.4, height: 0.25, length: 2.2 }),
      baseCost: 128000,
      threeConfigJson: JSON.stringify({ type: "solarArray" }),
    },
    {
      category: "EQUIPMENT",
      code: "WATER_TANK_OVERHEAD",
      name: "1000L Overhead Triple-Layer Insulated Tank",
      description: "UV-stabilized HDPE water storage tank with galvanized elevated support frame",
      mountZone: "ROOF_TOP",
      dimensionsJson: JSON.stringify({ radius: 0.6, height: 1.4 }),
      baseCost: 17500,
      threeConfigJson: JSON.stringify({ type: "waterTank" }),
    },
    {
      category: "POD",
      code: "WASHROOM_POD",
      name: "Integrated Prefab Ensuite Bathroom Pod",
      description: "Complete pre-plumbed unit: wall-hung WC, concealed cistern, ceramic vanity, LED mirror & shower",
      mountZone: "FLOOR_INTERIOR",
      dimensionsJson: JSON.stringify({ width: 1.4, length: 1.8, height: 2.3 }),
      baseCost: 58000,
      threeConfigJson: JSON.stringify({ type: "washroomPod" }),
    },
    {
      category: "EQUIPMENT",
      code: "DESK_SET_OFFICE",
      name: "Executive Dual Workstation & Ergonomic Chairs",
      description: "Scratch-resistant oak laminate desk with wire raceway, monitor arm mount, and 2 mesh task chairs",
      mountZone: "FLOOR_INTERIOR",
      dimensionsJson: JSON.stringify({ width: 1.6, length: 1.2, height: 0.75 }),
      baseCost: 24500,
      threeConfigJson: JSON.stringify({ type: "deskSet" }),
    },
    {
      category: "EQUIPMENT",
      code: "LED_CEILING_PANEL",
      name: "Ultra-Slim 36W Recessed LED Light Panel",
      description: "Flicker-free architectural lighting with 3000K-6000K tunable CCT & dimming driver",
      mountZone: "ROOF_TOP",
      dimensionsJson: JSON.stringify({ width: 0.6, length: 0.6, height: 0.04 }),
      baseCost: 3200,
      threeConfigJson: JSON.stringify({ type: "ceilingLight" }),
    },
    {
      category: "EQUIPMENT",
      code: "CCTV_CAMERA",
      name: "4K AI Perimeter Dome CCTV Camera",
      description: "Night-vision infrared vandal-resistant camera with 110° field of view",
      mountZone: "WALL_EXTERIOR",
      dimensionsJson: JSON.stringify({ radius: 0.08, height: 0.12 }),
      baseCost: 6500,
      threeConfigJson: JSON.stringify({ type: "cctvCamera" }),
    },
  ];

  for (const el of elements) {
    await prisma.masterElement.create({ data: el });
  }

  // 4. Master Attributes (Glass, Frames, Brands, Finishes)
  const attributes = [
    // Glass Types
    {
      category: "GLASS_TYPE",
      code: "GLASS_CLEAR_SG",
      name: "Saint-Gobain Planiclear (Ultra Transparent)",
      brand: "Saint-Gobain",
      specsJson: JSON.stringify({ uValue: 5.7, shgc: 0.82, lightTransmission: "90%", acousticDb: 32 }),
      shaderJson: JSON.stringify({
        color: "#ffffff",
        roughness: 0.03,
        metalness: 0.05,
        transmission: 0.94,
        ior: 1.5,
        thickness: 0.5,
        clearcoat: 1.0,
        opacity: 0.35,
      }),
      costModifier: 0,
    },
    {
      category: "GLASS_TYPE",
      code: "GLASS_TINTED_BLACK",
      name: "Saint-Gobain Cool-Lite (Charcoal Black Tint)",
      brand: "Saint-Gobain",
      specsJson: JSON.stringify({ uValue: 3.8, shgc: 0.38, lightTransmission: "22%", heatRejection: "65%" }),
      shaderJson: JSON.stringify({
        color: "#182026",
        roughness: 0.08,
        metalness: 0.25,
        transmission: 0.48,
        ior: 1.52,
        thickness: 1.0,
        clearcoat: 1.0,
        opacity: 0.72,
      }),
      costModifier: 3800,
    },
    {
      category: "GLASS_TYPE",
      code: "GLASS_BRONZE_AIS",
      name: "AIS SunShield Reflective Bronze",
      brand: "AIS Glass",
      specsJson: JSON.stringify({ uValue: 3.5, shgc: 0.34, lightTransmission: "30%", heatRejection: "70%" }),
      shaderJson: JSON.stringify({
        color: "#6b4728",
        roughness: 0.12,
        metalness: 0.42,
        transmission: 0.42,
        ior: 1.54,
        thickness: 1.0,
        clearcoat: 1.0,
        opacity: 0.68,
      }),
      costModifier: 4500,
    },
    {
      category: "GLASS_TYPE",
      code: "GLASS_FROSTED_AIS",
      name: "AIS Satinlite (Frosted White Privacy)",
      brand: "AIS Glass",
      specsJson: JSON.stringify({ uValue: 5.4, shgc: 0.75, lightTransmission: "62%", privacyLevel: "High" }),
      shaderJson: JSON.stringify({
        color: "#ecf2f7",
        roughness: 0.65,
        metalness: 0.02,
        transmission: 0.62,
        ior: 1.48,
        thickness: 1.2,
        clearcoat: 0.2,
        opacity: 0.85,
      }),
      costModifier: 2400,
    },
    // Frame Materials
    {
      category: "FRAME_MATERIAL",
      code: "FRAME_ALUM_CHARCOAL",
      name: "Jindal Architectural Matt Charcoal Aluminum",
      brand: "Jindal Aluminium",
      specsJson: JSON.stringify({ alloy: "6063-T6", coating: "Powder Coated 60 Micron" }),
      shaderJson: JSON.stringify({
        color: "#272a30",
        roughness: 0.32,
        metalness: 0.82,
        transmission: 0,
      }),
      costModifier: 1800,
    },
    {
      category: "FRAME_MATERIAL",
      code: "FRAME_UPVC_WHITE",
      name: "Fenesta Multi-Chamber uPVC (Glacier White)",
      brand: "Fenesta",
      specsJson: JSON.stringify({ insulationRating: "A+", soundProofing: "40dB" }),
      shaderJson: JSON.stringify({
        color: "#f8f9fa",
        roughness: 0.25,
        metalness: 0.04,
        transmission: 0,
      }),
      costModifier: 0,
    },
    {
      category: "FRAME_MATERIAL",
      code: "FRAME_STEEL_TATA",
      name: "Tata Structura Heavy Galvanized Steel",
      brand: "Tata Steel",
      specsJson: JSON.stringify({ grade: "YSt-310", antiRust: "Hot Dip Galvanized" }),
      shaderJson: JSON.stringify({
        color: "#3e4752",
        roughness: 0.38,
        metalness: 0.92,
        transmission: 0,
      }),
      costModifier: 2900,
    },
    // Cabin Exterior Finishes
    {
      category: "WALL_FINISH",
      code: "FINISH_BATTLESHIP_GREY",
      name: "Industrial Battleship Grey (Corrosion Shield)",
      brand: "Asian Paints PPG",
      specsJson: JSON.stringify({ finish: "Satin Industrial", saltSprayHours: 1500 }),
      shaderJson: JSON.stringify({
        color: "#475569",
        roughness: 0.42,
        metalness: 0.12,
      }),
      costModifier: 0,
    },
    {
      category: "WALL_FINISH",
      code: "FINISH_OCEAN_CYBER",
      name: "Deep Ocean Cyber Blue",
      brand: "Asian Paints PPG",
      specsJson: JSON.stringify({ finish: "High Sheen Polyurethane" }),
      shaderJson: JSON.stringify({
        color: "#0f3d5e",
        roughness: 0.38,
        metalness: 0.18,
      }),
      costModifier: 4200,
    },
    {
      category: "WALL_FINISH",
      code: "FINISH_DESERT_BEIGE",
      name: "Sahara Desert Sand Beige (Thermal Reflective)",
      brand: "Berger Paints",
      specsJson: JSON.stringify({ sriIndex: 88, heatReductionC: 4.5 }),
      shaderJson: JSON.stringify({
        color: "#cbb393",
        roughness: 0.58,
        metalness: 0.05,
      }),
      costModifier: 2800,
    },
    {
      category: "WALL_FINISH",
      code: "FINISH_FOREST_OLIVE",
      name: "Tactical Forest Olive Green",
      brand: "Berger Paints",
      specsJson: JSON.stringify({ finish: "Matte Camouflage" }),
      shaderJson: JSON.stringify({
        color: "#2c3b2e",
        roughness: 0.52,
        metalness: 0.08,
      }),
      costModifier: 3200,
    },
  ];

  for (const attr of attributes) {
    await prisma.masterAttribute.create({ data: attr });
  }

  // 5. Vendor Rate Cards
  const vendorProfiles = [
    { p: vendor1Profile, factor: 0.96, days: 10, notes: "5-Yr Structural & Leak Warranty. 24/7 hotline." },
    { p: vendor2Profile, factor: 0.92, days: 14, notes: "7-Yr Heavy Steel Guarantee. Green certified." },
    { p: vendor3Profile, factor: 1.05, days: 12, notes: "Smart IoT Ready, 5-Yr comprehensive support." },
    { p: vendor4Profile, factor: 0.88, days: 18, notes: "Best value economy build. 3-Yr standard warranty." },
  ];

  for (const v of vendorProfiles) {
    for (const el of elements) {
      const basePrice = Math.round(el.baseCost * v.factor);
      const attrMods: Record<string, number> = {
        GLASS_TINTED_BLACK: Math.round(3500 * v.factor),
        GLASS_BRONZE_AIS: Math.round(4200 * v.factor),
        GLASS_FROSTED_AIS: Math.round(2200 * v.factor),
        FRAME_ALUM_CHARCOAL: Math.round(1800 * v.factor),
        FRAME_STEEL_TATA: Math.round(2600 * v.factor),
        FINISH_OCEAN_CYBER: Math.round(3800 * v.factor),
        FINISH_DESERT_BEIGE: Math.round(2500 * v.factor),
        FINISH_FOREST_OLIVE: Math.round(3000 * v.factor),
      };

      await prisma.vendorRateCard.create({
        data: {
          vendorId: v.p.id,
          elementCode: el.code,
          baseUnitPrice: basePrice,
          attributeModifiersJson: JSON.stringify(attrMods),
          leadTimeDays: v.days,
          warrantyNotes: v.notes,
        },
      });
    }
  }

  // 6. Pre-seeded Public Design
  const desertScene = {
    environment: "desert",
    dayNight: "day",
    cabins: [
      {
        id: "cabin-1",
        type: "CABIN_20FT",
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        wallFinish: "FINISH_DESERT_BEIGE",
        doors: [
          {
            id: "door-1",
            type: "DOOR_SLIDING_GLASS",
            glassType: "GLASS_TINTED_BLACK",
            frameMaterial: "FRAME_ALUM_CHARCOAL",
            position: [0, 1.05, 1.23],
            rotation: [0, 0, 0],
          },
        ],
        windows: [
          {
            id: "win-1",
            type: "WINDOW_PANORAMIC",
            glassType: "GLASS_BRONZE_AIS",
            frameMaterial: "FRAME_ALUM_CHARCOAL",
            position: [1.8, 1.3, -1.23],
            rotation: [0, Math.PI, 0],
          },
        ],
      },
    ],
    equipment: [
      {
        id: "eq-ac-1",
        type: "AC_SPLIT_INVERTER",
        brand: "Daikin Inverter",
        capacity: "1.5 Ton",
        position: [0, 2.1, -1.18],
        rotation: [0, 0, 0],
        mountZone: "WALL_INTERIOR",
      },
      {
        id: "eq-solar-1",
        type: "SOLAR_ARRAY_ROOF",
        brand: "Tata Power Solar",
        capacity: "3.2 kW",
        position: [0, 2.65, 0],
        rotation: [0, 0, 0],
        mountZone: "ROOF_TOP",
      },
      {
        id: "eq-desk-1",
        type: "DESK_SET_OFFICE",
        brand: "Godrej Interio",
        capacity: "2-Seater Executive",
        position: [-1.2, 0.05, 0],
        rotation: [0, Math.PI / 2, 0],
        mountZone: "FLOOR_INTERIOR",
      },
    ],
  };

  const desertBom = {
    items: [
      { code: "CABIN_20FT", name: "20ft Insulated Container Module", count: 1, unitPrice: 185000, total: 185000 },
      { code: "FINISH_DESERT_BEIGE", name: "Sahara Desert Sand Beige", count: 1, unitPrice: 2800, total: 2800 },
      { code: "DOOR_SLIDING_GLASS", name: "Panoramic Sliding Glass Door", count: 1, unitPrice: 28000, total: 28000 },
      { code: "GLASS_TINTED_BLACK", name: "Cool-Lite Tinted Black Glass", count: 1, unitPrice: 3800, total: 3800 },
      { code: "WINDOW_PANORAMIC", name: "Architectural Panoramic Viewport", count: 1, unitPrice: 21000, total: 21000 },
      { code: "GLASS_BRONZE_AIS", name: "AIS Bronze Solar Shield Glass", count: 1, unitPrice: 4500, total: 4500 },
      { code: "AC_SPLIT_INVERTER", name: "Daikin 1.5T Inverter AC", count: 1, unitPrice: 38500, total: 38500 },
      { code: "SOLAR_ARRAY_ROOF", name: "3.2kW Tata Solar Array", count: 1, unitPrice: 128000, total: 128000 },
      { code: "DESK_SET_OFFICE", name: "Executive Dual Workstation", count: 1, unitPrice: 24500, total: 24500 },
    ],
    totalCost: 436100,
  };

  const demoDesign = await prisma.design.create({
    data: {
      userId: buyerUser.id,
      title: "Solara Desert Studio - 20ft Eco-Cabin",
      slug: "solara-desert-studio-20ft",
      description: "High-thermal efficiency off-grid desert office container with Tata 3.2kW solar array, Daikin inverter cooling, and Saint-Gobain sun-shield glazing.",
      isPublic: true,
      viewCount: 142,
      shareCount: 29,
      remixCount: 8,
      versions: {
        create: [
          {
            versionNumber: 1,
            commitNote: "Initial cabin frame & glazing",
            sceneJson: JSON.stringify(desertScene),
            bomJson: JSON.stringify(desertBom),
          },
        ],
      },
    },
  });

  // Pre-seed a Quote Request
  await prisma.quoteRequest.create({
    data: {
      designId: demoDesign.id,
      buyerId: buyerUser.id,
      vendorId: vendor1Profile.id,
      status: "NEGOTIATING",
      negotiatedTotal: 418000,
      messagesJson: JSON.stringify([
        {
          id: "m-1",
          sender: "BUYER",
          text: "Hi QuickCabin! We love this 20ft solar desert layout. Can you deliver to Jaisalmer site within 12 days for ₹4,15,000?",
          timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
          offerAmount: 415000,
        },
        {
          id: "m-2",
          sender: "VENDOR",
          text: "Hello Arun! We can fulfill this with Daikin Inverter & Saint-Gobain Cool-Lite glass. Best counter: ₹4,18,000 including crane offloading & 5-yr seal warranty.",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          offerAmount: 418000,
        },
      ]),
    },
  });

  console.log("✅ Seed completed successfully with demo users, vendors, attributes, and public design!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
