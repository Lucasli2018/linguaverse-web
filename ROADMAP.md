# LinguaVerse 开发路线图

> 当前版本 v1.2.0。版本节奏遵循全局约定：常规迭代 +0.0.1，大功能升级 +0.1.0。

## P0 · 上线部署（本周，版本不变）

纯部署动作，不改代码：

- [ ] `deploy.ps1 -Login` 浏览器授权 Cloudflare（一次性）
- [ ] `deploy.ps1` 发布，验证 `https://linguaverse.pages.dev` 可访问
- [ ] 移动端走查（iPhone Safari / 安卓 Chrome）：导航横滑、flash 卡片、语音权限
- [ ] 静态资源缓存策略（Pages 默认即可，必要时加 `_headers`）

## P1 · 云端账号与数据同步（v1.1.0，已完成 ✅）

账号与进度上云，换设备/清缓存不丢，社区与排行榜升级为真实跨用户数据。

- [x] Cloudflare Pages Functions + D1 建表：`users / sessions / posts / comments / likes`（schema.sql）
- [x] 鉴权：注册登录走 API，密码 PBKDF2 哈希（Workers 原生 Web Crypto），HttpOnly Cookie 会话
- [x] 前端 store 层改造为「API 优先 + 浏览器本地缓存兜底」，离线可学、联网自动同步（含离线队列）
- [x] 社区 / 排行榜切为真实跨用户数据（种子帖保留为冷启动内容）
- [x] 里程碑验收：手机注册 → 电脑登录，进度无缝衔接（Cookie 会话自动携带）

> 部署注意：本仓库用 Pages Functions（`functions/api/*`），部署前需 `wrangler d1 create linguaverse` 建库；`deploy.ps1` 已自动创建并执行 schema、注入 `database_id`。纯静态部署（无 functions）时前端自动降级为本地模式，功能不受影响。

## P2 · 内容与记忆算法（v1.2.x，迭代交付）

- [ ] 课程内容外置 `data/{en,ja,ko}.json`，按需 fetch（单文件骨架保留）
- [ ] 补齐 B2/C1 单元内容，解锁完整 A1→C1 六级
- [x] 单词记忆升级 SM-2 间隔重复：复习队列、到期提醒、"今天该复习"入口（v1.2.0，78500ec）
- [x] 生词本：听力/语法中答错的词自动进队列（v1.2.0，78500ec）
- [ ] 扩充单元至每级 4+ 单元，增加场景（购物、就医、面试…）

## P3 · 体验深化（v1.3.x）

- [x] PWA：Service Worker 离线可学、可安装到桌面/主屏（v1.2.0，4d8abaa）
- [x] 深色模式（跟随系统 + 手动切换）（v1.2.0，fcad11b）
- [x] 每日学习目标设定（Web Push 到期提醒待做）（v1.2.0，8529a54）
- [ ] 听力训练：变速（0.5×~1.5×）、单句精听（逐句循环+听写模式）
- [ ] 口语识别兜底优化：iOS Safari 不支持 SpeechRecognition 时的自评流打磨

## P4 · 运营与增长（v2.0 前置）

- [ ] 管理后台：课程内容 CRUD（Workers 鉴权 + D1），不用改代码就能加课
- [ ] SEO：预渲染落地页、多语言 landing（/en /ja /ko）
- [x] 分享邀请机制：学习战报卡片生成（Canvas 导出图片）（v1.2.0，8529a54）
- [ ] Cloudflare Web Analytics 接入，看留存与模块使用率

## 技术备注

- 语音识别（SpeechRecognition）仅 Chromium 系支持，Safari/Firefox 自动降级自评——产品文案已按此设计，勿当 bug 修。
- D1 免费额度（5GB 存储 / 每天 500 万行读）对个人站绰绰有余，成本可控。
- 单文件范式保留：P1 后仍是「index.html + data/*.json + worker.js」三件套，无构建链。

---

## 进阶路线图（v1.3+，2026-09-19 规划）

> 现状：v1.2.0 已交付四模块 / SM-2 / 生词本 / 社区 / 成就 / PWA / 深色 / 目标 / 战报。
> ⚠️ 已知技术债：线上 D1 绑定未生效（`wrangler.toml` 注释 + `database not found`），P1「云端」实际走本地兜底，跨设备同步未真生效——已写后端代码处于未点亮状态。

### Phase 0 · 云端修复（下一阶段 / 第一优先，v1.3.0）

把已写好的 P1 后端真正点亮，是后续社交/同步类功能的地基。

- [ ] 建 D1 库并解 `database not found`（确认账户 D1 权限/区域；若账户受限降级用 Workers KV 或纯本地模式）
- [ ] 解除 `wrangler.toml` 中 `[[d1_databases]]` 注释并填真实 `database_id`
- [ ] 端到端验收：手机注册 → 另一浏览器登录，进度 / 生词本 / 社区帖无缝衔接
- [ ] 离线队列在真实网络抖动下的重试与冲突处理加固
- **依赖**：地基，先行。**部署 / 建库动作由领主手动跑**（咪咪只准备代码 + 本地验证 + commit/push）

### Phase 1 · 内容工程（v1.3.x）

- [ ] 课程内容外置 `data/{en,ja,ko}.json`，按需 fetch（降低单文件体积，可热更）
- [ ] 补齐 B2/C1 单元，解锁完整 A1→C1
- [ ] 每级 4+ 单元，新增场景（购物、就医、面试、租房）
- **依赖**：低

### Phase 2 · 听力 & 口语进阶（v1.4.x）

- [ ] 听力：0.5×~1.5× 变速、单句精听（逐句 AB 循环）、听写模式（逐句填空判分）
- [ ] 口语：SpeechRecognition 之外打磨降级自评流（iOS Safari / Firefox）
- **依赖**：低（纯前端）

### Phase 3 · 游戏化 & 社交深化（v1.5.x）

- [ ] 赛季排行榜、段位、连胜保护（streak freeze）
- [ ] 学习小组 / 好友挑战 / 7 日打卡挑战赛
- [ ] 社区升级：话题标签、@提醒
- **依赖**：需 Phase 0

### Phase 4 · 运营与增长（v2.0 前置）

- [ ] 管理后台：课程内容 CRUD（Workers 鉴权 + D1）
- [ ] SEO：多语言 landing（/en /ja /ko）+ 预渲染
- [ ] Cloudflare Web Analytics 接入
- [ ] 每日目标 Web Push 提醒（P3 遗留）
- **依赖**：需 Phase 0

### Phase 5 · AI 能力支柱（差异化，可穿插）

- [ ] `functions/api/ai` 代理（LLM key 存 Worker 环境变量，不进前端）
- [ ] AI 情景对话陪练、错题 AI 讲解、智能生成练习题
- [ ] 可选：发音评分（接语音评测 API）
- **依赖**：需后端

### 技术演进建议

- 保留零依赖零构建；Phase 1 内容外置是减轻单文件膨胀（现 ~1200 行 / 104KB）的关键一步。
- 若功能持续膨胀，再考虑「壳 `index.html` + 模块化原生 JS」，仍不引入构建链。
- 版本节奏：常规迭代 +0.0.1，大功能升级 +0.1.0（遵循全局约定）。
