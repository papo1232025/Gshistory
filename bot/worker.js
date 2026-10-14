/*
 * 歴史ショートの Discord Bot（Cloudflare Workers）。
 * - /次へ  … 🎬制作 のスレッドで打つと、タグを次の工程に付け替えて次の担当にメンションする
 * - /工程  … 工程を選んで移す（修正で戻す・ボツにする）
 * - 毎週月曜 … #連絡 に工程ごとの一覧を投稿する
 * Gateway（常時接続）は使わず、スラッシュコマンドの HTTP 受け口と cron だけで動く。
 */

const API = "https://discord.com/api/v10";

export const ROLES = ["アイデア", "素材", "編集"];

// 工程に「入ったとき」に誰へ何を言うか
export const STAGES = [
  { name: "アイデア", emoji: "💡", roles: ["アイデア"], who: "ネタ会議", say: "新しいネタ！次のネタ会議で採用を決めよう" },
  { name: "採用", emoji: "✅", roles: ["素材"], who: "台本待ち", say: "採用！台本お願いします 📝" },
  { name: "台本", emoji: "📝", roles: ["アイデア"], who: "事実確認待ち", say: "台本できた！事実確認お願いします 🔍" },
  { name: "素材", emoji: "🎨", roles: ["素材"], who: "素材づくり中", say: "事実確認OK！素材づくりお願いします" },
  { name: "編集", emoji: "✂️", roles: ["編集"], who: "麻生さん", say: "素材そろった！編集お願いします" },
  { name: "確認", emoji: "👀", roles: ["アイデア", "素材"], who: "3人で確認", say: "編集できた！確認お願いします。OKなら ✅ リアクション、直すところは「秒数・何を・どうする」で" },
  { name: "投稿", emoji: "📤", roles: ["編集"], who: "麻生さん", say: "3人OK！投稿お願いします（ロゴなしの元ファイルで YouTube / TikTok / Instagram）" },
  { name: "公開中", emoji: "🎉", roles: [], who: "1週間後に振り返り", say: "公開おつかれさま！3つのURLをここに貼って、1週間後に再生数を書いたらスレッドを閉じてね 📊" },
];
export const BOTSU = { name: "ボツ", emoji: "🗄️", roles: [], say: "ボツにしました。スレッドを閉じます" };
const ALL = [...STAGES, BOTSU];

const memoOption = { type: 3, name: "メモ", description: "Driveのリンクや一言（任意）", required: false };
export const COMMANDS = [
  { name: "次へ", description: "このネタを次の工程に進めて、次の担当に知らせる", options: [memoOption] },
  {
    name: "工程",
    description: "工程を選んで移す（修正で戻す・ボツにする）",
    options: [
      { type: 3, name: "工程", description: "移す先", required: true, choices: ALL.map((s) => ({ name: `${s.emoji} ${s.name}`, value: s.name })) },
      memoOption,
    ],
  },
];

/** 今付いているタグ名から次の工程。タグがなければ最初の工程、最後なら null */
export function nextStage(tagNames) {
  const i = STAGES.findIndex((s) => tagNames.includes(s.name));
  return STAGES[i + 1] ?? null;
}

/** 工程を付け替えたあとのタグ（工程以外のタグは残す） */
export function swapTag(appliedIds, availableTags, stageName) {
  const stageIds = availableTags.filter((t) => ALL.some((s) => s.name === t.name)).map((t) => t.id);
  const target = availableTags.find((t) => t.name === stageName);
  if (!target) return null;
  return [...appliedIds.filter((id) => !stageIds.includes(id)), target.id];
}

export function weeklyText(threads, availableTags, roleId) {
  const lines = STAGES.map((s) => {
    const tag = availableTags.find((t) => t.name === s.name);
    const hits = tag ? threads.filter((t) => t.applied_tags?.includes(tag.id)) : [];
    return hits.length ? `${s.emoji} **${s.name}**（${s.who}）: ${hits.map((t) => `<#${t.id}>`).join(" ")}` : null;
  }).filter(Boolean);
  return [`📅 **今週のネタ会議** ${roleId ? `<@&${roleId}>` : ""}`, ...(lines.length ? lines : ["進行中のネタはありません。🎬制作 にネタを投稿しよう！"])].join("\n");
}

export async function discord(env, method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { Authorization: `Bot ${env.BOT_TOKEN}`, "Content-Type": "application/json" },
    body: body && JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Discord ${method} ${path} → ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

const hex = (s) => Uint8Array.from(s.match(/../g) ?? [], (b) => parseInt(b, 16));

export async function verify(publicKey, signature, timestamp, body) {
  if (!signature || !timestamp) return false;
  const key = await crypto.subtle.importKey("raw", hex(publicKey), { name: "Ed25519" }, false, ["verify"]);
  return crypto.subtle.verify("Ed25519", key, hex(signature), new TextEncoder().encode(timestamp + body));
}

const reply = (data) => Response.json({ type: 4, data });
const oops = (content) => reply({ content, flags: 64 }); // 本人にだけ見える

async function command(interaction, env, ctx) {
  const opts = Object.fromEntries((interaction.data.options ?? []).map((o) => [o.name, o.value]));
  const [thread, forum, roles] = await Promise.all([
    discord(env, "GET", `/channels/${interaction.channel_id}`),
    discord(env, "GET", `/channels/${env.FORUM_ID}`),
    discord(env, "GET", `/guilds/${env.GUILD_ID}/roles`),
  ]);
  if (thread.parent_id !== env.FORUM_ID) return oops("🎬制作 の、そのネタのスレッドの中で使ってね");

  const tagNames = forum.available_tags.filter((t) => thread.applied_tags.includes(t.id)).map((t) => t.name);
  const stage = interaction.data.name === "工程" ? ALL.find((s) => s.name === opts["工程"]) : nextStage(tagNames);
  if (!stage) return oops("もう最後の工程です。振り返りを書いたらスレッドを閉じてね");
  const tags = swapTag(thread.applied_tags, forum.available_tags, stage.name);
  if (!tags) return oops(`フォーラムにタグ「${stage.name}」がありません（setup.js をもう一度実行してね）`);
  await discord(env, "PATCH", `/channels/${thread.id}`, { applied_tags: tags });

  const roleIds = stage.roles.map((name) => roles.find((r) => r.name === name)?.id).filter(Boolean);
  if (stage === BOTSU) {
    // ponytail: 返信が書き込まれる前に閉じないよう数秒待つ。たまに開いたままなら手で閉じる
    ctx.waitUntil(new Promise((r) => setTimeout(r, 3000)).then(() => discord(env, "PATCH", `/channels/${thread.id}`, { archived: true })));
  }
  return reply({
    content: [
      `${stage.emoji} **${stage.name}** へ（<@${interaction.member.user.id}>）`,
      `${roleIds.map((id) => `<@&${id}>`).join(" ")} ${stage.say}`.trim(),
      opts["メモ"] ? `> ${opts["メモ"]}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    allowed_mentions: { roles: roleIds },
  });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") return new Response("gshistory bot");
    const body = await request.text();
    const ok = await verify(env.PUBLIC_KEY, request.headers.get("x-signature-ed25519"), request.headers.get("x-signature-timestamp"), body);
    if (!ok) return new Response("bad signature", { status: 401 });
    const interaction = JSON.parse(body);
    if (interaction.type === 1) return Response.json({ type: 1 }); // Discord からの疎通確認
    try {
      return await command(interaction, env, ctx);
    } catch (error) {
      return oops(`うまくいきませんでした: ${error.message.slice(0, 300)}`);
    }
  },

  async scheduled(_event, env) {
    const [{ threads }, forum, roles] = await Promise.all([
      discord(env, "GET", `/guilds/${env.GUILD_ID}/threads/active`),
      discord(env, "GET", `/channels/${env.FORUM_ID}`),
      discord(env, "GET", `/guilds/${env.GUILD_ID}/roles`),
    ]);
    const roleId = roles.find((r) => r.name === "アイデア")?.id;
    await discord(env, "POST", `/channels/${env.NOTICE_CHANNEL_ID}/messages`, {
      content: weeklyText(threads.filter((t) => t.parent_id === env.FORUM_ID), forum.available_tags, roleId),
      allowed_mentions: { roles: roleId ? [roleId] : [] },
    });
  },
};
