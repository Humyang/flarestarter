import { Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowUpRight } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { LEGAL_DRAFTS } from '@/features/legal/drafts'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import { Badge } from '@/components/ui/badge'

/** Shared shell for the bilingual legal review drafts (/terms, /privacy). */
export function LegalPage({
  theme,
  loggedIn,
  title,
  kind,
}: {
  theme: 'light' | 'dark'
  loggedIn: boolean
  title: string
  kind: 'privacy' | 'terms'
}) {
  const { t, locale } = useTranslation()
  const draft = LEGAL_DRAFTS[locale][kind]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <main className="mx-auto max-w-[860px] px-5 py-14 md:px-7 md:py-20">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="warn" dot>{draft.statusLabel}</Badge>
          <span className="font-mono text-xs text-fg-3">{draft.effectiveDateLabel}</span>
        </div>
        <h1 className="page-h mt-5">{title}</h1>
        <div className="mt-5 flex gap-3 border border-primary/30 bg-soft/30 px-4 py-4 text-sm leading-relaxed text-fg-2">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <p className="m-0">{draft.notice}</p>
        </div>
        <p className="mt-8 text-base leading-8 text-fg-2">{draft.intro}</p>

        <article className="mt-10 space-y-10 border-t border-border pt-8">
          {draft.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-xl font-semibold">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-[15px] leading-7 text-fg-2">{paragraph}</p>
              ))}
              {section.bullets && (
                <ul className="mt-4 space-y-3 pl-5 text-[15px] leading-7 text-fg-2">
                  {section.bullets.map((item) => <li key={item} className="list-disc pl-1">{item}</li>)}
                </ul>
              )}
            </section>
          ))}
        </article>

        <section className="mt-12 border-t border-border pt-8">
          <h2 className="font-display text-xl font-semibold">{locale === 'zh' ? '发布前确认范围' : 'Launch review scope'}</h2>
          <p className="mt-2 text-sm leading-relaxed text-fg-2">
            {locale === 'zh'
              ? '以下项目必须由业务负责人和合格律师确认后，才能移除审核标记、填写生效日期并用于公开注册。'
              : 'The following items must be confirmed by the business owner and qualified counsel before the review label is removed, an effective date is added, and the text is used for public registration.'}
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {draft.reviewItems.map((item) => <li key={item} className="border-l-2 border-primary pl-3 text-sm leading-relaxed text-fg-2">{item}</li>)}
          </ul>
        </section>
        <div className="mt-10 flex flex-wrap gap-4 border-t border-border pt-6 text-sm font-semibold">
          <Link to="/{-$locale}/status" className="inline-flex items-center gap-1 text-primary">{locale === 'zh' ? '查看服务状态' : 'View service status'} <ArrowUpRight size={15} /></Link>
          <Link to="/{-$locale}" className="inline-flex items-center gap-1 text-primary">← {t('common.appName')}</Link>
        </div>
      </main>
      <Footer theme={theme} loggedIn={loggedIn} />
    </div>
  )
}
