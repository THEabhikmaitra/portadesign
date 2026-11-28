"use client";

import React, { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { CabinConfig, CameraMode } from "@/types";
import { useStudioStore } from "@/store/useStudioStore";

interface CameraControllerProps {
  mode: CameraMode;
}

function getCabinBounds(cabins: CabinConfig[]) {
  if (!cabins.length) {
    return { minX: -2.6, maxX: 2.6, minZ: -0.9, maxZ: 0.9 };
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const c of cabins) {
    const len = c.type === "CABIN_40FT" ? 12.19 : 6.06;
    const wid = 2.44;
    const swapAxes = Math.abs(Math.sin(c.rotation?.[1] || 0)) > 0.7;
    const halfX = (swapAxes ? wid : len) / 2;
    const halfZ = (swapAxes ? len : wid) / 2;
    const [cx, , cz] = c.position;
    minX = Math.min(minX, cx - halfX + 0.35);
    maxX = Math.max(maxX, cx + halfX - 0.35);
    minZ = Math.min(minZ, cz - halfZ + 0.35);
    maxZ = Math.max(maxZ, cz + halfZ - 0.35);
  }
  return { minX, maxX, minZ, maxZ };
}

export const CameraController: React.FC<CameraControllerProps> = ({ mode }) => {
  const { camera, gl } = useThree();
  const orbitRef = useRef<any>(null);
  const firstCabinId = useStudioStore((s) => s.cabins[0]?.id ?? "");

  // First-Person Walkthrough & 360° Free-Look State
  const keys = useRef<{ [key: string]: boolean }>({});
  const yawPitch = useRef<{ yaw: number; pitch: number }>({ yaw: -Math.PI / 2, pitch: 0 });
  const isDragging = useRef(false);
  const lastPointer = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const eyeHeightRef = useRef(1.45);
  const moveSpeed = 0.08;
  const turnSpeed = 0.04;

  // Handle Mode & Room Transitions
  useEffect(() => {
    if (!orbitRef.current) return;

    const setFov = (nextFov: number) => {
      if (camera instanceof THREE.PerspectiveCamera && camera.fov !== nextFov) {
        camera.fov = nextFov;
        camera.updateProjectionMatrix();
      }
    };

    if (mode === "orbit") {
      setFov(45);
      orbitRef.current.enabled = true;
      camera.rotation.order = "XYZ";
      camera.position.set(10, 8, 12);
      orbitRef.current.target.set(0, 1.5, 0);
      orbitRef.current.minPolarAngle = 0.05;
      orbitRef.current.maxPolarAngle = Math.PI - 0.08;
      orbitRef.current.minAzimuthAngle = -Infinity;
      orbitRef.current.maxAzimuthAngle = Infinity;
      orbitRef.current.minDistance = 0.3;
      orbitRef.current.maxDistance = 40;
      orbitRef.current.update();
    } else if (mode === "cutaway") {
      setFov(45);
      orbitRef.current.enabled = true;
      camera.rotation.order = "XYZ";
      camera.position.set(8, 12, 10);
      orbitRef.current.target.set(0, 1.2, 0);
      orbitRef.current.minPolarAngle = 0.05;
      orbitRef.current.maxPolarAngle = Math.PI - 0.08;
      orbitRef.current.minAzimuthAngle = -Infinity;
      orbitRef.current.maxAzimuthAngle = Infinity;
      orbitRef.current.minDistance = 0.3;
      orbitRef.current.maxDistance = 40;
      orbitRef.current.update();
    } else if (mode === "xray") {
      setFov(45);
      orbitRef.current.enabled = true;
      camera.rotation.order = "XYZ";
      camera.position.set(10, 6, 10);
      orbitRef.current.target.set(0, 1.3, 0);
      orbitRef.current.minPolarAngle = 0.05;
      orbitRef.current.maxPolarAngle = Math.PI - 0.08;
      orbitRef.current.minAzimuthAngle = -Infinity;
      orbitRef.current.maxAzimuthAngle = Infinity;
      orbitRef.current.minDistance = 0.3;
      orbitRef.current.maxDistance = 40;
      orbitRef.current.update();
    } else if (mode === "firstperson") {
      // Wide-angle 70° interior lens for comfortable 360° all-angle inspection inside portacabin
      setFov(70);
      orbitRef.current.enabled = false;
      const primaryCabin = useStudioStore.getState().cabins[0];
      const cx = primaryCabin ? primaryCabin.position[0] - 0.9 : 0;
      const cy = primaryCabin ? primaryCabin.position[1] + 1.45 : 1.45;
      const cz = primaryCabin ? primaryCabin.position[2] : 0;

      eyeHeightRef.current = cy;
      camera.rotation.order = "YXZ";
      camera.position.set(cx, cy, cz);
      yawPitch.current = { yaw: -Math.PI / 2, pitch: 0 };
      camera.rotation.set(0, -Math.PI / 2, 0, "YXZ");
    }
  }, [mode, firstCabinId, camera]);

  // First-Person Pointer/Touch 360° Drag Look + Wheel FOV Zoom + Keyboard + HUD Nudge Listeners
  useEffect(() => {
    const dom = gl.domElement;
    if (mode !== "firstperson") {
      dom.style.cursor = "auto";
      return;
    }

    dom.style.cursor = "grab";
    dom.style.touchAction = "none";

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.button !== 2 && e.pointerType === "mouse") return;
      isDragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      dom.style.cursor = "grabbing";
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };

      const sensitivity = e.pointerType === "touch" ? 0.0085 : 0.0068;
      yawPitch.current.yaw += dx * sensitivity;
      yawPitch.current.pitch = Math.max(
        -Math.PI / 2 + 0.03,
        Math.min(Math.PI / 2 - 0.03, yawPitch.current.pitch + dy * sensitivity)
      );
    };

    const handlePointerUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      dom.style.cursor = "grab";
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = Math.max(48, Math.min(86, camera.fov + Math.sign(e.deltaY) * 3));
        camera.updateProjectionMatrix();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code.toLowerCase()] = false;
    };

    const handleLookNudge = (e: Event) => {
      const detail = (e as CustomEvent<{ dYaw?: number; dPitch?: number; reset?: boolean }>).detail;
      if (!detail) return;
      if (detail.reset) {
        const primaryCabin = useStudioStore.getState().cabins[0];
        camera.position.set(
          primaryCabin ? primaryCabin.position[0] - 0.9 : 0,
          eyeHeightRef.current,
          primaryCabin ? primaryCabin.position[2] : 0
        );
        yawPitch.current = { yaw: -Math.PI / 2, pitch: 0 };
        if (camera instanceof THREE.PerspectiveCamera) {
          camera.fov = 70;
          camera.updateProjectionMatrix();
        }
        return;
      }
      if (typeof detail.dYaw === "number") yawPitch.current.yaw += detail.dYaw;
      if (typeof detail.dPitch === "number") {
        yawPitch.current.pitch = Math.max(
          -Math.PI / 2 + 0.03,
          Math.min(Math.PI / 2 - 0.03, yawPitch.current.pitch + detail.dPitch)
        );
      }
    };

    dom.addEventListener("pointerdown", handlePointerDown);
    dom.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("myprefabroom:nudge-look", handleLookNudge);

    return () => {
      dom.style.cursor = "auto";
      isDragging.current = false;
      keys.current = {};
      dom.removeEventListener("pointerdown", handlePointerDown);
      dom.removeEventListener("wheel", handleWheel);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("myprefabroom:nudge-look", handleLookNudge);
    };
  }, [mode, camera, gl]);

  // Per-frame camera update
  useFrame(() => {
    if (mode !== "firstperson") {
      if (orbitRef.current) {
        // Dynamically allow steeper upward tilt as camera zooms inside, while never clipping below ground
        const dist = camera.position.distanceTo(orbitRef.current.target);
        const cosPhiFloor = Math.max(
          -0.996,
          Math.min(0.95, (0.25 - orbitRef.current.target.y) / Math.max(0.25, dist))
        );
        orbitRef.current.maxPolarAngle = Math.acos(cosPhiFloor);
      }
      return;
    }

    // Q / E keyboard yaw rotation for full 360° turning without mouse
    if (keys.current["keyq"]) {
      yawPitch.current.yaw += turnSpeed;
    }
    if (keys.current["keye"]) {
      yawPitch.current.yaw -= turnSpeed;
    }

    camera.rotation.set(yawPitch.current.pitch, yawPitch.current.yaw, 0, "YXZ");

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() > 0.0001) forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();

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

    // Keep user safely inside cabin walls so they never walk out blindly into grass
    const bounds = getCabinBounds(useStudioStore.getState().cabins);
    camera.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, camera.position.x));
    camera.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, camera.position.z));
    camera.position.y = eyeHeightRef.current;
  });

  return (
    <OrbitControls
      ref={orbitRef}
      enabled={mode !== "firstperson"}
      makeDefault
      enableDamping
      dampingFactor={0.06}
    />
  );
};
