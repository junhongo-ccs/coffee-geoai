export type PlaceTag =
  | "quiet"
  | "cozy"
  | "atmosphere"
  | "study"
  | "specialty"
  | "roastery"
  | "kissaten"
  | "chain"
  | "beans_only"
  | "spacious"
  | "sweet"
  | "morning"
  | "terrace";

export type PlaceSource = "curated";

export type VenueCategory = "coffee_shop" | "coffee_stand" | "bean_store" | "both";

export type RecommendationMode = "gis_rule_based";

export type SearchCenter = {
  id?: string;
  latitude: number;
  longitude: number;
  label: string;
  radiusMeters?: number;
  ward?: string;
};

export type ParsedIntent = {
  original: string;
  normalized: string;
  tags: PlaceTag[];
  mustHaveTags: PlaceTag[];
  niceToHaveTags: PlaceTag[];
  avoidTags: PlaceTag[];
  vibeNotes: string[];
  wantsRoastery: boolean;
  wantsBeanStore: boolean;
  wantsWorkFriendly: boolean;
  wantsCoffeeStand: boolean;
  wantsInstagram: boolean;
  keywords: string[];
  summary?: string;
  interpretationMode: "rule_based" | "gemini";
};

export type Place = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  instagramHandle?: string;
  instagramUrl?: string;
  source: PlaceSource;
  category: VenueCategory;
  isWithinSearchArea?: boolean;
  distanceMeters?: number;
  tags: PlaceTag[];
  description: string;
  semanticReasons: string[];
  spatialReason?: string;
  score?: number;
  whyThisPlace?: string[];
  recommendationMode?: RecommendationMode;
};
