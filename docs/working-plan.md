# Working Plan

## Goal

自由が丘限定のコーヒー推薦について、GIS に詳しいレビュー担当者に説明できる PoC を作る。

## Current Decision

現在の実装方針は次の通り。

- ArcGIS は地図表示と GIS レビュー文脈の中心に置く
- 推薦の MVP はキュレーション済みデータセット + 明示的な空間ルールベースで実装する
- 一般的な LLM を最終判断に使わない
- ArcGIS Personal Use では GeoAI/API 利用が難しい可能性を前提にする

## Immediate Priority

UI を磨く前に、まず以下を揃える。

- 自由が丘限定のスコープ制御
- コーヒーショップ / 豆店へのカテゴリ制約
- 空間理由が追えるランキング説明
- ArcGIS 地図文脈とローカル推薦ロジックの区別

## Proposed Work Order

### Phase 1: Scope Fix

- 自由が丘の中心点と範囲を固定する
- 東京全域モックを自由が丘限定データへ置き換える
- 許可カテゴリ以外を除外する

### Phase 2: Recommendation Refactor

- 既存の意図解釈を補助層として整理する
- 距離、カテゴリ、範囲制約を軸にスコアリングする
- 推薦理由を GIS 観点で説明可能にする

### Phase 3: UI Alignment

- 画面文言を「東京カフェデモ」から「自由が丘 GIS 根拠付き PoC」へ寄せる
- Top 3 表示を基準にする
- ArcGIS 文脈とローカル計算ランキングを明示的に見せ分ける

### Phase 4: Demo Readiness

- 自由が丘内だけが出ることを確認する
- カテゴリ制約が守られていることを確認する
- GIS レビュー担当者向け説明が追えることを確認する
- 日本語デモ入力を少数に絞って整える

## Risks

- ArcGIS Personal Use 制約により、期待した API 経路が使えない可能性がある
- ArcGIS が地図表示だけに見えると、PoC の説得力が弱くなる
- 既存の東京全域デモ実装を引きずると、自由が丘 PoC の説明が崩れる

## Practical Conclusion

現在の安全な進め方は、ArcGIS のライブ推薦機能に賭けることではない。  
まずは、自由が丘限定の地理制約と明示的な空間ルールに基づく推薦を成立させ、そのうえで ArcGIS 可視化と説明性を強く見せる。

## Next Data Plan

今後の店舗データ設計では、`静か` `居心地` `作業向き` を同じものとして扱わない。

- `quiet`
  - 音環境や会話量の静かさ
- `cozy`
  - 空気感や滞在時の心地よさ
- `study`
  - PC を開いて仕事しても浮かないか、長居できるか、席に余裕があるか

特に `作業向き` は感覚タグだけでなく、構造化データで判断できるようにしたい。

追加候補の CSV 列:

- `seat_space_score`
- `long_stay_tolerance_score`
- `pc_friendliness_score`
- `power_outlet`
- `wifi`
- `turnover_pressure_score`
- `counter_only`
- `work_suitability_note`

意図:

- 狭いが居心地はいい店
- 静かだが作業には向かない店
- 広くて長居しやすく、仕事に向く店

を区別できるようにする。

将来的には `study` を手入力タグで持つより、これらの列から導出する方向が望ましい。

## Tomorrow Queue

次回すぐ着手したい項目:

- 地図のサブウィンドーから Instagram に遷移できる小さなアイコンを付ける
- スポット用ピンのデザインを進める
  - PNG 前提
  - 通常 / 選択中の 2 種
  - `public/map-markers/` に配置する
- OGP 画像を用意する
- OGP 用の文言を整える
