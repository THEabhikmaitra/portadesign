import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { EQUIPMENT_CATALOG } from "../src/lib/equipmentCatalog";
import { ROOM_PRESETS } from "../src/lib/roomPresets";

const prisma = new PrismaClient();

async function bootstrap() {
  console.log("Initializing clean production database (zero demo users/vendors/designs)...");

  // 1. Purge any residual demo/polluted rows ONLY when explicitly invoked via --clean
  if (process.argv.includes("--clean")) {
    await prisma.adminAuditLog.deleteMany();
    await prisma.quoteRequest.deleteMany();
    await prisma.designVersion.deleteMany();
    await prisma.design.deleteMany();
    await prisma.vendorRateCard.deleteMany();
    await prisma.vendorProfile.deleteMany();
    await prisma.user.deleteMany();
    await prisma.masterAttribute.deleteMany();
    await prisma.masterElement.deleteMany();
    await prisma.roomPreset.deleteMany();
    await prisma.designChallenge.deleteMany();
  }

  // 2. Singleton Global Logistics & Tax Defaults
  await prisma.logisticsDefaults.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  // 3. Optional initial Admin account from env (no hardcoded demo users)
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      await prisma.user.create({
        data: {
          email: adminEmail,
          name: process.env.ADMIN_NAME || "Platform Admin",
          password: hashedPassword,
          role: "ADMIN",
          status: "ACTIVE",
        },
      });
      console.log(`Created Admin user from env: ${adminEmail}`);
    }
  } else {
    console.log("No ADMIN_EMAIL/ADMIN_PASSWORD env set; use /auth/signin First-Time Admin Setup UI.");
  }

  // 4. Core Structural Modules & ISO Standards (only inserted if catalog is empty)
  const existingElCount = await prisma.masterElement.count();
  if (existingElCount === 0) {
    const baseStructures = [
      {
        category: "CABIN",
        subCategory: "STRUCTURE",
        code: "CABIN_20FT",
        name: "20ft Insulated Container Module",
        friendlyName: "160 sq.ft Room (20x8 ft)",
        description: "Standard 20x8x8.5ft ISO steel module with rockwool insulation & vinyl flooring",
        mountZone: "FLOOR_INTERIOR",
        dimensionsJson: JSON.stringify({ width: 2.44, height: 2.59, length: 6.06, weightKg: 2200 }),
        baseCost: 185000,
        optionsJson: JSON.stringify({ spotLabel: "20ft x 8ft ISO Room" }),
        threeConfigJson: JSON.stringify({ renderer: "builtin:CABIN", size: 20, length: 6.06, width: 2.44, height: 2.59 }),
        sortOrder: 1,
      },
      {
        category: "CABIN",
        subCategory: "STRUCTURE",
        code: "CABIN_40FT",
        name: "40ft High Cube Container Module",
        friendlyName: "320 sq.ft Hall (40x8 ft)",
        description: "Spacious 40x8x9.5ft High Cube module with soundproofing & corner posts",
        mountZone: "FLOOR_INTERIOR",
        dimensionsJson: JSON.stringify({ width: 2.44, height: 2.9, length: 12.19, weightKg: 3800 }),
        baseCost: 325000,
        optionsJson: JSON.stringify({ spotLabel: "40ft x 8ft ISO Hall" }),
        threeConfigJson: JSON.stringify({ renderer: "builtin:CABIN", size: 40, length: 12.19, width: 2.44, height: 2.9 }),
        sortOrder: 2,
      },
      {
        category: "DOOR",
        subCategory: "ACCESS",
        code: "DOOR_SLIDING_GLASS",
        name: "Panoramic Sliding Glass Door (2.2m x 2.1m)",
        friendlyName: "Sliding Glass Door",
        description: "Dual-track sliding patio door with thermal break frame",
        mountZone: "WALL_EXTERIOR",
        dimensionsJson: JSON.stringify({ width: 2.2, height: 2.1, depth: 0.12 }),
        baseCost: 28000,
        optionsJson: JSON.stringify({ spotLabel: "Front/Side Wall" }),
        threeConfigJson: JSON.stringify({ renderer: "builtin:DOOR_SLIDING_GLASS", width: 2.2, height: 2.1 }),
        sortOrder: 10,
      },
      {
        category: "DOOR",
        subCategory: "ACCESS",
        code: "DOOR_STEEL_PANEL",
        name: "Heavy-Duty Steel Access Door (0.95m x 2.05m)",
        friendlyName: "Main Steel Door",
        description: "Commercial insulated security door with multi-point lock",
        mountZone: "WALL_EXTERIOR",
        dimensionsJson: JSON.stringify({ width: 0.95, height: 2.05, depth: 0.08 }),
        baseCost: 16500,
        optionsJson: JSON.stringify({ spotLabel: "Entry Wall" }),
        threeConfigJson: JSON.stringify({ renderer: "builtin:DOOR_STEEL_PANEL", width: 0.95, height: 2.05 }),
        sortOrder: 11,
      },
      {
        category: "WINDOW",
        subCategory: "GLAZING",
        code: "WINDOW_PANORAMIC",
        name: "Panoramic Viewport Window (2.4m x 1.4m)",
        friendlyName: "Large View Window",
        description: "Wide architectural picture window with aluminum frame",
        mountZone: "WALL_EXTERIOR",
        dimensionsJson: JSON.stringify({ width: 2.4, height: 1.4, depth: 0.1 }),
        baseCost: 21000,
        optionsJson: JSON.stringify({ spotLabel: "Wall Viewport" }),
        threeConfigJson: JSON.stringify({ renderer: "builtin:WINDOW", width: 2.4, height: 1.4 }),
        sortOrder: 20,
      },
      {
        category: "WINDOW",
        subCategory: "GLAZING",
        code: "WINDOW_STANDARD",
        name: "Standard Awning Window (1.2m x 1.0m)",
        friendlyName: "Standard Window",
        description: "Dual glazed awning ventilation window with insect mesh",
        mountZone: "WALL_EXTERIOR",
        dimensionsJson: JSON.stringify({ width: 1.2, height: 1.0, depth: 0.08 }),
        baseCost: 11500,
        optionsJson: JSON.stringify({ spotLabel: "Ventilation Wall" }),
        threeConfigJson: JSON.stringify({ renderer: "builtin:WINDOW", width: 1.2, height: 1.0 }),
        sortOrder: 21,
      },
    ];

    const friendlySpotMap: Record<string, { friendlyName: string; spotLabel: string; category: string }> = {
      AC_SPLIT_INVERTER: { friendlyName: "Split AC (1.5 Ton)", spotLabel: "Auto-fits on back wall", category: "EQUIPMENT" },
      SOLAR_ARRAY_ROOF: { friendlyName: "Rooftop Solar Panels", spotLabel: "Auto-fits on roof", category: "EQUIPMENT" },
      WATER_TANK_OVERHEAD: { friendlyName: "Overhead Water Tank", spotLabel: "Auto-fits on roof", category: "EQUIPMENT" },
      STAIRS_EXTERNAL: { friendlyName: "Outside Steel Stairs", spotLabel: "Auto-fits beside room", category: "STAIRS" },
      WASHROOM_POD: { friendlyName: "Attached Bathroom", spotLabel: "Auto-fits inside room", category: "POD" },
      DESK_SET_OFFICE: { friendlyName: "Work Desk & Chairs", spotLabel: "Auto-fits inside room", category: "EQUIPMENT" },
      LED_CEILING_PANEL: { friendlyName: "Ceiling LED Light", spotLabel: "Auto-fits on ceiling", category: "EQUIPMENT" },
      CCTV_CAMERA: { friendlyName: "Security Camera", spotLabel: "Auto-fits above door", category: "EQUIPMENT" },
    };

    const equipmentRows = Object.values(EQUIPMENT_CATALOG).map((eq, idx) => {
      const meta = friendlySpotMap[eq.type] || {
        friendlyName: eq.name,
        spotLabel: "Auto-fits in room",
        category: "EQUIPMENT",
      };
      return {
        category: meta.category,
        subCategory: eq.category,
        code: eq.type,
        name: eq.name,
        friendlyName: meta.friendlyName,
        description: eq.brands?.[0]?.description || eq.name,
        mountZone: eq.allowedZones[0] || "FLOOR_INTERIOR",
        dimensionsJson: JSON.stringify({
          width: eq.boundingBox.width,
          height: eq.boundingBox.height,
          depth: eq.boundingBox.depth,
        }),
        baseCost: eq.basePrice,
        optionsJson: JSON.stringify({
          spotLabel: meta.spotLabel,
          brands: eq.brands || [],
          capacities: eq.capacities || [],
          finishes: eq.finishes || [],
        }),
        threeConfigJson: JSON.stringify({ renderer: `builtin:${eq.type}`, primitives: [] }),
        sortOrder: 30 + idx,
      };
    });

    for (const el of [...baseStructures, ...equipmentRows]) {
      await prisma.masterElement.create({ data: el });
    }
  }

  // 5. Core Design Attributes (Glass, Frames, Wall Paints)
  const existingAttrCount = await prisma.masterAttribute.count();
  if (existingAttrCount === 0) {
    const attributes = [
      {
        category: "GLASS_TYPE",
        code: "GLASS_CLEAR_SG",
        name: "Saint-Gobain Planiclear",
        friendlyName: "Clear",
        brand: "Saint-Gobain",
        specsJson: JSON.stringify({ uValue: 5.7, shgc: 0.82, lightTransmission: "90%" }),
        shaderJson: JSON.stringify({
          color: "#ffffff",
          roughness: 0.02,
          metalness: 0.05,
          transmission: 0.94,
          ior: 1.5,
          thickness: 0.4,
          clearcoat: 1.0,
          transparent: true,
          opacity: 0.35,
        }),
        costModifier: 0,
        sortOrder: 1,
      },
      {
        category: "GLASS_TYPE",
        code: "GLASS_TINTED_BLACK",
        name: "Saint-Gobain Cool-Lite Black Tint",
        friendlyName: "Dark Tint",
        brand: "Saint-Gobain",
        specsJson: JSON.stringify({ uValue: 3.8, shgc: 0.38, heatRejection: "65%" }),
        shaderJson: JSON.stringify({
          color: "#182026",
          roughness: 0.08,
          metalness: 0.25,
          transmission: 0.48,
          ior: 1.52,
          thickness: 0.8,
          clearcoat: 1.0,
          transparent: true,
          opacity: 0.72,
        }),
        costModifier: 3800,
        sortOrder: 2,
      },
      {
        category: "GLASS_TYPE",
        code: "GLASS_BRONZE_AIS",
        name: "AIS SunShield Reflective Bronze",
        friendlyName: "Bronze",
        brand: "AIS Glass",
        specsJson: JSON.stringify({ uValue: 3.5, shgc: 0.34, heatRejection: "70%" }),
        shaderJson: JSON.stringify({
          color: "#784d28",
          roughness: 0.12,
          metalness: 0.45,
          transmission: 0.42,
          ior: 1.54,
          thickness: 0.8,
          clearcoat: 1.0,
          transparent: true,
          opacity: 0.68,
        }),
        costModifier: 4500,
        sortOrder: 3,
      },
      {
        category: "GLASS_TYPE",
        code: "GLASS_FROSTED_AIS",
        name: "AIS Satinlite Frosted Privacy",
        friendlyName: "Frosted",
        brand: "AIS Glass",
        specsJson: JSON.stringify({ uValue: 5.4, shgc: 0.75, privacyLevel: "High" }),
        shaderJson: JSON.stringify({
          color: "#e2ecf5",
          roughness: 0.65,
          metalness: 0.02,
          transmission: 0.6,
          ior: 1.48,
          thickness: 1.0,
          clearcoat: 0.2,
          transparent: true,
          opacity: 0.85,
        }),
        costModifier: 2400,
        sortOrder: 4,
      },
      {
        category: "FRAME_MATERIAL",
        code: "FRAME_ALUM_CHARCOAL",
        name: "Jindal Matte Charcoal Aluminum",
        friendlyName: "Black Frame",
        brand: "Jindal Aluminium",
        specsJson: JSON.stringify({ alloy: "6063-T6" }),
        shaderJson: JSON.stringify({ color: "#272a30", roughness: 0.32, metalness: 0.82 }),
        costModifier: 1800,
        sortOrder: 10,
      },
      {
        category: "FRAME_MATERIAL",
        code: "FRAME_UPVC_WHITE",
        name: "Fenesta Multi-Chamber uPVC White",
        friendlyName: "White Frame",
        brand: "Fenesta",
        specsJson: JSON.stringify({ soundProofing: "40dB" }),
        shaderJson: JSON.stringify({ color: "#f8f9fa", roughness: 0.25, metalness: 0.04 }),
        costModifier: 0,
        sortOrder: 11,
      },
      {
        category: "FRAME_MATERIAL",
        code: "FRAME_STEEL_TATA",
        name: "Tata Structura Galvanized Steel",
        friendlyName: "Steel Frame",
        brand: "Tata Steel",
        specsJson: JSON.stringify({ grade: "YSt-310" }),
        shaderJson: JSON.stringify({ color: "#3e4752", roughness: 0.38, metalness: 0.92 }),
        costModifier: 2900,
        sortOrder: 12,
      },
      {
        category: "WALL_FINISH",
        code: "FINISH_DESERT_BEIGE",
        name: "Sahara Sand Cream (Thermal Reflective)",
        friendlyName: "Sand Cream",
        brand: "Berger Paints",
        specsJson: JSON.stringify({ sriIndex: 88 }),
        shaderJson: JSON.stringify({ color: "#cbb393", roughness: 0.58, metalness: 0.15 }),
        costModifier: 2800,
        sortOrder: 20,
      },
      {
        category: "WALL_FINISH",
        code: "FINISH_FOREST_OLIVE",
        name: "Sage Green Exterior Coat",
        friendlyName: "Sage Green",
        brand: "Berger Paints",
        specsJson: JSON.stringify({ finish: "Matte" }),
        shaderJson: JSON.stringify({ color: "#2c3b2e", roughness: 0.52, metalness: 0.2 }),
        costModifier: 3200,
        sortOrder: 21,
      },
      {
        category: "WALL_FINISH",
        code: "FINISH_OCEAN_CYBER",
        name: "Ocean Cyber Blue",
        friendlyName: "Ocean Blue",
        brand: "Asian Paints PPG",
        specsJson: JSON.stringify({ finish: "Polyurethane" }),
        shaderJson: JSON.stringify({ color: "#0f3d5e", roughness: 0.38, metalness: 0.35 }),
        costModifier: 4200,
        sortOrder: 22,
      },
      {
        category: "WALL_FINISH",
        code: "FINISH_BATTLESHIP_GREY",
        name: "Industrial Stone Grey",
        friendlyName: "Stone Grey",
        brand: "Asian Paints PPG",
        specsJson: JSON.stringify({ finish: "Standard" }),
        shaderJson: JSON.stringify({ color: "#475569", roughness: 0.45, metalness: 0.25 }),
        costModifier: 0,
        sortOrder: 23,
      },
    ];

    for (const attr of attributes) {
      await prisma.masterAttribute.create({ data: attr });
    }
  }

  // 6. Core Room Presets & Missions (Dynamic DB Config)
  const existingPresetCount = await prisma.roomPreset.count();
  if (existingPresetCount === 0) {
    for (let i = 0; i < ROOM_PRESETS.length; i++) {
      const p = ROOM_PRESETS[i];
      await prisma.roomPreset.create({
        data: {
          code: p.id,
          title: p.title,
          subtitle: p.subtitle,
          sizeLabel: p.sizeLabel,
          approxPriceLabel: p.approxPriceLabel,
          badge: p.badge,
          iconName: p.id,
          environment: p.environment,
          targetBudget: p.targetBudget,
          sceneJson: JSON.stringify({ cabins: p.cabins, equipment: p.equipment }),
          sortOrder: i + 1,
        },
      });
    }
  }

  const existingChallengeCount = await prisma.designChallenge.count();
  if (existingChallengeCount === 0) {
    const starterMissions = [
      {
        code: "CHALLENGE_DESERT_OFFICE",
        title: "Cool Terrace / Desert Room Under ₹4.6L",
        description: "Build a sunny plot room with Split AC, Solar Array, and Solar Shield glass under ₹4.6L.",
        badgeName: "Desert Solara Architect",
        badgeIcon: "🏜️",
        rewardXp: 350,
        sortOrder: 1,
        rulesJson: JSON.stringify([
          { label: "Set Environment to Sunny Plot (Desert)", type: "ENVIRONMENT_EQ", value: "desert" },
          { label: "Mount Inverter Air Conditioning", type: "HAS_ELEMENT", value: "AC_SPLIT_INVERTER" },
          { label: "Install Rooftop Solar Array", type: "HAS_ELEMENT", value: "SOLAR_ARRAY_ROOF" },
          { label: "Equip Tinted or Bronze Shield Glass", type: "HAS_GLASS_CODE", value: "GLASS_TINTED_BLACK,GLASS_BRONZE_AIS" },
          { label: "Keep Landed Total Under ₹4,60,000", type: "MAX_TOTAL_COST", value: 460000 },
        ]),
      },
      {
        code: "CHALLENGE_BEACH_DUPLEX",
        title: "2-Story Coastal Penthouse Studio",
        description: "Stack two containers vertically with exterior stairs and a panoramic window.",
        badgeName: "Coastal High-Riser",
        badgeIcon: "🏖️",
        rewardXp: 500,
        sortOrder: 2,
        rulesJson: JSON.stringify([
          { label: "Set Environment to Beach / Farm", type: "ENVIRONMENT_EQ", value: "beach" },
          { label: "Stack 2nd Story Container", type: "MIN_STORIES", value: 2 },
          { label: "Attach External Steel Staircase", type: "HAS_ELEMENT", value: "STAIRS_EXTERNAL" },
          { label: "Install Panoramic Viewport Window", type: "HAS_WINDOW_TYPE", value: "WINDOW_PANORAMIC" },
        ]),
      },
      {
        code: "CHALLENGE_NET_ZERO",
        title: "Net-Zero Off-Grid Eco Hub",
        description: "Engineer a self-sustaining unit with water tank, solar PV, LED lighting & Eco score ≥ 80.",
        badgeName: "Net-Zero Pioneer",
        badgeIcon: "⚡",
        rewardXp: 400,
        sortOrder: 3,
        rulesJson: JSON.stringify([
          { label: "Install Overhead Water Tank", type: "HAS_ELEMENT", value: "WATER_TANK_OVERHEAD" },
          { label: "Equip Rooftop Solar Array", type: "HAS_ELEMENT", value: "SOLAR_ARRAY_ROOF" },
          { label: "Install Ceiling LED Panel", type: "HAS_ELEMENT", value: "LED_CEILING_PANEL" },
          { label: "Achieve Eco/Solar Score ≥ 80/100", type: "MIN_ECO_SCORE", value: 80 },
        ]),
      },
    ];

    for (const m of starterMissions) {
      await prisma.designChallenge.create({ data: m });
    }
  }

  console.log("✅ Clean bootstrap finished.");
}

bootstrap()
  .catch((e) => {
    console.error("Bootstrap error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
