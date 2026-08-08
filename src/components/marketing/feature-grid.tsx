import { ShieldCheck, CreditCard, LayoutDashboard, HardDrive, Mail, Languages, Search, Lock, Sparkles } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { Card } from '@/components/ui/card'

// Icon + structure here; titles/bodies live in the dictionary (translatable).
const ITEMS = [
  { Icon: ShieldCheck, title: 'features.f1Title', body: 'features.f1Body' },
  { Icon: CreditCard, title: 'features.f2Title', body: 'features.f2Body' },
  { Icon: LayoutDashboard, title: 'features.f3Title', body: 'features.f3Body' },
  { Icon: HardDrive, title: 'features.f4Title', body: 'features.f4Body' },
  { Icon: Mail, title: 'features.f5Title', body: 'features.f5Body' },
  { Icon: Languages, title: 'features.f6Title', body: 'features.f6Body' },
  { Icon: Search, title: 'features.f7Title', body: 'features.f7Body' },
  { Icon: Lock, title: 'features.f8Title', body: 'features.f8Body' },
] as const

export function FeatureGrid() {
  const { t } = useTranslation()
  return (
    <section id="pro" className="border-t border-border bg-bg-alt px-5 py-12 md:px-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><span className="kicker">{t('features.kicker')}</span><h2 className="m-0 mt-2.5 max-w-[24em] font-display text-[28px] font-semibold tracking-[-.6px]">{t('features.title')}</h2><p className="m-0 mt-2 max-w-[48em] text-[14px] leading-relaxed text-fg-2">{t('features.body')}</p></div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/35 bg-soft px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[.08em] text-primary"><Sparkles size={13} /> {t('features.badge')}</span>
      </div>
      <div className="mt-6 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ Icon, title, body }) => (
          <Card key={title} className="rounded-none border-0 p-5">
            <div className="flex items-center gap-2.5">
              <span className="icon-tile">
                <Icon size={20} aria-hidden="true" />
              </span>
              <h3 className="m-0 text-[17px] font-semibold">{t(title)}</h3>
            </div>
            <p className="mb-0 mt-2.5 text-[13.5px] leading-relaxed text-fg-2">{t(body)}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}
