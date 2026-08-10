# Smart Clip 四周内容日历

状态：**可供内部审核；合成素材已通过本地溯源，法律、同意/删除技术整改和生产验收门禁通过前不得发布。**

所有内容只使用当前能核实的能力。发布时间以 `marketing/launch-plan.md` 的 T0 为准，具体日期由放行日顺延。

## Week 1：先把可验证工作流讲清楚

| 时点 | 平台 | 受众 | 可直接发布文案 | 素材 | CTA 与 UTM | 观察指标 |
| --- | --- | --- | --- | --- | --- | --- |
| T0+1 | 微信公众号 | 有 MP4、需要字幕样式或翻译的中文创作者 | 使用 `marketing/wechat-launch.md` 正文。摘要：`上传 MP4、选字幕语言和动效、跟踪渲染、下载成片。Smart Clip 受控 Beta 的真实工作流和限制，都放在这篇里。` | 20 秒演示、产品海报 | [中文首页](https://dve2.com/zh?utm_source=wechat&utm_medium=article&utm_campaign=smart_clip_launch&utm_content=workflow_guide_v1) | landing、CTA、注册、首次完成、首次下载原始数 |
| T0+1 | 朋友圈 | 已有关系的创作者/独立开发者 | `我在做 Smart Clip：上传 MP4，选择字幕语言和动效，能看到排队、渲染、完成或失败状态，完成后下载成片。目前是受控免费 Beta，MP4 最大 100 MB。这里有一段明确标注模拟数据的 20 秒合成界面演示。` | OG 图 + 20 秒合成演示 | [中文首页](https://dve2.com/zh?utm_source=wechat&utm_medium=social&utm_campaign=smart_clip_launch&utm_content=founder_note_v1) | 链接访问和有内容的反馈数 |
| T0+3 | 微信小范围群 | 已知会处理视频的早期试用者 | `想请你帮我完整走一次 Smart Clip 工作流：准备一个不超过 100 MB 的 MP4，选字幕语言和样式，提交后看状态，完成后下载。重点不是夸产品，而是告诉我你在哪一步停住。` | 无需额外素材 | [中文首页](https://dve2.com/zh?utm_source=wechat&utm_medium=community&utm_campaign=smart_clip_launch&utm_content=beta_task_v1) | 完整任务数、具体阻塞点数 |

## Week 2：让演示承担证据

| 时点 | 平台 | 受众 | 可直接发布文案 | 素材 | CTA 与 UTM | 观察指标 |
| --- | --- | --- | --- | --- | --- | --- |
| T0+8 | Bilibili | 搜索字幕动效、视频翻译、创作者工具的人 | 标题：`20 秒看完：MP4 字幕样式、翻译与渲染流程`。简介：`Smart Clip 当前支持 MP4 上传（最大 100 MB）、40 种字幕动画和 12 种语言选择。视频展示上传、选择、提交与下载界面；处理等待不等于固定耗时。当前为受控免费 Beta。` | 20 秒中文 VTT 演示 + 海报 | [中文首页](https://dve2.com/zh?utm_source=bilibili&utm_medium=video&utm_campaign=smart_clip_launch&utm_content=demo_20s_v1) | 视频完成观看、落地访问、首次完成 |
| T0+10 | 微信公众号/朋友圈 | 看过首发但未开始的人 | `如果你只想先看界面：这 20 秒展示了从 MP4、字幕语言和动效选择，到渲染状态与成片下载。没有速度或准确率承诺，先看它是否适合你的素材流程。` | 20 秒演示 | [中文首页](https://dve2.com/zh?utm_source=wechat&utm_medium=social&utm_campaign=smart_clip_launch&utm_content=demo_repost_v1) | CTA / landing，不做跨周“提升”结论 |
| T0+11 | YouTube | 英文创作者 | Title: `Smart Clip: MP4 subtitle styling and translation workflow`. Description: `A 20-second synthetic interface demo with simulated data: upload an MP4 (up to 100 MB), choose from the available subtitle styles and language options, follow render status, and download the completed MP4. Actual wait is omitted. Controlled free beta; Pro is not for sale.` | 20 秒英文 VTT 合成演示 + OG 图 | [English homepage](https://dve2.com/?utm_source=youtube&utm_medium=video&utm_campaign=smart_clip_launch&utm_content=demo_20s_en_v1) | video views, landing, sign-up, first completion |

YouTube 仅在英文法律文本和字幕校对通过后发布；否则该项顺延，不用中文材料替代。

## Week 3：用问题帖获取真实反馈

| 时点 | 平台 | 受众 | 可直接发布文案 | 素材 | CTA 与 UTM | 观察指标 |
| --- | --- | --- | --- | --- | --- | --- |
| T0+15 | V2EX | 独立开发者、内容工具用户 | 标题：`做了一个能看清队列状态的 MP4 字幕渲染流程，想听听真正的卡点`。正文开头：`我先把边界说清：目前只接 MP4，单文件最大 100 MB；界面提供 40 种字幕动画和 12 种语言选择。任务有排队、渲染、完成、失败和重试，不承诺固定处理时长。想请实际会处理视频的人走一次，然后告诉我：选择样式、等待状态、失败恢复、下载里，哪一步最不清楚？` | 20 秒合成演示 + 合成队列静帧 | [中文首页](https://dve2.com/zh?utm_source=v2ex&utm_medium=community&utm_campaign=smart_clip_launch&utm_content=build_feedback_v1) | 有效反馈主题、首次完成、错误数 |
| T0+17 | 微信公众号 | 已试用或观望的中文用户 | 文案只能根据 Week 1-2 真实反馈填写。格式：`这周我们收到的三个具体卡点`，每项附“原问题、是否复现、已处理/未处理”。没有三条真实反馈时改为一条 FAQ，不凑数。 | 经脱敏的界面截图；不截用户输入 | [中文首页](https://dve2.com/zh?utm_source=wechat&utm_medium=article&utm_campaign=smart_clip_launch&utm_content=feedback_notes_v1) | 返回访问、问题是否减少 |
| T0+19 | Bilibili 动态 | 看过视频但未访问站点的人 | `Smart Clip 的处理过程不是黑盒成功提示：任务会显示排队、渲染、完成或失败；失败可重试。这里是完整工作流入口，当前受控 Beta。` | 状态列表截图 | [中文首页](https://dve2.com/zh?utm_source=bilibili&utm_medium=social&utm_campaign=smart_clip_launch&utm_content=status_states_v1) | landing、render_start、render_complete |

## Week 4：复盘后再扩大

| 时点 | 平台 | 受众 | 可直接发布文案 | 素材 | CTA 与 UTM | 观察指标 |
| --- | --- | --- | --- | --- | --- | --- |
| T0+22 | Product Hunt 预备页 | 英文产品发现用户 | Tagline: `Style, translate, and render subtitles for an MP4.` Short description: `Upload an MP4, choose a subtitle animation and language option, follow the render queue, retry failures, and download the completed video. Smart Clip is in controlled free beta; paid plans are not available.` | OG 图、英文 20 秒演示 | [English homepage](https://dve2.com/?utm_source=producthunt&utm_medium=launch&utm_campaign=smart_clip_launch&utm_content=listing_v1) | 仅审核预览；确认支持能力后才正式发布 |
| T0+24 | 公众号/朋友圈 | 前三周关注者 | `Smart Clip 第一轮不报“增长了多少”。我们先公开原始数：多少人到达、多少人点击、注册、完成首次渲染和下载；样本不足就继续观察。下一步只改一个主要变量。` 数字必须从复盘表现场填写，不能预填。 | 匿名漏斗表；小样本只列数量 | [中文首页](https://dve2.com/zh?utm_source=wechat&utm_medium=social&utm_campaign=smart_clip_launch&utm_content=review_note_v1) | 数据完整性、反馈质量 |
| T0+26 | YouTube/Bilibili 社区贴 | 已看过演示的人 | `下一条演示该回答哪个问题？A 字幕样式选择，B 翻译语言，C 任务失败与重试，D 成片下载。` 只公布真实投票结果，并把最高项做成下一支产品说明。 | 原生投票 | 不放链接，避免每条内容都硬导流 | 有效票数与下一轮选题 |

## 发布检查清单

每条内容发布前逐项确认：

- 链接在无登录浏览器中返回 200，CTA 最终到注册并保留 `next=/app/render`。
- UTM 仅含约定的 ASCII 标识，没有邮箱、姓名、邀请码或用户 ID。
- 素材不含真实账号、私有媒体、密钥、后台侧栏或未授权内容。
- 文案没有新增速度、准确率、客户数、效果倍数、9:16、团队协作或 Pro 价格主张。
- 评论区有人报告故障时先暂停追加分发，完成复现和状态说明后再继续。
