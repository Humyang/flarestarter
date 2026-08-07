import { Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowUpRight } from 'lucide-react'
import { useTranslation } from '@/features/i18n/provider'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import { Badge } from '@/components/ui/badge'

/** Shared shell for the placeholder legal pages (/terms, /privacy). */
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
  const isPrivacy = kind === 'privacy'
  const reviewItems = locale === 'zh'
    ? isPrivacy
      ? ['收集的数据与用途', 'R2 媒体、AI Provider 与跨境处理', '保留期限、删除流程与联系信息']
      : ['免费版限制与任务失败处理', '内容版权、可接受使用与账号封禁', '服务中断、数据删除与责任边界']
    : isPrivacy
      ? ['Data collected and how it is used', 'R2 media, AI providers, and cross-border processing', 'Retention, deletion, and contact information']
      : ['Free-plan limits and failed-task handling', 'Content rights, acceptable use, and account bans', 'Outages, deletion, and liability boundaries']
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <main className="mx-auto max-w-[760px] px-5 py-14 md:px-7 md:py-20">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="warn" dot>{locale === 'zh' ? '未发布 · 待确认' : 'Not published · pending review'}</Badge>
          <span className="font-mono text-xs text-fg-3">{locale === 'zh' ? '生效日期：待定' : 'Effective date: pending'}</span>
        </div>
        <h1 className="page-h mt-5">{title}</h1>
        <div className="mt-5 flex gap-3 border border-primary/30 bg-soft/30 px-4 py-4 text-sm leading-relaxed text-fg-2">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <p className="m-0">{t('legal.placeholder')}</p>
        </div>
        <section className="mt-10 border-t border-border pt-7">
          <h2 className="font-display text-xl font-semibold">{locale === 'zh' ? '发布前确认范围' : 'Launch review scope'}</h2>
          <p className="mt-2 text-sm leading-relaxed text-fg-2">
            {locale === 'zh'
              ? '以下项目必须由业务与法律负责人确认后，才能移除占位标记并公开注册。'
              : 'The following items must be confirmed by the business and legal owners before this placeholder can be published and public registration enabled.'}
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {reviewItems.map((item) => <li key={item} className="border-l-2 border-primary pl-3 text-sm leading-relaxed text-fg-2">{item}</li>)}
          </ul>
        </section>
        <div className="mt-10 flex flex-wrap gap-4 border-t border-border pt-6 text-sm font-semibold">
          <Link to="/{-$locale}/status" className="inline-flex items-center gap-1 text-primary">{locale === 'zh' ? '查看服务状态' : 'View service status'} <ArrowUpRight size={15} /></Link>
          <Link to="/{-$locale}" className="inline-flex items-center gap-1 text-primary">← {t('common.appName')}</Link>
        </div>
      </main>
      <Footer theme={theme} />
    </div>
  )
}
