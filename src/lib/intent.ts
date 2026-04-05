import type { ParsedIntent, PlaceTag } from "../types";

type IntentRule = {
  pattern: RegExp;
  tags: PlaceTag[];
  notes: string[];
  keywords?: string[];
};

type GeminiIntentPayload = {
  must_have_tags?: string[];
  nice_to_have_tags?: string[];
  avoid_tags?: string[];
  wants_coffee_stand?: boolean;
  wants_bean_store?: boolean;
  wants_instagram?: boolean;
  summary?: string;
  notes?: string[];
  keywords?: string[];
};

const allowedTags: PlaceTag[] = [
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
    tags: ["quiet", "cozy", "sweet", "atmosphere", "kissaten"],
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
    pattern: /(豆だけ|豆専門|焙煎豆専門|飲まずに豆|豆を買いたいだけ)/,
    tags: ["beans_only", "roastery"],
    notes: ["豆だけ購入したい意図を検出"],
    keywords: ["beans only", "buy beans"],
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

function isPlaceTag(value: string): value is PlaceTag {
  return allowedTags.includes(value as PlaceTag);
}

function uniqueTags(values: string[] | undefined): PlaceTag[] {
  return [...new Set((values ?? []).filter(isPlaceTag))];
}

function uniqueStrings(values: string[] | undefined): string[] {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
}

function buildIntent(input: string, draft: Partial<ParsedIntent>): ParsedIntent {
  const normalized = input.trim().replace(/\s+/g, " ");
  const mustHaveTags = [...new Set(draft.mustHaveTags ?? [])];
  const niceToHaveTags = [...new Set([...(draft.niceToHaveTags ?? []), ...mustHaveTags])];
  const avoidTags = [...new Set(draft.avoidTags ?? [])].filter((tag) => !mustHaveTags.includes(tag));
  const tags = [...new Set([...mustHaveTags, ...niceToHaveTags])];
  const wantsCoffeeStand = draft.wantsCoffeeStand ?? false;
  const wantsInstagram = draft.wantsInstagram ?? false;
  const wantsBeanStore =
    draft.wantsBeanStore ?? (/(豆|焙煎|ロースタ|浅煎り|深煎り)/.test(normalized));
  const wantsRoastery =
    draft.wantsRoastery ??
    (tags.includes("roastery") || mustHaveTags.includes("roastery"));
  const wantsWorkFriendly =
    draft.wantsWorkFriendly ??
    (tags.includes("study") || mustHaveTags.includes("study"));
  const vibeNotes = uniqueStrings(draft.vibeNotes);
  const keywords = uniqueStrings(draft.keywords);

  return {
    original: input,
    normalized,
    tags,
    mustHaveTags,
    niceToHaveTags,
    avoidTags,
    vibeNotes,
    wantsRoastery,
    wantsBeanStore,
    wantsWorkFriendly,
    wantsCoffeeStand,
    wantsInstagram,
    keywords,
    summary: draft.summary?.trim() || undefined,
    interpretationMode: draft.interpretationMode ?? "rule_based",
  };
}

export function parseIntentRuleBased(input: string): ParsedIntent {
  const normalized = input.trim().replace(/\s+/g, " ");
  const tags = new Set<PlaceTag>();
  const avoidTags = new Set<PlaceTag>();
  const notes = new Set<string>();
  const keywords = new Set<string>(["coffee shop", "cafe"]);
  const wantsBeanStore = /(豆|焙煎|ロースタ|浅煎り|深煎り)/.test(normalized);
  const wantsBeansOnly = /(豆だけ|豆専門|焙煎豆専門|飲まずに豆|豆を買いたいだけ)/.test(normalized);
  const wantsCoffeeStand = /(コーヒースタンド|スタンド|ふらっと|サクッと|気軽|テイクアウト|持ち帰り)/i.test(
    normalized,
  );
  const wantsInstagram = /(インスタ|instagram|Instagram|ig\b|SNS)/i.test(normalized);
  const avoidChain = /(チェーン|スタバ|スターバックス|上島|ドトール|タリーズ).*(避け|いや|以外|除く)|((避けたい|苦手|いや).*(チェーン|スタバ|スターバックス|上島|ドトール|タリーズ))/.test(
    normalized,
  );

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

  if (wantsBeansOnly) {
    tags.add("beans_only");
    tags.add("roastery");
  }

  if (avoidChain) {
    avoidTags.add("chain");
    notes.add("チェーン店を避けたい意図を検出");
  }

  return buildIntent(input, {
    mustHaveTags: wantsBeansOnly ? ["beans_only"] : wantsBeanStore ? ["roastery"] : [],
    niceToHaveTags: [...tags],
    avoidTags: [...avoidTags],
    vibeNotes: [...notes],
    wantsRoastery: tags.has("roastery") || wantsBeansOnly,
    wantsBeanStore,
    wantsWorkFriendly: tags.has("study"),
    wantsCoffeeStand,
    wantsInstagram,
    keywords: [...keywords],
    summary: normalized || "自由が丘のコーヒー候補を探す",
    interpretationMode: "rule_based",
  });
}

async function requestGeminiIntent(input: string): Promise<GeminiIntentPayload> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  const model = import.meta.env.VITE_GEMINI_MODEL?.trim() || "gemini-2.5-flash";

  if (!apiKey || !input.trim()) {
    throw new Error("gemini unavailable");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        generationConfig: {
          responseMimeType: "application/json",
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  "You convert a Japanese cafe search request into strict JSON.",
                  "Return only JSON.",
                  `Allowed tags: ${allowedTags.join(", ")}`,
                  "Use must_have_tags only for clear non-negotiable constraints.",
                  "Use nice_to_have_tags for softer preferences.",
                  "Use avoid_tags for mismatches the user seems to reject.",
                  "Use kissaten when the user wants a classic cafe or pure coffeehouse feel.",
                  "Use chain in avoid_tags when the user wants to avoid chains or large brands.",
                  "Use beans_only only when they explicitly want bean-only specialty shops and do not need a drink.",
                  "Set wants_bean_store true only when the user clearly wants beans, roasting, or bean purchase.",
                  "Set wants_coffee_stand true only when they clearly want a stand or quick takeaway style.",
                  "Set wants_instagram true only when they ask for Instagram or social accounts.",
                  "Keep summary short Japanese text.",
                  `Input: ${input}`,
                  'JSON shape: {"must_have_tags":[],"nice_to_have_tags":[],"avoid_tags":[],"wants_coffee_stand":false,"wants_bean_store":false,"wants_instagram":false,"summary":"","notes":[],"keywords":[]}',
                ].join("\n"),
              },
            ],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`gemini failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("gemini empty");
  }

  return JSON.parse(text) as GeminiIntentPayload;
}

function buildGeminiIntent(input: string, payload: GeminiIntentPayload): ParsedIntent {
  const normalized = input.trim().replace(/\s+/g, " ");
  const fallback = parseIntentRuleBased(input);
  const mustHaveTags = uniqueTags(payload.must_have_tags);
  const niceToHaveTags = uniqueTags(payload.nice_to_have_tags).filter(
    (tag) => !mustHaveTags.includes(tag),
  );
  const avoidTags = uniqueTags(payload.avoid_tags).filter(
    (tag) => !mustHaveTags.includes(tag) && !niceToHaveTags.includes(tag),
  );
  const wantsBeanStore = payload.wants_bean_store ?? fallback.wantsBeanStore;
  const wantsCoffeeStand = payload.wants_coffee_stand ?? fallback.wantsCoffeeStand;
  const wantsInstagram = payload.wants_instagram ?? fallback.wantsInstagram;
  const vibeNotes = uniqueStrings([...fallback.vibeNotes, ...(payload.notes ?? [])]);
  const keywords = uniqueStrings([...fallback.keywords, ...(payload.keywords ?? [])]);

  const completedMustHaveTags = [...mustHaveTags];
  const completedNiceToHaveTags = [...niceToHaveTags];

  if (completedMustHaveTags.length === 0 && completedNiceToHaveTags.length === 0) {
    completedNiceToHaveTags.push(...fallback.niceToHaveTags);
  }

  if (wantsBeanStore && !completedMustHaveTags.includes("roastery") && !completedNiceToHaveTags.includes("roastery")) {
    completedMustHaveTags.push("roastery");
  }

  if (
    completedMustHaveTags.includes("beans_only") &&
    !completedMustHaveTags.includes("roastery") &&
    !completedNiceToHaveTags.includes("roastery")
  ) {
    completedMustHaveTags.push("roastery");
  }

  return buildIntent(input, {
    mustHaveTags: completedMustHaveTags,
    niceToHaveTags: completedNiceToHaveTags,
    avoidTags,
    vibeNotes,
    wantsRoastery: completedMustHaveTags.includes("roastery") || completedNiceToHaveTags.includes("roastery"),
    wantsBeanStore,
    wantsWorkFriendly: completedMustHaveTags.includes("study") || completedNiceToHaveTags.includes("study"),
    wantsCoffeeStand,
    wantsInstagram,
    keywords,
    summary: payload.summary?.trim() || normalized || fallback.summary,
    interpretationMode: "gemini",
  });
}

export async function parseIntent(input: string): Promise<ParsedIntent> {
  const fallback = parseIntentRuleBased(input);

  if (!input.trim()) {
    return fallback;
  }

  try {
    const payload = await requestGeminiIntent(input);
    return buildGeminiIntent(input, payload);
  } catch {
    return fallback;
  }
}
