// GET  /api/me -> 当前登录用户的云端数据
// PUT  /api/me -> 上报本地进度（白名单字段，防注入 name/pw_hash）
import { json, parseUser } from "./_shared.js";

const ALLOWED = ["xp", "days", "streak", "bestStreak", "ach", "enrolled", "progress", "moduleStat"];

export async function onRequestGet({ request, env }) {
  const u = await parseUser(env, request);
  if (!u) return json({ error: "未登录" }, 401);
  const data = JSON.parse(u.data);
  return json({ user: { name: u.name, ...data } });
}

export async function onRequestPut({ request, env }) {
  const u = await parseUser(env, request);
  if (!u) return json({ error: "未登录" }, 401);
  const body = await request.json().catch(() => ({}));
  const data = {};
  for (const k of ALLOWED) if (k in body) data[k] = body[k];
  await env.DB.prepare("UPDATE users SET data=? WHERE name=?").bind(JSON.stringify(data), u.name).run();
  return json({ ok: true });
}
