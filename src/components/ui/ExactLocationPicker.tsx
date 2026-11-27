"use client";

import React, { useMemo, useRef, useState } from "react";
import { Crosshair, Loader2, Map as MapIcon, MapPin, Navigation, X } from "lucide-react";
import { useStudioStore } from "@/store/useStudioStore";
import {
  INDIA_CITY_HUBS,
  INDIA_COASTLINE_LAT_LNG,
  SVG_MAP_H,
  SVG_MAP_W,
  estimateRoadDistanceKm,
  findNearestHub,
  projectIndiaToSvg,
  resolveHubByCityName,
  unprojectSvgToIndia,
} from "@/lib/indiaLocations";

interface ExactLocationPickerProps {
  vendorCity?: string | null;
  vendorName?: string | null;
  compact?: boolean;
}

const LABELED_HUB_IDS = new Set([
  "delhi",
  "mumbai",
  "pune",
  "bengaluru",
  "chennai",
  "hyderabad",
  "kolkata",
  "ahmedabad",
  "jaipur",
  "kochi",
  "guwahati",
  "nagpur",
]);

export function ExactLocationPicker({
  vendorCity,
  vendorName,
  compact = false,
}: ExactLocationPickerProps) {
  const customerContact = useStudioStore((s) => s.customerContact);
  const updateCustomerContact = useStudioStore((s) => s.updateCustomerContact);
  const logistics = useStudioStore((s) => s.logistics);
  const updateLogistics = useStudioStore((s) => s.updateLogistics);

  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(!compact);
  const [showCoordsEditor, setShowCoordsEditor] = useState(false);
  const [manualLat, setManualLat] = useState(
    customerContact.latitude !== undefined ? String(customerContact.latitude) : ""
  );
  const [manualLng, setManualLng] = useState(
    customerContact.longitude !== undefined ? String(customerContact.longitude) : ""
  );

  const svgRef = useRef<SVGSVGElement | null>(null);

  const vendorHub = useMemo(() => resolveHubByCityName(vendorCity), [vendorCity]);

  const coastPointsAttr = useMemo(() => {
    return INDIA_COASTLINE_LAT_LNG.map(([lat, lng]) => {
      const p = projectIndiaToSvg(lat, lng);
      return `${p.x},${p.y}`;
    }).join(" ");
  }, []);

  const hasExactPin =
    typeof customerContact.latitude === "number" &&
    typeof customerContact.longitude === "number" &&
    Number.isFinite(customerContact.latitude) &&
    Number.isFinite(customerContact.longitude);

  const buyerPinSvg = useMemo(() => {
    if (!hasExactPin) return null;
    return projectIndiaToSvg(customerContact.latitude!, customerContact.longitude!);
  }, [hasExactPin, customerContact.latitude, customerContact.longitude]);

  const vendorSvg = useMemo(
    () => projectIndiaToSvg(vendorHub.lat, vendorHub.lng),
    [vendorHub]
  );

  const applyCoordinates = (
    lat: number,
    lng: number,
    accuracyM?: number,
    overrideCity?: string,
    overridePin?: string
  ) => {
    const cleanLat = Number(lat.toFixed(6));
    const cleanLng = Number(lng.toFixed(6));
    const nearest = findNearestHub(cleanLat, cleanLng);
    const roadKm = estimateRoadDistanceKm(cleanLat, cleanLng, vendorHub.lat, vendorHub.lng);

    const detectedCity = overrideCity ?? nearest.hub.name;
    const detectedPin = overridePin ?? (customerContact.pincode.trim() || nearest.hub.pinPrefix);
    const autoAddress =
      customerContact.addressLine.trim() ||
      `GPS Pin (${cleanLat.toFixed(4)}, ${cleanLng.toFixed(4)}) near ${detectedCity}`;

    updateCustomerContact({
      latitude: cleanLat,
      longitude: cleanLng,
      locationAccuracyM: accuracyM,
      city: detectedCity,
      pincode: detectedPin,
      addressLine: autoAddress,
    });
    updateLogistics({ distanceKm: roadKm });
    setManualLat(String(cleanLat));
    setManualLng(String(cleanLng));
    setGeoError(null);
  };

  const handleUseCurrentGps = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGeoError("Browser GPS unavailable here. Tap any point on the India map below.");
      setShowMap(true);
      return;
    }

    setLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const acc = Math.round(pos.coords.accuracy || 0);
        applyCoordinates(pos.coords.latitude, pos.coords.longitude, acc > 0 ? acc : undefined);
      },
      (err) => {
        setLocating(false);
        setShowMap(true);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError("Location permission denied. Tap your area on the map below or pick a city.");
        } else if (err.code === err.TIMEOUT) {
          setGeoError("GPS timed out. Drop a pin on the offline map below or pick a city.");
        } else {
          setGeoError("GPS signal unavailable offline. Drop a pin on the map below.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * SVG_MAP_W;
    const svgY = ((e.clientY - rect.top) / rect.height) * SVG_MAP_H;
    const { lat, lng } = unprojectSvgToIndia(svgX, svgY);
    applyCoordinates(lat, lng, undefined);
  };

  const handleApplyManualCoords = () => {
    const parsedLat = Number(manualLat.trim());
    const parsedLng = Number(manualLng.trim());
    if (
      !Number.isFinite(parsedLat) ||
      !Number.isFinite(parsedLng) ||
      parsedLat < -90 ||
      parsedLat > 90 ||
      parsedLng < -180 ||
      parsedLng > 180
    ) {
      setGeoError("Enter valid coordinates (e.g. Lat 18.5204, Lng 73.8567).");
      return;
    }
    applyCoordinates(parsedLat, parsedLng, undefined);
    setShowCoordsEditor(false);
  };

  const handleClearPin = () => {
    updateCustomerContact({
      latitude: undefined,
      longitude: undefined,
      locationAccuracyM: undefined,
    });
    setManualLat("");
    setManualLng("");
    setGeoError(null);
  };

  return (
    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleUseCurrentGps}
          disabled={locating}
          className="flex-1 min-w-[180px] py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all disabled:opacity-60"
        >
          {locating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5" />
          )}
          <span>{locating ? "Detecting GPS..." : "Use Current Exact Location"}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowMap((v) => !v)}
          className={`py-2 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center space-x-1 transition-all ${
            showMap
              ? "bg-amber-400/20 border-amber-400/50 text-amber-300"
              : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>{showMap ? "Hide Map" : "Pin on Map"}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowCoordsEditor((v) => !v)}
          className="py-2 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-semibold flex items-center space-x-1 transition-all"
          title="Enter exact latitude and longitude"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Lat/Lng</span>
        </button>
      </div>

      {hasExactPin && (
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-[11px]">
          <div className="flex items-center space-x-1.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-mono text-emerald-300 truncate">
              {customerContact.latitude!.toFixed(5)}, {customerContact.longitude!.toFixed(5)}
            </span>
            {customerContact.locationAccuracyM ? (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                ±{customerContact.locationAccuracyM}m GPS
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                Map Pin
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-[10px] text-slate-300">
              ~<strong className="text-amber-400">{logistics.distanceKm} km</strong> from{" "}
              {vendorName ? `${vendorName} (${vendorHub.name})` : `${vendorHub.name} Hub`}
            </span>
            <button
              type="button"
              onClick={handleClearPin}
              className="text-slate-400 hover:text-white"
              title="Clear exact GPS pin"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {geoError && (
        <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1.5">
          {geoError}
        </div>
      )}

      {showCoordsEditor && (
        <div className="grid grid-cols-5 gap-1.5 items-center pt-1">
          <input
            type="text"
            value={manualLat}
            onChange={(e) => setManualLat(e.target.value)}
            placeholder="Lat (18.5204)"
            className="col-span-2 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-[11px] font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <input
            type="text"
            value={manualLng}
            onChange={(e) => setManualLng(e.target.value)}
            placeholder="Lng (73.8567)"
            className="col-span-2 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-[11px] font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <button
            type="button"
            onClick={handleApplyManualCoords}
            className="col-span-1 py-1.5 px-2 rounded-lg bg-amber-400 text-slate-950 font-bold text-[11px]"
          >
            Set
          </button>
        </div>
      )}

      {showMap && (
        <div className="space-y-2">
          <div className="relative rounded-xl bg-slate-950 border border-slate-800 overflow-hidden p-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>Tap anywhere on India map to drop exact site pin</span>
              <span className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-sm bg-cyan-400 inline-block" />
                  <span>Yard ({vendorHub.name})</span>
                </span>
                <span className="inline-flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  <span>Your Site</span>
                </span>
              </span>
            </div>

            <svg
              ref={svgRef}
              viewBox={`0 0 ${SVG_MAP_W} ${SVG_MAP_H}`}
              onClick={handleMapClick}
              className="w-full h-48 cursor-crosshair select-none touch-none"
            >
              {/* Subtle offline grid */}
              <defs>
                <pattern id="indiaGrid" width="36" height="38" patternUnits="userSpaceOnUse">
                  <path
                    d="M 36 0 L 0 0 0 38"
                    fill="none"
                    stroke="rgba(148,163,184,0.08)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width={SVG_MAP_W} height={SVG_MAP_H} fill="url(#indiaGrid)" rx="8" />

              {/* Offline Vector Mainland India Outline */}
              <polygon
                points={coastPointsAttr}
                fill="rgba(30, 41, 59, 0.9)"
                stroke="rgba(56, 189, 248, 0.35)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />

              {/* Route line between Factory Yard and Buyer Pin */}
              {buyerPinSvg && (
                <line
                  x1={vendorSvg.x}
                  y1={vendorSvg.y}
                  x2={buyerPinSvg.x}
                  y2={buyerPinSvg.y}
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
              )}

              {/* Hub markers */}
              {INDIA_CITY_HUBS.map((hub) => {
                const pos = projectIndiaToSvg(hub.lat, hub.lng);
                const isVendor = hub.id === vendorHub.id;
                const showLabel = LABELED_HUB_IDS.has(hub.id) || isVendor;
                return (
                  <g
                    key={hub.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      applyCoordinates(hub.lat, hub.lng, undefined, hub.name, hub.pinPrefix);
                    }}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isVendor ? 4.5 : 3}
                      fill={isVendor ? "#22d3ee" : "#64748b"}
                      stroke="#0f172a"
                      strokeWidth="1"
                    />
                    {showLabel && (
                      <text
                        x={pos.x + 6}
                        y={pos.y + 3}
                        fontSize="8.5"
                        fill={isVendor ? "#67e8f9" : "#94a3b8"}
                        fontWeight={isVendor ? "700" : "500"}
                      >
                        {hub.name}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Selected Exact Buyer Pin */}
              {buyerPinSvg && (
                <g pointerEvents="none">
                  <circle cx={buyerPinSvg.x} cy={buyerPinSvg.y} r="10" fill="rgba(251, 191, 36, 0.22)" />
                  <circle
                    cx={buyerPinSvg.x}
                    cy={buyerPinSvg.y}
                    r="5"
                    fill="#fbbf24"
                    stroke="#020617"
                    strokeWidth="1.5"
                  />
                </g>
              )}
            </svg>
          </div>

          {/* Quick 1-tap Indian City Chips */}
          <div className="flex flex-wrap gap-1">
            {INDIA_CITY_HUBS.slice(0, 8).map((hub) => {
              const selected =
                customerContact.city.trim().toLowerCase() === hub.name.toLowerCase();
              return (
                <button
                  key={hub.id}
                  type="button"
                  onClick={() =>
                    applyCoordinates(hub.lat, hub.lng, undefined, hub.name, hub.pinPrefix)
                  }
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
                    selected
                      ? "bg-amber-400 text-slate-950 border-amber-400 font-bold"
                      : "bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white"
                  }`}
                >
                  {hub.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
