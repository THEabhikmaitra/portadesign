"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { DoorConfig, WindowConfig, GlassTypeCode, FrameMaterialCode } from "@/types";
import { useStudioStore } from "@/store/useStudioStore";

// Glass Material Shaders (MeshPhysicalMaterial)
const GLASS_SHADERS: Record<GlassTypeCode, any> = {
  GLASS_CLEAR_SG: {
    color: "#ffffff",
    roughness: 0.02,
    metalness: 0.05,
    transmission: 0.94,
    ior: 1.5,
    thickness: 0.4,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.35,
  },
  GLASS_TINTED_BLACK: {
    color: "#182026",
    roughness: 0.08,
    metalness: 0.25,
    transmission: 0.48,
    ior: 1.52,
    thickness: 0.8,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.72,
  },
  GLASS_BRONZE_AIS: {
    color: "#784d28",
    roughness: 0.12,
    metalness: 0.45,
    transmission: 0.42,
    ior: 1.54,
    thickness: 0.8,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.68,
  },
  GLASS_FROSTED_AIS: {
    color: "#e2ecf5",
    roughness: 0.65,
    metalness: 0.02,
    transmission: 0.6,
    ior: 1.48,
    thickness: 1.0,
    clearcoat: 0.2,
    transparent: true,
    opacity: 0.85,
  },
};

// Frame Material Shaders
const FRAME_SHADERS: Record<FrameMaterialCode, any> = {
  FRAME_ALUM_CHARCOAL: {
    color: "#272a30",
    roughness: 0.32,
    metalness: 0.82,
  },
  FRAME_UPVC_WHITE: {
    color: "#f8f9fa",
    roughness: 0.25,
    metalness: 0.04,
  },
  FRAME_STEEL_TATA: {
    color: "#3e4752",
    roughness: 0.38,
    metalness: 0.92,
  },
};

export const DoorMesh: React.FC<{
  door: DoorConfig;
  parentCabinId: string;
  isCutaway: boolean;
  isXRay: boolean;
}> = ({ door, parentCabinId, isXRay }) => {
  const selectedEntity = useStudioStore((state) => state.selectedEntity);
  const setSelectedEntity = useStudioStore((state) => state.setSelectedEntity);

  const isSelected = selectedEntity?.type === "door" && selectedEntity?.id === door.id;

  const glassShader = GLASS_SHADERS[door.glassType || "GLASS_CLEAR_SG"];
  const frameShader = FRAME_SHADERS[door.frameMaterial || "FRAME_ALUM_CHARCOAL"];

  const frameMat = useMemo(() => {
    if (isXRay) {
      return new THREE.MeshStandardMaterial({ color: "#00ffff", wireframe: true });
    }
    return new THREE.MeshStandardMaterial(frameShader);
  }, [frameShader, isXRay]);

  const glassMat = useMemo(() => {
    if (isXRay) {
      return new THREE.MeshBasicMaterial({ color: "#38bdf8", wireframe: true });
    }
    return new THREE.MeshPhysicalMaterial(glassShader);
  }, [glassShader, isXRay]);

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
          <boxGeometry args={[door.type === "DOOR_SLIDING_GLASS" ? 2.3 : 1.05, 2.15, 0.2]} />
          <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.7} />
        </mesh>
      )}

      {door.type === "DOOR_SLIDING_GLASS" ? (
        // Architectural Sliding Glass Door Assembly (2.2m x 2.1m)
        <group>
          {/* Outer Header & Sill Tracks */}
          <mesh position={[0, 1.05, 0]} material={frameMat} castShadow>
            <boxGeometry args={[2.2, 0.08, 0.12]} />
          </mesh>
          <mesh position={[0, -1.05, 0]} material={frameMat} receiveShadow>
            <boxGeometry args={[2.2, 0.08, 0.12]} />
          </mesh>
          <mesh position={[-1.06, 0, 0]} material={frameMat} castShadow>
            <boxGeometry args={[0.08, 2.1, 0.12]} />
          </mesh>
          <mesh position={[1.06, 0, 0]} material={frameMat} castShadow>
            <boxGeometry args={[0.08, 2.1, 0.12]} />
          </mesh>

          {/* Left Fixed Glass Panel */}
          <group position={[-0.52, 0, -0.02]}>
            <mesh material={glassMat} castShadow receiveShadow>
              <boxGeometry args={[1.02, 1.98, 0.015]} />
            </mesh>
            {/* Panel Sash Frame */}
            <mesh position={[-0.51, 0, 0]} material={frameMat}>
              <boxGeometry args={[0.04, 1.98, 0.04]} />
            </mesh>
            <mesh position={[0.51, 0, 0]} material={frameMat}>
              <boxGeometry args={[0.04, 1.98, 0.04]} />
            </mesh>
          </group>

          {/* Right Sliding Glass Panel */}
          <group position={[0.52, 0, 0.02]}>
            <mesh material={glassMat} castShadow receiveShadow>
              <boxGeometry args={[1.02, 1.98, 0.015]} />
            </mesh>
            {/* Panel Sash Frame */}
            <mesh position={[-0.51, 0, 0]} material={frameMat}>
              <boxGeometry args={[0.04, 1.98, 0.04]} />
            </mesh>
            <mesh position={[0.51, 0, 0]} material={frameMat}>
              <boxGeometry args={[0.04, 1.98, 0.04]} />
            </mesh>
            {/* Architectural Aluminum Pull Handle */}
            <mesh position={[-0.42, 0, 0.04]} castShadow>
              <boxGeometry args={[0.03, 0.5, 0.03]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
            </mesh>
          </group>
        </group>
      ) : (
        // Corten Steel Security Door Assembly (0.95m x 2.05m)
        <group>
          {/* Heavy Steel Jamb */}
          <mesh material={frameMat} castShadow receiveShadow>
            <boxGeometry args={[1.0, 2.1, 0.1]} />
          </mesh>
          {/* Inner Door Leaf */}
          <mesh position={[0, 0, 0.01]} castShadow receiveShadow>
            <boxGeometry args={[0.9, 2.0, 0.06]} />
            <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.8} />
          </mesh>
          {/* Commercial Lever Handle */}
          <mesh position={[0.36, -0.05, 0.06]} castShadow>
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

  const isSelected = selectedEntity?.type === "window" && selectedEntity?.id === window.id;

  const isPanoramic = window.type === "WINDOW_PANORAMIC";
  const w = isPanoramic ? 2.4 : 1.2;
  const h = isPanoramic ? 1.4 : 1.0;

  const glassShader = GLASS_SHADERS[window.glassType] || GLASS_SHADERS.GLASS_CLEAR_SG;
  const frameShader = FRAME_SHADERS[window.frameMaterial] || FRAME_SHADERS.FRAME_UPVC_WHITE;

  const frameMat = useMemo(() => {
    if (isXRay) return new THREE.MeshStandardMaterial({ color: "#00ffff", wireframe: true });
    return new THREE.MeshStandardMaterial(frameShader);
  }, [frameShader, isXRay]);

  const glassMat = useMemo(() => {
    if (isXRay) return new THREE.MeshBasicMaterial({ color: "#38bdf8", wireframe: true });
    return new THREE.MeshPhysicalMaterial(glassShader);
  }, [glassShader, isXRay]);

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

      {/* Outer Window Perimeter Frame */}
      {/* Top and Bottom */}
      <mesh position={[0, h / 2, 0]} material={frameMat} castShadow>
        <boxGeometry args={[w, 0.06, 0.1]} />
      </mesh>
      <mesh position={[0, -h / 2, 0]} material={frameMat} receiveShadow>
        <boxGeometry args={[w, 0.06, 0.1]} />
      </mesh>
      {/* Left and Right */}
      <mesh position={[-w / 2, 0, 0]} material={frameMat} castShadow>
        <boxGeometry args={[0.06, h, 0.1]} />
      </mesh>
      <mesh position={[w / 2, 0, 0]} material={frameMat} castShadow>
        <boxGeometry args={[0.06, h, 0.1]} />
      </mesh>

      {/* Center Dividing Mullion for standard window */}
      {!isPanoramic && (
        <mesh position={[0, 0, 0]} material={frameMat}>
          <boxGeometry args={[0.04, h, 0.08]} />
        </mesh>
      )}

      {/* Physical Glass Glazing Sheet */}
      <mesh material={glassMat} castShadow receiveShadow>
        <boxGeometry args={[w - 0.08, h - 0.08, 0.015]} />
      </mesh>
    </group>
  );
};
