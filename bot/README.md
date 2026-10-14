# Discord Bot のつなぎ方

できること:
- **/次へ** … 🎬制作 のスレッドの中で打つと、タグを次の工程に付け替えて次の担当にメンション（メモ欄にDriveのリンクなどを書ける）
- **/工程** … 修正で前の工程に戻す・ボツにする
- **毎週月曜 9:00** … #連絡 に工程ごとの一覧を投稿し、@アイデア にネタ会議の声かけ

置き場所は Cloudflare Workers（無料枠で足りる）。常時起動のサーバーは要らない。

## 1. Discord で Bot を作る（ブラウザ・5分）

1. https://discord.com/developers/applications →「New Application」→ 名前は `gshistory` など
2. **General Information** の `APPLICATION ID` と `PUBLIC KEY` をメモ
3. **Bot** →「Reset Token」で出る `TOKEN` をメモ（人に見せない）
4. **Installation** → Guild Install のスコープに `bot` と `applications.commands`、権限に
   `Manage Channels` `Manage Roles` `Manage Threads` `Manage Messages` `View Channels` `Send Messages` `Send Messages in Threads` `Read Message History` を付ける → 出てきたリンクを開いて自分のサーバーに入れる
5. Discord の「設定 → 詳細設定 → 開発者モード」をオンにして、サーバー名を右クリック →「サーバーIDをコピー」（`GUILD_ID`）

## 2. サーバーの初期設定（PCのターミナル・1分）

```sh
cd bot
BOT_TOKEN=xxx APP_ID=xxx GUILD_ID=xxx node setup.js
```

ロール3つ（アイデア・素材・編集）、カテゴリ GSHISTORY に4チャンネル（はじめに・制作・参考動画・連絡）、制作フォーラムのタグ、ピン留め、スラッシュコマンドができる。
最後に表示される `FORUM_ID` と `NOTICE_CHANNEL_ID` を控える。

そのあと Discord で、ロールを3人に付ける（発起人: アイデア・素材 / ゆうへいさん: アイデア / 麻生さん: 編集）。
Botのロールは、サーバー設定のロール一覧で「アイデア・素材・編集」より上に置く。

## 3. Cloudflare に置く（PCのターミナル・5分）

```sh
cd bot
npm install
npx wrangler login              # ブラウザで Cloudflare にログイン（アカウントがなければ無料で作る）
npx wrangler secret put BOT_TOKEN   # トークンを貼る
```

`wrangler.toml` の `[vars]` に `PUBLIC_KEY` `GUILD_ID` `FORUM_ID` `NOTICE_CHANNEL_ID` を入れてから:

```sh
npx wrangler deploy
```

表示された `https://gshistory-bot.<名前>.workers.dev` をコピー。

## 4. Discord とつなぐ

Developer Portal の **General Information → Interactions Endpoint URL** に上のURLを貼って保存。
（保存できれば疎通OK。失敗するときは `PUBLIC_KEY` が違う）

## 5. 試す

🎬制作 に `001 テスト` をタグ「アイデア」で投稿 → そのスレッドで `/次へ` → タグが「採用」になり @素材 にメンションが飛べば完成。

## 工程とメンション

| /次へ で入る工程 | メンション | 一言 |
|---|---|---|
| 💡アイデア | @アイデア | 次のネタ会議で採用を決めよう |
| ✅採用 | @素材 | 台本お願いします |
| 📝台本 | @アイデア | 事実確認お願いします |
| 🎨素材 | @素材 | 素材づくりお願いします |
| ✂️編集 | @編集 | 編集お願いします |
| 👀確認 | @アイデア @素材 | 確認お願いします |
| 📤投稿 | @編集 | 投稿お願いします |
| 🎉公開中 | — | URLを貼って、1週間後に再生数を |

文言を変えたいときは `worker.js` の `STAGES` を直して `npx wrangler deploy`。
