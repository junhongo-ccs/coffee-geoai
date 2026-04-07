import csvRaw from "./coffee  map - coffee-map-spots.csv?raw";
import type { Place, PlaceTag, VenueCategory } from "../types";

const placeTags: PlaceTag[] = [
  "coffee_stand",
  "quiet",
  "cozy",
  "atmosphere",
  "study",
  "specialty",
  "roastery",
  "kissaten",
  "chain",
  "beans_only",
  "spacious",
  "sweet",
  "morning",
  "terrace",
];

const placeTagSet = new Set(placeTags);
const venueCategorySet = new Set<VenueCategory>(["coffee_shop", "coffee_stand", "bean_store", "both"]);

type CsvRow = Record<string, string>;

function stripBom(value: string): string {
  return value.replace(/^\uFEFF/, "");
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"') {
      const next = text[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[i + 1] === "\n") {
        i += 1;
      }

      row.push(current);
      if (row.length > 1 || row[0] !== "") {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows;
}

function toCsvRows(text: string): CsvRow[] {
  const parsed = parseCsv(text);
  if (parsed.length === 0) {
    return [];
  }

  const [rawHeaders, ...rawRows] = parsed;
  const headers = rawHeaders.map((header) => stripBom(header).trim());

  return rawRows.map((values) => {
    const row: CsvRow = {};
    for (let i = 0; i < headers.length; i += 1) {
      row[headers[i]] = (values[i] ?? "").trim();
    }
    return row;
  });
}

function toOptionalString(value: string | undefined): string | undefined {
  const normalized = value?.trim() ?? "";
  return normalized === "" ? undefined : normalized;
}

function toNumber(value: string | undefined): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isPlaceTag(value: string): value is PlaceTag {
  return placeTagSet.has(value as PlaceTag);
}

function toTags(value: string | undefined): PlaceTag[] {
  const raw = value?.trim() ?? "";
  if (!raw) {
    return [];
  }

  return raw
    .split(/[|｜]/)
    .map((tag) => tag.trim())
    .filter((tag): tag is PlaceTag => isPlaceTag(tag));
}

function toSemanticReasons(value: string | undefined): string[] {
  const raw = value?.trim() ?? "";
  if (!raw) {
    return [];
  }

  return raw
    .split(/[|｜]/)
    .map((reason) => reason.trim())
    .filter((reason) => reason.length > 0);
}

function toCategory(value: string | undefined): VenueCategory {
  const normalized = value?.trim() ?? "";
  return venueCategorySet.has(normalized as VenueCategory)
    ? (normalized as VenueCategory)
    : "coffee_shop";
}

function toPlace(row: CsvRow): Place | null {
  const id = row.id?.trim() ?? "";
  const name = row.name?.trim() ?? "";
  const latitude = toNumber(row.latitude);
  const longitude = toNumber(row.longitude);

  if (!id || !name || latitude === null || longitude === null) {
    return null;
  }

  return {
    id,
    name,
    latitude,
    longitude,
    address: row.address?.trim() ?? "",
    instagramHandle: toOptionalString(row.instagram_handle),
    instagramUrl: toOptionalString(row.instagram_url),
    source: "curated",
    category: toCategory(row.category),
    tags: toTags(row.tags),
    description: row.description?.trim() ?? "",
    semanticReasons: toSemanticReasons(row.semantic_reasons),
  };
}

// Source of truth for user-facing spot descriptions is the CSV file.
export const mockPlaces: Place[] = toCsvRows(csvRaw)
  .map((row) => toPlace(row))
  .filter((place): place is Place => place !== null);
