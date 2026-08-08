import { Zap, Layers, GitBranch } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'

const FEATURES = [
  { Icon: Zap, title: 'marketing.feature1Title', body: 'marketing.feature1Body', metric: 'marketing.feature1Metric' },
  { Icon: Layers, title: 'marketing.feature2Title', body: 'marketing.feature2Body', metric: 'marketing.feature2Metric' },
  { Icon: GitBranch, title: 'marketing.feature3Title', body: 'marketing.feature3Body', metric: 'marketing.feature3Metric' },
] as const

export function Features() {
  const { t } = useTranslation()

  return (
    <section id="render-workflow" className="scroll-mt-16 border-t border-border px-5 py-12 md:px-7">
      <span className="kicker">{t('marketing.featuresKicker')}</span>
      <div className="mt-2.5">
        {FEATURES.map(({ Icon, title, body, metric }) => (
          <div key={title} className="feat-row">
            <span className="icon-tile">
              <Icon size={20} aria-hidden="true" />
            </span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="m-0 text-[17px] font-semibold">{t(title)}</h3>
                <span className="metric">{t(metric)}</span>
              </div>
              <p className="mb-0 mt-1.5 max-w-[52em] text-sm leading-relaxed text-fg-2">{t(body)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
