import type { PlantLocation } from '../types/index.ts';

export interface ServiceTownPreset {
  id: string;
  name: string;
  district: 'Haveri / Ranebennur' | 'Davangere';
  zoneGroup: 'kotihal' | 'davangere';
  lat: number;
  lng: number;
  note: string;
}

export type ZoneFocus = 'all' | 'kotihal' | 'davangere';

export type FeasibilityTier = 'express' | 'primary' | 'extended' | 'custom';

export interface PlantDistanceBreakdown {
  plant: PlantLocation;
  straightKm: number;
  roadKm: number;
  etaMin: number;
  withinRadius: boolean;
}

export interface FeasibilityEvaluation {
  siteLat: number;
  siteLng: number;
  siteLabel: string;
  nearest: PlantDistanceBreakdown;
  allPlants: PlantDistanceBreakdown[];
  tier: FeasibilityTier;
  tierTitle: string;
  tierSummary: string;
  dispatchRecommendation: string;
  feasible: boolean;
}

export const SERVICE_TOWN_PRESETS: ServiceTownPreset[] = [
  {
    id: 'ranebennur',
    name: 'Ranebennur',
    district: 'Haveri / Ranebennur',
    zoneGroup: 'kotihal',
    lat: 14.6197,
    lng: 75.6295,
    note: 'Core NH-48 residential & commercial corridor',
  },
  {
    id: 'kotihal',
    name: 'Kotihal / Halageri',
    district: 'Haveri / Ranebennur',
    zoneGroup: 'kotihal',
    lat: 14.4925,
    lng: 75.6498,
    note: 'Main batching plant backyard priority belt',
  },
  {
    id: 'byadgi',
    name: 'Byadgi',
    district: 'Haveri / Ranebennur',
    zoneGroup: 'kotihal',
    lat: 14.6778,
    lng: 75.4892,
    note: 'APMC & warehouse RMC corridor',
  },
  {
    id: 'haveri',
    name: 'Haveri',
    district: 'Haveri / Ranebennur',
    zoneGroup: 'kotihal',
    lat: 14.7951,
    lng: 75.3991,
    note: 'District HQ scheduled & bulk pours',
  },
  {
    id: 'hirekerur',
    name: 'Hirekerur',
    district: 'Haveri / Ranebennur',
    zoneGroup: 'kotihal',
    lat: 14.4558,
    lng: 75.3924,
    note: 'Scheduled residential & agricultural infra',
  },
  {
    id: 'davangere',
    name: 'Davangere City',
    district: 'Davangere',
    zoneGroup: 'davangere',
    lat: 14.4644,
    lng: 75.9218,
    note: 'Davangere Smart City & residential ring',
  },
  {
    id: 'harihar',
    name: 'Harihar',
    district: 'Davangere',
    zoneGroup: 'davangere',
    lat: 14.5133,
    lng: 75.8065,
    note: 'Dual-plant overlap corridor (Kotihal + Davangere)',
  },
  {
    id: 'karur-ind',
    name: 'Karur Industrial Area',
    district: 'Davangere',
    zoneGroup: 'davangere',
    lat: 14.482,
    lng: 75.9012,
    note: 'Industrial flooring & heavy-duty M30–M40 belt',
  },
  {
    id: 'harapanahalli',
    name: 'Harapanahalli',
    district: 'Davangere',
    zoneGroup: 'davangere',
    lat: 14.7905,
    lng: 75.9845,
    note: 'Extended northeastern bulk concrete corridor',
  },
  {
    id: 'honnali',
    name: 'Honnali',
    district: 'Davangere',
    zoneGroup: 'davangere',
    lat: 14.2417,
    lng: 75.6475,
    note: 'Southern Tungabhadra belt scheduled supply',
  },
  {
    id: 'channagiri',
    name: 'Channagiri',
    district: 'Davangere',
    zoneGroup: 'davangere',
    lat: 14.0258,
    lng: 75.9247,
    note: 'Extended southeastern corridor (advance booking)',
  },
];

// Primary service zone corridor polygons for clear visual highlighting on Leaflet
export const RANEBENNUR_ZONE_POLYGON: Array<[number, number]> = [
  [14.74, 75.47], // North-west Byadgi corridor
  [14.71, 75.67], // North Ranebennur-NH48
  [14.57, 75.77], // East towards Harihar bridge
  [14.37, 75.72], // South Kotihal / Honnali approach
  [14.41, 75.45], // South-west Hirekerur corridor
];

export const DAVANGERE_ZONE_POLYGON: Array<[number, number]> = [
  [14.62, 75.80], // North Harihar corridor
  [14.66, 76.02], // North-east Harapanahalli approach
  [14.45, 76.10], // East Davangere bypass
  [14.26, 75.98], // South Davangere-Channagiri edge
  [14.33, 75.78], // West Tungabhadra corridor
];

const EARTH_RADIUS_KM = 6371;
const ROAD_TORTUOSITY_FACTOR = 1.22;
const AVG_MIXER_SPEED_KMH = 34;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function evaluateDeliveryFeasibility(
  siteLat: number,
  siteLng: number,
  locations: PlantLocation[],
  siteLabel?: string
): FeasibilityEvaluation | null {
  const validPlants = locations.filter(
    (loc) => Number.isFinite(loc.lat) && Number.isFinite(loc.lng)
  );
  if (validPlants.length === 0) return null;

  const allPlants: PlantDistanceBreakdown[] = validPlants
    .map((plant) => {
      const straightKm = Number(haversineKm(plant.lat, plant.lng, siteLat, siteLng).toFixed(1));
      const roadKm = Number((straightKm * ROAD_TORTUOSITY_FACTOR).toFixed(1));
      const etaMin = Math.max(12, Math.round((roadKm / AVG_MIXER_SPEED_KMH) * 60 + 6));
      const radius = plant.serviceRadiusKm || 50;
      return {
        plant,
        straightKm,
        roadKm,
        etaMin,
        withinRadius: straightKm <= radius,
      };
    })
    .sort((a, b) => a.straightKm - b.straightKm);

  const nearest = allPlants[0];
  const radiusKm = nearest.plant.serviceRadiusKm || 50;
  const unitName = nearest.plant.shortLabel || nearest.plant.city || 'Kotihal';

  let tier: FeasibilityTier;
  let tierTitle: string;
  let tierSummary: string;
  let dispatchRecommendation: string;
  let feasible = true;

  if (nearest.straightKm <= 15) {
    tier = 'express';
    tierTitle = 'Express Core Zone (0–15 km)';
    tierSummary = `Prime rapid-dispatch zone from our ${unitName} unit with minimal slump loss and fast mixer turnaround.`;
    dispatchRecommendation = 'Eligible for 24/7 same-day & multi-trip continuous slab pours.';
  } else if (nearest.straightKm <= 32) {
    tier = 'primary';
    tierTitle = 'Primary Service Zone (15–32 km)';
    tierSummary = `Standard RMC coverage from our ${unitName} batching plant with verified 2-hour delivery slots.`;
    dispatchRecommendation = 'Standard transit mixer & concrete pump dispatch available day and night.';
  } else if (nearest.straightKm <= radiusKm) {
    tier = 'extended';
    tierTitle = `Extended Service Corridor (32–${radiusKm} km)`;
    tierSummary = `Within our ${radiusKm} km service boundary from ${unitName}; dispatched with workability-retaining mix design.`;
    dispatchRecommendation = 'Book at least 12–24 hours ahead; slump-retarder admixture included as needed.';
  } else {
    tier = 'custom';
    tierTitle = `Beyond Standard ${radiusKm} km Radius`;
    tierSummary = `Site is ${nearest.straightKm} km straight-line (~${nearest.roadKm} km road) from our nearest plant (${unitName}).`;
    dispatchRecommendation =
      'Bulk pours (18+ m³) or night dispatches may still be feasible—request a site feasibility quote.';
    feasible = false;
  }

  return {
    siteLat: Number(siteLat.toFixed(5)),
    siteLng: Number(siteLng.toFixed(5)),
    siteLabel: siteLabel || `${siteLat.toFixed(4)}, ${siteLng.toFixed(4)}`,
    nearest,
    allPlants,
    tier,
    tierTitle,
    tierSummary,
    dispatchRecommendation,
    feasible,
  };
}
