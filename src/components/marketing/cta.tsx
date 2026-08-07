import { ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/provider'

export function CTA({ loggedIn }: { loggedIn: boolean }) {
  const { t } = useTranslation()

  return (
    <section className="grid-bg border-t border-border px-5 py-16 text-center md:px-7 md:py-24">
      <h2 className="font-display text-[28px] font-semibold tracking-[-0.6px]">{t('marketing.ctaTitle')}</h2>
      <p className="mx-auto mb-5 mt-2.5 max-w-[32em] text-[15px] text-fg-2">{t('marketing.ctaBody')}</p>
      <Link to={loggedIn ? "/{-$locale}/app" : "/{-$locale}/register"} className="inline-flex h-12 items-center gap-2 rounded-md bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover">{t('marketing.ctaButton')} <ArrowRight size={17} /></Link>
    </section>
  )
}
