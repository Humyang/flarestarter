# Smart Clip 推广实施报告

实施日期：2026-08-10（Asia/Shanghai）

状态：**已部署生产并完成公开页面回归；未开始外部渠道推广，法律与数据权利门禁仍未解除。**

## 已实现

### 落地页与转化路径

- 首页英中价值主张改为当前可验证的 MP4 字幕渲染与翻译流程。
- 用可播放的 20 秒合成界面演示替换 404 占位图，提供英文/中文字幕、封面和静帧；所有画面仅由 FFmpeg 图形、文字和模拟数据生成，不读取截图或样例媒体，并明确省略实际处理等待。
- 首页、导航、演示区、页尾、页脚与价格页 CTA 统一为：匿名用户进入注册并携带安全白名单 `next=/app/render`；登录用户直达渲染页。
- 修复受保护路由在客户端导航时落到 `/_serverFn/login` 404 的问题，英文和中文入口均使用具体文档地址跳转。
- 邮箱登录、注册、社交登录和验证邮件重发保留语言与安全回跳目标。
- 价格页只显示已验证的免费 Beta 能力；Pro 明确为未开放购买，价格未公布；移除未配置赞助页的营销入口。
- 渲染上传或上游提交失败时返回失败结果并持久化失败状态，前端不再误报成功或清空表单。

### Analytics 与归因

- GA4 关闭自动首屏 page view，统一由 SPA 路由跟踪器发送净化后的 `page_view`。
- 实现事件：`cta_click`、`sign_up_start`、`sign_up`、`render_start`、`render_complete`、`result_download`。
- 事件名和参数使用封闭白名单；过滤任意多余字段，并为 GA 请求显式提供只含规范 UTM 的 `page_location/page_path`，不把邮箱、token 等查询参数带入 `dl`。
- 首次触达 UTM 保存在浏览器 localStorage；后续 CTA、注册、渲染和下载事件复用该归因，不允许后续活动覆盖。
- 注册事件使用 sessionStorage 去重；渲染和首次下载使用 job/本地标识减少轮询或重复点击造成的重复计数。
- `purchase` 只保留类型支持，没有触发实现，因为 Pro 尚未开放购买。

生产配置注意：GA4 Web 数据流的 Enhanced Measurement 仍需在后台确认。上线前关闭“Page changes based on browser history events”，避免 GA 自动历史路由 page view 与应用手动 `page_view` 重复；只保留明确需要的自动采集项。代码侧已通过全局 `page_location` 和每个自定义事件的安全页面上下文过滤邮箱、token 等查询参数。

限制：这些漏斗事件由浏览器在服务端成功响应或已确认状态后上报，不是 GA4 Measurement Protocol 的服务端事实，也不能跨设备严格幂等。推广复盘必须与数据库注册、任务和下载事实对账，GA4 数值作为方向性漏斗。

### SEO 与公开索引面

- `sitemap.xml` 只收录英中首页与价格页。
- 英中首页提供独立 title、description、canonical、hreflang、真实产品 OG 图和 JSON-LD。
- docs、docs Markdown、changelog、status、sponsor、waitlist 保持 `noindex`；账户和管理页面继续不进入公开索引面。
- `llms.txt` 与 `llms-full.txt` 仅描述已验证产品能力，不再暴露 SaaS 模板、环境变量或部署文档。

### 推广资产

- `public/product-demo/`：程序化生成的 20 秒 16:9 MP4、英文/中文字幕、封面和上传/队列静帧。
- `public/og/smart-clip.png`：1200x630 真实产品界面分享图（无后台侧栏）。
- `marketing/launch-plan.md`：四周推广节奏、渠道、预算、指标和停止条件。
- `marketing/content-calendar.md`：逐平台文案、素材、CTA 与完整 UTM 链接。
- `marketing/wechat-launch.md`：公众号首发稿、5 个标题和配图规范。

## 验证结果

最终命令与浏览器结果已在本轮完成。已确认的本地检查：

- 英中首页、价格页、产品演示、字幕、OG、robots、sitemap 和 llms 资源可访问。
- 匿名 `/app/render` 与 `/zh/app/render` 使用 307 跳到对应注册页，并保留编码后的 `next=/app/render`。
- 390x844 移动端首屏无横向溢出，移动菜单可打开，CTA 路径正确。
- 带邮箱、手机号和 token 形态查询值的页面上报中只保留规范化且非个人信息的 UTM；初始 GA config、SPA page context、`page_view` 和自定义事件均未带这些敏感值。
- 新 MP4 四段抽帧复核无真实账号、邮箱或媒体；视频、字幕和页面说明均标为合成界面/模拟数据，且标明省略实际处理等待。
- 英中条款与隐私四页在 1440px 和 390px 浏览器中均为 200，保留 `noindex` 与审核警告，分别完整渲染 11 个条款章节和 8 个隐私章节，无横向溢出或页面脚本异常。
- 合成 MP4 为 H.264、1920x1080、30 fps、20.000 秒；源文件与公共文件 SHA-256 均为 `7c71ef71c826d85489bde78c2ca10ad047111be52e4db6314c4684a2ed40267c`。

最终结果：

| 检查 | 结果 |
| --- | --- |
| `pnpm lint` | PASS（0 errors；1 个既有 sponsor warning） |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS（48 files，294 tests） |
| `pnpm build` | PASS（既有 sponsor API 弃用与 chunk size warning） |
| `git diff --check` | PASS |
| 最终桌面/移动浏览器回归 | PASS（本地 3001；英中、307 回跳、移动菜单、资源与 GA 脱敏） |

## 生产发布记录

2026-08-10 按负责人“直接发布”指令执行 `pnpm deploy:prod`：

- Cloudflare Worker：`flarestarter-production`
- Version ID：`a17b3e46-8469-40a1-b1b7-27faa4928c38`
- 路由：`dve2.com`、`www.dve2.com/*`
- 生产 D1：发布前确认无待执行迁移
- 验证：`/`、`/zh`、`/register`、`/zh/terms`、`/privacy` 均返回 200；视频、封面、`robots.txt`、`sitemap.xml` 返回 200；`/.dev.vars` 返回 404
- 浏览器回归：桌面和 390px 移动端无横向溢出；首页视频可播放；英中 canonical/hreflang 正确；注册与法律页保持 `noindex`；法律页显示最低年龄 18 周岁
- GA4：网络面板观察到 `gtag.js`，英文首页观察到 `g/collect`；仍需 GA4 后台 DebugView/Enhanced Measurement 验收

## 外部推广仍阻塞的原因

生产站点已经发布，但投放、群发、社区发布和邀请陌生用户注册仍未放行：

1. 英中服务条款与隐私政策审核稿已经接入，但主体、法域、法律依据、处理方、跨境机制、保留期、年龄、责任和争议等 `[[待确认]]` 字段尚未由业务负责人及合格律师批准。
2. 注册勾选没有服务端保存条款版本/时间/来源，OAuth 可绕过；仅 OAuth 用户删号路径、R2/服务商副本删除、GA4 同意/退出方案也未完成。页面文案不能替代这些技术整改。
3. 公开页面已经部署并通过基础生产回归；GA4 后台属性和完整英中注册/首次渲染路径仍待生产验收。

合成素材的权利与隐私门禁已解除：生产公共资产不含客户或第三方媒体，溯源见 `video/product-demo/review-packet.md`。本次生产部署是负责人的明确发布决定，不代表其余法律与数据权利门禁已经通过；在门禁解除前不发布公众号/Bilibili/Product Hunt，也不邀请陌生用户注册。

## 门禁解除后的生产步骤

1. 业务负责人和合格律师填写并批准英中法律稿，确定目标地区、版本号和生效日期；保留审批记录。
2. 实现服务端版本化条款接受、OAuth 同意路径、OAuth 用户删号、R2/服务商副本删除，以及批准后的分析同意/退出方案。
3. 重新运行完整验证命令，再执行 `pnpm deploy:prod`，记录 Cloudflare Worker 版本 ID。
4. 在全新无登录桌面和 390px 移动浏览器中复测英中落地页、注册、验证邮件、首次渲染和下载。
5. 按已批准的同意方案配置 GA4；关闭“Page changes based on browser history events”，确认不需要的自动表单/站内搜索采集未开启。
6. 在 GA4 DebugView/实时报告和网络面板复核事件名称、次数、UTM、同意状态和隐私字段。
7. 确认 sitemap 只有 4 个公开 URL、OG 与合成演示资源均为 200、法律页已批准，再把 `launch-plan.md` 的 T0 设为实际放行日。
