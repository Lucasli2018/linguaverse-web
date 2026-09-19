/* 移动端截图：390×844（与 mobile-probe 同一套 CDP 视口设置） */
import { spawn } from "node:child_process";

const CHROME = "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:8611";
const PORT = 9778;
const sleep = ms => new Promise(r => setTimeout(r, ms));

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map();
    ws.addEventListener("message", ev => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) { const { resolve, reject } = this.pending.get(m.id); this.pending.delete(m.id);
        m.error ? reject(new Error(m.error.message)) : resolve(m.result); }
    });
  }
  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expr) {
    const r = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error("page eval: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  }
}

const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu", "--no-first-run",
  `--remote-debugging-port=${PORT}`, "--user-data-dir=" + process.env.TEMP + "/lv-shot-profile", "about:blank",
], { stdio: "ignore" });

try {
  let target = null;
  for (let i = 0; i < 30; i++) {
    await sleep(300);
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/list`); const list = await r.json(); target = list.find(t => t.type === "page"); if (target) break; } catch {}
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
  const cdp = new CDP(ws);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: false });

  const shot = async (hash, file, pre) => {
    await cdp.send("Page.navigate", { url: BASE + "/index.html" + hash });
    await sleep(900);
    if (pre) await cdp.eval(pre);
    await sleep(400);
    const img = await cdp.send("Page.captureScreenshot", { format: "png" });
    const { writeFileSync } = await import("node:fs");
    writeFileSync(file, Buffer.from(img.data, "base64"));
    console.log("saved", file);
  };
  await shot("#/", "F:/LLM/linguaverse-web/mobile-home.png");
  await shot("#/", "F:/LLM/linguaverse-web/mobile-menu.png", `document.querySelector("#navBurger").click()`);
  // 学习页引导层（预置本地用户）
  await cdp.eval(`(() => {
    const db = { users: {}, session: null, posts: null };
    db.users["领主"] = { name: "领主", pw: "x", created: Date.now(), xp: 42, days: {}, streak: 1, bestStreak: 3, ach: [],
      enrolled: { en: "A1" }, progress: {}, moduleStat: { word: {c:0,r:0}, grammar: {c:0,r:0}, listen: {c:0,r:0}, speak: {c:0,r:0} }, srs: {}, wordbank: [], goal: 30 };
    db.session = "领主";
    localStorage.setItem("linguaverse_db_v1", JSON.stringify(db));
    localStorage.removeItem("lv_guide_seen");
  })()`);
  await cdp.eval(`location.reload()`); await sleep(1000);
  await cdp.send("Page.navigate", { url: BASE + "/index.html#/learn" });
  await sleep(1200);
  const img3 = await cdp.send("Page.captureScreenshot", { format: "png" });
  const { writeFileSync } = await import("node:fs");
  writeFileSync("F:/LLM/linguaverse-web/mobile-guide.png", Buffer.from(img3.data, "base64"));
  console.log("saved F:/LLM/linguaverse-web/mobile-guide.png");
} catch (e) {
  console.error("异常:", e.message); process.exitCode = 1;
} finally { chrome.kill(); }
