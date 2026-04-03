# coffee-geoai

`coffee-geoai` は、自由が丘を対象にしたコーヒー推薦 PoC です。  
ArcGIS を地図表示と GIS レビュー文脈の中心に置きつつ、推薦自体はキュレーション済みデータと明示的な空間ルールで構成します。

現時点の方針は次の通りです。

- 対象範囲は東京・自由が丘に限定
- 対象カテゴリはコーヒーショップとコーヒー豆店に限定
- 一般的な LLM を最終意思決定に使わない
- ArcGIS は主に地図可視化と GIS 的な説明の文脈に使う
- ArcGIS Personal Use 制約を前提に、GeoAI/API が使えなくても成立する PoC とする

現在の推薦フローは、概ね次の形で構成します。

- 日本語入力を軽量に解釈する
- 自由が丘内の候補だけを扱う
- 距離、カテゴリ、空間的な条件で候補を並べ替える
- ArcGIS の 3D マップ上で候補を可視化する

## セットアップ

### 前提

- Node.js 20 以上を推奨
- npm
- ArcGIS の地図表示や参照実験を行う場合のみ `VITE_ARCGIS_API_KEY`

### インストール

```bash
npm install
```

必要なら `.env.example` を元に `.env` を作成します。

```bash
cp .env.example .env
```

`.env`:

```env
VITE_ARCGIS_API_KEY=your_key_here
```

注意:

- API キーがなくても、キュレーション済みデータで PoC の主要挙動は確認できます
- ArcGIS Personal Use では GeoAI/API 経路が制限される可能性があるため、API キーを前提にしたライブ推薦は現在の前提ではありません

### 起動

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

## Spec Kit Workflow

このリポジトリは GitHub Spec Kit を使って、仕様駆動で整理しながら進める前提です。

主なディレクトリ:

- `.specify/`
- `.agents/skills/`
- `specs/001-geoai-jiyugaoka/`

Codex からは主に以下の順で使います。

- `$speckit-constitution`
- `$speckit-specify`
- `$speckit-plan`
- `$speckit-tasks`
- `$speckit-implement`

補助的に以下も使えます。

- `$speckit-clarify`
- `$speckit-checklist`
- `$speckit-analyze`

## 現在のドキュメント

- `specs/001-geoai-jiyugaoka/spec.md`
- `specs/001-geoai-jiyugaoka/plan.md`
- `specs/001-geoai-jiyugaoka/tasks.md`
- `docs/2026-04-03-handoff.md`
- `docs/working-plan.md`

## 参考

- GitHub Spec Kit: <https://github.com/github/spec-kit>
- Spec Kit Docs: <https://github.github.com/spec-kit/>
