# LinguaVerse 开发路线图

> 当前版本 v1.0.0（8592ee3，已推送 Gitee）。版本节奏遵循全局约定：常规迭代 +0.0.1，大功能升级 +0.1.0。

## P0 · 上线部署（本周，版本不变）

纯部署动作，不改代码：

- [ ] `deploy.ps1 -Login` 浏览器授权 Cloudflare（一次性）
- [ ] `deploy.ps1` 发布，验证 `https://linguaverse.pages.dev` 可访问
- [ ] 移动端走查（iPhone Safari / 安卓 Chrome）：导航横滑、flash 卡片、语音权限
- [ ] 静态资源缓存策略（Pages 默认即可，必要时加 `_headers`）

## P1 · 云端账号与数据同步（v1.1.0，核心升级）

当前最大短板：账号与进度只存浏览器本地，换设备/清缓存即丢，社区和排行榜也只是"本地单人版"。

- [ ] Cloudflare Workers + D1 建表：`users / sessions / progress / posts / comments / likes`
- [ ] 鉴权：注册登录走 API，密码 PBKDF2 哈希（Workers 原生 crypto），HttpOnly Cookie 会话
- [ ] 前端 store 层改造为「API 优先 + 浏览器本地缓存兜底」，离线时可学、联网后同步
- [ ] 社区 / 排行榜切为真实跨用户数据（种子帖保留为冷启动内容）
- [ ] 里程碑验收：手机注册 → 电脑登录，进度无缝衔接

## P2 · 内容与记忆算法（v1.2.x，迭代交付）

- [ ] 课程内容外置 `data/{en,ja,ko}.json`，按需 fetch（单文件骨架保留）
- [ ] 补齐 B2/C1 单元内容，解锁完整 A1→C1 六级
- [ ] 单词记忆升级 SM-2 间隔重复：复习队列、到期提醒、"今天该复习"入口
- [ ] 生词本：听力/语法中答错的词自动进队列
- [ ] 扩充单元至每级 4+ 单元，增加场景（购物、就医、面试…）

## P3 · 体验深化（v1.3.x）

- [ ] PWA：Service Worker 离线可学、可安装到桌面/主屏
- [ ] 深色模式（跟随系统）
- [ ] 每日学习目标设定 + Web Push 到期提醒
- [ ] 听力训练：变速（0.5×~1.5×）、单句精听（逐句循环+听写模式）
- [ ] 口语识别兜底优化：iOS Safari 不支持 SpeechRecognition 时的自评流打磨

## P4 · 运营与增长（v2.0 前置）

- [ ] 管理后台：课程内容 CRUD（Workers 鉴权 + D1），不用改代码就能加课
- [ ] SEO：预渲染落地页、多语言 landing（/en /ja /ko）
- [ ] 分享邀请机制：学习战报卡片生成（Canvas 导出图片）
- [ ] Cloudflare Web Analytics 接入，看留存与模块使用率

## 技术备注

- 语音识别（SpeechRecognition）仅 Chromium 系支持，Safari/Firefox 自动降级自评——产品文案已按此设计，勿当 bug 修。
- D1 免费额度（5GB 存储 / 每天 500 万行读）对个人站绰绰有余，成本可控。
- 单文件范式保留：P1 后仍是「index.html + data/*.json + worker.js」三件套，无构建链。
