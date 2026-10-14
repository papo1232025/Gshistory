// Discord サーバーの初期設定（ロール・チャンネル・フォーラムのタグ・ピン留め・スラッシュコマンド）。
// 何度実行しても、すでにあるものは作り直さない。
//   BOT_TOKEN=... APP_ID=... GUILD_ID=... node setup.js
import { BOTSU, COMMANDS, ROLES, STAGES, discord } from "./worker.js";

const env = process.env;
for (const key of ["BOT_TOKEN", "APP_ID", "GUILD_ID"]) if (!env[key]) throw new Error(`${key} を指定してください`);
const g = env.GUILD_ID;

const roles = await discord(env, "GET", `/guilds/${g}/roles`);
for (const name of ROLES) {
  if (!roles.some((r) => r.name === name)) await discord(env, "POST", `/guilds/${g}/roles`, { name, mentionable: true });
}

const channels = await discord(env, "GET", `/guilds/${g}/channels`);
const ensure = async (name, data) => {
  const found = channels.find((c) => c.name === name && c.type === data.type);
  return { channel: found ?? (await discord(env, "POST", `/guilds/${g}/channels`, { name, ...data })), created: !found };
};

const { channel: category } = await ensure("GSHISTORY", { type: 4 });
const intro = await ensure("はじめに", { type: 0, parent_id: category.id });
const tags = [...STAGES, BOTSU].map((s) => ({ name: s.name, emoji_name: s.emoji }));
const forum = await ensure("制作", {
  type: 15,
  parent_id: category.id,
  flags: 16, // タグ必須
  available_tags: tags,
  topic: "動画1本 = 投稿1つ。タイトルは「番号 タイトル」（例: 007 信長の草履あたため、実は…）。工程が進んだらスレッドの中で /次へ",
});
await ensure("参考動画", { type: 0, parent_id: category.id });
const notice = await ensure("連絡", { type: 0, parent_id: category.id });

// 既存のフォーラムに足りないタグだけ足す
const have = forum.channel.available_tags ?? [];
const missing = tags.filter((t) => !have.some((h) => h.name === t.name));
if (!forum.created && missing.length) {
  await discord(env, "PATCH", `/channels/${forum.channel.id}`, { available_tags: [...have, ...missing] });
}

if (intro.created) {
  const message = await discord(env, "POST", `/channels/${intro.channel.id}/messages`, {
    content: `【歴史ショート】約60秒・縦動画で YouTube / TikTok / Instagram に投稿

■ 担当
アイデア: 発起人・ゆうへいさん
台本・素材: 発起人（事実確認: ゆうへいさん）
編集・投稿: 麻生さん

■ 流れ
${STAGES.map((s) => `${s.emoji}${s.name}`).join(" → ")}
動画1本 = <#${forum.channel.id}> の投稿1つ。終わったらスレッドの中で **/次へ** → 次の担当に自動でメンションが飛ぶ
修正で戻す・ボツにするときは **/工程**

■ リンク
Drive: （ここに共有フォルダのURL）

※ パスワードや2段階認証のコードはDiscordに書かない`,
  });
  await discord(env, "PUT", `/channels/${intro.channel.id}/messages/pins/${message.id}`);
}

await discord(env, "PUT", `/applications/${env.APP_ID}/guilds/${g}/commands`, COMMANDS);

console.log(`できました。wrangler.toml の [vars] に入れてください:
GUILD_ID = "${g}"
FORUM_ID = "${forum.channel.id}"
NOTICE_CHANNEL_ID = "${notice.channel.id}"`);
