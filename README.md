# Equicord JA — Equicord 日本語化版

[Equicord](https://github.com/Equicord/Equicord)（[Vencord](https://github.com/Vendicated/Vencord) のフォークで、300以上のプラグインを同梱する Discord クライアント MOD）を個人用にコピーし、UI を日本語化したリポジトリです。

> これは個人用の非公式コピーです。本家 Equicord プロジェクトとは関係ありません。

## 日本語化している範囲

- 全プラグインの説明文（375件）
- 各プラグインの設定項目（説明・ラベル・選択肢など、約1,600件）
- Equicord の設定画面まわりのコア UI 文言（431件）
- コマンドの説明、右クリックメニュー、プラグイン独自の画面、トースト・通知の文言（約2,500件。Questify の設定画面も含む）

Discord 本体の UI は Discord 自身が日本語化しているため対象外です。ブランド名・固有名詞と、パッチや内部処理に使う文字列（訳すと動作が壊れるもの）は英語のままにしています。

## インストール（Windows）

1. [最新のリリース](https://github.com/Ayufa/equicord-ja/releases/latest) から `EquicordJA-Setup.exe` をダウンロード
2. 起動して「インストール」ボタンを押す（Discord が起動中なら、終了するか聞かれます）
3. 完了したら Discord を起動

- 初回は Windows SmartScreen の警告が出ることがあります（署名のない個人ビルドのため）。「詳細情報」→「実行」で進めます
- 本体は `%LOCALAPPDATA%\equicord-ja\equicord.asar` に配置されます
- アンインストールは、同じ exe の「アンインストール」ボタンから

## 更新方法

- **アプリ内更新**: Discord の Equicord 設定「Updater」から、このリポジトリの最新リリースに更新できます（内蔵アップデーターの参照先がこのリポジトリになっている standalone ビルドのため）。本家の英語ビルドで上書きされることはありません
- **exe の再実行**: 新しい `EquicordJA-Setup.exe` を実行しても上書き更新できます
- **本家の取り込み**: 週1回（月曜）に自動で確認し、新しい変更があれば日本語化したうえで新しいリリースを出します

## 方針（本家との関係）

- 本家リポジトリには**一切干渉しません**（プルリクエスト、マージ、Issue 作成などは行いません）
- 本家は git remote `upstream` として読み取り専用（fetch のみ）で登録されています。push 先 URL は無効化済みで、誤って本家へ push することはできません
- 本家からの更新は一方通行で取り込みます

## 本家の更新を取り込む手順（手動の場合）

```bash
git fetch upstream
git merge upstream/main   # 日本語化した行とぶつかった場合は競合を解消する
git push origin main
```

## ソースからビルド・導入する場合

```bash
pnpm install --frozen-lockfile
pnpm build            # ビルド
pnpm testTsc          # 型チェック
pnpm inject           # Discord を終了してから実行（開発用インストール）
```

## 注意

Discord のクライアント改造は Discord の利用規約に抵触します。利用は自己責任でお願いします。本家 FAQ によれば、クライアント MOD の使用のみを理由としたアカウント BAN の事例は知られていませんが、保証はできません。

## ライセンス

本家 Equicord に従い GPL-3.0 です。元のプロジェクト: [Equicord](https://github.com/Equicord/Equicord) / [Vencord](https://github.com/Vendicated/Vencord)
