"use client";

import React, { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useStudioStore } from "@/store/useStudioStore";

export const GhostPreview: React.FC = () => {
  const { raycaster, camera } = useThree();
  const activePlacement = useStudioStore((state) => state.activePlacement);
  const ghostPosition = useStudioStore((state) => state.ghostPosition);
  const setGhostPosition = useStudioStore((state) => state.setGhostPosition);
  const placementRotation = useStudioStore((state) => state.placementRotation);
  const rotatePlacement = useStudioStore((state) => state.rotatePlacement);
  const cancelPlacement = useStudioStore((state) => state.cancelPlacement);
  const addEquipment = useStudioStore((state) => state.addEquipment);
  const cabins = useStudioStore((state) => state.cabins);
  const catalogElements = useStudioStore((state) => state.catalogElements);

  const [isValidPlacement, setIsValidPlacement] = useState(true);

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

  useEffect(() => {
    if (!activePlacement.itemType) return;

    const handlePointerMove = (e: PointerEvent) => {
      const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );

      raycaster.setFromCamera(mouse, camera);

      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();
      const hit = raycaster.ray.intersectPlane(groundPlane, intersection);

      if (hit) {
        const snapX = Math.round(intersection.x * 2) / 2;
        const snapZ = Math.round(intersection.z * 2) / 2;
        let snapY = 0;

        const elDef = catalogElements.find((el) => el.code === activePlacement.itemType);
        if (elDef?.mountZone === "ROOF_TOP") {
          snapY = 2.62;
        } else if (elDef?.mountZone === "WALL_INTERIOR" || elDef?.mountZone === "WALL_EXTERIOR") {
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
    catalogElements,
    setGhostPosition,
  ]);

  if (!activePlacement.itemType || !ghostPosition) return null;

  const elDef = catalogElements.find((el) => el.code === activePlacement.itemType);
  const bw = Number(elDef?.dimensions?.width) || 1.2;
  const bh = Number(elDef?.dimensions?.height) || 1.2;
  const bd = Number(elDef?.dimensions?.depth) || 1.2;

  return (
    <group position={ghostPosition} rotation={[0, placementRotation, 0]}>
      <mesh>
        <boxGeometry args={[bw, bh, bd]} />
        <meshStandardMaterial
          color={isValidPlacement ? "#10b981" : "#ef4444"}
          emissive={isValidPlacement ? "#10b981" : "#ef4444"}
          emissiveIntensity={0.6}
          transparent
          opacity={0.45}
          wireframe
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]}>
        <ringGeometry args={[0.7, 0.85, 32]} />
        <meshBasicMaterial
          color={isValidPlacement ? "#10b981" : "#ef4444"}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
    </group>
  );
};
