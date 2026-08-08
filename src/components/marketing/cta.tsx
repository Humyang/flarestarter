import { useTranslation } from '@/features/i18n/provider'

export function CTA() {
  const { t } = useTranslation()

  return (
    <section className="grid-bg border-t border-border px-5 py-14 text-center md:px-7 md:py-20">
      <h2 className="font-display text-[28px] font-semibold tracking-[-0.6px]">{t('marketing.ctaTitle')}</h2>
      <p className="mx-auto mb-5 mt-2.5 max-w-[32em] text-[15px] text-fg-2">{t('marketing.ctaBody')}</p>
      <span className="inline-flex items-center rounded-full border border-border bg-card px-3.5 py-2 font-mono text-[11px] text-fg-2">{t('marketing.ctaBadge')}</span>
    </section>
  )
}
