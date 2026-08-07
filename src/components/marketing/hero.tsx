import { ArrowRight, Check, Play, Sparkles } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { buttonVariants } from '@/components/ui/button'

function ClipBoard() {
  const clips = [
    { time: '00:42', title: 'The hook that changed the room', tone: 'bg-primary' },
    { time: '12:18', title: 'A better answer in three words', tone: 'bg-[#4f7cf3]' },
    { time: '28:06', title: 'Why people keep watching', tone: 'bg-[#9dbb58]' },
  ]

  return (
    <div className="relative mx-auto w-full max-w-[590px]">
      <div className="overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_24px_70px_rgba(4,8,18,.22)]">
        <div className="flex h-12 items-center gap-2 border-b border-border bg-bg-alt px-4">
          <span className="size-2.5 rounded-full bg-[#ff6257]" /><span className="size-2.5 rounded-full bg-[#f6bd3b]" /><span className="size-2.5 rounded-full bg-[#35c759]" />
          <span className="ml-2 font-mono text-[11px] text-fg-3">smart clip / new project</span>
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-success"><span className="size-1.5 animate-pulse rounded-full bg-success" /> READY</span>
        </div>
        <div className="grid gap-0 md:grid-cols-[.75fr_1.25fr]">
          <div className="relative min-h-[250px] overflow-hidden bg-[#20262a] p-4 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_26%,rgba(242,102,30,.35),transparent_42%),linear-gradient(145deg,#39474c,#11161a)]" />
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[.16em] text-white/60"><span>Source video</span><span>48:12</span></div>
              <div className="grid place-items-center"><span className="grid size-12 place-items-center rounded-full border border-white/45 bg-white/10"><Play size={17} fill="currentColor" /></span></div>
              <div><p className="mb-1 text-sm font-semibold">founders-roundtable.mp4</p><p className="m-0 font-mono text-[10px] text-white/55">4K · 1.8 GB · uploaded now</p></div>
            </div>
          </div>
          <div className="p-5 md:p-6">
            <div className="flex items-end justify-between"><div><span className="font-mono text-[9px] uppercase tracking-[.14em] text-fg-3">AI HIGHLIGHTS</span><h2 className="m-0 mt-1.5 font-display text-[17px] font-semibold">3 clips worth keeping</h2></div><span className="font-mono text-[11px] text-fg-3">03 / 03</span></div>
            <div className="mt-5 grid gap-2.5">
              {clips.map((clip) => <div key={clip.time} className="grid grid-cols-[36px_42px_1fr_18px] items-center gap-2 rounded-[7px] border border-border bg-bg-alt p-2 text-[11px]"><span className={`grid h-8 place-items-center rounded-[4px] ${clip.tone} text-white`}><Play size={10} fill="currentColor" /></span><span className="font-mono text-[10px] text-fg-3">{clip.time}</span><span className="truncate font-medium">{clip.title}</span><Check size={14} className="text-success" /></div>)}
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-[10px] text-fg-3"><span className="flex items-center gap-1.5"><Sparkles size={12} className="text-primary" /> captions, crop &amp; hook applied</span><span className="font-mono text-success">98% fit</span></div>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-border px-5 py-3"><span className="font-mono text-[9px] text-fg-3">48:12</span><div className="relative h-2 flex-1 overflow-hidden rounded-full bg-bg-inset"><span className="absolute inset-y-0 left-[8%] w-[14%] rounded-full bg-primary" /><span className="absolute inset-y-0 left-[34%] w-[23%] rounded-full bg-[#4f7cf3]" /><span className="absolute inset-y-0 left-[70%] w-[15%] rounded-full bg-[#9dbb58]" /></div><span className="font-mono text-[9px] text-fg-3">00:00</span></div>
      </div>
      <div className="absolute -right-2 -top-5 hidden items-center gap-2 rounded-[9px] border border-border bg-card px-3 py-2 text-[11px] shadow-[0_12px_30px_rgba(4,8,18,.18)] sm:flex"><span className="grid size-6 place-items-center rounded-full bg-soft text-primary"><Sparkles size={13} /></span><span><b className="block">Auto captions</b><small className="text-fg-3">30+ languages</small></span></div>
    </div>
  )
}

export function Hero({ loggedIn }: { loggedIn: boolean }) {
  const { t } = useTranslation()
  return (
    <section className="grid-bg grid items-center gap-12 overflow-hidden px-5 py-16 md:grid-cols-[.9fr_1.1fr] md:px-7 md:py-24">
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-[18px]">
        <span className="kicker">// {t('marketing.heroKicker')}</span>
        <h1 className="max-w-[620px] font-display text-[44px] font-semibold leading-[1.03] tracking-[-2px] sm:text-[64px]">{t('marketing.heroTitlePre')} <span className="text-primary">{t('marketing.heroTitleHl')}</span>{t('marketing.heroTitlePost')}</h1>
        <p className="m-0 max-w-[500px] text-base leading-relaxed text-fg-2 md:text-[17px]">{t('marketing.heroSubtitle')}</p>
        <div className="mt-2 flex flex-wrap gap-2.5">
          <Link to={loggedIn ? "/{-$locale}/app" : "/{-$locale}/register"} className={buttonVariants({ size: 'lg' })}>{t('marketing.heroCtaPrimary')} <ArrowRight size={18} /></Link>
          <a href="#features" className={buttonVariants({ variant: 'outline', size: 'lg' })}>{t('marketing.heroCtaSecondary')}</a>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] text-fg-3"><span>01 · {t('marketing.heroProof1')}</span><span>02 · {t('marketing.heroProof2')}</span><span>03 · {t('marketing.heroProof3')}</span></div>
      </div>
      <ClipBoard />
    </section>
  )
}
