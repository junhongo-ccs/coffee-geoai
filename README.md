# coffee-geoai

`coffee-geoai` は、自然言語で好みを伝えると、GeoAI 的な解釈と地理情報を組み合わせてコーヒー店候補を並べ替えるプロトタイプです。

現在の実装では、以下の流れで体験を構成しています。

- 日本語の希望をタグへ変換する
- 距離と雰囲気適合度で候補をランク付けする
- ArcGIS の 3D マップ上で候補を可視化する

## App Setup

### Requirements

- Node.js 20 以上を推奨
- npm
- ArcGIS を live で使う場合は `VITE_ARCGIS_API_KEY`

### Install

```bash
npm install
```

`.env` を使う場合は `.env.example` を元に作成します。

```bash
cp .env.example .env
```

`.env`:

```env
VITE_ARCGIS_API_KEY=your_key_here
```

API キーがない場合でも、東京周辺のモックデータで動作します。

### Run

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Spec Kit Workflow

このリポジトリは GitHub Spec Kit を使って、仕様駆動で整理しながら進める前提です。

初期化で追加される主なディレクトリ:

- `.specify/`
- `.agents/skills/`

Codex からは以下のスキルを順に使います。

- `$speckit-constitution`
- `$speckit-specify`
- `$speckit-plan`
- `$speckit-tasks`
- `$speckit-implement`

補助的に以下も使えます。

- `$speckit-clarify`
- `$speckit-checklist`
- `$speckit-analyze`

## Mac Setup

### Case 1: この README と一緒に `.specify/` と `.agents/skills/` も Git に入っている場合

その場合は、Mac 側で clone した時点で Spec Kit の土台も入っています。  
基本的には追加の `specify init` は不要です。

やることは以下だけです。

```bash
git clone <repo-url>
cd coffee-geoai
npm install
npm run dev
```

そのまま Codex で `speckit` スキルを使えます。

### Case 2: Mac 側の clone に `.specify/` や `.agents/skills/` が含まれていない場合

その場合は、clone したプロジェクトルートで Spec Kit を初期化します。

前提:

- `uv` / `uvx` が使えること
- Codex を使うこと

初期化コマンド:

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init --here --ai codex --ignore-agent-tools
```

必要に応じて、既存ファイル確認を省略する場合は `--force` を付けます。

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init --here --force --ai codex --ignore-agent-tools
```

## Windows Setup

Windows でも考え方は同じです。  
このリポジトリ直下で Spec Kit を初期化します。

```powershell
uvx --system-certs --from git+https://github.com/github/spec-kit.git specify init --here --force --offline --ai codex --script ps --ignore-agent-tools
```

Windows では証明書や文字コードの影響を受けることがあるため、Mac よりオプションが増える場合があります。

## Repository Policy

Mac でも Windows でも同じ状態で始めたいなら、少なくとも以下をリポジトリで管理する方が運用しやすいです。

- `.specify/`
- `.agents/skills/`
- `README.md`

逆に、ローカル固有の認証情報やエージェント生成物が `.agents/` 配下に増える場合は、どこまで Git 管理するかを別途決めます。

## References

- GitHub Spec Kit: <https://github.com/github/spec-kit>
- Spec Kit Docs: <https://github.github.com/spec-kit/>

## Docs

- `docs/2026-04-03-handoff.md`
- `docs/working-plan.md`
