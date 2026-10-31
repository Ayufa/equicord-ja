# Equicord 日本語化コピー（個人用）

本家 [Equicord](https://github.com/Equicord/Equicord) を個人用にコピーし、日本語化したリポジトリです。

## 方針

- 本家リポジトリには**一切干渉しません**（プルリクエスト、マージ、Issue 作成などは行いません）
- 本家は git remote `upstream` として読み取り専用（fetch のみ）で登録されています。push 先 URL は無効化済みで、誤って本家へ push することはできません
- 本家からの更新は一方通行で取り込みます

## 日本語化の内容（初回）

- 全プラグインの説明文（`src/plugins` / `src/equicordplugins`、375件）
- コア設定 UI の文言（`src/components/settings` 配下、`src/plugins/_core/settings.tsx`、431件）
- ブランド名・固有名詞（Equicord、Discord、GitHub 等）と patchHelper の技術文字列は英語のまま保持
- 各プラグイン内部の設定項目ラベルは今後の課題

## 本家の更新を取り込む手順

```bash
git fetch upstream
git merge upstream/main   # 日本語化した行とぶつかった場合は競合を解消する
git push origin main
```

注意: 内蔵アップデーターは本家を見に行くため、このコピーでは使わず、上記の手順で更新してください。

## ビルド確認

```bash
pnpm install --frozen-lockfile
pnpm buildStandalone   # ビルド
pnpm testTsc           # 型チェック
```
