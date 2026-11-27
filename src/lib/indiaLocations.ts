export interface IndiaCityHub {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  pinPrefix: string;
}

export const INDIA_CITY_HUBS: IndiaCityHub[] = [
  { id: "pune", name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567, pinPrefix: "411001" },
  { id: "mumbai", name: "Mumbai", state: "Maharashtra", lat: 19.076, lng: 72.8777, pinPrefix: "400001" },
  { id: "ahmedabad", name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714, pinPrefix: "380001" },
  { id: "surat", name: "Surat", state: "Gujarat", lat: 21.1702, lng: 72.8311, pinPrefix: "395003" },
  { id: "bengaluru", name: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946, pinPrefix: "560001" },
  { id: "delhi", name: "Delhi NCR", state: "Delhi", lat: 28.6139, lng: 77.209, pinPrefix: "110001" },
  { id: "gurugram", name: "Gurugram", state: "Haryana", lat: 28.4595, lng: 77.0266, pinPrefix: "122001" },
  { id: "noida", name: "Noida", state: "Uttar Pradesh", lat: 28.5355, lng: 77.391, pinPrefix: "201301" },
  { id: "hyderabad", name: "Hyderabad", state: "Telangana", lat: 17.385, lng: 78.4867, pinPrefix: "500001" },
  { id: "chennai", name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707, pinPrefix: "600001" },
  { id: "kolkata", name: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639, pinPrefix: "700001" },
  { id: "jaipur", name: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873, pinPrefix: "302001" },
  { id: "lucknow", name: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, pinPrefix: "226001" },
  { id: "nagpur", name: "Nagpur", state: "Maharashtra", lat: 21.1458, lng: 79.0882, pinPrefix: "440001" },
  { id: "indore", name: "Indore", state: "Madhya Pradesh", lat: 22.7196, lng: 75.8577, pinPrefix: "452001" },
  { id: "bhopal", name: "Bhopal", state: "Madhya Pradesh", lat: 23.2599, lng: 77.4126, pinPrefix: "462001" },
  { id: "kochi", name: "Kochi", state: "Kerala", lat: 9.9312, lng: 76.2673, pinPrefix: "682001" },
  { id: "coimbatore", name: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lng: 76.9558, pinPrefix: "641001" },
  { id: "chandigarh", name: "Chandigarh", state: "Chandigarh", lat: 30.7333, lng: 76.7794, pinPrefix: "160001" },
  { id: "patna", name: "Patna", state: "Bihar", lat: 25.5941, lng: 85.1376, pinPrefix: "800001" },
  { id: "bhubaneswar", name: "Bhubaneswar", state: "Odisha", lat: 20.2961, lng: 85.8245, pinPrefix: "751001" },
  { id: "visakhapatnam", name: "Visakhapatnam", state: "Andhra Pradesh", lat: 17.6868, lng: 83.2185, pinPrefix: "530001" },
  { id: "guwahati", name: "Guwahati", state: "Assam", lat: 26.1445, lng: 91.7362, pinPrefix: "781001" },
  { id: "nashik", name: "Nashik", state: "Maharashtra", lat: 19.9975, lng: 73.7898, pinPrefix: "422001" },
  { id: "vadodara", name: "Vadodara", state: "Gujarat", lat: 22.3072, lng: 73.1812, pinPrefix: "390001" },
];

export const INDIA_COASTLINE_LAT_LNG: Array<[number, number]> = [
  [35.5, 76.8],
  [34.5, 78.5],
  [32.5, 78.9],
  [30.5, 80.5],
  [28.5, 81.0],
  [27.5, 84.5],
  [26.8, 88.0],
  [27.9, 88.6],
  [28.2, 92.0],
  [29.2, 96.0],
  [28.0, 97.2],
  [26.0, 95.2],
  [24.0, 94.3],
  [22.0, 93.0],
  [23.5, 92.0],
  [24.5, 91.5],
  [25.2, 90.0],
  [26.0, 89.8],
  [24.5, 88.8],
  [22.0, 89.0],
  [21.6, 87.5],
  [20.3, 86.7],
  [19.3, 85.0],
  [17.7, 83.3],
  [16.2, 81.2],
  [14.5, 80.2],
  [13.1, 80.3],
  [11.5, 79.8],
  [9.2, 79.3],
  [8.08, 77.55],
  [9.9, 76.2],
  [11.8, 75.3],
  [12.9, 74.8],
  [15.4, 73.8],
  [17.0, 73.3],
  [19.07, 72.87],
  [20.4, 72.8],
  [21.6, 72.5],
  [20.7, 70.9],
  [22.2, 69.0],
  [23.0, 68.5],
  [24.3, 68.8],
  [24.5, 71.0],
  [26.8, 69.6],
  [29.5, 73.0],
  [31.6, 74.5],
  [32.8, 74.8],
  [34.2, 74.0],
  [35.5, 76.8],
];

const LAT_MIN = 6.5;
const LAT_MAX = 37.2;
const LNG_MIN = 67.5;
const LNG_MAX = 98.0;
export const SVG_MAP_W = 360;
export const SVG_MAP_H = 380;

export function projectIndiaToSvg(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * SVG_MAP_W;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * SVG_MAP_H;
  return {
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
  };
}

export function unprojectSvgToIndia(x: number, y: number): { lat: number; lng: number } {
  const clampedX = Math.max(0, Math.min(SVG_MAP_W, x));
  const clampedY = Math.max(0, Math.min(SVG_MAP_H, y));
  const lng = LNG_MIN + (clampedX / SVG_MAP_W) * (LNG_MAX - LNG_MIN);
  const lat = LAT_MAX - (clampedY / SVG_MAP_H) * (LAT_MAX - LAT_MIN);
  return {
    lat: Number(lat.toFixed(5)),
    lng: Number(lng.toFixed(5)),
  };
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimates highway distance from straight-line coordinates using a 1.25x Indian road detour multiplier.
 */
export function estimateRoadDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const airKm = haversineKm(lat1, lng1, lat2, lng2);
  const roadKm = Math.round((airKm * 1.25) / 5) * 5;
  return Math.max(15, Math.min(2500, roadKm));
}

export function resolveHubByCityName(cityName?: string | null): IndiaCityHub {
  const normalized = (cityName ?? "").trim().toLowerCase();
  if (!normalized) return INDIA_CITY_HUBS[0];
  const exact = INDIA_CITY_HUBS.find((h) => normalized.includes(h.name.toLowerCase()) || normalized.includes(h.id));
  if (exact) return exact;
  if (normalized.includes("bangalore")) return INDIA_CITY_HUBS.find((h) => h.id === "bengaluru")!;
  if (normalized.includes("gurgaon")) return INDIA_CITY_HUBS.find((h) => h.id === "gurugram")!;
  if (normalized.includes("new delhi")) return INDIA_CITY_HUBS.find((h) => h.id === "delhi")!;
  if (normalized.includes("calcutta")) return INDIA_CITY_HUBS.find((h) => h.id === "kolkata")!;
  if (normalized.includes("bombay")) return INDIA_CITY_HUBS.find((h) => h.id === "mumbai")!;
  return INDIA_CITY_HUBS[0];
}

export function findNearestHub(lat: number, lng: number): {
  hub: IndiaCityHub;
  airKm: number;
  roadKm: number;
} {
  let best = INDIA_CITY_HUBS[0];
  let bestDist = Infinity;
  for (const hub of INDIA_CITY_HUBS) {
    const d = haversineKm(lat, lng, hub.lat, hub.lng);
    if (d < bestDist) {
      bestDist = d;
      best = hub;
    }
  }
  return {
    hub: best,
    airKm: Math.round(bestDist),
    roadKm: Math.max(15, Math.round((bestDist * 1.25) / 5) * 5),
  };
}
