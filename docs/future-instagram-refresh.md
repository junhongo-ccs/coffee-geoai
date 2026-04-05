# Future Note: Instagram Refresh Pipeline

## Goal

店舗の Instagram や公開情報を定期的に見にいき、カテゴリ、タグ、1行説明を実態に寄せ続ける。

この仕組みは自動更新よりも、`変更候補を出して人が承認する` 形を前提にする。

## Why

今の `coffee-map` は店の意味づけに価値がある。

- `coffee_shop` か `coffee_stand` か
- `bean_store` か `both` か
- `study` や `kissaten` や `roastery` が妥当か
- 1行説明が今の営業実態に合っているか

このあたりは時間とともに変わるので、手で時々直すだけでは追従しにくい。

## Proposed Flow

1. CSV を正本にする
2. 巡回ジョブが Instagram URL を持つ店舗を回る
3. 取得した公開情報から構造化データを作る
4. LLM が `変更候補` を JSON で返す
5. 人が review して承認したものだけを反映する

## Data To Check

- 店の営業形態
- 豆販売の有無
- 焙煎文脈の強さ
- ドリップだけか、カフェ利用もあるか
- 作業利用の雰囲気
- 喫茶店寄りかどうか
- Instagram のアカウント URL や表示名の変化
- 1行説明に入れるべき現在の特徴

## Suggested Stack

- 巡回: `Playwright`
- 整形: `Python` または `Node`
- 判定補助: `LLM`
- 定期実行: GitHub Actions か cron
- 出力先: review 用 CSV / JSON / markdown diff

## LLM Role

LLM に最終決定をさせない。

役割は次に限定する。

- 取得したテキストや投稿情報からタグ候補を出す
- `coffee_shop / coffee_stand / both / bean_store` の候補を出す
- 1行説明の更新案を出す
- その判断根拠を短く返す

## Output Shape

最初の MVP ではこの程度でよい。

```json
{
  "shop_id": "curated-slow-stand",
  "checked_at": "2026-04-06",
  "suggested_category": "both",
  "suggested_tags": ["specialty", "roastery", "quiet"],
  "suggested_description": "奥沢2丁目で落ち着いて過ごしやすく、豆販売文脈でも拾えるスペシャルティ候補。",
  "evidence": [
    "プロフィールや投稿で豆販売に言及",
    "店内利用が見える",
    "限定豆や焙煎文脈の投稿がある"
  ]
}
```

## Review Policy

- 自動で本番データを書き換えない
- `suggested_*` と現行値の差分だけを出す
- 差分は人が目視確認する
- 反映後に `checked_at` を更新する

## Good First MVP

- Instagram URL がある店だけを対象にする
- 最新投稿数件とプロフィールだけを見る
- `category` と `tags` と `description` の候補だけ出す
- `docs/` か別ファイルに review レポートを吐く

## Risks

- Instagram の取得導線は壊れやすい
- ページ構造変更で巡回が止まる可能性がある
- 投稿内容だけでは営業実態を誤読することがある
- 画像理解まで広げるとコストと複雑さが上がる

## Practical Conclusion

将来やるなら、

- 巡回
- 抽出
- LLM 提案
- 人の承認
- 正本反映

の 5 段階に分けるのが安全。

このプロジェクトでは、`完全自動化` より `定期的な半自動メンテナンス` の方が筋がよい。
