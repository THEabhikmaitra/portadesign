"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { CabinConfig } from "@/types";
import { proceduralTextures } from "@/lib/proceduralTextures";
import { useSafeTexture } from "@/lib/safeTexture";
import { useStudioStore } from "@/store/useStudioStore";
import { DoorMesh, WindowMesh } from "./DoorsAndWindows";

interface ModularCabinProps {
  cabin: CabinConfig;
  cameraMode: string;
  dayNight: "day" | "night";
}

export const ModularCabin: React.FC<ModularCabinProps> = ({ cabin, cameraMode, dayNight }) => {
  const selectedEntity = useStudioStore((state) => state.selectedEntity);
  const setSelectedEntity = useStudioStore((state) => state.setSelectedEntity);
  const logistics = useStudioStore((state) => state.logistics);
  const cabins = useStudioStore((state) => state.cabins);
  const catalogElements = useStudioStore((state) => state.catalogElements);
  const catalogAttributes = useStudioStore((state) => state.catalogAttributes);

  const isSelected = selectedEntity?.type === "cabin" && selectedEntity?.id === cabin.id;
  const isCutaway = cameraMode === "cutaway";
  const isXRay = cameraMode === "xray";

  const cabinMeta = catalogElements.find((e) => e.code === cabin.type);
  const length = Number(cabinMeta?.dimensions?.length) || (cabin.type === "CABIN_40FT" ? 12.19 : 6.06);
  const width = Number(cabinMeta?.dimensions?.width) || 2.44;
  const height = Number(cabinMeta?.dimensions?.height) || (cabin.type === "CABIN_40FT" ? 2.9 : 2.59);

  const corrugationBump = useMemo(() => proceduralTextures.getCorrugationBumpTexture(), []);
  const woodFloorTexture = useMemo(() => proceduralTextures.getWoodFloorTexture(), []);

  const finishAttr = catalogAttributes.find(
    (a) => a.category === "WALL_FINISH" && a.code === cabin.wallFinish
  );
  const finishColor = finishAttr?.shader?.color || "#475569";
  const finishRoughness = finishAttr?.shader?.roughness ?? 0.45;
  const finishMetalness = finishAttr?.shader?.metalness ?? 0.25;

  const customTexture = useSafeTexture(finishAttr?.textureUrl);

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
      color: finishColor,
      map: customTexture || null,
      roughness: finishRoughness,
      metalness: finishMetalness,
      bumpMap: corrugationBump,
      bumpScale: 0.04,
    });
  }, [finishColor, finishRoughness, finishMetalness, customTexture, corrugationBump, isXRay]);

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
      {isSelected && (
        <mesh position={[0, halfH, 0]}>
          <boxGeometry args={[length + 0.12, height + 0.12, width + 0.12]} />
          <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.65} />
        </mesh>
      )}

      {/* Corner Castings */}
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
          <mesh position={[0, 0, 0.115]}>
            <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
        </group>
      ))}

      {/* Vertical Corner Posts */}
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

      {/* Bottom Perimeter Rails */}
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

      {/* Top Perimeter Rails */}
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

      {/* Wood Floor */}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} material={floorMaterial} receiveShadow>
        <planeGeometry args={[length - 0.2, width - 0.2]} />
      </mesh>

      {/* Roof Panel */}
      {!isCutaway && (
        <group position={[0, height - 0.02, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} material={wallMaterial} castShadow receiveShadow>
            <planeGeometry args={[length - 0.1, width - 0.1]} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={interiorWallMaterial}>
            <planeGeometry args={[length - 0.2, width - 0.2]} />
          </mesh>
        </group>
      )}

      {/* Plinth Pads / Terrace Load Grid */}
      {cabin.tier === 0 && (
        <group position={[0, -0.02, 0]}>
          {[-halfL + 0.3, 0, halfL - 0.3].map((px, idx) => (
            <mesh key={`plinth-${idx}`} position={[px, 0, 0]} receiveShadow>
              <boxGeometry args={[0.35, 0.06, width + 0.12]} />
              <meshStandardMaterial
                color={logistics.placementLevel === "TERRACE" ? "#1e293b" : "#475569"}
                roughness={0.7}
                metalness={logistics.placementLevel === "TERRACE" ? 0.85 : 0.1}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* Cool-Roof Canopy */}
      {!isCutaway &&
        logistics.insulationTier === "PUF_75MM_CANOPY" &&
        !cabins.some((other) => other.id !== cabin.id && other.position[1] > cabin.position[1] + 0.5) && (
          <group position={[0, height + 0.32, 0]}>
            {[-halfL + 0.3, 0, halfL - 0.3].map((sx) =>
              [-halfW + 0.2, halfW - 0.2].map((sz) => (
                <mesh key={`strut-${sx}-${sz}`} position={[sx, -0.16, sz]} material={frameMaterial}>
                  <boxGeometry args={[0.06, 0.36, 0.06]} />
                </mesh>
              ))
            )}
            <mesh rotation={[0.09, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[length + 0.5, 0.05, width + 0.65]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.35} metalness={0.4} />
            </mesh>
          </group>
        )}

      {/* Corrugated Walls */}
      <group position={[0, halfH, halfW - 0.02]}>
        <mesh material={wallMaterial} castShadow receiveShadow>
          <boxGeometry args={[length - 0.2, height - 0.24, 0.04]} />
        </mesh>
      </group>
      <group position={[0, halfH, -halfW + 0.02]}>
        <mesh material={wallMaterial} castShadow receiveShadow>
          <boxGeometry args={[length - 0.2, height - 0.24, 0.04]} />
        </mesh>
      </group>
      <group position={[-halfL + 0.02, halfH, 0]}>
        <mesh material={wallMaterial} castShadow receiveShadow>
          <boxGeometry args={[0.04, height - 0.24, width - 0.2]} />
        </mesh>
      </group>
      <group position={[halfL - 0.02, halfH, 0]}>
        <mesh material={wallMaterial} castShadow receiveShadow>
          <boxGeometry args={[0.04, height - 0.24, width - 0.2]} />
        </mesh>
      </group>

      {/* Bulkhead Light */}
      <group position={[0, height - 0.35, halfW + 0.06]}>
        <mesh castShadow>
          <boxGeometry args={[0.16, 0.22, 0.08]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>
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

      {cabin.doors.map((door) => (
        <DoorMesh
          key={door.id}
          door={door}
          parentCabinId={cabin.id}
          isCutaway={isCutaway}
          isXRay={isXRay}
        />
      ))}

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
