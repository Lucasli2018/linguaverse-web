/* LinguaVerse 后端逻辑测试（Node ESM，Mock D1 + Request） */
import { hashPassword, verifyPassword, parseUser } from "../functions/api/_shared.js";
import { onRequestPost as registerPost } from "../functions/api/register.js";
import { onRequestPost as loginPost } from "../functions/api/login.js";
import { onRequestGet as meGet, onRequestPut as mePut } from "../functions/api/me.js";

let pass = 0, fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log("  ✓ " + n); } else { fail++; console.log("  ✗ FAIL: " + n); } };

// 最小内存 D1 模拟
const mem = { users: new Map(), sessions: new Map() };
function makeDB() {
  return {
    prepare(sql) {
      return {
        bind(...p) {
          return {
            async first() {
              if (sql.startsWith("SELECT * FROM users WHERE name=?")) return mem.users.get(p[0]) || null;
              if (sql.startsWith("SELECT * FROM sessions WHERE token=?")) return mem.sessions.get(p[0]) || null;
              return null;
            },
            async all() { return { results: [] }; },
            async run() {
              if (sql.startsWith("INSERT INTO users")) mem.users.set(p[0], { name: p[0], pw_hash: p[1], created: p[2], data: p[3] });
              else if (sql.startsWith("INSERT INTO sessions")) mem.sessions.set(p[0], { token: p[0], name: p[1], exp: p[2] });
              else if (sql.startsWith("UPDATE users SET data=?")) { const u = mem.users.get(p[1]); if (u) u.data = p[0]; }
            },
          };
        },
      };
    },
  };
}
const env = { DB: makeDB() };
const req = (body, cookie) => ({
  json: async () => body,
  headers: { get: (h) => (String(h).toLowerCase() === "cookie" ? (cookie || null) : null) },
});

(async () => {
  try {
    console.log("— A. PBKDF2 密码哈希 —");
    const h = await hashPassword("secret1");
    ok(!!h.salt && !!h.hash, "生成 salt+hash");
    ok(await verifyPassword("secret1", h.salt, h.hash), "正确密码校验通过");
    ok(!(await verifyPassword("wrong", h.salt, h.hash)), "错误密码校验失败");

    console.log("— B. 注册 —");
    const r1 = await registerPost({ request: req({ user: "alice", pw: "secret1" }), env });
    ok(r1.status === 200, "注册返回 200");
    const u1 = await r1.json();
    ok(u1.user && u1.user.name === "alice", "返回用户名 alice");
    ok(u1.user.xp === 0 && Array.isArray(u1.user.ach), "返回默认进度字段");
    const sc = r1.headers.get("set-cookie") || "";
    ok(sc.includes("lv_sid=") && sc.toLowerCase().includes("httponly"), "下发 HttpOnly 会话 Cookie");
    const token = sc.split(";")[0].split("=")[1];
    const cookie = "lv_sid=" + token;

    console.log("— C. 已登录拉取进度 —");
    const r2 = await meGet({ request: req({}, cookie), env });
    ok(r2.status === 200, "GET /api/me 返回 200");
    ok((await r2.json()).user.name === "alice", "会话解析出当前用户");

    console.log("— D. 进度同步白名单过滤 —");
    const r3 = await mePut({ request: req({ xp: 50, streak: 3, ach: ["first_login"], name: "bob", pw_hash: "hack" }, cookie), env });
    ok(r3.status === 200, "PUT /api/me 返回 200");
    const saved = JSON.parse(mem.users.get("alice").data);
    ok(saved.xp === 50 && saved.streak === 3, "白名单字段写入");
    ok(saved.name === undefined && saved.pw_hash === undefined, "非白名单字段被忽略（防注入）");

    console.log("— E. 登录 —");
    const r4 = await loginPost({ request: req({ user: "alice", pw: "secret1" }), env });
    ok(r4.status === 200 && (await r4.json()).user.name === "alice", "正确密码登录成功");
    const r5 = await loginPost({ request: req({ user: "alice", pw: "wrong" }), env });
    ok(r5.status === 401, "错误密码登录被拒 401");

    console.log("— F. 未登录禁止访问 —");
    const r6 = await meGet({ request: req({}, null), env });
    ok(r6.status === 401, "无 Cookie 访问 /api/me 返回 401");

    console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
    process.exit(fail ? 1 : 0);
  } catch (e) {
    console.error("测试异常:", e);
    process.exit(1);
  }
})();
