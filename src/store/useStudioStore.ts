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
} from "@/types";
import { soundEngine } from "@/lib/soundEngine";
import { EQUIPMENT_CATALOG } from "@/lib/equipmentCatalog";

export interface SelectedEntity {
  type: "cabin" | "door" | "window" | "equipment";
  id: string;
  parentCabinId?: string;
}

interface StudioState {
  // Scene Data
  environment: EnvironmentType;
  dayNight: "day" | "night";
  cabins: CabinConfig[];
  equipment: EquipmentConfig[];
  targetBudget: number;

  // Interaction State
  cameraMode: CameraMode;
  selectedEntity: SelectedEntity | null;
  activePlacement: {
    category: "cabin" | "equipment" | "door" | "window" | null;
    itemType: string | null;
  };
  ghostPosition: [number, number, number] | null;
  placementRotation: number; // in increments of 90 degrees (Math.PI / 2)

  // Audio & UI
  isMuted: boolean;
  activeDrawer: "quotes" | "challenges" | "versions" | "bom" | null;

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

  // History (Undo/Redo)
  history: Array<{ cabins: CabinConfig[]; equipment: EquipmentConfig[] }>;
  historyIndex: number;

  // Actions
  setEnvironment: (env: EnvironmentType) => void;
  toggleDayNight: () => void;
  setCameraMode: (mode: CameraMode) => void;
  setSelectedEntity: (entity: SelectedEntity | null) => void;
  setTargetBudget: (budget: number) => void;
  setActiveDrawer: (drawer: "quotes" | "challenges" | "versions" | "bom" | null) => void;
  toggleMute: () => void;

  // Placement Actions
  startPlacement: (category: "cabin" | "equipment" | "door" | "window", itemType: string) => void;
  cancelPlacement: () => void;
  rotatePlacement: () => void;
  setGhostPosition: (pos: [number, number, number] | null) => void;

  // Scene Manipulations
  addCabin: (type: "CABIN_20FT" | "CABIN_40FT", tier?: number, offsetSide?: "left" | "right" | "top") => void;
  removeCabin: (cabinId: string) => void;
  updateCabinFinish: (cabinId: string, finish: WallFinishCode) => void;

  addDoorToCabin: (cabinId: string, doorType: "DOOR_SLIDING_GLASS" | "DOOR_STEEL_PANEL") => void;
  updateDoor: (cabinId: string, doorId: string, updates: Partial<DoorConfig>) => void;
  removeDoor: (cabinId: string, doorId: string) => void;

  addWindowToCabin: (cabinId: string, windowType: "WINDOW_PANORAMIC" | "WINDOW_STANDARD") => void;
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
  environment: "desert",
  dayNight: "day",
  cabins: [
    {
      id: "cabin-base-1",
      type: "CABIN_20FT",
      tier: 0,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      wallFinish: "FINISH_DESERT_BEIGE",
      hasPassThroughLeft: false,
      hasPassThroughRight: false,
      doors: [
        {
          id: "door-1",
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
          id: "win-1",
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
      id: "eq-ac-1",
      type: "AC_SPLIT_INVERTER",
      brand: "Daikin Inverter",
      capacity: "1.5 Ton (180 sq.ft)",
      finish: "Arctic Gloss White",
      mountZone: "WALL_INTERIOR",
      position: [0, 2.1, -1.18],
      rotation: [0, 0, 0],
      parentCabinId: "cabin-base-1",
    },
    {
      id: "eq-solar-1",
      type: "SOLAR_ARRAY_ROOF",
      brand: "Tata Power Solar",
      capacity: "3.2 kW (6 Panels)",
      mountZone: "ROOF_TOP",
      position: [0, 2.65, 0],
      rotation: [0, 0, 0],
      parentCabinId: "cabin-base-1",
    },
    {
      id: "eq-desk-1",
      type: "DESK_SET_OFFICE",
      brand: "Godrej Interio",
      capacity: "Executive Dual Pod (2-Person)",
      finish: "Natural Warm Oak",
      mountZone: "FLOOR_INTERIOR",
      position: [-1.2, 0.05, 0],
      rotation: [0, Math.PI / 2, 0],
      parentCabinId: "cabin-base-1",
    },
  ],
  targetBudget: 450000,

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

      if (cabins.length > 0) {
        const last = cabins[cabins.length - 1];
        if (offsetSide === "top" || tier > 0) {
          // Vertical stacking on 2nd / 3rd story!
          const heightOffset = last.type === "CABIN_40FT" ? 2.9 : 2.59;
          position = [last.position[0], last.position[1] + heightOffset, last.position[2]];
        } else if (offsetSide === "left") {
          // Horizontal side-by-side snap
          position = [last.position[0], last.position[1], last.position[2] - 2.44];
        } else {
          // Horizontal side-by-side snap right
          position = [last.position[0], last.position[1], last.position[2] + 2.44];
        }
      }

      const newCabin: CabinConfig = {
        id: newId,
        type,
        tier: tier > 0 ? tier : position[1] > 2.0 ? 1 : 0,
        position,
        rotation: [0, 0, 0],
        wallFinish: "FINISH_BATTLESHIP_GREY",
        doors: [],
        windows: [],
      };

      return {
        cabins: [...cabins, newCabin],
        selectedEntity: { type: "cabin", id: newId },
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
    const newDoor: DoorConfig = {
      id: `door-${Date.now()}`,
      type: doorType,
      glassType: doorType === "DOOR_SLIDING_GLASS" ? "GLASS_CLEAR_SG" : undefined,
      frameMaterial: "FRAME_ALUM_CHARCOAL",
      brand: "Saint-Gobain",
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
        c.id === cabinId
          ? { ...c, doors: c.doors.filter((d) => d.id !== doorId) }
          : c
      ),
      selectedEntity: null,
    }));
  },

  addWindowToCabin: (cabinId, windowType) => {
    get().pushHistory();
    soundEngine.playSnap();
    const newWin: WindowConfig = {
      id: `win-${Date.now()}`,
      type: windowType,
      glassType: "GLASS_CLEAR_SG",
      frameMaterial: "FRAME_UPVC_WHITE",
      brand: "AIS Glass",
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
        c.id === cabinId
          ? { ...c, windows: c.windows.filter((w) => w.id !== windowId) }
          : c
      ),
      selectedEntity: null,
    }));
  },

  addEquipment: (type, position, rotation, parentCabinId) => {
    get().pushHistory();
    soundEngine.playSnap();
    const def = EQUIPMENT_CATALOG[type];
    const newId = `eq-${Date.now()}`;

    const newEq: EquipmentConfig = {
      id: newId,
      type,
      brand: def?.brands[0]?.name || "Default Brand",
      capacity: def?.capacities[0]?.label,
      finish: def?.finishes ? def.finishes[0]?.label : undefined,
      mountZone: def?.allowedZones[0] || "FLOOR_INTERIOR",
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
    // Keep max 25 history steps
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
      environment: scene.environment || "desert",
      dayNight: scene.dayNight || "day",
      cabins: scene.cabins || [],
      equipment: scene.equipment || [],
      targetBudget: scene.targetBudget || 450000,
      selectedEntity: null,
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
    const { cabins, equipment } = get();
    const items: BomSummary["items"] = [];

    // Cabins
    cabins.forEach((c) => {
      const baseCost = c.type === "CABIN_40FT" ? 325000 : 185000;
      items.push({
        code: c.type,
        name: c.type === "CABIN_40FT" ? "40ft High Cube Container" : "20ft Insulated Container",
        category: "Structure",
        count: 1,
        unitPrice: baseCost,
        total: baseCost,
      });

      // Finish
      if (c.wallFinish !== "FINISH_BATTLESHIP_GREY") {
        const finishCost = c.wallFinish === "FINISH_OCEAN_CYBER" ? 4200 : 2800;
        items.push({
          code: c.wallFinish,
          name: `Exterior Finish (${c.wallFinish.replace("FINISH_", "")})`,
          category: "Finish",
          count: 1,
          unitPrice: finishCost,
          total: finishCost,
        });
      }

      // Doors
      c.doors.forEach((d) => {
        const doorBase = d.type === "DOOR_SLIDING_GLASS" ? 28000 : 16500;
        let glassMod = 0;
        if (d.glassType === "GLASS_TINTED_BLACK") glassMod = 3800;
        if (d.glassType === "GLASS_BRONZE_AIS") glassMod = 4500;
        if (d.glassType === "GLASS_FROSTED_AIS") glassMod = 2400;

        items.push({
          code: d.type,
          name: `${d.type === "DOOR_SLIDING_GLASS" ? "Sliding Glass Door" : "Steel Access Door"} (${d.glassType || "Steel"})`,
          category: "Doors",
          brand: d.brand,
          count: 1,
          unitPrice: doorBase + glassMod,
          total: doorBase + glassMod,
        });
      });

      // Windows
      c.windows.forEach((w) => {
        const winBase = w.type === "WINDOW_PANORAMIC" ? 21000 : 11500;
        let glassMod = 0;
        if (w.glassType === "GLASS_TINTED_BLACK") glassMod = 3800;
        if (w.glassType === "GLASS_BRONZE_AIS") glassMod = 4500;
        if (w.glassType === "GLASS_FROSTED_AIS") glassMod = 2400;

        items.push({
          code: w.type,
          name: `${w.type === "WINDOW_PANORAMIC" ? "Panoramic Viewport" : "Awning Window"} (${w.glassType})`,
          category: "Glazing",
          brand: w.brand,
          count: 1,
          unitPrice: winBase + glassMod,
          total: winBase + glassMod,
        });
      });
    });

    // Equipment
    equipment.forEach((eq) => {
      const def = EQUIPMENT_CATALOG[eq.type];
      let price = def ? def.basePrice : 10000;

      // Brand modifier
      const brandMatch = def?.brands.find((b) => b.name === eq.brand);
      if (brandMatch) price += brandMatch.modifier;

      // Capacity modifier
      const capMatch = def?.capacities.find((c) => c.label === eq.capacity);
      if (capMatch) price += capMatch.modifier;

      // Finish modifier
      const finMatch = def?.finishes?.find((f) => f.label === eq.finish);
      if (finMatch) price += finMatch.modifier;

      items.push({
        code: eq.type,
        name: `${def?.name || eq.type} [${eq.brand}]`,
        category: def?.category || "Equipment",
        brand: eq.brand,
        count: 1,
        unitPrice: price,
        total: price,
      });
    });

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = Math.round(subtotal * 0.18); // 18% GST standard prefab
    return {
      items,
      subtotal,
      tax,
      totalCost: subtotal + tax,
    };
  },

  getScores: () => {
    const { cabins, equipment, environment, dayNight } = get();

    // 1. Natural Daylight Score
    let daylight = 20;
    cabins.forEach((c) => {
      c.windows.forEach((w) => {
        if (w.type === "WINDOW_PANORAMIC") daylight += 25;
        else daylight += 14;

        if (w.glassType === "GLASS_CLEAR_SG") daylight += 8;
        if (w.glassType === "GLASS_TINTED_BLACK") daylight -= 4;
      });
      c.doors.forEach((d) => {
        if (d.type === "DOOR_SLIDING_GLASS") daylight += 18;
      });
    });
    daylight = Math.min(100, Math.max(10, daylight));

    // 2. Thermal Comfort Score
    let thermal = 55;
    const hasAC = equipment.some((e) => e.type === "AC_SPLIT_INVERTER");
    if (hasAC) thermal += 28;

    // Glazing tint protection in harsh climates
    let solarShieldCount = 0;
    cabins.forEach((c) => {
      c.windows.forEach((w) => {
        if (w.glassType === "GLASS_TINTED_BLACK" || w.glassType === "GLASS_BRONZE_AIS") {
          solarShieldCount++;
        }
      });
      c.doors.forEach((d) => {
        if (d.glassType === "GLASS_TINTED_BLACK" || d.glassType === "GLASS_BRONZE_AIS") {
          solarShieldCount++;
        }
      });
    });

    if (environment === "desert") {
      if (dayNight === "day") {
        thermal -= 18; // Harsh desert sun penalty
        if (solarShieldCount > 0) thermal += 15; // Tinted shield bonus
      } else {
        thermal += 10; // Desert night cooling
      }
    } else if (environment === "beach") {
      thermal += 5;
      if (solarShieldCount > 0) thermal += 8;
    }

    thermal = Math.min(100, Math.max(15, thermal));

    // 3. Eco / Solar Score
    let eco = 15;
    const solarCount = equipment.filter((e) => e.type === "SOLAR_ARRAY_ROOF").length;
    eco += solarCount * 45;

    const ledCount = equipment.filter((e) => e.type === "LED_CEILING_PANEL").length;
    eco += ledCount * 10;

    if (hasAC) eco += 10; // Inverter energy rating
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
