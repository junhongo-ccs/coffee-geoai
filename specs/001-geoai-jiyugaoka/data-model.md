# データモデル: 自由が丘 GIS根拠付きコーヒー推薦 PoC

## SearchArea

- **目的**: MVP の境界付き地理範囲を定義する
- **項目**:
  - `id`: `jiyugaoka` のような安定した識別子
  - `label`: UI 表示用ラベル
  - `latitude`: 中心緯度
  - `longitude`: 中心経度
  - `radiusMeters`: 候補取得や説明に使う半径
  - `ward`: UI 文言用の任意の行政区ラベル
- **検証条件**:
  - MVP では自由が丘のみを指すこと
  - 半径は周辺エリアへ不要に漏れない小ささに保つこと

## UserIntent

- **目的**: 正規化された入力と解釈済みの嗜好を保持する
- **項目**:
  - `original`: 生の日本語入力
  - `normalized`: trim と正規化後の文字列
  - `tags`: 解釈された店舗タグ
  - `vibeNotes`: 解釈メモ
  - `keywords`: 取得や補助判定に使うキーワード
  - `wantsRoastery`: ロースター志向かどうか
  - `wantsWorkFriendly`: 作業向き志向かどうか
- **検証条件**:
  - 自由記述の日本語を受け付けること
  - 言い回しの差で結果ゼロに崩れにくいこと

## VenueCandidate

- **目的**: 推薦候補となるコーヒーショップまたは豆店を表す
- **項目**:
  - `id`: 安定した一意 ID
  - `name`: 店名
  - `latitude`: 緯度
  - `longitude`: 経度
  - `address`: 表示用住所
  - `source`: `curated` または `manual_reference`
  - `category`: `coffee_shop`、`bean_store`、`both`
  - `tags`: 店舗属性タグ
  - `description`: 短い説明文
  - `semanticReasons`: カテゴリ、意図、または明示的 GIS スコアルールに紐づく理由
  - `isWithinSearchArea`: 対象範囲内かどうか
  - `distanceMeters`: 自由が丘中心からの距離
  - `spatialReason`: 人が読める距離説明または範囲説明
- **検証条件**:
  - 承認済みの自由が丘検索範囲内に収まること
  - 許可されたカテゴリのみであること

## RecommendationResult

- **目的**: UI に返すランキング済みの表示モデル
- **項目**:
  - `place`: `VenueCandidate`
  - `score`: 合計スコア
  - `whyThisPlace`: レビュー担当者向け理由を最大 3 件
  - `rank`: 1 から 3 の順位
  - `mode`: `gis_rule_based` または `curated_reference`
- **検証条件**:
  - 既定表示では最大 3 件まで
  - すべての結果に説明可能な理由があること

## RecommendationMode

- **目的**: 現在の推薦経路をレビュー担当者に明示する
- **項目**:
  - `id`: 安定したモード識別子
  - `label`: UI 表示名
  - `usesMap`: 地図表示を使っているか
  - `limitations`: 制約説明
- **検証条件**:
  - UI 上で見えること
  - ローカル計算のランキングを外部 AI 起因であるかのように誇張しないこと
