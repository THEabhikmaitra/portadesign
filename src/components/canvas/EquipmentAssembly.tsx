"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { EquipmentConfig, ThreePrimitive } from "@/types";
import { useStudioStore } from "@/store/useStudioStore";
import { useSafeTexture } from "@/lib/safeTexture";

interface EquipmentAssemblyProps {
  equipment: EquipmentConfig;
  cameraMode: string;
  dayNight: "day" | "night";
}

const BUILTIN_TYPES = new Set([
  "AC_SPLIT_INVERTER",
  "SOLAR_ARRAY_ROOF",
  "WATER_TANK_OVERHEAD",
  "STAIRS_EXTERNAL",
  "WASHROOM_POD",
  "DESK_SET_OFFICE",
  "LED_CEILING_PANEL",
  "CCTV_CAMERA",
]);

export const DynamicPrimitivesMesh: React.FC<{
  primitives: ThreePrimitive[];
  isXRay: boolean;
  dayNight: "day" | "night";
  imageUrl?: string | null;
  fallbackDims?: { width?: number; height?: number; depth?: number };
}> = ({ primitives, isXRay, dayNight, imageUrl, fallbackDims }) => {
  const imageTex = useSafeTexture(imageUrl);
  const w = Number(fallbackDims?.width) || 0.9;
  const h = Number(fallbackDims?.height) || 0.8;
  const d = Number(fallbackDims?.depth) || 0.6;

  if (!primitives || primitives.length === 0) {
    return (
      <group>
        <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial
            color={isXRay ? "#38bdf8" : "#64748b"}
            roughness={0.45}
            metalness={0.35}
            wireframe={isXRay}
          />
        </mesh>
        {imageTex && !isXRay && (
          <mesh position={[0, h / 2, d / 2 + 0.01]}>
            <planeGeometry args={[w * 0.8, h * 0.8]} />
            <meshStandardMaterial map={imageTex} roughness={0.3} />
          </mesh>
        )}
      </group>
    );
  }

  return (
    <group>
      {primitives.map((p, idx) => {
        const isNight = dayNight === "night";
        const glowIntensity =
          p.nightGlow && isNight ? (p.emissiveIntensity || 1.5) : p.emissiveIntensity || 0;
        const pos = p.position || [0, 0, 0];
        const rot = p.rotation || [0, 0, 0];

        return (
          <mesh
            key={p.id || `prim-${idx}`}
            position={pos}
            rotation={rot}
            castShadow
            receiveShadow
          >
            {p.shape === "cylinder" && (
              <cylinderGeometry args={(p.args as [number, number, number, number]) || [0.3, 0.3, 0.8, 16]} />
            )}
            {p.shape === "sphere" && (
              <sphereGeometry args={(p.args as [number, number, number]) || [0.25, 16, 16]} />
            )}
            {p.shape === "plane" && (
              <planeGeometry args={(p.args as [number, number]) || [0.8, 0.8]} />
            )}
            {(p.shape === "box" || !["cylinder", "sphere", "plane"].includes(p.shape)) && (
              <boxGeometry args={(p.args as [number, number, number]) || [0.8, 0.8, 0.5]} />
            )}
            {p.transmission && p.transmission > 0 && !isXRay ? (
              <meshPhysicalMaterial
                color={p.color || "#ffffff"}
                roughness={p.roughness ?? 0.08}
                metalness={p.metalness ?? 0.1}
                transmission={p.transmission}
                ior={p.ior ?? 1.5}
                transparent={p.transparent ?? true}
                opacity={p.opacity ?? 0.65}
              />
            ) : (
              <meshStandardMaterial
                color={isXRay ? "#38bdf8" : p.color || "#94a3b8"}
                roughness={p.roughness ?? 0.4}
                metalness={p.metalness ?? 0.35}
                emissive={p.emissive || "#000000"}
                emissiveIntensity={glowIntensity}
                transparent={p.transparent ?? false}
                opacity={p.opacity ?? 1}
                wireframe={isXRay}
              />
            )}
          </mesh>
        );
      })}
      {imageTex && !isXRay && (
        <mesh position={[0, h * 0.55, d / 2 + 0.02]}>
          <planeGeometry args={[Math.min(w * 0.7, 0.7), Math.min(h * 0.5, 0.5)]} />
          <meshBasicMaterial map={imageTex} transparent />
        </mesh>
      )}
    </group>
  );
};

export const EquipmentAssembly: React.FC<EquipmentAssemblyProps> = ({
  equipment,
  cameraMode,
  dayNight,
}) => {
  const selectedEntity = useStudioStore((state) => state.selectedEntity);
  const setSelectedEntity = useStudioStore((state) => state.setSelectedEntity);
  const catalogElements = useStudioStore((state) => state.catalogElements);

  const isSelected = selectedEntity?.type === "equipment" && selectedEntity?.id === equipment.id;
  const isXRay = cameraMode === "xray";
  const isNight = dayNight === "night";

  const elMeta = catalogElements.find((e) => e.code === equipment.type);
  const customPrimitives = elMeta?.threeConfig?.primitives;
  const hasCustomPrimitives = Array.isArray(customPrimitives) && customPrimitives.length > 0;
  const isBuiltin = BUILTIN_TYPES.has(equipment.type) && !hasCustomPrimitives;

  const metalMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isXRay ? "#38bdf8" : "#94a3b8",
        metalness: isXRay ? 0.2 : 0.85,
        roughness: isXRay ? 0.8 : 0.25,
        wireframe: isXRay,
      }),
    [isXRay]
  );

  const darkSteelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isXRay ? "#0284c7" : "#1e293b",
        metalness: isXRay ? 0.1 : 0.9,
        roughness: isXRay ? 0.9 : 0.35,
        wireframe: isXRay,
      }),
    [isXRay]
  );

  const finishColorHex = useMemo(() => {
    if (!equipment.finish || !elMeta?.options?.finishes) return null;
    return elMeta.options.finishes.find((f) => f.label === equipment.finish)?.color || null;
  }, [equipment.finish, elMeta]);

  return (
    <group
      position={equipment.position}
      rotation={equipment.rotation}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedEntity({ type: "equipment", id: equipment.id });
      }}
    >
      {isSelected && (
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry
            args={[
              (elMeta?.dimensions?.width || 1.1) + 0.18,
              (elMeta?.dimensions?.height || 1.1) + 0.18,
              (elMeta?.dimensions?.depth || 1.1) + 0.18,
            ]}
          />
          <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.8} />
        </mesh>
      )}

      {/* Custom Admin/AI Primitives Renderer for any non-builtin or edited module */}
      {!isBuiltin && (
        <DynamicPrimitivesMesh
          primitives={customPrimitives || []}
          isXRay={isXRay}
          dayNight={dayNight}
          imageUrl={elMeta?.imageUrl}
          fallbackDims={elMeta?.dimensions}
        />
      )}

      {/* 1. AC SPLIT INVERTER */}
      {isBuiltin && equipment.type === "AC_SPLIT_INVERTER" && (
        <group>
          <group position={[0, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.92, 0.3, 0.22]} />
              <meshStandardMaterial
                color={finishColorHex || (equipment.finish === "Titanium Matte Grey" ? "#475569" : "#f8fafc")}
                metalness={0.1}
                roughness={0.2}
              />
            </mesh>
            <mesh position={[0, -0.11, 0.08]} rotation={[0.2, 0, 0]}>
              <boxGeometry args={[0.86, 0.04, 0.06]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0.3, 0.02, 0.112]}>
              <planeGeometry args={[0.08, 0.03]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          </group>
          <group position={[0, -0.8, -0.6]}>
            <mesh castShadow>
              <boxGeometry args={[0.82, 0.62, 0.34]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.4} roughness={0.4} />
            </mesh>
            <mesh position={[-0.12, 0, 0.172]}>
              <cylinderGeometry args={[0.22, 0.22, 0.02, 24]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0.32, -0.15, 0.15]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.018, 0.018, 0.2, 12]} />
              <meshStandardMaterial color="#b45309" metalness={0.9} roughness={0.3} />
            </mesh>
          </group>
        </group>
      )}

      {/* 2. SOLAR ARRAY ROOF */}
      {isBuiltin && equipment.type === "SOLAR_ARRAY_ROOF" && (
        <group>
          <mesh position={[0, 0.03, 0]} material={darkSteelMat} castShadow>
            <boxGeometry args={[3.3, 0.06, 2.1]} />
          </mesh>
          {[-1.05, 0, 1.05].map((xPos, idx) => (
            <group key={`solar-row-${idx}`} position={[xPos, 0.25, 0]} rotation={[0.35, 0, 0]}>
              <mesh material={metalMat} castShadow>
                <boxGeometry args={[0.98, 0.04, 1.9]} />
              </mesh>
              <mesh position={[0, 0.025, 0]} castShadow>
                <boxGeometry args={[0.92, 0.01, 1.84]} />
                <meshPhysicalMaterial
                  color={isXRay ? "#38bdf8" : "#071426"}
                  roughness={0.12}
                  metalness={0.8}
                  clearcoat={1.0}
                  clearcoatRoughness={0.1}
                  wireframe={isXRay}
                />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* 3. WATER TANK OVERHEAD */}
      {isBuiltin && equipment.type === "WATER_TANK_OVERHEAD" && (
        <group>
          <group position={[0, 0.18, 0]}>
            {[-0.45, 0.45].map((x) =>
              [-0.45, 0.45].map((z) => (
                <mesh key={`leg-${x}-${z}`} position={[x, 0, z]} material={darkSteelMat} castShadow>
                  <boxGeometry args={[0.06, 0.36, 0.06]} />
                </mesh>
              ))
            )}
            <mesh position={[0, 0.18, 0]} material={darkSteelMat} castShadow>
              <boxGeometry args={[1.1, 0.05, 1.1]} />
            </mesh>
          </group>
          <group position={[0, 0.95, 0]}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.52, 0.52, 1.15, 24]} />
              <meshStandardMaterial color={finishColorHex || "#c2a67a"} roughness={0.6} metalness={0.05} />
            </mesh>
            {[-0.3, 0, 0.3].map((y, idx) => (
              <mesh key={`rib-${idx}`} position={[0, y, 0]}>
                <cylinderGeometry args={[0.535, 0.535, 0.05, 24]} />
                <meshStandardMaterial color="#b3966b" roughness={0.65} />
              </mesh>
            ))}
            <mesh position={[0, 0.62, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.22, 0.1, 16]} />
              <meshStandardMaterial color="#181a1d" roughness={0.5} />
            </mesh>
          </group>
        </group>
      )}

      {/* 4. STAIRS EXTERNAL */}
      {isBuiltin && equipment.type === "STAIRS_EXTERNAL" && (
        <group>
          <mesh position={[-0.55, 1.4, 0]} rotation={[0.68, 0, 0]} material={darkSteelMat} castShadow>
            <boxGeometry args={[0.08, 3.8, 0.22]} />
          </mesh>
          <mesh position={[0.55, 1.4, 0]} rotation={[0.68, 0, 0]} material={darkSteelMat} castShadow>
            <boxGeometry args={[0.08, 3.8, 0.22]} />
          </mesh>
          {Array.from({ length: 11 }).map((_, idx) => {
            const stepY = (idx + 1) * 0.24;
            const stepZ = 1.4 - idx * 0.26;
            return (
              <mesh key={`tread-${idx}`} position={[0, stepY, stepZ]} material={metalMat} castShadow receiveShadow>
                <boxGeometry args={[1.08, 0.04, 0.24]} />
              </mesh>
            );
          })}
          <mesh position={[0, 2.75, -1.5]} material={metalMat} castShadow receiveShadow>
            <boxGeometry args={[1.25, 0.08, 1.1]} />
          </mesh>
          <mesh position={[0.58, 1.9, 0]} rotation={[0.68, 0, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 3.8, 8]} />
            <meshStandardMaterial color={finishColorHex || "#eab308"} roughness={0.4} metalness={0.5} />
          </mesh>
          <mesh position={[-0.58, 1.9, 0]} rotation={[0.68, 0, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 3.8, 8]} />
            <meshStandardMaterial color={finishColorHex || "#eab308"} roughness={0.4} metalness={0.5} />
          </mesh>
        </group>
      )}

      {/* 5. WASHROOM POD */}
      {isBuiltin && equipment.type === "WASHROOM_POD" && (
        <group>
          <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.4, 0.1, 1.8]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
          </mesh>
          <mesh position={[-0.66, 1.15, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.06, 2.2, 1.8]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.15, -0.86]} castShadow receiveShadow>
            <boxGeometry args={[1.4, 2.2, 0.06]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.6} />
          </mesh>
          <group position={[-0.35, 0.45, -0.45]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.18, 0.16, 0.4, 16]} />
              <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.1} />
            </mesh>
            <mesh position={[0, 0.25, -0.18]}>
              <boxGeometry args={[0.38, 0.35, 0.14]} />
              <meshStandardMaterial color="#ffffff" roughness={0.1} />
            </mesh>
          </group>
          <group position={[0.35, 0.85, -0.5]}>
            <mesh castShadow>
              <boxGeometry args={[0.5, 0.12, 0.4]} />
              <meshStandardMaterial color="#ffffff" roughness={0.1} />
            </mesh>
            <mesh position={[0, 0.55, -0.19]}>
              <planeGeometry args={[0.45, 0.65]} />
              <meshPhysicalMaterial color="#a5f3fc" roughness={0.05} metalness={0.9} />
            </mesh>
          </group>
          <mesh position={[0.15, 1.1, 0.45]}>
            <boxGeometry args={[0.02, 2.0, 0.85]} />
            <meshPhysicalMaterial color="#cffafe" transmission={0.85} roughness={0.05} transparent opacity={0.4} />
          </mesh>
        </group>
      )}

      {/* 6. DESK SET OFFICE */}
      {isBuiltin && equipment.type === "DESK_SET_OFFICE" && (
        <group>
          <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.6, 0.05, 1.1]} />
            <meshStandardMaterial color={finishColorHex || "#a3704c"} roughness={0.5} metalness={0.05} />
          </mesh>
          {[-0.72, 0.72].map((x) =>
            [-0.48, 0.48].map((z) => (
              <mesh key={`desk-leg-${x}-${z}`} position={[x, 0.36, z]} material={darkSteelMat}>
                <boxGeometry args={[0.05, 0.7, 0.05]} />
              </mesh>
            ))
          )}
          {[-0.35, 0.35].map((x, idx) => (
            <group key={`monitor-${idx}`} position={[x, 1.02, -0.2]}>
              <mesh castShadow>
                <boxGeometry args={[0.56, 0.34, 0.03]} />
                <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
              </mesh>
              <mesh position={[0, 0, 0.016]}>
                <planeGeometry args={[0.54, 0.32]} />
                <meshBasicMaterial color="#0284c7" />
              </mesh>
              <mesh position={[0, -0.22, 0]} material={darkSteelMat}>
                <cylinderGeometry args={[0.02, 0.02, 0.22, 12]} />
              </mesh>
            </group>
          ))}
          <group position={[0, 0.45, 0.7]}>
            <mesh castShadow>
              <boxGeometry args={[0.48, 0.08, 0.48]} />
              <meshStandardMaterial color="#1e293b" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.38, 0.22]} rotation={[-0.1, 0, 0]} castShadow>
              <boxGeometry args={[0.44, 0.58, 0.04]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>
            <mesh position={[0, -0.25, 0]} material={darkSteelMat}>
              <cylinderGeometry args={[0.03, 0.24, 0.38, 12]} />
            </mesh>
          </group>
        </group>
      )}

      {/* 7. LED CEILING PANEL */}
      {isBuiltin && equipment.type === "LED_CEILING_PANEL" && (
        <group>
          <mesh castShadow>
            <boxGeometry args={[0.62, 0.03, 0.62]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.018, 0]}>
            <planeGeometry args={[0.58, 0.58]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#fffaed"
              emissiveIntensity={isNight ? 2.5 : 1.2}
              roughness={0.1}
            />
          </mesh>
          <pointLight
            color="#fff8e7"
            intensity={isNight ? 2.4 : 1.0}
            distance={7}
            decay={2}
            position={[0, -0.2, 0]}
          />
        </group>
      )}

      {/* 8. CCTV CAMERA */}
      {isBuiltin && equipment.type === "CCTV_CAMERA" && (
        <group>
          <mesh material={metalMat} castShadow>
            <boxGeometry args={[0.08, 0.12, 0.14]} />
          </mesh>
          <group position={[0, -0.08, 0.12]}>
            <mesh castShadow>
              <sphereGeometry args={[0.07, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#1e293b" metalness={0.3} roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.02, 0]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshPhysicalMaterial
                color="#0f172a"
                transmission={0.8}
                roughness={0.05}
                ior={1.49}
              />
            </mesh>
            <mesh position={[0.03, 0.04, 0.05]}>
              <sphereGeometry args={[0.008, 8, 8]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
};
