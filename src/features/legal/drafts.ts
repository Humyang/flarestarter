export type LegalDraftKind = 'terms' | 'privacy'

export type LegalDraftSection = {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
}

export type LegalDraft = {
  statusLabel: string
  effectiveDateLabel: string
  notice: string
  intro: string
  sections: LegalDraftSection[]
  reviewItems: string[]
}

/**
 * Review drafts are deliberately separate from the translation dictionary. They
 * are long-form legal copy, and keeping them in one typed structure makes the
 * English and Chinese pages easy to compare before an owner approves them.
 */
export const LEGAL_DRAFTS: Record<'en' | 'zh', Record<LegalDraftKind, LegalDraft>> = {
  en: {
    terms: {
      statusLabel: 'Draft for review · not effective',
      effectiveDateLabel: 'Effective date: pending approval',
      notice: 'This is a review draft, not a final contract or legal advice. It must be completed and approved by the service owner and qualified counsel before it is used as the terms that govern registration.',
      intro: 'These Terms of Service (the "Terms") are intended to describe the proposed rules for using Smart Clip, a web workspace for rendering subtitled videos. Replace every [[bracketed field]] and obtain approval before publication.',
      sections: [
        {
          heading: '1. Service and scope',
          paragraphs: [
            'Smart Clip is intended to let an account holder upload an MP4 source, choose a subtitle animation and language option, submit a render, follow queued, processing, completed, or failed states, retry a failed job, and download a completed MP4 result.',
            'The current controlled beta accepts MP4 files up to 100 MB per render. Features, limits, supported languages, animation styles, infrastructure, and availability may change. The service does not promise a fixed processing time, a particular subtitle accuracy, a particular output aspect ratio, or uninterrupted availability.',
          ],
        },
        {
          heading: '2. Draft status, eligibility, and acceptance',
          paragraphs: [
            'This draft becomes binding only after yangxionggui publishes an approved version with an effective date and the registration flow is updated to refer to that version. Before publication, the owner must implement a server-side record of the accepted Terms version, time, and acceptance path for every registration method, including OAuth: [[approved acceptance-record design]]. By using the service after that date, you agree to the published Terms and the Privacy Policy.',
            'You must be legally able to enter a contract in your location and be at least 18 years old. The owner has declared 18 as the minimum age, subject to final review of the target jurisdictions and an approved process for suspected underage accounts: [[approved age-verification and underage-account process]]. The service is not directed to children.',
          ],
        },
        {
          heading: '3. Accounts and account security',
          paragraphs: [
            'You must provide information that is accurate enough to operate the account and keep it current. Do not share credentials, impersonate another person, or create accounts to evade a restriction. You are responsible for activity performed through your account and for notifying jessebutchman@gmail.com if you believe it has been compromised.',
            'The service may offer email/password authentication and, when configured, third-party sign-in. A provider may be unavailable in a particular environment. Verification, password reset, and rate limiting may apply.',
          ],
        },
        {
          heading: '4. Your files and permitted use',
          paragraphs: [
            'You retain your rights in the files, text, and other material that you submit ("User Content"). You represent that you have the rights, permissions, and notices needed for the service to host, transmit, analyze, transform, and return that User Content for your requested render.',
            'You must not upload unlawful material, material that infringes another person\'s rights, malware, secrets, or content that the service is not permitted to process. Do not use the service to violate export controls, sanctions, privacy laws, or a third party\'s contract.',
          ],
        },
        {
          heading: '5. Limited license to operate the service',
          paragraphs: [
            'You grant the service owner and its processors a limited, non-exclusive license to store, copy, transmit, technically inspect, render, subtitle, translate, and return User Content only as needed to provide, secure, and troubleshoot the requested service. Service-improvement and model-training use are not permitted under the owner declaration. Human review is limited to what is necessary for fault diagnosis and must be access-controlled, logged, and approved before publication: [[approved improvement, training, and review policy]].',
            'The owner may remove or restrict content that appears to violate these Terms or creates a security, legal, or operational risk. No ownership of User Content is transferred by this license.',
          ],
        },
        {
          heading: '6. Beta availability and feedback',
          paragraphs: [
            'The service is currently described as a controlled free beta. Beta software may contain defects, change without notice, or be unavailable. You should keep your own copy of source files and results. No paid Pro plan is currently offered, and no future price or feature set is promised by this draft.',
            'If you submit feedback, you allow the owner to use it to operate and improve the service without identifying you publicly unless you separately agree. Do not include confidential information in feedback.',
          ],
        },
        {
          heading: '7. Suspension and termination',
          paragraphs: [
            'The owner may suspend or terminate access when reasonably necessary for security, abuse prevention, legal compliance, non-payment (if paid services later launch), or a material breach. The owner should define notice and appeal procedures before publication: [[suspension notice and appeal process]].',
            'You may stop using the service and request account deletion through the account controls or jessebutchman@gmail.com. Deletion of account records, source files, output files, backups, and legally required records follows the approved retention schedule in the Privacy Policy.',
          ],
        },
        {
          heading: '8. Intellectual property and service feedback',
          paragraphs: [
            'The service, software, interface, branding, and documentation, excluding User Content, belong to yangxionggui or its licensors. These Terms do not grant a license to copy or resell them except as expressly allowed by the service.',
            'You may send suggestions or bug reports. Any rights granted for that feedback must be confirmed by the owner and counsel before publication: [[feedback license language]].',
          ],
        },
        {
          heading: '9. Third-party services',
          paragraphs: [
            'The service may rely on infrastructure and processors such as Cloudflare Workers, D1, R2, KV, an MP4 rendering provider or local agent, email delivery, bot protection, analytics, OAuth providers, or payment services when enabled. Their own terms and privacy notices may also apply. The owner must publish the final processor list and transfer details: [[approved subprocessors and links]].',
            'If paid plans, Stripe checkout, or sponsorships are enabled, the final terms must clearly state whether payment is one-time or recurring, currency and tax handling, cancellation, refunds, chargebacks, public sponsor acknowledgements, and consumer-law rights. The current controlled beta does not make this draft a payment agreement: [[approved payment and sponsorship terms]].',
          ],
        },
        {
          heading: '10. Disclaimers and liability',
          paragraphs: [
            'To the extent permitted by applicable law, the beta service is provided on an as-available basis and without warranties that it will be uninterrupted, error-free, complete, or suitable for a particular purpose. Do not rely on this draft for the final warranty, consumer-rights, liability, indemnity, or dispute language.',
            'The owner and counsel must choose the applicable limitations, exclusions, consumer-law carve-outs, indemnities, dispute process, and maximum liability: [[approved liability and dispute terms]].',
          ],
        },
        {
          heading: '11. Changes and contact',
          paragraphs: [
            'The owner may update the published Terms with reasonable notice. The final version must identify the operator, effective date, update method, governing law, venue or alternative dispute process, and a working contact address.',
            'Operator: yangxionggui · Contact: jessebutchman@gmail.com · Postal address, governing law, and venue: [[to be confirmed]].',
          ],
        },
      ],
      reviewItems: [
        'Insert the legal operator name, address, contact email, governing law, venue, and effective date.',
        'Confirm age/child-safety, User Content license scope, service-improvement/training/human-review policy, and feedback license.',
        'Confirm suspension, deletion, warranty, liability, indemnity, dispute, consumer-rights, and export-control language with counsel.',
        'Implement versioned server-side terms acceptance for password and OAuth registration, then list enabled subprocessors and their current terms/privacy notices.',
        'Approve payment, sponsorship, recurring billing, cancellation, refund, and public-acknowledgement language before enabling those flows.',
      ],
    },
    privacy: {
      statusLabel: 'Draft for review · not effective',
      effectiveDateLabel: 'Effective date: pending approval',
      notice: 'This is a review draft, not a final privacy notice or legal advice. The operator, legal bases, retention periods, transfer mechanisms, and contact route must be confirmed before collection and public registration are promoted.',
      intro: 'This proposed Privacy Policy explains how yangxionggui would process personal data when you visit Smart Clip, create an account, submit a render, contact support, or join a waitlist. Replace every [[bracketed field]] and obtain a jurisdiction-specific review before publication.',
      sections: [
        {
          heading: '1. Who is responsible for your data',
          paragraphs: [
            'Data controller/operator: yangxionggui. Contact: jessebutchman@gmail.com. Postal address and data protection officer or representative, if required: [[to be confirmed]].',
            'The final notice must identify the applicable regions, legal bases, complaint authority, and any representative required for the people the service targets. Those facts are not available in the repository and are intentionally not guessed here.',
          ],
        },
        {
          heading: '2. Data we may collect',
          bullets: [
            'Account and authentication data: name, email address, password credential material managed by the authentication provider, verification state, session identifiers, IP address, user-agent, and, when enabled, OAuth account identifiers, profile image data, provider tokens, and scopes. A configured avatar route may make an uploaded or provider-supplied avatar publicly retrievable; this must be confirmed and disclosed before publication.',
            'Security and request data: session IP address, user-agent, rate-limit records, authentication and verification events, and operational logs. Exact fields and retention must be confirmed against Cloudflare and Better Auth production settings.',
            'Media and render data: uploaded MP4 bytes, original file name, content type, file size, project title, subtitle language and animation selection, render task identifiers, queue/status/phase/error timestamps, generated MP4 output, and temporary source-file URLs or tokens used by an active render. The final notice must also address people visible or audible in uploaded media when applicable.',
            'Support and waitlist data: feedback title/body and administrative reply; waitlist email, locale, and source label; and bot-verification data that may be transmitted for validation. The owner must confirm which bot-verification results are retained rather than assume they are stored.',
            'Billing and sponsorship data when enabled: Stripe customer, checkout, subscription, payment-status, currency, price, and internal user identifiers; sponsor email, GitHub handle, amount, message, and public-display choices. The application does not store full payment-card details, but Stripe and the final payment notice must be reviewed.',
            'Analytics data: a sanitized page path, approved UTM campaign labels, locale, placement, event names, and allowlisted funnel parameters. The application intentionally removes email, tokens, project titles, file names, and arbitrary query parameters from custom GA4 payloads. That filtering does not eliminate Google tag, browser, device, network, cookie, or Enhanced Measurement data, so the deployed GA4 configuration still requires production review.',
            'Device and cookie/storage data: authentication cookies, theme preference, first-touch attribution and event-deduplication keys in browser storage, plus cookies or identifiers set by analytics or other enabled third parties. Exact storage duration, consent, and opt-out behavior must be confirmed.',
          ],
        },
        {
          heading: '3. Why we use the data',
          paragraphs: [
            'We would use account and security data to create accounts, authenticate users, prevent abuse, send verification or reset messages, enforce access controls, and respond to support requests.',
            'We would use media and render data to store the requested source, submit and monitor the render, retry failures, produce the output, and make the result available to the signed-in account owner.',
            'We would use waitlist, feedback, and analytics data to respond to requests, understand which public pages and workflow steps are used, protect the service, and improve the product. The final notice must map each purpose to a legally reviewed basis: [[approved purpose-to-legal-basis table]].',
          ],
        },
        {
          heading: '4. Processors and sharing',
          paragraphs: [
            'We would share only the data needed for a documented purpose with infrastructure and service providers. The owner has declared an intention to enable Google/GitHub OAuth, GA4, and Stripe/sponsorship. The deployment also uses Cloudflare Workers, D1, R2, KV, an email service, and a rendering service or local agent. The exact production provider names, legal entities, links, regions, and enabled secrets must still be verified before publication.',
            'For a render, the external agent or rendering service may receive the account identifier, name, email, project title, media metadata, subtitle options, a temporary source-file URL or token, and video bytes. Temporary operating-system files may be removed by the local agent, but uploaded copies, outputs, and any downstream model-service retention cannot be inferred from this repository and must be confirmed.',
            'The final list must state which providers are enabled in production, their roles, the data each receives, locations, transfer safeguards, and links to their notices. Optional integrations must not be described as active until their production configuration is verified: [[approved subprocessor table and transfer mechanism]].',
          ],
        },
        {
          heading: '5. User content and deletion',
          paragraphs: [
            'Source and output media are associated with the account that created the render and are returned only through authenticated or token-protected routes. A token-bearing source URL is itself sensitive access material and must not be shared. The account owner can request deletion through the account controls or jessebutchman@gmail.com. The current account-deletion implementation cascades database records but does not establish R2 deletion for avatars, source files, or outputs, nor deletion of provider copies; do not promise complete deletion until those paths and backups are implemented and verified.',
            'The current maintenance job removes expired verification records, stale rate-limit records, and retained webhook markers. It does not by itself establish a published media-retention period. The operator must set and implement periods for source media, output media, avatars, render metadata, logs, feedback, waitlist entries, sponsorship/payment records, analytics, backups, and provider copies: [[approved retention schedule]].',
          ],
        },
        {
          heading: '6. Your choices and rights',
          paragraphs: [
            'Depending on where you live, you may have rights to know about, access, correct, delete, restrict, object to, or receive a portable copy of personal data, and to withdraw consent where processing relies on consent. You may contact jessebutchman@gmail.com to make a request. The final notice must state identity verification, response timing, exceptions, and the right to complain to a relevant supervisory authority.',
            'The current product provides account deletion controls, but the password-confirmation path must be made workable for OAuth-only accounts. The owner has declared GA4 enabled, but a separate analytics consent or opt-out experience is not yet implemented; the operator must choose, implement, and document the required consent/opt-out path before enabling analytics for audiences that require it.',
          ],
        },
        {
          heading: '7. International transfers and security',
          paragraphs: [
            'Service providers may process data in countries other than the one where you live. The final policy must identify the destinations and the legal transfer safeguards that apply to each audience and provider: [[approved transfer locations and safeguards]].',
            'We use access controls, authenticated routes, scoped database queries, storage protections, rate limiting, and other technical and organizational measures appropriate to the service. No internet service can promise absolute security; the final incident-notification process and contact route require counsel and operational-owner review.',
          ],
        },
        {
          heading: '8. Children, changes, and contact',
          paragraphs: [
            'The owner has declared a minimum age of 18, and the service is not intended for children. Before publication, the operator must approve how age is represented or verified, how suspected underage accounts are handled, and how media containing minors is reviewed and deleted: [[approved age and child-safety process]].',
            'We may update the published policy when processing changes. The published page will show an effective date and a summary of material changes. Questions and rights requests should go to jessebutchman@gmail.com and [[postal address]].',
          ],
        },
      ],
      reviewItems: [
        'Insert the operator identity, privacy contact, DPO/representative, applicable regions, complaint authority, and effective date.',
        'Approve the purpose-to-legal-basis mapping and decide whether consent is required for GA4, waitlist, feedback, cookies, sponsorship, and optional providers.',
        'Verify the production subprocessor list, data fields, locations, transfer safeguards, and provider contracts.',
        'Set and implement retention/deletion periods for media, avatars, metadata, logs, backups, waitlist, feedback, sponsorship/payment records, analytics, and provider copies.',
        'Implement R2 and provider-copy deletion, versioned registration acceptance, and a usable OAuth-only account-deletion path.',
        'Confirm age/child-safety language, public-avatar/sponsor-display choices, rights-request verification, response process, and analytics opt-out/consent UX.',
      ],
    },
  },
  zh: {
    terms: {
      statusLabel: '审核稿 · 尚未生效',
      effectiveDateLabel: '生效日期：待批准',
      notice: '这是供业务负责人和合格律师审核的草稿，不是最终合同或法律意见。只有补齐并批准后，才能作为注册所同意的正式条款。',
      intro: '本《服务条款》（“条款”）拟说明 Smart Clip 的使用规则。Smart Clip 是用于渲染带字幕视频的网页工作区。请替换所有 `[[方括号字段]]`，并在发布前完成业务与法律审核。',
      sections: [
        {
          heading: '1. 服务范围',
          paragraphs: [
            'Smart Clip 旨在让账户持有人上传 MP4 源视频，选择字幕动画和语言选项，提交渲染，查看排队、处理中、完成或失败状态，重试失败任务，并下载完成的 MP4 成片。',
            '当前产品是受控免费 Beta，每次渲染接受不超过 100 MB 的 MP4。功能、限制、语言、动画样式、基础设施和可用性可能变化。本服务不承诺固定处理时长、特定字幕准确率、特定输出画幅或不间断可用。',
          ],
        },
        {
          heading: '2. 草稿状态、资格与接受',
          paragraphs: [
            '本草稿只有在 yangxionggui 发布经过批准、带有生效日期的正式版本，并且注册流程改为引用该版本后，才可能具有约束力。发布前，负责人必须为所有注册方式（包括 OAuth）在服务端记录接受的条款版本、时间和接受路径：[[经批准的接受记录方案待确认]]。正式版本生效后继续使用服务，即表示你同意正式《服务条款》和《隐私政策》。',
            '你必须具备在所在地区订立合同的法律能力，并且年满 18 周岁。负责人已声明最低年龄为 18 周岁，但仍须针对最终目标地区审核，并批准疑似未成年账户的处理流程：[[经批准的年龄核验与未成年账户流程待确认]]。本服务不面向儿童提供。',
          ],
        },
        {
          heading: '3. 账户与安全',
          paragraphs: [
            '你应提供足以运营账户的准确资料并及时更新。不得共享凭据、冒充他人、通过重复注册规避限制。你对账户发生的活动负责；若怀疑账户被盗用，应联系 jessebutchman@gmail.com。',
            '服务可能提供邮箱/密码登录，并在配置后提供第三方登录。某个登录提供商可能在特定环境不可用；验证邮件、密码重置和频率限制可能适用。',
          ],
        },
        {
          heading: '4. 你的文件与允许用途',
          paragraphs: [
            '你保留上传的文件、文字及其他材料（“用户内容”）中的权利。你承诺已经取得服务为你存储、传输、分析、转换并返回用户内容所需的权利、许可和通知。',
            '不得上传违法材料、侵犯他人权利的材料、恶意软件、密钥或服务无权处理的内容。不得利用服务违反出口管制、制裁、隐私法规或第三方合同。',
          ],
        },
        {
          heading: '5. 运营服务所需的有限许可',
          paragraphs: [
            '你授予服务负责人及其处理方一项有限、非排他的许可，仅在提供、安全保护和排障你请求的服务所必需的范围内，存储、复制、传输、技术检查、渲染、加字幕、翻译并返回用户内容。负责人声明禁止将用户内容用于服务改进或模型训练；人工查看仅限故障排查所必需的范围，并须实施最小权限、访问日志和审批流程：[[经批准的人工排障查看政策待确认]]。',
            '对于疑似违反条款或造成安全、法律、运营风险的内容，负责人可以移除或限制访问。本许可不转移用户内容的所有权。',
          ],
        },
        {
          heading: '6. Beta 可用性与反馈',
          paragraphs: [
            '服务目前是受控免费 Beta，可能存在缺陷、无预告变化或暂时不可用。你应自行保留源文件和成片副本。Pro 目前尚未开放购买，本草稿不承诺未来价格或功能集合。',
            '如果你提交反馈，你允许负责人在不公开识别你身份的情况下使用反馈来运营和改进服务，除非你另行同意。不要在反馈中提交机密信息。',
          ],
        },
        {
          heading: '7. 暂停与终止',
          paragraphs: [
            '在安全、滥用防范、法律合规、未付款（未来若推出付费服务）或重大违约确有必要时，负责人可以暂停或终止访问。负责人应在发布前确定通知和申诉流程：[[暂停通知与申诉流程待确认]]。',
            '你可以停止使用服务，并通过账户设置或 jessebutchman@gmail.com 请求删除账户。账户记录、源文件、输出文件、备份和依法必须保留的记录，按照《隐私政策》批准后的保留计划处理。',
          ],
        },
        {
          heading: '8. 知识产权与反馈',
          paragraphs: [
            '除用户内容外，服务、软件、界面、品牌和文档属于 yangxionggui 或其许可方。除非条款明确允许，本条款不授予复制或转售权。',
            '你可以提交建议或错误报告。反馈授权的具体范围必须由负责人和律师确认：[[反馈许可条款待确认]]。',
          ],
        },
        {
          heading: '9. 第三方服务',
          paragraphs: [
            '服务可能依赖 Cloudflare Workers、D1、R2、KV、MP4 渲染服务或本地 agent、邮件发送、机器人验证、分析、OAuth 登录或支付服务。各服务商的条款和隐私政策可能同时适用。负责人必须在正式版本中列出实际启用的处理方及其链接：[[已批准的处理方清单与链接待确认]]。',
            '如启用付费计划、Stripe 结账或赞助，正式条款必须清楚说明一次性或续费、币种和税费、取消、退款、拒付、公开赞助致谢及消费者权益。当前受控免费 Beta 不会让本草稿成为付款协议：[[经批准的支付与赞助条款待确认]]。',
          ],
        },
        {
          heading: '10. 免责声明与责任',
          paragraphs: [
            '在适用法律允许的范围内，Beta 服务按“现状”和“可用”提供，不保证持续可用、无错误、完整或适合特定用途。本草稿不应被当作最终的保证、消费者权利、责任、赔偿或争议条款。',
            '适用限制、例外、消费者保护、赔偿、争议处理和责任上限必须由负责人和律师确定：[[经批准的责任与争议条款待确认]]。',
          ],
        },
        {
          heading: '11. 修改与联系',
          paragraphs: [
            '负责人可以在合理通知后更新正式条款。正式版本应列明运营主体、生效日期、更新方式、适用法律、管辖/替代争议程序和有效联系地址。',
            '运营主体：yangxionggui · 联系邮箱：jessebutchman@gmail.com · 邮寄地址：[[注册地址待确认]] · 适用法律与管辖：[[待确认]]。',
          ],
        },
      ],
      reviewItems: [
        '补齐法律主体名称、地址、联系邮箱、适用法律、管辖和生效日期。',
        '确认年龄/儿童安全、用户内容许可范围、服务改进/训练/人工审核政策和反馈许可。',
        '请律师确认暂停、删除、保证、责任、赔偿、争议、消费者权利和出口管制条款。',
        '为密码和 OAuth 注册实现服务端版本化条款接受记录，再列出已启用处理方及其现行条款/隐私政策链接。',
        '启用支付或赞助前，批准付款、续费、取消、退款和公开致谢条款。',
      ],
    },
    privacy: {
      statusLabel: '审核稿 · 尚未生效',
      effectiveDateLabel: '生效日期：待批准',
      notice: '这是供业务负责人和合格律师审核的草稿，不是最终隐私政策或法律意见。主体身份、法律依据、保留期限、跨境传输方式和联系渠道必须确认后，才能推广收集数据和公开注册。',
      intro: '本拟议《隐私政策》说明 yangxionggui 在你访问 Smart Clip、创建账户、提交渲染、联系支持或加入候补名单时如何处理个人信息。请替换所有 `[[方括号字段]]`，并在发布前完成适用地区的审核。',
      sections: [
        {
          heading: '1. 谁负责处理你的数据',
          paragraphs: [
            '数据控制者/运营主体：yangxionggui。隐私请求邮箱：jessebutchman@gmail.com。邮寄地址：[[注册地址待确认]]。如法律要求设置数据保护官或代表：[[DPO/代表信息，或确认不设置]]。',
            '正式政策必须根据目标用户所在地区列明适用范围、法律依据、投诉机构及所需代表。本仓库没有这些事实，因此不会擅自填写。',
          ],
        },
        {
          heading: '2. 我们可能收集的数据',
          bullets: [
            '账户与认证数据：姓名、邮箱、由认证服务管理的密码凭据材料、验证状态、会话标识、IP、用户代理，以及启用第三方登录时的 OAuth 账户标识、头像数据、提供商令牌和授权范围。已配置的头像路由可能让上传或提供商头像被公开访问，发布前必须确认并披露。',
            '安全与请求数据：会话 IP、用户代理、频率限制记录、认证和验证事件、运行日志。具体字段和保留期需结合 Cloudflare 与 Better Auth 的生产配置确认。',
            '媒体与渲染数据：上传的 MP4 字节、原始文件名、内容类型、文件大小、项目标题、字幕语言和动画选择、渲染任务标识、队列/状态/阶段/错误时间、生成的 MP4 成片，以及活动渲染所用的临时源文件 URL 或令牌。正式政策还必须在适用时说明上传媒体中可见或可听见的其他人员数据。',
            '支持与候补数据：反馈标题/正文和管理员回复；候补邮箱、语言和来源标签；以及可能为了验证而传输的机器人验证数据。负责人必须确认哪些机器人验证结果会被保留，不能假定它们已被存储。',
            '账单与赞助数据（启用时）：Stripe 客户、结账、订阅、支付状态、币种、价格和内部用户标识；赞助邮箱、GitHub 用户名、金额、留言和公开展示选择。应用不存储完整银行卡资料，但仍须审核 Stripe 和正式付款说明。',
            '分析数据：净化后的页面路径、允许的 UTM 活动标签、语言、位置、事件名和白名单漏斗参数。应用会从自定义 GA4 载荷中主动移除邮箱、令牌、项目标题、文件名和任意查询参数；这并不能消除 Google 标签、浏览器、设备、网络、Cookie 或 Enhanced Measurement 数据，因此已部署的 GA4 配置仍需生产审核。',
            '设备与 Cookie/存储数据：认证 Cookie、主题偏好、首次触达归因和事件去重键，以及分析或其他启用的第三方设置的 Cookie/标识符。具体存储时长、同意和退出行为必须确认。',
          ],
        },
        {
          heading: '3. 我们为什么使用这些数据',
          paragraphs: [
            '我们会使用账户和安全数据创建账户、认证用户、防止滥用、发送验证或重置消息、实施访问控制和回应支持请求。',
            '我们会使用媒体和渲染数据保存请求的源文件、提交和跟踪渲染、重试失败、生成成片，并让已登录的账户所有者取得结果。',
            '我们会使用候补、反馈和分析数据回应请求、了解公开页面和工作流步骤的使用情况、保护服务并改进产品。正式政策必须把每项用途与法律审核后的依据对应起来：[[经批准的用途-法律依据表待确认]]。',
          ],
        },
        {
          heading: '4. 处理方与共享',
          paragraphs: [
            '我们只会为已记录的目的向基础设施和服务商提供必要数据。负责人声明计划启用 Google/GitHub OAuth、GA4 和 Stripe/赞助，并使用 Cloudflare、邮件及渲染服务。生产环境中的服务商法定名称、政策链接、地区、角色和实际启用配置仍须在发布前核验。',
            '对于一次渲染，外部 agent 或渲染服务可能收到账户标识、姓名、邮箱、项目标题、媒体元数据、字幕选项、临时源文件 URL 或令牌及视频字节。本地 agent 可能删除操作系统临时文件，但上传副本、输出和任何下游模型服务的保留期无法从本仓库推断，必须确认。',
            '正式政策必须列明生产中实际启用的服务商、角色、接收的数据、地点、传输保障和政策链接。未验证生产配置的可选集成不得写成已启用：[[经批准的处理方清单与跨境保障待确认]]。',
          ],
        },
        {
          heading: '5. 用户内容与删除',
          paragraphs: [
            '源文件和成片与创建渲染的账户关联，并只通过需要认证或令牌保护的路由返回。带令牌的源文件 URL 本身属于敏感访问材料，不得分享。账户所有者可以通过账户设置或 jessebutchman@gmail.com 请求删除。当前删号实现会级联删除数据库记录，但未建立 R2 头像、源文件或成片的删除，也未建立服务商副本的删除；在这些路径与备份经过实现和验证前，不得承诺彻底删除。',
            '当前维护任务会清理过期验证记录、陈旧频率限制记录和保留的 webhook 标记，但没有单独建立公开的媒体保留期限。负责人必须为源媒体、成片、头像、渲染元数据、日志、反馈、候补、赞助/付款记录、分析、备份和服务商副本设定并实现保留期：[[经批准的保留计划待确认]]。',
          ],
        },
        {
          heading: '6. 你的选择与权利',
          paragraphs: [
            '根据你所在地区，你可能拥有知情、访问、更正、删除、限制处理、反对处理、取得可移植副本，以及在以同意为依据时撤回同意等权利。你可以通过 jessebutchman@gmail.com 提交请求。正式政策必须说明身份核验、回应时限、例外和向监管机构投诉的权利。',
            '当前产品提供账户删除控制，但密码确认路径必须能让仅 OAuth 账户实际使用。负责人已声明启用 GA4，但尚未实现独立的分析同意或退出体验；对于需要此类机制的受众，负责人必须在启用分析前决定、实现并记录相应路径。',
          ],
        },
        {
          heading: '7. 跨境传输与安全',
          paragraphs: [
            '服务商可能在你所在国家/地区之外处理数据。正式政策必须列明目标地点以及针对各地区和服务商采用的传输保障：[[经批准的传输地点与保障待确认]]。',
            '我们使用访问控制、认证路由、按账户隔离的数据库查询、存储保护、频率限制及其他与服务相称的技术和组织措施。任何互联网服务都不能承诺绝对安全；事件通知流程和联系渠道仍需负责人及律师审核。',
          ],
        },
        {
          heading: '8. 儿童、修改与联系',
          paragraphs: [
            '负责人已声明最低年龄为 18 周岁，本服务不面向儿童。发布前仍须批准年龄声明或核验方式、疑似未成年账户的处理方式，以及包含未成年人影像的媒体审核和删除流程：[[经批准的年龄与儿童安全流程待确认]]。',
            '当处理方式发生变化时，我们可以更新正式政策。公开页面会显示生效日期和重大变更摘要。问题和权利请求请发送至 jessebutchman@gmail.com；邮寄地址：[[注册地址待确认]]。',
          ],
        },
      ],
      reviewItems: [
        '补齐运营主体、隐私联系邮箱、DPO/代表、适用地区、投诉机构和生效日期。',
        '批准用途-法律依据映射，并决定 GA4、候补、反馈、Cookie、赞助和可选服务商是否需要同意。',
        '核对生产处理方清单、数据字段、地点、跨境保障和服务商合同。',
        '为媒体、头像、元数据、日志、备份、候补、反馈、赞助/付款记录、分析和服务商副本设定并实现保留/删除期限。',
        '实现 R2 与服务商副本删除、注册时版本化接受记录和仅 OAuth 账户可用的删号路径。',
        '确认年龄/儿童安全、公开头像/赞助展示选择、权利请求核验与响应流程，以及分析退出/同意 UX。',
      ],
    },
  },
}
