import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Check, Bell } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { buttonVariants } from '@/components/ui/button'
import { WaitlistDialog } from '@/features/waitlist/components/waitlist-dialog'
import type { Locale } from '@/features/i18n/locale'
import { trackMarketingCta } from '@/features/analytics/marketing'

interface Content {
  kicker: string
  title: string
  subtitle: string
  lifetimeNote: string
  freeName: string
  proName: string
  comingSoon: string
  freeDesc: string
  proDesc: string
  once: string
  freeNote: string
  proNote: string
  ctaFree: string
  ctaPro: string
  bandKicker: string
  bandTitle: string
  bandSub: string
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
      'Start with the controlled free beta. A future Pro tier will be announced when it is ready for purchase.',
    lifetimeNote: 'Free while we validate the workflow',
    freeName: 'Free beta',
    proName: 'Pro',
    comingSoon: 'Coming soon',
    freeDesc: 'Upload an MP4, choose subtitles, follow the render queue and download the completed result.',
    proDesc: 'A future paid tier. Its feature scope, availability, and price have not been published.',
    once: 'price not published',
    freeNote: 'No card required · controlled access',
    proNote: 'Feature scope, availability, and price to be announced',
    ctaFree: 'Start creating',
    ctaPro: 'Join the waitlist',
    bandKicker: '// made for momentum',
    bandTitle: 'The free workflow should feel useful first.',
    bandSub: 'Try the full render workflow, tell us what slows you down, and help shape what comes next.',
    freeFeats: [
      'MP4 upload up to 100 MB',
      '40 subtitle animation styles',
      '12 language options',
      'Queue status, retry and MP4 download',
    ],
    proFeats: [
      'Feature scope is being validated',
      'Usage limits have not been published',
      'Availability has not been announced',
      'Pricing has not been announced',
    ],
  },
  zh: {
    kicker: '// pricing',
    title: '从一条视频开始，建立稳定的发布习惯',
    subtitle: '先体验受控免费 Beta。未来 Pro 开放购买时，会在这里公布具体方案。',
    lifetimeNote: '工作流验证期间免费使用',
    freeName: '免费 Beta',
    proName: 'Pro',
    comingSoon: '即将推出',
    freeDesc: '上传 MP4、选择字幕、跟踪渲染队列，并下载完成的结果。',
    proDesc: '未来付费版本的功能范围、开放时间和价格尚未公布。',
    once: '价格未公布',
    freeNote: '无需信用卡 · 受控开放',
    proNote: '功能范围、开放时间与价格待公布',
    ctaFree: '开始创作',
    ctaPro: '加入等待列表',
    bandKicker: '// 为持续发布而做',
    bandTitle: '先让免费工作流真正有用。',
    bandSub: '完整走一遍渲染流程，告诉我们哪里拖慢了你，一起决定下一步。',
    freeFeats: ['MP4 上传最大 100 MB', '40 种字幕动画样式', '12 种语言选择', '队列状态、重试和 MP4 下载'],
    proFeats: [
      '功能范围仍在验证',
      '使用额度尚未公布',
      '开放时间尚未公布',
      '价格尚未公布',
    ],
  },
}

function PriceCard({
  c,
  plan,
  onPay,
  loggedIn,
  locale,
}: {
  c: Content
  plan: 'free' | 'pro'
  onPay: () => void
  loggedIn: boolean
  locale: Locale
}) {
  const isPro = plan === 'pro'
  const price = isPro ? '—' : '$0'
  const note = isPro ? c.proNote : c.freeNote
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
          <Link
            to={loggedIn ? '/{-$locale}/app/render' : '/{-$locale}/register'}
            search={loggedIn ? undefined : { next: '/app/render' }}
            onClick={() => trackMarketingCta({ ctaId: 'pricing_free', placement: 'pricing', locale, destination: loggedIn ? '/app/render' : '/register' })}
            className={buttonVariants({ variant: 'outline', className: 'w-full' })}
          >
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

export function PricingTable({ turnstileSiteKey, loggedIn = false }: { turnstileSiteKey: string | null; loggedIn?: boolean }) {
  const { locale } = useTranslation()
  const c = CONTENT[locale]
  const [waitlistOpen, setWaitlistOpen] = useState(false)

  return (
    <>
      {/* heading */}
      <section className="grid-bg px-5 md:px-7 pb-10 pt-14 text-center">
        <span className="kicker">{c.kicker}</span>
        <h1 className="m-0 mb-3 mt-2.5 font-display text-[28px] font-semibold tracking-[-1px] sm:text-[36px]">
          {c.title}
        </h1>
        <p className="mx-auto mb-5 max-w-[34em] text-base text-fg-2">{c.subtitle}</p>
        <div className="mt-3 font-mono text-[12.5px] text-fg-3">{c.lifetimeNote}</div>
      </section>

      {/* price cards */}
      <section className="mx-auto grid max-w-3xl items-stretch gap-[18px] px-5 md:px-7 pb-2 md:grid-cols-2">
        <PriceCard c={c} plan="free" onPay={() => setWaitlistOpen(true)} loggedIn={loggedIn} locale={locale} />
        <PriceCard c={c} plan="pro" onPay={() => setWaitlistOpen(true)} loggedIn={loggedIn} locale={locale} />
      </section>

      {/* closing band */}
      <section className="grid-bg mt-10 border-t border-border px-5 md:px-7 py-14 text-center">
        <span className="kicker">{c.bandKicker}</span>
        <h2 className="m-0 mb-3 mt-2.5 font-display text-[24px] font-semibold tracking-[-0.8px] sm:text-[30px]">
          {c.bandTitle}
        </h2>
        <p className="mx-auto mb-7 max-w-[36em] text-[15px] leading-snug text-fg-2">{c.bandSub}</p>
        {loggedIn ? (
          <Link
            to="/{-$locale}/app/render"
            onClick={() => trackMarketingCta({ ctaId: 'pricing_close_render', placement: 'pricing_close', locale, destination: '/app/render' })}
            className={buttonVariants({})}
          >
            {c.ctaFree}
          </Link>
        ) : (
          <Link
            to="/{-$locale}/register"
            search={{ next: '/app/render' }}
            onClick={() => trackMarketingCta({ ctaId: 'pricing_close_register', placement: 'pricing_close', locale, destination: '/register' })}
            className={buttonVariants({})}
          >
            {c.ctaFree}
          </Link>
        )}
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
