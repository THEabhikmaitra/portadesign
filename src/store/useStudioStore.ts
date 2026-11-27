import { create } from "zustand";
import {
  CabinConfig,
  DoorConfig,
  WindowConfig,
  EquipmentConfig,
  SceneState,
  BomSummary,
  BuildScores,
  CameraMode,
  EnvironmentType,
  GlassTypeCode,
  FrameMaterialCode,
  WallFinishCode,
  LogisticsConfig,
  CustomerContactInfo,
  CatalogElementItem,
  CatalogAttributeItem,
  CatalogPresetItem,
  CatalogChallengeItem,
  LogisticsDefaultsConfig,
  MountZone,
} from "@/types";
import { soundEngine } from "@/lib/soundEngine";
import {
  calculateSiteLogistics,
  defaultsToVendorLogistics,
  DEFAULT_LOGISTICS_CONFIG,
} from "@/lib/logisticsEngine";

export interface SelectedEntity {
  type: "cabin" | "door" | "window" | "equipment";
  id: string;
  parentCabinId?: string;
}

function computeAutoSnap(
  el: CatalogElementItem | undefined,
  type: string,
  cabin: CabinConfig,
  existingEquipment: EquipmentConfig[],
  allElements: CatalogElementItem[]
): { position: [number, number, number]; rotation: [number, number, number]; mountZone: MountZone } {
  const cabinEl = allElements.find((e) => e.code === cabin.type);
  const length = Number(cabinEl?.dimensions?.length) || (cabin.type === "CABIN_40FT" ? 12.19 : 6.06);
  const height = Number(cabinEl?.dimensions?.height) || (cabin.type === "CABIN_40FT" ? 2.9 : 2.59);
  const width = Number(cabinEl?.dimensions?.width) || 2.44;
  const halfL = length / 2;
  const halfW = width / 2;

  const zone: MountZone = el?.mountZone || "FLOOR_INTERIOR";
  const [cx, cy, cz] = cabin.position;

  const sameCabinEq = existingEquipment.filter((e) => e.parentCabinId === cabin.id);
  const sameTypeCount = sameCabinEq.filter((e) => e.type === type).length;
  const shiftX = (sameTypeCount % 2 === 0 ? 1 : -1) * Math.ceil(sameTypeCount / 2) * 1.3;

  switch (type) {
    case "AC_SPLIT_INVERTER":
      return { position: [cx + shiftX, cy + height - 0.52, cz - (halfW - 0.1)], rotation: [0, 0, 0], mountZone: "WALL_INTERIOR" };
    case "SOLAR_ARRAY_ROOF":
      return { position: [cx + (sameTypeCount > 0 ? -1.8 : 0), cy + height + 0.06, cz], rotation: [0, 0, 0], mountZone: "ROOF_TOP" };
    case "WATER_TANK_OVERHEAD":
      return { position: [cx + halfL - 0.9, cy + height + 0.02, cz + (sameTypeCount > 0 ? 0.5 : -0.4)], rotation: [0, 0, 0], mountZone: "ROOF_TOP" };
    case "STAIRS_EXTERNAL":
      return { position: [cx + halfL + 0.72, 0, cz], rotation: [0, 0, 0], mountZone: "PERIMETER_EDGE" };
    case "WASHROOM_POD":
      return { position: [cx + halfL - 0.95 - sameTypeCount * 1.6, cy + 0.08, cz], rotation: [0, -Math.PI / 2, 0], mountZone: "FLOOR_INTERIOR" };
    case "DESK_SET_OFFICE":
      return { position: [cx - 1.2 + shiftX, cy + 0.08, cz], rotation: [0, Math.PI / 2, 0], mountZone: "FLOOR_INTERIOR" };
    case "LED_CEILING_PANEL":
      return { position: [cx + shiftX, cy + height - 0.08, cz], rotation: [0, 0, 0], mountZone: "ROOF_TOP" };
    case "CCTV_CAMERA":
      return { position: [cx - halfL + 0.35 + sameTypeCount * 2.2, cy + height - 0.25, cz + halfW + 0.06], rotation: [0, 0, 0], mountZone: "WALL_EXTERIOR" };
    default: {
      if (zone === "ROOF_TOP") {
        return { position: [cx + shiftX, cy + height + 0.05, cz], rotation: [0, 0, 0], mountZone: zone };
      }
      if (zone === "WALL_INTERIOR") {
        return { position: [cx + shiftX, cy + height * 0.68, cz - (halfW - 0.14)], rotation: [0, 0, 0], mountZone: zone };
      }
      if (zone === "WALL_EXTERIOR") {
        return { position: [cx + shiftX, cy + height * 0.75, cz + halfW + 0.08], rotation: [0, 0, 0], mountZone: zone };
      }
      if (zone === "PERIMETER_EDGE") {
        return { position: [cx + halfL + 0.75, cy, cz + shiftX * 0.5], rotation: [0, 0, 0], mountZone: zone };
      }
      return { position: [cx + shiftX, cy + 0.08, cz], rotation: [0, 0, 0], mountZone: zone };
    }
  }
}

interface StudioState {
  // Dynamic SQLite Catalog (Zero Demo Hardcoding)
  catalogLoaded: boolean;
  catalogLoading: boolean;
  catalogElements: CatalogElementItem[];
  catalogAttributes: CatalogAttributeItem[];
  catalogPresets: CatalogPresetItem[];
  catalogChallenges: CatalogChallengeItem[];
  catalogLogisticsDefaults: LogisticsDefaultsConfig;

  // Scene Data
  environment: EnvironmentType;
  dayNight: "day" | "night";
  cabins: CabinConfig[];
  equipment: EquipmentConfig[];
  targetBudget: number;
  showPurposePicker: boolean;
  logistics: LogisticsConfig;
  customerContact: CustomerContactInfo;

  // Interaction State
  cameraMode: CameraMode;
  selectedEntity: SelectedEntity | null;
  activePlacement: {
    category: "cabin" | "equipment" | "door" | "window" | null;
    itemType: string | null;
  };
  ghostPosition: [number, number, number] | null;
  placementRotation: number;

  // Audio & UI
  isMuted: boolean;
  activeDrawer: "quotes" | "challenges" | "versions" | "bom" | "logistics" | null;

  // Gamification & Replay
  completedChallengeIds: string[];
  activeReplay: boolean;
  replayStep: number;
  versions: Array<{
    id: string;
    versionNumber: number;
    commitNote: string;
    createdAt: string;
    sceneJson: string;
    bomJson: string;
  }>;

  // History
  history: Array<{ cabins: CabinConfig[]; equipment: EquipmentConfig[] }>;
  historyIndex: number;

  // Catalog Loader
  loadCatalog: (force?: boolean) => Promise<void>;

  // Scene Actions
  setEnvironment: (env: EnvironmentType) => void;
  toggleDayNight: () => void;
  setCameraMode: (mode: CameraMode) => void;
  setSelectedEntity: (entity: SelectedEntity | null) => void;
  setTargetBudget: (budget: number) => void;
  updateLogistics: (updates: Partial<LogisticsConfig>) => void;
  updateCustomerContact: (updates: Partial<CustomerContactInfo>) => void;
  setShowPurposePicker: (show: boolean) => void;
  applyPreset: (presetCode: string) => void;
  autoPlaceEquipment: (type: string) => void;
  nudgeSelectedEntity: (dx: number, dz: number) => void;
  rotateSelectedEntity: () => void;
  setActiveDrawer: (drawer: "quotes" | "challenges" | "versions" | "bom" | "logistics" | null) => void;
  toggleMute: () => void;

  // Placement Actions
  startPlacement: (category: "cabin" | "equipment" | "door" | "window", itemType: string) => void;
  cancelPlacement: () => void;
  rotatePlacement: () => void;
  setGhostPosition: (pos: [number, number, number] | null) => void;

  // Scene Manipulations
  addCabin: (type: string, tier?: number, offsetSide?: "left" | "right" | "top") => void;
  removeCabin: (cabinId: string) => void;
  updateCabinFinish: (cabinId: string, finish: WallFinishCode) => void;

  addDoorToCabin: (cabinId: string, doorType: string) => void;
  updateDoor: (cabinId: string, doorId: string, updates: Partial<DoorConfig>) => void;
  removeDoor: (cabinId: string, doorId: string) => void;

  addWindowToCabin: (cabinId: string, windowType: string) => void;
  updateWindow: (cabinId: string, windowId: string, updates: Partial<WindowConfig>) => void;
  removeWindow: (cabinId: string, windowId: string) => void;

  addEquipment: (type: string, position: [number, number, number], rotation: [number, number, number], parentCabinId?: string) => void;
  updateEquipment: (equipmentId: string, updates: Partial<EquipmentConfig>) => void;
  removeEquipment: (equipmentId: string) => void;

  // History & Replay
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  loadScene: (scene: SceneState) => void;
  startBuildReplay: () => void;
  stopBuildReplay: () => void;
  stepReplay: (step: number) => void;

  // Computed Getters
  getBom: () => BomSummary;
  getScores: () => BuildScores;
  completeChallenge: (id: string) => void;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  catalogLoaded: false,
  catalogLoading: false,
  catalogElements: [],
  catalogAttributes: [],
  catalogPresets: [],
  catalogChallenges: [],
  catalogLogisticsDefaults: { ...DEFAULT_LOGISTICS_CONFIG },

  environment: "forest",
  dayNight: "day",
  cabins: [],
  equipment: [],
  targetBudget: 380000,
  showPurposePicker: true,
  logistics: {
    condition: "NEW",
    deliveryMode: "READY_BUILT",
    distanceKm: 40,
    roadWidth: "WIDE",
    placementLevel: "GROUND",
    overheadClearance: "CLEAR",
    insulationTier: "PUF_50MM",
  },
  customerContact: {
    fullName: "",
    phone: "",
    email: "",
    city: "",
    pincode: "",
    addressLine: "",
    landmark: "",
    latitude: undefined,
    longitude: undefined,
    locationAccuracyM: undefined,
  },

  cameraMode: "orbit",
  selectedEntity: null,
  activePlacement: { category: null, itemType: null },
  ghostPosition: null,
  placementRotation: 0,

  isMuted: false,
  activeDrawer: null,

  completedChallengeIds: [],
  activeReplay: false,
  replayStep: 0,
  versions: [],

  history: [],
  historyIndex: -1,

  loadCatalog: async (force = false) => {
    const { catalogLoaded, catalogLoading } = get();
    if ((catalogLoaded && !force) || catalogLoading) return;

    set({ catalogLoading: true });
    try {
      const res = await fetch("/api/catalog", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch catalog");
      const data = await res.json();
      set({
        catalogElements: data.elements || [],
        catalogAttributes: data.attributes || [],
        catalogPresets: data.presets || [],
        catalogChallenges: data.challenges || [],
        catalogLogisticsDefaults: data.logisticsDefaults || { ...DEFAULT_LOGISTICS_CONFIG },
        catalogLoaded: true,
      });
    } catch (err) {
      console.error("loadCatalog error:", err);
    } finally {
      set({ catalogLoading: false });
    }
  },

  setEnvironment: (env) => {
    soundEngine.playChime();
    set({ environment: env });
  },

  toggleDayNight: () => {
    soundEngine.playClick();
    set((state) => ({ dayNight: state.dayNight === "day" ? "night" : "day" }));
  },

  setCameraMode: (mode) => {
    soundEngine.playClick();
    set({ cameraMode: mode });
  },

  setSelectedEntity: (entity) => {
    if (entity) soundEngine.playClick();
    set({ selectedEntity: entity });
  },

  setTargetBudget: (budget) => set({ targetBudget: budget }),

  updateLogistics: (updates) => {
    soundEngine.playClick();
    set((state) => ({
      logistics: { ...state.logistics, ...updates },
    }));
  },

  updateCustomerContact: (updates) => {
    set((state) => ({
      customerContact: { ...state.customerContact, ...updates },
    }));
  },

  setShowPurposePicker: (show) => set({ showPurposePicker: show }),

  applyPreset: (presetCode) => {
    const preset = get().catalogPresets.find((p) => p.code === presetCode || p.id === presetCode);
    if (!preset) return;
    get().pushHistory();
    soundEngine.playSnap();
    const isTerrace = preset.code.includes("terrace");
    set((state) => ({
      environment: (preset.environment as EnvironmentType) || "forest",
      dayNight: "day",
      cabins: JSON.parse(JSON.stringify(preset.scene?.cabins || [])),
      equipment: JSON.parse(JSON.stringify(preset.scene?.equipment || [])),
      targetBudget: preset.targetBudget || 380000,
      logistics: {
        ...state.logistics,
        placementLevel: isTerrace ? "TERRACE" : "GROUND",
        deliveryMode: isTerrace ? "KNOCK_DOWN" : "READY_BUILT",
      },
      showPurposePicker: false,
      selectedEntity: null,
    }));
  },

  autoPlaceEquipment: (type) => {
    get().pushHistory();
    let { cabins, equipment, catalogElements, catalogAttributes } = get();
    const defaultFinish =
      catalogAttributes.find((a) => a.category === "WALL_FINISH")?.code || "FINISH_DESERT_BEIGE";
    const defaultGlass =
      catalogAttributes.find((a) => a.category === "GLASS_TYPE")?.code || "GLASS_CLEAR_SG";
    const defaultFrame =
      catalogAttributes.find((a) => a.category === "FRAME_MATERIAL")?.code || "FRAME_ALUM_CHARCOAL";
    const defaultCabinCode =
      catalogElements.find((e) => e.category === "CABIN")?.code || "CABIN_20FT";
    const defaultDoorCode =
      catalogElements.find((e) => e.category === "DOOR")?.code || "DOOR_SLIDING_GLASS";

    if (cabins.length === 0) {
      const starterCabin: CabinConfig = {
        id: `cabin-${Date.now()}`,
        type: defaultCabinCode,
        tier: 0,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        wallFinish: defaultFinish,
        doors: [
          {
            id: `door-${Date.now()}`,
            type: defaultDoorCode,
            glassType: defaultGlass,
            frameMaterial: defaultFrame,
            brand: "Standard",
            position: [0, 1.05, 1.23],
            rotation: [0, 0, 0],
          },
        ],
        windows: [],
      };
      cabins = [starterCabin];
      set({ cabins, showPurposePicker: false });
    }

    const targetCabin = cabins[cabins.length - 1];
    const el = catalogElements.find((e) => e.code === type);
    const snap = computeAutoSnap(el, type, targetCabin, equipment, catalogElements);
    const newId = `eq-${Date.now()}`;

    const newEq: EquipmentConfig = {
      id: newId,
      type,
      brand: el?.options?.brands?.[0]?.name || "Standard",
      capacity: el?.options?.capacities?.[0]?.label,
      finish: el?.options?.finishes?.[0]?.label,
      mountZone: snap.mountZone,
      position: snap.position,
      rotation: snap.rotation,
      parentCabinId: targetCabin.id,
    };

    soundEngine.playSnap();
    set({
      equipment: [...equipment, newEq],
      selectedEntity: { type: "equipment", id: newId },
      activePlacement: { category: null, itemType: null },
      ghostPosition: null,
      showPurposePicker: false,
    });
  },

  nudgeSelectedEntity: (dx, dz) => {
    const { selectedEntity, cabins, equipment } = get();
    if (!selectedEntity) return;
    soundEngine.playClick();

    if (selectedEntity.type === "equipment") {
      set({
        equipment: equipment.map((eq) =>
          eq.id === selectedEntity.id
            ? { ...eq, position: [Number((eq.position[0] + dx).toFixed(2)), eq.position[1], Number((eq.position[2] + dz).toFixed(2))] }
            : eq
        ),
      });
    } else if (selectedEntity.type === "door" && selectedEntity.parentCabinId) {
      set({
        cabins: cabins.map((c) =>
          c.id === selectedEntity.parentCabinId
            ? {
                ...c,
                doors: c.doors.map((d) =>
                  d.id === selectedEntity.id
                    ? { ...d, position: [Math.max(-2.2, Math.min(2.2, Number((d.position[0] + dx).toFixed(2)))), d.position[1], d.position[2]] }
                    : d
                ),
              }
            : c
        ),
      });
    } else if (selectedEntity.type === "window" && selectedEntity.parentCabinId) {
      set({
        cabins: cabins.map((c) =>
          c.id === selectedEntity.parentCabinId
            ? {
                ...c,
                windows: c.windows.map((w) =>
                  w.id === selectedEntity.id
                    ? { ...w, position: [Math.max(-2.2, Math.min(2.2, Number((w.position[0] + dx).toFixed(2)))), w.position[1], w.position[2]] }
                    : w
                ),
              }
            : c
        ),
      });
    }
  },

  rotateSelectedEntity: () => {
    const { selectedEntity, equipment } = get();
    if (!selectedEntity) return;
    soundEngine.playRotate();

    if (selectedEntity.type === "equipment") {
      set({
        equipment: equipment.map((eq) =>
          eq.id === selectedEntity.id
            ? { ...eq, rotation: [eq.rotation[0], eq.rotation[1] + Math.PI / 2, eq.rotation[2]] }
            : eq
        ),
      });
    }
  },

  setActiveDrawer: (drawer) => {
    soundEngine.playClick();
    set({ activeDrawer: drawer });
  },

  toggleMute: () => {
    const isMuted = soundEngine.toggleMute();
    set({ isMuted });
  },

  startPlacement: (category, itemType) => {
    soundEngine.playClick();
    set({
      activePlacement: { category, itemType },
      selectedEntity: null,
      placementRotation: 0,
    });
  },

  cancelPlacement: () => {
    soundEngine.playClick();
    set({
      activePlacement: { category: null, itemType: null },
      ghostPosition: null,
    });
  },

  rotatePlacement: () => {
    soundEngine.playRotate();
    set((state) => ({
      placementRotation: (state.placementRotation + Math.PI / 2) % (Math.PI * 2),
    }));
  },

  setGhostPosition: (pos) => set({ ghostPosition: pos }),

  addCabin: (type, tier = 0, offsetSide) => {
    get().pushHistory();
    soundEngine.playSnap();

    set((state) => {
      const cabins = [...state.cabins];
      const newId = `cabin-${Date.now()}`;
      let position: [number, number, number] = [0, 0, 0];

      const lastCabin = cabins[cabins.length - 1];
      const lastCabinEl = state.catalogElements.find((e) => e.code === lastCabin?.type);
      const lastHeight =
        Number(lastCabinEl?.dimensions?.height) || (lastCabin?.type === "CABIN_40FT" ? 2.9 : 2.59);
      const lastWidth = Number(lastCabinEl?.dimensions?.width) || 2.44;

      if (cabins.length > 0 && lastCabin) {
        if (offsetSide === "top" || tier > 0) {
          position = [lastCabin.position[0], lastCabin.position[1] + lastHeight, lastCabin.position[2]];
        } else if (offsetSide === "left") {
          position = [lastCabin.position[0], lastCabin.position[1], lastCabin.position[2] - lastWidth];
        } else {
          position = [lastCabin.position[0], lastCabin.position[1], lastCabin.position[2] + lastWidth];
        }
      }

      const defaultFinish =
        state.catalogAttributes.find((a) => a.category === "WALL_FINISH")?.code || "FINISH_DESERT_BEIGE";
      const defaultGlass =
        state.catalogAttributes.find((a) => a.category === "GLASS_TYPE")?.code || "GLASS_CLEAR_SG";
      const defaultFrame =
        state.catalogAttributes.find((a) => a.category === "FRAME_MATERIAL")?.code || "FRAME_ALUM_CHARCOAL";
      const defaultDoor =
        state.catalogElements.find((e) => e.category === "DOOR")?.code || "DOOR_SLIDING_GLASS";

      const newCabin: CabinConfig = {
        id: newId,
        type,
        tier: tier > 0 ? tier : position[1] > 2.0 ? 1 : 0,
        position,
        rotation: [0, 0, 0],
        wallFinish: cabins.length === 0 ? defaultFinish : lastCabin.wallFinish,
        doors:
          cabins.length === 0
            ? [
                {
                  id: `door-${Date.now()}`,
                  type: defaultDoor,
                  glassType: defaultGlass,
                  frameMaterial: defaultFrame,
                  brand: "Standard",
                  position: [0, 1.05, 1.23],
                  rotation: [0, 0, 0],
                },
              ]
            : [],
        windows: [],
      };

      return {
        cabins: [...cabins, newCabin],
        selectedEntity: { type: "cabin", id: newId },
        showPurposePicker: false,
      };
    });
  },

  removeCabin: (cabinId) => {
    get().pushHistory();
    soundEngine.playSnap();
    set((state) => ({
      cabins: state.cabins.filter((c) => c.id !== cabinId),
      equipment: state.equipment.filter((e) => e.parentCabinId !== cabinId),
      selectedEntity: state.selectedEntity?.id === cabinId ? null : state.selectedEntity,
    }));
  },

  updateCabinFinish: (cabinId, finish) => {
    get().pushHistory();
    soundEngine.playChime();
    set((state) => ({
      cabins: state.cabins.map((c) => (c.id === cabinId ? { ...c, wallFinish: finish } : c)),
    }));
  },

  addDoorToCabin: (cabinId, doorType) => {
    get().pushHistory();
    soundEngine.playSnap();
    const { catalogAttributes } = get();
    const defaultGlass =
      catalogAttributes.find((a) => a.category === "GLASS_TYPE")?.code || "GLASS_CLEAR_SG";
    const defaultFrame =
      catalogAttributes.find((a) => a.category === "FRAME_MATERIAL")?.code || "FRAME_ALUM_CHARCOAL";

    const newDoor: DoorConfig = {
      id: `door-${Date.now()}`,
      type: doorType,
      glassType: doorType.includes("GLASS") ? defaultGlass : undefined,
      frameMaterial: defaultFrame,
      brand: "Standard",
      position: [0, 1.05, 1.23],
      rotation: [0, 0, 0],
    };

    set((state) => ({
      cabins: state.cabins.map((c) =>
        c.id === cabinId ? { ...c, doors: [...c.doors, newDoor] } : c
      ),
      selectedEntity: { type: "door", id: newDoor.id, parentCabinId: cabinId },
    }));
  },

  updateDoor: (cabinId, doorId, updates) => {
    get().pushHistory();
    soundEngine.playChime();
    set((state) => ({
      cabins: state.cabins.map((c) =>
        c.id === cabinId
          ? {
              ...c,
              doors: c.doors.map((d) => (d.id === doorId ? { ...d, ...updates } : d)),
            }
          : c
      ),
    }));
  },

  removeDoor: (cabinId, doorId) => {
    get().pushHistory();
    soundEngine.playClick();
    set((state) => ({
      cabins: state.cabins.map((c) =>
        c.id === cabinId ? { ...c, doors: c.doors.filter((d) => d.id !== doorId) } : c
      ),
      selectedEntity: null,
    }));
  },

  addWindowToCabin: (cabinId, windowType) => {
    get().pushHistory();
    soundEngine.playSnap();
    const { catalogAttributes } = get();
    const defaultGlass =
      catalogAttributes.find((a) => a.category === "GLASS_TYPE")?.code || "GLASS_CLEAR_SG";
    const defaultFrame =
      catalogAttributes.find((a) => a.category === "FRAME_MATERIAL")?.code || "FRAME_UPVC_WHITE";

    const newWin: WindowConfig = {
      id: `win-${Date.now()}`,
      type: windowType,
      glassType: defaultGlass,
      frameMaterial: defaultFrame,
      brand: "Standard",
      position: [1.2, 1.3, -1.23],
      rotation: [0, Math.PI, 0],
    };

    set((state) => ({
      cabins: state.cabins.map((c) =>
        c.id === cabinId ? { ...c, windows: [...c.windows, newWin] } : c
      ),
      selectedEntity: { type: "window", id: newWin.id, parentCabinId: cabinId },
    }));
  },

  updateWindow: (cabinId, windowId, updates) => {
    get().pushHistory();
    soundEngine.playChime();
    set((state) => ({
      cabins: state.cabins.map((c) =>
        c.id === cabinId
          ? {
              ...c,
              windows: c.windows.map((w) => (w.id === windowId ? { ...w, ...updates } : w)),
            }
          : c
      ),
    }));
  },

  removeWindow: (cabinId, windowId) => {
    get().pushHistory();
    soundEngine.playClick();
    set((state) => ({
      cabins: state.cabins.map((c) =>
        c.id === cabinId ? { ...c, windows: c.windows.filter((w) => w.id !== windowId) } : c
      ),
      selectedEntity: null,
    }));
  },

  addEquipment: (type, position, rotation, parentCabinId) => {
    get().pushHistory();
    soundEngine.playSnap();
    const el = get().catalogElements.find((e) => e.code === type);
    const newId = `eq-${Date.now()}`;

    const newEq: EquipmentConfig = {
      id: newId,
      type,
      brand: el?.options?.brands?.[0]?.name || "Standard",
      capacity: el?.options?.capacities?.[0]?.label,
      finish: el?.options?.finishes?.[0]?.label,
      mountZone: el?.mountZone || "FLOOR_INTERIOR",
      position,
      rotation,
      parentCabinId,
    };

    set((state) => ({
      equipment: [...state.equipment, newEq],
      selectedEntity: { type: "equipment", id: newId },
      activePlacement: { category: null, itemType: null },
      ghostPosition: null,
    }));
  },

  updateEquipment: (equipmentId, updates) => {
    get().pushHistory();
    soundEngine.playChime();
    set((state) => ({
      equipment: state.equipment.map((eq) =>
        eq.id === equipmentId ? { ...eq, ...updates } : eq
      ),
    }));
  },

  removeEquipment: (equipmentId) => {
    get().pushHistory();
    soundEngine.playClick();
    set((state) => ({
      equipment: state.equipment.filter((eq) => eq.id !== equipmentId),
      selectedEntity: null,
    }));
  },

  pushHistory: () => {
    const { cabins, equipment, history, historyIndex } = get();
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push({
      cabins: JSON.parse(JSON.stringify(cabins)),
      equipment: JSON.parse(JSON.stringify(equipment)),
    });
    if (newHist.length > 25) newHist.shift();
    set({ history: newHist, historyIndex: newHist.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      soundEngine.playUndo();
      const prev = history[historyIndex - 1];
      set({
        cabins: JSON.parse(JSON.stringify(prev.cabins)),
        equipment: JSON.parse(JSON.stringify(prev.equipment)),
        historyIndex: historyIndex - 1,
        selectedEntity: null,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      soundEngine.playUndo();
      const next = history[historyIndex + 1];
      set({
        cabins: JSON.parse(JSON.stringify(next.cabins)),
        equipment: JSON.parse(JSON.stringify(next.equipment)),
        historyIndex: historyIndex + 1,
        selectedEntity: null,
      });
    }
  },

  loadScene: (scene) => {
    set({
      environment: scene.environment || "forest",
      dayNight: scene.dayNight || "day",
      cabins: scene.cabins || [],
      equipment: scene.equipment || [],
      targetBudget: scene.targetBudget || 400000,
      selectedEntity: null,
      showPurposePicker: false,
    });
  },

  startBuildReplay: () => {
    soundEngine.playSuccess();
    set({ activeReplay: true, replayStep: 0 });
  },

  stopBuildReplay: () => {
    set({ activeReplay: false });
  },

  stepReplay: (step) => {
    soundEngine.playClick();
    set({ replayStep: step });
  },

  completeChallenge: (id) => {
    const { completedChallengeIds } = get();
    if (!completedChallengeIds.includes(id)) {
      soundEngine.playSuccess();
      set({ completedChallengeIds: [...completedChallengeIds, id] });
    }
  },

  getBom: () => {
    const { cabins, equipment, logistics, catalogElements, catalogAttributes, catalogLogisticsDefaults } =
      get();
    const items: BomSummary["items"] = [];

    const elMap = new Map(catalogElements.map((e) => [e.code, e]));
    const attrMap = new Map(catalogAttributes.map((a) => [a.code, a]));

    const vendorDefaults = defaultsToVendorLogistics(catalogLogisticsDefaults);
    const siteLogistics = calculateSiteLogistics(
      cabins,
      logistics,
      vendorDefaults,
      catalogLogisticsDefaults
    );
    const cabinMultiplier = 1 - siteLogistics.conditionDiscountPct / 100;

    cabins.forEach((c) => {
      const cabinEl = elMap.get(c.type);
      const rawCost = cabinEl?.baseCost ?? 0;
      const baseCost = Math.round(rawCost * cabinMultiplier);
      const condTag =
        logistics.condition === "REFURB_READY"
          ? " (2nd Hand Refurbished)"
          : logistics.condition === "USED_WWT"
          ? " (Used WWT Shell)"
          : "";

      items.push({
        code: c.type,
        name: (cabinEl?.friendlyName || cabinEl?.name || c.type) + condTag,
        category: "Structure",
        count: 1,
        unitPrice: baseCost,
        total: baseCost,
      });

      const finishAttr = attrMap.get(c.wallFinish);
      if (finishAttr && finishAttr.costModifier > 0) {
        items.push({
          code: finishAttr.code,
          name: `Finish: ${finishAttr.friendlyName || finishAttr.name}`,
          category: "Finish",
          brand: finishAttr.brand || undefined,
          count: 1,
          unitPrice: finishAttr.costModifier,
          total: finishAttr.costModifier,
        });
      }

      c.doors.forEach((d) => {
        const doorEl = elMap.get(d.type);
        const glassAttr = d.glassType ? attrMap.get(d.glassType) : undefined;
        const frameAttr = d.frameMaterial ? attrMap.get(d.frameMaterial) : undefined;
        const unitPrice =
          (doorEl?.baseCost ?? 0) +
          (glassAttr?.costModifier ?? 0) +
          (frameAttr?.costModifier ?? 0);

        items.push({
          code: d.type,
          name: `${doorEl?.friendlyName || doorEl?.name || d.type}${glassAttr ? ` (${glassAttr.friendlyName || glassAttr.name})` : ""}`,
          category: "Doors",
          brand: d.brand || glassAttr?.brand || frameAttr?.brand || undefined,
          count: 1,
          unitPrice,
          total: unitPrice,
        });
      });

      c.windows.forEach((w) => {
        const winEl = elMap.get(w.type);
        const glassAttr = attrMap.get(w.glassType);
        const frameAttr = attrMap.get(w.frameMaterial);
        const unitPrice =
          (winEl?.baseCost ?? 0) +
          (glassAttr?.costModifier ?? 0) +
          (frameAttr?.costModifier ?? 0);

        items.push({
          code: w.type,
          name: `${winEl?.friendlyName || winEl?.name || w.type}${glassAttr ? ` (${glassAttr.friendlyName || glassAttr.name})` : ""}`,
          category: "Glazing",
          brand: w.brand || glassAttr?.brand || undefined,
          count: 1,
          unitPrice,
          total: unitPrice,
        });
      });
    });

    equipment.forEach((eq) => {
      const def = elMap.get(eq.type);
      let price = def ? def.baseCost : 0;

      const brandMatch = def?.options?.brands?.find((b) => b.name === eq.brand);
      if (brandMatch) price += brandMatch.modifier || 0;

      const capMatch = def?.options?.capacities?.find((c) => c.label === eq.capacity);
      if (capMatch) price += capMatch.modifier || 0;

      const finMatch = def?.options?.finishes?.find((f) => f.label === eq.finish);
      if (finMatch) price += finMatch.modifier || 0;

      items.push({
        code: eq.type,
        name: `${def?.friendlyName || def?.name || eq.type} [${eq.brand}]`,
        category: def?.subCategory || def?.category || "Equipment",
        brand: eq.brand,
        count: 1,
        unitPrice: price,
        total: price,
      });
    });

    const productSubtotal = items.reduce((sum, item) => sum + item.total, 0);
    const subtotal = productSubtotal + siteLogistics.foundationOrCanopyCost;
    const gstRate = (catalogLogisticsDefaults?.gstRatePct ?? 18) / 100;
    const tax = Math.round(subtotal * gstRate);
    const totalCost =
      subtotal + tax + siteLogistics.transportCost + siteLogistics.craneOrAssemblyCost;

    return {
      items,
      subtotal,
      tax,
      transportCost: siteLogistics.transportCost,
      craneOrAssemblyCost: siteLogistics.craneOrAssemblyCost,
      foundationOrCanopyCost: siteLogistics.foundationOrCanopyCost,
      totalCost,
    };
  },

  getScores: () => {
    const { cabins, equipment, environment, dayNight, logistics, catalogElements, catalogAttributes } =
      get();

    if (cabins.length === 0) {
      return {
        naturalDaylight: 0,
        thermalComfort: 0,
        ecoSolar: 0,
        overallScore: 0,
      };
    }

    const attrMap = new Map(catalogAttributes.map((a) => [a.code, a]));
    const elMap = new Map(catalogElements.map((e) => [e.code, e]));

    // 1. Natural Daylight Score
    let daylight = 20;
    cabins.forEach((c) => {
      c.windows.forEach((w) => {
        daylight += w.type === "WINDOW_PANORAMIC" ? 25 : 14;
        const g = attrMap.get(w.glassType);
        const trans = g?.shader?.transmission ?? 0.5;
        if (trans >= 0.8) daylight += 8;
        else if (trans < 0.5) daylight -= 4;
      });
      c.doors.forEach((d) => {
        if (d.type.includes("GLASS")) daylight += 18;
      });
    });
    daylight = Math.min(100, Math.max(10, daylight));

    // 2. Thermal Comfort Score
    let thermal = 55;
    if (logistics.insulationTier === "PUF_50MM") thermal += 8;
    if (logistics.insulationTier === "PUF_75MM_CANOPY") thermal += 18;

    const hasCooling = equipment.some(
      (e) => e.type === "AC_SPLIT_INVERTER" || elMap.get(e.type)?.subCategory === "HVAC"
    );
    if (hasCooling) thermal += 28;

    let solarShieldCount = 0;
    cabins.forEach((c) => {
      [...c.windows, ...c.doors].forEach((item) => {
        const g = item.glassType ? attrMap.get(item.glassType) : undefined;
        const shgc = Number(g?.specs?.shgc ?? 1);
        if (shgc <= 0.45 || item.glassType === "GLASS_TINTED_BLACK" || item.glassType === "GLASS_BRONZE_AIS") {
          solarShieldCount++;
        }
      });
    });

    if (environment === "desert") {
      if (dayNight === "day") {
        thermal -= 18;
        if (solarShieldCount > 0) thermal += 15;
      } else {
        thermal += 10;
      }
    } else if (environment === "beach") {
      thermal += 5;
      if (solarShieldCount > 0) thermal += 8;
    }
    thermal = Math.min(100, Math.max(15, thermal));

    // 3. Eco / Solar Score
    let eco = 15;
    const solarCount = equipment.filter(
      (e) => e.type === "SOLAR_ARRAY_ROOF" || elMap.get(e.type)?.subCategory === "SOLAR"
    ).length;
    eco += solarCount * 45;

    const ledCount = equipment.filter(
      (e) => e.type === "LED_CEILING_PANEL" || elMap.get(e.type)?.subCategory === "LIGHTING"
    ).length;
    eco += ledCount * 10;

    if (hasCooling) eco += 10;
    eco = Math.min(100, Math.max(10, eco));

    const overallScore = Math.round((daylight + thermal + eco) / 3);

    return {
      naturalDaylight: daylight,
      thermalComfort: thermal,
      ecoSolar: eco,
      overallScore,
    };
  },
}));
