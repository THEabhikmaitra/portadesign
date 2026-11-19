export type CabinSize = "20FT" | "40FT";

export type MountZone =
  | "WALL_EXTERIOR"
  | "WALL_INTERIOR"
  | "ROOF_TOP"
  | "FLOOR_INTERIOR"
  | "PERIMETER_EDGE";

export type GlassTypeCode =
  | "GLASS_CLEAR_SG"
  | "GLASS_TINTED_BLACK"
  | "GLASS_BRONZE_AIS"
  | "GLASS_FROSTED_AIS";

export type FrameMaterialCode =
  | "FRAME_ALUM_CHARCOAL"
  | "FRAME_UPVC_WHITE"
  | "FRAME_STEEL_TATA";

export type WallFinishCode =
  | "FINISH_BATTLESHIP_GREY"
  | "FINISH_OCEAN_CYBER"
  | "FINISH_DESERT_BEIGE"
  | "FINISH_FOREST_OLIVE";

export type CameraMode = "orbit" | "cutaway" | "xray" | "firstperson";

export type EnvironmentType = "desert" | "beach" | "urban" | "forest";

export interface DoorConfig {
  id: string;
  type: "DOOR_SLIDING_GLASS" | "DOOR_STEEL_PANEL";
  glassType?: GlassTypeCode;
  frameMaterial?: FrameMaterialCode;
  brand?: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

export interface WindowConfig {
  id: string;
  type: "WINDOW_PANORAMIC" | "WINDOW_STANDARD";
  glassType: GlassTypeCode;
  frameMaterial: FrameMaterialCode;
  brand?: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

export interface CabinConfig {
  id: string;
  type: "CABIN_20FT" | "CABIN_40FT";
  tier: number; // 0 for ground, 1 for 2nd floor, 2 for 3rd floor
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
  type: string; // "AC_SPLIT_INVERTER" | "SOLAR_ARRAY_ROOF" | "WATER_TANK_OVERHEAD" | "STAIRS_EXTERNAL" | "WASHROOM_POD" | "DESK_SET_OFFICE" | "LED_CEILING_PANEL" | "CCTV_CAMERA"
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
  tax: number; // 18% GST standard prefab
  totalCost: number;
}

export interface BuildScores {
  thermalComfort: number; // 0 - 100
  naturalDaylight: number; // 0 - 100
  ecoSolar: number; // 0 - 100
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
