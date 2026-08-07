import { useTranslation } from '@/features/i18n/provider'

const SIGNALS = ['Long video → short clips', 'Auto captions', '9:16 ready', 'Human review'] as const

export function TechStrip() {
  const { t } = useTranslation()
  return (
    <section className="border-t border-border px-5 md:px-7 py-4">
      <p className="m-0 text-center font-mono text-[12.5px] text-fg-3">
        <span className="text-primary">{t('marketing.builtOn')}</span> {SIGNALS.join(' · ')}
      </p>
    </section>
  )
}
