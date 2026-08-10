import { Play, ShieldCheck } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { buttonVariants } from '@/components/ui/button'
import { useTranslation } from '@/features/i18n/provider'
import { trackMarketingCta } from '@/features/analytics/marketing'

export function ComparisonSection({ loggedIn = false }: { loggedIn?: boolean }) {
  const { t, locale } = useTranslation()

  return (
    <section className="border-t border-border px-5 py-14 md:px-7 md:py-20" id="comparison">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="kicker">{t('comparison.kicker')}</span>
          <h2 className="m-0 mt-2.5 font-display text-[30px] font-semibold tracking-[-.8px]">{t('comparison.title')}</h2>
          <p className="m-0 mt-3 max-w-[44em] text-[15px] leading-relaxed text-fg-2">{t('comparison.body')}</p>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-fg-3"><ShieldCheck size={14} className="text-success" /> {t('comparison.note')}</span>
      </div>

      <div className="mt-8 overflow-hidden border border-border bg-inset">
        <video
          className="aspect-video w-full bg-[#0b0d12] object-contain"
          controls
          preload="metadata"
          poster="/product-demo/smart-clip-product-demo-poster.jpg"
          playsInline
          aria-label={t('comparison.videoLabel')}
        >
          <source src="/product-demo/smart-clip-product-demo-16x9.mp4" type="video/mp4" />
          <track
            kind="captions"
            src="/product-demo/smart-clip-product-demo-16x9.en.vtt"
            srcLang="en"
            label="English"
            default={locale === 'en'}
          />
          <track
            kind="captions"
            src="/product-demo/smart-clip-product-demo-16x9.zh.vtt"
            srcLang="zh"
            label="中文"
            default={locale === 'zh'}
          />
          {t('comparison.videoFallback')}
        </video>
        <div className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="m-0 max-w-[48em] text-sm leading-relaxed text-fg-2">{t('comparison.caption')}</p>
          {loggedIn ? (
            <Link
              to="/{-$locale}/app/render"
              onClick={() => trackMarketingCta({ ctaId: 'demo_render', placement: 'demo', locale, destination: '/app/render' })}
              className={buttonVariants({ size: 'sm', className: 'shrink-0' })}
            >
              <Play size={15} aria-hidden="true" /> {t('comparison.cta')}
            </Link>
          ) : (
            <Link
              to="/{-$locale}/register"
              search={{ next: '/app/render' }}
              onClick={() => trackMarketingCta({ ctaId: 'demo_register', placement: 'demo', locale, destination: '/register' })}
              className={buttonVariants({ size: 'sm', className: 'shrink-0' })}
            >
              <Play size={15} aria-hidden="true" /> {t('comparison.cta')}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
