import { ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'
import { buttonVariants } from '@/components/ui/button'
import { trackMarketingCta } from '@/features/analytics/marketing'

export function CTA({ loggedIn = false }: { loggedIn?: boolean }) {
  const { t, locale } = useTranslation()

  return (
    <section className="grid-bg border-t border-border px-5 py-14 text-center md:px-7 md:py-20">
      <h2 className="font-display text-[28px] font-semibold tracking-[-0.6px]">{t('marketing.ctaTitle')}</h2>
      <p className="mx-auto mb-5 mt-2.5 max-w-[32em] text-[15px] text-fg-2">{t('marketing.ctaBody')}</p>
      <Link
        to={loggedIn ? "/{-$locale}/app/render" : "/{-$locale}/register"}
        search={loggedIn ? undefined : { next: '/app/render' }}
        onClick={() => trackMarketingCta({ ctaId: loggedIn ? 'page_end_render' : 'page_end_register', placement: 'page_end', locale, destination: loggedIn ? '/app/render' : '/register' })}
        className={buttonVariants({ size: 'lg' })}
      >
        {t('marketing.ctaButton')} <ArrowRight size={18} aria-hidden="true" />
      </Link>
      <span className="mt-3 inline-flex items-center rounded-full border border-border bg-card px-3.5 py-2 font-mono text-[11px] text-fg-2">{t('marketing.ctaBadge')}</span>
    </section>
  )
}
