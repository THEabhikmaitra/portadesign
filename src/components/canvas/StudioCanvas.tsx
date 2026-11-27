"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { useStudioStore } from "@/store/useStudioStore";
import { EnvironmentBackdrop } from "./EnvironmentBackdrop";
import { ModularCabin } from "./ModularCabin";
import { EquipmentAssembly } from "./EquipmentAssembly";
import { CameraController } from "./CameraController";
import { GhostPreview } from "./GhostPreview";

export const StudioCanvas: React.FC = () => {
  const cabins = useStudioStore((state) => state.cabins);
  const equipment = useStudioStore((state) => state.equipment);
  const environment = useStudioStore((state) => state.environment);
  const dayNight = useStudioStore((state) => state.dayNight);
  const cameraMode = useStudioStore((state) => state.cameraMode);
  const setSelectedEntity = useStudioStore((state) => state.setSelectedEntity);

  return (
    <div className="relative w-full h-full select-none touch-none bg-slate-950 overflow-hidden">
      <Canvas
        shadows
        camera={{ position: [10, 8, 12], fov: 45 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        onPointerMissed={() => setSelectedEntity(null)}
      >
        <Suspense fallback={null}>
          {/* 1. Procedural 100% Offline Environment & Skies */}
          <EnvironmentBackdrop environment={environment} dayNight={dayNight} />

          {/* 2. Soft Contact Shadows beneath modules */}
          <ContactShadows
            position={[0, 0.01, 0]}
            opacity={dayNight === "night" ? 0.35 : 0.75}
            scale={40}
            blur={1.8}
            far={10}
            resolution={1024}
            color="#090d16"
          />

          {/* 3. High-Detail Procedural Cabins */}
          {cabins.map((cabin) => (
            <ModularCabin
              key={cabin.id}
              cabin={cabin}
              cameraMode={cameraMode}
              dayNight={dayNight}
            />
          ))}

          {/* 4. Smart Equipment Assemblies */}
          {equipment.map((eq) => (
            <EquipmentAssembly
              key={eq.id}
              equipment={eq}
              cameraMode={cameraMode}
              dayNight={dayNight}
            />
          ))}

          {/* 5. Live Ghost Preview & Magnetic Alignment Guides */}
          <GhostPreview />

          {/* 6. Multi-Mode Camera Controller (Orbit / Cutaway / X-Ray / First-Person) */}
          <CameraController mode={cameraMode} />
        </Suspense>
      </Canvas>
    </div>
  );
};
