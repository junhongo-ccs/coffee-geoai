# coffee-map

自由が丘・奥沢・九品仏エリアのコーヒー店を、日本語の自然文から絞り込んで見せるフロントエンド PoC です。

入力文を LLM とルールベースで解釈し、キュレーション済みの店舗データを

- 自由が丘駅からの距離
- カテゴリ
- 意図タグ

で順位付けして、カード一覧と地図に表示します。

## 何ができるか

- 自由が丘・奥沢・九品仏エリアのコーヒー店を表示
- 日本語の自然文から、静かさ・雰囲気・作業向き・喫茶店寄り・ロースター寄り・駅近などを解釈
- 入力中に `Live Intent Tags` として解釈結果をプレビュー
- 初期状態では、自由が丘駅に近い `10件` を表示
- `全ポイントが見たい` で全件表示
- `インスタがあるお店` で Instagram URL がある店舗だけ表示
- `駅近` のような距離条件を別軸で扱う
- 左のカードか地図のポイントを押すと、その店を選択
- 選択中スポットは専用ピンで表示され、ピンを押すと軽量ポップアップを表示
- ヘッダー左の `JIYUGAOKA COFFEE RECOMMENDATION` を押すと、地図が自由が丘駅中心に戻る

## 技術スタック

- `Vite`
- `React`
- `TypeScript`
- `Tailwind CSS`
- `MapLibre GL JS`
- `MapTiler`
- `Gemini API`

## 現在の前提

- 自然文解釈は Gemini を優先し、失敗時はローカルなルールベースへフォールバックします
- Gemini 未使用時は、UI 上にフォールバック理由を表示します
- 店舗データの大元は `src/data/coffee  map - coffee-map-spots.csv` です
- 説明文と理由文の大元も `src/data/coffee  map - coffee-map-spots.csv` です（`description` と `semantic_reasons` はCSVのみ編集）
- 距離は「自由が丘駅中心からの直線距離」です
- 対象範囲は自由が丘駅中心の半径 `950m` です
- 現在の掲載件数は `31件` です
- 画面は `1920x1080` のデスクトップ表示を基準に調整しています

## セットアップ

前提:

- Node.js 20 以上推奨
- npm

インストール:

```bash
npm install
```

開発サーバー起動:

```bash
npm run dev
```

ローカルの Gemini 解釈を有効にしたい場合は、先に `.env.example` を `.env.local` にコピーして設定します。

```bash
copy .env.example .env.local
```

ビルド:

```bash
npm run build
```

ローカル確認:

```bash
npm run preview
```

ローカル環境変数 (`.env.local`):

```env
VITE_GEMINI_API_KEY=...
VITE_GEMINI_MODEL=gemini-2.5-flash
```

補足:

- `.env` / `.env.local` は Git 管理されません
- ローカル確認は `.env.local` を使います
- GitHub Pages の build は `.github/workflows/deploy-pages.yml` から `secrets.VITE_GEMINI_API_KEY` と `vars.VITE_GEMINI_MODEL` を参照します
- API キー未設定時は UI 上でルールベースへのフォールバック理由を表示します

## 地図

地図表示は `MapLibre GL JS` を使っています。現在のスタイルは MapTiler のスタイル URL を直接使っています。

実装の中心:

- `src/components/SceneMap.tsx`

## GitHub Pages

このリポジトリは GitHub Pages 公開向けに設定済みです。

- Vite `base`: `/coffee-map/`
- workflow: `.github/workflows/deploy-pages.yml`

GitHub 側では `Settings > Pages > Source` を `GitHub Actions` に設定してください。

Gemini 設定:

- `Settings > Secrets and variables > Actions > Secrets` に `VITE_GEMINI_API_KEY`
- `Settings > Secrets and variables > Actions > Variables` に `VITE_GEMINI_MODEL` を設定
- `VITE_GEMINI_MODEL` を省略した場合は `gemini-2.5-flash` を使います

公開先:

- <https://junhongo-ccs.github.io/coffee-map/>

## 主なファイル

- `src/App.tsx`
  - 画面全体、入力欄、`Live Intent Tags`、カード一覧、選択状態の管理
- `src/components/SceneMap.tsx`
  - 地図描画、選択中専用ピン、選択地点への移動、中心リセット、ポップアップ
- `src/data/coffee  map - coffee-map-spots.csv`
  - キュレーション済み店舗データの大元
- `src/data/mockPlaces.ts`
  - CSVを `Place[]` に変換する読み込みレイヤー
- `src/lib/intent.ts`
  - Gemini + ルールベースの自然文解釈
- `src/lib/places.ts`
  - エリア内候補の抽出
- `src/lib/ranking.ts`
  - 距離と意図タグによる順位付け
- `src/types.ts`
  - 店舗データと意図解釈の型

## Maintenance

普段のメンテで触る場所は次の 4 つです。

- 店舗データ: `src/data/coffee  map - coffee-map-spots.csv`
- 選択中ピン画像: `public/map-markers/selected-pin.png`
- OGP 画像: `public/ogp.png`
- OGP 文言: `index.html`

CSV 運用ルール:

- 店舗の説明文は `description` を編集
- 理由文は `semantic_reasons` を編集
- `src/data/mockPlaces.ts` は CSV 読み込み専用として扱い、店舗データ本体は直書きしない

地図アセット運用:

- 選択中ピンは `96 x 96 px` PNG を `48 x 48 px` 表示前提で使う
- 保存先は `public/map-markers/selected-pin.png`
- ピン先端が座標に来る前提でデザインする

OGP 運用:

- OGP 画像サイズは `1200 x 630 px`
- 保存先は `public/ogp.png`
- OGP / Twitter 文言は `index.html` の `description` / `og:*` / `twitter:*` を揃えて更新する

ローカル確認メモ:

- 開発サーバー: `npm run dev`
- 本番ビルド確認: `npm run build`
- 画像や OGP を差し替えた直後はハードリロード推奨

## Docs

Spec Kit ベースの仕様整理は `specs/001-geoai-jiyugaoka/` にあります。

- `spec.md`
- `plan.md`
- `tasks.md`
- `research.md`
- `data-model.md`
- `quickstart.md`

運用メモ:

- `docs/working-plan.md`
- `docs/2026-04-03-handoff.md`
- `docs/future-instagram-refresh.md`
- `docs/tag-review-checklist.md`

## 今後の整理候補

- Instagram 情報は、推測ではなく確認済みのものだけ残す
- 店舗座標は Google Maps / Plus Code ベースで順次精度を上げる
- `全店見たい` 状態で、カード・地図・ポップアップの整合を全件チェックする
- Playwright などによる Instagram 巡回は、自動更新ではなく review 前提で設計する
