import * as THREE from "three";

// 100% Offline Procedural Texture & Environment Generator
// Zero external network requests or CDN dependencies

class ProceduralTextureManager {
  private cache: Map<string, THREE.CanvasTexture> = new Map();

  // Procedural Wood Floor Planks
  public getWoodFloorTexture(): THREE.CanvasTexture {
    if (this.cache.has("wood_floor")) return this.cache.get("wood_floor")!;

    if (typeof document === "undefined") {
      return new THREE.CanvasTexture({} as any);
    }

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // Base warm wood tone
    ctx.fillStyle = "#8b5a2b";
    ctx.fillRect(0, 0, 512, 512);

    // Plank lines
    const plankHeight = 64;
    for (let y = 0; y < 512; y += plankHeight) {
      // Wood plank base variation
      const shade = Math.floor(130 + Math.random() * 25);
      ctx.fillStyle = `rgb(${shade}, ${Math.floor(shade * 0.65)}, ${Math.floor(shade * 0.35)})`;
      ctx.fillRect(0, y, 512, plankHeight - 2);

      // Wood grain lines
      for (let g = 0; g < 15; g++) {
        ctx.strokeStyle = "rgba(60, 30, 10, 0.08)";
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.beginPath();
        const gy = y + Math.random() * plankHeight;
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(170, gy + (Math.random() - 0.5) * 8, 340, gy + (Math.random() - 0.5) * 8, 512, gy);
        ctx.stroke();
      }

      // Plank separator groove
      ctx.fillStyle = "rgba(30, 15, 5, 0.6)";
      ctx.fillRect(0, y + plankHeight - 2, 512, 2);

      // Vertical plank staggered seams
      const offset = (y / plankHeight) % 2 === 0 ? 0 : 256;
      ctx.fillRect(offset + 180, y, 2, plankHeight);
      ctx.fillRect(offset + 420, y, 2, plankHeight);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 8);
    this.cache.set("wood_floor", texture);
    return texture;
  }

  // Corrugated Container Steel Normal / Height Map
  public getCorrugationBumpTexture(): THREE.CanvasTexture {
    if (this.cache.has("steel_corrugation")) return this.cache.get("steel_corrugation")!;

    if (typeof document === "undefined") {
      return new THREE.CanvasTexture({} as any);
    }

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    // Create wave corrugation ribs
    const numRibs = 16;
    const ribWidth = 256 / numRibs;

    for (let i = 0; i < numRibs; i++) {
      const grad = ctx.createLinearGradient(i * ribWidth, 0, (i + 1) * ribWidth, 0);
      grad.addColorStop(0, "#222222");
      grad.addColorStop(0.2, "#888888");
      grad.addColorStop(0.5, "#ffffff");
      grad.addColorStop(0.8, "#888888");
      grad.addColorStop(1, "#222222");

      ctx.fillStyle = grad;
      ctx.fillRect(i * ribWidth, 0, ribWidth, 256);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 1);
    this.cache.set("steel_corrugation", texture);
    return texture;
  }

  // Procedural Ground Textures: Sand, Beach, Urban Asphalt, Forest Moss
  public getGroundTexture(type: "desert" | "beach" | "urban" | "forest"): THREE.CanvasTexture {
    const key = `ground_${type}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    if (typeof document === "undefined") {
      return new THREE.CanvasTexture({} as any);
    }

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    if (type === "desert") {
      ctx.fillStyle = "#d2b48c";
      ctx.fillRect(0, 0, 256, 256);
      // Dune wave grain
      for (let i = 0; i < 2000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        ctx.fillStyle = Math.random() > 0.5 ? "rgba(180, 140, 90, 0.25)" : "rgba(240, 220, 180, 0.3)";
        ctx.fillRect(x, y, 2, 2);
      }
    } else if (type === "beach") {
      ctx.fillStyle = "#e3d3b6";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 3000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? "rgba(160, 140, 110, 0.2)" : "rgba(255, 255, 255, 0.35)";
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5);
      }
    } else if (type === "urban") {
      ctx.fillStyle = "#2c3035";
      ctx.fillRect(0, 0, 256, 256);
      // Concrete grid joints
      ctx.strokeStyle = "rgba(20, 22, 25, 0.8)";
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, 128, 128);
      ctx.strokeRect(128, 0, 128, 128);
      ctx.strokeRect(0, 128, 128, 128);
      ctx.strokeRect(128, 128, 128, 128);
      for (let i = 0; i < 1500; i++) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
      }
    } else {
      // Bright Sunny Garden Lawn
      ctx.fillStyle = "#487c3b";
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 3000; i++) {
        ctx.fillStyle = Math.random() > 0.45 ? "rgba(55, 102, 42, 0.35)" : "rgba(108, 165, 82, 0.28)";
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 3);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);
    this.cache.set(key, texture);
    return texture;
  }

  // Procedural Sky / Environment Equirectangular Map
  public getSkyTexture(env: "desert" | "beach" | "urban" | "forest", isNight: boolean): THREE.CanvasTexture {
    const key = `sky_${env}_${isNight ? "night" : "day"}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    if (typeof document === "undefined") {
      return new THREE.CanvasTexture({} as any);
    }

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    const grad = ctx.createLinearGradient(0, 0, 0, 256);

    if (isNight) {
      grad.addColorStop(0, "#050814");
      grad.addColorStop(0.5, "#0d1b2a");
      grad.addColorStop(0.85, "#1b263b");
      grad.addColorStop(1, "#0a0e17");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 256);

      // Night Stars
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 300; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 160;
        const radius = Math.random() * 1.2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Moon glow
      const moonGrad = ctx.createRadialGradient(380, 50, 2, 380, 50, 30);
      moonGrad.addColorStop(0, "rgba(255, 255, 230, 0.9)");
      moonGrad.addColorStop(0.3, "rgba(200, 220, 255, 0.4)");
      moonGrad.addColorStop(1, "rgba(200, 220, 255, 0)");
      ctx.fillStyle = moonGrad;
      ctx.beginPath();
      ctx.arc(380, 50, 30, 0, Math.PI * 2);
      ctx.fill();
    } else {
      if (env === "desert") {
        grad.addColorStop(0, "#4a82b8");
        grad.addColorStop(0.5, "#8eb5d6");
        grad.addColorStop(0.82, "#eeddc8");
        grad.addColorStop(1, "#cbb18d");
      } else if (env === "beach") {
        grad.addColorStop(0, "#2372ba");
        grad.addColorStop(0.55, "#77b3e8");
        grad.addColorStop(0.85, "#d9ecf8");
        grad.addColorStop(1, "#d1b98b");
      } else if (env === "urban") {
        grad.addColorStop(0, "#3a5f82");
        grad.addColorStop(0.5, "#759bb8");
        grad.addColorStop(0.82, "#b4c3cf");
        grad.addColorStop(1, "#404b56");
      } else {
        // Forest
        grad.addColorStop(0, "#2b6cb0");
        grad.addColorStop(0.55, "#72a8db");
        grad.addColorStop(0.82, "#bdd5bd");
        grad.addColorStop(1, "#2e482b");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 256);

      // Warm Sun Glow
      const sunGrad = ctx.createRadialGradient(120, 70, 5, 120, 70, 70);
      sunGrad.addColorStop(0, "rgba(255, 255, 235, 1)");
      sunGrad.addColorStop(0.2, "rgba(255, 235, 180, 0.7)");
      sunGrad.addColorStop(0.7, "rgba(255, 215, 140, 0.2)");
      sunGrad.addColorStop(1, "rgba(255, 215, 140, 0)");
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(120, 70, 70, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    this.cache.set(key, texture);
    return texture;
  }
}

export const proceduralTextures = new ProceduralTextureManager();
