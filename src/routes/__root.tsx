import { createRootRoute, HeadContent, Outlet, Scripts, useParams, useRouterState } from '@tanstack/react-router'
import { isLocale, defaultLocale } from '@/features/i18n/locale'
import { getPreferences } from '@/server/preferences'
import { getOptionalUser } from '@/features/auth/middleware'
import { getAnalyticsToken } from '@/features/analytics/analytics'
import { AnalyticsTracker } from '@/features/analytics/components'
import { GA4_MEASUREMENT_ID } from '@/features/analytics/ga4'
import { Toaster } from '@/components/ui/sonner'
import { useResolvedTheme } from '@/features/theme/use-resolved-theme'
import appCss from '@/styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Smart Clip — MP4 subtitle rendering and translation' },
      { name: 'description', content: 'Upload an MP4, choose a subtitle style and language, track the render, and download the completed video.' },
      { property: 'og:title', content: 'Smart Clip' },
      { property: 'og:description', content: 'MP4 subtitle rendering and translation with a visible render queue.' },
      { property: 'og:type', content: 'website' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
      { rel: 'icon', type: 'image/png', href: '/logo192.png', sizes: '192x192' },
      { rel: 'apple-touch-icon', href: '/logo192.png' },
      { rel: 'manifest', href: '/manifest.json' },
    ],
  }),
  loader: async () => {
    // Never throw here: if the root loader errors, the error page replaces
    // RootComponent — i.e. the <html>/<head> shell and stylesheet — and every
    // page on the site renders as an unstyled fragment. All three values are
    // cosmetic/optional (theme cookie, header user, analytics token), so a
    // failure (e.g. a D1 blip in getOptionalUser) degrades to defaults instead.
    try {
      const { theme, themeFromCookie } = await getPreferences()
      const user = await getOptionalUser()
      const analyticsToken = await getAnalyticsToken()
      return { theme, themeFromCookie, user, analyticsToken }
    } catch {
      return { theme: 'dark' as const, themeFromCookie: false, user: null, analyticsToken: null }
    }
  },
  component: RootComponent,
})

/* Pre-paint theme resolution for cookie-less visitors: SSR defaults to dark
 * (brand), this flips to light when the OS prefers it — before first paint, so
 * there is no flash. It deliberately does NOT write a cookie: visitors keep
 * following their system until they click the toggle (which does write one). */
const THEME_BOOT_SCRIPT = `(function(){try{if(!/(?:^|;\\s*)theme=/.test(document.cookie)&&matchMedia('(prefers-color-scheme: light)').matches){document.documentElement.classList.replace('dark','light')}}catch(e){}})()`
// Set a query-safe page context before loading GA. Enhanced Measurement can
// emit automatic events independently of our wrapper, and otherwise those
// events inherit the raw browser URL (including auth tokens or contact data).
const GOOGLE_ANALYTICS_BOOT_SCRIPT = `(function(){window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};var safeUrl=window.location.origin+window.location.pathname;try{var current=new URL(window.location.href);var safe=new URL(current.origin+current.pathname);['utm_source','utm_medium','utm_campaign','utm_content'].forEach(function(key){var value=current.searchParams.get(key);if(!value)return;value=value.normalize('NFKC').toLowerCase().trim();var compact=value.replace(/[^0-9+]/g,'');if(value.indexOf('@')!==-1||(compact.length>=9&&/^[+]?[0-9]+$/.test(compact)))return;value=value.replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,64);if(value)safe.searchParams.set(key,value)});safeUrl=safe.toString()}catch(e){}var safeReferrer='';try{if(document.referrer){var referrer=new URL(document.referrer);safeReferrer=referrer.origin}}catch(e){}window.gtag('js',new Date());window.gtag('set','page_location',safeUrl);if(safeReferrer)window.gtag('set','page_referrer',safeReferrer);window.gtag('config','${GA4_MEASUREMENT_ID}',{send_page_view:false,page_location:safeUrl,page_referrer:safeReferrer})})()`

function RootComponent() {
  const { theme, analyticsToken } = Route.useLoaderData()
  const params = useParams({ strict: false }) as { locale?: string }
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  // Validate before use: on 404s the optional {-$locale} param swallows the
  // first path segment, so `/no-such-page` would otherwise become lang="no-such-page".
  // /docs 在 locale 组外且内容目前只有中文——lang 跟内容走，别向搜索引擎/读屏标错语言
  // （docs 翻译成英文时同步改这里）。
  const lang = isLocale(params.locale) ? params.locale : pathname.startsWith('/docs') ? 'zh' : defaultLocale
  const resolvedTheme = useResolvedTheme(theme)
  return (
    <html lang={lang} className={theme} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <HeadContent />
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`} />
        <script dangerouslySetInnerHTML={{ __html: GOOGLE_ANALYTICS_BOOT_SCRIPT }} />
      </head>
      <body>
        <Outlet />
        <AnalyticsTracker />
        <Scripts />
        <Toaster theme={resolvedTheme} />
        {/* Cloudflare Web Analytics — only when a beacon token is configured. */}
        {analyticsToken && (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: analyticsToken })}
          />
        )}
      </body>
    </html>
  )
}
