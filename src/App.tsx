import { lazy, Suspense, useEffect, useState } from "react";
import { parseIntent } from "./lib/intent";
import { hasArcgisApiKey, searchNearbyPlaces } from "./lib/places";
import { rankPlaces, tagLabel } from "./lib/ranking";
import type { Place, SearchCenter } from "./types";

const SceneMap = lazy(() => import("./components/SceneMap"));

const defaultCenter: SearchCenter = {
  latitude: 35.6809591,
  longitude: 139.7673068,
  label: "東京駅",
};

const starterPrompts = [
  "静かで作業しやすいカフェ",
  "雰囲気いいロースターに行きたい",
  "朝に入りやすくて居心地がいいお店",
];

export default function App() {
  const [query, setQuery] = useState("雰囲気いい、静かでゆっくりできるコーヒーショップ");
  const [center] = useState<SearchCenter>(defaultCenter);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const intent = parseIntent(query);
  const rankedPlaces = rankPlaces(places, intent, center);
  const selectedPlace =
    rankedPlaces.find((place) => place.id === selectedPlaceId) ?? rankedPlaces[0] ?? null;

  useEffect(() => {
    let active = true;

    async function runSearch() {
      setLoading(true);
      const results = await searchNearbyPlaces(center, intent);

      if (!active) {
        return;
      }

      setPlaces(results);
      setSelectedPlaceId(rankPlaces(results, intent, center)[0]?.id ?? null);
      setLoading(false);
    }

    void runSearch();

    return () => {
      active = false;
    };
  }, [center, query]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_32%),linear-gradient(135deg,_#f5f1e8_0%,_#f7f7f5_45%,_#e8f0ee_100%)] text-stone-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-4 lg:px-6 lg:py-6">
        <header className="mb-4 rounded-[32px] border border-white/60 bg-white/70 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur xl:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.32em] text-teal-800">
                Coffee GeoAI Prototype
              </p>
              <h1 className="max-w-3xl font-serif text-4xl leading-tight text-stone-950 md:text-5xl">
                好みの言葉から、街の中の
                <span className="text-amber-700">「ちょうどいい一杯」</span>
                を探す
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-700 md:text-base">
                主観的な希望を GeoAI がタグへ変換し、空間距離と雰囲気の解釈を重ねて候補を並べ替えます。
                災害支援や立地判断など、より広い位置情報意思決定にも拡張できる構成です。
              </p>
            </div>

            <div className="grid gap-3 text-sm text-stone-700 sm:grid-cols-3">
              <Metric label="Map" value="3D ArcGIS" />
              <Metric
                label="Search"
                value={hasArcgisApiKey() ? "ArcGIS live" : "Demo dataset"}
              />
              <Metric label="Intent" value="Japanese NL" />
            </div>
          </div>
        </header>

        <main className="grid flex-1 gap-4 lg:grid-cols-[440px_minmax(0,1fr)]">
          <section className="rounded-[30px] border border-white/60 bg-white/78 p-5 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
                  Intent Search
                </p>
                <label className="mt-3 block">
                  <span className="mb-2 block text-sm font-medium text-stone-700">
                    どんなコーヒー体験を探していますか
                  </span>
                  <textarea
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="min-h-32 w-full rounded-[24px] border border-stone-200 bg-stone-50/80 px-4 py-4 text-sm leading-7 text-stone-900 outline-none transition focus:border-amber-500 focus:bg-white"
                    placeholder="例: 雰囲気が良くて、静かに作業できるロースター"
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

              <div className="rounded-[24px] bg-stone-950 px-4 py-4 text-stone-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">GeoAI interpretation</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-400">{center.label}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {intent.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-stone-100"
                    >
                      {tagLabel(tag)}
                    </span>
                  ))}
                </div>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-stone-300">
                  {intent.vibeNotes.map((note) => (
                    <li key={note}>• {note}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                <p className="font-semibold">Search mode</p>
                <p className="mt-1">
                  {hasArcgisApiKey()
                    ? "ArcGIS の周辺候補検索を使用中です。"
                    : "API キー未設定のため、東京のサンプル店舗データでデモしています。VITE_ARCGIS_API_KEY を設定すると ArcGIS 検索へ切り替わります。"}
                </p>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-stone-900">Ranked places</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                    {loading ? "Loading" : `${rankedPlaces.length} results`}
                  </p>
                </div>

                <div className="space-y-3">
                  {rankedPlaces.map((place, index) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => setSelectedPlaceId(place.id)}
                      className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
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
                        </div>
                        <div className="rounded-full bg-stone-950 px-3 py-1 text-xs font-semibold text-white">
                          {Math.round(place.score ?? 0)}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {place.tags.slice(0, 4).map((tag) => (
                          <span
                            key={`${place.id}-${tag}`}
                            className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700"
                          >
                            {tagLabel(tag)}
                          </span>
                        ))}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-stone-700">{place.description}</p>
                      <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-teal-700">
                        {place.spatialReason}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4">
            <div className="overflow-hidden rounded-[30px] border border-white/60 bg-white/75 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex items-center justify-between border-b border-stone-200/80 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
                    3D Spatial View
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    中心地: {center.label} / 候補点をクリックすると詳細を表示
                  </p>
                </div>
              </div>
              <Suspense
                fallback={
                  <div className="flex min-h-[440px] items-center justify-center bg-stone-100 text-sm text-stone-500">
                    3D map を読み込み中...
                  </div>
                }
              >
                <SceneMap
                  center={center}
                  places={rankedPlaces}
                  selectedPlaceId={selectedPlace?.id ?? null}
                  onSelectPlace={setSelectedPlaceId}
                />
              </Suspense>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <div className="rounded-[30px] border border-white/60 bg-white/78 p-5 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
                  Why this place
                </p>
                {selectedPlace ? (
                  <div className="mt-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-2xl font-semibold text-stone-950">{selectedPlace.name}</h3>
                      <span className="rounded-full bg-teal-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-50">
                        {selectedPlace.source}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{selectedPlace.address}</p>
                    <p className="mt-4 text-sm leading-7 text-stone-800">{selectedPlace.description}</p>
                    <ul className="mt-5 space-y-3">
                      {selectedPlace.whyThisPlace?.map((reason) => (
                        <li
                          key={reason}
                          className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700"
                        >
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-stone-600">候補を選ぶと説明が表示されます。</p>
                )}
              </div>

              <div className="rounded-[30px] border border-white/60 bg-stone-950 p-5 text-stone-100 shadow-[0_20px_80px_rgba(15,23,42,0.18)]">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">
                  Extensible GeoAI
                </p>
                <div className="mt-4 space-y-4 text-sm leading-7 text-stone-300">
                  <p>
                    この構成は、主観表現をタグへ落とす軽量 AI レイヤーと、空間検索・説明生成を分離しています。
                  </p>
                  <p>
                    そのため、避難所の安心感、配送拠点の利便性、医療アクセスの優先度など別領域にも横展開できます。
                  </p>
                </div>
                <div className="mt-6 grid gap-3">
                  <CapabilityCard
                    title="Intent to Tags"
                    body="日本語の曖昧な表現を quiet / cozy / study などへ変換"
                  />
                  <CapabilityCard
                    title="Spatial + Semantic Rank"
                    body="距離と雰囲気適合度を合算して優先順位を生成"
                  />
                  <CapabilityCard
                    title="Explainable Results"
                    body="なぜその候補なのかを短い説明として表示"
                  />
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-stone-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-stone-950">{value}</p>
    </div>
  );
}

function CapabilityCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm leading-6 text-stone-300">{body}</p>
    </div>
  );
}
