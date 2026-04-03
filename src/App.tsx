import { lazy, Suspense, useEffect, useState } from "react";
import { parseIntent } from "./lib/intent";
import { jiyugaokaCenter, searchNearbyPlaces } from "./lib/places";
import { rankPlaces, tagLabel } from "./lib/ranking";
import type { Place, SearchCenter, VenueCategory } from "./types";

const SceneMap = lazy(() => import("./components/SceneMap"));

const starterPrompts = [
  "静かで作業しやすい自由が丘のカフェ",
  "雰囲気いいロースターで豆も見たい",
  "朝に入りやすくて居心地がいいお店",
];

const showAllPattern = /全ポイントが見たい|全ポイント|全部見たい|全件見たい|全部表示/i;

export default function App() {
  const [query, setQuery] = useState("");
  const [center] = useState<SearchCenter>(jiyugaokaCenter);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetToCenterKey, setResetToCenterKey] = useState(0);

  const intent = parseIntent(query);
  const showAllPoints = showAllPattern.test(query);
  const rankedPlaces = rankPlaces(places, intent, center).slice(
    0,
    showAllPoints ? places.length : 10,
  );
  const selectedPlace =
    rankedPlaces.find((place) => place.id === selectedPlaceId) ?? rankedPlaces[0] ?? null;
  const hasQuery = query.trim().length > 0;
  const resultSummary = loading
    ? "候補を計算中"
    : rankedPlaces.length > 0
      ? showAllPoints
        ? `自由が丘エリアの全 ${rankedPlaces.length} 件を表示`
        : hasQuery
        ? `自由が丘で ${rankedPlaces.length} 件の候補を提示`
        : `自由が丘駅から近い順で ${rankedPlaces.length} 件を表示`
      : "条件に合う候補が見つかりません";

  useEffect(() => {
    let active = true;

    async function runSearch() {
      setLoading(true);
      const results = await searchNearbyPlaces(center, intent);

      if (!active) {
        return;
      }

      setPlaces(results);
      setSelectedPlaceId(
        rankPlaces(results, intent, center)
          .slice(0, showAllPoints ? results.length : 10)[0]?.id ?? null,
      );
      setLoading(false);
    }

    void runSearch();

    return () => {
      active = false;
    };
  }, [center, query, showAllPoints]);

  function handleResetToCenter() {
    setSelectedPlaceId(null);
    setResetToCenterKey((current) => current + 1);
  }

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_32%),linear-gradient(135deg,_#f5f1e8_0%,_#f7f7f5_45%,_#e8f0ee_100%)] text-stone-900">
      <div className="mx-auto flex h-screen max-w-[1920px] min-w-0 flex-col px-6 py-5">
        <header className="mb-4 flex min-w-0 items-center gap-6 overflow-hidden rounded-[18px] border border-white/60 bg-white/72 px-5 py-3 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <button
            type="button"
            onClick={handleResetToCenter}
            className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.32em] text-teal-800 transition hover:text-teal-950"
          >
            Jiyugaoka Coffee Recommendation
          </button>
          <div className="h-4 w-px bg-stone-200" />
          <div className="flex min-w-0 flex-wrap items-center gap-5 text-sm text-stone-700">
            <StatusItem label="Scope" value="自由が丘・奥沢・九品仏" />
            <StatusItem label="Results" value={showAllPoints ? "All Points" : "Top 10"} />
            <StatusItem label="Distance" value="自由が丘駅基準" />
          </div>
        </header>

        <main className="grid min-h-0 min-w-0 flex-1 gap-4 xl:grid-cols-[460px_minmax(0,1fr)]">
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
                  <textarea
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="min-h-32 w-full rounded-[24px] border border-stone-200 bg-stone-50/80 px-4 py-4 text-sm leading-7 text-stone-900 outline-none transition focus:border-amber-500 focus:bg-white"
                    placeholder="例: 静かに過ごせて、豆もちゃんとしている自由が丘の店"
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {starterPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setQuery(prompt)}
                      className="rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 transition hover:border-amber-400 hover:text-amber-800"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-stone-900">
                    {showAllPoints ? "All recommendations" : "Top 10 recommendations"}
                  </p>
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                    {loading ? "Loading" : `${rankedPlaces.length} results`}
                  </p>
                </div>
                <p className="mb-3 text-sm leading-6 text-stone-600">{resultSummary}</p>
                <p className="mb-4 text-xs leading-6 text-stone-500">
                  {hasQuery
                    ? showAllPoints
                      ? "隠しコマンドを検出したため、自由が丘エリアの全ポイントを表示しています。"
                      : "自由が丘駅からの距離・カテゴリ・意図タグで順位付けしています。"
                    : "未入力時は、自由が丘駅から近い順に 10 件を表示します。"}
                </p>

                <div className="space-y-2.5">
                  {rankedPlaces.map((place, index) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => setSelectedPlaceId(place.id)}
                      className={`w-full rounded-[22px] border px-4 py-3.5 text-left transition ${
                        selectedPlace?.id === place.id
                          ? "border-amber-500 bg-amber-50 shadow-[0_12px_28px_rgba(245,158,11,0.18)]"
                          : "border-stone-200 bg-white hover:border-stone-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-stone-400">#{index + 1}</p>
                          <h2 className="mt-1 text-lg font-semibold text-stone-950">{place.name}</h2>
                          <p className="mt-1 text-sm text-stone-600">{place.address}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge tone="teal">{categoryLabel(place.category)}</Badge>
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
                        <div className="rounded-full bg-stone-950 px-3 py-1 text-xs font-semibold text-white">
                          {Math.round(place.score ?? 0)}
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
                      <div className="mt-2.5 grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        {(place.whyThisPlace ?? []).slice(0, 2).map((reason) => (
                          <div
                            key={`${place.id}-${reason}`}
                            className="rounded-[16px] bg-stone-50 px-3 py-2 text-xs leading-5 text-stone-600"
                          >
                            {reason}
                          </div>
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

          <section className="flex min-h-0 min-w-0">
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
                    selectedPlaceId={selectedPlace?.id ?? null}
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

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
        {label}
      </p>
      <p className="text-sm font-semibold text-stone-950">{value}</p>
    </div>
  );
}

function Badge({ children, tone }: { children: string; tone: "teal" | "slate" }) {
  const className =
    tone === "teal"
      ? "bg-teal-100 text-teal-800 border border-teal-200"
      : "bg-stone-100 text-stone-700 border border-stone-200";

  return <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${className}`}>{children}</span>;
}

function categoryLabel(category: VenueCategory): string {
  if (category === "both") {
    return "CAFE + BEANS";
  }

  if (category === "bean_store") {
    return "BEAN STORE";
  }

  return "COFFEE SHOP";
}
