import { lazy, Suspense, useEffect, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { parseIntent } from "./lib/intent";
import { jiyugaokaCenter, searchNearbyPlaces } from "./lib/places";
import { rankPlaces, tagLabel } from "./lib/ranking";
import type { ParsedIntent, Place, SearchCenter, VenueCategory } from "./types";

const SceneMap = lazy(() => import("./components/SceneMap"));

export default function App() {
  const [draftQuery, setDraftQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [center] = useState<SearchCenter>(jiyugaokaCenter);
  const [places, setPlaces] = useState<Place[]>([]);
  const [intent, setIntent] = useState<ParsedIntent | null>(null);
  const [previewIntent, setPreviewIntent] = useState<ParsedIntent | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetToCenterKey, setResetToCenterKey] = useState(0);

  const showAllPoints = intent?.wantsAllPoints ?? false;
  const rankedPlaces = rankPlaces(places, intent ?? emptyIntent(submittedQuery), center).slice(
    0,
    showAllPoints ? places.length : 10,
  );
  const hasQuery = submittedQuery.trim().length > 0;
  const resultSummary = loading
    ? "候補を計算中"
    : rankedPlaces.length > 0
      ? showAllPoints
        ? `自由が丘エリアの全 ${rankedPlaces.length} 件を表示`
        : hasQuery
        ? `自由が丘で ${rankedPlaces.length} 件の候補を提示`
        : ""
      : "条件に合う候補が見つかりません";

  useEffect(() => {
    let active = true;

    async function runSearch() {
      setLoading(true);
      const nextIntent = await parseIntent(submittedQuery);
      const results = await searchNearbyPlaces(center, nextIntent);
      const nextShowAllPoints = nextIntent.wantsAllPoints;
      const nextRankedPlaces = rankPlaces(results, nextIntent, center).slice(
        0,
        nextShowAllPoints ? results.length : 10,
      );

      if (!active) {
        return;
      }

      setIntent(nextIntent);
      setPlaces(results);
      setSelectedPlaceId((current) => {
        if (!current) {
          return null;
        }

        return nextRankedPlaces.some((place) => place.id === current) ? current : null;
      });
      setLoading(false);
    }

    void runSearch();

    return () => {
      active = false;
    };
  }, [center, submittedQuery]);

  useEffect(() => {
    const nextDraft = draftQuery.trim();

    if (!nextDraft || nextDraft === submittedQuery.trim()) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSubmittedQuery(nextDraft);
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, [draftQuery, submittedQuery]);

  useEffect(() => {
    const nextDraft = draftQuery.trim();

    if (!nextDraft) {
      setPreviewIntent(null);
      setPreviewLoading(false);
      return;
    }

    if (nextDraft === submittedQuery.trim() && intent) {
      setPreviewIntent(intent);
      setPreviewLoading(false);
      return;
    }

    let active = true;
    setPreviewLoading(true);

    const timer = window.setTimeout(() => {
      void parseIntent(nextDraft).then((nextIntent) => {
        if (!active) {
          return;
        }

        setPreviewIntent(nextIntent);
        setPreviewLoading(false);
      });
    }, 450);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [draftQuery, submittedQuery, intent]);

  function handleResetToCenter() {
    setSelectedPlaceId(null);
    setResetToCenterKey((current) => current + 1);
  }

  function handleSubmitSearch() {
    setSubmittedQuery(draftQuery.trim());
  }

  function handleQueryKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    handleSubmitSearch();
  }

  function handleDraftChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const textarea = event.target;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
    setDraftQuery(textarea.value);
  }

  return (
    <div className="h-dvh overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_32%),linear-gradient(135deg,_#f5f1e8_0%,_#f7f7f5_45%,_#e8f0ee_100%)] text-stone-900">
      <div className="mx-auto grid h-full max-w-[1920px] min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-4 px-6 py-5">
        <header className="flex min-w-0 items-center gap-6 overflow-hidden rounded-[18px] border border-[#8d6a52]/35 bg-[linear-gradient(135deg,_rgba(103,74,54,0.96)_0%,_rgba(129,95,70,0.95)_52%,_rgba(160,121,91,0.96)_100%)] px-5 py-3 shadow-[0_20px_80px_rgba(91,58,38,0.2)] backdrop-blur">
          <button
            type="button"
            onClick={handleResetToCenter}
            className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.32em] text-white transition hover:text-[#f8efe6]"
          >
            Jiyugaoka Coffee Recommendation
          </button>
          <div className="h-4 w-px bg-white/22" />
          <div className="flex min-w-0 flex-wrap items-center gap-5 text-sm text-stone-100">
            <StatusItem value="ホンゴウ厳選31スポットを完全網羅（ロード時は駅チカ１０件を表示）！" />
          </div>
        </header>

        <main className="grid min-h-0 min-w-0 gap-4 lg:grid-cols-[420px_minmax(0,1fr)] 2xl:grid-cols-[460px_minmax(0,1fr)]">
          <section className="min-h-0 min-w-0 overflow-y-auto rounded-[30px] border border-white/60 bg-white/78 p-5 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
                  Intent Search
                </p>
                <label className="mt-3 block">
                  <span className="mb-2 block text-lg font-semibold text-stone-950">
                    自由が丘で、どんなコーヒー体験を探していますか
                  </span>
                  <div className="relative">
                    <textarea
                      value={draftQuery}
                      onChange={handleDraftChange}
                      onKeyDown={handleQueryKeyDown}
                      className="min-h-20 w-full overflow-y-hidden rounded-[24px] border border-[#b79376] bg-[#fff] px-4 py-4 text-xs leading-6 text-stone-900 outline-none transition focus:border-[#8d6a52] focus:bg-[#fff] focus:outline-none"
                      placeholder="自然言語で入力してください。入力内容から LLM が意図タグを抽出して、候補の選び方に反映します。"
                    />
                  </div>
                </label>
                {draftQuery.trim() ? (
                  <div className="mt-3 rounded-[20px] border border-stone-200/80 bg-white/70 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
                        Live Intent Tags
                      </p>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">
                        {previewLoading ? "Parsing..." : previewIntent?.interpretationMode === "gemini" ? "Gemini" : "Rule Based"}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-stone-700">
                      {previewIntent?.summary ?? "入力内容を解釈中"}
                    </p>
                    {!previewLoading && previewIntent?.interpretationDetail ? (
                      <p className="mt-2 text-xs text-stone-500">{previewIntent.interpretationDetail}</p>
                    ) : null}
                    {previewIntent && previewIntent.distancePreference !== "any" ? (
                      <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-teal-700">
                        距離条件: {distancePreferenceLabel(previewIntent.distancePreference)}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {previewIntent?.mustHaveTags.map((tag) => (
                        <Badge key={`preview-must-${tag}`} tone="teal">{`MUST ${tagLabel(tag)}`}</Badge>
                      ))}
                      {previewIntent?.niceToHaveTags
                        .filter((tag) => !previewIntent.mustHaveTags.includes(tag))
                        .map((tag) => (
                          <Badge key={`preview-nice-${tag}`} tone="slate">
                            {tagLabel(tag)}
                          </Badge>
                        ))}
                      {previewIntent?.avoidTags.map((tag) => (
                        <Badge key={`preview-avoid-${tag}`} tone="slate">{`AVOID ${tagLabel(tag)}`}</Badge>
                      ))}
                      {!previewLoading && previewIntent && previewIntent.tags.length === 0 ? (
                        <span className="text-xs text-stone-500">まだタグが抽出されていません。</span>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-stone-900">
                    {showAllPoints ? "All recommendations" : "Recommendations"}
                  </p>
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                    {loading ? "Loading" : `${rankedPlaces.length} results`}
                  </p>
                </div>
                {resultSummary ? <p className="mb-3 text-sm leading-6 text-stone-600">{resultSummary}</p> : null}
                <p className="mb-4 text-xs leading-6 text-stone-500">
                  {hasQuery
                    ? showAllPoints
                      ? "隠しコマンドを検出したため、自由が丘エリアの全ポイントを表示しています。"
                      : ""
                    : "未入力時も、距離とカテゴリを加味した総合順で 10 件を表示します。"}
                </p>
                <div className="space-y-2.5">
                  {rankedPlaces.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => setSelectedPlaceId(place.id)}
                      className={`w-full rounded-[22px] border px-4 py-3.5 text-left transition ${
                        selectedPlaceId === place.id
                          ? "border-amber-500 bg-amber-50 shadow-[0_12px_28px_rgba(245,158,11,0.18)]"
                          : "border-stone-200 bg-white hover:border-stone-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div>
                          <h2 className="text-lg font-semibold text-stone-950">{place.name}</h2>
                          <p className="mt-1 text-sm text-stone-600">{place.address}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge tone="coffee">{categoryLabel(place.category)}</Badge>
                          </div>
                          {place.instagramHandle ? (
                            <a
                              href={place.instagramUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(event) => event.stopPropagation()}
                              className="mt-3 inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 transition hover:border-rose-300 hover:text-rose-800"
                            >
                              Instagram {place.instagramHandle}
                            </a>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {place.tags.slice(0, 4).map((tag) => (
                          <span
                            key={`${place.id}-${tag}`}
                            className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700"
                          >
                            {tagLabel(tag)}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2.5 text-sm leading-6 text-stone-700">{place.description}</p>
                      <p className="mt-1.5 text-xs font-medium uppercase tracking-[0.2em] text-teal-700">
                        {place.spatialReason}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="flex h-full min-h-0 min-w-0">
            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-white/60 bg-white/75 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              <Suspense
                fallback={
                  <div className="flex min-h-0 flex-1 items-center justify-center bg-stone-100 text-sm text-stone-500">
                    map を読み込み中...
                  </div>
                }
              >
                <div className="min-h-0 min-w-0 flex-1">
                  <SceneMap
                    center={center}
                    places={rankedPlaces}
                    selectedPlaceId={selectedPlaceId}
                    resetToCenterKey={resetToCenterKey}
                    onSelectPlace={setSelectedPlaceId}
                  />
                </div>
              </Suspense>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function StatusItem({ label, value }: { label?: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      {label ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/65">
          {label}
        </p>
      ) : null}
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function Badge({ children, tone }: { children: string; tone: "teal" | "slate" | "coffee" }) {
  const className =
    tone === "teal"
      ? "bg-teal-100 text-teal-800 border border-teal-200"
      : tone === "coffee"
        ? "border border-[#d8c4b0] bg-[#f3e7d8] text-[#5b3a26]"
      : "bg-stone-100 text-stone-700 border border-stone-200";

  return <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${className}`}>{children}</span>;
}

function categoryLabel(category: VenueCategory): string {
  if (category === "both") {
    return "CAFE + BEANS";
  }

  if (category === "coffee_stand") {
    return "COFFEE STAND";
  }

  if (category === "bean_store") {
    return "BEAN STORE";
  }

  return "COFFEE SHOP";
}

function distancePreferenceLabel(value: ParsedIntent["distancePreference"]): string {
  if (value === "near_station") {
    return "駅近優先";
  }

  if (value === "walkable") {
    return "徒歩圏を優先";
  }

  return "指定なし";
}

function emptyIntent(query: string): ParsedIntent {
  return {
    original: query,
    normalized: query.trim(),
    tags: [],
    mustHaveTags: [],
    niceToHaveTags: [],
    avoidTags: [],
    vibeNotes: [],
    wantsRoastery: false,
    wantsBeanStore: false,
    wantsWorkFriendly: false,
    wantsCoffeeStand: false,
    wantsInstagram: false,
    wantsAllPoints: false,
    distancePreference: "any",
    keywords: [],
    interpretationMode: "rule_based",
    interpretationDetail: "未入力のためルールベース待機中",
  };
}
