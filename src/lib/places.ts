import { mockPlaces } from "../data/mockPlaces";
import type { ParsedIntent, Place, SearchCenter } from "../types";

const locatorUrl =
  "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";

const apiKey = import.meta.env.VITE_ARCGIS_API_KEY;

function matchesIntentTags(name: string, intent: ParsedIntent): string[] {
  const matched: string[] = [];

  if (intent.wantsRoastery && /roaster|roastery|焙煎/i.test(name)) {
    matched.push("ロースター系キーワードに一致");
  }

  if (intent.wantsWorkFriendly && /cafe|coffee|lounge/i.test(name)) {
    matched.push("作業向き候補としてカフェ業態を優先");
  }

  if (intent.tags.includes("atmosphere")) {
    matched.push("雰囲気重視の検索意図に沿うPOI");
  }

  return matched;
}

function normalizeArcgisPlace(
  candidate: {
    address?: string | null;
    location?: { latitude?: number | null; longitude?: number | null } | null;
    attributes?: object | null;
  },
  intent: ParsedIntent,
): Place | null {
  const location = candidate.location;

  if (
    !location ||
    typeof location.latitude !== "number" ||
    typeof location.longitude !== "number"
  ) {
    return null;
  }

  const attributes = (candidate.attributes ?? {}) as Record<string, unknown>;
  const placeName = attributes.PlaceName;
  const resultId = attributes.ResultID;
  const name =
    (typeof placeName === "string" ? placeName : undefined) ??
    candidate.address ??
    "Coffee Spot";
  const tags = new Set<Place["tags"][number]>(["atmosphere"]);

  if (/roaster|roastery|焙煎/i.test(name)) {
    tags.add("roastery");
    tags.add("specialty");
  }

  if (/coffee|cafe|珈琲|コーヒー/i.test(name)) {
    tags.add("cozy");
  }

  const semanticReasons = matchesIntentTags(name, intent);

  return {
    id: `arcgis-${typeof resultId === "string" ? resultId : name}`,
    name,
    latitude: location.latitude,
    longitude: location.longitude,
    address: candidate.address ?? "住所未取得",
    source: "arcgis",
    tags: [...tags],
    description: "ArcGIS の周辺候補検索から取得した店舗候補です。",
    semanticReasons:
      semanticReasons.length > 0
        ? semanticReasons
        : ["周辺検索でヒット", "現在地近辺の候補として取得"],
  };
}

export function hasArcgisApiKey(): boolean {
  return Boolean(apiKey);
}

export async function searchNearbyPlaces(
  center: SearchCenter,
  intent: ParsedIntent,
): Promise<Place[]> {
  if (!apiKey) {
    return mockPlaces;
  }

  try {
    const [{ default: esriConfig }, { default: Point }, { addressToLocations }] =
      await Promise.all([
        import("@arcgis/core/config"),
        import("@arcgis/core/geometry/Point"),
        import("@arcgis/core/rest/locator"),
      ]);

    esriConfig.apiKey = apiKey;

    const candidates = await addressToLocations(locatorUrl, {
      address: {
        SingleLine: `${intent.normalized || "coffee"} coffee`,
      },
      categories: ["Coffee Shop", "Cafe"],
      location: new Point({
        latitude: center.latitude,
        longitude: center.longitude,
      }),
      maxLocations: 12,
      outFields: ["PlaceName", "Place_addr", "Type", "City"],
      countryCode: "JPN",
    });

    const normalized = candidates
      .map((candidate) => normalizeArcgisPlace(candidate, intent))
      .filter((place): place is Place => place !== null);

    return normalized.length > 0 ? normalized : mockPlaces;
  } catch (error) {
    console.warn("ArcGIS search failed, falling back to mock places.", error);
    return mockPlaces;
  }
}
