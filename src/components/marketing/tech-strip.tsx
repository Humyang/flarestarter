import { useTranslation } from '@/features/i18n/provider'

const SIGNALS = ['MP4 upload', 'Subtitle styles', 'Translation', 'Render queue'] as const

export function TechStrip() {
  const { t } = useTranslation()
  return (
    <section className="border-t border-border px-5 md:px-7 py-4">
      <p className="m-0 text-center font-mono text-[12.5px] text-fg-3">
        <span className="text-primary">{t('marketing.builtOn')}</span> {SIGNALS.map((signal, index) => <span key={signal}>{index > 0 ? ' · ' : ''}{t(`marketing.signal${index + 1}`)}</span>)}
      </p>
    </section>
  )
}
