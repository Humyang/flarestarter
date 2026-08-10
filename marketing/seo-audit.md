# Smart Clip 技术 SEO 审计

审计时间：2026-08-09（Asia/Shanghai）

站点：`https://dve2.com`、`https://dve2.com/zh`

方法：生产响应与初始 HTML、Playwright 桌面/390px 移动端、源码交叉检查。使用 `seo-technical-audit` 的抓取、索引、架构、移动端、安全、结构化数据和 AI 抓取框架。

## 执行摘要

首页和价格页具备 SSR、HTTPS、canonical、英中双向 hreflang 和较好的移动端基础，认证/应用/管理页面也有 `noindex` 与 robots 保护。这些底层实现是可用的。

当前最大问题不是“少几个关键词”，而是**索引与内容清单失控**：sitemap 的 26 个 URL 中只有英中首页两个营销 URL，其余是包含模板维护说明的开发文档；真正的价格页未收录且从首页不可达。首页同时公开两张 404 图片和内部替换文案，`llms.txt` 又主要向 AI 暴露 fork、环境变量和部署说明。推广前应先修正公开内容面，再做标题、schema 和分发。

## 评分说明

以下是用于排序的审计框架分，不是 Lighthouse 或 Search Console 分数。PageSpeed Insights 本次返回 `429 RESOURCE_EXHAUSTED`，也没有 GSC/CrUX 权限，因此 Core Web Vitals 不评分，不能据此声称页面快或慢。

| 类别 | 得分 | 状态 | 主要依据 |
| --- | ---: | --- | --- |
| 抓取与索引 | 12/20 | 需修复 | robots/sitemap 可访问，但 sitemap 内容清单错误 |
| Core Web Vitals | N/A/20 | 未验证 | 无字段数据；PSI 配额不可用 |
| 站点架构 | 6/15 | 严重 | 价格页孤立，索引页与站内链接不一致 |
| 移动端 | 12/15 | 良好但需改 | 390px 无横向溢出；导航图标按钮仅 38x38px |
| HTTPS 与安全 | 10/10 | 良好 | HTTPS、HSTS、CSP、nosniff、DENY 均存在 |
| 结构化数据 | 0/10 | 缺失 | 重点页没有 JSON-LD |
| AI 抓取准备 | 2/10 | 严重 | `llms*.txt` 主要暴露模板/开发文档而非产品事实 |

可验证项小计为 **42/80**；CWV 补测后才能形成完整总分。

## 问题清单

### Critical — SEO-01：sitemap 和 AI 文档暴露了错误的内容集合

**证据**

- `/sitemap.xml` 返回 `200` 且 XML 有效，共 26 个 URL：英中首页 2 个，加 24 个 `/docs` 页面。
- 价格、更新日志、状态、候补、赞助等可索引页面不在 sitemap。
- `/docs`、`/llms.txt` 和 `/llms-full.txt` 包含“fork 后你要改哪”、本地环境变量、迁移、部署、后台和模板定制说明。
- 24 篇 docs 只有 6 篇提供独立 description；其余 18 篇中文页继承英文全站 description/OG description。
- `src/features/seo/seo.ts:3` 的 `PUBLIC_PATHS` 只有 `/`；`src/routes/sitemap[.]xml.ts:7` 又把全部 docs 注入 sitemap。
- `src/features/seo/seo.node.test.ts:31` 还明确断言价格、更新、赞助、候补和状态页不应进入 sitemap，说明当前错误清单已被测试固化。

**影响**

搜索引擎和 AI 抓取器更容易发现模板实现说明，而不是价格、真实工作流和产品证据；这会稀释站点主题，也会让潜在用户看到开发交接内容。

**建议修改位置**

- 将 `PUBLIC_PATHS` 改成经过产品负责人确认的显式可索引清单。
- 在 docs 真正面向 Smart Clip 用户前，从 sitemap、`llms*.txt` 和公开索引中移除，或加 `noindex` 并停止向其导流。
- 重新生成 `llms.txt`，只描述可验证产品能力、限制、价格状态和公开演示。

**验收**

- sitemap 中每个 URL 均为 `200`、自 canonical、可索引且有站内入口。
- sitemap 不含 `noindex`、登录、应用、后台、占位法律页或模板维护文档。
- `llms*.txt` 不再出现 fork、源码路径、环境配置和未公开功能说明。

### Critical — SEO-02：首页公开两张 404 图片和内部占位说明

**证据**

- 两个语言首页都会请求 `/comparison/original-video-placeholder.jpg` 和 `/comparison/rendered-clip-placeholder.jpg`，均返回 `404`。
- 页面可见 `Replace the two placeholder image paths...` / `将两个占位图片路径替换...`。
- 实现位于 `src/components/marketing/comparison-section.tsx:24`，文案位于英中字典的 `comparison` 区块。

**影响**

破坏页面质量、图片抓取和用户信任；搜索摘要或 AI 引用还可能直接复述内部说明。

**验收**

- 两张真实前后对比图或等价真实演示资源返回 `200`，具有准确 alt 和稳定尺寸。
- 英中页面和初始 HTML 中不再出现 placeholder、replace、图片路径等内部说明。
- Playwright 无 4xx 静态资源响应。

### High — SEO-03：可索引页面中存在静态或未配置主张

**证据**

- `/status` 和 `/zh/status` 固定显示“Updated just now/刚刚更新”“All systems operational/全部服务正常”；源码来自静态字典，不连接监控数据（`src/routes/{-$locale}/status.tsx:39`、`:59`）。
- `/sponsor` 显示“本实例未配置赞助功能”，但页面可索引。
- `/changelog` 主要展示 R2、D1、Stripe、环境校验等基础设施版本信息。

**影响**

这些页面既不是稳定的获客内容，也可能产生无法验证的状态主张。被索引后会削弱产品定位和可信度。

**建议**

逐页做产品决策，不要一律加入 sitemap：

| 页面 | 建议索引策略 |
| --- | --- |
| 首页、价格页 | 修正文案和素材后 index，并加入 sitemap |
| 状态页 | 接入真实状态源后 index；之前 noindex 或下线 |
| 更新日志 | 改为用户可理解的产品变化并从产品导航链接后再 index |
| 候补页 | 仍在使用时补 H1、站内入口后 index；否则 noindex |
| 赞助页 | 配置完成且属于品牌策略时再 index；当前 noindex |
| 条款/隐私 | 定稿前继续 noindex；定稿后根据法律/产品策略决定 |

### High — SEO-04：分享预览使用方形 logo，却声明大图卡片

**证据**

- 首页和价格页的 `og:image` 都是可访问的 `https://dve2.com/logo512.png`。
- 文件实际为 512x512；页面声明 `twitter:card=summary_large_image`。
- 没有 `og:image:width`、`og:image:height`、`og:image:alt`，图片也没有展示真实产品结果。

**建议与验收**

- 使用真实产品画面的 1200x630 栅格图，英中若文案不同则分别提供。
- 输出绝对 HTTPS URL、宽高、alt 和 Twitter 图片元数据。
- 对图片 URL 做未登录 `200` 检查，并在常用分享调试器中刷新缓存。

### High — SEO-05：可索引页面的发现路径不完整

**证据**

- 首页实际内部链接只有首页、渲染入口、条款和隐私；没有价格页链接。
- 价格页也未进入 sitemap。
- `SiteNav` 与 `Footer` 虽有价格相关字典键，但组件没有渲染对应链接。

**建议与验收**

- 将已确认可索引的价格页放入主导航或页脚，并从首页正文做语义相关链接。
- 每个重点公开页在 3 次点击内可达；抓取结果中不存在孤立营销页。

### Medium — SEO-06：首页 title 过于泛化

**证据**

- 英中首页 title 都只有 `Smart Clip`，虽然 description 已按语言区分。
- 价格页 title 独立且准确，canonical/hreflang 正常。

**建议**

在不扩大功能承诺的前提下，把可观察类别加入 title，例如围绕“MP4 字幕翻译与视频渲染”表达；最终用词需结合真实搜索需求验证。不要为了长度堆砌“最佳、领先、最快”等词。

### Medium — SEO-07：重点页面没有结构化数据

**证据**

首页和价格页的 JSON-LD 数量均为 0。

**建议**

- 主张与价格校准后添加 `WebSite` 和 `SoftwareApplication`。
- 产品演示发布到公开稳定 URL 后，可为真实视频添加 `VideoObject`。
- schema 必须与页面可见内容一致；不要添加评分、评论或并不存在的付费 Offer。

**验收**

- JSON 可解析，Schema.org Validator 无错误。
- Google Rich Results Test 的结果按实际支持类型记录；没有资格获得 rich result 不等于 schema 无效。

### Medium — SEO-08：部分规范化只靠 canonical，没有重定向

`/en` 和主机/协议变体会重定向到规范 URL，这一点正确；但 `/Pricing` 等大小写变体仍可返回 `200`，只用 lowercase canonical 合并。建议在边缘或路由层把非规范大小写永久重定向，减少重复抓取。改动前先确认所有合法大小写路径，避免误伤资源 URL。

### Medium — SEO-09：移动端基础通过，但触控目标偏小

**证据**

- 390x844 的首页、价格页、注册页均无横向滚动，文本未溢出。
- 导航主题和菜单按钮为 38x38px，默认 CTA 约 44px，注册输入约 42px，密码显隐按钮可点击区约 25px；均低于本审计采用的 48px 触控目标基线。

**建议**

扩大可点击区域而不必放大图标；改后在 390px 和 360px 视口验证导航、语言切换和主 CTA。

### Medium — SEO-10：可索引候补页没有 H1

`/waitlist` 与 `/zh/waitlist` 可索引，但页面标题使用 CardTitle 渲染为较低级标题，实测没有 H1。若保留索引，应补唯一、准确的 H1 和站内入口；若候补不是当前获客目标，则 noindex。

### Unverified — SEO-11：Core Web Vitals 没有可信基线

本次 PageSpeed Insights 因公共 API 配额返回 429；没有 GSC/CrUX 字段数据。不要把 Playwright 无溢出或页面能加载解释成 LCP、INP、CLS 已通过。

后续验收应优先使用 GSC/CrUX 的 75 分位字段数据，再用同一地区和设备配置的 Lighthouse 做实验室诊断。目标阈值按 skill 框架记录为 LCP <=2.5s、INP <=200ms、CLS <=0.10，但本次不填测量值。

## 已通过检查

- `/robots.txt` 与 `/sitemap.xml` 均为 `200`；sitemap XML 有效。
- robots 阻止 `/app`、`/admin`、`/api`；认证、应用和后台源码均有 `noindex`。
- 英中首页、英中价格页均有自 canonical、双向 `en/zh` hreflang 和 `x-default`。
- `/en` 以 `307` 规范到无前缀英文 URL，并保留 query。
- `http://dve2.com` 与 `https://www.dve2.com` 都以永久重定向归一到 `https://dve2.com`。
- 证书有效，生产响应包含 HSTS、CSP、`X-Content-Type-Options` 和 `X-Frame-Options: DENY`。
- 首页主要内容存在于初始 HTML，不依赖客户端 JS 才出现。

## 实施顺序

**立即，推广前：**

1. 修复首页 404 媒体和内部占位文案。
2. 确定唯一的可索引页面清单，清理 sitemap、docs 与 `llms*.txt`。
3. 对静态状态页、未配置赞助页、基础设施更新日志做 noindex/下线/改写决策。
4. 生成真实 OG 分享图并补完整元数据。

**短期：**

1. 加入价格页的站内链接与 sitemap 项。
2. 优化英中首页 title；为确认后的页面添加结构化数据。
3. 扩大移动导航触控区域。
4. 获取 GSC/CrUX 或稳定 Lighthouse 基线。

**发布后验收：**

- 使用无登录的新浏览器上下文复测英中页面、状态码、canonical、hreflang、分享图和移动布局。
- 抓取 sitemap 中每个 URL，确认 `200 + self canonical + indexable`。
- 在 Search Console 重新提交 sitemap，并记录覆盖状态；没有 GSC 数据时明确写“未验证”，不推断收录。

本文件是只读审计结果。本轮未修改 SEO 代码，也未部署。
