# LinguaVerse · 沉浸式多语言学习平台（v1.2.0）

单文件零依赖的多语言在线学习网站（英语 / 日语 / 韩语），双击 `index.html` 即可本地运行，一条命令部署到 Cloudflare Pages，并支持云端账号与进度同步。

## 功能一览

| 能力 | 说明 |
| --- | --- |
| 📖 分级课程体系 | CEFR 标准 A1→C1 六级阶梯，英/日/韩三语各配主题单元（问候、旅行、美食、职场…），逐级解锁 |
| 🃏 单词记忆 | 翻转卡片 + 主动回忆自评，TTS 标准发音 |
| ✏️ 语法练习 | 场景化选择题即时判分，每题配中文解析 |
| 🎧 听力训练 | 原声播放（可调语速），听音选义 |
| 🎙️ 口语跟读 | 示范发音 + 麦克风语音识别跟读打分（Chrome/Edge），不支持时自动降级为自评 |
| 📈 学习进度追踪 | XP 经验、连续打卡、7 天学习曲线、模块正确率分析、课程完成度 |
| 👤 用户注册登录 | 云端账号体系（Cloudflare D1 + PBKDF2 哈希 + HttpOnly Cookie 会话），多设备无缝衔接 |
| ☁️ 云端同步 | 写操作先落本地缓存再异步同步云端，离线可学、联网自动回传（含离线队列） |
| 🧭 个性化路径推荐 | 根据正确率/未完成单元/打卡状态智能推荐下一步学什么 |
| 💬 社区 + 🏅 成就激励 | 真实跨用户讨论区发帖/点赞/评论、XP 排行榜、8 枚成就徽章 |
| 🔁 间隔重复复习 | 单词记忆接入 SM-2 算法，认识/忘记自动排期，「复习」页集中清到期卡片 |
| 📒 生词本 | 语法/听力答错、单词自评「不认识」自动收集，可听发音、可移除 |
| 🌙 深色模式 | 跟随系统 + 手动切换，首屏防闪白 |
| 🎯 每日目标 | 设定每日 XP 目标，进度条直观展示，达成解锁成就 |
| 📊 学习战报 | Canvas 生成精美战报卡片，一键保存图片分享 |
| 📱 PWA | 离线可学、可安装到桌面/主屏（部署到 https 后生效） |

## 本地运行

零依赖，任选其一：

```powershell
# 方式一：直接双击 index.html（file:// 打开即可用，纯本地模式）
# 方式二：静态服务器
cd linguaverse-web
python -m http.server 8611
# 打开 http://localhost:8611
```

> 未部署后端函数时，站点自动以**本地模式**运行（数据存浏览器本地），功能完整；部署 Pages Functions 后自动切换为云端同步模式。

## 部署到 Cloudflare Pages（含云端后端）

```powershell
# 首次：浏览器 OAuth 登录 Cloudflare（一次性）
powershell -ExecutionPolicy Bypass -File deploy.ps1 -Login

# 部署 / 更新（会自动建 D1 库、执行 schema、注入 database_id）
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

部署成功后访问 `https://linguaverse.pages.dev`。

也可以用 API Token 方式（ dash.cloudflare.com → My Profile → API Tokens，创建带 **Cloudflare Pages: Edit** 权限的令牌）：

```powershell
$env:CLOUDFLARE_API_TOKEN = "你的令牌"
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

手动步骤等价于：

```bash
npx wrangler d1 create linguaverse
npx wrangler d1 execute linguaverse --file=./schema.sql
# 把 wrangler.toml 里的 database_id 占位符换成真实 id
npx wrangler pages deploy . --project-name=linguaverse
```

## 测试

```bash
# 全流程冒烟测试（注册→报名→四大模块→进度→社区→成就→再登录，33 断言）
npm i jsdom --prefix <任意目录>   # 或全局已有
NODE_PATH=<jsdom 所在 node_modules> node tests/flow.test.js

# SM-2 间隔重复 / 生词本 单元测试（零依赖，12 断言）
node tests/srs.test.js
```

## 技术说明

- **单文件零依赖**：全部 HTML/CSS/JS 内联在 `index.html`（约 1200 行），无构建、无 npm、无 CDN 外链，国内外网络均可秒开。
- **云端后端（P1）**：Cloudflare Pages Functions（`functions/api/*.js`）+ D1。注册/登录走 API，密码用 Workers 原生 Web Crypto（PBKDF2-SHA256）哈希，会话用 HttpOnly + SameSite=Lax Cookie。前端 store 层为「API 优先 + 本地缓存兜底」：写点先落本地再异步 PUT `/api/me`，离线进队列、联网重试；无后端时纯本地降级。
- **语音能力**：Web Speech API（`speechSynthesis` 发音示范 / `SpeechRecognition` 跟读识别），不支持语音识别的浏览器自动降级为自评模式。
- **路由**：HashRouter（`#/courses`、`#/learn/en`），刷新不 404，天然适配静态托管。

## 目录结构

```
linguaverse-web/
├── index.html          # 全部页面 + 逻辑（唯一必需文件，前端 store 层含云端同步）
├── manifest.webmanifest # PWA 清单
├── sw.js               # Service Worker（离线缓存壳）
├── icon.svg / icon-192.png / icon-512.png  # PWA 图标
├── functions/api/       # Cloudflare Pages Functions 后端（register/login/logout/me/posts…）
├── schema.sql          # D1 建表语句
├── wrangler.toml       # Pages + D1 绑定配置
├── tests/flow.test.js  # jsdom 全流程冒烟测试
├── tests/srs.test.js   # SM-2 / 生词本 单元测试（零依赖）
├── deploy.ps1          # Cloudflare Pages 一键部署（含 D1）
├── deploy.bat          # 双击部署
└── README.md
```
