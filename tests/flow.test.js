/* LinguaVerse 全流程冒烟测试（jsdom） */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require(path.join("C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules", "jsdom"));

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const dom = new JSDOM(html, {
  url: "http://localhost:8611/index.html#/",
  runScripts: "dangerously",
  pretendToBeVisual: true,
  beforeParse(window) {
    window.HTMLElement.prototype.scrollTo = () => {};
    window.scrollTo = () => {};
  },
});
const { window } = dom;
const { document } = window;

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log("  ✓ " + name); }
  else { fail++; console.log("  ✗ FAIL: " + name); }
}
const app = () => document.querySelector("#app");
const q = s => app().querySelector(s);
const qa = s => [...app().querySelectorAll(s)];
const text = () => app().textContent;
const sync = () => window.dispatchEvent(new window.Event("hashchange"));

setTimeout(() => {
  try {
    console.log("— 1. 首页 —");
    ok(text().includes("用母语者的方式"), "首页 hero 渲染");
    ok(qa(".lang-card").length >= 3, "三语种卡片渲染");

    console.log("— 2. 注册 —");
    window.location.hash = "#/register";
    sync();
    document.querySelector("#rg-user").value = "tester";
    document.querySelector("#rg-pw").value = "123456";
    document.querySelector("#rg-pw2").value = "123456";
    window.doRegister();
    ok(!!window.location.hash.match(/courses/), "注册后跳转课程中心");
    ok(text().includes("已报名") === false, "初始未报名状态正确");

    console.log("— 3. 报名英语 A1 —");
    window.enrollLv("en", "A1");
    sync();
    ok(window.location.hash.includes("/learn/en"), "报名后进入学习页");
    ok(text().includes("Greetings"), "默认定位到第一个单元");
    const u1 = JSON.parse(window.localStorage.getItem("linguaverse_db_v1")).users.tester;
    ok(u1.enrolled.en === "A1", "报名状态落库");

    console.log("— 4. 单词记忆模块 —");
    for (let i = 0; i < 8; i++) { window.rateWord(true); }
    let u2 = JSON.parse(window.localStorage.getItem("linguaverse_db_v1")).users.tester;
    ok(u2.progress.en.A1["en-a1-u1"].vocab.length === 8, "8 张卡片全部标记完成");
    ok(u2.moduleStat.word.c === 8 && u2.moduleStat.word.r === 8, "单词统计正确");
    ok(u2.xp === 16, "XP 累计正确（8×2）");

    console.log("— 5. 语法练习 —");
    for (let i = 0; i < 3; i++) { window.pickGrammar(0); window.nextGrammar(); }
    u2 = JSON.parse(window.localStorage.getItem("linguaverse_db_v1")).users.tester;
    ok(u2.progress.en.A1["en-a1-u1"].grammar.length === 3, "3 道语法题全部完成");
    ok(u2.xp === 46, "语法 XP 正确（16+3×10）");

    console.log("— 6. 听力训练 —");
    for (let i = 0; i < 2; i++) { window.pickListen(0); window.nextListen(); }
    u2 = JSON.parse(window.localStorage.getItem("linguaverse_db_v1")).users.tester;
    ok(u2.progress.en.A1["en-a1-u1"].listen.length === 2, "2 道听力题完成");

    console.log("— 7. 口语跟读 —");
    for (let i = 0; i < 2; i++) { window.rateSpeak(true); }
    u2 = JSON.parse(window.localStorage.getItem("linguaverse_db_v1")).users.tester;
    ok(u2.progress.en.A1["en-a1-u1"].speak.length === 2, "2 句跟读完成");
    ok(u2.ach.includes("first_lesson"), "成就「开卷有益」已解锁");
    ok(u2.streak === 1, "连续打卡 = 1 天");

    console.log("— 8. 学习页 tabs 与单元切换 —");
    window.location.hash = "#/learn/en";
    sync();
    ok(text().includes("单元 2"), "自动跳到第一个未完成单元");
    window.setModule("grammar");
    ok(text().includes("第 1 / 3 题"), "语法 tab 正常渲染");
    window.switchUnit(0);
    ok(text().includes("Greetings"), "单元 1 可切回复习");

    console.log("— 9. 进度页 —");
    window.location.hash = "#/progress";
    sync();
    ok(text().includes("16 单元") === false && text().includes("1 / 5 单元"), "完成度显示 1/5");
    ok(text().includes("个性化学习路径推荐"), "推荐模块渲染");
    ok(text().includes("已连续学习"), "打卡提醒渲染");
    ok(qa(".chart .col").length === 7, "7 天学习曲线渲染");

    console.log("— 10. 社区 —");
    window.location.hash = "#/community";
    sync();
    ok(qa(".post").length === 3, "3 条种子帖渲染");
    window.likePost("s1");
    document.querySelector("#postBody").value = "今天完成了第一个单元！";
    window.submitPost();
    ok(qa(".post").length === 4, "发帖成功");
    const u3 = JSON.parse(window.localStorage.getItem("linguaverse_db_v1")).users.tester;
    ok(u3.ach.includes("social"), "成就「社区之声」解锁");
    ok(u3.xp > 46 + 10, "发帖 XP 到账");

    console.log("— 11. 排行榜 —");
    window.setCommTab(1);
    ok(text().includes("Kevin老师") && text().includes("（我）"), "排行榜含用户且标记我");

    console.log("— 12. 成就页 / 退出登录 / 再登录 —");
    window.location.hash = "#/achievements";
    sync();
    ok(qa(".ach.got").length === 3, "已点亮 3 枚徽章");
    window.location.hash = "#/login";
    sync();
    document.querySelector("#li-user").value = "tester";
    document.querySelector("#li-pw").value = "wrongpw";
    window.doLogin();
    ok(text().includes("用户名或密码不正确"), "错误密码被拒绝");
    document.querySelector("#li-pw").value = "123456";
    window.doLogin();
    ok(window.location.hash.includes("/learn"), "重新登录成功");

    console.log("— 13. 日语报名与语言切换 —");
    window.enrollLv("ja", "A1");
    sync();
    ok(text().includes("あいさつ"), "日语课程渲染");
    window.switchLang("en");
    ok(text().includes("单元 2") || text().includes("Greetings"), "切回英语正常");

    console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
    process.exit(fail ? 1 : 0);
  } catch (e) {
    console.error("测试异常:", e);
    process.exit(1);
  }
}, 300);
