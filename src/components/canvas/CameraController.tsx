"use client";

import React, { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { CameraMode } from "@/types";

interface CameraControllerProps {
  mode: CameraMode;
}

export const CameraController: React.FC<CameraControllerProps> = ({ mode }) => {
  const { camera, gl } = useThree();
  const orbitRef = useRef<any>(null);

  // First-Person Walkthrough State
  const keys = useRef<{ [key: string]: boolean }>({});
  const moveSpeed = 0.12;

  // Handle Mode Transitions
  useEffect(() => {
    if (!orbitRef.current) return;

    if (mode === "orbit") {
      orbitRef.current.enabled = true;
      camera.position.set(10, 8, 12);
      orbitRef.current.target.set(0, 1.5, 0);
      orbitRef.current.maxPolarAngle = Math.PI / 2 + 0.05; // Prevent dipping beneath ground
      orbitRef.current.minDistance = 2;
      orbitRef.current.maxDistance = 35;
    } else if (mode === "cutaway") {
      // Elevated Dollhouse 45-degree angle
      orbitRef.current.enabled = true;
      camera.position.set(8, 12, 10);
      orbitRef.current.target.set(0, 1.2, 0);
      orbitRef.current.maxPolarAngle = Math.PI / 2 - 0.1;
    } else if (mode === "xray") {
      orbitRef.current.enabled = true;
      camera.position.set(10, 6, 10);
      orbitRef.current.target.set(0, 1.3, 0);
    } else if (mode === "firstperson") {
      // Step inside the cabin interior
      orbitRef.current.enabled = false;
      camera.position.set(0, 1.45, 0); // eye level 1.45m inside cabin
      camera.lookAt(2, 1.45, 0);
    }
  }, [mode, camera]);

  // First-Person Keyboard Event Listeners
  useEffect(() => {
    if (mode !== "firstperson") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [mode]);

  // First-Person Frame Update (WASD movement)
  useFrame(() => {
    if (mode !== "firstperson") return;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(camera.up, forward).negate().normalize();

    if (keys.current["keyw"] || keys.current["arrowup"]) {
      camera.position.addScaledVector(forward, moveSpeed);
    }
    if (keys.current["keys"] || keys.current["arrowdown"]) {
      camera.position.addScaledVector(forward, -moveSpeed);
    }
    if (keys.current["keya"] || keys.current["arrowleft"]) {
      camera.position.addScaledVector(right, -moveSpeed);
    }
    if (keys.current["keyd"] || keys.current["arrowright"]) {
      camera.position.addScaledVector(right, moveSpeed);
    }

    // Keep eye level locked inside container module
    camera.position.y = 1.45;
  });

  return (
    <OrbitControls
      ref={orbitRef}
      makeDefault
      enableDamping
      dampingFactor={0.06}
    />
  );
};
