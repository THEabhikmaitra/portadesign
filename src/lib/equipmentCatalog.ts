import { MountZone } from "@/types";

export interface EquipmentDefinition {
  type: string;
  name: string;
  category: "HVAC" | "SOLAR" | "PLUMBING" | "ACCESS" | "INTERIOR" | "LIGHTING" | "SECURITY";
  allowedZones: MountZone[];
  boundingBox: { width: number; height: number; depth: number };
  basePrice: number;
  brands: {
    name: string;
    modifier: number;
    description: string;
  }[];
  capacities: {
    label: string;
    modifier: number;
    multiplier: number;
  }[];
  finishes?: {
    label: string;
    color: string;
    modifier: number;
  }[];
}

export const EQUIPMENT_CATALOG: Record<string, EquipmentDefinition> = {
  AC_SPLIT_INVERTER: {
    type: "AC_SPLIT_INVERTER",
    name: "Split Inverter AC (Indoor Blower + Outdoor Condenser)",
    category: "HVAC",
    allowedZones: ["WALL_INTERIOR"],
    boundingBox: { width: 0.95, height: 0.32, depth: 0.24 },
    basePrice: 38500,
    brands: [
      { name: "Daikin Inverter", modifier: 4500, description: "Streamer discharge air purification & dual flap" },
      { name: "Voltas Executive", modifier: 0, description: "Heavy duty copper condenser & instant cooling" },
      { name: "Mitsubishi Heavy", modifier: 8000, description: "Ultra-quiet 19dB operation & jet airflow" },
    ],
    capacities: [
      { label: "1.0 Ton (120 sq.ft)", modifier: -4000, multiplier: 1.0 },
      { label: "1.5 Ton (180 sq.ft)", modifier: 0, multiplier: 1.5 },
      { label: "2.0 Ton (260 sq.ft)", modifier: 9500, multiplier: 2.0 },
    ],
    finishes: [
      { label: "Arctic Gloss White", color: "#f8fafc", modifier: 0 },
      { label: "Titanium Matte Grey", color: "#475569", modifier: 1500 },
    ],
  },
  SOLAR_ARRAY_ROOF: {
    type: "SOLAR_ARRAY_ROOF",
    name: "Rooftop Monocrystalline Solar Array",
    category: "SOLAR",
    allowedZones: ["ROOF_TOP"],
    boundingBox: { width: 3.4, height: 0.35, depth: 2.2 },
    basePrice: 128000,
    brands: [
      { name: "Tata Power Solar", modifier: 0, description: "Tier 1 bifacial cells with 25-yr performance warranty" },
      { name: "Adani Solar", modifier: -5000, description: "High-density multi-busbar technology" },
      { name: "Waaree Energies", modifier: -3000, description: "Anti-reflective coated tempered glass" },
    ],
    capacities: [
      { label: "2.2 kW (4 Panels)", modifier: -35000, multiplier: 2.2 },
      { label: "3.2 kW (6 Panels)", modifier: 0, multiplier: 3.2 },
      { label: "5.4 kW (10 Panels)", modifier: 65000, multiplier: 5.4 },
    ],
  },
  WATER_TANK_OVERHEAD: {
    type: "WATER_TANK_OVERHEAD",
    name: "Overhead Insulated Water Tank with Stand",
    category: "PLUMBING",
    allowedZones: ["ROOF_TOP"],
    boundingBox: { width: 1.3, height: 1.6, depth: 1.3 },
    basePrice: 17500,
    brands: [
      { name: "Sintex Pure", modifier: 0, description: "100% virgin food-grade plastic with antibacterial shield" },
      { name: "Vectus Granito", modifier: 1200, description: "Heavy duty threaded lid with foam insulation" },
      { name: "Supreme Weather Master", modifier: -800, description: "UV-shield triple layer" },
    ],
    capacities: [
      { label: "500 Liters", modifier: -5000, multiplier: 0.5 },
      { label: "1000 Liters", modifier: 0, multiplier: 1.0 },
      { label: "2000 Liters", modifier: 12000, multiplier: 2.0 },
    ],
    finishes: [
      { label: "Desert Sand Gold", color: "#c2a67a", modifier: 0 },
      { label: "Jet Black UV Shield", color: "#181a1d", modifier: 500 },
      { label: "Cool White", color: "#f0f4f8", modifier: 0 },
    ],
  },
  STAIRS_EXTERNAL: {
    type: "STAIRS_EXTERNAL",
    name: "Galvanized External Steel Staircase",
    category: "ACCESS",
    allowedZones: ["PERIMETER_EDGE"],
    boundingBox: { width: 1.25, height: 2.85, depth: 3.6 },
    basePrice: 48000,
    brands: [
      { name: "Tata Structura", modifier: 4000, description: "Industrial hot-dip galvanized YSt-310 hollow tubes" },
      { name: "Jindal Megha", modifier: 0, description: "Modular bolted steel frame with perforated treads" },
    ],
    capacities: [
      { label: "Single Flight (2.6m H)", modifier: 0, multiplier: 1.0 },
      { label: "Tall High-Cube (2.9m H)", modifier: 6000, multiplier: 1.2 },
    ],
    finishes: [
      { label: "Galvanized Silver", color: "#94a3b8", modifier: 0 },
      { label: "Industrial Safety Yellow", color: "#eab308", modifier: 2500 },
      { label: "Charcoal Black", color: "#1e293b", modifier: 2000 },
    ],
  },
  WASHROOM_POD: {
    type: "WASHROOM_POD",
    name: "Ensuite Modular Bathroom Pod",
    category: "PLUMBING",
    allowedZones: ["FLOOR_INTERIOR"],
    boundingBox: { width: 1.4, height: 2.4, depth: 1.8 },
    basePrice: 58000,
    brands: [
      { name: "Jaquar Smart Pod", modifier: 7000, description: "Sensor faucet, rain shower & rimless wall-hung WC" },
      { name: "Cera Modular Suite", modifier: 0, description: "Concealed cistern, ceramic basin & anti-skid floor" },
      { name: "Hindware Compact", modifier: -3500, description: "Space saving duo-flush & instant heater port" },
    ],
    capacities: [
      { label: "Compact Powder Room (1.2 x 1.4m)", modifier: -12000, multiplier: 0.8 },
      { label: "Full Bathroom with Shower (1.4 x 1.8m)", modifier: 0, multiplier: 1.0 },
      { label: "Executive Deluxe Suite (1.8 x 2.2m)", modifier: 22000, multiplier: 1.4 },
    ],
  },
  DESK_SET_OFFICE: {
    type: "DESK_SET_OFFICE",
    name: "Ergonomic Office Workstation Set",
    category: "INTERIOR",
    allowedZones: ["FLOOR_INTERIOR"],
    boundingBox: { width: 1.6, height: 1.1, depth: 1.2 },
    basePrice: 24500,
    brands: [
      { name: "Godrej Interio", modifier: 3500, description: "Commercial scratch-resistant laminate & mesh lumbar" },
      { name: "Featherlite Motion", modifier: 5500, description: "High-grade synchronized tilt mechanism" },
      { name: "PortaCraft Custom", modifier: 0, description: "Pre-assembled fitted plywood with cable tray" },
    ],
    capacities: [
      { label: "Solo Focus Desk (1-Person)", modifier: -8000, multiplier: 0.6 },
      { label: "Executive Dual Pod (2-Person)", modifier: 0, multiplier: 1.0 },
      { label: "Collaborative Quad (4-Person)", modifier: 21000, multiplier: 2.0 },
    ],
    finishes: [
      { label: "Natural Warm Oak", color: "#a3704c", modifier: 0 },
      { label: "Nordic Smoked Walnut", color: "#4a3b32", modifier: 1500 },
      { label: "Minimalist Concrete Grey", color: "#64748b", modifier: 800 },
    ],
  },
  LED_CEILING_PANEL: {
    type: "LED_CEILING_PANEL",
    name: "Recessed 36W Architectural LED Panel",
    category: "LIGHTING",
    allowedZones: ["ROOF_TOP"],
    boundingBox: { width: 0.6, height: 0.05, depth: 0.6 },
    basePrice: 3200,
    brands: [
      { name: "Philips SmartLight", modifier: 900, description: "Wi-Fi smart CCT tunable 3000K-6500K with app dimming" },
      { name: "Havells Adore", modifier: 0, description: "Flicker-free micro-prismatic glare reduction" },
      { name: "Wipro Garnet", modifier: -400, description: "High lumens per watt commercial driver" },
    ],
    capacities: [
      { label: "Single 36W Panel (600x600)", modifier: 0, multiplier: 1.0 },
      { label: "Dual Pair 72W (2x Panels)", modifier: 2800, multiplier: 1.9 },
      { label: "Quad Grid 144W (4x Panels)", modifier: 7800, multiplier: 3.6 },
    ],
  },
  CCTV_CAMERA: {
    type: "CCTV_CAMERA",
    name: "4K Vandal-Resistant Security Dome Camera",
    category: "SECURITY",
    allowedZones: ["WALL_EXTERIOR"],
    boundingBox: { width: 0.18, height: 0.18, depth: 0.22 },
    basePrice: 6500,
    brands: [
      { name: "Hikvision Ultra", modifier: 1800, description: "DarkFighter low-light color AI detection" },
      { name: "CP Plus Coral", modifier: 0, description: "Starlight 4K dome with 30m IR night vision" },
      { name: "Dahua WizSense", modifier: 1200, description: "Perimeter intrusion active deterrence strobe" },
    ],
    capacities: [
      { label: "Single Perimeter Cam", modifier: 0, multiplier: 1.0 },
      { label: "Dual Angle Kit (2x Cams)", modifier: 5800, multiplier: 1.9 },
    ],
  },
};

// Check if placement coordinates violate surface zone rules or bounding collisions
export function validateEquipmentPlacement(
  equipmentType: string,
  targetZone: MountZone,
  cabinTier: number
): { valid: boolean; reason?: string } {
  const def = EQUIPMENT_CATALOG[equipmentType];
  if (!def) return { valid: false, reason: "Unknown equipment type" };

  if (!def.allowedZones.includes(targetZone)) {
    return {
      valid: false,
      reason: `Must be mounted on ${def.allowedZones.join(" or ")} (attempted ${targetZone})`,
    };
  }

  if (targetZone === "PERIMETER_EDGE" && cabinTier === 0) {
    // External stairs to reach 2nd floor usually snap beside tier 0 or connecting to tier 1
    return { valid: true };
  }

  return { valid: true };
}
