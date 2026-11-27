"use client";

import React, { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { ModularCabin } from "@/components/canvas/ModularCabin";
import { EquipmentAssembly } from "@/components/canvas/EquipmentAssembly";
import { EnvironmentBackdrop } from "@/components/canvas/EnvironmentBackdrop";
import { useStudioStore } from "@/store/useStudioStore";

interface DesignViewer3DProps {
  scene: {
    environment?: string;
    dayNight?: string;
    cabins?: any[];
    equipment?: any[];
  };
}

export const DesignViewer3D: React.FC<DesignViewer3DProps> = ({ scene }) => {
  const loadCatalog = useStudioStore((state) => state.loadCatalog);
  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const cabins = scene?.cabins || [];
  const equipment = scene?.equipment || [];
  const environment = (scene?.environment as any) || "desert";
  const dayNight = (scene?.dayNight as any) || "day";

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [10, 8, 12], fov: 45 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <EnvironmentBackdrop environment={environment} dayNight={dayNight} />

          <ContactShadows
            position={[0, 0.01, 0]}
            opacity={0.65}
            scale={35}
            blur={1.8}
            far={10}
            color="#090d16"
          />

          {cabins.map((cabin: any) => (
            <ModularCabin
              key={cabin.id}
              cabin={cabin}
              cameraMode="orbit"
              dayNight={dayNight}
            />
          ))}

          {equipment.map((eq: any) => (
            <EquipmentAssembly
              key={eq.id}
              equipment={eq}
              cameraMode="orbit"
              dayNight={dayNight}
            />
          ))}

          <OrbitControls
            makeDefault
            autoRotate
            autoRotateSpeed={0.8}
            enableDamping
            dampingFactor={0.05}
            minPolarAngle={0.05}
            maxPolarAngle={Math.PI - 0.08}
            minDistance={0.5}
            maxDistance={35}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
