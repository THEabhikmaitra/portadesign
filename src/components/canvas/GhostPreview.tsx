"use client";

import React, { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useStudioStore } from "@/store/useStudioStore";
import { EQUIPMENT_CATALOG, validateEquipmentPlacement } from "@/lib/equipmentCatalog";

export const GhostPreview: React.FC = () => {
  const { raycaster, camera, scene } = useThree();
  const activePlacement = useStudioStore((state) => state.activePlacement);
  const ghostPosition = useStudioStore((state) => state.ghostPosition);
  const setGhostPosition = useStudioStore((state) => state.setGhostPosition);
  const placementRotation = useStudioStore((state) => state.placementRotation);
  const rotatePlacement = useStudioStore((state) => state.rotatePlacement);
  const cancelPlacement = useStudioStore((state) => state.cancelPlacement);
  const addEquipment = useStudioStore((state) => state.addEquipment);
  const cabins = useStudioStore((state) => state.cabins);

  const [isValidPlacement, setIsValidPlacement] = useState(true);

  // 'R' key listener for 90-degree rotation & Escape to cancel
  useEffect(() => {
    if (!activePlacement.itemType) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") {
        rotatePlacement();
      } else if (e.key === "Escape") {
        cancelPlacement();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePlacement.itemType, rotatePlacement, cancelPlacement]);

  // Raycasting pointer move on ground / cabin
  useEffect(() => {
    if (!activePlacement.itemType) return;

    const handlePointerMove = (e: PointerEvent) => {
      // Normalized device coordinates
      const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );

      raycaster.setFromCamera(mouse, camera);

      // Raycast against the ground plane Y = 0 or roof planes
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();
      const hit = raycaster.ray.intersectPlane(groundPlane, intersection);

      if (hit) {
        // Grid snapping (0.5m grid)
        const snapX = Math.round(intersection.x * 2) / 2;
        const snapZ = Math.round(intersection.z * 2) / 2;
        let snapY = 0;

        // Check if cursor is hovering over a cabin roof or interior
        const eqDef = EQUIPMENT_CATALOG[activePlacement.itemType || ""];
        if (eqDef?.allowedZones.includes("ROOF_TOP")) {
          // Snap to top of nearest cabin
          snapY = 2.62;
        } else if (eqDef?.allowedZones.includes("WALL_INTERIOR") || eqDef?.allowedZones.includes("WALL_EXTERIOR")) {
          snapY = 1.6;
        }

        setGhostPosition([snapX, snapY, snapZ]);
        setIsValidPlacement(true);
      }
    };

    const handleClick = () => {
      if (!activePlacement.itemType || !ghostPosition) return;

      if (activePlacement.category === "equipment") {
        addEquipment(
          activePlacement.itemType,
          ghostPosition,
          [0, placementRotation, 0],
          cabins[0]?.id
        );
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("click", handleClick);
    };
  }, [
    activePlacement,
    camera,
    raycaster,
    ghostPosition,
    placementRotation,
    addEquipment,
    cabins,
    setGhostPosition,
  ]);

  if (!activePlacement.itemType || !ghostPosition) return null;

  return (
    <group position={ghostPosition} rotation={[0, placementRotation, 0]}>
      {/* Holographic Glowing Ghost Wireframe Mesh */}
      <mesh>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial
          color={isValidPlacement ? "#10b981" : "#ef4444"}
          emissive={isValidPlacement ? "#10b981" : "#ef4444"}
          emissiveIntensity={0.6}
          transparent
          opacity={0.45}
          wireframe
        />
      </mesh>

      {/* Magnetic Green Alignment Snap Rings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]}>
        <ringGeometry args={[0.7, 0.85, 32]} />
        <meshBasicMaterial
          color={isValidPlacement ? "#10b981" : "#ef4444"}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Floating HUD Tooltip */}
      <mesh position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
    </group>
  );
};
