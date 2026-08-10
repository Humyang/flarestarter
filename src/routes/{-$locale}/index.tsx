import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { buildHomepageJsonLd, localeHead } from '@/features/seo/seo'
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
      title: locale === 'zh' ? 'MP4 字幕渲染与翻译 — Smart Clip' : 'MP4 Subtitle Rendering and Translation — Smart Clip',
      description:
        locale === 'zh'
          ? '上传 MP4，选择字幕样式和语言，跟踪渲染状态并下载 Smart Clip 成片。'
          : 'Upload an MP4, choose a subtitle style and language, track the render, and download the finished Smart Clip video.',
    })
    return {
      meta,
      links,
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(buildHomepageJsonLd({ origin, locale })),
        },
      ],
    }
  },
  component: Home,
})

function Home() {
  const { theme, user } = rootRoute.useLoaderData()
  const loggedIn = !!user
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <Hero loggedIn={loggedIn} />
      <TechStrip />
      <ComparisonSection loggedIn={loggedIn} />
      <Features />
      <FeatureGrid />
      <AgentSection />
      <CTA loggedIn={loggedIn} />
      <Footer theme={theme} loggedIn={loggedIn} />
    </div>
  )
}
