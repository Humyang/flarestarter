import { useTranslation } from '@/features/i18n/provider'

export function AgentSection() {
  const { t } = useTranslation()
  return (
    <section className="grid-bg border-t border-border px-5 py-14 md:px-7 md:py-20">
      <span className="kicker">{t('agent.kicker')}</span>
      <h2 className="m-0 mt-2.5 max-w-[20em] font-display text-[30px] font-semibold tracking-[-.8px]">
        {t('agent.title')}
      </h2>
      <p className="m-0 mt-3 max-w-[46em] text-[15px] leading-relaxed text-fg-2">{t('agent.body')}</p>
      <div className="mt-7 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
        {(['step1', 'step2', 'step3'] as const).map((step, index) => (
          <div key={step} className="bg-card px-5 py-5"><span className="font-mono text-[11px] text-primary">0{index + 1}</span><h3 className="m-0 mt-3 text-[15px] font-semibold">{t(`agent.${step}Title`)}</h3><p className="m-0 mt-1.5 text-[13px] leading-relaxed text-fg-2">{t(`agent.${step}Body`)}</p></div>
        ))}
      </div>
    </section>
  )
}
