import { SeoClusterRole, SeoGeoTarget, SeoIntentType } from "./types";

export interface SeedTopicInput {
  keyword: string;
  slug: string;
  targetGeo: SeoGeoTarget;
  intent: SeoIntentType;
  clusterRole: SeoClusterRole;
  parentPillarSlug?: string;
  publishTier: number;
  priority: number;
  linkedPresetCode?: string;
}

export const GLOBAL_PREFAB_TOPICS: SeedTopicInput[] = [
  {
    keyword: "prefab room cost permits manufacturers and installation guide",
    slug: "prefab-room-cost-permits-and-installation-guide",
    targetGeo: "GLOBAL",
    intent: "COST",
    clusterRole: "PILLAR",
    publishTier: 1,
    priority: 100,
    linkedPresetCode: "terrace-room",
  },
  {
    keyword: "backyard office pod cost permits electrical and roi",
    slug: "backyard-office-pod-cost-permits-electrical-and-roi",
    targetGeo: "US",
    intent: "FINANCE",
    clusterRole: "PILLAR",
    publishTier: 1,
    priority: 95,
    linkedPresetCode: "garden-studio",
  },
  {
    keyword: "garden room planning permission cost and insulation guide uk",
    slug: "garden-room-planning-permission-cost-insulation-uk",
    targetGeo: "UK",
    intent: "PERMIT",
    clusterRole: "PILLAR",
    publishTier: 1,
    priority: 92,
    linkedPresetCode: "garden-studio",
  },
  {
    keyword: "rooftop terrace portacabin structural load heatproofing and price",
    slug: "rooftop-terrace-portacabin-load-heatproofing-price-india",
    targetGeo: "IN",
    intent: "PERMIT",
    clusterRole: "PILLAR",
    publishTier: 1,
    priority: 90,
    linkedPresetCode: "terrace-room",
  },
  {
    keyword: "prefab backyard pod granny flat rules and turnkey prices australia",
    slug: "prefab-backyard-pod-granny-flat-prices-australia",
    targetGeo: "AU",
    intent: "COST",
    clusterRole: "PILLAR",
    publishTier: 2,
    priority: 86,
    linkedPresetCode: "guest-suite",
  },
  {
    keyword: "second hand refurbished portable cabin vs new container room cost",
    slug: "second-hand-refurbished-portable-cabin-vs-new-cost",
    targetGeo: "GLOBAL",
    intent: "COMPARISON",
    clusterRole: "SPOKE_VS",
    parentPillarSlug: "prefab-room-cost-permits-and-installation-guide",
    publishTier: 2,
    priority: 84,
    linkedPresetCode: "cafe-shop",
  },
  {
    keyword: "prefab adu financing construction loans zoning and payback",
    slug: "prefab-adu-financing-construction-loans-and-zoning",
    targetGeo: "US",
    intent: "FINANCE",
    clusterRole: "SPOKE_COST",
    parentPillarSlug: "backyard-office-pod-cost-permits-electrical-and-roi",
    publishTier: 2,
    priority: 82,
    linkedPresetCode: "guest-suite",
  },
  {
    keyword: "off grid solar prefab cabin battery hvac and plumbing sizing",
    slug: "off-grid-solar-prefab-cabin-battery-hvac-plumbing",
    targetGeo: "GLOBAL",
    intent: "GUIDE",
    clusterRole: "SPOKE_GUIDE",
    parentPillarSlug: "prefab-room-cost-permits-and-installation-guide",
    publishTier: 2,
    priority: 80,
    linkedPresetCode: "terrace-room",
  },
  {
    keyword: "prefab cabin crane delivery narrow road knock down vs ready built",
    slug: "prefab-cabin-crane-delivery-narrow-road-knock-down-guide",
    targetGeo: "GLOBAL",
    intent: "GUIDE",
    clusterRole: "SPOKE_GUIDE",
    parentPillarSlug: "prefab-room-cost-permits-and-installation-guide",
    publishTier: 3,
    priority: 78,
    linkedPresetCode: "terrace-room",
  },
  {
    keyword: "prefab cafe shop pod startup budget permits and wiring",
    slug: "prefab-cafe-shop-pod-startup-cost-and-permits",
    targetGeo: "GLOBAL",
    intent: "FINANCE",
    clusterRole: "SPOKE_LOCAL",
    parentPillarSlug: "prefab-room-cost-permits-and-installation-guide",
    publishTier: 3,
    priority: 75,
    linkedPresetCode: "cafe-shop",
  },
];
