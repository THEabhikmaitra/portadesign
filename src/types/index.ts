export type CabinSize = "20FT" | "40FT";

export type MountZone =
  | "WALL_EXTERIOR"
  | "WALL_INTERIOR"
  | "ROOF_TOP"
  | "FLOOR_INTERIOR"
  | "PERIMETER_EDGE";

export type GlassTypeCode = string;
export type FrameMaterialCode = string;
export type WallFinishCode = string;

export type CameraMode = "orbit" | "cutaway" | "xray" | "firstperson";

export type EnvironmentType = "desert" | "beach" | "urban" | "forest";

export type ConditionMode = "NEW" | "REFURB_READY" | "USED_WWT";
export type DeliveryMode = "READY_BUILT" | "KNOCK_DOWN" | "SELF_PICKUP";
export type RoadWidthType = "WIDE" | "NARROW";
export type PlacementLevelType = "GROUND" | "MID_FLOOR" | "TERRACE";
export type OverheadClearanceType = "CLEAR" | "WIRES_OR_GATE";
export type InsulationTier = "STANDARD" | "PUF_50MM" | "PUF_75MM_CANOPY";

export interface ThreePrimitive {
  id?: string;
  shape: "box" | "cylinder" | "sphere" | "plane";
  args: number[];
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  transmission?: number;
  ior?: number;
  opacity?: number;
  transparent?: boolean;
  nightGlow?: boolean;
}

export interface ElementOptionsConfig {
  spotLabel?: string;
  brands?: { name: string; modifier: number; description?: string }[];
  capacities?: { label: string; modifier: number; multiplier: number }[];
  finishes?: { label: string; color: string; modifier: number }[];
}

export interface CatalogElementItem {
  id: string;
  category: string; // CABIN, DOOR, WINDOW, EQUIPMENT, STAIRS, POD
  subCategory?: string | null;
  code: string;
  name: string;
  friendlyName?: string | null;
  description?: string | null;
  mountZone: MountZone;
  dimensions: {
    width?: number;
    height?: number;
    length?: number;
    depth?: number;
    weightKg?: number;
  };
  baseCost: number;
  options: ElementOptionsConfig;
  threeConfig?: {
    renderer?: string;
    size?: number;
    length?: number;
    width?: number;
    height?: number;
    primitives?: ThreePrimitive[];
  } | null;
  iconUrl?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface CatalogAttributeItem {
  id: string;
  category: string; // GLASS_TYPE, FRAME_MATERIAL, WALL_FINISH, BRAND, SOLAR_CAPACITY, INSULATION
  code: string;
  name: string;
  friendlyName?: string | null;
  brand?: string | null;
  specs: Record<string, any>;
  shader: {
    color: string;
    roughness?: number;
    metalness?: number;
    transmission?: number;
    ior?: number;
    thickness?: number;
    clearcoat?: number;
    opacity?: number;
    transparent?: boolean;
  };
  costModifier: number;
  iconUrl?: string | null;
  textureUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface CatalogPresetItem {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  sizeLabel: string;
  approxPriceLabel: string;
  badge?: string | null;
  iconName?: string | null;
  thumbUrl?: string | null;
  environment: EnvironmentType;
  targetBudget: number;
  scene: { cabins: CabinConfig[]; equipment: EquipmentConfig[] };
  isActive: boolean;
  sortOrder: number;
}

export interface ChallengeRule {
  label: string;
  type:
    | "ENVIRONMENT_EQ"
    | "MIN_CABINS"
    | "MIN_STORIES"
    | "HAS_ELEMENT"
    | "HAS_WINDOW_TYPE"
    | "HAS_DOOR_TYPE"
    | "HAS_GLASS_CODE"
    | "MAX_TOTAL_COST"
    | "MIN_ECO_SCORE"
    | "MIN_THERMAL_SCORE"
    | "MIN_DAYLIGHT_SCORE";
  value: string | number;
}

export interface CatalogChallengeItem {
  id: string;
  code: string;
  title: string;
  description: string;
  badgeName: string;
  badgeIcon: string;
  badgeIconUrl?: string | null;
  rewardXp: number;
  rules: ChallengeRule[];
  isActive: boolean;
  sortOrder: number;
}

export interface LogisticsDefaultsConfig {
  gstRatePct: number;
  transportPerKm20ft: number;
  transportPerKm40ft: number;
  craneGroundFee: number;
  craneTerraceFee: number;
  knockDownPerKm: number;
  knockDownAssemblyFee: number;
  foundationGroundFee: number;
  foundationUpperFee: number;
  puf50mmCost: number;
  flyRoofCanopyPrice: number;
  defaultRefurbDiscount: number;
  defaultUsedWwtDiscount: number;
  minBidAmount: number;
  maxBidAmount: number;
}

export interface CustomerContactInfo {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  pincode: string;
  addressLine: string;
  landmark: string;
  latitude?: number;
  longitude?: number;
  locationAccuracyM?: number;
}

export interface LogisticsConfig {
  condition: ConditionMode;
  deliveryMode: DeliveryMode;
  distanceKm: number;
  roadWidth: RoadWidthType;
  placementLevel: PlacementLevelType;
  overheadClearance?: OverheadClearanceType;
  insulationTier: InsulationTier;
}

export interface VendorLogisticsSettings {
  transportPerKm20ft: number;
  transportPerKm40ft: number;
  craneGroundFee: number;
  craneTerraceFee: number;
  knockDownSupported: boolean;
  knockDownPerKm: number;
  knockDownAssemblyFee: number;
  sellsRefurbished: boolean;
  refurbDiscountPct: number;
  usedWwtDiscountPct: number;
  refurbStockCount: number;
  refurbWarrantyYears: number;
  flyRoofCanopyPrice: number;
}

export interface DoorConfig {
  id: string;
  type: string;
  glassType?: GlassTypeCode;
  frameMaterial?: FrameMaterialCode;
  brand?: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

export interface WindowConfig {
  id: string;
  type: string;
  glassType: GlassTypeCode;
  frameMaterial: FrameMaterialCode;
  brand?: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

export interface CabinConfig {
  id: string;
  type: string;
  tier: number;
  position: [number, number, number];
  rotation: [number, number, number];
  wallFinish: WallFinishCode;
  hasPassThroughLeft?: boolean;
  hasPassThroughRight?: boolean;
  doors: DoorConfig[];
  windows: WindowConfig[];
}

export interface EquipmentConfig {
  id: string;
  type: string;
  brand: string;
  capacity?: string;
  finish?: string;
  mountZone: MountZone;
  position: [number, number, number];
  rotation: [number, number, number];
  parentCabinId?: string;
}

export interface SceneState {
  environment: EnvironmentType;
  dayNight: "day" | "night";
  cabins: CabinConfig[];
  equipment: EquipmentConfig[];
  targetBudget?: number;
  logistics?: LogisticsConfig;
}

export interface BomItem {
  code: string;
  name: string;
  category: string;
  brand?: string;
  count: number;
  unitPrice: number;
  total: number;
}

export interface BomSummary {
  items: BomItem[];
  subtotal: number;
  tax: number;
  transportCost: number;
  craneOrAssemblyCost: number;
  foundationOrCanopyCost: number;
  totalCost: number;
}

export interface BuildScores {
  thermalComfort: number;
  naturalDaylight: number;
  ecoSolar: number;
  overallScore: number;
}

export interface DesignChallenge {
  id: string;
  title: string;
  description: string;
  badgeId: string;
  badgeName: string;
  rewardXp: number;
  check: (scene: SceneState, bom: BomSummary, scores: BuildScores) => boolean;
}
