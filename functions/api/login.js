// POST /api/login  { user, pw } -> 验证并登录（Set-Cookie）
import { json, getUser, verifyPassword, sessionCookie, newToken } from "./_shared.js";

export async function onRequestPost({ request, env }) {
  const { user, pw } = await request.json().catch(() => ({}));
  const name = (user || "").trim();
  const u = await getUser(env.DB, name);
  if (!u) return json({ error: "用户名或密码不正确" }, 401);
  const [salt, hash] = u.pw_hash.split(":");
  if (!(await verifyPassword(pw, salt, hash))) return json({ error: "用户名或密码不正确" }, 401);

  const data = JSON.parse(u.data);
  const token = newToken();
  await env.DB.prepare("INSERT INTO sessions(token,name,exp) VALUES(?,?,?)")
    .bind(token, name, Date.now() + 1000 * 60 * 60 * 24 * 30).run();

  return new Response(JSON.stringify({ user: { name, ...data } }), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "set-cookie": sessionCookie(token) },
  });
}
