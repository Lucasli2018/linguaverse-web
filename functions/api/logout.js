// POST /api/logout -> 销毁会话（清除 Cookie）
import { json, parseUser, clearCookie } from "./_shared.js";

export async function onRequestPost({ request, env }) {
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)lv_sid=([^;]+)/);
  if (m) {
    const token = decodeURIComponent(m[1]);
    await env.DB.prepare("DELETE FROM sessions WHERE token=?").bind(token).run();
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "set-cookie": clearCookie() },
  });
}
