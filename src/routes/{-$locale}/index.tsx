import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import type { Locale } from '@/features/i18n/locale'
import { SiteNav } from '@/components/marketing/site-nav'
import { Hero } from '@/components/marketing/hero'
import { TechStrip } from '@/components/marketing/tech-strip'
import { ComparisonSection } from '@/components/marketing/comparison-section'
import { Features } from '@/components/marketing/features'
import { FeatureGrid } from '@/components/marketing/feature-grid'
import { AgentSection } from '@/components/marketing/agent-section'
import { CTA } from '@/components/marketing/cta'
import { Footer } from '@/components/marketing/footer'

const rootRoute = getRouteApi('__root__')

export const Route = createFileRoute('/{-$locale}/')({
  loader: async () => ({ origin: await getOrigin() }),
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const { meta, links } = localeHead({
      origin,
      locale,
      path: '/',
      title: 'Smart Clip',
      description:
        locale === 'zh'
          ? 'Smart Clip——把长视频变成值得发布的短视频片段，AI 处理重复工作，最终判断留给你。'
          : 'Smart Clip — turn long videos into ready-to-review short clips with a human finish.',
    })
    return { meta, links }
  },
  component: Home,
})

function Home() {
  const { theme, user } = rootRoute.useLoaderData()
  const loggedIn = !!user
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <Hero />
      <TechStrip />
      <ComparisonSection />
      <Features />
      <FeatureGrid />
      <AgentSection />
      <CTA />
      <Footer theme={theme} />
    </div>
  )
}
