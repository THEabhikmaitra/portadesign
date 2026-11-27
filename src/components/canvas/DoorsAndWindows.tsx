"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { DoorConfig, WindowConfig } from "@/types";
import { useStudioStore } from "@/store/useStudioStore";
import { useSafeTexture } from "@/lib/safeTexture";

export const DoorMesh: React.FC<{
  door: DoorConfig;
  parentCabinId: string;
  isCutaway: boolean;
  isXRay: boolean;
}> = ({ door, parentCabinId, isXRay }) => {
  const selectedEntity = useStudioStore((state) => state.selectedEntity);
  const setSelectedEntity = useStudioStore((state) => state.setSelectedEntity);
  const catalogAttributes = useStudioStore((state) => state.catalogAttributes);
  const catalogElements = useStudioStore((state) => state.catalogElements);

  const isSelected = selectedEntity?.type === "door" && selectedEntity?.id === door.id;

  const glassAttr = catalogAttributes.find(
    (a) => a.category === "GLASS_TYPE" && a.code === (door.glassType || "GLASS_CLEAR_SG")
  );
  const frameAttr = catalogAttributes.find(
    (a) => a.category === "FRAME_MATERIAL" && a.code === (door.frameMaterial || "FRAME_ALUM_CHARCOAL")
  );
  const doorEl = catalogElements.find((e) => e.code === door.type);
  const frameTexture = useSafeTexture(frameAttr?.textureUrl);

  const frameMat = useMemo(() => {
    if (isXRay) {
      return new THREE.MeshStandardMaterial({ color: "#00ffff", wireframe: true });
    }
    return new THREE.MeshStandardMaterial({
      color: frameAttr?.shader?.color || "#272a30",
      roughness: frameAttr?.shader?.roughness ?? 0.32,
      metalness: frameAttr?.shader?.metalness ?? 0.82,
      map: frameTexture || null,
    });
  }, [frameAttr, frameTexture, isXRay]);

  const glassMat = useMemo(() => {
    if (isXRay) {
      return new THREE.MeshBasicMaterial({ color: "#38bdf8", wireframe: true });
    }
    const s = glassAttr?.shader;
    return new THREE.MeshPhysicalMaterial({
      color: s?.color || "#ffffff",
      roughness: s?.roughness ?? 0.02,
      metalness: s?.metalness ?? 0.05,
      transmission: s?.transmission ?? 0.94,
      ior: s?.ior ?? 1.5,
      thickness: s?.thickness ?? 0.4,
      clearcoat: s?.clearcoat ?? 1.0,
      transparent: s?.transparent ?? true,
      opacity: s?.opacity ?? 0.35,
    });
  }, [glassAttr, isXRay]);

  const isSlidingGlass = door.type.includes("GLASS");
  const doorW = Number(doorEl?.dimensions?.width) || (isSlidingGlass ? 2.2 : 0.95);
  const doorH = Number(doorEl?.dimensions?.height) || (isSlidingGlass ? 2.1 : 2.05);

  return (
    <group
      position={door.position}
      rotation={door.rotation}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedEntity({ type: "door", id: door.id, parentCabinId });
      }}
    >
      {isSelected && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[doorW + 0.1, doorH + 0.05, 0.2]} />
          <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.7} />
        </mesh>
      )}

      {isSlidingGlass ? (
        <group>
          <mesh position={[0, doorH / 2, 0]} material={frameMat} castShadow>
            <boxGeometry args={[doorW, 0.08, 0.12]} />
          </mesh>
          <mesh position={[0, -doorH / 2, 0]} material={frameMat} receiveShadow>
            <boxGeometry args={[doorW, 0.08, 0.12]} />
          </mesh>
          <mesh position={[-(doorW / 2 - 0.04), 0, 0]} material={frameMat} castShadow>
            <boxGeometry args={[0.08, doorH, 0.12]} />
          </mesh>
          <mesh position={[doorW / 2 - 0.04, 0, 0]} material={frameMat} castShadow>
            <boxGeometry args={[0.08, doorH, 0.12]} />
          </mesh>

          <group position={[-doorW * 0.236, 0, -0.02]}>
            <mesh material={glassMat} castShadow receiveShadow>
              <boxGeometry args={[doorW * 0.46, doorH - 0.12, 0.015]} />
            </mesh>
            <mesh position={[-doorW * 0.23, 0, 0]} material={frameMat}>
              <boxGeometry args={[0.04, doorH - 0.12, 0.04]} />
            </mesh>
            <mesh position={[doorW * 0.23, 0, 0]} material={frameMat}>
              <boxGeometry args={[0.04, doorH - 0.12, 0.04]} />
            </mesh>
          </group>

          <group position={[doorW * 0.236, 0, 0.02]}>
            <mesh material={glassMat} castShadow receiveShadow>
              <boxGeometry args={[doorW * 0.46, doorH - 0.12, 0.015]} />
            </mesh>
            <mesh position={[-doorW * 0.23, 0, 0]} material={frameMat}>
              <boxGeometry args={[0.04, doorH - 0.12, 0.04]} />
            </mesh>
            <mesh position={[doorW * 0.23, 0, 0]} material={frameMat}>
              <boxGeometry args={[0.04, doorH - 0.12, 0.04]} />
            </mesh>
            <mesh position={[-doorW * 0.19, 0, 0.04]} castShadow>
              <boxGeometry args={[0.03, 0.5, 0.03]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
            </mesh>
          </group>
        </group>
      ) : (
        <group>
          <mesh material={frameMat} castShadow receiveShadow>
            <boxGeometry args={[doorW + 0.05, doorH + 0.05, 0.1]} />
          </mesh>
          <mesh position={[0, 0, 0.01]} castShadow receiveShadow>
            <boxGeometry args={[doorW - 0.05, doorH - 0.05, 0.06]} />
            <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.8} />
          </mesh>
          <mesh position={[doorW * 0.36, -0.05, 0.06]} castShadow>
            <boxGeometry args={[0.14, 0.03, 0.05]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.2} />
          </mesh>
        </group>
      )}
    </group>
  );
};

export const WindowMesh: React.FC<{
  window: WindowConfig;
  parentCabinId: string;
  isCutaway: boolean;
  isXRay: boolean;
}> = ({ window, parentCabinId, isXRay }) => {
  const selectedEntity = useStudioStore((state) => state.selectedEntity);
  const setSelectedEntity = useStudioStore((state) => state.setSelectedEntity);
  const catalogAttributes = useStudioStore((state) => state.catalogAttributes);
  const catalogElements = useStudioStore((state) => state.catalogElements);

  const isSelected = selectedEntity?.type === "window" && selectedEntity?.id === window.id;

  const winEl = catalogElements.find((e) => e.code === window.type);
  const isPanoramic = window.type === "WINDOW_PANORAMIC";
  const w = Number(winEl?.dimensions?.width) || (isPanoramic ? 2.4 : 1.2);
  const h = Number(winEl?.dimensions?.height) || (isPanoramic ? 1.4 : 1.0);

  const glassAttr = catalogAttributes.find(
    (a) => a.category === "GLASS_TYPE" && a.code === window.glassType
  );
  const frameAttr = catalogAttributes.find(
    (a) => a.category === "FRAME_MATERIAL" && a.code === window.frameMaterial
  );
  const frameTexture = useSafeTexture(frameAttr?.textureUrl);

  const frameMat = useMemo(() => {
    if (isXRay) return new THREE.MeshStandardMaterial({ color: "#00ffff", wireframe: true });
    return new THREE.MeshStandardMaterial({
      color: frameAttr?.shader?.color || "#f8f9fa",
      roughness: frameAttr?.shader?.roughness ?? 0.25,
      metalness: frameAttr?.shader?.metalness ?? 0.04,
      map: frameTexture || null,
    });
  }, [frameAttr, frameTexture, isXRay]);

  const glassMat = useMemo(() => {
    if (isXRay) return new THREE.MeshBasicMaterial({ color: "#38bdf8", wireframe: true });
    const s = glassAttr?.shader;
    return new THREE.MeshPhysicalMaterial({
      color: s?.color || "#ffffff",
      roughness: s?.roughness ?? 0.02,
      metalness: s?.metalness ?? 0.05,
      transmission: s?.transmission ?? 0.94,
      ior: s?.ior ?? 1.5,
      thickness: s?.thickness ?? 0.4,
      clearcoat: s?.clearcoat ?? 1.0,
      transparent: s?.transparent ?? true,
      opacity: s?.opacity ?? 0.35,
    });
  }, [glassAttr, isXRay]);

  return (
    <group
      position={window.position}
      rotation={window.rotation}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedEntity({ type: "window", id: window.id, parentCabinId });
      }}
    >
      {isSelected && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[w + 0.12, h + 0.12, 0.16]} />
          <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.7} />
        </mesh>
      )}

      <mesh position={[0, h / 2, 0]} material={frameMat} castShadow>
        <boxGeometry args={[w, 0.06, 0.1]} />
      </mesh>
      <mesh position={[0, -h / 2, 0]} material={frameMat} receiveShadow>
        <boxGeometry args={[w, 0.06, 0.1]} />
      </mesh>
      <mesh position={[-w / 2, 0, 0]} material={frameMat} castShadow>
        <boxGeometry args={[0.06, h, 0.1]} />
      </mesh>
      <mesh position={[w / 2, 0, 0]} material={frameMat} castShadow>
        <boxGeometry args={[0.06, h, 0.1]} />
      </mesh>

      {!isPanoramic && (
        <mesh position={[0, 0, 0]} material={frameMat}>
          <boxGeometry args={[0.04, h, 0.08]} />
        </mesh>
      )}

      <mesh material={glassMat} castShadow receiveShadow>
        <boxGeometry args={[w - 0.08, h - 0.08, 0.015]} />
      </mesh>
    </group>
  );
};
