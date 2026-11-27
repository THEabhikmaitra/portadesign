"use client";

import React, { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { ThreePrimitive } from "@/types";
import { useSafeTexture } from "@/lib/safeTexture";

interface AdminMini3DPreviewProps {
  mode: "element" | "attribute";
  primitives?: ThreePrimitive[];
  imageUrl?: string | null;
  shader?: {
    color?: string;
    roughness?: number;
    metalness?: number;
    transmission?: number;
    ior?: number;
    clearcoat?: number;
    opacity?: number;
    transparent?: boolean;
  };
  textureUrl?: string | null;
}

const AttributeSphere: React.FC<{
  shader: AdminMini3DPreviewProps["shader"];
  textureUrl?: string | null;
}> = ({ shader, textureUrl }) => {
  const tex = useSafeTexture(textureUrl);
  const mat = useMemo(() => {
    if ((shader?.transmission ?? 0) > 0.05) {
      return new THREE.MeshPhysicalMaterial({
        color: shader?.color || "#ffffff",
        roughness: shader?.roughness ?? 0.05,
        metalness: shader?.metalness ?? 0.05,
        transmission: shader?.transmission ?? 0.85,
        ior: shader?.ior ?? 1.5,
        clearcoat: shader?.clearcoat ?? 1.0,
        transparent: true,
        opacity: shader?.opacity ?? 0.65,
      });
    }
    return new THREE.MeshStandardMaterial({
      color: shader?.color || "#475569",
      roughness: shader?.roughness ?? 0.45,
      metalness: shader?.metalness ?? 0.25,
      map: tex || null,
    });
  }, [shader, tex]);

  return (
    <mesh material={mat} castShadow>
      <sphereGeometry args={[0.95, 32, 32]} />
    </mesh>
  );
};

const ElementPrimitivesPreview: React.FC<{
  primitives: ThreePrimitive[];
  imageUrl?: string | null;
}> = ({ primitives, imageUrl }) => {
  const imageTex = useSafeTexture(imageUrl);

  if (!primitives || primitives.length === 0) {
    return (
      <group>
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[1, 0.8, 0.7]} />
          <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.35} />
        </mesh>
        {imageTex && (
          <mesh position={[0, 0.4, 0.36]}>
            <planeGeometry args={[0.7, 0.6]} />
            <meshBasicMaterial map={imageTex} transparent />
          </mesh>
        )}
      </group>
    );
  }

  return (
    <group position={[0, -0.35, 0]}>
      {primitives.map((p, idx) => (
        <mesh
          key={p.id || idx}
          position={p.position || [0, 0, 0]}
          rotation={p.rotation || [0, 0, 0]}
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
          <meshStandardMaterial
            color={p.color || "#94a3b8"}
            roughness={p.roughness ?? 0.4}
            metalness={p.metalness ?? 0.35}
            emissive={p.emissive || "#000000"}
            emissiveIntensity={p.emissiveIntensity || 0}
          />
        </mesh>
      ))}
    </group>
  );
};

export const AdminMini3DPreview: React.FC<AdminMini3DPreviewProps> = ({
  mode,
  primitives = [],
  imageUrl,
  shader,
  textureUrl,
}) => {
  return (
    <div className="w-full h-44 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative">
      <Canvas camera={{ position: [2.1, 1.6, 2.3], fov: 42 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.9} />
          <directionalLight position={[4, 6, 4]} intensity={1.4} />
          <directionalLight position={[-3, 2, -2]} intensity={0.45} />
          <gridHelper args={[6, 12, "#1e293b", "#0f172a"]} position={[0, -0.45, 0]} />
          {mode === "attribute" ? (
            <AttributeSphere shader={shader} textureUrl={textureUrl} />
          ) : (
            <ElementPrimitivesPreview primitives={primitives} imageUrl={imageUrl} />
          )}
          <OrbitControls enableZoom autoRotate autoRotateSpeed={1.6} />
        </Suspense>
      </Canvas>
      <div className="absolute bottom-1.5 right-2 text-[9px] font-mono text-slate-400 pointer-events-none">
        Live 3D Preview
      </div>
    </div>
  );
};
