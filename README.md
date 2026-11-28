# MyPrefabRoom 3D 🏗️

> **100% Offline-Capable, $0-Cost, Production-Ready Gamified 3D Prefab Room Configurator, Multi-Vendor Marketplace, and Local HITL SEO Content Platform.**

Built with Next.js (App Router), TypeScript, Tailwind CSS, React Three Fiber (Three.js), Zustand, Prisma ORM with SQLite, NextAuth.js, and local Ollama AI.

---

## ⚡ Key Architectural Highlights

### 1. 100% Offline & $0-Cost Stack
- **Zero Cloud or Internet Dependencies**: No external CDNs, Google Fonts, or Supabase/Firebase requirements. Runs 100% locally.
- **Local SQLite + Prisma ORM**: Complete schema for Users, Vendors, MasterElements, MasterAttributes, RateCards, Designs, Versions, and Quotes.
- **Local Procedural Assets & Fallbacks**: Procedural Canvas2D skybox textures, corrugation bump maps, and wood floor textures generate instantly in WebGL memory.

### 2. Photorealistic 3D Engine & Multi-Cabin Assembly
- **Procedural Corten Steel Containers**: 20ft and 40ft High Cube containers with ISO corner castings, structural tubular frames, and wood flooring.
- **Multi-Cabin & Multi-Story Stacking**: Horizontal side-by-side snapping and vertical 2nd/3rd story stacking with automatic galvanized external stairs.
- **Physical Glass & PBR Shaders**: Real `MeshPhysicalMaterial` with IOR 1.5, variable transmission, roughness, and architectural tinting (Saint-Gobain Clear/Tinted, AIS Reflective Bronze/Frosted).
- **Dynamic 4-Mode Environments**: Desert, Beach, Urban Rooftop, and Forest sites with soft shadows, day/night cycles, and night luminaire emissive bloom.

### 3. Smart MEP Equipment & Surface Snapping
- **8 Modular 3D Assemblies**: Split Inverter AC, Rooftop Solar PV Arrays, Overhead Water Tanks, External Steel Staircases, Ensuite Bathroom Pods, Office Workstations, LED Ceiling Luminaires, and 4K CCTV Cameras.
- **Surface Snapping**: Enforces mount zones (`WALL_INTERIOR`, `ROOF_TOP`, `FLOOR_INTERIOR`, `WALL_EXTERIOR`, `PERIMETER_EDGE`) with 90° rotation (`R` key).

### 4. Gamification & Engineering HUD
- **Tactile Web Audio Synthesizer**: Zero-dependency Web Audio API sound engine playing procedural metallic clangs on container snap, crystalline chimes on glass swap, rotation whirs, and fanfare on mission unlocks.
- **Engineering Scores**: Real-time animated gauges for Thermal Comfort Score, Natural Daylight Index, and Eco/Solar Score alongside a target budget tracker.
- **Site Challenges & Build Replay**: Interactive design missions, unlockable creator badges, and step-by-step 3D time-lapse replay.

### 5. Multi-Vendor Marketplace & Public SEO
- **Vendor Portal (`/vendor`)**: Rate card management, attribute modifier upcharges, lead times, warranties, and sponsored ad bidding.
- **Live Brand Quotes & Negotiation**: Compare quotes across certified manufacturers with live offer counters and chat.
- **Public SSR SEO Pages (`/design/[slug]`)**: Crawlable HTML BOM tables, JSON-LD `Product` schema, live view/remix counters, and 1-click **Customize / Remix**.
- **Ollama AI Admin (`/admin`)**: Ingest unstructured supplier rate cards into Three.js PBR shader configs via local Ollama (`qwen2.5` / `llama3.2`) with deterministic fallback.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ / 20+ / 24+
- Optional: Local Ollama running `qwen2.5` or `llama3.2` on `http://localhost:11434`

### Installation
```bash
# Clone the repository
git clone https://github.com/THEabhikmaitra/myprefabroom.git
cd myprefabroom

# Install dependencies
npm install

# Initialize local SQLite database & seed demo data
npx prisma db push
npx tsx prisma/seed.ts

# Start development server
npm run dev
# or run production build
npm run build && npm start
```

Open [http://localhost:3005](http://localhost:3005) in your browser.

---

## 🔑 Demo Accounts
| Role | Email | Password |
|---|---|---|
| **Buyer / Architect** | `buyer@porta.local` | `buyer123` |
| **Vendor (QuickCabin)** | `vendor1@quickcabin.in` | `vendor123` |
| **Admin** | `admin@porta.local` | `admin123` |

---

## 📜 License
MIT License
