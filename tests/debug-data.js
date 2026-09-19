const fs = require("fs");
const path = require("path");
const { JSDOM } = require(path.join("C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules", "jsdom"));
const html = fs.readFileSync("F:/LLM/linguaverse-web/index.html", "utf8");
const dom = new JSDOM(html, { url: "http://localhost:8611/index.html#/course/en", runScripts: "dangerously", pretendToBeVisual: true,
  beforeParse(w){
    w.HTMLElement.prototype.scrollTo=()=>{}; w.scrollTo=()=>{};
    w.fetch = (u, o) => global.fetch(new URL(u, "http://localhost:8611/"), o);
  } });
const { window } = dom; const { document } = window;
setTimeout(() => {
  const t = document.querySelector("#app").textContent;
  console.log("B2 解锁:", t.includes("Media & Society"));
  console.log("C1 解锁:", t.includes("Nuance & Rhetoric"));
  console.log("筹备中仍存在:", t.includes("正在筹备中"));
  console.log("单元计数(en 总数):", (t.match(/(\d+) 个主题单元/) || [])[1]);
  console.log("即将上线残留:", t.includes("即将上线"));
}, 1200);
