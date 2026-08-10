import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser, getTurnstileSiteKey } from '@/features/auth/middleware'
import { PricingTable } from '@/features/billing/components/pricing-table'
import { SiteNav } from '@/components/marketing/site-nav'
import { Footer } from '@/components/marketing/footer'
import type { Locale } from '@/features/i18n/locale'

const rootRoute = getRouteApi('__root__')

export const Route = createFileRoute('/{-$locale}/pricing')({
  loader: async () => {
    const [origin, user, turnstileSiteKey] = await Promise.all([
      getOrigin(),
      getOptionalUser(),
      getTurnstileSiteKey(),
    ])
    return { origin, loggedIn: !!user, turnstileSiteKey }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const { meta, links } = localeHead({
      origin,
      locale,
      path: '/pricing',
      title: locale === 'zh' ? '版本 — Smart Clip' : 'Plans — Smart Clip',
      description:
        locale === 'zh'
          ? 'Smart Clip 免费版正在受控开放。Pro 仍在规划，功能与价格尚未公布。'
          : 'Smart Clip is in controlled free beta. Pro is still planned; its features and pricing have not been published.',
    })
    return { meta, links }
  },
  component: Pricing,
})

function Pricing() {
  const { loggedIn, turnstileSiteKey } = Route.useLoaderData()
  const { theme } = rootRoute.useLoaderData()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <PricingTable turnstileSiteKey={turnstileSiteKey} loggedIn={loggedIn} />
      <Footer theme={theme} loggedIn={loggedIn} />
    </div>
  )
}
