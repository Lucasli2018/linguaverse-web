/* LinguaVerse 课程数据外置回归测试（v1.3.0，jsdom + Node 原生 fetch）
   验证：HTTP 访问时 data/{en,ja,ko}.json 被 fetch 并合并 → B2/C1 解锁、单元计数增长。
   运行前先起本地静态服务器：python -m http.server 8611 */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require(path.join("C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules", "jsdom"));

const BASE = "http://localhost:8611";
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const dom = new JSDOM(html, { url: BASE + "/index.html#/course/en", runScripts: "dangerously", pretendToBeVisual: true,
  beforeParse(w){
    w.HTMLElement.prototype.scrollTo = () => {}; w.scrollTo = () => {};
    w.fetch = (u, o) => global.fetch(new URL(u, BASE + "/"), o); // 给 jsdom 注入真 fetch
  } });
const { window } = dom; const { document } = window;

let pass = 0, fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log("  ✓ " + n); } else { fail++; console.log("  ✗ FAIL: " + n); } };

// 前置：校验三份 JSON 本身合法且结构完整
["en", "ja", "ko"].forEach(lang => {
  const j = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", lang + ".json"), "utf8"));
  const lvls = Object.keys(j);
  ok(lvls.includes("B2") && lvls.includes("C1"), lang + ".json 含 B2/C1");
  let n = 0, valid = true;
  for (const lv of lvls) for (const un of j[lv]) {
    n++;
    if (!un.id || !un.title || !Array.isArray(un.vocab) || !Array.isArray(un.grammar) || !Array.isArray(un.listen) || !Array.isArray(un.speak)) valid = false;
  }
  ok(valid, lang + ".json 单元结构完整（vocab/grammar/listen/speak）");
  ok(n >= 4, lang + ".json 至少 4 个新单元（实际 " + n + "）");
});

setTimeout(() => {
  const t = document.querySelector("#app").textContent;
  ok(t.includes("Media & Society"), "fetch 合并后英语 B2 解锁");
  ok(t.includes("Nuance & Rhetoric"), "fetch 合并后英语 C1 解锁");
  ok(!t.includes("正在筹备中") && !t.includes("即将上线"), "锁定文案无残留");
  ok(t.includes("単元") === false, "渲染正常（无模板错误）");
  console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
  process.exit(fail ? 1 : 0);
}, 1500);
