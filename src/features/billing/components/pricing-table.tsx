import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Check, Bell, Heart } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { buttonVariants } from '@/components/ui/button'
import { WaitlistDialog } from '@/features/waitlist/components/waitlist-dialog'
import type { Locale } from '@/features/i18n/locale'

interface Content {
  kicker: string
  title: string
  subtitle: string
  lifetimeNote: string
  personal: string
  team: string
  freeName: string
  proName: string
  comingSoon: string
  freeDesc: string
  proDesc: string
  once: string
  freeNote: string
  proNote: string
  proTeamNote: string
  ctaFree: string
  ctaPro: string
  bandKicker: string
  bandTitle: string
  bandSub: string
  bandSponsor: string
  freeFeats: string[]
  proFeats: string[]
}

/* Pricing copy lives here because the feature lists are arrays. Keep the page
 * honest while the free beta is controlled and paid tiers are being validated. */
const CONTENT: Record<Locale, Content> = {
  en: {
    kicker: '// pricing',
    title: 'A simple start for a serious publishing habit.',
    subtitle:
      'Start with the controlled free beta. Upgrade when you need more room for projects, exports and team review.',
    lifetimeNote: 'Free while we validate the workflow',
    personal: 'Personal',
    team: 'Team',
    freeName: 'Free beta',
    proName: 'Pro',
    comingSoon: 'Coming soon',
    freeDesc: 'Everything needed to turn one source video into a publishable clip batch.',
    proDesc: 'More projects, faster review and priority support for a growing publishing team.',
    once: 'planned',
    freeNote: 'No card required · controlled access',
    proNote: 'Planned pricing · individual creator',
    proTeamNote: 'Planned pricing · small publishing team',
    ctaFree: 'Start creating',
    ctaPro: 'Join the waitlist',
    bandKicker: '// made for momentum',
    bandTitle: 'The free workflow should feel useful first.',
    bandSub: 'Try the full review loop, tell us what slows you down, and help shape what comes next.',
    bandSponsor: 'Support the team',
    freeFeats: [
      'Source video upload',
      'AI highlight suggestions',
      'Captions and 9:16 framing',
      'Private project storage',
      'Community support',
    ],
    proFeats: [
      'Everything in the free beta',
      'Higher project and export limits',
      'Priority review support',
      'Team handoff and shared queues',
    ],
  },
  zh: {
    kicker: '// pricing',
    title: '从一条视频开始，建立稳定的发布习惯',
    subtitle: '先体验受控免费 Beta。需要更多项目、成片和团队审核空间时，再升级到 Pro。',
    lifetimeNote: '工作流验证期间免费使用',
    personal: '个人',
    team: '团队',
    freeName: '免费 Beta',
    proName: 'Pro',
    comingSoon: '即将推出',
    freeDesc: '从一条源视频开始，生成可以审核和发布的片段队列。',
    proDesc: '给持续发布的创作者和团队更多项目、成片与支持空间。',
    once: '规划中',
    freeNote: '无需信用卡 · 受控开放',
    proNote: '规划定价 · 个人创作者',
    proTeamNote: '规划定价 · 小型发布团队',
    ctaFree: '开始创作',
    ctaPro: '加入等待列表',
    bandKicker: '// 为持续发布而做',
    bandTitle: '先让免费工作流真正有用。',
    bandSub: '完整走一遍审核链路，告诉我们哪里拖慢了你，一起决定下一步。',
    bandSponsor: '支持团队',
    freeFeats: ['源视频上传', 'AI 精选片段建议', '字幕与 9:16 画幅', '私有项目存储', '社区支持'],
    proFeats: [
      '免费 Beta 的全部能力',
      '更高项目与成片额度',
      '优先审核支持',
      '团队协作与共享队列',
    ],
  },
}

function PriceCard({
  c,
  plan,
  team,
  onPay,
}: {
  c: Content
  plan: 'free' | 'pro'
  team: boolean
  onPay: () => void
}) {
  const isPro = plan === 'pro'
  const price = isPro ? (team ? '$499' : '$199') : '$0'
  const note = isPro ? (team ? c.proTeamNote : c.proNote) : c.freeNote
  return (
    <div
      className="term"
      style={{
        boxShadow: isPro ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        borderColor: isPro ? 'var(--primary)' : 'var(--border)',
      }}
    >
      <div className="term-bar justify-between">
        <span className="font-mono text-xs text-fg-2"># {isPro ? c.proName : c.freeName}</span>
        {isPro && <span className="metric">{c.comingSoon}</span>}
      </div>
      <div className="p-6 font-sans">
        <p className="m-0 mb-3.5 text-[13.5px] text-fg-3">{isPro ? c.proDesc : c.freeDesc}</p>
        <div className="flex items-baseline gap-1.5">
          <span key={price} className="price-pop font-mono text-[38px] font-semibold">
            {price}
          </span>
          {isPro && <span className="text-sm text-fg-3">{c.once}</span>}
        </div>
        <div
          className="font-mono text-xs"
          style={{ color: isPro ? 'var(--primary)' : 'var(--fg-3)', margin: '6px 0 20px', minHeight: 16 }}
        >
          {note}
        </div>
        {isPro ? (
          <button type="button" className={buttonVariants({ className: 'w-full' })} onClick={onPay}>
            <Bell size={16} /> {c.ctaPro}
          </button>
        ) : (
          <Link to="/{-$locale}/register" className={buttonVariants({ variant: 'outline', className: 'w-full' })}>
            {c.ctaFree}
          </Link>
        )}
        <div className="my-5 h-px bg-border" />
        <div className="grid gap-2.5">
          {(isPro ? c.proFeats : c.freeFeats).map((f) => (
            <div key={f} className="flex items-start gap-2.5 text-sm text-fg-2">
              <span className="mt-0.5 shrink-0 text-primary">
                <Check size={16} />
              </span>
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full px-[18px] py-2 text-sm font-semibold transition-colors ${
        active ? 'bg-card text-foreground shadow-[var(--shadow-sm)]' : 'text-fg-2'
      }`}
    >
      {children}
    </button>
  )
}

export function PricingTable({ turnstileSiteKey }: { turnstileSiteKey: string | null }) {
  const { locale } = useTranslation()
  const c = CONTENT[locale]
  const [team, setTeam] = useState(false)
  const [waitlistOpen, setWaitlistOpen] = useState(false)

  return (
    <>
      {/* heading + toggle */}
      <section className="grid-bg px-5 md:px-7 pb-10 pt-14 text-center">
        <span className="kicker">{c.kicker}</span>
        <h1 className="m-0 mb-3 mt-2.5 font-display text-[28px] font-semibold tracking-[-1px] sm:text-[36px]">
          {c.title}
        </h1>
        <p className="mx-auto mb-5 max-w-[34em] text-base text-fg-2">{c.subtitle}</p>
        <div className="inline-flex gap-0.5 rounded-full border border-border bg-bg-alt p-1" role="group">
          <ToggleBtn active={!team} onClick={() => setTeam(false)}>
            {c.personal}
          </ToggleBtn>
          <ToggleBtn active={team} onClick={() => setTeam(true)}>
            {c.team}
          </ToggleBtn>
        </div>
        <div className="mt-3 font-mono text-[12.5px] text-fg-3">{c.lifetimeNote}</div>
      </section>

      {/* price cards */}
      <section className="mx-auto grid max-w-3xl items-stretch gap-[18px] px-5 md:px-7 pb-2 md:grid-cols-2">
        <PriceCard c={c} plan="free" team={team} onPay={() => setWaitlistOpen(true)} />
        <PriceCard c={c} plan="pro" team={team} onPay={() => setWaitlistOpen(true)} />
      </section>

      {/* closing band: honest nudge + sponsor bridge */}
      <section className="grid-bg mt-10 border-t border-border px-5 md:px-7 py-14 text-center">
        <span className="kicker">{c.bandKicker}</span>
        <h2 className="m-0 mb-3 mt-2.5 font-display text-[24px] font-semibold tracking-[-0.8px] sm:text-[30px]">
          {c.bandTitle}
        </h2>
        <p className="mx-auto mb-7 max-w-[36em] text-[15px] leading-snug text-fg-2">{c.bandSub}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/{-$locale}/register" className={buttonVariants({})}>
            {c.ctaFree}
          </Link>
          <Link to="/{-$locale}/sponsor" className={buttonVariants({ variant: 'outline' })}>
            <Heart size={15} /> {c.bandSponsor}
          </Link>
        </div>
      </section>

      <WaitlistDialog
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        turnstileSiteKey={turnstileSiteKey}
        source="pricing"
      />
    </>
  )
}
