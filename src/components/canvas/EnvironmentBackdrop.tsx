"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { EnvironmentType } from "@/types";
import { proceduralTextures } from "@/lib/proceduralTextures";

interface EnvironmentBackdropProps {
  environment: EnvironmentType;
  dayNight: "day" | "night";
}

export const EnvironmentBackdrop: React.FC<EnvironmentBackdropProps> = ({
  environment,
  dayNight,
}) => {
  const isNight = dayNight === "night";

  // Procedural Ground & Sky Textures (100% Offline, Zero Cloud Dependencies)
  const groundTexture = useMemo(
    () => proceduralTextures.getGroundTexture(environment),
    [environment]
  );

  const skyTexture = useMemo(
    () => proceduralTextures.getSkyTexture(environment, isNight),
    [environment, isNight]
  );

  // Lighting Colors tailored to environment
  const envLightConfig = useMemo(() => {
    if (isNight) {
      return {
        ambient: "#091220",
        ambientIntensity: 0.45,
        sunColor: "#93c5fd",
        sunIntensity: 0.6,
        sunPos: [15, 25, -20] as [number, number, number],
      };
    }

    switch (environment) {
      case "desert":
        return {
          ambient: "#f5e6d3",
          ambientIntensity: 0.85,
          sunColor: "#fff4e0",
          sunIntensity: 2.2,
          sunPos: [20, 30, 15] as [number, number, number],
        };
      case "beach":
        return {
          ambient: "#dbeef8",
          ambientIntensity: 0.9,
          sunColor: "#fffbf0",
          sunIntensity: 2.4,
          sunPos: [25, 28, 20] as [number, number, number],
        };
      case "urban":
        return {
          ambient: "#cbd5e1",
          ambientIntensity: 0.8,
          sunColor: "#fffaed",
          sunIntensity: 2.0,
          sunPos: [18, 32, 10] as [number, number, number],
        };
      case "forest":
      default:
        return {
          ambient: "#d1e7dd",
          ambientIntensity: 0.85,
          sunColor: "#fef9e7",
          sunIntensity: 2.1,
          sunPos: [15, 28, 18] as [number, number, number],
        };
    }
  }, [environment, isNight]);

  return (
    <group>
      {/* 1. Procedural Sky Dome Sphere */}
      <mesh>
        <sphereGeometry args={[180, 32, 32]} />
        <meshBasicMaterial map={skyTexture} side={THREE.BackSide} />
      </mesh>

      {/* 2. Natural Ambient & Key Directional Sunlight */}
      <ambientLight
        color={envLightConfig.ambient}
        intensity={envLightConfig.ambientIntensity}
      />
      <directionalLight
        position={envLightConfig.sunPos}
        intensity={envLightConfig.sunIntensity}
        color={envLightConfig.sunColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={80}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0001}
      />

      {/* Soft Ground Bounce Fill Light */}
      <directionalLight
        position={[-15, -10, -15]}
        intensity={isNight ? 0.15 : 0.4}
        color={environment === "desert" ? "#e6c8a0" : "#a7c7e7"}
      />

      {/* 3. Infinite Ground Plane with PBR Material */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial
          map={groundTexture}
          roughness={environment === "beach" ? 0.85 : 0.92}
          metalness={0.05}
        />
      </mesh>

      {/* Subtle Home Plot Border Marker (replaces harsh CAD wireframe grid) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[6.8, 6.95, 64]} />
        <meshBasicMaterial
          color={isNight ? "#38bdf8" : "#ffffff"}
          transparent
          opacity={isNight ? 0.25 : 0.22}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Subtle 20x8 ft Pad Indicator */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} receiveShadow>
        <planeGeometry args={[6.4, 2.8]} />
        <meshStandardMaterial
          color={environment === "urban" ? "#475569" : "#334155"}
          transparent
          opacity={0.18}
          roughness={0.9}
        />
      </mesh>

      {/* 4. Decorative Environment Props for Immersion */}
      {/* Desert: Distant Sand Dunes */}
      {environment === "desert" && (
        <group>
          {[-40, 35, -25].map((x, idx) => (
            <mesh
              key={`dune-${idx}`}
              position={[x, -0.5, idx % 2 === 0 ? -45 : 45]}
              scale={[18, 4, 18]}
            >
              <sphereGeometry args={[1, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#cbb18d" roughness={0.95} />
            </mesh>
          ))}
        </group>
      )}

      {/* Coastal Beach: Ocean Horizon Water Strip */}
      {environment === "beach" && (
        <group position={[0, -0.2, -60]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[180, 50]} />
            <meshStandardMaterial
              color="#0284c7"
              roughness={0.1}
              metalness={0.8}
            />
          </mesh>
        </group>
      )}

      {/* Urban Rooftop: Concrete Parapet Edge & Distant Skyline */}
      {environment === "urban" && (
        <group>
          <mesh position={[0, 0.4, -18]} castShadow receiveShadow>
            <boxGeometry args={[42, 0.8, 0.4]} />
            <meshStandardMaterial color="#334155" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.4, 18]} castShadow receiveShadow>
            <boxGeometry args={[42, 0.8, 0.4]} />
            <meshStandardMaterial color="#334155" roughness={0.7} />
          </mesh>
          {[-35, -20, 20, 35].map((x, idx) => (
            <mesh key={`bldg-${idx}`} position={[x, 10, -50]}>
              <boxGeometry args={[8 + (idx % 3) * 3, 20 + (idx % 2) * 8, 8]} />
              <meshStandardMaterial color="#1e293b" roughness={0.8} />
            </mesh>
          ))}
        </group>
      )}

      {/* Forest: Procedural Pine Conifer Trees */}
      {environment === "forest" && (
        <group>
          {[
            [-18, 0, -14],
            [19, 0, -16],
            [-22, 0, 15],
            [20, 0, 14],
            [-14, 0, -25],
            [16, 0, 24],
          ].map((pos, idx) => (
            <group key={`tree-${idx}`} position={pos as [number, number, number]}>
              <mesh position={[0, 1.2, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.3, 2.4, 8]} />
                <meshStandardMaterial color="#422a1d" roughness={0.9} />
              </mesh>
              <mesh position={[0, 3.2, 0]} castShadow>
                <coneGeometry args={[1.8, 2.8, 8]} />
                <meshStandardMaterial color="#1b4332" roughness={0.8} />
              </mesh>
              <mesh position={[0, 4.6, 0]} castShadow>
                <coneGeometry args={[1.3, 2.2, 8]} />
                <meshStandardMaterial color="#2d6a4f" roughness={0.8} />
              </mesh>
            </group>
          ))}
        </group>
      )}
    </group>
  );
};
