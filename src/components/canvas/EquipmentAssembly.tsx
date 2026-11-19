"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { EquipmentConfig } from "@/types";
import { useStudioStore } from "@/store/useStudioStore";

interface EquipmentAssemblyProps {
  equipment: EquipmentConfig;
  cameraMode: string;
  dayNight: "day" | "night";
}

export const EquipmentAssembly: React.FC<EquipmentAssemblyProps> = ({
  equipment,
  cameraMode,
  dayNight,
}) => {
  const selectedEntity = useStudioStore((state) => state.selectedEntity);
  const setSelectedEntity = useStudioStore((state) => state.setSelectedEntity);

  const isSelected = selectedEntity?.type === "equipment" && selectedEntity?.id === equipment.id;
  const isXRay = cameraMode === "xray";

  const isNight = dayNight === "night";

  // Shared Materials
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

  return (
    <group
      position={equipment.position}
      rotation={equipment.rotation}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedEntity({ type: "equipment", id: equipment.id });
      }}
    >
      {/* Selection Green Highlight Box */}
      {isSelected && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.8} />
        </mesh>
      )}

      {/* 1. AC SPLIT INVERTER: Paired Indoor Blower + Outdoor Condenser */}
      {equipment.type === "AC_SPLIT_INVERTER" && (
        <group>
          {/* Indoor Blower Unit (Mounted Inside Wall) */}
          <group position={[0, 0, 0]}>
            {/* Main Blower Body */}
            <mesh castShadow>
              <boxGeometry args={[0.92, 0.3, 0.22]} />
              <meshStandardMaterial
                color={equipment.finish === "Titanium Matte Grey" ? "#475569" : "#f8fafc"}
                metalness={0.1}
                roughness={0.2}
              />
            </mesh>
            {/* Bottom Air Louver */}
            <mesh position={[0, -0.11, 0.08]} rotation={[0.2, 0, 0]}>
              <boxGeometry args={[0.86, 0.04, 0.06]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            {/* LED Temp Display (Glows Cool Blue) */}
            <mesh position={[0.3, 0.02, 0.112]}>
              <planeGeometry args={[0.08, 0.03]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          </group>

          {/* Exterior Outdoor Condenser Unit (Automatically placed outside on exterior bracket) */}
          <group position={[0, -0.8, -0.6]}>
            {/* Outdoor Cabinet */}
            <mesh castShadow>
              <boxGeometry args={[0.82, 0.62, 0.34]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.4} roughness={0.4} />
            </mesh>
            {/* Front Fan Circular Grill */}
            <mesh position={[-0.12, 0, 0.172]}>
              <cylinderGeometry args={[0.22, 0.22, 0.02, 24]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Copper Pipe Connection */}
            <mesh position={[0.32, -0.15, 0.15]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.018, 0.018, 0.2, 12]} />
              <meshStandardMaterial color="#b45309" metalness={0.9} roughness={0.3} />
            </mesh>
          </group>
        </group>
      )}

      {/* 2. SOLAR ARRAY ROOFTOP: 6 Monocrystalline Bifacial Panels on Rack */}
      {equipment.type === "SOLAR_ARRAY_ROOF" && (
        <group>
          {/* Anodized Aluminum Support Racking Frame */}
          <mesh position={[0, 0.06, 0]} material={metalMat} castShadow>
            <boxGeometry args={[3.3, 0.08, 2.1]} />
          </mesh>
          {/* 4 Corner Stanchion Legs */}
          {[-1.5, 1.5].map((x) =>
            [-0.9, 0.9].map((z) => (
              <mesh key={`solar-leg-${x}-${z}`} position={[x, -0.1, z]} material={metalMat}>
                <boxGeometry args={[0.08, 0.24, 0.08]} />
              </mesh>
            ))
          )}

          {/* 6 High-Efficiency PV Modules (Tilted 15 degrees for sun capture) */}
          <group position={[0, 0.12, 0]} rotation={[-0.15, 0, 0]}>
            {[-1.05, 0, 1.05].map((x, colIdx) =>
              [-0.5, 0.5].map((z, rowIdx) => (
                <group key={`pv-${colIdx}-${rowIdx}`} position={[x, 0, z]}>
                  {/* Panel Aluminum Outer Bezel */}
                  <mesh castShadow receiveShadow>
                    <boxGeometry args={[0.98, 0.035, 0.96]} />
                    <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
                  </mesh>
                  {/* Monocrystalline Deep Navy Photovoltaic Silicon Cell */}
                  <mesh position={[0, 0.02, 0]}>
                    <planeGeometry args={[0.94, 0.92]} />
                    <meshPhysicalMaterial
                      color="#0c1930"
                      metalness={0.7}
                      roughness={0.15}
                      clearcoat={1.0}
                      reflectivity={0.9}
                    />
                  </mesh>
                </group>
              ))
            )}
          </group>
        </group>
      )}

      {/* 3. OVERHEAD WATER TANK: 1000L Corrugated Cylinder on Steel Tower */}
      {equipment.type === "WATER_TANK_OVERHEAD" && (
        <group>
          {/* Galvanized 4-Leg Angle Iron Elevation Stand */}
          <group position={[0, 0.4, 0]}>
            {[-0.5, 0.5].map((x) =>
              [-0.5, 0.5].map((z) => (
                <mesh key={`tank-leg-${x}-${z}`} position={[x, 0, z]} material={metalMat}>
                  <boxGeometry args={[0.06, 0.8, 0.06]} />
                </mesh>
              ))
            )}
            {/* Stand Cross Braces */}
            <mesh position={[0, 0.38, 0]} material={metalMat}>
              <boxGeometry args={[1.1, 0.04, 1.1]} />
            </mesh>
          </group>

          {/* Cylindrical HDPE Tank */}
          <group position={[0, 1.35, 0]}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.55, 0.55, 1.1, 32]} />
              <meshStandardMaterial
                color={
                  equipment.finish === "Jet Black UV Shield"
                    ? "#181a1d"
                    : equipment.finish === "Cool White"
                    ? "#f1f5f9"
                    : "#c2a67a"
                }
                roughness={0.4}
                metalness={0.05}
              />
            </mesh>
            {/* 3 Rib Rings */}
            {[-0.3, 0, 0.3].map((y) => (
              <mesh key={`ring-${y}`} position={[0, y, 0]}>
                <torusGeometry args={[0.56, 0.02, 12, 32]} />
                <meshStandardMaterial color="#0f172a" roughness={0.5} />
              </mesh>
            ))}
            {/* Threaded Manhole Lid */}
            <mesh position={[0, 0.58, 0]}>
              <cylinderGeometry args={[0.22, 0.22, 0.08, 24]} />
              <meshStandardMaterial color="#0f172a" roughness={0.3} />
            </mesh>
          </group>
        </group>
      )}

      {/* 4. EXTERNAL STEEL STAIRCASE: Galvanized Stringers, Perforated Treads & Handrails */}
      {equipment.type === "STAIRS_EXTERNAL" && (
        <group>
          {/* Staircase Inclined Stringers */}
          <mesh position={[-0.5, 1.35, 0]} rotation={[0.65, 0, 0]} material={darkSteelMat} castShadow>
            <boxGeometry args={[0.06, 3.4, 0.2]} />
          </mesh>
          <mesh position={[0.5, 1.35, 0]} rotation={[0.65, 0, 0]} material={darkSteelMat} castShadow>
            <boxGeometry args={[0.06, 3.4, 0.2]} />
          </mesh>

          {/* 10 Anti-Slip Checker Plate Steps */}
          {Array.from({ length: 10 }).map((_, idx) => {
            const y = 0.25 + idx * 0.25;
            const z = 1.3 - idx * 0.26;
            return (
              <mesh key={`step-${idx}`} position={[0, y, z]} material={metalMat} castShadow receiveShadow>
                <boxGeometry args={[0.96, 0.04, 0.28]} />
              </mesh>
            );
          })}

          {/* Upper Landing Platform (Connects to 2nd Story Cabin Door) */}
          <group position={[0, 2.65, -1.5]}>
            <mesh material={metalMat} castShadow receiveShadow>
              <boxGeometry args={[1.2, 0.06, 1.2]} />
            </mesh>
            {/* Safety Railing on Landing */}
            <mesh position={[0.58, 0.5, 0]} material={metalMat}>
              <boxGeometry args={[0.04, 1.0, 1.2]} />
            </mesh>
            <mesh position={[-0.58, 0.5, 0]} material={metalMat}>
              <boxGeometry args={[0.04, 1.0, 1.2]} />
            </mesh>
          </group>
        </group>
      )}

      {/* 5. MODULAR WASHROOM POD: Ensuite Toilet, Vanity & Plumbing Fixtures */}
      {equipment.type === "WASHROOM_POD" && (
        <group>
          {/* Outer Partition Box */}
          <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.4, 2.3, 1.8]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.05} />
          </mesh>
          {/* Frosted Privacy Door */}
          <mesh position={[0, 1.0, 0.91]}>
            <boxGeometry args={[0.75, 1.95, 0.04]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
          </mesh>
          {/* Wall-Hung Ceramic WC (Interior) */}
          <mesh position={[-0.35, 0.45, 0]} castShadow>
            <boxGeometry args={[0.38, 0.38, 0.54]} />
            <meshStandardMaterial color="#ffffff" roughness={0.1} />
          </mesh>
          {/* Vanity Sink Counter */}
          <mesh position={[0.35, 0.85, 0]} castShadow>
            <boxGeometry args={[0.45, 0.1, 0.6]} />
            <meshStandardMaterial color="#334155" roughness={0.2} />
          </mesh>
        </group>
      )}

      {/* 6. OFFICE DESK SET: Executive Workstation & Ergonomic Mesh Chairs */}
      {equipment.type === "DESK_SET_OFFICE" && (
        <group>
          {/* Scratch-Resistant Laminate Desktop */}
          <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.6, 0.04, 1.1]} />
            <meshStandardMaterial
              color={
                equipment.finish === "Nordic Smoked Walnut"
                  ? "#382923"
                  : equipment.finish === "Minimalist Concrete Grey"
                  ? "#64748b"
                  : "#a3704c"
              }
              roughness={0.3}
              metalness={0.05}
            />
          </mesh>
          {/* 4 Metal Legs */}
          {[-0.72, 0.72].map((x) =>
            [-0.48, 0.48].map((z) => (
              <mesh key={`desk-leg-${x}-${z}`} position={[x, 0.36, z]} material={darkSteelMat}>
                <boxGeometry args={[0.05, 0.7, 0.05]} />
              </mesh>
            ))
          )}
          {/* Dual Monitor Displays */}
          {[-0.35, 0.35].map((x, idx) => (
            <group key={`monitor-${idx}`} position={[x, 1.02, -0.2]}>
              <mesh castShadow>
                <boxGeometry args={[0.56, 0.34, 0.03]} />
                <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
              </mesh>
              {/* Screen Glow */}
              <mesh position={[0, 0, 0.016]}>
                <planeGeometry args={[0.54, 0.32]} />
                <meshBasicMaterial color="#0284c7" />
              </mesh>
              <mesh position={[0, -0.22, 0]} material={darkSteelMat}>
                <cylinderGeometry args={[0.02, 0.02, 0.22, 12]} />
              </mesh>
            </group>
          ))}
          {/* Ergonomic Task Chair */}
          <group position={[0, 0.45, 0.7]}>
            {/* Seat Cushion */}
            <mesh castShadow>
              <boxGeometry args={[0.48, 0.08, 0.48]} />
              <meshStandardMaterial color="#1e293b" roughness={0.7} />
            </mesh>
            {/* Mesh High Backrest */}
            <mesh position={[0, 0.38, 0.22]} rotation={[-0.1, 0, 0]} castShadow>
              <boxGeometry args={[0.44, 0.58, 0.04]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>
            {/* 5-Star Pedestal Stand */}
            <mesh position={[0, -0.25, 0]} material={darkSteelMat}>
              <cylinderGeometry args={[0.03, 0.24, 0.38, 12]} />
            </mesh>
          </group>
        </group>
      )}

      {/* 7. LED CEILING PANEL: 36W Recessed Flush Luminaire */}
      {equipment.type === "LED_CEILING_PANEL" && (
        <group>
          {/* Aluminum Outer Flange */}
          <mesh castShadow>
            <boxGeometry args={[0.62, 0.03, 0.62]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Opal Diffuser Face (Glows Warm/Cool White) */}
          <mesh position={[0, -0.018, 0]}>
            <planeGeometry args={[0.58, 0.58]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#fffaed"
              emissiveIntensity={isNight ? 2.5 : 1.2}
              roughness={0.1}
            />
          </mesh>
          {/* Downward Photometric Lighting */}
          <pointLight
            color="#fff8e7"
            intensity={isNight ? 2.4 : 1.0}
            distance={7}
            decay={2}
            position={[0, -0.2, 0]}
          />
        </group>
      )}

      {/* 8. CCTV CAMERA: 4K Vandal Dome Camera with Status LED */}
      {equipment.type === "CCTV_CAMERA" && (
        <group>
          {/* Aluminum Wall Mount Arm */}
          <mesh material={metalMat} castShadow>
            <boxGeometry args={[0.08, 0.12, 0.14]} />
          </mesh>
          {/* Dome Housing */}
          <group position={[0, -0.08, 0.12]}>
            <mesh castShadow>
              <sphereGeometry args={[0.07, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#1e293b" metalness={0.3} roughness={0.2} />
            </mesh>
            {/* Transparent Acrylic Bubble */}
            <mesh position={[0, -0.02, 0]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshPhysicalMaterial
                color="#0f172a"
                transmission={0.8}
                roughness={0.05}
                ior={1.49}
              />
            </mesh>
            {/* Blinking Red/Green Security LED */}
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
