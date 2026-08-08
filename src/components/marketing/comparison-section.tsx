import { ArrowRight, Film, Sparkles } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'

const IMAGE_SLOTS = [
  { key: 'source', src: '/comparison/original-video-placeholder.jpg', tone: 'comparison-media--source' },
  { key: 'rendered', src: '/comparison/rendered-clip-placeholder.jpg', tone: 'comparison-media--rendered' },
] as const

export function ComparisonSection() {
  const { t } = useTranslation()

  return (
    <section className="border-t border-border px-5 py-14 md:px-7 md:py-20" id="comparison">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="kicker">{t('comparison.kicker')}</span>
          <h2 className="m-0 mt-2.5 font-display text-[30px] font-semibold tracking-[-.8px]">{t('comparison.title')}</h2>
          <p className="m-0 mt-3 max-w-[44em] text-[15px] leading-relaxed text-fg-2">{t('comparison.body')}</p>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-fg-3"><Sparkles size={14} className="text-primary" /> {t('comparison.note')}</span>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
        {IMAGE_SLOTS.flatMap(({ key, src, tone }, index) => [
          <figure key={key} className="m-0 min-w-0">
            <div className={`comparison-media ${tone}`}>
              <div className="comparison-media__placeholder" aria-hidden="true">
                <Film size={25} />
                <span>{t(`comparison.${key}Placeholder`)}</span>
                <code>{src}</code>
              </div>
              <img src={src} alt={t(`comparison.${key}Alt`)} onError={(event) => { event.currentTarget.style.display = 'none' }} />
              <span className="comparison-media__label">0{index + 1} · {t(`comparison.${key}Label`)}</span>
            </div>
            <figcaption className="mt-3 text-sm leading-relaxed text-fg-2">{t(`comparison.${key}Caption`)}</figcaption>
          </figure>
          , ...(index === 0 ? [<span key="comparison-arrow" className="hidden items-center justify-center md:flex" aria-hidden="true"><ArrowRight size={22} className="text-primary" /></span>] : []),
        ])}
      </div>
    </section>
  )
}
