import { ArrowRight, Check, FileVideo, Languages, Sparkles } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { buttonVariants } from '@/components/ui/button'

function RenderPreview() {
  const { t, locale } = useTranslation()
  const previewLocale = locale === 'zh' ? 'zh' : 'en'
  const previewPoster = previewLocale === 'zh'
    ? '/subtitle-composition-preview/bankDeposit.jpg'
    : '/subtitle-composition-preview/en/bankDeposit.jpg'

  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <div className="overflow-hidden rounded-[12px] border border-border bg-card shadow-[0_24px_70px_rgba(4,8,18,.2)]">
        <div className="flex h-11 items-center gap-2 border-b border-border bg-bg-alt px-4">
          <span className="size-2.5 rounded-full bg-[#ff6257]" />
          <span className="size-2.5 rounded-full bg-[#f6bd3b]" />
          <span className="size-2.5 rounded-full bg-[#35c759]" />
          <span className="ml-2 font-mono text-[10px] text-fg-3">smart clip / render</span>
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-success"><span className="size-1.5 rounded-full bg-success" /> READY</span>
        </div>
        <div className="grid gap-0 md:grid-cols-[.92fr_1.08fr]">
          <div className="border-b border-border bg-bg-alt p-5 md:border-b-0 md:border-r">
            <div className="mb-5 flex items-center justify-between font-mono text-[9px] uppercase tracking-[.14em] text-fg-3"><span>01 / {t('marketing.previewSource')}</span><span>MP4</span></div>
            <div className="grid min-h-[184px] place-items-center rounded-[8px] border border-dashed border-border-strong bg-bg">
              <div className="text-center">
                <span className="mx-auto grid size-11 place-items-center rounded-[8px] bg-soft text-primary"><FileVideo size={21} /></span>
                <p className="mb-0 mt-3 max-w-[180px] truncate text-sm font-semibold">interview-final.mp4</p>
                <p className="mb-0 mt-1 font-mono text-[10px] text-fg-3">02:18 · 1080p · 184 MB</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px] text-fg-3"><span>{t('marketing.previewUpload')}</span><span className="font-mono text-success">READY</span></div>
          </div>
          <div className="p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between font-mono text-[9px] uppercase tracking-[.14em] text-fg-3"><span>02 / {t('marketing.previewStyle')}</span><Sparkles size={14} className="text-primary" /></div>
            <div className="overflow-hidden rounded-[8px] border border-primary bg-bg ring-2 ring-primary/15">
              <video
                key={previewLocale}
                src={`/subtitle-composition-preview/${previewLocale}/bankDeposit.webm`}
                poster={previewPoster}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                aria-label={t('marketing.previewBadgeSub')}
                className="aspect-video w-full bg-[#0b0d12] object-contain"
              />
              <div className="flex items-center justify-between gap-3 px-3 py-2.5"><span className="flex items-center gap-2 text-sm font-medium"><Check size={15} className="text-primary" /> {t('marketing.previewStyleName')}</span><span className="rounded-full bg-soft px-2 py-1 font-mono text-[9px] text-primary">LIVE</span></div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-[7px] border border-border bg-bg-alt px-3 py-2.5 text-[12px] text-fg-2"><Languages size={15} className="text-primary" /> {t('marketing.previewLanguage')}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-border px-5 py-3"><span className="font-mono text-[10px] text-fg-3">03</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-inset"><span className="block h-full w-[68%] rounded-full bg-primary" /></div><span className="font-mono text-[10px] text-primary">{t('marketing.previewReady')}</span></div>
      </div>
      <div className="absolute -right-2 -top-4 hidden items-center gap-2 rounded-[8px] border border-border bg-card px-3 py-2 text-[11px] shadow-[0_12px_30px_rgba(4,8,18,.16)] sm:flex"><span className="grid size-6 place-items-center rounded-full bg-soft text-primary"><Sparkles size={13} /></span><span><b className="block">{t('marketing.previewBadge')}</b><small className="text-fg-3">{t('marketing.previewBadgeSub')}</small></span></div>
    </div>
  )
}

export function Hero() {
  const { t } = useTranslation()

  return (
    <section className="grid-bg grid items-center gap-12 overflow-hidden px-5 py-14 md:grid-cols-[.88fr_1.12fr] md:px-7 md:py-24">
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-[18px]">
        <span className="kicker">// {t('marketing.heroKicker')}</span>
        <h1 className="max-w-[620px] font-display text-[44px] font-semibold leading-[1.03] tracking-[-2px] sm:text-[64px]">{t('marketing.heroTitlePre')} <span className="text-primary">{t('marketing.heroTitleHl')}</span>{t('marketing.heroTitlePost')}</h1>
        <p className="m-0 max-w-[500px] text-base leading-relaxed text-fg-2 md:text-[17px]">{t('marketing.heroSubtitle')}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Link to="/{-$locale}/app/render" className={buttonVariants({ size: 'lg' })}>{t('marketing.heroCtaPrimary')} <ArrowRight size={18} /></Link>
          <span className="font-mono text-[11px] text-fg-3">{t('marketing.heroCtaNote')}</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] text-fg-3"><span>01 · {t('marketing.heroProof1')}</span><span>02 · {t('marketing.heroProof2')}</span><span>03 · {t('marketing.heroProof3')}</span></div>
      </div>
      <RenderPreview />
    </section>
  )
}
