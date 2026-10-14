import assert from "node:assert/strict";
import test from "node:test";
import { STAGES, nextStage, swapTag, verify, weeklyText } from "./worker.js";

const tags = [...STAGES.map((s, i) => ({ id: `t${i}`, name: s.name })), { id: "x", name: "急ぎ" }];

test("次の工程", () => {
  assert.equal(nextStage([]).name, "アイデア");
  assert.equal(nextStage(["アイデア"]).name, "採用");
  assert.equal(nextStage(["急ぎ", "確認"]).name, "投稿");
  assert.equal(nextStage(["公開中"]), null);
});

test("工程のタグだけ付け替え、ほかのタグは残す", () => {
  assert.deepEqual(swapTag(["t0", "x"], tags, "採用"), ["x", "t1"]);
  assert.equal(swapTag([], tags, "ない"), null);
});

test("週のまとめ", () => {
  const text = weeklyText([{ id: "1", applied_tags: ["t4"] }], tags, "r");
  assert.match(text, /<@&r>/);
  assert.match(text, /✂️ \*\*編集\*\*（麻生さん）: <#1>/);
  assert.match(weeklyText([], tags), /進行中のネタはありません/);
});

test("署名の確認", async () => {
  const keys = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const toHex = (buf) => Buffer.from(buf).toString("hex");
  const pub = toHex(await crypto.subtle.exportKey("raw", keys.publicKey));
  const sig = toHex(await crypto.subtle.sign("Ed25519", keys.privateKey, new TextEncoder().encode("123{}")));
  assert.equal(await verify(pub, sig, "123", "{}"), true);
  assert.equal(await verify(pub, sig, "124", "{}"), false);
  assert.equal(await verify(pub, null, "123", "{}"), false);
});
