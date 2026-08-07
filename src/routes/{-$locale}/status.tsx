import { createFileRoute, getRouteApi, Link } from '@tanstack/react-router'
import { ArrowUpRight, CheckCircle2, CircleDot, Mail, MessageSquare, Wrench } from 'lucide-react'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import type { Locale } from '@/features/i18n/locale'
import { useTranslation } from '@/features/i18n/provider'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const rootRoute = getRouteApi('__root__')

export const Route = createFileRoute('/{-$locale}/status')({
  loader: async () => ({ origin: await getOrigin() }),
  head: ({ loaderData, params }) => {
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const { meta, links } = localeHead({
      origin: loaderData?.origin ?? '',
      locale,
      path: '/status',
      title: locale === 'zh' ? '服务状态 | Smart Clip' : 'Service status | Smart Clip',
      description:
        locale === 'zh'
          ? '查看 Smart Clip 公开服务状态、维护窗口和故障公告。'
          : 'Check Smart Clip service health, maintenance windows, and incident updates.',
    })
    return { meta, links }
  },
  component: StatusPage,
})

function StatusPage() {
  const { theme, user } = rootRoute.useLoaderData()
  const { t } = useTranslation()
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL as string | undefined

  const services = [
    { key: 'web', label: t('status.services.web'), detail: t('status.services.webDetail') },
    { key: 'render', label: t('status.services.render'), detail: t('status.services.renderDetail') },
    { key: 'storage', label: t('status.services.storage'), detail: t('status.services.storageDetail') },
  ]

  const incidents = [
    { date: t('status.incidents.date1'), title: t('status.incidents.title1'), detail: t('status.incidents.detail1') },
    { date: t('status.incidents.date2'), title: t('status.incidents.title2'), detail: t('status.incidents.detail2') },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={!!user} />
      <main>
        <section className="grid-bg border-b border-border px-5 py-16 md:px-7 md:py-24">
          <div className="mx-auto max-w-[1100px]">
            <div className="max-w-[740px]">
              <span className="kicker">// {t('status.kicker')}</span>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Badge variant="ok" dot>{t('status.operational')}</Badge>
                <span className="font-mono text-xs text-fg-3">{t('status.updated')}</span>
              </div>
              <h1 className="mt-5 max-w-[720px] font-display text-[42px] font-semibold leading-[1.05] tracking-[-1.8px] sm:text-[58px]">
                {t('status.titlePre')} <span className="text-primary">{t('status.titleHighlight')}</span>
              </h1>
              <p className="mt-5 max-w-[620px] text-base leading-relaxed text-fg-2 md:text-[17px]">{t('status.subtitle')}</p>
            </div>
            <div className="mt-12 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
              {services.map((service) => (
                <div key={service.key} className="bg-card px-5 py-5 md:px-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{service.label}</span>
                    <CheckCircle2 size={18} className="text-success" aria-hidden="true" />
                  </div>
                  <p className="mb-0 mt-2 text-sm leading-relaxed text-fg-3">{service.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1100px] gap-10 px-5 py-14 md:grid-cols-[1.1fr_.9fr] md:px-7 md:py-20">
          <div>
            <div className="mb-5 flex items-center gap-2">
              <CircleDot size={17} className="text-primary" aria-hidden="true" />
              <h2 className="m-0 font-display text-xl font-semibold">{t('status.incidentTitle')}</h2>
            </div>
            <div className="border-t border-border">
              {incidents.map((incident) => (
                <article key={incident.date} className="grid gap-2 border-b border-border py-5 sm:grid-cols-[130px_1fr] sm:gap-5">
                  <time className="font-mono text-xs text-fg-3">{incident.date}</time>
                  <div>
                    <h3 className="m-0 text-[15px] font-semibold">{incident.title}</h3>
                    <p className="mb-0 mt-1.5 text-sm leading-relaxed text-fg-2">{incident.detail}</p>
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-5 text-xs leading-relaxed text-fg-3">{t('status.incidentNote')}</p>
          </div>

          <Card className="h-fit border-primary/30 bg-soft/35 p-5 md:p-6">
            <div className="flex items-center gap-2 text-primary">
              <Wrench size={17} aria-hidden="true" />
              <span className="font-mono text-xs uppercase tracking-wide">{t('status.maintenanceKicker')}</span>
            </div>
            <h2 className="mt-4 font-display text-2xl font-semibold tracking-[-.5px]">{t('status.maintenanceTitle')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-2">{t('status.maintenanceBody')}</p>
            <div className="mt-5 border-t border-primary/20 pt-4">
              <div className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 size={16} className="text-success" />{t('status.nextWindow')}</div>
              <div className="mt-1 font-mono text-xs text-fg-3">{t('status.noScheduled')}</div>
            </div>
          </Card>
        </section>

        <section className="border-y border-border bg-bg-alt px-5 py-12 md:px-7 md:py-16">
          <div className="mx-auto grid max-w-[1100px] gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex items-center gap-2"><MessageSquare size={17} className="text-primary" aria-hidden="true" /><h2 className="m-0 font-display text-xl font-semibold">{t('status.helpTitle')}</h2></div>
              <p className="mb-0 mt-2 max-w-[620px] text-sm leading-relaxed text-fg-2">{t('status.helpBody')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/{-$locale}/app/feedback" className={buttonVariants({ size: 'sm' })}><MessageSquare size={15} /> {t('status.feedback')}</Link>
              {supportEmail ? (
                <a href={`mailto:${supportEmail}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}><Mail size={15} /> {t('status.email')}</a>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-fg-3" title={t('status.emailPending')}><Mail size={15} /> {t('status.emailPending')}</span>
              )}
              <Link to="/{-$locale}" hash="features" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>{t('status.backHome')} <ArrowUpRight size={15} /></Link>
            </div>
          </div>
        </section>
      </main>
      <Footer theme={theme} />
    </div>
  )
}
