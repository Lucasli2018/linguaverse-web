// POST /api/register  { user, pw } -> 创建账号并登录（Set-Cookie）
import { json, hashPassword, getUser, sessionCookie, newToken } from "./_shared.js";

export async function onRequestPost({ request, env }) {
  const { user, pw } = await request.json().catch(() => ({}));
  const name = (user || "").trim();
  if (name.length < 2 || name.length > 16) return json({ error: "用户名需 2-16 个字符" }, 400);
  if (!pw || pw.length < 6) return json({ error: "密码至少 6 位" }, 400);
  if (await getUser(env.DB, name)) return json({ error: "该用户名已被注册" }, 409);

  const { salt, hash } = await hashPassword(pw);
  const data = {
    xp: 0, days: {}, streak: 0, bestStreak: 0, ach: ["first_login"],
    enrolled: {}, progress: {},
    moduleStat: { word: { c: 0, r: 0 }, grammar: { c: 0, r: 0 }, listen: { c: 0, r: 0 }, speak: { c: 0, r: 0 } },
  };
  await env.DB.prepare("INSERT INTO users(name,pw_hash,created,data) VALUES(?,?,?,?)")
    .bind(name, salt + ":" + hash, Date.now(), JSON.stringify(data)).run();

  const token = newToken();
  await env.DB.prepare("INSERT INTO sessions(token,name,exp) VALUES(?,?,?)")
    .bind(token, name, Date.now() + 1000 * 60 * 60 * 24 * 30).run();

  return new Response(JSON.stringify({ user: { name, ...data } }), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "set-cookie": sessionCookie(token) },
  });
}
