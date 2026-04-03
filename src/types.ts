export type PlaceTag =
  | "quiet"
  | "cozy"
  | "atmosphere"
  | "study"
  | "specialty"
  | "roastery"
  | "spacious"
  | "sweet"
  | "morning"
  | "terrace";

export type PlaceSource = "mock" | "arcgis";

export type SearchCenter = {
  latitude: number;
  longitude: number;
  label: string;
};

export type ParsedIntent = {
  original: string;
  normalized: string;
  tags: PlaceTag[];
  vibeNotes: string[];
  wantsRoastery: boolean;
  wantsWorkFriendly: boolean;
  keywords: string[];
};

export type Place = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  source: PlaceSource;
  distanceMeters?: number;
  tags: PlaceTag[];
  description: string;
  semanticReasons: string[];
  spatialReason?: string;
  score?: number;
  whyThisPlace?: string[];
};
