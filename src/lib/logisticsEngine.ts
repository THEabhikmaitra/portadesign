import {
  CabinConfig,
  LogisticsConfig,
  VendorLogisticsSettings,
  LogisticsDefaultsConfig,
} from "@/types";

export const DEFAULT_VENDOR_LOGISTICS: VendorLogisticsSettings = {
  transportPerKm20ft: 85,
  transportPerKm40ft: 115,
  craneGroundFee: 6500,
  craneTerraceFee: 18500,
  knockDownSupported: true,
  knockDownPerKm: 45,
  knockDownAssemblyFee: 18000,
  sellsRefurbished: true,
  refurbDiscountPct: 38,
  usedWwtDiscountPct: 55,
  refurbStockCount: 4,
  refurbWarrantyYears: 1,
  flyRoofCanopyPrice: 24000,
};

export const DEFAULT_LOGISTICS_CONFIG: LogisticsDefaultsConfig = {
  gstRatePct: 18,
  transportPerKm20ft: 85,
  transportPerKm40ft: 115,
  craneGroundFee: 6500,
  craneTerraceFee: 18500,
  knockDownPerKm: 45,
  knockDownAssemblyFee: 18000,
  foundationGroundFee: 6500,
  foundationUpperFee: 12000,
  puf50mmCost: 14000,
  flyRoofCanopyPrice: 24000,
  defaultRefurbDiscount: 38,
  defaultUsedWwtDiscount: 55,
  minBidAmount: 10,
  maxBidAmount: 500,
};

export function defaultsToVendorLogistics(d?: Partial<LogisticsDefaultsConfig> | null): VendorLogisticsSettings {
  if (!d) return { ...DEFAULT_VENDOR_LOGISTICS };
  return {
    ...DEFAULT_VENDOR_LOGISTICS,
    transportPerKm20ft: d.transportPerKm20ft ?? DEFAULT_VENDOR_LOGISTICS.transportPerKm20ft,
    transportPerKm40ft: d.transportPerKm40ft ?? DEFAULT_VENDOR_LOGISTICS.transportPerKm40ft,
    craneGroundFee: d.craneGroundFee ?? DEFAULT_VENDOR_LOGISTICS.craneGroundFee,
    craneTerraceFee: d.craneTerraceFee ?? DEFAULT_VENDOR_LOGISTICS.craneTerraceFee,
    knockDownPerKm: d.knockDownPerKm ?? DEFAULT_VENDOR_LOGISTICS.knockDownPerKm,
    knockDownAssemblyFee: d.knockDownAssemblyFee ?? DEFAULT_VENDOR_LOGISTICS.knockDownAssemblyFee,
    refurbDiscountPct: d.defaultRefurbDiscount ?? DEFAULT_VENDOR_LOGISTICS.refurbDiscountPct,
    usedWwtDiscountPct: d.defaultUsedWwtDiscount ?? DEFAULT_VENDOR_LOGISTICS.usedWwtDiscountPct,
    flyRoofCanopyPrice: d.flyRoofCanopyPrice ?? DEFAULT_VENDOR_LOGISTICS.flyRoofCanopyPrice,
  };
}

export interface SiteAlert {
  severity: "warning" | "info" | "success";
  title: string;
  detail: string;
  actionLabel?: string;
  actionType?: "SWITCH_KNOCKDOWN" | "ADD_CANOPY";
}

export function calculateSiteLogistics(
  cabins: CabinConfig[],
  logistics: LogisticsConfig,
  vendorCfg: VendorLogisticsSettings = DEFAULT_VENDOR_LOGISTICS,
  platformDefaults?: Partial<LogisticsDefaultsConfig> | null
) {
  const cabinCount = cabins.length;
  if (cabinCount === 0) {
    return {
      transportCost: 0,
      craneOrAssemblyCost: 0,
      foundationOrCanopyCost: 0,
      conditionDiscountPct: 0,
      alerts: [] as SiteAlert[],
      estimatedWeightKg: 0,
    };
  }

  const has40Ft = cabins.some((c) => c.type === "CABIN_40FT");
  const isMultiStory = cabins.some((c) => (c.tier ?? 0) > 0 || (c.position?.[1] ?? 0) > 2.0);
  const isSelfPickup = logistics.deliveryMode === "SELF_PICKUP";
  const effectiveKm = Math.max(15, logistics.distanceKm);

  const foundationGroundFee = platformDefaults?.foundationGroundFee ?? DEFAULT_LOGISTICS_CONFIG.foundationGroundFee;
  const foundationUpperFee = platformDefaults?.foundationUpperFee ?? DEFAULT_LOGISTICS_CONFIG.foundationUpperFee;
  const puf50mmCost = platformDefaults?.puf50mmCost ?? DEFAULT_LOGISTICS_CONFIG.puf50mmCost;

  // 1. Weight Estimation
  const unitWeightKg =
    logistics.deliveryMode === "KNOCK_DOWN"
      ? has40Ft
        ? 1750
        : 950
      : has40Ft
      ? 3800
      : 2200;
  const estimatedWeightKg = unitWeightKg * cabinCount;

  // 2. Transport Cost (₹0 for Self-Pickup)
  let transportCost = 0;
  if (!isSelfPickup) {
    let perKm = has40Ft ? vendorCfg.transportPerKm40ft : vendorCfg.transportPerKm20ft;
    if (logistics.deliveryMode === "KNOCK_DOWN") {
      perKm = vendorCfg.knockDownPerKm;
    }
    const odcMultiplier = isMultiStory && logistics.deliveryMode === "READY_BUILT" ? 1.2 : 1.0;
    transportCost = Math.round(effectiveKm * perKm * cabinCount * odcMultiplier);
  }

  // 3. Crane vs On-Site Bolt Assembly Cost (₹0 for Self-Pickup)
  let craneOrAssemblyCost = 0;
  if (!isSelfPickup) {
    if (logistics.deliveryMode === "KNOCK_DOWN") {
      craneOrAssemblyCost = vendorCfg.knockDownAssemblyFee * cabinCount;
    } else if (logistics.placementLevel === "TERRACE" || isMultiStory) {
      craneOrAssemblyCost = vendorCfg.craneTerraceFee;
    } else if (logistics.placementLevel === "MID_FLOOR") {
      craneOrAssemblyCost = Math.round((vendorCfg.craneGroundFee + vendorCfg.craneTerraceFee) / 2);
    } else {
      craneOrAssemblyCost = vendorCfg.craneGroundFee * cabinCount;
    }
  }

  // 4. Foundation + Insulation / Canopy Cost
  let foundationOrCanopyCost = 0;
  if (!isSelfPickup) {
    if (logistics.placementLevel === "TERRACE" || logistics.placementLevel === "MID_FLOOR") {
      foundationOrCanopyCost += foundationUpperFee * cabinCount;
    } else {
      foundationOrCanopyCost += foundationGroundFee * cabinCount;
    }
  }

  if (logistics.insulationTier === "PUF_50MM") {
    foundationOrCanopyCost += puf50mmCost * cabinCount;
  } else if (logistics.insulationTier === "PUF_75MM_CANOPY") {
    foundationOrCanopyCost += (puf50mmCost + vendorCfg.flyRoofCanopyPrice) * cabinCount;
  }

  // 5. Condition Discount (New vs 2nd Hand Refurbished vs Used WWT)
  let conditionDiscountPct = 0;
  if (logistics.condition === "REFURB_READY") {
    conditionDiscountPct = vendorCfg.refurbDiscountPct;
  } else if (logistics.condition === "USED_WWT") {
    conditionDiscountPct = vendorCfg.usedWwtDiscountPct;
  }

  // 6. Real-World Site Alerts
  const alerts: SiteAlert[] = [];

  if (isSelfPickup) {
    alerts.push({
      severity: "success",
      title: "Self-Pickup from Maker's Yard (₹0 Transport & ₹0 Crane)",
      detail:
        "Ex-Factory price only! Arrange your own flatbed trailer & offloading crane. Maker loads onto your truck at factory gate.",
    });
  } else {
    if (logistics.roadWidth === "NARROW" && logistics.deliveryMode === "READY_BUILT") {
      alerts.push({
        severity: "warning",
        title: "Trailer Cannot Enter <12ft Street!",
        detail:
          "20ft/40ft trucks & Hydra cranes need a 14ft+ lane. Switch to Knock-Down Flat-Pack (Tata Ace pickup).",
        actionLabel: "Switch to Knock-Down",
        actionType: "SWITCH_KNOCKDOWN",
      });
    }

    if (logistics.overheadClearance === "WIRES_OR_GATE" && logistics.deliveryMode === "READY_BUILT") {
      alerts.push({
        severity: "warning",
        title: "Overhead Wires / Low Gate Risk!",
        detail:
          "Hydra/Mobile crane booms cannot safely lift under electric cables or low society gates. Use Knock-Down Flat-Pack.",
        actionLabel: "Switch to Knock-Down",
        actionType: "SWITCH_KNOCKDOWN",
      });
    }

    if (
      (logistics.placementLevel === "TERRACE" || logistics.placementLevel === "MID_FLOOR") &&
      logistics.deliveryMode === "READY_BUILT"
    ) {
      alerts.push({
        severity: "warning",
        title: `Heavy Lift (~${estimatedWeightKg} kg) + High-Reach Mobile Crane`,
        detail:
          "Standard terrace slabs carry 150–200 kg/m². Knock-Down PUF modules weigh 55% less (₹0 crane) + require I-beam grid & Society NOC.",
        actionLabel: "Use Lightweight Knock-Down",
        actionType: "SWITCH_KNOCKDOWN",
      });
    } else if (logistics.placementLevel === "TERRACE" || logistics.placementLevel === "MID_FLOOR") {
      alerts.push({
        severity: "info",
        title: "Upper Floor / Terrace Compliance",
        detail:
          "Includes lightweight I-beam load grid to protect roof slab & waterproofing. Check Society NOC & municipal FSI (>4.5 sq.m).",
      });
    }
  }

  if (logistics.insulationTier === "STANDARD") {
    alerts.push({
      severity: "info",
      title: "45°C Summer & Monsoon Tip",
      detail:
        "Adding 75mm PUF + Sloped Canopy cuts indoor heat by ~6–8°C & stops roof leaks.",
      actionLabel: "Add Sloped Heat Roof",
      actionType: "ADD_CANOPY",
    });
  }

  if (logistics.condition !== "NEW") {
    alerts.push({
      severity: "success",
      title:
        logistics.condition === "REFURB_READY"
          ? `2nd Hand Refurbished (${conditionDiscountPct}% Off Cabin)`
          : `Used WWT Shell (${conditionDiscountPct}% Off Cabin)`,
      detail:
        logistics.condition === "REFURB_READY"
          ? "Rust-treated, repainted, leak-tested & re-wired. 1–2 yr yard warranty."
          : "Raw Wind & Watertight shipping shell. Inspect floor ply & seals before dispatch.",
    });
  }

  return {
    transportCost,
    craneOrAssemblyCost,
    foundationOrCanopyCost,
    conditionDiscountPct,
    alerts,
    estimatedWeightKg,
  };
}
