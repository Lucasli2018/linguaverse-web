// POST /api/posts/:id  { action: "like" }       -> 切换点赞
//                    { action: "comment", text } -> 发表评论
import { json, parseUser } from "./_shared.js";

export async function onRequestPost({ request, env, params }) {
  const me = await parseUser(env, request);
  if (!me) return json({ error: "请先登录" }, 401);
  const id = params.id;
  const { action, text } = await request.json().catch(() => ({}));

  if (action === "like") {
    const ex = await env.DB.prepare("SELECT 1 FROM post_likes WHERE post_id=? AND user=?").bind(id, me.name).first();
    if (ex) {
      await env.DB.prepare("DELETE FROM post_likes WHERE post_id=? AND user=?").bind(id, me.name).run();
      await env.DB.prepare("UPDATE posts SET likes=likes-1 WHERE id=?").bind(id).run();
    } else {
      await env.DB.prepare("INSERT OR IGNORE INTO post_likes(post_id,user) VALUES(?,?)").bind(id, me.name).run();
      await env.DB.prepare("UPDATE posts SET likes=likes+1 WHERE id=?").bind(id).run();
    }
    return json({ ok: true, liked: !ex });
  }

  if (action === "comment") {
    const t = (text || "").trim();
    if (!t) return json({ error: "评论为空" }, 400);
    await env.DB.prepare("INSERT INTO comments(id,post_id,user,text,time) VALUES(?,?,?,?,?)")
      .bind("c" + Date.now(), id, me.name, t, Date.now()).run();
    return json({ ok: true });
  }

  return json({ error: "未知操作" }, 400);
}
