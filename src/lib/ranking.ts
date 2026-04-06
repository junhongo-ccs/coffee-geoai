import type { ParsedIntent, Place } from "../types";

const tagWeights: Record<string, number> = {
  quiet: 18,
  cozy: 16,
  atmosphere: 16,
  study: 15,
  specialty: 14,
  roastery: 16,
  kissaten: 16,
  chain: 14,
  beans_only: 18,
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
  const wantsQuickStop = /(気軽|ふらっと|サクッと|ちょっと寄りたい|軽く一杯|立ち寄りたい)/.test(
    intent.normalized,
  );

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
      const matchedTags: Place["matchedTags"] = [];

      if (place.isWithinSearchArea) {
        score += 8;
        whyThisPlace.push("自由が丘の対象範囲内に収まる");
      }

      if (place.category === "bean_store") {
        score += intent.wantsBeanStore ? 8 : 0;
        whyThisPlace.push("豆購入目的にも対応できる候補");
      } else if (place.category === "coffee_stand") {
        score += intent.wantsCoffeeStand ? 10 : 4;
        whyThisPlace.push("ふらっと立ち寄りやすいスタンド形態");
      } else if (place.category === "both") {
        score += 6;
        whyThisPlace.push("カフェ利用と豆購入の両方に対応");
      }

      if (wantsQuickStop) {
        const quickStopSignals = [
          place.description,
          ...place.semanticReasons,
          place.name,
        ].join(" ");
        const hasQuickStopSignal =
          /(小さ|立ち寄り|短時間|入りやす|テイクアウト|軽い滞在|気軽)/.test(quickStopSignals);

        if (place.category === "coffee_stand") {
          score += 18;
          whyThisPlace.push("短時間で立ち寄りやすい");
        } else if (hasQuickStopSignal) {
          score += 10;
          whyThisPlace.push("気軽な一杯に向く小回りのよい店");
        }

        if (place.tags.includes("spacious") || place.tags.includes("study")) {
          score -= 8;
        }
      }

      for (const tag of intent.mustHaveTags) {
        if (place.tags.includes(tag)) {
          score += (tagWeights[tag] ?? 8) + 10;
          whyThisPlace.push(`必須条件の「${tagLabel(tag)}」に合致`);
          matchedTags.push(tag);
        } else {
          score -= 28;
        }
      }

      for (const tag of intent.niceToHaveTags) {
        if (place.tags.includes(tag)) {
          score += tagWeights[tag] ?? 8;
          whyThisPlace.push(`「${tagLabel(tag)}」志向に合致`);
          if (!matchedTags.includes(tag)) {
            matchedTags.push(tag);
          }
        }
      }

      for (const tag of intent.avoidTags) {
        if (place.tags.includes(tag)) {
          score -= (tagWeights[tag] ?? 8) + 10;
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

      if (intent.distancePreference === "near_station") {
        if (distanceMeters < 400) {
          score += 18;
          whyThisPlace.push("駅近を優先する意図に合う");
        } else if (distanceMeters < 800) {
          score += 10;
        } else {
          score -= 10;
        }
      } else if (intent.distancePreference === "walkable") {
        if (distanceMeters < 900) {
          score += 8;
        } else if (distanceMeters > 1600) {
          score -= 6;
        }
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
        matchedTags,
        whyThisPlace: whyThisPlace.slice(0, 3),
      };
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

export function formatDistance(distanceMeters: number, _isWithinSearchArea?: boolean): string {
  const walkingMinutes = Math.max(1, Math.round(distanceMeters / 80));

  return `自由が丘駅から約徒歩${walkingMinutes}分`;
}

export function tagLabel(tag: string): string {
  const labels: Record<string, string> = {
    quiet: "静か",
    cozy: "居心地",
    atmosphere: "雰囲気",
    study: "作業向き",
    specialty: "スペシャルティ",
    roastery: "ロースター",
    kissaten: "喫茶店",
    chain: "チェーン",
    beans_only: "豆専門",
    spacious: "広さ",
    sweet: "スイーツ",
    morning: "朝向き",
    terrace: "テラス",
  };

  return labels[tag] ?? tag;
}
