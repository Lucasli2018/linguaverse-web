/* LinguaVerse 移动端适配探针（无头 Chrome + CDP，视口 390×844）
   运行：先起静态服务器 python -m http.server 8611，再 node tests/probe/mobile-probe.mjs */
import { spawn } from "node:child_process";

const CHROME = "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:8611";
const PORT = 9777;

let pass = 0, fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log("  ✓ " + n); } else { fail++; console.log("  ✗ FAIL: " + n); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---- CDP 轻封装 ---- */
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = [];
    ws.addEventListener("message", ev => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) { const { resolve, reject } = this.pending.get(m.id); this.pending.delete(m.id);
        m.error ? reject(new Error(m.error.message)) : resolve(m.result); }
      else if (m.method) this.handlers.forEach(h => h(m));
    });
  }
  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  on(fn) { this.handlers.push(fn); }
  async eval(expr) {
    const r = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("page eval: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  }
}

const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  `--remote-debugging-port=${PORT}`, "--user-data-dir=" + process.env.TEMP + "/lv-probe-profile",
  "--window-size=400,900", "about:blank",
], { stdio: "ignore" });

try {
  // 拿 target ws url
  let target = null;
  for (let i = 0; i < 30; i++) {
    await sleep(300);
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/list`); const list = await r.json(); target = list.find(t => t.type === "page"); if (target) break; } catch {}
  }
  if (!target) throw new Error("无法连接 Chrome 调试端口");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
  const cdp = new CDP(ws);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  // 移动视口（mobile:false，避免 viewport meta 缩放导致坐标错位）
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: false });

  const goto = async hash => {
    await cdp.send("Page.navigate", { url: BASE + "/index.html" + hash });
    await sleep(700); // 等渲染 + 课程数据 fetch
  };
  const noOverflow = async () => cdp.eval(`document.documentElement.scrollWidth <= window.innerWidth + 1`);

  /* ---- 1. 首页（未登录） ---- */
  await goto("#/");
  ok(await noOverflow(), "首页 390px 无横向溢出");
  ok(await cdp.eval(`getComputedStyle(document.querySelector(".nav-links")).display === "none"`), "桌面导航链接在手机端隐藏");
  ok(await cdp.eval(`getComputedStyle(document.querySelector(".nav-burger")).display !== "none"`), "汉堡按钮可见");
  // 汉堡按钮未被遮挡（elementFromPoint 命中自己）
  ok(await cdp.eval(`(() => { const b = document.querySelector("#navBurger"); const r = b.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width/2, r.y + r.height/2) === b; })()`), "汉堡按钮位于顶层可点");

  /* ---- 2. 打开菜单 ---- */
  await cdp.eval(`document.querySelector("#navBurger").click()`);
  ok(await cdp.eval(`document.querySelector("#mNav").classList.contains("open")`), "点击汉堡后菜单展开");
  ok(await cdp.eval(`document.querySelectorAll("#mNav a").length >= 7`), "菜单包含全部 7 个导航项");

  /* ---- 3. 菜单点选跳转 ---- */
  await cdp.eval(`[...document.querySelectorAll("#mNav a")].find(a => a.getAttribute("href") === "#/courses").click()`);
  await sleep(400);
  ok(await cdp.eval(`location.hash.includes("courses")`), "菜单点「课程中心」正常跳转");
  ok(await cdp.eval(`!document.querySelector("#mNav").classList.contains("open")`), "跳转后菜单自动收起");
  ok(await noOverflow(), "课程中心页无横向溢出");

  /* ---- 4. 登录页（表单 16px 防 iOS 缩放） ---- */
  await goto("#/login");
  ok(await noOverflow(), "登录页无横向溢出");
  ok(await cdp.eval(`parseFloat(getComputedStyle(document.querySelector("#li-user")).fontSize) === 16`), "输入框字号 16px（防 iOS 聚焦放大）");

  /* ---- 5. 预置本地用户 → 学习页 ---- */
  await cdp.eval(`(() => {
    const db = { users: {}, session: null, posts: null };
    db.users["领主"] = { name: "领主", pw: "x", created: Date.now(), xp: 42, days: {}, streak: 1, bestStreak: 3, ach: [],
      enrolled: { en: "A1" }, progress: {}, moduleStat: { word: {c:0,r:0}, grammar: {c:0,r:0}, listen: {c:0,r:0}, speak: {c:0,r:0} }, srs: {}, wordbank: [], goal: 30 };
    db.session = "领主";
    localStorage.setItem("linguaverse_db_v1", JSON.stringify(db));
  })()`);
  await cdp.eval(`location.reload()`); // 让脚本重新 loadDB，会话才生效
  await sleep(900);
  await goto("#/learn");
  ok(await noOverflow(), "学习页无横向溢出");
  ok(await cdp.eval(`document.querySelectorAll(".tabs button").length === 4`), "学习页四个模块 Tab 正常");
  ok(await cdp.eval(`(() => { const b = document.querySelector("#navBurger"); const r = b.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width/2, r.y + r.height/2) === b; })()`), "学习页汉堡按钮未被 Tab/元素遮挡");
  ok(await cdp.eval(`getComputedStyle(document.querySelector(".kbd-hint")).display === "none"`), "键盘快捷键提示在手机端隐藏");

  /* ---- 6. 学习进度页（热力图可横向滚动、整页不溢出） ---- */
  await goto("#/progress");
  ok(await noOverflow(), "学习进度页无横向溢出");
  ok(await cdp.eval(`(() => { const g = getComputedStyle(document.querySelector(".stat-grid")).gridTemplateColumns.split(" ").length; return g === 2; })()`), "统计栅格 2 列");

  /* ---- 7. 社区页 ---- */
  await goto("#/community");
  ok(await noOverflow(), "社区页无横向溢出");

  /* ---- 8. 课程详情（等级阶梯布局） ---- */
  await goto("#/course/en");
  ok(await noOverflow(), "课程详情页无横向溢出");

  console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
  process.exitCode = fail ? 1 : 0;
} catch (e) {
  console.error("探针异常:", e.message);
  process.exitCode = 1;
} finally {
  chrome.kill();
}
