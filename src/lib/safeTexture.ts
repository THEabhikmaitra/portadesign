"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";

export function useSafeTexture(url?: string | null): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!url) {
      setTexture(null);
      return;
    }

    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (loaded) => {
        if (!cancelled) {
          loaded.colorSpace = THREE.SRGBColorSpace;
          loaded.needsUpdate = true;
          setTexture(loaded);
        } else {
          loaded.dispose();
        }
      },
      undefined,
      () => {
        if (!cancelled) setTexture(null);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [url]);

  return texture;
}
