import { mockPlaces } from "../data/mockPlaces";
import type { ParsedIntent, Place, SearchCenter } from "../types";

const allowedCategories = new Set(["coffee_shop", "coffee_stand", "bean_store", "both"]);

export const jiyugaokaCenter: SearchCenter = {
  id: "jiyugaoka",
  latitude: 35.6074,
  longitude: 139.6688,
  label: "自由が丘駅",
  radiusMeters: 1400,
  ward: "目黒区",
};

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function calculateDistanceMeters(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
): number {
  const earthRadius = 6371000;
  const dLat = toRadians(endLat - startLat);
  const dLon = toRadians(endLon - startLon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(startLat)) *
      Math.cos(toRadians(endLat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWithinSearchArea(place: Pick<Place, "latitude" | "longitude">, center: SearchCenter) {
  const radiusMeters = center.radiusMeters ?? 900;
  return (
    calculateDistanceMeters(center.latitude, center.longitude, place.latitude, place.longitude) <=
    radiusMeters
  );
}

function toScopedPlace(place: Place, center: SearchCenter, intent: ParsedIntent): Place | null {
  const withinSearchArea = isWithinSearchArea(place, center);
  if (!withinSearchArea || !allowedCategories.has(place.category)) {
    return null;
  }

  if (intent.wantsInstagram && !place.instagramUrl) {
    return null;
  }

  if (intent.wantsCoffeeStand && place.category !== "coffee_stand") {
    return null;
  }

  return {
    ...place,
    isWithinSearchArea: true,
    recommendationMode: "gis_rule_based",
  };
}

export async function searchNearbyPlaces(
  center: SearchCenter,
  intent: ParsedIntent,
): Promise<Place[]> {
  return mockPlaces
    .map((place) => toScopedPlace(place, center, intent))
    .filter((place): place is Place => place !== null);
}
