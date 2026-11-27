import { CabinConfig, EquipmentConfig, EnvironmentType, MountZone } from "@/types";
import { EQUIPMENT_CATALOG } from "./equipmentCatalog";

export interface RoomPreset {
  id: string;
  title: string;
  subtitle: string;
  sizeLabel: string;
  approxPriceLabel: string;
  badge: string;
  environment: EnvironmentType;
  targetBudget: number;
  cabins: CabinConfig[];
  equipment: EquipmentConfig[];
}

export const ROOM_PRESETS: RoomPreset[] = [
  {
    id: "terrace-room",
    title: "Terrace Room",
    subtitle: "Cool insulated extra bedroom or chill room for your roof",
    sizeLabel: "160 sq.ft (20×8 ft)",
    approxPriceLabel: "~₹3.2L",
    badge: "Most Popular",
    environment: "urban",
    targetBudget: 380000,
    cabins: [
      {
        id: "cabin-terrace-1",
        type: "CABIN_20FT",
        tier: 0,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        wallFinish: "FINISH_DESERT_BEIGE",
        doors: [
          {
            id: "door-terrace-1",
            type: "DOOR_SLIDING_GLASS",
            glassType: "GLASS_TINTED_BLACK",
            frameMaterial: "FRAME_ALUM_CHARCOAL",
            brand: "Saint-Gobain",
            position: [0, 1.05, 1.23],
            rotation: [0, 0, 0],
          },
        ],
        windows: [
          {
            id: "win-terrace-1",
            type: "WINDOW_PANORAMIC",
            glassType: "GLASS_BRONZE_AIS",
            frameMaterial: "FRAME_ALUM_CHARCOAL",
            brand: "AIS Glass",
            position: [1.6, 1.3, -1.23],
            rotation: [0, Math.PI, 0],
          },
        ],
      },
    ],
    equipment: [
      {
        id: "eq-terrace-ac",
        type: "AC_SPLIT_INVERTER",
        brand: "Daikin Inverter",
        capacity: "1.5 Ton (180 sq.ft)",
        finish: "Arctic Gloss White",
        mountZone: "WALL_INTERIOR",
        position: [0, 2.05, -1.12],
        rotation: [0, 0, 0],
        parentCabinId: "cabin-terrace-1",
      },
      {
        id: "eq-terrace-led",
        type: "LED_CEILING_PANEL",
        brand: "Philips SmartLight",
        capacity: "Single 36W Panel (600x600)",
        mountZone: "ROOF_TOP",
        position: [0, 2.52, 0],
        rotation: [0, 0, 0],
        parentCabinId: "cabin-terrace-1",
      },
    ],
  },
  {
    id: "garden-studio",
    title: "Garden Studio",
    subtitle: "Peaceful backyard home office or hobby room with desk",
    sizeLabel: "160 sq.ft (20×8 ft)",
    approxPriceLabel: "~₹3.5L",
    badge: "Work From Home",
    environment: "forest",
    targetBudget: 400000,
    cabins: [
      {
        id: "cabin-garden-1",
        type: "CABIN_20FT",
        tier: 0,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        wallFinish: "FINISH_FOREST_OLIVE",
        doors: [
          {
            id: "door-garden-1",
            type: "DOOR_SLIDING_GLASS",
            glassType: "GLASS_CLEAR_SG",
            frameMaterial: "FRAME_ALUM_CHARCOAL",
            brand: "Saint-Gobain",
            position: [0.5, 1.05, 1.23],
            rotation: [0, 0, 0],
          },
        ],
        windows: [
          {
            id: "win-garden-1",
            type: "WINDOW_PANORAMIC",
            glassType: "GLASS_CLEAR_SG",
            frameMaterial: "FRAME_UPVC_WHITE",
            brand: "AIS Glass",
            position: [-1.4, 1.3, 1.23],
            rotation: [0, 0, 0],
          },
        ],
      },
    ],
    equipment: [
      {
        id: "eq-garden-desk",
        type: "DESK_SET_OFFICE",
        brand: "Godrej Interio",
        capacity: "Executive Dual Pod (2-Person)",
        finish: "Natural Warm Oak",
        mountZone: "FLOOR_INTERIOR",
        position: [-1.5, 0.08, 0],
        rotation: [0, Math.PI / 2, 0],
        parentCabinId: "cabin-garden-1",
      },
      {
        id: "eq-garden-ac",
        type: "AC_SPLIT_INVERTER",
        brand: "Voltas Executive",
        capacity: "1.5 Ton (180 sq.ft)",
        finish: "Arctic Gloss White",
        mountZone: "WALL_INTERIOR",
        position: [0.5, 2.05, -1.12],
        rotation: [0, 0, 0],
        parentCabinId: "cabin-garden-1",
      },
      {
        id: "eq-garden-led",
        type: "LED_CEILING_PANEL",
        brand: "Havells Adore",
        capacity: "Single 36W Panel (600x600)",
        mountZone: "ROOF_TOP",
        position: [0, 2.52, 0],
        rotation: [0, 0, 0],
        parentCabinId: "cabin-garden-1",
      },
    ],
  },
  {
    id: "guest-suite",
    title: "Guest Bedroom",
    subtitle: "Ready-to-live room with attached bathroom & water tank",
    sizeLabel: "160 sq.ft (1 Room + Bath)",
    approxPriceLabel: "~₹4.0L",
    badge: "Attached Bath",
    environment: "forest",
    targetBudget: 450000,
    cabins: [
      {
        id: "cabin-guest-1",
        type: "CABIN_20FT",
        tier: 0,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        wallFinish: "FINISH_DESERT_BEIGE",
        doors: [
          {
            id: "door-guest-1",
            type: "DOOR_SLIDING_GLASS",
            glassType: "GLASS_FROSTED_AIS",
            frameMaterial: "FRAME_UPVC_WHITE",
            brand: "AIS Glass",
            position: [-0.8, 1.05, 1.23],
            rotation: [0, 0, 0],
          },
        ],
        windows: [
          {
            id: "win-guest-1",
            type: "WINDOW_STANDARD",
            glassType: "GLASS_TINTED_BLACK",
            frameMaterial: "FRAME_UPVC_WHITE",
            brand: "Saint-Gobain",
            position: [-1.4, 1.35, -1.23],
            rotation: [0, Math.PI, 0],
          },
        ],
      },
    ],
    equipment: [
      {
        id: "eq-guest-bath",
        type: "WASHROOM_POD",
        brand: "Cera Modular Suite",
        capacity: "Full Bathroom with Shower (1.4 x 1.8m)",
        mountZone: "FLOOR_INTERIOR",
        position: [2.1, 0.08, 0],
        rotation: [0, -Math.PI / 2, 0],
        parentCabinId: "cabin-guest-1",
      },
      {
        id: "eq-guest-ac",
        type: "AC_SPLIT_INVERTER",
        brand: "Daikin Inverter",
        capacity: "1.5 Ton (180 sq.ft)",
        finish: "Arctic Gloss White",
        mountZone: "WALL_INTERIOR",
        position: [-0.8, 2.05, -1.12],
        rotation: [0, 0, 0],
        parentCabinId: "cabin-guest-1",
      },
      {
        id: "eq-guest-tank",
        type: "WATER_TANK_OVERHEAD",
        brand: "Sintex Pure",
        capacity: "1000 Liters",
        finish: "Desert Sand Gold",
        mountZone: "ROOF_TOP",
        position: [2.0, 2.6, 0],
        rotation: [0, 0, 0],
        parentCabinId: "cabin-guest-1",
      },
    ],
  },
  {
    id: "cafe-shop",
    title: "Home Shop / Cafe",
    subtitle: "Bright glass-front boutique, tuition class, or garden cafe",
    sizeLabel: "160 sq.ft (20×8 ft)",
    approxPriceLabel: "~₹3.3L",
    badge: "Business Ready",
    environment: "urban",
    targetBudget: 380000,
    cabins: [
      {
        id: "cabin-shop-1",
        type: "CABIN_20FT",
        tier: 0,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        wallFinish: "FINISH_OCEAN_CYBER",
        doors: [
          {
            id: "door-shop-1",
            type: "DOOR_SLIDING_GLASS",
            glassType: "GLASS_CLEAR_SG",
            frameMaterial: "FRAME_ALUM_CHARCOAL",
            brand: "Saint-Gobain",
            position: [-0.9, 1.05, 1.23],
            rotation: [0, 0, 0],
          },
        ],
        windows: [
          {
            id: "win-shop-1",
            type: "WINDOW_PANORAMIC",
            glassType: "GLASS_CLEAR_SG",
            frameMaterial: "FRAME_ALUM_CHARCOAL",
            brand: "Saint-Gobain",
            position: [1.5, 1.25, 1.23],
            rotation: [0, 0, 0],
          },
        ],
      },
    ],
    equipment: [
      {
        id: "eq-shop-ac",
        type: "AC_SPLIT_INVERTER",
        brand: "Voltas Executive",
        capacity: "1.5 Ton (180 sq.ft)",
        finish: "Titanium Matte Grey",
        mountZone: "WALL_INTERIOR",
        position: [0, 2.05, -1.12],
        rotation: [0, 0, 0],
        parentCabinId: "cabin-shop-1",
      },
      {
        id: "eq-shop-led",
        type: "LED_CEILING_PANEL",
        brand: "Philips SmartLight",
        capacity: "Dual Pair 72W (2x Panels)",
        mountZone: "ROOF_TOP",
        position: [0, 2.52, 0],
        rotation: [0, 0, 0],
        parentCabinId: "cabin-shop-1",
      },
      {
        id: "eq-shop-cctv",
        type: "CCTV_CAMERA",
        brand: "CP Plus Coral",
        capacity: "Single Perimeter Cam",
        mountZone: "WALL_EXTERIOR",
        position: [-2.7, 2.35, 1.28],
        rotation: [0, 0, 0],
        parentCabinId: "cabin-shop-1",
      },
    ],
  },
];

// Computes exact valid coordinates inside/on a cabin so noob users never place items floating in thin air
export function getAutoSnapPlacement(
  type: string,
  cabin: CabinConfig,
  existingEquipment: EquipmentConfig[]
): { position: [number, number, number]; rotation: [number, number, number]; mountZone: MountZone } {
  const def = EQUIPMENT_CATALOG[type];
  const zone: MountZone = def?.allowedZones[0] || "FLOOR_INTERIOR";

  const [cx, cy, cz] = cabin.position;
  const is40Ft = cabin.type === "CABIN_40FT";
  const halfL = is40Ft ? 6.09 : 3.03;
  const height = is40Ft ? 2.9 : 2.59;

  // Count how many items of this type/zone already exist on this cabin to offset neatly
  const sameCabinEq = existingEquipment.filter((e) => e.parentCabinId === cabin.id);
  const sameTypeCount = sameCabinEq.filter((e) => e.type === type).length;
  const shiftX = (sameTypeCount % 2 === 0 ? 1 : -1) * Math.ceil(sameTypeCount / 2) * 1.3;

  switch (type) {
    case "AC_SPLIT_INVERTER":
      return {
        position: [cx + shiftX, cy + height - 0.52, cz - 1.12],
        rotation: [0, 0, 0],
        mountZone: "WALL_INTERIOR",
      };

    case "SOLAR_ARRAY_ROOF":
      return {
        position: [cx + (sameTypeCount > 0 ? -1.8 : 0), cy + height + 0.06, cz],
        rotation: [0, 0, 0],
        mountZone: "ROOF_TOP",
      };

    case "WATER_TANK_OVERHEAD":
      return {
        position: [cx + halfL - 0.9, cy + height + 0.02, cz + (sameTypeCount > 0 ? 0.5 : -0.4)],
        rotation: [0, 0, 0],
        mountZone: "ROOF_TOP",
      };

    case "STAIRS_EXTERNAL":
      return {
        position: [cx + halfL + 0.72, 0, cz],
        rotation: [0, 0, 0],
        mountZone: "PERIMETER_EDGE",
      };

    case "WASHROOM_POD":
      return {
        position: [cx + halfL - 0.95 - sameTypeCount * 1.6, cy + 0.08, cz],
        rotation: [0, -Math.PI / 2, 0],
        mountZone: "FLOOR_INTERIOR",
      };

    case "DESK_SET_OFFICE":
      return {
        position: [cx - 1.2 + shiftX, cy + 0.08, cz],
        rotation: [0, Math.PI / 2, 0],
        mountZone: "FLOOR_INTERIOR",
      };

    case "LED_CEILING_PANEL":
      return {
        position: [cx + shiftX, cy + height - 0.08, cz],
        rotation: [0, 0, 0],
        mountZone: "ROOF_TOP",
      };

    case "CCTV_CAMERA":
      return {
        position: [cx - halfL + 0.35 + sameTypeCount * 2.2, cy + height - 0.25, cz + 1.28],
        rotation: [0, 0, 0],
        mountZone: "WALL_EXTERIOR",
      };

    default:
      return {
        position: [cx + shiftX, cy + 0.08, cz],
        rotation: [0, 0, 0],
        mountZone: zone,
      };
  }
}
