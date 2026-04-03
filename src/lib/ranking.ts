import type { ParsedIntent, Place } from "../types";

const tagWeights: Record<string, number> = {
  quiet: 18,
  cozy: 16,
  atmosphere: 16,
  study: 15,
  specialty: 14,
  roastery: 16,
  spacious: 12,
  sweet: 10,
  morning: 10,
  terrace: 10,
};

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function calculateDistanceMeters(
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

export function rankPlaces(
  places: Place[],
  intent: ParsedIntent,
  center: { latitude: number; longitude: number },
): Place[] {
  return places
    .map((place) => {
      const distanceMeters = calculateDistanceMeters(
        center.latitude,
        center.longitude,
        place.latitude,
        place.longitude,
      );

      let score = 50;
      const whyThisPlace: string[] = [];

      if (place.isWithinSearchArea) {
        score += 8;
        whyThisPlace.push("自由が丘の対象範囲内に収まる");
      }

      if (place.category === "bean_store") {
        whyThisPlace.push("豆購入目的にも対応できる候補");
      } else if (place.category === "both") {
        score += 6;
        whyThisPlace.push("カフェ利用と豆購入の両方に対応");
      }

      for (const tag of intent.tags) {
        if (place.tags.includes(tag)) {
          score += tagWeights[tag] ?? 8;
          whyThisPlace.push(`「${tagLabel(tag)}」志向に合致`);
        }
      }

      if (distanceMeters < 500) {
        score += 20;
        whyThisPlace.push("徒歩圏でアクセスしやすい");
      } else if (distanceMeters < 1200) {
        score += 12;
        whyThisPlace.push("近場で移動負荷が低い");
      } else if (distanceMeters < 2200) {
        score += 6;
        whyThisPlace.push("少し移動すれば届く範囲");
      }

      place.semanticReasons.forEach((reason) => {
        if (whyThisPlace.length < 3) {
          whyThisPlace.push(reason);
        }
      });

      return {
        ...place,
        distanceMeters,
        spatialReason: formatDistance(distanceMeters, place.isWithinSearchArea),
        score,
        whyThisPlace: whyThisPlace.slice(0, 3),
      };
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

export function formatDistance(distanceMeters: number, isWithinSearchArea?: boolean): string {
  if (distanceMeters < 1000) {
    return `${isWithinSearchArea ? "自由が丘中心から" : "中心地から"}約${Math.round(distanceMeters)}m`;
  }

  return `${isWithinSearchArea ? "自由が丘中心から" : "中心地から"}約${(
    distanceMeters / 1000
  ).toFixed(1)}km`;
}

export function tagLabel(tag: string): string {
  const labels: Record<string, string> = {
    quiet: "静か",
    cozy: "居心地",
    atmosphere: "雰囲気",
    study: "作業向き",
    specialty: "スペシャルティ",
    roastery: "ロースター",
    spacious: "広さ",
    sweet: "スイーツ",
    morning: "朝向き",
    terrace: "テラス",
  };

  return labels[tag] ?? tag;
}
