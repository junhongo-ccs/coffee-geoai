import type { ParsedIntent, PlaceTag } from "../types";

type IntentRule = {
  pattern: RegExp;
  tags: PlaceTag[];
  notes: string[];
  keywords?: string[];
};

const rules: IntentRule[] = [
  {
    pattern: /(静か|落ち着|ゆっくり|ひとり|読書)/,
    tags: ["quiet", "cozy"],
    notes: ["静かさを重視"],
    keywords: ["quiet", "calm"],
  },
  {
    pattern: /(雰囲気|いい感じ|おしゃれ|センス|空気感)/,
    tags: ["atmosphere", "cozy"],
    notes: ["空間の雰囲気を重視"],
    keywords: ["atmosphere", "cozy"],
  },
  {
    pattern: /(作業|勉強|PC|仕事|電源|Wi-?Fi)/i,
    tags: ["study", "spacious", "quiet"],
    notes: ["作業しやすさを重視"],
    keywords: ["work friendly", "study cafe"],
  },
  {
    pattern: /(喫茶|純喫茶|ケーキセット|ジャズ|長居|ゆったり|クラシック)/,
    tags: ["quiet", "cozy", "sweet", "atmosphere"],
    notes: ["喫茶店らしい滞在感を重視"],
    keywords: ["kissaten", "cake set", "relaxing cafe"],
  },
  {
    pattern: /(豆|焙煎|ロースタ|浅煎り|深煎り|スペシャルティ)/,
    tags: ["specialty", "roastery"],
    notes: ["コーヒーの質や焙煎体験を重視"],
    keywords: ["specialty coffee", "roastery"],
  },
  {
    pattern: /(朝|モーニング|午前)/,
    tags: ["morning"],
    notes: ["朝に使いやすい店を希望"],
    keywords: ["morning cafe"],
  },
  {
    pattern: /(広い|開放感|ベビーカー|席数)/,
    tags: ["spacious"],
    notes: ["空間の広さを重視"],
    keywords: ["spacious"],
  },
  {
    pattern: /(甘い|スイーツ|ケーキ|ラテ|デザート)/,
    tags: ["sweet", "cozy"],
    notes: ["ドリンク以外の満足度も重視"],
    keywords: ["dessert cafe"],
  },
  {
    pattern: /(テラス|外|景色|公園)/,
    tags: ["terrace", "atmosphere"],
    notes: ["外の抜け感を重視"],
    keywords: ["terrace cafe"],
  },
];

export function parseIntent(input: string): ParsedIntent {
  const normalized = input.trim().replace(/\s+/g, " ");
  const tags = new Set<PlaceTag>();
  const notes = new Set<string>();
  const keywords = new Set<string>(["coffee shop", "cafe"]);
  const wantsInstagram = /(インスタ|instagram|Instagram|ig\b|SNS)/i.test(normalized);

  for (const rule of rules) {
    if (!rule.pattern.test(normalized)) {
      continue;
    }

    rule.tags.forEach((tag) => tags.add(tag));
    rule.notes.forEach((note) => notes.add(note));
    rule.keywords?.forEach((keyword) => keywords.add(keyword));
  }

  if (tags.size === 0) {
    tags.add("atmosphere");
    tags.add("cozy");
    notes.add("あいまいな好みを雰囲気重視として解釈");
  }

  return {
    original: input,
    normalized,
    tags: [...tags],
    vibeNotes: [...notes],
    wantsRoastery: tags.has("roastery"),
    wantsWorkFriendly: tags.has("study"),
    wantsInstagram,
    keywords: [...keywords],
  };
}
