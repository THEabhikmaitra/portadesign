import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calculateSiteLogistics,
  defaultsToVendorLogistics,
  DEFAULT_LOGISTICS_CONFIG,
} from "@/lib/logisticsEngine";
import { LogisticsConfig, VendorLogisticsSettings, ElementOptionsConfig } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      cabins = [],
      equipment = [],
      logistics = {
        condition: "NEW",
        deliveryMode: "READY_BUILT",
        distanceKm: 40,
        roadWidth: "WIDE",
        placementLevel: "GROUND",
        insulationTier: "PUF_50MM",
      } as LogisticsConfig,
    } = body;

    const [vendors, masterElements, masterAttributes, platformDefaults] = await Promise.all([
      prisma.vendorProfile.findMany({
        where: {
          approvalStatus: "APPROVED",
          user: { status: "ACTIVE" },
        },
        include: { rateCards: true },
      }),
      prisma.masterElement.findMany({ where: { isActive: true } }),
      prisma.masterAttribute.findMany({ where: { isActive: true } }),
      prisma.logisticsDefaults.findUnique({ where: { id: "singleton" } }),
    ]);

    const defaultsCfg = platformDefaults || DEFAULT_LOGISTICS_CONFIG;
    const baseVendorLogistics = defaultsToVendorLogistics(defaultsCfg);
    const gstRate = (defaultsCfg.gstRatePct ?? 18) / 100;

    const elementMap = new Map(masterElements.map((e) => [e.code, e]));
    const attrMap = new Map(masterAttributes.map((a) => [a.code, a]));

    const sponsoredIdsToTrack: string[] = [];

    const quotes = vendors.map((vendor) => {
      const cardMap = new Map(vendor.rateCards.map((rc) => [rc.elementCode, rc]));

      let vendorCfg: VendorLogisticsSettings = { ...baseVendorLogistics };
      const logCard = cardMap.get("__VENDOR_LOGISTICS__");
      if (logCard?.attributeModifiersJson) {
        try {
          vendorCfg = { ...vendorCfg, ...JSON.parse(logCard.attributeModifiersJson) };
        } catch {}
      }

      const siteCalc = calculateSiteLogistics(cabins, logistics, vendorCfg, defaultsCfg);
      const cabinMultiplier = 1 - siteCalc.conditionDiscountPct / 100;

      let subtotal = 0;

      const getElementPrice = (code: string, attrCodes: string[] = [], multiplier = 1) => {
        const card = cardMap.get(code);
        const masterEl = elementMap.get(code);
        const basePrice = card ? card.baseUnitPrice : masterEl?.baseCost || 0;
        let unit = Math.round(basePrice * multiplier);

        let vendorMods: Record<string, number> = {};
        if (card?.attributeModifiersJson) {
          try {
            vendorMods = JSON.parse(card.attributeModifiersJson);
          } catch {}
        }

        for (const ac of attrCodes) {
          if (vendorMods[ac] !== undefined) {
            unit += Number(vendorMods[ac]);
          } else {
            const masterAttr = attrMap.get(ac);
            if (masterAttr) {
              unit += Number(masterAttr.costModifier) || 0;
            }
          }
        }
        return unit;
      };

      for (const c of cabins) {
        const finishCodes = c.wallFinish ? [c.wallFinish] : [];
        subtotal += getElementPrice(c.type, finishCodes, cabinMultiplier);

        for (const d of c.doors || []) {
          const modCodes: string[] = [];
          if (d.glassType) modCodes.push(d.glassType);
          if (d.frameMaterial) modCodes.push(d.frameMaterial);
          subtotal += getElementPrice(d.type, modCodes);
        }

        for (const w of c.windows || []) {
          const modCodes: string[] = [];
          if (w.glassType) modCodes.push(w.glassType);
          if (w.frameMaterial) modCodes.push(w.frameMaterial);
          subtotal += getElementPrice(w.type, modCodes);
        }
      }

      for (const eq of equipment) {
        const masterEl = elementMap.get(eq.type);
        const card = cardMap.get(eq.type);
        let price = card ? card.baseUnitPrice : masterEl?.baseCost || 0;

        let options: ElementOptionsConfig = {};
        if (masterEl?.optionsJson) {
          try {
            options = JSON.parse(masterEl.optionsJson);
          } catch {}
        }

        const brandMatch = options.brands?.find((b) => b.name === eq.brand);
        if (brandMatch) price += brandMatch.modifier || 0;
        const capMatch = options.capacities?.find((c) => c.label === eq.capacity);
        if (capMatch) price += capMatch.modifier || 0;
        const finMatch = options.finishes?.find((f) => f.label === eq.finish);
        if (finMatch) price += finMatch.modifier || 0;

        subtotal += price;
      }

      const taxableSubtotal = subtotal + siteCalc.foundationOrCanopyCost;
      const tax = Math.round(taxableSubtotal * gstRate);
      const totalCost =
        taxableSubtotal + tax + siteCalc.transportCost + siteCalc.craneOrAssemblyCost;

      const effectiveWarranty =
        logistics.condition === "NEW"
          ? vendor.warrantyYears
          : logistics.condition === "REFURB_READY"
          ? vendorCfg.refurbWarrantyYears
          : 0;

      const sampleNotes = vendor.rateCards.find((r) => r.elementCode !== "__VENDOR_LOGISTICS__")
        ?.warrantyNotes;

      const monthlyBudgetCap = (vendor.adDailyCap || 0) * 30;
      const isAdLive =
        vendor.isSponsored &&
        vendor.adStatus === "ACTIVE" &&
        (monthlyBudgetCap <= 0 || vendor.adSpentMonth < monthlyBudgetCap);

      if (isAdLive) {
        sponsoredIdsToTrack.push(vendor.id);
      }

      return {
        vendorId: vendor.id,
        companyName: vendor.companyName,
        city: vendor.city,
        phone: vendor.phone,
        rating: vendor.rating,
        leadDays:
          logistics.condition === "NEW"
            ? vendor.leadDays
            : Math.max(4, Math.round(vendor.leadDays / 2)),
        warrantyYears: effectiveWarranty,
        isSponsored: isAdLive,
        sponsoredBidAmt: isAdLive ? vendor.sponsoredBidAmt : 0,
        adHeadline: isAdLive ? vendor.adHeadline : null,
        subtotal: taxableSubtotal,
        tax,
        transportCost: siteCalc.transportCost,
        craneOrAssemblyCost: siteCalc.craneOrAssemblyCost,
        totalCost,
        knockDownSupported: vendorCfg.knockDownSupported,
        sellsRefurbished: vendorCfg.sellsRefurbished,
        refurbStockCount: vendorCfg.refurbStockCount,
        features: [
          effectiveWarranty > 0
            ? `${effectiveWarranty}-Yr Structural & Leak Warranty`
            : "As-Is WWT Shell (Inspected Dry)",
          logistics.condition !== "NEW"
            ? `${vendorCfg.refurbStockCount} Used Units Ready in Yard`
            : `Ready in ${vendor.leadDays} Days`,
          logistics.deliveryMode === "KNOCK_DOWN"
            ? vendorCfg.knockDownSupported
              ? "Flat-Pack Narrow-Lane Delivery Supported"
              : "Ready-Built Truck Delivery Only"
            : sampleNotes || "Factory pre-wired & weather-tested",
        ],
      };
    });

    if (sponsoredIdsToTrack.length > 0) {
      prisma.vendorProfile
        .updateMany({
          where: { id: { in: sponsoredIdsToTrack } },
          data: { adImpressions: { increment: 1 } },
        })
        .catch(() => {});
    }

    return NextResponse.json({ quotes });
  } catch (error: any) {
    console.error("POST /api/quotes/compare error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
