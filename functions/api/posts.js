// GET  /api/posts -> 帖子列表（含评论与当前用户点赞态）
// POST /api/posts -> 发帖（body），发帖者 +10 XP
import { json, parseUser } from "./_shared.js";

export async function onRequestGet({ request, env }) {
  const me = await parseUser(env, request);
  const rows = await env.DB.prepare("SELECT * FROM posts ORDER BY time DESC LIMIT 60").all();
  const posts = await Promise.all((rows.results || []).map(async (p) => {
    const cm = await env.DB.prepare("SELECT * FROM comments WHERE post_id=? ORDER BY time ASC").bind(p.id).all();
    let liked = false;
    if (me) {
      const l = await env.DB.prepare("SELECT 1 FROM post_likes WHERE post_id=? AND user=?").bind(p.id, me.name).first();
      liked = !!l;
    }
    return {
      id: p.id, user: p.user, body: p.body, time: p.time, likes: p.likes, liked,
      comments: (cm.results || []).map((c) => ({ user: c.user, text: c.text, time: c.time })),
    };
  }));
  return json({ posts });
}

export async function onRequestPost({ request, env }) {
  const me = await parseUser(env, request);
  if (!me) return json({ error: "请先登录" }, 401);
  const { body } = await request.json().catch(() => ({}));
  const text = (body || "").trim();
  if (!text) return json({ error: "内容为空" }, 400);

  const id = "p" + Date.now();
  await env.DB.prepare("INSERT INTO posts(id,user,body,time,likes) VALUES(?,?,?,?,0)")
    .bind(id, me.name, text, Date.now()).run();

  // 发帖奖励 XP（写入云端 data）
  const data = JSON.parse(me.data);
  data.xp = (data.xp || 0) + 10;
  await env.DB.prepare("UPDATE users SET data=? WHERE name=?").bind(JSON.stringify(data), me.name).run();

  return json({ ok: true, id, xp: data.xp });
}
