# タスク一覧: 自由が丘 ArcGIS GIS根拠付きコーヒー推薦 PoC

**入力**: `/specs/001-geoai-jiyugaoka/` 配下の設計ドキュメント  
**前提資料**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/ui-contract.md`

**テスト方針**: この段階では自動テストは必須にしない。確認は `specs/001-geoai-jiyugaoka/quickstart.md` の手動検証に基づく。

**整理方針**: 各ユーザーストーリーごとに実装・検証できるようにタスクを分ける。

## Phase 1: セットアップ

**目的**: リポジトリの説明と計画文書を、現在の PoC 方針に合わせる

- [ ] T001 `/Users/hongoujun/Documents/GitHub/coffee-geoai/README.md` を更新し、自由が丘 ArcGIS GIS根拠付き PoC と Personal Use 制約を反映する
- [ ] T002 `/Users/hongoujun/Documents/GitHub/coffee-geoai/docs/working-plan.md` に現状実装との差分と次の作業方針を整理する

---

## Phase 2: 基盤整備

**目的**: すべてのユーザーストーリーに共通するスコープ、型、候補制約を先に固める

- [ ] T003 `/Users/hongoujun/Documents/GitHub/coffee-geoai/src/types.ts` で検索エリア、店舗カテゴリ、推薦モードの共通型を更新する
- [ ] T004 [P] `/Users/hongoujun/Documents/GitHub/coffee-geoai/src/data/mockPlaces.ts` を、東京全域のモックから自由が丘限定のキュレーション済み店舗データへ置き換える
- [ ] T005 [P] `/Users/hongoujun/Documents/GitHub/coffee-geoai/src/lib/places.ts` に固定の自由が丘検索エリア定数と範囲内判定ヘルパーを追加する
- [ ] T006 `/Users/hongoujun/Documents/GitHub/coffee-geoai/src/lib/places.ts` で候補正規化とローカル候補経路を見直し、自由が丘スコープと許可カテゴリを強制する
- [ ] T007 `/Users/hongoujun/Documents/GitHub/coffee-geoai/src/lib/ranking.ts` で、各候補に空間理由とレビュー向け説明が必ず付くようにランキング入力を更新する

**チェックポイント**: スコープ制約とランキング基盤が整い、各ストーリーの実装に進める状態になる

---

## Phase 3: ユーザーストーリー1 - 自然言語からの GIS 根拠付き推薦 (優先度: P1) 🎯 MVP

**ゴール**: 多様な日本語入力から、自由が丘内のコーヒー店舗推薦を最大 3 件返せるようにする

**独立テスト**: 代表的な日本語入力を試し、自由が丘内のコーヒー関連候補が最大 3 件まで返ることを確認する

- [ ] T008 [P] [US1] `/Users/hongoujun/Documents/GitHub/coffee-geoai/src/lib/intent.ts` で、自由が丘コーヒー PoC 向けに意図解釈メモと補助キーワードを見直す
- [ ] T009 [US1] `/Users/hongoujun/Documents/GitHub/coffee-geoai/src/App.tsx` で、固定の自由が丘中心と Top 3 表示を使う状態管理に更新する
- [ ] T010 [US1] `/Users/hongoujun/Documents/GitHub/coffee-geoai/src/App.tsx` で、Top 3 制限とスコープ付きの空状態メッセージを実装する
- [ ] T011 [US1] `/Users/hongoujun/Documents/GitHub/coffee-geoai/src/App.tsx` の要約文、サンプルプロンプト、モード表示を更新し、東京カフェデモ風の文脈や不正確な GeoAI/API 主張を排除する

**チェックポイント**: ユーザーストーリー1 が、自由が丘限定の推薦フローとして単独デモ可能になる

---

## Phase 4: ユーザーストーリー2 - GIS レビュー担当者が選定理由を確認できる (優先度: P2)

**ゴール**: 推薦理由を GIS の観点で確認できるようにする

**独立テスト**: 各推薦を選択し、エリア範囲、店舗カテゴリ、ソースまたはモード、空間理由が見えることを確認する

- [ ] T012 [P] [US2] `/Users/hongoujun/Documents/GitHub/coffee-geoai/src/App.tsx` の推薦カードに、レビュー向けの説明項目とラベルを追加する
- [ ] T013 [P] [US2] `/Users/hongoujun/Documents/GitHub/coffee-geoai/src/App.tsx` の詳細表示で、カテゴリ、ソース、範囲に関する情報を出す
- [ ] T014 [US2] `/Users/hongoujun/Documents/GitHub/coffee-geoai/src/components/SceneMap.tsx` の地図操作とポップアップを調整し、スコープ付きの推薦文脈を表示する
- [ ] T015 [US2] `/Users/hongoujun/Documents/GitHub/coffee-geoai/src/index.css` を更新し、一般的なショーケース寄りではなく GIS レビューしやすい見た目に寄せる
- [ ] T016 [US2] `/Users/hongoujun/Documents/GitHub/coffee-geoai/src/App.tsx` でランキング根拠を明示し、ArcGIS ベースの地図文脈とローカル計算の推薦ロジックを分けて見せる

**チェックポイント**: ユーザーストーリー2 により、順位と選定理由をレビュー担当者が追える状態になる

---

## Phase 5: ユーザーストーリー3 - 曖昧なニーズに対する絞り込み (優先度: P3)

**ゴール**: 曖昧な入力でも、承認済みの地理範囲やカテゴリを外れずに次の行動を提示できるようにする

**独立テスト**: `いい感じの店` のような広い入力を与えたときに、過剰な自信を持った推薦ではなく、構造化された次の確認を提示することを確認する

- [ ] T017 [P] [US3] `/Users/hongoujun/Documents/GitHub/coffee-geoai/src/lib/intent.ts` で、曖昧入力判定と絞り込みプロンプト規則を定義する
- [ ] T018 [US3] `/Users/hongoujun/Documents/GitHub/coffee-geoai/src/App.tsx` に、絞り込みプロンプト表示と再ランキングのフックを追加する
- [ ] T019 [US3] `/Users/hongoujun/Documents/GitHub/coffee-geoai/src/lib/ranking.ts` で、絞り込み選択後も自由が丘スコープと許可カテゴリを維持するようにする

**チェックポイント**: ユーザーストーリー3 により、MVP を壊さずに絞り込み導線が追加される

---

## Phase 6: 仕上げと横断確認

**目的**: ストーリー横断の残課題を閉じ、デモとして確認する

- [ ] T020 [P] `/Users/hongoujun/Documents/GitHub/coffee-geoai/docs/2026-04-03-handoff.md` を最終実装方針に合わせて更新する
- [ ] T021 `specs/001-geoai-jiyugaoka/quickstart.md` の手動確認項目を実施する
- [ ] T022 `/Users/hongoujun/Documents/GitHub/coffee-geoai/package.json` を基準に、依存関係とビルド準備状態を確認する

---

## 依存関係と実行順

### フェーズ依存

- **Phase 1: セットアップ**: 依存なし
- **Phase 2: 基盤整備**: Phase 1 完了後に着手し、全ユーザーストーリーの前提になる
- **Phase 3: ユーザーストーリー1**: Phase 2 完了後に着手
- **Phase 4: ユーザーストーリー2**: Phase 2 完了後に着手し、User Story 1 で整えた結果構造を利用する
- **Phase 5: ユーザーストーリー3**: Phase 2 完了後に着手し、User Story 1 の入力処理を拡張する
- **Phase 6: 仕上げ**: 必要なストーリーが完了した後に実施

### ユーザーストーリー依存

- **US1**: 最初の MVP 増分。後続ストーリーに依存しない
- **US2**: US1 の推薦データと選択フローを利用する
- **US3**: US1 の入力処理が安定してから拡張する

### 並列実行できる箇所

- `T004` と `T005` は並列で進められる
- `T008` は `T009` の UI 作業準備と並行できる
- `T012` と `T013` は並列で進められる
- `T017` は `T018` より先に独立して進められる

## 実装戦略

### MVP 優先

1. Phase 1 を完了する
2. Phase 2 を完了する
3. Phase 3 を完了する
4. 自由が丘 Top 3 推薦フローを検証する

### 段階的リリース

1. まず US1 を入れて、第一段階の推薦を成立させる
2. 次に US2 を入れて、レビュー可能性を高める
3. 最後に US3 を加え、必要なら絞り込み対話を載せる
