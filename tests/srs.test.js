// SM-2 间隔重复 + 生词本 单元测试（自包含，无需 jsdom）
// 运行：node tests/srs.test.js
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const blocks = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const src = blocks.reduce((a, b) => (b.length > a.length ? b : a), "");

function grab(name){
  const start = src.indexOf("function " + name + "(");
  if (start < 0) throw new Error("not found: " + name);
  let i = src.indexOf("{", start), depth = 0, end = -1;
  for (let j = i; j < src.length; j++){ const c = src[j]; if (c === "{") depth++; else if (c === "}"){ depth--; if (depth === 0){ end = j + 1; break; } } }
  return src.slice(start, end);
}
global.saveUser = () => {};
global.todayKey = () => new Date().toISOString().slice(0, 10);
eval(grab("srsKey")); eval(grab("srsUpsert")); eval(grab("srsReview")); eval(grab("wordbankAdd")); eval(grab("srsDue"));

let pass = 0, total = 0;
function ok(name, cond){ total++; if (cond){ pass++; console.log("PASS " + name); } else { console.log("FAIL " + name); } }

const u = { srs: {}, wordbank: [] };
srsUpsert(u, { t: "apple", m: "苹果", p: "/æpl/", lang: "en" }, 5);
ok("首次认识 interval=1", u.srs["en::apple"].interval === 1);
ok("首次认识 reps=1", u.srs["en::apple"].reps === 1);
srsUpsert(u, { t: "apple", m: "苹果", p: "/æpl/", lang: "en" }, 5);
ok("二次认识 interval=6", u.srs["en::apple"].interval === 6);
srsUpsert(u, { t: "apple", m: "苹果", p: "/æpl/", lang: "en" }, 5);
ok("三次认识 interval 递增>6", u.srs["en::apple"].interval > 6);
srsUpsert(u, { t: "apple", m: "苹果", p: "/æpl/", lang: "en" }, 1);
ok("遗忘重置 reps=0", u.srs["en::apple"].reps === 0);
ok("遗忘 interval=1", u.srs["en::apple"].interval === 1);
ok("遗忘 lapses+1", u.srs["en::apple"].lapses === 1);
ok("遗忘 ease 下降", u.srs["en::apple"].ease < 2.8);

const u2 = { srs: {} };
srsUpsert(u2, { t: "book", m: "书", p: "", lang: "en" }, 5);
ok("刚学完不在今日到期", srsDue(u2).length === 0);
u2.srs["en::book"].due = todayKey();
ok("due<=今日 出现在到期列表", srsDue(u2).length === 1);

const u3 = { srs: {}, wordbank: [] };
wordbankAdd(u3, { t: "cat", m: "猫", p: "", lang: "en", src: "vocab" });
wordbankAdd(u3, { t: "cat", m: "猫", p: "", lang: "en", src: "vocab" });
wordbankAdd(u3, { t: "dog", m: "狗", p: "", lang: "en", src: "grammar" });
ok("生词本去重后长度=2", u3.wordbank.length === 2);
ok("生词本记录来源", u3.wordbank[1].src === "grammar");

console.log("\n" + pass + "/" + total + " PASS");
process.exit(pass === total ? 0 : 1);
