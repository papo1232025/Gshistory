# Gshistory — 歴史ショート動画プロジェクト

歴史ネタの約60秒ショート動画を作り、YouTube Shorts / TikTok / Instagram Reels に投稿するプロジェクト。

- 共通アカウント: `gshistory101@gmail.com`
- 尺: 約60秒（縦 9:16）
- 参考: https://www.youtube.com/shorts/dhv2aE-CCdQ （この形式の歴史版）

## メンバーと担当

| 担当 | アイデア出し | 台本 | 素材作成 | 編集 | 投稿 |
|---|:-:|:-:|:-:|:-:|:-:|
| 発起人（名前を記入） | ◎ | ◎ | ◎ | | |
| ゆうへいさん | ◎ | ファクトチェック | | | |
| 麻生さん | | | | ◎ | ◎ |

## 制作の流れ（概要）

```
💡アイデア ─▶ ✅採用 ─▶ 📝台本 ─▶ 🎨素材 ─▶ ✂️編集 ─▶ 👀確認 ─▶ 📤投稿 ─▶ 📊振り返り
 発起人        2人で     発起人    発起人    麻生さん   3人      麻生さん   3人
 ゆうへいさん  ネタ会議  +ゆうへい
               で決定    (事実確認)
```

やりとりは **Discord** で行う。動画1本 = 🎬制作フォーラムの投稿1つで、工程はタグで管理する。詳しくは [docs/discord.md](docs/discord.md)。
各工程で「何ができたら次に渡すか」は [docs/workflow.md](docs/workflow.md) にまとめてある。

## ファイル構成

| パス | 内容 |
|---|---|
| [docs/discord.md](docs/discord.md) | Discord のチャンネル構成・タグ・受け渡しのメッセージ（コピペ用） |
| [bot/](bot/README.md) | Discord Bot（/次へ でタグ付け替え＋メンション、毎週月曜のまとめ）とつなぎ方 |
| [docs/workflow.md](docs/workflow.md) | 工程ごとの担当・受け渡し条件・週のリズム・Driveのフォルダ構成 |
| [docs/format.md](docs/format.md) | 60秒の構成テンプレ・各SNSの書き出し仕様・注意点 |
| [templates/idea.md](templates/idea.md) | アイデアメモ |
| [templates/script.md](templates/script.md) | 台本＋素材リスト（発起人 → 麻生さんへの受け渡し書も兼ねる） |
| [templates/post.md](templates/post.md) | 投稿前チェックリストとキャプション |

## 決めておきたいこと

- [ ] 投稿頻度（例: 週2本からスタート）
- [ ] チャンネル名・アイコン・動画の固定フォーマット（冒頭の決め台詞、テロップの色など）
- [ ] ナレーションの方法（自分の声 / 合成音声）
- [ ] 各SNSのログイン共有方法（下記参照）

### アカウント共有について

- **YouTube**: パスワードを共有せず、チャンネルの「権限」から麻生さんたちのGoogleアカウントを「管理者」or「編集者」として追加できる。
- **Instagram / TikTok**: 基本は共有ログイン。2段階認証のコードが `gshistory101@gmail.com` に届くので、誰が受け取るか決めておく。
- **Google Drive**: `gshistory101@gmail.com` のDriveに共有フォルダを作り、3人の個人アカウントに編集権限を付ける。
