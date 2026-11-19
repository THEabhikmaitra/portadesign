"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { CabinConfig, WallFinishCode } from "@/types";
import { proceduralTextures } from "@/lib/proceduralTextures";
import { useStudioStore } from "@/store/useStudioStore";
import { DoorMesh, WindowMesh } from "./DoorsAndWindows";

interface ModularCabinProps {
  cabin: CabinConfig;
  cameraMode: string;
  dayNight: "day" | "night";
}

// Color and PBR mapping for wall finishes
const WALL_FINISH_PROPS: Record<WallFinishCode, { color: string; roughness: number; metalness: number }> = {
  FINISH_BATTLESHIP_GREY: { color: "#475569", roughness: 0.45, metalness: 0.25 },
  FINISH_OCEAN_CYBER: { color: "#0f3d5e", roughness: 0.38, metalness: 0.35 },
  FINISH_DESERT_BEIGE: { color: "#cbb393", roughness: 0.58, metalness: 0.15 },
  FINISH_FOREST_OLIVE: { color: "#2c3b2e", roughness: 0.52, metalness: 0.2 },
};

export const ModularCabin: React.FC<ModularCabinProps> = ({ cabin, cameraMode, dayNight }) => {
  const selectedEntity = useStudioStore((state) => state.selectedEntity);
  const setSelectedEntity = useStudioStore((state) => state.setSelectedEntity);

  const isSelected = selectedEntity?.type === "cabin" && selectedEntity?.id === cabin.id;
  const isCutaway = cameraMode === "cutaway";
  const isXRay = cameraMode === "xray";

  const is40Ft = cabin.type === "CABIN_40FT";
  const length = is40Ft ? 12.19 : 6.06;
  const width = 2.44;
  const height = is40Ft ? 2.90 : 2.59;

  // Procedural corrugation bump map & wood floor
  const corrugationBump = useMemo(() => proceduralTextures.getCorrugationBumpTexture(), []);
  const woodFloorTexture = useMemo(() => proceduralTextures.getWoodFloorTexture(), []);

  const finish = WALL_FINISH_PROPS[cabin.wallFinish] || WALL_FINISH_PROPS.FINISH_BATTLESHIP_GREY;

  // PBR materials
  const wallMaterial = useMemo(() => {
    if (isXRay) {
      return new THREE.MeshStandardMaterial({
        color: "#06b6d4",
        wireframe: true,
        transparent: true,
        opacity: 0.45,
      });
    }

    return new THREE.MeshStandardMaterial({
      color: finish.color,
      roughness: finish.roughness,
      metalness: finish.metalness,
      bumpMap: corrugationBump,
      bumpScale: 0.04,
    });
  }, [finish, corrugationBump, isXRay]);

  const frameMaterial = useMemo(() => {
    if (isXRay) {
      return new THREE.MeshStandardMaterial({
        color: "#3b82f6",
        wireframe: true,
        transparent: true,
        opacity: 0.7,
      });
    }

    return new THREE.MeshStandardMaterial({
      color: "#1e293b",
      roughness: 0.3,
      metalness: 0.85,
    });
  }, [isXRay]);

  const interiorWallMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#f1f5f9",
      roughness: 0.8,
      metalness: 0.05,
    });
  }, []);

  const floorMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: woodFloorTexture,
      roughness: 0.4,
      metalness: 0.05,
    });
  }, [woodFloorTexture]);

  const cornerCastingMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#0f172a",
      roughness: 0.2,
      metalness: 0.9,
    });
  }, []);

  const beamSize = 0.14;
  const halfL = length / 2;
  const halfW = width / 2;
  const halfH = height / 2;

  return (
    <group
      position={cabin.position}
      rotation={cabin.rotation}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedEntity({ type: "cabin", id: cabin.id });
      }}
    >
      {/* Selection Highlight Cage */}
      {isSelected && (
        <mesh position={[0, halfH, 0]}>
          <boxGeometry args={[length + 0.12, height + 0.12, width + 0.12]} />
          <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.65} />
        </mesh>
      )}

      {/* 1. Structural Corner Castings (8 standard ISO steel castings) */}
      {[
        [-halfL, 0.08, -halfW],
        [halfL, 0.08, -halfW],
        [-halfL, 0.08, halfW],
        [halfL, 0.08, halfW],
        [-halfL, height - 0.08, -halfW],
        [halfL, height - 0.08, -halfW],
        [-halfL, height - 0.08, halfW],
        [halfL, height - 0.08, halfW],
      ].map((pos, idx) => (
        <group key={`corner-${idx}`} position={pos as [number, number, number]}>
          <mesh material={cornerCastingMaterial} castShadow receiveShadow>
            <boxGeometry args={[0.22, 0.22, 0.22]} />
          </mesh>
          {/* Oval lifting hole detail */}
          <mesh position={[0, 0, 0.115]}>
            <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
        </group>
      ))}

      {/* 2. Main Structural Beams (Heavy Tubular Corten Steel) */}
      {/* 4 Vertical Corner Posts */}
      {[
        [-halfL, halfH, -halfW],
        [halfL, halfH, -halfW],
        [-halfL, halfH, halfW],
        [halfL, halfH, halfW],
      ].map((pos, idx) => (
        <mesh
          key={`post-${idx}`}
          position={pos as [number, number, number]}
          material={frameMaterial}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[beamSize, height, beamSize]} />
        </mesh>
      ))}

      {/* 4 Bottom Perimeter Rails */}
      <mesh position={[0, beamSize / 2, -halfW]} material={frameMaterial} castShadow receiveShadow>
        <boxGeometry args={[length, beamSize, beamSize]} />
      </mesh>
      <mesh position={[0, beamSize / 2, halfW]} material={frameMaterial} castShadow receiveShadow>
        <boxGeometry args={[length, beamSize, beamSize]} />
      </mesh>
      <mesh position={[-halfL, beamSize / 2, 0]} material={frameMaterial} castShadow receiveShadow>
        <boxGeometry args={[beamSize, beamSize, width]} />
      </mesh>
      <mesh position={[halfL, beamSize / 2, 0]} material={frameMaterial} castShadow receiveShadow>
        <boxGeometry args={[beamSize, beamSize, width]} />
      </mesh>

      {/* 4 Top Perimeter Rails */}
      <mesh position={[0, height - beamSize / 2, -halfW]} material={frameMaterial} castShadow receiveShadow>
        <boxGeometry args={[length, beamSize, beamSize]} />
      </mesh>
      <mesh position={[0, height - beamSize / 2, halfW]} material={frameMaterial} castShadow receiveShadow>
        <boxGeometry args={[length, beamSize, beamSize]} />
      </mesh>
      <mesh position={[-halfL, height - beamSize / 2, 0]} material={frameMaterial} castShadow receiveShadow>
        <boxGeometry args={[beamSize, beamSize, width]} />
      </mesh>
      <mesh position={[halfL, height - beamSize / 2, 0]} material={frameMaterial} castShadow receiveShadow>
        <boxGeometry args={[beamSize, beamSize, width]} />
      </mesh>

      {/* 3. Wood Floor Panel (Interior Bottom) */}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} material={floorMaterial} receiveShadow>
        <planeGeometry args={[length - 0.2, width - 0.2]} />
      </mesh>

      {/* 4. Roof Panel (Hides in Dollhouse Cutaway Mode) */}
      {!isCutaway && (
        <group position={[0, height - 0.02, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} material={wallMaterial} castShadow receiveShadow>
            <planeGeometry args={[length - 0.1, width - 0.1]} />
          </mesh>
          {/* Ceiling Interior Face */}
          <mesh rotation={[Math.PI / 2, 0, 0]} material={interiorWallMaterial}>
            <planeGeometry args={[length - 0.2, width - 0.2]} />
          </mesh>
        </group>
      )}

      {/* 5. Corrugated Side Walls (Front & Back Long Sides) */}
      {/* Front Long Wall (Z = halfW) */}
      <group position={[0, halfH, halfW - 0.02]}>
        <mesh material={wallMaterial} castShadow receiveShadow>
          <boxGeometry args={[length - 0.2, height - 0.24, 0.04]} />
        </mesh>
      </group>

      {/* Back Long Wall (Z = -halfW) */}
      <group position={[0, halfH, -halfW + 0.02]}>
        <mesh material={wallMaterial} castShadow receiveShadow>
          <boxGeometry args={[length - 0.2, height - 0.24, 0.04]} />
        </mesh>
      </group>

      {/* Left End Wall (X = -halfL) */}
      <group position={[-halfL + 0.02, halfH, 0]}>
        <mesh material={wallMaterial} castShadow receiveShadow>
          <boxGeometry args={[0.04, height - 0.24, width - 0.2]} />
        </mesh>
      </group>

      {/* Right End Wall (X = halfL) */}
      <group position={[halfL - 0.02, halfH, 0]}>
        <mesh material={wallMaterial} castShadow receiveShadow>
          <boxGeometry args={[0.04, height - 0.24, width - 0.2]} />
        </mesh>
      </group>

      {/* 6. Exterior Bulkhead Lights (Glow at Night) */}
      <group position={[0, height - 0.35, halfW + 0.06]}>
        <mesh castShadow>
          <boxGeometry args={[0.16, 0.22, 0.08]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Bulkhead glowing lens */}
        <mesh position={[0, 0, 0.045]}>
          <boxGeometry args={[0.12, 0.18, 0.02]} />
          <meshStandardMaterial
            color={dayNight === "night" ? "#ffecb3" : "#e2e8f0"}
            emissive={dayNight === "night" ? "#ffa500" : "#000000"}
            emissiveIntensity={dayNight === "night" ? 2.2 : 0}
            roughness={0.1}
          />
        </mesh>
        {dayNight === "night" && (
          <pointLight color="#ffcc66" intensity={1.8} distance={8} decay={2} position={[0, -0.1, 0.2]} />
        )}
      </group>

      {/* 7. Nested Doors */}
      {cabin.doors.map((door) => (
        <DoorMesh
          key={door.id}
          door={door}
          parentCabinId={cabin.id}
          isCutaway={isCutaway}
          isXRay={isXRay}
        />
      ))}

      {/* 8. Nested Windows */}
      {cabin.windows.map((win) => (
        <WindowMesh
          key={win.id}
          window={win}
          parentCabinId={cabin.id}
          isCutaway={isCutaway}
          isXRay={isXRay}
        />
      ))}
    </group>
  );
};
