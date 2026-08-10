# Smart Clip 推广基线

审计时间：2026-08-09 23:49-23:57（Asia/Shanghai）

生产站：`https://dve2.com`、`https://dve2.com/zh`

范围：首页、价格页、注册/登录、首次渲染入口、公开索引面、GA4 和现有演示素材。

> 实施状态更新（2026-08-10）：本文保留的是改动前生产基线，下文的“当前”均指审计时点。CTA、页面证据、SEO 与 GA4 漏斗已在本地实现并验证；最新状态和仍未解除的发布门禁见 `marketing/implementation-report.md` 与 `marketing/launch-plan.md`。

## 当前结论

**暂不应开始外部导流。** 当前主 CTA 的正常浏览器点击路径会落到 404，注册又要求用户同意尚未定稿的占位条款；首页还公开显示两张 404 占位图和内部替换说明。先修复这些发布阻断项、补齐转化事件并验收，再进入视频分发和渠道发布阶段。

本基线只记录生产页面、源码和已验收素材能证明的事实。没有 GA4 属性、Search Console、客户访谈或付费数据访问权，因此不推断访问量、注册率、付费率或用户画像规模。

## 目标用户与任务

目标用户是根据当前工作流推断的待验证假设，不是已完成的市场调研结论。

| 用户假设 | 需要完成的任务 | 当前可验证能力 |
| --- | --- | --- |
| 手里已有 MP4 的个人创作者 | 为视频生成字幕样式、翻译并得到可下载成片 | 填写项目名、上传 MP4、选择字幕语言和动画、提交、查看状态、失败重试、完成后下载 |
| 需要重复处理视频的小型内容团队 | 在一个任务列表里跟踪多次处理结果 | 任务列表和 `queued/running/completed/failed` 状态真实存在；团队共享、审核协作尚不能作为当前能力宣传 |
| 中英文内容发布者 | 预览双语字幕动效并选择翻译目标 | 源码定义 12 个语言选项（含原始语言）和 40 个字幕动画；生产首页能加载中英文预览素材 |

当前上传约束是 **MP4 且不超过 100 MB**，见 `src/features/render-jobs/render-job.shared.ts:1`、`:100`。这与“长视频”的宽泛表达以及首页示例的 `184 MB` 文件不一致，在主张校准前不能把“任意长视频”作为推广承诺。

## 当前价值主张与 CTA

| 页面 | 一句话价值主张 | 主 CTA | 实测结果 |
| --- | --- | --- | --- |
| `/` | `Turn one source into a finished clip.` | `Open render workspace` | 从首页点击后进入 `/_serverFn/login` 的 404 |
| `/zh` | `一条源视频，直接渲染成片。` | `打开渲染工作台` | 从首页点击后进入 `/_serverFn/login` 的 404 |
| `/pricing` | 受控免费 Beta，Pro 仍在规划 | `Start creating` | 链接到 `/register`，可到达注册页 |
| `/zh/pricing` | 受控免费 Beta，Pro 仍在规划 | `开始创作` | 链接到 `/zh/register`，可到达注册页 |

直接请求 `/app/render` 会以 `307` 跳到 `/login`，中文路径会跳到 `/zh/login`；但从已加载首页进行 TanStack Router 客户端导航时，英中页面在桌面和移动端均稳定复现 `/_serverFn/login` 404。较早记录到的中文登录页是最终客户端重定向完成前的中间状态。相关代码路径是：

- `src/components/marketing/hero.tsx:72`：首页主 CTA。
- `src/routes/{-$locale}/app/render.tsx:27`：保护渲染页的 loader。
- `src/features/auth/middleware.ts:17`：`requireUser` 在 server function 中抛出登录重定向。

## 生产页面基线

| 页面/资源 | 状态 | 证据与风险 |
| --- | --- | --- |
| 英文、中文首页 | `200`，SSR | canonical 与双向 hreflang 正确；桌面 1440px、移动 390px 均无横向溢出 |
| 首页比较图 | 两个 `404` | `/comparison/original-video-placeholder.jpg` 与 `/comparison/rendered-clip-placeholder.jpg` 均不存在；页面可见“替换图片槽位”内部说明 |
| 注册页 | `200`、`noindex` | 姓名、邮箱、至少 8 位密码、条款勾选；390px 下表单可用 |
| 条款/隐私 | `200`、`noindex` | 页面明确写着“占位内容”“待业务与法律确认”，但注册必须同意它们 |
| 价格页 | `200`、可索引 | canonical/hreflang 正确；首页、导航、页脚均不链接价格页，sitemap 也未收录 |
| 渲染页 | 受认证保护、`noindex` | 直接访问正确跳登录；首页客户端点击路径损坏 |
| 状态页 | `200`、可索引 | “全部服务正常/刚刚更新”由静态字典输出，不是监控数据，不能当作实时状态证据 |
| 赞助页 | `200`、可索引 | 生产页显示“本实例未配置赞助功能” |
| 文档与 `llms*.txt` | `200`、可索引 | 公开暴露大量“fork 后怎么改”、环境变量、部署和模板实现说明，与创作者 SaaS 的获客内容不一致 |

## GA4 基线

Measurement ID：`G-QEKHDPCR27`。

根布局固定加载 `gtag.js` 并执行 `gtag('config', ...)`（`src/routes/__root.tsx:52`）。交接记录说明 `page_view` 已验证；本次 Chromium 实测也看到首页 `page_view` 请求获得 `204`。这只证明页面访问事件存在，不代表所有 SPA 路由变化都已覆盖，也不代表任何下游转化完成。

源码检索只发现 GA4 初始化，没有以下自定义事件实现：

| 漏斗事实 | 事件 | 当前状态 |
| --- | --- | --- |
| 首页主 CTA 点击 | `cta_click` | 缺失；且 CTA 当前进入 404 |
| 开始注册 | `sign_up_start` | 缺失 |
| 服务端确认注册成功 | `sign_up` | 缺失 |
| 服务端成功创建渲染任务 | `render_start` | 缺失 |
| 任务首次变为完成 | `render_complete` | 缺失 |
| 请求下载成片 | `result_download` | 缺失 |
| 支付 webhook 确认购买 | `purchase` | 缺失；公开 Pro 购买入口当前处于 dormant 状态 |

Cloudflare Web Analytics 是可选的独立页面分析集成（`src/features/analytics/analytics.ts:10`），不能替代上述 GA4 漏斗事实。

源码也没有显式读取或持久化 `utm_*` 参数。GA4 可以记录落地会话的活动参数，但目前没有经验证的会话/账户/任务归因关联，因此还不能可靠计算渠道级注册、首次渲染或下载转化率。

本次只读检查时，生产注册 loader 返回 `providers=[]`、`turnstileSiteKey=null`、`emailVerificationRequired=false`，即页面没有社交登录、验证码或邮件验证步骤。没有向生产环境提交注册表单，因此“注册成功”仍未验证。

## 可公开使用的素材与证据

| 素材 | 可证明内容 | 使用限制 |
| --- | --- | --- |
| `video/product-demo/smart-clip-product-demo-16x9.mp4` | 20 秒、1920x1080、静音；上传、预览字幕、提交、下载的界面节奏 | 由已有 UI 截图合成；配套 VTT 中英混排，发布前应校对渠道文案 |
| `video/product-demo/smart-clip-full-flow-demo-16x9.mp4` | 77.233 秒、1920x1080；合成账号驱动真实上传、样式选择、渲染完成和下载 | 处理等待被剪掉且已明确标注；当前只有 16:9，没有 9:16、封面和音轨版本 |
| `video/product-demo/*.vtt` | 两个版本的文字替代与等待说明 | 发布时必须与最终剪辑逐帧复核 |
| `.github/assets/render-form-en.png`、`render-en.png` | 英文渲染表单和任务结果截图 | 使用前再次确认无真实用户数据；不是当前首页缺失比较图的自动替代品 |
| `public/subtitle-composition-preview/` | 40 个英文和 40 个中文 WebM 字幕预览 | 可以证明样式预览存在，不能证明准确率、节省时间或发布效果 |
| `public/logo512.png` | 可访问的 512x512 品牌图 | 当前被用作 `summary_large_image`，但不是展示实际产品的 1.91:1 分享图 |

两支 MP4 目前只在仓库中，常见公开视频路径返回 404，不能直接作为外部落地页或社媒 URL。`.github/assets` 的截图包含合成管理账号/后台侧栏，发布前仍需做隐私与画面范围复核。仓库也没有记录底层样例媒体的外部分发授权，渠道发布前必须确认来源许可。

> 后续处理（2026-08-10）：该基线中的公开视频与素材权利问题已通过程序化合成演示解决。当前公共 MP4、封面和静帧不读取 `.github/assets`、浏览器截图或任何源视频；详见 `video/product-demo/review-packet.md`。浏览器录制版仍只用于本地 QA。

## 主张使用边界

可以直接使用：

- 支持不超过 100 MB 的 MP4 上传。
- 可选择字幕动画和字幕语言。
- 可查看排队、处理中、完成和失败状态。
- 失败任务可重试，完成任务可下载 MP4。
- 产品处于受控免费 Beta，公开 Pro 购买尚未开放。

必须先校准或补证据：

- “长视频”“clip batch/片段队列”与 100 MB 上限的实际适用范围。
- 首页 `184 MB` 示例与实际上传限制的冲突。
- 免费价格页写有“AI 精选片段、9:16、私有项目存储、社区支持”，首页却把相关创作者能力标成 Pro 即将上线。
- 当前渲染提交使用自动画幅，现有可见工作流没有独立证明固定输出 9:16；不能把 9:16 当成已验收承诺。
- “刚刚更新、全部服务正常”是否来自真实监控。
- 任何 Pro 价格、团队协作、优先支持和项目额度。

不得添加：客户评价、客户数量、处理时长、节省时间、准确率、转化提升、市场领先、安全保证等没有已核验证据的主张。

## 推广前发布门槛

1. 修复首页、导航和页脚的客户端 CTA 404，并覆盖英中、桌面和移动端回归测试。
2. 由业务/法律负责人完成条款和隐私政策，或在完成前关闭公开注册和推广。
3. 用真实、可访问的前后对比或演示替换两个 404 占位图，删除全部内部替换说明。
4. 统一首页、注册、价格页和 Pro 区域的当前能力；修正 `184 MB` 与 100 MB 限制冲突。
5. 实现并验证 GA4 漏斗事件，服务端事实使用幂等键且不含个人信息。
6. 确定公开索引清单，清理模板文档、静态状态页和未配置赞助页，补真实分享图。
7. 以上项目完成后重新记录原始访问量、CTA 点击、注册、首次渲染完成和下载数量；样本不足时不报告“提升/下降”。

## 证据来源

- 生产页面与响应：`https://dve2.com`、`/zh`、`/pricing`、`/register`、`/app/render`、`/robots.txt`、`/sitemap.xml`、`/docs`、`/llms.txt`。
- 首页与 SEO：`src/routes/{-$locale}/index.tsx`、`src/components/marketing/`、`src/features/seo/`。
- 注册与认证：`src/routes/{-$locale}/(auth)/register.tsx`、`src/features/auth/middleware.ts`。
- 渲染事实：`src/routes/{-$locale}/app/render.tsx`、`src/features/render-jobs/`、`src/routes/api/render-outputs/$.ts`。
- 支付状态：`src/features/billing/plans.ts:1`、`src/features/billing/actions.ts:29`、Stripe webhook 实现。
- 素材说明：`video/product-demo/README.md` 及同目录视频/VTT。
