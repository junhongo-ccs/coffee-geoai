# 実装計画: 自由が丘 ArcGIS GIS根拠付きコーヒー推薦 PoC

**ブランチ**: `001-geoai-jiyugaoka` | **日付**: 2026-04-03 | **仕様**: [spec.md](/Users/hongoujun/Documents/GitHub/coffee-geoai/specs/001-geoai-jiyugaoka/spec.md)  
**入力**: `/specs/001-geoai-jiyugaoka/spec.md` の機能仕様

## 要約

現在の「東京全域のカフェ推薦デモ」を、自由が丘に限定した GIS レビュー向け PoC に作り直す。出力は最大 3 件のコーヒーショップまたは豆店候補とし、ArcGIS は地図表示と GIS レビュー文脈の中心に据える。一方で、ArcGIS Personal Use では GeoAI/API 利用が難しい可能性があるため、推薦の MVP はキュレーション済みデータセットと明示的な空間ルールベースで成立させる。

## 技術コンテキスト

**言語/バージョン**: TypeScript 5.9, React 19, Node.js 20  
**主要依存**: Vite 8, Tailwind CSS 3, `@arcgis/core` 5, React DOM 19  
**保存先**: リポジトリ内のキュレーション済み静的データ、ブラウザメモリのみ  
**テスト**: `quickstart.md` に基づく手動検証。将来の Vitest 導入は別途検討  
**対象環境**: 1920x1080 を標準とするデスクトップブラウザ。内部デモと GIS レビュー用途  
**プロジェクト種別**: 単一フロントエンドアプリケーション  
**性能目標**: デモ用途として、入力から結果更新まで 1 操作で把握できる速度を保つ  
**制約**: 自由が丘に限定すること、カテゴリをコーヒーショップ/豆店に限定すること、GIS 根拠を説明できること、一般的な LLM を最終判断に使わないこと、ArcGIS Personal Use 制約下でも成立すること  
**規模/範囲**: 1 地域、最大 3 件の推薦、1 つの地図ビュー、1 本の推薦フロー、標準画面は 1920x1080、スマホ対応は後続フェーズ

## 憲章チェック

*GATE: Phase 0 の調査前に通過必須。Phase 1 設計後に再確認する。*

- **ArcGIS/GIS First**: 条件付きで適合。ArcGIS は地図表示とレビュー文脈の中心に残すが、推薦ロジックは GeoAI/API 利用を前提にしない
- **Explainable Spatial Reasoning**: 適合。距離、カテゴリ制約、対象範囲内判定、説明項目を全候補に持たせる
- **Jiyugaoka Scope Discipline**: 適合。検索範囲とデータセットを自由が丘に限定する
- **Natural Language Robustness Without Rule-Only Shortcuts**: 条件付きで適合。正規表現ベース解釈は補助として使うが、それだけを推薦エンジンとは見せない
- **Demo Credibility Over UI Polish**: 適合。UI より先にスコープ、根拠、見せ方の整合を優先する

## プロジェクト構成

### この機能のドキュメント

```text
specs/001-geoai-jiyugaoka/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-contract.md
└── tasks.md
```

### リポジトリ側の実装

```text
src/
├── App.tsx
├── main.tsx
├── index.css
├── types.ts
├── data/
│   └── mockPlaces.ts
├── lib/
│   ├── intent.ts
│   ├── places.ts
│   └── ranking.ts
└── components/
    └── SceneMap.tsx

docs/
├── 2026-04-03-handoff.md
└── working-plan.md
```

**構成判断**: 既存の単一 Vite アプリを維持し、変更は `src/` を中心に行う。計画成果物は feature spec ディレクトリに集約する。

## Phase 0: 調査結果の要点

- 東京全域ではなく、自由が丘に境界付きで限定する
- ArcGIS は主たる可視化レイヤーと GIS レビュー文脈として維持する
- MVP の推薦は、キュレーション済みデータセット + 明示的 GIS ルールを基準線にする
- 出力は Top 3 を既定とする
- 絞り込み質問は第一段階の推薦ループが安定してから扱う

詳細は [research.md](/Users/hongoujun/Documents/GitHub/coffee-geoai/specs/001-geoai-jiyugaoka/research.md) を参照。

## Phase 1: 設計の焦点

設計は次の 5 本柱で進める。

1. 自由が丘の検索エリア定義とカテゴリ制約を、型と候補処理に反映する
2. 東京全域モックを、自由が丘限定のキュレーション済みデータへ置き換える
3. 距離、範囲、カテゴリを軸に、レビュー可能なランキング理由を持たせる
4. UI 文言を GIS 根拠付き PoC に揃え、ArcGIS 文脈とローカルランキング根拠を見せる
5. ArcGIS 地図の中心、表示点、選択状態を自由が丘向けに合わせる

## 設計後の憲章チェック

- **ArcGIS/GIS First**: 制約付きで適合。ArcGIS は地図表示とレビュー文脈の中心であり、ローカル計算の推薦とは明示的に区別する
- **Explainable Spatial Reasoning**: 適合。対象範囲内判定、カテゴリ一致、距離理由、推薦理由を追えるようにする
- **Jiyugaoka Scope Discipline**: 適合。取得と表示の両方で自由が丘に限定する
- **Natural Language Robustness Without Rule-Only Shortcuts**: 条件付きで適合。意図解釈は補助層とし、GeoAI を過剰に主張しない
- **Demo Credibility Over UI Polish**: 適合。トレーサビリティと範囲制御を優先する

## 複雑性の記録

| 項目 | 必要な理由 | 単純案を採らない理由 |
|------|------------|----------------------|
| キュレーション済みデータセット + GIS ルールベース推薦 | ArcGIS Personal Use では GeoAI/API 経路が塞がる可能性があるため | ArcGIS のライブ推薦だけに依存すると、ライセンスやサービス制約で実装が止まる |
