# Smart Clip 推广技能交接

本文档用于把 `https://dve2.com` 的页面推广工作交接给后续 Codex/Claude
会话。执行者应先阅读本文件和仓库根目录的 `AGENTS.md`，再按阶段调用对应
skill。不要一次性调用所有 skill；每个阶段完成并验收后再进入下一阶段。

## 2026-08-10 执行更新

- 首页、价格页、注册回跳、首次渲染失败语义、SEO 公开索引面和推广素材已在本地完成修改，详见 `marketing/implementation-report.md`。
- GA4 已实现净化后的 SPA `page_view`、首次触达 UTM，以及 `cta_click`、`sign_up_start`、`sign_up`、`render_start`、`render_complete`、`result_download`。`purchase` 因 Pro 未开放购买而保持不触发。
- 完整检查为 PASS：lint 0 errors（1 个既有 warning）、48 个测试文件共 294 项测试、类型检查、构建和 `git diff --check` 均通过。
- 已按负责人直接发布指令部署生产，Worker 版本为 `a17b3e46-8469-40a1-b1b7-27faa4928c38`。英中首页、注册页、审核稿法律页、SEO 文件及合成演示资产已完成无登录线上验收；尚未开始外部渠道推广。法律审核、同意/删除技术整改、GA4 后台配置和完整注册/渲染链路仍按 `marketing/launch-plan.md` 保持阻塞。

以下“当前状态”与阶段说明是 2026-08-09 的执行前基线，保留用于审计追溯；继续执行时以实施报告和发布计划的门禁为准。

## 执行前状态（历史）

- 产品：Smart Clip，生产地址为 `https://dve2.com`，中文入口为
  `https://dve2.com/zh`。
- GA4 已接入，Measurement ID 为 `G-QEKHDPCR27`。
- 当前已验证 `page_view` 能上报；注册、渲染、下载和付费等转化事件尚需单独
  设计与实现，不能把页面访问量当成注册或付费转化。
- 产品演示视频位于 `video/product-demo/`，包含 20 秒产品演示和浏览器录制的
  完整流程版本。使用前阅读 `video/product-demo/README.md`。
- 首页主要实现位于 `src/routes/{-$locale}/index.tsx` 和
  `src/components/marketing/`；SEO 实现位于 `src/features/seo/`。

## Skill 清单

### 需要安装

以下第三方 skill 是通过 `npx skills find` 检索到的，当前未安装。安装前应
查看其来源和内容；安装只需要执行一次。

| 阶段 | Skill | 用途 | 安装命令 |
| --- | --- | --- | --- |
| SEO | [seo-technical-audit](https://skills.sh/schwepps/skills/seo-technical-audit) | 检查抓取、索引、元数据、canonical、hreflang、站点地图和结构化数据 | `npx skills add schwepps/skills@seo-technical-audit -g -y` |
| 转化 | [conversion-optimization](https://skills.sh/kostja94/marketing-skills/conversion-optimization) | 优化价值主张、页面信息层级、信任信号、CTA 和注册漏斗 | `npx skills add kostja94/marketing-skills@conversion-optimization -g -y` |
| 发布 | [launch-marketing](https://skills.sh/refoundai/lenny-skills/launch-marketing) | 制定目标用户、渠道、发布节奏和复盘方案 | `npx skills add refoundai/lenny-skills@launch-marketing -g -y` |
| 社媒 | [social-media](https://skills.sh/langchain-ai/deepagents/social-media) | 将产品信息改写为不同平台的内容和发布日历 | `npx skills add langchain-ai/deepagents@social-media -g -y` |

检查和更新 skill：

```bash
npx skills check
npx skills update
```

### 当前已经可用

| Skill | 本机入口 | 用途 |
| --- | --- | --- |
| `playwright-recording` | `/Users/yangxg/.codex/skills/playwright-recording/SKILL.md` | 录制真实浏览器产品流程 |
| `saas-product-demo-production` | `/Users/yangxg/.codex/skills/saas-product-demo-production/SKILL.md` | 规划、制作和验收 SaaS 宣传视频 |
| `wechat-article-writer` | `/Users/yangxg/.agents/skills/wechat-article-writer/SKILL.md` | 搜集资料并制作公众号/中文内容 |

执行者调用任何 skill 前，必须完整阅读对应 `SKILL.md`，并遵守其中的输入、
产物和验证要求。

## 推荐执行顺序

### 1. 建立可验证的基线

先记录生产首页、中文首页、注册页、渲染页和定价页的实际状态。不要编造性能、
客户数量、节省时间、准确率或市场领先等主张。可以使用的证据仅限真实页面、
真实工作流、仓库中已有功能和已验证的统计数据。

建议产物：`marketing/baseline.md`，至少包含：

- 目标用户和他们需要完成的任务。
- 当前首页的一句话价值主张与主 CTA。
- 当前 GA4 能看到的事件和仍缺失的事件。
- 可公开使用的截图、演示视频和功能证据。

### 2. 调用 `seo-technical-audit`

推荐提示词：

```text
使用 seo-technical-audit 审计 https://dve2.com 及中文页面
https://dve2.com/zh。结合 FlareStarter 源码检查 robots.txt、sitemap.xml、
canonical、hreflang、title、description、Open Graph、结构化数据、可抓取性、
状态码和移动端体验。按严重程度输出问题、证据、修改位置和验收方式，保存到
marketing/seo-audit.md。先只审计，不修改和发布。
```

审计确认后再修改代码。最低验收要求：

- `/robots.txt` 和 `/sitemap.xml` 可访问且只暴露应收录的公开页面。
- 英文/中文页面具有正确的 canonical 和双向 hreflang。
- 每个重点落地页有独立、准确的 title 和 description。
- 分享预览有真实可访问的 Open Graph 图片。
- 登录、账户、管理和其他私有页面保持 `noindex`。

### 3. 调用 `conversion-optimization`

推荐提示词：

```text
使用 conversion-optimization 审计 Smart Clip 首页、注册页和首次渲染流程。
目标是提升“访问首页 -> 开始使用 -> 注册成功 -> 首次渲染完成”的转化率。
基于实际页面和功能提出修改，不添加无法证明的宣传主张。将假设、优先级、页面
改动、实验指标和停止条件保存到 marketing/conversion-audit.md。先只审计，
等待确认后再改代码。
```

优先检查：首屏是否立刻说明产品对象和结果、CTA 是否明确、是否能看到真实成品、
注册前后的承诺是否一致、失败状态是否可恢复、移动端是否能顺利完成主要流程。

### 4. 补齐 GA4 转化漏斗

在开始导流前补齐事件，否则无法判断推广是否有效。建议事件：

| 漏斗步骤 | GA4 事件 | 触发条件 |
| --- | --- | --- |
| 首页主要 CTA | `cta_click` | 用户点击首页主要“开始使用”按钮 |
| 开始注册 | `sign_up_start` | 注册表单首次有效交互或提交 |
| 注册成功 | `sign_up` | 服务端确认账户创建成功 |
| 开始渲染 | `render_start` | 服务端成功创建渲染任务 |
| 渲染完成 | `render_complete` | 任务首次进入完成状态 |
| 下载结果 | `result_download` | 用户请求下载完成的视频 |
| 购买成功 | `purchase` | 支付 webhook 确认成功，注意避免重复上报 |

事件不得包含邮箱、姓名、原始视频名称或其他个人信息。注册成功、渲染成功和购买
成功应优先以服务端事实为准；必须设计幂等键，避免刷新页面造成重复计数。实施后
在 GA4 DebugView/实时报告和浏览器网络面板中共同验证。

### 5. 调用视频技能

先用 `playwright-recording` 录制真实流程，再用
`saas-product-demo-production` 做成渠道版本。已有素材可从
`video/product-demo/` 继续迭代，不要重复录制已满足要求的流程。

推荐提示词：

```text
使用 playwright-recording 和 saas-product-demo-production，为 Smart Clip 制作
真实、隐私安全的产品演示。复用 video/product-demo/ 中已验收素材，展示上传、
选择字幕样式、提交渲染、完成和下载。所有文案只描述画面中可验证的功能。输出
16:9 主版本、9:16 短视频版本、字幕文件和封面，并记录来源与验收结果。
```

最低验收要求：不出现真实用户数据或密钥；字幕可读；处理等待如被剪辑必须明确
标注；移动端版本无裁切；视频、字幕和 CTA 中的产品名称与网址一致。

### 6. 调用发布和内容 skill

先使用 `launch-marketing` 形成发布计划，再用 `social-media` 拆成平台内容；面向
中文用户时使用 `wechat-article-writer` 制作公众号长文。不要在没有目标受众、
落地页和转化事件的情况下直接大量发帖。

推荐提示词：

```text
使用 launch-marketing 为 Smart Clip 制定四周发布计划。以真实产品能力和已完成
的演示视频为素材，定义目标用户、核心问题、渠道、每周目标、内容清单、UTM 命名、
预算上限和复盘指标，保存到 marketing/launch-plan.md。
```

```text
使用 social-media 将 marketing/launch-plan.md 转换为按平台区分的四周内容日历，
每条内容包含目标受众、文案、素材、CTA、UTM 链接和衡量指标，保存到
marketing/content-calendar.md。不要虚构客户评价、使用量或效果数字。
```

```text
使用 wechat-article-writer，根据 Smart Clip 的真实工作流和已验收演示素材撰写
一篇中文公众号文章，说明适用人群、使用过程和限制。生成多个标题，但不使用夸大
收益或伪造数据，文章草稿保存到 marketing/wechat-launch.md。
```

## 渠道与链接约定

所有外部推广链接使用统一 UTM 参数：

```text
https://dve2.com/zh?utm_source=<platform>&utm_medium=<format>&utm_campaign=smart_clip_launch&utm_content=<asset>
```

- `utm_source`：例如 `wechat`、`producthunt`、`youtube`、`bilibili`。
- `utm_medium`：例如 `article`、`social`、`video`、`community`。
- `utm_content`：稳定的素材标识，例如 `demo_20s_v1`。
- 不使用随机中文或日期作为参数值；统一小写英文和下划线，便于 GA4 汇总。

每周至少比较渠道访问量、主要 CTA 点击率、注册成功率、首次渲染完成率和付费率。
样本量不足时只报告原始数量，不下“提升/下降”的结论。

## 修改与发布门槛

页面或统计代码有改动时，至少运行：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

发布使用仓库脚本：

```bash
pnpm deploy:prod
```

发布后必须用无登录的新浏览器上下文检查英文和中文首页、注册、首次使用路径、
移动端布局、GA4 网络请求、canonical/hreflang 和分享图片。记录 Cloudflare Worker
版本 ID，并将结果写入对应推广产物，不以“部署命令成功”代替线上验收。

## 一次性交接提示词

后续会话可直接使用：

```text
阅读 AGENTS.md 和 PROMOTION_HANDOFF.md，按文档顺序推进 Smart Clip 页面推广。
先确认所需 skill 是否已安装并完整读取相应 SKILL.md。第一轮只完成基线、SEO
审计和转化审计，产物写入 marketing/，不要修改代码或发布。所有结论必须引用
生产页面或仓库实现作为证据，并明确 GA4 当前已实现和未实现的事件。
```
