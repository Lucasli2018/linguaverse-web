# LinguaVerse · 沉浸式多语言学习平台

单文件零依赖的多语言在线学习网站（英语 / 日语 / 韩语），双击 `index.html` 即可本地运行，一条命令部署到 Cloudflare Pages。

## 功能一览

| 能力 | 说明 |
| --- | --- |
| 📖 分级课程体系 | CEFR 标准 A1→C1 六级阶梯，英/日/韩三语各配主题单元（问候、旅行、美食、职场…），逐级解锁 |
| 🃏 单词记忆 | 翻转卡片 + 主动回忆自评，TTS 标准发音 |
| ✏️ 语法练习 | 场景化选择题即时判分，每题配中文解析 |
| 🎧 听力训练 | 原声播放（可调语速），听音选义 |
| 🎙️ 口语跟读 | 示范发音 + 麦克风语音识别跟读打分（Chrome/Edge），不支持时自动降级为自评 |
| 📈 学习进度追踪 | XP 经验、连续打卡、7 天学习曲线、模块正确率分析、课程完成度 |
| 👤 用户注册登录 | 本地账号体系（localStorage，密码哈希存储），进度随账号保存 |
| 🧭 个性化路径推荐 | 根据正确率/未完成单元/打卡状态智能推荐下一步学什么 |
| 💬 社区 + 🏅 成就激励 | 讨论区发帖/点赞/评论、XP 排行榜、8 枚成就徽章 |

## 本地运行

零依赖，任选其一：

```powershell
# 方式一：直接双击 index.html（file:// 打开即可用）
# 方式二：静态服务器
cd linguaverse-web
python -m http.server 8611
# 打开 http://localhost:8611
```

## 部署到 Cloudflare Pages

```powershell
# 首次：浏览器 OAuth 登录 Cloudflare（一次性）
powershell -ExecutionPolicy Bypass -File deploy.ps1 -Login

# 部署 / 更新
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

部署成功后访问 `https://linguaverse.pages.dev`。

也可以用 API Token 方式（ dash.cloudflare.com → My Profile → API Tokens，创建带 **Cloudflare Pages: Edit** 权限的令牌）：

```powershell
$env:CLOUDFLARE_API_TOKEN = "你的令牌"
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

或手动：`npx wrangler pages deploy . --project-name=linguaverse`

## 测试

```bash
# 全流程冒烟测试（注册→报名→四大模块→进度→社区→成就→再登录，33 断言）
npm i jsdom --prefix <任意目录>   # 或全局已有
NODE_PATH=<jsdom 所在 node_modules> node tests/flow.test.js
```

## 技术说明

- **单文件零依赖**：全部 HTML/CSS/JS 内联在 `index.html`（约 1100 行），无构建、无 npm、无 CDN 外链，国内外网络均可秒开。
- **语音能力**：Web Speech API（`speechSynthesis` 发音示范 / `SpeechRecognition` 跟读识别），不支持语音识别的浏览器自动降级为自评模式。
- **数据存储**：`localStorage`，账号与学习进度保存在浏览器本地。若需多设备同步/云端账号，后续可加 Cloudflare Workers + D1/KV 做后端（前端接口已集中在一个 store 层，改造成本低）。
- **路由**：HashRouter（`#/courses`、`#/learn/en`），刷新不 404，天然适配静态托管。

## 目录结构

```
linguaverse-web/
├── index.html        # 全部页面 + 逻辑（唯一必需文件）
├── tests/flow.test.js# jsdom 全流程冒烟测试
├── deploy.ps1        # Cloudflare Pages 一键部署
├── deploy.bat        # 双击部署
└── README.md
```
